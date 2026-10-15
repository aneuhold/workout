import { APIService } from '@aneuhold/core-ts-api-lib';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import LoggingService from '$services/LoggingService/Logging.service';
import purchaseService from '$services/PurchaseService/Purchase.service';
import WebSocketService from '$services/WebSocket.service';
import WorkoutAPIService from '$services/WorkoutAPIService/WorkoutAPI.service';
import { currentUser } from '$stores/local/currentUser/currentUser';
import { sessionExpired } from '$stores/session/sessionExpired';
import { createLazyModuleGetter } from '$util/createLazyModuleGetter';

const log = LoggingService.createLogger('loginState.ts');

export enum LoginState {
  Initializing = 'Initializing',
  LoggedOut = 'LoggedOut',
  ProcessingCredentials = 'ProcessingCredentials',
  LoggedIn = 'LoggedIn'
}

// Sentry dynamic import to avoid loading it during tests. This also avoids top-level await
// which is broken in Safari as of 11/2025.
const getSentry = createLazyModuleGetter(
  import.meta.env.MODE !== 'test' ? import('@sentry/sveltekit') : undefined
);

function createLoginStateStore() {
  let _loginState = LoginState.Initializing;
  const { subscribe, set } = writable<LoginState>(_loginState);
  const handleLoginStateChangeForWebSocket = createHandleLoginStateChangeForWebSocket();

  // Basic operations that happen whenever the login state is set
  // no matter how
  function setLoginState(newState: LoginState) {
    _loginState = newState;
    if (newState === LoginState.LoggedIn) {
      const { username, userId } = currentUser.get();
      getSentry()?.setUser({ username });
      sessionExpired.set(false);
      void purchaseService.init(userId);
    }

    handleLoginStateChangeForWebSocket(newState);

    set(_loginState);
  }

  // Persist new tokens when GCloudAPIService auto-refreshes on 401.
  APIService.setOnTokensRefreshed((accessToken, refreshTokenString) => {
    currentUser.update((user) => ({ ...user, accessToken, refreshTokenString }));
  });

  APIService.setOnAuthExpired(() => {
    // Keeps the userId so a re-login can tell whether it is the same user, and
    // keep their queued changes.
    currentUser.update((user) => ({ ...user, accessToken: null, refreshTokenString: null }));
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
     * Resolves the initial login state from the now-hydrated `currentUser`.
     * Call once at app startup after `currentUser.hydrate()` resolves.
     */
    init: () => {
      const user = currentUser.get();
      if (browser && user.accessToken) {
        APIService.setAccessToken(user.accessToken);
        if (user.refreshTokenString) {
          APIService.setRefreshTokenString(user.refreshTokenString);
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
          // apiResponseHandlingOrder.forEach((service) => service.handleApiOutput(payload, input));
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
