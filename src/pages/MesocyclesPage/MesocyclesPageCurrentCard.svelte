<!--
  @component

  Card displaying the active (current) mesocycle with progress bar and calendar grid.
-->
<script lang="ts">
  import type {
    WorkoutExercise,
    WorkoutMesocycle,
    WorkoutMicrocycle,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import MesocycleCalendar from '$components/MesocycleCalendar/MesocycleCalendar.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import Progress from '$ui/Progress/Progress.svelte';
  import { formatCycleType } from './mesocyclesPageUtils';

  let {
    mesocycle,
    sortedMicrocycles,
    sessions,
    sessionExercises,
    sets,
    exercises
  }: {
    mesocycle: WorkoutMesocycle;
    /** Must be sorted by `startDate` ascending. */
    sortedMicrocycles: WorkoutMicrocycle[];
    sessions: WorkoutSession[];
    sessionExercises: WorkoutSessionExercise[];
    sets: WorkoutSet[];
    exercises: WorkoutExercise[];
  } = $props();

  const title = $derived(mesocycle.title || 'Untitled Mesocycle');

  const totalCycles = $derived(sortedMicrocycles.length);

  const currentCycleNumber = $derived.by(() => {
    const firstIncomplete = sessions.find((s) => !s.complete);
    if (!firstIncomplete?.workoutMicrocycleId) {
      return sortedMicrocycles.length;
    }
    const cycleIndex = sortedMicrocycles.findIndex(
      (mc) => mc._id === firstIncomplete.workoutMicrocycleId
    );
    return cycleIndex >= 0 ? cycleIndex + 1 : sortedMicrocycles.length;
  });

  const progressValue = $derived(totalCycles > 0 ? (currentCycleNumber / totalCycles) * 100 : 0);
</script>

<Card>
  <CardHeader>
    <div class="flex items-center gap-2">
      <CardTitle>{title}</CardTitle>
      <Badge variant="secondary">{formatCycleType(mesocycle.cycleType)}</Badge>
    </div>
    <CardDescription>Cycle {currentCycleNumber} of {totalCycles}</CardDescription>
  </CardHeader>
  <CardContent class="flex flex-col gap-4">
    <Progress value={progressValue} />
    <MesocycleCalendar
      {mesocycle}
      microcycles={sortedMicrocycles}
      {sessions}
      {sessionExercises}
      {sets}
      {exercises}
    />
  </CardContent>
</Card>
