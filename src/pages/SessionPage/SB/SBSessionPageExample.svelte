<script lang="ts" module>
  /**
   * Story modes for the SessionPage Storybook examples.
   */
  export enum SessionPageStoryMode {
    ActiveEarly = 'activeEarly',
    ActiveMid = 'activeMid',
    ActivePrevSoreness = 'activePrevSoreness',
    Deload = 'deload',
    Recovery = 'recovery',
    Review = 'review',
    ViewOnly = 'viewOnly',
    ViewSorenessEditable = 'viewSorenessEditable',
    FreeFormEmpty = 'freeFormEmpty',
    FreeFormMidWorkout = 'freeFormMidWorkout',
    FreeFormAllDone = 'freeFormAllDone',
    FreeFormCompleted = 'freeFormCompleted',
    PlanningEmpty = 'planningEmpty',
    PlanningWithExercises = 'planningWithExercises'
  }
</script>

<script lang="ts">
  import { CycleType } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import { untrack } from 'svelte';
  import MesocycleMapServiceMock, {
    type MockGeneratedMesocycleData
  } from '$services/documentMapServices/mesocycleMapService.mock';
  import timerService from '$services/TimerService';
  import { daysAgo } from '$testUtils/dateUtils';
  import MockData from '$testUtils/MockData';
  import SessionPage from '../SessionPage.svelte';

  let {
    storyMode = SessionPageStoryMode.ActiveEarly
  }: {
    storyMode?: SessionPageStoryMode;
  } = $props();

  timerService.init();

  let sessionId = $state<UUID | null>(null);
  let planning = $state(false);

  const freeFormModes = new Set<SessionPageStoryMode>([
    SessionPageStoryMode.FreeFormEmpty,
    SessionPageStoryMode.FreeFormMidWorkout,
    SessionPageStoryMode.FreeFormAllDone,
    SessionPageStoryMode.FreeFormCompleted,
    SessionPageStoryMode.PlanningEmpty,
    SessionPageStoryMode.PlanningWithExercises
  ]);

  const completedSessionCounts: Partial<Record<SessionPageStoryMode, number>> = {
    [SessionPageStoryMode.ActiveEarly]: 0,
    [SessionPageStoryMode.ActiveMid]: 0,
    [SessionPageStoryMode.Deload]: 0,
    [SessionPageStoryMode.Recovery]: 0,
    [SessionPageStoryMode.ActivePrevSoreness]: 3,
    [SessionPageStoryMode.Review]: 1,
    [SessionPageStoryMode.ViewOnly]: 1,
    [SessionPageStoryMode.ViewSorenessEditable]: 4
  };

  // Modes that navigate to the second microcycle (need exercise overlap with previous session)
  const secondMicrocycleModes = new Set<SessionPageStoryMode>([
    SessionPageStoryMode.ActivePrevSoreness,
    SessionPageStoryMode.ViewSorenessEditable
  ]);

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockData.resetAll();
      planning = false;
      const baseData = MockData.setupBaseData();

      // Free-form modes don't generate a mesocycle
      if (freeFormModes.has(mode)) {
        if (mode === SessionPageStoryMode.FreeFormEmpty) {
          sessionId = MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
            exerciseCount: 0
          })._id;
        } else if (mode === SessionPageStoryMode.FreeFormMidWorkout) {
          sessionId = MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
            exerciseCount: 3,
            loggedSetCount: 2
          })._id;
        } else if (mode === SessionPageStoryMode.FreeFormAllDone) {
          sessionId = MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
            exerciseCount: 3,
            loggedSetCount: 6
          })._id;
        } else if (mode === SessionPageStoryMode.FreeFormCompleted) {
          sessionId = MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
            exerciseCount: 3,
            loggedSetCount: 6,
            complete: true
          })._id;
        } else if (mode === SessionPageStoryMode.PlanningEmpty) {
          sessionId = MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
            exerciseCount: 0
          })._id;
          planning = true;
        } else if (mode === SessionPageStoryMode.PlanningWithExercises) {
          sessionId = MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
            exerciseCount: 3,
            loggedSetCount: 0
          })._id;
          planning = true;
        }
        return;
      }

      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 3,
        sessionsPerMicrocycle: 3,
        startDate: daysAgo(14),
        completedSessionCount: completedSessionCounts[mode] ?? 0
      });

      // Start mesocycle for active modes with no completed sessions
      if (completedSessionCounts[mode] === 0) {
        data.mesocycle.startDate = daysAgo(7);
      }

      // Unlock second microcycle by completing the first
      if (secondMicrocycleModes.has(mode)) {
        data.microcycles[0].completedDate = new Date();
      }

      // Fill late fields for view/prev-soreness modes
      if (
        mode === SessionPageStoryMode.ViewOnly ||
        mode === SessionPageStoryMode.ActivePrevSoreness ||
        mode === SessionPageStoryMode.ViewSorenessEditable
      ) {
        MesocycleMapServiceMock.fillLateFields(data);
      }

      if (mode === SessionPageStoryMode.ActiveMid) {
        MesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
      }

      if (mode === SessionPageStoryMode.Deload) {
        applyDeloadToFirstSession(data);
      }

      if (mode === SessionPageStoryMode.Recovery) {
        applyRecoveryToFirstSession(data);
      }

      const targetIndex = secondMicrocycleModes.has(mode) ? 3 : 0;
      sessionId = data.sessions[targetIndex]._id;
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
        timerService.stop();
      });
    };
  });

  /**
   * Flags the first two session exercises in the first session as recovery exercises.
   *
   * @param data The generated mesocycle data to modify in-place
   */
  function applyRecoveryToFirstSession(data: MockGeneratedMesocycleData) {
    const targetSession = data.sessions[0];
    let flagged = 0;
    for (const se of data.sessionExercises) {
      if (se.workoutSessionId !== targetSession._id) continue;
      se.isRecoveryExercise = true;
      flagged++;
      if (flagged >= 2) break;
    }
  }

  /**
   * Trims the first session's exercises to 1 set each with null RIR and halved reps,
   * simulating a deload session.
   *
   * @param data The generated mesocycle data to modify in-place
   */
  function applyDeloadToFirstSession(data: MockGeneratedMesocycleData) {
    const targetSession = data.sessions[0];
    for (const se of data.sessionExercises) {
      if (se.workoutSessionId !== targetSession._id) continue;
      const seSets = data.sets.filter((s) => s.workoutSessionExerciseId === se._id);
      if (seSets.length > 0) {
        seSets[0].plannedRir = null;
        seSets[0].plannedReps = Math.floor((seSets[0].plannedReps ?? 8) / 2);
        se.setOrder = [seSets[0]._id];
      }
    }
  }
</script>

<SessionPage {sessionId} {planning} />
