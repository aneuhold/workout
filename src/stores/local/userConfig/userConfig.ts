import type { UUID } from 'crypto';
import { type Updater, writable } from 'svelte/store';
import { browser } from '$app/environment';
import LocalData from '$util/LocalData/LocalData';

export type UserConfig = {
  userId: UUID;
  username: string;
  apiKey: UUID | null;
};

function createUserConfigStore() {
  let currentConfig: UserConfig = {
    userId: '' as UUID,
    username: '',
    apiKey: null
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
     * Clears the user config (e.g. on logout).
     */
    clear: () => {
      updateUserConfig(() => ({ userId: '' as UUID, username: '', apiKey: null }));
    },
    /**
     * Simply gets the current config.
     */
    get: () => currentConfig
  };
}

export const userConfig = createUserConfigStore();
