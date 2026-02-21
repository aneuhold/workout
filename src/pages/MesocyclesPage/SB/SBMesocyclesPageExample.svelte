<script lang="ts">
  import { CycleType } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import { generateFullMockMesocycle } from '$services/documentMapServices/mesocycleMapService.mock';
  import MockData from '$testUtils/MockData';
  import MesocyclesPage from '../MesocyclesPage.svelte';

  let {
    storyMode = 'default'
  }: {
    storyMode?: 'default' | 'noActive';
  } = $props();

  function daysAgo(n: number): Date {
    return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  }

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockData.resetAll();

      const baseData = MockData.setupBaseData();

      if (mode === 'default') {
        // Active mesocycle (started ~3 weeks ago, 8 completed sessions)
        generateFullMockMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(21),
          completedSessionCount: 8
        });
      }

      // Past mesocycles for both "default" and "noActive"
      generateFullMockMesocycle(baseData, {
        title: 'Foundation Phase',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(70),
        completedSessionCount: 20,
        completedDate: daysAgo(42)
      });

      generateFullMockMesocycle(baseData, {
        title: 'Deload & Recovery',
        cycleType: CycleType.Resensitization,
        microcycleCount: 2,
        startDate: daysAgo(98),
        completedSessionCount: 10,
        completedDate: daysAgo(72)
      });
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

<MesocyclesPage />
