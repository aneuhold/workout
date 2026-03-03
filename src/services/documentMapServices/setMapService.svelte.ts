import type { WorkoutSet } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import type { Updater } from 'svelte/store';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';
import exerciseMapService from './exerciseMapService.svelte';

const ctoGet = { exerciseCTOs: { all: true }, muscleGroupVolumeCTOs: { all: true } };

class SetDocumentMapService extends DocumentMapStoreService<WorkoutSet> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetSetMap(map),
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
