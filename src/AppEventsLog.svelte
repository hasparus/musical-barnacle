<script lang="ts">
  import { appStore } from "./core";
  import LabelSpan from "./LabelSpan.svelte";
  import { texts } from "./texts";

  $: events = $appStore.events;

</script>

<article>
  <LabelSpan>
    {texts.Events}
  </LabelSpan>
  <ul class="py-1 space-y-2">
    {#each events as event}
      <li class="flex flex-row justify-between p-2 shadow-sm bg-white">
        <div class="text-sm text-gray-700">
          {#if event.type === "error"}
            <strong>{texts.ErrorOccurred}</strong> {event.message}
          {:else if event.type === "file-missing"}
            <strong>{texts.FileMissing}</strong>
            {event.path}
            [[TODO: Przywróć pilk]]
          {:else if event.type === "new-file-added"}
            <strong>{texts.NewFileAdded}</strong>
            {event.path}
            [[TODO: Śledź plik]]
          {:else if event.type === "please-enter-working-directory"}
            <strong>{texts.PleaseEnterWorkingDirectory}</strong>
          {/if}
        </div>
        <span class="text-xs text-gray-600">
          {new Date(event.date).toLocaleDateString()}
        </span>
      </li>
    {/each}
  </ul>
</article>
