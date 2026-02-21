<script lang="ts">
  import { CycleType, DocumentService } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import { generateFullMockMesocycle } from '$services/documentMapServices/mesocycleMapService.mock';
  import MockData from '$testUtils/MockData';
  import MesocyclePage from '../MesocyclePage.svelte';

  let { storyMode = 'new' }: { storyMode?: 'new' | 'edit' | 'static' | 'notFound' } = $props();

  function daysAgo(n: number): Date {
    return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  }

  let mesocycleId = $state<string | null>(null);

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockData.resetAll();

      if (mode === 'new') {
        MockData.setupBaseData();
        mesocycleId = null;
        return;
      }

      if (mode === 'notFound') {
        mesocycleId = DocumentService.generateID();
        return;
      }

      const baseData = MockData.setupBaseData();

      if (mode === 'edit') {
        const { mesocycle } = generateFullMockMesocycle(baseData, {
          title: 'Strength Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: new Date(),
          completedSessionCount: 0
        });

        mesocycleId = mesocycle._id;
        return;
      }

      // static mode
      const { mesocycle } = generateFullMockMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(21),
        completedSessionCount: 8
      });

      mesocycleId = mesocycle._id;
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

<MesocyclePage {mesocycleId} />
