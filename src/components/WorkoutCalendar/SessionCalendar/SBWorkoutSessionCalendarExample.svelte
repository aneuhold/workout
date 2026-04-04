<script lang="ts">
  import type {
    WorkoutExercise,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import { untrack } from 'svelte';
  import { MockDefaultExercise } from '$services/documentMapServices/exerciseMapService.mock';
  import MockData from '$testUtils/MockData';
  import WorkoutSessionCalendar from './WorkoutSessionCalendar.svelte';

  let {
    empty = false
  }: {
    /** When true, renders the calendar with no session data. */
    empty?: boolean;
  } = $props();

  let exercises = $state<WorkoutExercise[]>([]);
  let sessions = $state<WorkoutSession[]>([]);
  let sessionExercises = $state<WorkoutSessionExercise[]>([]);
  let sets = $state<WorkoutSet[]>([]);

  $effect(() => {
    const _empty = empty;

    untrack(() => {
      MockData.resetAll();

      if (_empty) {
        exercises = [];
        sessions = [];
        sessionExercises = [];
        sets = [];
        return;
      }

      const baseData = MockData.setupBaseData();
      const bench =
        MockData.exerciseMapServiceMock.defaultExercises[MockDefaultExercise.BarbellBenchPress];
      const pullUps = MockData.exerciseMapServiceMock.defaultExercises[MockDefaultExercise.PullUps];
      const squat =
        MockData.exerciseMapServiceMock.defaultExercises[MockDefaultExercise.BarbellSquat];
      const rdl =
        MockData.exerciseMapServiceMock.defaultExercises[MockDefaultExercise.RomanianDeadlift];

      const now = new Date();
      const yr = now.getFullYear();
      const mo = now.getMonth(); // 0-based
      const d = now.getDate();

      // Create a mesocycle + microcycle spanning prev month through next month
      const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle({
        plannedMicrocycleCount: 2
      });
      const microcycle = MockData.microcycleMapServiceMock.addMicrocycle({
        workoutMesocycleId: mesocycle._id,
        startDate: new Date(yr, mo - 1, 1),
        endDate: new Date(yr, mo + 2, 0)
      });
      const microcycleId: UUID = microcycle._id;

      const allSessions: WorkoutSession[] = [];
      const allSEs: WorkoutSessionExercise[] = [];
      const allSets: WorkoutSet[] = [];

      /**
       * Creates a session (mesocycle or free-form), attaches exercises and planned/actual sets.
       *
       * @param title Session title
       * @param startTime Start time for the session
       * @param complete Whether the session is completed
       * @param workoutMicrocycleId Null for free-form, UUID for mesocycle
       * @param configs Exercise configurations for the session
       */
      function buildSession(
        title: string,
        startTime: Date,
        complete: boolean,
        workoutMicrocycleId: UUID | null,
        configs: Array<{ ex: WorkoutExercise; setCount: number; isRecovery?: boolean }>
      ): void {
        const session = MockData.sessionMapServiceMock.addSession({
          workoutMicrocycleId: workoutMicrocycleId ?? undefined,
          title,
          startTime,
          complete
        });
        allSessions.push(session);

        for (const cfg of configs) {
          const se = MockData.sessionExerciseMapServiceMock.addSessionExercise({
            workoutSessionId: session._id,
            workoutExerciseId: cfg.ex._id
          });
          if (cfg.isRecovery) se.isRecoveryExercise = true;
          allSEs.push(se);

          for (let i = 0; i < cfg.setCount; i++) {
            const set = MockData.setMapServiceMock.addSet({
              workoutExerciseId: cfg.ex._id,
              workoutSessionId: session._id,
              workoutSessionExerciseId: se._id,
              plannedReps: 8,
              plannedWeight: 100,
              plannedRir: 2,
              ...(complete ? { actualReps: 8, actualWeight: 100, rir: 2 } : {})
            });
            allSets.push(set);
          }
        }
      }

      // --- Previous month: simple completed sessions ---
      buildSession('Push Day', new Date(yr, mo - 1, 18), true, microcycleId, [
        { ex: bench, setCount: 3 },
        { ex: rdl, setCount: 2 }
      ]);
      buildSession('Morning Workout', new Date(yr, mo - 1, 27), true, null, [
        { ex: squat, setCount: 3 }
      ]);

      // --- Past multi-type day (d - 3): all 3 session types, all completed ---
      buildSession('Cardio & Squat', new Date(yr, mo, d - 3), true, null, [
        { ex: squat, setCount: 3 },
        { ex: rdl, setCount: 2 }
      ]);
      buildSession('Push A', new Date(yr, mo, d - 3), true, microcycleId, [
        { ex: bench, setCount: 3 },
        { ex: rdl, setCount: 2 }
      ]);
      buildSession('Recovery Day', new Date(yr, mo, d - 3), true, microcycleId, [
        { ex: pullUps, setCount: 2, isRecovery: true },
        { ex: bench, setCount: 2 }
      ]);

      // --- Another completed session 1 day before today ---
      buildSession('Pull Day', new Date(yr, mo, d - 1), true, microcycleId, [
        { ex: pullUps, setCount: 3 },
        { ex: rdl, setCount: 2 }
      ]);

      // --- Future single sessions ---
      buildSession('Quick Workout', new Date(yr, mo, d + 8), false, null, [
        { ex: squat, setCount: 2 },
        { ex: rdl, setCount: 2 }
      ]);
      buildSession('Leg Day', new Date(yr, mo, d + 14), false, microcycleId, [
        { ex: rdl, setCount: 3 },
        { ex: squat, setCount: 3 }
      ]);

      // --- Future multi-type day (d + 16): all 3 session types, all incomplete ---
      buildSession('Evening Workout', new Date(yr, mo, d + 16), false, null, [
        { ex: squat, setCount: 3 }
      ]);
      buildSession('Push B', new Date(yr, mo, d + 16), false, microcycleId, [
        { ex: bench, setCount: 3 },
        { ex: rdl, setCount: 2 }
      ]);
      buildSession('Recovery Block', new Date(yr, mo, d + 16), false, microcycleId, [
        { ex: pullUps, setCount: 2, isRecovery: true },
        { ex: bench, setCount: 2 }
      ]);

      // --- Another future session 23 days from today ---
      buildSession('Upper Body', new Date(yr, mo, d + 23), false, microcycleId, [
        { ex: bench, setCount: 4 },
        { ex: pullUps, setCount: 3 }
      ]);

      // --- Next month: simple upcoming sessions ---
      buildSession('Push Day', new Date(yr, mo + 1, 8), false, microcycleId, [
        { ex: bench, setCount: 3 }
      ]);
      buildSession('Free Workout', new Date(yr, mo + 1, 15), false, null, [
        { ex: squat, setCount: 2 }
      ]);

      exercises = baseData.exercises;
      sessions = allSessions;
      sessionExercises = allSEs;
      sets = allSets;
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

<div class="p-4">
  <WorkoutSessionCalendar {sessions} {sessionExercises} {sets} {exercises} />
</div>
