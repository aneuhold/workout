<!--
  @component

  Clickable card for a single session, showing status badge and relevant stats.
-->
<script lang="ts">
  import type {
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import { WorkoutSessionExerciseService } from '@aneuhold/core-ts-db-lib';
  import { IconChevronRight } from '@tabler/icons-svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Card from '$ui/Card/Card.svelte';
  import Progress from '$ui/Progress/Progress.svelte';
  import { SessionStatus } from './sessionCardTypes';
  import { computeSessionRsmTotal, countCompletedSets } from './sessionCardUtils';

  let {
    session,
    status,
    sessionExercises,
    sets
  }: {
    session: WorkoutSession;
    status: SessionStatus;
    sessionExercises: WorkoutSessionExercise[];
    sets: WorkoutSet[];
  } = $props();

  const totalSets = $derived(sets.length);
  const completed = $derived(countCompletedSets(sets));
  const percent = $derived(totalSets > 0 ? Math.round((completed / totalSets) * 100) : 0);
  const exerciseCount = $derived(sessionExercises.length);
  const rsmTotal = $derived(computeSessionRsmTotal(sessionExercises));

  const exercisesNeedingReview = $derived(
    status === SessionStatus.Review
      ? sessionExercises.filter((se) => {
          const seSets = sets.filter((s) => s.workoutSessionExerciseId === se._id);
          return WorkoutSessionExerciseService.needsReview(se, seSets);
        }).length
      : 0
  );

  const plannedRir = $derived.by(() => {
    for (const s of sets) {
      if (s.plannedRir != null) return s.plannedRir;
    }
    return null;
  });

  const isHighlighted = $derived(
    status === SessionStatus.InProgress || status === SessionStatus.NextUp
  );
</script>

<a href="/session?sessionId={session._id}" class="block">
  <Card
    size="sm"
    class="cursor-pointer transition-colors {isHighlighted
      ? 'ring-primary/30 ring-2'
      : ''} {status === SessionStatus.Upcoming ? 'opacity-60' : ''}"
  >
    <div class="flex items-center gap-3 px-3 py-1">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="truncate text-sm font-medium">{session.title}</span>
          {#if status === SessionStatus.Completed}
            <Badge variant="default" class="shrink-0 bg-green-600">Done</Badge>
          {:else if status === SessionStatus.Review}
            <Badge variant="outline" class="shrink-0 border-amber-500 text-amber-500">Review</Badge>
          {:else if status === SessionStatus.InProgress}
            <Badge variant="secondary" class="shrink-0">In Progress</Badge>
          {:else if status === SessionStatus.NextUp}
            <Badge variant="outline" class="shrink-0 border-primary text-primary">Next</Badge>
          {/if}
        </div>

        <div class="mt-1 flex flex-col gap-1">
          {#if status === SessionStatus.InProgress}
            <Progress value={percent} max={100} class="h-1.5" />
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{completed}/{totalSets} sets</span>
              <span>·</span>
              <span>{exerciseCount} exercises</span>
            </div>
          {:else if status === SessionStatus.Review}
            <div class="text-xs text-muted-foreground">
              <span>{exerciseCount} exercises</span>
              <span>·</span>
              <span class="text-amber-500">{exercisesNeedingReview} need review</span>
            </div>
          {:else if status === SessionStatus.Completed}
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{exerciseCount} exercises</span>
              <span>·</span>
              <span>{totalSets} sets</span>
              {#if rsmTotal != null}
                <span>·</span>
                <span>RSM {rsmTotal}</span>
              {/if}
            </div>
          {:else if status === SessionStatus.NextUp}
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{exerciseCount} exercises</span>
              <span>·</span>
              <span>{totalSets} sets</span>
              {#if plannedRir != null}
                <span>·</span>
                <span>{plannedRir} RIR</span>
              {/if}
            </div>
          {:else}
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{exerciseCount} exercises</span>
              <span>·</span>
              <span>{totalSets} sets</span>
            </div>
          {/if}
        </div>
      </div>

      <IconChevronRight size={16} class="shrink-0 text-muted-foreground" />
    </div>
  </Card>
</a>
