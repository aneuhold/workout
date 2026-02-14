import type { WorkoutSessionExercise } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import createWorkoutPersistToDb from '$util/createWorkoutPersistToDb';
import LocalData from '$util/LocalData/LocalData';

export default new DocumentMapStoreService<WorkoutSessionExercise>({
  persistToLocalData: (map) => LocalData.setAndGetSessionExerciseMap(map),
  persistToDb: createWorkoutPersistToDb('sessionExercises')
});
