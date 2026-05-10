import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import LocalData from '$util/LocalData/LocalData';

function createPasswordStore() {
  const { subscribe, set, update } = writable<string>(browser ? LocalData.password : '');

  return {
    subscribe,
    set: (newPassword: string) => {
      set(newPassword);
      LocalData.password = newPassword;
    },
    update
  };
}

export const password = createPasswordStore();
