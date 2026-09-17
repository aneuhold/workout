import { type WorkoutEquipmentType, WorkoutEquipmentTypeSchema } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import MockUsers from '$util/MockUsers';
import equipmentTypeMapService from './EquipmentTypeMap.service.svelte';

export enum MockDefaultEquipmentType {
  Barbell = 'Barbell',
  Dumbbells = 'Dumbbells',
  CableMachine = 'Cable Machine',
  Bodyweight = 'Bodyweight',
  ResistanceBand = 'Resistance Band'
}

export default class EquipmentTypeMapServiceMock {
  static #defaultEquipmentTypes: Record<MockDefaultEquipmentType, WorkoutEquipmentType> | null =
    null;
  static #defaultsOwnerId: UUID | null = null;

  /**
   * The default equipment types, built on first read and rebuilt whenever the
   * current test user changes, so they always belong to whoever
   * `MockUsers.currentUserCto` is now.
   */
  static get defaultEquipmentTypes(): Record<MockDefaultEquipmentType, WorkoutEquipmentType> {
    const ownerId = MockUsers.currentUserCto._id;
    if (
      !EquipmentTypeMapServiceMock.#defaultEquipmentTypes ||
      EquipmentTypeMapServiceMock.#defaultsOwnerId !== ownerId
    ) {
      EquipmentTypeMapServiceMock.#defaultEquipmentTypes =
        EquipmentTypeMapServiceMock.#createDefaultEquipmentTypes();
      EquipmentTypeMapServiceMock.#defaultsOwnerId = ownerId;
    }
    return EquipmentTypeMapServiceMock.#defaultEquipmentTypes;
  }

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
      userId: MockUsers.currentUserCto._id,
      title,
      weightOptions
    });
  }

  static #createDefaultEquipmentTypes(): Record<MockDefaultEquipmentType, WorkoutEquipmentType> {
    return {
      [MockDefaultEquipmentType.Barbell]: EquipmentTypeMapServiceMock.createEquipmentType(
        MockDefaultEquipmentType.Barbell,
        [
          45, 55, 65, 75, 85, 95, 105, 115, 125, 135, 145, 155, 165, 175, 185, 195, 205, 215, 225,
          235, 245, 255, 265, 275, 285, 295, 305, 315
        ]
      ),
      [MockDefaultEquipmentType.Dumbbells]: EquipmentTypeMapServiceMock.createEquipmentType(
        MockDefaultEquipmentType.Dumbbells,
        [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
      ),
      [MockDefaultEquipmentType.CableMachine]: EquipmentTypeMapServiceMock.createEquipmentType(
        MockDefaultEquipmentType.CableMachine,
        [
          5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120,
          130, 140, 150
        ]
      ),
      [MockDefaultEquipmentType.Bodyweight]: EquipmentTypeMapServiceMock.createEquipmentType(
        MockDefaultEquipmentType.Bodyweight,
        [0]
      ),
      [MockDefaultEquipmentType.ResistanceBand]: EquipmentTypeMapServiceMock.createEquipmentType(
        MockDefaultEquipmentType.ResistanceBand,
        [5, 10, 15, 20, 25, 30, 35, 40, 50, 60]
      )
    };
  }
}
