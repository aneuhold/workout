import type {
  CalibrationExercisePair,
  WorkoutExercise,
  WorkoutExerciseCalibration
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';

/**
 * Groups calibrations by exercise (keeping only the latest per exercise),
 * pairs each with its exercise, and returns the list sorted by exercise name.
 *
 * @param calibrations Calibrations to consider (pre-filter if needed)
 * @param exercises All available exercises
 */
export function buildCalibratedExercisePairs(
  calibrations: WorkoutExerciseCalibration[],
  exercises: WorkoutExercise[]
): CalibrationExercisePair[] {
  const exerciseMap = new Map(exercises.map((exercise) => [exercise._id, exercise]));

  const latestByExercise = new Map<UUID, WorkoutExerciseCalibration>();
  for (const calibration of calibrations) {
    const existing = latestByExercise.get(calibration.workoutExerciseId);
    if (!existing || new Date(calibration.dateRecorded) > new Date(existing.dateRecorded)) {
      latestByExercise.set(calibration.workoutExerciseId, calibration);
    }
  }

  const pairs: CalibrationExercisePair[] = [];
  for (const [exerciseId, calibration] of latestByExercise) {
    const exercise = exerciseMap.get(exerciseId);
    if (exercise) {
      pairs.push({ calibration, exercise });
    }
  }
  return pairs.sort((a, b) => a.exercise.exerciseName.localeCompare(b.exercise.exerciseName));
}

/**
 * Filters calibrations and exercises to only those relevant to the given
 * calibration IDs. Returns both the matching calibrations and their exercises.
 *
 * @param calibrationIds IDs of selected calibrations
 * @param allCalibrations Full list of calibrations
 * @param allExercises Full list of exercises
 */
export function getDocsForCalibrationIds(
  calibrationIds: UUID[],
  allCalibrations: WorkoutExerciseCalibration[],
  allExercises: WorkoutExercise[]
): { calibrations: WorkoutExerciseCalibration[]; exercises: WorkoutExercise[] } {
  const calibrations = allCalibrations.filter((c) => calibrationIds.includes(c._id));
  const exerciseIds = new Set(calibrations.map((c) => c.workoutExerciseId));
  const exercises = allExercises.filter((e) => exerciseIds.has(e._id));
  return { calibrations, exercises };
}
