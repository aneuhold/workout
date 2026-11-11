<!--
  @component

  Slider for one muscle group's starting set total in a mesocycle. Shows how the total splits
  across the muscle group's exercises, offers a reset when overridden, and warns when the most
  recent mesocycle spread its starting sets across more exercises.
-->
<script lang="ts">
  import { WorkoutVolumePlanningService } from '@aneuhold/core-ts-db-lib';
  import { IconAlertTriangle } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import muscleGroupMapService from '$services/documentMapServices/MuscleGroupMap.service.svelte';
  import stringFormatService from '$services/StringFormat.service';
  import Alert from '$ui/Alert/Alert.svelte';
  import AlertDescription from '$ui/Alert/AlertDescription.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Slider from '$ui/Slider/Slider.svelte';

  let {
    muscleGroupId,
    exerciseCount,
    startingSetCount,
    onSetCountChange
  }: {
    muscleGroupId: UUID;
    /** Number of exercises in the mesocycle for this muscle group. */
    exerciseCount: number;
    /** The override for this muscle group, if any. */
    startingSetCount: number | undefined;
    /** Called with the new override, or `null` to go back to the default. */
    onSetCountChange: (setCount: number | null) => void;
  } = $props();

  /**
   * Should probably be exposed from ts-libs.
   */
  const MIN_SETS_PER_EXERCISE = 2;

  const muscleGroupName = $derived(muscleGroupMapService.getMuscleGroupName(muscleGroupId));
  const volumeCTO = $derived(muscleGroupMapService.getVolumeCTO(muscleGroupId));
  const defaultSetCount = $derived(
    WorkoutVolumePlanningService.getDefaultStartingSetCount(
      volumeCTO ? WorkoutVolumePlanningService.estimateVolumeLandmarks(volumeCTO) : undefined,
      exerciseCount
    )
  );
  const setCount = $derived(startingSetCount ?? defaultSetCount);
  /** The value while the thumb is being dragged, before it is committed. */
  let draggedSetCount = $state<number | undefined>();
  const displayedSetCount = $derived(draggedSetCount ?? setCount);
  /**
   * Two sets per exercise, lowered to the default or the current value when either is below that
   * so both stay on the slider.
   */
  const min = $derived(Math.min(MIN_SETS_PER_EXERCISE * exerciseCount, defaultSetCount, setCount));
  /** The most sets the planner gives this muscle group, since each exercise is capped. */
  const cappedSetCount = $derived(
    WorkoutVolumePlanningService.MAX_SETS_PER_EXERCISE * exerciseCount
  );
  const max = $derived(Math.max(cappedSetCount, defaultSetCount, setCount));

  /** The most recent mesocycle, when it had more exercises for this muscle group. */
  const previousVolume = $derived.by(() => {
    const latest = volumeCTO?.mesocycleHistory.at(0);
    return latest && latest.exerciseCount > exerciseCount ? latest : undefined;
  });
  /**
   * The default starting total scaled down to this mesocycle's exercise count.
   *
   * This divides an MEV averaged across past mesocycles by only the latest mesocycle's exercise
   * count. It should move into `WorkoutVolumePlanningService` in core-ts-db-lib as a tested method
   * that uses the logic already there.
   */
  const suggestedSetCount = $derived(
    previousVolume
      ? Math.max(min, Math.round((defaultSetCount / previousVolume.exerciseCount) * exerciseCount))
      : undefined
  );
  const showWarning = $derived(
    startingSetCount == null && suggestedSetCount != null && defaultSetCount > suggestedSetCount
  );

  /**
   * Formats how many sets each exercise gets when a total is split evenly, as a single number or
   * a range when it doesn't divide evenly.
   *
   * @param setCount Total sets
   * @param count Number of exercises sharing the total
   */
  const formatSetsPerExercise = (setCount: number, count: number): string => {
    const low = Math.floor(setCount / count);
    const high = Math.ceil(setCount / count);
    return low === high ? `${low}` : `${low}-${high}`;
  };
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-baseline justify-between gap-2">
    <span class="text-sm font-medium">{muscleGroupName}</span>
    <span class="text-sm tabular-nums">
      {stringFormatService.pluralize(displayedSetCount, 'set')}
    </span>
  </div>
  <Slider
    type="single"
    value={displayedSetCount}
    onValueChange={(value: number) => (draggedSetCount = value)}
    onValueCommit={(value: number) => {
      draggedSetCount = undefined;
      onSetCountChange(value === defaultSetCount ? null : value);
    }}
    handleAriaLabel={muscleGroupName}
    {min}
    {max}
    step={1}
  />
  <div class="flex min-h-6 items-center justify-between gap-2 text-xs text-muted-foreground">
    <span>
      {stringFormatService.pluralize(exerciseCount, 'exercise')} · {formatSetsPerExercise(
        Math.min(displayedSetCount, cappedSetCount),
        exerciseCount
      )} sets each to start{displayedSetCount > cappedSetCount
        ? ` (max ${cappedSetCount} total)`
        : ''}
    </span>
    {#if startingSetCount != null}
      <Button variant="link" size="xs" class="px-0" onclick={() => onSetCountChange(null)}>
        Reset to {defaultSetCount}
      </Button>
    {:else}
      <span>Default</span>
    {/if}
  </div>
  {#if showWarning && previousVolume && suggestedSetCount != null}
    <Alert variant="warn">
      <IconAlertTriangle />
      <AlertDescription>
        The default comes from past mesocycles, and the last one had
        {stringFormatService.pluralize(previousVolume.exerciseCount, 'exercise')}. Add {stringFormatService.pluralize(
          previousVolume.exerciseCount - exerciseCount,
          'exercise'
        )} or lower to {stringFormatService.pluralize(suggestedSetCount, 'set')} if wanted.
      </AlertDescription>
    </Alert>
  {/if}
</div>
