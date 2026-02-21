<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { confettiDecoratorFunction } from '$storybook/decorators';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBFullAppExample from './SBFullAppExample.svelte';
  import routeState from './sbFullAppRouteState.svelte';
  import { FullAppScenario } from './sbFullAppScenarios';

  const { Story } = defineMeta({
    title: 'Pages/Full App',
    tags: ['!autodocs'],
    component: SBFullAppExample,
    decorators: [confettiDecoratorFunction],
    parameters: {
      layout: 'fullscreen',
      // cspell:disable-next-line
      sveltekit_experimental: {
        // cspell:disable-next-line
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
      scenario: createEnumArgType(FullAppScenario)
    },
    args: {
      scenario: FullAppScenario.MidTraining
    }
  });
</script>

<Story name="Mid-Training" args={{ scenario: FullAppScenario.MidTraining }} />

<Story name="Fresh Start" args={{ scenario: FullAppScenario.FreshStart }} />

<Story name="All Complete" args={{ scenario: FullAppScenario.AllComplete }} />

<Story name="Review Pending" args={{ scenario: FullAppScenario.ReviewPending }} />

<Story name="Mesocycle Start" args={{ scenario: FullAppScenario.MesocycleStart }} />
