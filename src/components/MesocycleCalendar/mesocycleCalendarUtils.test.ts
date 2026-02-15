import {
  CycleType,
  DocumentService,
  ExerciseRepRange,
  WorkoutExerciseSchema,
  WorkoutMesocycleSchema,
  WorkoutMicrocycleSchema,
  WorkoutSessionExerciseSchema,
  WorkoutSessionSchema,
  WorkoutSetSchema
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import mesocycleCalendarUtils from './mesocycleCalendarUtils';

const userId = DocumentService.generateID();

function makeMesocycle(overrides: Record<string, unknown> = {}) {
  return WorkoutMesocycleSchema.parse({
    userId,
    cycleType: CycleType.MuscleGain,
    plannedSessionCountPerMicrocycle: 5,
    plannedMicrocycleLengthInDays: 7,
    plannedMicrocycleRestDays: [0, 6],
    plannedMicrocycleCount: 4,
    ...overrides
  });
}

function makeMicrocycle(
  mesocycleId: UUID,
  startDate: Date,
  endDate: Date,
  sessionOrder: UUID[] = []
) {
  return WorkoutMicrocycleSchema.parse({
    userId,
    workoutMesocycleId: mesocycleId,
    startDate,
    endDate,
    sessionOrder
  });
}

function makeSession(microcycleId: UUID, title: string, startTime: Date, complete = false) {
  return WorkoutSessionSchema.parse({
    userId,
    workoutMicrocycleId: microcycleId,
    title,
    startTime,
    complete
  });
}

function makeSessionExercise(sessionId: UUID, exerciseId: UUID) {
  return WorkoutSessionExerciseSchema.parse({
    userId,
    workoutSessionId: sessionId,
    workoutExerciseId: exerciseId
  });
}

function makeSet(
  exerciseId: UUID,
  sessionId: UUID,
  sessionExerciseId: UUID,
  plannedReps = 10,
  plannedWeight = 135,
  plannedRir = 3
) {
  return WorkoutSetSchema.parse({
    userId,
    workoutExerciseId: exerciseId,
    workoutSessionId: sessionId,
    workoutSessionExerciseId: sessionExerciseId,
    plannedReps,
    plannedWeight,
    plannedRir
  });
}

describe('getDayOfWeekOffset', () => {
  it('returns 0 for Sunday', () => {
    // 2026-02-15 is a Sunday
    expect(mesocycleCalendarUtils.getDayOfWeekOffset(new Date(2026, 1, 15))).toBe(0);
  });

  it('returns 3 for Wednesday', () => {
    // 2026-02-18 is a Wednesday
    expect(mesocycleCalendarUtils.getDayOfWeekOffset(new Date(2026, 1, 18))).toBe(3);
  });

  it('returns 1 for Monday', () => {
    // 2026-02-16 is a Monday
    expect(mesocycleCalendarUtils.getDayOfWeekOffset(new Date(2026, 1, 16))).toBe(1);
  });
});

describe('isNewMonth', () => {
  it('returns true when prevDate is null', () => {
    expect(mesocycleCalendarUtils.isNewMonth(new Date(2026, 1, 1), null)).toBe(true);
  });

  it('returns true when month changes', () => {
    expect(mesocycleCalendarUtils.isNewMonth(new Date(2026, 2, 1), new Date(2026, 1, 28))).toBe(
      true
    );
  });

  it('returns false within same month', () => {
    expect(mesocycleCalendarUtils.isNewMonth(new Date(2026, 1, 15), new Date(2026, 1, 14))).toBe(
      false
    );
  });

  it('returns true when year changes', () => {
    expect(mesocycleCalendarUtils.isNewMonth(new Date(2027, 0, 1), new Date(2026, 11, 31))).toBe(
      true
    );
  });
});

describe('formatMonthLabel', () => {
  it('formats correctly', () => {
    expect(mesocycleCalendarUtils.formatMonthLabel(new Date(2026, 1, 1))).toBe('Feb 2026');
  });
});

describe('formatCycleLabel', () => {
  it('returns cycle number for non-deload', () => {
    expect(mesocycleCalendarUtils.formatCycleLabel(1, false)).toBe('Cycle 1');
    expect(mesocycleCalendarUtils.formatCycleLabel(3, false)).toBe('Cycle 3');
  });

  it('returns Deload for deload cycle', () => {
    expect(mesocycleCalendarUtils.formatCycleLabel(4, true)).toBe('Deload');
  });
});

describe('buildCalendarData', () => {
  it('returns empty data for no microcycles', () => {
    const mesocycle = makeMesocycle();
    const result = mesocycleCalendarUtils.buildCalendarData({
      mesocycle,
      microcycles: [],
      sessions: [],
      sessionExercises: [],
      sets: [],
      exercises: []
    });
    expect(result.weekRows).toEqual([]);
    expect(result.totalDays).toBe(0);
  });

  it('pads Sunday start with no leading nulls', () => {
    const mesocycle = makeMesocycle({ plannedMicrocycleCount: 2 });
    // 2026-02-15 is a Sunday
    const micro1 = makeMicrocycle(mesocycle._id, new Date(2026, 1, 15), new Date(2026, 1, 21));
    const micro2 = makeMicrocycle(mesocycle._id, new Date(2026, 1, 22), new Date(2026, 1, 28));

    const result = mesocycleCalendarUtils.buildCalendarData({
      mesocycle,
      microcycles: [micro1, micro2],
      sessions: [],
      sessionExercises: [],
      sets: [],
      exercises: []
    });

    const firstRow = result.weekRows[0];
    // Sunday start = no padding
    expect(firstRow.days[0]).not.toBeNull();
    expect(firstRow.days[0]?.dayIndex).toBe(0);
  });

  it('pads Wednesday start with 3 leading nulls', () => {
    const mesocycle = makeMesocycle({ plannedMicrocycleCount: 2 });
    // 2026-02-18 is a Wednesday
    const micro1 = makeMicrocycle(mesocycle._id, new Date(2026, 1, 18), new Date(2026, 1, 24));
    const micro2 = makeMicrocycle(mesocycle._id, new Date(2026, 1, 25), new Date(2026, 2, 3));

    const result = mesocycleCalendarUtils.buildCalendarData({
      mesocycle,
      microcycles: [micro1, micro2],
      sessions: [],
      sessionExercises: [],
      sets: [],
      exercises: []
    });

    const firstRow = result.weekRows[0];
    expect(firstRow.days[0]).toBeNull();
    expect(firstRow.days[1]).toBeNull();
    expect(firstRow.days[2]).toBeNull();
    expect(firstRow.days[3]).not.toBeNull();
    expect(firstRow.days[3]?.dayIndex).toBe(0);
  });

  it('computes total days correctly', () => {
    const mesocycle = makeMesocycle({
      plannedMicrocycleCount: 3,
      plannedMicrocycleLengthInDays: 8
    });
    const micros = [
      makeMicrocycle(mesocycle._id, new Date(2026, 1, 15), new Date(2026, 1, 22)),
      makeMicrocycle(mesocycle._id, new Date(2026, 1, 23), new Date(2026, 2, 2)),
      makeMicrocycle(mesocycle._id, new Date(2026, 2, 3), new Date(2026, 2, 10))
    ];

    const result = mesocycleCalendarUtils.buildCalendarData({
      mesocycle,
      microcycles: micros,
      sessions: [],
      sessionExercises: [],
      sets: [],
      exercises: []
    });

    expect(result.totalDays).toBe(24); // 3 * 8
    expect(result.microcycleLengthDays).toBe(8);
  });

  it('identifies rest days by microcycle-relative position', () => {
    const mesocycle = makeMesocycle({
      plannedMicrocycleCount: 2,
      plannedMicrocycleRestDays: [0, 6]
    });
    const micro1 = makeMicrocycle(mesocycle._id, new Date(2026, 1, 15), new Date(2026, 1, 21));
    const micro2 = makeMicrocycle(mesocycle._id, new Date(2026, 1, 22), new Date(2026, 1, 28));

    const result = mesocycleCalendarUtils.buildCalendarData({
      mesocycle,
      microcycles: [micro1, micro2],
      sessions: [],
      sessionExercises: [],
      sets: [],
      exercises: []
    });

    const allDays = result.weekRows.flatMap((r) => r.days).filter((d) => d !== null);
    expect(allDays[0].type).toBe('rest'); // day 0
    expect(allDays[1].type).toBe('empty'); // day 1 (no sessions)
    expect(allDays[6].type).toBe('rest'); // day 6
  });

  it('maps sessions to correct days', () => {
    const mesocycle = makeMesocycle({ plannedMicrocycleCount: 2 });
    const micro1 = makeMicrocycle(mesocycle._id, new Date(2026, 1, 15), new Date(2026, 1, 21));
    const micro2 = makeMicrocycle(mesocycle._id, new Date(2026, 1, 22), new Date(2026, 1, 28));
    const session = makeSession(micro1._id, 'Push Day', new Date(2026, 1, 16)); // day 1 (Monday)
    micro1.sessionOrder = [session._id];

    const result = mesocycleCalendarUtils.buildCalendarData({
      mesocycle,
      microcycles: [micro1, micro2],
      sessions: [session],
      sessionExercises: [],
      sets: [],
      exercises: []
    });

    const allDays = result.weekRows.flatMap((r) => r.days).filter((d) => d !== null);
    const monday = allDays[1]; // dayIndex 1
    expect(monday.type).toBe('session');
    expect(monday.sessions).toHaveLength(1);
    expect(monday.sessions[0].title).toBe('Push Day');
  });

  it('generates label rows for cycle starts', () => {
    const mesocycle = makeMesocycle({ plannedMicrocycleCount: 2 });
    // Start on Sunday 2026-02-15
    const micro1 = makeMicrocycle(mesocycle._id, new Date(2026, 1, 15), new Date(2026, 1, 21));
    const micro2 = makeMicrocycle(mesocycle._id, new Date(2026, 1, 22), new Date(2026, 1, 28));

    const result = mesocycleCalendarUtils.buildCalendarData({
      mesocycle,
      microcycles: [micro1, micro2],
      sessions: [],
      sessionExercises: [],
      sets: [],
      exercises: []
    });

    // First row should have label for Cycle 1 + month
    const firstLabels = result.weekRows[0].labelRow ?? [];
    expect(firstLabels.length).toBeGreaterThan(0);
    expect(firstLabels.some((l) => l.cycleLabel === 'Cycle 1')).toBe(true);

    // Second row (cycle 2 starts on day 7 = next Sunday)
    const secondLabels = result.weekRows[1].labelRow ?? [];
    expect(secondLabels.length).toBeGreaterThan(0);
    expect(secondLabels.some((l) => l.cycleLabel === 'Deload')).toBe(true);
  });

  it('marks last cycle as deload', () => {
    const mesocycle = makeMesocycle({ plannedMicrocycleCount: 3 });
    const micros = [
      makeMicrocycle(mesocycle._id, new Date(2026, 1, 15), new Date(2026, 1, 21)),
      makeMicrocycle(mesocycle._id, new Date(2026, 1, 22), new Date(2026, 1, 28)),
      makeMicrocycle(mesocycle._id, new Date(2026, 2, 1), new Date(2026, 2, 7))
    ];

    const result = mesocycleCalendarUtils.buildCalendarData({
      mesocycle,
      microcycles: micros,
      sessions: [],
      sessionExercises: [],
      sets: [],
      exercises: []
    });

    const allDays = result.weekRows.flatMap((r) => r.days).filter((d) => d !== null);
    // Days in last cycle (dayIndex 14-20) should be deload
    const deloadDays = allDays.filter((d) => d.isDeload);
    expect(deloadDays.length).toBe(7);
    expect(deloadDays[0].cycleNumber).toBe(3);
  });

  it('generates month boundary labels', () => {
    const mesocycle = makeMesocycle({ plannedMicrocycleCount: 3 });
    // Span from Feb 22 to Mar 14 to cross month boundary
    const micros = [
      makeMicrocycle(mesocycle._id, new Date(2026, 1, 22), new Date(2026, 1, 28)),
      makeMicrocycle(mesocycle._id, new Date(2026, 2, 1), new Date(2026, 2, 7)),
      makeMicrocycle(mesocycle._id, new Date(2026, 2, 8), new Date(2026, 2, 14))
    ];

    const result = mesocycleCalendarUtils.buildCalendarData({
      mesocycle,
      microcycles: micros,
      sessions: [],
      sessionExercises: [],
      sets: [],
      exercises: []
    });

    // Look for Mar 2026 label somewhere in the rows
    const allLabels = result.weekRows.flatMap((r) => r.labelRow ?? []);
    expect(allLabels.some((l) => l.monthLabel === 'Mar 2026')).toBe(true);
  });

  it('maps session exercises and sets to days', () => {
    const mesocycle = makeMesocycle({ plannedMicrocycleCount: 2 });
    const micro1 = makeMicrocycle(mesocycle._id, new Date(2026, 1, 15), new Date(2026, 1, 21));
    const micro2 = makeMicrocycle(mesocycle._id, new Date(2026, 1, 22), new Date(2026, 1, 28));
    const session = makeSession(micro1._id, 'Push', new Date(2026, 1, 16));
    micro1.sessionOrder = [session._id];

    const exerciseId = DocumentService.generateID();
    const exercise = WorkoutExerciseSchema.parse({
      userId,
      _id: exerciseId,
      exerciseName: 'Bench Press',
      repRange: ExerciseRepRange.Heavy,
      workoutEquipmentTypeId: DocumentService.generateID(),
      initialFatigueGuess: {}
    });

    const sessionExercise = makeSessionExercise(session._id, exerciseId);
    const set1 = makeSet(exerciseId, session._id, sessionExercise._id, 8, 185, 3);
    const set2 = makeSet(exerciseId, session._id, sessionExercise._id, 6, 185, 3);

    const result = mesocycleCalendarUtils.buildCalendarData({
      mesocycle,
      microcycles: [micro1, micro2],
      sessions: [session],
      sessionExercises: [sessionExercise],
      sets: [set1, set2],
      exercises: [exercise]
    });

    const allDays = result.weekRows.flatMap((r) => r.days).filter((d) => d !== null);
    const sessionDay = allDays.find((d) => d.type === 'session');
    expect(sessionDay).toBeDefined();
    expect(sessionDay?.sessions[0].exercises).toHaveLength(1);
    expect(sessionDay?.sessions[0].exercises[0].exerciseName).toBe('Bench Press');
    expect(sessionDay?.sessions[0].exercises[0].sets).toHaveLength(2);
    expect(sessionDay?.sessions[0].exercises[0].sets[0].plannedWeight).toBe(185);
  });

  it('maps actual set data for completed sessions', () => {
    const mesocycle = makeMesocycle({ plannedMicrocycleCount: 2 });
    const micro1 = makeMicrocycle(mesocycle._id, new Date(2026, 1, 15), new Date(2026, 1, 21));
    const micro2 = makeMicrocycle(mesocycle._id, new Date(2026, 1, 22), new Date(2026, 1, 28));
    const session = makeSession(micro1._id, 'Push', new Date(2026, 1, 16), true);

    const exerciseId = DocumentService.generateID();
    const exercise = WorkoutExerciseSchema.parse({
      userId,
      _id: exerciseId,
      exerciseName: 'Bench Press',
      repRange: ExerciseRepRange.Heavy,
      workoutEquipmentTypeId: DocumentService.generateID(),
      initialFatigueGuess: {}
    });

    const sessionExercise = makeSessionExercise(session._id, exerciseId);
    const set1 = makeSet(exerciseId, session._id, sessionExercise._id, 8, 185, 3);
    set1.actualReps = 9;
    set1.actualWeight = 185;
    set1.rir = 2;
    const set2 = makeSet(exerciseId, session._id, sessionExercise._id, 6, 185, 3);
    set2.actualReps = 7;
    set2.actualWeight = 190;
    set2.rir = 1;

    const result = mesocycleCalendarUtils.buildCalendarData({
      mesocycle,
      microcycles: [micro1, micro2],
      sessions: [session],
      sessionExercises: [sessionExercise],
      sets: [set1, set2],
      exercises: [exercise]
    });

    const allDays = result.weekRows.flatMap((r) => r.days).filter((d) => d !== null);
    const sessionDay = allDays.find((d) => d.type === 'session');
    expect(sessionDay).toBeDefined();
    expect(sessionDay?.sessions[0].completed).toBe(true);

    const sets = sessionDay?.sessions[0].exercises[0].sets ?? [];
    expect(sets[0].actualReps).toBe(9);
    expect(sets[0].actualWeight).toBe(185);
    expect(sets[0].actualRir).toBe(2);
    expect(sets[1].actualReps).toBe(7);
    expect(sets[1].actualWeight).toBe(190);
    expect(sets[1].actualRir).toBe(1);
  });

  it('handles non-7-day microcycles', () => {
    const mesocycle = makeMesocycle({
      plannedMicrocycleCount: 2,
      plannedMicrocycleLengthInDays: 5,
      plannedMicrocycleRestDays: [4]
    });
    const micros = [
      makeMicrocycle(mesocycle._id, new Date(2026, 1, 15), new Date(2026, 1, 19)),
      makeMicrocycle(mesocycle._id, new Date(2026, 1, 20), new Date(2026, 1, 24))
    ];

    const result = mesocycleCalendarUtils.buildCalendarData({
      mesocycle,
      microcycles: micros,
      sessions: [],
      sessionExercises: [],
      sets: [],
      exercises: []
    });

    expect(result.totalDays).toBe(10);
    const allDays = result.weekRows.flatMap((r) => r.days).filter((d) => d !== null);

    // Day 4 (rest in cycle 1) and day 9 (rest in cycle 2)
    expect(allDays[4].type).toBe('rest');
    expect(allDays[9].type).toBe('rest');

    // Cycle boundaries: day 0 = cycle 1 start, day 5 = cycle 2 start
    expect(allDays[0].isCycleStart).toBe(true);
    expect(allDays[0].cycleNumber).toBe(1);
    expect(allDays[5].isCycleStart).toBe(true);
    expect(allDays[5].cycleNumber).toBe(2);
  });
});
