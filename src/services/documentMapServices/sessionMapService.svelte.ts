import type { WorkoutSession, WorkoutSessionExercise, WorkoutSet } from '@aneuhold/core-ts-db-lib';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';
import sessionExerciseMapService from './sessionExerciseMapService.svelte';

class SessionDocumentMapService extends DocumentMapStoreService<WorkoutSession> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetSessionMap(map),
      persistToDb: createWorkoutPersistToDb('sessions'),
      prepareForSave: createWorkoutPrepareForSave('sessions')
    });
  }

  /**
   * Returns session exercises for a session in `sessionExerciseOrder` sequence.
   * O(e) where e = sessionExerciseOrder.length, each lookup is O(1).
   *
   * @param session the session to get session exercises for
   */
  getOrderedSessionExercisesForSession(session: WorkoutSession): WorkoutSessionExercise[] {
    return sessionExerciseMapService.getDocsWithIds(session.sessionExerciseOrder);
  }

  /**
   * Returns session exercises for multiple sessions, preserving order within
   * each session. O(e_total) where e_total is the sum of all
   * sessionExerciseOrder lengths.
   *
   * @param sessions the sessions to get session exercises for
   */
  getOrderedSessionExercisesForSessions(sessions: WorkoutSession[]): WorkoutSessionExercise[] {
    return sessions.flatMap((s) => this.getOrderedSessionExercisesForSession(s));
  }

  /**
   * Returns all sets for a session by traversing sessionExercises → sets,
   * preserving order within each exercise. O(e + t) where e = session
   * exercises, t = total sets.
   *
   * @param session the session to get sets for
   */
  getOrderedSetsForSession(session: WorkoutSession): WorkoutSet[] {
    return this.getOrderedSessionExercisesForSession(session).flatMap((se) =>
      sessionExerciseMapService.getOrderedSetsForSessionExercise(se)
    );
  }

  /**
   * Returns all sets across multiple sessions, preserving order within each
   * session and exercise. O(e_total + t_total).
   *
   * @param sessions the sessions to get sets for
   */
  getOrderedSetsForSessions(sessions: WorkoutSession[]): WorkoutSet[] {
    return sessions.flatMap((s) => this.getOrderedSetsForSession(s));
  }
}

export default new SessionDocumentMapService();
