import equipmentTypeMapService from '$services/documentMapServices/EquipmentTypeMap.service.svelte';
import exerciseCalibrationMapService from '$services/documentMapServices/ExerciseCalibrationMap.service.svelte';
import exerciseMapServiceMock from '$services/documentMapServices/ExerciseMap.service.mock';
import exerciseMapService from '$services/documentMapServices/ExerciseMap.service.svelte';
import mockBackendService from '$services/MockBackendService/MockBackend.service';
import MockScenarioService from '$services/MockScenarioService/MockScenario.service';
import { FullAppScenario } from '$services/MockScenarioService/types';
import WorkoutHydrationService from '$services/WorkoutHydration.service';
import { currentUser } from '$stores/local/currentUser/currentUser';
import MockUsers from '$util/MockUsers';

/**
 * The heavy half of demo mode, kept apart so the mock scenario code only loads
 * once a visitor enters the demo.
 */
class DemoSetupService {
  /**
   * Restores this tab's demo after a page load.
   */
  async resume(): Promise<void> {
    mockBackendService.install();
    await Promise.all([currentUser.hydrate(), WorkoutHydrationService.hydrateDocumentMaps()]);
    this.#rebuildExerciseCTOs();
  }

  /**
   * Starts a fresh demo, replacing any stored one.
   */
  seed(): void {
    mockBackendService.install();
    // Setup the demo user first so they are considered logged in before
    // the scenario is setup.
    currentUser.set({
      userId: MockUsers.currentUserCto._id,
      username: 'Demo User',
      password: '',
      accessToken: 'demo-mode-token',
      refreshTokenString: null
    });
    MockScenarioService.setupScenario(FullAppScenario.MidTrainingWithHistory);
    this.#rebuildExerciseCTOs();
    // The scenario adds its documents without persisting them
    WorkoutHydrationService.persistDocumentMaps();
  }

  /**
   * Rebuilds the exercise CTOs from the documents the map services hold. CTOs
   * are derived rather than stored, so the sessions, calibrations, and
   * equipment they summarize have to exist before they are built.
   */
  #rebuildExerciseCTOs(): void {
    exerciseMapServiceMock.setDefaultExerciseCTOs(
      exerciseCalibrationMapService.allDocs,
      exerciseMapService.allDocs,
      equipmentTypeMapService.allDocs
    );
  }
}

const demoSetupService = new DemoSetupService();
export default demoSetupService;
