"use strict";
/**
 * Returns the result of a comparison operation between two values
 * @param lhValue The left-hand value to use in the comparison
 * @param rhValue The right-hand value to use in the comparison
 * @param operator The comparison operator to use
 * @example checkComparison(1, 2, '=='); // Returns the result of 1 == 2 (false)
 * @example checkComparison(3, 1, '>='); // Returns the result of 3 >= 1 (true)
 */
function checkComparison(lhValue, rhValue, operator) {
    switch (operator) {
        case '==':
            return lhValue == rhValue;
        case '!=':
            return lhValue != rhValue;
        case '>':
            return lhValue > rhValue;
        case '<':
            return lhValue < rhValue;
        case '<=':
            return lhValue <= rhValue;
        case '>=':
            return lhValue >= rhValue;
    }
}

function checkEveryCondition(condition, checkCondition) {
    return condition.conditions.every(checkCondition);
}

function checkSomeCondition(condition, checkCondition) {
    return condition.conditions.some(checkCondition);
}
/** Base class for all conditional modifier classes */
class ConditionalModifierCondition {
    /**
     * Assigns an event handler for when this condition may have changed
     * @param manager The BaseManager to check the condition against, and to assign event handlers
     * @param handler The handler to call when the condition changed
     * @returns An unassigner method to remove the handlers from the manager
     * @sealed
     */
    assignHandler(manager, handler) {
        const wrappedHandler = () => {
            handler(this.checkIfMet(manager));
        };
        this._assignWrappedHandler(manager, wrappedHandler);
        return () => this._unassignWrappedHandler(manager, wrappedHandler);
    }
}
class BooleanCondition extends ConditionalModifierCondition {
    constructor(data) {
        super();
        this._inverted = false;
        if (data.inverted !== undefined)
            this._inverted = data.inverted;
    }
    get inverted() {
        return this._inverted;
    }
    checkIfMet(manager) {
        return this._inverted !== this._checkIfMet(manager); // XOR
    }
    isEquals(condition) {
        return condition instanceof BooleanCondition && this._inverted === condition._inverted;
    }
}
class ValueCondition extends ConditionalModifierCondition {
    constructor(data) {
        super();
        this._rhValue = data.value;
        this._operator = data.operator;
    }
    get rhValue() {
        return this._rhValue;
    }
    get operator() {
        return this._operator;
    }
    checkIfMet(manager) {
        return checkComparison(this._getLHValue(manager), this._rhValue, this._operator);
    }
    isEquals(condition) {
        return (condition instanceof ValueCondition &&
            this._rhValue === condition._rhValue &&
            this._operator === condition._operator);
    }
    addTemplateData(templateData, prefix = '', postfix = '') {
        templateData[`${prefix}RhValue${postfix}`] = `${this.rhValue}`;
    }
}
class ItemInBankCondition extends ValueCondition {
    constructor(data, game, selfItem) {
        super(data);
        this.type = 'BankItem';
        try {
            let item;
            if ((selfItem === null || selfItem === void 0 ? void 0 : selfItem.id) === data.itemID)
                item = selfItem;
            else
                item = game.items.getObjectSafe(data.itemID);
            this.item = item;
        } catch (e) {
            throw new DataConstructionError(ItemInBankCondition.name, e);
        }
    }
    isEquals(condition) {
        return condition instanceof ItemInBankCondition && super.isEquals(condition) && this.item === condition.item;
    }
    _assignWrappedHandler(manager, handler) {
        manager.bank.on('itemChanged', handler);
    }
    _unassignWrappedHandler(manager, handler) {
        manager.bank.off('itemChanged', handler);
    }
    _getLHValue(manager) {
        return manager.bank.getQty(this.item);
    }
    addTemplateData(templateData, prefix = '', postfix = '') {
        templateData[`${prefix}ItemName${postfix}`] = this.item.name;
    }
}
class ItemChargeCondition extends ValueCondition {
    constructor(data, game, selfItem) {
        super(data);
        this.type = 'ItemCharge';
        try {
            let item;
            if ((selfItem === null || selfItem === void 0 ? void 0 : selfItem.id) === data.itemID)
                item = selfItem;
            else
                item = game.items.equipment.getObjectSafe(data.itemID);
            this.item = item;
        } catch (e) {
            throw new DataConstructionError(ItemChargeCondition.name, e);
        }
    }
    isEquals(condition) {
        return condition instanceof ItemChargeCondition && super.isEquals(condition) && this.item === condition.item;
    }
    _assignWrappedHandler(manager, handler) {
        manager.itemCharges.on('chargesChanged', handler);
    }
    _unassignWrappedHandler(manager, handler) {
        manager.itemCharges.off('chargesChanged', handler);
    }
    _getLHValue(manager) {
        return manager.itemCharges.getCharges(this.item);
    }
    addTemplateData(templateData, prefix = '', postfix = '') {
        templateData[`${prefix}ItemName${postfix}`] = this.item.name;
    }
}
class PotionUsedCondition extends BooleanCondition {
    constructor(data, game) {
        super(data);
        this.type = 'PotionUsed';
        try {
            if (data.itemID !== undefined)
                this.item = game.items.potions.getObjectSafe(data.itemID);
            if (data.recipeID !== undefined)
                this.recipe = game.herblore.actions.getObjectSafe(data.recipeID);
        } catch (e) {
            throw new DataConstructionError(PotionUsedCondition.name, e);
        }
    }
    isEquals(condition) {
        return (condition instanceof PotionUsedCondition &&
            super.isEquals(condition) &&
            condition.item === this.item &&
            condition.recipe === this.recipe);
    }
    _assignWrappedHandler(manager, handler) {
        manager.potions.on('potionChanged', handler);
    }
    _unassignWrappedHandler(manager, handler) {
        manager.potions.off('potionChanged', handler);
    }
    _checkIfMet(manager) {
        return ((this.item === undefined || manager.potions.isPotionActive(this.item)) &&
            (this.recipe === undefined || this.recipe.potions.some((potion) => manager.potions.isPotionActive(potion))));
    }
    addTemplateData(templateData, prefix = '', postfix = '') {
        if (this.item !== undefined)
            templateData[`${prefix}ItemName${postfix}`] = this.item.name;
        if (this.recipe !== undefined)
            templateData[`${prefix}PotionName${postfix}`] = this.recipe.name;
    }
}
class CharacterValueCondition extends ValueCondition {
    constructor(data) {
        super(data);
        this._character = 'Player';
        if (data.character !== undefined)
            this._character = data.character;
    }
    get character() {
        return this._character;
    }
    isEquals(condition) {
        return (condition instanceof CharacterValueCondition &&
            super.isEquals(condition) &&
            this._character === condition._character);
    }
    /**
     * Checks if this condition has been met from the perspective of a character
     * @param character
     * @returns
     */
    isMetForCharacter(character) {
        const relativeCharacter = this._character === 'Player' ? character : character.target;
        return checkComparison(this._getCharacterLHValue(relativeCharacter), this._rhValue, this._operator);
    }
    _assignWrappedHandler(manager, handler) {
        this._assignCharacterHandler(this._getCharacter(manager), handler);
    }
    _unassignWrappedHandler(manager, handler) {
        this._unassignCharacterHandler(this._getCharacter(manager), handler);
    }
    _getLHValue(manager) {
        return this._getCharacterLHValue(this._getCharacter(manager));
    }
    _getCharacter(manager) {
        if (this._character === 'Player')
            return manager.player;
        return manager.enemy;
    }
}
class CharacterBooleanCondition extends BooleanCondition {
    constructor(data) {
        super(data);
        this._character = 'Player';
        if (data.character !== undefined)
            this._character = data.character;
    }
    get character() {
        return this._character;
    }
    isEquals(condition) {
        return (condition instanceof CharacterBooleanCondition &&
            super.isEquals(condition) &&
            this._character === condition._character);
    }
    /**
     * Checks if this condition has been met from the perspective of a character
     * @param character
     * @returns
     */
    isMetForCharacter(character) {
        const relativeCharacter = this._character === 'Player' ? character : character.target;
        return this._inverted !== this._checkIfCharacterMet(relativeCharacter);
    }
    _checkIfMet(manager) {
        return this._checkIfCharacterMet(this._getCharacter(manager));
    }
    _getCharacter(manager) {
        if (this._character === 'Player')
            return manager.player;
        return manager.enemy;
    }
}
class HitpointsCondition extends CharacterValueCondition {
    constructor(data) {
        super(data);
        this.type = 'Hitpoints';
    }
    isEquals(condition) {
        return condition instanceof HitpointsCondition && super.isEquals(condition);
    }
    _assignCharacterHandler(character, handler) {
        character.on('hitpointsChanged', handler);
    }
    _unassignCharacterHandler(character, handler) {
        character.off('hitpointsChanged', handler);
    }
    _getCharacterLHValue(character) {
        return character.hitpointsPercent;
    }
}
class BarrierCondition extends CharacterValueCondition {
    constructor(data) {
        super(data);
        this.type = 'Barrier';
    }
    isEquals(condition) {
        return condition instanceof BarrierCondition && super.isEquals(condition);
    }
    _assignCharacterHandler(character, handler) {
        character.on('barrierChanged', handler);
    }
    _unassignCharacterHandler(character, handler) {
        character.off('barrierChanged', handler);
    }
    _getCharacterLHValue(character) {
        return character.barrierPercent;
    }
}
class CombatEffectGroupCondition extends CharacterBooleanCondition {
    constructor(data, game) {
        super(data);
        this.type = 'CombatEffectGroup';
        try {
            this._group = game.combatEffectGroups.getObjectSafe(data.groupID);
        } catch (e) {
            throw new DataConstructionError(CombatEffectGroupCondition.name, e);
        }
    }
    get group() {
        return this._group;
    }
    isEquals(condition) {
        return (condition instanceof CombatEffectGroupCondition && super.isEquals(condition) && this._group === condition._group);
    }
    _assignWrappedHandler(manager, handler) {
        const character = this._getCharacter(manager);
        character.on('effectGroupApplied', handler);
        character.on('effectGroupRemoved', handler);
    }
    _unassignWrappedHandler(manager, handler) {
        const character = this._getCharacter(manager);
        character.off('effectGroupApplied', handler);
        character.off('effectGroupRemoved', handler);
    }
    _checkIfCharacterMet(character) {
        return character.isEffectGroupActive(this._group);
    }
    addTemplateData(templateData, prefix = '', postfix = '') {
        templateData[`${prefix}EffectGroupName${postfix}`] = this._group.name;
    }
}
class CombatEffectCondition extends CharacterBooleanCondition {
    constructor(data, game) {
        super(data);
        this.type = 'CombatEffect';
        try {
            this._effect = game.combatEffects.getObjectSafe(data.effectID);
        } catch (e) {
            throw new DataConstructionError(CombatEffectCondition.name, e);
        }
    }
    get effect() {
        return this._effect;
    }
    isEquals(condition) {
        return (condition instanceof CombatEffectCondition && super.isEquals(condition) && this._effect === condition._effect);
    }
    _assignWrappedHandler(manager, handler) {
        const character = this._getCharacter(manager);
        character.on('effectApplied', handler);
        character.on('effectRemoved', handler);
    }
    _unassignWrappedHandler(manager, handler) {
        const character = this._getCharacter(manager);
        character.off('effectApplied', handler);
        character.off('effectRemoved', handler);
    }
    _checkIfCharacterMet(character) {
        return character.isEffectActive(this._effect);
    }
    addTemplateData(templateData, prefix = '', postfix = '') {
        templateData[`${prefix}EffectName${postfix}`] = this._effect.name;
    }
}
class AttackTypeCondition extends CharacterBooleanCondition {
    constructor(data) {
        super(data);
        this.type = 'AttackType';
        this._thisAttackType = data.thisAttackType;
        this._targetAttackType = data.targetAttackType;
    }
    get thisAttackType() {
        return this._thisAttackType;
    }
    get targetAttackType() {
        return this._targetAttackType;
    }
    isEquals(condition) {
        return (condition instanceof AttackTypeCondition &&
            super.isEquals(condition) &&
            this._thisAttackType === condition._thisAttackType &&
            this._targetAttackType === condition._targetAttackType);
    }
    _assignWrappedHandler(manager, handler) {
        manager.on('startOfFight', handler);
        manager.on('endOfFight', handler);
    }
    _unassignWrappedHandler(manager, handler) {
        manager.off('startOfFight', handler);
        manager.off('endOfFight', handler);
    }
    _checkIfCharacterMet(character) {
        // this.character + manager.fightInProgress checks ensure that enemy attackType checks only pass when in a fight
        return ((this._thisAttackType === 'any' ||
                ((this.character === 'Player' || character.manager.fightInProgress) &&
                    character.attackType === this._thisAttackType)) &&
            (this._targetAttackType === 'any' ||
                ((this.character === 'Enemy' || character.manager.fightInProgress) &&
                    character.target.attackType === this._targetAttackType)));
    }
    addTemplateData(templateData, prefix = '', postfix = '') {}
}
class DamageTypeCondition extends CharacterBooleanCondition {
    constructor(data, game) {
        super(data);
        this.type = 'DamageType';
        try {
            this._damageType = game.damageTypes.getObjectSafe(data.damageType);
        } catch (e) {
            throw new DataConstructionError(DamageTypeCondition.name, e);
        }
    }
    get damageType() {
        return this._damageType;
    }
    isEquals(condition) {
        return (condition instanceof DamageTypeCondition &&
            super.isEquals(condition) &&
            this._damageType === condition._damageType);
    }
    _assignWrappedHandler(manager, handler) {
        manager.on('startOfFight', handler);
        manager.on('endOfFight', handler);
    }
    _unassignWrappedHandler(manager, handler) {
        manager.off('startOfFight', handler);
        manager.off('endOfFight', handler);
    }
    _checkIfCharacterMet(character) {
        return ((this.character === 'Player' || character.manager.fightInProgress) && character.damageType === this._damageType);
    }
    addTemplateData(templateData, prefix = '', postfix = '') {
        templateData[`${prefix}DamageType${postfix}`] = this._damageType.name;
        templateData[`${prefix}ResistanceName${postfix}`] = this._damageType.resistanceName;
    }
}
class FightingBossCondition extends CharacterBooleanCondition {
    constructor(data) {
        super(data);
        this.type = 'FightingBoss';
    }
    isEquals(condition) {
        return condition instanceof FightingBossCondition && super.isEquals(condition);
    }
    _assignWrappedHandler(manager, handler) {
        manager.on('startOfFight', handler);
        manager.on('endOfFight', handler);
    }
    _unassignWrappedHandler(manager, handler) {
        manager.off('startOfFight', handler);
        manager.off('endOfFight', handler);
    }
    _checkIfCharacterMet(character) {
        return character.manager.fightInProgress && character.target.isBoss;
    }
    addTemplateData(templateData, prefix = '', postfix = '') {}
}
class FightingSlayerTaskCondition extends BooleanCondition {
    constructor(data) {
        super(data);
        this.type = 'FightingSlayerTask';
    }
    isEquals(condition) {
        return condition instanceof FightingSlayerTaskCondition && super.isEquals(condition);
    }
    _assignWrappedHandler(manager, handler) {
        manager.on('startOfFight', handler);
        manager.on('endOfFight', handler);
    }
    _unassignWrappedHandler(manager, handler) {
        manager.off('startOfFight', handler);
        manager.off('endOfFight', handler);
    }
    _checkIfMet(manager) {
        return manager.onSlayerTask;
    }
    addTemplateData(templateData, prefix = '', postfix = '') {}
}
class BaseEquipStatCompareCondition extends ConditionalModifierCondition {
    constructor(data) {
        super();
        this.type = 'EquipStatCompare';
        this.operator = data.operator;
    }
    checkIfMet(manager) {
        return (manager.fightInProgress &&
            checkComparison(this.getEquipStat(manager.player), this.getEquipStat(manager.enemy), this.operator));
    }
    _assignWrappedHandler(manager, handler) {
        manager.on('startOfFight', handler);
        manager.on('endOfFight', handler);
    }
    _unassignWrappedHandler(manager, handler) {
        manager.off('startOfFight', handler);
        manager.off('endOfFight', handler);
    }
    addTemplateData(templateData, prefix = '', postfix = '') {}
}
class EquipStatCompareCondition extends BaseEquipStatCompareCondition {
    constructor(data) {
        super(data);
        this.type = 'EquipStatCompare';
        this.statKey = data.statKey;
    }
    getEquipStat(character) {
        return character.equipmentStats[this.statKey];
    }
    isEquals(condition) {
        return (condition instanceof EquipStatCompareCondition &&
            this.statKey === condition.statKey &&
            this.operator === condition.operator);
    }
}
class DamageTypeEquipStatCompareCondition extends BaseEquipStatCompareCondition {
    constructor(data, game) {
        super(data);
        this.type = 'EquipStatCompare';
        try {
            this.statKey = data.statKey;
            this.damageType = game.damageTypes.getObjectSafe(data.damageType);
        } catch (e) {
            throw new DataConstructionError(DamageTypeEquipStatCompareCondition.name, e);
        }
    }
    getEquipStat(character) {
        switch (this.statKey) {
            case 'resistance':
                return character.equipmentStats.getResistance(this.damageType);
            case 'summoningMaxhit':
                return character.equipmentStats.getSummoningMaxHit(this.damageType);
        }
    }
    isEquals(condition) {
        return (condition instanceof DamageTypeEquipStatCompareCondition &&
            this.statKey === condition.statKey &&
            this.damageType === condition.damageType &&
            this.operator === condition.operator);
    }
}
class SomeConditionClass extends ConditionalModifierCondition {
    constructor(data, game, selfItem) {
        super();
        this.type = 'Some';
        try {
            this.conditions = data.conditions.map((condData) => ConditionalModifier.getConditionFromData(condData, game, selfItem));
        } catch (e) {
            throw new DataConstructionError('SomeCondition', e);
        }
    }
    checkIfMet(manager) {
        return this.conditions.some((condition) => condition.checkIfMet(manager));
    }
    isEquals(condition) {
        return (condition instanceof SomeConditionClass &&
            this.conditions.every((cond, i) => {
                cond.isEquals(condition.conditions[i]);
            }));
    }
    _assignWrappedHandler(manager, handler) {
        this.conditions.every((condition) => {
            condition._assignWrappedHandler(manager, handler);
        });
    }
    _unassignWrappedHandler(manager, handler) {
        this.conditions.every((condition) => {
            condition._unassignWrappedHandler(manager, handler);
        });
    }
    addTemplateData(templateData, prefix = '', postfix = '') {
        this.conditions.forEach((cond, i) => {
            cond.addTemplateData(templateData, prefix, `${postfix}${i}`);
        });
    }
}
class EveryConditionClass extends ConditionalModifierCondition {
    constructor(data, game, selfItem) {
        super();
        this.type = 'Every';
        try {
            this.conditions = data.conditions.map((condData) => ConditionalModifier.getConditionFromData(condData, game, selfItem));
        } catch (e) {
            throw new DataConstructionError('EveryCondition', e);
        }
    }
    checkIfMet(manager) {
        return this.conditions.every((condition) => condition.checkIfMet(manager));
    }
    isEquals(condition) {
        return (condition instanceof EveryConditionClass &&
            this.conditions.every((cond, i) => {
                cond.isEquals(condition.conditions[i]);
            }));
    }
    _assignWrappedHandler(manager, handler) {
        this.conditions.every((condition) => {
            condition._assignWrappedHandler(manager, handler);
        });
    }
    _unassignWrappedHandler(manager, handler) {
        this.conditions.every((condition) => {
            condition._unassignWrappedHandler(manager, handler);
        });
    }
    addTemplateData(templateData, prefix = '', postfix = '') {
        this.conditions.forEach((cond, i) => {
            cond.addTemplateData(templateData, prefix, `${postfix}${i}`);
        });
    }
}
class ConditionalModifier {
    constructor(data, game, selfItem) {
        this.isNegative = false;
        try {
            this.condition = ConditionalModifier.getConditionFromData(data.condition, game, selfItem);
            if (data.description !== undefined)
                this._description = data.description;
            if (data.descriptionLang !== undefined)
                this._descriptionLang = data.descriptionLang;
            if (data.isNegative !== undefined)
                this.isNegative = data.isNegative;
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(ConditionalModifier.name, e);
        }
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.modifiers !== undefined)
                this.modifiers = game.getModifierValuesFromData(data.modifiers);
            if (data.enemyModifiers !== undefined)
                this.enemyModifiers = game.getEnemyModifierValuesFromData(data.enemyModifiers);
        } catch (e) {
            throw new DataConstructionError(ConditionalModifier.name, e);
        }
    }
    getDescription(negMult = 1, posMult = 1) {
        const template = this.getDescriptionTemplate();
        if (template === undefined)
            return undefined;
        const mult = this.isNegative ? negMult : posMult;
        return {
            text: templateString(template, this.getTemplateData(mult)),
            isNegative: this.isNegative,
            isDisabled: false,
        };
    }
    getDescriptionTemplate() {
        if (this._descriptionLang !== undefined)
            return getLangString(this._descriptionLang);
        if (this._description !== undefined)
            return this._description;
    }
    getTemplateData(mult) {
        var _a, _b;
        const templateData = {};
        let i = 0;
        (_a = this.modifiers) === null || _a === void 0 ? void 0 : _a.forEach((mod) => {
            mod.addEffectTemplateData(templateData, '', `${i}`, mult);
            i++;
        });
        (_b = this.enemyModifiers) === null || _b === void 0 ? void 0 : _b.forEach((mod) => {
            mod.addEffectTemplateData(templateData, '', `${i}`, mult);
            i++;
        });
        this.condition.addTemplateData(templateData, 'cond');
        return templateData;
    }
    static getCombatConditionFromData(data, game) {
        switch (data.type) {
            case 'Hitpoints':
                return new HitpointsCondition(data);
            case 'CombatEffect':
                return new CombatEffectCondition(data, game);
            case 'CombatEffectGroup':
                return new CombatEffectGroupCondition(data, game);
            case 'CombatType':
                return new AttackTypeCondition(data);
            case 'DamageType':
                return new DamageTypeCondition(data, game);
            case 'Barrier':
                return new BarrierCondition(data);
            case 'FightingBoss':
                return new FightingBossCondition(data);
        }
    }
    static getConditionFromData(data, game, selfItem) {
        switch (data.type) {
            case 'BankItem':
                return new ItemInBankCondition(data, game, selfItem);
            case 'ItemCharge':
                return new ItemChargeCondition(data, game, selfItem);
            case 'PotionUsed':
                return new PotionUsedCondition(data, game);
            case 'Every':
                return new EveryConditionClass(data, game, selfItem);
            case 'Some':
                return new SomeConditionClass(data, game, selfItem);
            case 'EquipStatCompare':
                switch (data.statKey) {
                    case 'resistance':
                    case 'summoningMaxhit':
                        return new DamageTypeEquipStatCompareCondition(data, game);
                    default:
                        return new EquipStatCompareCondition(data);
                }
            case 'FightingSlayerTask':
                return new FightingSlayerTaskCondition(data);
            default:
                return ConditionalModifier.getCombatConditionFromData(data, game);
        }
    }
}
//# sourceMappingURL=conditionalModifiers.js.map
checkFileVersion('?12097')