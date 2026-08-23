import type { UUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import ExerciseMapServiceMock, {
  MockDefaultExercise
} from '$services/documentMapServices/ExerciseMap.service.mock';
import MockData from '$testUtils/MockData';
import workoutMesocycleCalendarUtils from './workoutMesocycleCalendarUtils';

describe('workoutMesocycleCalendarUtils', () => {
  describe('getDayOfWeekOffset', () => {
    it('returns 0 for Sunday', () => {
      // 2026-02-15 is a Sunday
      expect(workoutMesocycleCalendarUtils.getDayOfWeekOffset(new Date(2026, 1, 15))).toBe(0);
    });

    it('returns 1 for Monday', () => {
      // 2026-02-16 is a Monday
      expect(workoutMesocycleCalendarUtils.getDayOfWeekOffset(new Date(2026, 1, 16))).toBe(1);
    });

    it('returns 3 for Wednesday', () => {
      // 2026-02-18 is a Wednesday
      expect(workoutMesocycleCalendarUtils.getDayOfWeekOffset(new Date(2026, 1, 18))).toBe(3);
    });
  });

  describe('formatCycleLabel', () => {
    it('returns "Cycle N" for non-deload cycles', () => {
      expect(workoutMesocycleCalendarUtils.formatCycleLabel(1, false)).toBe('Cycle 1');
      expect(workoutMesocycleCalendarUtils.formatCycleLabel(3, false)).toBe('Cycle 3');
    });

    it('returns "Deload" for the deload cycle regardless of cycle number', () => {
      expect(workoutMesocycleCalendarUtils.formatCycleLabel(4, true)).toBe('Deload');
    });
  });

  describe('buildCalendarData', () => {
    // ── Helper to build two standard 7-day microcycles starting on 2026-02-15 ──
    function buildTwoMicrocycles(mesocycleId: UUID) {
      const micro1 = MockData.microcycleMapServiceMock.addMicrocycle({
        workoutMesocycleId: mesocycleId,
        startDate: new Date(2026, 1, 15), // Sunday
        endDate: new Date(2026, 1, 21)
      });
      const micro2 = MockData.microcycleMapServiceMock.addMicrocycle({
        workoutMesocycleId: mesocycleId,
        startDate: new Date(2026, 1, 22),
        endDate: new Date(2026, 1, 28)
      });
      return [micro1, micro2];
    }

    describe('grid structure', () => {
      it('returns empty data when there are no microcycles', () => {
        const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle();
        const result = workoutMesocycleCalendarUtils.buildCalendarData({
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

      it('produces no leading null cells when the mesocycle starts on Sunday', () => {
        const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle({
          plannedMicrocycleCount: 2
        });
        const micros = buildTwoMicrocycles(mesocycle._id);
        const result = workoutMesocycleCalendarUtils.buildCalendarData({
          mesocycle,
          microcycles: micros,
          sessions: [],
          sessionExercises: [],
          sets: [],
          exercises: []
        });
        expect(result.weekRows[0].days[0]).not.toBeNull();
        expect(result.weekRows[0].days[0]?.dayIndex).toBe(0);
      });

      it('produces 3 leading null cells when the mesocycle starts on Wednesday', () => {
        const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle({
          plannedMicrocycleCount: 2
        });
        // 2026-02-18 is a Wednesday
        const micro1 = MockData.microcycleMapServiceMock.addMicrocycle({
          workoutMesocycleId: mesocycle._id,
          startDate: new Date(2026, 1, 18),
          endDate: new Date(2026, 1, 24)
        });
        const micro2 = MockData.microcycleMapServiceMock.addMicrocycle({
          workoutMesocycleId: mesocycle._id,
          startDate: new Date(2026, 1, 25),
          endDate: new Date(2026, 2, 3)
        });
        const result = workoutMesocycleCalendarUtils.buildCalendarData({
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

      it('computes totalDays and microcycleLengthDays from mesocycle configuration', () => {
        const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle({
          plannedMicrocycleCount: 3,
          plannedMicrocycleLengthInDays: 8
        });
        const micros = [
          MockData.microcycleMapServiceMock.addMicrocycle({
            workoutMesocycleId: mesocycle._id,
            startDate: new Date(2026, 1, 15),
            endDate: new Date(2026, 1, 22)
          }),
          MockData.microcycleMapServiceMock.addMicrocycle({
            workoutMesocycleId: mesocycle._id,
            startDate: new Date(2026, 1, 23),
            endDate: new Date(2026, 2, 2)
          }),
          MockData.microcycleMapServiceMock.addMicrocycle({
            workoutMesocycleId: mesocycle._id,
            startDate: new Date(2026, 2, 3),
            endDate: new Date(2026, 2, 10)
          })
        ];
        const result = workoutMesocycleCalendarUtils.buildCalendarData({
          mesocycle,
          microcycles: micros,
          sessions: [],
          sessionExercises: [],
          sets: [],
          exercises: []
        });
        expect(result.totalDays).toBe(24); // 3 × 8
        expect(result.microcycleLengthDays).toBe(8);
      });
    });

    describe('day types', () => {
      it('marks planned rest days by their microcycle-relative position', () => {
        const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle({
          plannedMicrocycleCount: 2,
          plannedMicrocycleRestDays: [0, 6]
        });
        const micros = buildTwoMicrocycles(mesocycle._id);
        const result = workoutMesocycleCalendarUtils.buildCalendarData({
          mesocycle,
          microcycles: micros,
          sessions: [],
          sessionExercises: [],
          sets: [],
          exercises: []
        });
        const allDays = result.weekRows.flatMap((r) => r.days).filter((d) => d !== null);
        expect(allDays[0].type).toBe('rest'); // position 0 in each microcycle
        expect(allDays[1].type).toBe('empty'); // position 1 — no sessions, not a rest day
        expect(allDays[6].type).toBe('rest'); // position 6 in each microcycle
      });

      it('marks the last cycle as deload', () => {
        const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle({
          plannedMicrocycleCount: 3
        });
        const micros = [
          MockData.microcycleMapServiceMock.addMicrocycle({
            workoutMesocycleId: mesocycle._id,
            startDate: new Date(2026, 1, 15),
            endDate: new Date(2026, 1, 21)
          }),
          MockData.microcycleMapServiceMock.addMicrocycle({
            workoutMesocycleId: mesocycle._id,
            startDate: new Date(2026, 1, 22),
            endDate: new Date(2026, 1, 28)
          }),
          MockData.microcycleMapServiceMock.addMicrocycle({
            workoutMesocycleId: mesocycle._id,
            startDate: new Date(2026, 2, 1),
            endDate: new Date(2026, 2, 7)
          })
        ];
        const result = workoutMesocycleCalendarUtils.buildCalendarData({
          mesocycle,
          microcycles: micros,
          sessions: [],
          sessionExercises: [],
          sets: [],
          exercises: []
        });
        const allDays = result.weekRows.flatMap((r) => r.days).filter((d) => d !== null);
        const deloadDays = allDays.filter((d) => d.isDeload);
        expect(deloadDays).toHaveLength(7);
        expect(deloadDays[0].cycleNumber).toBe(3);
      });

      it('handles non-7-day microcycles with correct rest days and cycle boundaries', () => {
        const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle({
          plannedMicrocycleCount: 2,
          plannedMicrocycleLengthInDays: 5,
          plannedMicrocycleRestDays: [4]
        });
        const micros = [
          MockData.microcycleMapServiceMock.addMicrocycle({
            workoutMesocycleId: mesocycle._id,
            startDate: new Date(2026, 1, 15),
            endDate: new Date(2026, 1, 19)
          }),
          MockData.microcycleMapServiceMock.addMicrocycle({
            workoutMesocycleId: mesocycle._id,
            startDate: new Date(2026, 1, 20),
            endDate: new Date(2026, 1, 24)
          })
        ];
        const result = workoutMesocycleCalendarUtils.buildCalendarData({
          mesocycle,
          microcycles: micros,
          sessions: [],
          sessionExercises: [],
          sets: [],
          exercises: []
        });
        expect(result.totalDays).toBe(10);
        const allDays = result.weekRows.flatMap((r) => r.days).filter((d) => d !== null);
        expect(allDays[4].type).toBe('rest'); // position 4 in cycle 1
        expect(allDays[9].type).toBe('rest'); // position 4 in cycle 2
        expect(allDays[0].isCycleStart).toBe(true);
        expect(allDays[0].cycleNumber).toBe(1);
        expect(allDays[5].isCycleStart).toBe(true);
        expect(allDays[5].cycleNumber).toBe(2);
      });
    });

    describe('session mapping', () => {
      it('places sessions on the correct calendar day', () => {
        const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle({
          plannedMicrocycleCount: 2
        });
        const [micro1, micro2] = buildTwoMicrocycles(mesocycle._id);
        const session = MockData.sessionMapServiceMock.addSession({
          workoutMicrocycleId: micro1._id,
          title: 'Push Day',
          startTime: new Date(2026, 1, 16) // dayIndex 1 (Monday)
        });
        const result = workoutMesocycleCalendarUtils.buildCalendarData({
          mesocycle,
          microcycles: [micro1, micro2],
          sessions: [session],
          sessionExercises: [],
          sets: [],
          exercises: []
        });
        const allDays = result.weekRows.flatMap((r) => r.days).filter((d) => d !== null);
        const monday = allDays[1];
        expect(monday.type).toBe('session');
        expect(monday.sessions).toHaveLength(1);
        expect(monday.sessions[0].title).toBe('Push Day');
      });

      it('sets isFreeForm to false for all sessions in a mesocycle', () => {
        const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle({
          plannedMicrocycleCount: 2
        });
        const [micro1, micro2] = buildTwoMicrocycles(mesocycle._id);
        const session = MockData.sessionMapServiceMock.addSession({
          workoutMicrocycleId: micro1._id,
          title: 'Push Day',
          startTime: new Date(2026, 1, 16)
        });
        const result = workoutMesocycleCalendarUtils.buildCalendarData({
          mesocycle,
          microcycles: [micro1, micro2],
          sessions: [session],
          sessionExercises: [],
          sets: [],
          exercises: []
        });
        const allDays = result.weekRows.flatMap((r) => r.days).filter((d) => d !== null);
        const sessionDay = allDays.find((d) => d.type === 'session');
        expect(sessionDay?.sessions[0].isFreeForm).toBe(false);
      });

      it('maps planned exercises and sets onto a session day', () => {
        MockData.setupBaseData();
        const exercise =
          ExerciseMapServiceMock.defaultExercises[MockDefaultExercise.BarbellBenchPress];
        const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle({
          plannedMicrocycleCount: 2
        });
        const [micro1, micro2] = buildTwoMicrocycles(mesocycle._id);
        const session = MockData.sessionMapServiceMock.addSession({
          workoutMicrocycleId: micro1._id,
          title: 'Push',
          startTime: new Date(2026, 1, 16)
        });
        const sessionExercise = MockData.sessionExerciseMapServiceMock.addSessionExercise({
          workoutSessionId: session._id,
          workoutExerciseId: exercise._id
        });
        const set1 = MockData.setMapServiceMock.addSet({
          workoutExerciseId: exercise._id,
          workoutSessionId: session._id,
          workoutSessionExerciseId: sessionExercise._id,
          plannedReps: 8,
          plannedWeight: 185,
          plannedRir: 3
        });
        const set2 = MockData.setMapServiceMock.addSet({
          workoutExerciseId: exercise._id,
          workoutSessionId: session._id,
          workoutSessionExerciseId: sessionExercise._id,
          plannedReps: 6,
          plannedWeight: 185,
          plannedRir: 3
        });
        const result = workoutMesocycleCalendarUtils.buildCalendarData({
          mesocycle,
          microcycles: [micro1, micro2],
          sessions: [session],
          sessionExercises: [sessionExercise],
          sets: [set1, set2],
          exercises: Object.values(ExerciseMapServiceMock.defaultExercises)
        });
        const allDays = result.weekRows.flatMap((r) => r.days).filter((d) => d !== null);
        const sessionDay = allDays.find((d) => d.type === 'session');
        expect(sessionDay?.sessions[0].exercises).toHaveLength(1);
        expect(sessionDay?.sessions[0].exercises[0].exerciseName).toBe(
          MockDefaultExercise.BarbellBenchPress
        );
        expect(sessionDay?.sessions[0].exercises[0].sets).toHaveLength(2);
        expect(sessionDay?.sessions[0].exercises[0].sets[0].plannedWeight).toBe(185);
      });

      it('maps actual set data for completed sessions', () => {
        MockData.setupBaseData();
        const exercise =
          ExerciseMapServiceMock.defaultExercises[MockDefaultExercise.BarbellBenchPress];
        const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle({
          plannedMicrocycleCount: 2
        });
        const [micro1, micro2] = buildTwoMicrocycles(mesocycle._id);
        const session = MockData.sessionMapServiceMock.addSession({
          workoutMicrocycleId: micro1._id,
          title: 'Push',
          startTime: new Date(2026, 1, 16),
          complete: true
        });
        const sessionExercise = MockData.sessionExerciseMapServiceMock.addSessionExercise({
          workoutSessionId: session._id,
          workoutExerciseId: exercise._id
        });
        const set1 = MockData.setMapServiceMock.addSet({
          workoutExerciseId: exercise._id,
          workoutSessionId: session._id,
          workoutSessionExerciseId: sessionExercise._id,
          plannedReps: 8,
          plannedWeight: 185,
          plannedRir: 3,
          actualReps: 9,
          actualWeight: 185,
          rir: 2
        });
        const set2 = MockData.setMapServiceMock.addSet({
          workoutExerciseId: exercise._id,
          workoutSessionId: session._id,
          workoutSessionExerciseId: sessionExercise._id,
          plannedReps: 6,
          plannedWeight: 185,
          plannedRir: 3,
          actualReps: 7,
          actualWeight: 190,
          rir: 1
        });
        const result = workoutMesocycleCalendarUtils.buildCalendarData({
          mesocycle,
          microcycles: [micro1, micro2],
          sessions: [session],
          sessionExercises: [sessionExercise],
          sets: [set1, set2],
          exercises: Object.values(ExerciseMapServiceMock.defaultExercises)
        });
        const allDays = result.weekRows.flatMap((r) => r.days).filter((d) => d !== null);
        const sessionDay = allDays.find((d) => d.type === 'session');
        expect(sessionDay?.sessions[0].completed).toBe(true);
        const sets = sessionDay?.sessions[0].exercises[0].sets ?? [];
        expect(sets[0].actualReps).toBe(9);
        expect(sets[0].actualWeight).toBe(185);
        expect(sets[0].rir).toBe(2);
        expect(sets[1].actualReps).toBe(7);
        expect(sets[1].actualWeight).toBe(190);
        expect(sets[1].rir).toBe(1);
      });

      it('sets isRecoveryExercise per exercise and hasRecoveryExercise on the session', () => {
        MockData.setupBaseData();
        const exercise1 =
          ExerciseMapServiceMock.defaultExercises[MockDefaultExercise.BarbellBenchPress];
        const exercise2 = ExerciseMapServiceMock.defaultExercises[MockDefaultExercise.PullUps];
        const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle({
          plannedMicrocycleCount: 2
        });
        const [micro1, micro2] = buildTwoMicrocycles(mesocycle._id);
        const session = MockData.sessionMapServiceMock.addSession({
          workoutMicrocycleId: micro1._id,
          title: 'Push',
          startTime: new Date(2026, 1, 16)
        });
        const se1 = MockData.sessionExerciseMapServiceMock.addSessionExercise({
          workoutSessionId: session._id,
          workoutExerciseId: exercise1._id
        });
        se1.isRecoveryExercise = true;
        const se2 = MockData.sessionExerciseMapServiceMock.addSessionExercise({
          workoutSessionId: session._id,
          workoutExerciseId: exercise2._id
        });
        const result = workoutMesocycleCalendarUtils.buildCalendarData({
          mesocycle,
          microcycles: [micro1, micro2],
          sessions: [session],
          sessionExercises: [se1, se2],
          sets: [],
          exercises: Object.values(ExerciseMapServiceMock.defaultExercises)
        });
        const allDays = result.weekRows.flatMap((r) => r.days).filter((d) => d !== null);
        const sessionDay = allDays.find((d) => d.type === 'session');
        const exercises = sessionDay?.sessions[0].exercises ?? [];
        expect(exercises[0].isRecoveryExercise).toBe(true);
        expect(exercises[1].isRecoveryExercise).toBe(false);
        expect(sessionDay?.sessions[0].hasRecoveryExercise).toBe(true);
      });
    });

    describe('label rows', () => {
      it('generates cycle-start labels at the beginning of each microcycle', () => {
        const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle({
          plannedMicrocycleCount: 2
        });
        // Both microcycles start on Sunday so each lands at column 0
        const micros = buildTwoMicrocycles(mesocycle._id);
        const result = workoutMesocycleCalendarUtils.buildCalendarData({
          mesocycle,
          microcycles: micros,
          sessions: [],
          sessionExercises: [],
          sets: [],
          exercises: []
        });
        const firstLabels = result.weekRows[0].labelRow ?? [];
        expect(firstLabels.some((l) => l.cycleLabel === 'Cycle 1')).toBe(true);
        const secondLabels = result.weekRows[1].labelRow ?? [];
        expect(secondLabels.some((l) => l.cycleLabel === 'Deload')).toBe(true);
      });

      it('generates a month label when the date crosses a month boundary', () => {
        const mesocycle = MockData.mesocycleMapServiceMock.addMesocycle({
          plannedMicrocycleCount: 3
        });
        // Spans Feb 22 → Mar 14, crossing the Feb/Mar boundary
        const micros = [
          MockData.microcycleMapServiceMock.addMicrocycle({
            workoutMesocycleId: mesocycle._id,
            startDate: new Date(2026, 1, 22),
            endDate: new Date(2026, 1, 28)
          }),
          MockData.microcycleMapServiceMock.addMicrocycle({
            workoutMesocycleId: mesocycle._id,
            startDate: new Date(2026, 2, 1),
            endDate: new Date(2026, 2, 7)
          }),
          MockData.microcycleMapServiceMock.addMicrocycle({
            workoutMesocycleId: mesocycle._id,
            startDate: new Date(2026, 2, 8),
            endDate: new Date(2026, 2, 14)
          })
        ];
        const result = workoutMesocycleCalendarUtils.buildCalendarData({
          mesocycle,
          microcycles: micros,
          sessions: [],
          sessionExercises: [],
          sets: [],
          exercises: []
        });
        const allLabels = result.weekRows.flatMap((r) => r.labelRow ?? []);
        expect(allLabels.some((l) => l.monthLabel === 'Mar 2026')).toBe(true);
      });
    });
  });
});
