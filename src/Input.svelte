<script lang="ts">
  import type { InputStatus } from "./Input.types";
  import LabelSpan from "./LabelSpan.svelte";

  export let value: string = "";
  export let label: string;

  export let status: InputStatus | undefined = undefined;

  const ICON_OK = "✔";
  const ICON_ERROR = "❌";
  const ICON_WORKING = "⚙";

</script>

<!-- svelte-ignore a11y-label-has-associated-control -->
<label class={$$restProps.class}>
  <LabelSpan>{label}</LabelSpan>
  <div class="mt-1 relative rounded-md shadow-sm">
    <input
      bind:value
      {...$$restProps}
      class={`focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 sm:text-sm border-gray-300 border rounded-md ${
        status === "error" ? "border-red-600" : ""
      }${status ? "pr-12" : ""}`}
    />
    <!-- checkbox icon -->
    <div class="checkbox-icon">
      <svg
        class="hidden w-3 h-3 text-indigo-600 pointer-events-none"
        version="1.1"
        viewBox="0 0 17 12"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" fill-rule="evenodd">
          <g
            transform="translate(-9 -11)"
            fill="currentColor"
            fill-rule="nonzero"
          >
            <path
              d="m25.576 11.414c0.56558 0.55188 0.56558 1.4439 0 1.9961l-9.404 9.176c-0.28213 0.27529-0.65247 0.41385-1.0228 0.41385-0.37034 0-0.74068-0.13855-1.0228-0.41385l-4.7019-4.588c-0.56584-0.55188-0.56584-1.4442 0-1.9961 0.56558-0.55214 1.4798-0.55214 2.0456 0l3.679 3.5899 8.3812-8.1779c0.56558-0.55214 1.4798-0.55214 2.0456 0z"
            />
          </g>
        </g>
      </svg>
    </div>
    <!-- status: -->
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

<style lang="postcss">
  .checkbox-icon {
    @apply hidden bg-white border-2 rounded-md border-indigo-400 w-8 h-8 flex-shrink-0 justify-center items-center mr-2;
  }
  .checkbox-icon:focus-within {
    @apply border-indigo-500;
  }

  input[type="checkbox"] {
    @apply hidden;
  }
  input[type="checkbox"]:checked + .checkbox-icon svg {
    @apply block;
  }
  input[type="checkbox"] + .checkbox-icon {
    @apply flex cursor-pointer;
  }
  input[type="checkbox"]:checked + .checkbox-icon {
    @apply border-indigo-500;
  }

</style>
