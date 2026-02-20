import type { WorkoutEquipmentType, WorkoutExercise } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { SvelteSet } from 'svelte/reactivity';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';

class EquipmentTypeDocumentMapService extends DocumentMapStoreService<WorkoutEquipmentType> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetEquipmentTypeMap(map),
      persistToDb: createWorkoutPersistToDb('equipmentTypes'),
      prepareForSave: createWorkoutPrepareForSave('equipmentTypes')
    });
  }

  /**
   * Returns the unique equipment types referenced by the given exercises.
   * O(e) where e = exercises.length, each lookup is O(1).
   *
   * @param exercises The exercises to look up equipment types for
   */
  getEquipmentTypesForExercises(exercises: WorkoutExercise[]): WorkoutEquipmentType[] {
    const seen = new SvelteSet<UUID>();
    const equipmentTypes: WorkoutEquipmentType[] = [];
    for (const exercise of exercises) {
      if (!seen.has(exercise.workoutEquipmentTypeId)) {
        seen.add(exercise.workoutEquipmentTypeId);
        const et = this.getDoc(exercise.workoutEquipmentTypeId);
        if (et) equipmentTypes.push(et);
      }
    }
    return equipmentTypes;
  }
}

export default new EquipmentTypeDocumentMapService();
