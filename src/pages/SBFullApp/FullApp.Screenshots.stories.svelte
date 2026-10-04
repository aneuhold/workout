<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { userEvent, within } from 'storybook/test';
  import { FullAppScenario } from '$services/MockScenarioService/types';
  import { PLAY_STORE_VIEWPORT } from '../../../scripts/constants/playStoreViewport';
  import sbFullAppMetaBase from './FullApp.stories.base';

  /**
   * Play Store listing screenshots. `pnpm generate:assets` runs every story
   * tagged `playstore-screenshot` as a Vitest browser test and saves a
   * 1080×1920 capture of each.
   */
  const { Story } = defineMeta({
    ...sbFullAppMetaBase,
    title: 'Full App/Screenshots',
    tags: ['playstore-screenshot', '!autodocs'],
    parameters: {
      ...sbFullAppMetaBase.parameters,
      viewport: {
        options: {
          playStore: {
            name: `Play Store (${PLAY_STORE_VIEWPORT.width}x${PLAY_STORE_VIEWPORT.height})`,
            styles: {
              width: `${PLAY_STORE_VIEWPORT.width}px`,
              height: `${PLAY_STORE_VIEWPORT.height}px`
            },
            type: 'mobile'
          }
        }
      }
    },
    globals: { viewport: { value: 'playStore', isRotated: false } }
  });
</script>

<Story name="Home" args={{ scenario: FullAppScenario.MidTrainingWithHistory }} />

<Story
  name="Active Session"
  args={{ scenario: FullAppScenario.MidTrainingWithHistory }}
  play={async ({ canvasElement }) => {
    // The nav link opens the in-progress session, whose ID is generated at setup
    const sessionsLink = within(canvasElement).getByTestId('nav-sessions');
    await userEvent.click(sessionsLink);
    // Drops the focus ring the click leaves on the link
    sessionsLink.blur();
  }}
/>

<Story
  name="Mesocycles"
  args={{ scenario: FullAppScenario.MidTrainingWithHistory, route: '/mesocycles' }}
/>

<Story
  name="Library"
  args={{ scenario: FullAppScenario.MidTrainingWithHistory, route: '/library' }}
/>

<Story name="Timer" args={{ scenario: FullAppScenario.MidTrainingWithHistory, route: '/timer' }} />
