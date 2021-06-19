import { fs, tauri } from "@tauri-apps/api";
import json5 from "json5";
import { isEqual, isEqualWith } from "lodash";
import { writable } from "svelte/store";
import { assert } from "ts-essentials";

import type {
  AppEvent,
  ApplicationState,
  ConfigFile,
  FileEntry,
} from "./core-types";
import { isDefined } from "./well-known-utils";

export const appStore = (() => {
  const { subscribe, update, set } = writable<ApplicationState>({
    status: "initialising",
    configFileContents: {},
    events: [],
    uiState: {
      settingsOpen: true,
    },
  });

  if (import.meta.env.DEV) {
    subscribe((state) => {
      Object.assign(window, { __state: state });
    });
  }

  const pushError = <T extends Pick<ApplicationState, "events">>(
    s: T,
    message: string,
    ...meta: unknown[]
  ) => {
    console.error(message, ...meta);
    s.events.push({
      type: "error",
      date: new Date(),
      message: `${message}. ${meta.map((x) => JSON.stringify(x)).join("\n")}`,
    });
    return s;
  };

  return {
    set,
    subscribe,
    init: async () => {
      try {
        const appState = await readAppState();

        appState.status = "gathering-missing-files";
        set(appState);

        // gather added files and missing files
        if (appState.workingDirectory) {
          const { files: oldFiles, path } = appState.workingDirectory;

          void readWorkingDirectory(path)
            .then(({ files: newFiles }) => {
              const getConfigFilePath = (f: FileEntry) =>
                isConfigFile(f) ? f.path : null;

              const oldPaths = mapFileTreeToArray(
                oldFiles,
                getConfigFilePath
              ).filter(isDefined);
              const newPaths = mapFileTreeToArray(
                newFiles,
                getConfigFilePath
              ).filter(isDefined);

              const oldPathsSet = new Set(oldPaths);
              const newPathsSet = new Set(newPaths);

              const missingPaths = oldPaths.filter((p) => !newPathsSet.has(p));
              const addedPaths = newPaths.filter((p) => !oldPathsSet.has(p));

              const date = new Date();
              update((s) => {
                const newEvents = [
                  ...missingPaths.map(
                    (path): AppEvent => ({
                      type: "file-missing",
                      date,
                      path,
                    })
                  ),
                  ...addedPaths.map(
                    (path): AppEvent => ({
                      type: "new-file-added",
                      date,
                      path,
                    })
                  ),
                ];

                return {
                  ...s,
                  status: "reading-configs-contents",
                  events: [
                    ...s.events.filter(
                      (e) => !newEvents.some((ne) => isEqualBesidesDate(e, ne))
                    ),
                    ...newEvents,
                  ],
                };
              });
            })
            .then(() => {
              update((s) => {
                void readConfigFiles(s)
                  .then(({ errorEvents, fileContents }) => {
                    update((s) => {
                      const oldFileContents = s.configFileContents;

                      const date = new Date();
                      const conflicts = Object.keys(oldFileContents)
                        .map(
                          (
                            path
                          ): AppEvent.OfType<"file-content-conflict"> | null => {
                            const oldContent = oldFileContents[path];
                            const newContent = fileContents[path];

                            if (
                              isEqual(oldContent, newContent) ||
                              !(oldContent && newContent)
                            ) {
                              return null;
                            }

                            return {
                              type: "file-content-conflict",
                              path,
                              date,
                              oldContent,
                              newContent,
                            };
                          }
                        )
                        .filter(isDefined);

                      const newState: ApplicationState = {
                        ...s,
                        status: "idle",
                        events: [
                          ...s.events.filter((e) => {
                            return (
                              e.type !== "file-content-conflict" ||
                              !conflicts.find((c) =>
                                // if the conflict is exactly the same, we can skip the old one
                                isEqualBesidesDate(e, c)
                              )
                            );
                          }),
                          ...errorEvents,
                          ...conflicts,
                        ],
                        configFileContents: {
                          ...fileContents,
                          ...oldFileContents,
                        },
                      };

                      void writeAppState(newState);
                      return newState;
                    });
                  })
                  .catch((err) => {
                    update((s) =>
                      pushError(s, "Failed to read config files", err)
                    );
                  });

                return s;
              });
            });
        }
      } catch (err: unknown) {
        update((s) => pushError(s, "Failed to read app state from file", err));
      }
    },
    setWorkingDir: ({ files, path }: WorkingDirectory) => {
      if (!path.trim()) {
        return;
      }

      update((s) => {
        s.workingDirectory = {
          path: normalizePath(path),
          files,
        };

        void writeAppState(s);

        return s;
      });
    },
    addFileFromPath: (path: string) => {
      update((s) => {
        const { workingDirectory } = s;

        assert(
          workingDirectory,
          "cannot call addFile() when working directory is not present"
        );
        workingDirectory.files = mergeFileEntries(workingDirectory.files, [
          fileEntryFromPath(path),
        ]);

        s.events = s.events.filter(
          (x) => !(x.type === "new-file-added" && x.path === path)
        );

        void writeAppState(s);
        return s;
      });
    },
    resolveConflict: (
      conflict: AppEvent.OfType<"file-content-conflict">,
      version: "oldContent" | "newContent"
    ) => {
      update((s) => {
        s.events.splice(s.events.indexOf(conflict));

        const { path, [version]: selectedContent } = conflict;

        s.configFileContents[path] = selectedContent;

        void writeConfigFile(s.workingDirectory!.path + path, selectedContent)
          .then(() => {
            void writeAppState(s);
          })
          .catch((err) => {
            update((s) =>
              pushError(s, "failed to write config file", err, {
                path,
                selectedContent,
              })
            );
          });

        return s;
      });
    },
    ignoreEvent: (event: AppEvent) => {
      update((s) => {
        const index = s.events.indexOf(event);
        s.events.splice(index);

        void writeAppState(s);
        return s;
      });
    },
    forgetFile: (event: AppEvent.OfType<"file-missing">) => {
      const { path } = event;
      update((s) => {
        const index = s.events.indexOf(event);
        s.events.splice(index);

        reduceFileTree<boolean>(
          s.workingDirectory!.files,
          false,
          (removed, file, ancestors) => {
            if (!removed && file.path === path) {
              let current = file;
              for (const ancestor of ancestors) {
                assert(ancestor.children, "ancestor must be a directory");
                ancestor.children.splice(ancestor.children.indexOf(current));

                console.log("ancestor>>", ancestor);

                if (ancestor.children.length > 0) {
                  break;
                }

                current = ancestor;
              }

              return true;
            }

            return false;
          },
          [{ children: s.workingDirectory!.files, path: "/" }]
        );

        void writeAppState(s);
        return s;
      });
    },
    retrieveFile: (event: AppEvent.OfType<"file-missing">) => {
      update((s) => {
        const content = s.configFileContents[event.path];

        if (!content) {
          pushError(s, "failed to retrieve file", event.path);
        } else {
          void writeConfigFile(s.workingDirectory!.path + event.path, content)
            .then(() => {
              appStore.ignoreEvent(event);
            })
            .catch((err: unknown) => {
              console.error("failed to write retrieved file", event.path, {
                err,
              });
              update((s) =>
                pushError(s, "failed to write retrieved file", event.path, {
                  err,
                })
              );
            });
        }

        return s;
      });
    },
    saveConfigFile: (relativePath: string, value: ConfigFile) => {
      console.info("saving config file", { relativePath, value });
      update((s) => {
        s.configFileContents[relativePath] = value;

        const absolutePath = s.workingDirectory!.path + relativePath;
        void writeConfigFile(absolutePath, value)
          .then(() => {
            console.info("written config file", { relativePath, value });
          })
          .catch((err) => {
            console.error("Failed to save config file", err);
            update((s) => pushError(s, "Failed to save config file", err));
          });

        return s;
      });
    },
  };
})();

export const CONFIG_FILE_REGEX = /appsettings.json/i;

function isEqualBesidesDate(left: unknown, right: unknown): boolean {
  return isEqualWith(left, right, (_v, _o, key) =>
    key === "date" ? undefined : true
  );
}

function preprocessFiles(entries: FileEntry[], rootPath: string): FileEntry[] {
  return entries
    .map((entry) => {
      if (entry.children) {
        if (entry.children.length === 0) {
          return null;
        }

        return {
          ...entry,
          path: normalizePath(entry.path).replace(rootPath, ""),
          children: preprocessFiles(entry.children, rootPath),
        };
      }

      // ignore redundant files
      return entry.name?.match(CONFIG_FILE_REGEX)
        ? {
            ...entry,
            path: normalizePath(entry.path).replace(rootPath, ""),
          }
        : null;
    })
    .filter(isDefined);
}

type WorkingDirectory = NonNullable<ApplicationState["workingDirectory"]>;

export function readWorkingDirectory(dir: string) {
  return fs
    .readDir(dir, { recursive: true })
    .then((entries): WorkingDirectory => {
      return {
        path: dir,
        files: preprocessFiles(entries, dir),
      };
    });
}

export function normalizePath(path: string) {
  return path.replace(/\\/g, "/");
}

interface ConfigFileEntry extends FileEntry {
  /**
   * appsettings.json
   */
  name: string;
}

function isConfigFile(file: FileEntry): file is ConfigFileEntry {
  return !!file.name?.match(CONFIG_FILE_REGEX);
}

/**
 * If there's only one config file in the directory, return its file entry.
 */
export function findLoneLeafConfigFile(files: FileEntry[]): FileEntry | null {
  if (files.length === 1) {
    const head = files[0];
    if (head) {
      if (head.children) {
        return findLoneLeafConfigFile(head.children);
      }
      if (head.name?.match(CONFIG_FILE_REGEX)) {
        return head;
      }
    }
  }

  return null;
}

async function invokeCommand(
  ...args: Parameters<typeof tauri.invoke>
): Promise<unknown> {
  try {
    return await tauri.invoke(...args);
  } catch (errorMessage: unknown) {
    throw new Error(`Command Invocation Failed: ${errorMessage as string}`);
  }
}

async function readAppState(): Promise<ApplicationState> {
  return (await invokeCommand("read_app_state")) as ApplicationState;
}

async function writeAppState(state: ApplicationState) {
  delete state.status;

  const res = await invokeCommand("write_app_state", { state });

  if (res !== "file written") {
    throw new Error(
      `Command Invocation Failed: Unexpected result from [write_app_state] invocation. | ${JSON.stringify(
        res
      )}`
    );
  }
}

function reduceFileTree<TAccum>(
  files: FileEntry[],
  initialAcc: TAccum,
  f: (accumulator: TAccum, value: FileEntry, ancestors: FileEntry[]) => TAccum,
  ancestors: FileEntry[] = []
) {
  let acc: TAccum = initialAcc;

  for (const file of files) {
    acc = f(acc, file, ancestors);
    const { children } = file;
    if (children && children.length) {
      acc = reduceFileTree(children, acc, f, [file, ...ancestors]);
    }
  }

  return acc;
}

function mapFileTreeToArray<T>(
  files: FileEntry[],
  f: (file: FileEntry) => T
): T[] {
  return reduceFileTree<T[]>(files, [], (acc, val) => {
    acc.push(f(val));
    return acc;
  });
}

function getConfigFilesFromTree(files: FileEntry[]) {
  return mapFileTreeToArray(files, (f) => {
    if (isConfigFile(f)) {
      return f;
    }
  }).filter(isDefined);
}

export async function readConfigFiles(state: ApplicationState): Promise<{
  fileContents: ApplicationState["configFileContents"];
  errorEvents: AppEvent[];
}> {
  assert(
    state.workingDirectory,
    "workDir must be set when reading config files"
  );

  const { files, path: workDirPath } = state.workingDirectory;

  const configFiles = getConfigFilesFromTree(files);

  const results = await Promise.allSettled(
    configFiles.map(async (file) => {
      const absolutePath = workDirPath + file.path;

      console.info("reading file", { absolutePath });

      let text: string;
      try {
        text = await fs.readTextFile(absolutePath);
      } catch (err) {
        if (typeof err === "string" && err.includes("The system cannot find")) {
          console.info("file not found", file.path);
          return null;
        }

        throw new Error(`Failed to read ${file.path}: ${err}`);
      }

      const parsed = json5.parse<ConfigFile>(text);

      console.info("file read", parsed);

      return { path: file.path, parsed };
    })
  );

  const date = new Date();
  const errorEvents: AppEvent[] = [];
  const fileContents: ApplicationState["configFileContents"] = {};

  for (const result of results) {
    switch (result.status) {
      case "fulfilled":
        if (!result.value) {
          continue;
        }
        const { parsed, path } = result.value;
        fileContents[path] = parsed;
        break;

      case "rejected":
        errorEvents.push({
          type: "error",
          date,
          message:
            result.reason instanceof Error
              ? result.reason.message
              : JSON.stringify(result.reason),
        });
        break;
    }
  }

  return {
    errorEvents,
    fileContents,
  };
}

/**
 * Generates a tree (a line) of FileEntries from `path` relative to `rootPath`.
 */
function fileEntryFromPath(path: string): FileEntry {
  assert(
    path.endsWith(".json"),
    "we assume fileEntryFromPath is only called on configuration files"
  );

  const segments = path.split("/");
  let name = segments.pop();

  let current: FileEntry = {
    name,
    path,
  };

  while (name) {
    name = segments.pop();
    if (name) {
      current = {
        path: `${segments.join("/")}/${name}`,
        name,
        children: [current],
      };
    }
  }

  return current;
}

function mergeFileEntries(xs: FileEntry[], ys: FileEntry[]) {
  const res = [...xs];
  const xsPaths = reduceFileTree<Set<string>>(res, new Set(), (set, { path }) =>
    set.add(path)
  );

  for (const entry of ys) {
    const { path, children, name } = entry;
    if (xsPaths.has(path)) {
      if (children && children.length) {
        const index = res.findIndex((x) => x.path === path);
        res[index] = {
          name,
          path,
          children: mergeFileEntries(children, res[index]?.children || []),
        };
      }
    } else {
      res.push(entry);
    }
  }

  return res;
}

async function writeConfigFile(absolutePath: string, content: ConfigFile) {
  const serialized = JSON.stringify(content, null, 2);

  const dirname = absolutePath.slice(0, absolutePath.lastIndexOf("/"));
  try {
    await fs.createDir(dirname, { recursive: true });
  } catch (err) {
    console.error("Failed to create directory", { dirname }, err);
  }

  await fs.writeFile({
    path: absolutePath,
    contents: serialized,
  });
}
