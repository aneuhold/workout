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
    FreeFormWithMesocycle = 'freeFormWithMesocycle',
    FreeFormPlanned = 'freeFormPlanned',
    FreeFormInProgressAndPlanned = 'freeFormInProgressAndPlanned'
  }
</script>

<script lang="ts">
  import { CycleType } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import mesocycleMapServiceMock from '$services/documentMapServices/MesocycleMap.service.mock';
  import sessionMapServiceMock from '$services/documentMapServices/SessionMap.service.mock';
  import MockDataService from '$services/MockDataService/MockData.service';
  import { daysAgo, daysFromNow } from '$util/dateUtils';
  import HomePage from '../HomePage.svelte';

  let { storyMode = HomePageStoryMode.Default }: { storyMode?: HomePageStoryMode } = $props();

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockDataService.resetAll();

      const baseData = MockDataService.setupBaseData();

      if (mode === HomePageStoryMode.AllComplete) {
        const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(28),
          completedSessionCount: 999
        });
        mesocycleMapServiceMock.fillLateFields(data);
        return;
      }

      if (mode === HomePageStoryMode.AllCompleteBlocked) {
        // All sessions complete but reviews NOT filled — blocks mesocycle completion
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(28),
          completedSessionCount: 999
        });
        return;
      }

      if (mode === HomePageStoryMode.Review) {
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
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
        const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(21),
          completedSessionCount: 8
        });
        mesocycleMapServiceMock.fillLateFields(data);
        mesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
        return;
      }

      if (mode === HomePageStoryMode.InProgressReview) {
        const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
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
        mesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
        return;
      }

      if (mode === HomePageStoryMode.MicrocycleComplete) {
        // 6-microcycle mesocycle, 2 microcycles complete with reviews filled
        const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 6,
          startDate: daysAgo(14),
          completedSessionCount: 10
        });
        mesocycleMapServiceMock.fillLateFields(data);
        return;
      }

      if (mode === HomePageStoryMode.MicrocycleCompleteBlocked) {
        // Same as microcycleComplete but reviews NOT filled — shows blocked state
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
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
        const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 6,
          startDate: daysAgo(21),
          completedSessionCount: 15
        });
        mesocycleMapServiceMock.fillLateFields(data);
        const mc2Sessions = data.sessions.filter(
          (s) => s.workoutMicrocycleId === data.microcycles[1]._id
        );
        const mc3Sessions = data.sessions.filter(
          (s) => s.workoutMicrocycleId === data.microcycles[2]._id
        );
        const dropSessionIds = new Set([...mc2Sessions, ...mc3Sessions].map((s) => s._id));
        mesocycleMapServiceMock.applyPerformanceDrops(data, dropSessionIds);
        return;
      }

      if (mode === HomePageStoryMode.MesocycleStart) {
        // Mesocycle exists with generated microcycles, but no sessions started
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
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
        const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(12),
          completedSessionCount: 8
        });
        mesocycleMapServiceMock.fillLateFields(data);
        return;
      }

      if (mode === HomePageStoryMode.SeverelyLateSession) {
        // Next session is 4+ days late (started 25 days ago, 8 completed)
        const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(25),
          completedSessionCount: 8
        });
        mesocycleMapServiceMock.fillLateFields(data);
        return;
      }

      if (mode === HomePageStoryMode.FreeFormEmpty) {
        // No mesocycle, no free-form sessions — just base data
        return;
      }

      if (mode === HomePageStoryMode.FreeFormInProgress) {
        // No mesocycle, one free-form session in progress with 2 exercises
        sessionMapServiceMock.addFreeFormSession(baseData, {
          exerciseCount: 2,
          setsPerExercise: 1,
          loggedSetCount: 1
        });
        return;
      }

      if (mode === HomePageStoryMode.FreeFormPlanned) {
        // No mesocycle — two upcoming planned free-form sessions
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Upper Body Day',
          startTime: daysFromNow(1),
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 0,
          plannedRepsPerSet: 10,
          plannedWeightPerSet: 135
        });
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Lower Body Day',
          startTime: daysFromNow(3),
          exerciseCount: 4,
          setsPerExercise: 2,
          loggedSetCount: 0,
          plannedRepsPerSet: 8,
          plannedWeightPerSet: 185
        });
        return;
      }

      if (mode === HomePageStoryMode.FreeFormInProgressAndPlanned) {
        // One session in progress + two planned — home section shows all three
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Push Day',
          startTime: daysAgo(0),
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 4
        });
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Pull Day',
          startTime: daysFromNow(2),
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 0,
          plannedRepsPerSet: 10,
          plannedWeightPerSet: 135
        });
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Leg Day',
          startTime: daysFromNow(4),
          exerciseCount: 4,
          setsPerExercise: 2,
          loggedSetCount: 0,
          plannedRepsPerSet: 8,
          plannedWeightPerSet: 185
        });
        return;
      }

      if (mode === HomePageStoryMode.FreeFormWithMesocycle) {
        // Active mesocycle with no session currently in progress + free-form in progress.
        // The free-form hero card takes priority over the "Next Up" mesocycle recommendation.
        const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(11),
          completedSessionCount: 8
        });
        mesocycleMapServiceMock.fillLateFields(data);
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'March 28 Workout',
          startTime: daysAgo(1),
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 4
        });
        return;
      }

      // Default: mix of Completed, NextUp, Upcoming (no in-progress)
      const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(11),
        completedSessionCount: 8
      });
      mesocycleMapServiceMock.fillLateFields(data);
    });

    return () => {
      untrack(() => {
        MockDataService.resetAll();
      });
    };
  });
</script>

<HomePage />
