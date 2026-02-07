import type { ProjectDashboardOptions } from '@aneuhold/core-ts-api-lib';
import type { DashboardTask } from '@aneuhold/core-ts-db-lib';
import type { DocumentInsertOrUpdateInfo } from '$services/DocumentMapStoreService.svelte';
import DashboardAPIService from './DashboardAPIService';

/**
 * The API service for tasks in the dashboard.
 */
export default class DashboardTaskAPIService {
  /**
   * Inserts, deletes, or updates tasks in the backend.
   *
   * If a set of tasks is already being inserted or updated, this will be added
   * to the queue and executed after the previous set is done.
   *
   * @param updateInfo Information about documents to insert, update or delete.
   */
  static updateTasks(updateInfo: DocumentInsertOrUpdateInfo<DashboardTask>) {
    const request: ProjectDashboardOptions = {};
    if (updateInfo.insert && updateInfo.insert.length > 0) {
      request.insert = {
        tasks: updateInfo.insert
      };
    }
    if (updateInfo.update && updateInfo.update.length > 0) {
      request.update = {
        tasks: updateInfo.update
      };
    }
    if (updateInfo.delete && updateInfo.delete.length > 0) {
      request.delete = {
        tasks: updateInfo.delete
      };
    }
    request.get = {
      tasks: true
    };
    DashboardAPIService.queryApi(request);
  }
}
