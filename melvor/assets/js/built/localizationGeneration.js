"use strict";
var __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new(P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }

        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }

        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const missingLangStrings = {};
let englishLangJson;

function addMissingLangString(identifier, langString) {
    if (identifier in englishLangJson)
        return;
    langString = replaceAll(langString, '(value) => `', '');
    langString = replaceAll(langString, '`', '');
    langString = replaceAll(langString, '() => ', '');
    langString = replaceAll(langString, 'Max ', 'Maximum ');
    langString = replaceAll(langString, 'Min ', 'Minimum ');
    langString = replaceAll(langString, ' HP', ' Hitpoints');
    missingLangStrings[identifier] = langString;
}

function getMissingLanguageStrings() {
    return __awaiter(this, void 0, void 0, function*() {
        englishLangJson = yield fetchLanguageJSON('en');
        addMissingModifierStrings();
        addMissingLoreStrings();
        // Data package translations
        const fetchData = function(url) {
            return __awaiter(this, void 0, void 0, function*() {
                const headers = new Headers();
                headers.append('Content-Type', 'application/json');
                const response = yield fetch(url, {
                    method: 'GET',
                    headers,
                });
                if (!response.ok)
                    throw new Error(`Could not fetch data package with URL: ${url}`);
                const dataPackage = (yield response.json());
                return dataPackage;
            });
        };
        addMissingStringsFromDataPackage(yield fetchData(`assets/data/melvorDemo.json?${DATA_VERSION}`));
        addMissingStringsFromDataPackage(yield fetchData(`assets/data/melvorFull.json?${DATA_VERSION}`));
        addMissingStringsFromDataPackage(yield fetchData(`assets/data/melvorTotH.json?${DATA_VERSION}`));
        addMissingStringsFromDataPackage(yield fetchData(`assets/data/melvorExpansion2.json?${DATA_VERSION}`));
        addMissingStringsFromDataPackage(yield fetchData(`assets/data/melvorAprilFools2024.json?${DATA_VERSION}`));
        addMissingStringsFromDataPackage(yield fetchData(`assets/data/melvorItA.json?${DATA_VERSION}`));
        const csv = yield convertMissingStringsToCSV();
        downloadTextFile('missingStrings.csv', csv, 'data:text/csv');
    });
}

function formatStringForCSV(text) {
    text = replaceAll(text, `"`, `""`);
    if (text.includes(`"`) || text.includes(','))
        text = `"${text}"`;
    return text;
}

function buildCSVFile(headers, rows) {
    let fileText = `${headers.map(formatStringForCSV).join(',')}\n`;
    rows.forEach((row, i) => {
        if (row.length !== headers.length)
            throw new Error(`Error building CSV file, row ${i} has length ${row.length} that does not match headder ${headers.length}`);
        fileText += `${row.map(formatStringForCSV).join(',')}\n`;
    });
    return fileText;
}

function convertMissingStringsToCSV() {
    return __awaiter(this, void 0, void 0, function*() {
        const headers = ['identifier', ...LANGS.filter((lang) => lang !== 'lemon' && lang !== 'carrot')];
        const rows = [];
        Object.entries(missingLangStrings).forEach(([identifier, enString]) => {
            const row = headers.map((header) => {
                if (header === 'identifier')
                    return identifier;
                if (header === 'en')
                    return enString;
                return '';
            });
            rows.push(row);
        });
        return buildCSVFile(headers, rows);
    });
}

function addMissingLoreStrings() {
    for (let i = 0; i < LORE.length; i++) {
        let j = 0;
        while (j < 40) {
            if (loadedLangJson[`LORE_PARAGRAPH_${i}_${j}`] === undefined)
                break;
            else
                addMissingLangString(`LORE_PARAGRAPH_${i}_${j}`, getLangString(`LORE_PARAGRAPH_${i}_${j}`));
            j++;
        }
    }
}

function addMissingModifierStrings() {
    // TODO_MR Refactor to work with modifiers contained within data files
}

function addMissingStringsFromDataPackage(dataPackage) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
    const getLocalID = (fullID) => fullID.split(':')[1];
    const gameData = dataPackage.data;
    if (gameData === undefined)
        return;
    (_a = gameData.pages) === null || _a === void 0 ? void 0 : _a.forEach((pageData) => {
        var _a;
        if (pageData.customName !== undefined)
            addMissingLangString(`PAGE_NAME_${pageData.id}`, pageData.customName);
        (_a = pageData.sidebarSubItems) === null || _a === void 0 ? void 0 : _a.forEach((subItem, i) => {
            if (subItem.name !== undefined)
                addMissingLangString(`PAGE_NAME_${pageData.id}_SUBCATEGORY_${i}`, subItem.name);
        });
    });
    (_b = gameData.tutorialStages) === null || _b === void 0 ? void 0 : _b.forEach((stageData) => {
        addMissingLangString(`TUTORIAL_TASK_NAME_${stageData.id}`, stageData.name);
        addMissingLangString(`TUTORIAL_TASK_DESC_${stageData.id}`, stageData.description);
        stageData.tasks.forEach((taskData, j) => {
            addMissingLangString(`TUTORIAL_TASK_${stageData.id}_${j}`, taskData.description);
        });
    });
    (_c = gameData.combatPassives) === null || _c === void 0 ? void 0 : _c.forEach((passiveData) => {
        if (passiveData.name !== '')
            addMissingLangString(`PASSIVES_NAME_${passiveData.id}`, passiveData.name);
        if (passiveData.customDescription !== undefined)
            addMissingLangString(`PASSIVES_DESC_${passiveData.id}`, passiveData.customDescription);
    });
    (_d = gameData.standardSpells) === null || _d === void 0 ? void 0 : _d.forEach((spellData) => {
        addMissingLangString(`MAGIC_SPELL_NAME_${spellData.id}`, spellData.name);
    });
    (_e = gameData.curseSpells) === null || _e === void 0 ? void 0 : _e.forEach((spellData) => {
        addMissingLangString(`MAGIC_CURSE_NAME_${spellData.id}`, spellData.name);
    });
    (_f = gameData.auroraSpells) === null || _f === void 0 ? void 0 : _f.forEach((spellData) => {
        addMissingLangString(`MAGIC_AURORA_NAME_${spellData.id}`, spellData.name);
    });
    (_g = gameData.ancientSpells) === null || _g === void 0 ? void 0 : _g.forEach((spellData) => {
        addMissingLangString(`MAGIC_ANCIENT_NAME_${spellData.id}`, spellData.name);
    });
    (_h = gameData.archaicSpells) === null || _h === void 0 ? void 0 : _h.forEach((spellData) => {
        addMissingLangString(`MAGIC_ARCHAIC_NAME_${spellData.id}`, spellData.name);
    });
    (_j = gameData.combatTriangleSets) === null || _j === void 0 ? void 0 : _j.forEach((triangleData) => {
        addMissingLangString(`COMBAT_TRIANGLE_NAME_${triangleData.id}`, triangleData.name);
    });
    (_k = gameData.combatAreas) === null || _k === void 0 ? void 0 : _k.forEach((areaData) => {
        addMissingLangString(`COMBAT_AREA_NAME_${areaData.id}`, areaData.name);
    });
    (_l = gameData.combatAreaCategories) === null || _l === void 0 ? void 0 : _l.forEach((areaData) => {
        addMissingLangString(`COMBAT_AREA_CATEGORY_${areaData.id}`, areaData.name);
    });
    (_m = gameData.slayerAreas) === null || _m === void 0 ? void 0 : _m.forEach((areaData) => {
        addMissingLangString(`SLAYER_AREA_NAME_${areaData.id}`, areaData.name);
        if (areaData.areaEffectDescription !== undefined)
            addMissingLangString(`SLAYER_AREA_EFFECT_${areaData.id}`, areaData.areaEffectDescription);
    });
    (_o = gameData.dungeons) === null || _o === void 0 ? void 0 : _o.forEach((dungeonData) => {
        addMissingLangString(`DUNGEON_NAME_${dungeonData.id}`, dungeonData.name);
    });
    (_p = gameData.strongholds) === null || _p === void 0 ? void 0 : _p.forEach((strongholdData) => {
        addMissingLangString(`STRONGHOLD_NAME_${strongholdData.id}`, strongholdData.name);
    });
    (_q = gameData.gamemodes) === null || _q === void 0 ? void 0 : _q.forEach((gamemodeData) => {
        addMissingLangString(`GAMEMODES_GAMEMODE_NAME_${gamemodeData.id}`, gamemodeData.name);
        if (gamemodeData.description !== undefined)
            addMissingLangString(`GAMEMODES_GAMEMODE_DESC_${gamemodeData.id}`, gamemodeData.description);
        gamemodeData.rules.forEach((ruleString, i) => {
            addMissingLangString(`GAMEMODES_GAMEMODE_RULES_${gamemodeData.id}_${i}`, ruleString);
        });
    });
    (_r = gameData.prayers) === null || _r === void 0 ? void 0 : _r.forEach((prayerData) => {
        addMissingLangString(`PRAYER_PRAYER_NAME_${prayerData.id}`, prayerData.name);
    });
    (_s = gameData.damageTypes) === null || _s === void 0 ? void 0 : _s.forEach((damageTypeData) => {
        addMissingLangString(`DAMAGE_TYPE_${damageTypeData.id}`, damageTypeData.name);
        addMissingLangString(`DAMAGE_TYPE_RESISTANCE_${damageTypeData.id}`, damageTypeData.resistanceName);
    });
    (_t = gameData.attacks) === null || _t === void 0 ? void 0 : _t.forEach((attackData) => {
        addMissingLangString(`SPECIAL_ATTACK_NAME_${attackData.id}`, attackData.name);
        addMissingLangString(`SPECIAL_ATTACK_${attackData.id}`, attackData.description);
    });
    (_u = gameData.realms) === null || _u === void 0 ? void 0 : _u.forEach((realmData) => {
        addMissingLangString(`REALM_NAME_${realmData.id}`, realmData.name);
    });
    (_v = gameData.items) === null || _v === void 0 ? void 0 : _v.forEach((itemData) => {
        addMissingLangString(`ITEM_NAME_${itemData.id}`, itemData.name);
        if (itemData.customDescription !== undefined)
            addMissingLangString(`ITEM_DESCRIPTION_${itemData.id}`, itemData.customDescription);
    });
    (_w = gameData.monsters) === null || _w === void 0 ? void 0 : _w.forEach((monsterData) => {
        addMissingLangString(`MONSTER_NAME_${monsterData.id}`, monsterData.name);
        if (monsterData.description !== undefined)
            addMissingLangString(`MONSTER_DESCRIPTION_${monsterData.id}`, monsterData.description);
    });
    (_x = gameData.pets) === null || _x === void 0 ? void 0 : _x.forEach((petData) => {
        addMissingLangString(`PET_NAME_${petData.id}`, petData.name);
    });
    (_y = gameData.shopPurchases) === null || _y === void 0 ? void 0 : _y.forEach((purchaseData) => {
        if (purchaseData.customName !== undefined)
            addMissingLangString(`SHOP_NAME_${purchaseData.id}`, purchaseData.customName);
        if (purchaseData.customDescription !== undefined)
            addMissingLangString(`SHOP_DESCRIPTION_${purchaseData.id}`, purchaseData.customDescription);
    });
    (_z = gameData.lore) === null || _z === void 0 ? void 0 : _z.forEach((loreData) => {
        addMissingLangString(`LORE_TITLE_${loreData.id}`, loreData.title);
    });
    (_0 = gameData.slayerTaskCategories) === null || _0 === void 0 ? void 0 : _0.forEach((data) => {
        addMissingLangString(`SLAYER_TASK_CATEGORY_${data.id}`, data.name);
        addMissingLangString(`TOASTS_SLAYER_TASK_REQUIRED_${data.id}`, data.reqToast);
        addMissingLangString(`MENU_TEXT_REQUIRES_SLAYER_${data.id}`, data.reqText);
        addMissingLangString(`MENU_TEXT_UNLOCK_SLAYER_${data.id}`, data.unlockText);
        addMissingLangString(`MENU_TEXT_COMPLETED_SLAYER_TASK_${data.id}`, data.completionText);
    });
    (_1 = gameData.equipmentSlots) === null || _1 === void 0 ? void 0 : _1.forEach((data) => {
        addMissingLangString(`EQUIP_SLOT_${data.id}`, data.emptyName);
    });
    (_2 = gameData.skillData) === null || _2 === void 0 ? void 0 : _2.forEach((skillData) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
        switch (skillData.skillID) {
            case "melvorD:Woodcutting" /* SkillIDs.Woodcutting */ :
                (_a = skillData.data.trees) === null || _a === void 0 ? void 0 : _a.forEach((treeData) => {
                    addMissingLangString(`TREE_NAME_${treeData.id}`, treeData.name);
                });
                break;
            case "melvorD:Fishing" /* SkillIDs.Fishing */ :
                (_b = skillData.data.areas) === null || _b === void 0 ? void 0 : _b.forEach((areaData) => {
                    addMissingLangString(`FISHING_AREA_NAME_${areaData.id}`, areaData.name);
                    if (areaData.description !== undefined)
                        addMissingLangString(`FISHING_AREA_DESCRIPTION_${areaData.id}`, areaData.description);
                });
                break;
            case "melvorD:Mining" /* SkillIDs.Mining */ :
                (_c = skillData.data.rockData) === null || _c === void 0 ? void 0 : _c.forEach((rockData) => {
                    addMissingLangString(`ORE_NAME_${rockData.id}`, rockData.name);
                });
                break;
            case "melvorD:Smithing" /* SkillIDs.Smithing */ :
                (_d = skillData.data.categories) === null || _d === void 0 ? void 0 : _d.forEach((categoryData) => {
                    addMissingLangString(`SKILL_CATEGORY_Smithing_${categoryData.id}`, categoryData.name);
                });
                break;
            case "melvorD:Thieving" /* SkillIDs.Thieving */ :
                (_e = skillData.data.npcs) === null || _e === void 0 ? void 0 : _e.forEach((npcData) => {
                    addMissingLangString(`THIEVING_NPC_NAME_${npcData.id}`, npcData.name);
                });
                (_f = skillData.data.areas) === null || _f === void 0 ? void 0 : _f.forEach((areaData) => {
                    addMissingLangString(`THIEVING_AREA_NAME_${areaData.id}`, areaData.name);
                });
                break;
            case "melvorD:Farming" /* SkillIDs.Farming */ :
                (_g = skillData.data.categories) === null || _g === void 0 ? void 0 : _g.forEach((categoryData) => {
                    addMissingLangString(`SKILL_CATEGORY_Farming_${categoryData.id}`, categoryData.name);
                    addMissingLangString(`SKILL_CATEGORY_Farming_${categoryData.id}_singular`, categoryData.singularName);
                    addMissingLangString(`SKILL_CATEGORY_Farming_${categoryData.id}_description`, categoryData.description);
                    addMissingLangString(`SKILL_CATEGORY_Farming_${categoryData.id}_seedNotice`, categoryData.seedNotice);
                });
                break;
            case "melvorD:Fletching" /* SkillIDs.Fletching */ :
                (_h = skillData.data.categories) === null || _h === void 0 ? void 0 : _h.forEach((categoryData) => {
                    addMissingLangString(`SKILL_CATEGORY_Fletching_${categoryData.id}`, categoryData.name);
                });
                break;
            case "melvorD:Crafting" /* SkillIDs.Crafting */ :
                (_j = skillData.data.categories) === null || _j === void 0 ? void 0 : _j.forEach((categoryData) => {
                    addMissingLangString(`SKILL_CATEGORY_Crafting_${categoryData.id}`, categoryData.name);
                });
                break;
            case "melvorD:Herblore" /* SkillIDs.Herblore */ :
                (_k = skillData.data.categories) === null || _k === void 0 ? void 0 : _k.forEach((categoryData) => {
                    addMissingLangString(`SKILL_CATEGORY_Herblore_${categoryData.id}`, categoryData.name);
                });
                (_l = skillData.data.recipes) === null || _l === void 0 ? void 0 : _l.forEach((recipeData) => {
                    addMissingLangString(`POTION_NAME_${recipeData.id}`, recipeData.name);
                });
                break;
            case "melvorD:Runecrafting" /* SkillIDs.Runecrafting */ :
                (_m = skillData.data.categories) === null || _m === void 0 ? void 0 : _m.forEach((categoryData) => {
                    addMissingLangString(`SKILL_CATEGORY_Runecrafting_${categoryData.id}`, categoryData.name);
                });
                break;
            case "melvorD:Summoning" /* SkillIDs.Summoning */ :
                (_o = skillData.data.categories) === null || _o === void 0 ? void 0 : _o.forEach((categoryData) => {
                    addMissingLangString(`SKILL_CATEGORY_Summoning_${categoryData.id}`, categoryData.name);
                });
                (_p = skillData.data.synergies) === null || _p === void 0 ? void 0 : _p.forEach((synergyData) => {
                    if (synergyData.customDescription === undefined)
                        return;
                    addMissingLangString(`SUMMONING_SYNERGY_DESC_${getLocalID(synergyData.summonIDs[0])}_${getLocalID(synergyData.summonIDs[1])}`, synergyData.customDescription);
                });
                break;
            case "melvorD:Agility" /* SkillIDs.Agility */ :
                (_q = skillData.data.obstacles) === null || _q === void 0 ? void 0 : _q.forEach((obstacleData) => {
                    addMissingLangString(`AGILITY_OBSTACLE_NAME_${obstacleData.id}`, obstacleData.name);
                });
                (_r = skillData.data.pillars) === null || _r === void 0 ? void 0 : _r.forEach((pillarData) => {
                    addMissingLangString(`AGILITY_PILLAR_NAME_${pillarData.id}`, pillarData.name);
                });
                break;
            case "melvorD:Astrology" /* SkillIDs.Astrology */ :
                (_s = skillData.data.recipes) === null || _s === void 0 ? void 0 : _s.forEach((actionData) => {
                    addMissingLangString(`ASTROLOGY_NAME_${actionData.id}`, actionData.name);
                });
                break;
            case "melvorD:Magic" /* SkillIDs.Magic */ :
                (_t = skillData.data.altSpells) === null || _t === void 0 ? void 0 : _t.forEach((spellData) => {
                    addMissingLangString(`MAGIC_ALTMAGIC_NAME_${spellData.id}`, spellData.name);
                    if (!((spellData.produces === 'Bar' &&
                                (spellData.specialCost.type === 'BarIngredientsWithCoal' ||
                                    spellData.specialCost.type === 'BarIngredientsWithoutCoal')) ||
                            (spellData.produces === 'GP' && spellData.specialCost.type === 'AnyItem') ||
                            (game.items.getObjectByID(spellData.produces) instanceof BoneItem &&
                                spellData.fixedItemCosts !== undefined &&
                                spellData.fixedItemCosts.length === 1)))
                        addMissingLangString(`MAGIC_ALTMAGIC_DESC_${spellData.id}`, spellData.description);
                });
                break;
            case "melvorD:Township" /* SkillIDs.Township */ :
                (_u = skillData.data.resources) === null || _u === void 0 ? void 0 : _u.forEach((resource) => {
                    addMissingLangString(`TOWNSHIP_RESOURCE_${resource.id}`, resource.name);
                });
                (_v = skillData.data.buildings) === null || _v === void 0 ? void 0 : _v.forEach((building) => {
                    addMissingLangString(`TOWNSHIP_BUILDING_${building.id}`, building.name);
                });
                (_w = skillData.data.biomes) === null || _w === void 0 ? void 0 : _w.forEach((biome) => {
                    addMissingLangString(`TOWNSHIP_BIOME_${biome.id}`, biome.name);
                });
                break;
            case "melvorItA:Corruption" /* SkillIDs.Corruption */ :
                (_x = skillData.data.corruptionEffects) === null || _x === void 0 ? void 0 : _x.forEach((effectData) => {
                    addMissingLangString(`CORRUPTION_EFFECT_${replaceAll(effectData.effectID, 'melvorItA:', '')}`, effectData.customDescription);
                });
                break;
            case "melvorItA:Harvesting" /* SkillIDs.Harvesting */ :
                (_y = skillData.data.veinData) === null || _y === void 0 ? void 0 : _y.forEach((veinData) => {
                    addMissingLangString(`HARVESTING_VEIN_${veinData.id}`, veinData.name);
                });
                break;
        }
    });
}
//# sourceMappingURL=localizationGeneration.js.map
checkFileVersion('?12097')