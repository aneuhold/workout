import { type WorkoutSet, WorkoutSetSchema } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import MockUsers from '$util/MockUsers';
import setMapService from './SetMap.service.svelte';

export type AddMockSetInfo = {
  workoutExerciseId: UUID;
  workoutSessionId: UUID;
  workoutSessionExerciseId: UUID;
  plannedReps?: number;
  plannedWeight?: number;
  plannedRir?: number | null;
  actualReps?: number;
  actualWeight?: number;
  rir?: number;
};

class SetMapServiceMock {
  reset(): void {
    setMapService.setMap({});
  }

  addSet(config: AddMockSetInfo): WorkoutSet {
    const doc = WorkoutSetSchema.parse({
      userId: MockUsers.currentUserCto._id,
      workoutExerciseId: config.workoutExerciseId,
      workoutSessionId: config.workoutSessionId,
      workoutSessionExerciseId: config.workoutSessionExerciseId,
      plannedReps: config.plannedReps,
      plannedWeight: config.plannedWeight,
      plannedRir: config.plannedRir,
      actualReps: config.actualReps,
      actualWeight: config.actualWeight,
      rir: config.rir
    });
    setMapService.addDocWithoutPersist(doc);
    return doc;
  }

  addManySets(docs: WorkoutSet[]): void {
    docs.forEach((doc) => setMapService.addDocWithoutPersist(doc));
  }
}

const setMapServiceMock = new SetMapServiceMock();
export default setMapServiceMock;
