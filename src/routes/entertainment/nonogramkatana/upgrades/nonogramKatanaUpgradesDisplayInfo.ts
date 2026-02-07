import { NonogramKatanaItemName, NonogramKatanaUpgradeName } from '@aneuhold/core-ts-db-lib';
import type { Component } from 'svelte';

export type NonogramKatanaUpgradeDisplayInfo = {
  displayName: string;
  requiredUpgrades: NonogramKatanaUpgradeName[];
  requiredItems: Array<{ itemName: NonogramKatanaItemName; requiredAmount: number }>;
  defaultPriority?: number;
  icon?: Component;
};

export const nonogramKatanaUpgradesDisplayInfo: Record<
  NonogramKatanaUpgradeName,
  NonogramKatanaUpgradeDisplayInfo
> = {
  [NonogramKatanaUpgradeName.BuildingGuildLvl2]: {
    displayName: 'Guild Lvl 2',
    requiredUpgrades: [],
    defaultPriority: -1,
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 50
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingGuildLvl3]: {
    displayName: 'Guild Lvl 3',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingGuildLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 150
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 150
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingGuildLvl4]: {
    displayName: 'Guild Lvl 4',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingGuildLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 250
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 250
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingGuildLvl5]: {
    displayName: 'Guild Lvl 5',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingGuildLvl4],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 8
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 50
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingWarehouseLvl1]: {
    displayName: 'Warehouse Lvl 1',
    requiredUpgrades: [],
    defaultPriority: -2,
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 60
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 60
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingWarehouseLvl2]: {
    displayName: 'Warehouse Lvl 2',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingWarehouseLvl1,
      NonogramKatanaUpgradeName.BuildingGuildLvl2
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 80
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 80
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingWarehouseLvl3]: {
    displayName: 'Warehouse Lvl 3',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingWarehouseLvl2,
      NonogramKatanaUpgradeName.BuildingGuildLvl3
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 100
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingWarehouseLvl4]: {
    displayName: 'Warehouse Lvl 4',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingWarehouseLvl3,
      NonogramKatanaUpgradeName.BuildingGuildLvl4
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 280
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 140
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingWarehouseLvl5]: {
    displayName: 'Warehouse Lvl 5',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingWarehouseLvl4,
      NonogramKatanaUpgradeName.BuildingGuildLvl5
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 360
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 180
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingWarehouseLvl6]: {
    displayName: 'Warehouse Lvl 6',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingWarehouseLvl5],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 6
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 440
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 220
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingWareHouseLvl7]: {
    displayName: 'Warehouse Lvl 7',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingWarehouseLvl6],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 700
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 7
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 520
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 260
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWareHouseLvl1]: {
    displayName: 'Stackable Racks Lvl 1 (Warehouse Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingWareHouseLvl7],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWareHouseLvl2]: {
    displayName: 'Stackable Racks Lvl 2 (Warehouse Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyWareHouseLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 60
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWareHouseLvl3]: {
    displayName: 'Stackable Racks Lvl 3 (Warehouse Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyWareHouseLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 70
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingShopLvl1]: {
    displayName: 'Shop Lvl 1',
    defaultPriority: -3,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingShopLvl2]: {
    displayName: 'Shop Lvl 2',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingShopLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 80
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 80
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingShopLvl3]: {
    displayName: 'Shop Lvl 3',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingShopLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 800
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 200
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyShopPreOrders]: {
    displayName: 'Pre-Orders (Shop Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingShopLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.CoffeeBeans,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyShopGlassRecycling]: {
    displayName: 'Glass Recycling (Shop Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingShopLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 25
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl1]: {
    displayName: 'Alchemist Hut Lvl 1',
    defaultPriority: -4,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 140
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 70
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 70
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl2]: {
    displayName: 'Alchemist Hut Lvl 2',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl1],
    defaultPriority: -4.5,
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl3]: {
    displayName: 'Alchemist Hut Lvl 3',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 150
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Charcoal,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl4]: {
    displayName: 'Alchemist Hut Lvl 4',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Gunpowder,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl5]: {
    displayName: 'Alchemist Hut Lvl 5',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl4],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 440
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 220
      },
      {
        itemName: NonogramKatanaItemName.Gunpowder,
        requiredAmount: 80
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl6]: {
    displayName: 'Alchemist Hut Lvl 6',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl5],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 6
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 800
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 50
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutGreekGrenade]: {
    displayName: 'Greek Grenade (Alchemist Hut Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl6],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.OliveOil,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutSyntheticFertilizer]: {
    displayName: 'Synthetic Fertilizer (Alchemist Hut Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl6],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Charcoal,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutPotionOfHealingLvl1]: {
    displayName: 'Potion of Healing Lvl 1 (Alchemist Hut Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl6],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.CryptoCoin,
        requiredAmount: 50
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutPotionOfEnergy]: {
    displayName: 'Potion of Energy (Alchemist Hut Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl6],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.CryptoCoin,
        requiredAmount: 50
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutBerserkerPotion]: {
    displayName: 'Berserker Potion (Alchemist Hut Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl6],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Spices,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.MandrakeRoot,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutPotionOfHealingLvl2]: {
    displayName: 'Potion of Healing Lvl 2 (Alchemist Hut Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyAlchemistHutPotionOfHealingLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.PotionOfHealing,
        requiredAmount: 12
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Catalyst,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.MandrakeRoot,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutAmbrosiaPotion]: {
    displayName: 'Ambrosia Potion (Alchemist Hut Tech)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.TechnologyAlchemistHutBerserkerPotion,
      NonogramKatanaUpgradeName.TechnologyAlchemistHutPotionOfHealingLvl2
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.PotionOfHealingLvl2,
        requiredAmount: 12
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Catalyst,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.MandrakeRoot,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutConveyorLvl1]: {
    displayName: 'Conveyor Lvl 1 (Alchemist Hut Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl6],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.ElixerOfInsight,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutConveyorLvl2]: {
    displayName: 'Conveyor Lvl 2 (Alchemist Hut Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyAlchemistHutConveyorLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.ElixerOfInsight,
        requiredAmount: 60
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutGalvanization]: {
    displayName: 'Galvanization (Alchemist Hut Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl6],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.GoldIngot,
        requiredAmount: 25
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Catalyst,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutBalm]: {
    displayName: 'Balm (Alchemist Hut Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl6],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Herbs,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Cinnabar,
        requiredAmount: 9
      },
      {
        itemName: NonogramKatanaItemName.OliveOil,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Grimoire,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutPotionOfMentalPower]: {
    displayName: 'Potion of Mental Power (Alchemist Hut Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl6],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.GingkoBiloba,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Herbs,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Cinnabar,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Grimoire,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutMercury]: {
    displayName: 'Mercury (Alchemist Hut Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl6],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Cinnabar,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Charcoal,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Grimoire,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutGoldIngot]: {
    displayName: 'Gold Ingot (Alchemist Hut Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyAlchemistHutMercury],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.GoldIngot,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Arsenopyrite,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Mercury,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.Charcoal,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Grimoire,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAlchemistHutMadnessGrenade]: {
    displayName: 'Madness Grenade (Alchemist Hut Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyAlchemistHutMercury],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Mercury,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Gunpowder,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Herbs,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Arsenopyrite,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Grimoire,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingFieldLvl1]: {
    displayName: 'Field Lvl 1',
    defaultPriority: -5,
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyAlchemistHutPotionOfHealingLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingFieldLvl2]: {
    displayName: 'Field Lvl 2',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingFieldLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyFieldSeedDrill]: {
    displayName: 'Seed Drill (Field Tech)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingFieldLvl2,
      NonogramKatanaUpgradeName.TechnologyWorkshopMechanism
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.ElixerOfInsight,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyFieldCombineHarvester]: {
    displayName: 'Combine Harvester (Field Tech)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.TechnologyFieldSeedDrill,
      NonogramKatanaUpgradeName.TechnologyWorkshopSteamobile
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Steamobile,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.ElixerOfInsight,
        requiredAmount: 60
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingWorkshopLvl1]: {
    displayName: 'Workshop Lvl 1',
    defaultPriority: -27,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingWorkshopLvl2]: {
    displayName: 'Workshop Lvl 2',
    defaultPriority: -27.1,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingWorkshopLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 80
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingWorkshopLvl3]: {
    displayName: 'Workshop Lvl 3',
    defaultPriority: -27.2,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingWorkshopLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 160
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 160
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 80
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingWorkshopLvl4]: {
    displayName: 'Workshop Lvl 4',
    defaultPriority: -27.3,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingWorkshopLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 250
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingWorkshopLvl5]: {
    displayName: 'Workshop Lvl 5',
    defaultPriority: -27.4,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingWorkshopLvl4],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWorkshopShieldLvl1]: {
    displayName: 'Shield for a Hero Lvl 1 (Workshop Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingWorkshopLvl5],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.MeteoricIron,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWorkshopShieldLvl2]: {
    displayName: 'Shield for a Hero Lvl 2 (Workshop Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyWorkshopShieldLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWorkshopShieldLvl3]: {
    displayName: 'Shield for a Hero Lvl 3 (Workshop Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyWorkshopShieldLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 60
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWorkshopShieldLvl4]: {
    displayName: 'Shield for a Hero Lvl 4 (Workshop Tech)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.TechnologyWorkshopShieldLvl3,
      NonogramKatanaUpgradeName.TechnologyWorkshopMechanism
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.ShieldForAHeroLvl3,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Catalyst,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 25
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWorkshopMechanism]: {
    displayName: 'Mechanism (Workshop Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingWorkshopLvl5],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 700
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Gears,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWorkshopMechanicalSpider]: {
    displayName: 'Mechanical Spider (Workshop Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyWorkshopMechanism],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWorkshopExplosiveMechanicalSpider]: {
    displayName: 'Explosive Mechanical Spider (Workshop Tech)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.TechnologyWorkshopMechanicalSpider,
      NonogramKatanaUpgradeName.TechnologyAlchemistHutGreekGrenade
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.MechanicalSpider,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.GreekGrenade,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWorkshopSteamobile]: {
    displayName: 'Steamobile (Workshop Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyWorkshopMechanism],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 7
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1500
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWorkshopStrongGlue]: {
    displayName: 'Strong Glue (Workshop Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyWorkshopShieldLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Honey,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWorkshopConveyorLvl1]: {
    displayName: 'Conveyor Lvl 1 (Workshop Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyWorkshopMechanism],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.ElixerOfInsight,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWorkshopConveyorLvl2]: {
    displayName: 'Conveyor Lvl 2 (Workshop Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyWorkshopConveyorLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1500
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.ElixerOfInsight,
        requiredAmount: 75
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyWorkshopThrowingNet]: {
    displayName: 'Throwing Net (Workshop Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingWorkshopLvl5],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Thread,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingRockGardenLvl1]: {
    displayName: 'Rock Garden Lvl 1',
    defaultPriority: -6,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 200
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingRockGardenLvl2]: {
    displayName: 'Rock Garden Lvl 2',
    defaultPriority: -6.1,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingRockGardenLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 150
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 300
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingRockGardenLvl3]: {
    displayName: 'Rock Garden Lvl 3',
    defaultPriority: -10,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingRockGardenLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 400
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyRockGardenRake]: {
    displayName: 'Rake (Rock Garden Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingRockGardenLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 6
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1500
      },
      {
        itemName: NonogramKatanaItemName.MeteoricIron,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingGardenLvl1]: {
    displayName: 'Garden Lvl 1',
    defaultPriority: -7,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 100
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingGardenLvl2]: {
    displayName: 'Garden Lvl 2',
    defaultPriority: -7.1,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingGardenLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 150
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingGardenLvl3]: {
    displayName: 'Garden Lvl 3',
    defaultPriority: -11,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingGardenLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 800
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 200
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyGardenSprinkler]: {
    displayName: 'Sprinkler (Garden Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingGardenLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 6
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1500
      },
      {
        itemName: NonogramKatanaItemName.MeteoricIron,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingLumberMillLvl1]: {
    displayName: 'Lumber Mill Lvl 1',
    defaultPriority: -8,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 150
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 150
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingLumberMillLvl2]: {
    displayName: 'Lumber Mill Lvl 2',
    defaultPriority: -8.1,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingLumberMillLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingLumberMillLvl3]: {
    displayName: 'Lumber Mill Lvl 3',
    defaultPriority: -17,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingLumberMillLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 800
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 100
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingFoodStallLvl1]: {
    displayName: 'Food Stall Lvl 1',
    defaultPriority: -12,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 150
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 150
      },
      {
        itemName: NonogramKatanaItemName.Rice,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingFoodStallLvl2]: {
    displayName: 'Food Stall Lvl 2',
    defaultPriority: -24,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingFoodStallLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Spices,
        requiredAmount: 5
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingFoodStallLvl3]: {
    displayName: 'Food Stall Lvl 3',
    defaultPriority: -24.1,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingFoodStallLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 800
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.CoffeeBeans,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Spices,
        requiredAmount: 3
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyFoodStallQuintessenceOfTaste]: {
    displayName: 'Quintessence of Taste (Food Stall Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingFoodStallLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Honey,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.CoffeeBeans,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Spices,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyFoodStallMayonnaise]: {
    displayName: 'Mayonnaise (Food Stall Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingFoodStallLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Egg,
        requiredAmount: 25
      },
      {
        itemName: NonogramKatanaItemName.OliveOil,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyFoodStallMandraCola]: {
    displayName: 'Mandra Cola (Food Stall Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingFoodStallLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.MandrakeRoot,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.CoffeeBeans,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Honey,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyFoodStallConveryorBeltSushi]: {
    displayName: 'Conveyor Belt Sushi (Food Stall Tech)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingFoodStallLvl3,
      NonogramKatanaUpgradeName.TechnologyWorkshopMechanism
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.ElixerOfInsight,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyFoodStallJam]: {
    displayName: 'Jam (Food Stall Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingFoodStallLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.WoodlandStrawberry,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Grimoire,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingWindmillLvl1]: {
    displayName: 'Windmill Lvl 1',
    defaultPriority: -14,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 150
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 150
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingWindmillLvl2]: {
    displayName: 'Windmill Lvl 2',
    defaultPriority: -22,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingWindmillLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.MeteoricIron,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingFurnaceLvl1]: {
    displayName: 'Furnace Lvl 1',
    defaultPriority: -15,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 100
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingFurnaceLvl2]: {
    displayName: 'Furnace Lvl 2',
    defaultPriority: -15.1,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingFurnaceLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingFurnaceLvl3]: {
    displayName: 'Furnace Lvl 3',
    defaultPriority: -35,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingFurnaceLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 800
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 50
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyFurnaceMeteoricSteel]: {
    displayName: 'Meteoric Steel (Furnace Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingFurnaceLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.MeteoricIron,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyFurnaceConveyor]: {
    displayName: 'Conveyor (Furnace Tech)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingFurnaceLvl3,
      NonogramKatanaUpgradeName.TechnologyWorkshopMechanism
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.ElixerOfInsight,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyFurnaceTitaniumParts]: {
    displayName: 'Titanium Parts (Furnace Tech)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingFurnaceLvl3,
      NonogramKatanaUpgradeName.TechnologyWorkshopMechanism
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Titanium,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingDungeonLvl1]: {
    displayName: 'Dungeon Lvl 1',
    defaultPriority: -16,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Fan,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingDungeonLvl2]: {
    displayName: 'Dungeon Lvl 2',
    defaultPriority: -21,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Petard,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.MushroomRice,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingDungeonLvl3]: {
    displayName: 'Dungeon Lvl 3',
    defaultPriority: -31,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.ThrowingKnife,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Ramen,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingDungeonLvl4]: {
    displayName: 'Dungeon Lvl 4',
    defaultPriority: -43,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1500
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 750
      },
      {
        itemName: NonogramKatanaItemName.OliveOil,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.AriadnesThread,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.PotionOfEnergy,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingDungeonLvl5]: {
    displayName: 'Dungeon Lvl 5',
    defaultPriority: -43.1,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl4],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 7
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 2000
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.MechanicalSpider,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Smoothie,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 25
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingPierLvl1]: {
    displayName: 'Pier Lvl 1',
    defaultPriority: -18,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingWarehouseLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 300
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingShipLvl1]: {
    displayName: 'Ship Lvl 1',
    defaultPriority: -19,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingPierLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 60
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingShipLvl2]: {
    displayName: 'Ship Lvl 2',
    defaultPriority: -19.1,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingShipLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 6
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 750
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 800
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 60
      },
      {
        itemName: NonogramKatanaItemName.Mortar,
        requiredAmount: 1
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingShipLvl3]: {
    displayName: 'Ship Lvl 3',
    defaultPriority: -19.2,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingShipLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 9
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Anchor,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Spices,
        requiredAmount: 1
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingShipLvl4]: {
    displayName: 'Ship Lvl 4',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingShipLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Spices,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Gunpowder,
        requiredAmount: 200
      }
    ]
  },
  [NonogramKatanaUpgradeName.ShipMissionUnlockExploring]: {
    displayName: 'Unlock Exploring (Ship Mission)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingShipLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.CoffeeBeans,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.TreasureMapLvl1,
        requiredAmount: 2
      }
    ]
  },
  [NonogramKatanaUpgradeName.ShipMissionUnlockFishing]: {
    displayName: 'Unlock Fishing (Ship Mission)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingShipLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Arrows,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Pearl,
        requiredAmount: 3
      }
    ]
  },
  [NonogramKatanaUpgradeName.ShipMissionUnlockProspecting]: {
    displayName: 'Unlock Prospecting (Ship Mission)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingShipLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Bomb,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 60
      }
    ]
  },
  [NonogramKatanaUpgradeName.ShipMissionUnlockPatrolling]: {
    displayName: 'Unlock Patrolling (Ship Mission)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingShipLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Katana,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Mortar,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.ShipMissionUnlockTreasureIsland]: {
    displayName: 'Unlock Treasure Island (Ship Mission)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingShipLvl4],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.CryptoCoin,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Honey,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.TreasureMapLvl3,
        requiredAmount: 1
      }
    ]
  },
  [NonogramKatanaUpgradeName.ShipMissionUnlockNewYork]: {
    displayName: 'Unlock New York (Ship Mission)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingShipLvl4,
      NonogramKatanaUpgradeName.CraftifactAstrolabe
    ],
    requiredItems: []
  },
  [NonogramKatanaUpgradeName.CraftifactHoteiStauette]: {
    displayName: 'Hotei Stauette (Craftifact)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingFurnaceLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.GoldIngot,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Charcoal,
        requiredAmount: 200
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactTrigonometry]: {
    displayName: 'Trigonometry (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingGuildLvl5,
      NonogramKatanaUpgradeName.BuildingDungeonLvl1
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 60
      },
      {
        itemName: NonogramKatanaItemName.VeryOldScroll,
        requiredAmount: 1
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactEmeraldTablet]: {
    displayName: 'Emerald Tablet (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingGuildLvl5,
      NonogramKatanaUpgradeName.BuildingDungeonLvl1
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.EmeraldTabletShard,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactHistoricalLibrary]: {
    displayName: 'Historical Library (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingGuildLvl5,
      NonogramKatanaUpgradeName.BuildingDungeonLvl1
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.VeryOldScroll,
        requiredAmount: 12
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.Grimoire,
        requiredAmount: 9
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactNecklaceForHaruka]: {
    displayName: 'Necklace for Haruka (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingWorkshopLvl5,
      NonogramKatanaUpgradeName.BuildingShipLvl1
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Pearl,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Thread,
        requiredAmount: 1
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactGuildCodex]: {
    displayName: 'Guild Codex (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingGuildLvl5,
      NonogramKatanaUpgradeName.BuildingBridgeLvl1
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 100
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactGuildBanner]: {
    displayName: 'Guild Banner (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingTailorLvl2,
      NonogramKatanaUpgradeName.BuildingBridgeLvl1
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 100
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactGuildSupplies]: {
    displayName: 'Guild Supplies (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingFoodStallLvl3,
      NonogramKatanaUpgradeName.BuildingBridgeLvl1
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Tuna,
        requiredAmount: 25
      },
      {
        itemName: NonogramKatanaItemName.Dates,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.OliveOil,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Honey,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 25
      },
      {
        itemName: NonogramKatanaItemName.Rice,
        requiredAmount: 25
      },
      {
        itemName: NonogramKatanaItemName.Flour,
        requiredAmount: 25
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactDagger]: {
    displayName: 'Dagger (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingSmithyLvl3,
      NonogramKatanaUpgradeName.BuildingAirshipLvl1
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.GoldIngot,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.CryptoCoin,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.VeryOldScroll,
        requiredAmount: 1
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactHelmet]: {
    displayName: 'Helmet (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingTailorLvl3,
      NonogramKatanaUpgradeName.BuildingAirshipLvl1
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.CryptoCoin,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.VeryOldScroll,
        requiredAmount: 1
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactSafe]: {
    displayName: 'Safe (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingWorkshopLvl5,
      NonogramKatanaUpgradeName.BuildingAirshipLvl1,
      NonogramKatanaUpgradeName.TechnologyWorkshopMechanism
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactAstrolabe]: {
    displayName: 'Astrolabe (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingShipLvl4,
      NonogramKatanaUpgradeName.BuildingAirshipLvl1,
      NonogramKatanaUpgradeName.TechnologyWorkshopMechanism
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactTetrachloroaurate]: {
    displayName: 'Tetrachloroaurate (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingAlchemistHutLvl6,
      NonogramKatanaUpgradeName.BuildingAirshipLvl1
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.GoldIngot,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Catalyst,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactTelescope]: {
    displayName: 'Telescope (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingWorkshopLvl5,
      NonogramKatanaUpgradeName.BuildingAirshipLvl1,
      NonogramKatanaUpgradeName.TechnologyWorkshopMechanism
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 60
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactCinemaProjector]: {
    displayName: 'Cinema Projector (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingWorkshopLvl5,
      NonogramKatanaUpgradeName.BuildingAirshipLvl1,
      NonogramKatanaUpgradeName.TechnologyWorkshopMechanism
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 80
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Catalyst,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactBarometer]: {
    displayName: 'Barometer (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingWorkshopLvl5,
      NonogramKatanaUpgradeName.TechnologyAlchemistHutMercury
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Mercury,
        requiredAmount: 25
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactHatOfConcentration]: {
    displayName: 'Hat of Concentration (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingTailorLvl3,
      NonogramKatanaUpgradeName.TechnologyTailorSalamanderVelour,
      NonogramKatanaUpgradeName.TechnologyAlchemistHutMercury
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.SalamanderVeloure,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Mercury,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.DragonTeeth,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Herbs,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.GingkoBiloba,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Grimoire,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactFlameThrower]: {
    displayName: 'Flame Thrower (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingAlchemistHutLvl6,
      NonogramKatanaUpgradeName.TechnologyWorkshopMechanism,
      NonogramKatanaUpgradeName.TechnologyFurnaceTitaniumParts
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.TitaniumParts,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.OliveOil,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Arsenopyrite,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Catalyst,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactMetalDetector]: {
    displayName: 'Metal Detector (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingDungeonLvl5,
      NonogramKatanaUpgradeName.TechnologyFurnaceTitaniumParts,
      NonogramKatanaUpgradeName.TechnologyAlchemistHutMercury
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.MeteoricIron,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.TitaniumParts,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Arsenopyrite,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Mercury,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Catalyst,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.CraftifactSolver1Prototype]: {
    displayName: 'Solver 1 Prototype (Craftifact)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingWorkshopLvl5,
      NonogramKatanaUpgradeName.TechnologyFurnaceTitaniumParts,
      NonogramKatanaUpgradeName.TechnologyWorkshopMechanism
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.TitaniumParts,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 16
      },
      {
        itemName: NonogramKatanaItemName.GoldIngot,
        requiredAmount: 16
      },
      {
        itemName: NonogramKatanaItemName.MALU,
        requiredAmount: 8
      },
      {
        itemName: NonogramKatanaItemName.PunchedCard,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 32
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingChickenCoopLvl1]: {
    displayName: 'Chicken Coop Lvl 1',
    defaultPriority: -23,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Wheat,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Thread,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Egg,
        requiredAmount: 1
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingChickenCoopLvl2]: {
    displayName: 'Chicken Coop Lvl 2',
    defaultPriority: -44,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingChickenCoopLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Wheat,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Thread,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Egg,
        requiredAmount: 1
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingBridgeLvl1]: {
    displayName: 'Bridge Lvl 1',
    defaultPriority: -25,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 100
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyBridgeKoiFish]: {
    displayName: 'Koi Fish (Bridge Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingBridgeLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.GoldIngot,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Salmon,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Tuna,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Wheat,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingOutpostLvl1]: {
    displayName: 'Outpost Lvl 1',
    defaultPriority: -26,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingBridgeLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 6
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Katana,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Arrows,
        requiredAmount: 300
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingOutpostLvl2]: {
    displayName: 'Outpost Lvl 2',
    defaultPriority: -28,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingOutpostLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 8
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1500
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 1500
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 3000
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Mortar,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingOutpostLvl3]: {
    displayName: 'Outpost Lvl 3',
    defaultPriority: -39,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingOutpostLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 2000
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 2000
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 5000
      },
      {
        itemName: NonogramKatanaItemName.OliveOil,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.SamaruiArmor,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyOutpostSayonaraTax]: {
    displayName: 'Sayonara Tax (Outpost Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingOutpostLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyOutpostArsenalLvl1]: {
    displayName: 'Arsenal Lvl 1 (Outpost Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingOutpostLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyOutpostArsenalLvl2]: {
    displayName: 'Arsenal Lvl 2 (Outpost Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyOutpostArsenalLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1500
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 60
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyOutpostOptionalContracts]: {
    displayName: 'Optional Contracts (Outpost Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingOutpostLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.OliveOil,
        requiredAmount: 25
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyOutpostFuturesContracts]: {
    displayName: 'Futures Contracts (Outpost Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyOutpostOptionalContracts],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Rice,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Tuna,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingCaravanLvl1]: {
    displayName: 'Caravan Lvl 1',
    defaultPriority: -29,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingBridgeLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.CoffeeBeans,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Sushi,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingCaravanLvl2]: {
    displayName: 'Caravan Lvl 2',
    defaultPriority: -29.1,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingCaravanLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 7
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1200
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.GoldIngot,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Fan,
        requiredAmount: 50
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingCaravanLvl3]: {
    displayName: 'Caravan Lvl 3',
    defaultPriority: -29.2,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingCaravanLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 9
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1500
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 800
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Pearl,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingCaravanLvl4]: {
    displayName: 'Caravan Lvl 4',
    defaultPriority: -37,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingCaravanLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 12
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 2000
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Spices,
        requiredAmount: 5
      }
    ]
  },
  [NonogramKatanaUpgradeName.CaravanCityXian]: {
    displayName: 'Unlock Xian (Caravan City)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingCaravanLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 3
      }
    ]
  },
  [NonogramKatanaUpgradeName.CaravanCityDelhi]: {
    displayName: 'Unlock Delhi (Caravan City)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingCaravanLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.OliveOil,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Honey,
        requiredAmount: 1
      }
    ]
  },
  [NonogramKatanaUpgradeName.CaravanCityBaghdad]: {
    displayName: 'Unlock Baghdad (Caravan City)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingCaravanLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 120
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 4
      }
    ]
  },
  [NonogramKatanaUpgradeName.CaravanCityCairo]: {
    displayName: 'Unlock Cairo (Caravan City)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingCaravanLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 140
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 5
      }
    ]
  },
  [NonogramKatanaUpgradeName.CaravanCityAthens]: {
    displayName: 'Unlock Athens (Caravan City)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingCaravanLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 160
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 6
      }
    ]
  },
  [NonogramKatanaUpgradeName.CaravanCityRome]: {
    displayName: 'Unlock Rome (Caravan City)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingCaravanLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 180
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 7
      }
    ]
  },
  [NonogramKatanaUpgradeName.CaravanCityKyiv]: {
    displayName: 'Unlock Kyiv (Caravan City)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingCaravanLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 8
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingSmithyLvl1]: {
    displayName: 'Smithy Lvl 1',
    defaultPriority: -30,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 240
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 120
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 120
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingSmithyLvl2]: {
    displayName: 'Smithy Lvl 2',
    defaultPriority: -30.1,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingSmithyLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 280
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 140
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 140
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingSmithyLvl3]: {
    displayName: 'Smithy Lvl 3',
    defaultPriority: -30.2,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingSmithyLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 60
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologySmithyThrowingKnife]: {
    displayName: 'Throwing Knife (Smithy Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingSmithyLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.MeteoricIron,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologySmithySwordLvl1]: {
    displayName: 'Sword for a Hero Lvl 1 (Smithy Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingSmithyLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Charcoal,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 58
      },
      {
        itemName: NonogramKatanaItemName.MeteoricIron,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologySmithySwordLvl2]: {
    displayName: 'Sword for a Hero Lvl 2 (Smithy Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologySmithySwordLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Charcoal,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 40
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologySmithySwordLvl3]: {
    displayName: 'Sword for a Hero Lvl 3 (Smithy Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologySmithySwordLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Charcoal,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 60
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologySmithySwordLvl4]: {
    displayName: 'Sword for a Hero Lvl 4 (Smithy Tech)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.TechnologySmithySwordLvl3,
      NonogramKatanaUpgradeName.TechnologyWorkshopMechanism
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.SwordForAHeroLvl3,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Gears,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologySmithyGears]: {
    displayName: 'Gears (Smithy Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingSmithyLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.MeteoricIron,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Gears,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologySmithyWeaponGrease]: {
    displayName: 'Weapon Grease (Smithy Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologySmithySwordLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.OliveOil,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingAirshipLvl1]: {
    displayName: 'Airship Lvl 1',
    defaultPriority: -32,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingBridgeLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 2000
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 120
      },
      {
        itemName: NonogramKatanaItemName.Thread,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.MeteoricIron,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingAirshipLvl2]: {
    displayName: 'Airship Lvl 2',
    defaultPriority: -41,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAirshipLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 12
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 3000
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 60
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Gears,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Fan,
        requiredAmount: 50
      }
    ]
  },
  [NonogramKatanaUpgradeName.AirshipCityLondon]: {
    displayName: 'Unlock London (Airship City)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAirshipLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 150
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.AirshipCityReykjavik]: {
    displayName: 'Unlock Reykjavik (Airship City)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAirshipLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 12
      }
    ]
  },
  [NonogramKatanaUpgradeName.AirshipCityMexicoCity]: {
    displayName: 'Unlock Mexico City (Airship City)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAirshipLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.CryptoCoin,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 14
      }
    ]
  },
  [NonogramKatanaUpgradeName.AirshipCityNewYork]: {
    displayName: 'Unlock New York (Airship City)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAirshipLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 250
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 16
      }
    ]
  },
  [NonogramKatanaUpgradeName.AirshipCityMelbourne]: {
    displayName: 'Unlock Melbourne (Airship City)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAirshipLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 18
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyAirshipTitaniumLongerons]: {
    displayName: 'Titanium Longerons (Airship Tech)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingAirshipLvl2,
      NonogramKatanaUpgradeName.TechnologyFurnaceTitaniumParts
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.TitaniumParts,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Arsenopyrite,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingCoffeeBonsaiLvl1]: {
    displayName: 'Coffee Bonsai Lvl 1',
    defaultPriority: -33,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.CoffeeBeans,
        requiredAmount: 120
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingCoffeeBonsaiLvl2]: {
    displayName: 'Coffee Bonsai Lvl 2',
    defaultPriority: -33.1,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingCoffeeBonsaiLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 800
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.CoffeeBeans,
        requiredAmount: 240
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 150
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingOnsenLvl1]: {
    displayName: 'Onsen Lvl 1',
    defaultPriority: -34,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 400
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingOnsenLvl2]: {
    displayName: 'Onsen Lvl 2',
    defaultPriority: -34.1,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingOnsenLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 800
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 500
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingTailorLvl1]: {
    displayName: 'Tailor Lvl 1',
    defaultPriority: -36,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingBridgeLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingTailorLvl2]: {
    displayName: 'Tailor Lvl 2',
    defaultPriority: -36.1,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingTailorLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 6
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 800
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 800
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Glass,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingTailorLvl3]: {
    displayName: 'Tailor Lvl 3',
    defaultPriority: -38,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingTailorLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 8
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.WoodenPlank,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyTailorArmorLvl1]: {
    displayName: 'Armor for a Hero Lvl 1 (Tailor Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingTailorLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Thread,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.MeteoricIron,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyTailorArmorLvl2]: {
    displayName: 'Armor for a Hero Lvl 2 (Tailor Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyTailorArmorLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Thread,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyTailorArmorLvl3]: {
    displayName: 'Armor for a Hero Lvl 3 (Tailor Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyTailorArmorLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 7
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1500
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Thread,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.MeteoricSteel,
        requiredAmount: 75
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyTailorArmorLvl4]: {
    displayName: 'Armor for a Hero Lvl 4 (Tailor Tech)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.TechnologyTailorArmorLvl3,
      NonogramKatanaUpgradeName.TechnologyWorkshopMechanism,
      NonogramKatanaUpgradeName.TechnologyFurnaceTitaniumParts,
      NonogramKatanaUpgradeName.TechnologyTailorSalamanderVelour
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.SalamanderVeloure,
        requiredAmount: 6
      },
      {
        itemName: NonogramKatanaItemName.TitaniumParts,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Mechanism,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Grimoire,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyTailorStrongStitch]: {
    displayName: 'Strong Stitch (Tailor Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingTailorLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Thread,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyTailorStrongRivets]: {
    displayName: 'Strong Rivets (Tailor Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.TechnologyTailorArmorLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Thread,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.MeteoricIron,
        requiredAmount: 30
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyTailorAriadnesThread]: {
    displayName: `Ariadne's Thread (Tailor Tech)`,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingTailorLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Thread,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.ElixerOfInsight,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.RingForAHeroLvl1,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyTailorBedroll]: {
    displayName: 'Bedroll (Tailor Tech)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingTailorLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.Thread,
        requiredAmount: 20
      },
      {
        itemName: NonogramKatanaItemName.Reagent,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Blueprint,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.TechnologyTailorSalamanderVelour]: {
    displayName: 'Salamander Velour (Tailor Tech)',
    requiredUpgrades: [
      NonogramKatanaUpgradeName.BuildingTailorLvl3,
      NonogramKatanaUpgradeName.TechnologyAlchemistHutMercury
    ],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.SalamanderHide,
        requiredAmount: 6
      },
      {
        itemName: NonogramKatanaItemName.Mercury,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.GingkoBiloba,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Grimoire,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingPagodaLvl1]: {
    displayName: 'Pagoda Lvl 1',
    defaultPriority: -42,
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 50
      },
      {
        itemName: NonogramKatanaItemName.Petard,
        requiredAmount: 5
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingPagodaLvl2]: {
    displayName: 'Pagoda Lvl 2',
    defaultPriority: -42.1,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingPagodaLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Wood,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.Chemicals,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingPagodaLvl3]: {
    displayName: 'Pagoda Lvl 3',
    defaultPriority: -42.2,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingPagodaLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 600
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.Steel,
        requiredAmount: 50
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingPagodaLvl4]: {
    displayName: 'Pagoda Lvl 4',
    defaultPriority: -42.3,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingPagodaLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 6
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 350
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 700
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 350
      },
      {
        itemName: NonogramKatanaItemName.Fan,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingPagodaLvl5]: {
    displayName: 'Pagoda Lvl 5',
    defaultPriority: -42.4,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingPagodaLvl4],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 8
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 800
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.Katana,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingPagodaLvl6]: {
    displayName: 'Pagoda Lvl 6',
    defaultPriority: -42.5,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingPagodaLvl5],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 10
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 450
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 900
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 450
      },
      {
        itemName: NonogramKatanaItemName.GoldIngot,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Spices,
        requiredAmount: 5
      }
    ]
  },
  [NonogramKatanaUpgradeName.BuildingPagodaLvl7]: {
    displayName: 'Pagoda Lvl 7',
    defaultPriority: -42.6,
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingPagodaLvl6],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 15
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.WoodenBeam,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Stone,
        requiredAmount: 500
      },
      {
        itemName: NonogramKatanaItemName.Treasure,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Pearl,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.VeryOldScroll,
        requiredAmount: 1
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillLogisticianLvl1]: {
    displayName: 'Logistician Lvl 1 (Character Skill)',
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillLogisticianLvl2]: {
    displayName: 'Logistician Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillLogisticianLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillLogisticianLvl3]: {
    displayName: 'Logistician Lvl 3 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillLogisticianLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 600
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillLogisticianLvl4]: {
    displayName: 'Logistician Lvl 4 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillLogisticianLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 800
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillLogisticianLvl5]: {
    displayName: 'Logistician Lvl 5 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillLogisticianLvl4],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillWeaponCollectorLvl1]: {
    displayName: 'Weapon Collector Lvl 1 (Character Skill)',
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillWeaponCollectorLvl2]: {
    displayName: 'Weapon Collector Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillWeaponCollectorLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillWeaponCollectorLvl3]: {
    displayName: 'Weapon Collector Lvl 3 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillWeaponCollectorLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 600
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillTreasureHunterLvl1]: {
    displayName: 'Treasure Hunter Lvl 1 (Character Skill)',
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillTreasureHunterLvl2]: {
    displayName: 'Treasure Hunter Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillTreasureHunterLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 600
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillTreasureHunterLvl3]: {
    displayName: 'Treasure Hunter Lvl 3 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillTreasureHunterLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 800
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillAthleteLvl1]: {
    displayName: 'Athlete Lvl 1 (Character Skill)',
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 1
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillAthleteLvl2]: {
    displayName: 'Athlete Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillAthleteLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillAthleteLvl3]: {
    displayName: 'Athlete Lvl 3 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillAthleteLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 600
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillAthleteLvl4]: {
    displayName: 'Athlete Lvl 4 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillAthleteLvl3],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 800
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillAthleteLvl5]: {
    displayName: 'Athlete Lvl 5 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillAthleteLvl4],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillAthleteLvl6]: {
    displayName: 'Athlete Lvl 6 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillAthleteLvl5],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 6
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 2400
      },
      {
        itemName: NonogramKatanaItemName.Honey,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillAntiquarianLvl1]: {
    displayName: 'Antiquarian Lvl 1 (Character Skill)',
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillAntiquarianLvl2]: {
    displayName: 'Antiquarian Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillAntiquarianLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 600
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillIntellectualLvl1]: {
    displayName: 'Intellectual Lvl 1 (Character Skill)',
    requiredUpgrades: [],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillIntellectualLvl2]: {
    displayName: 'Intellectual Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillIntellectualLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 800
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillIntellectualLvl3]: {
    displayName: 'Intellectual Lvl 3 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillIntellectualLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 2400
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillGardenerLvl1]: {
    displayName: 'Gardener Lvl 1 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingGardenLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 700
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillGardenerLvl2]: {
    displayName: 'Gardener Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillGardenerLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillRockGardenContemplatorLvl1]: {
    displayName: 'Rock Garden Contemplator Lvl 1 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingRockGardenLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 700
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillRockGardenContemplatorLvl2]: {
    displayName: 'Rock Garden Contemplator Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillRockGardenContemplatorLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillCarpenterLvl1]: {
    displayName: 'Carpenter Lvl 1 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingLumberMillLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 800
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillCarpenterLvl2]: {
    displayName: 'Carpenter Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillCarpenterLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1100
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillCarpenterLvl3]: {
    displayName: 'Carpenter Lvl 3 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillCarpenterLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1400
      },
      {
        itemName: NonogramKatanaItemName.CupOfCoffee,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillMetallurgistLvl1]: {
    displayName: 'Metallurgist Lvl 1 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingFurnaceLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 800
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillMetallurgistLvl2]: {
    displayName: 'Metallurgist Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillMetallurgistLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1100
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillMetallurgistLvl3]: {
    displayName: 'Metallurgist Lvl 3 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillMetallurgistLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1400
      },
      {
        itemName: NonogramKatanaItemName.CupOfCoffee,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillMechanicLvl1]: {
    displayName: 'Mechanic Lvl 1 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingWorkshopLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 900
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillMechanicLvl2]: {
    displayName: 'Mechanic Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillMechanicLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1200
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillMechanicLvl3]: {
    displayName: 'Mechanic Lvl 3 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillMechanicLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1500
      },
      {
        itemName: NonogramKatanaItemName.CupOfCoffee,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillBlacksmithLvl1]: {
    displayName: 'Blacksmith Lvl 1 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingSmithyLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 900
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillBlacksmithLvl2]: {
    displayName: 'Blacksmith Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillBlacksmithLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1200
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillBlacksmithLvl3]: {
    displayName: 'Blacksmith Lvl 3 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillBlacksmithLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1500
      },
      {
        itemName: NonogramKatanaItemName.CupOfCoffee,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillAlchemistLvl1]: {
    displayName: 'Alchemist Lvl 1 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAlchemistHutLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 2
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 900
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillAlchemistLvl2]: {
    displayName: 'Alchemist Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillAlchemistLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1200
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillAlchemistLvl3]: {
    displayName: 'Alchemist Lvl 3 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillAlchemistLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1500
      },
      {
        itemName: NonogramKatanaItemName.CupOfCoffee,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillBoatswainLvl1]: {
    displayName: 'Boatswain Lvl 1 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingShipLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 3
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1000
      },
      {
        itemName: NonogramKatanaItemName.Salmon,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillBoatswainLvl2]: {
    displayName: 'Boatswain Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillBoatswainLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 1500
      },
      {
        itemName: NonogramKatanaItemName.Tuna,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillCameleerLvl1]: {
    displayName: 'Cameleer Lvl 1 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingCaravanLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 2000
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillCameleerLvl2]: {
    displayName: 'Cameleer Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillCameleerLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 2400
      },
      {
        itemName: NonogramKatanaItemName.Silk,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillAeronautLvl1]: {
    displayName: 'Aeronaut Lvl 1 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingAirshipLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 4
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 2000
      },
      {
        itemName: NonogramKatanaItemName.Paper,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.CharacterSkillAeronautLvl2]: {
    displayName: 'Aeronaut Lvl 2 (Character Skill)',
    requiredUpgrades: [NonogramKatanaUpgradeName.CharacterSkillAeronautLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Ruby,
        requiredAmount: 5
      },
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 2400
      },
      {
        itemName: NonogramKatanaItemName.Gears,
        requiredAmount: 40
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilitySmashingBlowLvl1]: {
    displayName: 'Smashing Blow Lvl 1 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilitySmashingBlowLvl2]: {
    displayName: 'Smashing Blow Lvl 2 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.DungeonAbilitySmashingBlowLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityRoundKickLvl1]: {
    displayName: 'Round Kick Lvl 1 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityRoundKickLvl2]: {
    displayName: 'Round Kick Lvl 2 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.DungeonAbilityRoundKickLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityRoundKickLvl3]: {
    displayName: 'Round Kick Lvl 3 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.DungeonAbilityRoundKickLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityThrowingLvl1]: {
    displayName: 'Throwing Lvl 1 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityThrowingLvl2]: {
    displayName: 'Throwing Lvl 2 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.DungeonAbilityThrowingLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityThrowingLvl3]: {
    displayName: 'Throwing Lvl 3 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.DungeonAbilityThrowingLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityTrapsLvl1]: {
    displayName: 'Traps Lvl 1 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityTrapsLvl2]: {
    displayName: 'Traps Lvl 2 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.DungeonAbilityTrapsLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityDoctor]: {
    displayName: 'Doctor (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityDemoralization]: {
    displayName: 'Demoralization (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityTrainedEye]: {
    displayName: 'Trained Eye (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilitySprinter]: {
    displayName: 'Sprinter (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 100
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 10
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityTacticalGaze]: {
    displayName: 'Tactical Gaze (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityMartialArtsLvl1]: {
    displayName: 'Martial Arts Lvl 1 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityMartialArtsLvl2]: {
    displayName: 'Martial Arts Lvl 2 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.DungeonAbilityMartialArtsLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityMartialArtsLvl3]: {
    displayName: 'Martial Arts Lvl 3 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.DungeonAbilityMartialArtsLvl2],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 400
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 30
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityHardeningLvl1]: {
    displayName: 'Hardening Lvl 1 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityHardeningLvl2]: {
    displayName: 'Hardening Lvl 2 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.DungeonAbilityHardeningLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityEquipmentPreparationLvl1]: {
    displayName: 'Equipment Preparation Lvl 1 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityEquipmentPreparationLvl2]: {
    displayName: 'Equipment Preparation Lvl 2 (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.DungeonAbilityEquipmentPreparationLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 20
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityTrapsIndifference]: {
    displayName: 'Traps Indifference (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 200
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 15
      }
    ]
  },
  [NonogramKatanaUpgradeName.DungeonAbilityTrapsAgility]: {
    displayName: 'Traps Agility (Dungeon Ability)',
    requiredUpgrades: [NonogramKatanaUpgradeName.BuildingDungeonLvl1],
    requiredItems: [
      {
        itemName: NonogramKatanaItemName.Coin,
        requiredAmount: 300
      },
      {
        itemName: NonogramKatanaItemName.AncientPage,
        requiredAmount: 20
      }
    ]
  }
};
