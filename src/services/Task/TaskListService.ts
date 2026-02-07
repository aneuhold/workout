import {
  type DashboardTask,
  type DashboardTaskFilterAndSortResult,
  DashboardTaskListFilterSettingsSchema,
  DashboardTaskListSortSettingsSchema,
  type DashboardTaskMap,
  DashboardTaskService
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import type { UserConfig } from '$stores/local/userConfig/userConfig';

/**
 * A service responsible for getting filtered and sorted lists of task IDs.
 */
export default class TaskListService {
  static getTaskIds(
    taskMap: DashboardTaskMap,
    userConfig: UserConfig,
    category: string
  ): DashboardTaskFilterAndSortResult {
    const taskFilterSettings =
      userConfig.config.taskListFilterSettings[category] ??
      DashboardTaskListFilterSettingsSchema.parse({
        userId: userConfig.config.userId
      });
    const taskSortSettings =
      userConfig.config.taskListSortSettings[category] ??
      DashboardTaskListSortSettingsSchema.parse({
        userId: userConfig.config.userId
      });
    return DashboardTaskService.getFilteredAndSortedTaskIds(
      taskMap,
      category,
      taskFilterSettings,
      taskSortSettings,
      userConfig.config.tagSettings
    );
  }

  static getTaskIdsForTask(
    taskMap: DashboardTaskMap,
    userConfig: UserConfig,
    allChildrenIds: UUID[],
    task?: DashboardTask
  ): DashboardTaskFilterAndSortResult {
    if (!task) {
      return {
        filteredAndSortedIds: [],
        removedIds: []
      };
    }
    const userId = userConfig.config.userId;
    const taskFilterSettings =
      task.filterSettings[userId] ??
      userConfig.config.taskListFilterSettings[task.category] ??
      DashboardTaskListFilterSettingsSchema.parse({
        userId
      });
    const taskSortSettings =
      task.sortSettings[userId] ??
      userConfig.config.taskListSortSettings[task.category] ??
      DashboardTaskListSortSettingsSchema.parse({
        userId
      });
    return DashboardTaskService.getFilteredAndSortedTaskIds(
      taskMap,
      task.category,
      taskFilterSettings,
      taskSortSettings,
      userConfig.config.tagSettings,
      {
        taskId: task._id,
        allChildrenIds: allChildrenIds
      }
    );
  }
}
