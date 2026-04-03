import {
  type WorkoutMesocycle,
  type WorkoutMicrocycle,
  type WorkoutSession,
  type WorkoutSessionExercise,
  WorkoutSessionExerciseService,
  type WorkoutSessionLockReason,
  WorkoutSetService
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
import sessionExerciseMapService from '$services/documentMapServices/sessionExerciseMapService.svelte';
import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
import { SessionPageExerciseCardState, SessionPageMode } from './sessionPageTypes';

/**
 * Returns whether all session metrics (mid and late) have been filled for a session exercise.
 *
 * @param se The session exercise to check
 */
export function exerciseHasAllSessionMetricsFilled(se: WorkoutSessionExercise): boolean {
  const seSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
  return WorkoutSessionExerciseService.hasAllSessionMetricsFilled(se, seSets);
}

/**
 * Derives the data mode for the session page based on session state.
 * This is the "raw" mode before sticky review-mode logic is applied.
 *
 * @param session The current session document
 * @param planning Whether the page is in planning mode
 * @param lockReason The reason the session is locked, or null
 * @param sessionExercises The ordered session exercises
 */
export function deriveDataMode(
  session: WorkoutSession | undefined,
  planning: boolean,
  lockReason: WorkoutSessionLockReason | null,
  sessionExercises: WorkoutSessionExercise[]
): SessionPageMode {
  if (planning) return SessionPageMode.Planning;
  if (!session) return SessionPageMode.Active;
  if (lockReason != null) return SessionPageMode.Locked;
  if (!session.complete) return SessionPageMode.Active;
  const hasUnfilledMetrics = sessionExercises.some((se) => !exerciseHasAllSessionMetricsFilled(se));
  return hasUnfilledMetrics ? SessionPageMode.Review : SessionPageMode.View;
}

/**
 * Derives the effective display mode, applying sticky review-mode logic.
 * Keeps the user in Review until they explicitly confirm, even after all late fields are filled.
 *
 * @param dataMode The raw computed data mode
 * @param planning Whether the page is in planning mode
 * @param wasInReviewMode Whether the page was ever in Review mode
 * @param reviewConfirmed Whether the user has explicitly confirmed the review
 */
export function deriveMode(
  dataMode: SessionPageMode,
  planning: boolean,
  wasInReviewMode: boolean,
  reviewConfirmed: boolean
): SessionPageMode {
  if (planning) return SessionPageMode.Planning;
  if (dataMode === SessionPageMode.Locked) return SessionPageMode.Locked;
  if (dataMode === SessionPageMode.Active) return SessionPageMode.Active;
  if (wasInReviewMode && !reviewConfirmed) return SessionPageMode.Review;
  return dataMode;
}

/**
 * Returns the index of the first session exercise with an incomplete set.
 * Returns sessionExercises.length if all sets are complete.
 *
 * @param sessionExercises The ordered session exercises
 */
export function deriveCurrentExerciseIndex(sessionExercises: WorkoutSessionExercise[]): number {
  for (let i = 0; i < sessionExercises.length; i++) {
    const exerciseSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(
      sessionExercises[i]
    );
    const allComplete = exerciseSets.every((s) => WorkoutSetService.isCompleted(s));
    if (!allComplete) return i;
  }
  return sessionExercises.length;
}

/**
 * Derives the previous session exercise map and soreness-locked exercise IDs.
 * Returns both in a single pass over microcycles to avoid duplicate iteration.
 *
 * @param mesocycle The current mesocycle, or undefined
 * @param session The current session, or undefined
 * @param sessionExercises The ordered session exercises for the current session
 * @param microcycle The current microcycle, or undefined
 */
export function derivePreviousSessionExerciseData(
  mesocycle: WorkoutMesocycle | undefined,
  session: WorkoutSession | undefined,
  sessionExercises: WorkoutSessionExercise[],
  microcycle: WorkoutMicrocycle | undefined
): { prevMap: SvelteMap<UUID, WorkoutSessionExercise>; locked: SvelteSet<UUID> } {
  const prevMap = new SvelteMap<UUID, WorkoutSessionExercise>();
  const locked = new SvelteSet<UUID>();

  if (!mesocycle || !session || !microcycle) return { prevMap, locked };

  if (mesocycle.completedDate) {
    for (const se of sessionExercises) locked.add(se.workoutExerciseId);
    return { prevMap, locked };
  }

  const exerciseIds = new SvelteSet(sessionExercises.map((se) => se.workoutExerciseId));
  const allMicrocycles = microcycleMapService.getOrderedMicrocyclesForMesocycle(mesocycle._id);
  let foundCurrentSession = false;

  for (const mc of allMicrocycles) {
    const mcSessions = microcycleMapService.getOrderedSessionsForMicrocycle(mc);
    for (const s of mcSessions) {
      if (s._id === session._id) {
        foundCurrentSession = true;
        continue;
      }
      if (!foundCurrentSession) {
        if (!s.complete) continue;
        const ses = sessionMapService.getOrderedSessionExercisesForSession(s);
        for (const se of ses) {
          if (exerciseIds.has(se.workoutExerciseId)) {
            prevMap.set(se.workoutExerciseId, se);
          }
        }
      } else {
        const ses = sessionMapService.getOrderedSessionExercisesForSession(s);
        for (const se of ses) {
          if (locked.has(se.workoutExerciseId)) continue;
          const seSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
          if (seSets.some((set) => WorkoutSetService.isCompleted(set))) {
            locked.add(se.workoutExerciseId);
          }
        }
      }
    }
  }

  return { prevMap, locked };
}

/**
 * Derives the visual card state for an exercise card at the given index.
 *
 * @param index The index of the exercise in the session
 * @param mode The current session page mode
 * @param isFreeForm Whether the session is a free-form session
 * @param sessionExercises The ordered session exercises
 * @param currentExerciseIndex The index of the first incomplete exercise
 * @param isExerciseDone Function to check if a free-form exercise is marked as done
 */
export function deriveCardState(
  index: number,
  mode: SessionPageMode,
  isFreeForm: boolean,
  sessionExercises: WorkoutSessionExercise[],
  currentExerciseIndex: number,
  isExerciseDone: (seId: UUID) => boolean
): SessionPageExerciseCardState {
  if (mode === SessionPageMode.Planning) return SessionPageExerciseCardState.Current;
  if (mode === SessionPageMode.Review) {
    return exerciseHasAllSessionMetricsFilled(sessionExercises[index])
      ? SessionPageExerciseCardState.Completed
      : SessionPageExerciseCardState.Current;
  }
  if (mode === SessionPageMode.Locked) return SessionPageExerciseCardState.Future;
  if (mode === SessionPageMode.View) return SessionPageExerciseCardState.Completed;

  if (isFreeForm) {
    const se = sessionExercises[index];
    if (isExerciseDone(se._id)) return SessionPageExerciseCardState.Completed;
    return SessionPageExerciseCardState.Current;
  }

  if (index < currentExerciseIndex) return SessionPageExerciseCardState.Completed;
  if (index === currentExerciseIndex) return SessionPageExerciseCardState.Current;
  return SessionPageExerciseCardState.Future;
}
