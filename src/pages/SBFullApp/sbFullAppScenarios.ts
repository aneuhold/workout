import { CycleType } from '@aneuhold/core-ts-db-lib';
import MesocycleMapServiceMock from '$services/documentMapServices/mesocycleMapService.mock';
import { daysAgo } from '$testUtils/dateUtils';
import MockData from '$testUtils/MockData';

export enum FullAppScenario {
  MidTraining = 'midTraining',
  FreshStart = 'freshStart',
  AllComplete = 'allComplete',
  ReviewPending = 'reviewPending',
  MesocycleStart = 'mesocycleStart'
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
  }
}
