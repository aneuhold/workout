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
import { type MockBaseData } from '$services/MockDataService/types';
import MockUsers from '$util/MockUsers';
import mesocycleMapService from './MesocycleMap.service.svelte';
import microcycleMapServiceMock from './MicrocycleMap.service.mock';
import sessionExerciseMapServiceMock from './SessionExerciseMap.service.mock';
import sessionMapServiceMock from './SessionMap.service.mock';
import setMapServiceMock from './SetMap.service.mock';

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

class MesocycleMapServiceMock {
  reset(): void {
    mesocycleMapService.setMap({});
  }

  addMesocycle(config: AddMockMesocycleInfo = {}): WorkoutMesocycle {
    const doc = WorkoutMesocycleSchema.parse({
      userId: MockUsers.currentUserCto._id,
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
  generateFullMesocycle(
    baseData: MockBaseData,
    config: MockGenerateFullMesocycleConfig
  ): MockGeneratedMesocycleData {
    const mesoDoc = this.addMesocycle({
      title: config.title,
      cycleType: config.cycleType ?? CycleType.MuscleGain,
      plannedMicrocycleCount: config.microcycleCount ?? 4,
      plannedMicrocycleLengthInDays: config.microcycleLengthInDays ?? 7,
      plannedMicrocycleRestDays: config.restDays ?? [0, 6],
      plannedSessionCountPerMicrocycle: config.sessionsPerMicrocycle ?? 5,
      calibratedExercises: baseData.calibrations.map((c) => c._id)
    });

    const { exerciseCTOs } = baseData;

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
    for (const se of sessionExercises) {
      if (completedSessionIds.has(se.workoutSessionId)) {
        this.#fillMidSessionFields(se);
      }
    }

    const data: MockGeneratedMesocycleData = {
      mesocycle: mesoDoc,
      microcycles,
      sessions,
      sessionExercises,
      sets
    };

    // Mark mesocycle as completed if needed
    if (config.completedDate) {
      mesoDoc.completedDate = config.completedDate;
      mesocycleMapService.setMap({
        ...Object.fromEntries(mesocycleMapService.allDocs.map((d) => [d._id, d])),
        [mesoDoc._id]: mesoDoc
      });
    }

    microcycleMapServiceMock.addManyMicrocycles(microcycles);
    sessionMapServiceMock.addManySessions(sessions);
    sessionExerciseMapServiceMock.addManySessionExercises(sessionExercises);
    setMapServiceMock.addManySets(sets);

    return data;
  }

  /**
   * Fills in post-session (late) metrics on session exercises belonging to
   * completed sessions so they show as fully "Completed" rather than "Review".
   * Late metrics are: disruption, jointAndTissueDisruption, perceivedEffort,
   * and sorenessScore.
   *
   * @param data The mock mesocycle data to modify in-place
   */
  fillLateFields(data: MockGeneratedMesocycleData): void {
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
   * Completes the first session exercise of the first incomplete session,
   * making the session appear "in-progress".
   *
   * @param data The mock mesocycle data to modify in-place
   */
  makeFirstIncompleteSessionInProgress(data: MockGeneratedMesocycleData): void {
    const firstIncomplete = data.sessions.find((s) => !s.complete);
    if (!firstIncomplete) return;
    const firstSessionExercise = data.sessionExercises.find(
      (se) => se._id === firstIncomplete.sessionExerciseOrder[0]
    );
    if (!firstSessionExercise) return;
    for (const set of data.sets) {
      if (set.workoutSessionExerciseId === firstSessionExercise._id) {
        set.actualReps = (set.plannedReps ?? 8) + 1;
        set.actualWeight = set.plannedWeight ?? 135;
        if (set.plannedRir != null) {
          set.rir = Math.max(0, set.plannedRir - 1);
        }
      }
    }
    this.#fillMidSessionFields(firstSessionExercise);
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
  applyPerformanceDrops(data: MockGeneratedMesocycleData, sessionIds: Set<UUID>): void {
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
  fillSessionSets(
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
    for (const se of data.sessionExercises) {
      if (se.workoutSessionId === sessionId) {
        this.#fillMidSessionFields(se);
      }
    }
  }

  /**
   * Fills in the mid-session metrics a lifter records right after performing
   * an exercise.
   *
   * @param sessionExercise The session exercise to modify in-place
   */
  #fillMidSessionFields(sessionExercise: WorkoutSessionExercise): void {
    sessionExercise.rsm = { ...sessionExercise.rsm, mindMuscleConnection: 2, pump: 2 };
    sessionExercise.fatigue = { ...sessionExercise.fatigue, unusedMusclePerformance: 1 };
    sessionExercise.performanceScore = 1;
  }
}

const mesocycleMapServiceMock = new MesocycleMapServiceMock();
export default mesocycleMapServiceMock;
