<script lang="ts">
  import Input from "./Input.svelte";
  import IpFilteringOptionSelect from "./IpFilteringOptionSelect.svelte";
  import { texts } from "./texts";
  import { appStore } from "./core";
  import { assert } from "ts-essentials";

  export let relativePath: string;

  $: values = $appStore.configFileContents[relativePath];

</script>

{#if values}
  <form
    on:submit={(event) => {
      event.preventDefault();
      assert(values, "form is not rendered when values are undefined");
      appStore.saveConfigFile(relativePath, values);
    }}
    class="flex flex-col gap-3"
  >
    <button type="submit" class="btn-primary-lg absolute right-0 top-0"
      >{texts.Save}</button
    >

    <Input
      label={texts.ConnectionString}
      name="ConnectionString"
      bind:value={values.ConnectionString}
    />
    <Input
      label={texts.ApplicationUrl}
      name="ApplicationUrl"
      bind:value={values.ApplicationUrl}
    />
    <Input
      label={texts.ApplicationName}
      name="ApplicationName"
      placeholder="/mMedica.mMDAB"
      bind:value={values.ApplicationName}
    />
    <div class="flex flex-col p-2 bg-gray-200 rounded-md space-y-2">
      <p class="text-sm">
        Pula portów na których mogą zostać wystawione aplikacje modułów jeżeli
        URLe nie są zdefiniowane lokalnie
      </p>
      <div class="grid grid-cols-2 gap-2">
        <Input
          label={texts.ModulesPortStartIndex}
          type="number"
          name="ModulesPortStartIndex"
          bind:value={values.ModulesPortStartIndex}
        />
        <Input
          label={texts.ModulesPortEndIndex}
          type="number"
          name="ModulesPortEndIndex"
          bind:value={values.ModulesPortEndIndex}
        />
      </div>
    </div>
    <Input
      label={texts.DiagnosticMode}
      type="checkbox"
      name="DiagnosticMode"
      bind:checked={values.DiagnosticMode}
    />
    <IpFilteringOptionSelect />
    <Input
      label={texts.SetOfIpAddresses}
      name="SetOfIpAddresses"
      placeholder="127.0.0.2;10.1.2.3-10.5.1.3"
      bind:value={values.SetOfIpAddresses}
    />
    <Input
      label={texts.ProxyWindowsEnable}
      type="checkbox"
      name="ProxyWindowsEnable"
      bind:value={values.ProxyWindowsEnable}
    />
    <Input
      label={texts.ProxyIPs}
      name="ProxyIPs"
      placeholder="127.0.0.2;10.1.2.3-10.5.1.3"
      bind:value={values.ProxyIPs}
    />
  </form>
{/if}
