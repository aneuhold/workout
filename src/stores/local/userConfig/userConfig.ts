import {
  type DashboardUserConfig,
  DashboardUserConfigSchema,
  DocumentService
} from '@aneuhold/core-ts-db-lib';
import { type Updater, writable } from 'svelte/store';
import { browser } from '$app/environment';
import LocalData from '$util/LocalData/LocalData';

export type UserConfig = {
  config: DashboardUserConfig;
};

function createUserConfigStore() {
  let currentConfig: UserConfig = {
    // Just a dummy config to avoid null checks.
    config: DashboardUserConfigSchema.parse({ userId: DocumentService.generateID() })
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

  // TODO: Re-implement API persistence when workout user config is needed
  // const updateUserConfigAndSave = (updater: Updater<UserConfig>) => {
  //   updateUserConfig(updater);
  //   WorkoutAPIService.updateSettings(currentConfig.config);
  // };

  return {
    subscribe,
    set: (newConfig: UserConfig) => {
      updateUserConfig(() => newConfig);
    },
    update: (updater: Updater<UserConfig>) => {
      updateUserConfig(updater);
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
