import { Capacitor } from '@capacitor/core';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';

/**
 * Checks whether a newer version of the app is available and exposes the
 * result via `updateAvailable` for the update notification dialog to react to.
 */
class UpdateCheckService {
  /** Replaced with the deployed version at build time (see `replaceDevVersion.ts`). */
  static readonly #currentVersion: string = '#DEV.VERSION#';
  static readonly #versionUrl = 'https://mesopro.tonyneuhold.com/version.json';

  #updateAvailable: boolean = $state(false);

  /** True when a newer version of the app is available. */
  get updateAvailable() {
    return this.#updateAvailable;
  }

  /**
   * Sets `updateAvailable` to `true` if a newer version is available. Skips in
   * dev (placeholder not yet replaced). Errors are swallowed silently.
   */
  async checkForUpdate(): Promise<void> {
    if (UpdateCheckService.#currentVersion.includes('DEV.VERSION')) return;

    try {
      this.#updateAvailable = Capacitor.isNativePlatform()
        ? await this.#isStoreUpdateAvailable()
        : await this.#isDeployedVersionNewer();
    } catch {
      // Network and Play Store errors are swallowed; the check will retry next time.
    }
  }

  /**
   * Sends the user to the newer version: the app store listing on native, or
   * a page reload on web.
   */
  async applyUpdate(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await AppUpdate.openAppStore();
    } else {
      window.location.reload();
    }
  }

  /**
   * Asks the app store whether it can serve this user a newer version. Builds
   * not installed from Google Play report no update.
   */
  async #isStoreUpdateAvailable(): Promise<boolean> {
    const { updateAvailability } = await AppUpdate.getAppUpdateInfo();
    return updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE;
  }

  /**
   * Fetches the deployed web version and compares it to the current build.
   */
  async #isDeployedVersionNewer(): Promise<boolean> {
    const response = await fetch(UpdateCheckService.#versionUrl, { cache: 'no-store' });
    const data: unknown = await response.json();
    return (
      typeof data === 'object' &&
      data !== null &&
      'appVersion' in data &&
      typeof data.appVersion === 'string' &&
      data.appVersion !== UpdateCheckService.#currentVersion
    );
  }
}

const updateCheckService = new UpdateCheckService();
export default updateCheckService;
