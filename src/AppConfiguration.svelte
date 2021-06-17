<script lang="ts">
  import { assert } from "ts-essentials";

  import Input from "./Input.svelte";
  import type { InputStatus } from "./Input.types";
  import { readWorkingDirectory } from "./core";
  import { appStore } from "./core";
  import { texts } from "./texts";

  let workDirInputValue =
    "D:/workspace/tata-admin/test/examples/example-directory-1";

  let workDirStatus: InputStatus | undefined = undefined;
  let workDirErrorMessage: string;

  $: {
    workDirStatus = "working";
    readWorkingDirectory(workDirInputValue)
      ?.then((workDir) => {
        if (workDir.path === workDirInputValue) {
          workDirStatus = "ok";
          appStore.setWorkingDir(workDir);
        }
      })
      .catch((err) => {
        assert(typeof err === "string");

        workDirStatus = "error";
        workDirErrorMessage = err;
      });
  }

</script>

<article>
  <Input
    bind:value={workDirInputValue}
    label={texts.WorkingDirectory}
    type="text"
    status={workDirStatus}
  />
  <div class="error" hidden={workDirStatus !== "error"}>
    <div class="text-sm">Ścieżka niepoprawna.</div>
    <pre class="text-xs">{workDirErrorMessage}</pre>
  </div>
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
