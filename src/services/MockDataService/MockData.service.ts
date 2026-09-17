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
import type { MockBaseData } from './types';

/**
 * Global mock data: the mock document map services, and the base data built
 * in them.
 */
export default class MockDataService {
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
    MockDataService.muscleGroupMapServiceMock.reset();
    MockDataService.equipmentTypeMapServiceMock.reset();
    MockDataService.exerciseMapServiceMock.reset();
    MockDataService.exerciseCalibrationMapServiceMock.reset();
    MockDataService.mesocycleMapServiceMock.reset();
    MockDataService.microcycleMapServiceMock.reset();
    MockDataService.sessionMapServiceMock.reset();
    MockDataService.sessionExerciseMapServiceMock.reset();
    MockDataService.setMapServiceMock.reset();
  }

  /**
   * Populates the default muscle groups, equipment types, exercises, and
   * calibrations into the mock services.
   */
  static setupBaseData(): MockBaseData {
    MockDataService.muscleGroupMapServiceMock.addDefaultMuscleGroups();
    const equipmentTypes = MockDataService.equipmentTypeMapServiceMock.addDefaultEquipmentTypes();
    const exercises = MockDataService.exerciseMapServiceMock.addDefaultExercises();
    const calibrations = MockDataService.exerciseCalibrationMapServiceMock.addDefaultCalibrations();
    const exerciseCTOs = MockDataService.exerciseMapServiceMock.setDefaultExerciseCTOs(
      calibrations,
      exercises,
      equipmentTypes
    );

    return { exercises, calibrations, equipmentTypes, exerciseCTOs };
  }
}
