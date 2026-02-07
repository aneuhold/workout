import type { NonogramKatanaItemName, NonogramKatanaUpgradeName } from '@aneuhold/core-ts-db-lib';
import { nonogramKatanaUpgradesDisplayInfo } from './nonogramKatanaUpgradesDisplayInfo';

type NonogramKatanaItemNameToUpgradesMap = {
  [key in NonogramKatanaItemName]?: NonogramKatanaUpgradeName[];
};

/**
 * A map from item names to the upgrades that require them.
 *
 * This is a static constant that doesn't involve user data.
 */
const nonogramKatanaItemNameToUpgradesMap: NonogramKatanaItemNameToUpgradesMap = Object.entries(
  nonogramKatanaUpgradesDisplayInfo
).reduce<NonogramKatanaItemNameToUpgradesMap>((acc, [upgradeName, upgradeInfo]) => {
  upgradeInfo.requiredItems.forEach((requiredItem) => {
    const itemName = requiredItem.itemName;
    if (!acc[itemName]) {
      acc[itemName] = [];
    }
    acc[itemName].push(upgradeName as NonogramKatanaUpgradeName);
  });
  return acc;
}, {});

export default nonogramKatanaItemNameToUpgradesMap;
