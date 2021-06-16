<script lang="ts">
  import type { fs } from "@tauri-apps/api";
  import { createEventDispatcher } from "svelte";

  import { CONFIG_FILE_REGEX } from "./core";

  export let children: fs.FileEntry["children"];
  export let name: fs.FileEntry["name"] = undefined;

  const dispatch = createEventDispatcher<{ click: fs.FileEntry }>();

  let expanded = true;
  const toggle = () => {
    expanded = !expanded;
  };

  $: onlyChildFile =
    (children &&
      children.length === 1 &&
      !children[0]?.children &&
      children[0]!.name!.match(CONFIG_FILE_REGEX) &&
      children[0]) ||
    null;

  console.log(">>>", $$props);

  const onConfigFileClick = (file: fs.FileEntry) => {
    dispatch("click", file);
  };

</script>

{#if name && onlyChildFile}
  <li>
    <button on:click={() => onlyChildFile && onConfigFileClick(onlyChildFile)}
      >📜 {name}<span class="text-gray-400">/{onlyChildFile.name}</span></button
    >
  </li>
{:else if expanded}
  {#if name}
    <button class="cursor-pointer" on:click={toggle}>📂 {name}</button>
  {/if}
  <ul>
    {#each children || [] as file}
      <li>
        {#if file.children}
          <svelte:self
            name={file.name}
            children={file.children}
            on:click={(event) => onConfigFileClick(event.detail)}
          />
        {:else}
          📜 {file.name}
        {/if}
      </li>
    {/each}
  </ul>
{:else if name}
  <button class=" cursor-pointer font-semibold" on:click={toggle}
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
