"use strict";
/** Base class for items in the game */
class Item extends NamespacedObject {
    /* #endregion */
    constructor(namespace, data, game) {
        super(namespace, data.id);
        /* #region GameEventEmitter Boilerplate */
        this._events = mitt();
        this.on = this._events.on;
        this.off = this._events.off;
        this.emit = this._events.emit;
        try {
            this._name = data.name;
            this._customDescription = data.customDescription;
            this.category = data.category;
            this.type = data.type;
            this._media = data.media;
            this.ignoreCompletion = data.ignoreCompletion;
            this.obtainFromItemLog = data.obtainFromItemLog;
            this.golbinRaidExclusive = data.golbinRaidExclusive;
            if (data.mediaAnimation !== undefined)
                this._mediaAnimation = data.mediaAnimation;
            if (data.altMedia !== undefined)
                this._altMedia = data.altMedia;
            let currency = game.gp;
            if (data.sellsForCurrency !== undefined) {
                currency = game.currencies.getObjectSafe(data.sellsForCurrency);
            }
            this.sellsFor = {
                currency,
                quantity: data.sellsFor,
            };
            if (data.isArtefact !== undefined)
                this._isArtefact = data.isArtefact;
            if (data.isGenericArtefact !== undefined)
                this._isGenericArtefact = data.isGenericArtefact;
            this.modQuery = new ModifierQuery({
                item: this
            });
        } catch (e) {
            throw new DataConstructionError(Item.name, e, this.id);
        }
    }
    get nameFromData() {
        return this._name;
    }
    get descriptionFromData() {
        var _a;
        return (_a = this._customDescription) !== null && _a !== void 0 ? _a : '';
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`ITEM_NAME_${this.localID}`);
        }
    }
    get englishName() {
        return this._name;
    }
    get wikiName() {
        return replaceAll(this._name, ' ', '_');
    }
    /** Image URL*/
    get media() {
        if (this._mediaAnimation !== undefined)
            return this.getMediaURL(this._mediaAnimation);
        return this.getMediaURL(this._media);
    }
    /** Alternative image URL, if one is present, otherwise defaults to media */
    get altMedia() {
        if (this._altMedia !== undefined)
            return this.getMediaURL(this._altMedia);
        return this.media;
    }
    get description() {
        if (this._customDescription !== undefined) {
            if (this.isModded) {
                return this._customDescription;
            } else {
                return getLangString(`ITEM_DESCRIPTION_${this.localID}`);
            }
        }
        return !this.isArtefact ? getLangString('BANK_STRING_38') : '';
    }
    get modifiedDescription() {
        if (this._modifiedDescription !== undefined)
            return this._modifiedDescription;
        let desc = applyDescriptionModifications(this.description);
        if (this.isArtefact) {
            desc += desc.length > 0 ? '<br>' : '';
            desc += `${this.artefactSizeAndLocation}`;
        }
        if (this.isGenericArtefact && setLang == 'en') {
            desc += desc.length > 0 ? '<br>' : '';
            desc += `This is a Generic Artefact.`;
        }
        this._modifiedDescription = desc;
        return this._modifiedDescription;
    }
    get artefactSizeAndLocation() {
        var _a;
        if (this.isArtefact) {
            const typeLocation = (_a = game.archaeology) === null || _a === void 0 ? void 0 : _a.getArtefactTypeAndLocationFromCache(this);
            if (typeLocation !== undefined) {
                return templateLangString('LOCATED_FROM_DIG_SITE', {
                    size: getLangString(`ARCHAEOLOGY_ARTEFACT_SIZE_${typeLocation.size}`),
                    digSite: typeLocation.digSite.name,
                });
            }
        }
        return '';
    }
    get hasDescription() {
        return this._customDescription !== undefined;
    }
    get isArtefact() {
        var _a;
        return (_a = this._isArtefact) !== null && _a !== void 0 ? _a : false;
    }
    get isGenericArtefact() {
        var _a;
        return (_a = this._isGenericArtefact) !== null && _a !== void 0 ? _a : false;
    }
    applyDataModification(modData, game) {
        if (modData.category !== undefined) {
            this.category = modData.category;
        }
        if (modData.obtainFromItemLog !== undefined) {
            this.obtainFromItemLog = modData.obtainFromItemLog;
        }
        if (modData.sellsFor !== undefined) {
            this.sellsFor.quantity = modData.sellsFor;
        }
        if (modData.type !== undefined) {
            this.type = modData.type;
        }
    }
    overrideMedia(media) {
        this._media = media;
    }
}
/** Dummy items used for placeholders for official game content that is not registered */
class DummyItem extends Item {
    get name() {
        return 'Unknown Item.';
    }
    get description() {
        return 'An unknown item.';
    }
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            name: '',
            category: '',
            type: '',
            media: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
            ignoreCompletion: true,
            obtainFromItemLog: false,
            golbinRaidExclusive: false,
            sellsFor: 0,
        }, game);
    }
}
/** Item which can be equipped to the player */
class EquipmentItem extends Item {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        /** Items that this item is not allowed to be equipped with. */
        this.cantEquipWith = [];
        /** Requirements for equipping the item */
        this.equipRequirements = [];
        /** Conditional modifiers provided by the item */
        this.conditionalModifiers = [];
        /** Special attacks provided by the item */
        this.specialAttacks = [];
        /** Runes that are provided by the item */
        this.providedRunes = [];
        /** Determines the priority of losing this item to the death penalty. Lower priority is lost before other items. */
        this.deathPenaltyPriority = 0;
        try {
            this.tier = data.tier;
            this.validSlots = game.getEquipmentSlotsFromData(data.validSlots);
            this.occupiesSlots = game.getEquipmentSlotsFromData(data.occupiesSlots);
            if (data.cantEquipWith !== undefined) {
                this.cantEquipWith = data.cantEquipWith.map((id) => {
                    const item = game.items.equipment.getObjectSafe(id);
                    item.cantEquipWith.push(this);
                    return item;
                });
            }
            this.equipmentStats = game.getEquipStatsFromData(data.equipmentStats);
            if (data.specialAttacks !== undefined) {
                this.specialAttacks = game.specialAttacks.getArrayFromIds(data.specialAttacks);
            }
            if (data.combatEffects !== undefined) {
                this.combatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(data.combatEffects);
            }
            if (data.overrideSpecialChances !== undefined)
                this.overrideSpecialChances = data.overrideSpecialChances;
            if (data.providedRunes !== undefined)
                this.providedRunes = game.items.getQuantities(data.providedRunes);
            if (data.ammoType !== undefined)
                this.ammoType = AmmoTypeID[data.ammoType];
            if (data.deathPenaltyPriority !== undefined)
                this.deathPenaltyPriority = data.deathPenaltyPriority;
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(EquipmentItem.name, e, this.id);
        }
    }
    get hasDescription() {
        return (super.hasDescription ||
            this.modifiers !== undefined ||
            this.combatEffects !== undefined ||
            this.conditionalModifiers !== undefined);
    }
    get description() {
        if (super.hasDescription) {
            if (containsDisabledModifier(this.modifiers))
                return super.description + getLangString('MENU_TEXT_CONTAINS_DISABLED_MODIFIER');
            return super.description;
        }
        if (StatObject.hasStats(this)) {
            if (this.fitsInSlot("melvorD:Passive" /* EquipmentSlotIDs.Passive */ )) {
                return `${getLangString('MISC_STRING_0')} ${StatObject.formatAsPlainList(this)}`;
            } else {
                return StatObject.formatAsPlainList(this);
            }
        }
        return getLangString('BANK_STRING_38');
    }
    get modifiedDescription() {
        if (this._modifiedDescription !== undefined)
            return this._modifiedDescription;
        let desc = applyDescriptionModifications(this.description);
        if (this.isArtefact) {
            desc += desc.length > 0 ? '<br>' : '';
            desc += `${this.artefactSizeAndLocation}`;
        }
        this._modifiedDescription = desc;
        return this._modifiedDescription;
    }
    get modifiesSkillXP() {
        const modifierIDs = [
            "melvorD:skillXP" /* ModifierIDs.skillXP */ ,
            "melvorD:halveSkillXP" /* ModifierIDs.halveSkillXP */ ,
            "melvorD:altMagicSkillXP" /* ModifierIDs.altMagicSkillXP */ ,
            "melvorD:nonCombatSkillXP" /* ModifierIDs.nonCombatSkillXP */ ,
            "melvorD:archaeologyCommonItemSkillXP" /* ModifierIDs.archaeologyCommonItemSkillXP */ ,
        ];
        return this.modifiers !== undefined && this.modifiers.some((m) => modifierIDs.includes(m.modifier.id));
    }
    get modifiesAbyssalXP() {
        const modifierIDs = ["melvorD:abyssalSkillXP" /* ModifierIDs.abyssalSkillXP */ , "melvorD:abyssalCombatSkillXP" /* ModifierIDs.abyssalCombatSkillXP */ ];
        return this.modifiers !== undefined && this.modifiers.some((m) => modifierIDs.includes(m.modifier.id));
    }
    registerSoftDependencies(data, game) {
        try {
            this.equipRequirements = game.getRequirementsFromData(data.equipRequirements);
            if (data.modifiers !== undefined)
                this.modifiers = game.getModifierValuesFromData(data.modifiers);
            if (data.enemyModifiers !== undefined)
                this.enemyModifiers = game.getEnemyModifierValuesFromData(data.enemyModifiers);
            if (data.conditionalModifiers !== undefined)
                this.conditionalModifiers = data.conditionalModifiers.map((data) => new ConditionalModifier(data, game, this));
            if (data.consumesOn !== undefined)
                this.consumesOn = data.consumesOn.map((data) => game.events.constructMatcher(data));
            if (data.consumesChargesOn !== undefined)
                this.consumesChargesOn = data.consumesChargesOn.map((data) => game.events.constructMatcher(data));
            if (data.consumesItemOn !== undefined) {
                this.consumesItemOn = {
                    item: game.items.getObjectSafe(data.consumesItemOn.itemID),
                    chance: data.consumesItemOn.chance,
                    matchers: data.consumesItemOn.matchers.map((data) => game.events.constructMatcher(data)),
                };
            }
        } catch (e) {
            throw new DataConstructionError(EquipmentItem.name, e, this.id);
        }
    }
    applyDataModification(modData, game) {
        var _a;
        super.applyDataModification(modData, game);
        try {
            if (modData.ammoType !== undefined) {
                this.ammoType = modData.ammoType !== null ? AmmoTypeID[modData.ammoType] : undefined;
            }
            if (modData.conditionalModifiers !== undefined) {
                if (modData.conditionalModifiers.remove !== undefined) {
                    modData.conditionalModifiers.remove.forEach((type) => {
                        this.conditionalModifiers = this.conditionalModifiers.filter((c) => c.condition.type !== type);
                    });
                }
                if (modData.conditionalModifiers.add !== undefined) {
                    this.conditionalModifiers.push(...modData.conditionalModifiers.add.map((data) => new ConditionalModifier(data, game, this)));
                }
            }
            if (modData.enemyModifiers !== undefined) {
                const modifiers = (_a = this.enemyModifiers) !== null && _a !== void 0 ? _a : [];
                const newModifiers = game.modifyModifierValues(modifiers, modData.enemyModifiers);
                if (newModifiers.length === 0) {
                    this.enemyModifiers = undefined;
                } else {
                    this.enemyModifiers = newModifiers;
                }
            }
            if (modData.equipRequirements !== undefined) {
                if (modData.equipRequirements.remove !== undefined) {
                    modData.equipRequirements.remove.forEach((type) => (this.equipRequirements = this.equipRequirements.filter((r) => r.type !== type)));
                }
                if (modData.equipRequirements.add !== undefined) {
                    this.equipRequirements.push(...game.getRequirementsFromData(modData.equipRequirements.add));
                }
            }
            if (modData.equipmentStats !== undefined) {
                this.equipmentStats = game.modifyEquipStats(this.equipmentStats, modData.equipmentStats);
            }
            if (modData.modifiers !== undefined) {
                if (this.modifiers === undefined) {
                    if (modData.modifiers.add !== undefined)
                        this.modifiers = game.getModifierValuesFromData(modData.modifiers.add);
                } else {
                    this.modifiers = game.modifyModifierValues(this.modifiers, modData.modifiers);
                }
            }
            if (modData.occupiesSlots !== undefined) {
                if (modData.occupiesSlots.remove !== undefined) {
                    modData.occupiesSlots.remove.forEach((slotID) => {
                        slotID = game.getEquipmentSlotID(slotID);
                        this.occupiesSlots = this.occupiesSlots.filter((s) => s.id !== slotID);
                    });
                }
                if (modData.occupiesSlots.add !== undefined) {
                    this.occupiesSlots.push(...game.getEquipmentSlotsFromData(modData.occupiesSlots.add));
                }
            }
            if (modData.overrideSpecialChances !== undefined) {
                this.overrideSpecialChances =
                    modData.overrideSpecialChances !== null ? modData.overrideSpecialChances : undefined;
            }
            if (modData.providedRunes !== undefined) {
                this.providedRunes = game.items.modifyQuantities(this.providedRunes, modData.providedRunes);
            }
            if (modData.specialAttacks !== undefined) {
                if (this.overrideSpecialChances !== undefined && modData.overrideSpecialChances === undefined) {
                    throw new Error(`An item with existing special chance overrides must provide new overrides when adding or removing special attacks.`);
                }
                if (modData.specialAttacks.remove !== undefined) {
                    modData.specialAttacks.remove.forEach((id) => (this.specialAttacks = this.specialAttacks.filter((s) => s.id !== id)));
                }
                if (modData.specialAttacks.add !== undefined) {
                    this.specialAttacks.push(...game.specialAttacks.getArrayFromIds(modData.specialAttacks.add));
                }
            }
            if (modData.combatEffects !== undefined) {
                if (this.combatEffects === undefined)
                    this.combatEffects = [];
                game.modifyCombatEffectApplicators(this.combatEffects, modData.combatEffects, EquipmentItem.name);
            }
            if (modData.tier !== undefined) {
                this.tier = modData.tier;
            }
            if (modData.validSlots !== undefined) {
                if (modData.validSlots.remove !== undefined) {
                    modData.validSlots.remove.forEach((slotID) => {
                        slotID = game.getEquipmentSlotID(slotID);
                        this.validSlots = this.validSlots.filter((s) => s.id !== slotID);
                    });
                }
                if (modData.validSlots.add !== undefined) {
                    this.validSlots.push(...game.getEquipmentSlotsFromData(modData.validSlots.add));
                }
            }
            if (modData.consumesOn !== undefined) {
                if (modData.consumesOn.remove !== undefined) {
                    modData.consumesOn.remove.forEach((type) => {
                        if (this.consumesOn !== undefined)
                            this.consumesOn = this.consumesOn.filter((t) => t.type !== type);
                    });
                }
                if (modData.consumesOn.add !== undefined) {
                    if (this.consumesOn === undefined)
                        this.consumesOn = [];
                    this.consumesOn.push(...modData.consumesOn.add.map((data) => game.events.constructMatcher(data)));
                }
            }
        } catch (e) {
            throw new DataModificationError(EquipmentItem.name, e, this.id);
        }
    }
    /** If this item fits in an equipment slot with the given ID */
    fitsInSlot(slotID) {
        return this.validSlots.some((slot) => slot.id === slotID);
    }
    /** If this item occupies an equipment slot with the given ID */
    occupiesSlot(slotID) {
        return this.occupiesSlots.some((slot) => slot.id === slotID);
    }
}
class DummyEquipmentItem extends EquipmentItem {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            tier: 'dummyItem',
            name: '',
            category: '',
            type: '',
            media: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
            ignoreCompletion: true,
            obtainFromItemLog: false,
            golbinRaidExclusive: false,
            sellsFor: 0,
            validSlots: [],
            occupiesSlots: [],
            equipRequirements: [],
            equipmentStats: [],
        }, game);
    }
}
class WeaponItem extends EquipmentItem {
    constructor(namespace, itemData, game) {
        super(namespace, itemData, game);
        try {
            this.attackType = itemData.attackType;
            if (itemData.ammoTypeRequired !== undefined)
                this.ammoTypeRequired = AmmoTypeID[itemData.ammoTypeRequired];
            if (itemData.damageType !== undefined) {
                this.damageType = game.damageTypes.getObjectSafe(itemData.damageType);
            } else
                this.damageType = game.normalDamage;
        } catch (e) {
            throw new DataConstructionError(WeaponItem.name, e, this.id);
        }
    }
    applyDataModification(modData, game) {
        super.applyDataModification(modData, game);
        if (modData.attackType !== undefined) {
            this.attackType = modData.attackType;
        }
        if (modData.ammoTypeRequired !== undefined) {
            this.ammoTypeRequired = modData.ammoTypeRequired !== null ? AmmoTypeID[modData.ammoTypeRequired] : undefined;
        }
    }
}
class FoodItem extends Item {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.healsFor = data.healsFor;
        this.stats = new StatObject(data, game, `${FoodItem.name} with id "${this.id}"`);
    }
    get hasDescription() {
        return super.hasDescription || this.stats.hasStats;
    }
    get description() {
        if (super.hasDescription) {
            if (this.stats.modifiers !== undefined && containsDisabledModifier(this.stats.modifiers))
                return super.description + getLangString('MENU_TEXT_CONTAINS_DISABLED_MODIFIER');
            return super.description;
        }
        if (this.stats.hasStats) {
            return this.stats.describePlain();
        }
        return getLangString('BANK_STRING_38');
    }
    get modifiedDescription() {
        if (this._modifiedDescription !== undefined)
            return this._modifiedDescription;
        this._modifiedDescription = applyDescriptionModifications(this.description);
        return this._modifiedDescription;
    }
    applyDataModification(modData, game) {
        super.applyDataModification(modData, game);
        try {
            if (modData.healsFor !== undefined) {
                this.healsFor = modData.healsFor;
            }
            this.stats.applyDataModification(modData, game);
        } catch (e) {
            throw new DataModificationError(FoodItem.name, e, this.id);
        }
    }
}
class BoneItem extends Item {
    constructor(namespace, itemData, game) {
        super(namespace, itemData, game);
        this.prayerPoints = itemData.prayerPoints;
    }
    applyDataModification(modData, game) {
        super.applyDataModification(modData, game);
        if (modData.prayerPoints !== undefined) {
            this.prayerPoints = modData.prayerPoints;
        }
    }
}
/** Item that provides soul points that can be claimed in the bank. Functions similarly to bones. */
class SoulItem extends Item {
    constructor(namespace, itemData, game) {
        super(namespace, itemData, game);
        this.soulPoints = itemData.soulPoints;
    }
    applyDataModification(modData, game) {
        super.applyDataModification(modData, game);
        if (modData.soulPoints !== undefined) {
            this.soulPoints = modData.soulPoints;
        }
    }
}
class PotionItem extends Item {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        /** When a single charge of the potion should be consumed */
        this.consumesOn = [];
        try {
            this.stats = new StatObject(data, game, `${PotionItem.name} with id "${this.id}"`);
            this.charges = data.charges;
            this.action = game.actions.getObjectSafe(data.action);
            this.tier = data.tier;
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(PotionItem.name, e, this.id);
        }
    }
    /** The recipe this potion can be made from. Undefined if none */
    get recipe() {
        return this._recipe;
    }
    set recipe(value) {
        if (value === this._recipe)
            return;
        if (this._recipe !== undefined) {
            this.modQuery.remove({
                action: this._recipe,
                realm: this._recipe.realm,
            });
        }
        if (value !== undefined) {
            this.modQuery.add({
                action: value,
                realm: value.realm,
            });
        }
        this._recipe = value;
    }
    get hasDescription() {
        return true;
    }
    get description() {
        if (super.hasDescription) {
            if (this.stats.modifiers !== undefined && containsDisabledModifier(this.stats.modifiers))
                return super.description + getLangString('MENU_TEXT_CONTAINS_DISABLED_MODIFIER');
            return super.description;
        }
        return this.stats.describePlain();
    }
    get modifiedDescription() {
        if (this._modifiedDescription !== undefined)
            return this._modifiedDescription;
        let desc = applyDescriptionModifications(this.description);
        if (this.isArtefact) {
            desc += desc.length > 0 ? '<br>' : '';
            desc += `${this.artefactSizeAndLocation}`;
        }
        this._modifiedDescription = desc;
        return this._modifiedDescription;
    }
    registerSoftDependencies(data, game) {
        try {
            this.consumesOn = data.consumesOn.map((data) => game.events.constructMatcher(data));
        } catch (e) {
            throw new DataConstructionError(PotionItem.name, e, this.id);
        }
    }
    applyDataModification(modData, game) {
        super.applyDataModification(modData, game);
        try {
            if (modData.charges !== undefined) {
                this.charges = modData.charges;
            }
            this.stats.applyDataModification(modData, game);
        } catch (e) {
            throw new DataModificationError(PotionItem.name, e, this.id);
        }
    }
}
class ReadableItem extends Item {
    constructor(namespace, itemData, game) {
        super(namespace, itemData, game);
        if (itemData.modalID !== undefined)
            this.modalID = itemData.modalID;
        if (itemData.swalData !== undefined)
            this.swalData = itemData.swalData;
    }
    /** Fire the modal for reading the item */
    showContents() {
        if (this.modalID !== undefined) {
            const modal = document.getElementById(this.modalID);
            if (modal !== null)
                $(modal).modal('show');
            else
                console.warn(`Tried to read item with id: ${this.id}, but modal with id: ${this.modalID} is not in DOM.`);
        } else if (this.swalData !== undefined) {
            const html = createElement('div');
            html.append(getTemplateElement(this.swalData.htmlTemplateID).content.cloneNode(true));
            SwalLocale.fire({
                title: getLangString(this.swalData.title),
                html,
                imageUrl: this.media,
                imageWidth: 64,
                imageHeight: 64,
                imageAlt: this.name,
                didOpen: initializeAltText,
            });
        }
    }
}
class OpenableItem extends Item {
    constructor(namespace, itemData, game) {
        super(namespace, itemData, game);
        try {
            this.dropTable = new DropTable(game, itemData.dropTable);
            if (itemData.keyItem !== undefined)
                this.keyItem = game.items.getQuantity(itemData.keyItem);
        } catch (e) {
            throw new DataConstructionError(OpenableItem.name, e, this.id);
        }
    }
    applyDataModification(modData, game) {
        super.applyDataModification(modData, game);
        if (modData.dropTable !== undefined) {
            if (modData.dropTable.remove !== undefined) {
                this.dropTable.unregisterDrops(modData.dropTable.remove);
            }
            if (modData.dropTable.add !== undefined) {
                this.dropTable.registerDrops(game, modData.dropTable.add);
            }
        }
        if (modData.keyItem !== undefined) {
            this.keyItem = modData.keyItem !== null ? game.items.getQuantity(modData.keyItem) : undefined;
        }
    }
}
class TokenItem extends Item {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.game = game;
        try {
            this.stats = new StatObject(data, game, `${TokenItem.name} with id "${this.id}"`);
        } catch (e) {
            throw new DataConstructionError(TokenItem.name, e, this.id);
        }
    }
    get hasDescription() {
        return true;
    }
    get description() {
        if (super.hasDescription) {
            if (this.stats.modifiers !== undefined && containsDisabledModifier(this.stats.modifiers))
                return super.description + getLangString('MENU_TEXT_CONTAINS_DISABLED_MODIFIER');
            return super.description;
        }
        return this.stats.describePlain();
    }
    /** Computes the number of times the player has claimed this token */
    getTimesClaimed() {
        return this.game.stats.Items.get(this, ItemStats.TimesClaimed);
    }
    applyDataModification(modData, game) {
        super.applyDataModification(modData, game);
        try {
            this.stats.applyDataModification(modData, game);
        } catch (e) {
            throw new DataModificationError(TokenItem.name, e, this.id);
        }
    }
}
class MasteryTokenItem extends Item {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        /** If this item should be rolled for when a skill action is completed */
        this.rollInSkill = true;
        try {
            this.skill = game.masterySkills.getObjectSafe(data.skill);
            this.realm = game.realms.getObjectSafe(data.realm);
            this.percent = data.percent;
            if (data.rollInSkill !== undefined)
                this.rollInSkill = data.rollInSkill;
        } catch (e) {
            throw new DataConstructionError(MasteryTokenItem.name, e, this.id);
        }
    }
    get hasDescription() {
        return true;
    }
    get description() {
        if (super.hasDescription) {
            return super.description;
        }
        return templateLangString('MODIFIER_DATA_masteryToken', {
            value: this.percent.toFixed(1)
        }); // TODO_C Adjust for realm specific pool types
    }
}
class CompostItem extends Item {
    constructor(namespace, itemData, game) {
        super(namespace, itemData, game);
        this.disableSeedRefund = false;
        try {
            this.compostValue = itemData.compostValue;
            this.harvestBonus = itemData.harvestBonus;
            this.buttonStyle = itemData.buttonStyle;
            this.barStyle = itemData.barStyle;
            if (itemData.disableSeedRefund !== undefined)
                this.disableSeedRefund = itemData.disableSeedRefund;
            if (itemData.compostAllCost !== undefined)
                this.compostAllCost = game.getCurrencyQuantity(itemData.compostAllCost);
            else
                this.compostAllCost = {
                    currency: game.gp,
                    quantity: 2000
                };
        } catch (e) {
            throw new DataConstructionError(CompostItem.name, e, this.id);
        }
    }
    applyDataModification(modData, game) {
        super.applyDataModification(modData, game);
        try {
            if (modData.barStyle !== undefined) {
                this.barStyle = modData.barStyle;
            }
            if (modData.buttonStyle !== undefined) {
                this.buttonStyle = modData.buttonStyle;
            }
            if (modData.compostValue !== undefined) {
                this.compostValue = modData.compostValue;
            }
            if (modData.harvestBonus !== undefined) {
                this.harvestBonus = modData.harvestBonus;
            }
            if (modData.disableSeedRefund !== undefined) {
                this.disableSeedRefund = modData.disableSeedRefund;
            }
            if (modData.compostAllCost !== undefined) {
                this.compostAllCost = game.getCurrencyQuantity(modData.compostAllCost);
            }
        } catch (e) {
            throw new DataModificationError(CompostItem.name, e, this.id);
        }
    }
}
class RuneItem extends Item {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.subRunes = [];
        try {
            if (data.subRunes !== undefined)
                this.subRunes = game.items.runes.getArrayFromIds(data.subRunes);
            if (data.realm !== undefined)
                this.realm = game.realms.getObjectSafe(data.realm);
            else
                this.realm = game.defaultRealm;
        } catch (e) {
            throw new DataConstructionError(RuneItem.name, e, this.id);
        }
    }
    get isComboRune() {
        return this.subRunes.length > 0;
    }
}
class FiremakingOilItem extends Item {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.modifiers = [];
        try {
            this.oilInterval = data.oilInterval;
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(RuneItem.name, e, this.id);
        }
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.modifiers !== undefined)
                this.modifiers = game.getModifierValuesFromData(data.modifiers);
        } catch (e) {
            throw new DataConstructionError(EquipmentItem.name, e, this.id);
        }
    }
    get description() {
        if (super.hasDescription) {
            if (containsDisabledModifier(this.modifiers))
                return super.description + getLangString('MENU_TEXT_CONTAINS_DISABLED_MODIFIER');
            return super.description;
        }
        if (StatObject.hasStats(this)) {
            return StatObject.formatAsPlainList(this);
        }
        return getLangString('BANK_STRING_38');
    }
    get hasDescription() {
        return super.hasDescription || this.modifiers !== undefined;
    }
}
/** Returns the HTML that describes an items special attacks if it has any, else returns an empty string */
function getItemSpecialAttackInformation(item) {
    let spec = '';
    if (item.specialAttacks.length > 0) {
        item.specialAttacks.forEach((attack, id) => {
            let chance = attack.defaultChance;
            if (item.overrideSpecialChances !== undefined)
                chance = item.overrideSpecialChances[id];
            spec += `<h5 class="font-size-sm font-w700 text-danger mb-0"><img class="skill-icon-xxs mr-1" src="${assets.getURI("assets/media/main/special_attack.png" /* Assets.SpecialAttack */)}"><small>${attack.name} (${formatPercent(chance)})</small></h5><h5 class="font-size-sm font-w400 text-warning mb-0"><small>${attack.modifiedDescription}</small></h5>`;
        });
    }
    return spec;
}
/** Returns the HTML for a tooltip that provides information on an item */
function createItemInformationTooltip(item, showStats = false) {
    let potionCharges = '',
        description = '',
        damageType = '',
        spec = '',
        hp = '',
        passive = '',
        html = '',
        baseStats = '',
        upgradeable = '',
        consumable = '',
        ammoType = '',
        requiresAmmo = '';
    if (item instanceof WeaponItem) {
        damageType = `<div class="font-size-sm">${templateLangString('MENU_TEXT_DEALS_DAMAGE_TYPE', {
            damageTypeName: `<img class="skill-icon-xxs mr-1" src="${item.damageType.media}"><span class="${item.damageType.spanClass}">${item.damageType.name}</span>`,
        })}</div>`;
        requiresAmmo = getAmmoTypeRequiredDescription(item);
    }
    if (item instanceof EquipmentItem) {
        spec = getItemSpecialAttackInformation(item);
        if (showStats)
            baseStats = getItemBaseStatsBreakdown(item);
        ammoType = getAmmoTypeDescription(item);
    }
    if (item instanceof PotionItem)
        potionCharges = `<small class='text-warning'>${templateString(getLangString('MENU_TEXT_POTION_CHARGES'), {
            charges: `${item.charges}`,
        })}</small><br>`;
    let itemDesc = item.hasDescription ? item.modifiedDescription : '';
    if (item instanceof EquipmentItem) {
        itemDesc += getSummonMaxHitItemDescription(item);
        if (item.fitsInSlot("melvorD:Consumable" /* EquipmentSlotIDs.Consumable */ ))
            consumable += `<h5 class="font-w400 font-size-sm text-center m-1 mb-1"><small class="badge bg-primary">${getLangString('EQUIP_SLOT_Consumable')}</small></h5>`;
    }
    if ((item.hasDescription || item.isArtefact) && itemDesc !== '')
        description += `<small class='text-info'>${itemDesc}</small><br>`;
    if (item instanceof FoodItem)
        hp = `<img class='skill-icon-xs ml-2' src='${game.hitpoints.media}'><span class='text-success'>+${game.combat.player.getFoodHealing(item)}</span>`;
    const passiveSlot = game.equipmentSlots.getObjectByID("melvorD:Passive" /* EquipmentSlotIDs.Passive */ );
    if (passiveSlot !== undefined &&
        item instanceof EquipmentItem &&
        item.fitsInSlot(passiveSlot.id) &&
        game.combat.player.isEquipmentSlotUnlocked(passiveSlot))
        passive = '<br><small class="text-success">' + getLangString('MENU_TEXT_PASSIVE_SLOT_COMPATIBLE') + '</small>';
    const upgrades = game.bank.itemUpgrades.get(item);
    if (upgrades !== undefined) {
        upgradeable = `<br><img class="skill-icon-xs mr-1" src="${assets.getURI(`assets/media/main/${upgrades[0].isDowngrade ? 'downgrade' : 'upgrade'}.svg`)}"><small class="text-success">${upgrades[0].isDowngrade
            ? getLangString('MENU_TEXT_CAN_BE_DOWNGRADED')
            : getLangString('MENU_TEXT_CAN_BE_UPGRADED')}</small>`;
    }
    html += `<div class="text-center">
				<div class="media d-flex align-items-center push">
					<div class="mr-3">
						<img class="bank-img m-1" src="${item.media}">
					</div>
					<div class="media-body">
						<div class="font-w600">${item.name}</div>
            <div role="separator" class="dropdown-divider m-0 mb-1"></div>
						${damageType}
						${potionCharges}
            ${consumable}
						${description}
						${spec}
						<div class="font-size-sm">
							<img class="skill-icon-xs" src="${item.sellsFor.currency.media}">${numberWithCommas(game.bank.getItemSalePrice(item))}
							${hp}
							${passive}
							${upgradeable}
							<br>
						</div>
						${baseStats}
					</div>
				</div>
        <div role="separator" class="dropdown-divider m-0 mb-1 d-none"></div>
        <ul class="nav-main nav-main-horizontal nav-main-horizontal-center">${ammoType}${requiresAmmo}</ul>
			</div>`;
    return html;
}

function getAmmoTypeDescription(item) {
    if (item.ammoType === undefined || item instanceof WeaponItem)
        return '';
    return `<li><span class="font-size-xs badge-pill bg-primary">${getLangString(`AMMO_TYPE_${item.ammoType}`)}</span></li>`;
}

function getAmmoTypeRequiredDescription(item) {
    if (item.ammoTypeRequired === undefined || item.ammoType !== undefined)
        return '';
    return `<li><span class="font-size-xs badge-pill bg-secondary text-white">${getLangString('MENU_TEXT_REQUIRES')} ${getLangString(`AMMO_TYPE_${item.ammoTypeRequired}_PLURAL`)}</span></li>`;
}

function getItemBaseStatsBreakdown(item) {
    let html = '';
    item.equipmentStats.forEach((equipStat) => {
        const isPositive = equipStat.value > 0;
        const statDesc = Equipment.getEquipStatDescription(equipStat);
        html += `<h5 class="font-size-sm ${isPositive ? 'text-success font-w400' : 'text-danger'} mb-0"><small>${statDesc}</small></h5>`;
    });
    return html;
}
//# sourceMappingURL=item.js.map
checkFileVersion('?12097')