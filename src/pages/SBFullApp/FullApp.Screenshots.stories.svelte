<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { FullAppScenario } from '$services/MockScenarioService/types';
  import sbFullAppMetaBase from './FullApp.stories.base';

  /**
   * Play Store listing screenshots. `pnpm generate:assets` renders every story
   * tagged `playstore-screenshot` at 1080×1920.
   */
  const { Story } = defineMeta({
    ...sbFullAppMetaBase,
    title: 'Full App/Screenshots',
    tags: ['playstore-screenshot', '!autodocs'],
    parameters: { ...sbFullAppMetaBase.parameters }
  });
</script>

<Story name="Home" args={{ scenario: FullAppScenario.MidTrainingWithHistory }} />

<Story name="Active Session" args={{ scenario: FullAppScenario.FreeFormWorkout }} />

<Story
  name="Sessions"
  args={{ scenario: FullAppScenario.MidTrainingWithHistory, route: '/sessions' }}
/>

<Story
  name="Mesocycles"
  args={{ scenario: FullAppScenario.HistoricalData, route: '/mesocycles' }}
/>

<Story
  name="Library"
  args={{ scenario: FullAppScenario.MidTrainingWithHistory, route: '/library' }}
/>

<Story name="Timer" args={{ scenario: FullAppScenario.MidTrainingWithHistory, route: '/timer' }} />
