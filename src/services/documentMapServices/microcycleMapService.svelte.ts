import type { WorkoutMicrocycle } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import createWorkoutPersistToDb from '$util/createWorkoutPersistToDb';
import LocalData from '$util/LocalData/LocalData';

export default new DocumentMapStoreService<WorkoutMicrocycle>({
  persistToLocalData: (map) => LocalData.setAndGetMicrocycleMap(map),
  persistToDb: createWorkoutPersistToDb('microcycles')
});
