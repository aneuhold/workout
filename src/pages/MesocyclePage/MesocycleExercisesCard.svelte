<!--
  @component

  Card for selecting calibrated exercises and previewing their distribution
  across sessions within a single cycle.
-->
<script lang="ts">
  import {
    type CalibrationExercisePair,
    ExerciseRepRange,
    type WorkoutExercise,
    WorkoutExerciseService,
    type WorkoutMicrocycle,
    type WorkoutSession,
    type WorkoutSessionExercise
  } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';

  let {
    calibratedExercisePairs,
    selectedCalibrationIds = $bindable<UUID[]>([]),
    firstMicrocycle,
    previewSessions = [],
    previewSessionExercises = [],
    exercises = [],
    disabled = false
  }: {
    calibratedExercisePairs: CalibrationExercisePair[];
    selectedCalibrationIds: UUID[];
    firstMicrocycle?: WorkoutMicrocycle;
    previewSessions: WorkoutSession[];
    previewSessionExercises: WorkoutSessionExercise[];
    exercises: WorkoutExercise[];
    disabled?: boolean;
  } = $props();

  function toggleCalibration(calibrationId: UUID) {
    if (selectedCalibrationIds.includes(calibrationId)) {
      selectedCalibrationIds = selectedCalibrationIds.filter(
        (existingId) => existingId !== calibrationId
      );
    } else {
      selectedCalibrationIds = [...selectedCalibrationIds, calibrationId];
    }
  }

  /**
   * The sessions belonging to the first microcycle only, in sessionOrder.
   */
  const firstCycleSessions = $derived.by(() => {
    if (!firstMicrocycle || previewSessions.length === 0) return [];
    const sessionIndexMap = new Map<UUID, number>(
      firstMicrocycle.sessionOrder.map((sessionId, index) => [sessionId, index])
    );
    return previewSessions
      .filter((session) => sessionIndexMap.has(session._id))
      .sort(
        (sessionA, sessionB) =>
          (sessionIndexMap.get(sessionA._id) ?? 0) - (sessionIndexMap.get(sessionB._id) ?? 0)
      );
  });

  /**
   * Preview data for the sessions in the first microcycle, showing only exercises
   * that are relevant to the selected calibrations.
   */
  const sessionPreviewData: {
    title: string;
    dayOfCycle: number;
    exerciseDetails: {
      name: string;
      repRange: ExerciseRepRange;
      muscleGroups: string[];
    }[];
    sessionId: UUID;
  }[] = $derived.by(() => {
    if (firstCycleSessions.length === 0 || !firstMicrocycle) return [];
    const exerciseMap = new Map(exercises.map((exercise) => [exercise._id, exercise]));
    const mcStart = new Date(firstMicrocycle.startDate).getTime();

    return firstCycleSessions.map((session, sessionIndex) => {
      const sessionExercisesForSession = previewSessionExercises.filter(
        (sessionExercise) => sessionExercise.workoutSessionId === session._id
      );

      const exerciseDetails = sessionExercisesForSession.map((sessionExercise) => {
        const exercise = exerciseMap.get(sessionExercise.workoutExerciseId);
        const primaryNames = (exercise?.primaryMuscleGroups ?? [])
          .map((muscleGroupId) => muscleGroupMapService.getDoc(muscleGroupId)?.name)
          .filter((name): name is string => name != null);
        return {
          name: exercise?.exerciseName ?? 'Unknown',
          repRange: exercise?.repRange ?? ExerciseRepRange.Medium,
          muscleGroups: primaryNames
        };
      });

      // Compute day-of-cycle (1-indexed)
      const sessionStart = new Date(session.startTime).getTime();
      const dayOfCycle = Math.floor((sessionStart - mcStart) / (24 * 60 * 60 * 1000)) + 1;

      return {
        title: `Session ${sessionIndex + 1}`,
        dayOfCycle,
        exerciseDetails,
        sessionId: session._id
      };
    });
  });

  function getRepRangeLabel(repRange: ExerciseRepRange): string {
    const { min, max } = WorkoutExerciseService.getRepRangeValues(repRange);
    return `${min}-${max} Reps`;
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Exercises</CardTitle>
    <CardDescription>
      {#if disabled}
        Exercises included in this mesocycle.
      {:else}
        Select calibrated exercises to include. The algorithm distributes them across sessions.
      {/if}
    </CardDescription>
  </CardHeader>
  <CardContent class="flex flex-col gap-4">
    {#if calibratedExercisePairs.length === 0}
      <p class="text-sm text-muted-foreground">
        No calibrated exercises found. Calibrate exercises first to include them in a mesocycle.
      </p>
    {:else}
      <div class="flex flex-wrap gap-1.5">
        {#each calibratedExercisePairs as pair (pair.calibration._id)}
          {#if disabled}
            <Badge
              variant={selectedCalibrationIds.includes(pair.calibration._id)
                ? 'default'
                : 'outline'}
            >
              {pair.exercise.exerciseName}
            </Badge>
          {:else}
            <button type="button" onclick={() => toggleCalibration(pair.calibration._id)}>
              <Badge
                variant={selectedCalibrationIds.includes(pair.calibration._id)
                  ? 'default'
                  : 'outline'}
              >
                {pair.exercise.exerciseName}
              </Badge>
            </button>
          {/if}
        {/each}
      </div>

      {#if selectedCalibrationIds.length > 0}
        <p class="text-xs text-muted-foreground">
          {selectedCalibrationIds.length} exercise{selectedCalibrationIds.length !== 1 ? 's' : ''} selected
        </p>
      {/if}
    {/if}

    {#if sessionPreviewData.length > 0}
      <div class="flex flex-col gap-3">
        <p class="text-sm font-medium">Session Layout</p>
        {#each sessionPreviewData as session (session.sessionId)}
          <div class="rounded-md border border-border p-2.5">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">{session.title}</span>
              <span class="text-xs text-muted-foreground">Day {session.dayOfCycle}</span>
            </div>
            <div class="mt-2 flex flex-col gap-1.5">
              {#each session.exerciseDetails as exerciseDetail, exerciseIndex (exerciseIndex)}
                <div class="flex items-start justify-between gap-2">
                  <span class="text-xs">{exerciseIndex + 1}. {exerciseDetail.name}</span>
                  <div class="flex shrink-0 items-center gap-1">
                    {#if exerciseDetail.muscleGroups.length > 0}
                      <span class="text-[10px] text-muted-foreground">
                        {exerciseDetail.muscleGroups.join(', ')}
                      </span>
                    {/if}
                    <Badge variant="outline" class="text-[10px] px-1 py-0">
                      {getRepRangeLabel(exerciseDetail.repRange)}
                    </Badge>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </CardContent>
</Card>
