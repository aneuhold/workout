import { type WorkoutSession, WorkoutSessionSchema } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import TestUsers from '$testUtils/TestUsers';
import sessionMapService from './sessionMapService.svelte';

export type AddMockSessionInfo = {
  workoutMicrocycleId?: UUID;
  title: string;
  startTime: Date;
  complete?: boolean;
  sessionExerciseOrder?: UUID[];
};

export default class SessionMapServiceMock {
  reset(): void {
    sessionMapService.setMap({});
  }

  addSession(config: AddMockSessionInfo): WorkoutSession {
    const doc = WorkoutSessionSchema.parse({
      userId: TestUsers.currentUserCto._id,
      workoutMicrocycleId: config.workoutMicrocycleId,
      title: config.title,
      startTime: config.startTime,
      complete: config.complete ?? false,
      sessionExerciseOrder: config.sessionExerciseOrder ?? []
    });
    sessionMapService.addDocWithoutPersist(doc);
    return doc;
  }

  addManySessions(docs: WorkoutSession[]): void {
    docs.forEach((doc) => sessionMapService.addDocWithoutPersist(doc));
  }
}
