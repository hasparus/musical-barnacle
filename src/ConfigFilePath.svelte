<script lang="ts">
  import { appStore } from "./core";

  export let path: string;

  const rootPath = $appStore.workingDirectory?.path || "";
  const segments = path
    .replace(rootPath, "")
    .split("/")
    .filter((s) => s.length);

  let directoryPath = segments.slice(0, -2).join("/");
  if (directoryPath) directoryPath += "/";

  const lastDirectory = segments[segments.length - 2];
  const fileName = segments[segments.length - 1];

</script>

<span>
  <span class="text-gray-400">{directoryPath}</span>
  {lastDirectory}
  <span class="text-gray-400">/{fileName}</span>
</span>
