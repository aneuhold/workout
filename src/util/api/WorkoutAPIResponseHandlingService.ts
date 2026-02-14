import { type ProjectWorkoutPrimaryOutput } from '@aneuhold/core-ts-api-lib';
import type { BaseDocument } from '@aneuhold/core-ts-db-lib';
import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
import sessionExerciseMapService from '$services/documentMapServices/sessionExerciseMapService.svelte';
import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
import setMapService from '$services/documentMapServices/setMapService.svelte';

export default class WorkoutAPIResponseHandlingService {
  /**
   * Processes the final output of a series of API requests.
   *
   * @param output The combined output of all API requests
   * @param _isFirstInitData Whether this is the first time getting initial data (currently unused)
   */
  static processWorkoutApiOutput(output: ProjectWorkoutPrimaryOutput, _isFirstInitData: boolean) {
    if (output.mesocycles) {
      mesocycleMapService.setMap(this.convertDocumentArrayToMap(output.mesocycles));
    }
    if (output.microcycles) {
      microcycleMapService.setMap(this.convertDocumentArrayToMap(output.microcycles));
    }
    if (output.sessions) {
      sessionMapService.setMap(this.convertDocumentArrayToMap(output.sessions));
    }
    if (output.sessionExercises) {
      sessionExerciseMapService.setMap(this.convertDocumentArrayToMap(output.sessionExercises));
    }
    if (output.sets) {
      setMapService.setMap(this.convertDocumentArrayToMap(output.sets));
    }
    if (output.exercises) {
      exerciseMapService.setMap(this.convertDocumentArrayToMap(output.exercises));
    }
    if (output.exerciseCalibrations) {
      exerciseCalibrationMapService.setMap(
        this.convertDocumentArrayToMap(output.exerciseCalibrations)
      );
    }
    if (output.muscleGroups) {
      muscleGroupMapService.setMap(this.convertDocumentArrayToMap(output.muscleGroups));
    }
    if (output.equipmentTypes) {
      equipmentTypeMapService.setMap(this.convertDocumentArrayToMap(output.equipmentTypes));
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
