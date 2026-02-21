<script lang="ts">
  import type {
    WorkoutExercise,
    WorkoutMesocycle,
    WorkoutMicrocycle,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import MesocycleMapServiceMock, {
    type MockGeneratedMesocycleData
  } from '$services/documentMapServices/mesocycleMapService.mock';
  import MockData from '$testUtils/MockData';
  import MesocycleProgression from './MesocycleProgression.svelte';

  let {
    completedSessionCount = 0
  }: {
    completedSessionCount?: number;
  } = $props();

  let mesocycle = $state<WorkoutMesocycle | null>(null);
  let microcycles = $state<WorkoutMicrocycle[]>([]);
  let sessions = $state<WorkoutSession[]>([]);
  let sessionExercises = $state<WorkoutSessionExercise[]>([]);
  let sets = $state<WorkoutSet[]>([]);
  let exercises = $state<WorkoutExercise[]>([]);

  $effect(() => {
    const _completedCount = completedSessionCount;

    untrack(() => {
      MockData.resetAll();
      const baseData = MockData.setupBaseData();

      const generated: MockGeneratedMesocycleData = MesocycleMapServiceMock.generateFullMesocycle(
        baseData,
        {
          title: 'Progression Demo',
          microcycleCount: 4,
          startDate: new Date(),
          completedSessionCount: _completedCount
        }
      );

      mesocycle = generated.mesocycle;
      microcycles = generated.microcycles;
      sessions = generated.sessions;
      sessionExercises = generated.sessionExercises;
      sets = generated.sets;
      exercises = baseData.exercises;
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

{#if mesocycle}
  <div class="p-4">
    <MesocycleProgression {microcycles} {sessions} {sessionExercises} {sets} {exercises} />
  </div>
{:else}
  <p class="text-muted-foreground p-4">Generating progression data...</p>
{/if}
