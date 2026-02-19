import type { WorkoutSet } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';

class SetDocumentMapService extends DocumentMapStoreService<WorkoutSet> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetSetMap(map),
      persistToDb: createWorkoutPersistToDb('sets'),
      prepareForSave: createWorkoutPrepareForSave('sets')
    });
  }
}

export default new SetDocumentMapService();
