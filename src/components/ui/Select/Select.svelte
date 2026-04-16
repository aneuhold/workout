<script lang="ts">
  import { Select as SelectPrimitive } from 'bits-ui';

  let {
    open = $bindable(false),
    value = $bindable(),
    ...restProps
  }: SelectPrimitive.RootProps = $props();
</script>

<!--
Discriminated unions + destructuring (required for bindable) do not get along
in TypeScript yet, so the bound value is widened to `never` to bypass the check.
-->
<!-- eslint-disable @typescript-eslint/consistent-type-assertions -->
<SelectPrimitive.Root bind:open bind:value={value as never} {...restProps} />
