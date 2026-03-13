<script lang="ts">
  import { CycleType } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import MesocycleMapServiceMock, {
    type MockGeneratedMesocycleData
  } from '$services/documentMapServices/mesocycleMapService.mock';
  import timerService from '$services/TimerService';
  import { daysAgo } from '$testUtils/dateUtils';
  import MockData from '$testUtils/MockData';
  import SessionPage from '../SessionPage.svelte';

  type StoryMode =
    | 'activeEarly'
    | 'activeMid'
    | 'activePrevSoreness'
    | 'deload'
    | 'recovery'
    | 'review'
    | 'viewOnly'
    | 'viewSorenessEditable';

  let { storyMode = 'activeEarly' as StoryMode }: { storyMode?: StoryMode } = $props();

  timerService.init();

  let sessionId = $state<string | null>(null);

  const completedSessionCounts: Record<StoryMode, number> = {
    activeEarly: 0,
    activeMid: 0,
    deload: 0,
    recovery: 0,
    activePrevSoreness: 3,
    review: 1,
    viewOnly: 1,
    viewSorenessEditable: 4
  };

  // Modes that navigate to the second microcycle (need exercise overlap with previous session)
  const secondMicrocycleModes = new Set<StoryMode>(['activePrevSoreness', 'viewSorenessEditable']);

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockData.resetAll();
      const baseData = MockData.setupBaseData();

      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 3,
        sessionsPerMicrocycle: 3,
        startDate: daysAgo(14),
        completedSessionCount: completedSessionCounts[mode]
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
      if (mode === 'viewOnly' || mode === 'activePrevSoreness' || mode === 'viewSorenessEditable') {
        MesocycleMapServiceMock.fillLateFields(data);
      }

      if (mode === 'activeMid') {
        MesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
      }

      if (mode === 'deload') {
        applyDeloadToFirstSession(data);
      }

      if (mode === 'recovery') {
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

<SessionPage {sessionId} />
