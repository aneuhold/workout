import type { WorkoutSessionExercise, WorkoutSet } from '@aneuhold/core-ts-db-lib';
import { WorkoutSetSchema } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import WorkoutAPIService from '$services/WorkoutAPIService';
import LocalData from '$util/LocalData/LocalData';
import {
  createWorkoutPersistToDb,
  createWorkoutPrepareForSave
} from '$util/workoutPersistenceUtils';
import setMapService from './setMapService.svelte';

class SessionExerciseDocumentMapService extends DocumentMapStoreService<WorkoutSessionExercise> {
  constructor() {
    super({
      persistToLocalData: (map) => {
        void LocalData.setDocumentMap(LocalData.storedKeyNames.sessionExerciseMap, map);
      },
      loadFromLocalData: () =>
        LocalData.getDocumentMap<WorkoutSessionExercise>(
          LocalData.storedKeyNames.sessionExerciseMap
        ),
      persistToDb: createWorkoutPersistToDb('sessionExercises'),
      prepareForSave: createWorkoutPrepareForSave('sessionExercises')
    });
  }

  /**
   * Returns sets for a session exercise in `setOrder` sequence.
   * O(k) where k = setOrder.length, each lookup is O(1).
   *
   * @param sessionExercise - The session exercise for which to retrieve ordered sets
   */
  getOrderedSetsForSessionExercise(sessionExercise: WorkoutSessionExercise): WorkoutSet[] {
    return setMapService.getDocsWithIds(sessionExercise.setOrder);
  }

  /**
   * Adds an empty set to a session exercise.
   *
   * @param sessionExerciseId The session exercise to add a set to
   */
  addSetToExercise(sessionExerciseId: UUID): void {
    const sessionExercise = this.getDoc(sessionExerciseId);
    if (!sessionExercise) return;

    const set = WorkoutSetSchema.parse({
      userId: sessionExercise.userId,
      workoutExerciseId: sessionExercise.workoutExerciseId,
      workoutSessionId: sessionExercise.workoutSessionId,
      workoutSessionExerciseId: sessionExerciseId
    });

    const apiOptions = setMapService.prepareDocsForSave({ insert: [set] });

    sessionExercise.setOrder = [...sessionExercise.setOrder, set._id];
    this.prepareDocsForSave({ update: [sessionExercise] }, apiOptions);

    WorkoutAPIService.queryApi(apiOptions);
  }

  /**
   * Removes a set from a session exercise. Does nothing if it's the last set.
   *
   * @param sessionExerciseId The session exercise containing the set
   * @param setId The set to remove
   */
  removeSetFromExercise(sessionExerciseId: UUID, setId: UUID): void {
    const sessionExercise = this.getDoc(sessionExerciseId);
    if (!sessionExercise) return;
    if (sessionExercise.setOrder.length <= 1) return;

    const apiOptions = setMapService.prepareDocsForSave({ delete: [setId] });

    sessionExercise.setOrder = sessionExercise.setOrder.filter((id) => id !== setId);
    this.prepareDocsForSave({ update: [sessionExercise] }, apiOptions);

    WorkoutAPIService.queryApi(apiOptions);
  }
}

export default new SessionExerciseDocumentMapService();
