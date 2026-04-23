import type { WorkoutSet } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import type { Updater } from 'svelte/store';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import {
  createWorkoutPersistToDb,
  createWorkoutPrepareForSave,
  ctoGet
} from '$util/workoutPersistenceUtils';
import exerciseMapService from './exerciseMapService.svelte';

class SetDocumentMapService extends DocumentMapStoreService<WorkoutSet> {
  constructor() {
    super({
      persistToLocalData: (map) =>
        LocalData.setAndGetDocumentMap(LocalData.storedKeyNames.setMap, map),
      loadFromLocalData: () =>
        LocalData.getDocumentMap<WorkoutSet>(LocalData.storedKeyNames.setMap),
      persistToDb: createWorkoutPersistToDb('sets'),
      prepareForSave: createWorkoutPrepareForSave('sets')
    });
  }

  override updateDoc(docId: UUID, mutator: Updater<WorkoutSet>): void {
    super.updateDoc(docId, mutator, ctoGet);
    const updated = this.getDoc(docId);
    if (updated?.actualWeight != null && updated.actualReps) {
      exerciseMapService.updateCTOBestSet(updated);
    }
  }
}

export default new SetDocumentMapService();
