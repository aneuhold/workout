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
    apiKey: `${this.PREFIX}apiKey`,
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

  static set apiKey(newApiKey: string) {
    this.storeValue(LocalData.storedKeyNames.apiKey, newApiKey);
  }

  static get apiKey(): string {
    const currentlyStoredValue = this.getValue(LocalData.storedKeyNames.apiKey);
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
    const stringifiedMap = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.mesocycleMap, stringifiedMap);
    return JSON.parse(stringifiedMap, DateService.dateReviver) as DocumentMap<WorkoutMesocycle>;
  }

  static get mesocycleMap(): DocumentMap<WorkoutMesocycle> | null {
    return this.getStoredObject<DocumentMap<WorkoutMesocycle>>(
      LocalData.storedKeyNames.mesocycleMap
    );
  }

  static setAndGetMicrocycleMap(
    newMap: DocumentMap<WorkoutMicrocycle>
  ): DocumentMap<WorkoutMicrocycle> {
    const stringifiedMap = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.microcycleMap, stringifiedMap);
    return JSON.parse(stringifiedMap, DateService.dateReviver) as DocumentMap<WorkoutMicrocycle>;
  }

  static get microcycleMap(): DocumentMap<WorkoutMicrocycle> | null {
    return this.getStoredObject<DocumentMap<WorkoutMicrocycle>>(
      LocalData.storedKeyNames.microcycleMap
    );
  }

  static setAndGetSessionMap(newMap: DocumentMap<WorkoutSession>): DocumentMap<WorkoutSession> {
    const stringifiedMap = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.sessionMap, stringifiedMap);
    return JSON.parse(stringifiedMap, DateService.dateReviver) as DocumentMap<WorkoutSession>;
  }

  static get sessionMap(): DocumentMap<WorkoutSession> | null {
    return this.getStoredObject<DocumentMap<WorkoutSession>>(LocalData.storedKeyNames.sessionMap);
  }

  static setAndGetSessionExerciseMap(
    newMap: DocumentMap<WorkoutSessionExercise>
  ): DocumentMap<WorkoutSessionExercise> {
    const stringifiedMap = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.sessionExerciseMap, stringifiedMap);
    return JSON.parse(
      stringifiedMap,
      DateService.dateReviver
    ) as DocumentMap<WorkoutSessionExercise>;
  }

  static get sessionExerciseMap(): DocumentMap<WorkoutSessionExercise> | null {
    return this.getStoredObject<DocumentMap<WorkoutSessionExercise>>(
      LocalData.storedKeyNames.sessionExerciseMap
    );
  }

  static setAndGetSetMap(newMap: DocumentMap<WorkoutSet>): DocumentMap<WorkoutSet> {
    const stringifiedMap = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.setMap, stringifiedMap);
    return JSON.parse(stringifiedMap, DateService.dateReviver) as DocumentMap<WorkoutSet>;
  }

  static get setMap(): DocumentMap<WorkoutSet> | null {
    return this.getStoredObject<DocumentMap<WorkoutSet>>(LocalData.storedKeyNames.setMap);
  }

  static setAndGetExerciseMap(newMap: DocumentMap<WorkoutExercise>): DocumentMap<WorkoutExercise> {
    const stringifiedMap = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.exerciseMap, stringifiedMap);
    return JSON.parse(stringifiedMap, DateService.dateReviver) as DocumentMap<WorkoutExercise>;
  }

  static get exerciseMap(): DocumentMap<WorkoutExercise> | null {
    return this.getStoredObject<DocumentMap<WorkoutExercise>>(LocalData.storedKeyNames.exerciseMap);
  }

  static setAndGetExerciseCalibrationMap(
    newMap: DocumentMap<WorkoutExerciseCalibration>
  ): DocumentMap<WorkoutExerciseCalibration> {
    const stringifiedMap = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.exerciseCalibrationMap, stringifiedMap);
    return JSON.parse(
      stringifiedMap,
      DateService.dateReviver
    ) as DocumentMap<WorkoutExerciseCalibration>;
  }

  static get exerciseCalibrationMap(): DocumentMap<WorkoutExerciseCalibration> | null {
    return this.getStoredObject<DocumentMap<WorkoutExerciseCalibration>>(
      LocalData.storedKeyNames.exerciseCalibrationMap
    );
  }

  static setAndGetMuscleGroupMap(
    newMap: DocumentMap<WorkoutMuscleGroup>
  ): DocumentMap<WorkoutMuscleGroup> {
    const stringifiedMap = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.muscleGroupMap, stringifiedMap);
    return JSON.parse(stringifiedMap, DateService.dateReviver) as DocumentMap<WorkoutMuscleGroup>;
  }

  static get muscleGroupMap(): DocumentMap<WorkoutMuscleGroup> | null {
    return this.getStoredObject<DocumentMap<WorkoutMuscleGroup>>(
      LocalData.storedKeyNames.muscleGroupMap
    );
  }

  static setAndGetEquipmentTypeMap(
    newMap: DocumentMap<WorkoutEquipmentType>
  ): DocumentMap<WorkoutEquipmentType> {
    const stringifiedMap = JSON.stringify(newMap);
    this.storeValue(LocalData.storedKeyNames.equipmentTypeMap, stringifiedMap);
    return JSON.parse(stringifiedMap, DateService.dateReviver) as DocumentMap<WorkoutEquipmentType>;
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
      const jsonObject: unknown = JSON.parse(currentlyStoredValue, DateService.dateReviver);
      if (typeof jsonObject === 'object') {
        return jsonObject as ObjectType;
      }
    }
    return null;
  }
}
