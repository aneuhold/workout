import type {
  AdminOutput,
  APIResponse,
  AuthDeleteAccountOutput,
  AuthValidateUserOutput,
  IAPIBackend,
  ProjectDashboardOutput,
  ProjectWorkoutPrimaryOutput
} from '@aneuhold/core-ts-api-lib';

/**
 * An {@link IAPIBackend} that answers every call with a successful, empty
 * response and never touches the network, so the app runs entirely on its
 * local data.
 */
export default class MockAPIBackend implements IAPIBackend {
  /**
   * Empty, because no request leaves this backend.
   */
  readonly defaultUrl = '';

  authValidateUser(): Promise<APIResponse<AuthValidateUserOutput>> {
    return this.#succeed({});
  }

  authLogout(): Promise<APIResponse<undefined>> {
    return this.#succeed(undefined);
  }

  authDeleteAccount(): Promise<APIResponse<AuthDeleteAccountOutput>> {
    return this.#succeed({});
  }

  projectDashboard(): Promise<APIResponse<ProjectDashboardOutput>> {
    return this.#succeed({});
  }

  admin(): Promise<APIResponse<AdminOutput>> {
    return this.#succeed({});
  }

  projectWorkout(): Promise<APIResponse<ProjectWorkoutPrimaryOutput>> {
    return this.#succeed({});
  }

  setAccessToken(): void {
    // No request carries a token
  }

  setRefreshTokenString(): void {
    // No request carries a token
  }

  setOnTokensRefreshed(): void {
    // Tokens are never refreshed
  }

  setOnAuthExpired(): void {
    // Auth never expires
  }

  getUrl(): string {
    return this.defaultUrl;
  }

  setUrl(): void {
    // No request is sent to any URL
  }

  /**
   * Resolves a successful response carrying `data`.
   *
   * @param data The payload of the response
   */
  #succeed<TData>(data: TData): Promise<APIResponse<TData>> {
    return Promise.resolve({ success: true, errors: [], data });
  }
}
