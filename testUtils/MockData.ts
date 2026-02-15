import EquipmentTypeMapServiceMock from '$services/documentMapServices/equipmentTypeMapService.mock';
import ExerciseCalibrationMapServiceMock from '$services/documentMapServices/exerciseCalibrationMapService.mock';
import ExerciseMapServiceMock from '$services/documentMapServices/exerciseMapService.mock';
import MuscleGroupMapServiceMock from '$services/documentMapServices/muscleGroupMapService.mock';
import UserConfigMock from '$stores/local/userConfig/userConfig.mock';
import TestUsers from './TestUsers';

/**
 * Global mock data for tests.
 */
export default class MockData {
  static userConfigMock = new UserConfigMock(TestUsers.currentUserCto._id);

  static muscleGroupMapServiceMock = new MuscleGroupMapServiceMock();
  static equipmentTypeMapServiceMock = new EquipmentTypeMapServiceMock();
  static exerciseMapServiceMock = new ExerciseMapServiceMock();
  static exerciseCalibrationMapServiceMock = new ExerciseCalibrationMapServiceMock();
}
