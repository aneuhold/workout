import equipmentTypeMapService from '$services/documentMapServices/EquipmentTypeMap.service.svelte';
import exerciseCalibrationMapService from '$services/documentMapServices/ExerciseCalibrationMap.service.svelte';
import exerciseMapService from '$services/documentMapServices/ExerciseMap.service.svelte';
import mesocycleMapService from '$services/documentMapServices/MesocycleMap.service.svelte';
import microcycleMapService from '$services/documentMapServices/MicrocycleMap.service.svelte';
import muscleGroupMapService from '$services/documentMapServices/MuscleGroupMap.service.svelte';
import sessionExerciseMapService from '$services/documentMapServices/SessionExerciseMap.service.svelte';
import sessionMapService from '$services/documentMapServices/SessionMap.service.svelte';
import setMapService from '$services/documentMapServices/SetMap.service.svelte';
import type AbstractDocumentMapStoreService from '$services/DocumentMapStoreService/AbstractDocumentMapStore.service';

/**
 * The document map services that handle API output, in the order in which API
 * output is applied.
 *
 * `WorkoutAPI.service.ts` must never import this file: the document map
 * services import `WorkoutAPIService`, so that import forms a cycle.
 */
const apiResponseHandlingOrder: AbstractDocumentMapStoreService[] = [
  mesocycleMapService,
  microcycleMapService,
  sessionMapService,
  sessionExerciseMapService,
  setMapService,
  exerciseMapService,
  exerciseCalibrationMapService,
  muscleGroupMapService,
  equipmentTypeMapService
];

export default apiResponseHandlingOrder;
