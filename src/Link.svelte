<script type="ts">
  import { navigate } from "./Route.svelte";
  import type { Route } from "./Route.svelte";

  // filter out all routes that have extra keys besides "path"
  type PathOnly<T extends Route> = {
    [P in T["path"]]: keyof Extract<T, { path: P }> extends "path"
      ? Extract<T, { path: P }>
      : never;
  }[T["path"]];

  export let to: Route | PathOnly<Route>["path"];

  const route = (typeof to === "string" ? { path: to } : to) as Route;

</script>

<a
  href={route.path}
  on:click={(event) => {
    event.preventDefault();
    navigate(route);
  }}
  {...$$restProps}
  class={`${$$restProps.class} hover:underline`}
>
  <slot />
</a>
