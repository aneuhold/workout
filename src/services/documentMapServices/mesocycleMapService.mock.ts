import { CycleType, type WorkoutMesocycle, WorkoutMesocycleSchema } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import TestUsers from '$testUtils/TestUsers';
import mesocycleMapService from './mesocycleMapService.svelte';

export type AddMockMesocycleInfo = {
  cycleType?: CycleType;
  plannedSessionCountPerMicrocycle?: number;
  plannedMicrocycleLengthInDays?: number;
  plannedMicrocycleRestDays?: number[];
  plannedMicrocycleCount?: number;
  calibratedExercises?: UUID[];
  title?: string;
};

export default class MesocycleMapServiceMock {
  reset(): void {
    mesocycleMapService.setMap({});
  }

  addMesocycle(config: AddMockMesocycleInfo = {}): WorkoutMesocycle {
    const doc = WorkoutMesocycleSchema.parse({
      userId: TestUsers.currentUserCto._id,
      cycleType: config.cycleType ?? CycleType.MuscleGain,
      plannedSessionCountPerMicrocycle: config.plannedSessionCountPerMicrocycle ?? 5,
      plannedMicrocycleLengthInDays: config.plannedMicrocycleLengthInDays ?? 7,
      plannedMicrocycleRestDays: config.plannedMicrocycleRestDays ?? [0, 6],
      plannedMicrocycleCount: config.plannedMicrocycleCount ?? 4,
      calibratedExercises: config.calibratedExercises ?? [],
      title: config.title
    });
    mesocycleMapService.addDocWithoutPersist(doc);
    return doc;
  }
}
