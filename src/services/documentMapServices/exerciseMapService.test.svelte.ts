import {
  DocumentService,
  WorkoutExerciseCalibrationSchema,
  WorkoutExerciseCalibrationService,
  WorkoutSetSchema
} from '@aneuhold/core-ts-db-lib';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MockData from '$testUtils/MockData';
import TestSetup from '$testUtils/TestSetup';
import TestUsers from '$testUtils/TestUsers';
import { getCTOsForCalibrationIds } from '$util/exerciseCTOUtils';
import exerciseMapService from './exerciseMapService.svelte';
import MesocycleMapServiceMock from './mesocycleMapService.mock';

describe('exerciseMapService CTO update methods', () => {
  beforeEach(() => {
    TestSetup.setupGlobalMocks(vi.spyOn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateCTOBestCalibration', () => {
    it('should create a CTO when none exists', () => {
      const baseData = MockData.setupBaseData();
      // Clear CTOs so none exist
      exerciseMapService.setExerciseCTOs([]);

      const exercise = baseData.exercises[0];
      const calibration = baseData.calibrations.find((c) => c.workoutExerciseId === exercise._id);
      expect(calibration).toBeDefined();
      if (!calibration) return;

      expect(exerciseMapService.getCTO(exercise._id)).toBeUndefined();

      exerciseMapService.updateCTOBestCalibration(calibration);

      const cto = exerciseMapService.getCTO(exercise._id);
      expect(cto).toBeDefined();
      expect(cto?.bestCalibration?._id).toBe(calibration._id);
      expect(cto?.bestSet).toBeNull();
      expect(cto?.lastSessionExercise).toBeNull();
      expect(cto?.lastFirstSet).toBeNull();
    });

    it('should replace bestCalibration when new cal has higher 1RM', () => {
      const baseData = MockData.setupBaseData();

      const exercise = baseData.exercises[0];
      const existingCTO = exerciseMapService.getCTO(exercise._id);
      expect(existingCTO?.bestCalibration).toBeDefined();
      if (!existingCTO?.bestCalibration) return;

      const existing1RM = WorkoutExerciseCalibrationService.get1RM(existingCTO.bestCalibration);

      // Create a calibration with higher 1RM
      const higherCalibration = WorkoutExerciseCalibrationSchema.parse({
        userId: TestUsers.currentUserCto._id,
        workoutExerciseId: exercise._id,
        weight: existingCTO.bestCalibration.weight + 50,
        reps: existingCTO.bestCalibration.reps,
        dateRecorded: new Date()
      });
      const higher1RM = WorkoutExerciseCalibrationService.get1RM(higherCalibration);
      expect(higher1RM).toBeGreaterThan(existing1RM);

      exerciseMapService.updateCTOBestCalibration(higherCalibration);

      const updatedCTO = exerciseMapService.getCTO(exercise._id);
      expect(updatedCTO?.bestCalibration?._id).toBe(higherCalibration._id);
    });

    it('should keep existing when new cal has lower 1RM', () => {
      const baseData = MockData.setupBaseData();

      const exercise = baseData.exercises[0];
      const existingCTO = exerciseMapService.getCTO(exercise._id);
      expect(existingCTO?.bestCalibration).toBeDefined();
      if (!existingCTO?.bestCalibration) return;
      const originalCalId = existingCTO.bestCalibration._id;

      // Create a calibration with lower 1RM
      const lowerCalibration = WorkoutExerciseCalibrationSchema.parse({
        userId: TestUsers.currentUserCto._id,
        workoutExerciseId: exercise._id,
        weight: 5,
        reps: 1,
        dateRecorded: new Date()
      });

      exerciseMapService.updateCTOBestCalibration(lowerCalibration);

      const updatedCTO = exerciseMapService.getCTO(exercise._id);
      expect(updatedCTO?.bestCalibration?._id).toBe(originalCalId);
    });
  });

  describe('updateCTOBestSet', () => {
    it('should replace bestSet when higher 1RM', () => {
      const baseData = MockData.setupBaseData();

      const exercise = baseData.exercises[0];
      const cto = exerciseMapService.getCTO(exercise._id);
      expect(cto).toBeDefined();

      const newSet = WorkoutSetSchema.parse({
        userId: TestUsers.currentUserCto._id,
        workoutExerciseId: exercise._id,
        workoutSessionExerciseId: DocumentService.generateID(),
        workoutSessionId: DocumentService.generateID(),
        setIndex: 0,
        plannedReps: 5,
        plannedWeight: 300,
        actualReps: 5,
        actualWeight: 300
      });

      exerciseMapService.updateCTOBestSet(newSet);

      const updatedCTO = exerciseMapService.getCTO(exercise._id);
      expect(updatedCTO?.bestSet?._id).toBe(newSet._id);
    });

    it('should skip when no CTO exists', () => {
      MockData.setupBaseData();
      exerciseMapService.setExerciseCTOs([]);

      const fakeSet = WorkoutSetSchema.parse({
        userId: TestUsers.currentUserCto._id,
        workoutExerciseId: DocumentService.generateID(),
        workoutSessionExerciseId: DocumentService.generateID(),
        workoutSessionId: DocumentService.generateID(),
        setIndex: 0,
        plannedReps: 5,
        plannedWeight: 100,
        actualReps: 5,
        actualWeight: 100
      });

      // Should not throw
      exerciseMapService.updateCTOBestSet(fakeSet);
    });
  });

  describe('updateCTOsForCompletedSession', () => {
    it('should update lastSessionExercise and lastFirstSet', () => {
      const baseData = MockData.setupBaseData();
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        completedSessionCount: 5,
        sessionsPerMicrocycle: 5
      });

      // Re-setup CTOs with session data
      MockData.exerciseMapServiceMock.setDefaultExerciseCTOs(
        baseData.calibrations,
        baseData.exercises,
        baseData.equipmentTypes
      );

      const completedSession = data.sessions.find((s) => s.complete);
      expect(completedSession).toBeDefined();
      if (!completedSession) return;

      const sessionExercises = data.sessionExercises.filter(
        (se) => se.workoutSessionId === completedSession._id
      );
      const sets = data.sets.filter((s) => s.workoutSessionId === completedSession._id);

      // Clear lastSessionExercise on CTOs to test the update
      for (const cto of exerciseMapService.exerciseCTOs) {
        cto.lastSessionExercise = null;
        cto.lastFirstSet = null;
      }

      exerciseMapService.updateCTOsForCompletedSession(sessionExercises, sets);

      // Every session exercise should have its CTO updated
      const uniqueExerciseIds = new Set(sessionExercises.map((se) => se.workoutExerciseId));
      let updatedCount = 0;
      for (const se of sessionExercises) {
        const cto = exerciseMapService.getCTO(se.workoutExerciseId);
        if (cto?.lastSessionExercise?._id === se._id) {
          updatedCount++;
          // Verify lastFirstSet was set from setOrder[0]
          if (se.setOrder.length > 0) {
            const expectedFirstSet = sets.find((s) => s._id === se.setOrder[0]);
            if (expectedFirstSet) {
              expect(cto.lastFirstSet?._id).toBe(expectedFirstSet._id);
            }
          }
        }
      }
      expect(updatedCount).toBe(uniqueExerciseIds.size);
    });

    it('should update bestSet from session sets', () => {
      const baseData = MockData.setupBaseData();
      const data = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        completedSessionCount: 5,
        sessionsPerMicrocycle: 5
      });

      // Re-setup CTOs with session data
      MockData.exerciseMapServiceMock.setDefaultExerciseCTOs(
        baseData.calibrations,
        baseData.exercises,
        baseData.equipmentTypes
      );

      // Clear bestSet on all CTOs
      for (const cto of exerciseMapService.exerciseCTOs) {
        cto.bestSet = null;
      }

      const completedSession = data.sessions.find((s) => s.complete);
      expect(completedSession).toBeDefined();
      if (!completedSession) return;

      const sessionExercises = data.sessionExercises.filter(
        (se) => se.workoutSessionId === completedSession._id
      );
      const sets = data.sets.filter((s) => s.workoutSessionId === completedSession._id);

      exerciseMapService.updateCTOsForCompletedSession(sessionExercises, sets);

      // At least one CTO should now have a bestSet
      const ctosWithBestSet = exerciseMapService.exerciseCTOs.filter((cto) => cto.bestSet != null);
      expect(ctosWithBestSet.length).toBeGreaterThan(0);
    });
  });

  describe('removeCTO', () => {
    it('should remove CTO from map', () => {
      const baseData = MockData.setupBaseData();

      const exercise = baseData.exercises[0];
      expect(exerciseMapService.getCTO(exercise._id)).toBeDefined();

      exerciseMapService.removeCTO(exercise._id);

      expect(exerciseMapService.getCTO(exercise._id)).toBeUndefined();
    });
  });

  describe('getCTOsForCalibrationIds utility', () => {
    it('should return CTOs for given calibration IDs after move to utility', () => {
      const baseData = MockData.setupBaseData();
      const calibrationIds = baseData.calibrations.map((c) => c._id);

      const ctos = getCTOsForCalibrationIds(calibrationIds);

      expect(ctos.length).toBeGreaterThan(0);
      // Each CTO should correspond to an exercise that has a calibration
      const exerciseIds = new Set(baseData.calibrations.map((c) => c.workoutExerciseId));
      for (const cto of ctos) {
        expect(exerciseIds.has(cto._id)).toBe(true);
      }
    });

    it('should deduplicate CTOs for same exercise', () => {
      const baseData = MockData.setupBaseData();

      // Add a second calibration for the same exercise
      const exercise = baseData.exercises[0];
      const extraCal = MockData.exerciseCalibrationMapServiceMock.addCalibration({
        workoutExerciseId: exercise._id,
        weight: 100,
        reps: 10
      });

      const existingCal = baseData.calibrations.find((c) => c.workoutExerciseId === exercise._id);
      expect(existingCal).toBeDefined();
      if (!existingCal) return;

      const ctos = getCTOsForCalibrationIds([existingCal._id, extraCal._id]);

      // Should return only one CTO for the exercise
      const matchingCTOs = ctos.filter((cto) => cto._id === exercise._id);
      expect(matchingCTOs).toHaveLength(1);
    });
  });
});
