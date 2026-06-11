export enum ApiActivityState {
  Idle = 'idle',
  Syncing = 'syncing',
  Success = 'success',
  Error = 'error'
}

/**
 * Singleton service that tracks the current state of API activity so the UI
 * can display a sync indicator. Uses Svelte 5 runes for reactivity.
 */
class ApiActivityService {
  #state: ApiActivityState = $state(ApiActivityState.Idle);
  #timeout: ReturnType<typeof setTimeout> | null = null;

  get state() {
    return this.#state;
  }

  setSyncing() {
    this.#clearTimeout();
    this.#state = ApiActivityState.Syncing;
  }

  setSuccess() {
    this.#clearTimeout();
    this.#state = ApiActivityState.Success;
    this.#timeout = setTimeout(() => {
      this.#state = ApiActivityState.Idle;
    }, 1500);
  }

  setError() {
    this.#clearTimeout();
    this.#state = ApiActivityState.Error;
    this.#timeout = setTimeout(() => {
      this.#state = ApiActivityState.Idle;
    }, 3000);
  }

  setIdle() {
    this.#clearTimeout();
    this.#state = ApiActivityState.Idle;
  }

  #clearTimeout() {
    if (this.#timeout !== null) {
      clearTimeout(this.#timeout);
      this.#timeout = null;
    }
  }
}

export default new ApiActivityService();
