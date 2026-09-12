import { describe, expect, it } from 'vitest';
import ExerciseMapServiceMock, {
  MockDefaultExercise
} from '$services/documentMapServices/ExerciseMap.service.mock';
import MockData from '$testUtils/MockData';
import workoutSessionCalendarUtils from './workoutSessionCalendarUtils';

describe('buildMonthGrid', () => {
  it('returns correct number of rows for an empty month with no padding', () => {
    // February 2026 starts on Sunday (0) and has 28 days → exactly 4 rows, no padding
    const result = workoutSessionCalendarUtils.buildMonthGrid({
      year: 2026,
      month: 1, // February (0-based)
      sessions: [],
      sessionExercises: [],
      sets: [],
      exercises: []
    });
    expect(result.weekRows).toHaveLength(4);
    const allDays = result.weekRows.flat();
    expect(allDays.every((d) => !d.isOutsideMonth)).toBe(true);
    expect(allDays.every((d) => d.type === 'empty')).toBe(true);
  });

  it('marks leading and trailing days as isOutsideMonth', () => {
    // April 2026 starts on Wednesday (3) → 3 leading days, 2 trailing days
    const result = workoutSessionCalendarUtils.buildMonthGrid({
      year: 2026,
      month: 3, // April (0-based)
      sessions: [],
      sessionExercises: [],
      sets: [],
      exercises: []
    });
    const firstRow = result.weekRows[0];
    // First 3 cells are outside month (Sunday, Monday, Tuesday from March)
    expect(firstRow[0].isOutsideMonth).toBe(true);
    expect(firstRow[1].isOutsideMonth).toBe(true);
    expect(firstRow[2].isOutsideMonth).toBe(true);
    // Fourth cell is April 1
    expect(firstRow[3].isOutsideMonth).toBe(false);
    expect(firstRow[3].date.getDate()).toBe(1);
  });

  it('maps sessions to the correct days', () => {
    const session = MockData.sessionMapServiceMock.addSession({
      title: 'Test Session',
      startTime: new Date(2026, 2, 10) // March 10, 2026
    });
    const result = workoutSessionCalendarUtils.buildMonthGrid({
      year: 2026,
      month: 2, // March (0-based)
      sessions: [session],
      sessionExercises: [],
      sets: [],
      exercises: []
    });
    const allDays = result.weekRows.flat();
    const march10 = allDays.find((d) => !d.isOutsideMonth && d.date.getDate() === 10);
    expect(march10).toBeDefined();
    expect(march10?.type).toBe('session');
    expect(march10?.sessions).toHaveLength(1);
    expect(march10?.sessions[0].title).toBe('Test Session');
  });

  it('sets isFreeForm based on workoutMicrocycleId', () => {
    const microcycle = MockData.microcycleMapServiceMock.addMicrocycle({
      workoutMesocycleId: MockData.mesocycleMapServiceMock.addMesocycle()._id,
      startDate: new Date(2026, 2, 1),
      endDate: new Date(2026, 2, 7)
    });
    const freeFormSession = MockData.sessionMapServiceMock.addSession({
      title: 'Free Form',
      startTime: new Date(2026, 2, 5)
    });
    const mesocycleSession = MockData.sessionMapServiceMock.addSession({
      workoutMicrocycleId: microcycle._id,
      title: 'Meso Session',
      startTime: new Date(2026, 2, 7),
      complete: true
    });

    const result = workoutSessionCalendarUtils.buildMonthGrid({
      year: 2026,
      month: 2,
      sessions: [freeFormSession, mesocycleSession],
      sessionExercises: [],
      sets: [],
      exercises: []
    });
    const allDays = result.weekRows.flat();
    const day5 = allDays.find((d) => !d.isOutsideMonth && d.date.getDate() === 5);
    const day7 = allDays.find((d) => !d.isOutsideMonth && d.date.getDate() === 7);
    expect(day5?.sessions[0].isFreeForm).toBe(true);
    expect(day7?.sessions[0].isFreeForm).toBe(false);
  });

  it('correctly identifies today', () => {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDay = now.getDate();

    const result = workoutSessionCalendarUtils.buildMonthGrid({
      year: todayYear,
      month: todayMonth,
      sessions: [],
      sessionExercises: [],
      sets: [],
      exercises: []
    });
    const allDays = result.weekRows.flat();
    const todayCell = allDays.find((d) => !d.isOutsideMonth && d.date.getDate() === todayDay);
    expect(todayCell?.isToday).toBe(true);

    // All other in-month cells are not today
    const otherCells = allDays.filter((d) => !d.isOutsideMonth && d.date.getDate() !== todayDay);
    expect(otherCells.every((d) => !d.isToday)).toBe(true);
  });

  it('outside-month cells are never today even if they have the same day number', () => {
    // For a month that has outside-month days, those cells should not be marked isToday
    // even if the day number happens to match
    const now = new Date();
    const result = workoutSessionCalendarUtils.buildMonthGrid({
      year: now.getFullYear(),
      month: now.getMonth(),
      sessions: [],
      sessionExercises: [],
      sets: [],
      exercises: []
    });
    const outsideCells = result.weekRows.flat().filter((d) => d.isOutsideMonth);
    expect(outsideCells.every((d) => !d.isToday)).toBe(true);
  });

  it('maps exercises and sets to sessions', () => {
    MockData.setupBaseData();
    const exercise = ExerciseMapServiceMock.defaultExercises[MockDefaultExercise.BarbellSquat];

    const session = MockData.sessionMapServiceMock.addSession({
      title: 'Test Session',
      startTime: new Date(2026, 2, 15)
    });
    const se = MockData.sessionExerciseMapServiceMock.addSessionExercise({
      workoutSessionId: session._id,
      workoutExerciseId: exercise._id
    });
    const set = MockData.setMapServiceMock.addSet({
      workoutExerciseId: exercise._id,
      workoutSessionId: session._id,
      workoutSessionExerciseId: se._id,
      plannedReps: 10,
      plannedWeight: 100,
      plannedRir: 3
    });

    const result = workoutSessionCalendarUtils.buildMonthGrid({
      year: 2026,
      month: 2,
      sessions: [session],
      sessionExercises: [se],
      sets: [set],
      exercises: Object.values(ExerciseMapServiceMock.defaultExercises)
    });
    const allDays = result.weekRows.flat();
    const day15 = allDays.find((d) => !d.isOutsideMonth && d.date.getDate() === 15);
    expect(day15?.sessions[0].exercises).toHaveLength(1);
    expect(day15?.sessions[0].exercises[0].exerciseName).toBe(MockDefaultExercise.BarbellSquat);
    expect(day15?.sessions[0].exercises[0].sets).toHaveLength(1);
    expect(day15?.sessions[0].exercises[0].sets[0].plannedWeight).toBe(100);
  });

  it('handles sessions from different sources on the same day', () => {
    const microcycle = MockData.microcycleMapServiceMock.addMicrocycle({
      workoutMesocycleId: MockData.mesocycleMapServiceMock.addMesocycle()._id,
      startDate: new Date(2026, 2, 15),
      endDate: new Date(2026, 2, 21)
    });
    const session1 = MockData.sessionMapServiceMock.addSession({
      title: 'Free Form',
      startTime: new Date(2026, 2, 20)
    });
    const session2 = MockData.sessionMapServiceMock.addSession({
      workoutMicrocycleId: microcycle._id,
      title: 'Meso Session',
      startTime: new Date(2026, 2, 20),
      complete: true
    });

    const result = workoutSessionCalendarUtils.buildMonthGrid({
      year: 2026,
      month: 2,
      sessions: [session1, session2],
      sessionExercises: [],
      sets: [],
      exercises: []
    });
    const allDays = result.weekRows.flat();
    const day20 = allDays.find((d) => !d.isOutsideMonth && d.date.getDate() === 20);
    expect(day20?.sessions).toHaveLength(2);
    const freeForm = day20?.sessions.find((s) => s.isFreeForm);
    const meso = day20?.sessions.find((s) => !s.isFreeForm);
    expect(freeForm).toBeDefined();
    expect(meso).toBeDefined();
  });
});
