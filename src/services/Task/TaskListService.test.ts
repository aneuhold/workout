import {
  DashboardTaskListFilterSettingsSchema,
  DashboardTaskListSortSettingsSchema,
  type DashboardTaskMap,
  DashboardTaskSchema,
  DashboardTaskService,
  DashboardUserConfigSchema,
  DocumentService
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import type { UserConfig } from '$stores/local/userConfig/userConfig';
import TestUsers from '$testUtils/TestUsers';
import TaskListService from './TaskListService';

describe('TaskListService', () => {
  const userId = TestUsers.currentUserCto._id;
  const category = 'test-category';

  let mockTaskMap: DashboardTaskMap;
  let mockUserConfig: UserConfig;
  let getFilteredAndSortedTaskIdsSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();

    getFilteredAndSortedTaskIdsSpy = vi.spyOn(DashboardTaskService, 'getFilteredAndSortedTaskIds');

    mockTaskMap = {};

    mockUserConfig = {
      config: DashboardUserConfigSchema.parse({ userId }),
      collaborators: {}
    };
  });

  describe('getTaskIds', () => {
    it('should use default settings if none exist in userConfig', () => {
      TaskListService.getTaskIds(mockTaskMap, mockUserConfig, category);

      const expectedFilterSettings = DashboardTaskListFilterSettingsSchema.parse({ userId });
      const expectedSortSettings = DashboardTaskListSortSettingsSchema.parse({ userId });

      expect(getFilteredAndSortedTaskIdsSpy).toHaveBeenCalledWith(
        mockTaskMap,
        category,
        expectedFilterSettings,
        expectedSortSettings,
        mockUserConfig.config.tagSettings
      );
    });

    it('should use userConfig settings if they exist', () => {
      const filterSettings = DashboardTaskListFilterSettingsSchema.parse({ userId });
      const sortSettings = DashboardTaskListSortSettingsSchema.parse({ userId });

      mockUserConfig.config.taskListFilterSettings[category] = filterSettings;
      mockUserConfig.config.taskListSortSettings[category] = sortSettings;

      TaskListService.getTaskIds(mockTaskMap, mockUserConfig, category);

      expect(getFilteredAndSortedTaskIdsSpy).toHaveBeenCalledWith(
        mockTaskMap,
        category,
        filterSettings,
        sortSettings,
        mockUserConfig.config.tagSettings
      );
    });
  });

  describe('getTaskIdsForTask', () => {
    it('should return empty result if task is undefined', () => {
      const result = TaskListService.getTaskIdsForTask(mockTaskMap, mockUserConfig, [], undefined);

      expect(result).toEqual({
        filteredAndSortedIds: [],
        removedIds: []
      });
      expect(getFilteredAndSortedTaskIdsSpy).not.toHaveBeenCalled();
    });

    it('should use task specific settings if they exist', () => {
      const filterSettings = DashboardTaskListFilterSettingsSchema.parse({ userId });
      const sortSettings = DashboardTaskListSortSettingsSchema.parse({ userId });

      const taskId = DocumentService.generateID();
      const mockTask = DashboardTaskSchema.parse({
        _id: taskId,
        userId: userId,
        title: 'Test Task',
        category: category,
        createdBy: userId,
        startDate: new Date(),
        dueDate: new Date()
      });

      mockTask.filterSettings = { [userId]: filterSettings };
      mockTask.sortSettings = { [userId]: sortSettings };

      const allChildrenIds: UUID[] = [DocumentService.generateID(), DocumentService.generateID()];

      TaskListService.getTaskIdsForTask(mockTaskMap, mockUserConfig, allChildrenIds, mockTask);

      expect(getFilteredAndSortedTaskIdsSpy).toHaveBeenCalledWith(
        mockTaskMap,
        category,
        filterSettings,
        sortSettings,
        mockUserConfig.config.tagSettings,
        {
          taskId: mockTask._id,
          allChildrenIds: allChildrenIds
        }
      );
    });

    it('should fallback to userConfig settings if task settings do not exist', () => {
      const filterSettings = DashboardTaskListFilterSettingsSchema.parse({ userId });
      const sortSettings = DashboardTaskListSortSettingsSchema.parse({ userId });

      mockUserConfig.config.taskListFilterSettings[category] = filterSettings;
      mockUserConfig.config.taskListSortSettings[category] = sortSettings;

      const taskId = DocumentService.generateID();
      const mockTask = DashboardTaskSchema.parse({
        _id: taskId,
        userId: userId,
        title: 'Test Task',
        category: category,
        createdBy: userId,
        startDate: new Date(),
        dueDate: new Date()
      });

      const allChildrenIds: UUID[] = [DocumentService.generateID()];

      TaskListService.getTaskIdsForTask(mockTaskMap, mockUserConfig, allChildrenIds, mockTask);

      expect(getFilteredAndSortedTaskIdsSpy).toHaveBeenCalledWith(
        mockTaskMap,
        category,
        filterSettings,
        sortSettings,
        mockUserConfig.config.tagSettings,
        {
          taskId: mockTask._id,
          allChildrenIds: allChildrenIds
        }
      );
    });

    it('should fallback to default settings if neither task nor userConfig settings exist', () => {
      const taskId = DocumentService.generateID();
      const mockTask = DashboardTaskSchema.parse({
        _id: taskId,
        userId: userId,
        title: 'Test Task',
        category: category,
        createdBy: userId,
        startDate: new Date(),
        dueDate: new Date()
      });

      const allChildrenIds: UUID[] = [];

      TaskListService.getTaskIdsForTask(mockTaskMap, mockUserConfig, allChildrenIds, mockTask);

      const expectedFilterSettings = DashboardTaskListFilterSettingsSchema.parse({ userId });
      const expectedSortSettings = DashboardTaskListSortSettingsSchema.parse({ userId });

      expect(getFilteredAndSortedTaskIdsSpy).toHaveBeenCalledWith(
        mockTaskMap,
        category,
        expectedFilterSettings,
        expectedSortSettings,
        mockUserConfig.config.tagSettings,
        {
          taskId: mockTask._id,
          allChildrenIds: allChildrenIds
        }
      );
    });
  });
});
