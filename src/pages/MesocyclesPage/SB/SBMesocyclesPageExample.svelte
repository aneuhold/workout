<script lang="ts" module>
  export enum MesocyclesPageStoryMode {
    Default = 'default',
    NoActive = 'noActive'
  }
</script>

<script lang="ts">
  import { CycleType } from '@aneuhold/core-ts-db-lib';
  import { DateService } from '@aneuhold/core-ts-lib';
  import { untrack } from 'svelte';
  import mesocycleMapServiceMock from '$services/documentMapServices/MesocycleMap.service.mock';
  import MockDataService from '$services/MockDataService/MockData.service';
  import MesocyclesPage from '../MesocyclesPage.svelte';

  let { storyMode = MesocyclesPageStoryMode.Default }: { storyMode?: MesocyclesPageStoryMode } =
    $props();

  function daysAgo(n: number): Date {
    return DateService.addDays(new Date(), -n);
  }

  function daysFromNow(n: number): Date {
    return DateService.addDays(new Date(), n);
  }

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockDataService.resetAll();

      const baseData = MockDataService.setupBaseData();

      if (mode === MesocyclesPageStoryMode.Default) {
        // Active mesocycle (started ~3 weeks ago, 8 completed sessions)
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(21),
          completedSessionCount: 8
        });

        // Future mesocycle (starts in ~2 weeks, no sessions completed)
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Strength Phase',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysFromNow(14),
          completedSessionCount: 0
        });
      }

      // Past mesocycles for both "default" and "noActive"
      mesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Foundation Phase',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(70),
        completedSessionCount: 20,
        completedDate: daysAgo(42)
      });

      mesocycleMapServiceMock.generateFullMesocycle(baseData, {
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
        MockDataService.resetAll();
      });
    };
  });
</script>

<MesocyclesPage />
