import { writable } from 'svelte/store';
import DashboardAPIService from '$util/api/DashboardAPIService';

function createAppIsVisibleStore() {
  let _appIsVisible = true;
  const { subscribe, set } = writable<boolean>(_appIsVisible);

  return {
    subscribe,
    set: (isVisible: boolean) => {
      if (isVisible !== _appIsVisible) {
        _appIsVisible = isVisible;
        set(_appIsVisible);
        if (_appIsVisible) {
          DashboardAPIService.getInitialDataIfNeeded();
        }
      }
    },
    get: () => _appIsVisible
  };
}

export const appIsVisible = createAppIsVisibleStore();
