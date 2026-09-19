import {
  type WorkoutExerciseCalibration,
  WorkoutExerciseCalibrationSchema
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import MockUsers from '$util/MockUsers';
import exerciseCalibrationMapService from './ExerciseCalibrationMap.service.svelte';
import exerciseMapServiceMock, { MockDefaultExercise } from './ExerciseMap.service.mock';

export type AddMockCalibrationInfo = {
  workoutExerciseId: UUID;
  reps: number;
  weight: number;
  dateRecorded?: Date;
};

class ExerciseCalibrationMapServiceMock {
  reset(): void {
    exerciseCalibrationMapService.setMap({});
  }

  createCalibration(options: AddMockCalibrationInfo): WorkoutExerciseCalibration {
    return WorkoutExerciseCalibrationSchema.parse({
      userId: MockUsers.currentUserCto._id,
      workoutExerciseId: options.workoutExerciseId,
      reps: options.reps,
      weight: options.weight,
      dateRecorded: options.dateRecorded ?? new Date()
    });
  }

  addCalibration(options: AddMockCalibrationInfo): WorkoutExerciseCalibration {
    const doc = this.createCalibration(options);
    exerciseCalibrationMapService.addDocWithoutPersist(doc);
    return doc;
  }

  addDefaultCalibrations(): WorkoutExerciseCalibration[] {
    const docs = this.#createDefaultCalibrations();
    for (const doc of docs) {
      exerciseCalibrationMapService.addDocWithoutPersist(doc);
    }
    return docs;
  }

  #createDefaultCalibrations(): WorkoutExerciseCalibration[] {
    const exercises = exerciseMapServiceMock.defaultExercises;
    return [
      this.createCalibration({
        workoutExerciseId: exercises[MockDefaultExercise.BarbellBenchPress]._id,
        weight: 185,
        reps: 5,
        dateRecorded: new Date('2025-12-15')
      }),
      this.createCalibration({
        workoutExerciseId: exercises[MockDefaultExercise.BarbellSquat]._id,
        weight: 275,
        reps: 5,
        dateRecorded: new Date('2025-12-20')
      }),
      this.createCalibration({
        workoutExerciseId: exercises[MockDefaultExercise.CableTricepPushdown]._id,
        weight: 60,
        reps: 10,
        dateRecorded: new Date('2025-11-28')
      }),
      this.createCalibration({
        workoutExerciseId: exercises[MockDefaultExercise.InclineDumbbellPress]._id,
        weight: 65,
        reps: 8,
        dateRecorded: new Date('2026-01-05')
      }),
      this.createCalibration({
        workoutExerciseId: exercises[MockDefaultExercise.PullUps]._id,
        weight: 0,
        reps: 8,
        dateRecorded: new Date('2025-12-10')
      }),
      this.createCalibration({
        workoutExerciseId: exercises[MockDefaultExercise.DumbbellLateralRaise]._id,
        weight: 20,
        reps: 12,
        dateRecorded: new Date('2025-12-18')
      }),
      this.createCalibration({
        workoutExerciseId: exercises[MockDefaultExercise.RomanianDeadlift]._id,
        weight: 225,
        reps: 8,
        dateRecorded: new Date('2025-12-22')
      }),
      this.createCalibration({
        workoutExerciseId: exercises[MockDefaultExercise.BarbellRow]._id,
        weight: 165,
        reps: 8,
        dateRecorded: new Date('2025-12-12')
      }),
      this.createCalibration({
        workoutExerciseId: exercises[MockDefaultExercise.BulgarianSplitSquat]._id,
        weight: 40,
        reps: 10,
        dateRecorded: new Date('2026-01-02')
      }),
      this.createCalibration({
        workoutExerciseId: exercises[MockDefaultExercise.BarbellCurl]._id,
        weight: 75,
        reps: 10,
        dateRecorded: new Date('2025-12-28')
      }),
      this.createCalibration({
        workoutExerciseId: exercises[MockDefaultExercise.CableFacePull]._id,
        weight: 30,
        reps: 15,
        dateRecorded: new Date('2025-12-30')
      }),
      this.createCalibration({
        workoutExerciseId: exercises[MockDefaultExercise.HipThrust]._id,
        weight: 225,
        reps: 8,
        dateRecorded: new Date('2026-01-08')
      })
    ];
  }
}

const exerciseCalibrationMapServiceMock = new ExerciseCalibrationMapServiceMock();
export default exerciseCalibrationMapServiceMock;
