import type { WorkoutMicrocycle, WorkoutSession } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import createWorkoutPersistToDb from '$util/createWorkoutPersistToDb';
import LocalData from '$util/LocalData/LocalData';
import sessionMapService from './sessionMapService.svelte';

class MicrocycleDocumentMapService extends DocumentMapStoreService<WorkoutMicrocycle> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetMicrocycleMap(map),
      persistToDb: createWorkoutPersistToDb('microcycles')
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
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  /**
   * Returns sessions for a microcycle in `sessionOrder` sequence.
   * O(s) where s = sessionOrder.length, each lookup is O(1).
   *
   * @param microcycle the microcycle to get sessions for
   */
  getOrderedSessionsForMicrocycle(microcycle: WorkoutMicrocycle): WorkoutSession[] {
    return microcycle.sessionOrder
      .map((id) => sessionMapService.getDoc(id))
      .filter((s): s is WorkoutSession => s !== undefined);
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
}

export default new MicrocycleDocumentMapService();
