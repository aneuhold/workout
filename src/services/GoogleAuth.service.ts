import { GOOGLE_CLIENT_ID } from '@aneuhold/core-ts-db-lib';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { createLogger } from '$util/logging/logger';

/**
 * Google Sign-In service backed by `@capgo/capacitor-social-login`.
 * Same code path on web (OAuth2 popup) and native (Credential Manager / Google Sign-In SDK).
 * Returns the Google-signed ID token JWT used by `APIService.validateUser`.
 */
class GoogleAuthService {
  /**
   * Error code the capgo plugin uses when the user dismisses the sign-in UI.
   * See `SocialLoginErrorCode` in the plugin's
   * [definitions.ts](https://github.com/Cap-go/capacitor-social-login/blob/main/src/definitions.ts).
   */
  static readonly #userCancelledCode = 'USER_CANCELLED';

  readonly #log = createLogger('GoogleAuthService');

  #initPromise: Promise<void> | undefined;

  /**
   * Idempotent initialize. Safe to call multiple times; only runs once on
   * success. On failure the cached promise is cleared so the next call retries
   * — without this, a single transient init error would brick sign-in for the
   * rest of the session.
   */
  init(): Promise<void> {
    if (!this.#initPromise) {
      this.#initPromise = SocialLogin.initialize({
        google: {
          webClientId: GOOGLE_CLIENT_ID,
          mode: 'online'
        }
      }).catch((e: unknown) => {
        this.#initPromise = undefined;
        throw e;
      });
    }
    return this.#initPromise;
  }

  /**
   * Triggers the Google sign-in flow and returns the ID token JWT.
   * Returns `null` only when the user cancels the popup / dialog.
   * Throws on every other failure (network, misconfiguration, unexpected
   * response shape) so callers can surface an error to the user.
   */
  async signIn(): Promise<string | null> {
    await this.init();
    try {
      const { result } = await SocialLogin.login({
        provider: 'google',
        options: {}
      });
      if (result.responseType !== 'online') {
        this.#log.error('Unexpected offline response from Google sign-in', result);
        throw new Error(`Unexpected Google sign-in response type: ${result.responseType}`);
      }
      return result.idToken;
    } catch (e) {
      if (this.#isUserCancelled(e)) {
        return null;
      }
      throw e;
    }
  }

  /**
   * Logs out of Google. No-op if the user never signed in.
   */
  async logout(): Promise<void> {
    await this.init();
    try {
      await SocialLogin.logout({ provider: 'google' });
    } catch (e) {
      this.#log.warn('Google logout failed', e);
    }
  }

  /**
   * Whether the given error is the plugin's "user dismissed the sign-in UI"
   * error rather than a genuine failure.
   *
   * @param e - The error thrown by the social-login plugin.
   */
  #isUserCancelled(e: unknown): boolean {
    return (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      e.code === GoogleAuthService.#userCancelledCode
    );
  }
}

const googleAuthService = new GoogleAuthService();
export default googleAuthService;
