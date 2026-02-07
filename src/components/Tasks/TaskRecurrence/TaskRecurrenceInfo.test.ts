import '@testing-library/jest-dom/vitest';
import {
  RecurrenceBasis,
  RecurrenceEffect,
  RecurrenceFrequencyType
} from '@aneuhold/core-ts-db-lib';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { UUID } from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import taskMapService from '$services/Task/TaskMapService/TaskMapService';
import TaskMapServiceMock from '$services/Task/TaskMapService/TaskMapService.mock';
import TestUsers from '$testUtils/TestUsers';
import TaskRecurrenceInfo from './TaskRecurrenceInfo.svelte';

// Mock child components if needed
vi.mock('$components/presentational/SmartDialog.svelte', () => ({ default: () => {} }));

describe('TaskRecurrenceInfo', () => {
  const userId = TestUsers.currentUserCto._id;
  const mockService = new TaskMapServiceMock(userId);

  let taskId: UUID;

  beforeEach(() => {
    // Use the mock service to create a task
    const task = mockService.addTask({
      title: 'Test Task',
      startDate: new Date(),
      dueDate: new Date()
    });
    taskId = task._id;

    vi.clearAllMocks();
  });

  it('shouldnt set recurrenceInfo just by rendering', () => {
    const task = taskMapService.mapState[taskId];
    if (!task) {
      throw new Error('task is undefined');
    }
    render(TaskRecurrenceInfo, {
      task,
      childTaskIds: []
    });

    // Just rendering doesn't cause the recurrence info to be set
    const taskAfterRender = taskMapService.mapState[taskId];
    expect(taskAfterRender?.recurrenceInfo).toBeUndefined();
  });

  it('checkbox is checked when task has recurrence info', () => {
    // Update the task with recurrence info
    taskMapService.updateDoc(taskId, (t) => {
      t.recurrenceInfo = {
        frequency: {
          type: RecurrenceFrequencyType.everyXTimeUnit,
          everyXTimeUnit: { x: 1, timeUnit: 'week' }
        },
        recurrenceBasis: RecurrenceBasis.startDate,
        recurrenceEffect: RecurrenceEffect.rollOnBasis
      };
      return t;
    });

    const task = taskMapService.mapState[taskId];
    if (!task) {
      throw new Error('task is undefined');
    }
    render(TaskRecurrenceInfo, {
      task,
      childTaskIds: []
    });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('can check and then uncheck the recurrence checkbox', async () => {
    const user = userEvent.setup();
    const task = taskMapService.mapState[taskId];
    if (!task) {
      throw new Error('task is undefined');
    }
    render(TaskRecurrenceInfo, {
      task,
      childTaskIds: []
    });

    const checkbox = screen.getByRole('checkbox');

    // Initially unchecked
    expect(checkbox).not.toBeChecked();
    expect(taskMapService.mapState[taskId]?.recurrenceInfo).toBeUndefined();

    // Click to check
    await user.click(checkbox);

    // Should be checked
    expect(checkbox).toBeChecked();
    expect(taskMapService.mapState[taskId]?.recurrenceInfo).toBeDefined();

    // Click again to uncheck
    await user.click(checkbox);

    // Should be unchecked again
    expect(checkbox).not.toBeChecked();
    expect(taskMapService.mapState[taskId]?.recurrenceInfo).toBeNull();
  });

  it('clicking the checkbox wrapper also properly toggles recurrence', async () => {
    const user = userEvent.setup();
    const task = taskMapService.mapState[taskId];
    if (!task) {
      throw new Error('task is undefined');
    }
    render(TaskRecurrenceInfo, {
      task,
      childTaskIds: []
    });

    const checkbox = screen.getByRole('checkbox');
    // The wrapper div is the parent of the checkbox
    const wrapperDiv = checkbox.parentElement?.parentElement;
    if (!wrapperDiv) {
      throw new Error('Could not find wrapper div');
    }

    // Initially unchecked
    expect(checkbox).not.toBeChecked();
    expect(taskMapService.mapState[taskId]?.recurrenceInfo).toBeUndefined();

    // Click the wrapper div to check
    await user.click(wrapperDiv);

    // Should be checked
    expect(checkbox).toBeChecked();
    expect(taskMapService.mapState[taskId]?.recurrenceInfo).toBeDefined();

    // Click the wrapper div again to uncheck
    await user.click(wrapperDiv);

    // Should be unchecked again
    expect(checkbox).not.toBeChecked();
    expect(taskMapService.mapState[taskId]?.recurrenceInfo).toBeNull();
  });
});
