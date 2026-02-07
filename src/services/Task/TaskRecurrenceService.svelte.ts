import {
  type DashboardTask,
  type DashboardTaskMap,
  DashboardTaskSchema,
  DashboardTaskService,
  DocumentService,
  type ParentRecurringTaskInfo,
  RecurrenceBasis,
  RecurrenceEffect,
  type RecurrenceInfo
} from '@aneuhold/core-ts-db-lib';
import type { Unsubscriber, Updater } from 'svelte/store';
import { appIsVisible } from '$stores/session/appIsVisible';
import { timeMinute } from '$stores/session/timeMinute';
import DashboardAPIService from '$util/api/DashboardAPIService';
import { createLogger } from '$util/logging/logger';
import type { UpsertManyInfo } from '../DocumentMapStoreService.svelte';
import TaskOperationsService from './TaskOperationsService.svelte';

const log = createLogger('TaskRecurrenceService.ts');

type TaskRecurrenceSubMap = { [taskId: string]: Unsubscriber | undefined };

/**
 * A service for handling logic related to recurrence on tasks.
 */
export default class TaskRecurrenceService {
  /**
   * The map of task IDs to the their associated unsubscriber. The unsubscriber
   * comes from subscribing to the {@link timeMinute} store.
   */
  private static taskRecurrenceSubMap: TaskRecurrenceSubMap = {};

  /**
   * Creates an example of what would happen to a task if the recurrence
   * were to occur.
   *
   * @param recurrenceInfo the recurrence info to use for the example
   * @param startDate the start date of the task
   * @param dueDate the due date of the task
   * @param parentRecurringTaskInfo the parent recurring task info to use for the example
   */
  static createExampleOfRecurrence(
    recurrenceInfo: RecurrenceInfo,
    startDate?: Date | null,
    dueDate?: Date | null,
    parentRecurringTaskInfo?: ParentRecurringTaskInfo | null
  ): DashboardTask {
    const newTask = DashboardTaskSchema.parse({
      userId: DocumentService.generateID(),
      startDate,
      dueDate,
      recurrenceInfo,
      parentRecurringTaskInfo
    });
    this.updateDatesForRecurrence(newTask);
    return newTask;
  }

  /**
   * Executes recurrence if needed for the provided task.
   *
   * @param task The task to check for recurrence
   * @param taskMap The current task map
   * @param upsertMany The function to call to upsert the recurrence changes
   */
  static executeRecurrenceIfNeeded(
    task: DashboardTask,
    taskMap: DashboardTaskMap,
    upsertMany: (info: UpsertManyInfo<DashboardTask>) => void
  ) {
    if (this.taskShouldRecur(task)) {
      this.executeRecurrenceForTask(task, taskMap, upsertMany);
    }
  }

  static taskShouldRecur(task: DashboardTask): boolean {
    // Do not execute recurrence for child tasks or if the recurrenceInfo is
    // not set.
    if (!task.recurrenceInfo || task.parentRecurringTaskInfo) {
      return false;
    }
    if (
      task.recurrenceInfo.recurrenceEffect === RecurrenceEffect.rollOnCompletion &&
      task.completed
    ) {
      return true;
    } else {
      const nextRecurrenceDate = this.getNextRecurrenceDate(task);
      if (!nextRecurrenceDate) {
        return false;
      }
      const currentDate = new Date();
      if (nextRecurrenceDate < currentDate) {
        return true;
      }
    }
    return false;
  }

  /**
   * Executes recurrence for the provided task and all child tasks. This will
   * reflect across the stores, UI, and backend.
   *
   * This should only be triggered exactly when it is time to do so. The logic
   * for that should be contained elsewhere.
   *
   * This will automatically happen if a task was manually updated and it is
   * time for it to recur. So this method should only be called when the task
   * map is set.
   *
   * This will not take any action if there is no recurrence info on the task.
   *
   * @param task The task to execute recurrence for
   * @param taskMap The current task map
   * @param upsertMany The function to call to upsert the recurrence changes
   */
  static executeRecurrenceForTask(
    task: DashboardTask,
    taskMap: DashboardTaskMap,
    upsertMany: (info: UpsertManyInfo<DashboardTask>) => void
  ) {
    if (!task.recurrenceInfo || task.parentRecurringTaskInfo) {
      return;
    }
    log.info('Executing recurrence for task', task);
    upsertMany(this.getRecurrenceUpdateInfo(taskMap, task));
  }

  /**
   * Gets the recurrence update info for the provided task. This includes
   * information about which tasks to update and how to update them.
   *
   * @param taskMap The current task map
   * @param task The task to get recurrence update info for
   */
  static getRecurrenceUpdateInfo(
    taskMap: DashboardTaskMap,
    task: DashboardTask
  ): UpsertManyInfo<DashboardTask> {
    if (!task.recurrenceInfo || task.parentRecurringTaskInfo) {
      throw new Error('Task does not have recurrence info and should not be updated');
    }
    if (task.recurrenceInfo.recurrenceEffect === RecurrenceEffect.stack && !task.completed) {
      return TaskOperationsService.getDuplicateTaskUpdateInfo(
        taskMap,
        task._id,
        (task) => {
          task.completed = true;
          TaskRecurrenceService.updateDatesForRecurrence(task);
          return task;
        },
        (originalTask) => {
          originalTask.recurrenceInfo = null;
          originalTask.parentRecurringTaskInfo = null;
          return originalTask;
        }
      );
    } else {
      return TaskOperationsService.getUpdateTaskAndAllChildrenInfo(taskMap, task._id, (task) => {
        TaskRecurrenceService.updateDatesForRecurrence(task);
        task.completed = false;
        return task;
      });
    }
  }

  /**
   * Gets the next recurrence date for the provided task.
   *
   * This returns a value for parent and sub tasks.
   *
   * @param task The task to get the next recurrence date for
   */
  static getNextRecurrenceDate(task: DashboardTask): Date | null {
    if (
      !task.recurrenceInfo ||
      task.recurrenceInfo.recurrenceEffect === RecurrenceEffect.rollOnCompletion
    ) {
      return null;
    }
    let basisDate: Date | undefined | null;
    if (task.parentRecurringTaskInfo) {
      if (task.recurrenceInfo.recurrenceBasis === RecurrenceBasis.startDate) {
        basisDate = task.parentRecurringTaskInfo.startDate;
      } else {
        return task.parentRecurringTaskInfo.dueDate || null;
      }
    } else {
      if (task.recurrenceInfo.recurrenceBasis === RecurrenceBasis.startDate) {
        basisDate = task.startDate;
      } else {
        return task.dueDate || null;
      }
    }
    if (!basisDate) {
      return null;
    }
    return DashboardTaskService.getNextFrequencyDate(basisDate, task.recurrenceInfo.frequency);
  }

  /**
   * Gets a simulated next recurrence date for the provided task. This makes
   * a deep copy of the task first. If anything is invalid, or the task recurs
   * on completion, this will return null.
   *
   * @param originalTask The original task
   * @param mutator The mutator to apply to the task before getting the next recurrence date
   */
  static getSimulatedRecurrenceDate(
    originalTask: DashboardTask,
    mutator: Updater<DashboardTask>
  ): Date | null {
    let taskCopy = DocumentService.deepCopy($state.snapshot(originalTask));
    taskCopy = mutator(taskCopy);
    return this.getNextRecurrenceDate(taskCopy);
  }

  /**
   * This should only be called by the taskMap store when it is updated.
   *
   * @param taskMap The current task map
   */
  static buildTaskRecurrenceSubMapFresh(taskMap: DashboardTaskMap): void {
    // Clear the current map
    Object.values(this.taskRecurrenceSubMap).forEach((unsub) => {
      if (unsub) unsub();
    });
    this.taskRecurrenceSubMap = {};
    // Build the new map
    Object.values(taskMap).forEach((task) => {
      if (task) {
        this.updateOrRemoveTaskTimeSubscription(task);
      }
    });
  }

  /**
   * Attaches the provided task to the timeMinute store if it is not already
   * attached, and if it fits the conditions to be attached.
   *
   * This will also remove the task from the timeMinute store if it is attached
   * and no longer fits the conditions to be attached.
   *
   * This should be called whenever a task's recurrence info is updated.
   *
   * @param task The task to update the time subscription for
   */
  static updateOrRemoveTaskTimeSubscription(task: DashboardTask) {
    // Remove the current subscription if it exists
    this.removeTaskTimeSubscription(task._id);
    if (
      !task.parentRecurringTaskInfo &&
      task.recurrenceInfo &&
      task.recurrenceInfo.recurrenceEffect !== RecurrenceEffect.rollOnCompletion
    ) {
      const nextRecurrenceDate = this.getNextRecurrenceDate(task);
      if (nextRecurrenceDate) {
        this.taskRecurrenceSubMap[task._id] = timeMinute.subscribe((newDate) => {
          if (newDate > nextRecurrenceDate) {
            // Only run if the app is visible, otherwise, wait until it is
            // visible.
            if (appIsVisible.get()) {
              // The decision was made to pull all tasks from the DB first before
              // triggering recurrence. This is because it could be left open
              // for a long time and updates sent to the backend could be stale.
              DashboardAPIService.getInitialDataIfNeeded();
            }
          }
        });
      }
    }
  }

  static removeTaskTimeSubscription(taskId: string) {
    const unsub = this.taskRecurrenceSubMap[taskId];
    if (unsub) {
      unsub();
      delete this.taskRecurrenceSubMap[taskId];
    }
  }

  /**
   * Updates the provided Tasks's dates based on the recurrence info in-place.
   *
   * @param task The task to update
   */
  static updateDatesForRecurrence(task: DashboardTask): void {
    if (!task.recurrenceInfo) {
      return;
    }
    DashboardTaskService.updateDatesForRecurrence(task);
    // For both roll on basis and roll on completion, the tasks should move
    // forward until they are in the future.
    if (task.recurrenceInfo.recurrenceEffect !== RecurrenceEffect.stack) {
      const currentDate = new Date();
      if (task.recurrenceInfo.recurrenceBasis === RecurrenceBasis.startDate) {
        while (task.startDate && task.startDate < currentDate) {
          DashboardTaskService.updateDatesForRecurrence(task);
        }
      } else {
        while (task.dueDate && task.dueDate < currentDate) {
          DashboardTaskService.updateDatesForRecurrence(task);
        }
      }
    }
  }
}
