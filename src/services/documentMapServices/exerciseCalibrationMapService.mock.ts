import {
  type WorkoutExerciseCalibration,
  WorkoutExerciseCalibrationSchema
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import TestUsers from '$testUtils/TestUsers';
import exerciseCalibrationMapService from './exerciseCalibrationMapService.svelte';
import { MockDefaultExercise } from './exerciseMapService.mock';
import exerciseMapService from './exerciseMapService.svelte';

export type AddMockCalibrationInfo = {
  workoutExerciseId: UUID;
  reps: number;
  weight: number;
  dateRecorded?: Date;
};

export default class ExerciseCalibrationMapServiceMock {
  reset(): void {
    exerciseCalibrationMapService.setMap({});
  }

  addCalibration(options: AddMockCalibrationInfo): WorkoutExerciseCalibration {
    const doc = WorkoutExerciseCalibrationSchema.parse({
      userId: TestUsers.currentUserCto._id,
      workoutExerciseId: options.workoutExerciseId,
      reps: options.reps,
      weight: options.weight,
      dateRecorded: options.dateRecorded ?? new Date()
    });
    exerciseCalibrationMapService.addDocWithoutPersist(doc);
    return doc;
  }

  addDefaultCalibrations(): WorkoutExerciseCalibration[] {
    const calibrations: WorkoutExerciseCalibration[] = [];
    const exercises = exerciseMapService.getDocs();

    const findExercise = (name: MockDefaultExercise) =>
      exercises.find((exercise) => exercise.exerciseName === (name as string));

    const benchPress = findExercise(MockDefaultExercise.BarbellBenchPress);
    if (benchPress) {
      calibrations.push(
        this.addCalibration({
          workoutExerciseId: benchPress._id,
          weight: 185,
          reps: 5,
          dateRecorded: new Date('2025-12-15')
        })
      );
    }

    const squat = findExercise(MockDefaultExercise.BarbellSquat);
    if (squat) {
      calibrations.push(
        this.addCalibration({
          workoutExerciseId: squat._id,
          weight: 275,
          reps: 5,
          dateRecorded: new Date('2025-12-20')
        })
      );
    }

    const pushdown = findExercise(MockDefaultExercise.CableTricepPushdown);
    if (pushdown) {
      calibrations.push(
        this.addCalibration({
          workoutExerciseId: pushdown._id,
          weight: 60,
          reps: 10,
          dateRecorded: new Date('2025-11-28')
        })
      );
    }

    const inclinePress = findExercise(MockDefaultExercise.InclineDumbbellPress);
    if (inclinePress) {
      calibrations.push(
        this.addCalibration({
          workoutExerciseId: inclinePress._id,
          weight: 65,
          reps: 8,
          dateRecorded: new Date('2026-01-05')
        })
      );
    }

    return calibrations;
  }
}
