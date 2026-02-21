<!--
  @component

  App layout shell for Full App Storybook stories. Renders the real TopBar
  and NavBar with route state, plus the router for page content.
-->
<script lang="ts">
  import NavBar from '$components/NavBar/NavBar.svelte';
  import TopBar from '$components/TopBar/TopBar.svelte';
  import SBFullAppRouter from './SBFullAppRouter.svelte';
  import routeState from './sbFullAppRouteState.svelte';
</script>

<TopBar username="Storybook" currentPath={routeState.path} />
<NavBar currentPath={routeState.path} />
<main class="md:pt-(--top-nav-height) pb-(--bottom-nav-height) md:pb-0 md:pl-48">
  <SBFullAppRouter />
</main>
