import { APIService } from '@aneuhold/core-ts-api-lib';
import { DocumentService } from '@aneuhold/core-ts-db-lib';
import WebSocketService from '$services/WebSocketService';
import { apiKey } from '$stores/local/apiKey';
import MockData from '$testUtils/MockData';
import type { SpyOnFn } from '$testUtils/testUtilTypes';
import { createLogger } from '$util/logging/logger';

const logger = createLogger('TestSetup');

export default class TestSetup {
  /**
   * Sets up global mocks for tests.
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

    spyOnFn(WebSocketService, 'connect').mockImplementation(() => {
      logger.debug('Mocked WebSocketService.connect called');
    });

    // Reset library mocks
    MockData.muscleGroupMapServiceMock.reset();
    MockData.equipmentTypeMapServiceMock.reset();
    MockData.exerciseMapServiceMock.reset();
    MockData.exerciseCalibrationMapServiceMock.reset();

    // Set some stores
    apiKey.set(DocumentService.generateID());
  }
}
