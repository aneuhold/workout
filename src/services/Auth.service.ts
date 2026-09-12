import {
  type APIResponse,
  APIService,
  type AuthDeleteAccountOutput,
  type AuthValidateUserOutput
} from '@aneuhold/core-ts-api-lib';
import { ProjectName } from '@aneuhold/core-ts-db-lib';
import googleAuthService from '$services/GoogleAuth.service';
import WorkoutAPIService from '$services/WorkoutAPI.service';
import { password } from '$stores/local/password';
import { userConfig } from '$stores/local/userConfig/userConfig';
import { LoginState, loginState } from '$stores/session/loginState';
import LocalData from '$util/LocalData/LocalData';
import { createLogger } from '$util/logging/logger';

/**
 * Auth orchestration singleton. Centralizes login (Google + password),
 * logout, and account deletion so every entry point shares the same
 * teardown path. UI components stay UI-only and surface errors from the
 * returned `APIResponse`.
 */
class AuthService {
  readonly #log = createLogger('AuthService');

  /**
   * Validates a Google ID token and applies the result. Returns the raw
   * response so callers can render their own error UI.
   *
   * @param idToken - The Google-issued ID token JWT.
   */
  async loginWithGoogle(idToken: string): Promise<APIResponse<AuthValidateUserOutput>> {
    loginState.set(LoginState.ProcessingCredentials);
    const response = await APIService.validateUser({
      googleCredentialToken: idToken,
      project: ProjectName.Workout
    });
    this.#applyLoginResult(response);
    return response;
  }

  /**
   * Validates a username/password pair and applies the result. Persists the
   * username to local storage and writes the password to its store so
   * subsequent app launches can prefill the form.
   *
   * @param userName - The username to log in as.
   * @param userPassword - The password to validate.
   */
  async loginWithPassword(
    userName: string,
    userPassword: string
  ): Promise<APIResponse<AuthValidateUserOutput>> {
    void LocalData.setUsername(userName);
    password.set(userPassword);
    loginState.set(LoginState.ProcessingCredentials);
    const response = await APIService.validateUser({
      userName,
      password: userPassword,
      project: ProjectName.Workout
    });
    this.#applyLoginResult(response);
    return response;
  }

  /**
   * Logs out the current user. Network teardown is best-effort — local
   * session is cleared regardless so the user always lands on the login
   * screen.
   */
  async logout(): Promise<void> {
    try {
      await APIService.logout();
    } catch (error) {
      this.#log.warn('APIService.logout failed; continuing local teardown', error);
    }
    await this.#clearLocalSession();
  }

  /**
   * Permanently deletes the authenticated user and every per-user document
   * tied to them, then clears the local session. Returns the response so
   * the caller can render an error if the API call failed.
   */
  async deleteAccount(): Promise<APIResponse<AuthDeleteAccountOutput>> {
    const response = await APIService.deleteAccount();
    if (response.success) {
      await this.#clearLocalSession();
    }
    return response;
  }

  /**
   * Persists tokens, hydrates user state, kicks off the initial data
   * fetch on success. On failure, drops back to `LoggedOut` so the login
   * UI can surface its own error.
   *
   * @param response - The response from `APIService.validateUser`.
   */
  #applyLoginResult(response: APIResponse<AuthValidateUserOutput>): void {
    if (response.success && response.data.userInfo) {
      const { user } = response.data.userInfo;
      const { accessToken, refreshTokenString } = response.data;

      if (accessToken) {
        APIService.setAccessToken(accessToken);
      }
      if (refreshTokenString) {
        APIService.setRefreshTokenString(refreshTokenString);
      }

      userConfig.set({
        userId: user._id,
        username: user.userName,
        accessToken: accessToken ?? null,
        refreshTokenString: refreshTokenString ?? null
      });
      WorkoutAPIService.getInitialDataForLogin();
      loginState.set(LoginState.LoggedIn);
    } else if (!response.success) {
      loginState.set(LoginState.LoggedOut);
    } else {
      this.#log.error('Unexpected response from validateUser', response);
    }
  }

  /**
   * Tears down local session state so the app returns to the login screen.
   * Google sign-out is best-effort — failure does not block local cleanup.
   */
  async #clearLocalSession(): Promise<void> {
    userConfig.clear();
    WorkoutAPIService.reset();
    await LocalData.clearWorkoutMaps();
    loginState.set(LoginState.LoggedOut);
    await googleAuthService.logout();
  }
}

const authService = new AuthService();
export default authService;
