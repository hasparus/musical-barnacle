<script lang="ts">
  import json5 from "json5";

  import { appStore } from "./core";
  import type { AppEvent, ConfigFile } from "./core-types";
  import { texts } from "./texts";
  import LabelSpan from "./LabelSpan.svelte";
  import { navigate } from "./router";

  export let path: string;

  $: conflict = $appStore.events.find(
    (event): event is AppEvent.OfType<"file-content-conflict"> => {
      return event.type === "file-content-conflict" && event.path === path;
    }
  );

  const stringify = (value: ConfigFile) => json5.stringify(value, null, 2);

  const resolveConflict =
    (...args: Parameters<typeof appStore.resolveConflict>) =>
    () => {
      appStore.resolveConflict(...args);
      navigate({ path: "/" });
    };

</script>

{#if conflict}
  <section class="grid grid-cols-2 p-2 gap-4">
    <article>
      <header class="flex flex-row justify-between">
        <LabelSpan>{texts.OldContent}</LabelSpan>
        <button
          class="btn-primary"
          on:click={resolveConflict(conflict, "oldContent")}
          >{texts.Save}</button
        >
      </header>
      <pre>
        {stringify(conflict.oldContent)}
      </pre>
    </article>
    <article>
      <header class="flex flex-row justify-between">
        <LabelSpan>{texts.NewContent}</LabelSpan>
        <button
          class="btn-primary"
          on:click={resolveConflict(conflict, "newContent")}
          >{texts.Save}</button
        >
      </header>
      <pre>
        {stringify(conflict.newContent)}
      </pre>
    </article>
  </section>
{:else}
  <span class="text-sm">
    {texts.Loading}
  </span>
{/if}

<style>
  pre {
    @apply text-xs;
  }

</style>
