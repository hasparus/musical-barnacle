import { fs } from "@tauri-apps/api";
import { debounce } from "lodash";
import { writable } from "svelte/store";
import { assert } from "ts-essentials";

import type { ApplicationState, FileEntry } from "./core-types";
import { isDefined } from "./well-known-utils";

export const appStore = (() => {
  const { subscribe, update } = writable<ApplicationState>({
    configFileContents: {},
    notifications: [],
  });

  return {
    subscribe,
    setWorkingDir: ({ files, path }: WorkingDirectory) => {
      update((s) => {
        s.workingDirectory = {
          path: normalizePath(path),
          files,
        };

        return s;
      });
    },
  };
})();

export const CONFIG_FILE_REGEX = /appsettings.json/i;

function preprocessFiles(entries: FileEntry[]): FileEntry[] {
  return entries
    .map((entry) => {
      if (entry.children) {
        return {
          ...entry,
          path: normalizePath(entry.path),
          children: preprocessFiles(entry.children),
        };
      }

      // ignore redundant files
      return entry.name?.match(CONFIG_FILE_REGEX)
        ? {
            ...entry,
            path: normalizePath(entry.path),
          }
        : null;
    })
    .filter(isDefined);
}

type WorkingDirectory = NonNullable<ApplicationState["workingDirectory"]>;

export const readWorkingDirectory = debounce(
  (dir: string) => {
    return fs
      .readDir(dir, { recursive: true })
      .then((entries): WorkingDirectory => {
        return {
          path: dir,
          files: preprocessFiles(entries),
        };
      });
  },
  300,
  { leading: true }
);

export function normalizePath(path: string) {
  return path.replace(/\\/g, "/");
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

export function saveConfigFile() {}
