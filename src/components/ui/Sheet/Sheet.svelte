<!-- 
  @component

  Don't use this component yet. It still needs work. Probably a re-do and comparison with the react
  version if you need to even use it.
-->
<script lang="ts">
  import { Dialog as SheetPrimitive } from 'bits-ui';

  let { open = $bindable(false), ...restProps }: SheetPrimitive.RootProps = $props();
</script>

<SheetPrimitive.Root bind:open {...restProps} />
