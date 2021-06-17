<script type="ts">
  import Input from "./Input.svelte";
  import IpFilteringOptionSelect from "./IpFilteringOptionSelect.svelte";

  import { texts } from "./texts";

</script>

<form on:submit={(event) => console.log("submit!", event)} class="space-y-2">
  <Input label={texts.ConnectionString} name="ConnectionString" />
  <Input label={texts.ApplicationUrl} name="ApplicationUrl" />
  <Input
    label={texts.ApplicationName}
    name="ApplicationName"
    placeholder="/mMedica.mMDAB"
  />
  <div class="flex flex-row gap-2">
    <p>
      Pula portów na których mogą zostać wystawione aplikacje modułów jeżeli
      URLe nie są zdefiniowane lokalnie
    </p>
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
  <Input label={texts.DiagnosticMode} name="DiagnosticMode" />
  <IpFilteringOptionSelect />
</form>
