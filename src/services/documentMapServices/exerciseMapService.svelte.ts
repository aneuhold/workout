import type { WorkoutExercise, WorkoutExerciseCalibration } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { SvelteSet } from 'svelte/reactivity';
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

  /**
   * Returns the unique exercises referenced by the given calibrations.
   * O(c) where c = calibrations.length, each lookup is O(1).
   *
   * @param calibrations The calibrations to look up exercises for
   */
  getExercisesForCalibrations(calibrations: WorkoutExerciseCalibration[]): WorkoutExercise[] {
    const seen = new SvelteSet<UUID>();
    const exercises: WorkoutExercise[] = [];
    for (const cal of calibrations) {
      if (!seen.has(cal.workoutExerciseId)) {
        seen.add(cal.workoutExerciseId);
        const ex = this.getDoc(cal.workoutExerciseId);
        if (ex) exercises.push(ex);
      }
    }
    return exercises;
  }
}

export default new ExerciseDocumentMapService();
