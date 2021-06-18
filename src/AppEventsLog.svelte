<script lang="ts">
  import { appStore } from "./core";
  import LabelSpan from "./LabelSpan.svelte";
  import { texts } from "./texts";
  import Link from "./Link.svelte";

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
            <div>
              <button
                class="btn-secondary"
                on:click={() => appStore.forgetFile(event)}
              >
                {texts.Forget}
              </button>
              <button
                class="btn-primary"
                on:click={() => appStore.retrieveFile(event)}
              >
                {texts.RetrieveFile}
              </button>
            </div>
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
          {:else if event.type === "file-content-conflict"}
            <div>
              <strong>{texts.FileContentConflict}</strong>
              {event.path}
            </div>
            <Link
              class="btn-primary"
              to={{ path: "/conflict-resolution", filePath: event.path }}
            >
              {texts.SolveConflict}
            </Link>
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
