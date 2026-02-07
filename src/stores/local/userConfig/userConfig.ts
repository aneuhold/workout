import {
  type DashboardUserConfig,
  DashboardUserConfigSchema,
  DocumentService,
  type UserCTO
} from '@aneuhold/core-ts-db-lib';
import { type Updater, writable } from 'svelte/store';
import { browser } from '$app/environment';
import DashboardAPIService from '$util/api/DashboardAPIService';
import LocalData from '$util/LocalData/LocalData';
import { createLogger } from '$util/logging/logger';

const log = createLogger('userConfig.ts');

export type UserConfig = {
  config: DashboardUserConfig;
  collaborators: Record<string, UserCTO>;
};

function createUserConfigStore() {
  let currentConfig: UserConfig = {
    // Just a dummy config to avoid null checks.
    config: DashboardUserConfigSchema.parse({ userId: DocumentService.generateID() }),
    collaborators: {}
  };
  const { subscribe, set } = writable<UserConfig>(currentConfig);

  const localDataUserConfig = browser ? LocalData.userConfig : null;
  if (localDataUserConfig) {
    currentConfig = localDataUserConfig;
    set(currentConfig);
  }

  const updateUserConfig = (updater: Updater<UserConfig>) => {
    currentConfig = updater(currentConfig);
    set(currentConfig);
    LocalData.userConfig = currentConfig;
  };

  const updateUserConfigAndSave = (updater: Updater<UserConfig>) => {
    updateUserConfig(updater);
    DashboardAPIService.updateSettings(currentConfig.config);
  };

  return {
    subscribe,
    set: (newConfig: UserConfig) => {
      updateUserConfigAndSave(() => newConfig);
    },
    update: (updater: Updater<UserConfig>) => {
      updateUserConfigAndSave(updater);
    },
    addCollaborator: (user: UserCTO) => {
      updateUserConfigAndSave((config) => {
        config.config.collaborators.push(user._id);
        config.collaborators[user._id] = user;
        return config;
      });
    },
    removeCollaborator: (userName: string) => {
      updateUserConfigAndSave((config) => {
        const collaboratorId = Object.values(config.collaborators).find(
          (userCto) => userCto.userName === userName
        )?._id;
        if (!collaboratorId) {
          log.error(`Could not find collaborator with username ${userName}`);
          return config;
        }
        config.config.collaborators = config.config.collaborators.filter(
          (id) => id !== collaboratorId
        );
        delete config.collaborators[collaboratorId];
        return config;
      });
    },
    /**
     * Sets the user config without updating the backend.
     *
     * @param newConfig New user config to set locally.
     */
    setWithoutPropagation: (newConfig: UserConfig) => {
      updateUserConfig(() => newConfig);
    },
    /**
     * Simply gets the current config.
     */
    get: () => currentConfig
  };
}

export const userConfig = createUserConfigStore();
