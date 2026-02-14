import {
  WorkoutEquipmentType_docType,
  WorkoutExercise_docType,
  WorkoutExerciseCalibration_docType,
  WorkoutMesocycle_docType,
  WorkoutMicrocycle_docType,
  WorkoutMuscleGroup_docType,
  WorkoutSession_docType,
  WorkoutSessionExercise_docType,
  WorkoutSet_docType
} from '@aneuhold/core-ts-db-lib';

export const WorkoutDocumentType = {
  Exercise: WorkoutExercise_docType,
  MuscleGroup: WorkoutMuscleGroup_docType,
  Equipment: WorkoutEquipmentType_docType,
  ExerciseCalibration: WorkoutExerciseCalibration_docType,
  Session: WorkoutSession_docType,
  SessionExercise: WorkoutSessionExercise_docType,
  Set: WorkoutSet_docType,
  Mesocycle: WorkoutMesocycle_docType,
  Microcycle: WorkoutMicrocycle_docType
} as const;

export type WorkoutDocumentType = (typeof WorkoutDocumentType)[keyof typeof WorkoutDocumentType];
