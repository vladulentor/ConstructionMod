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
        ['ward', ctx.getResourceUrl('assets/replacements/barrier.webp')],
        ['specialattack', 'assets/media/main/special_attack.png'],
        ['aurora', 'assets/media/skills/combat/auroras.png'],
        ['rune_essence', game.items.getObjectByID('melvorD:Rune_Essence').media],
        ['convergence', ctx.getResourceUrl('assets/others/convergence.webp')],
        ['mark', 'assets/media/skills/summoning/mark_4_256.png'],
        ['deserthat', game.items.getObjectByID('melvorF:Desert_Hat').media],
        ['jgym', ctx.getResourceUrl('assets/fixtures/jungle_gym.webp')],
        ['stamina', 'assets/media/main/stamina.png']
    ]
    ));
    const constrSubcategories = new Map([
        ['rielkConstruction:Planks', { name: 'planks', media: game.items.getObjectByID('rielkConstruction:Oak_Planks').media }],
        ['rielkConstruction:Nails', { name: 'nails', media: game.items.getObjectByID('rielkConstruction:Iron_Nails').media }],
        ['rielkConstruction:Bricks', { name: 'bricks', media: game.items.getObjectByID('rielkConstruction:Limestone_Bricks').media }],
        ['rielkConstruction:Straps', { name: 'straps', media: game.items.getObjectByID('rielkConstruction:Red_Dhide_Leather_Straps').media }],
    ]);
    icons.addSubcategoryScopeMedia("rielkConstruction:Construction", constrSubcategories);

    icons.addModifier('rielkConstruction:spoofAddWoodcuttingMasteryStuff1', 'woodcutting', 'xp');
    icons.addModifier('rielkConstruction:spoofAddWoodcuttingMasteryStuff2', 'woodcutting', 'interval');


    icons.addModifier('rielkConstruction:skillEfficiencyChance', 'efficiency');
    icons.addModifier('rielkConstruction:skillEfficiencyPotency', 'efficiency');
    icons.addModifier('rielkConstruction:skillEfficiencyCost', 'efficiency');
    icons.addModifier('rielkConstruction:bypassEfficiencyChance', 'efficiency');
    icons.addModifier('rielkConstruction:skillEfficiencyChancePerHamrielStar', 'efficiency');
    icons.addModifier('rielkConstruction:xpPer5Fixture', 'xp');



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


    icons.addModifier('rielkConstruction:spoofIncreaseRuneReduction', 'magic', 'preservation');
    icons.addModifier('rielkConstruction:addRuneShield', 'ward');
    icons.addModifier('rielkConstruction:fake_Book_of_Eli', 'aurora');
    icons.addModifier('rielkConstruction:spoof_AddMagicSpecialAttack', 'specialattack', 'magic');
    icons.addModifier('rielkConstruction:runeShieldMultiplier', 'ward');
    icons.addModifier('rielkConstruction:AllowAurorasAnytime', 'aurora', 'combat');


    icons.addModifier('rielkConstruction:ExtraTier1Potions', 'potion');
    icons.addModifier('rielkConstruction:ChangeAddiIntoHighTier', 'herblore');
    icons.addModifier('rielkConstruction:spoofReduceUpAmount', 'potion');
    icons.addModifier('rielkConstruction:reducePotionUpReq', 'potion');

    icons.addModifier('rielkConstruction:spoof_AddRunesAstrology', 'rune_essence');
    icons.addModifier('rielkConstruction:spoof_UpgradeScrollOfEssence', 'rune_essence');
    icons.addModifier('rielkConstruction:spoof_AddStarStandardLevel', 'astrology');
    icons.addModifier('rielkConstruction:UnlockConvergence', 'convergence');


    icons.addModifier('rielkConstruction:bypassGlobalDoubling', 'doubling');
    icons.addModifier('rielkConstruction:bypassNonCombatSkillLevelCapAR', 'xp');
    icons.addModifier('rielkConstruction:bypassNonCombatSkillLevelAR', 'xp');


    icons.addModifier('rielkConstruction:allCombatSkillsFlatHiddenLevel', 'combat');


    icons.addModifier('rielkConstruction:ComboRunesonElemRunes', 'rune_essence');
    icons.addModifier('rielkConstruction:runePreservationCap', 'preservation');


    icons.addModifier('rielkConstruction:nullifyPrayerPointsUnder', 'nulled');


    icons.addModifier('rielkConstruction:TabletEffectBuffBasedOnMarkLevel', 'mark');
    icons.addModifier('rielkConstruction:TabletAmountBuffBasedOnMarkLevel', 'mark');
    icons.addModifier('rielkConstruction:spoof_UnlockMarkSuperLevels', 'mark');
    icons.addModifier('rielkConstruction:TabletFightBuffBasedOnMarkLevel', 'mark');
    icons.addModifier('rielkConstruction:IncreaseMarkChance', 'loot');


    icons.addModifier('rielkConstruction:UnlockTrader', 'ts_trader');
    icons.addModifier('rielkConstruction:spoof_LowerTraderRequirements', 'ts_trader');
    icons.addModifier('rielkConstruction:spoof_AddItemsToShop', 'ts_trader');
    icons.addModifier('rielkConstruction:ReduceThievingTargetMaxHitBasedOnDefLevel', 'defence');


    icons.addModifier('rielkConstruction:spoof_AddBonusToMiningMasteryPool1', 'mastery');
    icons.addModifier('rielkConstruction:spoof_AddBonusToMiningMasteryPool2', 'mastery');


    icons.addModifier('rielkConstruction:spoof_AddSlayerEnemies1', 'slayer');
    icons.addModifier('rielkConstruction:spoof_AddSlayerEnemies2', 'slayer');
    icons.addModifier('rielkConstruction:spoof_AddSlayerEnemies3', 'slayer');
    icons.addModifier('rielkConstruction:spoof_AddSlayerEnemies4', 'slayer');
    icons.addModifier('rielkConstruction:spoof_AddSlayerEnemies5', 'slayer');
    icons.addModifier('rielkConstruction:spoof_upgradeSlayerShtuff', 'deserthat');
    icons.addModifier('rielkConstruction:slayerCostReduction', 'slayer_coins');


    icons.addModifier('rielkConstruction:doublepetsmillion', 'loot');


    icons.addModifier('rielkConstruction:spoof_AddAgiObstacle', 'jgym');
    icons.addModifier('rielkConstruction:hpPerAgiLevels', 'stamina', 'hitpoints');
    icons.addModifier('rielkConstruction:IntPerAgiLevels', 'stamina', 'interval');
    icons.addModifier('rielkConstruction:CombIntPerAgiLevels', 'stamina', 'ti_attack_interval');
    icons.addModifier('rielkConstruction:fuckYourGold', 'currency');
    icons.addModifier('rielkConstruction:spoof_Damocles', 'mark_of_death');



}