import type {
  WorkoutExercise,
  WorkoutMesocycle,
  WorkoutMicrocycle,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet
} from '@aneuhold/core-ts-db-lib';
import type {
  MesocycleCalendarData,
  MesocycleCalendarDayCell,
  MesocycleCalendarExercise,
  MesocycleCalendarLabelEntry,
  MesocycleCalendarSession,
  MesocycleCalendarSet,
  MesocycleCalendarWeekRow
} from './mesocycleCalendarTypes';

export type BuildCalendarDataInput = {
  mesocycle: WorkoutMesocycle;
  microcycles: WorkoutMicrocycle[];
  sessions: WorkoutSession[];
  sessionExercises: WorkoutSessionExercise[];
  sets: WorkoutSet[];
  exercises: WorkoutExercise[];
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

class MesocycleCalendarUtils {
  getDayOfWeekOffset(startDate: Date): number {
    return startDate.getDay();
  }

  isNewMonth(date: Date, prevDate: Date | null): boolean {
    if (!prevDate) return true;
    return date.getMonth() !== prevDate.getMonth() || date.getFullYear() !== prevDate.getFullYear();
  }

  formatMonthLabel(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  formatCycleLabel(cycleNumber: number, isDeload: boolean): string {
    return isDeload ? 'Deload' : `Cycle ${cycleNumber}`;
  }

  getCurrentCycleNumber(microcycles: WorkoutMicrocycle[], sessions: WorkoutSession[]): number {
    if (microcycles.length === 0) return 1;

    const sorted = [...microcycles].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const sessionMap = new Map(sessions.map((s) => [s._id, s]));

    for (let i = 0; i < sorted.length; i++) {
      const micro = sorted[i];
      const microSessions = micro.sessionOrder
        .map((id) => sessionMap.get(id))
        .filter((s): s is WorkoutSession => s !== undefined);

      const hasIncomplete = microSessions.some((s) => !s.complete);
      if (hasIncomplete) return i + 1;
    }

    return sorted.length;
  }

  buildCalendarData(input: BuildCalendarDataInput): MesocycleCalendarData {
    const { mesocycle, microcycles, sessions, sessionExercises, sets, exercises } = input;

    const microcycleLengthDays = mesocycle.plannedMicrocycleLengthInDays;
    const microcycleCount = microcycles.length;
    const restDays = mesocycle.plannedMicrocycleRestDays;

    // Determine start date from first microcycle
    const sortedMicrocycles = [...microcycles].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    if (sortedMicrocycles.length === 0) {
      return { weekRows: [], totalDays: 0, microcycleCount: 0, microcycleLengthDays };
    }

    const startDate = new Date(sortedMicrocycles[0].startDate);
    const totalDays = microcycleLengthDays * microcycleCount;

    // Build lookup maps
    const exerciseMap = new Map(exercises.map((e) => [e._id, e]));
    const sessionExercisesBySession = new Map<string, WorkoutSessionExercise[]>();
    for (const se of sessionExercises) {
      const key = se.workoutSessionId as string;
      const existing = sessionExercisesBySession.get(key) ?? [];
      existing.push(se);
      sessionExercisesBySession.set(key, existing);
    }
    const setsBySessionExercise = new Map<string, WorkoutSet[]>();
    for (const s of sets) {
      const key = s.workoutSessionExerciseId as string;
      const existing = setsBySessionExercise.get(key) ?? [];
      existing.push(s);
      setsBySessionExercise.set(key, existing);
    }

    // Map sessions by date (normalized to start of day)
    const sessionsByDate = new Map<string, WorkoutSession[]>();
    for (const session of sessions) {
      const sessionDate = new Date(session.startTime);
      const dateKey = `${sessionDate.getFullYear()}-${sessionDate.getMonth()}-${sessionDate.getDate()}`;
      const existing = sessionsByDate.get(dateKey) ?? [];
      existing.push(session);
      sessionsByDate.set(dateKey, existing);
    }

    // Build day cells
    const dayCells: MesocycleCalendarDayCell[] = [];
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const date = addDays(startDate, dayIndex);
      const cycleNumber = Math.floor(dayIndex / microcycleLengthDays) + 1;
      const isDeload = cycleNumber === microcycleCount;
      const isCycleStart = dayIndex % microcycleLengthDays === 0;
      const dayInMicrocycle = dayIndex % microcycleLengthDays;
      const isRestDay = restDays.includes(dayInMicrocycle);

      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const daySessions = sessionsByDate.get(dateKey) ?? [];

      let type: MesocycleCalendarDayCell['type'];
      if (isRestDay) {
        type = 'rest';
      } else if (daySessions.length > 0) {
        type = 'session';
      } else {
        type = 'empty';
      }

      const sessionsOnDay: MesocycleCalendarSession[] = daySessions.map((session) => {
        const sesExercises = sessionExercisesBySession.get(session._id as string) ?? [];
        const exercisesOnDay: MesocycleCalendarExercise[] = sesExercises.map((se) => {
          const exercise = exerciseMap.get(se.workoutExerciseId);
          const seSets = setsBySessionExercise.get(se._id as string) ?? [];
          const setsOnDay: MesocycleCalendarSet[] = seSets.map((s, idx) => ({
            setNumber: idx + 1,
            plannedReps: s.plannedReps ?? undefined,
            plannedWeight: s.plannedWeight ?? undefined,
            plannedRir: s.plannedRir ?? undefined
          }));
          return {
            exerciseName: exercise?.exerciseName ?? 'Unknown',
            repRange: exercise?.repRange ?? 'Medium',
            sets: setsOnDay
          };
        });
        return {
          sessionId: session._id,
          title: session.title,
          completed: session.complete,
          exercises: exercisesOnDay
        };
      });

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
    const paddedCells: (MesocycleCalendarDayCell | null)[] = [
      ...Array.from<null>({ length: offset }).fill(null),
      ...dayCells
    ];

    // Pad end to fill last row
    while (paddedCells.length % 7 !== 0) {
      paddedCells.push(null);
    }

    const weekRows: MesocycleCalendarWeekRow[] = [];
    for (let i = 0; i < paddedCells.length; i += 7) {
      const rowDays = paddedCells.slice(i, i + 7);

      // Check for label row needs
      const labels: MesocycleCalendarLabelEntry[] = [];
      let prevDate: Date | null = null;

      // Get the previous date from the last day of the previous row
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

        const entry: MesocycleCalendarLabelEntry = { columnIndex: col };
        let hasLabel = false;

        if (cell.isCycleStart) {
          entry.cycleLabel = this.formatCycleLabel(cell.cycleNumber, cell.isDeload);
          hasLabel = true;
        }

        if (this.isNewMonth(cell.date, prevDate)) {
          entry.monthLabel = this.formatMonthLabel(cell.date);
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

export default new MesocycleCalendarUtils();
