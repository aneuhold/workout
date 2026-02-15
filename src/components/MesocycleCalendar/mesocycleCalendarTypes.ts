import type { UUID } from 'crypto';

/** Whether the calendar shows a live in-progress mesocycle or a static preview. */
export type MesocycleCalendarMode = 'in-progress' | 'preview';

/** Planned targets for a single set within a session exercise. */
export type MesocycleCalendarSet = {
  /** 1-based set number within the exercise. */
  setNumber: number;
  /** Target rep count projected by the generation algorithm. */
  plannedReps?: number;
  /** Target weight (lb) projected by the generation algorithm. */
  plannedWeight?: number;
  /** Target reps-in-reserve projected by the generation algorithm. */
  plannedRir?: number;
};

/** An exercise and its planned sets for display in a day cell or detail dialog. */
export type MesocycleCalendarExercise = {
  /** Human-readable exercise name (e.g. "Barbell Bench Press"). */
  exerciseName: string;
  /** Rep range category for this exercise (e.g. "Heavy", "Medium", "Light"). */
  repRange: string;
  /** Ordered list of planned sets for this exercise on this day. */
  sets: MesocycleCalendarSet[];
};

/** A single workout session mapped to a calendar day. */
export type MesocycleCalendarSession = {
  /** Document ID of the underlying WorkoutSession. */
  sessionId: UUID;
  /** Session title (e.g. "Push A"). */
  title: string;
  /** Whether the session has been marked complete. */
  completed: boolean;
  /** Exercises scheduled for this session with their planned sets. */
  exercises: MesocycleCalendarExercise[];
};

/** A single calendar day cell in the 7-column grid. */
export type MesocycleCalendarDayCell = {
  /** 0-based index from the mesocycle start date. */
  dayIndex: number;
  /** Calendar date this cell represents. */
  date: Date;
  /** 1-based microcycle number this day falls in. */
  cycleNumber: number;
  /** Whether this day is in the final (deload) microcycle. */
  isDeload: boolean;
  /** Whether this day is the first day of its microcycle. */
  isCycleStart: boolean;
  /** What kind of day: rest, session (has workouts), or empty (non-rest with no sessions). */
  type: 'rest' | 'session' | 'empty';
  /** Sessions scheduled on this day (empty for rest/empty days). */
  sessions: MesocycleCalendarSession[];
};

/** A cycle or month label positioned at a specific column in a label row. */
export type MesocycleCalendarLabelEntry = {
  /** 0-based column index (0 = Sunday, 6 = Saturday). */
  columnIndex: number;
  /** Cycle label shown when a new microcycle starts (e.g. "Cycle 1", "Deload"). */
  cycleLabel?: string;
  /** Month label shown when a new calendar month starts (e.g. "Feb 2026"). */
  monthLabel?: string;
};

/** One row of 7 day cells plus an optional label row above it. */
export type MesocycleCalendarWeekRow = {
  /** 7 day cells (or null for padding before/after the mesocycle date range). */
  days: (MesocycleCalendarDayCell | null)[];
  /** Cycle/month labels to render above this row, or null if no labels needed. */
  labelRow: MesocycleCalendarLabelEntry[] | null;
};

/** Full grid data produced by the layout utility for the calendar component. */
export type MesocycleCalendarData = {
  /** Rows of the 7-column calendar grid, top to bottom. */
  weekRows: MesocycleCalendarWeekRow[];
  /** Total number of days across all microcycles. */
  totalDays: number;
  /** Number of microcycles in the mesocycle. */
  microcycleCount: number;
  /** Length of each microcycle in days. */
  microcycleLengthDays: number;
};
