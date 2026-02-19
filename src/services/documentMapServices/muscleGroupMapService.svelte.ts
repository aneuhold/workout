import type { WorkoutMuscleGroup } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';

export default new DocumentMapStoreService<WorkoutMuscleGroup>({
  persistToLocalData: (map) => LocalData.setAndGetMuscleGroupMap(map),
  persistToDb: createWorkoutPersistToDb('muscleGroups'),
  prepareForSave: createWorkoutPrepareForSave('muscleGroups')
});
