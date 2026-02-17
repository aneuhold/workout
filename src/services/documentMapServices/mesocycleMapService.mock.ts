import {
  CycleType,
  type WorkoutMesocycle,
  WorkoutMesocycleSchema,
  WorkoutMesocycleService,
  type WorkoutMicrocycle,
  type WorkoutSession,
  type WorkoutSessionExercise,
  type WorkoutSet
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import MockData, { type MockBaseData } from '$testUtils/MockData';
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

export type MockGenerateFullMesocycleConfig = {
  title?: string;
  cycleType?: CycleType;
  microcycleCount?: number;
  microcycleLengthInDays?: number;
  restDays?: number[];
  sessionsPerMicrocycle?: number;
  startDate: Date;
  completedSessionCount?: number;
  completedDate?: Date | null;
};

export type MockGeneratedMesocycleData = {
  mesocycle: WorkoutMesocycle;
  microcycles: WorkoutMicrocycle[];
  sessions: WorkoutSession[];
  sessionExercises: WorkoutSessionExercise[];
  sets: WorkoutSet[];
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

/**
 * Creates a fully-generated mock mesocycle with microcycles, sessions,
 * session exercises, and sets. Adds all documents to the mock services.
 *
 * @param baseData - Base data containing calibrations, exercises, and equipment types to use for generation
 * @param config - Configuration for how to generate the mesocycle and related data, including dates and completion status
 */
export function generateFullMockMesocycle(
  baseData: MockBaseData,
  config: MockGenerateFullMesocycleConfig
): MockGeneratedMesocycleData {
  const mesoDoc = MockData.mesocycleMapServiceMock.addMesocycle({
    title: config.title,
    cycleType: config.cycleType ?? CycleType.MuscleGain,
    plannedMicrocycleCount: config.microcycleCount ?? 4,
    plannedMicrocycleLengthInDays: config.microcycleLengthInDays ?? 7,
    plannedMicrocycleRestDays: config.restDays ?? [0, 6],
    plannedSessionCountPerMicrocycle: config.sessionsPerMicrocycle ?? 5,
    calibratedExercises: baseData.calibrations.map((c) => c._id)
  });

  const result = WorkoutMesocycleService.generateOrUpdateMesocycle(
    mesoDoc,
    baseData.calibrations,
    baseData.exercises,
    baseData.equipmentTypes
  );

  const microcycles = result.microcycles?.create ?? [];
  const sessions = result.sessions?.create ?? [];
  const sessionExercises = result.sessionExercises?.create ?? [];
  const sets = result.sets?.create ?? [];

  // Shift dates to start from the specified startDate
  if (microcycles.length > 0) {
    const firstMicroStart = new Date(microcycles[0].startDate);
    const dateOffset = config.startDate.getTime() - firstMicroStart.getTime();

    for (const mc of microcycles) {
      mc.startDate = new Date(new Date(mc.startDate).getTime() + dateOffset);
      mc.endDate = new Date(new Date(mc.endDate).getTime() + dateOffset);
    }
    for (const s of sessions) {
      s.startTime = new Date(new Date(s.startTime).getTime() + dateOffset);
    }
  }

  // Mark sessions as completed
  const completedCount = config.completedSessionCount ?? 0;
  let completedSoFar = 0;
  for (const s of sessions) {
    if (completedSoFar < completedCount) {
      s.complete = true;
      completedSoFar++;
    }
  }

  // Populate actual data on sets belonging to completed sessions
  const completedSessionIds = new Set(
    sessions.filter((s) => s.complete).map((s) => s._id as string)
  );
  for (const set of sets) {
    if (completedSessionIds.has(set.workoutSessionId as string)) {
      set.actualReps = (set.plannedReps ?? 8) + Math.floor(Math.random() * 3) - 1;
      set.actualWeight = set.plannedWeight ?? 135;
      if (set.plannedRir != null) {
        set.rir = Math.max(0, set.plannedRir - 1);
      }
    }
  }

  // Mark mesocycle as completed if needed
  if (config.completedDate) {
    mesoDoc.completedDate = config.completedDate;
    mesocycleMapService.setMap({
      ...Object.fromEntries(mesocycleMapService.getDocs().map((d) => [d._id, d])),
      [mesoDoc._id as string]: mesoDoc
    });
  }

  MockData.microcycleMapServiceMock.addManyMicrocycles(microcycles);
  MockData.sessionMapServiceMock.addManySessions(sessions);
  MockData.sessionExerciseMapServiceMock.addManySessionExercises(sessionExercises);
  MockData.setMapServiceMock.addManySets(sets);

  return { mesocycle: mesoDoc, microcycles, sessions, sessionExercises, sets };
}
