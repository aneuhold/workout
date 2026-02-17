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
  import {
    generateFullMockMesocycle,
    type MockGeneratedMesocycleData
  } from '$services/documentMapServices/mesocycleMapService.mock';
  import MockData from '$testUtils/MockData';
  import MesocycleCalendar from './MesocycleCalendar.svelte';

  let {
    microcycleCount = 4,
    microcycleLengthDays = 7,
    restDays = '0,6',
    startDate = '2026-02-16',
    completedSessionCount = 0,
    plannedSessionCountPerMicrocycle = 5
  }: {
    microcycleCount?: number;
    microcycleLengthDays?: number;
    restDays?: string;
    startDate?: string;
    completedSessionCount?: number;
    plannedSessionCountPerMicrocycle?: number;
  } = $props();

  let mesocycle = $state<WorkoutMesocycle | null>(null);
  let microcycles = $state<WorkoutMicrocycle[]>([]);
  let sessions = $state<WorkoutSession[]>([]);
  let sessionExercises = $state<WorkoutSessionExercise[]>([]);
  let sets = $state<WorkoutSet[]>([]);
  let exercises = $state<WorkoutExercise[]>([]);

  $effect(() => {
    // Track all props so effect re-runs when they change
    const _mcCount = microcycleCount;
    const _mcLength = microcycleLengthDays;
    const _restDays = restDays;
    const _startDate = startDate;
    const _completedCount = completedSessionCount;
    const _plannedSessionCount = plannedSessionCountPerMicrocycle;

    untrack(() => {
      MockData.resetAll();

      const baseData = MockData.setupBaseData();

      // Parse rest days from comma-separated string
      const parsedRestDays = _restDays
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));

      const parsedStart = new Date(_startDate);

      let generated: MockGeneratedMesocycleData;
      generated = generateFullMockMesocycle(baseData, {
        microcycleCount: _mcCount,
        microcycleLengthInDays: _mcLength,
        restDays: parsedRestDays,
        sessionsPerMicrocycle: _plannedSessionCount > 0 ? _plannedSessionCount : 1,
        startDate: parsedStart,
        completedSessionCount: _completedCount
      });

      // Set component state
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
    <MesocycleCalendar {mesocycle} {microcycles} {sessions} {sessionExercises} {sets} {exercises} />
  </div>
{:else}
  <p class="text-muted-foreground p-4">Generating mesocycle data...</p>
{/if}
