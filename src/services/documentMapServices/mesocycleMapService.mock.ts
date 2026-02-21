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

  /**
   * Creates a fully-generated mock mesocycle with microcycles, sessions,
   * session exercises, and sets. Adds all documents to the mock services.
   *
   * @param baseData Base data containing calibrations, exercises, and equipment types to use for generation
   * @param config Configuration for how to generate the mesocycle and related data, including dates and completion status
   */
  static generateFullMesocycle(
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
      baseData.equipmentTypes,
      undefined,
      undefined,
      undefined,
      undefined,
      config.startDate
    );

    const microcycles = result.microcycles?.create ?? [];
    const sessions = result.sessions?.create ?? [];
    const sessionExercises = result.sessionExercises?.create ?? [];
    const sets = result.sets?.create ?? [];

    // Mark sessions as completed
    const completedCount = config.completedSessionCount ?? 0;
    let completedSoFar = 0;
    for (const s of sessions) {
      if (completedSoFar < completedCount) {
        s.complete = true;
        completedSoFar++;
      }
    }

    // Set startDate on mesocycle when any sessions have been completed
    if (completedCount > 0) {
      mesoDoc.startDate = new Date(config.startDate);
    }

    // Set completedDate on microcycles whose sessions are all complete, except
    // the last one — that represents the microcycle the user just finished but
    // hasn't "advanced" from yet (triggering the CompleteMicrocycle hero card).
    const completedMicrocycles = microcycles.filter((mc) => {
      const mcSessions = sessions.filter((s) => s.workoutMicrocycleId === mc._id);
      return mcSessions.length > 0 && mcSessions.every((s) => s.complete);
    });
    for (const mc of completedMicrocycles.slice(0, -1)) {
      mc.completedDate = new Date();
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

  /**
   * Fills in RSM, fatigue, and sorenessScore on session exercises belonging
   * to completed sessions so they show as fully "Completed" rather than "Review".
   *
   * @param data The mock mesocycle data to modify in-place
   */
  static fillLateFields(data: MockGeneratedMesocycleData): void {
    const completedSessionIds = new Set(data.sessions.filter((s) => s.complete).map((s) => s._id));
    for (const se of data.sessionExercises) {
      if (completedSessionIds.has(se.workoutSessionId)) {
        se.rsm = { mindMuscleConnection: 2, pump: 2, disruption: 1 };
        se.fatigue = {
          jointAndTissueDisruption: 1,
          perceivedEffort: 2,
          unusedMusclePerformance: 1
        };
        se.sorenessScore = 1;
      }
    }
  }

  /**
   * Adds actual data to a few sets of the first incomplete session, making
   * it appear "in-progress".
   *
   * @param data The mock mesocycle data to modify in-place
   */
  static makeFirstIncompleteSessionInProgress(data: MockGeneratedMesocycleData): void {
    const firstIncomplete = data.sessions.find((s) => !s.complete);
    if (!firstIncomplete) return;
    const setsForSession = data.sets.filter((s) => s.workoutSessionId === firstIncomplete._id);
    for (let i = 0; i < Math.min(2, setsForSession.length); i++) {
      const set = setsForSession[i];
      set.actualReps = (set.plannedReps ?? 8) + 1;
      set.actualWeight = set.plannedWeight ?? 135;
      if (set.plannedRir != null) {
        set.rir = Math.max(0, set.plannedRir - 1);
      }
    }
  }
}
