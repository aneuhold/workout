import { STORAGE_PREFIX } from './storagePrefix';

/**
 * Single public entry point for tab-scoped persistence. `sessionStorage` is
 * partitioned by browser tab and origin, so nothing stored here reaches
 * another tab, and everything is dropped when the tab closes.
 */
export default class SessionData {
  /**
   * A prefix before all stored key names in case cache busting needs to happen
   * at some point. Sourced from `storagePrefix.ts`, the same value `LocalData`
   * uses, so one bump covers every stored key.
   */
  static #PREFIX = STORAGE_PREFIX;

  static storedKeyNames = {
    demoMode: `${this.#PREFIX}demoMode`
  };

  /**
   * Whether this tab runs the app on mock data with the API stubbed.
   */
  static getDemoModeEnabled(): boolean {
    return window.sessionStorage.getItem(this.storedKeyNames.demoMode) === 'true';
  }

  /**
   * Turns demo mode on or off for this tab. It survives reloads and ends with
   * the tab.
   *
   * @param enabled Whether demo mode should be on
   */
  static setDemoModeEnabled(enabled: boolean): void {
    if (enabled) {
      window.sessionStorage.setItem(this.storedKeyNames.demoMode, 'true');
    } else {
      window.sessionStorage.removeItem(this.storedKeyNames.demoMode);
    }
  }
}
