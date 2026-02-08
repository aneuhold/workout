<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType, createInvisibleArgTypes } from '$storybook/storybookUtil';
  import SBSkeletonExample, { SBSkeletonExampleLayoutType } from './SBSkeletonExample.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Skeleton',
    component: SBSkeletonExample,
    argTypes: {
      ...createInvisibleArgTypes('ref'),
      layout: createEnumArgType(SBSkeletonExampleLayoutType)
    }
  });
</script>

<!-- Default Skeleton -->
<Story name="Default" args={{ layout: SBSkeletonExampleLayoutType.Default }} />

<!-- Card Skeleton -->
<Story name="Card" args={{ layout: SBSkeletonExampleLayoutType.Card }} />

<!-- Text Lines -->
<Story name="Text Lines" args={{ layout: SBSkeletonExampleLayoutType.Lines }} />

<!-- Avatar -->
<Story name="Avatar" args={{ layout: SBSkeletonExampleLayoutType.Avatar }} />
