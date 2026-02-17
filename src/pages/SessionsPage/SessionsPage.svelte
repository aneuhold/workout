<!--
  @component

  Root component for the sessions page.
  Shows all sessions in the active mesocycle grouped by microcycle (week).
-->
<script lang="ts">
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
  import SessionsPageEmptyState from './SessionsPageEmptyState.svelte';
  import SessionsPageHeader from './SessionsPageHeader.svelte';
  import SessionsPageWeekGroup from './SessionsPageWeekGroup.svelte';

  const activeMesocycle = $derived(mesocycleMapService.getActiveMesocycle());

  const docs = $derived(
    activeMesocycle ? mesocycleMapService.getAssociatedDocsForMesocycle(activeMesocycle._id) : null
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

  // Detect deload: last microcycle where all sets have plannedRir == null
  function isDeloadMicrocycle(microcycleIndex: number): boolean {
    return microcycleIndex === microcycles.length - 1 && microcycles.length > 1;
  }
</script>

<div class="flex flex-col gap-4 p-4">
  {#if activeMesocycle && docs}
    <SessionsPageHeader {mesocycleTitle} />

    {#each microcycles as mc, i (mc._id)}
      <SessionsPageWeekGroup
        microcycle={mc}
        weekNumber={i + 1}
        isDeload={isDeloadMicrocycle(i)}
        {inProgressSessionId}
        {nextUpSessionId}
      />
    {/each}
  {:else}
    <SessionsPageEmptyState />
  {/if}
</div>
