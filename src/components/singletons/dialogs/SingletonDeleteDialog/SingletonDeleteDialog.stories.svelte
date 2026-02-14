<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SBSingletonDeleteDialogExample from './SBSingletonDeleteDialogExample.svelte';

  const { Story } = defineMeta({
    title: 'Singletons/DeleteDialog',
    component: SBSingletonDeleteDialogExample
  });
</script>

<Story name="Default" />
