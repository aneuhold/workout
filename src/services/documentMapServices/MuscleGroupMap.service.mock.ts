import { type WorkoutMuscleGroup, WorkoutMuscleGroupSchema } from '@aneuhold/core-ts-db-lib';
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
  static readonly defaultMuscleGroups: Record<MockDefaultMuscleGroup, WorkoutMuscleGroup> = {
    [MockDefaultMuscleGroup.Chest]: this.createMuscleGroup(MockDefaultMuscleGroup.Chest),
    [MockDefaultMuscleGroup.Lats]: this.createMuscleGroup(
      MockDefaultMuscleGroup.Lats,
      'Largest back muscle; key for pull movements.'
    ),
    [MockDefaultMuscleGroup.Quadriceps]: this.createMuscleGroup(MockDefaultMuscleGroup.Quadriceps),
    [MockDefaultMuscleGroup.Hamstrings]: this.createMuscleGroup(MockDefaultMuscleGroup.Hamstrings),
    [MockDefaultMuscleGroup.Glutes]: this.createMuscleGroup(MockDefaultMuscleGroup.Glutes),
    [MockDefaultMuscleGroup.FrontDelts]: this.createMuscleGroup(MockDefaultMuscleGroup.FrontDelts),
    [MockDefaultMuscleGroup.SideDelts]: this.createMuscleGroup(MockDefaultMuscleGroup.SideDelts),
    [MockDefaultMuscleGroup.RearDelts]: this.createMuscleGroup(MockDefaultMuscleGroup.RearDelts),
    [MockDefaultMuscleGroup.Triceps]: this.createMuscleGroup(MockDefaultMuscleGroup.Triceps),
    [MockDefaultMuscleGroup.Biceps]: this.createMuscleGroup(MockDefaultMuscleGroup.Biceps)
  };

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
}
