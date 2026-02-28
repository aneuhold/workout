import { CycleType } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import type { MockGeneratedMesocycleData } from '$services/documentMapServices/mesocycleMapService.mock';
import MesocycleMapServiceMock from '$services/documentMapServices/mesocycleMapService.mock';
import { daysAgo } from '$testUtils/dateUtils';
import MockData, { type MockBaseData } from '$testUtils/MockData';
import routeState from './sbFullAppRouteState.svelte';

export enum FullAppScenario {
  MidTraining = 'midTraining',
  FreshStart = 'freshStart',
  AllComplete = 'allComplete',
  ReviewPending = 'reviewPending',
  MesocycleStart = 'mesocycleStart',
  VeryLateSession = 'veryLateSession',
  DeloadTrigger = 'deloadTrigger',
  HistoricalData = 'historicalData'
}

/**
 * Sets up mock data for the given Full App scenario. Resets all existing
 * mock data first so each scenario starts clean.
 *
 * @param scenario The scenario to set up
 */
export function setupScenario(scenario: FullAppScenario): void {
  MockData.resetAll();
  const baseData = MockData.setupBaseData();

  switch (scenario) {
    case FullAppScenario.MidTraining: {
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(21),
        completedSessionCount: 8
      });
      MesocycleMapServiceMock.fillLateFields(data);
      MesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
      break;
    }

    case FullAppScenario.FreshStart:
      // Base data only — exercises, equipment, muscle groups. No mesocycle.
      break;

    case FullAppScenario.AllComplete: {
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(28),
        completedSessionCount: 999
      });
      MesocycleMapServiceMock.fillLateFields(data);
      break;
    }

    case FullAppScenario.ReviewPending:
      // 8 completed sessions but late fields NOT filled — shows "Review" state
      MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(21),
        completedSessionCount: 8
      });
      break;

    case FullAppScenario.MesocycleStart:
      // Mesocycle with generated microcycles, no sessions started
      MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 6,
        startDate: daysAgo(0),
        completedSessionCount: 0
      });
      break;

    case FullAppScenario.VeryLateSession: {
      // 2 full microcycles complete with all reviews done, next session ~14 days late
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: 'Hypertrophy Block',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(28),
        completedSessionCount: 10
      });
      MesocycleMapServiceMock.fillLateFields(data);
      break;
    }

    case FullAppScenario.DeloadTrigger:
      setupDeloadTriggerScenario(baseData);
      break;

    case FullAppScenario.HistoricalData:
      setupHistoricalDataScenario(baseData);
      break;
  }
}

/**
 * Returns session IDs belonging to the given microcycle indices within the
 * generated mesocycle data. Microcycles are matched by position in the array
 * (which mirrors generation order).
 *
 * @param data The generated mesocycle data
 * @param microcycleIndices 0-based indices of microcycles to collect session IDs from
 */
function getSessionIdsForMicrocycles(
  data: MockGeneratedMesocycleData,
  microcycleIndices: number[]
): Set<UUID> {
  const targetMcIds = new Set(
    microcycleIndices.map((i) => data.microcycles[i]?._id).filter(Boolean)
  );
  return new Set(
    data.sessions
      .filter((s) => s.workoutMicrocycleId && targetMcIds.has(s.workoutMicrocycleId))
      .map((s) => s._id)
  );
}

/**
 * Sets up a mesocycle where completing the current session should trigger
 * an early deload recommendation via Rule 2 (consecutive performance drops).
 *
 * Layout: 5 microcycles, 5 sessions per microcycle.
 * - Microcycles 0-1: fully complete, normal performance
 * - Microcycle 2: fully complete, performance drops applied
 * - Microcycle 3: fully complete, performance drops applied
 * - Microcycle 4: first session has all sets filled but NOT marked complete
 *
 * The deload check looks at the last 2 microcycles relative to the current
 * one. When the user completes the session in microcycle 4 (index 4, which
 * is >= MIN_MICROCYCLE_INDEX_FOR_DELOAD of 2), microcycles 3 and 4 are
 * examined, and the consecutive drops across microcycles 2-3-4 satisfy
 * Rule 2 for multiple exercises.
 *
 * @param baseData The base exercise/calibration/equipment data
 */
function setupDeloadTriggerScenario(baseData: MockBaseData): void {
  const sessionsPerMicrocycle = 5;
  const microcycleCount = 5;
  // Complete all sessions in microcycles 0-3 (4 * 5 = 20)
  const completedSessionCount = sessionsPerMicrocycle * 4;

  const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
    title: 'Overreaching Block',
    cycleType: CycleType.MuscleGain,
    microcycleCount,
    sessionsPerMicrocycle,
    startDate: daysAgo(microcycleCount * 7),
    completedSessionCount
  });

  // Mark microcycle 3 (index 3) as completed so that sessions in microcycle 4
  // are unlocked. generateFullMesocycle intentionally leaves the last fully-
  // completed microcycle without completedDate (to show the "advance" hero card),
  // but for this scenario the user needs to be IN microcycle 4.
  data.microcycles[3].completedDate = new Date();

  // Apply performance drops to all sessions in microcycles 2 and 3
  // This ensures 2+ consecutive drops for each exercise across those microcycles
  const dropSessionIds = getSessionIdsForMicrocycles(data, [2, 3]);
  MesocycleMapServiceMock.applyPerformanceDrops(data, dropSessionIds);

  // Fill late fields for completed sessions (mid-session fields already set by generateFullMesocycle)
  MesocycleMapServiceMock.fillLateFields(data);

  // Fill all sets on the first incomplete session (microcycle 4, first session)
  // so it appears ready to complete with continued poor performance
  const firstIncomplete = data.sessions.find((s) => !s.complete);
  if (firstIncomplete) {
    MesocycleMapServiceMock.fillSessionSets(data, firstIncomplete._id, {
      performanceDrop: true
    });

    // Also fill mid-session metrics for the ready-to-complete session
    for (const se of data.sessionExercises) {
      if (se.workoutSessionId === firstIncomplete._id) {
        se.rsm = { ...se.rsm, mindMuscleConnection: 1, pump: 1 };
        se.fatigue = { ...se.fatigue, unusedMusclePerformance: 2 };
        se.performanceScore = 0;
      }
    }

    // Navigate to the session page
    routeState.navigate(`/session?sessionId=${firstIncomplete._id}`);
  }
}

/**
 * Sets up 3 completed mesocycles with progressive volume, providing rich
 * historical data. The 3rd mesocycle was completed yesterday, so the user
 * lands on the home page ready to generate a new (4th) mesocycle.
 *
 * Each mesocycle has 5 accumulation microcycles + 1 deload (6 total).
 * Some exercises are shared across all 3 for continuity; the data includes
 * RSM, soreness, performance scores, and calibration documents.
 *
 * @param baseData The base exercise/calibration/equipment data
 */
function setupHistoricalDataScenario(baseData: MockBaseData): void {
  const microcycleCount = 6;
  const sessionsPerMicrocycle = 5;
  const totalSessions = microcycleCount * sessionsPerMicrocycle;

  for (let mesoIndex = 0; mesoIndex < 3; mesoIndex++) {
    // Each mesocycle starts further in the past; ~6 weeks each + 1 week gap
    const weeksPerMeso = microcycleCount + 1;
    const mesoStartDaysAgo = (3 - mesoIndex) * weeksPerMeso * 7;
    const completedDaysAgo = mesoStartDaysAgo - microcycleCount * 7;

    const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
      title: `Hypertrophy Block ${mesoIndex + 1}`,
      cycleType: CycleType.MuscleGain,
      microcycleCount,
      sessionsPerMicrocycle,
      startDate: daysAgo(mesoStartDaysAgo),
      completedSessionCount: totalSessions,
      completedDate: mesoIndex === 2 ? daysAgo(1) : daysAgo(completedDaysAgo)
    });

    // Fill late fields (mid-session fields already set by generateFullMesocycle)
    MesocycleMapServiceMock.fillLateFields(data);

    // Override RSM and soreness data with varied values per mesocycle
    for (const se of data.sessionExercises) {
      // Slight variation per mesocycle to simulate progressive overload
      const rsmBase = Math.min(3, 1 + mesoIndex);
      se.rsm = {
        ...se.rsm,
        mindMuscleConnection: rsmBase,
        pump: Math.min(3, rsmBase + 1),
        disruption: Math.min(3, mesoIndex)
      };
      se.sorenessScore = Math.min(3, mesoIndex);
      se.performanceScore = Math.max(0, 2 - mesoIndex);
    }
  }
}
