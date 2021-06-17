<script lang="ts">
  import AppInfo from "./AppInfo.svelte";
  import ConfigFilesTreeview from "./ConfigFilesTreeview.svelte";
  import ConfigFileEditor from "./ConfigFileEditor.svelte";
  import AppConfiguration from "./AppConfiguration.svelte";
  import { appStore } from "./core";
  import { navigate, route } from "./Route.svelte";
  import Link from "./Link.svelte";

  import { texts } from "./texts";

</script>

<main class="p-10 space-y-3">
  {#if $route.path === "/"}
    <header class="max-w-md space-y-1">
      <AppConfiguration />
    </header>

    <div class="block text-sm font-medium text-gray-700">
      {texts.ConfigFiles}
    </div>
    <ConfigFilesTreeview
      children={$appStore.workingDirectory?.files || []}
      on:click={(event) => {
        console.log("App > ConfigFilesTreeview $ click", event.detail);

        navigate({ path: "/editor", editedConfigFile: event.detail.path });
      }}
    />
  {:else if $route.path === "/editor"}
    <Link to="/" class="text-sm p-2 -m-2">← {texts.GoBack}</Link>
    <ConfigFileEditor />
  {/if}

  <footer class="text-xs absolute bottom-0 p-4">
    <AppInfo />
  </footer>
</main>
