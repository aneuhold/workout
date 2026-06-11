import equipmentTypeMapService from './documentMapServices/EquipmentTypeMap.service.svelte';
import exerciseCalibrationMapService from './documentMapServices/ExerciseCalibrationMap.service.svelte';
import exerciseMapService from './documentMapServices/ExerciseMap.service.svelte';
import mesocycleMapService from './documentMapServices/MesocycleMap.service.svelte';
import microcycleMapService from './documentMapServices/MicrocycleMap.service.svelte';
import muscleGroupMapService from './documentMapServices/MuscleGroupMap.service.svelte';
import sessionExerciseMapService from './documentMapServices/SessionExerciseMap.service.svelte';
import sessionMapService from './documentMapServices/SessionMap.service.svelte';
import setMapService from './documentMapServices/SetMap.service.svelte';

/**
 * Orchestrates app-startup hydration of every workout document map service
 * from its cached local-storage snapshot so the UI can paint last-known-good
 * data before any API response arrives. Kept out of the map-service
 * constructors to avoid initialization-order issues during module
 * evaluation (services import each other).
 */
export default class WorkoutHydrationService {
  /**
   * Populates every workout document map service from local storage. Safe
   * to call multiple times — each service's `hydrate()` is a no-op when
   * nothing is cached.
   */
  static async hydrateDocumentMaps(): Promise<void> {
    await Promise.all([
      equipmentTypeMapService.hydrate(),
      muscleGroupMapService.hydrate(),
      exerciseMapService.hydrate(),
      exerciseCalibrationMapService.hydrate(),
      mesocycleMapService.hydrate(),
      microcycleMapService.hydrate(),
      sessionMapService.hydrate(),
      sessionExerciseMapService.hydrate(),
      setMapService.hydrate()
    ]);
  }
}
