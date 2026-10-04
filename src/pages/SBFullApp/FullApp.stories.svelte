<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { FullAppScenario } from '$services/MockScenarioService/types';
  import sbFullAppMetaBase from './FullApp.stories.base';

  const { Story } = defineMeta({
    ...sbFullAppMetaBase,
    tags: ['!autodocs']
  });
</script>

<Story
  name="Mid-Training With History"
  args={{ scenario: FullAppScenario.MidTrainingWithHistory }}
/>

<Story name="Completely Fresh" args={{ scenario: FullAppScenario.CompletelyFresh }} />

<Story name="Fresh Start" args={{ scenario: FullAppScenario.FreshStart }} />

<Story name="Free-Form Workout" args={{ scenario: FullAppScenario.FreeFormWorkout }} />

<Story name="All Complete" args={{ scenario: FullAppScenario.AllComplete }} />

<Story name="Review Pending" args={{ scenario: FullAppScenario.ReviewPending }} />

<Story name="Mesocycle Start" args={{ scenario: FullAppScenario.MesocycleStart }} />

<Story name="Very Late Session" args={{ scenario: FullAppScenario.VeryLateSession }} />

<Story name="Deload Trigger" args={{ scenario: FullAppScenario.DeloadTrigger }} />

<Story name="Historical Data (3 Mesocycles)" args={{ scenario: FullAppScenario.HistoricalData }} />
