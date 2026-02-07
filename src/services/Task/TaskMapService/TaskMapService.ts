import {
  type DashboardTask,
  DashboardTaskService,
  type DocumentMap,
  RecurrenceEffect,
  type RecurrenceInfo
} from '@aneuhold/core-ts-db-lib';
import { DateService } from '@aneuhold/core-ts-lib';
import type { UUID } from 'crypto';
import type { Updater } from 'svelte/store';
import { userConfig } from '$stores/local/userConfig/userConfig';
import DashboardTaskAPIService from '$util/api/DashboardTaskAPIService';
import LocalData from '$util/LocalData/LocalData';
import { createLogger } from '$util/logging/logger';
import type {
  DocumentInsertOrUpdateInfo,
  UpsertManyInfo
} from '../../DocumentMapStoreService.svelte';
import DocumentMapStoreService from '../../DocumentMapStoreService.svelte';
import TaskCreationService from '../TaskCreationService';
import TaskOperationsService from '../TaskOperationsService.svelte';
import TaskRecurrenceService from '../TaskRecurrenceService.svelte';
import TaskTagsService from '../TaskTagsService';

const log = createLogger('TaskMapService.ts');

/**
 * The main task map service.
 */
export class TaskMapService extends DocumentMapStoreService<DashboardTask> {
  public override addDoc(task: DashboardTask): void {
    this.addManyDocs([task]);
  }

  public override addManyDocs(tasks: DashboardTask[]): void {
    const preparedTasks = tasks.map((task) =>
      TaskCreationService.prepareTaskForAddition(task, this.mapState)
    );
    super.addManyDocs(preparedTasks);
  }

  public override updateDoc(taskId: UUID, mutator: Updater<DashboardTask>): void {
    this.updateManyDocs([taskId], mutator);
  }

  public override updateManyDocs(
    filterOrTaskIds: UUID[] | ((currentDoc: DashboardTask) => boolean),
    mutator: Updater<DashboardTask>
  ): void {
    super.updateManyDocs(filterOrTaskIds, mutator);
  }

  public override upsertManyDocs(upsertInfo: UpsertManyInfo<DashboardTask>): void {
    const { filter, mutator, newDocs } = upsertInfo;
    const preparedNewDocs = newDocs.map((task) =>
      TaskCreationService.prepareTaskForAddition(task, this.mapState)
    );
    super.upsertManyDocs({
      filter,
      mutator: mutator,
      newDocs: preparedNewDocs
    });
  }

  public override deleteDoc(docId: UUID): void {
    this.deleteManyDocs([docId]);
  }

  public override deleteManyDocs(docIds: UUID[]): void {
    const allTasks = TaskOperationsService.getAllTasks(this.mapState);
    const allIdsToDelete = [...docIds, ...DashboardTaskService.getChildrenIds(allTasks, docIds)];
    allIdsToDelete.forEach((id) => {
      TaskRecurrenceService.removeTaskTimeSubscription(id);
    });
    super.deleteManyDocs(allIdsToDelete);
  }

  /**
   * Toggles completion for the task with the given ID.
   *
   * @param task The task to toggle completion for.
   */
  public toggleTaskCompleted(task: DashboardTask): void {
    const shouldExecuteRecurrenceAfterCompletion =
      !task.parentRecurringTaskInfo &&
      !task.completed &&
      task.recurrenceInfo?.recurrenceEffect === RecurrenceEffect.rollOnCompletion;

    this.updateDoc(task._id, (task) => {
      task.completed = !task.completed;
      return task;
    });

    if (shouldExecuteRecurrenceAfterCompletion) {
      this.executeRecurrenceForTask(task);
    }
  }

  public updateSharedWith(taskId: UUID, newSharedWith: UUID[]): void {
    const updateInfo = TaskOperationsService.getUpdateTaskAndAllChildrenInfo(
      this.mapState,
      taskId,
      (task) => {
        task.sharedWith = newSharedWith;

        // If a task is unshared, or if the currently
        // assigned user is removed from sharing (and isn't the owner), clear assignment.
        if (
          newSharedWith.length === 0 ||
          (task.assignedTo &&
            task.assignedTo !== task.userId &&
            !newSharedWith.includes(task.assignedTo))
        ) {
          task.assignedTo = null;
        }

        return task;
      }
    );
    this.upsertManyDocs(updateInfo);
  }

  public updateTags(taskId: UUID, newTags: string[]): void {
    const userId = userConfig.get().config.userId;
    this.updateDoc(taskId, (task) => {
      if (newTags.length === 0) {
        delete task.tags[userId];
      } else {
        task.tags[userId] = newTags;
        // Add any new tags to the user's global tag list
        newTags.forEach((tag) => {
          TaskTagsService.addTagForUserIfNeeded(tag);
        });
      }
      return task;
    });
  }

  public updateTaskRecurrenceOrDates(
    taskId: UUID,
    options: {
      newRecurrenceInfo?: RecurrenceInfo | null;
      newStartDate?: Date | null;
      newDueDate?: Date | null;
    }
  ): void {
    const currentTask = this.mapState[taskId];
    if (!currentTask) {
      log.error(
        `Cannot update task recurrence for task with ID ${taskId} because it does not exist.`
      );
      return;
    }

    const { newRecurrenceInfo, newStartDate, newDueDate } = options;

    if (options.newRecurrenceInfo !== undefined) {
      currentTask.recurrenceInfo = newRecurrenceInfo;
    }
    if (options.newStartDate !== undefined) {
      currentTask.startDate = newStartDate;
    }
    if (options.newDueDate !== undefined) {
      currentTask.dueDate = newDueDate;
    }
    const watchRecurrenceInfo = currentTask.recurrenceInfo && !currentTask.parentRecurringTaskInfo;

    if (watchRecurrenceInfo && TaskRecurrenceService.taskShouldRecur(currentTask)) {
      const updateInfo = TaskRecurrenceService.getRecurrenceUpdateInfo(this.mapState, currentTask);
      this.upsertManyDocs(updateInfo);
    } else {
      TaskRecurrenceService.updateOrRemoveTaskTimeSubscription(currentTask);

      const updateInfo = TaskOperationsService.getUpdateTaskAndAllChildrenInfo(
        this.mapState,
        currentTask._id,
        (task) => {
          if (task._id === currentTask._id) {
            return task;
          }
          if (currentTask.recurrenceInfo) {
            task.parentRecurringTaskInfo = {
              taskId: currentTask._id,
              startDate: currentTask.startDate,
              dueDate: currentTask.dueDate
            };
            task.recurrenceInfo = currentTask.recurrenceInfo;
          } else {
            task.parentRecurringTaskInfo = null;
            task.recurrenceInfo = null;
          }
          return task;
        }
      );
      this.upsertManyDocs(updateInfo);
    }
  }

  public duplicateTask(taskId: UUID): void {
    const currentTask = this.mapState[taskId];
    if (!currentTask) {
      log.error(`Cannot duplicate task with ID ${taskId} because it does not exist.`);
      return;
    }
    const updateInfo = TaskOperationsService.getDuplicateTaskUpdateInfo(
      this.mapState,
      taskId,
      (task) => {
        // Conditional to find the original task that is being duplicated
        if (
          !task.parentTaskId ||
          (currentTask.parentTaskId && task.parentTaskId === currentTask.parentTaskId)
        ) {
          task.title = `${task.title} (Copy)`;
        }
        return task;
      }
    );
    this.upsertManyDocs(updateInfo);
  }

  public executeRecurrenceForTask(task: DashboardTask): void {
    TaskRecurrenceService.executeRecurrenceForTask(task, this.mapState, (info) => {
      this.upsertManyDocs(info);
    });
  }

  public override setMap(newMap: DocumentMap<DashboardTask>): void {
    super.setMap(newMap);
    // Check if any tasks need to recur after everything has been set
    Object.values(newMap).forEach((task) => {
      if (task) {
        TaskRecurrenceService.executeRecurrenceIfNeeded(task, this.mapState, (info) => {
          this.upsertManyDocs(info);
        });
      }
    });
    TaskRecurrenceService.buildTaskRecurrenceSubMapFresh(newMap);
    this.autoDeleteTasksPostSet(newMap);
  }

  protected override persistToLocalData(): DocumentMap<DashboardTask> {
    return LocalData.setAndGetTaskMap(this.mapState);
  }

  protected override getFromLocalData(): DocumentMap<DashboardTask> | null {
    return LocalData.taskMap;
  }

  protected override persistToDb(updateInfo: DocumentInsertOrUpdateInfo<DashboardTask>): void {
    DashboardTaskAPIService.updateTasks(updateInfo);
  }

  /**
   * Auto-deletes tasks that are older than the user's auto task deletion
   * settings.
   *
   * @param map The task map to check for auto-deletion
   */
  private autoDeleteTasksPostSet(map: DocumentMap<DashboardTask>) {
    // Check for any tasks that need to be auto-deleted.
    const userCfg = userConfig.get().config;
    if (userCfg.autoTaskDeletionDays < 5 || userCfg.autoTaskDeletionDays > 90) {
      log.error(
        `User ${userCfg.userId} has an invalid autoTaskDeletionDays value of ${userCfg.autoTaskDeletionDays}.`
      );
      return;
    }
    const dateThreshold = DateService.addDays(new Date(), -userCfg.autoTaskDeletionDays);
    // Only tasks that don't have a parent, aren't recurring,
    // are completed, and are older than the threshold
    const tasksToDelete = Object.values(map).filter((task) => {
      return (
        task &&
        task.userId === userCfg.userId &&
        task.completed &&
        !task.parentTaskId &&
        !task.parentRecurringTaskInfo &&
        !task.recurrenceInfo &&
        task.lastUpdatedDate < dateThreshold
      );
    }) as DashboardTask[];
    const taskIdsToDelete = tasksToDelete.map((task) => task._id);
    if (taskIdsToDelete.length !== 0) {
      log.info(`Deleting ${taskIdsToDelete.length} tasks due to auto task deletion.`);
      this.deleteManyDocs(taskIdsToDelete);
    }
  }
}

const taskMapService = new TaskMapService();

export default taskMapService;
