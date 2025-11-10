export function tinyIconsCompatibility(ctx) {
    const icons = mod.api.tinyIcons;
    icons.addTagSourceMap(new Map([
        ['efficiency', ctx.getResourceUrl('assets/efficiency.png')],
        ['cabin', ctx.getResourceUrl('assets/cabin.png')],
        ['plot', game.items.getObjectByID('melvorD:Bobs_Rake').media],
        ['overheal', ctx.getResourceUrl('assets/tinyicons/tinyheart.png')],
        ['cookEquipment', game.items.getObjectByID('melvorF:Chefs_Hat').media],

        ['cookSkillcape', game.items.getObjectByID('melvorD:Cooking_Skillcape').media],
        ['cookConsumables', game.items.getObjectByID('melvorF:Additional_Cooker_Scroll').media],

    ]
    ));
    icons.addModifier('rielkConstruction:skillEfficiencyChance', 'efficiency');
    icons.addModifier('rielkConstruction:skillEfficiencyPotency', 'efficiency');
    icons.addModifier('rielkConstruction:skillEfficiencyCost', 'efficiency');

    icons.addModifier('rielkConstruction:constructionActionsToUpgrade', 'cabin');

    icons.addModifier('rielkConstruction:farmingTreeSeedReturn', 'preservation');
    icons.addModifier('rielkConstruction:spoofUnlockPlot', 'plot');

    icons.addModifier('rielkConstruction:spoofFoodSlot', 'food');
    icons.addModifier('rielkConstruction:unlockOverHeal', 'overheal');
    icons.addModifier('rielkConstruction:spoofUpgradeRegenPot', 'potion', 'overheal');
    icons.addModifier('rielkConstruction:autoeatOverheal', 'autoeat', 'overheal');
    icons.addModifier('rielkConstruction:regenOverheal', 'overheal',);
    icons.addModifier('rielkConstruction:maxOverheal', 'overheal');


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