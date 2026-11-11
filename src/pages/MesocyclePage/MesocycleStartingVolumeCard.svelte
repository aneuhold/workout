<!--
  @component

  Card listing the starting set total for each muscle group in the mesocycle, with a slider to
  override each one.
-->
<script lang="ts">
  import { type WorkoutExerciseCTO, WorkoutExerciseService } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import MesocycleStartingVolumeSlider from './MesocycleStartingVolumeSlider.svelte';

  let {
    exerciseCTOs,
    startingSetCounts,
    onSetCountChange
  }: {
    exerciseCTOs: WorkoutExerciseCTO[];
    /** Overrides keyed by muscle group ID. */
    startingSetCounts: Record<UUID, number>;
    onSetCountChange: (muscleGroupId: UUID, setCount: number | null) => void;
  } = $props();

  const muscleGroups = $derived([
    ...WorkoutExerciseService.groupByPrimaryMuscleGroup(exerciseCTOs)
  ]);
</script>

{#if muscleGroups.length > 0}
  <Card>
    <CardHeader>
      <CardTitle>Starting Volume</CardTitle>
      <CardDescription>
        Total sets per muscle group in the first microcycle, split across its exercises.
      </CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
      {#each muscleGroups as [muscleGroupId, muscleGroupExerciseCTOs], i (muscleGroupId)}
        <MesocycleStartingVolumeSlider
          {muscleGroupId}
          exerciseCount={muscleGroupExerciseCTOs.length}
          startingSetCount={startingSetCounts[muscleGroupId]}
          onSetCountChange={(setCount) => onSetCountChange(muscleGroupId, setCount)}
        />
        {#if i < muscleGroups.length - 1}
          <Separator />
        {/if}
      {/each}
    </CardContent>
  </Card>
{/if}
