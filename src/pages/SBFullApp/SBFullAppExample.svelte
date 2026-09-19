<!--
  @component

  Top-level wrapper for Full App Storybook stories. Resets route state, sets
  up mock data for the chosen scenario, opens the page the scenario starts
  on, and renders the app shell.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import MockDataService from '$services/MockDataService/MockData.service';
  import MockScenarioService from '$services/MockScenarioService/MockScenario.service';
  import { FullAppScenario } from '$services/MockScenarioService/types';
  import routeState from './sbFullAppRouteState.svelte';
  import SBFullAppShell from './SBFullAppShell.svelte';

  let { scenario = FullAppScenario.MidTrainingWithHistory }: { scenario?: FullAppScenario } =
    $props();

  $effect(() => {
    const currentScenario = scenario;

    untrack(() => {
      routeState.reset();
      const startUrl = MockScenarioService.setupScenario(currentScenario);
      if (startUrl) {
        routeState.navigate(startUrl);
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
