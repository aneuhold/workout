import type { defineMeta } from '@storybook/addon-svelte-csf';
import { FullAppScenario } from '$services/MockScenarioService/types';
import { createEnumArgType, createInvisibleArgTypes } from '$storybook/storybookUtil';
import SBFullAppExample from './SBFullAppExample.svelte';
import routeState from './sbFullAppRouteState.svelte';

const sbFullAppMetaBase: Parameters<typeof defineMeta>[0] = {
  title: 'Full App',
  component: SBFullAppExample,
  parameters: {
    layout: 'fullscreen',
    sveltekit_experimental: {
      hrefs: {
        '/.*': {
          callback: (url: string) => {
            routeState.navigate(url);
          },
          asRegex: true
        }
      },
      navigation: {
        goto: (url: string | URL) => {
          routeState.navigate(typeof url === 'string' ? url : url.toString());
          return Promise.resolve();
        }
      }
    }
  },
  argTypes: {
    scenario: createEnumArgType(FullAppScenario),
    ...createInvisibleArgTypes('route')
  },
  args: {
    scenario: FullAppScenario.MidTrainingWithHistory
  }
};

export default sbFullAppMetaBase;
