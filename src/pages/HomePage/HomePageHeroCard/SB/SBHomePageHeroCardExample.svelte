<script lang="ts" module>
  export enum HomePageHeroCardStoryMode {
    ContinueSession = 'ContinueSession',
    FreeFormInProgress = 'FreeFormInProgress',
    FreeFormWithMesocycle = 'FreeFormWithMesocycle',
    StartSession = 'StartSession',
    StartSessionLate = 'StartSessionLate',
    StartSessionSeverelyLate = 'StartSessionSeverelyLate',
    CompleteMicrocycle = 'CompleteMicrocycle',
    CompleteMicrocycleBlocked = 'CompleteMicrocycleBlocked',
    EditMesocycle = 'EditMesocycle',
    StartMesocycle = 'StartMesocycle',
    CompleteMesocycle = 'CompleteMesocycle',
    CompleteMesocycleBlocked = 'CompleteMesocycleBlocked'
  }
</script>

<script lang="ts">
  import { CycleType } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import MesocycleMapServiceMock from '$services/documentMapServices/mesocycleMapService.mock';
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
  import { daysAgo } from '$testUtils/dateUtils';
  import MockData from '$testUtils/MockData';
  import { getPendingReviewSessions } from '../../homePageUtils';
  import HomePageHeroCard from '../HomePageHeroCard.svelte';

  let {
    storyMode = HomePageHeroCardStoryMode.StartSession
  }: {
    storyMode?: HomePageHeroCardStoryMode;
  } = $props();

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockData.resetAll();
      const baseData = MockData.setupBaseData();

      if (mode === HomePageHeroCardStoryMode.ContinueSession) {
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(21),
          completedSessionCount: 8
        });
        MesocycleMapServiceMock.fillLateFields(data);
        MesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
        return;
      }

      if (mode === HomePageHeroCardStoryMode.FreeFormInProgress) {
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          exerciseCount: 2,
          setsPerExercise: 1,
          loggedSetCount: 1
        });
        return;
      }

      if (mode === HomePageHeroCardStoryMode.FreeFormWithMesocycle) {
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(11),
          completedSessionCount: 8
        });
        MesocycleMapServiceMock.fillLateFields(data);
        MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'March 28 Workout',
          startTime: daysAgo(1),
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 4
        });
        return;
      }

      if (mode === HomePageHeroCardStoryMode.StartSession) {
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(11),
          completedSessionCount: 8
        });
        MesocycleMapServiceMock.fillLateFields(data);
        return;
      }

      if (mode === HomePageHeroCardStoryMode.StartSessionLate) {
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(12),
          completedSessionCount: 8
        });
        MesocycleMapServiceMock.fillLateFields(data);
        return;
      }

      if (mode === HomePageHeroCardStoryMode.StartSessionSeverelyLate) {
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(25),
          completedSessionCount: 8
        });
        MesocycleMapServiceMock.fillLateFields(data);
        return;
      }

      if (mode === HomePageHeroCardStoryMode.CompleteMicrocycle) {
        const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 6,
          startDate: daysAgo(14),
          completedSessionCount: 10
        });
        MesocycleMapServiceMock.fillLateFields(data);
        return;
      }

      if (mode === HomePageHeroCardStoryMode.CompleteMicrocycleBlocked) {
        MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 6,
          startDate: daysAgo(14),
          completedSessionCount: 10
        });
        return;
      }

      if (mode === HomePageHeroCardStoryMode.EditMesocycle) {
        MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 6,
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          completedSessionCount: 0
        });
        return;
      }

      if (mode === HomePageHeroCardStoryMode.StartMesocycle) {
        MesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 6,
          startDate: daysAgo(0),
          completedSessionCount: 0
        });
        return;
      }

      if (mode === HomePageHeroCardStoryMode.CompleteMesocycle) {
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

      // CompleteMesocycleBlocked (last remaining variant)
      MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(28),
        completedSessionCount: 999
      });
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });

  const activeMesocycle = $derived(mesocycleMapService.categorizedMesocycles.active);
  const microcycles = $derived(
    activeMesocycle
      ? microcycleMapService.getOrderedMicrocyclesForMesocycle(activeMesocycle._id)
      : []
  );
  const docs = $derived(
    activeMesocycle
      ? mesocycleMapService.getAssociatedDocsAndCTOsForMesocycle(activeMesocycle._id)
      : null
  );
  const inProgressSession = $derived(mesocycleMapService.activeAndNextSessions.inProgressSession);
  const nextUpSession = $derived(mesocycleMapService.activeAndNextSessions.nextUpSession);
  const pendingLogs = $derived(docs ? getPendingReviewSessions(docs.sessions) : []);
</script>

<div class="p-4">
  <HomePageHeroCard
    {activeMesocycle}
    {microcycles}
    sessions={docs?.sessions ?? []}
    {inProgressSession}
    {nextUpSession}
    {pendingLogs}
  />
</div>
