import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MockData from '$testUtils/MockData';
import TestSetup from '$testUtils/TestSetup';
import WorkoutAPIService from '$util/api/WorkoutAPIService';
import MesocycleMapServiceMock from './mesocycleMapService.mock';
import mesocycleMapService from './mesocycleMapService.svelte';

describe('Unit Tests', () => {
  beforeEach(() => {
    TestSetup.setupGlobalMocks(vi.spyOn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('endMesocycle', () => {
    it('should set completedDate on the mesocycle', () => {
      const baseData = MockData.setupBaseData();
      const sessionsPerMicrocycle = 5;
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        completedSessionCount: sessionsPerMicrocycle,
        sessionsPerMicrocycle
      });

      const queryApiSpy = vi.spyOn(WorkoutAPIService, 'queryApi');
      const before = Date.now();
      mesocycleMapService.endMesocycle(data.mesocycle._id);
      const after = Date.now();

      const updatedMesocycle = mesocycleMapService.getDoc(data.mesocycle._id);
      expect(updatedMesocycle?.completedDate).toBeDefined();
      const completedTime = updatedMesocycle?.completedDate?.getTime() ?? 0;
      expect(completedTime).toBeGreaterThanOrEqual(before);
      expect(completedTime).toBeLessThanOrEqual(after);

      expect(queryApiSpy).toHaveBeenCalledOnce();
    });

    it('should delete all incomplete sessions and their children', () => {
      const baseData = MockData.setupBaseData();
      const sessionsPerMicrocycle = 5;
      const completedSessionCount = sessionsPerMicrocycle;
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        completedSessionCount,
        sessionsPerMicrocycle
      });

      const incompleteSessions = data.sessions.filter((s) => !s.complete);
      const incompleteSessionIds = new Set(incompleteSessions.map((s) => s._id));
      const incompleteSessionExercises = data.sessionExercises.filter((se) =>
        incompleteSessionIds.has(se.workoutSessionId)
      );
      const incompleteSessionExerciseIds = new Set(incompleteSessionExercises.map((se) => se._id));
      const incompleteSets = data.sets.filter((s) =>
        incompleteSessionExerciseIds.has(s.workoutSessionExerciseId)
      );

      expect(incompleteSessions.length).toBeGreaterThan(0);

      mesocycleMapService.endMesocycle(data.mesocycle._id);

      // Verify the docs are in the associated docs (i.e. not deleted)
      const updatedDocs = mesocycleMapService.getAssociatedDocsForMesocycle(data.mesocycle._id);

      // No incomplete sessions should remain
      for (const session of updatedDocs.sessions) {
        expect(session.complete).toBe(true);
      }

      // No children of incomplete sessions should remain
      for (const se of incompleteSessionExercises) {
        expect(updatedDocs.sessionExercises.find((d) => d._id === se._id)).toBeUndefined();
      }
      for (const s of incompleteSets) {
        expect(updatedDocs.sets.find((d) => d._id === s._id)).toBeUndefined();
      }
    });

    it('should delete microcycles whose sessions are ALL incomplete', () => {
      const baseData = MockData.setupBaseData();
      const sessionsPerMicrocycle = 5;
      const completedSessionCount = sessionsPerMicrocycle;
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        completedSessionCount,
        sessionsPerMicrocycle,
        microcycleCount: 3
      });

      // Identify microcycles where ALL sessions are incomplete
      const incompleteSessionIds = new Set(
        data.sessions.filter((s) => !s.complete).map((s) => s._id)
      );
      const microcyclesExpectedDeleted = data.microcycles.filter((mc) => {
        const mcSessions = data.sessions.filter((s) => s.workoutMicrocycleId === mc._id);
        return mcSessions.length > 0 && mcSessions.every((s) => incompleteSessionIds.has(s._id));
      });

      expect(microcyclesExpectedDeleted.length).toBeGreaterThan(0);

      mesocycleMapService.endMesocycle(data.mesocycle._id);

      const updatedDocs = mesocycleMapService.getAssociatedDocsForMesocycle(data.mesocycle._id);

      for (const mc of microcyclesExpectedDeleted) {
        expect(updatedDocs.microcycles.find((d) => d._id === mc._id)).toBeUndefined();
      }
    });

    it('should preserve completed sessions, their children, and their microcycles', () => {
      const baseData = MockData.setupBaseData();
      const sessionsPerMicrocycle = 5;
      const completedSessionCount = sessionsPerMicrocycle;
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        completedSessionCount,
        sessionsPerMicrocycle,
        microcycleCount: 3
      });

      const completedSessions = data.sessions.filter((s) => s.complete);
      const completedSessionIds = new Set(completedSessions.map((s) => s._id));
      const completedSessionExercises = data.sessionExercises.filter((se) =>
        completedSessionIds.has(se.workoutSessionId)
      );
      const completedSessionExerciseIds = new Set(completedSessionExercises.map((se) => se._id));
      const completedSets = data.sets.filter((s) =>
        completedSessionExerciseIds.has(s.workoutSessionExerciseId)
      );

      mesocycleMapService.endMesocycle(data.mesocycle._id);

      const updatedDocs = mesocycleMapService.getAssociatedDocsForMesocycle(data.mesocycle._id);

      // All completed sessions should still exist
      for (const session of completedSessions) {
        expect(updatedDocs.sessions.find((s) => s._id === session._id)).toBeDefined();
      }

      // All children of completed sessions should still exist
      for (const se of completedSessionExercises) {
        expect(updatedDocs.sessionExercises.find((d) => d._id === se._id)).toBeDefined();
      }
      for (const s of completedSets) {
        expect(updatedDocs.sets.find((d) => d._id === s._id)).toBeDefined();
      }
    });
  });

  describe('initiateEarlyDeload', () => {
    it('should delete all incomplete sessions and their children', () => {
      const baseData = MockData.setupBaseData();
      const sessionsPerMicrocycle = 5;
      const completedSessionCount = sessionsPerMicrocycle * 2;
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        completedSessionCount,
        sessionsPerMicrocycle,
        microcycleCount: 4
      });

      const incompleteSessions = data.sessions.filter((s) => !s.complete);
      expect(incompleteSessions.length).toBeGreaterThan(0);

      const deloadStartDate = new Date(data.microcycles[2].startDate);
      mesocycleMapService.initiateEarlyDeload(data.mesocycle._id, deloadStartDate);

      const updatedDocs = mesocycleMapService.getAssociatedDocsForMesocycle(data.mesocycle._id);

      // None of the original incomplete sessions should remain
      for (const session of incompleteSessions) {
        expect(updatedDocs.sessions.find((s) => s._id === session._id)).toBeUndefined();
      }
    });

    it('should generate a deload microcycle with new sessions and sets', () => {
      const baseData = MockData.setupBaseData();
      const sessionsPerMicrocycle = 5;
      const completedSessionCount = sessionsPerMicrocycle * 2;
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        completedSessionCount,
        sessionsPerMicrocycle,
        microcycleCount: 4
      });

      const originalMicrocycleIds = new Set(data.microcycles.map((mc) => mc._id));
      const originalSessionIds = new Set(data.sessions.map((s) => s._id));

      const deloadStartDate = new Date(data.microcycles[2].startDate);
      mesocycleMapService.initiateEarlyDeload(data.mesocycle._id, deloadStartDate);

      const updatedDocs = mesocycleMapService.getAssociatedDocsForMesocycle(data.mesocycle._id);

      // Should have new microcycles that didn't exist before (the deload)
      const newMicrocycles = updatedDocs.microcycles.filter(
        (mc) => !originalMicrocycleIds.has(mc._id)
      );
      expect(newMicrocycles.length).toBe(1);

      // Should have new sessions for the deload
      const newSessions = updatedDocs.sessions.filter((s) => !originalSessionIds.has(s._id));
      expect(newSessions.length).toBeGreaterThan(0);

      // Deload sets should have null plannedRir
      const newSessionIds = new Set(newSessions.map((s) => s._id));
      const deloadSets = updatedDocs.sets.filter((s) => newSessionIds.has(s.workoutSessionId));
      expect(deloadSets.length).toBeGreaterThan(0);
      for (const set of deloadSets) {
        expect(set.plannedRir).toBeNull();
      }
    });

    it('should preserve completed data', () => {
      const baseData = MockData.setupBaseData();
      const sessionsPerMicrocycle = 5;
      const completedSessionCount = sessionsPerMicrocycle * 2;
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        completedSessionCount,
        sessionsPerMicrocycle,
        microcycleCount: 4
      });

      const completedSessions = data.sessions.filter((s) => s.complete);

      const deloadStartDate = new Date(data.microcycles[2].startDate);
      mesocycleMapService.initiateEarlyDeload(data.mesocycle._id, deloadStartDate);

      const updatedDocs = mesocycleMapService.getAssociatedDocsForMesocycle(data.mesocycle._id);

      // All completed sessions should still exist
      for (const session of completedSessions) {
        expect(updatedDocs.sessions.find((s) => s._id === session._id)).toBeDefined();
      }
    });

    it('should call WorkoutAPIService.queryApi exactly once', () => {
      const baseData = MockData.setupBaseData();
      const sessionsPerMicrocycle = 5;
      const completedSessionCount = sessionsPerMicrocycle * 2;
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        completedSessionCount,
        sessionsPerMicrocycle,
        microcycleCount: 4
      });

      const queryApiSpy = vi.spyOn(WorkoutAPIService, 'queryApi');

      const deloadStartDate = new Date(data.microcycles[2].startDate);
      mesocycleMapService.initiateEarlyDeload(data.mesocycle._id, deloadStartDate);

      expect(queryApiSpy).toHaveBeenCalledOnce();
    });
  });
});
