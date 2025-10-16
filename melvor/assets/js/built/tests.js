"use strict";

function timeFunctionCall(func, numCalls = 1) {
    const tStart = performance.now();
    for (let i = 0; i < numCalls; i++) {
        func();
    }
    const tEnd = performance.now();
    console.log(`Took ${tEnd - tStart}ms to run function ${numCalls} time${pluralS(numCalls)}`);
    return tEnd - tStart;
}

function deleteAllSaves() {
    // For when you change branches and your save versions are too high
    for (let i = 0; i < 5; i++) {
        deleteLocalSaveInSlot(i);
    }
}

function testModifierDataDescriptions() {
    const createScope = (scopes) => {
        const scope = {};
        if (scopes.damageType)
            scope.damageType = game.normalDamage;
        if (scopes.currency)
            scope.currency = game.gp;
        if (scopes.realm)
            scope.realm = game.defaultRealm;
        if (scopes.skill)
            scope.skill = game.smithing;
        if (scopes.action)
            scope.action = game.smithing.actions.firstObject;
        if (scopes.category)
            scope.category = game.smithing.categories.firstObject;
        if (scopes.subcategory)
            scope.subcategory = game.smithing.subcategories.firstObject;
        return scope;
    };
    const checkPrinted = (printed) => {
        if (printed.text.includes('$') || printed.text.includes('{') || printed.text.includes('}')) {
            return 'contains template components';
        }
        if (printed.text.includes('UNDEFINED')) {
            return 'has undefined lang string';
        }
        return '';
    };
    game.modifierRegistry.forEach((modifier) => {
        modifier.allowedScopes.forEach((scoping) => {
            scoping.descriptions.forEach((description, i) => {
                const scope = createScope(scoping.scopes);
                if (description.scope !== undefined) {
                    ModifierScope.copyScope(description.scope, scope);
                }
                let value = 0;
                const exclusiveMin = description.range[0];
                const exclusiveMax = description.range[1];
                if (exclusiveMin === -Infinity) {
                    if (exclusiveMax === Infinity) {
                        value = 1;
                    } else {
                        value = exclusiveMax - 1;
                    }
                } else {
                    value = exclusiveMin + 1;
                }
                const modValue = new ModifierValue(modifier, value, scope);
                const result = checkPrinted(modValue.print());
                if (result !== '') {
                    console.log(`${modifier.id} description ${i} for scoping ${Object.keys(scoping.scopes)} ${result}`);
                }
            });
        });
    });
}

function allItems(qty) {
    if (DEBUGENABLED) {
        game.items.forEach((item) => {
            if (item !== game.emptyEquipmentItem && item !== game.emptyFoodItem) {
                game.bank.addItem(item, qty, false, true, true);
            }
        });
        game.bank.moveItemModeOnClick();
        game.items.forEachInNamespace("melvorD" /* Namespaces.Demo */ , (item) => {
            if (item === game.emptyEquipmentItem || item === game.emptyFoodItem)
                return;
            game.bank.selectItemOnClick(item);
        });
        game.items.forEachInNamespace("melvorF" /* Namespaces.Full */ , (item) => {
            game.bank.selectItemOnClick(item);
        });
        game.bank.moveSelectedItemsToTab(0);
        game.bank.moveItemModeOnClick();
        game.items.forEachInNamespace("melvorTotH" /* Namespaces.Throne */ , (item) => {
            game.bank.selectItemOnClick(item);
        });
        game.bank.moveSelectedItemsToTab(1);
        game.bank.moveItemModeOnClick();
        game.items.forEachInNamespace("melvorAoD" /* Namespaces.AtlasOfDiscovery */ , (item) => {
            game.bank.selectItemOnClick(item);
        });
        game.bank.moveSelectedItemsToTab(2);
        game.bank.moveItemModeOnClick();
        game.items.forEachInNamespace("melvorItA" /* Namespaces.IntoTheAbyss */ , (item) => {
            game.bank.selectItemOnClick(item);
        });
        game.bank.moveSelectedItemsToTab(3);
    }
}
/** Tests each attack description to see if it contains template values */
function testSpecialAttackDescriptions() {
    game.specialAttacks.forEach((attack) => {
        const desc = attack.description;
        const matches = desc.match(/[${}]/);
        if (matches !== null) {
            console.log(attack.id);
            console.log(desc);
        }
    });
}
/** Test all registered data object translations */
function testDataTranslations() {
    game.gamemodes.forEach((gamemode) => {
        gamemode.name;
        gamemode.description;
        gamemode.rules;
    });
    game.items.forEach((item) => {
        item.name;
        item.description;
    });
    game.attackStyles.forEach((style) => {
        style.name;
    });
    game.combatEffects.forEach((effect) => effect.name);
    game.specialAttacks.forEach((attack) => {
        attack.name;
        attack.description;
    });
    game.combatPassives.forEach((passive) => {
        passive.name;
        passive.description;
    });
    game.monsters.forEach((monster) => {
        monster.name;
        monster.description;
    });
    game.combatAreas.forEach((area) => {
        area.name;
    });
    game.slayerAreas.forEach((area) => {
        area.name;
        area.areaEffectDescription;
    });
    game.dungeons.forEach((dungeon) => {
        dungeon.name;
    });
    game.abyssDepths.forEach((depth) => {
        depth.name;
    });
    game.prayers.forEach((prayer) => {
        prayer.name;
    });
    game.attackSpells.forEach((spell) => {
        spell.name;
    });
    game.curseSpells.forEach((curse) => {
        curse.name;
    });
    game.auroraSpells.forEach((spell) => {
        spell.name;
    });
    game.pets.forEach((pet) => {
        pet.name;
        pet.acquiredBy;
        pet.description;
    });
    game.shop.purchases.forEach((purchase) => {
        purchase.name;
        purchase.description;
    });
    game.shop.upgradeChains.forEach((chain) => {
        chain.chainName;
        chain.defaultName;
        chain.defaultDescription;
    });
    game.tutorial.stages.forEach((stage) => {
        stage.name;
        stage.description;
        stage.tasks.forEach((task) => {
            task.description;
        });
    });
    game.pages.forEach((page) => {
        page.name;
    });
    game.lore.books.forEach((book) => {
        book.title;
    });
    game.skills.forEach((skill) => {
        skill.testTranslations();
    });
}

function validateSkillcapeStats(superior = false) {
    const skillCapes = game.items.equipment.filter((item) => {
        return (item.localID.endsWith('_Skillcape') &&
            item.localID.startsWith('Superior_') === superior &&
            !item.localID.includes('Max'));
    });
    const maxCape = game.items.equipment.getObjectByID(superior ? "melvorTotH:Superior_Max_Skillcape" /* ItemIDs.Superior_Max_Skillcape */ : "melvorF:Max_Skillcape" /* ItemIDs.Max_Skillcape */ );
    const compCape = game.items.equipment.getObjectByID(superior ? "melvorTotH:Superior_Cape_Of_Completion" /* ItemIDs.Superior_Cape_Of_Completion */ : "melvorF:Cape_of_Completion" /* ItemIDs.Cape_of_Completion */ );
    const modifiers = [];
    const equipStats = {};
    skillCapes.forEach((cape) => {
        /*
        cape.equipmentStats.forEach((stat) => {
          if (equipStats[stat.key] === undefined) equipStats[stat.key] = stat.value;
          else equipStats[stat.key] = Math.max(stat.value, equipStats[stat.key]!);
        });
        */
        if (cape.modifiers !== undefined) {
            modifiers.push(...cape.modifiers);
        }
    });
    /*
    maxCape.equipmentStats.forEach((stat) => {
      if (equipStats[stat.key] !== stat.value && !equipStats[stat.key] === undefined)
        console.log(`Max Cape Error: ${stat.key} is ${stat.value} but capes have ${equipStats[stat.key]}`);
    });
    compCape.equipmentStats.forEach((stat) => {
      if (equipStats[stat.key] !== stat.value && !equipStats[stat.key] === undefined)
        console.log(`Comp Cape Error: ${stat.key} is ${stat.value} but capes have ${equipStats[stat.key]}`);
    });
    */
    const modifierKeys = modifiers.map((modifier) => modifier.toComparisonKey());
    const maxCapeKeys = maxCape.modifiers.map((modifier) => modifier.toComparisonKey());
    modifiers.forEach((modifier, i) => {
        const key = modifierKeys[i];
        const maxCapeIdx = maxCapeKeys.findIndex((mKey) => mKey === key);
        if (maxCapeIdx === -1) {
            console.log(`Max Cape is missing: ${key}: ${modifier.value}`);
        } else if (maxCape.modifiers[maxCapeIdx].value !== modifier.value) {
            console.log(`Max Cape ${key} is ${maxCape.modifiers[maxCapeIdx].value} but capes have ${modifier.value}`);
        }
    });
    const compCapeKeys = compCape.modifiers.map((modifier) => modifier.toComparisonKey());
    modifiers.forEach((modifier, i) => {
        const key = modifierKeys[i];
        const compCapeIdx = compCapeKeys.findIndex((mKey) => mKey === key);
        if (compCapeIdx === -1) {
            console.log(`Max Cape is missing: ${key}: ${modifier.value}`);
        } else if (compCape.modifiers[compCapeIdx].value !== modifier.value) {
            console.log(`Max Cape ${key} is ${compCape.modifiers[compCapeIdx].value} but capes have ${modifier.value}`);
        }
    });
}
/** Checks all items to make sure they are obtainable */
function testItemObtainability() {
    const obtainable = new Set();
    // Skill Drops
    game.skills.forEach((skill) => addSetToSet(obtainable, skill.getObtainableItems()));
    // Item Upgrades
    game.bank.itemUpgrades.forEach((upgrades) => {
        upgrades.forEach((upgrade) => obtainable.add(upgrade.upgradedItem));
    });
    // Monster Drops
    game.monsters.forEach((monster) => {
        if (monster.bones)
            obtainable.add(monster.bones.item);
        monster.lootTable.sortedDropsArray.forEach((drop) => {
            obtainable.add(drop.item);
        });
    });
    // Dungeon Drops
    game.dungeons.forEach((dungeon) => {
        dungeon.rewards.forEach((item) => obtainable.add(item));
        if (dungeon.oneTimeReward)
            obtainable.add(dungeon.oneTimeReward);
    });
    // The Abyss Drops
    game.abyssDepths.forEach((depth) => {
        depth.rewards.forEach((item) => obtainable.add(item));
        if (depth.oneTimeReward)
            obtainable.add(depth.oneTimeReward);
    });
    game.combatEvents.forEach((event) => {
        event.itemRewards.forEach((item) => obtainable.add(item));
    });
    // Chest Items
    game.items.openables.forEach((chest) => {
        chest.dropTable.sortedDropsArray.forEach((drop) => {
            obtainable.add(drop.item);
        });
    });
    // Shop purchases
    game.shop.purchases.forEach((purchase) => {
        purchase.contains.items.forEach(({
            item
        }) => obtainable.add(item));
        if (purchase.contains.itemCharges)
            obtainable.add(purchase.contains.itemCharges.item);
    });
    // Misc Hardcoded items
    obtainable.add(game.items.getObjectByID("melvorD:Signet_Ring_Half_B" /* ItemIDs.Signet_Ring_Half_B */ ));
    obtainable.add(game.items.getObjectByID("melvorD:Clue_Chasers_Insignia" /* ItemIDs.Clue_Chasers_Insignia */ ));
    obtainable.add(game.items.getObjectByID("melvorD:Amulet_of_Calculated_Promotion" /* ItemIDs.Amulet_of_Calculated_Promotion */ ));
    obtainable.add(game.items.getObjectByID("melvorD:Eight" /* ItemIDs.Eight */ ));
    obtainable.add(game.items.getObjectByID("melvorD:Cool_Glasses" /* ItemIDs.Cool_Glasses */ ));
    game.items.forEach((item) => {
        if (item.golbinRaidExclusive || item === game.emptyEquipmentItem || item === game.emptyFoodItem)
            return;
        if (!obtainable.has(item)) {
            if (!item.ignoreCompletion)
                console.error(`Item: ${item.name} with ID: ${item.id} is unobtainable. (Completion)`);
            else
                console.warn(`Item: ${item.name} with ID: ${item.id} is unobtainable. (No Completion)`);
        }
    });
}

function getPotentialPassiveItems(namespace) {
    const candidates = [];
    const allItems = game.items.equipment.namespaceMaps.get(namespace);
    const bannedSlots = [
        "melvorD:Passive" /* EquipmentSlotIDs.Passive */ ,
        "melvorD:Weapon" /* EquipmentSlotIDs.Weapon */ ,
        "melvorD:Cape" /* EquipmentSlotIDs.Cape */ ,
        "melvorD:Quiver" /* EquipmentSlotIDs.Quiver */ ,
        "melvorD:Summon1" /* EquipmentSlotIDs.Summon1 */ ,
        "melvorD:Summon2" /* EquipmentSlotIDs.Summon2 */ ,
        "melvorD:Consumable" /* EquipmentSlotIDs.Consumable */ ,
        "melvorD:Gem" /* EquipmentSlotIDs.Gem */ ,
    ];
    if (allItems !== undefined) {
        allItems.forEach((item) => {
            if (item.validSlots.some((slot) => bannedSlots.includes(slot.id)))
                return;
            if ((item.modifiers === undefined || Object.keys(item.modifiers).length === 0) &&
                item.enemyModifiers === undefined &&
                item.conditionalModifiers.length === 0 &&
                item.combatEffects === undefined)
                return;
            candidates.push(item);
        });
    }
    return candidates;
}
// Convenience function to generate a CSV for recipe costs and value of its output
function generateProductGPBreakdown(costReduction = 0, increasedQuantity = 1, preservation = 0) {
    const trueInt = new TrueRecipeInterval();
    let a = ``;
    a += `Name\tBase GP Cost of Items\tBase Value of Single Item\tBase GP Value of Output\tProfit\tPercent\tCost reduction\tQuant\tGP Cost of Items with Reduction\tGP Value of Output with quant\tProfit\tPercent\tPreservation\tGP Value of Output with pres\tProfit\tPercent\n`;
    const generateBreakdown = (skill, action) => {
        var _a, _b;
        if (action.id.includes('melvorItA')) {
            console.log(action.name);
            preservation = (_b = (_a = trueInt.skillBonuses.get(skill)) === null || _a === void 0 ? void 0 : _a.presChance) !== null && _b !== void 0 ? _b : 0;
            const baseCost = action.itemCosts
                .filter(({
                    item
                }) => item.sellsFor.currency.id === "melvorD:GP" /* CurrencyIDs.GP */ )
                .reduce((total, cost) => total + cost.item.sellsFor.quantity * cost.quantity, 0);
            const cost = action.itemCosts
                .filter(({
                    item
                }) => item.sellsFor.currency.id === "melvorD:GP" /* CurrencyIDs.GP */ )
                .reduce((total, cost) => total + cost.item.sellsFor.quantity * Math.ceil(cost.quantity * (1 - costReduction / 100)), 0);
            const baseQuant = action instanceof SingleProductArtisanSkillRecipe ? action.baseQuantity : 1;
            let singleValue = 0;
            if (action instanceof SingleProductArtisanSkillRecipe) {
                if (action.product.sellsFor.currency.id === "melvorD:GP" /* CurrencyIDs.GP */ )
                    singleValue = action.product.sellsFor.quantity;
            } else if (action instanceof HerbloreRecipe) {
                if (action.potions[3].sellsFor.currency.id === "melvorD:GP" /* CurrencyIDs.GP */ )
                    singleValue = action.potions[3].sellsFor.quantity;
            }
            const baseValue = singleValue * baseQuant;
            const baseProfit = baseValue - baseCost;
            const basePercent = (baseProfit / baseCost) * 100;
            const value = baseValue * (baseQuant + increasedQuantity);
            const profit = value - cost;
            const percent = (profit / cost) * 100;
            const presValue = value / (1 - preservation / 100);
            const presProfit = presValue - cost;
            const presPercent = (presProfit / cost) * 100;
            a += `${action.name}\t${baseCost}\t${singleValue}\t${baseValue}\t${baseProfit}\t${basePercent.toFixed(1)}%\t${costReduction}%\t${baseQuant + increasedQuantity}\t${cost}\t${value}\t${profit}\t${percent.toFixed(1)}%\t${preservation}%\t${presValue}\t${presProfit}\t${presPercent.toFixed(1)}%\n`;
        }
    };
    game.smithing.actions.forEach((action) => generateBreakdown(game.smithing, action));
    game.cooking.actions.forEach((action) => generateBreakdown(game.cooking, action));
    game.fletching.actions.forEach((action) => generateBreakdown(game.fletching, action));
    game.crafting.actions.forEach((action) => generateBreakdown(game.crafting, action));
    game.runecrafting.actions.forEach((action) => generateBreakdown(game.runecrafting, action));
    game.herblore.actions.forEach((action) => generateBreakdown(game.herblore, action));
    console.log(a);
}

function getModifiersForSkill(skill, useBase) {
    if (useBase)
        return {
            intervalReduction: 0,
            intervalReductionFlat: 0,
            doubleChance: 0,
            presChance: 0,
            costReduction: 0,
            increasedQuant: 0,
        };
    switch (skill.id) {
        case "melvorD:Smithing" /* SkillIDs.Smithing */ :
            return {
                intervalReduction: 48,
                intervalReductionFlat: 400,
                doubleChance: 100,
                presChance: 80,
                costReduction: 0,
                increasedQuant: 0,
            };
        case "melvorD:Crafting" /* SkillIDs.Crafting */ :
            return {
                intervalReduction: 28,
                intervalReductionFlat: 2000,
                doubleChance: 91,
                presChance: 48,
                costReduction: 0,
                increasedQuant: 0,
            };
        case "melvorD:Fletching" /* SkillIDs.Fletching */ :
            return {
                intervalReduction: 23,
                intervalReductionFlat: 1500,
                doubleChance: 71,
                presChance: 63,
                costReduction: 0,
                increasedQuant: 0,
            };
        case "melvorD:Runecrafting" /* SkillIDs.Runecrafting */ :
            return {
                intervalReduction: 33,
                intervalReductionFlat: 200,
                doubleChance: 66,
                presChance: 68,
                costReduction: 0,
                increasedQuant: 0,
            };
        case "melvorD:Mining" /* SkillIDs.Mining */ :
            return {
                intervalReduction: 73,
                intervalReductionFlat: 600,
                doubleChance: 55,
                presChance: 0,
                costReduction: 0,
                increasedQuant: 0,
            };
        case "melvorD:Woodcutting" /* SkillIDs.Woodcutting */ :
            return {
                intervalReduction: 75,
                intervalReductionFlat: 500,
                doubleChance: 100,
                presChance: 0,
                costReduction: 0,
                increasedQuant: 0,
            };
        case "melvorItA:Harvesting" /* SkillIDs.Harvesting */ :
            return {
                intervalReduction: 20,
                intervalReductionFlat: 0,
                doubleChance: 0,
                presChance: 0,
                costReduction: 0,
                increasedQuant: 8,
            };
        case "melvorD:Fishing" /* SkillIDs.Fishing */ :
            return {
                intervalReduction: 71,
                intervalReductionFlat: 0,
                doubleChance: 100,
                presChance: 0,
                costReduction: 0,
                increasedQuant: 0,
            };
        default:
            return {
                intervalReduction: 0,
                intervalReductionFlat: 0,
                doubleChance: 0,
                presChance: 0,
                costReduction: 0,
                increasedQuant: 0,
            };
    }
}
class TrueRecipeInterval {
    constructor() {
        this.headers = [
            'Skill',
            'Name',
            'Level',
            'Progression',
            'Base TTC',
            'Base Per Hour',
            'True TTC',
            'True Per Hour',
            'Int Reduction',
            'Int Reduction Flat',
            'Doubling',
            'Pres',
            'Plus Quant',
            'Cost Reduction',
            'GP per action',
            'True GP per Hour',
            'True AP per Hour',
        ];
        this.skillBonuses = new Map();
        this.baseSkillIntervals = new Map();
        this.generateBreakdown = (action, skill, baseTime, trueTime) => {
            const modsForSkill = this.getModifiersForSkill(skill, false);
            const a = [
                skill.name,
                action.name,
                `${action.abyssalLevel > 1 ? `A-${action.abyssalLevel}` : action.level}`,
                `${this.getProgression(action.abyssalLevel)}`,
                `${formatAsShorthandTimePeriod(baseTime, true, false)}`,
                `${((1000 * 60 * 60) / baseTime).toFixed(1)}`,
                `${formatAsShorthandTimePeriod(trueTime, false, true)}`,
                `${((1000 * 60 * 60) / trueTime).toFixed(1)}`,
                `${modsForSkill.intervalReduction}%`,
                `${modsForSkill.intervalReductionFlat / 1000}s`,
                `${modsForSkill.doubleChance}%`,
                `${modsForSkill.presChance}%`,
                `${modsForSkill.increasedQuant}`,
                `${modsForSkill.costReduction}%`,
                `${this.getGPPerAction(action, trueTime)}`,
                `${this.getActionGPPerHour(action, trueTime)}`,
                'TODO',
            ];
            return a;
        };
        this.itaTTK = [{
                id: 'melvorItA:MutatingPlant',
                ttk: 2
            },
            {
                id: 'melvorItA:MutatingChicken',
                ttk: 2
            },
            {
                id: 'melvorItA:MutatingCow',
                ttk: 2
            },
            {
                id: 'melvorItA:MutatingScarecrow',
                ttk: 2
            },
            {
                id: 'melvorItA:AbyssalPlant',
                ttk: 2
            },
            {
                id: 'melvorItA:AbyssalChicken',
                ttk: 3
            },
            {
                id: 'melvorItA:AbyssalCow',
                ttk: 4
            },
            {
                id: 'melvorItA:AbyssalScarecrow',
                ttk: 7
            },
            {
                id: 'melvorItA:AbyssalBat',
                ttk: 7
            },
            {
                id: 'melvorItA:AbyssalWallclimber',
                ttk: 8
            },
            {
                id: 'melvorItA:AbyssalSwooper',
                ttk: 9
            },
            {
                id: 'melvorItA:CrimsonLeech',
                ttk: 5
            },
            {
                id: 'melvorItA:CrimsonViper',
                ttk: 6
            },
            {
                id: 'melvorItA:CrimsonHound',
                ttk: 6
            },
            {
                id: 'melvorItA:TangledThorns',
                ttk: 10
            },
            {
                id: 'melvorItA:TangledSerpent',
                ttk: 12
            },
            {
                id: 'melvorItA:TangledThornbeast',
                ttk: 15
            },
            {
                id: 'melvorItA:TangledWeaver',
                ttk: 20
            },
            {
                id: 'melvorItA:SmogSlime',
                ttk: 13
            },
            {
                id: 'melvorItA:SmogVirefang',
                ttk: 10
            },
            {
                id: 'melvorItA:SmogGolem',
                ttk: 17
            },
            {
                id: 'melvorItA:SmogFiend',
                ttk: 18
            },
            {
                id: 'melvorItA:ToxicSwarm',
                ttk: 21
            },
            {
                id: 'melvorItA:ToxicSerpent',
                ttk: 22
            },
            {
                id: 'melvorItA:ToxicBloom',
                ttk: 23
            },
            {
                id: 'melvorItA:BlightedMantis',
                ttk: 25
            },
            {
                id: 'melvorItA:BlightedMoth',
                ttk: 28
            },
            {
                id: 'melvorItA:BlightedSprayer',
                ttk: 32
            },
            {
                id: 'melvorItA:BlightedShadewing',
                ttk: 36
            },
            {
                id: 'melvorItA:BlightedMaw',
                ttk: 38
            },
            {
                id: 'melvorItA:BlightedWisp',
                ttk: 40
            },
            {
                id: 'melvorItA:ShadowIllusion',
                ttk: 23
            },
            {
                id: 'melvorItA:ShadowTrickster',
                ttk: 25
            },
            {
                id: 'melvorItA:ShadowTormentor',
                ttk: 27
            },
            {
                id: 'melvorItA:DreadwalkerWight',
                ttk: 29
            },
            {
                id: 'melvorItA:DreadwalkerGhoul',
                ttk: 31
            },
            {
                id: 'melvorItA:DreadwalkerRevenant',
                ttk: 33
            },
            {
                id: 'melvorItA:WailingAmbusher',
                ttk: 36
            },
            {
                id: 'melvorItA:WailingShade',
                ttk: 40
            },
            {
                id: 'melvorItA:WailingPoltergeist',
                ttk: 43
            },
            {
                id: 'melvorItA:PetrifyingBehemoth',
                ttk: 46
            },
            {
                id: 'melvorItA:PetrifyingDrake',
                ttk: 48
            },
            {
                id: 'melvorItA:PetrifyingBasilisk',
                ttk: 50
            },
            {
                id: 'melvorItA:FracturedBeast',
                ttk: 34
            },
            {
                id: 'melvorItA:FracturedManticore',
                ttk: 35
            },
            {
                id: 'melvorItA:FracturedWyvern',
                ttk: 38
            },
            {
                id: 'melvorItA:RavenousRazortalon',
                ttk: 40
            },
            {
                id: 'melvorItA:RavenousShadowfang',
                ttk: 43
            },
            {
                id: 'melvorItA:RavenousDreadwing',
                ttk: 45
            },
            {
                id: 'melvorItA:WitheringBonearcher',
                ttk: 48
            },
            {
                id: 'melvorItA:WitheringBonemage',
                ttk: 51
            },
            {
                id: 'melvorItA:WitheringBoneguard',
                ttk: 52
            },
            {
                id: 'melvorItA:CatacombSporeslinger',
                ttk: 55
            },
            {
                id: 'melvorItA:CatacombTerror',
                ttk: 57
            },
            {
                id: 'melvorItA:CatacombWraith',
                ttk: 58
            },
            {
                id: 'melvorItA:CatacombWurm',
                ttk: 60
            },
            {
                id: 'melvorItA:MurmuringTrapper',
                ttk: 50
            },
            {
                id: 'melvorItA:MurmuringTreant',
                ttk: 49
            },
            {
                id: 'melvorItA:MurmuringWollotails',
                ttk: 52
            },
            {
                id: 'melvorItA:EchoSpecter',
                ttk: 54
            },
            {
                id: 'melvorItA:EchoWalker',
                ttk: 57
            },
            {
                id: 'melvorItA:EchoDrifter',
                ttk: 60
            },
            {
                id: 'melvorItA:EchoHorror',
                ttk: 63
            },
            {
                id: 'melvorItA:SilentsnapGiantcrab',
                ttk: 64
            },
            {
                id: 'melvorItA:SilentsnapTortoise',
                ttk: 67
            },
            {
                id: 'melvorItA:SilentsnapSiren',
                ttk: 69
            },
            {
                id: 'melvorItA:WhisperingManta',
                ttk: 70
            },
            {
                id: 'melvorItA:WhisperingOctopus',
                ttk: 73
            },
            {
                id: 'melvorItA:WhisperingDrifter',
                ttk: 75
            },
            {
                id: 'melvorItA:EldritchGhoul',
                ttk: 76
            },
            {
                id: 'melvorItA:EldritchPhantom',
                ttk: 77
            },
            {
                id: 'melvorItA:EldritchAbberation',
                ttk: 79
            },
            {
                id: 'melvorItA:EldritchSeeker',
                ttk: 80
            },
            {
                id: 'melvorItA:EldritchStalker',
                ttk: 82
            },
            {
                id: 'melvorItA:EldritchSoulbinder',
                ttk: 83
            },
            {
                id: 'melvorItA:EldritchMindeater',
                ttk: 86
            },
            {
                id: 'melvorItA:HollowReaper',
                ttk: 87
            },
            {
                id: 'melvorItA:HollowNightmare',
                ttk: 89
            },
            {
                id: 'melvorItA:HollowHarbinger',
                ttk: 90
            },
            {
                id: 'melvorItA:VoidDoppelganger',
                ttk: 91
            },
            {
                id: 'melvorItA:VoidApostle',
                ttk: 93
            },
            {
                id: 'melvorItA:VoidHarbinger',
                ttk: 95
            },
            {
                id: 'melvorItA:VoidDweller',
                ttk: 96
            },
            {
                id: 'melvorItA:VoidNightstalker',
                ttk: 98
            },
            {
                id: 'melvorItA:VoidGargantuan',
                ttk: 99
            },
            {
                id: 'melvorItA:GreaterVoidEntity',
                ttk: 102
            },
            {
                id: 'melvorItA:GreaterVoidVagrant',
                ttk: 103
            },
            {
                id: 'melvorItA:GreaterVoidArtificer',
                ttk: 105
            },
        ];
        game.skills.forEach((skill) => {
            this.baseSkillIntervals.set(game.mining, 3000);
            this.baseSkillIntervals.set(game.smithing, 2000);
            this.baseSkillIntervals.set(game.thieving, 3000);
            this.baseSkillIntervals.set(game.fletching, 2000);
            this.baseSkillIntervals.set(game.crafting, 3000);
            this.baseSkillIntervals.set(game.runecrafting, 2000);
            this.baseSkillIntervals.set(game.herblore, 2000);
            this.baseSkillIntervals.set(game.summoning, 5000);
            this.baseSkillIntervals.set(game.astrology, 3000);
            if (game.archaeology !== undefined) {
                this.baseSkillIntervals.set(game.archaeology, 4000);
            }
            if (game.harvesting !== undefined) {
                this.baseSkillIntervals.set(game.harvesting, 3000);
            }
            if (skill.isCombat) {
                this.setSkillBonuses(skill, 0, 0, 100, 0, 0, 0, 0, 0);
            }
            switch (skill.id) {
                case "melvorD:Smithing" /* SkillIDs.Smithing */ :
                    this.setSkillBonuses(skill, 58, 400, 108, 93, 0, 0, 30, 0);
                    break;
                case "melvorD:Crafting" /* SkillIDs.Crafting */ :
                    this.setSkillBonuses(skill, 38, 2000, 91, 48, 0, 0, 60, 0);
                    break;
                case "melvorD:Fletching" /* SkillIDs.Fletching */ :
                    this.setSkillBonuses(skill, 33, 1500, 71, 63, 0, 0, 215, 100);
                    break;
                case "melvorD:Runecrafting" /* SkillIDs.Runecrafting */ :
                    this.setSkillBonuses(skill, 43, 200, 66, 68, 0, 0, 10, 0);
                    break;
                case "melvorD:Mining" /* SkillIDs.Mining */ :
                    this.setSkillBonuses(skill, 83, 600, 55, 0, 0, 0, 106, 15);
                    break;
                case "melvorD:Woodcutting" /* SkillIDs.Woodcutting */ :
                    this.setSkillBonuses(skill, 88, 200, 100, 0, 0, 0, 40, 100);
                    break;
                case "melvorItA:Harvesting" /* SkillIDs.Harvesting */ :
                    this.setSkillBonuses(skill, 30, 200, 0, 0, 0, 0, 0, 0);
                    break;
                case "melvorD:Fishing" /* SkillIDs.Fishing */ :
                    this.setSkillBonuses(skill, 81, 0, 100, 0, 0, 0, 175, 100);
                    break;
                case "melvorD:Firemaking" /* SkillIDs.Firemaking */ :
                    this.setSkillBonuses(skill, 82, 100, 68, 38, 0, 0, 10, 0);
                    break;
                case "melvorD:Cooking" /* SkillIDs.Cooking */ :
                    this.setSkillBonuses(skill, 91, 200, 133, 78, 0, 0, 38, 0);
                    break;
                case "melvorD:Thieving" /* SkillIDs.Thieving */ :
                    this.setSkillBonuses(skill, 23, 1700, 31, 38, 0, 0, 0, 0);
                    break;
                case "melvorD:Farming" /* SkillIDs.Farming */ :
                    this.setSkillBonuses(skill, 38, 0, 106, 38, 0, 0, 0, 0);
                    break;
                case "melvorD:Herblore" /* SkillIDs.Herblore */ :
                    this.setSkillBonuses(skill, 48, 200, 78, 76, 0, 0, 120, 100);
                    break;
                case "melvorD:Agility" /* SkillIDs.Agility */ :
                    this.setSkillBonuses(skill, 96, 0, 33, 38, 0, 0, 0, 0);
                    break;
                case "melvorD:Summoning" /* SkillIDs.Summoning */ :
                    this.setSkillBonuses(skill, 63, 1300, 41, 93, 0, 0, 0, 0);
                    break;
                case "melvorD:Astrology" /* SkillIDs.Astrology */ :
                    this.setSkillBonuses(skill, 85, 0, 33, 38, 0, 0, 0, 0);
                    break;
                default:
                    this.setSkillBonuses(skill, 0, 0, 0, 0, 0, 0, 0, 0);
                    break;
            }
        });
    }
    getProgression(level) {
        if (level <= 10)
            return 'EARLY';
        if (level <= 20)
            return 'EARLY-MID';
        if (level <= 30)
            return 'MID';
        if (level <= 40)
            return 'MID-LATE';
        if (level <= 50)
            return 'LATE';
        return 'END-GAME';
    }
    get baseSkillBonuses() {
        return new TrueRecipeIntervalBonuses();
    }
    getTodoRecipe(skill, action) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return [
            skill.name,
            action.name,
            `${action.abyssalLevel}`,
            `${this.getProgression(action.abyssalLevel)}`,
            'TODO',
            'TODO',
            'TODO',
            'TODO',
            `${(_b = (_a = this.skillBonuses.get(skill)) === null || _a === void 0 ? void 0 : _a.intervalReduction) !== null && _b !== void 0 ? _b : 0}`,
            `${(_d = (_c = this.skillBonuses.get(skill)) === null || _c === void 0 ? void 0 : _c.intervalReductionFlat) !== null && _d !== void 0 ? _d : 0}`,
            `${(_f = (_e = this.skillBonuses.get(skill)) === null || _e === void 0 ? void 0 : _e.doubleChance) !== null && _f !== void 0 ? _f : 0}`,
            `${(_h = (_g = this.skillBonuses.get(skill)) === null || _g === void 0 ? void 0 : _g.presChance) !== null && _h !== void 0 ? _h : 0}`,
            `${(_k = (_j = this.skillBonuses.get(skill)) === null || _j === void 0 ? void 0 : _j.increasedQuant) !== null && _k !== void 0 ? _k : 0}`,
            `${(_m = (_l = this.skillBonuses.get(skill)) === null || _l === void 0 ? void 0 : _l.costReduction) !== null && _m !== void 0 ? _m : 0}`,
            'TODO',
            'TODO',
            'TODO',
        ];
    }
    setSkillBonuses(skill, intervalReduction, intervalReductionFlat, doubleChance, presChance, costReduction, increasedQuant, additionalResourceChance, extraDoubleChance) {
        const bonuses = new TrueRecipeIntervalBonuses();
        bonuses.intervalReduction = intervalReduction;
        bonuses.intervalReductionFlat = intervalReductionFlat;
        bonuses.doubleChance = doubleChance;
        bonuses.presChance = presChance;
        bonuses.costReduction = costReduction;
        bonuses.increasedQuant = increasedQuant;
        bonuses.additionalResourceChance = additionalResourceChance;
        bonuses.extraDoubleChance = extraDoubleChance;
        this.skillBonuses.set(skill, bonuses);
    }
    isProductFromShop(cost) {
        return game.shop.purchases.allObjects.some((a) => {
            return a.contains.items.some((b) => b.item === cost.item);
        });
    }
    isProductFromCombat(cost) {
        return game.monsters.allObjects.some((a) => {
            return a.lootTable.sortedDropsArray.some((b) => b.item === cost.item);
        });
    }
    getCombatTrueBaseInterval(cost, useBase) {
        let interval = Infinity;
        let finalMonster;
        let finalTTK = Infinity;
        const monstersWithItemInLootTable = game.monsters.allObjects.filter((a) => {
            return a.lootTable.sortedDropsArray.some((b) => b.item === cost.item);
        });
        const monstersWithItemsAsBones = game.monsters.allObjects.filter((a) => {
            var _a;
            return ((_a = a.bones) === null || _a === void 0 ? void 0 : _a.item) === cost.item;
        });
        monstersWithItemInLootTable.forEach((monster) => {
            var _a, _b, _c;
            const itemFromTable = monster.lootTable.sortedDropsArray.find((a) => a.item === cost.item);
            if (itemFromTable === undefined)
                throw new Error(`Item not found in monster loot table`);
            const totalWeight = monster.lootTable.weight;
            const itemWeight = (_a = itemFromTable.weight) !== null && _a !== void 0 ? _a : 0;
            const chance = (itemWeight / totalWeight) * (monster.lootChance / 100);
            const avgQty = ((itemFromTable.minQuantity + itemFromTable.maxQuantity) / 2) * chance;
            const ttk = (_c = (_b = this.itaTTK.find((a) => a.id === monster.id)) === null || _b === void 0 ? void 0 : _b.ttk) !== null && _c !== void 0 ? _c : 2;
            const oldInterval = interval;
            interval = Math.min(interval, (cost.quantity / this.getProductQuantity(game.attack, avgQty, useBase)) * (ttk * 1000));
            finalMonster = oldInterval === undefined || oldInterval > interval ? monster : finalMonster;
            finalTTK = oldInterval === undefined || oldInterval > interval ? ttk : finalTTK;
        });
        monstersWithItemsAsBones.forEach((monster) => {
            var _a, _b;
            const itemFromTable = monster.bones;
            if (itemFromTable === undefined)
                throw new Error(`Item not found in monster bone drop table`);
            const avgQty = itemFromTable.quantity;
            const ttk = (_b = (_a = this.itaTTK.find((a) => a.id === monster.id)) === null || _a === void 0 ? void 0 : _a.ttk) !== null && _b !== void 0 ? _b : 2;
            const oldInterval = interval;
            interval = Math.min(interval, (cost.quantity / this.getProductQuantity(game.attack, avgQty, useBase)) * (ttk * 1000));
            finalMonster = oldInterval === undefined || oldInterval > interval ? monster : finalMonster;
            finalTTK = oldInterval === undefined || oldInterval > interval ? ttk : finalTTK;
        });
        return interval;
    }
    isProductFromMining(cost) {
        let product = game.mining.actions.allObjects.some((a) => a.product === cost.item);
        if (!product) {
            product =
                game.randomGemTable.sortedDropsArray.some((a) => a.item === cost.item) ||
                game.randomSuperiorGemTable.sortedDropsArray.some((a) => a.item === cost.item) ||
                game.randomAbyssalGemTable.sortedDropsArray.some((a) => a.item === cost.item);
        }
        return product;
    }
    getMiningTrueBaseInterval(cost, useBase) {
        let interval = Infinity;
        const productFromRocks = game.mining.actions.allObjects.filter((a) => a.product === cost.item);
        const productFromGem = game.randomGemTable.sortedDropsArray.some((a) => a.item === cost.item);
        const productFromSuperiorGem = game.randomSuperiorGemTable.sortedDropsArray.some((a) => a.item === cost.item);
        const productFromAbyssalGem = game.randomAbyssalGemTable.sortedDropsArray.some((a) => a.item === cost.item);
        productFromRocks.forEach((rock) => {
            if (rock.category.id !== "melvorItA:AbyssalGem" /* MiningCategoryIDs.AbyssalGem */ ) {
                interval = Math.min(interval, (cost.quantity / this.getProductQuantity(game.mining, rock.baseQuantity, useBase)) *
                    this.getActionInterval(game.mining, rock, this.baseSkillIntervals.get(game.mining), useBase));
            } else {
                console.log('Checking abyssal gem vein');
                const baseProductQty = this.getProductQuantity(game.mining, rock.baseQuantity, useBase);
                const avgProductQty = baseProductQty * this.getAbyssalGemVeinAverageProductQty(rock, useBase);
                interval = Math.min(interval, (cost.quantity / avgProductQty) *
                    this.getActionInterval(game.mining, rock, this.baseSkillIntervals.get(game.mining), useBase));
            }
        });
        game.mining.actions.allObjects.forEach((rock) => {
            var _a, _b, _c;
            if (productFromGem && rock.giveGems) {
                const itemFromTable = game.randomGemTable.sortedDropsArray.find((a) => a.item === cost.item);
                if (itemFromTable === undefined)
                    throw new Error(`Item not found in game.randomGemTable loot table`);
                const totalWeight = game.randomGemTable.weight;
                const itemWeight = (_a = itemFromTable.weight) !== null && _a !== void 0 ? _a : 0;
                const chance = itemWeight / totalWeight;
                const chanceFromRock = 100;
                const avgQty = ((itemFromTable.minQuantity + itemFromTable.maxQuantity) / 2) * chance * (chanceFromRock / 100) * 2;
                interval = Math.min(interval, (cost.quantity / avgQty) *
                    this.getActionInterval(game.mining, rock, this.baseSkillIntervals.get(game.mining), useBase));
                if (!useBase)
                    console.log(cost.item.name, `can be obtained from Mining at a rate of ${(this.getActionInterval(game.mining, rock, this.baseSkillIntervals.get(game.mining), useBase) /
                        avgQty /
                        1000).toFixed(1)}s per 1 x quantity from the random Gem table`);
            }
            if (productFromSuperiorGem && rock.giveSuperiorGems) {
                const itemFromTable = game.randomSuperiorGemTable.sortedDropsArray.find((a) => a.item === cost.item);
                if (itemFromTable === undefined)
                    throw new Error(`Item not found in game.randomSuperiorGemTable loot table`);
                const totalWeight = game.randomSuperiorGemTable.weight;
                const itemWeight = (_b = itemFromTable.weight) !== null && _b !== void 0 ? _b : 0;
                const chance = itemWeight / totalWeight;
                const chanceFromRock = 32;
                const avgQty = ((itemFromTable.minQuantity + itemFromTable.maxQuantity) / 2) * chance * (chanceFromRock / 100);
                interval = Math.min(interval, (cost.quantity / avgQty) *
                    this.getActionInterval(game.mining, rock, this.baseSkillIntervals.get(game.mining), useBase));
                if (!useBase)
                    console.log(cost.item.name, `can be obtained from Mining at a rate of ${(this.getActionInterval(game.mining, rock, this.baseSkillIntervals.get(game.mining), useBase) /
                        avgQty /
                        1000).toFixed(1)}s per 1 x quantity from the random Gem table`);
            }
            if (productFromAbyssalGem && rock.giveAbyssalGems) {
                const itemFromTable = game.randomAbyssalGemTable.sortedDropsArray.find((a) => a.item === cost.item);
                if (itemFromTable === undefined)
                    throw new Error(`Item not found in game.randomAbyssalGemTable loot table`);
                const totalWeight = game.randomAbyssalGemTable.weight;
                const itemWeight = (_c = itemFromTable.weight) !== null && _c !== void 0 ? _c : 0;
                const chance = itemWeight / totalWeight;
                const chanceFromRock = 2;
                const avgQty = ((itemFromTable.minQuantity + itemFromTable.maxQuantity) / 2) * chance * (chanceFromRock / 100);
                interval = Math.min(interval, (cost.quantity / avgQty) *
                    this.getActionInterval(game.mining, rock, this.baseSkillIntervals.get(game.mining), useBase));
                if (!useBase)
                    console.log(cost.item.name, `can be obtained from Mining at a rate of ${(this.getActionInterval(game.mining, rock, this.baseSkillIntervals.get(game.mining), useBase) /
                        avgQty /
                        1000).toFixed(1)}s per 1 x quantity from the random Gem table`);
            }
        });
        return interval;
    }
    productFromThieving(cost) {
        var _a, _b;
        return ((_b = (_a = this.productFromThievingLootTable(cost)) !== null && _a !== void 0 ? _a : this.productFromThievingNPCUniqueDrop(cost)) !== null && _b !== void 0 ? _b : this.productFromThievingAreaUniqueDrop(cost));
    }
    productFromThievingLootTable(cost) {
        return game.thieving.actions.allObjects.find((a) => {
            return a.lootTable.sortedDropsArray.some((b) => b.item === cost.item);
        });
    }
    productFromThievingNPCUniqueDrop(cost) {
        return game.thieving.actions.allObjects.find((a) => {
            var _a;
            return ((_a = a.uniqueDrop) === null || _a === void 0 ? void 0 : _a.item) === cost.item;
        });
    }
    productFromThievingAreaUniqueDrop(cost) {
        return game.thieving.areas.allObjects.find((a) => {
            return a.uniqueDrops.some((drop) => drop.item === cost.item);
        });
    }
    getThievingTrueBaseInterval(skill, cost, useBase) {
        let interval = Infinity;
        if (this.productFromThievingLootTable(cost) !== undefined) {
            const NPCs = game.thieving.actions.allObjects.filter((a) => {
                return a.lootTable.sortedDropsArray.some((b) => b.item === cost.item);
            });
            NPCs.forEach((npc) => {
                var _a;
                const itemFromTable = npc.lootTable.sortedDropsArray.find((a) => a.item === cost.item);
                if (itemFromTable === undefined)
                    throw new Error(`Item not found in NPC loot table`);
                const totalWeight = npc.lootTable.weight;
                const itemWeight = (_a = itemFromTable.weight) !== null && _a !== void 0 ? _a : 0;
                const chance = itemWeight / totalWeight;
                const avgQty = ((itemFromTable.minQuantity + itemFromTable.maxQuantity) / 2) * chance * 0.75;
                interval = Math.min(interval, (cost.quantity / this.getProductQuantity(skill, avgQty, useBase)) *
                    this.getActionInterval(game.thieving, npc, this.baseSkillIntervals.get(game.thieving), useBase));
            });
        }
        if (this.productFromThievingNPCUniqueDrop(cost) !== undefined) {
            const NPCs = game.thieving.actions.allObjects.filter((a) => {
                var _a;
                ((_a = a.uniqueDrop) === null || _a === void 0 ? void 0 : _a.item) === cost.item;
            });
            NPCs.forEach((npc) => {
                const itemFromTable = npc.uniqueDrop;
                if (itemFromTable === undefined)
                    throw new Error(`Item not found in NPC unique table`);
                const avgQty = itemFromTable.quantity * 0.01 * 0.75;
                interval = Math.min(interval, (cost.quantity / this.getProductQuantity(skill, avgQty, useBase)) *
                    this.getActionInterval(game.thieving, npc, this.baseSkillIntervals.get(game.thieving), useBase));
            });
        }
        if (this.productFromThievingAreaUniqueDrop(cost) !== undefined) {
            const areas = game.thieving.areas.allObjects.filter((a) => {
                return a.uniqueDrops.some((drop) => drop.item === cost.item);
            });
            areas.forEach((area) => {
                const itemFromTable = area.uniqueDrops.find((a) => a.item === cost.item);
                if (itemFromTable === undefined)
                    throw new Error(`Item not found in Area unique table`);
                const totalWeight = area.uniqueDrops.length;
                const itemWeight = 1;
                const chance = itemWeight / totalWeight;
                const avgQty = itemFromTable.quantity * chance * 0.02;
                interval = Math.min(interval, (cost.quantity / this.getProductQuantity(skill, avgQty, useBase)) *
                    this.getActionInterval(game.thieving, area, this.baseSkillIntervals.get(game.thieving), useBase));
            });
        }
        return interval;
    }
    getHarvestingTrueBaseInterval(cost, useBase) {
        var _a;
        let interval = Infinity;
        const veinsWithProduct = (_a = game.harvesting) === null || _a === void 0 ? void 0 : _a.actions.allObjects.filter((a) => {
            return a.products.some((b) => b.item === cost.item);
        });
        veinsWithProduct === null || veinsWithProduct === void 0 ? void 0 : veinsWithProduct.forEach((vein) => {
            const itemFromTable = vein.products.find((a) => a.item === cost.item);
            if (itemFromTable === undefined)
                throw new Error(`Item not found in vein products`);
            const totalWeight = vein.products.reduce((total, product) => total + product.weight, 0);
            const itemWeight = itemFromTable.weight;
            const chance = itemWeight / totalWeight;
            const avgQty = 3 * chance;
            interval = Math.min(interval, (cost.quantity / this.getProductQuantity(game.harvesting, avgQty, useBase)) *
                this.getActionInterval(game.harvesting, vein, 3000, useBase));
        });
        return interval;
    }
    // Generate the true interval of an item cost
    getItemCostInterval(skill, cost, useBase) {
        var _a;
        const productFromShop = this.isProductFromShop(cost);
        const productFromThieving = this.productFromThieving(cost);
        const productFromSmithing = game.smithing.actions.allObjects.find((a) => a.product === cost.item);
        const productFromCrafting = game.crafting.actions.allObjects.find((a) => a.product === cost.item);
        const productFromRunecrafting = game.runecrafting.actions.allObjects.find((a) => a.product === cost.item);
        const productFromFletching = game.fletching.actions.allObjects.find((a) => a.product === cost.item);
        const productFromHarvesting = (_a = game.harvesting) === null || _a === void 0 ? void 0 : _a.actions.allObjects.find((a) => a.products.find((b) => b.item === cost.item));
        const productFromFishing = game.fishing.actions.allObjects.find((a) => a.product === cost.item);
        const productFromWoodcutting = game.woodcutting.actions.allObjects.find((a) => a.product === cost.item);
        const productFromFarming = game.farming.actions.allObjects.find((a) => a.product === cost.item);
        const productFromCooking = game.cooking.actions.allObjects.find((a) => a.product === cost.item);
        let interval = Infinity;
        const costQty = this.getCostQuantity(skill, cost.quantity, useBase);
        if (productFromShop)
            return 0;
        if (productFromSmithing) {
            interval = Math.min(interval, (costQty / this.getProductQuantity(game.smithing, productFromSmithing.baseQuantity, useBase)) *
                this.getArtisanSkillTrueBaseInterval(game.smithing, productFromSmithing, useBase));
        }
        if (productFromFishing)
            interval = Math.min(interval, (costQty / this.getProductQuantity(game.fishing, 1, useBase)) *
                this.getActionInterval(game.fishing, productFromFishing, (productFromFishing.baseMinInterval + productFromFishing.baseMaxInterval) / 2, useBase));
        if (productFromWoodcutting)
            interval = Math.min(interval, (costQty / this.getProductQuantity(game.woodcutting, 1, useBase)) *
                this.getActionInterval(game.woodcutting, productFromWoodcutting, productFromWoodcutting.baseInterval, useBase));
        if (productFromCrafting)
            interval = Math.min(interval, (costQty / this.getProductQuantity(game.crafting, productFromCrafting.baseQuantity, useBase)) *
                this.getArtisanSkillTrueBaseInterval(game.crafting, productFromCrafting, useBase));
        if (productFromFletching)
            interval = Math.min(interval, (costQty / this.getProductQuantity(game.fletching, productFromFletching.baseQuantity, useBase)) *
                this.getArtisanSkillTrueBaseInterval(game.fletching, productFromFletching, useBase));
        if (productFromRunecrafting)
            interval = Math.min(interval, (costQty / this.getProductQuantity(game.runecrafting, productFromRunecrafting.baseQuantity, useBase)) *
                this.getArtisanSkillTrueBaseInterval(game.runecrafting, productFromRunecrafting, useBase));
        if (productFromCooking)
            interval = Math.min(interval, (costQty / this.getProductQuantity(game.cooking, productFromCooking.baseQuantity, useBase)) *
                this.getActionInterval(game.cooking, productFromCooking, productFromCooking.baseInterval, useBase));
        if (productFromHarvesting) {
            interval = Math.min(interval, this.getHarvestingTrueBaseInterval(cost, useBase));
        }
        if (productFromThieving) {
            interval = Math.min(interval, this.getThievingTrueBaseInterval(skill, cost, useBase));
        }
        if (productFromFarming) {
            let quantMulti = 1;
            switch (productFromFarming.category.id) {
                case "melvorD:Allotment" /* FarmingCategoryIDs.Allotment */ :
                    quantMulti = 2 * 19;
                    break;
                case "melvorD:Herb" /* FarmingCategoryIDs.Herb */ :
                    quantMulti = 2 * 16;
                    break;
                case "melvorD:Tree" /* FarmingCategoryIDs.Tree */ :
                    quantMulti = 30 * 6;
                    break;
                case "melvorItA:Special" /* FarmingCategoryIDs.Special */ :
                    quantMulti = 6;
                    break;
            }
            interval = Math.min(interval, (costQty / (this.getProductQuantity(game.farming, 1, useBase) * quantMulti)) *
                this.getActionInterval(game.farming, productFromFarming, productFromFarming.baseInterval, useBase));
        }
        if (this.isProductFromMining(cost)) {
            interval = Math.min(interval, this.getMiningTrueBaseInterval(cost, useBase));
        }
        if (this.isProductFromCombat(cost)) {
            interval = Math.min(interval, this.getCombatTrueBaseInterval(cost, useBase));
        }
        if (interval === Infinity && !useBase)
            console.log('Item not found in actions:', cost.item.name);
        return interval;
    }
    getCostQuantity(skill, baseQuant, useBase) {
        const modifiers = this.getModifiersForSkill(skill, useBase);
        const costReduction = skill instanceof ArtisanSkill ? modifiers.costReduction : 0;
        const presChance = skill instanceof ArtisanSkill ? modifiers.presChance : 0;
        return Math.ceil(baseQuant * (1 - costReduction / 100) * (1 + presChance / 100));
    }
    getProductQuantity(skill, baseQuant, useBase) {
        const modifiers = this.getModifiersForSkill(skill, useBase);
        if (skill.id === "melvorD:Farming" /* SkillIDs.Farming */ ) {
            let quantityMultiplier = 0;
            let harvestQuantity = Math.floor(5 + 99 * 0.4);
            quantityMultiplier += 5;
            quantityMultiplier += 20;
            quantityMultiplier += 20;
            harvestQuantity = useBase ? 5 : applyModifier(harvestQuantity, quantityMultiplier);
            return harvestQuantity * (1 + modifiers.doubleChance / 100);
        }
        return (baseQuant * (1 + modifiers.doubleChance / 100) * this.getExtraDouble(skill, useBase) +
            modifiers.increasedQuant +
            this.getAdditional(skill, useBase));
    }
    getAbyssalGemVeinAverageProductQty(rock, useBase) {
        var _a, _b;
        const avgHpPerAction = (1 / 300) * 3.5 + (1 / 750) * 7.5 + (1 / 1500) * 15;
        const totalGemVeinWeight = game.mining.totalAbyssalGemVeinWeight;
        const veinWeight = (_b = (_a = game.mining.abyssalGemVeins.find((a) => a.rock.id === rock.id)) === null || _a === void 0 ? void 0 : _a.weight) !== null && _b !== void 0 ? _b : 0;
        const chance = veinWeight / totalGemVeinWeight;
        const avgProductQty = chance * avgHpPerAction;
        return avgProductQty;
    }
    getActionInterval(skill, action, baseInterval, useBase) {
        if (action instanceof MiningRock && action.category.id === "melvorItA:AbyssalGem" /* MiningCategoryIDs.AbyssalGem */ ) {
            baseInterval = baseInterval / this.getAbyssalGemVeinAverageProductQty(action, useBase);
        }
        return Math.max(250, baseInterval * (1 - this.getModifiersForSkill(skill, useBase).intervalReduction / 100) -
            this.getModifiersForSkill(skill, useBase).intervalReductionFlat);
    }
    getExtraDouble(skill, useBase) {
        if (useBase)
            return 1;
        const bonuses = this.skillBonuses.get(skill);
        if (bonuses)
            return Math.random() < bonuses.extraDoubleChance / 100 ? 2 : 1;
        return 1;
    }
    getAdditional(skill, useBase) {
        if (useBase)
            return 0;
        const bonuses = this.skillBonuses.get(skill);
        if (bonuses)
            return Math.random() < bonuses.additionalResourceChance / 100 ? 1 : 0;
        return 0;
    }
    getModifiersForSkill(skill, useBase) {
        if (useBase)
            return this.baseSkillBonuses;
        const bonuses = this.skillBonuses.get(skill);
        if (bonuses)
            return bonuses;
        return this.baseSkillBonuses;
    }
    shouldGetAction(action, baseGame = true, TotH = true, AoD = true, ItA = true, levelLimit = 60) {
        if (action.abyssalLevel > levelLimit)
            return false;
        if (action.namespace === "melvorF" /* Namespaces.Full */ || action.namespace === "melvorD" /* Namespaces.Demo */ )
            return baseGame;
        if (action.namespace === "melvorTotH" /* Namespaces.Throne */ )
            return TotH;
        if (action.namespace === "melvorAoD" /* Namespaces.AtlasOfDiscovery */ )
            return AoD;
        if (action.namespace === "melvorItA" /* Namespaces.IntoTheAbyss */ )
            return ItA;
        return false;
    }
    getArtisanSkillTrueBaseInterval(skill, action, useBase) {
        var _a;
        if (!(skill instanceof ArtisanSkill))
            return 0;
        const baseSkillInterval = this.baseSkillIntervals.get(skill);
        if (baseSkillInterval === undefined)
            throw new Error(`Base skill interval not found for ${skill.name}`);
        const baseInterval = this.getActionInterval(skill, action, baseSkillInterval, useBase);
        let itemCostInterval = 0;
        const costs = new Costs(game);
        const itemCosts = action.itemCosts;
        itemCosts.forEach(({
            item,
            quantity
        }) => {
            if (quantity > 0)
                costs.addItem(item, quantity);
        });
        costs.getItemQuantityArray().forEach((cost) => {
            itemCostInterval += this.getItemCostInterval(skill, cost, useBase);
        });
        const baseQty = (_a = action.baseQuantity) !== null && _a !== void 0 ? _a : 1;
        if (itemCostInterval === Infinity) {
            //console.log(`Item cost interval is Infinity for ${action.name} in ${skill.name} skill.`);
            return 0;
        }
        if (itemCostInterval === 0 && !useBase) {
            console.log(`Item cost interval is 0 for ${action.name} in ${skill.name} skill.`);
        }
        return (baseInterval + itemCostInterval) / this.getProductQuantity(skill, baseQty, useBase);
    }
    getTrueIntervalsForSkill(skill, baseGame = true, TotH = true, AoD = true, ItA = true, levelLimit = 60) {
        const data = [];
        if (skill instanceof ArtisanSkill) {
            skill.actions.forEach((action) => {
                if (!this.shouldGetAction(action, baseGame, TotH, AoD, ItA, levelLimit))
                    return;
                const baseTrueTime = this.getArtisanSkillTrueBaseInterval(skill, action, true);
                const trueTime = this.getArtisanSkillTrueBaseInterval(skill, action, false);
                if (!baseTrueTime || !trueTime) {
                    console.log(`Base or true time not found for ${action.name}`);
                    data.push(this.getTodoRecipe(skill, action));
                    return;
                } else if (baseTrueTime === 0) {
                    console.log(`Base true time is 0 for ${action.name}. Recipe actions not yet supported.`);
                    data.push(this.getTodoRecipe(skill, action));
                    return;
                }
                data.push(this.generateBreakdown(action, skill, baseTrueTime, trueTime));
            });
        } else if ((skill instanceof GatheringSkill || skill instanceof Farming) && skill.id !== "melvorD:Magic" /* SkillIDs.Magic */ ) {
            skill.actions.forEach((action) => {
                var _a;
                if (!this.shouldGetAction(action, baseGame, TotH, AoD, ItA, levelLimit))
                    return;
                let baseQuant = (_a = action.baseQuantity) !== null && _a !== void 0 ? _a : 1;
                if (action instanceof HarvestingVein)
                    baseQuant = 3;
                let baseInterval = this.baseSkillIntervals.get(skill);
                if (baseInterval === undefined) {
                    if (skill.id === "melvorD:Fishing" /* SkillIDs.Fishing */ ) {
                        baseInterval = (action.baseMinInterval + action.baseMaxInterval) / 2;
                    } else {
                        baseInterval = action.baseInterval;
                        if (baseInterval === undefined)
                            throw new Error(`Base interval not found for ${action.name}`);
                    }
                }
                const baseTrueTime = this.getActionInterval(skill, action, baseInterval, true);
                const trueTime = this.getActionInterval(skill, action, baseInterval, false);
                const productQuant = this.getProductQuantity(skill, baseQuant, true);
                const trueProductQuant = this.getProductQuantity(skill, baseQuant, false);
                data.push(this.generateBreakdown(action, skill, baseTrueTime / productQuant, trueTime / trueProductQuant));
            });
        } else {
            console.log(`Skill ${skill.name} not supported for true interval generation`);
        }
        return data;
    }
    getGPPerAction(action, trueTime) {
        var _a, _b;
        if (game.abyssalPieces === undefined)
            return 0;
        if (action instanceof ThievingNPC) {
            const avgDropValue = action.lootTable.size > 0 ? action.lootTable.getAverageDropValue().get(game.abyssalPieces) : 0;
            const maxNpcGP = (_b = (_a = action.currencyDrops.find((currency) => currency.currency.id === "melvorItA:AbyssalPieces" /* CurrencyIDs.AbyssalPieces */ )) === null || _a === void 0 ? void 0 : _a.quantity) !== null && _b !== void 0 ? _b : 0;
            const avgGPPer = avgDropValue + maxNpcGP / 2;
            return avgGPPer;
        }
        if (action instanceof HerbloreRecipe) {
            return action.potions[3].sellsFor.quantity;
        }
        if (action instanceof HarvestingVein) {
            const totalValue = action.products.reduce((total, product) => {
                total += product.item.sellsFor.quantity;
                return total;
            }, 0);
            const avgDropValue = totalValue / action.products.length;
            return avgDropValue;
        }
        return action.product !== undefined ? action.product.sellsFor.quantity : '???';
    }
    getActionGPPerHour(action, trueTime) {
        const gpPer = this.getGPPerAction(action, trueTime);
        return gpPer === '???' ? gpPer : ((gpPer * (1000 * 60 * 60)) / trueTime).toFixed(1);
    }
    generateBlankRows(count) {
        const a = [];
        for (let i = 0; i < count; i++) {
            a.push([``, ``, ``, ``, ``, ``, ``, ``, ``, ``, ``, ``, ``, ``, ``, ``, '']);
        }
        return a;
    }
    generateTrueIntervalCSV(baseGame = true, TotH = true, AoD = true, ItA = true) {
        const data = [];
        game.skills.forEach((skill) => data.push(...this.getTrueIntervalsForSkill(skill, baseGame, TotH, AoD, ItA)));
        //console.log(data.join('\n'));
        const csv = buildCSVFile(this.headers, data);
        downloadTextFile('trueIntervalCSV.csv', csv, 'data:text/csv');
    }
    changeSkillBonuses(skill, costReduction, increasedQuant) {
        const mods = this.skillBonuses.get(skill);
        if (mods === undefined)
            return;
        mods.costReduction = costReduction;
        mods.increasedQuant = increasedQuant;
        this.skillBonuses.set(skill, mods);
    }
    generateCSVsForItA(baseGame = false, TotH = false, AoD = false, ItA = true) {
        const data = [];
        game.skills.forEach((skill) => {
            this.changeSkillBonuses(skill, 0, 0);
        });
        game.skills.forEach((skill) => data.push(...this.getTrueIntervalsForSkill(skill, baseGame, TotH, AoD, ItA, 10)));
        data.push(...this.generateBlankRows(2));
        game.skills.forEach((skill) => {
            this.changeSkillBonuses(skill, 10, 0);
        });
        game.skills.forEach((skill) => data.push(...this.getTrueIntervalsForSkill(skill, baseGame, TotH, AoD, ItA, 20)));
        data.push(...this.generateBlankRows(2));
        game.skills.forEach((skill) => {
            this.changeSkillBonuses(skill, 15, 1);
        });
        game.skills.forEach((skill) => data.push(...this.getTrueIntervalsForSkill(skill, baseGame, TotH, AoD, ItA, 30)));
        data.push(...this.generateBlankRows(2));
        game.skills.forEach((skill) => {
            this.changeSkillBonuses(skill, 25, 2);
        });
        game.skills.forEach((skill) => data.push(...this.getTrueIntervalsForSkill(skill, baseGame, TotH, AoD, ItA, 40)));
        data.push(...this.generateBlankRows(2));
        game.skills.forEach((skill) => {
            this.changeSkillBonuses(skill, 40, 3);
        });
        game.skills.forEach((skill) => data.push(...this.getTrueIntervalsForSkill(skill, baseGame, TotH, AoD, ItA, 50)));
        data.push(...this.generateBlankRows(2));
        game.skills.forEach((skill) => {
            this.changeSkillBonuses(skill, 50, 5);
        });
        game.skills.forEach((skill) => data.push(...this.getTrueIntervalsForSkill(skill, baseGame, TotH, AoD, ItA, 60)));
        data.push(...this.generateBlankRows(2));
        game.skills.forEach((skill) => {
            this.changeSkillBonuses(skill, 60, 7);
        });
        game.skills.forEach((skill) => data.push(...this.getTrueIntervalsForSkill(skill, baseGame, TotH, AoD, ItA, 60)));
        data.push(...this.generateBlankRows(2));
        game.skills.forEach((skill) => {
            this.changeSkillBonuses(skill, 70, 8);
        });
        game.skills.forEach((skill) => data.push(...this.getTrueIntervalsForSkill(skill, baseGame, TotH, AoD, ItA, 60)));
        data.push(...this.generateBlankRows(2));
        game.skills.forEach((skill) => {
            this.changeSkillBonuses(skill, 80, 9);
        });
        game.skills.forEach((skill) => data.push(...this.getTrueIntervalsForSkill(skill, baseGame, TotH, AoD, ItA, 60)));
        data.push(...this.generateBlankRows(2));
        game.skills.forEach((skill) => {
            this.changeSkillBonuses(skill, 80, 10);
        });
        game.skills.forEach((skill) => data.push(...this.getTrueIntervalsForSkill(skill, baseGame, TotH, AoD, ItA, 60)));
        data.push(...this.generateBlankRows(2));
        game.skills.forEach((skill) => {
            this.changeSkillBonuses(skill, 80, 12);
        });
        game.skills.forEach((skill) => data.push(...this.getTrueIntervalsForSkill(skill, baseGame, TotH, AoD, ItA, 60)));
        const csv = buildCSVFile(this.headers, data);
        downloadTextFile('trueIntervalCSV.csv', csv, 'data:text/csv');
    }
    generateMaxDataCSV(baseGame = false, TotH = false, AoD = false, ItA = true) {
        const data = [];
        game.skills.forEach((skill) => {
            this.changeSkillBonuses(skill, 80, 12);
        });
        game.skills.forEach((skill) => data.push(...this.getTrueIntervalsForSkill(skill, baseGame, TotH, AoD, ItA, 60)));
        const csv = buildCSVFile(this.headers, data);
        downloadTextFile('trueIntervalCSV.csv', csv, 'data:text/csv');
    }
    generateTrueIntervalBreakdownForItemsCSV(baseGame = false, TotH = false, AoD = false, ItA = true) {
        const data = [];
        data.push(['Item', 'Source', 'True Interval', 'Actions per Hour', 'AP per Action'].join('\t'));
        game.items.forEach((item) => {
            const costs = new Costs(game);
            let interval = Infinity;
            switch (item.namespace) {
                case "melvorF" /* Namespaces.Full */ :
                    if (!baseGame)
                        break;
                    console.log(`${item.name}: Generating true interval breakdown`);
                    costs.addItem(item, 1);
                    costs.getItemQuantityArray().forEach((cost) => {
                        if (this.isProductFromCombat(cost)) {
                            interval = Math.min(interval, this.getCombatTrueBaseInterval(cost, false));
                        }
                    });
                    break;
                case "melvorTotH" /* Namespaces.Throne */ :
                    if (!TotH)
                        break;
                    console.log(`${item.name}: Generating true interval breakdown`);
                    costs.addItem(item, 1);
                    costs.getItemQuantityArray().forEach((cost) => {
                        if (this.isProductFromCombat(cost)) {
                            interval = Math.min(interval, this.getCombatTrueBaseInterval(cost, false));
                        }
                    });
                    break;
                case "melvorAoD" /* Namespaces.AtlasOfDiscovery */ :
                    if (!AoD)
                        break;
                    console.log(`${item.name}: Generating true interval breakdown`);
                    costs.addItem(item, 1);
                    costs.getItemQuantityArray().forEach((cost) => {
                        if (this.isProductFromCombat(cost)) {
                            interval = Math.min(interval, this.getCombatTrueBaseInterval(cost, false));
                        }
                    });
                    break;
                case "melvorItA" /* Namespaces.IntoTheAbyss */ :
                    if (!ItA)
                        break;
                    console.log(`${item.name}: Generating true interval breakdown`);
                    costs.addItem(item, 1);
                    costs.getItemQuantityArray().forEach((cost) => {
                        if (this.isProductFromCombat(cost)) {
                            interval = Math.min(interval, this.getCombatTrueBaseInterval(cost, false));
                        }
                    });
                    break;
            }
            if (interval === Infinity) {
                console.log(`${item.name} not found from Combat drops`);
                return;
            }
            const trueTime = interval;
            data.push([
                item.name,
                `COMBAT DROP`,
                `${formatAsShorthandTimePeriod(trueTime, false, true)}`,
                `${((1000 * 60 * 60) / trueTime).toFixed(4)}`,
                `${item.sellsFor.currency.id === "melvorItA:AbyssalPieces" /* CurrencyIDs.AbyssalPieces */ ? item.sellsFor.quantity : '???'}`,
            ].join('\t'));
        });
        console.log(data.join('\n'));
    }
    generateMonsterAPRates() {
        const data = [];
        data.push(['Monster', 'Combat Area', 'TTK', 'AP per hour', 'Soul Points per kill', 'per hour'].join('\t'));
        const isMonsterItA = (monsterID) => {
            return this.itaTTK.find((a) => a.id === monsterID) !== undefined;
        };
        const getAvgMonsterDrop = (monster) => {
            var _a;
            let dropValue = 0;
            const avgDropValue = monster.lootTable.getAverageDropValue();
            if (avgDropValue !== undefined) {
                dropValue = (_a = avgDropValue.get(game.currencies.getObjectByID('melvorItA:AbyssalPieces'))) !== null && _a !== void 0 ? _a : 0;
                dropValue *= monster.lootChance / 100;
            }
            monster.currencyDrops.forEach((drop) => {
                if (drop.currency.id === 'melvorItA:AbyssalPieces')
                    dropValue += (drop.max + drop.min) / 2;
            });
            return dropValue;
        };
        game.combatAreas.forEach((area) => {
            if (area instanceof Dungeon || area instanceof AbyssDepth || area instanceof Stronghold)
                return;
            area.monsters.forEach((monster) => {
                var _a, _b, _c;
                if (isMonsterItA(monster.id)) {
                    const ttk = (_a = this.itaTTK.find((a) => a.id === monster.id)) === null || _a === void 0 ? void 0 : _a.ttk;
                    if (ttk === undefined)
                        throw new Error(`TTK not found for ${monster.name}`);
                    const apPerHour = ((getAvgMonsterDrop(monster) * 60) / ttk) * 60;
                    const soulPointItem = (_b = monster.bones) === null || _b === void 0 ? void 0 : _b.item;
                    const soulPoints = (_c = soulPointItem === null || soulPointItem === void 0 ? void 0 : soulPointItem.soulPoints) !== null && _c !== void 0 ? _c : 0;
                    const soulPointsPerHour = ((soulPoints * 60) / ttk) * 60;
                    data.push([monster.name, area.name, ttk, apPerHour, soulPoints, soulPointsPerHour].join('\t'));
                }
            });
        });
        console.log(data.join('\n'));
    }
    generateDungeonAPRates() {
        const data = [];
        data.push(['Dungeon', 'Chest', 'Item', 'Time to Get', 'Items per hour', 'Items per day', 'AP per hour'].join('\t'));
        game.abyssDepths.forEach((area) => {
            let totalTTK = 0;
            area.monsters.forEach((monster) => {
                var _a;
                const ttk = (_a = this.itaTTK.find((a) => a.id === monster.id)) === null || _a === void 0 ? void 0 : _a.ttk;
                if (ttk === undefined) {
                    console.log(`TTK not found for ${monster.name} in ${area.name}. Defaulting to ${7200 - totalTTK}s`);
                    totalTTK += 7200 - totalTTK;
                } else
                    totalTTK += ttk;
            });
            const chestReward = area.rewards[0];
            if (chestReward instanceof OpenableItem) {
                const totalWeight = chestReward.dropTable.weight;
                chestReward.dropTable.sortedDropsArray.forEach((drop) => {
                    const itemWeight = drop.weight;
                    const chance = itemWeight / totalWeight;
                    const avgQty = ((drop.minQuantity + drop.maxQuantity) / 2) * chance;
                    const itemsPerHour = ((60 * 60) / totalTTK) * avgQty;
                    const apPerHour = itemsPerHour * drop.item.sellsFor.quantity;
                    data.push([area.name, chestReward.name, drop.item.name, totalTTK, itemsPerHour, itemsPerHour * 24, apPerHour].join('\t'));
                });
            }
        });
        console.log(data.join('\n'));
    }
}
class TrueRecipeIntervalBonuses {
    constructor() {
        this._intervalReduction = 0;
        this._intervalReductionFlat = 0;
        this._doubleChance = 0;
        this._presChance = 0;
        this._costReduction = 0;
        this._increasedQuant = 0;
        this._additionalResourceChance = 0;
        this._extraDoubleChance = 0;
    }
    get intervalReduction() {
        return this._intervalReduction;
    }
    set intervalReduction(value) {
        this._intervalReduction = value;
    }
    get intervalReductionFlat() {
        return this._intervalReductionFlat;
    }
    set intervalReductionFlat(value) {
        this._intervalReductionFlat = value;
    }
    get doubleChance() {
        return this._doubleChance;
    }
    set doubleChance(value) {
        this._doubleChance = clampValue(value, 0, 100);
    }
    get presChance() {
        return this._presChance;
    }
    set presChance(value) {
        this._presChance = clampValue(value, 0, 80);
    }
    get costReduction() {
        return this._costReduction;
    }
    set costReduction(value) {
        this._costReduction = clampValue(value, 0, 80);
    }
    get increasedQuant() {
        return this._increasedQuant;
    }
    set increasedQuant(value) {
        this._increasedQuant = value;
    }
    get additionalResourceChance() {
        return this._additionalResourceChance;
    }
    set additionalResourceChance(value) {
        this._additionalResourceChance = clampValue(value, 0, 100);
    }
    get extraDoubleChance() {
        return this._extraDoubleChance;
    }
    set extraDoubleChance(value) {
        this._extraDoubleChance = clampValue(value, 0, 100);
    }
    setAllBonuses(intervalReduction, intervalReductionFlat, doubleChance, presChance, costReduction, increasedQuant, additionalResourceChance, extraDoubleChance) {
        this.intervalReduction = intervalReduction;
        this.intervalReductionFlat = intervalReductionFlat;
        this.doubleChance = doubleChance;
        this.presChance = presChance;
        this.costReduction = costReduction;
        this.increasedQuant = increasedQuant;
        this.additionalResourceChance = additionalResourceChance;
        this.extraDoubleChance = extraDoubleChance;
    }
}
//# sourceMappingURL=tests.js.map
checkFileVersion('?12097')