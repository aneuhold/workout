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

class EquipmentTypeMapServiceMock {
  #defaultEquipmentTypes: Record<MockDefaultEquipmentType, WorkoutEquipmentType> | null = null;
  #defaultsOwnerId: UUID | null = null;

  /**
   * The default equipment types, built on first read and rebuilt whenever the
   * current test user changes, so they always belong to whoever
   * `MockUsers.currentUserCto` is now.
   */
  get defaultEquipmentTypes(): Record<MockDefaultEquipmentType, WorkoutEquipmentType> {
    const ownerId = MockUsers.currentUserCto._id;
    if (!this.#defaultEquipmentTypes || this.#defaultsOwnerId !== ownerId) {
      this.#defaultEquipmentTypes = this.#createDefaultEquipmentTypes();
      this.#defaultsOwnerId = ownerId;
    }
    return this.#defaultEquipmentTypes;
  }

  reset(): void {
    equipmentTypeMapService.setMap({});
  }

  addDefaultEquipmentTypes(): WorkoutEquipmentType[] {
    const docs = Object.values(this.defaultEquipmentTypes);
    for (const doc of docs) {
      equipmentTypeMapService.addDocWithoutPersist(doc);
    }
    return docs;
  }

  addEquipmentType(title: string, weightOptions: number[]): WorkoutEquipmentType {
    const doc = this.createEquipmentType(title, weightOptions);
    equipmentTypeMapService.addDocWithoutPersist(doc);
    return doc;
  }

  createEquipmentType(title: string, weightOptions: number[]): WorkoutEquipmentType {
    return WorkoutEquipmentTypeSchema.parse({
      userId: MockUsers.currentUserCto._id,
      title,
      weightOptions
    });
  }

  #createDefaultEquipmentTypes(): Record<MockDefaultEquipmentType, WorkoutEquipmentType> {
    return {
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
  }
}

const equipmentTypeMapServiceMock = new EquipmentTypeMapServiceMock();
export default equipmentTypeMapServiceMock;
