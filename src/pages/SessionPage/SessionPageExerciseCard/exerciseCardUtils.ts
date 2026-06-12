import { type WorkoutSet, WorkoutSetService } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import sessionExerciseMapService from '$services/documentMapServices/SessionExerciseMap.service.svelte';
import { SessionPageMode, SessionPageSetState } from '../sessionPageTypes';

/**
 * Derives the visual state for a set row within an exercise card.
 *
 * @param set The workout set to evaluate
 * @param index The index of the set within the ordered sets array
 * @param mode The current session page mode
 * @param sets All sets for the exercise, in order
 */
export function getSetState(
  set: WorkoutSet,
  index: number,
  mode: SessionPageMode,
  sets: WorkoutSet[]
): SessionPageSetState {
  if (mode === SessionPageMode.Planning) return SessionPageSetState.Future;
  if (mode === SessionPageMode.Locked) return SessionPageSetState.Future;
  if (WorkoutSetService.isCompleted(set)) {
    return SessionPageSetState.Completed;
  }
  const firstIncomplete = sets.findIndex((s) => !WorkoutSetService.isCompleted(s));
  return index === firstIncomplete ? SessionPageSetState.Current : SessionPageSetState.Future;
}

/**
 * Returns the interaction state for immediate slider fields (RSM mind-muscle, pump; fatigue unused muscle).
 * Interactive in Active mode, highlighted when all sets are logged, read-only otherwise.
 *
 * @param mode The current session page mode
 * @param allSetsLogged Whether all sets in the session have been logged
 */
export function getImmediateFieldState(
  mode: SessionPageMode,
  allSetsLogged: boolean
): { disabled: boolean; highlight: boolean } {
  return {
    disabled: mode !== SessionPageMode.Active,
    highlight: mode === SessionPageMode.Active && allSetsLogged
  };
}

/**
 * Returns the interaction state for late slider fields (disruption, perceived effort, joint/tissue).
 * Deferred in Active mode, interactive and highlighted in Review, read-only in View/Locked/Planning.
 *
 * @param mode The current session page mode
 */
export function getLateFieldState(mode: SessionPageMode): {
  disabled: boolean;
  highlight: boolean;
} {
  if (mode === SessionPageMode.Review) return { disabled: false, highlight: true };
  return { disabled: true, highlight: false };
}

/**
 * Updates an RSM field on a session exercise document.
 *
 * @param sessionExerciseId The session exercise to update
 * @param field The RSM field to update
 * @param value The new value (0-3) or null to clear
 */
export function updateRsm(
  sessionExerciseId: UUID,
  field: 'mindMuscleConnection' | 'pump' | 'disruption',
  value: number | null
): void {
  sessionExerciseMapService.updateDoc(sessionExerciseId, (doc) => {
    if (!doc.rsm) {
      doc.rsm = { mindMuscleConnection: null, pump: null, disruption: null };
    }
    doc.rsm[field] = value;
    return doc;
  });
}

/**
 * Updates a fatigue field on a session exercise document.
 *
 * @param sessionExerciseId The session exercise to update
 * @param field The fatigue field to update
 * @param value The new value (0-3) or null to clear
 */
export function updateFatigue(
  sessionExerciseId: UUID,
  field: 'jointAndTissueDisruption' | 'perceivedEffort' | 'unusedMusclePerformance',
  value: number | null
): void {
  sessionExerciseMapService.updateDoc(sessionExerciseId, (doc) => {
    if (!doc.fatigue) {
      doc.fatigue = {
        jointAndTissueDisruption: null,
        perceivedEffort: null,
        unusedMusclePerformance: null
      };
    }
    doc.fatigue[field] = value;
    return doc;
  });
}

/**
 * Updates the soreness score on a session exercise document.
 *
 * @param sessionExerciseId The session exercise to update
 * @param value The new soreness score (0-3) or null to clear
 */
export function updateSoreness(sessionExerciseId: UUID, value: number | null): void {
  sessionExerciseMapService.updateDoc(sessionExerciseId, (doc) => {
    doc.sorenessScore = value;
    return doc;
  });
}

/**
 * Updates the soreness score on the previous session exercise document.
 *
 * @param previousSessionExerciseId The previous session exercise to update
 * @param value The new soreness score (0-3) or null to clear
 */
export function updatePreviousSoreness(
  previousSessionExerciseId: UUID,
  value: number | null
): void {
  sessionExerciseMapService.updateDoc(previousSessionExerciseId, (doc) => {
    doc.sorenessScore = value;
    return doc;
  });
}
