import {
  CycleType,
  WorkoutExerciseCTOSchema,
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
import exerciseMapService from './exerciseMapService.svelte';
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
  /**
   * Determines what the first microcycle will start at. Does not actually set the real startDate
   * on the Mesocycle, because that indicates the user has started the cycle.
   */
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

    // This could be more performant with maps.
    const exerciseCTOs = baseData.calibrations.map((cal) => {
      const exercise = baseData.exercises.find((e) => e._id === cal.workoutExerciseId);
      const equipmentType = baseData.equipmentTypes.find(
        (et) => et._id === exercise?.workoutEquipmentTypeId
      );
      return WorkoutExerciseCTOSchema.parse({
        ...exercise,
        equipmentType,
        bestCalibration: cal,
        bestSet: null,
        lastSessionExercise: null,
        lastFirstSet: null
      });
    });
    exerciseMapService.setExerciseCTOs(exerciseCTOs);

    const result = WorkoutMesocycleService.generateOrUpdateMesocycle(
      mesoDoc,
      exerciseCTOs,
      [],
      [],
      [],
      [],
      [],
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
    const completedSessionIds = new Set(sessions.filter((s) => s.complete).map((s) => s._id));
    for (const set of sets) {
      if (completedSessionIds.has(set.workoutSessionId)) {
        set.actualReps = (set.plannedReps ?? 8) + Math.floor(Math.random() * 3) - 1;
        set.actualWeight = set.plannedWeight ?? 135;
        if (set.plannedRir != null) {
          set.rir = Math.max(0, set.plannedRir - 1);
        }
      }
    }

    // Fill mid-session metrics for completed session exercises
    const data: MockGeneratedMesocycleData = {
      mesocycle: mesoDoc,
      microcycles,
      sessions,
      sessionExercises,
      sets
    };
    MesocycleMapServiceMock.fillMidSessionFields(data);

    // Mark mesocycle as completed if needed
    if (config.completedDate) {
      mesoDoc.completedDate = config.completedDate;
      mesocycleMapService.setMap({
        ...Object.fromEntries(mesocycleMapService.allDocs.map((d) => [d._id, d])),
        [mesoDoc._id]: mesoDoc
      });
    }

    MockData.microcycleMapServiceMock.addManyMicrocycles(microcycles);
    MockData.sessionMapServiceMock.addManySessions(sessions);
    MockData.sessionExerciseMapServiceMock.addManySessionExercises(sessionExercises);
    MockData.setMapServiceMock.addManySets(sets);

    return data;
  }

  /**
   * Fills in mid-session metrics on session exercises belonging to completed
   * sessions. Mid-session metrics are filled during the workout:
   * mindMuscleConnection, pump, unusedMusclePerformance,
   * and performanceScore.
   *
   * @param data The mock mesocycle data to modify in-place
   */
  static fillMidSessionFields(data: MockGeneratedMesocycleData): void {
    const completedSessionIds = new Set(data.sessions.filter((s) => s.complete).map((s) => s._id));
    for (const se of data.sessionExercises) {
      if (completedSessionIds.has(se.workoutSessionId)) {
        se.rsm = { ...se.rsm, mindMuscleConnection: 2, pump: 2 };
        se.fatigue = { ...se.fatigue, unusedMusclePerformance: 1 };
        se.performanceScore = 1;
      }
    }
  }

  /**
   * Fills in post-session (late) metrics on session exercises belonging to
   * completed sessions so they show as fully "Completed" rather than "Review".
   * Late metrics are: disruption, jointAndTissueDisruption, perceivedEffort,
   * and sorenessScore.
   *
   * @param data The mock mesocycle data to modify in-place
   */
  static fillLateFields(data: MockGeneratedMesocycleData): void {
    const completedSessionIds = new Set(data.sessions.filter((s) => s.complete).map((s) => s._id));
    for (const se of data.sessionExercises) {
      if (completedSessionIds.has(se.workoutSessionId)) {
        se.rsm = { ...se.rsm, disruption: 1 };
        se.fatigue = { ...se.fatigue, jointAndTissueDisruption: 1, perceivedEffort: 2 };
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

  /**
   * Applies performance drops to sets in specified sessions so that the first
   * set of each session exercise shows a surplus of <= -3 (triggering
   * `evaluateConsecutivePerformanceDrops`). Modifies sets in-place.
   *
   * The surplus formula is: `actualReps - plannedReps + (rir - plannedRir)`.
   * To get surplus <= -3 we set actualReps 4 below planned and keep RIR matching.
   *
   * @param data The mock mesocycle data to modify in-place
   * @param sessionIds The IDs of sessions whose sets should show performance drops
   */
  static applyPerformanceDrops(data: MockGeneratedMesocycleData, sessionIds: Set<UUID>): void {
    for (const set of data.sets) {
      if (sessionIds.has(set.workoutSessionId)) {
        set.actualReps = Math.max(1, (set.plannedReps ?? 8) - 4);
        set.actualWeight = set.plannedWeight ?? 135;
        if (set.plannedRir != null) {
          set.rir = set.plannedRir;
        }
      }
    }
  }

  /**
   * Fills actual data on all sets for a specific session so it appears
   * "ready to complete" (all exercises logged) without marking the session
   * itself as complete.
   *
   * @param data The mock mesocycle data to modify in-place
   * @param sessionId The session whose sets should be fully filled in
   * @param options Optional overrides for the fill behaviour
   * @param options.performanceDrop Whether to apply a performance drop (surplus <= -3) instead of normal performance
   */
  static fillSessionSets(
    data: MockGeneratedMesocycleData,
    sessionId: UUID,
    options: { performanceDrop?: boolean } = {}
  ): void {
    const { performanceDrop = false } = options;
    for (const set of data.sets) {
      if (set.workoutSessionId === sessionId) {
        if (performanceDrop) {
          set.actualReps = Math.max(1, (set.plannedReps ?? 8) - 4);
        } else {
          set.actualReps = (set.plannedReps ?? 8) + 1;
        }
        set.actualWeight = set.plannedWeight ?? 135;
        if (set.plannedRir != null) {
          set.rir = performanceDrop ? set.plannedRir : Math.max(0, set.plannedRir - 1);
        }
      }
    }
  }
}
