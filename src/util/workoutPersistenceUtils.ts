import type { ProjectWorkoutPrimaryEndpointOptions } from '@aneuhold/core-ts-api-lib';
import type { BaseDocument } from '@aneuhold/core-ts-db-lib';
import type { DocumentInsertOrUpdateInfo } from '$services/DocumentMapStoreService.svelte';
import WorkoutAPIService from '$util/api/WorkoutAPIService';

type WorkoutApiKey = keyof NonNullable<ProjectWorkoutPrimaryEndpointOptions['insert']>;

/**
 * Creates a `prepareForSave` function for a workout document type that
 * mutates an existing API options object with insert/update/delete operations
 * instead of sending them immediately.
 *
 * @param key The API key name for this document type (e.g. 'mesocycles')
 */
export function createWorkoutPrepareForSave<T extends BaseDocument>(key: WorkoutApiKey) {
  return (options: ProjectWorkoutPrimaryEndpointOptions, info: DocumentInsertOrUpdateInfo<T>) => {
    if (info.insert) {
      options.insert = { ...options.insert, [key]: info.insert };
    }
    if (info.update) {
      options.update = { ...options.update, [key]: info.update };
    }
    if (info.delete) {
      options.delete = { ...options.delete, [key]: info.delete.map((d) => d._id) };
    }
  };
}

/**
 * Creates a `persistToDb` function for a workout document type that
 * sends insert/update/delete operations to the workout API.
 *
 * @param key The API key name for this document type (e.g. 'mesocycles')
 */
export default function createWorkoutPersistToDb<T extends BaseDocument>(key: WorkoutApiKey) {
  const prepareForSave = createWorkoutPrepareForSave<T>(key);
  return (info: DocumentInsertOrUpdateInfo<T>) => {
    const options: ProjectWorkoutPrimaryEndpointOptions = {};
    prepareForSave(options, info);
    WorkoutAPIService.queryApi(options);
  };
}
