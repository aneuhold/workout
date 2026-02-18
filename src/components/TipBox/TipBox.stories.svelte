<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createInvisibleArgTypes } from '$storybook/storybookUtil';
  import TipBox from './TipBox.svelte';

  const { Story } = defineMeta({
    title: 'Components/TipBox',
    component: TipBox,
    argTypes: {
      ...createInvisibleArgTypes('children')
    }
  });
</script>

<!-- Default -->
<Story name="Default">
  Choose muscle groups you intend to specifically train for hypertrophy. These should be muscles you
  want to grow, not just muscles that happen to be involved in an exercise.
</Story>

<!-- Long Text -->
<Story name="Long Text">
  This is a longer tip to show how the component handles wrapping. The TipBox is designed to display
  helpful contextual information to guide users through forms and workflows. It should wrap
  naturally and remain readable at any reasonable width.
</Story>
