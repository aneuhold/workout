import { type ProjectWorkoutPrimaryOutput } from '@aneuhold/core-ts-api-lib';
import type { BaseDocument } from '@aneuhold/core-ts-db-lib';
import LocalData from '$util/LocalData/LocalData';

export default class WorkoutAPIResponseHandlingService {
  /**
   * Processes the final output of a series of API requests.
   *
   * @param output The combined output of all API requests
   * @param _isFirstInitData Whether this is the first time getting initial data (currently unused)
   */
  static processWorkoutApiOutput(output: ProjectWorkoutPrimaryOutput, _isFirstInitData: boolean) {
    if (output.mesocycles) {
      LocalData.setAndGetMesocycleMap(this.convertDocumentArrayToMap(output.mesocycles));
    }
    if (output.microcycles) {
      LocalData.setAndGetMicrocycleMap(this.convertDocumentArrayToMap(output.microcycles));
    }
    if (output.sessions) {
      LocalData.setAndGetSessionMap(this.convertDocumentArrayToMap(output.sessions));
    }
    if (output.sessionExercises) {
      LocalData.setAndGetSessionExerciseMap(
        this.convertDocumentArrayToMap(output.sessionExercises)
      );
    }
    if (output.sets) {
      LocalData.setAndGetSetMap(this.convertDocumentArrayToMap(output.sets));
    }
    if (output.exercises) {
      LocalData.setAndGetExerciseMap(this.convertDocumentArrayToMap(output.exercises));
    }
    if (output.exerciseCalibrations) {
      LocalData.setAndGetExerciseCalibrationMap(
        this.convertDocumentArrayToMap(output.exerciseCalibrations)
      );
    }
    if (output.muscleGroups) {
      LocalData.setAndGetMuscleGroupMap(this.convertDocumentArrayToMap(output.muscleGroups));
    }
    if (output.equipmentTypes) {
      LocalData.setAndGetEquipmentTypeMap(this.convertDocumentArrayToMap(output.equipmentTypes));
    }
  }

  private static convertDocumentArrayToMap<T extends BaseDocument>(
    documents: T[]
  ): Record<string, T> {
    return documents.reduce<Record<string, T>>((map, document) => {
      map[document._id] = document;
      return map;
    }, {});
  }
}
