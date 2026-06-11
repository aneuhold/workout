import type { WorkoutExerciseCalibration } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import {
  createWorkoutPersistToDb,
  createWorkoutPrepareForSave,
  ctoGet
} from '$util/workoutPersistenceUtils';
import exerciseMapService from './exerciseMapService.svelte';

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

export default new ExerciseCalibrationDocumentMapService();
