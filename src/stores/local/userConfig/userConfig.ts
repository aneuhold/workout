import type { UUID } from 'crypto';
import { type Updater, writable } from 'svelte/store';
import LocalData from '$util/LocalData/LocalData';

export type UserConfig = {
  userId: UUID;
  username: string;
  /** JWT access token for authenticating API requests. */
  accessToken: string | null;
  /** Raw refresh token string for automatic token refresh. */
  refreshTokenString: string | null;
};

function createUserConfigStore() {
  const ANONYMOUS_USER_ID: UUID = '00000000-0000-0000-0000-000000000000';
  let currentConfig: UserConfig = {
    userId: ANONYMOUS_USER_ID,
    username: '',
    accessToken: null,
    refreshTokenString: null
  };
  const { subscribe, set } = writable<UserConfig>(currentConfig);

  const updateUserConfig = (updater: Updater<UserConfig>) => {
    currentConfig = updater(currentConfig);
    set(currentConfig);
    void LocalData.setUserConfig(currentConfig);
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
     * Replaces the in-memory config without writing back to LocalData.
     *
     * @param newConfig User config to apply locally.
     */
    setWithoutPropagation: (newConfig: UserConfig) => {
      currentConfig = newConfig;
      set(currentConfig);
    },
    /**
     * Clears the user config (e.g. on logout).
     */
    clear: () => {
      updateUserConfig(() => ({
        userId: ANONYMOUS_USER_ID,
        username: '',
        accessToken: null,
        refreshTokenString: null
      }));
    },
    /**
     * Simply gets the current config.
     */
    get: () => currentConfig,
    /**
     * Loads the cached user config into the store. Called once at app
     * startup after `LocalData.init()` resolves.
     */
    hydrate: async () => {
      const cached = await LocalData.getUserConfig();
      if (cached) {
        currentConfig = cached;
        set(currentConfig);
      }
    }
  };
}

export const userConfig = createUserConfigStore();
