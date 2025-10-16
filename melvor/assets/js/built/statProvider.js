"use strict";
/** An object that can provide modifiers, effect applicators or conditional modifiers */
class StatObject {
    constructor(data, game, where) {
        try {
            if (data.combatEffects !== undefined)
                this.combatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(data.combatEffects);
            if (data.conditionalModifiers !== undefined)
                this.conditionalModifiers = data.conditionalModifiers.map((data) => new ConditionalModifier(data, game));
            game.queueForSoftDependencyReg(data, this, where);
        } catch (e) {
            throw new DataConstructionError(StatObject.name, e);
        }
    }
    /** If this stat object actually contains any stats */
    get hasStats() {
        return StatObject.hasStats(this);
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.modifiers !== undefined)
                this.modifiers = game.getModifierValuesFromData(data.modifiers);
            if (data.enemyModifiers !== undefined)
                this.enemyModifiers = game.getEnemyModifierValuesFromData(data.enemyModifiers);
        } catch (e) {
            throw new DataConstructionError(StatObject.name, e);
        }
    }
    applyDataModification(data, game) {
        var _a, _b, _c;
        try {
            if (data.modifiers !== undefined) {
                const newModifiers = game.modifyModifierValues((_a = this.modifiers) !== null && _a !== void 0 ? _a : [], data.modifiers);
                if (newModifiers.length === 0)
                    this.modifiers = undefined;
                else
                    this.modifiers = newModifiers;
            }
            if (data.enemyModifiers !== undefined) {
                const newModifiers = game.modifyEnemyModifierValues((_b = this.enemyModifiers) !== null && _b !== void 0 ? _b : [], data.enemyModifiers);
                if (newModifiers.length === 0)
                    this.enemyModifiers = undefined;
                else
                    this.enemyModifiers = newModifiers;
            }
            if (data.combatEffects !== undefined) {
                if (this.combatEffects === undefined)
                    this.combatEffects = [];
                game.modifyCombatEffectApplicators(this.combatEffects, data.combatEffects, AstrologyModifier.name);
                if (this.combatEffects.length === 0)
                    this.combatEffects = undefined;
            }
            if (data.conditionalModifiers !== undefined) {
                let newConditionals = (_c = this.conditionalModifiers) !== null && _c !== void 0 ? _c : [];
                const removalTypes = data.conditionalModifiers.remove;
                if (removalTypes !== undefined) {
                    newConditionals = newConditionals.filter((c) => !removalTypes.includes(c.condition.type));
                }
                if (data.conditionalModifiers.add !== undefined) {
                    newConditionals.push(...data.conditionalModifiers.add.map((data) => new ConditionalModifier(data, game)));
                }
                if (newConditionals.length === 0)
                    this.conditionalModifiers = undefined;
                else
                    this.conditionalModifiers = newConditionals;
            }
        } catch (e) {
            throw new DataModificationError(StatObject.name, e);
        }
    }
    describeAsSpanHTML(negMult = 1, posMult = 1) {
        return joinAsList(StatObject.formatDescriptions(this, spanHTMLDescriptionFormatter));
    }
    describeLineBreak() {
        return joinAsLineBreakList(StatObject.formatDescriptions(this, spanHTMLDescriptionFormatter));
    }
    describeAsSpans(negMult = 1, posMult = 1) {
        return StatObject.formatDescriptions(this, spanDescriptionFormatter, negMult, posMult);
    }
    describeSearch() {
        return joinAsList(StatObject.formatDescriptions(this, searchDescriptionFormatter));
    }
    describePlain() {
        return joinAsList(StatObject.formatDescriptions(this, plainDescriptionFormatter));
    }
    /**
     * Gets the descriptions of a stat providing object
     * @param statObject The object to get descriptions for
     * @param negMult A multiplier to apply to effects that are negative to the player
     * @param posMult A multiplier to apply to effects that are positive to the player
     * @param includeZero If zero valued effects should be included
     * @returns An array of [description, textClass] tuples
     */
    static getDescriptions(statObject, negMult = 1, posMult = 1, includeZero = true) {
        const descriptions = [];
        if (statObject.modifiers !== undefined) {
            statObject.modifiers.forEach((modValue) => {
                if (this.showDescription(modValue.isNegative, negMult, posMult, includeZero))
                    descriptions.push(modValue.print(negMult, posMult));
            });
        }
        if (statObject.combatEffects !== undefined) {
            statObject.combatEffects.forEach((applicator) => {
                const desc = applicator.getDescription(negMult, posMult);
                if (desc !== undefined && this.showDescription(applicator.isNegative, negMult, posMult, includeZero)) {
                    descriptions.push(desc);
                }
            });
        }
        if (statObject.conditionalModifiers !== undefined) {
            statObject.conditionalModifiers.forEach((conditional) => {
                const desc = conditional.getDescription(negMult, posMult);
                if (desc !== undefined && this.showDescription(conditional.isNegative, negMult, posMult, includeZero))
                    descriptions.push(desc);
            });
        }
        // End with enemy modifiers so all remaining descriptions are enemy modifiers
        if (statObject.enemyModifiers !== undefined) {
            statObject.enemyModifiers.forEach((modValue, id) => {
                if (this.showDescription(!modValue.isNegative, negMult, posMult, includeZero))
                    descriptions.push(modValue.printEnemy(posMult, negMult, 2, id === 0)); // TODO_C This is dubious at best
            });
        }
        return descriptions;
    }
    /**
     * Checks if a description should be included when getting descriptions
     * @param isNegative If the given effect is negative to the player
     * @param negMult The multiplier to apply to effects that are negative to the player
     * @param posMult The multiplier to apply to effects that are positive to the player
     * @param includeZero If zero valued effects should be shown
     * @returns If the description should be shown
     */
    static showDescription(isNegative, negMult, posMult, includeZero) {
        return includeZero || !(isNegative ? negMult === 0 : posMult === 0);
    }
    /**
     * Gets the descriptions of a stat providing object, and passes them through a formatting function
     * @param statObject The object to get descriptions for
     * @param formatter The function to format the descriptions with
     * @param negMult A multiplier to apply to effects that are negative to the player
     * @param posMult A multiplier to apply to effects that are positive to the player
     * @param includeZero If zero valued effects should be included
     * @returns An array of formatted descriptions
     */
    static formatDescriptions(statObject, formatter, negMult = 1, posMult = 1, includeZero = true) {
        return this.getDescriptions(statObject, negMult, posMult, includeZero).map(formatter);
    }
    static formatAsPlainList(statObject) {
        return joinAsList(this.formatDescriptions(statObject, plainDescriptionFormatter));
    }
    /** Checks if an object with stat object data actually has any stats */
    static hasStatsData(data) {
        return (data.modifiers !== undefined ||
            data.enemyModifiers !== undefined ||
            data.conditionalModifiers !== undefined ||
            data.combatEffects !== undefined);
    }
    /** Checks if a stat object actually has any stats */
    static hasStats(object) {
        return (object.modifiers !== undefined ||
            object.enemyModifiers !== undefined ||
            object.conditionalModifiers !== undefined ||
            object.combatEffects !== undefined);
    }
}
class StatProvider {
    constructor() {
        this.modifiers = new ModifierTable();
        this.enemyModifiers = new ModifierTable();
        this.conditionalModifiers = [];
        this.equipmentStats = [];
        this.combatEffects = [];
    }
    reset() {
        this.modifiers.empty();
        this.enemyModifiers.empty();
        this.conditionalModifiers = [];
        this.equipmentStats = [];
        this.combatEffects = [];
    }
    addStatObject(source, stats, negMult = 1, posMult = 1) {
        if (stats.modifiers !== undefined)
            this.modifiers.addModifiers(source, stats.modifiers, negMult, posMult);
        if (stats.enemyModifiers !== undefined)
            this.enemyModifiers.addModifiers(source, stats.enemyModifiers, posMult, negMult);
        if (stats.combatEffects !== undefined) {
            this.combatEffects.push;
            stats.combatEffects.forEach((a) => {
                this.combatEffects.push(a.clone(a.isNegative ? negMult : posMult));
            });
        }
        if (stats.conditionalModifiers !== undefined)
            this.conditionalModifiers.push({
                source,
                conditionals: stats.conditionalModifiers,
                negMult,
                posMult
            });
    }
}
class StatObjectSummary {
    constructor() {
        this.modifiers = new ModifierTable();
        this.enemyModifiers = new ModifierTable();
        this.combatEffects = [];
        this.conditionalModifiers = [];
    }
    addStatObject(source, stats, negMult = 1, posMult = 1) {
        if (stats.modifiers !== undefined)
            this.modifiers.addModifiers(source, stats.modifiers, negMult, posMult);
        if (stats.enemyModifiers !== undefined)
            this.enemyModifiers.addModifiers(source, stats.enemyModifiers, posMult, negMult);
        if (stats.combatEffects !== undefined) {
            stats.combatEffects.forEach((a) => a.mergeWithArray(this.combatEffects, negMult, posMult));
        }
        if (stats.conditionalModifiers !== undefined) {
            this.conditionalModifiers.push({
                source,
                conditionals: stats.conditionalModifiers,
                negMult,
                posMult
            });
        }
    }
    getAllDescriptions() {
        const descriptions = [];
        descriptions.push(...this.modifiers.getActiveModifierDescriptions());
        descriptions.push(...this.enemyModifiers.getEnemyModifierDescriptions());
        this.combatEffects.forEach((applicator) => {
            const desc = applicator.getDescription();
            if (desc !== undefined)
                descriptions.push(desc);
        });
        this.conditionalModifiers.forEach(({
            conditionals,
            negMult,
            posMult
        }) => {
            conditionals.forEach((conditional) => {
                const desc = conditional.getDescription(negMult, posMult);
                if (desc !== undefined)
                    descriptions.push(desc);
            });
        });
        return descriptions;
    }
}
//# sourceMappingURL=statProvider.js.map
checkFileVersion('?12097')