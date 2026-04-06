import type {
  WorkoutExercise,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet
} from '@aneuhold/core-ts-db-lib';
import workoutCalendarUtils from '../shared/workoutCalendarUtils';
import type {
  WorkoutSessionCalendarDayCell,
  WorkoutSessionCalendarMonthGrid
} from './workoutSessionCalendarTypes';

class WorkoutSessionCalendarUtils {
  /**
   * Builds a 7-column month grid for the given year/month.
   * Leading and trailing days from adjacent months are included as outside-month padding.
   * Sessions are matched to days by their `startTime` date.
   *
   * @param input - All data needed to render the month grid
   * @param input.year - The calendar year to display
   * @param input.month - 0-based month (0 = January)
   * @param input.sessions - Sessions to display on the calendar
   * @param input.sessionExercises - Session exercises for populating day detail views
   * @param input.sets - Sets for populating day detail views
   * @param input.exercises - Exercise documents used for name lookups
   */
  buildMonthGrid(input: {
    year: number;
    /** 0-based month (0 = January). */
    month: number;
    sessions: WorkoutSession[];
    sessionExercises: WorkoutSessionExercise[];
    sets: WorkoutSet[];
    exercises: WorkoutExercise[];
  }): WorkoutSessionCalendarMonthGrid {
    const { year, month, sessions, sessionExercises, sets, exercises } = input;

    const today = new Date();
    const todayKey = workoutCalendarUtils.normalizedDateKey(today);

    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    // Leading padding days (from previous month, to fill first week starting on Sunday)
    const leadingDays = firstOfMonth.getDay();
    // Trailing padding days (to fill last row)
    const trailingDays = (7 - (lastOfMonth.getDay() + 1)) % 7;

    const gridStart = workoutCalendarUtils.addDays(firstOfMonth, -leadingDays);
    const totalDays = leadingDays + lastOfMonth.getDate() + trailingDays;

    // Build lookup maps
    const exerciseMap = workoutCalendarUtils.buildExerciseMap(exercises);
    const sessionExercisesBySession =
      workoutCalendarUtils.buildSessionExerciseLookup(sessionExercises);
    const setsBySessionExercise = workoutCalendarUtils.buildSetLookup(sets);
    const sessionsByDate = workoutCalendarUtils.buildSessionsByDateLookup(sessions);

    // Build flat array of day cells
    const allDays: WorkoutSessionCalendarDayCell[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = workoutCalendarUtils.addDays(gridStart, i);
      const dateKey = workoutCalendarUtils.normalizedDateKey(date);
      const isOutsideMonth = date.getMonth() !== month || date.getFullYear() !== year;
      const isToday = dateKey === todayKey;
      const daySessions = sessionsByDate.get(dateKey) ?? [];

      const sessionsOnDay = workoutCalendarUtils.buildSessionsForDay(
        daySessions,
        sessionExercisesBySession,
        setsBySessionExercise,
        exerciseMap,
        (session) => session.workoutMicrocycleId == null
      );

      allDays.push({
        date,
        type: daySessions.length > 0 ? 'session' : 'empty',
        sessions: sessionsOnDay,
        isToday,
        isOutsideMonth
      });
    }

    // Group into rows of 7
    const weekRows: WorkoutSessionCalendarDayCell[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weekRows.push(allDays.slice(i, i + 7));
    }

    return { weekRows };
  }
}

export default new WorkoutSessionCalendarUtils();
