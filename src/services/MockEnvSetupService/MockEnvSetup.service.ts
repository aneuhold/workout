import { APIService } from '@aneuhold/core-ts-api-lib';
import equipmentTypeMapService from '$services/documentMapServices/EquipmentTypeMap.service.svelte';
import exerciseCalibrationMapService from '$services/documentMapServices/ExerciseCalibrationMap.service.svelte';
import exerciseMapServiceMock from '$services/documentMapServices/ExerciseMap.service.mock';
import exerciseMapService from '$services/documentMapServices/ExerciseMap.service.svelte';
import MockDataService from '$services/MockDataService/MockData.service';
import MockScenarioService from '$services/MockScenarioService/MockScenario.service';
import { FullAppScenario } from '$services/MockScenarioService/types';
import WebSocketService from '$services/WebSocket.service';
import WorkoutHydrationService from '$services/WorkoutHydration.service';
import { userConfig } from '$stores/local/userConfig/userConfig';
import userConfigMock from '$stores/local/userConfig/userConfig.mock';
import MockUsers from '$util/MockUsers';
import MockAPIBackend from './MockAPIBackend';

/**
 * Stands up the mock environment: the network-free API and WebSocket that
 * Vitest and Storybook install, and the demo's mock data, either seeded fresh
 * or loaded from what `LocalData` already holds.
 */
class MockEnvSetupService {
  readonly #apiBackend = new MockAPIBackend();

  /**
   * Installs the network-free API and WebSocket, then resets the mock
   * document maps and user config.
   *
   * @param useRealBackend Leaves the API and WebSocket on their real backends
   *   instead of installing the network-free ones
   */
  setupGlobalMocks(useRealBackend = false): void {
    if (!useRealBackend) {
      this.#installMockBackends();
    }
    MockDataService.resetAll();
    userConfigMock.reset();
  }

  /**
   * Installs the network-free API and WebSocket, then loads the demo stored
   * in `LocalData`.
   */
  async resumeDemo(): Promise<void> {
    this.#installMockBackends();
    await Promise.all([userConfig.hydrate(), WorkoutHydrationService.hydrateDocumentMaps()]);
    // Exercise CTOs are not stored, so they are rebuilt from the stored documents
    exerciseMapServiceMock.setDefaultExerciseCTOs(
      exerciseCalibrationMapService.allDocs,
      exerciseMapService.allDocs,
      equipmentTypeMapService.allDocs
    );
  }

  /**
   * Installs the network-free API and WebSocket, then seeds the
   * `MidTrainingWithHistory` mock scenario and a logged-in demo user and
   * writes both to `LocalData`, replacing any demo already stored there.
   */
  seedDemo(): void {
    this.#installMockBackends();
    MockScenarioService.setupScenario(FullAppScenario.MidTrainingWithHistory);
    // The scenario adds its documents without persisting them
    WorkoutHydrationService.persistDocumentMaps();
    userConfig.set({
      userId: MockUsers.currentUserCto._id,
      username: 'Demo User',
      accessToken: 'demo-mode-token',
      refreshTokenString: null
    });
  }

  /**
   * Routes the API and WebSocket away from the network. Resets stay out of
   * this method, because a reset erases what `LocalData` has stored.
   */
  #installMockBackends(): void {
    APIService.setBackend(this.#apiBackend);
    WebSocketService.disable();
  }
}

const mockEnvSetupService = new MockEnvSetupService();
export default mockEnvSetupService;
