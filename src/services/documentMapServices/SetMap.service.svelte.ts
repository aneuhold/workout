import type { WorkoutSet } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import type { Updater } from 'svelte/store';
import DocumentMapStoreService from '$services/DocumentMapStoreService/DocumentMapStore.service.svelte';
import { ctoGet } from '$util/ctoGet';
import LocalData from '$util/LocalData/LocalData';
import exerciseMapService from './ExerciseMap.service.svelte';

class SetDocumentMapService extends DocumentMapStoreService<WorkoutSet> {
  constructor() {
    super({
      workoutApiInsertKey: 'sets',
      persistToLocalData: (map) => {
        void LocalData.setDocumentMap(LocalData.storedKeyNames.setMap, map);
      },
      loadFromLocalData: () =>
        LocalData.getDocumentMap<WorkoutSet>(LocalData.storedKeyNames.setMap),
      handleApiOutput: (output, input) => {
        if (output.sets && input.get?.sets?.all) {
          this.setMap(this.convertDocumentArrayToMap(output.sets));
        }
      }
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

const setDocumentMapService = new SetDocumentMapService();
export default setDocumentMapService;
