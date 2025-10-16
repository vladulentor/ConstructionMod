"use strict";
class BaseSpell extends NamespacedObject {
    constructor(namespace, data, game) {
        var _a;
        super(namespace, data.id);
        this.categories = [];
        try {
            this._name = data.name;
            this._media = data.media;
            this.level = data.level;
            this.runesRequired = game.items.runes.getQuantities(data.runesRequired);
            if (data.runesRequiredAlt !== undefined)
                this.runesRequiredAlt = game.items.runes.getQuantities(data.runesRequiredAlt);
            this.abyssalLevel = (_a = data.abyssalLevel) !== null && _a !== void 0 ? _a : 0;
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(BaseSpell.name, e, this.id);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.categories !== undefined)
                this.categories = game.altMagic.spellCategories.getArrayFromIds(data.categories);
        } catch (e) {
            throw new DataConstructionError(BaseSpell.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        try {
            if (data.level !== undefined)
                this.level = data.level;
            if (data.runesRequired !== undefined)
                this.runesRequired = game.items.runes.modifyQuantities(this.runesRequired, data.runesRequired);
            if (data.runesRequiredAlt !== undefined) {
                if (this.runesRequiredAlt === undefined) {
                    if (data.runesRequiredAlt.add !== undefined)
                        this.runesRequiredAlt = game.items.runes.getQuantities(data.runesRequiredAlt.add);
                } else {
                    this.runesRequiredAlt = game.items.runes.modifyQuantities(this.runesRequiredAlt, data.runesRequiredAlt);
                }
            }
            if (data.abyssalLevel !== undefined)
                this.abyssalLevel = data.abyssalLevel;
            if (data.categories !== undefined) {
                if (data.categories.remove !== undefined) {
                    const removals = data.categories.remove;
                    this.categories = this.categories.filter((category) => !removals.includes(category.id));
                }
                if (data.categories.add !== undefined) {
                    this.categories.push(...game.altMagic.spellCategories.getArrayFromIds(data.categories.add));
                }
            }
        } catch (e) {
            throw new DataModificationError(BaseSpell.name, e, this.id);
        }
    }
}
class AttackSpellbook extends RealmedObject {
    constructor(namespace, data) {
        super(namespace, data, game);
        this.allowCurses = true;
        this.allowAuroras = true;
        this.allowDamageModifiers = true;
        this.allowSpecialAttacks = true;
        this.spellNameLangPrefix = '';
        this.spells = [];
        this.allowedDamageTypes = new Set();
        this._name = data.name;
        if (data.nameLang !== undefined)
            this._nameLang = data.nameLang;
        this._media = data.media;
        if (data.allowCurses !== undefined)
            this.allowCurses = data.allowCurses;
        if (data.allowAuroras !== undefined)
            this.allowAuroras = data.allowAuroras;
        if (data.allowDamageModifiers !== undefined)
            this.allowDamageModifiers = data.allowDamageModifiers;
        if (data.allowSpecialAttacks !== undefined)
            this.allowSpecialAttacks = data.allowSpecialAttacks;
        if (data.spellNameLangPrefix !== undefined)
            this.spellNameLangPrefix = data.spellNameLangPrefix;
        if (data.allowedDamageTypeIDs !== undefined) {
            this.allowedDamageTypes = new Set(data.allowedDamageTypeIDs.map((id) => game.damageTypes.getObjectSafe(id)));
        }
    }
    get name() {
        if (this._nameLang !== undefined)
            return getLangString(this._nameLang);
        return this._name;
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    canUseWithDamageType(damageType) {
        return this.allowedDamageTypes.size === 0 || this.allowedDamageTypes.has(damageType);
    }
}
class CombatSpell extends BaseSpell {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.requirements = [];
        try {
            if (data.requiredItemID !== undefined) {
                this.requiredItem = game.items.equipment.getObjectSafe(data.requiredItemID);
            }
        } catch (e) {
            throw new DataConstructionError(CombatSpell.name, e, this.id);
        }
    }
    registerSoftDependencies(data, game) {
        super.registerSoftDependencies(data, game);
        try {
            if (data.requirements !== undefined)
                this.requirements = game.getRequirementsFromData(data.requirements);
        } catch (e) {
            throw new DataConstructionError(CombatSpell.name, e, this.id);
        }
    }
}
class AttackSpell extends CombatSpell {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.maxHit = 0;
        this.combatEffects = [];
        try {
            if (data.maxHit !== undefined)
                this.maxHit = data.maxHit;
            if (data.specialAttackID !== undefined) {
                this.specialAttack = game.specialAttacks.getObjectSafe(data.specialAttackID);
            }
            if (data.combatEffects !== undefined)
                this.combatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(data.combatEffects);
            this.spellbook = game.attackSpellbooks.getObjectSafe(data.spellbook);
            this.spellbook.spells.push(this);
            this.modQuery = new ModifierQuery({
                action: this,
                category: this.spellbook,
            });
        } catch (e) {
            throw new DataConstructionError(AttackSpell.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`${this.spellbook.spellNameLangPrefix}${this.localID}`);
        }
    }
    registerSoftDependencies(data, game) {
        super.registerSoftDependencies(data, game);
        this.modQuery.add({
            subcategory: this.categories
        });
    }
}
class CurseSpell extends CombatSpell {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        try {
            this.effect = game.combatEffects.getObjectSafe(data.effectID);
        } catch (e) {
            throw new DataConstructionError(CurseSpell.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`MAGIC_CURSE_NAME_${this.localID}`);
        }
    }
}
class AuroraSpell extends CombatSpell {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        try {
            this.stats = new StatObject(data, game, `${AuroraSpell.name} with id "${this.id}"`);
        } catch (e) {
            throw new DataConstructionError(AuroraSpell.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`MAGIC_AURORA_NAME_${this.localID}`);
        }
    }
    get description() {
        return this.stats.describeAsSpanHTML();
    }
}
//# sourceMappingURL=spells.js.map
checkFileVersion('?12097')