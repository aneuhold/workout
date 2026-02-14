<!--
  @component

  Expandable card displaying an equipment type with linked exercises,
  weight options, and action buttons.
-->
<script lang="ts">
  import type { WorkoutEquipmentType } from '@aneuhold/core-ts-db-lib';
  import { IconChevronDown, IconChevronUp, IconPencil, IconTrash } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Separator from '$ui/Separator/Separator.svelte';

  let {
    equipmentType,
    showTypeLabel,
    expanded,
    onToggle
  }: {
    equipmentType: WorkoutEquipmentType;
    showTypeLabel: boolean;
    expanded: boolean;
    onToggle: () => void;
  } = $props();

  let exercises = $derived(exerciseMapService.getDocs());

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

<div
  class="bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl text-sm ring-1 ring-foreground/10"
>
  <button
    class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
    onclick={onToggle}
  >
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      {#if showTypeLabel}
        <span class="text-xs text-muted-foreground">Equipment</span>
      {/if}
      <span class="font-medium">{equipmentType.title}</span>
      <span class="text-xs text-muted-foreground">
        Used in {linkedExercises.length} exercise{linkedExercises.length !== 1 ? 's' : ''}
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
      {#if linkedExercises.length > 0}
        <div>
          <span class="text-xs text-muted-foreground">Used by</span>
          <ul class="mt-1 flex flex-col gap-0.5">
            {#each linkedExercises as exercise (exercise._id)}
              <li>
                <button class="text-left text-primary hover:underline">
                  {exercise.exerciseName}
                </button>
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
        <Button variant="outline" size="sm">
          <IconPencil size={14} />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={linkedExercises.length > 0}
          title={linkedExercises.length > 0 ? 'Remove from all exercises first' : undefined}
        >
          <IconTrash size={14} />
          Delete
        </Button>
      </div>
    </div>
  {/if}
</div>
