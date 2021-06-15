import { assert } from "ts-essentials";

import App from "./App.svelte";

import "@fontsource/inter";
import "./index.css";
import "./scrollbar-styles.css";

const root = document.getElementById("root");

assert(root, "There must be a #root element in the DOM.");

const app = new App({
  target: root,
});

export default app;
