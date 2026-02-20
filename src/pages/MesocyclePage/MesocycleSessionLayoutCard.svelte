<!--
  @component

  Card previewing how selected exercises are distributed across sessions
  within the first microcycle.
-->
<script lang="ts">
  import {
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
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';

  let {
    firstMicrocycle,
    previewSessions = [],
    previewSessionExercises = [],
    exercises = []
  }: {
    firstMicrocycle?: WorkoutMicrocycle;
    previewSessions: WorkoutSession[];
    previewSessionExercises: WorkoutSessionExercise[];
    exercises: WorkoutExercise[];
  } = $props();

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

{#if sessionPreviewData.length > 0}
  <Card>
    <CardHeader>
      <CardTitle>Session Layout</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-3">
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
                  <Badge variant="outline" class="px-1 py-0 text-[10px]">
                    {getRepRangeLabel(exerciseDetail.repRange)}
                  </Badge>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </CardContent>
  </Card>
{/if}
