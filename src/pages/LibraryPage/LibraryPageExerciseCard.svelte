<!--
  @component

  Expandable card displaying a workout exercise with calibration data,
  muscle groups, and action buttons.
-->
<script lang="ts">
  import {
    type WorkoutExercise,
    WorkoutExerciseCalibrationService,
    WorkoutExerciseService
  } from '@aneuhold/core-ts-db-lib';
  import {
    IconAlertTriangle,
    IconBarbell,
    IconCheck,
    IconEye,
    IconTrash
  } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import equipmentTypeMapService from '$services/documentMapServices/EquipmentTypeMap.service.svelte';
  import exerciseMapService from '$services/documentMapServices/ExerciseMap.service.svelte';
  import muscleGroupMapService from '$services/documentMapServices/MuscleGroupMap.service.svelte';
  import Alert from '$ui/Alert/Alert.svelte';
  import AlertDescription from '$ui/Alert/AlertDescription.svelte';
  import AlertTitle from '$ui/Alert/AlertTitle.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import LibraryPageCard from './LibraryPageCard.svelte';

  let {
    exercise,
    showTypeLabel,
    expanded,
    onToggle,
    onViewDetails,
    onDelete,
    onAddCalibration
  }: {
    exercise: WorkoutExercise;
    showTypeLabel: boolean;
    expanded: boolean;
    onToggle: () => void;
    onViewDetails: () => void;
    onDelete: () => void;
    onAddCalibration: () => void;
  } = $props();

  function getEquipmentName(id: UUID): string {
    const equipmentType = equipmentTypeMapService.getDoc(id);
    return equipmentType?.title ?? 'Unknown';
  }

  let repRange = $derived(WorkoutExerciseService.getRepRangeValues(exercise.repRange));
  let bestCalibration = $derived(exerciseMapService.getCTO(exercise._id)?.bestCalibration ?? null);
</script>

<LibraryPageCard typeLabel={showTypeLabel ? 'Exercise' : null} {expanded} {onToggle}>
  {#snippet header()}
    <div class="flex items-center gap-1.5">
      <span class="font-medium">{exercise.exerciseName}</span>
      {#if !bestCalibration}
        <IconAlertTriangle size={14} class="shrink-0 text-warning" />
      {/if}
    </div>
    <div class="flex flex-wrap gap-1">
      <Badge variant="outline">
        {repRange.min}-{repRange.max} reps ({exercise.repRange})
      </Badge>
      {#each exercise.primaryMuscleGroups as muscleGroupId (muscleGroupId)}
        <Badge variant="secondary">{muscleGroupMapService.getMuscleGroupName(muscleGroupId)}</Badge>
      {/each}
    </div>
  {/snippet}

  {#snippet body()}
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
          <Badge>{muscleGroupMapService.getMuscleGroupName(muscleGroupId)}</Badge>
        {/each}
        {#each exercise.secondaryMuscleGroups as muscleGroupId (muscleGroupId)}
          <Badge variant="outline">{muscleGroupMapService.getMuscleGroupName(muscleGroupId)}</Badge>
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

    <!-- Strength / Calibration -->
    <Separator />
    {#if bestCalibration}
      <div class="rounded-lg bg-muted/50 p-3">
        <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconCheck size={14} class="text-success" />
          Best calibration on {bestCalibration.dateRecorded.toLocaleDateString()}
        </div>
        <div class="mt-2 grid grid-cols-3 text-center">
          <div>
            <span class="text-xs text-muted-foreground">Weight</span>
            <p class="font-medium">{bestCalibration.weight} lb</p>
          </div>
          <div>
            <span class="text-xs text-muted-foreground">Reps</span>
            <p class="font-medium">{bestCalibration.reps}</p>
          </div>
          <div>
            <span class="text-xs text-muted-foreground">Est. 1RM</span>
            <p class="font-medium">
              {Math.round(WorkoutExerciseCalibrationService.get1RM(bestCalibration))} lb
            </p>
          </div>
        </div>
      </div>
    {:else}
      <Alert variant="warn">
        <IconAlertTriangle />
        <AlertTitle>Not Calibrated</AlertTitle>
        <AlertDescription>
          Calibration data is needed for accurate load recommendations.
        </AlertDescription>
      </Alert>
      <Button variant="outline" size="sm" class="w-full" onclick={onAddCalibration}>
        <IconBarbell size={14} />
        Add Calibration
      </Button>
    {/if}

    <!-- Actions -->
    <div class="flex gap-2">
      <Button variant="outline" size="sm" onclick={onViewDetails}>
        <IconEye size={14} />
        Details
      </Button>
      <Button variant="destructive" size="sm" onclick={onDelete}>
        <IconTrash size={14} />
        Delete
      </Button>
    </div>
  {/snippet}
</LibraryPageCard>
