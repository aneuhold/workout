import type { ILocalDataBackend } from './ILocalDataBackend';

/**
 * `Map`-backed implementation that keeps every value in memory, so nothing
 * is written to device or browser storage and nothing outlives the page.
 */
export default class InMemoryBackend implements ILocalDataBackend {
  readonly #values = new Map<string, string>();

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.#values.get(key) ?? null);
  }

  set(key: string, value: string): Promise<void> {
    this.#values.set(key, value);
    return Promise.resolve();
  }

  remove(key: string): Promise<void> {
    this.#values.delete(key);
    return Promise.resolve();
  }

  /**
   * Does nothing, because no value outlives the page to become stale.
   */
  cleanupOldVersions(): Promise<void> {
    return Promise.resolve();
  }
}
