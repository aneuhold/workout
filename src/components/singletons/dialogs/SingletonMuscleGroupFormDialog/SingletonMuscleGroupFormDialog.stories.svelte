<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SBSingletonMuscleGroupFormDialogExample from './SBSingletonMuscleGroupFormDialogExample.svelte';

  const { Story } = defineMeta({
    tags: ['!autodocs'],
    title: 'Singletons/MuscleGroupFormDialog',
    component: SBSingletonMuscleGroupFormDialogExample
  });
</script>

<Story name="Default" />
