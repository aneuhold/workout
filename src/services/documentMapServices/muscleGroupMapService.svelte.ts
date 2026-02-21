import type { WorkoutMuscleGroup } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';

class MuscleGroupDocumentMapService extends DocumentMapStoreService<WorkoutMuscleGroup> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetMuscleGroupMap(map),
      persistToDb: createWorkoutPersistToDb('muscleGroups'),
      prepareForSave: createWorkoutPrepareForSave('muscleGroups')
    });
  }

  /**
   * Returns the display name for a muscle group by ID, or `'Unknown'` if not found.
   *
   * @param id Muscle group document ID
   */
  getMuscleGroupName(id: UUID): string {
    return this.getDoc(id)?.name ?? 'Unknown';
  }

  /**
   * Maps an array of muscle group IDs to their display names, filtering out
   * any IDs that don't resolve to a document.
   *
   * @param ids Muscle group document IDs
   */
  getMuscleGroupNames(ids: UUID[]): string[] {
    return ids.map((id) => this.getDoc(id)?.name).filter((name): name is string => name != null);
  }
}

export default new MuscleGroupDocumentMapService();
