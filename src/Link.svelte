<script lang="ts">
  import { navigate } from "./router";
  import type { Route, PathOnly } from "./router";

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
