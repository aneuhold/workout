import {
  type DocumentMap,
  NonogramKatanaItemName,
  type NonogramKatanaUpgrade,
  NonogramKatanaUpgradeName,
  NonogramKatanaUpgradeSchema
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import nonogramKatanaItemNameToUpgradesMap from '$routes/entertainment/nonogramkatana/upgrades/nonogramKatanaItemNameToUpgradesMap';
import { nonogramKatanaUpgradesDisplayInfo } from '$routes/entertainment/nonogramkatana/upgrades/nonogramKatanaUpgradesDisplayInfo';
import DashboardAPIService from '$util/api/DashboardAPIService';
import LocalData from '$util/LocalData/LocalData';
import { createLogger } from '$util/logging/logger';
import type { DocumentInsertOrUpdateInfo } from '../DocumentMapStoreService.svelte';
import DocumentMapStoreService from '../DocumentMapStoreService.svelte';

const log = createLogger('NonogramKatanaUpgradeMapService.ts');

/**
 * The Nonogram Katana upgrade map service. This is the document service for
 * {@link NonogramKatanaUpgrade} documents.
 */
export class NonogramKatanaUpgradeMapService extends DocumentMapStoreService<NonogramKatanaUpgrade> {
  /**
   * The map of upgrade names to their associated document ID. This doesn't
   * always have a value, because upgrades might not be in the DB yet for the
   * current user.
   */
  private nameToIdMap: { [key in NonogramKatanaUpgradeName]?: UUID } = {};

  protected override getFromLocalData(): DocumentMap<NonogramKatanaUpgrade> | null {
    return LocalData.nonogramKatanaUpgradeMap;
  }

  public getUpgradeByName(
    upgradeName: NonogramKatanaUpgradeName
  ): NonogramKatanaUpgrade | undefined {
    if (!this.nameToIdMap[upgradeName]) {
      this.createNameToIdMap(this.mapState);
    }
    const id = this.nameToIdMap[upgradeName];
    if (!id) return undefined;
    return this.mapState[id];
  }

  /**
   * Gets the array of {@link NonogramKatanaUpgrade} documents that require
   * the given item name.
   *
   * @param itemName The item name to get upgrades for
   * @param filterToOnlyWorkableUpgrades Whether to only return upgrades that
   *   are currently workable
   */
  public getUpgradesByItemName(
    itemName: NonogramKatanaItemName,
    filterToOnlyWorkableUpgrades = true
  ): NonogramKatanaUpgrade[] {
    const map = this.mapState;
    const workableUpgrades = this.getWorkableUpgrades(map);
    const upgradeNames = nonogramKatanaItemNameToUpgradesMap[itemName];
    if (!upgradeNames) {
      return [];
    }
    const filteredUpgradeNames = upgradeNames
      .filter((upgradeName) => {
        return !filterToOnlyWorkableUpgrades || workableUpgrades[upgradeName];
      })
      .sort((a, b) => {
        const upgradeAId = this.nameToIdMap[a];
        const upgradeBId = this.nameToIdMap[b];
        if (!upgradeAId) {
          return 1;
        } else if (!upgradeBId) {
          return -1;
        }
        const aPriority = map[upgradeAId]?.priority ?? 0;
        const bPriority = map[upgradeBId]?.priority ?? 0;
        return bPriority - aPriority;
      });

    const upgrades: NonogramKatanaUpgrade[] = [];
    filteredUpgradeNames.forEach((name) => {
      const id = this.nameToIdMap[name];
      if (id && map[id]) {
        upgrades.push(map[id]);
      }
    });
    return upgrades;
  }

  /**
   * Gets the workable upgrades for the provided map of ids to upgrades. The
   * returned map is based on the upgrade name instead of the ID.
   *
   * Workable upgrades are upgrades that are not completed and have all their
   * required upgrades completed.
   *
   * @param upgradeMap The map of upgrade IDs to upgrades
   */
  getWorkableUpgrades(upgradeMap: DocumentMap<NonogramKatanaUpgrade>): {
    [key in NonogramKatanaUpgradeName]?: NonogramKatanaUpgrade;
  } {
    // Create the name to ID map if it doesn't exist yet
    if (Object.values(this.nameToIdMap).length === 0) {
      this.createNameToIdMap(upgradeMap);
    }
    const workableUpgrades = Object.entries(this.nameToIdMap)
      .filter(([upgradeName, upgradeId]) => {
        const upgrade = upgradeMap[upgradeId];
        if (!upgrade) {
          return false;
        }
        if (upgrade.completed) {
          return false;
        }
        const upgradeDisplayInfo =
          nonogramKatanaUpgradesDisplayInfo[upgradeName as NonogramKatanaUpgradeName];
        return upgradeDisplayInfo.requiredUpgrades.every((requiredUpgrade) => {
          const otherUpgradeId = this.nameToIdMap[requiredUpgrade];
          if (!otherUpgradeId) {
            log.error('No upgrade ID found for', requiredUpgrade);
            return false;
          }
          const otherUpgrade = upgradeMap[otherUpgradeId];
          if (!otherUpgrade) {
            log.error('No upgrade found for', otherUpgradeId);
            return false;
          }
          return otherUpgrade.completed;
        });
      })
      .reduce<Record<string, NonogramKatanaUpgrade>>((map, [upgradeName, upgradeId]) => {
        const upgrade = upgradeMap[upgradeId];
        if (!upgrade) {
          return map;
        }
        map[upgradeName] = upgrade;
        return map;
      }, {});
    return workableUpgrades;
  }

  /**
   * Creates or updates the Nonogram Katana upgrades for the given user based
   * on the defaults. It was done this way so that the user didn't need to
   * always have this data created on application load.
   *
   * @param userId The ID of the user to create or update upgrades for.
   */
  public createOrUpdateUpgrades(userId: UUID): void {
    const currentMap = this.mapState;
    const existingUpgrades = Object.values(currentMap).filter((upgrade) => upgrade !== undefined);
    const existingUpgradeNames = new Set(existingUpgrades.map((upgrade) => upgrade.upgradeName));
    const upgradesToAdd: NonogramKatanaUpgrade[] = [];
    const newUpgradeIds: Set<UUID> = new Set();
    Object.values(NonogramKatanaUpgradeName).forEach((upgradeName) => {
      if (!existingUpgradeNames.has(upgradeName)) {
        const upgradeDisplayInfo = nonogramKatanaUpgradesDisplayInfo[upgradeName];
        const currentItemAmounts: Record<string, number> = {};
        upgradeDisplayInfo.requiredItems.forEach((requiredItem) => {
          currentItemAmounts[requiredItem.itemName] = 0;
        });
        const newUpgrade = NonogramKatanaUpgradeSchema.parse({
          userId,
          upgradeName,
          currentLevel: 0,
          completed: false,
          // -50 so it goes after all the ones with a default priority
          priority: upgradeDisplayInfo.defaultPriority ?? -50,
          currentItemAmounts
        });
        newUpgradeIds.add(newUpgrade._id);
        upgradesToAdd.push(newUpgrade);
      }
    });
    if (upgradesToAdd.length > 0) {
      this.upsertManyDocs({
        filter: (doc) => newUpgradeIds.has(doc._id),
        newDocs: upgradesToAdd,
        mutator: (doc) => doc
      });
    }
  }

  public override setMap(newMap: DocumentMap<NonogramKatanaUpgrade>): void {
    super.setMap(newMap);
    this.createNameToIdMap(newMap);
  }

  private createNameToIdMap(map: DocumentMap<NonogramKatanaUpgrade>): void {
    this.nameToIdMap = {};
    Object.values(map).forEach((upgrade) => {
      if (upgrade) {
        this.nameToIdMap[upgrade.upgradeName] = upgrade._id;
      }
    });
  }

  protected override persistToLocalData(): DocumentMap<NonogramKatanaUpgrade> {
    return LocalData.setAndGetNonogramKatanaUpgradeMap(this.mapState);
  }

  protected override persistToDb(
    updateInfo: DocumentInsertOrUpdateInfo<NonogramKatanaUpgrade>
  ): void {
    DashboardAPIService.queryApi({
      update: updateInfo.update ? { nonogramKatanaUpgrades: updateInfo.update } : undefined,
      insert: updateInfo.insert ? { nonogramKatanaUpgrades: updateInfo.insert } : undefined,
      get: {
        nonogramKatanaUpgrades: true
      }
    });
  }
}

const nonogramKatanaUpgradeMapService = new NonogramKatanaUpgradeMapService();

export default nonogramKatanaUpgradeMapService;
