import {
  CycleType,
  DocumentService,
  type WorkoutMesocycle,
  WorkoutMesocycleSchema,
  type WorkoutSession,
  WorkoutSessionSchema
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

function buildSession(): WorkoutSession {
  return WorkoutSessionSchema.parse({
    userId,
    title: 'Test Session',
    startTime: new Date()
  });
}

describe('shouldShowOnboardingChecklist', () => {
  it('shows when no mesocycles and no sessions', () => {
    expect(shouldShowOnboardingChecklist([], [])).toBe(true);
  });

  it('hides when any session exists', () => {
    expect(shouldShowOnboardingChecklist([], [buildSession()])).toBe(false);
  });

  it('hides when a mesocycle exists regardless of sessions', () => {
    expect(shouldShowOnboardingChecklist([buildMesocycle()], [])).toBe(false);
    expect(shouldShowOnboardingChecklist([buildMesocycle()], [buildSession()])).toBe(false);
  });
});
