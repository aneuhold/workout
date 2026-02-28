import type {
  DocumentMap,
  WorkoutExerciseCTO,
  WorkoutMuscleGroup,
  WorkoutMuscleGroupVolumeCTO
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { SvelteSet } from 'svelte/reactivity';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';

class MuscleGroupDocumentMapService extends DocumentMapStoreService<WorkoutMuscleGroup> {
  /** Keyed by muscle group ID (same as the CTO's `_id`). */
  private volumeCTOMapState: DocumentMap<WorkoutMuscleGroupVolumeCTO> = $state({});

  /** All volume CTOs from the backend. Only recomputes when the map is replaced. */
  readonly allVolumeCTOs: WorkoutMuscleGroupVolumeCTO[] = $derived(
    Object.values(this.volumeCTOMapState).filter(
      (cto): cto is WorkoutMuscleGroupVolumeCTO => cto !== undefined
    )
  );

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

  /**
   * Replaces all stored volume CTOs with the given array.
   *
   * @param ctos The new muscle group volume CTOs from the backend
   */
  setVolumeCTOs(ctos: WorkoutMuscleGroupVolumeCTO[]): void {
    const map: DocumentMap<WorkoutMuscleGroupVolumeCTO> = {};
    for (const cto of ctos) {
      map[cto._id] = cto;
    }
    this.volumeCTOMapState = map;
  }

  /**
   * Returns a single volume CTO by muscle group ID, or undefined if not found.
   *
   * @param muscleGroupId The muscle group ID to look up
   */
  getVolumeCTO(muscleGroupId: UUID): WorkoutMuscleGroupVolumeCTO | undefined {
    return this.volumeCTOMapState[muscleGroupId];
  }

  /**
   * Returns volume CTOs for the unique primary muscle groups across the given
   * exercise CTOs. Each muscle group appears at most once in the result.
   *
   * @param exerciseCTOs The exercise CTOs to extract muscle groups from
   */
  getVolumeCTOsForExerciseCTOs(exerciseCTOs: WorkoutExerciseCTO[]): WorkoutMuscleGroupVolumeCTO[] {
    const seen = new SvelteSet<UUID>();
    const volumeCTOs: WorkoutMuscleGroupVolumeCTO[] = [];
    for (const cto of exerciseCTOs) {
      for (const muscleGroupId of cto.primaryMuscleGroups) {
        if (seen.has(muscleGroupId)) continue;
        seen.add(muscleGroupId);
        const volumeCTO = this.volumeCTOMapState[muscleGroupId];
        if (volumeCTO) volumeCTOs.push(volumeCTO);
      }
    }
    return volumeCTOs;
  }
}

export default new MuscleGroupDocumentMapService();
