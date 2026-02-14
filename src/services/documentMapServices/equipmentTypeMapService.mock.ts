import { type WorkoutEquipmentType, WorkoutEquipmentTypeSchema } from '@aneuhold/core-ts-db-lib';
import TestUsers from '$testUtils/TestUsers';
import equipmentTypeMapService from './equipmentTypeMapService.svelte';

export enum MockDefaultEquipmentType {
  Barbell = 'Barbell',
  Dumbbells = 'Dumbbells',
  CableMachine = 'Cable Machine',
  Bodyweight = 'Bodyweight',
  ResistanceBand = 'Resistance Band'
}

export default class EquipmentTypeMapServiceMock {
  reset(): void {
    equipmentTypeMapService.setMap({});
  }

  addEquipmentType(title: string, weightOptions?: number[]): WorkoutEquipmentType {
    const doc = WorkoutEquipmentTypeSchema.parse({
      userId: TestUsers.currentUserCto._id,
      title,
      weightOptions
    });
    equipmentTypeMapService.addDocWithoutPersist(doc);
    return doc;
  }

  addDefaultEquipmentTypes(): Record<MockDefaultEquipmentType, WorkoutEquipmentType> {
    return {
      [MockDefaultEquipmentType.Barbell]: this.addEquipmentType(
        MockDefaultEquipmentType.Barbell,
        [
          45, 55, 65, 75, 85, 95, 105, 115, 125, 135, 145, 155, 165, 175, 185, 195, 205, 215, 225,
          235, 245, 255, 265, 275, 285, 295, 305, 315
        ]
      ),
      [MockDefaultEquipmentType.Dumbbells]: this.addEquipmentType(
        MockDefaultEquipmentType.Dumbbells
      ),
      [MockDefaultEquipmentType.CableMachine]: this.addEquipmentType(
        MockDefaultEquipmentType.CableMachine
      ),
      [MockDefaultEquipmentType.Bodyweight]: this.addEquipmentType(
        MockDefaultEquipmentType.Bodyweight
      ),
      [MockDefaultEquipmentType.ResistanceBand]: this.addEquipmentType(
        MockDefaultEquipmentType.ResistanceBand
      )
    };
  }
}
