import { writable } from 'svelte/store';
import navInfo, { type PageInfo } from '$util/navInfo';
import { userConfig } from '../local/userConfig/userConfig';

function createEnabledPagesStore() {
  const { subscribe, set } = writable<PageInfo[]>(Object.values(navInfo));

  // TODO: Re-implement page filtering when workout-specific feature flags are needed
  userConfig.subscribe((_settings) => {
    // For now, just enable all pages in navInfo
    set(Object.values(navInfo));
  });

  return {
    subscribe
  };
}

export const enabledPages = createEnabledPagesStore();
