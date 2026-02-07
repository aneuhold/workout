import {
  type DashboardTask,
  DashboardTaskService,
  type DocumentMap,
  DocumentService
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { type Updater } from 'svelte/store';
import type { UpsertManyInfo } from '../DocumentMapStoreService.svelte';

/**
 * A service for pure task operations that don't require store access.
 * This service contains utility functions for manipulating task data structures
 * and can be used by both TaskMapService and feature-specific services without
 * creating circular dependencies.
 */
export default class TaskOperationsService {
  /**
   * Gets the update info for a task and all of its children based on the
   * provided mutator.
   *
   * @param taskMap The current task map
   * @param taskId The ID of the parent task
   * @param mutator Function to update each task
   */
  static getUpdateTaskAndAllChildrenInfo(
    taskMap: DocumentMap<DashboardTask>,
    taskId: UUID,
    mutator: Updater<DashboardTask>
  ): UpsertManyInfo<DashboardTask> {
    const parentTask = taskMap[taskId];
    if (!parentTask) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }
    const allRelatedTaskIds = DashboardTaskService.getChildrenIds(this.getAllTasks(taskMap), [
      parentTask._id
    ]);
    allRelatedTaskIds.push(parentTask._id);
    const allRelatedTaskIdStrings = allRelatedTaskIds;
    return {
      filter: (currentDoc) => allRelatedTaskIdStrings.includes(currentDoc._id),
      mutator,
      newDocs: []
    };
  }

  /**
   * Gets the update info for duplicating a task and all of its children.
   *
   * @param taskMap The current task map
   * @param taskId The ID of the task to duplicate
   * @param newTaskMutator Function to update the new duplicated tasks
   * @param originalTaskMutator Optional function to update the original tasks
   */
  static getDuplicateTaskUpdateInfo(
    taskMap: DocumentMap<DashboardTask>,
    taskId: UUID,
    newTaskMutator: Updater<DashboardTask>,
    originalTaskMutator?: Updater<DashboardTask>
  ): UpsertManyInfo<DashboardTask> {
    const parentTask = taskMap[taskId];
    if (!parentTask) {
      throw new Error(`Task with ID ${taskId} not found while trying to duplicate.`);
    }
    const allRelatedTaskIds = DashboardTaskService.getChildrenIds(this.getAllTasks(taskMap), [
      parentTask._id
    ]);
    allRelatedTaskIds.push(parentTask._id);
    const tasksToInsert: DashboardTask[] = [];
    const oldTaskIdToNewTaskId: { [oldId: UUID]: UUID } = {};
    allRelatedTaskIds.forEach((id) => {
      const doc = taskMap[id];
      if (!doc) {
        throw new Error(`Task with ID ${id} not found while trying to duplicate.`);
      }
      let newTask = DocumentService.deepCopy($state.snapshot(doc));
      newTask._id = DocumentService.generateID();
      oldTaskIdToNewTaskId[id] = newTask._id;
      newTask = newTaskMutator(newTask);
      tasksToInsert.push(newTask);
    });
    // Map back through and update parent task IDs. Don't update the
    // original task though, as that should retain it's current parent.
    tasksToInsert.forEach((task) => {
      if (task.parentTaskId && task._id !== taskId) {
        task.parentTaskId = oldTaskIdToNewTaskId[task.parentTaskId];
      }
    });
    // The below could be made into something more performant
    const allRelatedTaskIdStrings = allRelatedTaskIds;
    if (originalTaskMutator) {
      const filter = (task: DashboardTask) => allRelatedTaskIdStrings.includes(task._id);
      const mutator = originalTaskMutator;
      return {
        filter: filter,
        mutator: mutator,
        newDocs: tasksToInsert
      };
    }
    return {
      filter: () => false,
      mutator: (task) => task,
      newDocs: tasksToInsert
    };
  }

  /**
   * Simply gets all the tasks in the provided task map excluding any undefined.
   *
   * @param taskMap The task map to extract tasks from
   */
  static getAllTasks(taskMap: DocumentMap<DashboardTask>): DashboardTask[] {
    return Object.values(taskMap).filter((task): task is DashboardTask => task !== undefined);
  }
}
