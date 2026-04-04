import type { WorkoutCalendarDayCell } from '../shared/workoutCalendarTypes';

/** A single calendar day cell in the WorkoutSessionCalendar month grid. */
export type WorkoutSessionCalendarDayCell = WorkoutCalendarDayCell & {
  /** Whether this date is today. */
  isToday: boolean;
  /** Whether this date is outside the displayed month (leading/trailing days). */
  isOutsideMonth: boolean;
};

/** The full month grid produced by workoutSessionCalendarUtils.buildMonthGrid. */
export type WorkoutSessionCalendarMonthGrid = {
  weekRows: WorkoutSessionCalendarDayCell[][];
};
