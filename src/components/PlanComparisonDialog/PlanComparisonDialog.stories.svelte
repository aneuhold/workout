<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SBPlanComparisonDialogExample from './SBPlanComparisonDialogExample.svelte';

  const storyModeEnum = {
    microcycleComplete: 'microcycleComplete',
    mesocycleStart: 'mesocycleStart',
    deloadMicrocycle: 'deloadMicrocycle'
  } as const;

  const { Story } = defineMeta({
    title: 'Components/PlanComparisonDialog',
    component: SBPlanComparisonDialogExample,
    argTypes: {
      storyMode: {
        control: { type: 'select' },
        options: Object.values(storyModeEnum)
      }
    },
    args: {
      storyMode: 'microcycleComplete'
    }
  });
</script>

<Story name="Microcycle Complete" args={{ storyMode: 'microcycleComplete' }} />
<Story name="Mesocycle Start" args={{ storyMode: 'mesocycleStart' }} />
<Story name="Deload Microcycle" args={{ storyMode: 'deloadMicrocycle' }} />
