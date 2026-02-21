<!--
  @component

  Top-level wrapper for Full App Storybook stories. Sets up mock data for
  the chosen scenario, resets route state, and renders the app shell.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import MockData from '$testUtils/MockData';
  import routeState from './sbFullAppRouteState.svelte';
  import { FullAppScenario, setupScenario } from './sbFullAppScenarios';
  import SBFullAppShell from './SBFullAppShell.svelte';

  let { scenario = FullAppScenario.MidTraining }: { scenario?: FullAppScenario } = $props();

  $effect(() => {
    const currentScenario = scenario;

    untrack(() => {
      routeState.reset();
      setupScenario(currentScenario);
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

<SBFullAppShell />
