import type {
  ProjectWorkoutPrimaryEndpointOptions,
  ProjectWorkoutPrimaryOutput
} from '@aneuhold/core-ts-api-lib';
import type { BaseDocument, DocumentMap } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import type { Updater } from 'svelte/store';

/**
 * Everything a {@link DocumentMapStoreService} needs to persist and refresh
 * one document type.
 */
export interface DocumentMapStoreConfig<T extends BaseDocument> {
  /**
   * The API key this document type's insert / update / delete operations are
   * staged under (e.g. 'mesocycles').
   */
  workoutApiInsertKey: WorkoutApiInsertKey;
  persistToLocalData: (map: DocumentMap<T>) => void;
  /**
   * Applies this map's part of the combined output of a processed batch of
   * API requests. `input` is the combined input across that batch, so the map
   * can check what was requested.
   */
  handleApiOutput: (
    output: ProjectWorkoutPrimaryOutput,
    input: ProjectWorkoutPrimaryEndpointOptions
  ) => void;
  /**
   * Reads a cached map from local storage. If provided, `hydrate()` uses it
   * to populate the reactive state on startup before any API data arrives.
   * Resolve to `null` if nothing is cached.
   */
  loadFromLocalData?: () => Promise<DocumentMap<T> | null>;
}

export type DocumentInsertOrUpdateInfo<T extends BaseDocument> = {
  insert?: T[];
  update?: T[];
  delete?: UUID[];
  get?: ProjectWorkoutPrimaryEndpointOptions['get'];
};

export type UpsertManyInfo<T> = {
  filter: (currentChild: T) => boolean;
  mutator: Updater<T>;
  newDocs: T[];
};

/**
 * Names of the workout collections that the primary API can insert / update /
 * delete (CTOs and other derived outputs are excluded). Equivalently, the keys
 * of the `insert` payload on `ProjectWorkoutPrimaryEndpointOptions`.
 */
export type WorkoutApiInsertKey = keyof NonNullable<ProjectWorkoutPrimaryEndpointOptions['insert']>;
