import '@testing-library/jest-dom/vitest';
import {
  RecurrenceBasis,
  RecurrenceEffect,
  RecurrenceFrequencyType,
  type RecurrenceInfo
} from '@aneuhold/core-ts-db-lib';
import { DocumentService } from '@aneuhold/core-ts-db-lib';
import { fireEvent, render, screen } from '@testing-library/svelte';
import type { UUID } from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmationDialog } from '$components/singletons/dialogs/SingletonConfirmationDialog/SingletonConfirmationDialog.svelte';
import taskMapService from '$services/Task/TaskMapService/TaskMapService';
import TaskMapServiceMock from '$services/Task/TaskMapService/TaskMapService.mock';
import TaskRecurrenceService from '$services/Task/TaskRecurrenceService.svelte';
import TestUsers from '$testUtils/TestUsers';
import TaskRecurrenceDetails from './TaskRecurrenceDetails.svelte';

describe('TaskRecurrenceDetails', () => {
  const userId = TestUsers.currentUserCto._id;
  const mockService = new TaskMapServiceMock(userId);

  const defaultRecurrenceInfo: RecurrenceInfo = {
    frequency: {
      type: RecurrenceFrequencyType.everyXTimeUnit,
      everyXTimeUnit: { x: 1, timeUnit: 'week' }
    },
    recurrenceBasis: RecurrenceBasis.dueDate,
    recurrenceEffect: RecurrenceEffect.rollOnBasis
  };

  let taskId: UUID;

  beforeEach(() => {
    // Use the mock service to create a task
    const task = mockService.addTask({
      title: 'Test Task',
      startDate: new Date(),
      dueDate: new Date()
    });
    taskId = task._id;

    // Update the task with recurrence info
    taskMapService.updateDoc(taskId, (t) => {
      t.recurrenceInfo = { ...defaultRecurrenceInfo };
      return t;
    });
  });

  it("doesn't set recurrenceInfo just by rendering", () => {
    // Create a fresh task that DOES NOT have recurrence info set
    const freshTask = mockService.addTask({
      title: 'Fresh Task',
      startDate: new Date(),
      dueDate: new Date()
    });

    const freshTaskState = taskMapService.mapState[freshTask._id];
    // ensure store has no recurrence before render
    expect(freshTaskState?.recurrenceInfo).toBeUndefined();

    if (!freshTaskState) {
      throw new Error('freshTaskState is undefined');
    }
    render(TaskRecurrenceDetails, {
      task: freshTaskState,
      defaultRecurrenceInfo
    });

    // After rendering the details component for a task that had no recurrence
    // info, we should still have no recurrenceInfo set.
    expect(freshTaskState.recurrenceInfo).toBeUndefined();
  });

  it('renders correctly with initial recurrence info', () => {
    const task = taskMapService.mapState[taskId];
    if (!task) {
      throw new Error('task is undefined');
    }
    render(TaskRecurrenceDetails, {
      task,
      defaultRecurrenceInfo
    });

    expect(screen.getAllByText('Frequency')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Basis')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Effect')[0]).toBeInTheDocument();
    expect(screen.getByText('Recurring every')).toBeInTheDocument();
  });

  it('disables controls when task has parentRecurringTaskInfo', () => {
    taskMapService.updateDoc(taskId, (t) => {
      t.parentRecurringTaskInfo = {
        taskId: DocumentService.generateID(),
        startDate: new Date(),
        dueDate: new Date()
      };
      return t;
    });

    const task = taskMapService.mapState[taskId];
    if (!task) {
      throw new Error('task is undefined');
    }
    const { container } = render(TaskRecurrenceDetails, {
      task,
      defaultRecurrenceInfo
    });

    // Check if the main container has the dimmed-color class
    expect(container.firstChild).toHaveClass('dimmed-color');
  });

  it('triggers confirmation dialog when update would cause immediate recurrence', async () => {
    // Mock getSimulatedRecurrenceDate to return a past date
    const spy = vi
      .spyOn(TaskRecurrenceService, 'getSimulatedRecurrenceDate')
      .mockReturnValue(new Date(Date.now() - 10000));

    const confirmationDialogSpy = vi.spyOn(confirmationDialog, 'open');

    const task = taskMapService.mapState[taskId];
    if (!task) {
      throw new Error('task is undefined');
    }
    const { container } = render(TaskRecurrenceDetails, {
      task,
      defaultRecurrenceInfo
    });

    // We need to trigger a change.
    // The component uses SMUI Select. Changing it in test is tricky.
    // It also uses InputBox for "Recurring every X".
    // Let's try to change the "Recurring every" input.

    const input = container.querySelector('input[type="number"]');
    expect(input).toBeInTheDocument();

    if (input) {
      await fireEvent.input(input, { target: { value: '2' } });
      await fireEvent.blur(input); // InputBox updates on blur usually
    }

    // Wait for any effects
    // The component calls rInfo.set -> setRInfo -> updateWouldTriggerRecurrence

    expect(confirmationDialogSpy).toHaveBeenCalled();

    confirmationDialogSpy.mockRestore();
    spy.mockRestore();
  });
});
