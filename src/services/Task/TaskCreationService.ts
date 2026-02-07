import type { DashboardTask, DocumentMap } from '@aneuhold/core-ts-db-lib';
import TaskRecurrenceService from '$services/Task/TaskRecurrenceService.svelte';

/**
 * A service responsible for handling the business logic of task creation.
 * This includes normalization, inheritance of properties from parent tasks,
 * and other preparation steps before a task is persisted.
 */
export default class TaskCreationService {
  /**
   * Prepares a new task for addition to the task map.
   * This applies all necessary business rules and defaults.
   *
   * @param newTask The new task to prepare.
   * @param currentMap The current map of tasks, used for inheritance.
   * @returns The prepared task.
   */
  static prepareTaskForAddition(
    newTask: DashboardTask,
    currentMap: DocumentMap<DashboardTask>
  ): DashboardTask {
    return this.prepareTask(newTask, currentMap);
  }

  private static prepareTask(
    newTask: DashboardTask,
    currentMap: DocumentMap<DashboardTask>
  ): DashboardTask {
    // Logic moved from TaskMapService.beforeDocAddition
    // Ensure description is at least an empty string
    newTask.description = newTask.description || '';

    // Inherit properties from parent task if applicable
    let parentTask: DashboardTask | undefined;
    if (newTask.parentTaskId) {
      parentTask = currentMap[newTask.parentTaskId];
    }
    if (parentTask) {
      // Inherit userId from parent task
      newTask.userId = parentTask.userId;

      // Make sure to inherit sharedWith from parent task
      newTask.sharedWith = [...parentTask.sharedWith];
    }

    TaskRecurrenceService.updateOrRemoveTaskTimeSubscription(newTask);

    return newTask;
  }
}
