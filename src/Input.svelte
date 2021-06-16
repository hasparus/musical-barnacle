<script lang="ts">
  import type { InputStatus } from "./Input.types";

  export let value: string;
  export let label: string;

  export let status: InputStatus | undefined = undefined;

  const ICON_OK = "✔";
  const ICON_ERROR = "❌";
  const ICON_WORKING = "⚙";

</script>

<!-- svelte-ignore a11y-label-has-associated-control -->
<label>
  <div class="block text-sm font-medium text-gray-700">{label}</div>
  <div class="mt-1 relative rounded-md shadow-sm">
    <input
      bind:value
      class={`focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 pr-12 sm:text-sm border-gray-300 border rounded-md ${
        status === "error" ? "border-red-600" : ""
      }`}
      {...$$restProps}
    />
    <div
      class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
    >
      <span class="sm:text-sm">
        {#if status === "ok"}
          {ICON_OK}
        {:else if status === "error"}
          {ICON_ERROR}
        {:else if status === "working"}
          <div class="animate-spin">
            {ICON_WORKING}
          </div>
        {/if}
      </span>
    </div>
  </div>
</label>
