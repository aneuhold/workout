import SessionData from '$util/LocalData/SessionData';
import navInfo from '$util/navInfo';

/**
 * Moves the tab into and out of demo mode, where the app runs on scenario data
 * with the API stubbed and `LocalData` held in memory.
 *
 * Both transitions load the home page as a full page load rather than a
 * client-side navigation. `LocalData` chooses its backend once per page load
 * and the root layout reads the demo flag in `onMount`, so a flag change only
 * takes effect on the next load.
 */
class DemoModeService {
  /**
   * Turns demo mode on for this tab and opens the app on mock data.
   */
  enter(): void {
    SessionData.setDemoModeEnabled(true);
    this.#loadHome();
  }

  /**
   * Turns demo mode off for this tab and returns to the real app. Nothing the
   * demo did was persisted, so the stored session and cache are untouched.
   */
  exit(): void {
    SessionData.setDemoModeEnabled(false);
    this.#loadHome();
  }

  /**
   * Navigates to the home page with a full page load, which is what lets the
   * changed demo flag take effect.
   */
  #loadHome(): void {
    window.location.assign(navInfo.home.url);
  }
}

const demoModeService = new DemoModeService();
export default demoModeService;
