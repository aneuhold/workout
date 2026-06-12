import { type WorkoutEquipmentType, WorkoutEquipmentTypeSchema } from '@aneuhold/core-ts-db-lib';
import TestUsers from '$testUtils/TestUsers';
import equipmentTypeMapService from './EquipmentTypeMap.service.svelte';

export enum MockDefaultEquipmentType {
  Barbell = 'Barbell',
  Dumbbells = 'Dumbbells',
  CableMachine = 'Cable Machine',
  Bodyweight = 'Bodyweight',
  ResistanceBand = 'Resistance Band'
}

export default class EquipmentTypeMapServiceMock {
  static readonly defaultEquipmentTypes: Record<MockDefaultEquipmentType, WorkoutEquipmentType> = {
    [MockDefaultEquipmentType.Barbell]: this.createEquipmentType(
      MockDefaultEquipmentType.Barbell,
      [
        45, 55, 65, 75, 85, 95, 105, 115, 125, 135, 145, 155, 165, 175, 185, 195, 205, 215, 225,
        235, 245, 255, 265, 275, 285, 295, 305, 315
      ]
    ),
    [MockDefaultEquipmentType.Dumbbells]: this.createEquipmentType(
      MockDefaultEquipmentType.Dumbbells,
      [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
    ),
    [MockDefaultEquipmentType.CableMachine]: this.createEquipmentType(
      MockDefaultEquipmentType.CableMachine,
      [
        5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120,
        130, 140, 150
      ]
    ),
    [MockDefaultEquipmentType.Bodyweight]: this.createEquipmentType(
      MockDefaultEquipmentType.Bodyweight,
      [0]
    ),
    [MockDefaultEquipmentType.ResistanceBand]: this.createEquipmentType(
      MockDefaultEquipmentType.ResistanceBand,
      [5, 10, 15, 20, 25, 30, 35, 40, 50, 60]
    )
  };

  reset(): void {
    equipmentTypeMapService.setMap({});
  }

  addDefaultEquipmentTypes(): WorkoutEquipmentType[] {
    const docs = Object.values(EquipmentTypeMapServiceMock.defaultEquipmentTypes);
    for (const doc of docs) {
      equipmentTypeMapService.addDocWithoutPersist(doc);
    }
    return docs;
  }

  addEquipmentType(title: string, weightOptions: number[]): WorkoutEquipmentType {
    const doc = EquipmentTypeMapServiceMock.createEquipmentType(title, weightOptions);
    equipmentTypeMapService.addDocWithoutPersist(doc);
    return doc;
  }

  static createEquipmentType(title: string, weightOptions: number[]): WorkoutEquipmentType {
    return WorkoutEquipmentTypeSchema.parse({
      userId: TestUsers.currentUserCto._id,
      title,
      weightOptions
    });
  }
}
