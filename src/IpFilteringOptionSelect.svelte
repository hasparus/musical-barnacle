<script type="ts">
  import Input from "./Input.svelte";
  import LabelSpan from "./LabelSpan.svelte";

  import { ConfigFile } from "./core-types";
  import { texts } from "./texts";

  const { IpFilteringOption } = ConfigFile;

  let selectValue = IpFilteringOption.NoFiltering;

</script>

<section class="p-2 bg-gray-200 rounded-md">
  <label>
    <LabelSpan>{texts.IpFilteringOption}</LabelSpan>
    <select
      bind:value={selectValue}
      name="IpFilteringOption"
      class="text-sm mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 sm:text-sm border-gray-300 border"
    >
      <option value={ConfigFile.IpFilteringOption.NoFiltering}
        >Filtrowanie wyłączone</option
      >
      <option value={ConfigFile.IpFilteringOption.BlockList}
        >Blokuj poniższe adresy</option
      >
      <option value={ConfigFile.IpFilteringOption.AllowList}
        >Blokuj całą komunikację za wyjątkiem poniższych adresów</option
      >
    </select>
  </label>
  {#if selectValue === IpFilteringOption.NoFiltering}
    <div />
  {:else}
    <div class="pt-1">
      <Input
        label={selectValue === IpFilteringOption.AllowList
          ? texts.AllowedAddresses
          : texts.BlockedAddresses}
      />
    </div>
  {/if}
</section>
