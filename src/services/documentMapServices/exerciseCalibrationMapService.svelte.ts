import type { WorkoutExerciseCalibration } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import createWorkoutPersistToDb from '$util/createWorkoutPersistToDb';
import LocalData from '$util/LocalData/LocalData';

export default new DocumentMapStoreService<WorkoutExerciseCalibration>({
  persistToLocalData: (map) => LocalData.setAndGetExerciseCalibrationMap(map),
  persistToDb: createWorkoutPersistToDb('exerciseCalibrations')
});
