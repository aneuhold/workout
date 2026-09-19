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
  import mesocycleMapServiceMock from '$services/documentMapServices/MesocycleMap.service.mock';
  import sessionMapServiceMock from '$services/documentMapServices/SessionMap.service.mock';
  import MockDataService from '$services/MockDataService/MockData.service';
  import { daysAgo, daysFromNow } from '$util/dateUtils';
  import SessionsPage from '../SessionsPage.svelte';

  let { storyMode = SessionsPageStoryMode.Default }: { storyMode?: SessionsPageStoryMode } =
    $props();

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockDataService.resetAll();

      const baseData = MockDataService.setupBaseData();

      if (mode === SessionsPageStoryMode.AllComplete) {
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

      if (mode === SessionsPageStoryMode.Review) {
        // 8 completed sessions but late fields NOT filled → shows as "Review"
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
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
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'March 28 Workout',
          startTime: daysAgo(1),
          complete: true,
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 9
        });
        sessionMapServiceMock.addFreeFormSession(baseData, {
          startTime: daysAgo(0),
          exerciseCount: 2,
          setsPerExercise: 3,
          loggedSetCount: 3
        });
        return;
      }

      if (mode === SessionsPageStoryMode.FreeFormWithMesocycle) {
        const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(21),
          completedSessionCount: 8
        });
        mesocycleMapServiceMock.fillLateFields(data);
        mesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'March 27 Workout',
          startTime: daysAgo(2),
          complete: true,
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 9
        });
        sessionMapServiceMock.addFreeFormSession(baseData, {
          startTime: daysAgo(0),
          exerciseCount: 2,
          setsPerExercise: 3,
          loggedSetCount: 3
        });
        return;
      }

      if (mode === SessionsPageStoryMode.PlannedSessions) {
        // Free-form only: two upcoming planned sessions with targets
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

      if (mode === SessionsPageStoryMode.MixedFreeForm) {
        // Completed, in-progress, and planned sessions all visible
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Full Body — Apr 1',
          startTime: daysAgo(3),
          complete: true,
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 9
        });
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

      if (mode === SessionsPageStoryMode.PaginatedFreeForm) {
        // 12 completed, 12 in-progress, 12 planned — tests pagination in all 3 subsections
        for (let i = 0; i < 12; i++) {
          sessionMapServiceMock.addFreeFormSession(baseData, {
            title: `Completed Session ${i + 1}`,
            startTime: daysAgo(i + 1),
            complete: true,
            exerciseCount: 2,
            setsPerExercise: 2,
            loggedSetCount: 4
          });
          sessionMapServiceMock.addFreeFormSession(baseData, {
            title: `In Progress Session ${i + 1}`,
            startTime: daysAgo(i),
            exerciseCount: 3,
            setsPerExercise: 3,
            loggedSetCount: 2
          });
          sessionMapServiceMock.addFreeFormSession(baseData, {
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
      const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(21),
        completedSessionCount: 8
      });
      mesocycleMapServiceMock.fillLateFields(data);
      mesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
      // 3 completed free-form
      for (let i = 0; i < 3; i++) {
        sessionMapServiceMock.addFreeFormSession(baseData, {
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
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: `Push Session ${i + 1}`,
          startTime: daysAgo(0),
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 3
        });
      }
      // 3 planned free-form
      for (let i = 0; i < 3; i++) {
        sessionMapServiceMock.addFreeFormSession(baseData, {
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
        MockDataService.resetAll();
      });
    };
  });
</script>

<SessionsPage />
