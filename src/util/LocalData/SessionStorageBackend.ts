import type { ILocalDataBackend } from './ILocalDataBackend';

/**
 * `window.sessionStorage`-backed implementation. Values are partitioned by
 * browser tab and origin, survive reloads, and are dropped when the tab
 * closes.
 */
export default class SessionStorageBackend implements ILocalDataBackend {
  get(key: string): Promise<string | null> {
    return Promise.resolve(window.sessionStorage.getItem(key));
  }

  set(key: string, value: string): Promise<void> {
    window.sessionStorage.setItem(key, value);
    return Promise.resolve();
  }

  remove(key: string): Promise<void> {
    window.sessionStorage.removeItem(key);
    return Promise.resolve();
  }

  cleanupOldVersions(currentPrefix: string): Promise<void> {
    const legacyKeyPattern = /^v\d+-/;
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key !== null && legacyKeyPattern.test(key) && !key.startsWith(currentPrefix)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.sessionStorage.removeItem(key);
    }
    return Promise.resolve();
  }
}
