import type { ProjectWorkoutPrimaryEndpointOptions, Translations } from '@aneuhold/core-ts-api-lib';
import type {
  DocumentMap,
  WorkoutEquipmentType,
  WorkoutExercise,
  WorkoutExerciseCalibration,
  WorkoutMesocycle,
  WorkoutMicrocycle,
  WorkoutMuscleGroup,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet
} from '@aneuhold/core-ts-db-lib';
import { DateService } from '@aneuhold/core-ts-lib';
import { browser } from '$app/environment';
import type { UserConfig } from '$stores/local/userConfig/userConfig';

export default class LocalData {
  /**
   * A prefix before all stored key names in case cache busting needs to happen
   * at some point.
   */
  private static PREFIX = 'v3-';

  private static localStorageAvailable = browser;

  private static storedKeyNames = {
    password: `${this.PREFIX}password`,
    username: `${this.PREFIX}username`,
    translations: `${this.PREFIX}translations`,
    userConfig: `${this.PREFIX}userConfig`,
    currentApiRequest: `${this.PREFIX}currentApiRequest`,
    apiRequestQueue: `${this.PREFIX}apiRequestQueue`,
    // Workout document maps
    mesocycleMap: `${this.PREFIX}mesocycleMap`,
    microcycleMap: `${this.PREFIX}microcycleMap`,
    sessionMap: `${this.PREFIX}sessionMap`,
    sessionExerciseMap: `${this.PREFIX}sessionExerciseMap`,
    setMap: `${this.PREFIX}setMap`,
    exerciseMap: `${this.PREFIX}exerciseMap`,
    exerciseCalibrationMap: `${this.PREFIX}exerciseCalibrationMap`,
    muscleGroupMap: `${this.PREFIX}muscleGroupMap`,
    equipmentTypeMap: `${this.PREFIX}equipmentTypeMap`
  };

  /**
   * Static initializer to cleanup old versions on module load.
   */
  static {
    LocalData.cleanupOldVersions();
  }

  private static storeValue(key: string, value: string) {
    if (this.localStorageAvailable) {
      window.localStorage.setItem(key, value);
    }
  }

  private static getValue(key: string) {
    if (this.localStorageAvailable) {
      return window.localStorage.getItem(key);
    }
    return '';
  }

  static set password(newPassword: string) {
    this.storeValue(LocalData.storedKeyNames.password, newPassword);
  }

  static get password(): string {
    const currentlyStoredValue = this.getValue(LocalData.storedKeyNames.password);
    if (currentlyStoredValue && currentlyStoredValue !== '') {
      return currentlyStoredValue;
    }
    return '';
  }

  static set username(newUsername: string) {
    this.storeValue(LocalData.storedKeyNames.username, newUsername);
  }

  static get username(): string {
    const currentlyStoredValue = this.getValue(LocalData.storedKeyNames.username);
    if (currentlyStoredValue && currentlyStoredValue !== '') {
      return currentlyStoredValue;
    }
    return '';
  }

  static set translations(newTranslations: Translations | null) {
    this.storeValue(LocalData.storedKeyNames.translations, JSON.stringify(newTranslations));
  }

  static get translations() {
    return this.getStoredObject<Translations>(LocalData.storedKeyNames.translations);
  }

  static set userConfig(newSettings: UserConfig | null) {
    this.storeValue(LocalData.storedKeyNames.userConfig, JSON.stringify(newSettings));
  }

  static get userConfig() {
    return this.getStoredObject<UserConfig>(LocalData.storedKeyNames.userConfig);
  }

  // Workout document map getters/setters

  static setAndGetMesocycleMap(
    newMap: DocumentMap<WorkoutMesocycle>
  ): DocumentMap<WorkoutMesocycle> {
    const stringified = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.mesocycleMap, stringified);
    return LocalData.parseRevived(stringified);
  }

  static get mesocycleMap(): DocumentMap<WorkoutMesocycle> | null {
    return this.getStoredObject<DocumentMap<WorkoutMesocycle>>(
      LocalData.storedKeyNames.mesocycleMap
    );
  }

  static setAndGetMicrocycleMap(
    newMap: DocumentMap<WorkoutMicrocycle>
  ): DocumentMap<WorkoutMicrocycle> {
    const stringified = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.microcycleMap, stringified);
    return LocalData.parseRevived(stringified);
  }

  static get microcycleMap(): DocumentMap<WorkoutMicrocycle> | null {
    return this.getStoredObject<DocumentMap<WorkoutMicrocycle>>(
      LocalData.storedKeyNames.microcycleMap
    );
  }

  static setAndGetSessionMap(newMap: DocumentMap<WorkoutSession>): DocumentMap<WorkoutSession> {
    const stringified = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.sessionMap, stringified);
    return LocalData.parseRevived(stringified);
  }

  static get sessionMap(): DocumentMap<WorkoutSession> | null {
    return this.getStoredObject<DocumentMap<WorkoutSession>>(LocalData.storedKeyNames.sessionMap);
  }

  static setAndGetSessionExerciseMap(
    newMap: DocumentMap<WorkoutSessionExercise>
  ): DocumentMap<WorkoutSessionExercise> {
    const stringified = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.sessionExerciseMap, stringified);
    return LocalData.parseRevived(stringified);
  }

  static get sessionExerciseMap(): DocumentMap<WorkoutSessionExercise> | null {
    return this.getStoredObject<DocumentMap<WorkoutSessionExercise>>(
      LocalData.storedKeyNames.sessionExerciseMap
    );
  }

  static setAndGetSetMap(newMap: DocumentMap<WorkoutSet>): DocumentMap<WorkoutSet> {
    const stringified = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.setMap, stringified);
    return LocalData.parseRevived(stringified);
  }

  static get setMap(): DocumentMap<WorkoutSet> | null {
    return this.getStoredObject<DocumentMap<WorkoutSet>>(LocalData.storedKeyNames.setMap);
  }

  static setAndGetExerciseMap(newMap: DocumentMap<WorkoutExercise>): DocumentMap<WorkoutExercise> {
    const stringified = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.exerciseMap, stringified);
    return LocalData.parseRevived(stringified);
  }

  static get exerciseMap(): DocumentMap<WorkoutExercise> | null {
    return this.getStoredObject<DocumentMap<WorkoutExercise>>(LocalData.storedKeyNames.exerciseMap);
  }

  static setAndGetExerciseCalibrationMap(
    newMap: DocumentMap<WorkoutExerciseCalibration>
  ): DocumentMap<WorkoutExerciseCalibration> {
    const stringified = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.exerciseCalibrationMap, stringified);
    return LocalData.parseRevived(stringified);
  }

  static get exerciseCalibrationMap(): DocumentMap<WorkoutExerciseCalibration> | null {
    return this.getStoredObject<DocumentMap<WorkoutExerciseCalibration>>(
      LocalData.storedKeyNames.exerciseCalibrationMap
    );
  }

  static setAndGetMuscleGroupMap(
    newMap: DocumentMap<WorkoutMuscleGroup>
  ): DocumentMap<WorkoutMuscleGroup> {
    const stringified = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.muscleGroupMap, stringified);
    return LocalData.parseRevived(stringified);
  }

  static get muscleGroupMap(): DocumentMap<WorkoutMuscleGroup> | null {
    return this.getStoredObject<DocumentMap<WorkoutMuscleGroup>>(
      LocalData.storedKeyNames.muscleGroupMap
    );
  }

  static setAndGetEquipmentTypeMap(
    newMap: DocumentMap<WorkoutEquipmentType>
  ): DocumentMap<WorkoutEquipmentType> {
    const stringified = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.equipmentTypeMap, stringified);
    return LocalData.parseRevived(stringified);
  }

  static get equipmentTypeMap(): DocumentMap<WorkoutEquipmentType> | null {
    return this.getStoredObject<DocumentMap<WorkoutEquipmentType>>(
      LocalData.storedKeyNames.equipmentTypeMap
    );
  }

  static set currentApiRequest(newApiRequest: ProjectWorkoutPrimaryEndpointOptions | undefined) {
    this.storeValue(LocalData.storedKeyNames.currentApiRequest, JSON.stringify(newApiRequest));
  }

  static get currentApiRequest(): ProjectWorkoutPrimaryEndpointOptions | undefined {
    const result = this.getStoredObject<ProjectWorkoutPrimaryEndpointOptions>(
      LocalData.storedKeyNames.currentApiRequest
    );
    if (!result) {
      return undefined;
    }
    return result;
  }

  static set apiRequestQueue(newRequestQueue: ProjectWorkoutPrimaryEndpointOptions[]) {
    this.storeValue(LocalData.storedKeyNames.apiRequestQueue, JSON.stringify(newRequestQueue));
  }

  static get apiRequestQueue(): ProjectWorkoutPrimaryEndpointOptions[] {
    const result = this.getStoredObject<ProjectWorkoutPrimaryEndpointOptions[]>(
      LocalData.storedKeyNames.apiRequestQueue
    );
    if (!result) {
      return [];
    }
    return result;
  }

  /**
   * Removes localStorage entries from previous prefix versions so they don't
   * pile up when the prefix is bumped. Identifies legacy keys by the `v<n>-`
   * shape; anything outside that pattern is left alone.
   */
  private static cleanupOldVersions(): void {
    if (!this.localStorageAvailable) return;
    const legacyKeyPattern = /^v\d+-/;
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && legacyKeyPattern.test(key) && !key.startsWith(this.PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  }

  /**
   * Deep-clones a serialized payload by parsing it with the date reviver.
   * Centralizes the unavoidable cast for the localStorage system boundary.
   *
   * @param stringified The JSON string previously produced by JSON.stringify.
   */
  private static parseRevived<T>(stringified: string): T {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return JSON.parse(stringified, DateService.dateReviver) as T;
  }

  /**
   * Gets a stored object with some basic validation. This should be setup
   * to use type guards.
   *
   * @param key The key to get the object for.
   */
  private static getStoredObject<ObjectType>(key: string): ObjectType | null {
    const currentlyStoredValue = this.getValue(key);
    if (
      currentlyStoredValue &&
      currentlyStoredValue !== '' &&
      currentlyStoredValue !== 'undefined' &&
      typeof currentlyStoredValue === 'string'
    ) {
      const parsed = LocalData.parseRevived<ObjectType>(currentlyStoredValue);
      if (typeof parsed === 'object') {
        return parsed;
      }
    }
    return null;
  }
}
