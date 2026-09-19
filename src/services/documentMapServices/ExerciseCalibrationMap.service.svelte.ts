import type { WorkoutExerciseCalibration } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService/DocumentMapStore.service.svelte';
import { ctoGet } from '$util/ctoGet';
import LocalData from '$util/LocalData/LocalData';
import exerciseMapService from './ExerciseMap.service.svelte';

class ExerciseCalibrationDocumentMapService extends DocumentMapStoreService<WorkoutExerciseCalibration> {
  constructor() {
    super({
      workoutApiInsertKey: 'exerciseCalibrations',
      persistToLocalData: (map) => {
        void LocalData.setDocumentMap(LocalData.storedKeyNames.exerciseCalibrationMap, map);
      },
      loadFromLocalData: () =>
        LocalData.getDocumentMap<WorkoutExerciseCalibration>(
          LocalData.storedKeyNames.exerciseCalibrationMap
        ),
      handleApiOutput: (output, input) => {
        if (output.exerciseCalibrations && input.get?.exerciseCalibrations?.all) {
          this.setMap(this.convertDocumentArrayToMap(output.exerciseCalibrations));
        }
      }
    });
  }

  override addDoc(doc: WorkoutExerciseCalibration): void {
    super.addDoc(doc, ctoGet);
    exerciseMapService.updateCTOBestCalibration(doc);
  }
}

const exerciseCalibrationDocumentMapService = new ExerciseCalibrationDocumentMapService();
export default exerciseCalibrationDocumentMapService;
