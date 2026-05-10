import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection
} from '@capacitor-community/sqlite';
import type { ILocalDataBackend } from './ILocalDataBackend';

/**
 * Native large-tier backend, wrapping `@capacitor-community/sqlite`. Stores
 * one row per logical key with the JSON blob in `value`, mirroring the shape
 * `IndexedDbBackend` uses on web. Opens the SQLite connection without an
 * encryption secret — SQLCipher is linked but unused.
 */
export default class SqliteBackend implements ILocalDataBackend {
  private static DB_NAME = 'workout';
  private static TABLE_NAME = 'document_blobs';

  private dbPromise: Promise<SQLiteDBConnection> | null = null;

  async init(): Promise<void> {
    await this.openDb();
    return undefined;
  }

  async get(key: string): Promise<string | null> {
    const db = await this.openDb();
    const result = await db.query(`SELECT value FROM ${SqliteBackend.TABLE_NAME} WHERE key = ?;`, [
      key
    ]);
    const row = result.values?.[0];
    if (!row || typeof row.value !== 'string') return null;
    return row.value;
  }

  async set(key: string, value: string): Promise<void> {
    const db = await this.openDb();
    await db.run(
      `INSERT INTO ${SqliteBackend.TABLE_NAME} (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
      [key, value]
    );
  }

  async remove(key: string): Promise<void> {
    const db = await this.openDb();
    await db.run(`DELETE FROM ${SqliteBackend.TABLE_NAME} WHERE key = ?;`, [key]);
  }

  async cleanupOldVersions(currentPrefix: string): Promise<void> {
    const db = await this.openDb();
    await db.run(`DELETE FROM ${SqliteBackend.TABLE_NAME} WHERE key NOT LIKE ?;`, [
      `${currentPrefix}%`
    ]);
  }

  private openDb(): Promise<SQLiteDBConnection> {
    this.dbPromise ??= this.createConnection();
    return this.dbPromise;
  }

  private async createConnection(): Promise<SQLiteDBConnection> {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const db = await sqlite.createConnection(
      SqliteBackend.DB_NAME,
      false,
      'no-encryption',
      1,
      false
    );
    await db.open();
    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${SqliteBackend.TABLE_NAME} (key TEXT PRIMARY KEY, value TEXT NOT NULL);`
    );
    return db;
  }
}
