import { type WorkoutMuscleGroup, WorkoutMuscleGroupSchema } from '@aneuhold/core-ts-db-lib';
import TestUsers from '$testUtils/TestUsers';
import muscleGroupMapService from './muscleGroupMapService.svelte';

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
  reset(): void {
    muscleGroupMapService.setMap({});
  }

  addMuscleGroup(name: string, description?: string): WorkoutMuscleGroup {
    const doc = WorkoutMuscleGroupSchema.parse({
      userId: TestUsers.currentUserCto._id,
      name,
      description
    });
    muscleGroupMapService.addDocWithoutPersist(doc);
    return doc;
  }

  addDefaultMuscleGroups(): Record<MockDefaultMuscleGroup, WorkoutMuscleGroup> {
    return {
      [MockDefaultMuscleGroup.Chest]: this.addMuscleGroup(MockDefaultMuscleGroup.Chest),
      [MockDefaultMuscleGroup.Lats]: this.addMuscleGroup(
        MockDefaultMuscleGroup.Lats,
        'Largest back muscle; key for pull movements.'
      ),
      [MockDefaultMuscleGroup.Quadriceps]: this.addMuscleGroup(MockDefaultMuscleGroup.Quadriceps),
      [MockDefaultMuscleGroup.Hamstrings]: this.addMuscleGroup(MockDefaultMuscleGroup.Hamstrings),
      [MockDefaultMuscleGroup.Glutes]: this.addMuscleGroup(MockDefaultMuscleGroup.Glutes),
      [MockDefaultMuscleGroup.FrontDelts]: this.addMuscleGroup(MockDefaultMuscleGroup.FrontDelts),
      [MockDefaultMuscleGroup.SideDelts]: this.addMuscleGroup(MockDefaultMuscleGroup.SideDelts),
      [MockDefaultMuscleGroup.RearDelts]: this.addMuscleGroup(MockDefaultMuscleGroup.RearDelts),
      [MockDefaultMuscleGroup.Triceps]: this.addMuscleGroup(MockDefaultMuscleGroup.Triceps),
      [MockDefaultMuscleGroup.Biceps]: this.addMuscleGroup(MockDefaultMuscleGroup.Biceps)
    };
  }
}
