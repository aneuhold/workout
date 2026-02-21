import type { WorkoutSession, WorkoutSessionExercise, WorkoutSet } from '@aneuhold/core-ts-db-lib';
import { WorkoutSessionExerciseService, WorkoutSetService } from '@aneuhold/core-ts-db-lib';
import { SessionStatus } from './sessionCardTypes';

/**
 * Determines the display status of a session for the sessions page.
 *
 * @param session The session to evaluate
 * @param sets All sets across the mesocycle, used to determine if any sets in the session are completed
 * @param sessionExercises All session exercises across the mesocycle, used to determine if any exercises in the session need review
 * @param isInProgress Whether this session is the currently in-progress session
 * @param isNextUp Whether this session is the next up session
 */
export function getSessionStatus(
  session: WorkoutSession,
  sets: WorkoutSet[],
  sessionExercises: WorkoutSessionExercise[],
  isInProgress: boolean,
  isNextUp: boolean
): SessionStatus {
  if (!session.complete && isInProgress) return SessionStatus.InProgress;
  if (!session.complete && isNextUp) return SessionStatus.NextUp;
  if (!session.complete) return SessionStatus.Upcoming;

  const hasUnfilledMetrics = sessionExercises.some((se) => {
    const seSets = sets.filter((s) => s.workoutSessionExerciseId === se._id);
    return !WorkoutSessionExerciseService.hasAllSessionMetricsFilled(se, seSets);
  });
  return hasUnfilledMetrics ? SessionStatus.Review : SessionStatus.Completed;
}

/**
 * Counts the number of completed sets.
 *
 * @param sets The sets to evaluate
 */
export function countCompletedSets(sets: WorkoutSet[]): number {
  return sets.filter((s) => WorkoutSetService.isCompleted(s)).length;
}

/**
 * Sums RSM totals across all session exercises that have RSM data.
 *
 * @param sessionExercises The session exercises to evaluate
 */
export function computeSessionRsmTotal(sessionExercises: WorkoutSessionExercise[]): number | null {
  let total = 0;
  let hasAny = false;
  for (const se of sessionExercises) {
    const rsm = WorkoutSessionExerciseService.getRsmTotal(se);
    if (rsm != null) {
      total += rsm;
      hasAny = true;
    }
  }
  return hasAny ? total : null;
}
