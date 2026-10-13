import {
  APIErrorCode,
  type APIResponse,
  APIService,
  type ProjectWorkoutPrimaryEndpointOptions,
  type ProjectWorkoutPrimaryOutput
} from '@aneuhold/core-ts-api-lib';
import apiActivityService from '$services/ApiActivityService/ApiActivity.service.svelte';
import LoggingService from '$services/LoggingService/Logging.service';
import WebSocketService from '$services/WebSocket.service';
import { currentUser } from '$stores/local/currentUser/currentUser';
import LocalData from '$util/LocalData/LocalData';

/**
 * Applies the output of a get request to app state.
 *
 * @param output The output of the get request
 * @param input The get request that was sent
 */
type WorkoutAPIGetOutputHandler = (
  output: ProjectWorkoutPrimaryOutput,
  input: ProjectWorkoutPrimaryEndpointOptions
) => void;

/**
 * Sends workout API requests one at a time. Writes (insert / update / delete)
 * are queued in order and persisted to {@link LocalData} until each one
 * succeeds or fails permanently. Gets are merged into a single pending get
 * that is sent once no writes are waiting, so a snapshot is never applied
 * over a write the server hasn't seen yet.
 *
 * Failed requests are retried with exponential backoff. Only get output is
 * handed to the output handler.
 */
class WorkoutAPIQueueService {
  static readonly #log = LoggingService.createLogger('WorkoutAPIQueue.service.ts');
  static readonly #maxServerErrorAttempts = 10;
  static readonly #baseRetryDelayMs = 1000;
  static readonly #maxRetryDelayMs = 60_000;

  /**
   * Serializes background persistence so concurrent snapshots can't
   * interleave their writes to the underlying backend.
   *
   * Each time the queue is persisted, the new persistence task is appended to
   * the end of the chain, so the writes happen in order.
   */
  #persistChain: Promise<void> = Promise.resolve();
  #onGetOutput: WorkoutAPIGetOutputHandler | null = null;

  /**
   * In-memory mirror of the persisted queue of writes. The disk copy in
   * {@link LocalData} is for crash recovery only. This array is the source of
   * truth at runtime so {@link enqueueRequest} never blocks on disk I/O.
   */
  #writes: ProjectWorkoutPrimaryEndpointOptions[] = [];
  /**
   * Every get requested since the last successful get, merged together.
   */
  #pendingGet: ProjectWorkoutPrimaryEndpointOptions['get'];
  /**
   * The loop that is currently sending requests, if any.
   */
  #loop: Promise<boolean> | null = null;
  #retryTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Consecutive failed attempts, across requests. Drives the backoff delay.
   */
  #retryAttempt = 0;
  /**
   * Server error attempts for the request at the head of the queue.
   */
  #serverErrorAttempts = 0;
  /**
   * Whether a failed request was removed since the queue was last empty.
   */
  #removedFailedRequest = false;
  /**
   * Counts calls to {@link reset}. `#runLoop` records it when it starts, and
   * {@link hydrate} before reading the stored queue. If it has changed when a
   * response or the stored queue arrives, a reset happened in between, so
   * that result belongs to the previous session. They return without
   * applying it, saving to storage, or scheduling a retry.
   */
  #generation = 0;

  /**
   * Sets the handler that applies the output of each successful get to app
   * state. Call once at startup, before any request is queued.
   *
   * @param onGetOutput Applies get output to app state
   */
  setGetOutputHandler(onGetOutput: WorkoutAPIGetOutputHandler): void {
    this.#onGetOutput = onGetOutput;
  }

  /**
   * Loads the writes in the persisted queue from {@link LocalData}, ahead of
   * anything already queued. For now, a `get` on a stored item is ignored and
   * an item with nothing else is dropped, since every app start already gets
   * all data. Stored gets can be merged into the pending get later if that
   * changes. Does not start sending: the next queued request or
   * {@link skipWaitsAndProcessRequestsNow} does. Call once at app boot, after
   * `LocalData.init()`.
   */
  async hydrate(): Promise<void> {
    const generation = this.#generation;
    const stored = await LocalData.getApiRequestQueue();
    if (generation !== this.#generation) return;
    const storedWrites = stored.flatMap((item) => this.#getWrites(item) ?? []);
    this.#writes = [...storedWrites, ...this.#writes];
    void this.#persistQueue();
  }

  /**
   * Queues a request and starts sending. Returns synchronously: the disk
   * write happens in the background. Insert / update / delete go into the
   * queue as one item, and `get` is merged into the pending get.
   *
   * @param options The API options that describe the desired operation(s)
   */
  enqueueRequest(options: ProjectWorkoutPrimaryEndpointOptions): void {
    if (this.#queueWritesAndMergeGet(options)) {
      void this.#persistQueue();
    }
    void this.skipWaitsAndProcessRequestsNow();
  }

  /**
   * Sends queued requests now, skipping any backoff wait. {@link enqueueRequest}
   * already calls this, so outside callers only need it to retry early. Resolves when the loop stops, either because nothing is left to send or because it
   * is waiting on a retry or a login.
   *
   * If the loop stopped because nothing was left, but work was queued between
   * that check and `#loop` being cleared, another loop is started.
   */
  async skipWaitsAndProcessRequestsNow(): Promise<void> {
    this.#clearRetryTimer();
    if (!this.#loop) {
      const loop = this.#runLoop();
      this.#loop = loop;
      void loop.finally(() => {
        // reset() may have already replaced this loop
        if (this.#loop === loop) this.#loop = null;
      });
    }
    const stoppedWithEmptyQueue = await this.#loop;
    const hasWork = this.#writes.length > 0 || this.#pendingGet !== undefined;
    if (stoppedWithEmptyQueue && this.#loop === null && hasWork) {
      await this.skipWaitsAndProcessRequestsNow();
    }
  }

  /**
   * Clears every queued request and the persisted queue. A request that is
   * already outstanding finishes, but its result is ignored. Resolves once
   * the persisted queue is cleared.
   */
  reset(): Promise<void> {
    this.#generation++;
    this.#clearRetryTimer();
    this.#writes = [];
    this.#pendingGet = undefined;
    this.#loop = null;
    this.#retryAttempt = 0;
    this.#serverErrorAttempts = 0;
    this.#removedFailedRequest = false;
    return this.#persistQueue();
  }

  /**
   * Sends requests until none are left, a retry is scheduled, the device is
   * offline, the user has to log in, or the queue is reset. While offline,
   * nothing is sent or retried until the next
   * {@link skipWaitsAndProcessRequestsNow}, such as on the `online` event. Resolves to `true` when it stopped
   * because nothing was left to send.
   */
  async #runLoop(): Promise<boolean> {
    const generation = this.#generation;
    let sentRequest = false;
    try {
      while (generation === this.#generation) {
        const write = this.#writes.at(0);
        const get = write ? undefined : this.#pendingGet;
        if (!write && !get) {
          if (sentRequest) this.#setActivityStateForEmptyQueue();
          return true;
        }
        if (!navigator.onLine) {
          apiActivityService.setOffline();
          return false;
        }
        if (!currentUser.get().accessToken) {
          apiActivityService.setPending();
          return false;
        }

        apiActivityService.setSyncing();
        sentRequest = true;
        const response = await this.#send(write ?? { get });
        if (generation !== this.#generation) return false;

        if (!response) {
          // A timeout or a failed fetch while the device reports online
          if (navigator.onLine) {
            apiActivityService.setPending();
          } else {
            apiActivityService.setOffline();
          }
          this.#scheduleRetry();
          return false;
        }
        if (response.success) {
          this.#retryAttempt = 0;
          this.#serverErrorAttempts = 0;
          if (write) {
            this.#removeWrite(write);
          } else {
            this.#completeGet(get, response.data);
          }
          continue;
        }

        const { errorCode, errors } = response;
        if (
          errorCode === APIErrorCode.Unauthorized ||
          errorCode === APIErrorCode.InvalidRefreshToken
        ) {
          // The initial fetch after login queues a get, which resumes the queue
          apiActivityService.setPending();
          return false;
        }
        if (this.#shouldRetry(response)) {
          apiActivityService.setPending();
          this.#scheduleRetry();
          return false;
        }
        this.#removeFailedRequest(write, get, errors);
      }
      return false;
    } catch (error) {
      WorkoutAPIQueueService.#log.error(
        'Unexpected error while processing the API request queue',
        error
      );
      apiActivityService.setError();
      return false;
    }
  }

  /**
   * Sends a request. Resolves to `null` when the request never reached the
   * server or timed out.
   *
   * @param options The request to send
   */
  async #send(
    options: ProjectWorkoutPrimaryEndpointOptions
  ): Promise<APIResponse<ProjectWorkoutPrimaryOutput> | null> {
    WorkoutAPIQueueService.#log.info('Processing API request', options);
    let response: APIResponse<ProjectWorkoutPrimaryOutput>;
    try {
      response = await APIService.callWorkoutAPI({
        options,
        socketId: WebSocketService.getSocketId()
      });
    } catch (error) {
      WorkoutAPIQueueService.#log.warn('API request did not reach the server', error);
      return null;
    }
    if (response.success) {
      WorkoutAPIQueueService.#log.info('Successfully processed API request');
    } else {
      const { statusCode, errorCode, errors } = response;
      WorkoutAPIQueueService.#log.warn('API request failed', statusCode, errorCode, errors);
    }
    return response;
  }

  /**
   * Whether a failed request should be retried. A temporary outage is retried
   * without a limit, and any other server error up to
   * {@link WorkoutAPIQueueService.#maxServerErrorAttempts} attempts.
   *
   * @param response The failed response
   */
  #shouldRetry(response: APIResponse<ProjectWorkoutPrimaryOutput>): boolean {
    const { statusCode, errorCode } = response;
    // Temporary conditions that clear on their own, retried without a limit
    const transientStatusCodes: ReadonlySet<number> = new Set([
      // Request Timeout: the server closed a slow connection, not a bad request
      408,
      // Too Many Requests: rate limiting lifts once requests slow down
      429,
      // Bad Gateway: the load balancer couldn't reach an instance, such as mid-deploy
      502,
      // Service Unavailable: no instance can take the request yet, such as during a cold start or deploy
      503,
      // Gateway Timeout: the instance didn't answer the load balancer in time
      504
    ]);
    if (transientStatusCodes.has(statusCode)) return true;
    if (
      errorCode !== APIErrorCode.InternalError &&
      errorCode !== APIErrorCode.InvalidAPIResponseShape
    ) {
      return false;
    }
    this.#serverErrorAttempts++;
    return this.#serverErrorAttempts < WorkoutAPIQueueService.#maxServerErrorAttempts;
  }

  /**
   * Applies a get's output, unless a write was queued while the get was
   * outstanding. In that case the snapshot may not include the write, so it
   * is discarded and the get stays pending to run again after the write.
   *
   * @param get The get that was sent
   * @param output The output of the get
   */
  #completeGet(
    get: ProjectWorkoutPrimaryEndpointOptions['get'],
    output: ProjectWorkoutPrimaryOutput
  ): void {
    if (this.#writes.length > 0) return;
    if (this.#onGetOutput) {
      try {
        this.#onGetOutput(output, { get });
      } catch (error) {
        WorkoutAPIQueueService.#log.error('Failed to apply get output', error);
        this.#removedFailedRequest = true;
      }
    } else {
      WorkoutAPIQueueService.#log.error(
        'No get output handler is set, so the output was not applied.'
      );
    }
    this.#removePendingGet(get);
  }

  /**
   * Removes a request that failed permanently and logs it.
   *
   * @param write The write that failed, if the request was a write
   * @param get The get that failed, if the request was a get
   * @param errors The errors the request failed with
   */
  #removeFailedRequest(
    write: ProjectWorkoutPrimaryEndpointOptions | undefined,
    get: ProjectWorkoutPrimaryEndpointOptions['get'],
    errors: string[]
  ): void {
    WorkoutAPIQueueService.#log.error(
      'Removing API request that failed permanently',
      write ?? { get },
      errors
    );
    if (write) {
      this.#removeWrite(write);
    } else {
      this.#removePendingGet(get);
    }
    this.#retryAttempt = 0;
    this.#serverErrorAttempts = 0;
    this.#removedFailedRequest = true;
    apiActivityService.setError();
  }

  /**
   * Sets the API activity state once the queue is empty: Error if a failed
   * request was removed since the queue was last empty, otherwise Success.
   */
  #setActivityStateForEmptyQueue(): void {
    if (this.#removedFailedRequest) {
      apiActivityService.setError();
    } else {
      apiActivityService.setSuccess();
    }
    this.#removedFailedRequest = false;
  }

  /**
   * Splits a request into its writes, which join the queue as one item, and
   * its get, which is merged into the pending get. Returns whether a write was
   * queued.
   *
   * @param options The request to split
   */
  #queueWritesAndMergeGet(options: ProjectWorkoutPrimaryEndpointOptions): boolean {
    const { get } = options;
    if (get) {
      this.#pendingGet = { ...this.#pendingGet, ...get };
    }
    const writes = this.#getWrites(options);
    if (writes) {
      this.#writes.push(writes);
      return true;
    }
    return false;
  }

  /**
   * Returns a copy of a request without its `get`, or `undefined` when it has
   * no insert, update, or delete.
   *
   * @param options The request to take the writes from
   */
  #getWrites(
    options: ProjectWorkoutPrimaryEndpointOptions
  ): ProjectWorkoutPrimaryEndpointOptions | undefined {
    const { get: _get, ...writes } = options;
    return writes.insert || writes.update || writes.delete ? writes : undefined;
  }

  /**
   * Removes a write by identity, since the queue may have changed while it was
   * outstanding.
   *
   * @param write The write to remove
   */
  #removeWrite(write: ProjectWorkoutPrimaryEndpointOptions): void {
    const index = this.#writes.indexOf(write);
    if (index !== -1) {
      this.#writes.splice(index, 1);
      void this.#persistQueue();
    }
  }

  /**
   * Clears the pending get if it is still the get that was sent. A get merged
   * in while that one was outstanding replaced the pending get, so it stays
   * pending to run next.
   *
   * @param get The get that was sent
   */
  #removePendingGet(get: ProjectWorkoutPrimaryEndpointOptions['get']): void {
    if (this.#pendingGet === get) {
      this.#pendingGet = undefined;
    }
  }

  /**
   * Schedules the next attempt with exponential backoff and jitter, capped at
   * {@link WorkoutAPIQueueService.#maxRetryDelayMs}.
   */
  #scheduleRetry(): void {
    const cappedDelay = Math.min(
      WorkoutAPIQueueService.#maxRetryDelayMs,
      WorkoutAPIQueueService.#baseRetryDelayMs * 2 ** this.#retryAttempt
    );
    const delay = cappedDelay * (0.5 + Math.random() * 0.5);
    this.#retryAttempt++;
    this.#clearRetryTimer();
    this.#retryTimer = setTimeout(() => {
      this.#retryTimer = null;
      void this.skipWaitsAndProcessRequestsNow();
    }, delay);
  }

  /**
   * Cancels the scheduled retry, if there is one.
   */
  #clearRetryTimer(): void {
    if (this.#retryTimer !== null) {
      clearTimeout(this.#retryTimer);
      this.#retryTimer = null;
    }
  }

  /**
   * Saves a snapshot of the writes to {@link LocalData}, after every earlier
   * save has finished.
   */
  #persistQueue(): Promise<void> {
    const snapshot = [...this.#writes];
    this.#persistChain = this.#persistChain
      .then(() => LocalData.setApiRequestQueue(snapshot))
      .catch((err: unknown) => {
        WorkoutAPIQueueService.#log.error('Failed to persist api request queue', err);
      });
    return this.#persistChain;
  }
}

const workoutAPIQueueService = new WorkoutAPIQueueService();

export default workoutAPIQueueService;
