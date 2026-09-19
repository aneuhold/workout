import {
  type Fatigue,
  type RSM,
  type WorkoutSessionExercise,
  WorkoutSessionExerciseSchema
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import MockUsers from '$util/MockUsers';
import sessionExerciseMapService from './SessionExerciseMap.service.svelte';

export type AddMockSessionExerciseInfo = {
  workoutSessionId: UUID;
  workoutExerciseId: UUID;
  setOrder?: UUID[];
  rsm?: RSM;
  fatigue?: Fatigue;
  sorenessScore?: number;
  performanceScore?: number;
};

class SessionExerciseMapServiceMock {
  reset(): void {
    sessionExerciseMapService.setMap({});
  }

  addSessionExercise(config: AddMockSessionExerciseInfo): WorkoutSessionExercise {
    const doc = WorkoutSessionExerciseSchema.parse({
      userId: MockUsers.currentUserCto._id,
      workoutSessionId: config.workoutSessionId,
      workoutExerciseId: config.workoutExerciseId,
      setOrder: config.setOrder ?? [],
      rsm: config.rsm,
      fatigue: config.fatigue,
      sorenessScore: config.sorenessScore,
      performanceScore: config.performanceScore
    });
    sessionExerciseMapService.addDocWithoutPersist(doc);
    return doc;
  }

  addManySessionExercises(docs: WorkoutSessionExercise[]): void {
    docs.forEach((doc) => sessionExerciseMapService.addDocWithoutPersist(doc));
  }
}

const sessionExerciseMapServiceMock = new SessionExerciseMapServiceMock();
export default sessionExerciseMapServiceMock;
