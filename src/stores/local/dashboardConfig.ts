import type { DashboardConfig } from '@aneuhold/core-ts-api-lib';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import LocalData from '$util/LocalData/LocalData';

function createDashboardConfigStore() {
  const initialConfig = browser ? LocalData.dashboardConfig : null;
  const { subscribe, set } = writable<DashboardConfig | null>(initialConfig);

  let dashboardConfig: DashboardConfig | null = initialConfig;

  return {
    subscribe,
    set: (newConfig: DashboardConfig) => {
      set(newConfig);
      LocalData.dashboardConfig = newConfig;
      dashboardConfig = newConfig;
    },
    get: () => {
      return dashboardConfig;
    }
  };
}

/**
 * The store for managing the global dashboard configuration. This isn't tied to a specific user.
 */
export const dashboardConfig = createDashboardConfigStore();
