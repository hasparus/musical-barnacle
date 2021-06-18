<script lang="ts">
import { text } from "svelte/internal";

  import { appStore } from "./core";
  import LabelSpan from "./LabelSpan.svelte";
  import { texts } from "./texts";

  $: events = $appStore.events;

</script>

<article>
  <LabelSpan>
    {events.length ? texts.Events : texts.NoEvents}
  </LabelSpan>
  <ul class="py-1 space-y-2">
    {#each events as event}
      <li class="flex flex-col p-2 shadow-sm bg-white">
        <div class="text-sm text-gray-700 flex flex-row justify-between">
          {#if event.type === "error"}
            <div><strong>{texts.ErrorOccurred}</strong> {event.message}</div>
          {:else if event.type === "file-missing"}
            <div>
              <strong>{texts.FileMissing}</strong>
              {event.path}
            </div>
            <button class="btn-primary">{texts.RetrieveFile}</button>
          {:else if event.type === "new-file-added"}
            <div>
              <strong>{texts.NewFileAdded}</strong>
              {event.path}
            </div>
            <button
              class="btn-primary"
              on:click={() => appStore.addFileFromPath(event.path)}
              >{texts.TrackFile}</button
            >
          {:else if event.type === "please-enter-working-directory"}
            <strong>{texts.PleaseEnterWorkingDirectory}</strong>
          {/if}
        </div>
        <span class="text-xs text-gray-600">
          {new Date(event.date).toLocaleString()}
        </span>
      </li>
    {/each}
  </ul>
</article>
