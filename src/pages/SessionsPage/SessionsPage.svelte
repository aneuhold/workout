<!--
  @component

  Root component for the sessions page.
  Shows all sessions in the active mesocycle grouped by microcycle (week),
  plus a free-form sessions section for sessions without a microcycle.
-->
<script lang="ts">
  import StaggerItem from '$components/StaggerItem/StaggerItem.svelte';
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
  import SessionsPageEmptyState from './SessionsPageEmptyState.svelte';
  import SessionsPageFreeFormSection from './SessionsPageFreeFormSection.svelte';
  import SessionsPageHeader from './SessionsPageHeader.svelte';
  import SessionsPageWeekGroup from './SessionsPageWeekGroup.svelte';

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

  const inProgressSessionId = $derived(
    mesocycleMapService.activeAndNextSessions.inProgressSession?._id ?? null
  );
  const nextUpSessionId = $derived(
    mesocycleMapService.activeAndNextSessions.nextUpSession?._id ?? null
  );

  const mesocycleTitle = $derived(activeMesocycle?.title || 'Untitled Mesocycle');

  const hasFreeForm = $derived(
    sessionMapService.freeFormSessions.inProgress != null ||
      sessionMapService.freeFormSessions.completed.length > 0
  );

  // Detect deload: last microcycle where all sets have plannedRir == null
  function isDeloadMicrocycle(microcycleIndex: number): boolean {
    return microcycleIndex === microcycles.length - 1 && microcycles.length > 1;
  }
</script>

<div class="flex flex-col gap-4 p-4">
  {#if activeMesocycle && docs}
    <SessionsPageHeader {mesocycleTitle} />

    {#each microcycles as mc, i (mc._id)}
      <StaggerItem index={i}>
        <SessionsPageWeekGroup
          microcycle={mc}
          weekNumber={i + 1}
          isDeload={isDeloadMicrocycle(i)}
          {inProgressSessionId}
          {nextUpSessionId}
        />
      </StaggerItem>
    {/each}
  {/if}

  {#if activeMesocycle || hasFreeForm}
    <SessionsPageFreeFormSection />
  {:else}
    <SessionsPageEmptyState />
  {/if}
</div>
