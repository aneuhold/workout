/**
 * Screen Wake Lock API service. Keeps the screen awake while the timer runs.
 * Silently no-ops if the browser doesn't support the Wake Lock API.
 *
 * See the docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) for more info.
 */
class WakeLockService {
  private lock: WakeLockSentinel | null = null;
  private shouldBeActive = false;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.shouldBeActive) {
          this.acquireLock();
        }
      });
    }
  }

  async request(): Promise<void> {
    this.shouldBeActive = true;
    await this.acquireLock();
  }

  async release(): Promise<void> {
    this.shouldBeActive = false;
    if (this.lock) {
      await this.lock.release();
      this.lock = null;
    }
  }

  private async acquireLock(): Promise<void> {
    if (!('wakeLock' in navigator)) return;
    try {
      this.lock = await navigator.wakeLock.request('screen');
    } catch {
      // Wake lock request can fail (e.g. low battery). Silently ignore.
    }
  }
}

export default new WakeLockService();
