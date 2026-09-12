import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';

/**
 * Keeps the screen awake while the timer runs. On native platforms this
 * delegates to `@capacitor-community/keep-awake`; on web it uses the
 * [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
 * and silently no-ops if the browser doesn't support it.
 */
class WakeLockService {
  #lock: WakeLockSentinel | null = null;
  #shouldBeActive = false;

  constructor() {
    if (typeof document !== 'undefined' && !this.#isNative) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.#shouldBeActive) {
          this.#acquireLock();
        }
      });
    }
  }

  async request(): Promise<void> {
    this.#shouldBeActive = true;
    await this.#acquireLock();
  }

  async release(): Promise<void> {
    this.#shouldBeActive = false;
    if (this.#isNative) {
      await KeepAwake.allowSleep();
      return;
    }
    if (this.#lock) {
      await this.#lock.release();
      this.#lock = null;
    }
  }

  get #isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  async #acquireLock(): Promise<void> {
    if (this.#isNative) {
      await KeepAwake.keepAwake();
      return;
    }
    if (!('wakeLock' in navigator)) return;
    try {
      this.#lock = await navigator.wakeLock.request('screen');
    } catch {
      // Wake lock request can fail (e.g. low battery). Silently ignore.
    }
  }
}

const wakeLockService = new WakeLockService();
export default wakeLockService;
