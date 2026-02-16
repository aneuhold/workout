import type { WorkoutExercise } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import createWorkoutPersistToDb from '$util/createWorkoutPersistToDb';
import LocalData from '$util/LocalData/LocalData';

class ExerciseDocumentMapService extends DocumentMapStoreService<WorkoutExercise> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetExerciseMap(map),
      persistToDb: createWorkoutPersistToDb('exercises')
    });
  }
}

export default new ExerciseDocumentMapService();
