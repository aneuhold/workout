<script lang="ts" module>
  export enum HomePageStoryMode {
    Default = 'default',
    AllComplete = 'allComplete',
    AllCompleteBlocked = 'allCompleteBlocked',
    Review = 'review',
    InProgress = 'inProgress',
    InProgressReview = 'inProgressReview',
    MicrocycleComplete = 'microcycleComplete',
    MicrocycleCompleteBlocked = 'microcycleCompleteBlocked',
    MicrocycleCompleteDeload = 'microcycleCompleteDeload',
    MesocycleStart = 'mesocycleStart',
    LateSession = 'lateSession',
    SeverelyLateSession = 'severelyLateSession',
    FreeFormEmpty = 'freeFormEmpty',
    FreeFormInProgress = 'freeFormInProgress',
    FreeFormWithMesocycle = 'freeFormWithMesocycle'
  }
</script>

<script lang="ts">
  import { CycleType } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import MesocycleMapServiceMock from '$services/documentMapServices/mesocycleMapService.mock';
  import { daysAgo } from '$testUtils/dateUtils';
  import MockData from '$testUtils/MockData';
  import HomePage from '../HomePage.svelte';

  let { storyMode = HomePageStoryMode.Default }: { storyMode?: HomePageStoryMode } = $props();

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockData.resetAll();

      const baseData = MockData.setupBaseData();

      if (mode === HomePageStoryMode.AllComplete) {
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

      if (mode === HomePageStoryMode.AllCompleteBlocked) {
        // All sessions complete but reviews NOT filled — blocks mesocycle completion
        MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(28),
          completedSessionCount: 999
        });
        return;
      }

      if (mode === HomePageStoryMode.Review) {
        MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          // Line up so that a review is needed, but it isn't late
          startDate: daysAgo(11),
          completedSessionCount: 8
        });
        return;
      }

      if (mode === HomePageStoryMode.InProgress) {
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

      if (mode === HomePageStoryMode.InProgressReview) {
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
            se.rsm = { ...se.rsm, disruption: 1 };
            se.fatigue = { ...se.fatigue, jointAndTissueDisruption: 1 };
            se.sorenessScore = 1;
          }
        }
        MesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
        return;
      }

      if (mode === HomePageStoryMode.MicrocycleComplete) {
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

      if (mode === HomePageStoryMode.MicrocycleCompleteBlocked) {
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

      if (mode === HomePageStoryMode.MicrocycleCompleteDeload) {
        // 6 microcycles, 3 complete with reviews filled. Performance drops in
        // microcycles 2 and 3 trigger the consecutive-drop deload rule when
        // the user clicks "Advance to Next Microcycle".
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 6,
          startDate: daysAgo(21),
          completedSessionCount: 15
        });
        MesocycleMapServiceMock.fillLateFields(data);
        const mc2Sessions = data.sessions.filter(
          (s) => s.workoutMicrocycleId === data.microcycles[1]._id
        );
        const mc3Sessions = data.sessions.filter(
          (s) => s.workoutMicrocycleId === data.microcycles[2]._id
        );
        const dropSessionIds = new Set([...mc2Sessions, ...mc3Sessions].map((s) => s._id));
        MesocycleMapServiceMock.applyPerformanceDrops(data, dropSessionIds);
        return;
      }

      if (mode === HomePageStoryMode.MesocycleStart) {
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

      if (mode === HomePageStoryMode.LateSession) {
        // Next session is 1 day late
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(12),
          completedSessionCount: 8
        });
        MesocycleMapServiceMock.fillLateFields(data);
        return;
      }

      if (mode === HomePageStoryMode.SeverelyLateSession) {
        // Next session is 4+ days late (started 25 days ago, 8 completed)
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(25),
          completedSessionCount: 8
        });
        MesocycleMapServiceMock.fillLateFields(data);
        return;
      }

      if (mode === HomePageStoryMode.FreeFormEmpty) {
        // No mesocycle, no free-form sessions — just base data
        return;
      }

      if (mode === HomePageStoryMode.FreeFormInProgress) {
        // No mesocycle, one free-form session in progress with 2 exercises
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          exerciseCount: 2,
          setsPerExercise: 1,
          loggedSetCount: 1
        });
        return;
      }

      if (mode === HomePageStoryMode.FreeFormWithMesocycle) {
        // Active mesocycle with no session currently in progress + free-form in progress.
        // The free-form hero card takes priority over the "Next Up" mesocycle recommendation.
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(11),
          completedSessionCount: 8
        });
        MesocycleMapServiceMock.fillLateFields(data);
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'March 28 Workout',
          startTime: daysAgo(1),
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 4
        });
        return;
      }

      // Default: mix of Completed, NextUp, Upcoming (no in-progress)
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(11),
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
