import { writable } from "svelte/store";

export type Route =
  | {
      path: "/";
    }
  | {
      path: "/editor";
      editedConfigFile: string;
    }
  | {
      path: "/conflict-resolution";
      filePath: string;
    };

const { set, subscribe } = writable<Route>(
  (window.history.state as Route) || { path: "/" }
);

export const route = { subscribe };

window.onpopstate = () => {
  set(window.history.state as Route);
};

export const navigate = (newRoute: Route) => {
  window.history.pushState(newRoute, "", newRoute.path);
  set(newRoute);
};

// filter out all routes that have extra keys besides "path"
export type PathOnly<T extends Route> = {
  [P in T["path"]]: keyof Extract<T, { path: P }> extends "path"
    ? Extract<T, { path: P }>
    : never;
}[T["path"]];
