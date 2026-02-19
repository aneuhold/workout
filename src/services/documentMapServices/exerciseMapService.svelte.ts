import type { WorkoutExercise } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';

class ExerciseDocumentMapService extends DocumentMapStoreService<WorkoutExercise> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetExerciseMap(map),
      persistToDb: createWorkoutPersistToDb('exercises'),
      prepareForSave: createWorkoutPrepareForSave('exercises')
    });
  }
}

export default new ExerciseDocumentMapService();
