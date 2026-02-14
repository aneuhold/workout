<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SBSingletonCalibrationFormDialogExample from './SBSingletonCalibrationFormDialogExample.svelte';

  const { Story } = defineMeta({
    title: 'Singletons/CalibrationFormDialog',
    component: SBSingletonCalibrationFormDialogExample
  });
</script>

<Story name="Default" />
