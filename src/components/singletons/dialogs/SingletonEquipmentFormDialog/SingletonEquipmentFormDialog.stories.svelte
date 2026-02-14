<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SBSingletonEquipmentFormDialogExample from './SBSingletonEquipmentFormDialogExample.svelte';

  const { Story } = defineMeta({
    title: 'Singletons/EquipmentFormDialog',
    component: SBSingletonEquipmentFormDialogExample
  });
</script>

<Story name="Default" />
