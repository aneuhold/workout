import apiResponseHandlingOrder from './WorkoutAPIService/apiResponseHandlingOrder';

/**
 * Orchestrates app-startup hydration of every workout document map service
 * from its cached local-storage snapshot so the UI can paint last-known-good
 * data before any API response arrives, and the reverse: writing every
 * service's documents to that snapshot.
 */
export default class WorkoutHydrationService {
  /**
   * Populates every workout document map service from local storage. Safe
   * to call multiple times — each service's `hydrate()` is a no-op when
   * nothing is cached.
   */
  static async hydrateDocumentMaps(): Promise<void> {
    await Promise.all(apiResponseHandlingOrder.map((service) => service.hydrate()));
  }

  /**
   * Writes every workout document map service's current documents to local
   * storage, including documents added without persisting. The counterpart
   * to {@link hydrateDocumentMaps}.
   */
  static persistDocumentMaps(): void {
    apiResponseHandlingOrder.forEach((service) => {
      service.persistDocumentMap();
    });
  }
}
