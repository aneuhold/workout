import type {
  ProjectWorkoutPrimaryEndpointOptions,
  ProjectWorkoutPrimaryOutput
} from '@aneuhold/core-ts-api-lib';
import type AbstractDocumentMapStoreService from '$services/DocumentMapStoreService/AbstractDocumentMapStore.service';
import LoggingService from '$services/LoggingService/Logging.service';
import updateCheckService from '$services/UpdateCheck.service.svelte';
import { userConfig } from '$stores/local/userConfig/userConfig';
import { PerfMark } from '$util/perfMarks';
import workoutAPIQueueService from './WorkoutAPIQueue.service';

export default class WorkoutAPIService {
  static readonly #log = LoggingService.createLogger('WorkoutAPIService.ts');

  static readonly #secondsToWaitBeforeFetchingInitialData = 10;

  static lastInitialDataFetchTime: number | null = null;
  /**
   * Determines if the initial hydration performance marker has been set yet.
   */
  static #initialHydrationMarked = false;
  /**
   * The document map services that handle API output, in the order in which
   * they are executed.
   */
  static #apiOutputHandlers: AbstractDocumentMapStoreService[] = [];

  static {
    workoutAPIQueueService.setGetOutputHandler((output, input) => {
      this.#handleOutput(output, input);
      if (!this.#initialHydrationMarked && input.get?.mesocycles?.all) {
        this.#initialHydrationMarked = true;
        performance.mark(PerfMark.HydrationNetworkComplete);
      }
    });
  }

  /**
   * Loads any persisted queue from `LocalData` without sending it. The
   * initial data fetch after login sends it. Call once at app boot, after
   * `LocalData.init()`.
   */
  static async hydrate(): Promise<void> {
    await workoutAPIQueueService.hydrate();
  }

  /**
   * Sets the document map services that apply the output of each get request
   * to app state. Call once at app startup,
   * before any request is queued.
   *
   * @param apiOutputHandlers The services that handle API output, in the order
   *   in which they are executed
   */
  static setApiOutputHandlers(apiOutputHandlers: AbstractDocumentMapStoreService[]): void {
    this.#apiOutputHandlers = apiOutputHandlers;
  }

  /**
   * Inserts, deletes, updates or gets items in the backend.
   *
   * Returns synchronously: writes join the queue immediately and the disk
   * write happens in the background. Gets are merged and sent once no writes
   * are waiting, and only get output is applied to the API output handlers.
   *
   * @param apiOptions The API options that describe the desired operation(s).
   */
  static queryApi(apiOptions: ProjectWorkoutPrimaryEndpointOptions): void {
    workoutAPIQueueService.enqueueRequest(apiOptions);
  }

  /**
   * Sends queued requests now, skipping any backoff wait. Queued requests are
   * sent automatically, so this is only needed when there is a reason to retry
   * early, such as the network coming back.
   */
  static skipWaitsAndProcessRequestsNow(): void {
    void workoutAPIQueueService.skipWaitsAndProcessRequestsNow();
  }

  /**
   * Fetches the initial data if
   * - the app is visible and wasn't before
   * - the user is logged in
   * - the last initial data fetch was more than {@link WorkoutAPIService.secondsToWaitBeforeFetchingInitialData}
   * ago or it hasn't been fetched yet.
   */
  static getInitialDataIfNeeded(): void {
    if (!userConfig.get().accessToken) return;

    if (!this.lastInitialDataFetchTime) {
      this.getInitialData();
    } else if (
      this.lastInitialDataFetchTime <
      Date.now() - WorkoutAPIService.#secondsToWaitBeforeFetchingInitialData * 1000
    ) {
      this.#log.info(
        'Fetching initial data because it has been more than',
        WorkoutAPIService.#secondsToWaitBeforeFetchingInitialData,
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
    this.#log.info('Getting initial data...');
    this.lastInitialDataFetchTime = Date.now();
    void updateCheckService.checkForUpdate();

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
   * Clears in-memory state and the persisted queue. Call on logout so a
   * different user signing in on the same device doesn't inherit the
   * previous session's queue.
   */
  static reset(): void {
    this.lastInitialDataFetchTime = null;
    this.#initialHydrationMarked = false;
    void workoutAPIQueueService.reset();
  }

  /**
   * Passes the output of a get request to each API output handler, in order.
   *
   * @param output The output of the get request
   * @param input The get request that was sent
   */
  static #handleOutput(
    output: ProjectWorkoutPrimaryOutput,
    input: ProjectWorkoutPrimaryEndpointOptions
  ): void {
    if (this.#apiOutputHandlers.length === 0) {
      this.#log.error('No API output handlers are set, so the API output was not applied.');
      return;
    }
    this.#apiOutputHandlers.forEach((handler) => {
      handler.handleApiOutput(output, input);
    });
  }
}
