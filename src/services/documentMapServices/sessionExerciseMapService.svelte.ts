import type { WorkoutSessionExercise, WorkoutSet } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';
import setMapService from './setMapService.svelte';

class SessionExerciseDocumentMapService extends DocumentMapStoreService<WorkoutSessionExercise> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetSessionExerciseMap(map),
      persistToDb: createWorkoutPersistToDb('sessionExercises'),
      prepareForSave: createWorkoutPrepareForSave('sessionExercises')
    });
  }

  /**
   * Returns sets for a session exercise in `setOrder` sequence.
   * O(k) where k = setOrder.length, each lookup is O(1).
   *
   * @param sessionExercise - The session exercise for which to retrieve ordered sets
   */
  getOrderedSetsForSessionExercise(sessionExercise: WorkoutSessionExercise): WorkoutSet[] {
    return setMapService.getDocsWithIds(sessionExercise.setOrder);
  }
}

export default new SessionExerciseDocumentMapService();
