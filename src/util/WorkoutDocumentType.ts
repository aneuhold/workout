/**
 * The set of all workout document names. Used for type safety.
 *
 * This is not using the imported WorkoutDocumentType_docType constants sadly because it causes
 * issues with TypeScript when it has to be evaluated for a string enum. This is still better than
 * the alternative of using a union of string literals though, which can't be renamed and can't
 * be tracked for references / usage.
 */
export enum WorkoutDocumentType {
  Exercise = 'workoutExercise',
  MuscleGroup = 'workoutMuscleGroup',
  Equipment = 'workoutEquipmentType',
  ExerciseCalibration = 'workoutExerciseCalibration',
  Session = 'workoutSession',
  SessionExercise = 'workoutSessionExercise',
  Set = 'workoutSet',
  Mesocycle = 'workoutMesocycle',
  Microcycle = 'workoutMicrocycle'
}
