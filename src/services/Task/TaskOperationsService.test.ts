import { type DashboardTask, type DocumentMap, DocumentService } from '@aneuhold/core-ts-db-lib';
import { describe, expect, it } from 'vitest';
import { createTestTask } from '../../../testUtils/TaskTestUtils';
import TaskOperationsService from './TaskOperationsService.svelte';

describe('TaskOperationsService', () => {
  describe('getUpdateTaskAndAllChildrenInfo', () => {
    it('should throw error if parent task is not found', () => {
      const taskMap: DocumentMap<DashboardTask> = {};
      const taskId = DocumentService.generateID();

      expect(() => {
        TaskOperationsService.getUpdateTaskAndAllChildrenInfo(taskMap, taskId, (t) => t);
      }).toThrow(`Task with ID ${taskId} not found.`);
    });

    it('should return update info for task and all its children', () => {
      const parentTask = createTestTask({ title: 'Parent' });
      const childTask1 = createTestTask({ title: 'Child 1', parentTaskId: parentTask._id });
      const childTask2 = createTestTask({ title: 'Child 2', parentTaskId: parentTask._id });
      const grandChildTask = createTestTask({ title: 'Grandchild', parentTaskId: childTask1._id });
      const unrelatedTask = createTestTask({ title: 'Unrelated' });

      const taskMap: DocumentMap<DashboardTask> = {
        [parentTask._id]: parentTask,
        [childTask1._id]: childTask1,
        [childTask2._id]: childTask2,
        [grandChildTask._id]: grandChildTask,
        [unrelatedTask._id]: unrelatedTask
      };

      const mutator = (task: DashboardTask) => {
        task.completed = true;
        return task;
      };

      const result = TaskOperationsService.getUpdateTaskAndAllChildrenInfo(
        taskMap,
        parentTask._id,
        mutator
      );

      expect(result.newDocs).toEqual([]);

      // Check filter
      expect(result.filter(parentTask)).toBe(true);
      expect(result.filter(childTask1)).toBe(true);
      expect(result.filter(childTask2)).toBe(true);
      expect(result.filter(grandChildTask)).toBe(true);
      expect(result.filter(unrelatedTask)).toBe(false);

      // Check mutator
      const updatedTask = result.mutator(createTestTask());
      expect(updatedTask.completed).toBe(true);
    });
  });

  describe('getDuplicateTaskUpdateInfo', () => {
    it('should throw error if task to duplicate is not found', () => {
      const taskMap: DocumentMap<DashboardTask> = {};
      const taskId = DocumentService.generateID();

      expect(() => {
        TaskOperationsService.getDuplicateTaskUpdateInfo(taskMap, taskId, (t) => t);
      }).toThrow(`Task with ID ${taskId} not found while trying to duplicate.`);
    });

    it('should duplicate task and its children with remapped parent IDs', () => {
      const parentTask = createTestTask({ title: 'Parent' });
      const childTask = createTestTask({ title: 'Child', parentTaskId: parentTask._id });
      const grandChildTask = createTestTask({ title: 'Grandchild', parentTaskId: childTask._id });

      const taskMap: DocumentMap<DashboardTask> = {
        [parentTask._id]: parentTask,
        [childTask._id]: childTask,
        [grandChildTask._id]: grandChildTask
      };

      const newTaskMutator = (task: DashboardTask) => {
        task.title = `Copy of ${task.title}`;
        return task;
      };

      const result = TaskOperationsService.getDuplicateTaskUpdateInfo(
        taskMap,
        parentTask._id,
        newTaskMutator
      );

      expect(result.newDocs).toHaveLength(3);

      const newParent = result.newDocs.find((t) => t.title === 'Copy of Parent');
      const newChild = result.newDocs.find((t) => t.title === 'Copy of Child');
      const newGrandChild = result.newDocs.find((t) => t.title === 'Copy of Grandchild');

      expect(newParent).toBeDefined();
      expect(newChild).toBeDefined();
      expect(newGrandChild).toBeDefined();

      if (newParent && newChild && newGrandChild) {
        expect(newParent._id).not.toBe(parentTask._id);
        expect(newChild._id).not.toBe(childTask._id);
        expect(newGrandChild._id).not.toBe(grandChildTask._id);

        expect(newChild.parentTaskId).toBe(newParent._id);
        expect(newGrandChild.parentTaskId).toBe(newChild._id);
      }
    });

    it('should apply originalTaskMutator if provided', () => {
      const parentTask = createTestTask({ title: 'Parent' });
      const taskMap: DocumentMap<DashboardTask> = {
        [parentTask._id]: parentTask
      };

      const newTaskMutator = (t: DashboardTask) => t;
      const originalTaskMutator = (t: DashboardTask) => {
        t.completed = true;
        return t;
      };

      const result = TaskOperationsService.getDuplicateTaskUpdateInfo(
        taskMap,
        parentTask._id,
        newTaskMutator,
        originalTaskMutator
      );

      expect(result.filter(parentTask)).toBe(true);
      const updatedOriginal = result.mutator(createTestTask());
      expect(updatedOriginal.completed).toBe(true);
    });
  });

  describe('getAllTasks', () => {
    it('should return all defined tasks from the map', () => {
      const task1 = createTestTask();
      const task2 = createTestTask();
      const randomId = DocumentService.generateID();
      const taskMap: DocumentMap<DashboardTask> = {
        [task1._id]: task1,
        [task2._id]: task2,
        [randomId]: undefined
      };

      const result = TaskOperationsService.getAllTasks(taskMap);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(task1);
      expect(result).toContainEqual(task2);
    });
  });
});
