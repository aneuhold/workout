import { type WorkoutMicrocycle, WorkoutMicrocycleSchema } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import TestUsers from '$testUtils/TestUsers';
import microcycleMapService from './microcycleMapService.svelte';

export type AddMockMicrocycleInfo = {
  workoutMesocycleId?: UUID;
  startDate: Date;
  endDate: Date;
  sessionOrder?: UUID[];
};

export default class MicrocycleMapServiceMock {
  reset(): void {
    microcycleMapService.setMap({});
  }

  addMicrocycle(config: AddMockMicrocycleInfo): WorkoutMicrocycle {
    const doc = WorkoutMicrocycleSchema.parse({
      userId: TestUsers.currentUserCto._id,
      workoutMesocycleId: config.workoutMesocycleId,
      startDate: config.startDate,
      endDate: config.endDate,
      sessionOrder: config.sessionOrder ?? []
    });
    microcycleMapService.addDocWithoutPersist(doc);
    return doc;
  }

  addManyMicrocycles(docs: WorkoutMicrocycle[]): void {
    docs.forEach((doc) => microcycleMapService.addDocWithoutPersist(doc));
  }
}
