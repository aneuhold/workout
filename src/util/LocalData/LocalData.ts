import type { ProjectWorkoutPrimaryEndpointOptions, Translations } from '@aneuhold/core-ts-api-lib';
import type { BaseDocument, DocumentMap } from '@aneuhold/core-ts-db-lib';
import { DateService } from '@aneuhold/core-ts-lib';
import { Capacitor } from '@capacitor/core';
import type { UserConfig } from '$stores/local/userConfig/userConfig';
import type { ILocalDataBackend } from './ILocalDataBackend';
import IndexedDbBackend from './IndexedDbBackend';
import LocalStorageBackend from './LocalStorageBackend';
import PreferencesBackend from './PreferencesBackend';
import SqliteBackend from './SqliteBackend';
import { STORAGE_PREFIX } from './storagePrefix';

/**
 * Single public entry point for client-side persistence. Routes each key to
 * a small-tier or large-tier backend depending on payload size.
 */
export default class LocalData {
  /**
   * A prefix before all stored key names in case cache busting needs to happen
   * at some point. Sourced from `storagePrefix.ts` so build-time scripts can
   * read the same value without booting SvelteKit.
   */
  static #PREFIX = STORAGE_PREFIX;

  static storedKeyNames = {
    password: `${this.#PREFIX}password`,
    username: `${this.#PREFIX}username`,
    translations: `${this.#PREFIX}translations`,
    userConfig: `${this.#PREFIX}userConfig`,
    currentApiRequest: `${this.#PREFIX}currentApiRequest`,
    apiRequestQueue: `${this.#PREFIX}apiRequestQueue`,
    // Workout document maps
    mesocycleMap: `${this.#PREFIX}mesocycleMap`,
    microcycleMap: `${this.#PREFIX}microcycleMap`,
    sessionMap: `${this.#PREFIX}sessionMap`,
    sessionExerciseMap: `${this.#PREFIX}sessionExerciseMap`,
    setMap: `${this.#PREFIX}setMap`,
    exerciseMap: `${this.#PREFIX}exerciseMap`,
    exerciseCalibrationMap: `${this.#PREFIX}exerciseCalibrationMap`,
    muscleGroupMap: `${this.#PREFIX}muscleGroupMap`,
    equipmentTypeMap: `${this.#PREFIX}equipmentTypeMap`
  };

  /**
   * Keys whose payloads are small enough (~<100 KB) to fit comfortably in
   * `localStorage` on web and `UserDefaults`/`SharedPreferences` on native.
   * Everything else routes to the large-tier backend.
   */
  static #smallTierKeys: ReadonlySet<string> = new Set([
    this.storedKeyNames.password,
    this.storedKeyNames.username,
    this.storedKeyNames.userConfig,
    this.storedKeyNames.currentApiRequest
  ]);

  static #smallBackend: ILocalDataBackend = Capacitor.isNativePlatform()
    ? new PreferencesBackend()
    : new LocalStorageBackend();
  static #largeBackend: ILocalDataBackend = Capacitor.isNativePlatform()
    ? new SqliteBackend()
    : new IndexedDbBackend();
  static #initialized = false;

  /**
   * Opens any backend resources (SQLite connection, IndexedDB upgrade) and
   * fires off the legacy-prefix cleanup. Safe to call multiple times — only
   * the first call has effect.
   */
  static async init(): Promise<void> {
    if (this.#initialized) return;
    this.#initialized = true;
    if (this.#smallBackend === this.#largeBackend) {
      await this.#smallBackend.init?.();
    } else {
      await Promise.all([this.#smallBackend.init?.(), this.#largeBackend.init?.()]);
    }
    void this.#cleanupOldVersions();
  }

  static async getPassword(): Promise<string> {
    return (await this.#getValue(this.storedKeyNames.password)) ?? '';
  }

  static async setPassword(newPassword: string): Promise<void> {
    await this.#storeValue(this.storedKeyNames.password, newPassword);
  }

  static async getUsername(): Promise<string> {
    return (await this.#getValue(this.storedKeyNames.username)) ?? '';
  }

  static async setUsername(newUsername: string): Promise<void> {
    await this.#storeValue(this.storedKeyNames.username, newUsername);
  }

  static async getTranslations(): Promise<Translations | null> {
    return this.#getStoredObject<Translations>(this.storedKeyNames.translations);
  }

  static async setTranslations(newTranslations: Translations | null): Promise<void> {
    await this.#storeValue(this.storedKeyNames.translations, JSON.stringify(newTranslations));
  }

  static async getUserConfig(): Promise<UserConfig | null> {
    return this.#getStoredObject<UserConfig>(this.storedKeyNames.userConfig);
  }

  static async setUserConfig(newSettings: UserConfig | null): Promise<void> {
    await this.#storeValue(this.storedKeyNames.userConfig, JSON.stringify(newSettings));
  }

  static async getCurrentApiRequest(): Promise<ProjectWorkoutPrimaryEndpointOptions | undefined> {
    return (
      (await this.#getStoredObject<ProjectWorkoutPrimaryEndpointOptions>(
        this.storedKeyNames.currentApiRequest
      )) ?? undefined
    );
  }

  static async setCurrentApiRequest(
    newApiRequest: ProjectWorkoutPrimaryEndpointOptions | undefined
  ): Promise<void> {
    await this.#storeValue(this.storedKeyNames.currentApiRequest, JSON.stringify(newApiRequest));
  }

  static async getApiRequestQueue(): Promise<ProjectWorkoutPrimaryEndpointOptions[]> {
    return (
      (await this.#getStoredObject<ProjectWorkoutPrimaryEndpointOptions[]>(
        this.storedKeyNames.apiRequestQueue
      )) ?? []
    );
  }

  static async setApiRequestQueue(
    newRequestQueue: ProjectWorkoutPrimaryEndpointOptions[]
  ): Promise<void> {
    await this.#storeValue(this.storedKeyNames.apiRequestQueue, JSON.stringify(newRequestQueue));
  }

  /**
   * Persists a document map under the given key.
   *
   * @param key The storage key to persist under (from `storedKeyNames`)
   * @param newMap The document map to persist
   */
  static async setDocumentMap<T extends BaseDocument>(
    key: string,
    newMap: DocumentMap<T>
  ): Promise<void> {
    await this.#storeValue(key, JSON.stringify(newMap));
  }

  /**
   * Reads a previously persisted document map for the given key, or `null`
   * if no cached value is found.
   *
   * @param key The storage key to read from (from `storedKeyNames`)
   */
  static async getDocumentMap<T extends BaseDocument>(key: string): Promise<DocumentMap<T> | null> {
    return this.#getStoredObject<DocumentMap<T>>(key);
  }

  /**
   * Wipes every cached workout document map. Intended for logout so a
   * different user signing in on the same browser doesn't see (or hydrate)
   * the previous session's data. Targets every key whose stored name ends
   * in `Map` — the naming convention shared by all workout-map entries in
   * {@link storedKeyNames}.
   */
  static async clearWorkoutMaps(): Promise<void> {
    const removals: Promise<void>[] = [];
    for (const key of Object.values(this.storedKeyNames)) {
      if (key.endsWith('Map')) {
        removals.push(this.#getBackendFor(key).remove(key));
      }
    }
    await Promise.all(removals);
  }

  static #getBackendFor(key: string): ILocalDataBackend {
    return this.#smallTierKeys.has(key) ? this.#smallBackend : this.#largeBackend;
  }

  static async #storeValue(key: string, value: string): Promise<void> {
    await this.#getBackendFor(key).set(key, value);
  }

  static async #getValue(key: string): Promise<string | null> {
    return this.#getBackendFor(key).get(key);
  }

  /**
   * Removes entries from previous prefix versions across every backend so
   * they don't pile up when the prefix is bumped. Each backend owns the
   * predicate it uses to scope deletion safely within its namespace.
   */
  static async #cleanupOldVersions(): Promise<void> {
    const backends =
      this.#smallBackend === this.#largeBackend
        ? [this.#smallBackend]
        : [this.#smallBackend, this.#largeBackend];
    await Promise.all(backends.map((backend) => backend.cleanupOldVersions(this.#PREFIX)));
  }

  /**
   * Gets a stored object with some basic validation. Parses with the date
   * reviver so timestamp fields land back as `Date` instances.
   *
   * @param key The key to get the object for.
   */
  static async #getStoredObject<ObjectType>(key: string): Promise<ObjectType | null> {
    const currentlyStoredValue = await this.#getValue(key);
    if (
      currentlyStoredValue &&
      currentlyStoredValue !== '' &&
      currentlyStoredValue !== 'undefined' &&
      typeof currentlyStoredValue === 'string'
    ) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const parsed = JSON.parse(currentlyStoredValue, DateService.dateReviver) as ObjectType;
      if (typeof parsed === 'object') {
        return parsed;
      }
    }
    return null;
  }
}
