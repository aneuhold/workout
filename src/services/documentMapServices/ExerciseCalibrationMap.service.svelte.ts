import type { WorkoutExerciseCalibration } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStore.service.svelte';
import LocalData from '$util/LocalData/LocalData';
import {
  createWorkoutPersistToDb,
  createWorkoutPrepareForSave,
  ctoGet
} from '$util/workoutPersistenceUtils';
import exerciseMapService from './ExerciseMap.service.svelte';

class ExerciseCalibrationDocumentMapService extends DocumentMapStoreService<WorkoutExerciseCalibration> {
  constructor() {
    super({
      persistToLocalData: (map) => {
        void LocalData.setDocumentMap(LocalData.storedKeyNames.exerciseCalibrationMap, map);
      },
      loadFromLocalData: () =>
        LocalData.getDocumentMap<WorkoutExerciseCalibration>(
          LocalData.storedKeyNames.exerciseCalibrationMap
        ),
      persistToDb: createWorkoutPersistToDb('exerciseCalibrations'),
      prepareForSave: createWorkoutPrepareForSave('exerciseCalibrations')
    });
  }

  override addDoc(doc: WorkoutExerciseCalibration): void {
    super.addDoc(doc, ctoGet);
    exerciseMapService.updateCTOBestCalibration(doc);
  }
}

const exerciseCalibrationDocumentMapService = new ExerciseCalibrationDocumentMapService();
export default exerciseCalibrationDocumentMapService;
