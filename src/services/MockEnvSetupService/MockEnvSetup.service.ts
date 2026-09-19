import { APIService } from '@aneuhold/core-ts-api-lib';
import equipmentTypeMapService from '$services/documentMapServices/EquipmentTypeMap.service.svelte';
import exerciseCalibrationMapService from '$services/documentMapServices/ExerciseCalibrationMap.service.svelte';
import exerciseMapService from '$services/documentMapServices/ExerciseMap.service.svelte';
import MockDataService from '$services/MockDataService/MockData.service';
import MockScenarioService from '$services/MockScenarioService/MockScenario.service';
import { FullAppScenario } from '$services/MockScenarioService/types';
import WebSocketService from '$services/WebSocket.service';
import WorkoutHydrationService from '$services/WorkoutHydration.service';
import { userConfig } from '$stores/local/userConfig/userConfig';
import { loginState } from '$stores/session/loginState';
import LocalData from '$util/LocalData/LocalData';
import SessionStorageBackend from '$util/LocalData/SessionStorageBackend';
import MockUsers from '$util/MockUsers';
import DemoAPIBackend from './DemoAPIBackend';

/**
 * Stands up the mock environment: the network-free API and WebSocket that
 * Vitest and Storybook install, and the full demo boot that runs the app on
 * mock data kept in the tab's session storage.
 */
class MockEnvSetupService {
  readonly #apiBackend = new DemoAPIBackend();

  /**
   * Installs the network-free API and WebSocket, then resets the mock
   * document maps and user config.
   */
  setupGlobalMocks(): void {
    this.#installBackends();
    MockDataService.resetAll();
    MockDataService.userConfigMock.reset();
  }

  /**
   * Runs the app on the `MidTrainingWithHistory` mock scenario as a logged-in
   * demo user, booting through the same startup path a signed-in visitor
   * takes. `LocalData` is backed by the tab's session storage, and the API
   * and WebSocket never touch the network.
   *
   * The first load in a tab seeds the scenario and writes it to session
   * storage. Every later load in that tab resumes from what is stored, so
   * changes made during the demo survive a reload.
   */
  async setupDemo(): Promise<void> {
    // Decides which storage every later read and write hits, so it goes first
    await LocalData.init(new SessionStorageBackend());
    this.#installBackends();

    // A stored config means this tab already seeded the demo
    if (await LocalData.getUserConfig()) {
      await Promise.all([userConfig.hydrate(), WorkoutHydrationService.hydrateDocumentMaps()]);
      // Exercise CTOs are not stored, so they are rebuilt from the stored documents
      MockDataService.exerciseMapServiceMock.setDefaultExerciseCTOs(
        exerciseCalibrationMapService.allDocs,
        exerciseMapService.allDocs,
        equipmentTypeMapService.allDocs
      );
    } else {
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

    loginState.init();
  }

  /**
   * Routes the API and WebSocket away from the network. Resets stay out of
   * this method, because a reset erases what `LocalData` has stored.
   */
  #installBackends(): void {
    APIService.setBackend(this.#apiBackend);
    WebSocketService.disable();
  }
}

const mockEnvSetupService = new MockEnvSetupService();
export default mockEnvSetupService;
