<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBSingletonRescheduleMesocycleDialogExample, {
    RescheduleMesocycleStoryMode
  } from './SBSingletonRescheduleMesocycleDialogExample.svelte';

  const { Story } = defineMeta({
    tags: ['!autodocs'],
    title: 'Singletons/RescheduleMesocycleDialog',
    component: SBSingletonRescheduleMesocycleDialogExample,
    argTypes: {
      storyMode: createEnumArgType(RescheduleMesocycleStoryMode)
    },
    args: {
      storyMode: RescheduleMesocycleStoryMode.NoOverlap
    }
  });
</script>

<Story name="No Overlap" args={{ storyMode: RescheduleMesocycleStoryMode.NoOverlap }} />

<Story name="With Overlap" args={{ storyMode: RescheduleMesocycleStoryMode.WithOverlap }} />
