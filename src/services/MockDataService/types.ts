import type {
  WorkoutEquipmentType,
  WorkoutExercise,
  WorkoutExerciseCalibration,
  WorkoutExerciseCTO
} from '@aneuhold/core-ts-db-lib';

/**
 * The default documents every scenario builds on.
 */
export type MockBaseData = {
  exercises: WorkoutExercise[];
  calibrations: WorkoutExerciseCalibration[];
  equipmentTypes: WorkoutEquipmentType[];
  exerciseCTOs: WorkoutExerciseCTO[];
};
