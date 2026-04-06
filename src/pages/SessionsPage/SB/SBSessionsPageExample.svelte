<script lang="ts" module>
  export enum SessionsPageStoryMode {
    Default = 'default',
    AllComplete = 'allComplete',
    Review = 'review',
    FreeFormOnly = 'freeFormOnly',
    FreeFormWithMesocycle = 'freeFormWithMesocycle',
    PlannedSessions = 'plannedSessions',
    MixedFreeForm = 'mixedFreeForm',
    PaginatedFreeForm = 'paginatedFreeForm'
  }
</script>

<script lang="ts">
  import { CycleType } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import MesocycleMapServiceMock from '$services/documentMapServices/mesocycleMapService.mock';
  import { daysAgo, daysFromNow } from '$testUtils/dateUtils';
  import MockData from '$testUtils/MockData';
  import SessionsPage from '../SessionsPage.svelte';

  let { storyMode = SessionsPageStoryMode.Default }: { storyMode?: SessionsPageStoryMode } =
    $props();

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockData.resetAll();

      const baseData = MockData.setupBaseData();

      if (mode === SessionsPageStoryMode.AllComplete) {
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

      if (mode === SessionsPageStoryMode.Review) {
        // 8 completed sessions but late fields NOT filled → shows as "Review"
        MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(21),
          completedSessionCount: 8
        });
        return;
      }

      if (mode === SessionsPageStoryMode.FreeFormOnly) {
        // No mesocycle, only free-form sessions
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'March 28 Workout',
          startTime: daysAgo(1),
          complete: true,
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 9
        });
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          startTime: daysAgo(0),
          exerciseCount: 2,
          setsPerExercise: 3,
          loggedSetCount: 3
        });
        return;
      }

      if (mode === SessionsPageStoryMode.FreeFormWithMesocycle) {
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(21),
          completedSessionCount: 8
        });
        MesocycleMapServiceMock.fillLateFields(data);
        MesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'March 27 Workout',
          startTime: daysAgo(2),
          complete: true,
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 9
        });
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          startTime: daysAgo(0),
          exerciseCount: 2,
          setsPerExercise: 3,
          loggedSetCount: 3
        });
        return;
      }

      if (mode === SessionsPageStoryMode.PlannedSessions) {
        // Free-form only: two upcoming planned sessions with targets
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Upper Body Day',
          startTime: daysFromNow(1),
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 0,
          plannedRepsPerSet: 10,
          plannedWeightPerSet: 135
        });
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
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

      if (mode === SessionsPageStoryMode.MixedFreeForm) {
        // Completed, in-progress, and planned sessions all visible
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Full Body — Apr 1',
          startTime: daysAgo(3),
          complete: true,
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 9
        });
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Push Day',
          startTime: daysAgo(0),
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 4
        });
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Pull Day',
          startTime: daysFromNow(2),
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 0,
          plannedRepsPerSet: 10,
          plannedWeightPerSet: 135
        });
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
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

      if (mode === SessionsPageStoryMode.PaginatedFreeForm) {
        // 12 completed, 12 in-progress, 12 planned — tests pagination in all 3 subsections
        for (let i = 0; i < 12; i++) {
          MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
            title: `Completed Session ${i + 1}`,
            startTime: daysAgo(i + 1),
            complete: true,
            exerciseCount: 2,
            setsPerExercise: 2,
            loggedSetCount: 4
          });
          MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
            title: `In Progress Session ${i + 1}`,
            startTime: daysAgo(i),
            exerciseCount: 3,
            setsPerExercise: 3,
            loggedSetCount: 2
          });
          MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
            title: `Planned Session ${i + 1}`,
            startTime: daysFromNow(i + 1),
            exerciseCount: 3,
            setsPerExercise: 2,
            loggedSetCount: 0,
            plannedRepsPerSet: 10,
            plannedWeightPerSet: 135
          });
        }
        return;
      }

      // Default: mesocycle mix + 3 free-form sessions of each type
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(21),
        completedSessionCount: 8
      });
      MesocycleMapServiceMock.fillLateFields(data);
      MesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
      // 3 completed free-form
      for (let i = 0; i < 3; i++) {
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          title: `Full Body — ${3 - i} days ago`,
          startTime: daysAgo(i + 1),
          complete: true,
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 9
        });
      }
      // 3 in-progress free-form
      for (let i = 0; i < 3; i++) {
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          title: `Push Session ${i + 1}`,
          startTime: daysAgo(0),
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 3
        });
      }
      // 3 planned free-form
      for (let i = 0; i < 3; i++) {
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          title: `Planned Session ${i + 1}`,
          startTime: daysFromNow(i + 1),
          exerciseCount: 3,
          setsPerExercise: 2,
          loggedSetCount: 0,
          plannedRepsPerSet: 10,
          plannedWeightPerSet: 135
        });
      }
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

<SessionsPage />
