<!--
  @component

  Expandable card displaying a workout exercise with calibration data,
  muscle groups, and action buttons.
-->
<script lang="ts">
  import {
    type WorkoutExercise,
    type WorkoutExerciseCalibration,
    WorkoutExerciseCalibrationService,
    WorkoutExerciseService
  } from '@aneuhold/core-ts-db-lib';
  import {
    IconAlertTriangle,
    IconBarbell,
    IconCheck,
    IconChevronDown,
    IconChevronUp,
    IconPencil,
    IconTrash
  } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import { SvelteMap } from 'svelte/reactivity';
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Separator from '$ui/Separator/Separator.svelte';

  let {
    exercise,
    showTypeLabel,
    expanded,
    onToggle
  }: {
    exercise: WorkoutExercise;
    showTypeLabel: boolean;
    expanded: boolean;
    onToggle: () => void;
  } = $props();

  function getMuscleGroupName(id: UUID): string {
    const muscleGroup = muscleGroupMapService.getDoc(id);
    return muscleGroup?.name ?? 'Unknown';
  }

  function getEquipmentName(id: UUID): string {
    const equipmentType = equipmentTypeMapService.getDoc(id);
    return equipmentType?.title ?? 'Unknown';
  }

  let calibrationsByExerciseId = $derived.by(() => {
    const map = new SvelteMap<UUID, WorkoutExerciseCalibration[]>();
    for (const c of exerciseCalibrationMapService.getDocs()) {
      const existing = map.get(c.workoutExerciseId);
      if (existing) {
        existing.push(c);
      } else {
        map.set(c.workoutExerciseId, [c]);
      }
    }
    return map;
  });
  let calibrations = $derived(calibrationsByExerciseId.get(exercise._id) ?? []);
  let latestCalibration = $derived(calibrations[calibrations.length - 1]);
  let repRange = $derived(WorkoutExerciseService.getRepRangeValues(exercise.repRange));
</script>

<div
  class="bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl text-sm ring-1 ring-foreground/10"
>
  <button
    class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
    onclick={onToggle}
  >
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      {#if showTypeLabel}
        <span class="text-xs text-muted-foreground">Exercise</span>
      {/if}
      <div class="flex items-center gap-1.5">
        <span class="font-medium">{exercise.exerciseName}</span>
        {#if !latestCalibration}
          <IconAlertTriangle size={14} class="shrink-0 text-amber-500" />
        {/if}
      </div>
      <div class="flex flex-wrap gap-1">
        <Badge variant="outline">
          {repRange.min}-{repRange.max} reps ({exercise.repRange})
        </Badge>
        {#each exercise.primaryMuscleGroups as muscleGroupId (muscleGroupId)}
          <Badge variant="secondary">{getMuscleGroupName(muscleGroupId)}</Badge>
        {/each}
      </div>
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
      <!-- Properties grid -->
      <div class="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div>
          <span class="text-xs text-muted-foreground">Equipment</span>
          <p>{getEquipmentName(exercise.workoutEquipmentTypeId)}</p>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Progression</span>
          <p>{exercise.preferredProgressionType}</p>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Rest Time</span>
          <p>{exercise.restSeconds ?? '—'}s</p>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Rep Range</span>
          <p>{repRange.min}-{repRange.max} ({exercise.repRange})</p>
        </div>
      </div>

      <!-- Muscle groups -->
      <div>
        <span class="text-xs text-muted-foreground">Muscle Groups</span>
        <div class="mt-1 flex flex-wrap gap-1">
          {#each exercise.primaryMuscleGroups as muscleGroupId (muscleGroupId)}
            <Badge>{getMuscleGroupName(muscleGroupId)}</Badge>
          {/each}
          {#each exercise.secondaryMuscleGroups as muscleGroupId (muscleGroupId)}
            <Badge variant="outline">{getMuscleGroupName(muscleGroupId)}</Badge>
          {/each}
        </div>
      </div>

      <!-- Notes -->
      {#if exercise.notes}
        <div>
          <span class="text-xs text-muted-foreground">Notes</span>
          <p class="mt-0.5">{exercise.notes}</p>
        </div>
      {/if}

      <!-- Calibration -->
      <Separator />
      {#if latestCalibration}
        <div class="rounded-lg bg-muted/50 p-3">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconCheck size={14} class="text-green-600" />
            Calibrated on {latestCalibration.dateRecorded.toLocaleDateString()}
          </div>
          <div class="mt-2 grid grid-cols-3 text-center">
            <div>
              <span class="text-xs text-muted-foreground">Weight</span>
              <p class="font-medium">{latestCalibration.weight} lb</p>
            </div>
            <div>
              <span class="text-xs text-muted-foreground">Reps</span>
              <p class="font-medium">{latestCalibration.reps}</p>
            </div>
            <div>
              <span class="text-xs text-muted-foreground">Est. 1RM</span>
              <p class="font-medium">
                {Math.round(WorkoutExerciseCalibrationService.get1RM(latestCalibration))} lb
              </p>
            </div>
          </div>
        </div>
      {:else}
        <div
          class="rounded-lg border border-amber-300/50 bg-amber-50 p-3 dark:border-amber-600/30 dark:bg-amber-950/30"
        >
          <div class="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
            <IconAlertTriangle size={14} />
            Not Calibrated
          </div>
          <p class="mt-1 text-xs text-amber-600 dark:text-amber-500">
            Calibration data is needed for accurate load recommendations.
          </p>
        </div>
        <Button variant="outline" size="sm" class="w-full">
          <IconBarbell size={14} />
          Add Calibration
        </Button>
      {/if}

      <!-- Actions -->
      <div class="flex gap-2">
        <Button variant="outline" size="sm">
          <IconPencil size={14} />
          Edit
        </Button>
        <Button variant="destructive" size="sm">
          <IconTrash size={14} />
          Delete
        </Button>
      </div>
    </div>
  {/if}
</div>
