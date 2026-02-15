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
}
