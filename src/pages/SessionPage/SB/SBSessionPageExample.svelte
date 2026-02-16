<script lang="ts">
  import type { WorkoutExercise } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import { untrack } from 'svelte';
  import timerService from '$services/TimerService';
  import MockData from '$testUtils/MockData';
  import SessionPage from '../SessionPage.svelte';

  type StoryMode = 'activeEarly' | 'activeMid' | 'review' | 'viewOnly';

  let { storyMode = 'activeEarly' as StoryMode }: { storyMode?: StoryMode } = $props();

  timerService.init();

  let sessionId = $state<string | null>(null);

  $effect(() => {
    const currentMode = storyMode;

    untrack(() => {
      MockData.resetAll();

      const { exercises } = MockData.setupBaseData();

      // Pick 3 exercises for the session
      const benchPress = exercises[0]; // Barbell Bench Press
      const pullups = exercises[1]; // Pull-ups
      const squats = exercises[2]; // Barbell Squat

      const isComplete = currentMode === 'review' || currentMode === 'viewOnly';

      // Create session
      const session = MockData.sessionMapServiceMock.addSession({
        title: 'Push Day A',
        startTime: new Date(),
        complete: isComplete
      });

      // Helper to create sets for an exercise
      function createSetsForExercise(
        exercise: WorkoutExercise,
        sessionExerciseId: UUID,
        numSets: number,
        completedSets: number,
        baseWeight: number,
        baseReps: number,
        baseRir: number
      ) {
        const setIds: UUID[] = [];
        for (let i = 0; i < numSets; i++) {
          const isCompleted = i < completedSets;
          const set = MockData.setMapServiceMock.addSet({
            workoutExerciseId: exercise._id,
            workoutSessionId: session._id,
            workoutSessionExerciseId: sessionExerciseId,
            plannedWeight: baseWeight,
            plannedReps: baseReps,
            plannedRir: baseRir,
            ...(isCompleted
              ? {
                  actualWeight: baseWeight,
                  actualReps: baseReps + (i === 0 ? 1 : 0),
                  rir: baseRir
                }
              : {})
          });
          setIds.push(set._id);
        }
        return setIds;
      }

      // Determine how many sets are completed per exercise based on mode
      const benchCompletedSets =
        currentMode === 'activeEarly' ? 0 : currentMode === 'activeMid' ? 3 : 3;
      const pullupCompletedSets =
        currentMode === 'activeEarly' ? 0 : currentMode === 'activeMid' ? 1 : 3;
      const squatCompletedSets =
        currentMode === 'activeEarly' ? 0 : currentMode === 'activeMid' ? 0 : 3;

      // Create session exercises with sets
      // We need a temporary ID first to create sets
      const benchSE = MockData.sessionExerciseMapServiceMock.addSessionExercise({
        workoutSessionId: session._id,
        workoutExerciseId: benchPress._id
      });
      const benchSetIds = createSetsForExercise(
        benchPress,
        benchSE._id,
        3,
        benchCompletedSets,
        135,
        10,
        2
      );
      // Update set order
      benchSE.setOrder = benchSetIds;

      const pullupSE = MockData.sessionExerciseMapServiceMock.addSessionExercise({
        workoutSessionId: session._id,
        workoutExerciseId: pullups._id
      });
      const pullupSetIds = createSetsForExercise(
        pullups,
        pullupSE._id,
        3,
        pullupCompletedSets,
        0,
        8,
        3
      );
      pullupSE.setOrder = pullupSetIds;

      const squatSE = MockData.sessionExerciseMapServiceMock.addSessionExercise({
        workoutSessionId: session._id,
        workoutExerciseId: squats._id
      });
      const squatSetIds = createSetsForExercise(
        squats,
        squatSE._id,
        3,
        squatCompletedSets,
        185,
        8,
        2
      );
      squatSE.setOrder = squatSetIds;

      // Update session exercise order
      session.sessionExerciseOrder = [benchSE._id, pullupSE._id, squatSE._id];

      // Add RSM/fatigue metrics for completed exercises in review/view modes
      if (currentMode === 'review' || currentMode === 'viewOnly') {
        const immediateRsm = { mindMuscleConnection: 2, pump: 2, disruption: null };
        const immediateFatigue = {
          jointAndTissueDisruption: 1,
          perceivedEffort: 2,
          unusedMusclePerformance: null
        };

        benchSE.rsm = immediateRsm;
        benchSE.fatigue = immediateFatigue;
        benchSE.performanceScore = 2;

        pullupSE.rsm = immediateRsm;
        pullupSE.fatigue = immediateFatigue;
        pullupSE.performanceScore = 1;

        squatSE.rsm = immediateRsm;
        squatSE.fatigue = immediateFatigue;
        squatSE.performanceScore = 2;

        if (currentMode === 'viewOnly') {
          // Fill in late fields
          benchSE.rsm = { mindMuscleConnection: 2, pump: 2, disruption: 1 };
          benchSE.fatigue = {
            jointAndTissueDisruption: 1,
            perceivedEffort: 2,
            unusedMusclePerformance: 1
          };
          benchSE.sorenessScore = 1;

          pullupSE.rsm = { mindMuscleConnection: 2, pump: 2, disruption: 0 };
          pullupSE.fatigue = {
            jointAndTissueDisruption: 0,
            perceivedEffort: 1,
            unusedMusclePerformance: 1
          };
          pullupSE.sorenessScore = 0;

          squatSE.rsm = { mindMuscleConnection: 2, pump: 2, disruption: 2 };
          squatSE.fatigue = {
            jointAndTissueDisruption: 2,
            perceivedEffort: 3,
            unusedMusclePerformance: 2
          };
          squatSE.sorenessScore = 2;
        }
      }

      sessionId = session._id;
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
        timerService.stop();
      });
    };
  });
</script>

<SessionPage {sessionId} />
