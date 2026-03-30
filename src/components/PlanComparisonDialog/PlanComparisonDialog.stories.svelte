<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBPlanComparisonDialogExample, {
    PlanComparisonStoryMode
  } from './SBPlanComparisonDialogExample.svelte';

  const { Story } = defineMeta({
    title: 'Components/PlanComparisonDialog',
    component: SBPlanComparisonDialogExample,
    argTypes: {
      storyMode: createEnumArgType(PlanComparisonStoryMode)
    },
    args: {
      storyMode: PlanComparisonStoryMode.MicrocycleComplete
    }
  });
</script>

<Story
  name="Microcycle Complete"
  args={{ storyMode: PlanComparisonStoryMode.MicrocycleComplete }}
/>
<Story name="Mesocycle Start" args={{ storyMode: PlanComparisonStoryMode.MesocycleStart }} />
<Story name="Deload Microcycle" args={{ storyMode: PlanComparisonStoryMode.DeloadMicrocycle }} />
