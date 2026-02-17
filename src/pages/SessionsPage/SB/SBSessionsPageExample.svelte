<script lang="ts">
  import { CycleType } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import {
    generateFullMockMesocycle,
    type MockGeneratedMesocycleData
  } from '$services/documentMapServices/mesocycleMapService.mock';
  import MockData from '$testUtils/MockData';
  import SessionsPage from '../SessionsPage.svelte';

  type StoryMode = 'default' | 'empty' | 'allComplete' | 'review';

  let { storyMode = 'default' }: { storyMode?: StoryMode } = $props();

  function daysAgo(n: number): Date {
    return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  }

  /**
   * Fills in RSM, fatigue, and sorenessScore on session exercises belonging
   * to completed sessions so they show as fully "Completed" rather than "Review".
   *
   * @param data The mock mesocycle data to modify in-place
   */
  function fillLateFields(data: MockGeneratedMesocycleData): void {
    const completedSessionIds = new Set(data.sessions.filter((s) => s.complete).map((s) => s._id));
    for (const se of data.sessionExercises) {
      if (completedSessionIds.has(se.workoutSessionId)) {
        se.rsm = { mindMuscleConnection: 2, pump: 2, disruption: 1 };
        se.fatigue = {
          jointAndTissueDisruption: 1,
          perceivedEffort: 2,
          unusedMusclePerformance: 1
        };
        se.sorenessScore = 1;
      }
    }
  }

  /**
   * Adds actual data to a few sets of the first incomplete session, making
   * it appear "in-progress".
   *
   * @param data The mock mesocycle data to modify in-place
   */
  function makeFirstIncompleteSessionInProgress(data: MockGeneratedMesocycleData): void {
    const firstIncomplete = data.sessions.find((s) => !s.complete);
    if (!firstIncomplete) return;
    const setsForSession = data.sets.filter((s) => s.workoutSessionId === firstIncomplete._id);
    // Log the first 2 sets
    for (let i = 0; i < Math.min(2, setsForSession.length); i++) {
      const set = setsForSession[i];
      set.actualReps = (set.plannedReps ?? 8) + 1;
      set.actualWeight = set.plannedWeight ?? 135;
      if (set.plannedRir != null) {
        set.rir = Math.max(0, set.plannedRir - 1);
      }
    }
  }

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockData.resetAll();

      if (mode === 'empty') return;

      const baseData = MockData.setupBaseData();

      if (mode === 'allComplete') {
        const data = generateFullMockMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(28),
          completedSessionCount: 999
        });
        fillLateFields(data);
        return;
      }

      if (mode === 'review') {
        // 8 completed sessions but late fields NOT filled → shows as "Review"
        generateFullMockMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(21),
          completedSessionCount: 8
        });
        return;
      }

      // Default: mix of Completed, InProgress, NextUp, Upcoming
      const data = generateFullMockMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(21),
        completedSessionCount: 8
      });
      fillLateFields(data);
      makeFirstIncompleteSessionInProgress(data);
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

<SessionsPage />
