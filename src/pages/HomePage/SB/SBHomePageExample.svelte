<script lang="ts">
  import { CycleType } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import MesocycleMapServiceMock from '$services/documentMapServices/mesocycleMapService.mock';
  import { daysAgo } from '$testUtils/dateUtils';
  import MockData from '$testUtils/MockData';
  import HomePage from '../HomePage.svelte';

  type StoryMode =
    | 'default'
    | 'allComplete'
    | 'review'
    | 'inProgress'
    | 'inProgressReview'
    | 'microcycleComplete'
    | 'microcycleCompleteBlocked'
    | 'mesocycleStart';

  let { storyMode = 'default' }: { storyMode?: StoryMode } = $props();

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockData.resetAll();

      const baseData = MockData.setupBaseData();

      if (mode === 'allComplete') {
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(28),
          completedSessionCount: 999
        });
        MesocycleMapServiceMock.fillLateFields(data);
        return;
      }

      if (mode === 'review') {
        MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(21),
          completedSessionCount: 8
        });
        return;
      }

      if (mode === 'inProgress') {
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(21),
          completedSessionCount: 8
        });
        MesocycleMapServiceMock.fillLateFields(data);
        MesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
        return;
      }

      if (mode === 'inProgressReview') {
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(21),
          completedSessionCount: 8
        });
        // Fill late fields only for the first 5 completed sessions, leaving 3 needing review
        const completedSessions = data.sessions.filter((s) => s.complete);
        const filledIds = new Set(completedSessions.slice(0, 5).map((s) => s._id));
        for (const se of data.sessionExercises) {
          if (filledIds.has(se.workoutSessionId)) {
            se.rsm = { mindMuscleConnection: 2, pump: 2, disruption: 1 };
            se.fatigue = {
              jointAndTissueDisruption: 1,
              perceivedEffort: 2,
              unusedMusclePerformance: 1
            };
            se.sorenessScore = 1;
          }
        }
        MesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
        return;
      }

      if (mode === 'microcycleComplete') {
        // 6-microcycle mesocycle, 2 microcycles complete with reviews filled
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 6,
          startDate: daysAgo(14),
          completedSessionCount: 10
        });
        MesocycleMapServiceMock.fillLateFields(data);
        return;
      }

      if (mode === 'microcycleCompleteBlocked') {
        // Same as microcycleComplete but reviews NOT filled — shows blocked state
        MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 6,
          startDate: daysAgo(14),
          completedSessionCount: 10
        });
        return;
      }

      if (mode === 'mesocycleStart') {
        // Mesocycle exists with generated microcycles, but no sessions started
        MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 6,
          startDate: daysAgo(0),
          completedSessionCount: 0
        });
        return;
      }

      // Default: mix of Completed, NextUp, Upcoming (no in-progress)
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(21),
        completedSessionCount: 8
      });
      MesocycleMapServiceMock.fillLateFields(data);
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

<HomePage />
