import {
  type ProjectWorkoutPrimaryEndpointOptions,
  type ProjectWorkoutPrimaryOutput
} from '@aneuhold/core-ts-api-lib';
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
   * Processes the final output of a series of API requests. Only replaces
   * a store's map when the combined input included a `get` with `all: true`
   * for that document type. Insert/update/delete responses only contain the
   * affected documents, so replacing the store with them would discard
   * existing data.
   *
   * @param output The combined output of all API requests
   * @param input The combined input options across the batch
   * @param _isFirstInitData Whether this is the first time getting initial data (currently unused)
   */
  static processWorkoutApiOutput(
    output: ProjectWorkoutPrimaryOutput,
    input: ProjectWorkoutPrimaryEndpointOptions,
    _isFirstInitData: boolean
  ) {
    const get = input.get;
    if (output.mesocycles && get?.mesocycles?.all) {
      mesocycleMapService.setMap(this.convertDocumentArrayToMap(output.mesocycles));
    }
    if (output.microcycles && get?.microcycles?.all) {
      microcycleMapService.setMap(this.convertDocumentArrayToMap(output.microcycles));
    }
    if (output.sessions && get?.sessions?.all) {
      sessionMapService.setMap(this.convertDocumentArrayToMap(output.sessions));
    }
    if (output.sessionExercises && get?.sessionExercises?.all) {
      sessionExerciseMapService.setMap(this.convertDocumentArrayToMap(output.sessionExercises));
    }
    if (output.sets && get?.sets?.all) {
      setMapService.setMap(this.convertDocumentArrayToMap(output.sets));
    }
    if (output.exercises && get?.exercises?.all) {
      exerciseMapService.setMap(this.convertDocumentArrayToMap(output.exercises));
    }
    if (output.exerciseCalibrations && get?.exerciseCalibrations?.all) {
      exerciseCalibrationMapService.setMap(
        this.convertDocumentArrayToMap(output.exerciseCalibrations)
      );
    }
    if (output.muscleGroups && get?.muscleGroups?.all) {
      muscleGroupMapService.setMap(this.convertDocumentArrayToMap(output.muscleGroups));
    }
    if (output.equipmentTypes && get?.equipmentTypes?.all) {
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
