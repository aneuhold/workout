<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createInvisibleArgTypes } from '$storybook/storybookUtil';
  import InfoPopover from './InfoPopover.svelte';

  const { Story } = defineMeta({
    title: 'Components/InfoPopover',
    component: InfoPopover,
    argTypes: {
      ...createInvisibleArgTypes('children'),
      size: {
        control: { type: 'number' },
        description: 'Icon size in pixels'
      }
    },
    args: {
      size: 16
    }
  });
</script>

<!-- Default -->
<Story name="Default">This is some helpful information about a confusing concept.</Story>

<!-- Larger Icon -->
<Story name="Larger Icon" args={{ size: 20 }}>
  These values help position the exercise correctly within your mesocycles. Without them, the app
  can't determine how fatiguing this exercise is relative to others, which affects volume and
  recovery planning.
</Story>
