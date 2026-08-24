import type { ProjectWorkoutPrimaryEndpointOptions } from '@aneuhold/core-ts-api-lib';
import { DocumentService, type WorkoutSet, WorkoutSetSchema } from '@aneuhold/core-ts-db-lib';
import { describe, expect, it } from 'vitest';
import TestUsers from '$testUtils/TestUsers';
import { createWorkoutPrepareForSave } from './workoutPersistenceUtils';

/**
 * Builds a minimal valid WorkoutSet for exercising the persistence helpers.
 */
const makeSet = (): WorkoutSet =>
  WorkoutSetSchema.parse({
    userId: TestUsers.currentUserCto._id,
    workoutExerciseId: DocumentService.generateID(),
    workoutSessionId: DocumentService.generateID(),
    workoutSessionExerciseId: DocumentService.generateID()
  });

describe('createWorkoutPrepareForSave', () => {
  it('stages a single insert under the document type key', () => {
    const prepareForSave = createWorkoutPrepareForSave<WorkoutSet>('sets');
    const options: ProjectWorkoutPrimaryEndpointOptions = {};
    const set = makeSet();

    prepareForSave(options, { insert: [set] });

    expect(options.insert?.sets).toEqual([set]);
  });

  it('appends inserts across repeated calls for the same key instead of overwriting', () => {
    const prepareForSave = createWorkoutPrepareForSave<WorkoutSet>('sets');
    const options: ProjectWorkoutPrimaryEndpointOptions = {};
    const first = makeSet();
    const second = makeSet();
    const third = makeSet();

    prepareForSave(options, { insert: [first] });
    prepareForSave(options, { insert: [second, third] });

    expect(options.insert?.sets).toEqual([first, second, third]);
  });

  it('appends updates across repeated calls for the same key', () => {
    const prepareForSave = createWorkoutPrepareForSave<WorkoutSet>('sets');
    const options: ProjectWorkoutPrimaryEndpointOptions = {};
    const first = makeSet();
    const second = makeSet();

    prepareForSave(options, { update: [first] });
    prepareForSave(options, { update: [second] });

    expect(options.update?.sets).toEqual([first, second]);
  });

  it('appends deletes across repeated calls for the same key', () => {
    const prepareForSave = createWorkoutPrepareForSave<WorkoutSet>('sets');
    const options: ProjectWorkoutPrimaryEndpointOptions = {};
    const firstId = DocumentService.generateID();
    const secondId = DocumentService.generateID();

    prepareForSave(options, { delete: [firstId] });
    prepareForSave(options, { delete: [secondId] });

    expect(options.delete?.sets).toEqual([firstId, secondId]);
  });

  it('keeps operations for different document types independent on one options object', () => {
    const prepareSets = createWorkoutPrepareForSave<WorkoutSet>('sets');
    const prepareSessionExercises = createWorkoutPrepareForSave('sessionExercises');
    const options: ProjectWorkoutPrimaryEndpointOptions = {};
    const set = makeSet();

    prepareSets(options, { insert: [set] });
    prepareSessionExercises(options, { insert: [] });

    expect(options.insert?.sets).toEqual([set]);
    expect(options.insert?.sessionExercises).toEqual([]);
  });

  it('merges get options rather than replacing them', () => {
    const prepareForSave = createWorkoutPrepareForSave<WorkoutSet>('sets');
    const options: ProjectWorkoutPrimaryEndpointOptions = {};

    prepareForSave(options, { get: { exerciseCTOs: { all: true } } });
    prepareForSave(options, { get: { muscleGroupVolumeCTOs: { all: true } } });

    expect(options.get?.exerciseCTOs).toEqual({ all: true });
    expect(options.get?.muscleGroupVolumeCTOs).toEqual({ all: true });
  });
});
