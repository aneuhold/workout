<!--
  @component

  Current week's sessions shown as a flat list of session cards (always expanded).
-->
<script lang="ts">
  import type {
    WorkoutMicrocycle,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import SessionCard from '$components/SessionCard/SessionCard.svelte';
  import { SessionStatus } from '$components/SessionCard/sessionCardTypes';
  import { getSessionStatus } from '$components/SessionCard/sessionCardUtils';
  import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';

  let {
    microcycle,
    weekNumber,
    inProgressSessionId,
    nextUpSessionId
  }: {
    microcycle: WorkoutMicrocycle;
    weekNumber: number;
    inProgressSessionId: string | null;
    nextUpSessionId: string | null;
  } = $props();

  const sessions = $derived(microcycleMapService.getOrderedSessionsForMicrocycle(microcycle));

  function getExercisesForSession(session: WorkoutSession): WorkoutSessionExercise[] {
    return sessionMapService.getOrderedSessionExercisesForSession(session);
  }

  function getSetsForSession(session: WorkoutSession): WorkoutSet[] {
    return sessionMapService.getOrderedSetsForSession(session);
  }

  function getStatus(session: WorkoutSession): SessionStatus {
    return getSessionStatus(
      session,
      getSetsForSession(session),
      getExercisesForSession(session),
      session._id === inProgressSessionId,
      session._id === nextUpSessionId
    );
  }
</script>

<div class="flex flex-col gap-2">
  <span class="text-sm font-medium">This Week · Week {weekNumber}</span>
  <div class="flex flex-col gap-2">
    {#each sessions as session (session._id)}
      <SessionCard
        {session}
        status={getStatus(session)}
        sessionExercises={getExercisesForSession(session)}
        sets={getSetsForSession(session)}
      />
    {/each}
  </div>
</div>
