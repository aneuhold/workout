<!--
  @component

  Expandable card displaying an equipment type with linked exercises,
  weight options, and action buttons.
-->
<script lang="ts">
  import type { WorkoutEquipmentType } from '@aneuhold/core-ts-db-lib';
  import { IconPencil, IconTrash } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import Button from '$ui/Button/Button.svelte';
  import LibraryPageCard from './LibraryPageCard.svelte';

  let {
    equipmentType,
    showTypeLabel,
    expanded,
    onToggle,
    onEdit,
    onDelete,
    onExerciseClick
  }: {
    equipmentType: WorkoutEquipmentType;
    showTypeLabel: boolean;
    expanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onExerciseClick: (exerciseId: UUID) => void;
  } = $props();

  let exercises = $derived(exerciseMapService.allDocs);

  function exercisesForEquipment(equipmentTypeId: UUID) {
    return exercises.filter((exercise) => exercise.workoutEquipmentTypeId === equipmentTypeId);
  }

  function weightOptionsSummary(et: WorkoutEquipmentType): string | undefined {
    if (!et.weightOptions || et.weightOptions.length === 0) return undefined;
    const options = et.weightOptions;
    return `${options[0]}–${options[options.length - 1]} lb (${options.length} options)`;
  }

  let linkedExercises = $derived(exercisesForEquipment(equipmentType._id));
  let weightSummary = $derived(weightOptionsSummary(equipmentType));
</script>

<LibraryPageCard typeLabel={showTypeLabel ? 'Equipment' : null} {expanded} {onToggle}>
  {#snippet header()}
    <span class="font-medium">{equipmentType.title}</span>
    {#if equipmentType.description}
      <span class="text-xs text-muted-foreground">{equipmentType.description}</span>
    {/if}
    <span class="text-xs text-muted-foreground">
      Used in {linkedExercises.length} exercise{linkedExercises.length !== 1 ? 's' : ''}
    </span>
  {/snippet}

  {#snippet body()}
    {#if linkedExercises.length > 0}
      <div>
        <span class="text-xs text-muted-foreground">Used by</span>
        <ul class="mt-1 flex flex-col gap-0.5">
          {#each linkedExercises as exercise (exercise._id)}
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
    {:else}
      <p class="text-xs text-muted-foreground">No exercises use this equipment yet.</p>
    {/if}

    {#if weightSummary}
      <div>
        <span class="text-xs text-muted-foreground">Weight Options</span>
        <p class="mt-0.5">{weightSummary}</p>
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
        disabled={linkedExercises.length > 0}
        title={linkedExercises.length > 0 ? 'Remove from all exercises first' : undefined}
        onclick={onDelete}
      >
        <IconTrash size={14} />
        Delete
      </Button>
    </div>
  {/snippet}
</LibraryPageCard>
