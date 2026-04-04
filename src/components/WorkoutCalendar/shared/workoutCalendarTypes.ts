import type { WorkoutExercise, WorkoutSet } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';

/** An exercise and its sets for display in a day cell or detail dialog. */
export type WorkoutCalendarExercise = WorkoutExercise & {
  /** Ordered list of sets for this exercise on this day. */
  sets: WorkoutSet[];
  /** Whether this exercise is a recovery exercise due to high soreness / low performance. */
  isRecoveryExercise: boolean;
};

/** A single workout session mapped to a calendar day. */
export type WorkoutCalendarSession = {
  /** Document ID of the underlying WorkoutSession. */
  sessionId: UUID;
  /** Session title (e.g. "Push A"). */
  title: string;
  /** Whether the session has been marked complete. */
  completed: boolean;
  /** Exercises scheduled for this session with their sets. */
  exercises: WorkoutCalendarExercise[];
  /** Whether any exercise in this session is a recovery exercise. */
  hasRecoveryExercise: boolean;
  /** Whether this session is a free-form session (not tied to a microcycle). */
  isFreeForm: boolean;
};

/** Base day-cell data shared by all workout calendar views. */
export type WorkoutCalendarDayCell = {
  /** Calendar date this cell represents. */
  date: Date;
  /** Whether sessions exist on this day. */
  type: 'session' | 'empty';
  /** Sessions on this day (empty array if none). */
  sessions: WorkoutCalendarSession[];
};
