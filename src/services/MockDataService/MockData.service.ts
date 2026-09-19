import equipmentTypeMapServiceMock from '$services/documentMapServices/EquipmentTypeMap.service.mock';
import exerciseCalibrationMapServiceMock from '$services/documentMapServices/ExerciseCalibrationMap.service.mock';
import exerciseMapServiceMock from '$services/documentMapServices/ExerciseMap.service.mock';
import mesocycleMapServiceMock from '$services/documentMapServices/MesocycleMap.service.mock';
import microcycleMapServiceMock from '$services/documentMapServices/MicrocycleMap.service.mock';
import muscleGroupMapServiceMock from '$services/documentMapServices/MuscleGroupMap.service.mock';
import sessionExerciseMapServiceMock from '$services/documentMapServices/SessionExerciseMap.service.mock';
import sessionMapServiceMock from '$services/documentMapServices/SessionMap.service.mock';
import setMapServiceMock from '$services/documentMapServices/SetMap.service.mock';
import type { MockBaseData } from './types';

/**
 * Resets the mock document map services together, and builds the base data
 * every scenario starts from.
 */
export default class MockDataService {
  /**
   * Resets all 9 document map service mocks to empty state.
   */
  static resetAll(): void {
    muscleGroupMapServiceMock.reset();
    equipmentTypeMapServiceMock.reset();
    exerciseMapServiceMock.reset();
    exerciseCalibrationMapServiceMock.reset();
    mesocycleMapServiceMock.reset();
    microcycleMapServiceMock.reset();
    sessionMapServiceMock.reset();
    sessionExerciseMapServiceMock.reset();
    setMapServiceMock.reset();
  }

  /**
   * Populates the default muscle groups, equipment types, exercises, and
   * calibrations into the mock services.
   */
  static setupBaseData(): MockBaseData {
    muscleGroupMapServiceMock.addDefaultMuscleGroups();
    const equipmentTypes = equipmentTypeMapServiceMock.addDefaultEquipmentTypes();
    const exercises = exerciseMapServiceMock.addDefaultExercises();
    const calibrations = exerciseCalibrationMapServiceMock.addDefaultCalibrations();
    const exerciseCTOs = exerciseMapServiceMock.setDefaultExerciseCTOs(
      calibrations,
      exercises,
      equipmentTypes
    );

    return { exercises, calibrations, equipmentTypes, exerciseCTOs };
  }
}
