<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createBoolArgTypes, createInvisibleArgTypes } from '$storybook/storybookUtil';
  import SBRadioGroupExample from './SBRadioGroupExample.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/RadioGroup',
    component: SBRadioGroupExample,
    argTypes: {
      ...createInvisibleArgTypes('ref'),
      ...createBoolArgTypes('disabled'),
      orientation: {
        control: { type: 'select' },
        options: ['vertical', 'horizontal']
      },
      value: {
        control: { type: 'select' },
        options: ['option-1', 'option-2', 'option-3']
      }
    },
    args: {
      value: 'option-1',
      disabled: false,
      orientation: 'vertical'
    }
  });
</script>

<!-- Default RadioGroup -->
<Story name="Default" />

<!-- Pre-selected Option -->
<Story name="Pre-selected" args={{ value: 'option-2' }} />

<!-- Horizontal Layout -->
<Story name="Horizontal" args={{ orientation: 'horizontal' }} />

<!-- Disabled -->
<Story name="Disabled" args={{ disabled: true }} />

<!-- Disabled with Selection -->
<Story name="Disabled with Selection" args={{ disabled: true, value: 'option-2' }} />
