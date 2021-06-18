import { fs, tauri } from "@tauri-apps/api";
import { head } from "lodash";
import { writable } from "svelte/store";
import { assert } from "ts-essentials";

import type { AppEvent, ApplicationState, FileEntry } from "./core-types";
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

          void readWorkingDirectory(path).then(({ files: newFiles }) => {
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
              return {
                ...s,
                status: "idle", // "reading-configs-contents",
                events: [
                  ...s.events,
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
                ],
              };
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

      // read new file contents

      // compare old files and new

      // push "file-changed" events
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
  };
})();

export const CONFIG_FILE_REGEX = /appsettings.json/i;

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

interface ConfigFile extends FileEntry {
  /**
   * appsettings.json
   */
  name: string;
}

function isConfigFile(file: FileEntry): file is ConfigFile {
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

export async function readAppState(): Promise<ApplicationState> {
  return (await invokeCommand("read_app_state")) as ApplicationState;
}

export async function writeAppState(state: ApplicationState) {
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
  f: (accumulator: TAccum, value: FileEntry) => TAccum
) {
  let acc: TAccum = initialAcc;

  for (const file of files) {
    acc = f(acc, file);
    const { children } = file;
    if (children && children.length) {
      acc = reduceFileTree(children, acc, f);
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

export async function readConfigFiles(
  state: ApplicationState
): Promise<ApplicationState> {
  assert(
    state.workingDirectory,
    "workDir must be set when reading config files"
  );

  const { files, path: workDirPath } = state.workingDirectory;

  // TODO
  await Promise.all(
    files.map(async (file) => {
      const absolutePath = workDirPath + file.path;

      return await fs.readTextFile(absolutePath);
    })
  );

  return {
    ...state,
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
