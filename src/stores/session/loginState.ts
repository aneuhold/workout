import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import WebSocketService from '$services/WebSocketService';
import { userConfig } from '$stores/local/userConfig/userConfig';
import WorkoutAPIResponseHandlingService from '$util/api/WorkoutAPIResponseHandlingService';
import WorkoutAPIService from '$util/api/WorkoutAPIService';
import { createLazyModuleGetter } from '$util/createLazyModuleGetter';
import { createLogger } from '$util/logging/logger';

const log = createLogger('loginState.ts');

export enum LoginState {
  Initializing = 'Initializing',
  LoggedOut = 'LoggedOut',
  ProcessingCredentials = 'ProcessingCredentials',
  LoggedIn = 'LoggedIn'
}

// Sentry dynamic import to avoid loading it during tests. This also avoids top-level await
// which is broken in Safari as of 11/2025.
const getSentry = createLazyModuleGetter(
  !process.env.VITEST ? import('@sentry/sveltekit') : undefined
);

function createLoginStateStore() {
  let _loginState = LoginState.Initializing;
  const { subscribe, set } = writable<LoginState>(_loginState);
  const handleLoginStateChangeForWebSocket = createHandleLoginStateChangeForWebSocket();

  function setLoginState(newState: LoginState) {
    _loginState = newState;
    // Add the Sentry info for the user here
    if (newState === LoginState.LoggedIn) {
      getSentry()?.setUser({ username: userConfig.get().username });
    }

    handleLoginStateChangeForWebSocket(newState);

    set(_loginState);
  }

  // Determine initial login state based on persisted API key in userConfig.
  if (browser && userConfig.get().apiKey) {
    setLoginState(LoginState.LoggedIn);
    WorkoutAPIService.getInitialDataIfNeeded();
  } else {
    log.info('No API key found, setting login state to LoggedOut');
    setLoginState(LoginState.LoggedOut);
  }

  return {
    subscribe,
    set: (newState: LoginState) => {
      setLoginState(newState);
    },
    get: () => _loginState
  };
}

/**
 * Creates the function that handles changes to the login state for WebSocket purposes.
 *
 * This handles it's own state.
 */
function createHandleLoginStateChangeForWebSocket(): (newLoginState: LoginState) => void {
  let subscribedToWebSocket = false;

  return (newLoginState: LoginState) => {
    if (newLoginState === LoginState.LoggedIn) {
      // Subscribe to server push updates if we're not already subscribed.
      if (!subscribedToWebSocket) {
        WebSocketService.subscribeToRootPostResult((payload) => {
          log.info('Received WebSocket payload:', payload);
          WorkoutAPIResponseHandlingService.processWorkoutApiOutput(payload, false);
        });
        subscribedToWebSocket = true;
      } else {
        log.warn('Already subscribed to WebSocket, not subscribing again');
      }
    } else if (newLoginState === LoginState.LoggedOut) {
      WebSocketService.disconnect();
      subscribedToWebSocket = false;
    }
  };
}

/**
 * The state of login for the current user.
 */
export const loginState = createLoginStateStore();
