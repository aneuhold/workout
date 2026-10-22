import type { UUID } from 'crypto';

/**
 * The signed-in user and the credentials the app keeps for them.
 */
export type CurrentUser = {
  userId: UUID;
  username: string;
  /** Password from the last password login, used to prefill the login form. */
  password: string;
  /** JWT access token for authenticating API requests. */
  accessToken: string | null;
  /** Raw refresh token string for automatic token refresh. */
  refreshTokenString: string | null;
};
