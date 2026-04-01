<script lang="ts" module>
  export enum SessionsPageStoryMode {
    Default = 'default',
    AllComplete = 'allComplete',
    Review = 'review',
    FreeFormOnly = 'freeFormOnly',
    FreeFormWithMesocycle = 'freeFormWithMesocycle'
  }
</script>

<script lang="ts">
  import { CycleType } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import MesocycleMapServiceMock from '$services/documentMapServices/mesocycleMapService.mock';
  import { daysAgo } from '$testUtils/dateUtils';
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

      // Default: mix of Completed, InProgress, NextUp, Upcoming
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(21),
        completedSessionCount: 8
      });
      MesocycleMapServiceMock.fillLateFields(data);
      MesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

<SessionsPage />
