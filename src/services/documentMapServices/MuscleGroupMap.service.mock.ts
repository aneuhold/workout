import { type WorkoutMuscleGroup, WorkoutMuscleGroupSchema } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import MockUsers from '$util/MockUsers';
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

class MuscleGroupMapServiceMock {
  #defaultMuscleGroups: Record<MockDefaultMuscleGroup, WorkoutMuscleGroup> | null = null;
  #defaultsOwnerId: UUID | null = null;

  /**
   * The default muscle groups, built on first read and rebuilt whenever the
   * current test user changes, so they always belong to whoever
   * `MockUsers.currentUserCto` is now.
   */
  get defaultMuscleGroups(): Record<MockDefaultMuscleGroup, WorkoutMuscleGroup> {
    const ownerId = MockUsers.currentUserCto._id;
    if (!this.#defaultMuscleGroups || this.#defaultsOwnerId !== ownerId) {
      this.#defaultMuscleGroups = this.#createDefaultMuscleGroups();
      this.#defaultsOwnerId = ownerId;
    }
    return this.#defaultMuscleGroups;
  }

  reset(): void {
    muscleGroupMapService.setMap({});
    muscleGroupMapService.setVolumeCTOs([]);
  }

  addDefaultMuscleGroups(): WorkoutMuscleGroup[] {
    const docs = Object.values(this.defaultMuscleGroups);
    for (const doc of docs) {
      muscleGroupMapService.addDocWithoutPersist(doc);
    }
    return docs;
  }

  addMuscleGroup(name: string, description?: string): WorkoutMuscleGroup {
    const doc = this.createMuscleGroup(name, description);
    muscleGroupMapService.addDocWithoutPersist(doc);
    return doc;
  }

  createMuscleGroup(name: string, description?: string): WorkoutMuscleGroup {
    return WorkoutMuscleGroupSchema.parse({
      userId: MockUsers.currentUserCto._id,
      name,
      description
    });
  }

  #createDefaultMuscleGroups(): Record<MockDefaultMuscleGroup, WorkoutMuscleGroup> {
    return {
      [MockDefaultMuscleGroup.Chest]: this.createMuscleGroup(MockDefaultMuscleGroup.Chest),
      [MockDefaultMuscleGroup.Lats]: this.createMuscleGroup(
        MockDefaultMuscleGroup.Lats,
        'Largest back muscle; key for pull movements.'
      ),
      [MockDefaultMuscleGroup.Quadriceps]: this.createMuscleGroup(
        MockDefaultMuscleGroup.Quadriceps
      ),
      [MockDefaultMuscleGroup.Hamstrings]: this.createMuscleGroup(
        MockDefaultMuscleGroup.Hamstrings
      ),
      [MockDefaultMuscleGroup.Glutes]: this.createMuscleGroup(MockDefaultMuscleGroup.Glutes),
      [MockDefaultMuscleGroup.FrontDelts]: this.createMuscleGroup(
        MockDefaultMuscleGroup.FrontDelts
      ),
      [MockDefaultMuscleGroup.SideDelts]: this.createMuscleGroup(MockDefaultMuscleGroup.SideDelts),
      [MockDefaultMuscleGroup.RearDelts]: this.createMuscleGroup(MockDefaultMuscleGroup.RearDelts),
      [MockDefaultMuscleGroup.Triceps]: this.createMuscleGroup(MockDefaultMuscleGroup.Triceps),
      [MockDefaultMuscleGroup.Biceps]: this.createMuscleGroup(MockDefaultMuscleGroup.Biceps)
    };
  }
}

const muscleGroupMapServiceMock = new MuscleGroupMapServiceMock();
export default muscleGroupMapServiceMock;
