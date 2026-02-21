<!--
  @component

  Maps the current route state path to the corresponding page component
  with the correct props. Used inside the Full App Storybook shell.
-->
<script lang="ts">
  import ExercisePage from '$pages/ExercisePage/ExercisePage.svelte';
  import HomePage from '$pages/HomePage/HomePage.svelte';
  import LibraryPage from '$pages/LibraryPage/LibraryPage.svelte';
  import MesocyclePage from '$pages/MesocyclePage/MesocyclePage.svelte';
  import MesocyclesPage from '$pages/MesocyclesPage/MesocyclesPage.svelte';
  import SessionPage from '$pages/SessionPage/SessionPage.svelte';
  import SessionsPage from '$pages/SessionsPage/SessionsPage.svelte';
  import SettingsPage from '$pages/SettingsPage/SettingsPage.svelte';
  import TimerPage from '$pages/TimerPage/TimerPage.svelte';
  import navInfo from '$util/navInfo';
  import routeState from './sbFullAppRouteState.svelte';
</script>

{#if routeState.path === navInfo.mesocycleNew.url}
  <MesocyclePage mesocycleId={null} />
{:else if routeState.path === '/exercise/new'}
  <ExercisePage exerciseId={null} isNew={true} />
{:else if routeState.path === navInfo.home.url}
  <HomePage />
{:else if routeState.path === navInfo.sessions.url}
  <SessionsPage />
{:else if routeState.path === navInfo.session.url}
  <SessionPage sessionId={routeState.searchParams.get('sessionId')} />
{:else if routeState.path === navInfo.mesocycle.url}
  <MesocyclePage mesocycleId={routeState.searchParams.get('mesocycleId')} />
{:else if routeState.path === navInfo.mesocycles.url}
  <MesocyclesPage />
{:else if routeState.path === navInfo.exercise.url}
  <ExercisePage exerciseId={routeState.searchParams.get('exerciseId')} isNew={false} />
{:else if routeState.path === navInfo.library.url}
  <LibraryPage initialTab={routeState.searchParams.get('tab')} />
{:else if routeState.path === navInfo.settings.url}
  <SettingsPage />
{:else if routeState.path === navInfo.timer.url}
  <TimerPage />
{:else if routeState.path === navInfo.analytics.url}
  <p class="p-8 text-muted-foreground">Analytics page coming soon.</p>
{:else}
  <p class="p-8 text-muted-foreground">Unknown route: {routeState.path}</p>
{/if}
