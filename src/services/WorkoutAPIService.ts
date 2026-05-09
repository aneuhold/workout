import {
  APIService,
  type ProjectWorkoutPrimaryEndpointOptions,
  type ProjectWorkoutPrimaryOutput
} from '@aneuhold/core-ts-api-lib';
import apiActivityService from '$services/ApiActivityService/ApiActivityService.svelte';
import WebSocketService from '$services/WebSocketService';
import { userConfig } from '$stores/local/userConfig/userConfig';
import LocalData from '$util/LocalData/LocalData';
import { createLogger } from '$util/logging/logger';
import { PerfMark } from '$util/perfMarks';
import WorkoutAPIResponseHandlingService from './WorkoutAPIResponseHandlingService';

const log = createLogger('WorkoutAPIService.ts');

const SECONDS_TO_WAIT_BEFORE_FETCHING_INITIAL_DATA = 10;

export default class WorkoutAPIService {
  static lastInitialDataFetchTime: number | null = null;
  private static processingRequestQueue = false;
  /**
   * Determines if the initial hydration performance marker has been set yet.
   */
  private static initialHydrationMarked = false;

  /**
   * In-memory mirror of the persisted queue. The disk copy in
   * {@link LocalData} is for crash recovery only — this array is the
   * source of truth at runtime so callers of {@link queryApi} never
   * block on disk I/O.
   */
  private static inMemoryApiRequestQueue: ProjectWorkoutPrimaryEndpointOptions[] = [];
  private static inMemoryCurrentApiRequest: ProjectWorkoutPrimaryEndpointOptions | undefined;

  /**
   * Serializes background persistence so concurrent snapshots can't
   * interleave their writes to the underlying backend.
   *
   * Basically, each time we persist, we append the new persistence task to the end of the chain.
   * That way it happens in order. Kind of clever actually.
   */
  private static persistChain: Promise<void> = Promise.resolve();

  /**
   * Loads any persisted queue and current request from {@link LocalData}
   * into the in-memory mirror. Call once at app boot, after
   * `LocalData.init()`.
   */
  static async hydrate(): Promise<void> {
    const [queue, current] = await Promise.all([
      LocalData.getApiRequestQueue(),
      LocalData.getCurrentApiRequest()
    ]);
    this.inMemoryApiRequestQueue = queue;
    this.inMemoryCurrentApiRequest = current;
  }

  /**
   * Inserts, deletes, updates or gets items in the backend.
   *
   * Returns synchronously: the request is appended to the in-memory
   * queue immediately and the disk write happens in the background. If
   * an API request is already being processed, this one waits its turn
   * in the queue instead of issuing a parallel network call.
   *
   * @param apiOptions The API options that describe the desired operation(s).
   */
  static queryApi(apiOptions: ProjectWorkoutPrimaryEndpointOptions): void {
    this.inMemoryApiRequestQueue.push(apiOptions);
    void this.persistQueue();

    if (!this.processingRequestQueue && this.inMemoryApiRequestQueue.length > 0) {
      void this.processApiRequests();
    }
  }

  /**
   * Fetches the initial data if
   * - the app is visible and wasn't before
   * - the user is logged in
   * - there is no task queue item
   * - the last initial data fetch was more than {@link SECONDS_TO_WAIT_BEFORE_FETCHING_INITIAL_DATA}
   * ago or it hasn't been fetched yet.
   */
  static getInitialDataIfNeeded(): void {
    if (!userConfig.get().accessToken || this.inMemoryApiRequestQueue.length !== 0) return;

    if (!this.lastInitialDataFetchTime) {
      this.getInitialData();
    } else if (
      this.lastInitialDataFetchTime <
      Date.now() - SECONDS_TO_WAIT_BEFORE_FETCHING_INITIAL_DATA * 1000
    ) {
      log.info(
        'Fetching initial data because it has been more than',
        SECONDS_TO_WAIT_BEFORE_FETCHING_INITIAL_DATA,
        'seconds since the last fetch and the user reopened the app.'
      );
      this.getInitialData();
    }
  }

  /**
   * Gets initial data as if the user is just logging in.
   */
  static getInitialDataForLogin(): void {
    this.lastInitialDataFetchTime = null;
    this.getInitialData();
  }

  /**
   * Gets the initial data from the backend and sets the stores accordingly.
   */
  static getInitialData(): void {
    log.info('Getting initial data...');
    this.lastInitialDataFetchTime = Date.now();

    this.queryApi({
      get: {
        mesocycles: { all: true },
        microcycles: { all: true },
        sessions: { all: true },
        sessionExercises: { all: true },
        sets: { all: true },
        exercises: { all: true },
        exerciseCalibrations: { all: true },
        exerciseCTOs: { all: true },
        muscleGroups: { all: true },
        equipmentTypes: { all: true },
        muscleGroupVolumeCTOs: { all: true }
      }
    });
  }

  /**
   * Clears in-memory state and the persisted copy. Call on logout so a
   * different user signing in on the same device doesn't inherit the
   * previous session's queue.
   */
  static reset(): void {
    this.inMemoryApiRequestQueue = [];
    this.inMemoryCurrentApiRequest = undefined;
    this.lastInitialDataFetchTime = null;
    this.initialHydrationMarked = false;
    this.processingRequestQueue = false;
    void this.persistQueue();
    void this.persistCurrentRequest();
  }

  /**
   * Starts processing the currently queued API requests. Each result is
   * combined together and processed at the end.
   */
  private static async processApiRequests(): Promise<void> {
    this.processingRequestQueue = true;
    apiActivityService.setSyncing();
    let combinedOutput: ProjectWorkoutPrimaryOutput = {};
    const combinedInput: ProjectWorkoutPrimaryEndpointOptions = {};
    let hadError = false;
    while (this.inMemoryApiRequestQueue.length > 0) {
      const currentRequest = this.inMemoryApiRequestQueue.shift();
      this.inMemoryCurrentApiRequest = currentRequest;
      void this.persistQueue();
      void this.persistCurrentRequest();
      if (!currentRequest) {
        log.error('No current API request to process, something went wrong!!');
        break;
      }
      if (currentRequest.get) {
        combinedInput.get = { ...combinedInput.get, ...currentRequest.get };
      }
      const result = await this.callWorkoutAPI(currentRequest);
      if (result) {
        combinedOutput = { ...combinedOutput, ...result };
      } else {
        hadError = true;
      }
      if (result && this.inMemoryApiRequestQueue.length === 0) {
        // Only set the stores if there are no more requests to process. This
        // should help prevent the stores from being set to an old value if
        // the user refreshes the page while the task queue is being processed.
        WorkoutAPIResponseHandlingService.processWorkoutApiOutput(combinedOutput, combinedInput);
        if (!this.initialHydrationMarked && combinedInput.get?.mesocycles?.all) {
          this.initialHydrationMarked = true;
          performance.mark(PerfMark.HydrationNetworkComplete);
        }
      } else {
        // If there was an error, add the task back to the queue and try again
        // Save this for later to ensure there is no infinite loop
        // this.unshiftTaskQueueItem(LocalData.currentTaskQueueItem);
      }
    }
    this.processingRequestQueue = false;
    if (hadError) {
      apiActivityService.setError();
    } else {
      apiActivityService.setSuccess();
    }
  }

  private static async callWorkoutAPI(
    input: ProjectWorkoutPrimaryEndpointOptions
  ): Promise<ProjectWorkoutPrimaryOutput | null> {
    log.info('Processing API request', input);
    const result = await APIService.callWorkoutAPI({
      options: input,
      socketId: WebSocketService.getSocketId()
    });
    if (result.success) {
      log.info('Successfully processed API request', input);
      return result.data;
    } else {
      log.error('Error processing API request', input, result);
      return null;
    }
  }

  private static persistQueue(): Promise<void> {
    const snapshot = [...this.inMemoryApiRequestQueue];
    this.persistChain = this.persistChain
      .then(() => LocalData.setApiRequestQueue(snapshot))
      .catch((err: unknown) => {
        log.error('Failed to persist api request queue', err);
      });
    return this.persistChain;
  }

  private static persistCurrentRequest(): Promise<void> {
    const snapshot = this.inMemoryCurrentApiRequest;
    this.persistChain = this.persistChain
      .then(() => LocalData.setCurrentApiRequest(snapshot))
      .catch((err: unknown) => {
        log.error('Failed to persist current api request', err);
      });
    return this.persistChain;
  }
}
