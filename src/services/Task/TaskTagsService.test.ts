import { get, type Updater, type Writable, writable } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type UserConfig, userConfig } from '$stores/local/userConfig/userConfig';
import { createTestUserConfig } from '../../../testUtils/TaskTestUtils';
import TaskTagsService from './TaskTagsService';

describe('TaskTagsService', () => {
  let mockUserConfigStore: Writable<UserConfig> & { get: () => UserConfig };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock userConfig store
    const initialConfig = createTestUserConfig();
    const { subscribe, set, update } = writable(initialConfig);
    mockUserConfigStore = {
      subscribe,
      set,
      update: vi.fn((updater: Updater<UserConfig>) => {
        update(updater);
      }),
      get: () => get({ subscribe })
    };

    // We need to mock the module export
    vi.spyOn(userConfig, 'subscribe').mockImplementation(mockUserConfigStore.subscribe);
    vi.spyOn(userConfig, 'update').mockImplementation(mockUserConfigStore.update);
    vi.spyOn(userConfig, 'get').mockImplementation(mockUserConfigStore.get);
  });

  describe('getStore', () => {
    it('should return a store that updates when userConfig changes', () => {
      const store = TaskTagsService.getStore();

      // Initial state
      expect(get(store)).toEqual([]);

      // Update user config
      mockUserConfigStore.update((current) => {
        current.config.tagSettings = { tag1: { priority: 1 } };
        return current;
      });

      expect(get(store)).toEqual(['tag1']);
    });
  });

  describe('addTagForUser', () => {
    it('should add tag to user config', () => {
      TaskTagsService.addTagForUser('newTag');

      expect(mockUserConfigStore.update).toHaveBeenCalled();
      const config = mockUserConfigStore.get();
      expect(config.config.tagSettings['newTag']).toBeDefined();
      expect(config.config.tagSettings['newTag']?.priority).toBe(0);
    });

    it('should not overwrite existing tag', () => {
      mockUserConfigStore.update((c) => {
        c.config.tagSettings['existing'] = { priority: 5 };
        return c;
      });

      TaskTagsService.addTagForUser('existing');

      const config = mockUserConfigStore.get();
      expect(config.config.tagSettings['existing']?.priority).toBe(5);
    });
  });

  describe('deleteTag', () => {
    it('should remove tag from user config', () => {
      mockUserConfigStore.update((c) => {
        c.config.tagSettings['tagToDelete'] = { priority: 1 };
        return c;
      });

      TaskTagsService.deleteTag('tagToDelete');

      const config = mockUserConfigStore.get();
      expect(config.config.tagSettings['tagToDelete']).toBeUndefined();
    });
  });
});
