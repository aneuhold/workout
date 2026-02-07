import {
  type DashboardTask,
  DashboardTaskSchema,
  type DashboardUserConfig,
  DashboardUserConfigSchema,
  RecurrenceBasis,
  RecurrenceEffect,
  RecurrenceFrequencyType,
  type RecurrenceInfo,
  RecurrenceInfoSchema
} from '@aneuhold/core-ts-db-lib';
import TestUsers from './TestUsers';

export const createTestTask = (overrides: Partial<DashboardTask> = {}): DashboardTask => {
  return DashboardTaskSchema.parse({
    userId: TestUsers.currentUserCto._id,
    title: 'Test Task',
    tags: { [TestUsers.currentUserCto._id]: [] },
    ...overrides
  });
};

export const createTestUserConfig = (overrides: Partial<DashboardUserConfig> = {}) => {
  return {
    config: DashboardUserConfigSchema.parse({
      userId: TestUsers.currentUserCto._id,
      tagSettings: {},
      autoTaskDeletionDays: 30,
      email: 'test@test.com',
      ...overrides
    }),
    collaborators: {}
  };
};

export const createTestRecurrenceInfo = (
  overrides: Partial<RecurrenceInfo> = {}
): RecurrenceInfo => {
  return RecurrenceInfoSchema.parse({
    frequency: {
      type: RecurrenceFrequencyType.everyXTimeUnit,
      everyXTimeUnit: {
        timeUnit: 'day',
        x: 1
      }
    },
    recurrenceBasis: RecurrenceBasis.dueDate,
    recurrenceEffect: RecurrenceEffect.rollOnBasis,
    ...overrides
  });
};
