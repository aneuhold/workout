import type { WorkoutExerciseCalibration } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';

export default new DocumentMapStoreService<WorkoutExerciseCalibration>({
  persistToLocalData: (map) => LocalData.setAndGetExerciseCalibrationMap(map),
  persistToDb: createWorkoutPersistToDb('exerciseCalibrations'),
  prepareForSave: createWorkoutPrepareForSave('exerciseCalibrations')
});
