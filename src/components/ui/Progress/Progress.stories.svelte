<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createInvisibleArgTypes } from '$storybook/storybookUtil';
  import SBProgressExample from './SBProgressExample.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Progress',
    component: SBProgressExample,
    argTypes: {
      ...createInvisibleArgTypes('ref'),
      value: {
        control: { type: 'range', min: 0, max: 100, step: 1 }
      },
      max: {
        control: { type: 'number' }
      },
      showLabel: {
        control: { type: 'boolean' }
      },
      label: {
        control: { type: 'text' }
      }
    },
    args: {
      value: 50,
      max: 100,
      showLabel: false,
      label: ''
    }
  });
</script>

<!-- Default Progress -->
<Story name="Default" args={{ value: 50 }} />

<!-- Half Progress -->
<Story name="Half" args={{ value: 50 }} />

<!-- Almost Complete -->
<Story name="Almost Complete" args={{ value: 90 }} />

<!-- Complete -->
<Story name="Complete" args={{ value: 100 }} />

<!-- Custom Max Value -->
<Story
  name="Custom Max"
  args={{ value: 30, max: 50, showLabel: true, label: '30 out of 50 items' }}
/>

<!-- With Label -->
<Story name="With Label" args={{ value: 75, showLabel: true, label: 'Loading...' }} />
