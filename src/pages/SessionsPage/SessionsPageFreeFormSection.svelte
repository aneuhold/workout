<!--
  @component

  Free-form sessions section on the sessions page. Shows in-progress and
  completed free-form sessions with a button to start a new one.
-->
<script lang="ts">
  import { WorkoutSetService } from '@aneuhold/core-ts-db-lib';
  import { IconPlus } from '@tabler/icons-svelte';
  import { goto } from '$app/navigation';
  import SessionCard from '$components/SessionCard/SessionCard.svelte';
  import { SessionStatus } from '$components/SessionCard/sessionCardTypes';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
  import Button from '$ui/Button/Button.svelte';

  const { freeFormSessions } = sessionMapService;

  const inProgressStatus = $derived.by(() => {
    const session = freeFormSessions.inProgress;
    if (!session) return SessionStatus.NextUp;
    const sets = sessionMapService.getOrderedSetsForSession(session);
    return sets.some((s) => WorkoutSetService.isCompleted(s))
      ? SessionStatus.InProgress
      : SessionStatus.NextUp;
  });

  function handleStartFreeForm() {
    const session = sessionMapService.createFreeFormSession();
    goto(`/session?sessionId=${session._id}`);
  }
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-center justify-between">
    <h2 class="text-sm font-semibold">Free-Form Sessions</h2>
    <Button variant="outline" size="sm" onclick={handleStartFreeForm}>
      <IconPlus size={14} />
      New Workout
    </Button>
  </div>
  {#if freeFormSessions.inProgress}
    <SessionCard
      session={freeFormSessions.inProgress}
      status={inProgressStatus}
      sessionExercises={sessionMapService.getOrderedSessionExercisesForSession(
        freeFormSessions.inProgress
      )}
      sets={sessionMapService.getOrderedSetsForSession(freeFormSessions.inProgress)}
    />
  {/if}
  {#each freeFormSessions.completed as session (session._id)}
    <SessionCard
      {session}
      status={SessionStatus.Completed}
      sessionExercises={sessionMapService.getOrderedSessionExercisesForSession(session)}
      sets={sessionMapService.getOrderedSetsForSession(session)}
    />
  {/each}
  {#if !freeFormSessions.inProgress && freeFormSessions.completed.length === 0}
    <p class="text-xs text-muted-foreground">No free-form sessions yet.</p>
  {/if}
</div>
