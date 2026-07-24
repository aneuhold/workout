import { APIService } from '@aneuhold/core-ts-api-lib';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import WebSocketService from '$services/WebSocket.service';
import WorkoutAPIService from '$services/WorkoutAPI.service';
import { userConfig } from '$stores/local/userConfig/userConfig';
import { sessionExpired } from '$stores/session/sessionExpired';
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
      sessionExpired.set(false);
    }

    handleLoginStateChangeForWebSocket(newState);

    set(_loginState);
  }

  // Persist new tokens when GCloudAPIService auto-refreshes on 401.
  APIService.setOnTokensRefreshed((accessToken, refreshTokenString) => {
    userConfig.update((config) => ({ ...config, accessToken, refreshTokenString }));
  });

  APIService.setOnAuthExpired(() => {
    userConfig.clear();
    sessionExpired.set(true);
    setLoginState(LoginState.LoggedOut);
  });

  return {
    subscribe,
    set: (newState: LoginState) => {
      setLoginState(newState);
    },
    get: () => _loginState,
    /**
     * Resolves the initial login state from the now-hydrated `userConfig`.
     * Call once at app startup after `userConfig.hydrate()` resolves.
     */
    init: () => {
      const config = userConfig.get();
      if (browser && config.accessToken) {
        APIService.setAccessToken(config.accessToken);
        if (config.refreshTokenString) {
          APIService.setRefreshTokenString(config.refreshTokenString);
        }
        setLoginState(LoginState.LoggedIn);
        WorkoutAPIService.getInitialDataIfNeeded();
      } else {
        log.info('No access token found, setting login state to LoggedOut');
        setLoginState(LoginState.LoggedOut);
      }
    }
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
          // TODO: Implement this part, probably so it is surgical about what gets added / updated
          // in the associated document map services.
          // WorkoutAPIResponseHandlingService.processWorkoutApiOutput(payload, input, false);
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
