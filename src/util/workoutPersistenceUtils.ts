import type { ProjectWorkoutPrimaryEndpointOptions } from '@aneuhold/core-ts-api-lib';
import type { BaseDocument } from '@aneuhold/core-ts-db-lib';
import type { DocumentInsertOrUpdateInfo } from '$services/DocumentMapStore.service.svelte';
import WorkoutAPIService from '$services/WorkoutAPI.service';

/**
 * Names of the workout collections that the primary API can insert / update /
 * delete (CTOs and other derived outputs are excluded). Equivalently, the keys
 * of the `insert` payload on `ProjectWorkoutPrimaryEndpointOptions`.
 */
export type WorkoutApiInsertKey = keyof NonNullable<ProjectWorkoutPrimaryEndpointOptions['insert']>;

/**
 * Creates a `prepareForSave` function for a workout document type that
 * mutates an existing API options object with insert/update/delete operations
 * instead of sending them immediately. Operations for this document type are
 * appended to whatever is already staged for the same key, so repeated calls
 * against one options object accumulate rather than overwrite each other.
 *
 * @param key The API key name for this document type (e.g. 'mesocycles')
 */
export function createWorkoutPrepareForSave<T extends BaseDocument>(key: WorkoutApiInsertKey) {
  return (options: ProjectWorkoutPrimaryEndpointOptions, info: DocumentInsertOrUpdateInfo<T>) => {
    if (info.insert) {
      // Looks complicated, but it just makes it so the things are additive in the arrrays, and
      // don't overwrite. The info wins over options.
      options.insert = {
        ...options.insert,
        [key]: [...(options.insert?.[key] ?? []), ...info.insert]
      };
    }
    if (info.update) {
      options.update = {
        ...options.update,
        [key]: [...(options.update?.[key] ?? []), ...info.update]
      };
    }
    if (info.delete) {
      options.delete = {
        ...options.delete,
        [key]: [...(options.delete?.[key] ?? []), ...info.delete]
      };
    }
    if (info.get) {
      options.get = { ...options.get, ...info.get };
    }
  };
}

/**
 * Creates a `persistToDb` function for a workout document type that
 * sends insert/update/delete operations to the workout API.
 *
 * @param key The API key name for this document type (e.g. 'mesocycles')
 */
export function createWorkoutPersistToDb<T extends BaseDocument>(key: WorkoutApiInsertKey) {
  const prepareForSave = createWorkoutPrepareForSave<T>(key);
  return (info: DocumentInsertOrUpdateInfo<T>) => {
    const options: ProjectWorkoutPrimaryEndpointOptions = {};
    prepareForSave(options, info);
    WorkoutAPIService.queryApi(options);
  };
}

/**
 * Standard `get` options that request refreshed exercise and muscle-group
 * volume CTOs after a mutation. Shared by every document map service whose
 * writes can affect CTO-derived fields.
 */
export const ctoGet: ProjectWorkoutPrimaryEndpointOptions['get'] = {
  exerciseCTOs: { all: true },
  muscleGroupVolumeCTOs: { all: true }
};
