<script lang="ts">
  import { CycleType } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import MesocycleMapServiceMock from '$services/documentMapServices/mesocycleMapService.mock';
  import { daysAgo } from '$testUtils/dateUtils';
  import MockData from '$testUtils/MockData';
  import SessionsPage from '../SessionsPage.svelte';

  type StoryMode = 'default' | 'allComplete' | 'review';

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
