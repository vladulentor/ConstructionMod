"use strict";
class Monster extends NamespacedObject {
    /* #endregion */
    constructor(namespace, data, game) {
        super(namespace, data.id);
        this.specialAttacks = [];
        this.combatEffects = [];
        this.currencyDrops = [];
        this.barrierPercent = 0;
        /* #region GameEventEmitter Boilerplate */
        this._events = mitt();
        this.on = this._events.on;
        this.off = this._events.off;
        this.emit = this._events.emit;
        try {
            this._media = data.media;
            if (data.mediaAnimation !== undefined)
                this._mediaAnimation = data.mediaAnimation;
            this.levels = Object.assign({
                Corruption: 0
            }, data.levels);
            this.equipmentStats = game.getEquipStatsFromData(data.equipmentStats);
            this.ignoreCompletion = data.ignoreCompletion;
            this.attackType = data.attackType;
            data.specialAttacks.forEach((attackID, i) => {
                var _a, _b;
                const attack = game.specialAttacks.getObjectSafe(attackID);
                const chance = (_b = (_a = data.overrideSpecialChances) === null || _a === void 0 ? void 0 : _a[i]) !== null && _b !== void 0 ? _b : attack.defaultChance;
                this.specialAttacks.push({
                    attack,
                    chance
                });
            });
            if (data.combatEffects !== undefined)
                this.combatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(data.combatEffects);
            this.passives = game.combatPassives.getArrayFromIds(data.passives);
            this.lootChance = data.lootChance;
            this.lootTable = new DropTable(game, data.lootTable);
            if (data.currencyDrops)
                this.currencyDrops = data.currencyDrops.map(({
                    currencyID,
                    min,
                    max
                }) => {
                    return {
                        currency: game.currencies.getObjectSafe(currencyID),
                        min,
                        max
                    };
                });
            // TODO_D - deprecated property support
            if (data.gpDrops) {
                this.currencyDrops.push({
                    currency: game.gp,
                    min: data.gpDrops.min,
                    max: data.gpDrops.max
                });
            }
            if (data.bones !== undefined) {
                this.bones = {
                    item: game.items.getObjectSafe(data.bones.itemID),
                    quantity: data.bones.quantity,
                };
            }
            this.canSlayer = data.canSlayer;
            this.isBoss = data.isBoss;
            this.selectedSpell = game.attackSpells.getObjectSafe(data.selectedSpell);
            this._description = data.description;
            this._name = data.name;
            this.hasDescription = data.description !== undefined;
            if (data.pet !== undefined) {
                this.pet = {
                    pet: game.pets.getObjectSafe(data.pet.id),
                    kills: data.pet.quantity,
                };
            }
            if (data.barrierPercent !== undefined)
                this.barrierPercent = data.barrierPercent;
            if (data.damageType !== undefined) {
                this.damageType = game.damageTypes.getObjectSafe(data.damageType);
            } else
                this.damageType = game.normalDamage;
        } catch (e) {
            throw new DataConstructionError(Monster.name, e, this.id);
        }
    }
    get media() {
        if (this._mediaAnimation !== undefined)
            return this.getMediaURL(this._mediaAnimation);
        return this.getMediaURL(this._media);
    }
    get corruptedMedia() {
        const split = this._media.split('/');
        const filename = split[split.length - 1];
        const dotIndex = filename.lastIndexOf('.');
        if (dotIndex !== -1) {
            // Check if there's an extension
            split[split.length - 1] = filename.substring(0, dotIndex) + '_C' + filename.substring(dotIndex);
        } else {
            split[split.length - 1] = filename + '_C'; // In case there's no extension
        }
        return this.getMediaURL(split.join('/'));
    }
    get name() {
        if (this.isModded || this.localID.includes('Lemon') || this.localID.includes('Carrot')) {
            return this._name;
        } else {
            return getLangString(`MONSTER_NAME_${this.localID}`);
        }
    }
    get englishName() {
        return this._name;
    }
    get wikiName() {
        return replaceAll(this._name, ' ', '_');
    }
    get description() {
        if (this._description === undefined)
            return '';
        if (this.isModded) {
            return this._description;
        } else {
            return getLangString(`MONSTER_DESCRIPTION_${this.localID}`);
        }
    }
    get combatLevel() {
        const prayer = 1;
        const base = 0.25 * (this.levels.Defence + this.levels.Hitpoints + Math.floor(prayer / 2));
        const melee = 0.325 * (this.levels.Attack + this.levels.Strength);
        const range = 0.325 * Math.floor((3 * this.levels.Ranged) / 2);
        const magic = 0.325 * Math.floor((3 * this.levels.Magic) / 2);
        const levels = [melee, range, magic];
        return Math.floor(base + Math.max(...levels));
    }
    get hasBarrier() {
        return this.barrierPercent > 0;
    }
    applyDataModification(modData, game) {
        var _a, _b;
        if (modData.attackType !== undefined) {
            this.attackType = modData.attackType;
        }
        if (modData.bones !== undefined) {
            if (modData.bones === null) {
                this.bones = undefined;
            } else {
                const item = game.items.getObjectByID(modData.bones.itemID);
                if (item === undefined)
                    throw new Error(`Error modifying monster, bone with id: ${modData.bones.itemID} is not registered`);
                this.bones = {
                    item,
                    quantity: modData.bones.quantity,
                };
            }
        }
        if (modData.canSlayer !== undefined) {
            this.canSlayer = modData.canSlayer;
        }
        if (modData.equipmentStats !== undefined) {
            this.equipmentStats = game.modifyEquipStats(this.equipmentStats, modData.equipmentStats);
        }
        if (modData.currencyDrops !== undefined) {
            (_a = modData.currencyDrops.remove) === null || _a === void 0 ? void 0 : _a.forEach((id) => {
                this.currencyDrops = this.currencyDrops.filter((d) => d.currency.id === id);
            });
            (_b = modData.currencyDrops.add) === null || _b === void 0 ? void 0 : _b.forEach(({
                currencyID,
                min,
                max
            }) => {
                const currency = game.currencies.getObjectByID(currencyID);
                if (currency === undefined)
                    throw new Error(`Error modifying monster, currency with id ${currencyID} is not registered`);
                const currentDrop = this.currencyDrops.find((d) => d.currency === currency);
                if (currentDrop !== undefined) {
                    if (min)
                        currentDrop.min = min;
                    if (max)
                        currentDrop.max = max;
                } else {
                    if (min === undefined || max === undefined)
                        throw new Error(`Error modifying monster, min and max must be defined to add new currency drop.`);
                    this.currencyDrops.push({
                        currency,
                        min,
                        max
                    });
                }
            });
        }
        // TODO_D - deprecated property support
        if (modData.gpDrops !== undefined) {
            const currentDrop = this.currencyDrops.find((d) => (d.currency = game.gp));
            if (currentDrop !== undefined) {
                if (modData.gpDrops.min !== undefined) {
                    currentDrop.min = modData.gpDrops.min;
                }
                if (modData.gpDrops.max !== undefined) {
                    currentDrop.max = modData.gpDrops.max;
                }
            }
        }
        if (modData.isBoss !== undefined) {
            this.isBoss = modData.isBoss;
        }
        if (modData.levels !== undefined) {
            if (modData.levels.Attack) {
                this.levels.Attack = modData.levels.Attack;
            }
            if (modData.levels.Strength) {
                this.levels.Strength = modData.levels.Strength;
            }
            if (modData.levels.Defence) {
                this.levels.Defence = modData.levels.Defence;
            }
            if (modData.levels.Hitpoints) {
                this.levels.Hitpoints = modData.levels.Hitpoints;
            }
            if (modData.levels.Ranged) {
                this.levels.Ranged = modData.levels.Ranged;
            }
            if (modData.levels.Magic) {
                this.levels.Magic = modData.levels.Magic;
            }
        }
        if (modData.lootChance !== undefined) {
            this.lootChance = modData.lootChance;
        }
        if (modData.lootTable !== undefined) {
            if (modData.lootTable.remove !== undefined) {
                this.lootTable.unregisterDrops(modData.lootTable.remove);
            }
            if (modData.lootTable.add !== undefined) {
                this.lootTable.registerDrops(game, modData.lootTable.add);
            }
        }
        if (modData.passives !== undefined) {
            if (modData.passives.remove !== undefined) {
                modData.passives.remove.forEach((passiveID) => {
                    const passiveIndex = this.passives.findIndex((s) => s.id === passiveID);
                    if (passiveIndex < 0) {
                        console.warn(`Warning when removing passive from monster, passive with ID: ${passiveID} does not exist in the monster's passives.`);
                        return;
                    }
                    this.passives.splice(passiveIndex, 1);
                });
            }
            if (modData.passives.add !== undefined) {
                modData.passives.add.forEach((passiveID) => {
                    const passive = game.combatPassives.getObjectByID(passiveID);
                    if (passive === undefined)
                        throw new Error(`Error modifying monster, combat passive with id :${passiveID} is not registered.`);
                    this.passives.push(passive);
                });
            }
        }
        if (modData.pet !== undefined) {
            if (modData.pet === null) {
                this.pet = undefined;
            } else {
                const pet = game.pets.getObjectByID(modData.pet.id);
                if (pet === undefined)
                    throw new Error(`Error modifying monster, pet with id: ${modData.pet.id} is not registered.`);
                this.pet = {
                    pet,
                    kills: modData.pet.quantity,
                };
            }
        }
        if (modData.selectedSpell !== undefined) {
            const spell = game.attackSpells.getObjectByID(modData.selectedSpell);
            if (spell === undefined)
                throw new Error(`Error modifying monster, attack spell with id: ${modData.selectedSpell} is not registered.`);
            this.selectedSpell = spell;
        }
        if (modData.specialAttacks !== undefined) {
            if (modData.specialAttacks.remove !== undefined) {
                modData.specialAttacks.remove.forEach((attackID) => {
                    const attackIndex = this.specialAttacks.findIndex((s) => s.attack.id === attackID);
                    if (attackIndex < 0) {
                        console.warn(`Warning when removing special attack from monster, attack with ID: ${attackID} does not exist in the monster's special attacks.`);
                        return;
                    }
                    this.specialAttacks.splice(attackIndex, 1);
                });
            }
            if (modData.specialAttacks.add !== undefined) {
                modData.specialAttacks.add.forEach(({
                    attackID,
                    chance
                }) => {
                    const attack = game.specialAttacks.getObjectByID(attackID);
                    if (attack === undefined)
                        throw new Error(`Error modifying monster, attack with id: ${attackID} is not registered`);
                    if (chance === undefined)
                        chance = attack.defaultChance;
                    this.specialAttacks.push({
                        attack,
                        chance
                    });
                });
            }
        }
        if (modData.combatEffects !== undefined)
            game.modifyCombatEffectApplicators(this.combatEffects, modData.combatEffects, Monster.name);
    }
    overrideMedia(media) {
        if (!this.localID.includes('Lemon') && !this.localID.includes('Carrot'))
            this._media = media;
    }
}
class DummyMonster extends Monster {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            name: '',
            media: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
            levels: {
                Hitpoints: 0,
                Attack: 0,
                Strength: 0,
                Defence: 0,
                Ranged: 0,
                Magic: 0,
                Corruption: 0,
            },
            equipmentStats: [],
            ignoreCompletion: true,
            attackType: 'melee',
            specialAttacks: [],
            passives: [],
            lootChance: 0,
            lootTable: [],
            canSlayer: false,
            isBoss: false,
            selectedSpell: "melvorD:WindStrike" /* AttackSpellIDs.WindStrike */ ,
        }, game);
    }
}
class GolbinMonster extends Monster {
    get name() {
        return this._name;
    }
}
//# sourceMappingURL=monsters.js.map
checkFileVersion('?12097')