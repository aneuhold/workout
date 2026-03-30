import type { WorkoutSession, WorkoutSessionExercise, WorkoutSet } from '@aneuhold/core-ts-db-lib';
import {
  WorkoutSessionExerciseSchema,
  WorkoutSessionSchema,
  WorkoutSetSchema
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import type { Updater } from 'svelte/store';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import WorkoutAPIService from '$services/WorkoutAPIService';
import { userConfig } from '$stores/local/userConfig/userConfig';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';
import exerciseMapService from './exerciseMapService.svelte';
import sessionExerciseMapService from './sessionExerciseMapService.svelte';
import setMapService from './setMapService.svelte';

class SessionDocumentMapService extends DocumentMapStoreService<WorkoutSession> {
  /**
   * Free-form sessions (no microcycle) categorized into in-progress and
   * completed, sorted by startTime descending.
   */
  readonly freeFormSessions = $derived.by(() => {
    const freeForm = this.allDocs.filter((s) => s.workoutMicrocycleId == null);
    const inProgress = freeForm.find((s) => !s.complete) ?? null;
    const completed = freeForm
      .filter((s) => s.complete)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    return { inProgress, completed };
  });

  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetSessionMap(map),
      persistToDb: createWorkoutPersistToDb('sessions'),
      prepareForSave: createWorkoutPrepareForSave('sessions')
    });
  }

  override updateDoc(docId: UUID, mutator: Updater<WorkoutSession>): void {
    const ctoGet = { exerciseCTOs: { all: true }, muscleGroupVolumeCTOs: { all: true } };
    const wasComplete = this.getDoc(docId)?.complete ?? false;
    super.updateDoc(docId, mutator, ctoGet);
    const session = this.getDoc(docId);
    if (session && !wasComplete && session.complete) {
      const sessionExercises = this.getOrderedSessionExercisesForSession(session);
      const sets = this.getOrderedSetsForSession(session);
      exerciseMapService.updateCTOsForCompletedSession(sessionExercises, sets);
    }
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

  /**
   * Formats a date into a human-readable session title (e.g. "March 29 Workout").
   *
   * @param date The date to format
   */
  getFormattedSessionTitle(date: Date): string {
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    return `${month} ${day} Workout`;
  }

  /**
   * Creates a new free-form workout session (no microcycle), persists it, and
   * returns the new session.
   */
  createFreeFormSession(): WorkoutSession {
    const now = new Date();
    const session = WorkoutSessionSchema.parse({
      userId: userConfig.get().userId,
      workoutMicrocycleId: null,
      title: this.getFormattedSessionTitle(now),
      startTime: now,
      complete: false,
      sessionExerciseOrder: []
    });
    this.addDoc(session);
    return session;
  }

  /**
   * Returns true if the session is a free-form session (no microcycle).
   *
   * @param session The session to check
   */
  isFreeFormSession(session: WorkoutSession): boolean {
    return session.workoutMicrocycleId == null;
  }

  /**
   * Adds exercises to a session. For each exercise ID, creates a
   * WorkoutSessionExercise with 1 empty WorkoutSet, and appends to the
   * session's sessionExerciseOrder.
   *
   * @param sessionId The session to add exercises to
   * @param exerciseIds Ordered exercise IDs to add
   */
  addExercisesToSession(sessionId: UUID, exerciseIds: UUID[]): void {
    const session = this.getDoc(sessionId);
    if (!session) return;

    const userId = session.userId;
    const newSessionExerciseIds: UUID[] = [];
    const apiOptions = this.prepareDocsForSave({});

    for (const exerciseId of exerciseIds) {
      const sessionExercise = WorkoutSessionExerciseSchema.parse({
        userId,
        workoutSessionId: sessionId,
        workoutExerciseId: exerciseId,
        setOrder: []
      });

      const set = WorkoutSetSchema.parse({
        userId,
        workoutExerciseId: exerciseId,
        workoutSessionId: sessionId,
        workoutSessionExerciseId: sessionExercise._id
      });

      sessionExercise.setOrder = [set._id];

      sessionExerciseMapService.prepareDocsForSave({ insert: [sessionExercise] }, apiOptions);
      setMapService.prepareDocsForSave({ insert: [set] }, apiOptions);

      newSessionExerciseIds.push(sessionExercise._id);
    }

    session.sessionExerciseOrder = [...session.sessionExerciseOrder, ...newSessionExerciseIds];
    this.prepareDocsForSave({ update: [session] }, apiOptions);

    WorkoutAPIService.queryApi(apiOptions);
  }

  /**
   * Removes an exercise and all its sets from a session.
   *
   * @param sessionId The session containing the exercise
   * @param sessionExerciseId The session exercise to remove
   */
  removeExerciseFromSession(sessionId: UUID, sessionExerciseId: UUID): void {
    const session = this.getDoc(sessionId);
    const sessionExercise = sessionExerciseMapService.getDoc(sessionExerciseId);
    if (!session || !sessionExercise) return;

    const setIds = sessionExercise.setOrder;

    const apiOptions = setMapService.prepareDocsForSave({ delete: [...setIds] });
    sessionExerciseMapService.prepareDocsForSave({ delete: [sessionExerciseId] }, apiOptions);

    session.sessionExerciseOrder = session.sessionExerciseOrder.filter(
      (id) => id !== sessionExerciseId
    );
    this.prepareDocsForSave({ update: [session] }, apiOptions);

    WorkoutAPIService.queryApi(apiOptions);
  }
}

export default new SessionDocumentMapService();
