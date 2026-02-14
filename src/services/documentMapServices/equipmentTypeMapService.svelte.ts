import type { WorkoutEquipmentType } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import createWorkoutPersistToDb from '$util/createWorkoutPersistToDb';
import LocalData from '$util/LocalData/LocalData';

export default new DocumentMapStoreService<WorkoutEquipmentType>({
  persistToLocalData: (map) => LocalData.setAndGetEquipmentTypeMap(map),
  persistToDb: createWorkoutPersistToDb('equipmentTypes')
});
