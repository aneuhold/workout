<!--
  @component

  App layout shell for Full App Storybook stories. Renders the real TopBar
  and NavBar with route state, plus the router for page content. Drops the
  chrome on marketing routes (e.g. /privacy) so the storybook matches what
  production renders inside the `(marketing)` layout.
-->
<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import NavBar from '$components/NavBar/NavBar.svelte';
  import TopBar from '$components/TopBar/TopBar.svelte';
  import timerService from '$services/TimerService';
  import { marketingPages } from '$util/navInfo';
  import SBFullAppRouter from './SBFullAppRouter.svelte';
  import routeState from './sbFullAppRouteState.svelte';

  // Capture the original history.back function so we can restore it on destroy.
  // We override it to routeState.back to ensure the back button works correctly in the Storybook
  // story which doesn't use the real browser history.
  const originalHistoryBack = history.back.bind(history);

  const marketingUrls = new Set(Object.values(marketingPages).map((page) => page.url));
  const isMarketing = $derived(marketingUrls.has(routeState.path));

  onMount(() => {
    timerService.init();
    history.back = () => routeState.back();
  });

  onDestroy(() => {
    history.back = originalHistoryBack;
  });
</script>

{#if isMarketing}
  <main class="[view-transition-name:main-content]">
    <SBFullAppRouter />
  </main>
{:else}
  <TopBar username="Storybook" currentPath={routeState.path} />
  <NavBar currentPath={routeState.path} />
  <main class="md:pt-(--top-nav-height) pb-(--bottom-nav-height) md:pb-0 md:pl-48">
    <SBFullAppRouter />
  </main>
{/if}
