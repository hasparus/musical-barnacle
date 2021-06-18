<script lang="ts">
  import { route } from "./router";

  export let path: string;

</script>

{#if path === $route.path}
  <slot />
{/if}
