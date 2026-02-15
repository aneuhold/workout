import {
  type WorkoutSessionExercise,
  WorkoutSessionExerciseSchema
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import TestUsers from '$testUtils/TestUsers';
import sessionExerciseMapService from './sessionExerciseMapService.svelte';

export type AddMockSessionExerciseInfo = {
  workoutSessionId: UUID;
  workoutExerciseId: UUID;
  setOrder?: UUID[];
};

export default class SessionExerciseMapServiceMock {
  reset(): void {
    sessionExerciseMapService.setMap({});
  }

  addSessionExercise(config: AddMockSessionExerciseInfo): WorkoutSessionExercise {
    const doc = WorkoutSessionExerciseSchema.parse({
      userId: TestUsers.currentUserCto._id,
      workoutSessionId: config.workoutSessionId,
      workoutExerciseId: config.workoutExerciseId,
      setOrder: config.setOrder ?? []
    });
    sessionExerciseMapService.addDocWithoutPersist(doc);
    return doc;
  }

  addManySessionExercises(docs: WorkoutSessionExercise[]): void {
    docs.forEach((doc) => sessionExerciseMapService.addDocWithoutPersist(doc));
  }
}
