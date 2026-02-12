<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createTextArgTypes } from '$storybook/storybookUtil';
  import SBPopoverExample from './SBPopoverExample.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Popover',
    component: SBPopoverExample,
    argTypes: {
      ...createTextArgTypes('triggerText', 'title', 'content')
    },
    args: {
      triggerText: 'Open Popover',
      title: 'Popover Title',
      content: 'This is the popover content.'
    }
  });
</script>

<!-- Default Popover -->
<Story name="Default" />

<!-- With Close Button -->
<Story name="With Close Button" args={{ showCloseButton: true }} />

<!-- Custom Content -->
<Story
  name="Custom Content"
  args={{
    title: 'Information',
    content: 'Click outside or press escape to close this popover.'
  }}
/>
