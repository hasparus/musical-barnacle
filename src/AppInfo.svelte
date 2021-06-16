<script lang="ts">
  import { app } from "@tauri-apps/api";

  async function getAppInfo() {
    const name = app.getName();
    const version = app.getVersion();

    return {
      name: await name,
      version: await version,
    };
  }

</script>

<div class="opacity-25 hover:opacity-100 cursor-default">
  {#await getAppInfo()}
    <span>Zczytywanie informacji o aplikacji...</span>
  {:then appInfo}
    <span>
      {appInfo.name}
      v{appInfo.version}
    </span>
  {:catch error}
    <span>Nie udało się przeczytać danych aplikacji..</span>
    <pre>{error}</pre>
  {/await}
</div>
