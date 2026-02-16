<!--
  @component

  Card wrapping the MesocycleCalendar to show a preview of the generated schedule.
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
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';

  let {
    mesocycle,
    microcycles,
    sessions,
    sessionExercises,
    sets,
    exercises
  }: {
    mesocycle: WorkoutMesocycle;
    microcycles: WorkoutMicrocycle[];
    sessions: WorkoutSession[];
    sessionExercises: WorkoutSessionExercise[];
    sets: WorkoutSet[];
    exercises: WorkoutExercise[];
  } = $props();

  const description = $derived.by(() => {
    const cycleCount = microcycles.length;
    const deloadCount = microcycles.length > 0 ? 1 : 0;
    const accumCount = cycleCount - deloadCount;
    if (deloadCount > 0) {
      return `${accumCount} week${accumCount !== 1 ? 's' : ''} + deload`;
    }
    return `${cycleCount} week${cycleCount !== 1 ? 's' : ''}`;
  });
</script>

<Card>
  <CardHeader>
    <CardTitle>Schedule Preview</CardTitle>
    <CardDescription>
      {sessions.length} sessions over {description}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <MesocycleCalendar {mesocycle} {microcycles} {sessions} {sessionExercises} {sets} {exercises} />
  </CardContent>
</Card>
