import { type WorkoutMuscleGroup, WorkoutMuscleGroupSchema } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import TestUsers from '$testUtils/TestUsers';
import muscleGroupMapService from './MuscleGroupMap.service.svelte';

export enum MockDefaultMuscleGroup {
  Chest = 'Chest',
  Lats = 'Lats',
  Quadriceps = 'Quadriceps',
  Hamstrings = 'Hamstrings',
  Glutes = 'Glutes',
  FrontDelts = 'Front Delts',
  SideDelts = 'Side Delts',
  RearDelts = 'Rear Delts',
  Triceps = 'Triceps',
  Biceps = 'Biceps'
}

export default class MuscleGroupMapServiceMock {
  static #defaultMuscleGroups: Record<MockDefaultMuscleGroup, WorkoutMuscleGroup> | null = null;
  static #defaultsOwnerId: UUID | null = null;

  /**
   * The default muscle groups, built on first read and rebuilt whenever the
   * current test user changes, so they always belong to whoever
   * `TestUsers.currentUserCto` is now.
   */
  static get defaultMuscleGroups(): Record<MockDefaultMuscleGroup, WorkoutMuscleGroup> {
    const ownerId = TestUsers.currentUserCto._id;
    if (
      !MuscleGroupMapServiceMock.#defaultMuscleGroups ||
      MuscleGroupMapServiceMock.#defaultsOwnerId !== ownerId
    ) {
      MuscleGroupMapServiceMock.#defaultMuscleGroups =
        MuscleGroupMapServiceMock.#createDefaultMuscleGroups();
      MuscleGroupMapServiceMock.#defaultsOwnerId = ownerId;
    }
    return MuscleGroupMapServiceMock.#defaultMuscleGroups;
  }

  reset(): void {
    muscleGroupMapService.setMap({});
    muscleGroupMapService.setVolumeCTOs([]);
  }

  addDefaultMuscleGroups(): WorkoutMuscleGroup[] {
    const docs = Object.values(MuscleGroupMapServiceMock.defaultMuscleGroups);
    for (const doc of docs) {
      muscleGroupMapService.addDocWithoutPersist(doc);
    }
    return docs;
  }

  addMuscleGroup(name: string, description?: string): WorkoutMuscleGroup {
    const doc = MuscleGroupMapServiceMock.createMuscleGroup(name, description);
    muscleGroupMapService.addDocWithoutPersist(doc);
    return doc;
  }

  static createMuscleGroup(name: string, description?: string): WorkoutMuscleGroup {
    return WorkoutMuscleGroupSchema.parse({
      userId: TestUsers.currentUserCto._id,
      name,
      description
    });
  }

  static #createDefaultMuscleGroups(): Record<MockDefaultMuscleGroup, WorkoutMuscleGroup> {
    return {
      [MockDefaultMuscleGroup.Chest]: MuscleGroupMapServiceMock.createMuscleGroup(
        MockDefaultMuscleGroup.Chest
      ),
      [MockDefaultMuscleGroup.Lats]: MuscleGroupMapServiceMock.createMuscleGroup(
        MockDefaultMuscleGroup.Lats,
        'Largest back muscle; key for pull movements.'
      ),
      [MockDefaultMuscleGroup.Quadriceps]: MuscleGroupMapServiceMock.createMuscleGroup(
        MockDefaultMuscleGroup.Quadriceps
      ),
      [MockDefaultMuscleGroup.Hamstrings]: MuscleGroupMapServiceMock.createMuscleGroup(
        MockDefaultMuscleGroup.Hamstrings
      ),
      [MockDefaultMuscleGroup.Glutes]: MuscleGroupMapServiceMock.createMuscleGroup(
        MockDefaultMuscleGroup.Glutes
      ),
      [MockDefaultMuscleGroup.FrontDelts]: MuscleGroupMapServiceMock.createMuscleGroup(
        MockDefaultMuscleGroup.FrontDelts
      ),
      [MockDefaultMuscleGroup.SideDelts]: MuscleGroupMapServiceMock.createMuscleGroup(
        MockDefaultMuscleGroup.SideDelts
      ),
      [MockDefaultMuscleGroup.RearDelts]: MuscleGroupMapServiceMock.createMuscleGroup(
        MockDefaultMuscleGroup.RearDelts
      ),
      [MockDefaultMuscleGroup.Triceps]: MuscleGroupMapServiceMock.createMuscleGroup(
        MockDefaultMuscleGroup.Triceps
      ),
      [MockDefaultMuscleGroup.Biceps]: MuscleGroupMapServiceMock.createMuscleGroup(
        MockDefaultMuscleGroup.Biceps
      )
    };
  }
}
