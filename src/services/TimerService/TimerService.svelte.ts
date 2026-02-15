import { browser } from '$app/environment';
import wakeLockService from '$services/WakeLockService';
import timerAudioService from './TimerAudioService';

/**
 * A countdown timer service that manages reactive state using Svelte 5 runes.
 * Call {@link init} once from the root layout to wire up audio cues and wake lock.
 */
class TimerService {
  #isActive = $state(false);
  #remainingSeconds = $state(0);
  #totalSeconds = $state(0);
  #endTime: number = 0;
  #interval: ReturnType<typeof setInterval> | null = null;
  #isPaused = $state(false);
  #initialized = false;

  get isActive() {
    return this.#isActive;
  }

  get remainingSeconds() {
    return this.#remainingSeconds;
  }

  get totalSeconds() {
    return this.#totalSeconds;
  }

  get isPaused() {
    return this.#isPaused;
  }

  /**
   * Initializes persistent reactive effects for audio cues and screen wake
   * lock. Safe to call multiple times — only the first call sets up effects.
   */
  init(): void {
    if (this.#initialized) return;
    this.#initialized = true;

    let previousRemaining: number | null = null;
    let previousActive = false;

    // Countdown beeps & completion tone
    $effect.root(() => {
      $effect(() => {
        const remaining = this.#remainingSeconds;
        const active = this.#isActive;

        // Beep for last 5 seconds (5, 4, 3, 2, 1)
        if (
          active &&
          remaining >= 1 &&
          remaining <= 5 &&
          previousRemaining !== null &&
          remaining !== previousRemaining
        ) {
          timerAudioService.playCountdownBeep();
        }

        // Completion tone: was active, now inactive, remaining hit 0
        if (previousActive && !active && remaining === 0 && previousRemaining !== null) {
          timerAudioService.playCompletionTone();
        }

        previousRemaining = remaining;
        previousActive = active;
      });
    });

    // Wake lock
    $effect.root(() => {
      $effect(() => {
        if (this.#isActive) {
          wakeLockService.request();
        } else {
          wakeLockService.release();
        }
      });
    });
  }

  /**
   * Starts the countdown timer for the given number of seconds.
   *
   * @param seconds The duration to count down from.
   */
  start(seconds: number) {
    if (!browser) return;
    this.#clearTimer();
    this.#endTime = Date.now() + seconds * 1000;
    this.#isActive = true;
    this.#isPaused = false;
    this.#remainingSeconds = seconds;
    this.#totalSeconds = seconds;
    this.#interval = setInterval(() => this.#tick(), 1000);
  }

  /** Pauses the timer, preserving remaining time. */
  pause() {
    if (!this.#isActive || this.#isPaused) return;
    this.#clearTimer();
    this.#isPaused = true;
  }

  /** Resumes a paused timer. */
  resume() {
    if (!this.#isActive || !this.#isPaused) return;
    this.#endTime = Date.now() + this.#remainingSeconds * 1000;
    this.#interval = setInterval(() => this.#tick(), 1000);
    this.#isPaused = false;
  }

  /** Stops the timer and resets all state. */
  stop() {
    this.#clearTimer();
    this.#isActive = false;
    this.#isPaused = false;
    this.#remainingSeconds = 0;
    this.#totalSeconds = 0;
  }

  /** Resets the timer and clears all state. */
  reset() {
    this.#clearTimer();
    this.#isActive = false;
    this.#isPaused = false;
    this.#remainingSeconds = 0;
    this.#totalSeconds = 0;
  }

  #clearTimer() {
    if (this.#interval !== null) {
      clearInterval(this.#interval);
      this.#interval = null;
    }
  }

  #tick() {
    const remaining = Math.ceil((this.#endTime - Date.now()) / 1000);
    if (remaining <= 0) {
      this.#clearTimer();
      this.#isActive = false;
      this.#remainingSeconds = 0;
    } else {
      this.#remainingSeconds = remaining;
    }
  }
}

export default new TimerService();
