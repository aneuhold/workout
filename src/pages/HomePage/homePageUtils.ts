import type {
  WorkoutMesocycle,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet
} from '@aneuhold/core-ts-db-lib';
import { WorkoutMesocycleService, WorkoutSessionExerciseService } from '@aneuhold/core-ts-db-lib';
import mesocycleMapService from '$services/documentMapServices/MesocycleMap.service.svelte';
import microcycleMapService from '$services/documentMapServices/MicrocycleMap.service.svelte';
import sessionExerciseMapService from '$services/documentMapServices/SessionExerciseMap.service.svelte';
import sessionMapService from '$services/documentMapServices/SessionMap.service.svelte';
import setMapService from '$services/documentMapServices/SetMap.service.svelte';
import WorkoutAPIService from '$services/WorkoutAPIService/WorkoutAPI.service';

export type HomePageSessionBundle = {
  session: WorkoutSession;
  sessionExercises: WorkoutSessionExercise[];
  sets: WorkoutSet[];
};

function sessionHasAllMetricsFilled(session: WorkoutSession): boolean {
  const exercises = sessionMapService.getOrderedSessionExercisesForSession(session);
  return exercises.every((se) => {
    const seSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
    return WorkoutSessionExerciseService.hasAllSessionMetricsFilled(se, seSets);
  });
}

/**
 * Returns completed sessions that still have exercises needing review,
 * bundled with their session exercises and sets.
 *
 * @param sessions All sessions for the active mesocycle
 */
export function getPendingReviewSessions(sessions: WorkoutSession[]): HomePageSessionBundle[] {
  return sessions
    .filter((s) => s.complete && !sessionHasAllMetricsFilled(s))
    .map((session) => ({
      session,
      sessionExercises: sessionMapService.getOrderedSessionExercisesForSession(session),
      sets: sessionMapService.getOrderedSetsForSession(session)
    }));
}

/**
 * Returns the last N fully-completed (no review needed) sessions,
 * most-recent first.
 *
 * @param sessions All sessions to consider
 * @param limit Maximum number of sessions to return
 */
export function getRecentCompletedSessions(
  sessions: WorkoutSession[],
  limit = 3
): HomePageSessionBundle[] {
  return sessions
    .filter((s) => s.complete && sessionHasAllMetricsFilled(s))
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, limit)
    .map((session) => ({
      session,
      sessionExercises: sessionMapService.getOrderedSessionExercisesForSession(session),
      sets: sessionMapService.getOrderedSetsForSession(session)
    }));
}

/**
 * Regenerates the mesocycle plan from the first incomplete microcycle onward.
 * Uses the batch `prepareDocsForSave` pattern to send a single API call.
 *
 * @param activeMesocycle The mesocycle to regenerate
 * @param options Optional state transitions to apply in the same batch
 * @param options.startMesocycle If true, sets `startDate` on the mesocycle to
 *   its scheduled start (the first microcycle's start), falling back to now
 * @param options.completedMicrocycleNumber 1-indexed microcycle to mark as
 *   completed via `completedDate`
 */
export function regenerateMesocycle(
  activeMesocycle: WorkoutMesocycle,
  options?: {
    startMesocycle?: boolean;
    completedMicrocycleNumber?: number;
  }
): void {
  const docs = mesocycleMapService.getAssociatedDocsAndCTOsForMesocycle(activeMesocycle._id);

  // Apply state transitions before regeneration so the core library sees them
  if (options?.startMesocycle) {
    const scheduledStart = mesocycleMapService.getMesocycleStartDate(
      activeMesocycle,
      docs.microcycles
    );
    activeMesocycle.startDate = scheduledStart ? new Date(scheduledStart) : new Date();
  }

  if (options?.completedMicrocycleNumber != null) {
    const index = options.completedMicrocycleNumber - 1;
    if (index >= 0) {
      const microcycle = docs.microcycles[index];
      microcycle.completedDate = new Date();
    }
  }

  // Call the core library to regenerate
  const result = WorkoutMesocycleService.generateOrUpdateMesocycle(
    activeMesocycle,
    docs.exerciseCTOs,
    docs.volumeCTOs,
    docs.microcycles,
    docs.sessions,
    docs.sessionExercises,
    docs.sets
  );

  // Batch all operations into a single API call
  const apiOptions = mesocycleMapService.prepareDocsForSave({
    update: [activeMesocycle]
  });
  microcycleMapService.prepareDocsForSave(
    {
      delete: result.microcycles?.delete,
      insert: result.microcycles?.create,
      update: docs.microcycles
    },
    apiOptions
  );
  sessionMapService.prepareDocsForSave(
    { delete: result.sessions?.delete, insert: result.sessions?.create },
    apiOptions
  );
  sessionExerciseMapService.prepareDocsForSave(
    { delete: result.sessionExercises?.delete, insert: result.sessionExercises?.create },
    apiOptions
  );
  setMapService.prepareDocsForSave(
    { delete: result.sets?.delete, insert: result.sets?.create },
    apiOptions
  );

  WorkoutAPIService.queryApi(apiOptions);
}
