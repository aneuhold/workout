import { browser } from '$app/environment';
import type { ILocalDataBackend } from './ILocalDataBackend';

/**
 * `window.localStorage`-backed implementation. Used as the small-tier backend
 * on web (auth/config) and, until Step 2 lands, also fills the large-tier
 * slot before `IndexedDbBackend` is introduced. Safe to call during SSR — all
 * methods short-circuit when `browser` is false.
 */
export default class LocalStorageBackend implements ILocalDataBackend {
  get(key: string): Promise<string | null> {
    if (!browser) return Promise.resolve(null);
    return Promise.resolve(window.localStorage.getItem(key));
  }

  set(key: string, value: string): Promise<void> {
    if (!browser) return Promise.resolve();
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  }

  remove(key: string): Promise<void> {
    if (!browser) return Promise.resolve();
    window.localStorage.removeItem(key);
    return Promise.resolve();
  }
}
