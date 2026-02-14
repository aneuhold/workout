import { browser } from '$app/environment';

let isActive = $state(false);
let remainingSeconds = $state(0);
let totalSeconds = $state(0);
let endTime: number = 0;
let interval: ReturnType<typeof setInterval> | null = null;

function clearTimer() {
  if (interval !== null) {
    clearInterval(interval);
    interval = null;
  }
}

function tick() {
  const remaining = Math.ceil((endTime - Date.now()) / 1000);
  if (remaining <= 0) {
    clearTimer();
    isActive = false;
    remainingSeconds = 0;
  } else {
    remainingSeconds = remaining;
  }
}

/**
 * A simple timer store to manage the state of a countdown timer.
 */
export const timerStore = {
  get isActive() {
    return isActive;
  },
  get remainingSeconds() {
    return remainingSeconds;
  },
  get totalSeconds() {
    return totalSeconds;
  },
  start(seconds: number) {
    if (!browser) return;
    clearTimer();
    endTime = Date.now() + seconds * 1000;
    isActive = true;
    remainingSeconds = seconds;
    totalSeconds = seconds;
    interval = setInterval(tick, 1000);
  },
  stop() {
    clearTimer();
    isActive = false;
    remainingSeconds = 0;
    totalSeconds = 0;
  },
  reset() {
    clearTimer();
    isActive = false;
    remainingSeconds = 0;
    totalSeconds = 0;
  }
};
