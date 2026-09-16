import { APIService } from '@aneuhold/core-ts-api-lib';
import WebSocketService from '$services/WebSocket.service';
import { userConfig } from '$stores/local/userConfig/userConfig';
import { loginState } from '$stores/session/loginState';
import MockData, { FullAppScenario } from '$testUtils/MockData/MockData';
import TestUsers from '$testUtils/TestUsers';
import type { MockLike, SpyOnFn } from '$testUtils/testUtilTypes';
import InMemoryBackend from '$util/LocalData/InMemoryBackend';
import LocalData from '$util/LocalData/LocalData';
import { createLogger } from '$util/logging/logger';

const logger = createLogger('TestSetup');

export default class TestSetup {
  /**
   * Stubs the API and WebSocket with the given spy function, then resets the
   * mock document maps and user config.
   *
   * @param spyOnFn The spy function to use (e.g. spyOn from storybook/test or vi.spyOn from vitest)
   */
  static setupGlobalMocks(spyOnFn: SpyOnFn) {
    // Mock API
    spyOnFn(APIService, 'callWorkoutAPI').mockImplementation((_) => {
      return Promise.resolve({
        success: true,
        errors: [],
        data: {}
      });
    });

    spyOnFn(APIService, 'deleteAccount').mockImplementation(() => {
      return Promise.resolve({
        success: true,
        errors: [],
        data: {}
      });
    });

    spyOnFn(APIService, 'logout').mockImplementation(() => {
      return Promise.resolve({
        success: true,
        errors: [],
        data: undefined
      });
    });

    spyOnFn(WebSocketService, 'connect').mockImplementation(() => {
      logger.debug('Mocked WebSocketService.connect called');
    });

    // Reset all document map service mocks
    MockData.resetAll();

    // Reset user config (includes apiKey)
    MockData.userConfigMock.reset();
  }

  /**
   * Runs the app on the `MidTrainingWithHistory` mock scenario as a logged-in
   * demo user, booting through the same startup path a signed-in visitor
   * takes. `LocalData` is held in memory and the API and WebSocket are
   * stubbed.
   */
  static async setupDemo(): Promise<void> {
    // Resetting the mocks writes through `LocalData`, so the in-memory backend goes first
    await LocalData.init(new InMemoryBackend());
    TestSetup.setupGlobalMocks(TestSetup.#replaceMethod);
    MockData.setupScenario(FullAppScenario.MidTrainingWithHistory);
    userConfig.setWithoutPropagation({
      userId: TestUsers.currentUserCto._id,
      username: 'Demo User',
      accessToken: 'demo-mode-token',
      refreshTokenString: null
    });
    loginState.init();
  }

  /**
   * A {@link SpyOnFn} that replaces the method outright, for stubbing outside
   * a test runner.
   *
   * @param obj The object that owns the method
   * @param method The name of the method to replace
   */
  static #replaceMethod<TObject, TKey extends keyof TObject>(obj: TObject, method: TKey): MockLike {
    return {
      mockImplementation: (implementation) => {
        Object.defineProperty(obj, method, { value: implementation });
      }
    };
  }
}
