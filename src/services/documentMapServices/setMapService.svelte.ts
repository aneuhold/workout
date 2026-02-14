import type { WorkoutSet } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import createWorkoutPersistToDb from '$util/createWorkoutPersistToDb';
import LocalData from '$util/LocalData/LocalData';

export default new DocumentMapStoreService<WorkoutSet>({
  persistToLocalData: (map) => LocalData.setAndGetSetMap(map),
  persistToDb: createWorkoutPersistToDb('sets')
});
