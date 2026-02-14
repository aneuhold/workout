import type { WorkoutMesocycle } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import createWorkoutPersistToDb from '$util/createWorkoutPersistToDb';
import LocalData from '$util/LocalData/LocalData';

export default new DocumentMapStoreService<WorkoutMesocycle>({
  persistToLocalData: (map) => LocalData.setAndGetMesocycleMap(map),
  persistToDb: createWorkoutPersistToDb('mesocycles')
});
