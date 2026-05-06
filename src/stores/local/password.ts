import { writable } from 'svelte/store';
import LocalData from '$util/LocalData/LocalData';

function createPasswordStore() {
  const { subscribe, set, update } = writable<string>('');

  return {
    subscribe,
    set: (newPassword: string) => {
      set(newPassword);
      void LocalData.setPassword(newPassword);
    },
    update,
    /**
     * Loads the cached password into the store. Called once at app startup
     * after `LocalData.init()` resolves.
     */
    hydrate: async () => {
      set(await LocalData.getPassword());
    }
  };
}

export const password = createPasswordStore();
