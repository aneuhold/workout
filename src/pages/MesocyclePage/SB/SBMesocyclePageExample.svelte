<script lang="ts" module>
  export enum MesocyclePageStoryMode {
    New = 'new',
    NewWithExisting = 'newWithExisting',
    NewOverlapping = 'newOverlapping',
    Edit = 'edit',
    Static = 'static',
    Completed = 'completed',
    NotFound = 'notFound'
  }
</script>

<script lang="ts">
  import { CycleType, DocumentService } from '@aneuhold/core-ts-db-lib';
  import { DateService } from '@aneuhold/core-ts-lib';
  import type { UUID } from 'crypto';
  import { untrack } from 'svelte';
  import mesocycleMapServiceMock from '$services/documentMapServices/MesocycleMap.service.mock';
  import MockDataService from '$services/MockDataService/MockData.service';
  import MesocyclePage from '../MesocyclePage.svelte';

  let { storyMode = MesocyclePageStoryMode.New }: { storyMode?: MesocyclePageStoryMode } = $props();

  function daysAgo(n: number): Date {
    return DateService.addDays(new Date(), -n);
  }

  function daysFromNow(n: number): Date {
    return DateService.addDays(new Date(), n);
  }

  let mesocycleId = $state<UUID | null>(null);

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockDataService.resetAll();

      if (mode === MesocyclePageStoryMode.New) {
        MockDataService.setupBaseData();
        mesocycleId = null;
        return;
      }

      if (mode === MesocyclePageStoryMode.NewWithExisting) {
        const baseData = MockDataService.setupBaseData();
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Current Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(14),
          completedSessionCount: 6
        });
        mesocycleId = null;
        return;
      }

      if (mode === MesocyclePageStoryMode.NewOverlapping) {
        const baseData = MockDataService.setupBaseData();

        // Active mesocycle ending in ~7 days
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Current Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 2,
          startDate: daysAgo(7),
          completedSessionCount: 4
        });

        // Future mesocycle starting 14 days from now (not yet started, 2 microcycles
        // so its end date stays close to the gap for calendar visibility)
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Upcoming Strength Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 2,
          startDate: daysFromNow(14),
          completedSessionCount: 0
        });

        mesocycleId = null;
        return;
      }

      if (mode === MesocyclePageStoryMode.NotFound) {
        mesocycleId = DocumentService.generateID();
        return;
      }

      const baseData = MockDataService.setupBaseData();

      if (mode === MesocyclePageStoryMode.Edit) {
        const { mesocycle } = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Strength Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: new Date(),
          completedSessionCount: 0
        });

        mesocycleId = mesocycle._id;
        return;
      }

      if (mode === MesocyclePageStoryMode.Completed) {
        const { mesocycle } = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
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
      const { mesocycle } = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
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
        MockDataService.resetAll();
      });
    };
  });
</script>

<MesocyclePage {mesocycleId} />
