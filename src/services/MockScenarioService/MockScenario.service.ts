import { CycleType } from '@aneuhold/core-ts-db-lib';
import { DateService } from '@aneuhold/core-ts-lib';
import type { UUID } from 'crypto';
import type { MockGeneratedMesocycleData } from '$services/documentMapServices/MesocycleMap.service.mock';
import mesocycleMapServiceMock from '$services/documentMapServices/MesocycleMap.service.mock';
import sessionMapServiceMock from '$services/documentMapServices/SessionMap.service.mock';
import sessionMapService from '$services/documentMapServices/SessionMap.service.svelte';
import MockDataService from '$services/MockDataService/MockData.service';
import { type MockBaseData } from '$services/MockDataService/types';
import { FullAppScenario } from './types';

/**
 * Builds the data for each {@link FullAppScenario} in the mock document map
 * services.
 */
export default class MockScenarioService {
  /**
   * Resets all mock data, then populates the mock services with the given
   * scenario. Returns the URL of the page the scenario starts on, or `null`
   * when it starts on the home page.
   *
   * @param scenario The scenario to set up
   */
  static setupScenario(scenario: FullAppScenario): string | null {
    MockDataService.resetAll();

    if (scenario === FullAppScenario.CompletelyFresh) {
      // Brand-new user: no muscle groups, equipment, exercises, or mesocycles.
      // Exercises the onboarding checklist in OnboardingEmptyState.
      return null;
    }

    const baseData = MockDataService.setupBaseData();

    switch (scenario) {
      case FullAppScenario.MidTrainingWithHistory: {
        const blockStartDaysAgo = 21;
        // Completed mesocycles that end a week before this block starts
        MockScenarioService.#setupHistoricalDataScenario(baseData, blockStartDaysAgo + 7);
        const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: DateService.addDays(new Date(), -blockStartDaysAgo),
          completedSessionCount: 8
        });
        // generateFullMesocycle leaves the last fully-completed microcycle
        // without completedDate (for the hero card). With 8 sessions that's
        // microcycle 0. Mark it completed so microcycle 1 sessions are unlocked.
        data.microcycles[0].completedDate = new Date();
        mesocycleMapServiceMock.fillLateFields(data);
        mesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
        // Completed free-form sessions
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Full Body, 5 days ago',
          startTime: DateService.addDays(new Date(), -5),
          complete: true,
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 9
        });
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Full Body, 12 days ago',
          startTime: DateService.addDays(new Date(), -12),
          complete: true,
          exerciseCount: 2,
          setsPerExercise: 4,
          loggedSetCount: 8
        });
        // In-progress free-form sessions
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Push Day',
          startTime: DateService.addDays(new Date(), 0),
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 4
        });
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Accessory Work',
          startTime: DateService.addDays(new Date(), -1),
          exerciseCount: 2,
          setsPerExercise: 3,
          loggedSetCount: 1
        });
        // Planned free-form sessions
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Pull Day',
          startTime: DateService.addDays(new Date(), 2),
          exerciseCount: 3,
          setsPerExercise: 3,
          loggedSetCount: 0,
          plannedRepsPerSet: 10,
          plannedWeightPerSet: 135
        });
        sessionMapServiceMock.addFreeFormSession(baseData, {
          title: 'Leg Day',
          startTime: DateService.addDays(new Date(), 5),
          exerciseCount: 4,
          setsPerExercise: 2,
          loggedSetCount: 0,
          plannedRepsPerSet: 8,
          plannedWeightPerSet: 185
        });
        break;
      }

      case FullAppScenario.FreshStart:
        // Base data only: exercises, equipment, muscle groups. No mesocycle.
        break;

      case FullAppScenario.FreeFormWorkout:
        return MockScenarioService.#setupFreeFormWorkoutScenario(baseData);

      case FullAppScenario.AllComplete: {
        const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: DateService.addDays(new Date(), -28),
          completedSessionCount: 999
        });
        mesocycleMapServiceMock.fillLateFields(data);
        break;
      }

      case FullAppScenario.ReviewPending:
        // 8 completed sessions but late fields NOT filled, which shows the "Review" state
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: DateService.addDays(new Date(), -21),
          completedSessionCount: 8
        });
        break;

      case FullAppScenario.MesocycleStart:
        // Mesocycle with generated microcycles, no sessions started
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 6,
          startDate: DateService.addDays(new Date(), 0),
          completedSessionCount: 0
        });
        break;

      case FullAppScenario.VeryLateSession: {
        // 2 full microcycles complete with all reviews done, next session ~14 days late
        const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: DateService.addDays(new Date(), -28),
          completedSessionCount: 10
        });
        mesocycleMapServiceMock.fillLateFields(data);
        break;
      }

      case FullAppScenario.DeloadTrigger:
        return MockScenarioService.#setupDeloadTriggerScenario(baseData);

      case FullAppScenario.HistoricalData:
        // The last mesocycle was completed yesterday, so the user lands on the
        // home page ready to generate a new (4th) mesocycle.
        MockScenarioService.#setupHistoricalDataScenario(baseData, 1);
        break;
    }

    return null;
  }

  /**
   * Returns session IDs belonging to the given microcycle indices within the
   * generated mesocycle data. Microcycles are matched by position in the array
   * (which mirrors generation order).
   *
   * @param data The generated mesocycle data
   * @param microcycleIndices 0-based indices of microcycles to collect session IDs from
   */
  static #getSessionIdsForMicrocycles(
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
   * Returns the URL of that session, or `null` if no session is left to
   * complete.
   *
   * Layout: 6 microcycles (5 accumulation + 1 deload), 5 sessions per microcycle.
   * - Microcycles 0-1: fully complete, normal performance
   * - Microcycle 2: fully complete, performance drops applied
   * - Microcycle 3: fully complete, performance drops applied
   * - Microcycle 4: first session has all sets filled but NOT marked complete
   * - Microcycle 5: deload (untouched)
   *
   * Using 6 microcycles is important: with fewer, microcycle 4 would be the
   * deload microcycle whose sets lack `plannedRir`, causing the surplus
   * calculation to bail out.
   *
   * The deload check looks at the last 2 microcycles relative to the current
   * one. When the user completes the session in microcycle 4 (index 4, which
   * is >= MIN_MICROCYCLE_INDEX_FOR_DELOAD of 2), microcycles 3 and 4 are
   * examined, and the consecutive drops across those microcycles satisfy
   * Rule 2 for multiple exercises.
   *
   * @param baseData The base exercise/calibration/equipment data
   */
  static #setupDeloadTriggerScenario(baseData: MockBaseData): string | null {
    const sessionsPerMicrocycle = 5;
    const microcycleCount = 6;
    // Complete all sessions in microcycles 0-3 (4 * 5 = 20)
    const completedSessionCount = sessionsPerMicrocycle * 4;

    const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
      title: 'Overreaching Block',
      cycleType: CycleType.MuscleGain,
      microcycleCount,
      sessionsPerMicrocycle,
      startDate: DateService.addDays(new Date(), -(microcycleCount * 7)),
      completedSessionCount
    });

    // Mark microcycle 3 (index 3) as completed so that sessions in microcycle 4
    // are unlocked. generateFullMesocycle intentionally leaves the last fully-
    // completed microcycle without completedDate (to show the "advance" hero card),
    // but for this scenario the user needs to be IN microcycle 4.
    data.microcycles[3].completedDate = new Date();

    // Apply performance drops to all sessions in microcycles 2 and 3
    // This ensures 2+ consecutive drops for each exercise across those microcycles
    const dropSessionIds = MockScenarioService.#getSessionIdsForMicrocycles(data, [2, 3]);
    mesocycleMapServiceMock.applyPerformanceDrops(data, dropSessionIds);

    // Fill late fields for completed sessions (mid-session fields already set by generateFullMesocycle)
    mesocycleMapServiceMock.fillLateFields(data);

    // Fill all sets on the first incomplete session (microcycle 4, first session)
    // so it appears ready to complete with continued poor performance
    const firstIncomplete = data.sessions.find((s) => !s.complete);
    if (!firstIncomplete) return null;

    mesocycleMapServiceMock.fillSessionSets(data, firstIncomplete._id, {
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

    return `/session?sessionId=${firstIncomplete._id}`;
  }

  /**
   * Sets up 3 completed mesocycles with progressive volume, providing rich
   * historical data. The 3rd mesocycle was completed `lastCompletedDaysAgo`
   * days ago, and every other date in the history moves with it.
   *
   * Each mesocycle has 5 accumulation microcycles + 1 deload (6 total).
   * Some exercises are shared across all 3 for continuity; the data includes
   * RSM, soreness, performance scores, and calibration documents.
   *
   * Also includes several completed free-form sessions spread across the
   * historical period.
   *
   * @param baseData The base exercise/calibration/equipment data
   * @param lastCompletedDaysAgo How many days ago the 3rd mesocycle was completed
   */
  static #setupHistoricalDataScenario(baseData: MockBaseData, lastCompletedDaysAgo: number): void {
    const microcycleCount = 6;
    const sessionsPerMicrocycle = 5;
    const totalSessions = microcycleCount * sessionsPerMicrocycle;
    // The day counts below place the 3rd mesocycle's completion 1 day ago
    const daysOffset = lastCompletedDaysAgo - 1;

    for (let mesoIndex = 0; mesoIndex < 3; mesoIndex++) {
      // Each mesocycle starts further in the past; ~6 weeks each + 1 week gap
      const weeksPerMeso = microcycleCount + 1;
      const mesoStartDaysAgo = (3 - mesoIndex) * weeksPerMeso * 7 + daysOffset;
      const completedDaysAgo = mesoStartDaysAgo - microcycleCount * 7;

      const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
        title: `Hypertrophy Block ${mesoIndex + 1}`,
        cycleType: CycleType.MuscleGain,
        microcycleCount,
        sessionsPerMicrocycle,
        startDate: DateService.addDays(new Date(), -mesoStartDaysAgo),
        completedSessionCount: totalSessions,
        completedDate: DateService.addDays(
          new Date(),
          -(mesoIndex === 2 ? lastCompletedDaysAgo : completedDaysAgo)
        )
      });

      // Fill late fields (mid-session fields already set by generateFullMesocycle)
      mesocycleMapServiceMock.fillLateFields(data);

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

    // Completed free-form sessions spread across the historical period
    const completedFreeFormConfigs: Array<{
      daysAgoCount: number;
      exerciseCount: number;
      setsPerExercise: number;
    }> = [
      { daysAgoCount: 100, exerciseCount: 3, setsPerExercise: 3 },
      { daysAgoCount: 62, exerciseCount: 2, setsPerExercise: 4 },
      { daysAgoCount: 30, exerciseCount: 4, setsPerExercise: 3 },
      { daysAgoCount: 10, exerciseCount: 3, setsPerExercise: 4 }
    ];

    for (const config of completedFreeFormConfigs) {
      const startTime = DateService.addDays(new Date(), -(config.daysAgoCount + daysOffset));
      sessionMapServiceMock.addFreeFormSession(baseData, {
        title: sessionMapService.getFormattedSessionTitle(startTime),
        startTime,
        complete: true,
        exerciseCount: config.exerciseCount,
        setsPerExercise: config.setsPerExercise,
        loggedSetCount: config.exerciseCount * config.setsPerExercise
      });
    }
  }

  /**
   * Sets up a free-form workout scenario: no mesocycle and one in-progress
   * free-form session with 2 exercises (first exercise partially logged).
   * Returns the URL of that session.
   *
   * @param baseData The base exercise/calibration/equipment data
   */
  static #setupFreeFormWorkoutScenario(baseData: MockBaseData): string {
    const session = sessionMapServiceMock.addFreeFormSession(baseData, {
      exerciseCount: 2,
      setsPerExercise: 3,
      loggedSetCount: 2
    });

    return `/session?sessionId=${session._id}`;
  }
}
