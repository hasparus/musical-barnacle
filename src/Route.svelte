<script type="ts" context="module">
  import { writable } from "svelte/store";

  export type Route =
    | {
        path: "/";
      }
    | {
        path: "/editor";
        editedConfigFile: string;
      };

  const { set, subscribe } = writable<Route>(
    (window.history.state as Route) || { path: "/" }
  );

  export const route = { subscribe };

  window.onpopstate = () => {
    set(window.history.state as Route);
  };

  export const navigate = (newRoute: Route) => {
    history.pushState(newRoute, "", newRoute.path);
    set(newRoute);
  };

</script>

<script type="ts">
  export let path: string;

</script>

{#if path === $route.path}
  <slot />
{/if}
