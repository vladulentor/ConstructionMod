export function tinyIconsCompatibility(ctx) {
    const icons = mod.api.tinyIcons;
    icons.addTagSourceMap(new Map([
        ['efficiency', ctx.getResourceUrl('assets/efficiency.webp')],
        ['cabin', ctx.getResourceUrl('assets/cabin.webp')],
        ['plot', game.items.getObjectByID('melvorD:Bobs_Rake').media],
        ['overheal', ctx.getResourceUrl('assets/tinyicons/tinyheart.png')],
        ['cookEquipment', game.items.getObjectByID('melvorF:Chefs_Hat').media],

        ['cookSkillcape', game.items.getObjectByID('melvorD:Cooking_Skillcape').media],
        ['cookConsumables', game.items.getObjectByID('melvorF:Additional_Cooker_Scroll').media],
        ['specialItems', game.items.getObjectByID('melvorD:Treasure_Chest').media],
    ]
    ));
    const constrSubcategories = new Map([
    ['rielkConstruction:Planks', { name: 'planks', media: game.items.getObjectByID('rielkConstruction:Oak_Planks').media }],
        ['rielkConstruction:Nails', { name: 'nails', media:game.items.getObjectByID('rielkConstruction:Iron_Nails').media }],
    ['rielkConstruction:Bricks', { name: 'bricks', media: game.items.getObjectByID('rielkConstruction:Limestone_Bricks').media }],
    ['rielkConstruction:Straps', { name: 'straps', media: game.items.getObjectByID('rielkConstruction:Red_Dhide_Leather_Straps').media }],
]);
    icons.addSubcategoryScopeMedia("rielkConstruction:Construction", constrSubcategories);
icons.addModifier('rielkConstruction:spoofAddWoodcuttingMasteryStuff1', 'woodcutting', 'xp');
    icons.addModifier('rielkConstruction:spoofAddWoodcuttingMasteryStuff2', 'woodcutting', 'interval');


    icons.addModifier('rielkConstruction:skillEfficiencyChance', 'efficiency');
    icons.addModifier('rielkConstruction:skillEfficiencyPotency', 'efficiency');
    icons.addModifier('rielkConstruction:skillEfficiencyCost', 'efficiency');

    icons.addModifier('rielkConstruction:constructionActionsToUpgrade', 'cabin');

    icons.addModifier('rielkConstruction:farmingTreeSeedReturn', 'preservation');
    icons.addModifier('rielkConstruction:getSeedsFromFood', 'farming');
    icons.addModifier('rielkConstruction:spoofUnlockPlot', 'plot');

    icons.addModifier('rielkConstruction:spoofFoodSlot', 'food');
    icons.addModifier('rielkConstruction:unlockOverHeal', 'overheal');
    icons.addModifier('rielkConstruction:spoofUpgradeRegenPot', 'potion', 'overheal');
    icons.addModifier('rielkConstruction:autoeatOverheal', 'autoeat', 'overheal');
    icons.addModifier('rielkConstruction:regenOverheal', 'overheal',);
    icons.addModifier('rielkConstruction:maxOverheal', 'overheal');

    icons.addModifier('rielkConstruction:fishingTreasureNoReplace', 'fishing');
        icons.addModifier('rielkConstruction:minFishInterval', 'fishing', 'interval');
    icons.addModifier('rielkConstruction:maxFishInterval', 'fishing', 'interval');

    icons.addModifier('rielkConstruction:loseGPOnFishingBasedOnFish', 'fishing');
    icons.addModifier('rielkConstruction:fishPerfectCookedFish', 'fishing');
    icons.addModifier('rielkConstruction:spoofAddFishingSpecialItems', 'specialItems');


    icons.addModifier('rielkConstruction:increasePerfectFoodHealing', 'hitpoints');
    icons.addModifier('rielkConstruction:spoofUpgradeCookingEquipment_1', 'cookEquipment');
    icons.addModifier('rielkConstruction:spoofUpgradeCookingEquipment_2', 'cookSkillcape', 'cookConsumables');
    icons.addModifier('rielkConstruction:flatAshGainedOnCookingFailure', 'ash');

    icons.addModifier('rielkConstruction:unlockRoaring', 'firemaking');
    icons.addModifier('rielkConstruction:roaringLogCostReduction', 'firemaking');
    icons.addModifier('rielkConstruction:spoofUpgradeKindlingPotion', 'potion', 'firemaking');
    icons.addModifier('rielkConstruction:spoofUnlockBranchSaplings', 'seed');
    icons.addModifier('rielkConstruction:spoofUpgradeSaplingChance', 'seed');
    icons.addModifier('rielkConstruction:spoofUpgradeRoaring', 'firemaking');






}