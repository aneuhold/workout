import type { DashboardTagSettings } from '@aneuhold/core-ts-db-lib';
import { ArrayService } from '@aneuhold/core-ts-lib';
import type { UUID } from 'crypto';
import { type Unsubscriber, type Writable, writable } from 'svelte/store';
import taskMapService from '$services/Task/TaskMapService/TaskMapService';
import { userConfig } from '$stores/local/userConfig/userConfig';

/**
 * A service responsible for managing tags for tasks.
 */
export default class TaskTagsService {
  private static taskTagsStore: Writable<string[]> | undefined;
  private static currentTagSettings: DashboardTagSettings = {};
  private static userId: UUID | undefined;
  private static userConfigUnsub: undefined | Unsubscriber = undefined;
  /**
   * This should always be a fresh array, so that it doesn't bind to the
   * current user settings.
   */
  private static previousUserTagsArray: string[] = [];

  /**
   * Gets the store of all tags used by the current user on tasks.
   */
  static getStore(): Writable<string[]> {
    if (!this.taskTagsStore) {
      this.taskTagsStore = this.createStore();
    }
    return this.taskTagsStore;
  }

  /**
   * Deletes a tag from the current user's settings and all tasks.
   *
   * @param tag The tag name to delete.
   */
  static deleteTag(tag: string) {
    // Setup user settings subscribers if needed.
    if (!this.taskTagsStore) {
      this.taskTagsStore = this.createStore();
    }
    // Updating user settings will automatically remove the tag from all
    // tasks.
    userConfig.update((settings) => {
      if (!settings.config.tagSettings[tag]) return settings;
      const tagSettings = settings.config.tagSettings[tag];
      if (tagSettings.priority > 0) {
        Object.keys(settings.config.tagSettings).forEach((otherTagName) => {
          // Decrement all the existing non-zero tags priority by 1 that are
          // higher than the current tag
          const otherTagSettings = settings.config.tagSettings[otherTagName];
          if (!otherTagSettings) return;
          if (otherTagSettings.priority > tagSettings.priority) {
            otherTagSettings.priority -= 1;
          }
        });
      }
      delete settings.config.tagSettings[tag];
      return settings;
    });
  }

  /**
   * Updates a tag from the current user's settings and all tasks.
   *
   * @param oldTag The existing tag name to update.
   * @param newTag The new tag name to replace the existing one.
   */
  static updateTag(oldTag: string, newTag: string) {
    // Setup user settings subscribers if needed.
    if (!this.taskTagsStore) {
      this.taskTagsStore = this.createStore();
    }
    userConfig.update((settings) => {
      settings.config.tagSettings[newTag] = settings.config.tagSettings[oldTag];
      delete settings.config.tagSettings[oldTag];
      return settings;
    });
    this.updateTagInAllTasks(oldTag, newTag);
  }

  static addTagForUser(tag: string) {
    const currentTagSettings = userConfig.get().config.tagSettings;
    if (!currentTagSettings[tag]) {
      userConfig.update((settings) => {
        settings.config.tagSettings[tag] = {
          priority: 0
        };
        return settings;
      });
    }
  }

  static addTagForUserIfNeeded(tag: string) {
    if (!TaskTagsService.userId) {
      return;
    }
    if (!this.currentTagSettings[tag]) {
      this.currentTagSettings[tag] = {
        priority: 0
      };
      // This will trigger the tag store to update as well.
      userConfig.update((settings) => {
        settings.config.tagSettings = this.currentTagSettings;
        return settings;
      });
    }
  }

  /**
   * Creates the task tag store, which also subscribes to the user settings.
   */
  private static createStore(): Writable<string[]> {
    const taskTagsStore = writable<string[]>([]);

    const updateTaskTags = (newTagSettings: DashboardTagSettings) => {
      const newUserTagsArray = Object.keys(newTagSettings);
      taskTagsStore.set(newUserTagsArray);
      this.previousUserTagsArray = newUserTagsArray;
      this.currentTagSettings = newTagSettings;
    };

    if (!this.userConfigUnsub) {
      this.userConfigUnsub = userConfig.subscribe((newSettings) => {
        if (newSettings.config.userId !== this.userId) {
          this.userId = newSettings.config.userId;
          updateTaskTags(newSettings.config.tagSettings);
          // Return early if the user ID changed.
          return;
        }
        const newTagSettings = newSettings.config.tagSettings;
        const newUserTagsArray = Object.keys(newTagSettings);
        if (newUserTagsArray.length !== this.previousUserTagsArray.length) {
          const removedTags = this.getRemovedTags(this.previousUserTagsArray, newUserTagsArray);
          if (removedTags.length > 0) {
            this.removeTagFromAllTasks(removedTags[0]);
          }
          updateTaskTags(newTagSettings);
        } else if (
          !ArrayService.arraysHaveSamePrimitiveValues(this.previousUserTagsArray, newUserTagsArray)
        ) {
          updateTaskTags(newTagSettings);
        } else {
          // Always update the current tag settings, just in case a priority
          // changed.
          this.currentTagSettings = newTagSettings;
        }
      });
    }
    return taskTagsStore;
  }

  private static getRemovedTags(oldTags: string[], newTags: string[]): string[] {
    return oldTags.filter((tag) => !newTags.includes(tag));
  }

  /**
   * Removes the provided tag from all tasks for the current user. This should
   * only be triggered from the global tag manager.
   *
   * @param tag The tag name to remove from all tasks for the current user.
   */
  private static removeTagFromAllTasks(tag: string) {
    const userId = this.userId;
    if (!userId) {
      return;
    }
    taskMapService.updateManyDocs(
      (task) => {
        const userTags = task.tags[userId];
        if (userTags && userTags.includes(tag)) {
          return true;
        }
        return false;
      },
      (task) => {
        const userTags = task.tags[userId];
        if (userTags) {
          task.tags[userId] = userTags.filter((t) => t !== tag);
        }
        return task;
      }
    );
  }

  /**
   * Updates the provided tag in all tasks for the current user. This should
   * only be triggered from the global tag manager.
   *
   * @param oldTag The original tag name to update in tasks.
   * @param newTag The new tag name to replace the original in tasks.
   */
  private static updateTagInAllTasks(oldTag: string, newTag: string) {
    const userId = this.userId;
    if (!userId) {
      return;
    }
    taskMapService.updateManyDocs(
      (task) => {
        const userTags = task.tags[userId];
        if (userTags && userTags.includes(oldTag)) {
          return true;
        }
        return false;
      },
      (task) => {
        const userTags = task.tags[userId];
        if (userTags) {
          task.tags[userId] = userTags.map((t) => (t === oldTag ? newTag : t));
        }
        return task;
      }
    );
  }
}
