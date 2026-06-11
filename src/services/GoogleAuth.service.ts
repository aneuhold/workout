import { GOOGLE_CLIENT_ID } from '@aneuhold/core-ts-db-lib';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { createLogger } from '$util/logging/logger';

const log = createLogger('GoogleAuthService');

/**
 * Error code the capgo plugin uses when the user dismisses the sign-in UI.
 * See `SocialLoginErrorCode` in the plugin's
 * [definitions.ts](https://github.com/Cap-go/capacitor-social-login/blob/main/src/definitions.ts).
 */
const USER_CANCELLED_CODE = 'USER_CANCELLED';

/**
 * Google Sign-In service backed by `@capgo/capacitor-social-login`.
 * Same code path on web (OAuth2 popup) and native (Credential Manager / Google Sign-In SDK).
 * Returns the Google-signed ID token JWT used by `APIService.validateUser`.
 */
class GoogleAuthService {
  private initPromise: Promise<void> | undefined;

  /**
   * Idempotent initialize. Safe to call multiple times; only runs once on
   * success. On failure the cached promise is cleared so the next call retries
   * — without this, a single transient init error would brick sign-in for the
   * rest of the session.
   */
  init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = SocialLogin.initialize({
        google: {
          webClientId: GOOGLE_CLIENT_ID,
          mode: 'online'
        }
      }).catch((e: unknown) => {
        this.initPromise = undefined;
        throw e;
      });
    }
    return this.initPromise;
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
        log.error('Unexpected offline response from Google sign-in', result);
        throw new Error(`Unexpected Google sign-in response type: ${result.responseType}`);
      }
      return result.idToken;
    } catch (e) {
      if (isUserCancelled(e)) {
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
      log.warn('Google logout failed', e);
    }
  }
}

const isUserCancelled = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && 'code' in e && e.code === USER_CANCELLED_CODE;

export default new GoogleAuthService();
