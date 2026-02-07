import {
  DocumentService,
  RecurrenceEffect,
  RecurrenceFrequencyType
} from '@aneuhold/core-ts-db-lib';
import { DateService } from '@aneuhold/core-ts-lib';
import { describe, expect, it } from 'vitest';
import { createTestRecurrenceInfo, createTestTask } from '../../../testUtils/TaskTestUtils';
import TaskRecurrenceService from './TaskRecurrenceService.svelte';

describe('TaskRecurrenceService.svelte', () => {
  describe('taskShouldRecur', () => {
    it('should return false if task has no recurrence info', () => {
      const task = createTestTask();
      expect(TaskRecurrenceService.taskShouldRecur(task)).toBe(false);
    });

    it('should return false if task is a child of a recurring task', () => {
      const task = createTestTask({
        recurrenceInfo: createTestRecurrenceInfo(),
        parentRecurringTaskInfo: {
          taskId: DocumentService.generateID()
        }
      });
      expect(TaskRecurrenceService.taskShouldRecur(task)).toBe(false);
    });

    it('should return false if rollOnCompletion and task is not completed', () => {
      const task = createTestTask({
        recurrenceInfo: createTestRecurrenceInfo({
          recurrenceEffect: RecurrenceEffect.rollOnCompletion
        }),
        completed: false
      });
      expect(TaskRecurrenceService.taskShouldRecur(task)).toBe(false);
    });

    it('should return true if rollOnCompletion and task is completed', () => {
      const task = createTestTask({
        recurrenceInfo: createTestRecurrenceInfo({
          recurrenceEffect: RecurrenceEffect.rollOnCompletion
        }),
        completed: true
      });
      expect(TaskRecurrenceService.taskShouldRecur(task)).toBe(true);
    });

    it('should return true if fixed recurrence and due date has passed', () => {
      const pastDate = DateService.addDays(new Date(), -1);
      const task = createTestTask({
        recurrenceInfo: createTestRecurrenceInfo({
          recurrenceEffect: RecurrenceEffect.rollOnBasis
        }),
        dueDate: pastDate
      });
      expect(TaskRecurrenceService.taskShouldRecur(task)).toBe(true);
    });

    it('should return false if fixed recurrence and due date has not passed', () => {
      const futureDate = DateService.addDays(new Date(), 1);
      const task = createTestTask({
        recurrenceInfo: createTestRecurrenceInfo({
          recurrenceEffect: RecurrenceEffect.rollOnBasis
        }),
        dueDate: futureDate
      });
      expect(TaskRecurrenceService.taskShouldRecur(task)).toBe(false);
    });
  });

  describe('getNextRecurrenceDate', () => {
    it('should calculate next daily recurrence', () => {
      const today = new Date();
      const task = createTestTask({
        recurrenceInfo: createTestRecurrenceInfo({
          frequency: {
            type: RecurrenceFrequencyType.everyXTimeUnit,
            everyXTimeUnit: { timeUnit: 'day', x: 1 }
          }
        }),
        dueDate: today
      });

      const nextDate = TaskRecurrenceService.getNextRecurrenceDate(task);
      // getNextRecurrenceDate returns the trigger date (due date) for dueDate basis
      const expectedDate = today;

      expect(nextDate).toBeDefined();
      if (nextDate) {
        expect(nextDate.toISOString()).toBe(expectedDate.toISOString());
      }
    });

    it('should calculate next weekly recurrence', () => {
      const today = new Date();
      const task = createTestTask({
        recurrenceInfo: createTestRecurrenceInfo({
          frequency: {
            type: RecurrenceFrequencyType.everyXTimeUnit,
            everyXTimeUnit: { timeUnit: 'week', x: 1 }
          }
        }),
        dueDate: today
      });

      const nextDate = TaskRecurrenceService.getNextRecurrenceDate(task);
      // getNextRecurrenceDate returns the trigger date (due date) for dueDate basis
      const expectedDate = today;

      expect(nextDate).toBeDefined();
      if (nextDate) {
        expect(nextDate.toISOString()).toBe(expectedDate.toISOString());
      }
    });
  });

  describe('updateDatesForRecurrence', () => {
    it('should update start and due dates based on recurrence', () => {
      const today = new Date();
      const task = createTestTask({
        recurrenceInfo: createTestRecurrenceInfo({
          frequency: {
            type: RecurrenceFrequencyType.everyXTimeUnit,
            everyXTimeUnit: { timeUnit: 'day', x: 1 }
          }
        }),
        startDate: today,
        dueDate: today
      });

      TaskRecurrenceService.updateDatesForRecurrence(task);

      const expectedDate = DateService.addDays(today, 1);
      expect(task.startDate).toBeDefined();
      expect(task.dueDate).toBeDefined();

      if (task.startDate && task.dueDate) {
        expect(task.startDate.toISOString()).toBe(expectedDate.toISOString());
        expect(task.dueDate.toISOString()).toBe(expectedDate.toISOString());
      }
    });
  });
});
