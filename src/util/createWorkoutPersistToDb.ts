import type { ProjectWorkoutPrimaryEndpointOptions } from '@aneuhold/core-ts-api-lib';
import type { BaseDocument } from '@aneuhold/core-ts-db-lib';
import type { DocumentInsertOrUpdateInfo } from '$services/DocumentMapStoreService.svelte';
import WorkoutAPIService from '$util/api/WorkoutAPIService';

type WorkoutApiKey = keyof NonNullable<ProjectWorkoutPrimaryEndpointOptions['insert']>;

/**
 * Creates a `persistToDb` function for a workout document type that
 * sends insert/update/delete operations to the workout API.
 *
 * @param key The API key name for this document type (e.g. 'mesocycles')
 */
export default function createWorkoutPersistToDb<T extends BaseDocument>(key: WorkoutApiKey) {
  return (info: DocumentInsertOrUpdateInfo<T>) => {
    const options: ProjectWorkoutPrimaryEndpointOptions = {};
    if (info.insert) {
      options.insert = { [key]: info.insert };
    }
    if (info.update) {
      options.update = { [key]: info.update };
    }
    if (info.delete) {
      options.delete = {
        [key]: info.delete.map((d) => d._id)
      };
    }
    WorkoutAPIService.queryApi(options);
  };
}
