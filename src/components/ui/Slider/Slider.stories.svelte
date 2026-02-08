<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createInvisibleArgTypes } from '$storybook/storybookUtil';
  import Slider from './Slider.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Slider',
    component: Slider,
    argTypes: {
      ...createInvisibleArgTypes('ref'),
      value: {
        control: { type: 'object' }
      },
      min: {
        control: { type: 'number' }
      },
      max: {
        control: { type: 'number' }
      },
      step: {
        control: { type: 'number' }
      },
      orientation: {
        control: { type: 'select' },
        options: ['horizontal', 'vertical']
      },
      disabled: {
        control: { type: 'boolean' }
      }
    },
    args: {
      value: [50],
      min: 0,
      max: 100,
      step: 1,
      orientation: 'horizontal',
      disabled: false
    }
  });
</script>

<!-- Default Slider -->
<Story name="Default" args={{ value: [50] }} />

<!-- Range Slider -->
<Story name="Range" args={{ value: [25, 75] }} />

<!-- Custom Step -->
<Story name="Custom Step" args={{ value: [50], step: 10 }} />

<!-- Custom Min/Max -->
<Story name="Custom Range" args={{ value: [150], min: 100, max: 200 }} />

<!-- Disabled -->
<Story name="Disabled" args={{ value: [60], disabled: true }} />

<!-- Vertical Orientation -->
<Story name="Vertical" args={{ value: [40], orientation: 'vertical' }} />

<!-- Vertical Range -->
<Story name="Vertical Range" args={{ value: [30, 70], orientation: 'vertical' }} />
