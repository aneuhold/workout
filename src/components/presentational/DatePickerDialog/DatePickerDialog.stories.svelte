<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { fn } from 'storybook/test';
  import { createInvisibleArgTypes, createTextArgTypes } from '$storybook/storybookUtil';
  import SBDatePickerDialogExample from './SBDatePickerDialogExample.svelte';

  const { Story } = defineMeta({
    title: 'Presentational Components/DatePickerDialog',
    component: SBDatePickerDialogExample,
    argTypes: {
      ...createInvisibleArgTypes('onSelected', 'initialDate'),
      ...createTextArgTypes('title')
    },
    args: {
      onSelected: fn()
    }
  });
</script>

<!-- Basic Date Picker Story -->
<Story name="Basic Date Picker" args={{ title: 'Pick a date', dateIsEndDate: false }} />

<!-- DateTime Picker with Initial Date -->
<Story
  name="DateTime Picker"
  args={{
    title: 'Pick a date and time',
    initialDate: new Date(2025, 10, 15, 14, 30),
    dateIsEndDate: false
  }}
/>

<!-- Date Range Constraints -->
<Story
  name="Date Range Constraints"
  args={{
    title: 'Pick a date (limited range)',
    startDate: new Date(2025, 10, 1),
    endDate: new Date(2025, 10, 30),
    dateIsEndDate: false
  }}
/>
