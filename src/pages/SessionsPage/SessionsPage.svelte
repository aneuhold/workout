<!--
  @component

  Root component for the sessions page.
  Shows all sessions in the active mesocycle grouped by microcycle,
  plus a free-form sessions section for sessions without a microcycle.
-->
<script lang="ts">
  import { WorkoutMesocycleService } from '@aneuhold/core-ts-db-lib';
  import StaggerItem from '$components/StaggerItem/StaggerItem.svelte';
  import mesocycleMapService from '$services/documentMapServices/MesocycleMap.service.svelte';
  import microcycleMapService from '$services/documentMapServices/MicrocycleMap.service.svelte';
  import sessionMapService from '$services/documentMapServices/SessionMap.service.svelte';
  import { PerfMark } from '$util/perfMarks';
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

  const currentMicrocycle = $derived(WorkoutMesocycleService.getCurrentMicrocycle(microcycles));

  const inProgressSessionId = $derived(
    mesocycleMapService.activeAndNextSessions.inProgressSession?._id ?? null
  );
  const nextUpSessionId = $derived(
    mesocycleMapService.activeAndNextSessions.nextUpSession?._id ?? null
  );

  const mesocycleTitle = $derived(activeMesocycle?.title || 'Untitled Mesocycle');

  const hasFreeForm = $derived(
    sessionMapService.freeFormSessions.inProgress.length > 0 ||
      sessionMapService.freeFormSessions.planned.length > 0 ||
      sessionMapService.freeFormSessions.completed.length > 0
  );

  // Performance tracking
  let sessionsListRenderedMarked = false;
  $effect(() => {
    if (!sessionsListRenderedMarked && activeMesocycle && docs) {
      sessionsListRenderedMarked = true;
      performance.mark(PerfMark.SessionsListRendered);
    }
  });
</script>

<div class="flex flex-col gap-4 p-4">
  {#if activeMesocycle && docs}
    <SessionsPageHeader {mesocycleTitle} />

    {#each microcycles as mc, i (mc._id)}
      <StaggerItem index={i}>
        <SessionsPageWeekGroup
          microcycle={mc}
          label={microcycleMapService.getMicrocycleLabel(activeMesocycle, i, microcycles.length)}
          isCurrent={mc === currentMicrocycle}
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
