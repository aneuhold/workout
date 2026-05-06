import { type IDBPDatabase, openDB } from 'idb';
import type { ILocalDataBackend } from './ILocalDataBackend';

/**
 * Web large-tier backend, wrapping IndexedDB through `idb`. Stores serialized
 * JSON blobs against out-of-line keys in a single object store, mirroring the
 * shape `SqliteBackend` uses on native so the `LocalData` JSON layer doesn't
 * branch on platform.
 */
export default class IndexedDbBackend implements ILocalDataBackend {
  private static DB_NAME = 'workout';
  private static DB_VERSION = 1;
  private static STORE_NAME = 'documentBlobs';

  private dbPromise: Promise<IDBPDatabase> | null = null;

  async init(): Promise<void> {
    await this.openDb();
    return undefined;
  }

  async get(key: string): Promise<string | null> {
    const db = await this.openDb();
    const value = await db.get(IndexedDbBackend.STORE_NAME, key);
    if (typeof value !== 'string') return null;
    return value;
  }

  async set(key: string, value: string): Promise<void> {
    const db = await this.openDb();
    await db.put(IndexedDbBackend.STORE_NAME, value, key);
  }

  async remove(key: string): Promise<void> {
    const db = await this.openDb();
    await db.delete(IndexedDbBackend.STORE_NAME, key);
  }

  async cleanupOldVersions(currentPrefix: string): Promise<void> {
    const db = await this.openDb();
    const allKeys = await db.getAllKeys(IndexedDbBackend.STORE_NAME);
    const tx = db.transaction(IndexedDbBackend.STORE_NAME, 'readwrite');
    for (const key of allKeys) {
      if (typeof key === 'string' && !key.startsWith(currentPrefix)) {
        await tx.store.delete(key);
      }
    }
    await tx.done;
  }

  private openDb(): Promise<IDBPDatabase> {
    this.dbPromise ??= openDB(IndexedDbBackend.DB_NAME, IndexedDbBackend.DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(IndexedDbBackend.STORE_NAME)) {
          db.createObjectStore(IndexedDbBackend.STORE_NAME);
        }
      }
    });
    return this.dbPromise;
  }
}
