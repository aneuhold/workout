import type { WorkoutMicrocycle, WorkoutSession } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';
import sessionMapService from './sessionMapService.svelte';

class MicrocycleDocumentMapService extends DocumentMapStoreService<WorkoutMicrocycle> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetMicrocycleMap(map),
      persistToDb: createWorkoutPersistToDb('microcycles'),
      prepareForSave: createWorkoutPrepareForSave('microcycles')
    });
  }

  /**
   * Returns microcycles belonging to a mesocycle, sorted by `startDate`.
   * O(n log n) where n = total microcycles in the store (filter + sort).
   *
   * @param mesocycleId ID of the mesocycle to get microcycles for
   */
  getOrderedMicrocyclesForMesocycle(mesocycleId: UUID): WorkoutMicrocycle[] {
    return this.getDocs()
      .filter((mc) => mc.workoutMesocycleId === mesocycleId)
      .sort((a, b) => this.compareMicrocyclesByStartDate(a, b));
  }

  /**
   * Returns sessions for a microcycle in `sessionOrder` sequence.
   * O(s) where s = sessionOrder.length, each lookup is O(1).
   *
   * @param microcycle the microcycle to get sessions for
   */
  getOrderedSessionsForMicrocycle(microcycle: WorkoutMicrocycle): WorkoutSession[] {
    return sessionMapService.getDocsWithIds(microcycle.sessionOrder);
  }

  /**
   * Returns sessions across multiple microcycles, preserving order within
   * each microcycle. O(s_total) where s_total is the sum of all
   * sessionOrder lengths.
   *
   * @param microcycles the microcycles to get sessions for
   */
  getOrderedSessionsForMicrocycles(microcycles: WorkoutMicrocycle[]): WorkoutSession[] {
    return microcycles.flatMap((mc) => this.getOrderedSessionsForMicrocycle(mc));
  }

  /**
   * Comparator that sorts microcycles by `startDate` ascending.
   *
   * @param a First microcycle
   * @param b Second microcycle
   */
  compareMicrocyclesByStartDate(a: WorkoutMicrocycle, b: WorkoutMicrocycle): number {
    return Date.parse(a.startDate) - Date.parse(b.startDate);
  }
}

export default new MicrocycleDocumentMapService();
