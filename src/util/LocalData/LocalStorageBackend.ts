import type { ILocalDataBackend } from './ILocalDataBackend';

/**
 * `window.localStorage`-backed implementation. Used as the small-tier backend
 * on web (auth/config).
 */
export default class LocalStorageBackend implements ILocalDataBackend {
  get(key: string): Promise<string | null> {
    return Promise.resolve(window.localStorage.getItem(key));
  }

  set(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  }

  remove(key: string): Promise<void> {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  }

  cleanupOldVersions(currentPrefix: string): Promise<void> {
    const legacyKeyPattern = /^v\d+-/;
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key !== null && legacyKeyPattern.test(key) && !key.startsWith(currentPrefix)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
    return Promise.resolve();
  }
}
