<!--
  @component

  Read-only view for an exercise's details, calibration data, and actions.
-->
<script lang="ts">
  import {
    type WorkoutExercise,
    WorkoutExerciseCalibrationService,
    WorkoutExerciseService
  } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import { calibrationFormDialog } from '$components/singletons/dialogs/SingletonCalibrationFormDialog/SingletonCalibrationFormDialog.svelte';
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Separator from '$ui/Separator/Separator.svelte';

  let {
    exercise,
    onEdit
  }: {
    exercise: WorkoutExercise;
    onEdit: () => void;
  } = $props();

  // --- Data ---

  let calibrations = $derived(
    exerciseCalibrationMapService.getDocs().filter((c) => c.workoutExerciseId === exercise._id)
  );
  let latestCalibration = $derived(calibrations[calibrations.length - 1]);

  // --- Helpers ---

  function getEquipmentName(id: UUID): string {
    return equipmentTypeMapService.getDoc(id)?.title ?? 'Unknown';
  }
</script>

<div class="flex flex-col gap-4">
  <!-- Properties grid -->
  <div class="grid grid-cols-2 gap-x-4 gap-y-2">
    <div>
      <span class="text-xs text-muted-foreground">Equipment</span>
      <p class="text-sm">{getEquipmentName(exercise.workoutEquipmentTypeId)}</p>
    </div>
    <div>
      <span class="text-xs text-muted-foreground">Progression</span>
      <p class="text-sm">{exercise.preferredProgressionType}</p>
    </div>
    <div>
      <span class="text-xs text-muted-foreground">Rest Time</span>
      <p class="text-sm">{exercise.restSeconds ?? '—'}s</p>
    </div>
    <div>
      <span class="text-xs text-muted-foreground">Rep Range</span>
      <p class="text-sm">
        {WorkoutExerciseService.getRepRangeValues(exercise.repRange)
          .min}-{WorkoutExerciseService.getRepRangeValues(exercise.repRange).max} ({exercise.repRange})
      </p>
    </div>
  </div>

  <!-- Muscle groups -->
  <div>
    <span class="text-xs text-muted-foreground">Muscle Groups</span>
    <div class="mt-1 flex flex-wrap gap-1">
      {#each exercise.primaryMuscleGroups as mgId (mgId)}
        <Badge>{muscleGroupMapService.getMuscleGroupName(mgId)}</Badge>
      {/each}
      {#each exercise.secondaryMuscleGroups as mgId (mgId)}
        <Badge variant="outline">{muscleGroupMapService.getMuscleGroupName(mgId)}</Badge>
      {/each}
      {#if exercise.primaryMuscleGroups.length === 0 && exercise.secondaryMuscleGroups.length === 0}
        <span class="text-xs text-muted-foreground">None assigned</span>
      {/if}
    </div>
  </div>

  <!-- Notes -->
  {#if exercise.notes}
    <div>
      <span class="text-xs text-muted-foreground">Notes</span>
      <p class="mt-0.5 text-sm">{exercise.notes}</p>
    </div>
  {/if}

  <!-- Fatigue guess -->
  {#if exercise.initialFatigueGuess}
    <Separator />
    <div>
      <span class="text-xs text-muted-foreground">Fatigue Guess</span>
      <div class="mt-1 grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <span class="text-xs text-muted-foreground">Joint</span>
          <p class="font-medium">
            {exercise.initialFatigueGuess.jointAndTissueDisruption ?? '—'}
          </p>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Effort</span>
          <p class="font-medium">{exercise.initialFatigueGuess.perceivedEffort ?? '—'}</p>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Unused</span>
          <p class="font-medium">
            {exercise.initialFatigueGuess.unusedMusclePerformance ?? '—'}
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Calibration -->
  <Separator />
  {#if latestCalibration}
    <div class="rounded-lg bg-muted/50 p-3">
      <span class="text-xs text-muted-foreground">
        Calibrated on {latestCalibration.dateRecorded.toLocaleDateString()}
      </span>
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
  {/if}
  <Button variant="outline" size="sm" onclick={() => calibrationFormDialog.open(exercise)}>
    Add Calibration
  </Button>

  <!-- Actions -->
  <div class="flex gap-2">
    <Button onclick={onEdit}>Edit</Button>
    <Button variant="outline" onclick={() => history.back()}>Back</Button>
  </div>
</div>
