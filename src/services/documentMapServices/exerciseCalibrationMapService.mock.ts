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

    const pullups = findExercise(MockDefaultExercise.Pullups);
    if (pullups) {
      calibrations.push(
        this.addCalibration({
          workoutExerciseId: pullups._id,
          weight: 0,
          reps: 8,
          dateRecorded: new Date('2025-12-10')
        })
      );
    }

    const lateralRaise = findExercise(MockDefaultExercise.DumbbellLateralRaise);
    if (lateralRaise) {
      calibrations.push(
        this.addCalibration({
          workoutExerciseId: lateralRaise._id,
          weight: 20,
          reps: 12,
          dateRecorded: new Date('2025-12-18')
        })
      );
    }

    const rdl = findExercise(MockDefaultExercise.RomanianDeadlift);
    if (rdl) {
      calibrations.push(
        this.addCalibration({
          workoutExerciseId: rdl._id,
          weight: 225,
          reps: 8,
          dateRecorded: new Date('2025-12-22')
        })
      );
    }

    const barbellRow = findExercise(MockDefaultExercise.BarbellRow);
    if (barbellRow) {
      calibrations.push(
        this.addCalibration({
          workoutExerciseId: barbellRow._id,
          weight: 165,
          reps: 8,
          dateRecorded: new Date('2025-12-12')
        })
      );
    }

    const bulgarianSplitSquat = findExercise(MockDefaultExercise.BulgarianSplitSquat);
    if (bulgarianSplitSquat) {
      calibrations.push(
        this.addCalibration({
          workoutExerciseId: bulgarianSplitSquat._id,
          weight: 40,
          reps: 10,
          dateRecorded: new Date('2026-01-02')
        })
      );
    }

    const barbellCurl = findExercise(MockDefaultExercise.BarbellCurl);
    if (barbellCurl) {
      calibrations.push(
        this.addCalibration({
          workoutExerciseId: barbellCurl._id,
          weight: 75,
          reps: 10,
          dateRecorded: new Date('2025-12-28')
        })
      );
    }

    const facePull = findExercise(MockDefaultExercise.CableFacePull);
    if (facePull) {
      calibrations.push(
        this.addCalibration({
          workoutExerciseId: facePull._id,
          weight: 30,
          reps: 15,
          dateRecorded: new Date('2025-12-30')
        })
      );
    }

    const hipThrust = findExercise(MockDefaultExercise.HipThrust);
    if (hipThrust) {
      calibrations.push(
        this.addCalibration({
          workoutExerciseId: hipThrust._id,
          weight: 225,
          reps: 8,
          dateRecorded: new Date('2026-01-08')
        })
      );
    }

    return calibrations;
  }
}
