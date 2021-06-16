<script lang="ts">
  import { fs } from "@tauri-apps/api";
  import { assert } from "ts-essentials";
  import { debounce } from "ts-debounce";

  import Input from "./Input.svelte";
  import type { InputStatus } from "./Input.types";
  import AppInfo from "./AppInfo.svelte";
  import ConfigFilesTreeview from "./ConfigFilesTreeview.svelte";
  import { isDefined } from "./well-known-utils";
  import { CONFIG_FILE_REGEX } from "./core";

  let workDirInputValue =
    "D:/workspace/tata-admin/test/examples/example-directory-1";

  let workDirStatus: InputStatus | undefined = undefined;
  let workDirErrorMessage: string;
  let files: fs.FileEntry[] = [];

  const readFiles = debounce((dir: string) => {
    fs.readDir(dir, { recursive: true })
      .then((entries) => {
        workDirStatus = "ok";

        function ignoreRedundantFiles(entries: fs.FileEntry[]): fs.FileEntry[] {
          return entries
            .map((entry) => {
              if (entry.children) {
                return {
                  ...entry,
                  children: ignoreRedundantFiles(entry.children),
                };
              }

              return entry.name?.match(CONFIG_FILE_REGEX) ? entry : null;
            })
            .filter(isDefined);
        }

        // solves race conditions
        if (dir === workDirInputValue) {
          files = ignoreRedundantFiles(entries);
          console.log({ files });
        }
      })
      .catch((err) => {
        assert(typeof err === "string");

        workDirStatus = "error";
        workDirErrorMessage = err;
      });
  }, 300);

  $: {
    workDirStatus = "working";
    readFiles(workDirInputValue);
  }

</script>

<main class="p-10 space-y-3">
  <header class="max-w-md space-y-1">
    <Input
      bind:value={workDirInputValue}
      label="Katalog roboczy"
      type="text"
      status={workDirStatus}
    />
    <div class="error" hidden={workDirStatus !== "error"}>
      <div class="text-sm">Ścieżka niepoprawna.</div>
      <pre class="text-xs">
        {workDirErrorMessage}
      </pre>
    </div>
  </header>

  <ConfigFilesTreeview
    children={files}
    on:click={(event) => {
      console.log("App > ConfigFilesTreeview $ click", event.detail);
    }}
  />

  <footer class="text-xs absolute bottom-0 p-4">
    <AppInfo />
  </footer>
</main>

<style>
  .error {
    cursor: help;
  }
  .error > pre {
    display: none;
  }
  .error:hover > pre {
    display: unset;
  }

</style>
