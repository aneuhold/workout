<!--
  @component

  Unified, date-ordered list of calibrations and the best set for an exercise.
  Each row shows date, weight x reps, and the computed 1RM. The row matching
  the hero 1RM is highlighted with accent styling.
-->
<script lang="ts">
  import {
    type WorkoutExercise,
    type WorkoutExerciseCalibration,
    WorkoutExerciseCalibrationService,
    type WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import { calibrationFormDialog } from '$components/singletons/dialogs/SingletonCalibrationFormDialog/SingletonCalibrationFormDialog.svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';

  type StrengthEntry = {
    date: Date;
    weight: number;
    reps: number;
    oneRM: number;
    source: 'calibration' | 'set';
  };

  let {
    bestSet,
    bestCalibration,
    exercise
  }: {
    bestSet: WorkoutSet | null;
    bestCalibration: WorkoutExerciseCalibration | null;
    exercise: WorkoutExercise;
  } = $props();

  let calibrations = $derived(
    exerciseCalibrationMapService.allDocs.filter((c) => c.workoutExerciseId === exercise._id)
  );

  let entries = $derived.by((): StrengthEntry[] => {
    const items: StrengthEntry[] = calibrations.map((cal) => ({
      date: cal.dateRecorded,
      weight: cal.weight,
      reps: cal.reps,
      oneRM: WorkoutExerciseCalibrationService.get1RM(cal),
      source: 'calibration'
    }));

    // Add bestSet if it's not already represented by an auto-calibration
    if (bestSet?.actualWeight != null && bestSet.actualReps) {
      const isDuplicate = calibrations.some((cal) => cal.associatedWorkoutSetId === bestSet._id);
      if (!isDuplicate) {
        items.push({
          date: new Date(bestSet.createdDate),
          weight: bestSet.actualWeight,
          reps: bestSet.actualReps,
          oneRM: WorkoutExerciseCalibrationService.get1RMRaw(
            bestSet.actualWeight,
            bestSet.actualReps
          ),
          source: 'set'
        });
      }
    }

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  let hero1RM = $derived.by(() => {
    const cal1RM = bestCalibration
      ? WorkoutExerciseCalibrationService.get1RM(bestCalibration)
      : null;
    const set1RM =
      bestSet?.actualWeight != null && bestSet.actualReps
        ? WorkoutExerciseCalibrationService.get1RMRaw(bestSet.actualWeight, bestSet.actualReps)
        : null;
    if (cal1RM != null && set1RM != null) return Math.max(cal1RM, set1RM);
    return cal1RM ?? set1RM;
  });

  /**
   * Formats a weight value, handling the bodyweight case.
   *
   * @param weight The weight value
   * @param reps The rep count
   */
  function formatWeight(weight: number, reps: number): string {
    if (weight === 0) return `Bodyweight x ${reps}`;
    return `${weight} lb x ${reps}`;
  }
</script>

<div class="flex flex-col gap-2">
  <span class="text-xs text-muted-foreground">Strength History</span>

  {#if entries.length > 0}
    <div class="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 gap-y-1">
      <!-- Column headers -->
      <div
        class="col-span-full grid grid-cols-subgrid items-center px-2 py-0.5 text-xs text-muted-foreground"
      >
        <span>Source</span>
        <span>Date</span>
        <span class="text-right">Performed</span>
        <span class="text-right">Est. 1RM</span>
      </div>
      {#each entries as entry (`${entry.date.getTime()}-${entry.source}`)}
        {@const isHero = hero1RM !== null && Math.round(entry.oneRM) === Math.round(hero1RM)}
        <div
          class="col-span-full grid grid-cols-subgrid items-center rounded-md px-2 py-1 text-sm {isHero
            ? 'font-medium text-primary'
            : ''}"
        >
          <Badge variant={entry.source === 'set' ? 'outline' : 'secondary'}>
            {entry.source === 'set' ? 'Set' : 'Cal'}
          </Badge>
          <span>{entry.date.toLocaleDateString()}</span>
          <span class="text-right">{formatWeight(entry.weight, entry.reps)}</span>
          <span class="text-right">{Math.round(entry.oneRM)} lb</span>
        </div>
      {/each}
    </div>
  {/if}

  <Button variant="outline" size="sm" onclick={() => calibrationFormDialog.open(exercise)}>
    Add Calibration
  </Button>
</div>
