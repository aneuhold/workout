import type { BaseDocument, DocumentMap } from '@aneuhold/core-ts-db-lib';
import equipmentTypeMapService from './documentMapServices/EquipmentTypeMap.service.svelte';
import exerciseCalibrationMapService from './documentMapServices/ExerciseCalibrationMap.service.svelte';
import exerciseMapService from './documentMapServices/ExerciseMap.service.svelte';
import mesocycleMapService from './documentMapServices/MesocycleMap.service.svelte';
import microcycleMapService from './documentMapServices/MicrocycleMap.service.svelte';
import muscleGroupMapService from './documentMapServices/MuscleGroupMap.service.svelte';
import sessionExerciseMapService from './documentMapServices/SessionExerciseMap.service.svelte';
import sessionMapService from './documentMapServices/SessionMap.service.svelte';
import setMapService from './documentMapServices/SetMap.service.svelte';
import type DocumentMapStoreService from './DocumentMapStore.service.svelte';

/**
 * Orchestrates app-startup hydration of every workout document map service
 * from its cached local-storage snapshot so the UI can paint last-known-good
 * data before any API response arrives, and the reverse: writing every
 * service's documents to that snapshot. Kept out of the map-service
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

  /**
   * Writes every workout document map service's current documents to local
   * storage, including documents added without persisting. The counterpart
   * to {@link hydrateDocumentMaps}.
   */
  static persistDocumentMaps(): void {
    WorkoutHydrationService.#persistDocumentMap(equipmentTypeMapService);
    WorkoutHydrationService.#persistDocumentMap(muscleGroupMapService);
    WorkoutHydrationService.#persistDocumentMap(exerciseMapService);
    WorkoutHydrationService.#persistDocumentMap(exerciseCalibrationMapService);
    WorkoutHydrationService.#persistDocumentMap(mesocycleMapService);
    WorkoutHydrationService.#persistDocumentMap(microcycleMapService);
    WorkoutHydrationService.#persistDocumentMap(sessionMapService);
    WorkoutHydrationService.#persistDocumentMap(sessionExerciseMapService);
    WorkoutHydrationService.#persistDocumentMap(setMapService);
  }

  /**
   * Sets the service's map to one built from its own documents, which
   * persists it without copying any document.
   *
   * @param service The document map service to persist
   */
  static #persistDocumentMap<TDoc extends BaseDocument>(
    service: DocumentMapStoreService<TDoc>
  ): void {
    const map: DocumentMap<TDoc> = {};
    for (const doc of service.allDocs) {
      map[doc._id] = doc;
    }
    service.setMap(map);
  }
}
