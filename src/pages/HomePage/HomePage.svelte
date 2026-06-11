<!--
  @component

  Root component for the home page. Orchestrates data and renders dashboard sections.
-->
<script lang="ts">
  import mesocycleMapService from '$services/documentMapServices/MesocycleMap.service.svelte';
  import microcycleMapService from '$services/documentMapServices/MicrocycleMap.service.svelte';
  import sessionMapService from '$services/documentMapServices/SessionMap.service.svelte';
  import { PerfMark } from '$util/perfMarks';
  import HomePageEmptyState from './HomePageEmptyState.svelte';
  import HomePageFreeFormSessions from './HomePageFreeFormSessions.svelte';
  import HomePageHeroCard from './HomePageHeroCard';
  import HomePageMesocycleOverview from './HomePageMesocycleOverview.svelte';
  import HomePagePendingLogs from './HomePagePendingLogs.svelte';
  import HomePageQuickLinks from './HomePageQuickLinks.svelte';
  import HomePageRecentSessions from './HomePageRecentSessions.svelte';
  import {
    getCurrentMicrocycle,
    getPendingReviewSessions,
    getRecentCompletedSessions
  } from './homePageUtils';
  import HomePageWeekSessions from './HomePageWeekSessions.svelte';

  const activeMesocycle = $derived(mesocycleMapService.categorizedMesocycles.active);

  const docs = $derived(
    activeMesocycle
      ? mesocycleMapService.getAssociatedDocsAndCTOsForMesocycle(activeMesocycle._id)
      : null
  );

  const microcycles = $derived(
    activeMesocycle
      ? microcycleMapService.getOrderedMicrocyclesForMesocycle(activeMesocycle._id)
      : []
  );

  const inProgressSession = $derived(mesocycleMapService.activeAndNextSessions.inProgressSession);
  const nextUpSession = $derived(mesocycleMapService.activeAndNextSessions.nextUpSession);

  const pendingLogs = $derived(docs ? getPendingReviewSessions(docs.sessions) : []);

  const currentMicrocycleInfo = $derived(
    getCurrentMicrocycle(microcycles, docs?.sessions ?? [], inProgressSession, nextUpSession)
  );

  const allRecentSessions = $derived(getRecentCompletedSessions(sessionMapService.allDocs));

  // Performance tracking
  let homeRenderedMarked = false;
  $effect(() => {
    if (!homeRenderedMarked && activeMesocycle && docs) {
      homeRenderedMarked = true;
      performance.mark(PerfMark.HomeRendered);
    }
  });
</script>

<div class="flex flex-col gap-4 p-4">
  {#if activeMesocycle && docs}
    <HomePageMesocycleOverview
      mesocycle={activeMesocycle}
      sortedMicrocycles={microcycles}
      sessions={docs.sessions}
    />
  {/if}
  <HomePageHeroCard
    {activeMesocycle}
    {microcycles}
    sessions={docs?.sessions ?? []}
    {inProgressSession}
    {nextUpSession}
    {pendingLogs}
  />
  {#if pendingLogs.length}
    <HomePagePendingLogs {pendingLogs} />
  {/if}
  {#if currentMicrocycleInfo}
    <HomePageWeekSessions
      microcycle={currentMicrocycleInfo.microcycle}
      weekNumber={currentMicrocycleInfo.weekNumber}
      inProgressSessionId={inProgressSession?._id}
      nextUpSessionId={nextUpSession?._id}
    />
  {/if}
  {#if sessionMapService.freeFormSessions.inProgress.length > 0 || sessionMapService.freeFormSessions.planned.length > 0}
    <HomePageFreeFormSessions />
  {/if}
  {#if allRecentSessions.length}
    <HomePageRecentSessions recentSessions={allRecentSessions} />
  {/if}
  {#if activeMesocycle || sessionMapService.freeFormSessions.inProgress.length > 0}
    <HomePageQuickLinks />
  {:else}
    <HomePageEmptyState />
  {/if}
</div>
