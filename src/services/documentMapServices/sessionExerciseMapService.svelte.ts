import type { WorkoutSessionExercise, WorkoutSet } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import createWorkoutPersistToDb from '$util/createWorkoutPersistToDb';
import LocalData from '$util/LocalData/LocalData';
import setMapService from './setMapService.svelte';

class SessionExerciseDocumentMapService extends DocumentMapStoreService<WorkoutSessionExercise> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetSessionExerciseMap(map),
      persistToDb: createWorkoutPersistToDb('sessionExercises')
    });
  }

  /**
   * Returns sets for a session exercise in `setOrder` sequence.
   * O(k) where k = setOrder.length, each lookup is O(1).
   *
   * @param sessionExercise
   */
  getOrderedSetsForSessionExercise(sessionExercise: WorkoutSessionExercise): WorkoutSet[] {
    return sessionExercise.setOrder
      .map((id) => setMapService.getDoc(id))
      .filter((s): s is WorkoutSet => s !== undefined);
  }
}

export default new SessionExerciseDocumentMapService();
