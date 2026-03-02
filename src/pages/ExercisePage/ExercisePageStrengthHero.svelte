<!--
  @component

  Hero card displaying the effective 1RM (estimated one-rep max) for an exercise.
  Computes the max of bestCalibration 1RM and bestSet 1RM, and shows a single
  attribution line indicating the winning source.
-->
<script lang="ts">
  import {
    type WorkoutExerciseCalibration,
    WorkoutExerciseCalibrationService,
    type WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';

  let {
    bestCalibration,
    bestSet
  }: {
    bestCalibration: WorkoutExerciseCalibration | null;
    bestSet: WorkoutSet | null;
  } = $props();

  let cal1RM = $derived(
    bestCalibration ? WorkoutExerciseCalibrationService.get1RM(bestCalibration) : null
  );

  let set1RM = $derived(
    bestSet?.actualWeight != null && bestSet.actualReps
      ? WorkoutExerciseCalibrationService.get1RMRaw(bestSet.actualWeight, bestSet.actualReps)
      : null
  );

  let effective1RM = $derived(
    cal1RM != null && set1RM != null ? Math.max(cal1RM, set1RM) : (cal1RM ?? set1RM)
  );

  type StrengthSource = 'set' | 'calibration';

  let primarySource: StrengthSource | null = $derived.by(() => {
    if (effective1RM === null) return null;
    if (cal1RM != null && set1RM != null) {
      return set1RM >= cal1RM ? 'set' : 'calibration';
    }
    return cal1RM != null ? 'calibration' : 'set';
  });

  /**
   * Formats a source attribution line for the given source type.
   *
   * @param source Whether this is from a "set" or "calibration"
   */
  function formatAttribution(source: StrengthSource): string {
    if (source === 'set' && bestSet?.createdDate) {
      const weight = bestSet.actualWeight ?? 0;
      const reps = bestSet.actualReps ?? 0;
      const dateStr = new Date(bestSet.createdDate).toLocaleDateString();
      if (weight === 0) {
        return `From best set: Bodyweight x ${reps} reps on ${dateStr}`;
      }
      return `From best set: ${weight} lb x ${reps} reps on ${dateStr}`;
    }
    if (source === 'calibration' && bestCalibration) {
      const dateStr = bestCalibration.dateRecorded.toLocaleDateString();
      if (bestCalibration.weight === 0) {
        return `From calibration: Bodyweight x ${bestCalibration.reps} reps on ${dateStr}`;
      }
      return `From calibration: ${bestCalibration.weight} lb x ${bestCalibration.reps} reps on ${dateStr}`;
    }
    return '';
  }
</script>

<Card>
  <CardContent>
    {#if effective1RM !== null && primarySource}
      <div class="flex flex-col items-center gap-1">
        <span class="text-xs text-muted-foreground">Est. 1RM</span>
        <p class="text-2xl font-semibold">{Math.round(effective1RM)} lb</p>
        <span class="text-xs text-muted-foreground">{formatAttribution(primarySource)}</span>
      </div>
    {:else}
      <p class="text-center text-sm text-muted-foreground">
        No strength data yet. Add a calibration to get started.
      </p>
    {/if}
  </CardContent>
</Card>
