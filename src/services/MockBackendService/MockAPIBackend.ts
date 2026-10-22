import type {
  AdminOutput,
  APIErrorCode,
  APIResponse,
  AuthDeleteAccountOutput,
  AuthValidateUserOutput,
  IAPIBackend,
  ProjectDashboardOutput,
  ProjectWorkoutPrimaryEndpointOptions,
  ProjectWorkoutPrimaryInput,
  ProjectWorkoutPrimaryOutput
} from '@aneuhold/core-ts-api-lib';

/**
 * An {@link IAPIBackend} that answers every call with a successful, empty
 * response and never touches the network, so the app runs entirely on its
 * local data. Workout responses can be queued ahead of time, and every
 * workout request is recorded.
 */
export default class MockAPIBackend implements IAPIBackend {
  /**
   * Empty, because no request leaves this backend.
   */
  readonly defaultUrl = '';

  #queuedWorkoutApiResponses: (
    | APIResponse<ProjectWorkoutPrimaryOutput>
    | Promise<APIResponse<ProjectWorkoutPrimaryOutput>>
    | Error
  )[] = [];
  #sentWorkoutApiRequests: ProjectWorkoutPrimaryEndpointOptions[] = [];

  authValidateUser(): Promise<APIResponse<AuthValidateUserOutput>> {
    return this.#createResolvedSuccessResponse({});
  }

  authLogout(): Promise<APIResponse<undefined>> {
    return this.#createResolvedSuccessResponse(undefined);
  }

  authDeleteAccount(): Promise<APIResponse<AuthDeleteAccountOutput>> {
    return this.#createResolvedSuccessResponse({});
  }

  projectDashboard(): Promise<APIResponse<ProjectDashboardOutput>> {
    return this.#createResolvedSuccessResponse({});
  }

  admin(): Promise<APIResponse<AdminOutput>> {
    return this.#createResolvedSuccessResponse({});
  }

  projectWorkout(
    input: ProjectWorkoutPrimaryInput
  ): Promise<APIResponse<ProjectWorkoutPrimaryOutput>> {
    this.#sentWorkoutApiRequests.push(input.options);
    const response =
      this.#queuedWorkoutApiResponses.shift() ?? MockAPIBackend.createWorkoutApiSuccessResponse();
    if (response instanceof Error) return Promise.reject(response);
    return Promise.resolve(response);
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
   * Creates a successful workout response.
   *
   * @param data The output of the request
   */
  static createWorkoutApiSuccessResponse(
    data: ProjectWorkoutPrimaryOutput = {}
  ): APIResponse<ProjectWorkoutPrimaryOutput> {
    return MockAPIBackend.#createSuccessResponse(data);
  }

  /**
   * Creates a failed workout response.
   *
   * @param errorCode The failure the response names
   * @param statusCode The HTTP status the response is sent with
   */
  static createWorkoutApiFailureResponse(
    errorCode: APIErrorCode,
    statusCode: number
  ): APIResponse<ProjectWorkoutPrimaryOutput> {
    return { success: false, errors: ['Request failed'], data: {}, statusCode, errorCode };
  }

  /**
   * Creates a successful response carrying `data`.
   *
   * @param data The payload of the response
   */
  static #createSuccessResponse<TData>(data: TData): APIResponse<TData> {
    return { success: true, errors: [], data, statusCode: 200 };
  }

  /**
   * The options of every workout request, in the order they were sent.
   */
  get sentWorkoutApiRequests(): readonly ProjectWorkoutPrimaryEndpointOptions[] {
    return this.#sentWorkoutApiRequests;
  }

  /**
   * Queues the responses for the next workout requests, in order. Once they
   * run out, every request succeeds with empty output.
   *
   * @param responses The responses, in the order the requests are sent. A
   *   promise resolves whenever the test resolves it, and an `Error` rejects
   *   the request the way a network failure does.
   */
  queueWorkoutApiResponses(
    ...responses: (
      | APIResponse<ProjectWorkoutPrimaryOutput>
      | Promise<APIResponse<ProjectWorkoutPrimaryOutput>>
      | Error
    )[]
  ): void {
    this.#queuedWorkoutApiResponses.push(...responses);
  }

  /**
   * Resolves a successful response carrying `data`.
   *
   * @param data The payload of the response
   */
  #createResolvedSuccessResponse<TData>(data: TData): Promise<APIResponse<TData>> {
    return Promise.resolve(MockAPIBackend.#createSuccessResponse(data));
  }
}
