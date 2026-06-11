<!--
  @component

  Section showing in-progress and upcoming planned free-form sessions on the
  home page. Only renders when there is at least one in-progress or planned
  free-form session. Shows the in-progress session first, then up to 2 upcoming
  planned sessions (nearest date first).
-->
<script lang="ts">
  import type { WorkoutSession } from '@aneuhold/core-ts-db-lib';
  import { WorkoutSetService } from '@aneuhold/core-ts-db-lib';
  import SessionCard from '$components/SessionCard/SessionCard.svelte';
  import { SessionStatus } from '$components/SessionCard/sessionCardTypes';
  import sessionMapService from '$services/documentMapServices/SessionMap.service.svelte';

  const { freeFormSessions } = sessionMapService;

  const inProgressSession: WorkoutSession | undefined = $derived(freeFormSessions.inProgress[0]);

  const upcomingPlanned = $derived(freeFormSessions.planned.slice(0, 2));

  /**
   * Returns the in-progress status for a session based on whether any set has
   * been completed.
   *
   * @param session The session to check
   */
  function getInProgressStatus(session: WorkoutSession): SessionStatus {
    const sets = sessionMapService.getOrderedSetsForSession(session);
    return sets.some((s) => WorkoutSetService.isCompleted(s))
      ? SessionStatus.InProgress
      : SessionStatus.NextUp;
  }
</script>

<div class="flex flex-col gap-2">
  <span class="text-sm font-medium">Free-Form Workouts</span>
  <div class="flex flex-col gap-2">
    {#if inProgressSession}
      <SessionCard
        session={inProgressSession}
        status={getInProgressStatus(inProgressSession)}
        sessionExercises={sessionMapService.getOrderedSessionExercisesForSession(inProgressSession)}
        sets={sessionMapService.getOrderedSetsForSession(inProgressSession)}
      />
    {/if}
    {#each upcomingPlanned as session (session._id)}
      <SessionCard
        {session}
        status={SessionStatus.Upcoming}
        sessionExercises={sessionMapService.getOrderedSessionExercisesForSession(session)}
        sets={sessionMapService.getOrderedSetsForSession(session)}
      />
    {/each}
  </div>
</div>
