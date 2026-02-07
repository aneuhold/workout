import {
  APIService,
  type ProjectDashboardOptions,
  type ProjectDashboardOutput
} from '@aneuhold/core-ts-api-lib';
import type { DashboardUserConfig, UserCTO } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import WebSocketService from '$services/WebSocketService';
import { apiKey } from '$stores/local/apiKey';
import LocalData from '$util/LocalData/LocalData';
import { createLogger } from '$util/logging/logger';
import DashboardAPIResponseHandlingService from './DashboardAPIResponseHandlingService';

const log = createLogger('DashboardAPIService.ts');

const SECONDS_TO_WAIT_BEFORE_FETCHING_INITIAL_DATA = 10;

export default class DashboardAPIService {
  /**
   * A variable to determine if the initial data is currently being fetched
   * for the first time.
   * This is used to show the user that the data was synced if it was fetched
   * successfully.
   */
  private static processingFirstInitData = false;
  static lastInitialDataFetchTime: number | null = null;
  private static processingRequestQueue = false;

  /**
   * Inserts, deletes, updates or gets items in the backend.
   *
   * If an API request is already being processed, this will be added
   * to the queue and executed after the previous request is done.
   *
   * @param apiOptions The API options that describe the desired operation(s).
   */
  static queryApi(apiOptions: ProjectDashboardOptions) {
    // Add the options to the queue
    this.pushApiRequest(apiOptions);

    // Start processing the queue if not already doing so
    if (!this.processingRequestQueue && LocalData.apiRequestQueue.length > 0) {
      this.processApiRequests();
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
  static getInitialDataIfNeeded() {
    if (apiKey.get() && LocalData.apiRequestQueue.length === 0) {
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
  }

  /**
   * Gets initial data as if the user is just logging in.
   */
  static getInitialDataForLogin() {
    this.lastInitialDataFetchTime = null;
    this.getInitialData();
  }

  /**
   * Gets the initial data from the backend and sets the stores accordingly.
   */
  static getInitialData(): void {
    log.info('Getting initial data...');
    this.processingFirstInitData = !this.lastInitialDataFetchTime;
    this.lastInitialDataFetchTime = Date.now();

    this.queryApi({
      get: {
        translations: true,
        userConfig: true,
        tasks: true,
        nonogramKatanaItems: true,
        nonogramKatanaUpgrades: true
      }
    });
  }

  static updateSettings(updatedConfig: DashboardUserConfig) {
    log.info('Saving user settings...');
    this.queryApi({
      // Get tasks as well because the collaborators might have changed
      get: { userConfig: true, tasks: true },
      update: {
        userConfig: updatedConfig
      }
    });
  }

  /**
   * This processes separately from the queue because it is a special case.
   *
   * @param username The username to validate.
   */
  static async checkIfUsernameIsValid(username: string): Promise<UserCTO | null> {
    const apiKeyValue = this.checkOrSetupDashboardAPI();
    const result = await APIService.callDashboardAPI({
      apiKey: apiKeyValue,
      options: {
        get: {
          userNameIsValid: username
        }
      }
    });
    if (result.success && result.data.userFromUserName) {
      return result.data.userFromUserName;
    } else {
      log.info('Invalid username', result);
      return null;
    }
  }

  static checkOrSetupDashboardAPI(): UUID {
    const apiKeyValue = apiKey.get();
    if (!apiKeyValue) {
      throw new Error('API Key not set!');
    }
    return apiKeyValue;
  }

  /**
   * Starts processing the currently queued API requests. Each result is
   * combined together and processed at the end.
   */
  private static async processApiRequests() {
    this.processingRequestQueue = true;
    let combinedOutput: ProjectDashboardOutput = {};
    while (LocalData.apiRequestQueue.length > 0) {
      const currentRequest = this.shiftApiRequestQueue();
      LocalData.currentApiRequest = currentRequest;
      if (!currentRequest) {
        log.error('No current API request to process, something went wrong!!');
        break;
      }
      const result = await this.callDashboardAPI(currentRequest);
      if (result) {
        combinedOutput = { ...combinedOutput, ...result };
      }
      if (result && LocalData.apiRequestQueue.length === 0) {
        // Only set the stores if there are no more requests to process. This
        // should help prevent the stores from being set to an old value if
        // the user refreshes the page while the task queue is being processed.
        DashboardAPIResponseHandlingService.processDashboardApiOutput(
          combinedOutput,
          this.processingFirstInitData
        );
        this.processingFirstInitData = false;
      } else {
        // If there was an error, add the task back to the queue and try again
        // Save this for later to ensure there is no infinite loop
        // this.unshiftTaskQueueItem(LocalData.currentTaskQueueItem!);
      }
    }
    this.processingRequestQueue = false;
  }

  private static async callDashboardAPI(
    input: ProjectDashboardOptions
  ): Promise<ProjectDashboardOutput | null> {
    const apiKeyValue = this.checkOrSetupDashboardAPI();
    log.info('Processing API request', input);
    const result = await APIService.callDashboardAPI({
      apiKey: apiKeyValue,
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

  private static pushApiRequest(apiInput: ProjectDashboardOptions) {
    const apiRequestQueue = LocalData.apiRequestQueue;
    apiRequestQueue.push(apiInput);
    LocalData.apiRequestQueue = apiRequestQueue;
  }

  private static shiftApiRequestQueue(): ProjectDashboardOptions | undefined {
    const apiRequestQueue = LocalData.apiRequestQueue;
    const result = apiRequestQueue.shift();
    LocalData.apiRequestQueue = apiRequestQueue;
    return result;
  }
}
