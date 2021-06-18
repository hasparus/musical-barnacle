<script lang="ts">
  import Input from "./Input.svelte";
  import IpFilteringOptionSelect from "./IpFilteringOptionSelect.svelte";

  import { texts } from "./texts";

</script>

<form
  on:submit={(event) => {
    event.preventDefault();
    console.log("submit!", event);
  }}
  class="space-y-2"
>
  <button type="submit" class="btn-primary-lg absolute right-0 top-0"
    >{texts.Save}</button
  >

  <Input label={texts.ConnectionString} name="ConnectionString" />
  <Input label={texts.ApplicationUrl} name="ApplicationUrl" />
  <Input
    label={texts.ApplicationName}
    name="ApplicationName"
    placeholder="/mMedica.mMDAB"
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
      />
      <Input
        label={texts.ModulesPortEndIndex}
        type="number"
        name="ModulesPortEndIndex"
      />
    </div>
  </div>
  <Input label={texts.DiagnosticMode} name="DiagnosticMode" />
  <IpFilteringOptionSelect />
  <Input
    label={texts.SetOfIpAddresses}
    name="SetOfIpAddresses"
    placeholder="127.0.0.2;10.1.2.3-10.5.1.3"
  />
  <Input
    label={texts.ProxyWindowsEnable}
    type="checkbox"
    name="ProxyWindowsEnable"
  />
  <Input
    label={texts.ProxyIPs}
    name="ProxyIPs"
    placeholder="127.0.0.2;10.1.2.3-10.5.1.3"
  />
</form>
