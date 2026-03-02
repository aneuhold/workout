<!--
  @component

  Read-only view for an exercise's details, strength data, training quality, and actions.
  Composes sub-components for the strength hero card, strength history, and training quality.
-->
<script lang="ts">
  import {
    type WorkoutExercise,
    type WorkoutExerciseCTO,
    WorkoutExerciseService
  } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import ExercisePageStrengthHero from './ExercisePageStrengthHero.svelte';
  import ExercisePageStrengthHistory from './ExercisePageStrengthHistory.svelte';
  import ExercisePageTrainingQuality from './ExercisePageTrainingQuality.svelte';

  let {
    exercise,
    cto,
    onEdit
  }: {
    exercise: WorkoutExercise;
    cto: WorkoutExerciseCTO | undefined;
    onEdit: () => void;
  } = $props();

  /**
   * Resolves an equipment type ID to its display name.
   *
   * @param id The equipment type ID
   */
  function getEquipmentName(id: UUID): string {
    return equipmentTypeMapService.getDoc(id)?.title ?? 'Unknown';
  }
</script>

<div class="flex flex-col gap-4">
  <!-- Section A: Strength Hero Card -->
  <ExercisePageStrengthHero
    bestCalibration={cto?.bestCalibration ?? null}
    bestSet={cto?.bestSet ?? null}
  />

  <!-- Section B: Properties grid -->
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

  <!-- Section C: Muscle groups -->
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

  <!-- Section D: Notes -->
  {#if exercise.notes}
    <div>
      <span class="text-xs text-muted-foreground">Notes</span>
      <p class="mt-0.5 text-sm">{exercise.notes}</p>
    </div>
  {/if}

  <!-- Section E: Strength History -->
  <Separator />
  <ExercisePageStrengthHistory
    bestSet={cto?.bestSet ?? null}
    bestCalibration={cto?.bestCalibration ?? null}
    {exercise}
  />

  <!-- Section F: Training Quality -->
  <Separator />
  <ExercisePageTrainingQuality
    initialFatigueGuess={exercise.initialFatigueGuess}
    lastSessionExercise={cto?.lastSessionExercise ?? null}
  />

  <!-- Section G: Actions -->
  <div class="flex gap-2">
    <Button onclick={onEdit}>Edit</Button>
    <Button variant="outline" onclick={() => history.back()}>Back</Button>
  </div>
</div>
