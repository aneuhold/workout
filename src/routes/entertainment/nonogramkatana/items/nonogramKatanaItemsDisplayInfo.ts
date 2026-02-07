import { NonogramKatanaItemName } from '@aneuhold/core-ts-db-lib';
import type { Component } from 'svelte';

type NonogramKatanaItemDisplayInfo = {
  displayName: string;
  icon?: Component;
  /**
   * The things that this item is used for, besides upgrades.
   */
  usedFor?: string[];
  /**
   * The places or actions that this item can be collected from.
   */
  collectedFrom?: string[];
  defaultPriority?: number;
};

/**
 * The display info for each item in the game.
 */
export const nonogramKatanaItemsDisplayInfo: {
  [key in NonogramKatanaItemName]: NonogramKatanaItemDisplayInfo;
} = {
  [NonogramKatanaItemName.Coin]: {
    displayName: 'Coin',
    defaultPriority: -1,
    usedFor: [
      'Crafting Treasure Maps (2 for lvl 1, 4 for lvl 2, 8 for lvl 3)',
      'Starting Treasure Map Lvl 1 (20 Coin)',
      'Starting Treasure Map Lvl 2 (60 Coin)',
      'Starting Treasure Map Lvl 3 (100 Coin)'
    ]
  },
  [NonogramKatanaItemName.CryptoCoin]: {
    displayName: 'Crypto-coin'
  },
  [NonogramKatanaItemName.Ruby]: {
    displayName: 'Ruby',
    defaultPriority: -2
  },
  [NonogramKatanaItemName.Fan]: {
    displayName: 'Fan'
  },
  [NonogramKatanaItemName.Arrows]: {
    displayName: 'Arrows'
  },
  [NonogramKatanaItemName.Katana]: {
    displayName: 'Katana'
  },
  [NonogramKatanaItemName.Shuriken]: {
    displayName: 'Shuriken'
  },
  [NonogramKatanaItemName.Spikes]: {
    displayName: 'Spikes'
  },
  [NonogramKatanaItemName.Boomerang]: {
    displayName: 'Boomerang'
  },
  [NonogramKatanaItemName.Petard]: {
    displayName: 'Petard'
  },
  [NonogramKatanaItemName.Bomb]: {
    displayName: 'Bomb'
  },
  [NonogramKatanaItemName.Firework]: {
    displayName: 'Firework'
  },
  [NonogramKatanaItemName.BatteringRam]: {
    displayName: 'Battering Ram'
  },
  [NonogramKatanaItemName.ThrowingKnife]: {
    displayName: 'Throwing Knife'
  },
  [NonogramKatanaItemName.Anchor]: {
    displayName: 'Anchor'
  },
  [NonogramKatanaItemName.Mortar]: {
    displayName: 'Mortar'
  },
  [NonogramKatanaItemName.Wood]: {
    displayName: 'Wood',
    usedFor: [
      'Crafting Wooden Beam (5 Wood -> 10 Wooden Beam)',
      'Crafting Wooden Plank (5 Wood -> 10 Wooden Plank)',
      'Starting Treasure Map Lvl 1 (8 Wood)',
      'Starting Treasure Map Lvl 2 (20 Wood)'
    ],
    defaultPriority: -3
  },
  [NonogramKatanaItemName.WoodenBeam]: {
    displayName: 'Wooden Beam',
    usedFor: ['Starting Treasure Map Lvl 3 (60 Wooden Beam)'],
    defaultPriority: -4
  },
  [NonogramKatanaItemName.WoodenPlank]: {
    displayName: 'Wooden Plank',
    defaultPriority: -5
  },
  [NonogramKatanaItemName.Stone]: {
    displayName: 'Stone',
    defaultPriority: -6
  },
  [NonogramKatanaItemName.Steel]: {
    displayName: 'Steel',
    usedFor: ['Starting Treasure Map Lvl 2 (20 Steel)'],
    defaultPriority: -7
  },
  [NonogramKatanaItemName.MeteoricIron]: {
    displayName: 'Meteoric Iron'
  },
  [NonogramKatanaItemName.MeteoricSteel]: {
    displayName: 'Meteoric Steel'
  },
  [NonogramKatanaItemName.Charcoal]: {
    displayName: 'Charcoal'
  },
  [NonogramKatanaItemName.Gunpowder]: {
    displayName: 'Gunpowder',
    usedFor: ['Starting Treasure Map Lvl 3 (30 Gunpowder)']
  },
  [NonogramKatanaItemName.IronSand]: {
    displayName: 'Iron Sand',
    usedFor: ['Crafting Steel at Furnace', 'Bourse (15 Iron Sand -> 5 Steel)'],
    collectedFrom: [
      'Solving Nonograms',
      'Buying it in the shop (2 Coin -> 1 Iron Sand)',
      'Bourse (3 Coffee Beans -> 5 Iron Sand)',
      'Completing "Prospecting" Ship Missions'
    ]
  },
  [NonogramKatanaItemName.Chemicals]: {
    displayName: 'Chemicals'
  },
  [NonogramKatanaItemName.Thread]: {
    displayName: 'Thread'
  },
  [NonogramKatanaItemName.Pearl]: {
    displayName: 'Pearl'
  },
  [NonogramKatanaItemName.Rice]: {
    displayName: 'Rice'
  },
  [NonogramKatanaItemName.Wheat]: {
    displayName: 'Wheat'
  },
  [NonogramKatanaItemName.Flour]: {
    displayName: 'Flour'
  },
  [NonogramKatanaItemName.Egg]: {
    displayName: 'Egg'
  },
  [NonogramKatanaItemName.CoffeeBeans]: {
    displayName: 'Coffee Beans',
    defaultPriority: -8
  },
  [NonogramKatanaItemName.CupOfCoffee]: {
    displayName: 'Cup of Coffee'
  },
  [NonogramKatanaItemName.Spices]: {
    displayName: 'Spices',
    usedFor: [
      'Crafting Ramen (Food Stall, 1 Spices)',
      'Crafting Curry (Food Stall, 4 Spices)',
      'Crafting Berserker Rage Potion (Alchemist Hut, 1 Spices)'
    ],
    collectedFrom: ['Completing Ship Missions (Random chance for 1 Spices)', 'Caravan Missions']
  },
  [NonogramKatanaItemName.Salmon]: {
    displayName: 'Salmon'
  },
  [NonogramKatanaItemName.Tuna]: {
    displayName: 'Tuna'
  },
  [NonogramKatanaItemName.Sushi]: {
    displayName: 'Sushi'
  },
  [NonogramKatanaItemName.FriedEggs]: {
    displayName: 'Fried Eggs'
  },
  [NonogramKatanaItemName.Blueprint]: {
    displayName: 'Blueprint'
  },
  [NonogramKatanaItemName.Paper]: {
    displayName: 'Paper'
  },
  [NonogramKatanaItemName.Glass]: {
    displayName: 'Glass'
  },
  [NonogramKatanaItemName.OliveOil]: {
    displayName: 'Olive Oil'
  },
  [NonogramKatanaItemName.AncientPage]: {
    displayName: 'Ancient Page'
  },
  [NonogramKatanaItemName.Reagent]: {
    displayName: 'Reagent'
  },
  [NonogramKatanaItemName.MandrakeRoot]: {
    displayName: 'Mandrake Root'
  },
  [NonogramKatanaItemName.PotionOfHealing]: {
    displayName: 'Potion of Healing'
  },
  [NonogramKatanaItemName.PotionOfHealingLvl2]: {
    displayName: 'Potion of Healing Lvl 2'
  },
  [NonogramKatanaItemName.PotionOfEnergy]: {
    displayName: 'Potion of Energy'
  },
  [NonogramKatanaItemName.ElixerOfInsight]: {
    displayName: 'Elixer of Insight'
  },
  [NonogramKatanaItemName.Treasure]: {
    displayName: 'Treasure'
  },
  [NonogramKatanaItemName.Catalyst]: {
    displayName: 'Catalyst'
  },
  [NonogramKatanaItemName.Mechanism]: {
    displayName: 'Mechanism'
  },
  [NonogramKatanaItemName.GoldIngot]: {
    displayName: 'Gold Ingot'
  },
  [NonogramKatanaItemName.Herbs]: {
    displayName: 'Herbs'
  },
  [NonogramKatanaItemName.Cinnabar]: {
    displayName: 'Cinnabar'
  },
  [NonogramKatanaItemName.Grimoire]: {
    displayName: 'Grimoire'
  },
  [NonogramKatanaItemName.GingkoBiloba]: {
    displayName: 'Gingko Biloba'
  },
  [NonogramKatanaItemName.Arsenopyrite]: {
    displayName: 'Arsenopyrite'
  },
  [NonogramKatanaItemName.Mercury]: {
    displayName: 'Mercury'
  },
  [NonogramKatanaItemName.Gears]: {
    displayName: 'Gears'
  },
  [NonogramKatanaItemName.ShieldForAHeroLvl1]: {
    displayName: 'Shield for a Hero Lvl 1'
  },
  [NonogramKatanaItemName.ShieldForAHeroLvl2]: {
    displayName: 'Shield for a Hero Lvl 2'
  },
  [NonogramKatanaItemName.ShieldForAHeroLvl3]: {
    displayName: 'Shield for a Hero Lvl 3'
  },
  [NonogramKatanaItemName.SwordForAHeroLvl1]: {
    displayName: 'Sword for a Hero Lvl 1'
  },
  [NonogramKatanaItemName.SwordForAHeroLvl2]: {
    displayName: 'Sword for a Hero Lvl 2'
  },
  [NonogramKatanaItemName.SwordForAHeroLvl3]: {
    displayName: 'Sword for a Hero Lvl 3'
  },
  [NonogramKatanaItemName.RingForAHeroLvl1]: {
    displayName: 'Ring for a Hero Lvl 1'
  },
  [NonogramKatanaItemName.GreekGrenade]: {
    displayName: 'Greek Grenade'
  },
  [NonogramKatanaItemName.MechanicalSpider]: {
    displayName: 'Mechanical Spider'
  },
  [NonogramKatanaItemName.Honey]: {
    displayName: 'Honey'
  },
  [NonogramKatanaItemName.WoodlandStrawberry]: {
    displayName: 'Woodland Strawberry'
  },
  [NonogramKatanaItemName.Titanium]: {
    displayName: 'Titanium'
  },
  [NonogramKatanaItemName.TitaniumParts]: {
    displayName: 'Titanium Parts'
  },
  [NonogramKatanaItemName.MushroomRice]: {
    displayName: 'Mushroom Rice'
  },
  [NonogramKatanaItemName.Ramen]: {
    displayName: 'Ramen'
  },
  [NonogramKatanaItemName.AriadnesThread]: {
    displayName: `Ariadne's Thread`
  },
  [NonogramKatanaItemName.Smoothie]: {
    displayName: 'Smoothie'
  },
  [NonogramKatanaItemName.EmeraldTabletShard]: {
    displayName: 'Emerald Tablet Shard'
  },
  [NonogramKatanaItemName.VeryOldScroll]: {
    displayName: 'Very Old Scroll'
  },
  [NonogramKatanaItemName.Dates]: {
    displayName: 'Dates'
  },
  [NonogramKatanaItemName.Silk]: {
    displayName: 'Silk'
  },
  [NonogramKatanaItemName.SalamanderHide]: {
    displayName: 'Salamander Hide'
  },
  [NonogramKatanaItemName.SalamanderVeloure]: {
    displayName: 'Salamander Veloure'
  },
  [NonogramKatanaItemName.DragonTeeth]: {
    displayName: 'Dragon Teeth'
  },
  [NonogramKatanaItemName.MALU]: {
    displayName: 'Mechanical Arithmetic Logic Unit',
    collectedFrom: ['Exploring the Dungeon']
  },
  [NonogramKatanaItemName.PunchedCard]: {
    displayName: 'Punched Card'
  },
  [NonogramKatanaItemName.Steamobile]: {
    displayName: 'Steamobile'
  },
  [NonogramKatanaItemName.TreasureMapLvl1]: {
    displayName: 'Treasure Map Lvl 1'
  },
  [NonogramKatanaItemName.TreasureMapLvl2]: {
    displayName: 'Treasure Map Lvl 2'
  },
  [NonogramKatanaItemName.TreasureMapLvl3]: {
    displayName: 'Treasure Map Lvl 3'
  },
  [NonogramKatanaItemName.SamaruiArmor]: {
    displayName: 'Samarui Armor'
  }
};
