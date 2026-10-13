import { writable } from 'svelte/store';
import navInfo, { type PageInfo } from '$util/navInfo';
import { currentUser } from '../local/currentUser/currentUser';

function createEnabledPagesStore() {
  const { subscribe, set } = writable<PageInfo[]>(Object.values(navInfo));

  // TODO: Re-implement page filtering when workout-specific feature flags are needed
  currentUser.subscribe((_user) => {
    // For now, just enable all pages in navInfo
    set(Object.values(navInfo));
  });

  return {
    subscribe
  };
}

export const enabledPages = createEnabledPagesStore();
