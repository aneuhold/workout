import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import WebSocketService from '$services/WebSocketService';
import DashboardAPIResponseHandlingService from '$util/api/DashboardAPIResponseHandlingService';
import DashboardAPIService from '$util/api/DashboardAPIService';
import { createLazyModuleGetter } from '$util/createLazyModuleGetter';
import LocalData from '$util/LocalData/LocalData';
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
      getSentry()?.setUser({ username: LocalData.username });
    }

    handleLoginStateChangeForWebSocket(newState);

    set(_loginState);
  }

  // Determine initial login state based on persisted API key.
  if (browser && LocalData.apiKey && LocalData.apiKey !== '') {
    setLoginState(LoginState.LoggedIn);
    DashboardAPIService.getInitialDataIfNeeded();
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
          DashboardAPIResponseHandlingService.processDashboardApiOutput(payload, false);
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
