<script lang="ts">
  import type { fs } from "@tauri-apps/api";
  import { createEventDispatcher } from "svelte";

  import { findLoneLeafConfigFile } from "./core";
  import ConfigFilePath from "./ConfigFilePath.svelte";

  export let children: fs.FileEntry["children"];
  export let name: fs.FileEntry["name"] = undefined;

  const dispatch = createEventDispatcher<{ click: fs.FileEntry }>();

  let expanded = true;
  const toggle = () => {
    expanded = !expanded;
  };

  $: loneLeaf = children && findLoneLeafConfigFile(children);

  const onConfigFileClick = (file: fs.FileEntry) => {
    dispatch("click", file);
  };

</script>

{#if name && loneLeaf}
  <li>
    <button on:click={() => loneLeaf && onConfigFileClick(loneLeaf)}
      >📜 <ConfigFilePath path={loneLeaf.path} /></button
    >
  </li>
{:else if expanded}
  {#if name}
    <button class="cursor-pointer" on:click={toggle}>📂 {name}</button>
  {/if}
  <ul>
    {#each children || [] as file}
      {#if file.name}
        <li>
          {#if file.children}
            <svelte:self
              name={file.name}
              children={file.children}
              on:click={(event) => onConfigFileClick(event.detail)}
            />
          {:else}
            📜 <ConfigFilePath path={file.name || "UNNAMED_FILE"} />
          {/if}
        </li>
      {/if}
    {/each}
  </ul>
{:else if name}
  <button class="cursor-pointer font-semibold" on:click={toggle}
    >📁 {name}</button
  >
{/if}

<style lang="postcss">
  button {
    @apply p-1 pr-2 rounded-sm;
  }
  button:hover {
    @apply bg-gray-200;
  }

  li {
    @apply text-sm;
  }

  li > :global(ul) {
    @apply pl-3 ml-3;
    @apply border-gray-300 border-l;
  }

</style>
