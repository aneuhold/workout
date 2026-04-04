import type { WorkoutCalendarDayCell } from '../shared/workoutCalendarTypes';

/**
 * A single calendar day cell in the mesocycle 7-column grid.
 * Omits `type` from the base to allow adding the mesocycle-only `'rest'` variant.
 */
export type WorkoutMesocycleCalendarDayCell = Omit<WorkoutCalendarDayCell, 'type'> & {
  /** 0-based index from the mesocycle start date. */
  dayIndex: number;
  /** 1-based microcycle number this day falls in. */
  cycleNumber: number;
  /** Whether this day is in the final (deload) microcycle. */
  isDeload: boolean;
  /** Whether this day is the first day of its microcycle. */
  isCycleStart: boolean;
  /** What kind of day: rest, session (has workouts), or empty (non-rest with no sessions). */
  type: 'rest' | 'session' | 'empty';
};

/** A cycle or month label positioned at a specific column in a label row. */
export type WorkoutMesocycleCalendarLabelEntry = {
  /** 0-based column index (0 = Sunday, 6 = Saturday). */
  columnIndex: number;
  /** Cycle label shown when a new microcycle starts (e.g. "Cycle 1", "Deload"). */
  cycleLabel?: string;
  /** Month label shown when a new calendar month starts (e.g. "Feb 2026"). */
  monthLabel?: string;
};

/** One row of 7 day cells plus an optional label row above it. */
export type WorkoutMesocycleCalendarWeekRow = {
  /** 7 day cells (or null for padding before/after the mesocycle date range). */
  days: (WorkoutMesocycleCalendarDayCell | null)[];
  /** Cycle/month labels to render above this row, or null if no labels needed. */
  labelRow: WorkoutMesocycleCalendarLabelEntry[] | null;
};

/** Full grid data produced by the layout utility for the mesocycle calendar component. */
export type WorkoutMesocycleCalendarData = {
  /** Rows of the 7-column calendar grid, top to bottom. */
  weekRows: WorkoutMesocycleCalendarWeekRow[];
  /** Total number of days across all microcycles. */
  totalDays: number;
  /** Number of microcycles in the mesocycle. */
  microcycleCount: number;
  /** Length of each microcycle in days. */
  microcycleLengthDays: number;
};
