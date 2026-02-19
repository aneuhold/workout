import type { WorkoutEquipmentType } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';

export default new DocumentMapStoreService<WorkoutEquipmentType>({
  persistToLocalData: (map) => LocalData.setAndGetEquipmentTypeMap(map),
  persistToDb: createWorkoutPersistToDb('equipmentTypes'),
  prepareForSave: createWorkoutPrepareForSave('equipmentTypes')
});
