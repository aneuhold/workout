import type {
  WorkoutMesocycle,
  WorkoutMicrocycle,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import createWorkoutPersistToDb from '$util/createWorkoutPersistToDb';
import LocalData from '$util/LocalData/LocalData';
import microcycleMapService from './microcycleMapService.svelte';
import sessionExerciseMapService from './sessionExerciseMapService.svelte';
import sessionMapService from './sessionMapService.svelte';

function hasCompletedDate(m: WorkoutMesocycle): m is WorkoutMesocycle & { completedDate: Date } {
  return m.completedDate != null;
}

class MesocycleDocumentMapService extends DocumentMapStoreService<WorkoutMesocycle> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetMesocycleMap(map),
      persistToDb: createWorkoutPersistToDb('mesocycles')
    });
  }

  /**
   * Returns the first mesocycle without a `completedDate`, or null.
   * O(n) where n = total mesocycles.
   */
  getActiveMesocycle(): WorkoutMesocycle | null {
    return this.getDocs().find((m) => !m.completedDate) ?? null;
  }

  /**
   * Returns completed mesocycles sorted most-recent-first by `completedDate`.
   * O(n log n) where n = total mesocycles.
   */
  getPastMesocycles(): WorkoutMesocycle[] {
    return this.getDocs()
      .filter(hasCompletedDate)
      .sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime());
  }

  /**
   * Single entry point for all docs belonging to a mesocycle. Runs the O(n)
   * microcycle scan once, then traverses down via O(1) order-array lookups.
   * Microcycles are sorted by `startDate`; sessions, exercises, and sets
   * preserve their respective order-array sequences.
   * Overall: O(n log m + s + e + t) where n = total microcycles,
   * m = matched microcycles, s = sessions, e = exercises, t = sets.
   *
   * @param mesocycleId ID of the mesocycle to get associated docs for.
   */
  getAssociatedDocsForMesocycle(mesocycleId: UUID): {
    microcycles: WorkoutMicrocycle[];
    sessions: WorkoutSession[];
    sessionExercises: WorkoutSessionExercise[];
    sets: WorkoutSet[];
  } {
    const microcycles = microcycleMapService.getOrderedMicrocyclesForMesocycle(mesocycleId);
    const sessions = microcycleMapService.getOrderedSessionsForMicrocycles(microcycles);
    const sessionExercises = sessionMapService.getOrderedSessionExercisesForSessions(sessions);
    const sets = sessionExercises.flatMap((sessionExercise) =>
      sessionExerciseMapService.getOrderedSetsForSessionExercise(sessionExercise)
    );
    return { microcycles, sessions, sessionExercises, sets };
  }
}

export default new MesocycleDocumentMapService();
