import type { WorkoutSet } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import createWorkoutPersistToDb from '$util/createWorkoutPersistToDb';
import LocalData from '$util/LocalData/LocalData';

class SetDocumentMapService extends DocumentMapStoreService<WorkoutSet> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetSetMap(map),
      persistToDb: createWorkoutPersistToDb('sets')
    });
  }
}

export default new SetDocumentMapService();
