import { type WorkoutSession, WorkoutSessionSchema } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import MockData, { type MockBaseData } from '$testUtils/MockData';
import TestUsers from '$testUtils/TestUsers';
import sessionMapService from './sessionMapService.svelte';

export type AddMockSessionInfo = {
  workoutMicrocycleId?: UUID;
  title: string;
  startTime: Date;
  complete?: boolean;
  sessionExerciseOrder?: UUID[];
};

export type AddMockFreeFormSessionInfo = {
  title?: string;
  startTime?: Date;
  complete?: boolean;
  exerciseCount: number;
  setsPerExercise?: number;
  loggedSetCount?: number;
  /** When set, each set gets this planned rep count (no actual values needed). */
  plannedRepsPerSet?: number;
  /** When set, each set gets this planned weight (no actual values needed). */
  plannedWeightPerSet?: number;
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

  /**
   * Creates a free-form session (no microcycle) with exercises and sets.
   * Each exercise gets the specified number of sets, and sets are logged
   * sequentially up to `loggedSetCount`.
   *
   * @param baseData The base mock data containing exercises to pull from
   * @param config Configuration for the free-form session
   */
  addFreeFormSession(baseData: MockBaseData, config: AddMockFreeFormSessionInfo): WorkoutSession {
    const setsPerExercise = config.setsPerExercise ?? 2;
    const loggedSetCount = config.loggedSetCount ?? 0;

    const session = this.addSession({
      title: config.title ?? 'March 29 Workout',
      startTime: config.startTime ?? new Date(),
      complete: config.complete ?? false,
      sessionExerciseOrder: []
    });

    const sessionExerciseOrder: UUID[] = [];
    let logged = 0;

    for (let i = 0; i < config.exerciseCount; i++) {
      const exercise = baseData.exercises[i % baseData.exercises.length];
      const se = MockData.sessionExerciseMapServiceMock.addSessionExercise({
        workoutSessionId: session._id,
        workoutExerciseId: exercise._id,
        setOrder: []
      });
      const setIds: UUID[] = [];
      for (let j = 0; j < setsPerExercise; j++) {
        const shouldLog = logged < loggedSetCount;
        const set = MockData.setMapServiceMock.addSet({
          workoutExerciseId: exercise._id,
          workoutSessionId: session._id,
          workoutSessionExerciseId: se._id,
          plannedReps: config.plannedRepsPerSet,
          plannedWeight: config.plannedWeightPerSet,
          actualReps: shouldLog ? 10 : undefined,
          actualWeight: shouldLog ? 135 : undefined
        });
        setIds.push(set._id);
        if (shouldLog) logged++;
      }
      se.setOrder = setIds;
      sessionExerciseOrder.push(se._id);
    }

    session.sessionExerciseOrder = sessionExerciseOrder;
    return session;
  }
}
