import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig, ESBuildOptions } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export const esbuildOptions: ESBuildOptions = {};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), tsconfigPaths()],
  esbuild: esbuildOptions,
});
