import navInfo from '$util/navInfo';

/**
 * Owns demo mode, where the app runs on scenario data with the API stubbed.
 */
class DemoModeService {
  /**
   * Unversioned, because sessionData gets wiped on each new tab open.
   *
   * Note that there is an edge-case here where if the user has the demo open, there is
   * a new version of the app released, and the page reloads. It will wipe out their existing
   * demo data but still look like it is successfully seeded. That is expected and a rare enough
   * event (because only new people will really ever use demo mode) that it doesn't seem worth
   * addressing at this time.
   */
  readonly #flagKey = 'mesoProDemoMode';

  /**
   * Whether this tab is currently in demo mode.
   */
  isEnabled(): boolean {
    return window.sessionStorage.getItem(this.#flagKey) === 'true';
  }

  /**
   * Resumes the demo stored in this tab, or turns demo mode on and seeds a
   * fresh demo if there isn't one.
   */
  async enter(): Promise<void> {
    // Imported on demand to keep the mock environment code out of the bundle
    // every visitor downloads at startup
    const { default: mockEnvSetupService } =
      await import('$services/MockEnvSetupService/MockEnvSetup.service');
    if (this.isEnabled()) {
      await mockEnvSetupService.resumeDemo();
    } else {
      await mockEnvSetupService.seedDemo();
      window.sessionStorage.setItem(this.#flagKey, 'true');
    }
  }

  exit(): void {
    window.sessionStorage.clear();
    this.#loadHome();
  }

  /**
   * Navigates to the home page with a full page load, so the next page load
   * starts without demo mode.
   */
  #loadHome(): void {
    window.location.assign(navInfo.home.url);
  }
}

const demoModeService = new DemoModeService();
export default demoModeService;
