import type {
  WorkoutExercise,
  WorkoutMesocycle,
  WorkoutMicrocycle,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet
} from '@aneuhold/core-ts-db-lib';
import workoutCalendarUtils from '../shared/workoutCalendarUtils';
import type {
  WorkoutMesocycleCalendarData,
  WorkoutMesocycleCalendarDayCell,
  WorkoutMesocycleCalendarLabelEntry,
  WorkoutMesocycleCalendarWeekRow
} from './workoutMesocycleCalendarTypes';

class WorkoutMesocycleCalendarUtils {
  /**
   * Returns the 0-based day-of-week index for the given start date.
   * Used to compute leading padding cells.
   *
   * @param startDate - The first day of the mesocycle
   */
  getDayOfWeekOffset(startDate: Date): number {
    return startDate.getDay();
  }

  /**
   * Formats a cycle number into a display label.
   *
   * @param cycleNumber - 1-based cycle number
   * @param isDeload - Whether this cycle is the deload cycle
   */
  formatCycleLabel(cycleNumber: number, isDeload: boolean): string {
    return isDeload ? 'Deload' : `Cycle ${cycleNumber}`;
  }

  /**
   * Builds the full calendar grid data for a mesocycle.
   *
   * @param input - All data needed to render the calendar
   * @param input.mesocycle - The mesocycle to build the grid for
   * @param input.microcycles - All microcycles belonging to the mesocycle
   * @param input.sessions - Sessions to display on the calendar
   * @param input.sessionExercises - Session exercises for populating day detail views
   * @param input.sets - Sets for populating day detail views
   * @param input.exercises - Exercise documents used for name and rep-range lookups
   * @param input.lastCycleIsDeload - When false, the last microcycle is not labelled as a deload
   */
  buildCalendarData(input: {
    mesocycle: WorkoutMesocycle;
    microcycles: WorkoutMicrocycle[];
    sessions: WorkoutSession[];
    sessionExercises: WorkoutSessionExercise[];
    sets: WorkoutSet[];
    exercises: WorkoutExercise[];
    /** When false, the last microcycle is not labelled as a deload. Defaults to true. */
    lastCycleIsDeload?: boolean;
  }): WorkoutMesocycleCalendarData {
    const {
      mesocycle,
      microcycles,
      sessions,
      sessionExercises,
      sets,
      exercises,
      lastCycleIsDeload = true
    } = input;

    const microcycleLengthDays = mesocycle.plannedMicrocycleLengthInDays;
    const microcycleCount = microcycles.length;
    const restDays = mesocycle.plannedMicrocycleRestDays;

    const sortedMicrocycles = [...microcycles].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    if (sortedMicrocycles.length === 0) {
      return { weekRows: [], totalDays: 0, microcycleCount: 0, microcycleLengthDays };
    }

    const startDate = new Date(sortedMicrocycles[0].startDate);
    const totalDays = microcycleLengthDays * microcycleCount;

    // Build lookup maps
    const exerciseMap = workoutCalendarUtils.buildExerciseMap(exercises);
    const sessionExercisesBySession =
      workoutCalendarUtils.buildSessionExerciseLookup(sessionExercises);
    const setsBySessionExercise = workoutCalendarUtils.buildSetLookup(sets);
    const sessionsByDate = workoutCalendarUtils.buildSessionsByDateLookup(sessions);

    // Build day cells
    const dayCells: WorkoutMesocycleCalendarDayCell[] = [];
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const date = workoutCalendarUtils.addDays(startDate, dayIndex);
      const cycleNumber = Math.floor(dayIndex / microcycleLengthDays) + 1;
      const isDeload = lastCycleIsDeload && cycleNumber === microcycleCount;
      const isCycleStart = dayIndex % microcycleLengthDays === 0;
      const dayInMicrocycle = dayIndex % microcycleLengthDays;
      const isRestDay = restDays.includes(dayInMicrocycle);

      const dateKey = workoutCalendarUtils.normalizedDateKey(date);
      const daySessions = sessionsByDate.get(dateKey) ?? [];

      let type: WorkoutMesocycleCalendarDayCell['type'];
      if (isRestDay) {
        type = 'rest';
      } else if (daySessions.length > 0) {
        type = 'session';
      } else {
        type = 'empty';
      }

      const sessionsOnDay = workoutCalendarUtils.buildSessionsForDay(
        daySessions,
        sessionExercisesBySession,
        setsBySessionExercise,
        exerciseMap,
        () => false
      );

      dayCells.push({
        dayIndex,
        date,
        cycleNumber,
        isDeload,
        isCycleStart,
        type,
        sessions: sessionsOnDay
      });
    }

    // Group into 7-column rows with padding
    const offset = this.getDayOfWeekOffset(startDate);
    const paddedCells: (WorkoutMesocycleCalendarDayCell | null)[] = [
      ...Array.from<null>({ length: offset }).fill(null),
      ...dayCells
    ];

    // Pad end to fill last row
    while (paddedCells.length % 7 !== 0) {
      paddedCells.push(null);
    }

    const weekRows: WorkoutMesocycleCalendarWeekRow[] = [];
    for (let i = 0; i < paddedCells.length; i += 7) {
      const rowDays = paddedCells.slice(i, i + 7);

      const labels: WorkoutMesocycleCalendarLabelEntry[] = [];
      let prevDate: Date | null = null;

      // Get the previous date from the last real cell of the previous row
      if (i > 0) {
        for (let j = i - 1; j >= 0; j--) {
          const prevCell = paddedCells[j];
          if (prevCell) {
            prevDate = prevCell.date;
            break;
          }
        }
      }

      for (let col = 0; col < 7; col++) {
        const cell = rowDays[col];
        if (!cell) {
          prevDate = null;
          continue;
        }

        const entry: WorkoutMesocycleCalendarLabelEntry = { columnIndex: col };
        let hasLabel = false;

        if (cell.isCycleStart) {
          entry.cycleLabel = this.formatCycleLabel(cell.cycleNumber, cell.isDeload);
          hasLabel = true;
        }

        if (workoutCalendarUtils.isNewMonth(cell.date, prevDate)) {
          entry.monthLabel = workoutCalendarUtils.formatMonthLabel(cell.date);
          hasLabel = true;
        }

        if (hasLabel) {
          labels.push(entry);
        }

        prevDate = cell.date;
      }

      weekRows.push({
        days: rowDays,
        labelRow: labels.length > 0 ? labels : null
      });
    }

    return { weekRows, totalDays, microcycleCount, microcycleLengthDays };
  }
}

export default new WorkoutMesocycleCalendarUtils();
