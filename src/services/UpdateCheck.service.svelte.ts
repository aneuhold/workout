/**
 * Checks whether a newer version of the app has been deployed and exposes the
 * result via `updateAvailable` for the update notification dialog to react to.
 */
class UpdateCheckService {
  /** Replaced with the deployed version at build time (see `replaceDevVersion.ts`). */
  private static readonly currentVersion: string = '#DEV.VERSION#';
  private static readonly versionUrl = 'https://mesopro.tonyneuhold.com/version.json';

  #updateAvailable: boolean = $state(false);

  /** True when a newer version of the app is available. */
  get updateAvailable() {
    return this.#updateAvailable;
  }

  /**
   * Fetches the deployed version and sets `updateAvailable` to `true` if it
   * differs from the current build. Skips in dev (placeholder not yet
   * replaced). Errors are swallowed silently.
   */
  async checkForUpdate(): Promise<void> {
    if (UpdateCheckService.currentVersion.includes('DEV.VERSION')) return;

    try {
      const response = await fetch(UpdateCheckService.versionUrl, { cache: 'no-store' });
      const data: unknown = await response.json();
      if (
        typeof data === 'object' &&
        data !== null &&
        'appVersion' in data &&
        typeof data.appVersion === 'string' &&
        data.appVersion !== UpdateCheckService.currentVersion
      ) {
        this.#updateAvailable = true;
      }
    } catch {
      // Network errors are swallowed; the check will retry next time.
    }
  }
}

const updateCheckService = new UpdateCheckService();
export default updateCheckService;
