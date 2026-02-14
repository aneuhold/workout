<script lang="ts">
  import type { Snippet } from 'svelte';
  import SingletonEquipmentFormDialog from './SingletonEquipmentFormDialog.svelte';

  let { children }: { children?: Snippet } = $props();
</script>

{@render children?.()}
<SingletonEquipmentFormDialog />
