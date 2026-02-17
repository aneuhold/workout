<!--
  @component

  Card wrapping the MesocycleProgression component to show exercise progression
  across cycles within the mesocycle.
-->
<script lang="ts">
  import type {
    WorkoutExercise,
    WorkoutMicrocycle,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import MesocycleProgression from '$components/MesocycleProgression/MesocycleProgression.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';

  let {
    microcycles,
    sessions,
    sessionExercises,
    sets,
    exercises
  }: {
    microcycles: WorkoutMicrocycle[];
    sessions: WorkoutSession[];
    sessionExercises: WorkoutSessionExercise[];
    sets: WorkoutSet[];
    exercises: WorkoutExercise[];
  } = $props();
</script>

<Card>
  <CardHeader>
    <CardTitle>Progression</CardTitle>
    <CardDescription>Per-set reps, weight, and RIR across cycles</CardDescription>
  </CardHeader>
  <CardContent>
    <MesocycleProgression {microcycles} {sessions} {sessionExercises} {sets} {exercises} />
  </CardContent>
</Card>
