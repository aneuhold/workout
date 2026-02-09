<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createTextArgTypes } from '$storybook/storybookUtil';
  import SBSheetExample from './SBSheetExample.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Sheet',
    component: SBSheetExample,
    argTypes: {
      ...createTextArgTypes('title', 'description', 'triggerText'),
      side: {
        control: { type: 'select' },
        options: ['top', 'right', 'bottom', 'left']
      }
    },
    args: {
      title: 'Sheet Title',
      description: 'This is a sheet description.',
      triggerText: 'Open Sheet',
      showFooter: true
    }
  });
</script>

<!-- Default Sheet (Right) -->
<Story name="Default (Right)" />

<!-- Left Side -->
<Story
  name="Left Side"
  args={{
    side: 'left',
    title: 'Left Sheet',
    description: 'This sheet slides from the left.'
  }}
/>

<!-- Top Side -->
<Story
  name="Top Side"
  args={{
    side: 'top',
    title: 'Top Sheet',
    description: 'This sheet slides from the top.'
  }}
/>

<!-- Bottom Side -->
<Story
  name="Bottom Side"
  args={{
    side: 'bottom',
    title: 'Bottom Sheet',
    description: 'This sheet slides from the bottom.'
  }}
/>

<!-- Without Footer -->
<Story
  name="Without Footer"
  args={{
    showFooter: false
  }}
/>
