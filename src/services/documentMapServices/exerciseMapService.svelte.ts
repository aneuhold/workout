import type { DocumentMap, WorkoutExercise, WorkoutExerciseCTO } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { SvelteSet } from 'svelte/reactivity';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';
import exerciseCalibrationMapService from './exerciseCalibrationMapService.svelte';

class ExerciseDocumentMapService extends DocumentMapStoreService<WorkoutExercise> {
  /** Keyed by exercise ID (same as the CTO's `_id`). */
  private exerciseCTOMapState: DocumentMap<WorkoutExerciseCTO> = $state({});

  /** All exercise CTOs fetched from the backend. */
  readonly exerciseCTOs: WorkoutExerciseCTO[] = $derived(
    Object.values(this.exerciseCTOMapState).filter(
      (cto): cto is WorkoutExerciseCTO => cto !== undefined
    )
  );

  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetExerciseMap(map),
      persistToDb: createWorkoutPersistToDb('exercises'),
      prepareForSave: createWorkoutPrepareForSave('exercises')
    });
  }

  /**
   * Returns a single CTO by exercise ID, or undefined if not found.
   *
   * @param exerciseId The exercise ID to look up
   */
  getCTO(exerciseId: UUID): WorkoutExerciseCTO | undefined {
    return this.exerciseCTOMapState[exerciseId];
  }

  /**
   * Replaces all stored CTOs with the given array.
   *
   * @param ctos The new exercise CTOs from the backend
   */
  setExerciseCTOs(ctos: WorkoutExerciseCTO[]): void {
    const map: DocumentMap<WorkoutExerciseCTO> = {};
    for (const cto of ctos) {
      map[cto._id] = cto;
    }
    this.exerciseCTOMapState = map;
  }

  /**
   * Returns the CTOs for exercises referenced by the given calibration IDs.
   * Looks up each calibration to find its exercise ID, then retrieves the
   * CTO by exercise ID. O(k) where k = calibrationIds.length.
   *
   * @param calibrationIds Calibration IDs to resolve to CTOs
   */
  getCTOsForCalibrationIds(calibrationIds: UUID[]): WorkoutExerciseCTO[] {
    const ctos: WorkoutExerciseCTO[] = [];
    const seen = new SvelteSet<UUID>();
    for (const calId of calibrationIds) {
      const cal = exerciseCalibrationMapService.getDoc(calId);
      if (!cal) continue;
      const exerciseId = cal.workoutExerciseId;
      if (seen.has(exerciseId)) continue;
      seen.add(exerciseId);
      const cto = this.exerciseCTOMapState[exerciseId];
      if (cto) ctos.push(cto);
    }
    return ctos;
  }
}

export default new ExerciseDocumentMapService();
