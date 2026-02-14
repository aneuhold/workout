<!--
  @component

  Expandable card displaying a muscle group with linked exercises
  and action buttons.
-->
<script lang="ts">
  import type { WorkoutMuscleGroup } from '@aneuhold/core-ts-db-lib';
  import { IconChevronDown, IconChevronUp, IconPencil, IconTrash } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Separator from '$ui/Separator/Separator.svelte';

  let {
    muscleGroup,
    showTypeLabel,
    expanded,
    onToggle
  }: {
    muscleGroup: WorkoutMuscleGroup;
    showTypeLabel: boolean;
    expanded: boolean;
    onToggle: () => void;
  } = $props();

  let exercises = $derived(exerciseMapService.getDocs());

  function exercisesForMuscleGroup(muscleGroupId: UUID) {
    return {
      primary: exercises.filter((exercise) => exercise.primaryMuscleGroups.includes(muscleGroupId)),
      secondary: exercises.filter((exercise) =>
        exercise.secondaryMuscleGroups.includes(muscleGroupId)
      )
    };
  }

  function exerciseCountForMuscleGroup(muscleGroupId: UUID): number {
    return exercises.filter(
      (exercise) =>
        exercise.primaryMuscleGroups.includes(muscleGroupId) ||
        exercise.secondaryMuscleGroups.includes(muscleGroupId)
    ).length;
  }

  let linkedExercises = $derived(exercisesForMuscleGroup(muscleGroup._id));
  let exerciseCount = $derived(exerciseCountForMuscleGroup(muscleGroup._id));
</script>

<div
  class="bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl text-sm ring-1 ring-foreground/10"
>
  <button
    class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
    onclick={onToggle}
  >
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      {#if showTypeLabel}
        <span class="text-xs text-muted-foreground">Muscle Group</span>
      {/if}
      <span class="font-medium">{muscleGroup.name}</span>
      <span class="text-xs text-muted-foreground">
        Used in {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
      </span>
    </div>
    {#if expanded}
      <IconChevronUp size={16} class="shrink-0 text-muted-foreground" />
    {:else}
      <IconChevronDown size={16} class="shrink-0 text-muted-foreground" />
    {/if}
  </button>

  {#if expanded}
    <Separator />
    <div class="flex flex-col gap-3 px-3 py-3">
      {#if linkedExercises.primary.length > 0}
        <div>
          <span class="text-xs text-muted-foreground">Primary in</span>
          <ul class="mt-1 flex flex-col gap-0.5">
            {#each linkedExercises.primary as exercise (exercise._id)}
              <li>
                <button class="text-left text-primary hover:underline">
                  {exercise.exerciseName}
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
      {#if linkedExercises.secondary.length > 0}
        <div>
          <span class="text-xs text-muted-foreground">Secondary in</span>
          <ul class="mt-1 flex flex-col gap-0.5">
            {#each linkedExercises.secondary as exercise (exercise._id)}
              <li>
                <button class="text-left text-primary hover:underline">
                  {exercise.exerciseName}
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
      {#if linkedExercises.primary.length === 0 && linkedExercises.secondary.length === 0}
        <p class="text-xs text-muted-foreground">No exercises use this muscle group yet.</p>
      {/if}

      {#if muscleGroup.description}
        <div>
          <span class="text-xs text-muted-foreground">Description</span>
          <p class="mt-0.5">{muscleGroup.description}</p>
        </div>
      {/if}

      <div class="flex gap-2">
        <Button variant="outline" size="sm">
          <IconPencil size={14} />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={exerciseCount > 0}
          title={exerciseCount > 0 ? 'Remove from all exercises first' : undefined}
        >
          <IconTrash size={14} />
          Delete
        </Button>
      </div>
    </div>
  {/if}
</div>
