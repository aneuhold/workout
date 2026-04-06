import type {
  WorkoutExercise,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import type { WorkoutCalendarExercise, WorkoutCalendarSession } from './workoutCalendarTypes';

class WorkoutCalendarUtils {
  /**
   * Adds the specified number of days to a date and returns a new Date.
   *
   * @param date - The base date
   * @param days - Number of days to add (may be negative)
   */
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Returns true if the date is in a different month than prevDate,
   * or if prevDate is null (first date in the sequence).
   *
   * @param date - The current date to check
   * @param prevDate - The previous date, or null if none
   */
  isNewMonth(date: Date, prevDate: Date | null): boolean {
    if (!prevDate) return true;
    return date.getMonth() !== prevDate.getMonth() || date.getFullYear() !== prevDate.getFullYear();
  }

  /**
   * Formats a date as a short month + year label (e.g. "Feb 2026").
   *
   * @param date - The date to format
   */
  formatMonthLabel(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  /**
   * Returns a string key uniquely identifying a calendar day.
   * Uses year, 0-based month, and day-of-month for consistent matching.
   *
   * @param date - The date to convert to a key
   */
  normalizedDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  /**
   * Builds a lookup map from exercise ID to exercise document.
   *
   * @param exercises - The exercise documents to index
   */
  buildExerciseMap(exercises: WorkoutExercise[]): Map<UUID, WorkoutExercise> {
    return new Map(exercises.map((e) => [e._id, e]));
  }

  /**
   * Builds a lookup map from session ID to its session exercises.
   *
   * @param sessionExercises - All session exercise documents
   */
  buildSessionExerciseLookup(
    sessionExercises: WorkoutSessionExercise[]
  ): Map<UUID, WorkoutSessionExercise[]> {
    const map = new Map<UUID, WorkoutSessionExercise[]>();
    for (const se of sessionExercises) {
      const existing = map.get(se.workoutSessionId) ?? [];
      existing.push(se);
      map.set(se.workoutSessionId, existing);
    }
    return map;
  }

  /**
   * Builds a lookup map from session exercise ID to its sets.
   *
   * @param sets - All set documents
   */
  buildSetLookup(sets: WorkoutSet[]): Map<UUID, WorkoutSet[]> {
    const map = new Map<UUID, WorkoutSet[]>();
    for (const s of sets) {
      const existing = map.get(s.workoutSessionExerciseId) ?? [];
      existing.push(s);
      map.set(s.workoutSessionExerciseId, existing);
    }
    return map;
  }

  /**
   * Builds a lookup map from normalized date key to sessions on that day.
   *
   * @param sessions - All session documents to index
   */
  buildSessionsByDateLookup(sessions: WorkoutSession[]): Map<string, WorkoutSession[]> {
    const map = new Map<string, WorkoutSession[]>();
    for (const session of sessions) {
      const dateKey = this.normalizedDateKey(new Date(session.startTime));
      const existing = map.get(dateKey) ?? [];
      existing.push(session);
      map.set(dateKey, existing);
    }
    return map;
  }

  /**
   * Builds the calendar session list for a given day's sessions using prebuilt lookup maps.
   * Exercises with no matching document in `exerciseMap` are silently omitted.
   *
   * @param daySessions - Sessions that fall on this day
   * @param sessionExercisesBySession - Lookup from session ID to session exercises
   * @param setsBySessionExercise - Lookup from session exercise ID to sets
   * @param exerciseMap - Lookup from exercise ID to exercise document
   * @param computeIsFreeForm - Returns true if the session is a free-form session
   */
  buildSessionsForDay(
    daySessions: WorkoutSession[],
    sessionExercisesBySession: Map<UUID, WorkoutSessionExercise[]>,
    setsBySessionExercise: Map<UUID, WorkoutSet[]>,
    exerciseMap: Map<UUID, WorkoutExercise>,
    computeIsFreeForm: (session: WorkoutSession) => boolean
  ): WorkoutCalendarSession[] {
    return daySessions.map((session) => {
      const sesExercises = sessionExercisesBySession.get(session._id) ?? [];
      const exercises: WorkoutCalendarExercise[] = sesExercises.flatMap((se) => {
        const exercise = exerciseMap.get(se.workoutExerciseId);
        if (!exercise) return [];
        const seSets = setsBySessionExercise.get(se._id) ?? [];
        return [{ ...exercise, sets: seSets, isRecoveryExercise: se.isRecoveryExercise }];
      });
      return {
        sessionId: session._id,
        title: session.title,
        completed: session.complete,
        exercises,
        hasRecoveryExercise: exercises.some((e) => e.isRecoveryExercise),
        isFreeForm: computeIsFreeForm(session)
      };
    });
  }
}

export default new WorkoutCalendarUtils();
