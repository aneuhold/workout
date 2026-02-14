import type { WorkoutSession } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import createWorkoutPersistToDb from '$util/createWorkoutPersistToDb';
import LocalData from '$util/LocalData/LocalData';

export default new DocumentMapStoreService<WorkoutSession>({
  persistToLocalData: (map) => LocalData.setAndGetSessionMap(map),
  persistToDb: createWorkoutPersistToDb('sessions')
});
