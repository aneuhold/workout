import type { ProjectWorkoutPrimaryEndpointOptions } from '@aneuhold/core-ts-api-lib';
import type { WorkoutMicrocycle, WorkoutSession } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import DocumentMapStoreService from '$services/DocumentMapStore.service.svelte';
import LocalData from '$util/LocalData/LocalData';
import {
  createWorkoutPersistToDb,
  createWorkoutPrepareForSave
} from '$util/workoutPersistenceUtils';
import sessionMapService from './SessionMap.service.svelte';

class MicrocycleDocumentMapService extends DocumentMapStoreService<WorkoutMicrocycle> {
  constructor() {
    super({
      persistToLocalData: (map) => {
        void LocalData.setDocumentMap(LocalData.storedKeyNames.microcycleMap, map);
      },
      loadFromLocalData: () =>
        LocalData.getDocumentMap<WorkoutMicrocycle>(LocalData.storedKeyNames.microcycleMap),
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
    return this.allDocs
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
    return a.startDate.getTime() - b.startDate.getTime();
  }

  /**
   * Queues an update that removes a session ID from its owning microcycle's
   * `sessionOrder`. A no-op when the session has no microcycle or the
   * microcycle isn't in the store. We intentionally do not delete an emptied
   * microcycle here — unlike `initiateEarlyDeload`,
   * `WorkoutMesocycleService.cleanUpIncompleteMicrocycles` treats an empty
   * `sessionOrder` as incomplete and sweeps it on the next advance, avoiding
   * mid-mesocycle index gaps from piecemeal deletion.
   *
   * @param sessionId Session being removed.
   * @param apiOptions Optional existing API options to extend.
   */
  prepareDeleteSessionFromMicrocycle(
    sessionId: UUID,
    apiOptions?: ProjectWorkoutPrimaryEndpointOptions
  ): ProjectWorkoutPrimaryEndpointOptions {
    const options = apiOptions ?? {};
    const session = sessionMapService.getDoc(sessionId);
    if (!session?.workoutMicrocycleId) return options;

    const microcycle = this.getDoc(session.workoutMicrocycleId);
    if (!microcycle) return options;

    microcycle.sessionOrder = microcycle.sessionOrder.filter((id) => id !== sessionId);
    return this.prepareDocsForSave({ update: [microcycle] }, options);
  }
}

const microcycleDocumentMapService = new MicrocycleDocumentMapService();
export default microcycleDocumentMapService;
