import type { WorkoutMuscleGroup } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import createWorkoutPersistToDb from '$util/createWorkoutPersistToDb';
import LocalData from '$util/LocalData/LocalData';

export default new DocumentMapStoreService<WorkoutMuscleGroup>({
  persistToLocalData: (map) => LocalData.setAndGetMuscleGroupMap(map),
  persistToDb: createWorkoutPersistToDb('muscleGroups')
});
