<script lang="ts">
  import { CycleType, DocumentService } from '@aneuhold/core-ts-db-lib';
  import { DateService } from '@aneuhold/core-ts-lib';
  import { untrack } from 'svelte';
  import MesocycleMapServiceMock from '$services/documentMapServices/mesocycleMapService.mock';
  import MockData from '$testUtils/MockData';
  import MesocyclePage from '../MesocyclePage.svelte';

  let {
    storyMode = 'new'
  }: {
    storyMode?: 'new' | 'newWithExisting' | 'edit' | 'static' | 'completed' | 'notFound';
  } = $props();

  function daysAgo(n: number): Date {
    return DateService.addDays(new Date(), -n);
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

      if (mode === 'newWithExisting') {
        const baseData = MockData.setupBaseData();
        MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Current Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(14),
          completedSessionCount: 6
        });
        mesocycleId = null;
        return;
      }

      if (mode === 'notFound') {
        mesocycleId = DocumentService.generateID();
        return;
      }

      const baseData = MockData.setupBaseData();

      if (mode === 'edit') {
        const { mesocycle } = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Strength Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: new Date(),
          completedSessionCount: 0
        });

        mesocycleId = mesocycle._id;
        return;
      }

      if (mode === 'completed') {
        const { mesocycle } = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Completed Strength Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(35),
          completedSessionCount: 20,
          completedDate: daysAgo(7)
        });

        mesocycleId = mesocycle._id;
        return;
      }

      // static mode — active mesocycle with dropdown showing Deload / End
      const { mesocycle } = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
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
