import type {
  DashboardConfig,
  ProjectDashboardOptions,
  Translations
} from '@aneuhold/core-ts-api-lib';
import type {
  DashboardTaskMap,
  DocumentMap,
  NonogramKatanaItem,
  NonogramKatanaUpgrade
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
    dashboardConfig: `${this.PREFIX}dashboardConfig`,
    translations: `${this.PREFIX}translations`,
    userConfig: `${this.PREFIX}userConfig`,
    taskMap: `${this.PREFIX}taskMap`,
    currentApiRequest: `${this.PREFIX}currentApiRequest`,
    apiRequestQueue: `${this.PREFIX}apiRequestQueue`,
    nonogramKatanaItemMap: `${this.PREFIX}nonogramKatanaItemMap`,
    nonogramKatanaUpgradeMap: `${this.PREFIX}nonogramKatanaUpgradeMap`
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

  static set dashboardConfig(newDashboardConfig: DashboardConfig | null) {
    this.storeValue(LocalData.storedKeyNames.dashboardConfig, JSON.stringify(newDashboardConfig));
  }

  static get dashboardConfig() {
    return this.getStoredObject<DashboardConfig>(LocalData.storedKeyNames.dashboardConfig);
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

  static set taskMap(newTaskMap: DashboardTaskMap | null) {
    this.storeValue(LocalData.storedKeyNames.taskMap, JSON.stringify(newTaskMap));
  }

  static setAndGetTaskMap(newTaskMap: DashboardTaskMap): DashboardTaskMap {
    const stringifiedTaskMap = JSON.stringify(newTaskMap);
    this.storeValue(LocalData.storedKeyNames.taskMap, stringifiedTaskMap);
    return JSON.parse(stringifiedTaskMap, DateService.dateReviver) as DashboardTaskMap;
  }

  static get taskMap() {
    return this.getStoredObject<DashboardTaskMap>(LocalData.storedKeyNames.taskMap);
  }

  static setAndGetNonogramKatanaItemMap(
    newItemMap: DocumentMap<NonogramKatanaItem>
  ): DocumentMap<NonogramKatanaItem> {
    const stringifiedItemMap = JSON.stringify(newItemMap);
    this.storeValue(LocalData.storedKeyNames.nonogramKatanaItemMap, stringifiedItemMap);
    return JSON.parse(
      stringifiedItemMap,
      DateService.dateReviver
    ) as DocumentMap<NonogramKatanaItem>;
  }

  static get nonogramKatanaItemMap(): DocumentMap<NonogramKatanaItem> | null {
    return this.getStoredObject<DocumentMap<NonogramKatanaItem>>(
      LocalData.storedKeyNames.nonogramKatanaItemMap
    );
  }

  static setAndGetNonogramKatanaUpgradeMap(
    newUpgradeMap: DocumentMap<NonogramKatanaUpgrade>
  ): DocumentMap<NonogramKatanaUpgrade> {
    const stringifiedUpgradeMap = JSON.stringify(newUpgradeMap);
    this.storeValue(LocalData.storedKeyNames.nonogramKatanaUpgradeMap, stringifiedUpgradeMap);
    return JSON.parse(
      stringifiedUpgradeMap,
      DateService.dateReviver
    ) as DocumentMap<NonogramKatanaUpgrade>;
  }

  static get nonogramKatanaUpgradeMap(): Record<string, NonogramKatanaUpgrade> | null {
    return this.getStoredObject<Record<string, NonogramKatanaUpgrade>>(
      LocalData.storedKeyNames.nonogramKatanaUpgradeMap
    );
  }

  static set currentApiRequest(newApiRequest: ProjectDashboardOptions | undefined) {
    this.storeValue(LocalData.storedKeyNames.currentApiRequest, JSON.stringify(newApiRequest));
  }

  static get currentApiRequest(): ProjectDashboardOptions | undefined {
    const result = this.getStoredObject<ProjectDashboardOptions>(
      LocalData.storedKeyNames.currentApiRequest
    );
    if (!result) {
      return undefined;
    }
    return result;
  }

  static set apiRequestQueue(newRequestQueue: ProjectDashboardOptions[]) {
    this.storeValue(LocalData.storedKeyNames.apiRequestQueue, JSON.stringify(newRequestQueue));
  }

  static get apiRequestQueue(): ProjectDashboardOptions[] {
    const result = this.getStoredObject<ProjectDashboardOptions[]>(
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
