<!--
  @component

  Expandable card displaying a muscle group with linked exercises
  and action buttons.
-->
<script lang="ts">
  import type { WorkoutExercise, WorkoutMuscleGroup } from '@aneuhold/core-ts-db-lib';
  import { IconChevronDown, IconChevronUp, IconPencil, IconTrash } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Separator from '$ui/Separator/Separator.svelte';

  let {
    muscleGroup,
    showTypeLabel,
    expanded,
    onToggle,
    onEdit,
    onDelete,
    onExerciseClick
  }: {
    muscleGroup: WorkoutMuscleGroup;
    showTypeLabel: boolean;
    expanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onExerciseClick: (exerciseId: UUID) => void;
  } = $props();

  let exercises = $derived(exerciseMapService.getDocs());

  let linkedExercises = $derived.by(() => {
    const primary: WorkoutExercise[] = [];
    const secondary: WorkoutExercise[] = [];
    for (const exercise of exercises) {
      const isPrimary = exercise.primaryMuscleGroups.includes(muscleGroup._id);
      const isSecondary = exercise.secondaryMuscleGroups.includes(muscleGroup._id);
      if (isPrimary) primary.push(exercise);
      if (isSecondary) secondary.push(exercise);
    }
    return { primary, secondary };
  });
  let exerciseCount = $derived(
    new Set([
      ...linkedExercises.primary.map((e) => e._id),
      ...linkedExercises.secondary.map((e) => e._id)
    ]).size
  );
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
                <Button
                  variant="link"
                  class="h-auto p-0"
                  onclick={() => onExerciseClick(exercise._id)}
                >
                  {exercise.exerciseName}
                </Button>
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
                <Button
                  variant="link"
                  class="h-auto p-0"
                  onclick={() => onExerciseClick(exercise._id)}
                >
                  {exercise.exerciseName}
                </Button>
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
        <Button variant="outline" size="sm" onclick={onEdit}>
          <IconPencil size={14} />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={exerciseCount > 0}
          title={exerciseCount > 0 ? 'Remove from all exercises first' : undefined}
          onclick={onDelete}
        >
          <IconTrash size={14} />
          Delete
        </Button>
      </div>
    </div>
  {/if}
</div>
