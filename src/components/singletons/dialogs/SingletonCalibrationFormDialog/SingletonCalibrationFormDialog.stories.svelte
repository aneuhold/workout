<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SBSingletonCalibrationFormDialogExample from './SBSingletonCalibrationFormDialogExample.svelte';

  const { Story } = defineMeta({
    title: 'Singletons/CalibrationFormDialog',
    tags: ['!autodocs'],
    component: SBSingletonCalibrationFormDialogExample
  });
</script>

<Story name="Default" />
