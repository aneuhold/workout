<!--
  @component

  Root component for the home page. Orchestrates data and renders dashboard sections.
-->
<script lang="ts">
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
  import HomePageEmptyState from './HomePageEmptyState.svelte';
  import HomePageHeroCard from './HomePageHeroCard.svelte';
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

  const activeMesocycle = $derived(mesocycleMapService.getActiveMesocycle());

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

  const recentSessions = $derived(docs ? getRecentCompletedSessions(docs.sessions) : []);
</script>

<div class="flex flex-col gap-4 p-4">
  {#if activeMesocycle && docs}
    <HomePageMesocycleOverview
      mesocycle={activeMesocycle}
      sortedMicrocycles={microcycles}
      sessions={docs.sessions}
    />
    <HomePageHeroCard
      {activeMesocycle}
      {microcycles}
      sessions={docs.sessions}
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
        inProgressSessionId={inProgressSession?._id ?? null}
        nextUpSessionId={nextUpSession?._id ?? null}
      />
    {/if}
    {#if recentSessions.length}
      <HomePageRecentSessions {recentSessions} />
    {/if}
    <HomePageQuickLinks />
  {:else}
    <HomePageEmptyState />
  {/if}
</div>
