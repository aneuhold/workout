import { type DashboardTask, DashboardTaskSchema } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { userConfig } from '$stores/local/userConfig/userConfig';
import TestUsers from '$testUtils/TestUsers';
import TaskListService from '../TaskListService';
import TaskTagsService from '../TaskTagsService';
import taskMapService from './TaskMapService';

type AddTaskInfo = {
  title: string;
  startDate?: Date;
  dueDate?: Date;
  sharedWith?: MockTaskSharedWith;
  description?: MockTaskDescription;
  assignedTo?: MockTaskAssignment;
  tags?: string[];
  subtasks?: AddTaskInfo[];
  completed?: boolean;
};

type AddTasksInfo = {
  numTasks: number;
  includeStartDates?: boolean;
  includeStartDatesInFuture?: boolean;
  includeDueDates?: boolean;
  /**
   * If set to true, it will make half of the due dates overdue.
   */
  includeOverDueDates?: boolean;
  sharedWith?: MockTaskSharedWith;
  assignedTo?: MockTaskAssignment;
  tags?: string[];
  descriptions?: MockTaskDescription;
  subtasks?: MockTaskSubTasks;
};

/**
 * Represents the different ways a task can be shared with others in the mock.
 */
export enum MockTaskSharedWith {
  none,
  withMe,
  withMultiplePeople,
  withSinglePerson
}

export enum MockTaskAssignment {
  none,
  toMe,
  toOther
}

export enum MockTaskDescription {
  none,
  short,
  long
}

export enum MockTaskSubTasks {
  none,
  someCompleted,
  someIncomplete,
  someCompleteAndIncomplete,
  someAssignedToMeAndComplete,
  someAssignedToMeAndIncomplete,
  allVariations
}

/**
 * A mock provider for the TaskMapService. This depends on the backend API
 * being mocked already so it doesn't try to contact the server.
 */
export default class TaskMapServiceMock {
  constructor(private userId: UUID) {}

  reset(): void {
    taskMapService.setMap({});
  }

  /**
   * Gets the sort and filter result for the current task list as if it was
   * at the top level.
   */
  get sortAndFilterResult() {
    return TaskListService.getTaskIds(taskMapService.mapState, userConfig.get(), 'default');
  }

  addTask(options: AddTaskInfo): DashboardTask {
    const task = this.createTask(options);
    taskMapService.addDoc(task);
    return task;
  }

  addTasks(options: AddTasksInfo): void {
    const tasks = this.createTasks(options);
    taskMapService.addManyDocs(tasks);
  }

  private createTasks(options: AddTasksInfo): DashboardTask[] {
    const tasks: DashboardTask[] = [];
    for (let i = 0; i < options.numTasks; i++) {
      // Initialize task info with title
      const taskInfo: AddTaskInfo = {
        title: `Test Task ${i + 1}`,
        sharedWith: options.sharedWith,
        tags: options.tags,
        description: options.descriptions,
        assignedTo: options.assignedTo
      };

      // Decide on start date
      if (options.includeStartDates || options.includeStartDatesInFuture) {
        if (Math.random() < 0.5) {
          taskInfo.startDate = this.getRandomDate(30, options.includeStartDatesInFuture ?? false);
        }
      }

      // Decide on due date
      if (options.includeDueDates || options.includeOverDueDates) {
        if (Math.random() < 0.5) {
          taskInfo.dueDate = this.getRandomDate(30, !options.includeOverDueDates);
        }
      }

      // Adjust due date if it should be between the start date and now
      if (
        options.includeOverDueDates &&
        taskInfo.dueDate &&
        taskInfo.startDate &&
        Math.random() < 0.5
      ) {
        const startDate = taskInfo.startDate.getTime();
        const now = Date.now();
        const timeDiff = now - startDate;
        if (timeDiff > 0) {
          // Set due date to a random time between start date and now
          taskInfo.dueDate = new Date(startDate + Math.random() * timeDiff);
        }
      }

      // Add subtasks according to enum
      switch (options.subtasks ? options.subtasks : MockTaskSubTasks.none) {
        case MockTaskSubTasks.none:
          break;
        case MockTaskSubTasks.someCompleted:
          taskInfo.subtasks = [
            { title: 'Subtask 1', completed: true },
            { title: 'Subtask 2', completed: true },
            { title: 'Subtask 3', completed: false }
          ];
          break;
        case MockTaskSubTasks.someIncomplete:
          taskInfo.subtasks = [
            { title: 'Subtask 1', completed: false },
            { title: 'Subtask 2', completed: false },
            { title: 'Subtask 3', completed: true }
          ];
          break;
        case MockTaskSubTasks.someCompleteAndIncomplete:
          taskInfo.subtasks = [
            { title: 'Subtask 1', completed: true },
            { title: 'Subtask 2', completed: false },
            { title: 'Subtask 3', completed: true }
          ];
          break;
        case MockTaskSubTasks.someAssignedToMeAndComplete:
          if (options.sharedWith !== MockTaskSharedWith.none) {
            taskInfo.subtasks = [
              {
                title: 'Subtask 1',
                completed: true,
                sharedWith: options.sharedWith,
                assignedTo: MockTaskAssignment.toMe
              },
              {
                title: 'Subtask 2',
                completed: true,
                sharedWith: options.sharedWith,
                assignedTo: MockTaskAssignment.toMe
              },
              {
                title: 'Subtask 3',
                completed: false,
                sharedWith: options.sharedWith,
                assignedTo: MockTaskAssignment.toMe
              }
            ];
          }

          break;
        case MockTaskSubTasks.someAssignedToMeAndIncomplete:
          if (options.sharedWith !== MockTaskSharedWith.none) {
            taskInfo.subtasks = [
              {
                title: 'Subtask 1',
                completed: false,
                sharedWith: options.sharedWith,
                assignedTo: MockTaskAssignment.toMe
              },
              {
                title: 'Subtask 2',
                completed: false,
                sharedWith: options.sharedWith,
                assignedTo: MockTaskAssignment.toMe
              },
              {
                title: 'Subtask 3',
                completed: true,
                sharedWith: options.sharedWith,
                assignedTo: MockTaskAssignment.toMe
              }
            ];
          }
          break;
        case MockTaskSubTasks.allVariations:
          if (options.sharedWith !== MockTaskSharedWith.none) {
            taskInfo.subtasks = [
              {
                title: 'Subtask 1',
                completed: true,
                sharedWith: options.sharedWith,
                assignedTo: MockTaskAssignment.toMe
              },
              {
                title: 'Subtask 2',
                completed: false,
                sharedWith: options.sharedWith,
                assignedTo: MockTaskAssignment.toMe
              },
              {
                title: 'Subtask 3',
                completed: true,
                sharedWith: options.sharedWith,
                assignedTo: MockTaskAssignment.toOther
              },
              {
                title: 'Subtask 4',
                completed: false,
                sharedWith: options.sharedWith,
                assignedTo: MockTaskAssignment.toOther
              }
            ];
          }
          break;
      }

      tasks.push(this.createTask(taskInfo));
    }
    return tasks;
  }

  private createTask(options: AddTaskInfo): DashboardTask {
    const task = DashboardTaskSchema.parse({
      userId: this.userId,
      title: options.title,
      startDate: options.startDate,
      dueDate: options.dueDate,
      completed: options.completed ?? false,
      tags: { [this.userId]: options.tags ?? [] },
      sharedWith: []
    });

    // tags setup
    options.tags?.forEach((tag) => {
      TaskTagsService.addTagForUser(tag);
    });

    // sharedWith setup
    switch (options.sharedWith ? options.sharedWith : MockTaskSharedWith.none) {
      case MockTaskSharedWith.none:
        break;
      case MockTaskSharedWith.withMe:
        task.sharedWith.push(TestUsers.currentUserCto._id);
        task.userId = TestUsers.collaborator1._id;
        break;
      case MockTaskSharedWith.withSinglePerson:
        task.sharedWith.push(TestUsers.collaborator1._id);
        break;
      case MockTaskSharedWith.withMultiplePeople:
        task.sharedWith.push(TestUsers.collaborator1._id, TestUsers.collaborator2._id);
        break;
    }

    // assignedTo setup
    switch (options.assignedTo ? options.assignedTo : MockTaskAssignment.none) {
      case MockTaskAssignment.none:
        break;
      case MockTaskAssignment.toMe:
        task.assignedTo = TestUsers.currentUserCto._id;
        break;
      case MockTaskAssignment.toOther:
        task.assignedTo = TestUsers.collaborator1._id;
        break;
    }

    // description setup
    switch (options.description ? options.description : MockTaskDescription.none) {
      case MockTaskDescription.none:
        break;
      case MockTaskDescription.short:
        task.description = 'This is a short description.';
        break;
      case MockTaskDescription.long:
        task.description =
          'This is a long description. It contains more details about the task, its objectives, and how it should be accomplished.\nThis might include links to resources, expected outcomes, and any other relevant information that can help in the completion of the task.';
        break;
    }

    // subtasks setup
    if (options.subtasks) {
      options.subtasks.forEach((subtaskOptions) => {
        const subtask = this.createTask(subtaskOptions);
        subtask.parentTaskId = task._id;
        taskMapService.addDoc(subtask);
      });
    }

    return task;
  }

  private getRandomDate(days: number, future: boolean): Date {
    const date = new Date();
    const modifier = future ? 1 : -1;
    date.setDate(date.getDate() + modifier * Math.floor(Math.random() * days + 1));
    return date;
  }
}
