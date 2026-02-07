import type { DashboardTask } from '@aneuhold/core-ts-db-lib';
import { ArrayService } from '@aneuhold/core-ts-lib';
import type { UUID } from 'crypto';
import type { BreadCrumbArray } from '$components/BreadCrumb.svelte';
import { confirmationDialog } from '$components/singletons/dialogs/SingletonConfirmationDialog/SingletonConfirmationDialog.svelte';
import taskMapService from './TaskMapService/TaskMapService';

/**
 * The main task utility service.
 */
export default class TaskUtilityService {
  static getTaskRoute(taskId: UUID, includeFirstSlash = true) {
    return `${includeFirstSlash ? '/' : ''}tasks?taskId=${taskId}`;
  }

  /**
   * Gets the appropriate route for the task category page for the given task.
   *
   * @param taskId The ID of the task to generate breadcrumb entries for.
   */
  static getTaskCategoryBreadCrumbs(taskId: UUID): BreadCrumbArray {
    const defaultBreadCrumbs = [{ name: 'tasks', link: 'tasks' }];
    const task = taskMapService.mapState[taskId];
    if (!task) {
      return defaultBreadCrumbs;
    }
    switch (task.category) {
      case 'default':
        return defaultBreadCrumbs;
      default:
        return defaultBreadCrumbs;
    }
  }

  static getBreadCrumbArray(taskId: UUID): BreadCrumbArray {
    const task = taskMapService.mapState[taskId];
    const breadCrumbs: BreadCrumbArray = [];
    if (!task)
      return [
        { name: 'tasks', link: 'tasks' },
        { name: 'Task not found', link: `link not needed` }
      ];
    breadCrumbs.push(...this.getTaskCategoryBreadCrumbs(taskId));
    let currentTask: DashboardTask | undefined = task;
    const parentTaskChain: BreadCrumbArray = [];
    while (currentTask) {
      parentTaskChain.unshift({
        name: currentTask.title && currentTask.title !== '' ? currentTask.title : 'Untitled Task',
        link: this.getTaskRoute(currentTask._id, false)
      });
      if (!currentTask.parentTaskId) {
        break;
      }
      currentTask = taskMapService.mapState[currentTask.parentTaskId];
    }
    breadCrumbs.push(...parentTaskChain);
    return breadCrumbs;
  }

  /**
   * A generic method for handling the delete click for a task.
   *
   * @param allChildrenIdsLength The count of children (nested tasks) for this task.
   * @param deleteTaskCallback A callback to call to perform the actual deletion.
   * @param taskTitle The title of the task, used in the confirmation dialog.
   */
  static handleDeleteTaskClick(
    allChildrenIdsLength: number,
    deleteTaskCallback: () => void,
    taskTitle?: string
  ) {
    if (allChildrenIdsLength > 0) {
      confirmationDialog.open({
        title: 'Delete Task',
        message: `Are you sure you want to delete ${
          !taskTitle || taskTitle === '' ? 'this task' : `"${taskTitle}"`
        }? It has ${allChildrenIdsLength} sub task${allChildrenIdsLength > 1 ? 's' : ''}.`,
        confirmationButtonText: 'Delete',
        onConfirm: deleteTaskCallback
      });
      return;
    }
    deleteTaskCallback();
  }

  /**
   * Recursively finds the parent ID of the given task that has the same
   * sharedWith array.
   *
   * @param task The task to inspect when searching for a parent with the same sharedWith array.
   */
  static findParentIdWithSameSharedWith(task: DashboardTask): UUID {
    if (!task.parentTaskId || task.sharedWith.length === 0) {
      return task._id;
    }
    const parentTask = taskMapService.mapState[task.parentTaskId];
    if (!parentTask) {
      return task._id;
    }
    if (
      ArrayService.arraysHaveSamePrimitiveValues(
        task.sharedWith.map((id) => id),
        parentTask.sharedWith.map((id) => id)
      )
    ) {
      return this.findParentIdWithSameSharedWith(parentTask);
    }
    return task._id;
  }

  static getTaskCategoryRoute(taskId: UUID, includeFirstSlash = true) {
    const defaultRoute = `${includeFirstSlash ? '/' : ''}tasks`;
    const task = taskMapService.mapState[taskId];
    if (!task) {
      return defaultRoute;
    }
    switch (task.category) {
      case 'default':
        return defaultRoute;
      default:
        return defaultRoute;
    }
  }
}
