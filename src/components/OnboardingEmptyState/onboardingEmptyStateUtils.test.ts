import {
  CycleType,
  DocumentService,
  type WorkoutMesocycle,
  WorkoutMesocycleSchema,
  type WorkoutSet,
  WorkoutSetSchema
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import { shouldShowOnboardingChecklist } from './onboardingEmptyStateUtils';

const userId: UUID = DocumentService.generateID();

function buildMesocycle(): WorkoutMesocycle {
  return WorkoutMesocycleSchema.parse({
    userId,
    cycleType: CycleType.MuscleGain,
    plannedSessionCountPerMicrocycle: 5,
    plannedMicrocycleLengthInDays: 7
  });
}

function buildSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return WorkoutSetSchema.parse({
    userId,
    workoutExerciseId: DocumentService.generateID(),
    workoutSessionId: DocumentService.generateID(),
    workoutSessionExerciseId: DocumentService.generateID(),
    ...overrides
  });
}

const completedSet = (): WorkoutSet =>
  buildSet({
    plannedReps: 10,
    plannedWeight: 100,
    plannedRir: 2,
    actualReps: 10,
    actualWeight: 100,
    rir: 2
  });

const incompleteSet = (): WorkoutSet =>
  buildSet({ plannedReps: 10, plannedWeight: 100, plannedRir: 2 });

describe('shouldShowOnboardingChecklist', () => {
  it('shows when no mesocycles and no sets', () => {
    expect(shouldShowOnboardingChecklist([], [])).toBe(true);
  });

  it('shows when no mesocycles and only incomplete sets', () => {
    expect(shouldShowOnboardingChecklist([], [incompleteSet(), incompleteSet()])).toBe(true);
  });

  it('hides when a completed set exists', () => {
    expect(shouldShowOnboardingChecklist([], [incompleteSet(), completedSet()])).toBe(false);
  });

  it('hides when a mesocycle exists regardless of sets', () => {
    expect(shouldShowOnboardingChecklist([buildMesocycle()], [])).toBe(false);
    expect(shouldShowOnboardingChecklist([buildMesocycle()], [incompleteSet()])).toBe(false);
  });
});
