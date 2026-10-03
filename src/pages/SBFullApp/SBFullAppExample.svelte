<!--
  @component

  Top-level wrapper for Full App Storybook stories. Resets route state, sets
  up mock data for the chosen scenario, opens `route` when given (otherwise
  the page the scenario starts on), and renders the app shell.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import MockDataService from '$services/MockDataService/MockData.service';
  import MockScenarioService from '$services/MockScenarioService/MockScenario.service';
  import { FullAppScenario } from '$services/MockScenarioService/types';
  import routeState from './sbFullAppRouteState.svelte';
  import SBFullAppShell from './SBFullAppShell.svelte';

  let {
    scenario = FullAppScenario.MidTrainingWithHistory,
    route
  }: { scenario?: FullAppScenario; route?: string } = $props();

  $effect(() => {
    const currentScenario = scenario;
    const currentRoute = route;

    untrack(() => {
      routeState.reset();
      const startUrl = MockScenarioService.setupScenario(currentScenario);
      const openUrl = currentRoute ?? startUrl;
      if (openUrl) {
        routeState.navigate(openUrl);
      }
    });

    return () => {
      untrack(() => {
        MockDataService.resetAll();
      });
    };
  });
</script>

<SBFullAppShell />
