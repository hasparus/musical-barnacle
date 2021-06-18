<script lang="ts">
  import AppInfo from "./AppInfo.svelte";
  import ConfigFilesTreeview from "./ConfigFilesTreeview.svelte";
  import ConfigFileEditor from "./ConfigFileEditor.svelte";
  import AppConfiguration from "./AppConfiguration.svelte";
  import { appStore } from "./core";
  import { navigate, route } from "./router";
  import Link from "./Link.svelte";
  import AppEventsLog from "./AppEventsLog.svelte";

  import { texts } from "./texts";
  import { onMount } from "svelte";

  onMount(() => {
    void appStore.init();
  });

</script>

<main class="p-10 space-y-3 min-h-screen flex flex-col max-w-3xl">
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
    <AppEventsLog />
  {:else if $route.path === "/editor"}
    <Link to="/" class="text-sm p-2 -m-2">← {texts.GoBack}</Link>
    <ConfigFileEditor />
  {/if}

  <div class="flex-1" />
  <footer class="text-xs p-4">
    <AppInfo />
  </footer>
</main>
