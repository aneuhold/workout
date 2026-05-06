/**
 * Common contract every persistence backend implements. Backends store and
 * retrieve string values keyed by name; serialization is owned by `LocalData`
 * so backends stay agnostic of payload shape.
 */
export interface ILocalDataBackend {
  /**
   * Optional one-time setup (open SQLite connection, IndexedDB upgrade, etc.).
   * Called from `LocalData.init()`.
   */
  init?: () => Promise<void>;

  /**
   * Returns the previously stored string for `key`, or `null` if nothing is
   * stored.
   *
   * @param key Storage key.
   */
  get: (key: string) => Promise<string | null>;

  /**
   * Stores `value` under `key`, overwriting any previous value.
   *
   * @param key Storage key.
   * @param value Serialized payload to persist.
   */
  set: (key: string, value: string) => Promise<void>;

  /**
   * Removes the entry for `key`. No-op if nothing is stored.
   *
   * @param key Storage key.
   */
  remove: (key: string) => Promise<void>;

  /**
   * Removes every entry whose key isn't part of the current prefix
   * generation. Each backend owns the predicate (e.g. localStorage scopes to
   * the legacy `v\d+-` shape so unrelated entries from other libraries stay
   * untouched; native backends own their entire namespace and can match
   * everything outside the prefix).
   *
   * @param currentPrefix The prefix that survives — anything else gets
   *   wiped.
   */
  cleanupOldVersions: (currentPrefix: string) => Promise<void>;
}
