<script lang="ts">
  import {
    type WorkoutExercise,
    type WorkoutMesocycle,
    WorkoutMesocycleService,
    type WorkoutMicrocycle,
    type WorkoutSession,
    type WorkoutSessionExercise,
    type WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
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
      // Reset all mock services
      MockData.muscleGroupMapServiceMock.reset();
      MockData.equipmentTypeMapServiceMock.reset();
      MockData.exerciseMapServiceMock.reset();
      MockData.exerciseCalibrationMapServiceMock.reset();
      MockData.mesocycleMapServiceMock.reset();
      MockData.microcycleMapServiceMock.reset();
      MockData.sessionMapServiceMock.reset();
      MockData.sessionExerciseMapServiceMock.reset();
      MockData.setMapServiceMock.reset();

      // Set up base mock data
      const muscleGroups = MockData.muscleGroupMapServiceMock.addDefaultMuscleGroups();
      const equipment = MockData.equipmentTypeMapServiceMock.addDefaultEquipmentTypes();
      const mockExercises = MockData.exerciseMapServiceMock.addDefaultExercises(
        muscleGroups,
        equipment
      );
      const calibrations = MockData.exerciseCalibrationMapServiceMock.addDefaultCalibrations();

      // Parse rest days from comma-separated string
      const parsedRestDays = _restDays
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));

      // Create mesocycle document
      const mesoDoc = MockData.mesocycleMapServiceMock.addMesocycle({
        plannedMicrocycleCount: _mcCount,
        plannedMicrocycleLengthInDays: _mcLength,
        plannedMicrocycleRestDays: parsedRestDays,
        plannedSessionCountPerMicrocycle: _plannedSessionCount > 0 ? _plannedSessionCount : 1,
        calibratedExercises: calibrations.map((c) => c._id)
      });

      // Override the createdDate to set the start date
      const parsedStart = new Date(_startDate);

      // Build equipment types array from mock
      const equipmentTypes = Object.values(equipment);

      // Generate the mesocycle plan
      console.log('Generating mesocycle with params:', {
        microcycleCount: _mcCount,
        microcycleLengthDays: _mcLength,
        restDays: parsedRestDays,
        startDate: parsedStart,
        completedSessionCount: _completedCount,
        plannedSessionCountPerMicrocycle: _plannedSessionCount
      });
      const result = WorkoutMesocycleService.generateOrUpdateMesocycle(
        mesoDoc,
        calibrations,
        mockExercises,
        equipmentTypes
      );

      const genMicrocycles = result.microcycles?.create ?? [];
      const genSessions = result.sessions?.create ?? [];
      const genSessionExercises = result.sessionExercises?.create ?? [];
      const genSets = result.sets?.create ?? [];

      // Adjust dates: shift all generated dates to start from the specified startDate
      if (genMicrocycles.length > 0) {
        const firstMicroStart = new Date(genMicrocycles[0].startDate);
        const dateOffset = parsedStart.getTime() - firstMicroStart.getTime();

        for (const mc of genMicrocycles) {
          mc.startDate = new Date(new Date(mc.startDate).getTime() + dateOffset);
          mc.endDate = new Date(new Date(mc.endDate).getTime() + dateOffset);
        }
        for (const s of genSessions) {
          s.startTime = new Date(new Date(s.startTime).getTime() + dateOffset);
        }
      }

      // Mark sessions as completed based on the control
      let completedSoFar = 0;
      for (const s of genSessions) {
        if (completedSoFar < _completedCount) {
          s.complete = true;
          completedSoFar++;
        }
      }

      // Populate actual data on sets belonging to completed sessions
      const completedSessionIds = new Set(
        genSessions.filter((s) => s.complete).map((s) => s._id as string)
      );
      for (const set of genSets) {
        if (completedSessionIds.has(set.workoutSessionId as string)) {
          set.actualReps = (set.plannedReps ?? 8) + Math.floor(Math.random() * 3) - 1;
          set.actualWeight = set.plannedWeight ?? 135;
          set.rir = Math.max(0, (set.plannedRir ?? 3) - 1);
        }
      }

      // Add generated docs to mock services
      MockData.microcycleMapServiceMock.addManyMicrocycles(genMicrocycles);
      MockData.sessionMapServiceMock.addManySessions(genSessions);
      MockData.sessionExerciseMapServiceMock.addManySessionExercises(genSessionExercises);
      MockData.setMapServiceMock.addManySets(genSets);

      // Set component state
      mesocycle = mesoDoc;
      microcycles = genMicrocycles;
      sessions = genSessions;
      sessionExercises = genSessionExercises;
      sets = genSets;
      exercises = mockExercises;
    });

    return () => {
      untrack(() => {
        MockData.muscleGroupMapServiceMock.reset();
        MockData.equipmentTypeMapServiceMock.reset();
        MockData.exerciseMapServiceMock.reset();
        MockData.exerciseCalibrationMapServiceMock.reset();
        MockData.mesocycleMapServiceMock.reset();
        MockData.microcycleMapServiceMock.reset();
        MockData.sessionMapServiceMock.reset();
        MockData.sessionExerciseMapServiceMock.reset();
        MockData.setMapServiceMock.reset();
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
