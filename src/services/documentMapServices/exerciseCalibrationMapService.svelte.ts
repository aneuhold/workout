import type { WorkoutExerciseCalibration } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';
import exerciseMapService from './exerciseMapService.svelte';

const ctoGet = { exerciseCTOs: { all: true }, muscleGroupVolumeCTOs: { all: true } };

class ExerciseCalibrationDocumentMapService extends DocumentMapStoreService<WorkoutExerciseCalibration> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetExerciseCalibrationMap(map),
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
