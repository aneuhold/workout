<!--
  @component

  Clickable collapse header for a session exercise card.
  Shows status icon, exercise name with external link, and metadata badges.
-->
<script lang="ts">
  import type { WorkoutExercise, WorkoutSessionExercise } from '@aneuhold/core-ts-db-lib';
  import { IconCheck, IconChevronDown } from '@tabler/icons-svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import { SessionPageExerciseCardState } from '../sessionPageTypes';

  let {
    exercise,
    sessionExercise,
    expanded,
    cardState,
    repRange,
    onToggle
  }: {
    exercise: WorkoutExercise | undefined;
    sessionExercise: WorkoutSessionExercise;
    expanded: boolean;
    cardState: SessionPageExerciseCardState;
    repRange: { min: number; max: number } | null;
    onToggle: () => void;
  } = $props();
</script>

<button
  class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
  onclick={onToggle}
>
  <div class="flex w-4 shrink-0 items-center justify-center">
    {#if cardState === SessionPageExerciseCardState.Completed}
      <IconCheck size={16} class="text-green-600" />
    {:else if cardState === SessionPageExerciseCardState.Current}
      <span class="relative flex h-2.5 w-2.5">
        <span
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
        ></span>
        <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
      </span>
    {/if}
  </div>

  <div class="flex min-w-0 flex-1 flex-col gap-1">
    <span class="font-medium">
      {exercise?.exerciseName ?? 'Unknown Exercise'}
    </span>
    <div class="flex flex-wrap gap-1">
      {#if repRange && exercise}
        <Badge variant="outline">
          {repRange.min}-{repRange.max} reps ({exercise.repRange})
        </Badge>
      {/if}
      {#if sessionExercise.isRecoveryExercise}
        <Badge variant="outline" class="border-amber-500 text-amber-600 dark:text-amber-400">
          Recovery
        </Badge>
      {/if}
      {#if exercise}
        {#each exercise.primaryMuscleGroups as muscleGroupId (muscleGroupId)}
          <Badge variant="secondary">
            {muscleGroupMapService.getMuscleGroupName(muscleGroupId)}
          </Badge>
        {/each}
      {/if}
    </div>
  </div>

  <IconChevronDown
    size={16}
    class="shrink-0 text-muted-foreground transition-transform duration-200
      {expanded ? 'rotate-180' : ''}"
  />
</button>
