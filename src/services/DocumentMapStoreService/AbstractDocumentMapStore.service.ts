import type {
  ProjectWorkoutPrimaryEndpointOptions,
  ProjectWorkoutPrimaryOutput
} from '@aneuhold/core-ts-api-lib';

/**
 * The members of a document map store service that don't depend on its
 * document type, so services for different document types share one type.
 *
 * See "Existential types" for more info on why this is needed vs a generic in a type definition.
 * Also this TypeScript issue: https://github.com/microsoft/TypeScript/issues/14466
 */
export default abstract class AbstractDocumentMapStoreService {
  /**
   * Replaces the map with one built from its own documents, which persists
   * it without copying any document.
   */
  public abstract persistDocumentMap(): void;

  /**
   * Applies this map's part of the combined output of a processed batch of
   * API requests.
   *
   * @param output The combined output of the batch
   * @param input The combined input across the batch
   */
  public abstract handleApiOutput(
    output: ProjectWorkoutPrimaryOutput,
    input: ProjectWorkoutPrimaryEndpointOptions
  ): void;

  /**
   * Populates the reactive state from local-storage cache, if available,
   * without re-persisting. Intended to run once on app startup so the UI
   * can show the last-known-good data before the API responds.
   */
  public abstract hydrate(): Promise<void>;
}
