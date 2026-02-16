import type {
  WorkoutEquipmentType,
  WorkoutExercise,
  WorkoutExerciseCalibration
} from '@aneuhold/core-ts-db-lib';
import EquipmentTypeMapServiceMock from '$services/documentMapServices/equipmentTypeMapService.mock';
import ExerciseCalibrationMapServiceMock from '$services/documentMapServices/exerciseCalibrationMapService.mock';
import ExerciseMapServiceMock from '$services/documentMapServices/exerciseMapService.mock';
import MesocycleMapServiceMock from '$services/documentMapServices/mesocycleMapService.mock';
import MicrocycleMapServiceMock from '$services/documentMapServices/microcycleMapService.mock';
import MuscleGroupMapServiceMock from '$services/documentMapServices/muscleGroupMapService.mock';
import SessionExerciseMapServiceMock from '$services/documentMapServices/sessionExerciseMapService.mock';
import SessionMapServiceMock from '$services/documentMapServices/sessionMapService.mock';
import SetMapServiceMock from '$services/documentMapServices/setMapService.mock';
import UserConfigMock from '$stores/local/userConfig/userConfig.mock';
import TestUsers from './TestUsers';

export type MockBaseData = {
  exercises: WorkoutExercise[];
  calibrations: WorkoutExerciseCalibration[];
  equipmentTypes: WorkoutEquipmentType[];
};

/**
 * Global mock data for tests.
 */
export default class MockData {
  static userConfigMock = new UserConfigMock(TestUsers.currentUserCto._id);

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
    const muscleGroups = MockData.muscleGroupMapServiceMock.addDefaultMuscleGroups();
    const equipment = MockData.equipmentTypeMapServiceMock.addDefaultEquipmentTypes();
    const exercises = MockData.exerciseMapServiceMock.addDefaultExercises(muscleGroups, equipment);
    const calibrations = MockData.exerciseCalibrationMapServiceMock.addDefaultCalibrations();
    const equipmentTypes = Object.values(equipment);
    return { exercises, calibrations, equipmentTypes };
  }
}
