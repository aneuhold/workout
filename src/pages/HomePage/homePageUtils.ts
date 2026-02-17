import type {
  WorkoutMicrocycle,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet
} from '@aneuhold/core-ts-db-lib';
import { WorkoutSessionExerciseService } from '@aneuhold/core-ts-db-lib';
import sessionExerciseMapService from '$services/documentMapServices/sessionExerciseMapService.svelte';
import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';

export type HomePageMicrocycleInfo = {
  microcycle: WorkoutMicrocycle;
  weekNumber: number;
  isDeload: boolean;
};

export type HomePageSessionBundle = {
  session: WorkoutSession;
  sessionExercises: WorkoutSessionExercise[];
  sets: WorkoutSet[];
};

/**
 * Finds the microcycle containing the in-progress or next-up session.
 * Falls back to the last microcycle with any incomplete session.
 *
 * @param microcycles Ordered microcycles for the active mesocycle
 * @param sessions All sessions for the active mesocycle
 * @param inProgressSession The currently in-progress session, if any
 * @param nextUpSession The next-up session, if any
 */
export function getCurrentMicrocycle(
  microcycles: WorkoutMicrocycle[],
  sessions: WorkoutSession[],
  inProgressSession: WorkoutSession | null,
  nextUpSession: WorkoutSession | null
): HomePageMicrocycleInfo | null {
  if (microcycles.length === 0) return null;

  const heroSession = inProgressSession ?? nextUpSession;

  if (heroSession?.workoutMicrocycleId) {
    const index = microcycles.findIndex((mc) => mc._id === heroSession.workoutMicrocycleId);
    if (index >= 0) {
      return {
        microcycle: microcycles[index],
        weekNumber: index + 1,
        isDeload: index === microcycles.length - 1 && microcycles.length > 1
      };
    }
  }

  // Fallback: last microcycle with any incomplete session
  for (let i = microcycles.length - 1; i >= 0; i--) {
    const mc = microcycles[i];
    const hasIncomplete = sessions.some((s) => s.workoutMicrocycleId === mc._id && !s.complete);
    if (hasIncomplete) {
      return {
        microcycle: mc,
        weekNumber: i + 1,
        isDeload: i === microcycles.length - 1 && microcycles.length > 1
      };
    }
  }

  return null;
}

function sessionNeedsReview(session: WorkoutSession): boolean {
  const exercises = sessionMapService.getOrderedSessionExercisesForSession(session);
  for (const se of exercises) {
    const seSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
    if (WorkoutSessionExerciseService.needsReview(se, seSets)) return true;
  }
  return false;
}

/**
 * Returns completed sessions that still have exercises needing review,
 * bundled with their session exercises and sets.
 *
 * @param sessions All sessions for the active mesocycle
 */
export function getPendingReviewSessions(sessions: WorkoutSession[]): HomePageSessionBundle[] {
  return sessions
    .filter((s) => s.complete && sessionNeedsReview(s))
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
 * @param sessions All sessions for the active mesocycle
 * @param limit Maximum number of sessions to return
 */
export function getRecentCompletedSessions(
  sessions: WorkoutSession[],
  limit = 3
): HomePageSessionBundle[] {
  const completed = sessions.filter((s) => s.complete && !sessionNeedsReview(s));

  return completed
    .slice(-limit)
    .reverse()
    .map((session) => ({
      session,
      sessionExercises: sessionMapService.getOrderedSessionExercisesForSession(session),
      sets: sessionMapService.getOrderedSetsForSession(session)
    }));
}
