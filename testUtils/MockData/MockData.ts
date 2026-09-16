import type {
  WorkoutEquipmentType,
  WorkoutExercise,
  WorkoutExerciseCalibration,
  WorkoutExerciseCTO
} from '@aneuhold/core-ts-db-lib';
import EquipmentTypeMapServiceMock from '$services/documentMapServices/EquipmentTypeMap.service.mock';
import ExerciseCalibrationMapServiceMock from '$services/documentMapServices/ExerciseCalibrationMap.service.mock';
import ExerciseMapServiceMock from '$services/documentMapServices/ExerciseMap.service.mock';
import MesocycleMapServiceMock from '$services/documentMapServices/MesocycleMap.service.mock';
import MicrocycleMapServiceMock from '$services/documentMapServices/MicrocycleMap.service.mock';
import MuscleGroupMapServiceMock from '$services/documentMapServices/MuscleGroupMap.service.mock';
import SessionExerciseMapServiceMock from '$services/documentMapServices/SessionExerciseMap.service.mock';
import SessionMapServiceMock from '$services/documentMapServices/SessionMap.service.mock';
import SetMapServiceMock from '$services/documentMapServices/SetMap.service.mock';
import UserConfigMock from '$stores/local/userConfig/userConfig.mock';
import MockScenarioService from './MockScenario.service';

/**
 * Named sets of example workout data that {@link MockData.setupScenario}
 * builds.
 */
export enum FullAppScenario {
  MidTrainingWithHistory = 'midTrainingWithHistory',
  CompletelyFresh = 'completelyFresh',
  FreshStart = 'freshStart',
  FreeFormWorkout = 'freeFormWorkout',
  AllComplete = 'allComplete',
  ReviewPending = 'reviewPending',
  MesocycleStart = 'mesocycleStart',
  VeryLateSession = 'veryLateSession',
  DeloadTrigger = 'deloadTrigger',
  HistoricalData = 'historicalData'
}

export type MockBaseData = {
  exercises: WorkoutExercise[];
  calibrations: WorkoutExerciseCalibration[];
  equipmentTypes: WorkoutEquipmentType[];
  exerciseCTOs: WorkoutExerciseCTO[];
};

/**
 * Global mock data: the mock document map services, and the base data and
 * scenarios built in them.
 */
export default class MockData {
  static userConfigMock = new UserConfigMock();

  static muscleGroupMapServiceMock = new MuscleGroupMapServiceMock();
  static equipmentTypeMapServiceMock = new EquipmentTypeMapServiceMock();
  static exerciseMapServiceMock = new ExerciseMapServiceMock();
  static exerciseCalibrationMapServiceMock = new ExerciseCalibrationMapServiceMock();
  static mesocycleMapServiceMock = new MesocycleMapServiceMock();
  static microcycleMapServiceMock = new MicrocycleMapServiceMock();
  static sessionMapServiceMock = new SessionMapServiceMock();
  static sessionExerciseMapServiceMock = new SessionExerciseMapServiceMock();
  static setMapServiceMock = new SetMapServiceMock();

  /**
   * Resets all 9 document map service mocks to empty state.
   */
  static resetAll(): void {
    MockData.muscleGroupMapServiceMock.reset();
    MockData.equipmentTypeMapServiceMock.reset();
    MockData.exerciseMapServiceMock.reset();
    MockData.exerciseCalibrationMapServiceMock.reset();
    MockData.mesocycleMapServiceMock.reset();
    MockData.microcycleMapServiceMock.reset();
    MockData.sessionMapServiceMock.reset();
    MockData.sessionExerciseMapServiceMock.reset();
    MockData.setMapServiceMock.reset();
  }

  /**
   * Populates the default muscle groups, equipment types, exercises, and
   * calibrations into the mock services.
   */
  static setupBaseData(): MockBaseData {
    MockData.muscleGroupMapServiceMock.addDefaultMuscleGroups();
    const equipmentTypes = MockData.equipmentTypeMapServiceMock.addDefaultEquipmentTypes();
    const exercises = MockData.exerciseMapServiceMock.addDefaultExercises();
    const calibrations = MockData.exerciseCalibrationMapServiceMock.addDefaultCalibrations();
    const exerciseCTOs = MockData.exerciseMapServiceMock.setDefaultExerciseCTOs(
      calibrations,
      exercises,
      equipmentTypes
    );

    return { exercises, calibrations, equipmentTypes, exerciseCTOs };
  }

  /**
   * Resets all mock data and builds the given scenario in the mock services.
   * Returns the URL of the page the scenario starts on, or `null` when it
   * starts on the home page.
   *
   * @param scenario The scenario to set up
   */
  static setupScenario(scenario: FullAppScenario): string | null {
    return MockScenarioService.setupScenario(scenario);
  }
}
