<script lang="ts">
  import { assert } from "ts-essentials";
  import { debounce } from "lodash";

  import Input from "./Input.svelte";
  import type { InputStatus } from "./Input.types";
  import { readWorkingDirectory } from "./core";
  import { appStore } from "./core";
  import { texts } from "./texts";

  let workDirInputValue = "";

  $: {
    if ($appStore.workingDirectory?.path && !workDirInputValue) {
      workDirInputValue = $appStore.workingDirectory?.path;
    }
  }

  let workDirStatus: InputStatus | undefined = undefined;
  let workDirErrorMessage: string;

  const onInput = debounce(
    () => {
      workDirStatus = "working";
      readWorkingDirectory(workDirInputValue)
        .then((workDir) => {
          workDirStatus = "ok";
          if (workDir.path === workDirInputValue) {
            appStore.setWorkingDir(workDir);
          }
        })
        .catch((err) => {
          assert(typeof err === "string");

          workDirStatus = "error";
          workDirErrorMessage = err;
        });
    },
    500,
    { leading: true, trailing: true }
  );

  $: {
    if (
      $appStore.status === "idle" &&
      workDirInputValue &&
      $appStore.workingDirectory?.path !== workDirInputValue
    ) {
      onInput();
    }
  }

</script>

<article>
  <details
    bind:open={$appStore.uiState.settingsOpen}
    class="bg-gray-200 rounded-md p-2"
  >
    <summary class="text-xs cursor-pointer mb-1"
      ><span class="text-sm">Ustawienia</span></summary
    >
    <Input
      bind:value={workDirInputValue}
      label={texts.WorkingDirectory}
      placeholder="D:/workspace/apps"
      type="text"
      disabled={$appStore.status !== "idle"}
      status={workDirInputValue ? workDirStatus : undefined}
    />
    <div class="error" hidden={workDirStatus !== "error"}>
      <div class="text-sm">Ścieżka niepoprawna.</div>
      <pre class="text-xs">{workDirErrorMessage}</pre>
    </div>
  </details>
</article>

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
