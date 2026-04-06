<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SBSingletonExercisePickerDialogExample from './SBSingletonExercisePickerDialogExample.svelte';

  const { Story } = defineMeta({
    tags: ['!autodocs'],
    title: 'Singletons/ExercisePickerDialog',
    component: SBSingletonExercisePickerDialogExample
  });
</script>

<Story name="Default" />
