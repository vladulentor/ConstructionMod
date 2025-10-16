"use strict";
class CombatEffectDamageGroup {
    constructor(data) {
        this.applyDamageModifiers = false;
        this.applyResistance = false;
        this.damageCap = Infinity;
        this.name = data.name;
        this.damage = data.damage;
        if (data.applyDamageModifiers !== undefined)
            this.applyDamageModifiers = data.applyDamageModifiers;
        if (data.applyTypeModifiers !== undefined)
            this.applyTypeModifiers = data.applyTypeModifiers;
        if (data.applyResistance !== undefined)
            this.applyResistance = data.applyResistance;
        if (data.damageCap !== undefined)
            this.damageCap = data.damageCap;
    }
}
class CombatEffectStatGroup {
    constructor(data, game, where) {
        try {
            this.name = data.name;
            game.queueForSoftDependencyReg(data, this, where);
        } catch (e) {
            throw new DataConstructionError(CombatEffectStatGroup.name, e);
        }
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.modifiers !== undefined)
                this.modifiers = game.getModifierValuesFromData(data.modifiers);
            if (data.combatEffects !== undefined)
                this.combatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(data.combatEffects);
        } catch (e) {
            throw new DataConstructionError(CombatEffectStatGroup.name, e);
        }
    }
}
class CombatEffectTTSpan {
    constructor(data, transpiler, listener) {
        try {
            if (data.className !== undefined)
                this.className = data.className;
            if (data.character !== undefined)
                this.character = data.character;
            if (data.condition !== undefined)
                this.condition = new BehaviourTriggerCondition(data.condition, transpiler, listener);
        } catch (e) {
            throw new DataConstructionError(CombatEffectTTSpan.name, e);
        }
    }
    /** Checks if this span should currently show */
    shouldShow(activeEffect) {
        return ((this.condition === undefined || activeEffect.checkCondition(this.condition)) &&
            (this.character === undefined || (this.character === 'Player') === activeEffect.isOnPlayer));
    }
    getExpressionRecord(data, transpiler, listener) {
        const exprRecord = {};
        Object.entries(data).forEach(([key, value]) => {
            const {
                func,
                expr
            } = transpiler.buildFunctionExpr(value, `Error constructing ${CombatEffectLangTTSpan.name}. templateData.${key}`);
            exprRecord[key] = func;
            listener.addExprTriggers(expr);
        });
        return exprRecord;
    }
    /** Evaluates a record of expressions into a record of strings */
    evalExpressionRecord(exprRecord, activeEffect) {
        const templateData = {};
        Object.entries(exprRecord).forEach(([name, func]) => {
            templateData[name] = `${func(activeEffect)}`;
        });
        return templateData;
    }
    createSpan(text) {
        return createElement('span', {
            className: this.className,
            text,
        });
    }
}
/** A tooltip span that displays a lang string. Can be templated. */
class CombatEffectLangTTSpan extends CombatEffectTTSpan {
    constructor(data, transpiler, listener) {
        super(data, transpiler, listener);
        this.type = 'LangString';
        try {
            this.langID = data.langID;
            if (data.templateData !== undefined)
                this.templateData = this.getExpressionRecord(data.templateData, transpiler, listener);
        } catch (e) {
            throw new DataConstructionError(CombatEffectLangTTSpan.name, e);
        }
    }
    getSpans(activeEffect) {
        let text = getLangString(this.langID);
        if (this.templateData !== undefined)
            text = templateString(text, this.evalExpressionRecord(this.templateData, activeEffect));
        return [this.createSpan(text)];
    }
}
/** A tooltip span that displays the string value specified. Can be templated.*/
class CombatEffectStringTTSpan extends CombatEffectTTSpan {
    constructor(data, transpiler, listener) {
        super(data, transpiler, listener);
        this.type = 'String';
        try {
            this.value = data.value;
            if (data.templateData !== undefined)
                this.templateData = this.getExpressionRecord(data.templateData, transpiler, listener);
        } catch (e) {
            throw new DataConstructionError(CombatEffectStringTTSpan.name, e);
        }
    }
    getSpans(activeEffect) {
        let text = this.value;
        if (this.templateData !== undefined)
            text = templateString(text, this.evalExpressionRecord(this.templateData, activeEffect));
        return [this.createSpan(text)];
    }
}
/** A tooltip span that displays the currently applied values of a stat group */
class CombatEffectStatsTTSpan extends CombatEffectTTSpan {
    constructor(data, transpiler, listener) {
        super(data, transpiler, listener);
        this.type = 'Stats';
        this.statGroupName = data.statGroupName;
        listener.addStatGroup(this.statGroupName);
    }
    getSpans(activeEffect) {
        const mult = activeEffect.getStatGroup(this.statGroupName);
        return StatObject.formatDescriptions(activeEffect.effect.statGroups[this.statGroupName], getElementDescriptionFormatter('span', this.className), mult, mult);
    }
}
/** A tooltip span that displays turns specifically referencing the player */
class CombatEffectTurnsTTSpan extends CombatEffectTTSpan {
    constructor(data, transpiler, listener) {
        super(data, transpiler, listener);
        try {
            this.type = data.type;
            const turns = transpiler.buildFunctionExpr(data.turns, `Error constructing ${CombatEffectTurnsTTSpan.name}. turns`);
            this.turns = turns.func;
            listener.addExprTriggers(turns.expr);
        } catch (e) {
            throw new DataConstructionError(CombatEffectTurnsTTSpan.name, e);
        }
    }
    getSpans(activeEffect) {
        const turns = this.turns(activeEffect);
        let text;
        switch (this.type) {
            case 'PlayerTurns':
                text = templateLangString('COMBAT_MISC_YOUR_TURNS_LEFT', {
                    count: `${turns}`
                });
                break;
            case 'EnemyTurns':
                text = templateLangString(turns === 1 ? 'COMBAT_MISC_ONE_ENEMY_TURN_LEFT' : 'COMBAT_MISC_ENEMY_TURNS_LEFT', {
                    count: `${turns}`,
                });
                break;
            case 'Turns':
                text = templateLangString(turns === 1 ? 'COMBAT_MISC_ONE_TURN_LEFT' : 'COMBAT_MISC_TURNS_LEFT', {
                    count: `${turns}`,
                });
                break;
            case 'LastsForTurns':
                {
                    let langID;
                    switch (turns) {
                        case 1:
                            langID = 'COMBAT_MISC_LASTS_UNTIL_END_OF_ATTACK';
                            break;
                        case 2:
                            langID = 'COMBAT_MISC_LASTS_FOR_1_MORE_TURN';
                            break;
                        default:
                            langID = 'COMBAT_MISC_LASTS_FOR_TURNS';
                    }
                    text = templateLangString(langID, {
                        count: `${turns - 1}`
                    });
                }
                break;
        }
        return [this.createSpan(text)];
    }
}
/** A tooltip span that displays stacks and max stacks */
class CombatEffectStacksWithMaxTTSpan extends CombatEffectTTSpan {
    constructor(data, transpiler, listener) {
        super(data, transpiler, listener);
        this.type = 'StacksWithMax';
        try {
            const stacks = transpiler.buildFunctionExpr(data.stacks, `Error constructing ${CombatEffectStacksWithMaxTTSpan.name}. stacks`);
            this.stacks = stacks.func;
            listener.addExprTriggers(stacks.expr);
            const maxStacks = transpiler.buildFunctionExpr(data.maxStacks, `Error constructing ${CombatEffectStacksWithMaxTTSpan.name}. stacks`);
            this.maxStacks = maxStacks.func;
            listener.addExprTriggers(maxStacks.expr);
        } catch (e) {
            throw new DataConstructionError(CombatEffectStacksWithMaxTTSpan.name, e);
        }
    }
    getSpans(activeEffect) {
        const stacks = this.stacks(activeEffect);
        const maxStacks = this.maxStacks(activeEffect);
        return [
            this.createSpan(templateLangString(stacks === 1 ? 'COMBAT_MISC_ONE_STACK_WITH_MAX' : 'COMBAT_MISC_STACKS_WITH_MAX', {
                count: `${stacks}`,
                max: `${maxStacks}`,
            })),
        ];
    }
}
/** Registered data class used to categorize CombatEffects */
class CombatEffectGroup extends NamespacedObject {
    constructor(namespace, data) {
        super(namespace, data.id);
        this._name = data.name;
        if (data.nameLang !== undefined)
            this._nameLang = data.nameLang;
        this.adjective = data.adjective;
    }
    /** Gets the display name of this effect group for use in modifiers */
    get name() {
        if (this._nameLang !== undefined)
            return getLangString(this._nameLang);
        return this._name;
    }
}
class BehaviourTriggerCondition {
    constructor(data, transpiler, listener) {
        try {
            this.operator = data.operator;
            const lhValue = transpiler.buildFunctionExpr(data.lhValue, `Error constructing ${BehaviourTriggerCondition.name} lhValue:`);
            this.lhValue = lhValue.func;
            const rhValue = transpiler.buildFunctionExpr(data.rhValue, `Error constructing ${BehaviourTriggerCondition.name} rhValue:`);
            this.rhValue = rhValue.func;
            if (listener !== undefined) {
                listener.addExprTriggers(lhValue.expr);
                listener.addExprTriggers(rhValue.expr);
            }
        } catch (e) {
            throw new DataConstructionError(BehaviourTriggerCondition.name, e);
        }
    }
}
/** Base class for all Combat Effect Behaviour Triggers */
class CombatBehaviourTrigger {
    constructor(data, transpiler) {
        try {
            if (data.condition !== undefined)
                this.condition = new BehaviourTriggerCondition(data.condition, transpiler);
        } catch (e) {
            throw new DataConstructionError(CombatBehaviourTrigger.name, e);
        }
    }
    /**
     * Assigns Event Handlers for the behaviour trigger
     * @param handler The function to call when the trigger occurs
     * @param activeEffect The active effect this trigger was called from
     * @param character The character the effect was active on
     * @returns A function that unassigns the event handler
     */
    assignHandler(handler, activeEffect, character) {
        const newHandler = (e) => {
            if (this.doesEventMatch(e, activeEffect, character))
                handler(e);
        };
        this._assignHandler(newHandler, activeEffect, character);
        return () => this._unassignHandler(newHandler, activeEffect, character);
    }
    /** Checks if all conditions that have been defined are met */
    doesEventMatch(event, activeEffect, character) {
        return this.condition === undefined || activeEffect.checkCondition(this.condition);
    }
}
/** Behaviour trigger that occurs at the end of a character's turn */
class EndOfTurnTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
        this.target = data.target;
    }
    _assignHandler(handler, activeEffect, character) {
        if (this.target === 'Self') {
            character.on('endOfTurn', handler);
        } else {
            character.target.on('endOfTurn', handler);
        }
    }
    _unassignHandler(handler, activeEffect, character) {
        if (this.target === 'Self') {
            character.off('endOfTurn', handler);
        } else {
            character.target.off('endOfTurn', handler);
        }
    }
}
/** Behaviour trigger that occurs when the character hits with an attack */
class HitWithAttackTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
    }
    _assignHandler(handler, activeEffect, character) {
        character.on('hitWithAttack', handler);
    }
    _unassignHandler(handler, activeEffect, character) {
        character.off('hitWithAttack', handler);
    }
}
/** Behaviour trigger that occurs when the character misses with an attack */
class MissedWithAttackTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
    }
    _assignHandler(handler, activeEffect, character) {
        character.on('missedWithAttack', handler);
    }
    _unassignHandler(handler, activeEffect, character) {
        character.off('missedWithAttack', handler);
    }
}
/** Behaviour trigger that occurs when the character is hit by an attack */
class HitByAttackTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
    }
    _assignHandler(handler, activeEffect, character) {
        character.on('hitByAttack', handler);
    }
    _unassignHandler(handler, activeEffect, character) {
        character.off('hitByAttack', handler);
    }
}
/** Behaviour trigger that occurs when the character evades an attack */
class EvadedAttackTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
    }
    _assignHandler(handler, activeEffect, character) {
        character.on('evadedAttack', handler);
    }
    _unassignHandler(handler, activeEffect, character) {
        character.off('evadedAttack', handler);
    }
}
/** Behaviour trigger that occurs after a character attacks */
class PostAttackTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
    }
    _assignHandler(handler, activeEffect, character) {
        character.on('attack', handler);
    }
    _unassignHandler(handler, activeEffect, character) {
        character.off('attack', handler);
    }
}
/** Behaviour trigger that occurs after a character is attacked */
class WasAttackedTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
    }
    _assignHandler(handler, activeEffect, character) {
        character.on('wasAttacked', handler);
    }
    _unassignHandler(handler, activeEffect, character) {
        character.off('wasAttacked', handler);
    }
}
/** Behaviour trigger that occurs at the end of a fight */
class EndOfFightTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
    }
    _assignHandler(handler, activeEffect, character) {
        character.manager.on('endOfFight', handler);
    }
    _unassignHandler(handler, activeEffect, character) {
        character.manager.off('endOfFight', handler);
    }
}
/** Behaviour trigger that occurs whenever the player would use prayer points. Having 2 active prayers consume points at the same time causes the behaviour to execute twice. */
class PrayerPointUseTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
    }
    _assignHandler(handler, activeEffect, character) {
        character.manager.player.on('prayerPointsUsed', handler);
    }
    _unassignHandler(handler, activeEffect, character) {
        character.manager.player.off('prayerPointsUsed', handler);
    }
    doesEventMatch(event, activeEffect, character) {
        return (super.doesEventMatch(event, activeEffect, character) &&
            (this.isUnholy === undefined || event.isUnholy === this.isUnholy));
    }
}
/** Behaviour trigger that occurs whenever the player changes their current equipment. Can occur due to (un)equipping items, or changing equipment sets. */
class EquipmentChangedTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler, game) {
        super(data, transpiler);
        game.queueForSoftDependencyReg(data, this);
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.isNotEquipped !== undefined) {
                this.isNotEquipped = game.items.equipment.getArrayFromIds(data.isNotEquipped);
            }
            if (data.isEquipped !== undefined) {
                this.isEquipped = game.items.equipment.getArrayFromIds(data.isEquipped);
            }
        } catch (e) {
            throw new DataConstructionError(EquipmentChangedTrigger.name, e);
        }
    }
    _assignHandler(handler, activeEffect, character) {
        character.manager.player.on('equipmentChanged', handler);
    }
    _unassignHandler(handler, activeEffect, character) {
        character.manager.player.off('equipmentChanged', handler);
    }
    doesEventMatch(event, activeEffect, character) {
        return (super.doesEventMatch(event, activeEffect, character) &&
            (this.isNotEquipped === undefined ||
                !this.isNotEquipped.some((item) => event.player.equipment.checkForItem(item))) &&
            (this.isEquipped === undefined || this.isEquipped.every((item) => event.player.equipment.checkForItem(item))));
    }
}
/** Behaviour trigger that occurs when the specified parameter changes on the ActiveCombatEffect */
class ParameterChangedTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
        this.paramName = data.paramName;
    }
    _assignHandler(handler, activeEffect) {
        activeEffect.on('parameterChanged', handler);
    }
    _unassignHandler(handler, activeEffect) {
        activeEffect.on('parameterChanged', handler);
    }
    doesEventMatch(event, activeEffect, character) {
        return event.paramName === this.paramName && super.doesEventMatch(event, activeEffect, character);
    }
}
/** Behaviour trigger that occurs when the specified stat group changes on the ActiveCombatEffect */
class StatsChangedTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
        this.statGroupName = data.statGroupName;
    }
    _assignHandler(handler, activeEffect) {
        activeEffect.on('statsChanged', handler);
    }
    _unassignHandler(handler, activeEffect) {
        activeEffect.on('statsChanged', handler);
    }
    doesEventMatch(event, activeEffect, character) {
        return event.statGroupName === this.statGroupName && super.doesEventMatch(event, activeEffect, character);
    }
}
/** Behaviour trigger that occurs when the specified timer fires on the ActiveCombatEffect */
class TimerFiredTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
        this.timerName = data.timerName;
    }
    _assignHandler(handler, activeEffect) {
        activeEffect.on('timerFired', handler);
    }
    _unassignHandler(handler, activeEffect) {
        activeEffect.on('timerFired', handler);
    }
    doesEventMatch(event, activeEffect, character) {
        return event.timerName === this.timerName && super.doesEventMatch(event, activeEffect, character);
    }
}
/** Behaviour trigger that occurs when an effect is first applied to the character */
class EffectAppliedTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
    }
    _assignHandler(handler, activeEffect) {
        activeEffect.on('applied', handler);
    }
    _unassignHandler(handler, activeEffect) {
        activeEffect.on('applied', handler);
    }
}
/** Behaviour trigger that occurs when an effect is applied to the character, but is already active */
class EffectReappliedTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
    }
    _assignHandler(handler, activeEffect) {
        activeEffect.on('reapplied', handler);
    }
    _unassignHandler(handler, activeEffect) {
        activeEffect.on('reapplied', handler);
    }
}
/** Behaviour trigger that occurs just before an effect is removed from the character */
class EffectRemovedTrigger extends CombatBehaviourTrigger {
    constructor(data, transpiler) {
        super(data, transpiler);
    }
    _assignHandler(handler, activeEffect) {
        activeEffect.on('removed', handler);
    }
    _unassignHandler(handler, activeEffect) {
        activeEffect.on('removed', handler);
    }
}
/** Base class for all Combat Effect Behaviours */
class CombatEffectBehaviour {
    constructor(data, game, transpiler) {
        /** Array of triggers that determine when this should be executed */
        this.triggersOn = [];
        /** Determines priority of executing this behaviour over others. Triggers will be assigned from lowest to highest priority behaviours. */
        this.priority = 0;
        try {
            this.triggersOn = data.triggersOn.map((tData) => this.constructTrigger(tData, transpiler, game));
            if (data.chance !== undefined)
                this.chance = transpiler.buildFunction(data.chance, `Error constructing ${CombatEffectBehaviour.name} chance:`);
            if (data.priority !== undefined)
                this.priority = data.priority;
        } catch (e) {
            throw new DataConstructionError(CombatEffectBehaviour.name, e);
        }
    }
    /** Executes the given behaviour if the roll for chance is successful */
    execute(character, activeEffect) {
        if (this.chance !== undefined && !rollPercentage(this.chance(activeEffect)))
            return;
        this._execute(character, activeEffect);
    }
    /** Constructs any registered trigger from data */
    constructTrigger(data, transpiler, game) {
        const TriggerClass = CombatEffectBehaviour.triggerClasses[data.type];
        if (TriggerClass === undefined)
            throw new Error(`Error constructing CombatEffectBehaviour. No trigger with type: ${data.type} has been registered`);
        // @ts-expect-error trigger data is a discriminated union, so the data object matches the constructor arg.
        return new TriggerClass(data, transpiler, game);
    }
    /** Registers a new trigger type that can be used in behaviours */
    static registerTrigger(name, constructor) {
        if (name in CombatEffectBehaviour.triggerClasses)
            throw new Error(`Error registering CombatBehaviourTrigger. A trigger with the name ${name} already exists.`);
        this.triggerClasses[name] = constructor;
    }
    /** Registers the default triggers that ship with the game */
    static registerDefaultTriggers() {
        this.registerTrigger('EndOfTurn', EndOfTurnTrigger);
        this.registerTrigger('HitWithAttack', HitWithAttackTrigger);
        this.registerTrigger('MissedWithAttack', MissedWithAttackTrigger);
        this.registerTrigger('HitByAttack', HitByAttackTrigger);
        this.registerTrigger('EvadedAttack', EvadedAttackTrigger);
        this.registerTrigger('PostAttack', PostAttackTrigger);
        this.registerTrigger('WasAttacked', WasAttackedTrigger);
        this.registerTrigger('EndOfFight', EndOfFightTrigger);
        this.registerTrigger('PrayerPointUse', PrayerPointUseTrigger);
        this.registerTrigger('EquipmentChanged', EquipmentChangedTrigger);
        this.registerTrigger('ParameterChange', ParameterChangedTrigger);
        this.registerTrigger('StatsChange', StatsChangedTrigger);
        this.registerTrigger('TimerFired', TimerFiredTrigger);
        this.registerTrigger('EffectApplied', EffectAppliedTrigger);
        this.registerTrigger('EffectReapplied', EffectReappliedTrigger);
        this.registerTrigger('EffectRemoved', EffectRemovedTrigger);
    }
}
/** Stores the constructors of registered trigger classes */
CombatEffectBehaviour.triggerClasses = {};
CombatEffectBehaviour.registerDefaultTriggers();
/** Combat effect behaviour that interrupts the characters turn, resetting their action timer and cancelling any special attacks they were performing */
class InterruptTurnBehaviour extends CombatEffectBehaviour {
    constructor(data, game, transpiler) {
        super(data, game, transpiler);
    }
    _execute(character, activeEffect) {
        character.interruptAction();
    }
}
/** Combat effect behaviour that processes an effect applicator via the character the effect is applied to when executed */
class ProcessEffectApplicatorBehaviour extends CombatEffectBehaviour {
    constructor(data, game, transpiler) {
        super(data, game, transpiler);
        try {
            this.applicator = game.getCombatEffectApplicatorFromData(data.applicator);
        } catch (e) {
            throw new DataConstructionError(ProcessEffectApplicatorBehaviour.name, e);
        }
    }
    _execute(character, activeEffect) {
        character.processEffectApplicator(this.applicator, {
            type: 'Effect',
        });
    }
}
/** Combat effect behaviour that removes the effect from the character */
class RemoveEffectBehaviour extends CombatEffectBehaviour {
    constructor(data, game, transpiler) {
        super(data, game, transpiler);
    }
    _execute(character, activeEffect) {
        character.removeCombatEffect(activeEffect.effect);
    }
}
/** Base class for Combat effect behaviours that modify a value on an ActiveCombatEffect */
class ModifyBehaviour extends CombatEffectBehaviour {
    constructor(data, game, transpiler) {
        super(data, game, transpiler);
        try {
            this.newValue = transpiler.buildFunction(data.newValue, 'Error constructing ModifyBehaviour newValue:');
        } catch (e) {
            throw new DataConstructionError(ModifyBehaviour.name, e);
        }
    }
    /** Computes the new value to set the stat group/parameter to */
    getNewValue(activeEffect) {
        return this.newValue(activeEffect);
    }
}
/** Combat Effect Behaviour that modifies the value of a stat group on the ActiveCombatEffect. Modifiers/Effect Applicators are automatically applied to the character. */
class ModifyStatsBehaviour extends ModifyBehaviour {
    constructor(data, game, transpiler) {
        super(data, game, transpiler);
        this.statGroupName = data.statGroupName;
    }
    _execute(character, activeEffect) {
        activeEffect.setStats(this.statGroupName, this.getNewValue(activeEffect));
    }
}
/** Combat Effect Behaviour that modifies the current value of a parameter on the ActiveCombatEffect */
class ModifyParameterBehaviour extends ModifyBehaviour {
    constructor(data, game, transpiler) {
        super(data, game, transpiler);
        this.paramName = data.paramName;
    }
    _execute(character, activeEffect) {
        activeEffect.setParameter(this.paramName, this.getNewValue(activeEffect));
    }
}
/** Combat Effect Behaviour that causes damage to the character. Will damage barrier if the appropriate damageType is set. */
class DamageCharacterBehaviour extends CombatEffectBehaviour {
    constructor(data, game, transpiler) {
        super(data, game, transpiler);
        this.game = game;
        try {
            this.value = transpiler.buildFunction(data.value, `Error constructing ${DamageCharacterBehaviour.name} value:`);
            if (data.damageType !== undefined)
                this.damageType = data.damageType;
        } catch (e) {
            throw new DataConstructionError(DamageCharacterBehaviour.name, e);
        }
    }
    _execute(character, activeEffect) {
        let damage = this.value(activeEffect);
        damage = Math.min(damage, character.hitpoints);
        let source = 'Attack';
        if (this.damageType !== undefined) {
            source = this.damageType;
            // Apply lifesteal to the source character of the effect
            const lifesteal = activeEffect.sourceCharacter.modifiers.getDOTLifesteal(this.damageType);
            const healing = Math.floor((lifesteal * damage) / 100);
            if (healing > 0)
                activeEffect.sourceCharacter.heal(healing);
            // Give currency based on poison damage
            if (activeEffect.sourceCharacter instanceof Player &&
                (this.damageType === 'Poison' || this.damageType === 'DeadlyPoison')) {
                activeEffect.sourceCharacter.modifiers.forEachCurrency("melvorD:currencyGainPerPoisonDamage" /* ModifierIDs.currencyGainPerPoisonDamage */ , (value, currency) => {
                    const amountToAdd = (damage * value) / numberMultiplier / 100;
                    character.manager.addCurrency(currency, amountToAdd, 'Combat.PoisonDOT');
                });
            }
        }
        if (damage > 0)
            character.damage(damage, source);
    }
}
/** Combat Effect Behaviour that damages a character's barrier. Cannot damage hitpoints. */
class DamageBarrierBehaviour extends CombatEffectBehaviour {
    constructor(data, game, transpiler) {
        super(data, game, transpiler);
        this.game = game;
        try {
            this.value = transpiler.buildFunction(data.value, `Error constructing ${DamageBarrierBehaviour.name} value:`);
            if (data.damageType !== undefined)
                this.damageType = data.damageType;
        } catch (e) {
            throw new DataConstructionError(DamageBarrierBehaviour.name, e);
        }
    }
    _execute(character, activeEffect) {
        let damage = this.value(activeEffect);
        damage = Math.min(damage, character.barrier);
        let source = 'SummonAttack';
        if (this.damageType !== undefined)
            source = this.damageType;
        if (damage > 0)
            character.damageBarrier(damage, source);
    }
}
/** Combat Effect Behaviour that heals the character's hitpoints. */
class HealCharacterBehaviour extends CombatEffectBehaviour {
    constructor(data, game, transpiler) {
        super(data, game, transpiler);
        try {
            this.value = transpiler.buildFunction(data.value, `Error constructing ${HealCharacterBehaviour.name} value:`);
        } catch (e) {
            throw new DataConstructionError(HealCharacterBehaviour.name, e);
        }
    }
    _execute(character, activeEffect) {
        const healing = this.value(activeEffect);
        if (healing > 0)
            character.heal(healing);
    }
}
class HealBarrierBehaviour extends CombatEffectBehaviour {
    constructor(data, game, transpiler) {
        super(data, game, transpiler);
        try {
            this.value = transpiler.buildFunction(data.value, `Error constructing ${HealBarrierBehaviour.name} value:`);
        } catch (e) {
            throw new DataConstructionError(HealBarrierBehaviour.name, e);
        }
    }
    _execute(character, activeEffect) {
        const amount = this.value(activeEffect);
        if (amount > 0)
            character.addBarrier(amount);
    }
}
/** Combat Effect Behaviour that starts the specified timer on the ActiveCombatEffect */
class StartTimerBehaviour extends CombatEffectBehaviour {
    constructor(data, game, transpiler) {
        super(data, game, transpiler);
        try {
            this.timerName = data.timerName;
            this.value = transpiler.buildFunction(data.value, `Error constructing ${StartTimerBehaviour.name} value:`);
        } catch (e) {
            throw new DataConstructionError(StartTimerBehaviour.name, e);
        }
    }
    _execute(character, activeEffect) {
        const interval = this.value(activeEffect);
        activeEffect.startTimer(this.timerName, interval);
    }
}
/** Combat Effect Behaviour that stops the specified timer on the ActiveCombatEffect */
class StopTimerBehaviour extends CombatEffectBehaviour {
    constructor(data, game, transpiler) {
        super(data, game, transpiler);
        this.timerName = data.timerName;
    }
    _execute(character, activeEffect) {
        activeEffect.stopTimer(this.timerName);
    }
}
/** Combat Effect Behaviour that updates the current modifier multiplier of the player's Unholy Prayers */
class UpdatePrayerModifiersBehaviour extends CombatEffectBehaviour {
    constructor(data, game, transpiler) {
        super(data, game, transpiler);
        try {
            this.updateTo = transpiler.buildFunction(data.updateTo, `Error constructing ${UpdatePrayerModifiersBehaviour.name} updateTo:`);
        } catch (e) {
            throw new DataConstructionError(UpdatePrayerModifiersBehaviour.name, e);
        }
    }
    _execute(character, activeEffect) {
        character.manager.player.updateUnholyPrayerMultiplier(this.updateTo(activeEffect));
    }
}
class ApplyCorruptionBehaviour extends CombatEffectBehaviour {
    constructor(data, game, transpiler) {
        super(data, game, transpiler);
        try {
            if (game.corruption === undefined)
                throw new UnregisteredObjectError(Skill.name, "melvorItA:Corruption" /* SkillIDs.Corruption */ );
            this.corruption = game.corruption;
        } catch (e) {
            throw new DataConstructionError(ApplyCorruptionBehaviour.name, e);
        }
    }
    _execute(character, activeEffect) {
        let monsterLevel = undefined;
        if (character instanceof Enemy && character.monster !== undefined)
            monsterLevel = character.monster.combatLevel;
        let effectCount = 1 + character.modifiers.extraCorruptions;
        if (rollPercentage(character.modifiers.bonusCorruptionChance))
            effectCount++;
        const applicators = this.corruption.corruptionEffects.getApplicators(effectCount, monsterLevel);
        character.processEffectApplicators(applicators, {
            type: 'Effect'
        });
        this.corruption.incStat(character instanceof Player ? 0 /* CorruptionStats.TimesCorrupted */ : 1 /* CorruptionStats.TimesEnemyCorrupted */ );
    }
}
/** Utility class for assigning event handlers that cause a rendering update for ActiveCombatEffects */
class CombatEffectRenderListener {
    constructor() {
        /** The names of parameters that should cause a render update when changed */
        this.parameters = new Set();
        /** The names of stat groups that should cause a render update when changed */
        this.statGroups = new Set();
        /** Array of triggers that cause rendering updates */
        this.triggers = [];
    }
    /** Add triggers for combat effect expression values */
    addExprTriggers(expr) {
        expr.accept(this);
    }
    addParameter(name) {
        this.parameters.add(name);
    }
    addStatGroup(name) {
        this.statGroups.add(name);
    }
    /** Constructs the actual trigger objects */
    constructTriggers(transpiler) {
        this.triggers = [];
        this.parameters.forEach((paramName) => this.triggers.push(new ParameterChangedTrigger({
            type: 'ParameterChange',
            paramName
        }, transpiler)));
        this.statGroups.forEach((statGroupName) => this.triggers.push(new StatsChangedTrigger({
            type: 'StatsChange',
            statGroupName: statGroupName
        }, transpiler)));
    }
    /** Assigns a rendering handler for each trigger, and returns an array of unassignment functions */
    assignHandlers(handler, activeEffect, character) {
        return this.triggers.map((trigger) => trigger.assignHandler(handler, activeEffect, character));
    }
    visitTernaryExpr(expr) {
        this.addExprTriggers(expr.condition);
        this.addExprTriggers(expr.left);
        this.addExprTriggers(expr.right);
    }
    visitLogicalExpr(expr) {
        this.addExprTriggers(expr.left);
        this.addExprTriggers(expr.right);
    }
    visitBinaryExpr(expr) {
        this.addExprTriggers(expr.left);
        this.addExprTriggers(expr.right);
    }
    visitUnaryExpr(expr) {
        this.addExprTriggers(expr.right);
    }
    visitLiteralExpr(expr) {}
    visitBuiltInExpr(expr) {
        expr.callArgs.forEach((arg) => this.addExprTriggers(arg));
    }
    visitReferenceExpr(expr) {
        switch (expr.names[0].lexeme) {
            case 'param':
            case 'p':
                this.parameters.add(expr.names[1].lexeme);
                break;
            case 'statGroup':
                this.statGroups.add(expr.names[1].lexeme);
                break;
        }
    }
    visitGroupingExpr(expr) {
        this.addExprTriggers(expr.expression);
    }
}
/** Registered data class for Combat Effects. Determines how the effect behaves and is rendered */
class CombatEffect extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        /** Determines the spans that are rendered in the active effects tooltip */
        this.tooltipSpans = [];
        /** If this effect should not render an icon */
        this.noIcon = false;
        /** Handles the assignment of event handlers for rendering */
        this.renderListener = new CombatEffectRenderListener();
        /** Record of parameter names to initial values */
        this.parameters = {};
        /** Record of stat group names to stat groups */
        this.statGroups = {};
        /** The names of timers that should be constructed in the active effect */
        this.timers = [];
        /** Record of damage group names to damage groups */
        this.damageGroups = {};
        /** Behaviours that determine what this effect does */
        this.behaviours = [];
        /** Effect groups this effect belongs to */
        this.effectGroups = [];
        /** Effect groups that if present, prevent this effect from being applied */
        this.exclusiveGroups = [];
        try {
            if (data.parameters !== undefined)
                data.parameters.forEach(({
                    name,
                    initialValue
                }) => {
                    this.parameters[name] = initialValue;
                });
            if (data.statGroups !== undefined) {
                data.statGroups.forEach((groupData) => {
                    this.statGroups[groupData.name] = new CombatEffectStatGroup(groupData, game, `${CombatEffect.name} with id "${this.id}"`);
                });
            }
            if (data.timers !== undefined)
                this.timers = data.timers;
            if (data.damageGroups !== undefined)
                data.damageGroups.forEach((groupData) => {
                    this.damageGroups[groupData.name] = new CombatEffectDamageGroup(groupData);
                });
            const numberTranspiler = expressions.getCombatEffectNumberTranspiler(this);
            this._name = data.name;
            if (data.nameLang)
                this._nameLang = data.nameLang;
            this._media = data.media;
            if (data.turnText !== undefined) {
                const turnText = numberTranspiler.buildFunctionExpr(data.turnText, `turnText:`);
                this.renderListener.addExprTriggers(turnText.expr);
                this.turnText = turnText.func;
            }
            if (data.tooltipSpans !== undefined)
                this.tooltipSpans = data.tooltipSpans.map((spanData) => {
                    switch (spanData.type) {
                        case 'LangString':
                            return new CombatEffectLangTTSpan(spanData, numberTranspiler, this.renderListener);
                        case 'String':
                            return new CombatEffectStringTTSpan(spanData, numberTranspiler, this.renderListener);
                        case 'Stats':
                            return new CombatEffectStatsTTSpan(spanData, numberTranspiler, this.renderListener);
                        case 'StacksWithMax':
                            return new CombatEffectStacksWithMaxTTSpan(spanData, numberTranspiler, this.renderListener);
                        default:
                            return new CombatEffectTurnsTTSpan(spanData, numberTranspiler, this.renderListener);
                    }
                });
            if (data.progressBar !== undefined) {
                const currentValue = numberTranspiler.buildFunctionExpr(data.progressBar.currentValue, `progressbar.currentValue:`);
                const maxValue = numberTranspiler.buildFunctionExpr(data.progressBar.maxValue, `progressbar.maxValue:`);
                this.progressBar = {
                    currentValue: currentValue.func,
                    maxValue: maxValue.func,
                    barStyle: data.progressBar.barStyle,
                    fullStyles: data.progressBar.fullStyles,
                };
                this.renderListener.addExprTriggers(currentValue.expr);
                this.renderListener.addExprTriggers(maxValue.expr);
            }
            if (data.noIcon !== undefined)
                this.noIcon = data.noIcon;
            if (data.descriptionTemplateData !== undefined) {
                const dTD = data.descriptionTemplateData;
                this.descriptionTemplateData = {};
                if (dTD.initialParameters !== undefined) {
                    const initialParamTranspiler = expressions.getInitialParamNumberTranspiler(Object.keys(this.parameters));
                    const initParams = {};
                    Object.entries(dTD.initialParameters).forEach(([key, value]) => {
                        initParams[key] = initialParamTranspiler.buildFunction(value, `descriptionTemplateData.initialParameters.${key}:`);
                    });
                    this.descriptionTemplateData.initialParameters = initParams;
                }
                if (dTD.statGroups !== undefined)
                    this.descriptionTemplateData.statGroups = dTD.statGroups;
                if (dTD.damageGroups !== undefined)
                    this.descriptionTemplateData.damageGroups = dTD.damageGroups;
            }
            this.target = data.target;
            this.behaviours = data.behaviours.map((data) => {
                const BehaviourClass = CombatEffect.behaviourClasses[data.type];
                if (BehaviourClass === undefined)
                    throw new Error(`No behaviour with type: ${data.type} has been registered`);
                // @ts-expect-error behaviour data is a discriminated union, so the data object matches the constructor arg.
                return new BehaviourClass(data, game, numberTranspiler);
            });
            if (data.effectGroups !== undefined) {
                this.effectGroups = game.combatEffectGroups.getArrayFromIds(data.effectGroups);
            }
            if (data.exclusiveGroups !== undefined) {
                this.exclusiveGroups = game.combatEffectGroups.getArrayFromIds(data.exclusiveGroups);
            }
            this.behaviours.sort((a, b) => b.priority - a.priority);
            this.renderListener.constructTriggers(numberTranspiler);
            this.modQuery = new ModifierQuery({
                effectGroup: this.effectGroups
            });
        } catch (e) {
            throw new DataConstructionError(CombatEffect.name, e, this.id);
        }
    }
    /** Gets the name to display in the effects tooltip */
    get name() {
        if (this._nameLang !== undefined)
            return getLangString(this._nameLang);
        else if (this.isModded)
            return this._name;
        else
            return getLangString(`COMBAT_EFFECT_NAME_${this.localID}`);
    }
    /** URI for the image's source in the effect's icon */
    get media() {
        return this.getMediaURL(this._media);
    }
    /** Adds string template data to an existing string template data object */
    addTemplateData(data, preKey, initialParams) {
        const addKey = (key, value) => {
            data[`${preKey}${key}`] = value;
        };
        const templateData = this.descriptionTemplateData;
        if (templateData !== undefined) {
            if (templateData.initialParameters !== undefined) {
                const params = Object.assign({}, this.parameters, initialParams);
                Object.entries(templateData.initialParameters).forEach(([key, value]) => {
                    addKey(key, `${value(params)}`);
                });
            }
            if (templateData.statGroups !== undefined) {
                Object.entries(templateData.statGroups).forEach(([prefix, statGroupName]) => {
                    const statGroup = this.statGroups[statGroupName];
                    if (statGroup.modifiers !== undefined)
                        addEffectModifierTemplateData(data, statGroup.modifiers, preKey + prefix);
                });
            }
            if (templateData.damageGroups !== undefined) {
                Object.entries(templateData.damageGroups).forEach(([prefix, damageGroupName]) => {
                    addDamageTemplateData(data, this.damageGroups[damageGroupName].damage, preKey + prefix);
                });
            }
        }
    }
    /** Registers a new behaviour type that can be used in Combat Effects */
    static registerBehaviour(name, constructor) {
        if (name in CombatEffect.behaviourClasses)
            throw new Error(`Error registering CombatEffectBehaviour. A behaviour with the name ${name} already exists.`);
        this.behaviourClasses[name] = constructor;
    }
    /** Registers the default behaviours that ship with the game */
    static registerDefaultBehaviours() {
        this.registerBehaviour('InterruptTurn', InterruptTurnBehaviour);
        this.registerBehaviour('ProcessApplicator', ProcessEffectApplicatorBehaviour);
        this.registerBehaviour('RemoveEffect', RemoveEffectBehaviour);
        this.registerBehaviour('ModifyStats', ModifyStatsBehaviour);
        this.registerBehaviour('ModifyParameter', ModifyParameterBehaviour);
        this.registerBehaviour('DamageCharacter', DamageCharacterBehaviour);
        this.registerBehaviour('DamageBarrier', DamageBarrierBehaviour);
        this.registerBehaviour('HealCharacter', HealCharacterBehaviour);
        this.registerBehaviour('StartTimer', StartTimerBehaviour);
        this.registerBehaviour('StopTimer', StopTimerBehaviour);
        this.registerBehaviour('UpdatePrayerModifiers', UpdatePrayerModifiersBehaviour);
        this.registerBehaviour('ApplyCorruption', ApplyCorruptionBehaviour);
        this.registerBehaviour('HealBarrier', HealBarrierBehaviour);
    }
}
/** Stores the constructors of registered behaviour classes */
CombatEffect.behaviourClasses = {};
CombatEffect.registerDefaultBehaviours();
/** Registered data class that allows for the inheritance of partial combat effect data */
class CombatEffectTemplate extends NamespacedObject {
    constructor(namespace, data, game) {
        var _a;
        super(namespace, data.id);
        /** The list of all data keys that must be defined in order to construct a Combat Effect from this template */
        this.requiredKeys = [];
        try {
            const baseEffectData = {};
            (_a = data.baseTemplates) === null || _a === void 0 ? void 0 : _a.forEach((templateID) => {
                const template = game.combatEffectTemplates.getObjectSafe(templateID);
                this.mergeBaseEffectData(template.baseEffectData, baseEffectData);
            });
            this.mergeBaseEffectData(data.baseEffectData, baseEffectData);
            this.baseEffectData = baseEffectData;
            this.computeRequiredKeys();
        } catch (e) {
            throw new DataConstructionError(CombatEffectTemplate.name, e, this.id);
        }
    }
    /** Constructs a new CombatEffect, inheriting from this template's baseEffectData */
    createEffect(namespace, data, game) {
        // First clone the template
        const newEffectData = JSON.parse(JSON.stringify(this.baseEffectData));
        this.mergeBaseEffectData(data, newEffectData);
        newEffectData.id = data.id;
        if (this.validateEffectData(newEffectData, namespace.name)) {
            const effect = new CombatEffect(namespace, newEffectData, game);
            effect.template = this;
            return effect;
        } else {
            throw new Error(`Unreachable Error. How did you get here?`);
        }
    }
    /** Merges the data from one base effect data to another, mutating the to data, but keeping the from data intact. */
    mergeBaseEffectData(from, to) {
        var _a;
        from = JSON.parse(JSON.stringify(from));
        if (from.name !== undefined)
            to.name = from.name;
        if (from.nameLang !== undefined)
            to.nameLang = from.nameLang;
        if (from.media !== undefined)
            to.media = from.media;
        if (from.turnText !== undefined)
            to.turnText = from.turnText;
        if (from.tooltipSpans !== undefined) {
            if (to.tooltipSpans === undefined)
                to.tooltipSpans = from.tooltipSpans;
            else {
                const mergeMode = (_a = from.tooltipMergeMode) !== null && _a !== void 0 ? _a : 'Replace';
                switch (mergeMode) {
                    case 'Replace':
                        to.tooltipSpans = from.tooltipSpans;
                        break;
                    case 'Start':
                        to.tooltipSpans.unshift(...from.tooltipSpans);
                        break;
                    case 'End':
                        to.tooltipSpans.push(...from.tooltipSpans);
                        break;
                }
            }
        }
        if (from.progressBar !== undefined)
            to.progressBar = from.progressBar;
        if (from.noIcon !== undefined)
            to.noIcon = from.noIcon;
        const fromTemplate = from.descriptionTemplateData;
        const toTemplate = to.descriptionTemplateData;
        if (fromTemplate !== undefined) {
            if (toTemplate === undefined)
                to.descriptionTemplateData = from.descriptionTemplateData;
            else {
                if (fromTemplate.initialParameters !== undefined) {
                    if (toTemplate.initialParameters === undefined)
                        toTemplate.initialParameters = fromTemplate.initialParameters;
                    else
                        Object.assign(toTemplate.initialParameters, fromTemplate.initialParameters);
                }
                if (fromTemplate.statGroups !== undefined) {
                    if (toTemplate.statGroups === undefined)
                        toTemplate.statGroups = fromTemplate.statGroups;
                    else
                        Object.assign(toTemplate.statGroups, fromTemplate.statGroups);
                }
                if (fromTemplate.damageGroups !== undefined) {
                    if (toTemplate.damageGroups === undefined)
                        toTemplate.damageGroups = fromTemplate.damageGroups;
                    else
                        Object.assign(toTemplate.damageGroups, fromTemplate.damageGroups);
                }
            }
        }
        if (from.target !== undefined)
            to.target = from.target;
        if (from.parameters !== undefined) {
            if (to.parameters !== undefined) {
                const existingParams = to.parameters;
                from.parameters.forEach(({
                    name,
                    initialValue
                }) => {
                    const existing = existingParams.find((e) => e.name === name);
                    if (existing !== undefined)
                        existing.initialValue = initialValue;
                    else
                        existingParams.push({
                            name,
                            initialValue
                        });
                });
            } else {
                to.parameters = from.parameters;
            }
        }
        if (from.timers !== undefined) {
            if (to.timers !== undefined) {
                const existingTimers = to.timers;
                from.timers.forEach(({
                    name
                }) => {
                    const existing = existingTimers.find((e) => e.name === name);
                    if (existing === undefined)
                        existingTimers.push({
                            name
                        });
                });
            } else {
                to.timers = from.timers;
            }
        }
        if (from.statGroups !== undefined) {
            if (to.statGroups !== undefined) {
                const existingGroups = to.statGroups;
                from.statGroups.forEach((fromGroup) => {
                    const existing = existingGroups.find((e) => e.name === fromGroup.name);
                    if (existing === undefined)
                        existingGroups.push(fromGroup);
                    else {
                        if (fromGroup.modifiers)
                            existing.modifiers = fromGroup.modifiers;
                        else
                            delete existing.modifiers;
                        if (fromGroup.combatEffects)
                            existing.combatEffects = fromGroup.combatEffects;
                        else
                            delete existing.combatEffects;
                    }
                });
            } else {
                to.statGroups = from.statGroups;
            }
        }
        if (from.damageGroups !== undefined) {
            if (to.damageGroups !== undefined) {
                const existingGroups = to.damageGroups;
                from.damageGroups.forEach((group) => {
                    const existing = existingGroups.find((d) => d.name === group.name);
                    if (existing === undefined)
                        existingGroups.push(group);
                    else {
                        existing.damage = group.damage;
                        if (group.applyDamageModifiers)
                            existing.applyDamageModifiers = group.applyDamageModifiers;
                        else
                            delete existing.applyDamageModifiers;
                        if (group.applyTypeModifiers !== undefined)
                            existing.applyTypeModifiers = group.applyTypeModifiers;
                        else
                            delete existing.applyTypeModifiers;
                        if (group.applyResistance)
                            existing.applyResistance = group.applyResistance;
                        else
                            delete existing.applyResistance;
                        if (group.damageCap)
                            existing.damageCap = group.damageCap;
                        else
                            delete existing.damageCap;
                    }
                });
            } else {
                to.damageGroups = from.damageGroups;
            }
        }
        if (from.behaviours !== undefined) {
            if (to.behaviours === undefined)
                to.behaviours = from.behaviours;
            else
                to.behaviours.push(...from.behaviours);
        }
        if (from.effectGroups !== undefined) {
            if (to.effectGroups === undefined)
                to.effectGroups = from.effectGroups;
            else
                to.effectGroups.push(...from.effectGroups);
        }
        if (from.exclusiveGroups !== undefined) {
            if (to.exclusiveGroups === undefined)
                to.exclusiveGroups = from.exclusiveGroups;
            else
                to.exclusiveGroups.push(...from.exclusiveGroups);
        }
    }
    /** Computes the keys that must be defined in data to construct a CombatEffect from this template */
    computeRequiredKeys() {
        const requiredKeys = ['id', 'name', 'media', 'target', 'behaviours'];
        requiredKeys.forEach((key) => {
            if (!(key in this.baseEffectData))
                this.requiredKeys.push(key);
        });
    }
    /** Validates if Partial combat effect data can be used to construct an effect from this template */
    validateEffectData(data, namespace) {
        const fullID = `${namespace}:${data.id}`;
        this.requiredKeys.forEach((key) => {
            if (!(key in data))
                throw new Error(`Error constructing CombatEffect from template with id: ${fullID}. CombatEffectTemplate with id ${this.id} requires the ${key} property to be defined.`);
        });
        return true;
    }
}
/** Event fired by ActiveCombatEffect when a parameter changes in value */
class CombatEffectParameterChangedEvent extends GameEvent {
    /**
     *
     * @param paramName The name of the parameter that changed
     * @param oldValue The previous value of the parameter
     * @param newValue The new value of the parameter
     */
    constructor(paramName, oldValue, newValue) {
        super();
        this.paramName = paramName;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }
}
/** Event fired by ActiveCombatEffect when a stat group changes in value */
class CombatEffectStatsChangedEvent extends GameEvent {
    /**
     *
     * @param statGroupName The name of the stat group that changed
     * @param oldValue The previous value of the stat group
     * @param newValue The new value of the stat group
     */
    constructor(statGroupName, oldValue, newValue) {
        super();
        this.statGroupName = statGroupName;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }
}
/**
 * Event fired by ActiveCombatEffect when a timer fires
 */
class CombatEffectTimerFiredEvent extends GameEvent {
    /**
     *
     * @param timerName The name of the timer that fired
     */
    constructor(timerName) {
        super();
        this.timerName = timerName;
    }
}
/**
 * Event fired by ActiveCombatEffect when it is first applied to a character
 */
class CombatEffectAppliedEvent extends GameEvent {
    /**
     *
     * @param source The source of the effect application
     */
    constructor(source) {
        super();
        this.source = source;
    }
}
/**
 * Event fired by ActiveCombatEffect when it is reapplied to a character
 */
class CombatEffectReappliedEvent extends GameEvent {
    /**
     *
     * @param source The source of the effect reapplication
     */
    constructor(source) {
        super();
        this.source = source;
    }
}
/**
 * Event fired by ActiveCombatEffect just before it is removed from a character
 */
class CombatEffectRemovedEvent extends GameEvent {
    constructor() {
        super();
    }
}
/** Registered data class used to select random combat effects */
class CombatEffectTable extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        /** The total of all the weight properties in the table */
        this.totalWeight = 0;
        try {
            this.table = data.table.map((row) => {
                const applicator = SingleCombatEffectApplicator.fromData(row, game);
                this.totalWeight += row.weight;
                return {
                    applicator,
                    weight: row.weight
                };
            });
        } catch (e) {
            throw new DataConstructionError(CombatEffectTable.name, e, this.id);
        }
    }
    /** Gets a random effect from this table */
    getEffectApplicator() {
        const elem = selectFromWeightedArray(this.table, this.totalWeight);
        return elem.applicator;
    }
}
/** Base class for all combat effect applicators */
class CombatEffectApplicator {
    constructor() {
        /** The chance to apply the effect */
        this.baseChance = 0;
        /** Conditional chances to apply the effect. The condition property of elements of this array should not be mutated */
        this.conditionChances = [];
        /** Determines if the effect can be applied even when the target has barrier, if applying the effect from self to target. Defaults to false. */
        this.bypassBarrier = false;
        /** Determines the trigger for when this effect should attempt to be applied. Has no effect if in a special attack. */
        this.appliesWhen = 'PreAttack';
        /** If the effect should be applied when this applicator has been merged. Has no effect if in a special attack. */
        this.applyEffectWhenMerged = false;
        /** If ths description of this applicator should be formatted as negative */
        this.isNegative = false;
    }
    /** Returns if this applicator can never apply an effect */
    get cannotApply() {
        return this.baseChance === 0 && this.conditionChances.length === 0;
    }
    /** Returns a localized description of the applicator */
    get description() {
        return templateString(this.descriptionTemplate, this.descriptionTemplateData);
    }
    get descriptionTemplate() {
        if (this._descriptionLang !== undefined) {
            return getLangString(this._descriptionLang);
        } else if (this._customDescription !== undefined) {
            return this._customDescription;
        }
        return getLangString(`EFFECT_APPLICATOR_${this.appliesWhen}`);
    }
    /** Gets string template data for the applicator's description */
    get descriptionTemplateData() {
        const templateData = {};
        this.addTemplateData(templateData, '');
        return templateData;
    }
    /** Adds string template data for this applicator */
    addTemplateData(data, preKey = '', negMult = 1, posMult = 1) {
        const addKey = (key, value) => {
            data[`${preKey}${key}`] = value;
        };
        let chance = this.baseChance;
        if (this.conditionChances.length > 0) {
            chance = this.conditionChances[0].chance;
            const condition = this.conditionChances[0].condition;
            if (condition instanceof ConditionalModifierCondition) {
                condition.addTemplateData(data, 'cond');
            } else if (condition.type === 'Every' || condition.type === 'Some') {
                condition.conditions.forEach((condition, i) => {
                    if (condition instanceof ConditionalModifierCondition) {
                        condition.addTemplateData(data, 'cond', `${i}`);
                    }
                });
            }
            if (condition instanceof HitpointsCondition) {
                addKey('hpThreshold', `${condition.rhValue}`);
            } else if (condition instanceof BarrierCondition) {
                addKey('barrierThreshold', `${condition.rhValue}`);
            }
        }
        const chanceMult = this.isNegative ? negMult : posMult;
        chance *= chanceMult;
        addKey('chance', `${chance}`);
    }
    /**
     * Gets a description for this applicator. Returns undefined if it has none
     * @param negMult Optional. Multiplier applied to the chance if this is a negative applicator
     * @param posMult Optional. Multiplier applied to the chance if this is not a negative applicator
     * @returns [description, textClass]
     */
    getDescription(negMult = 1, posMult = 1) {
        const template = this.descriptionTemplate;
        if (!template)
            return undefined;
        const templateData = {};
        this.addTemplateData(templateData, '', negMult, posMult);
        const text = templateString(template, templateData);
        return {
            text,
            isNegative: this.isNegative,
            isDisabled: false,
        };
    }
    /** Sets the properties of a cloned CombatEffectApplicator from this one */
    setCloneProps(clone, mult) {
        clone.baseChance = this.baseChance * mult;
        clone.conditionChances = this.conditionChances.map((c) => {
            const cond = Object.assign({}, c);
            cond.chance *= mult;
            return cond;
        });
        clone.appliesWhen = this.appliesWhen;
        if (this.targetOverride !== undefined)
            clone.targetOverride = this.targetOverride;
        clone.bypassBarrier = this.bypassBarrier;
    }
    /** Sets the properties of this object based on data */
    setPropsFromData(data, game) {
        const baseChance = data.chance === undefined ? 100 : data.chance;
        if (data.condition !== undefined) {
            this.conditionChances.push({
                condition: this.getConditionFromData(data.condition, game),
                chance: baseChance
            });
        } else {
            this.baseChance = baseChance;
        }
        if (data.targetOverride !== undefined)
            this.targetOverride = data.targetOverride;
        if (data.bypassBarrier !== undefined)
            this.bypassBarrier = data.bypassBarrier;
    }
    /** Sets the trigger properties of this object based on data */
    setTriggerFromData(data) {
        this.appliesWhen = data.appliesWhen;
        if (data.applyEffectWhenMerged !== undefined)
            this.applyEffectWhenMerged = data.applyEffectWhenMerged;
        if (data.customDescription !== undefined)
            this._customDescription = data.customDescription;
        if (data.descriptionLang !== undefined)
            this._descriptionLang = data.descriptionLang;
        if (data.isNegative !== undefined)
            this.isNegative = data.isNegative;
    }
    /** Constructs a CombatEffectApplicatorCondition from data */
    getConditionFromData(data, game) {
        const exprTranspiler = Character.numberExprTranspiler;
        switch (data.type) {
            case 'Every':
                return {
                    type: 'Every',
                    conditions: data.conditions.map((c) => this.getConditionFromData(c, game)),
                };
            case 'Some':
                return {
                    type: 'Some',
                    conditions: data.conditions.map((c) => this.getConditionFromData(c, game)),
                };
            case 'DamageDealt':
                return {
                    type: 'DamageDealt',
                    operator: data.operator,
                    rhValue: exprTranspiler.buildFunction(data.rhValue, `Error constructing DamageDealt condition rhValue:`),
                };
            case 'DamageTaken':
                return {
                    type: 'DamageTaken',
                    operator: data.operator,
                    rhValue: exprTranspiler.buildFunction(data.rhValue, `Error constructing DamageTaken condition rhValue:`),
                };
            case 'CharacterValue':
                return {
                    type: 'CharacterValue',
                    operator: data.operator,
                    lhValue: exprTranspiler.buildFunction(data.lhValue, `Error constructing DamageTaken condition lhValue:`),
                    rhValue: exprTranspiler.buildFunction(data.rhValue, `Error constructing DamageTaken condition rhValue:`),
                };
            default:
                return ConditionalModifier.getCombatConditionFromData(data, game);
        }
    }
    /** If this applicator matches another one (e.g. they would apply identical effects) */
    matches(applicator) {
        return (applicator.appliesWhen === this.appliesWhen &&
            applicator.targetOverride === this.targetOverride &&
            applicator.bypassBarrier === this.bypassBarrier);
    }
    /** Merges the chances of another applictor with this one. Mutates this object. */
    merge(applicator, mult) {
        this.conditionChances.push(...applicator.conditionChances.map(({
            chance,
            condition
        }) => {
            chance *= mult;
            return {
                chance,
                condition
            };
        }));
        this.baseChance += applicator.baseChance * mult;
    }
    /** Splits the chances of another applicator from this one. Mutates this object. */
    split(applicator, mult) {
        if (applicator.conditionChances.length > 0) {
            const startIndex = this.conditionChances.findIndex((cond) => cond.condition === applicator.conditionChances[0].condition);
            if (startIndex === -1)
                throw new Error(`Could not find conditional chance in applicator.`);
            for (let i = 0; i < applicator.conditionChances.length; i++) {
                this.conditionChances[startIndex + i].chance -= applicator.conditionChances[i].chance * mult;
            }
            if (this.conditionChances[startIndex].chance === 0)
                this.conditionChances.splice(startIndex, applicator.conditionChances.length);
        }
        this.baseChance -= applicator.baseChance * mult;
    }
    /** Merges this applicator with an array of applicators. Used for generating an array of applicators for use in descriptions. */
    mergeWithArray(arr, negMult = 1, posMult = 1) {
        const mult = this.isNegative ? negMult : posMult;
        const match = arr.find((a) => this.matches(a) && this.conditionMatches(a));
        if (match !== undefined) {
            if (this.conditionChances.length > 0)
                match.conditionChances[0].chance += this.conditionChances[0].chance * mult;
            else
                match.baseChance += this.baseChance * mult;
        } else {
            const clone = this.clone(mult);
            if (this._customDescription !== undefined)
                clone._customDescription = this._customDescription;
            if (this._descriptionLang !== undefined)
                clone._descriptionLang = this._descriptionLang;
            arr.push(clone);
        }
    }
    conditionMatches(applicator) {
        if (this.conditionChances.length === 0)
            return applicator.conditionChances.length === 0;
        if (applicator.conditionChances.length === 0)
            return false;
        return CombatEffectApplicator.compareConditions(this.conditionChances[0].condition, applicator.conditionChances[0].condition);
    }
    static compareConditions(condA, condB) {
        if (condA instanceof ConditionalModifierCondition) {
            return condB instanceof ConditionalModifierCondition && condA.isEquals(condB);
        }
        if (condB instanceof ConditionalModifierCondition)
            return false;
        switch (condA.type) {
            case 'CharacterValue':
                return (condA.type === condB.type &&
                    condA.operator === condB.operator &&
                    condA.lhValue == condB.lhValue &&
                    condA.rhValue == condB.rhValue);
            case 'DamageDealt':
            case 'DamageTaken':
                return condA.type === condB.type && condA.operator === condB.operator && condA.rhValue == condB.rhValue;
            case 'Every':
            case 'Some':
                return (condA.type === condB.type &&
                    condA.conditions.length === condB.conditions.length &&
                    condA.conditions.every((c, i) => this.compareConditions(c, condB.conditions[i])));
        }
    }
}
/** A Combat Effect Applicator that selects a random single applicator from a weighted table */
class TableCombatEffectApplicator extends CombatEffectApplicator {
    /**
     *
     * @param table The table to select a single applicator from
     */
    constructor(table) {
        super();
        this.table = table;
    }
    getSingleApplicator() {
        return this.table.getEffectApplicator();
    }
    matches(applicator) {
        return applicator.table === this.table && super.matches(applicator);
    }
    clone(mult = 1) {
        const app = new TableCombatEffectApplicator(this.table);
        this.setCloneProps(app, mult);
        return app;
    }
    addTemplateData(data, preKey = '', negMult = 1, posMult = 1) {
        super.addTemplateData(data, preKey, negMult, posMult);
        this.table.table.forEach(({
            applicator
        }, i) => {
            applicator.effect.addTemplateData(data, `${preKey}row${i}`, applicator.initialParams);
        });
    }
    /** Constructs a TableCombatEffectApplicator from data */
    static fromData(data, game) {
        const table = game.combatEffectTables.getObjectByID(data.tableID);
        if (table === undefined)
            throw new Error(`Error constructing CombatEffectTableApplicator. CombatEffectTable with id: ${data.tableID} is not registered.`);
        const app = new TableCombatEffectApplicator(table);
        app.setPropsFromData(data, game);
        return app;
    }
    /** Constructs a TableCombatEffectApplicator with a trigger from data */
    static fromDataWithTrigger(data, game) {
        const app = this.fromData(data, game);
        app.setTriggerFromData(data);
        return app;
    }
}
/** A Combat Effect Applicator that always applies the same effect */
class SingleCombatEffectApplicator extends CombatEffectApplicator {
    constructor(effect) {
        super();
        this.effect = effect;
    }
    getSingleApplicator() {
        return this;
    }
    /** Returns if the given applicator has the same effect and initial Params */
    matches(applicator) {
        if (applicator.effect !== this.effect || !super.matches(applicator))
            return false;
        if (this.initialParams !== undefined) {
            if (applicator.initialParams === undefined)
                return false;
            const appParams = applicator.initialParams;
            const initArray = Object.entries(this.initialParams);
            if (initArray.every(([name, value]) => {
                    return appParams[name] === value;
                })) {
                return Object.entries(appParams).length === initArray.length;
            } else {
                return false;
            }
        }
        return applicator.initialParams === undefined;
    }
    /** Clones a new applicator from this one */
    clone(mult = 1) {
        const app = new SingleCombatEffectApplicator(this.effect);
        this.setCloneProps(app, mult);
        if (this.initialParams)
            app.initialParams = Object.assign({}, this.initialParams);
        return app;
    }
    addTemplateData(data, preKey = '', negMult = 1, posMult = 1) {
        super.addTemplateData(data, preKey, negMult, posMult);
        data[`${preKey}effectName`] = this.effect.name;
        this.effect.addTemplateData(data, preKey, this.initialParams);
    }
    /** Constructs a SingleCombatEffectApplicator from data */
    static fromData(data, game) {
        const effect = game.combatEffects.getObjectByID(data.effectID);
        if (effect === undefined)
            throw new Error(`Error constructing CombatEffectApplicator. CombatEffect with id: ${data.effectID} is not registered.`);
        const app = new SingleCombatEffectApplicator(effect);
        app.setPropsFromData(data, game);
        if (data.initialParams !== undefined) {
            const initialParams = {};
            data.initialParams.forEach(({
                name,
                value
            }) => {
                // Validate that each param exists on the effect
                if (effect.parameters[name] === undefined)
                    throw new Error(`Error constructing CombatEffectApplicator. Invalid initialParams. CombatEffect: ${data.effectID} does not have a parameter named: ${name}`);
                initialParams[name] = value;
            });
            app.initialParams = initialParams;
        }
        return app;
    }
    /** Constructs a SingleCombatEffectApplicator with a trigger from data */
    static fromDataWithTrigger(data, game) {
        const app = this.fromData(data, game);
        app.setTriggerFromData(data);
        return app;
    }
}
/** Class that manages the state of a CombatEffect that has been applied to a character */
class ActiveCombatEffect extends GameEventEmitter {
    constructor(
        /** The effect that was applied */
        effect,
        /** The character this effect has been applied to */
        character,
        /** The character that this effect came from */
        sourceCharacter, source, initialParams = {}) {
        super();
        this.effect = effect;
        this.character = character;
        this.sourceCharacter = sourceCharacter;
        /** Record of parameter names, to current values */
        this.parameters = {};
        /** Record of stat group names, to the number of times they have been applied to the character */
        this.statGroups = {};
        /** Record of timer names to Timer objects */
        this.timers = {};
        /** Array of functions that unassign event handlers for behaviours */
        this.behaviourUnlisteners = [];
        /** Array of functions that unassign event handlers for rendering */
        this.renderUnlisteners = [];
        /** If the deocding process has produced an invalid effect, and it should be removed */
        this.decodeInvalid = false;
        this.source = Object.assign({
            damageTaken: 0,
            damageDealt: 0
        }, source);
        this.parameters = Object.assign({}, effect.parameters, initialParams);
        Object.entries(effect.statGroups).forEach(([name]) => {
            this.statGroups[name] = {
                source: new ForwardingModifierSource(effect),
                value: 0,
            };
        });
        effect.timers.forEach(({
            name
        }) => {
            this.timers[name] = new Timer('DOT', () => this.fireTimerEvent(name));
        });
    }
    /** Returns if this effect is active on the player */
    get isOnPlayer() {
        return this.character === this.character.manager.player;
    }
    /** Evaluates a Number expression */
    evalExpression(expr) {
        return expr(this);
    }
    /** Initializes this effect, assigning event listeners and adding timers to the character */
    init() {
        this.assignBehaviourListeners();
        this.assignRenderListeners();
        Object.values(this.timers).forEach((timer) => {
            if (timer.isActive)
                this.character.addCombatEffectTimer(timer);
        });
    }
    /** Called by the Character class when an effect is applied to them */
    onApplied(initialParams = {}) {
        this.applicatorParameters = Object.assign({}, this.effect.parameters, initialParams);
        this._events.emit('applied', new CombatEffectAppliedEvent(this.source));
        this.applicatorParameters = undefined;
    }
    /** Called by the Character class when an effect is reapplied to them */
    onReapplied(source, initialParams = {}) {
        this.applicatorParameters = Object.assign({}, this.effect.parameters, initialParams);
        this._events.emit('reapplied', new CombatEffectReappliedEvent(source));
        this.applicatorParameters = undefined;
    }
    /** Called by the Character class when this effect is removed */
    destroy() {
        this._events.emit('removed', new CombatEffectRemovedEvent());
        Object.entries(this.statGroups).forEach(([name, activeGroup]) => {
            const statGroup = this.effect.statGroups[name];
            const mult = activeGroup.value;
            if (statGroup.modifiers !== undefined) {
                this.character.modifiers.removeModifiers(activeGroup.source);
                this.character.stats.setDirty();
            }
            if (statGroup.combatEffects !== undefined && mult > 0)
                this.character.splitEffectApplicators(statGroup.combatEffects, mult);
        });
        Object.values(this.timers).forEach((timer) => {
            if (timer.isActive)
                this.character.removeCombatEffectTimer(timer);
        });
        this.unassignListeners();
    }
    /** Gets the chance that this effect would be ignored on the character it is applied to */
    getIgnoreChance() {
        return this.character.getEffectIgnoreChance(this.effect);
    }
    /** Sets the value of a parameter. Does not emit events if the value is not different to the current one */
    setParameter(paramName, value) {
        const oldValue = this.parameters[paramName];
        if (oldValue === value)
            return;
        this.parameters[paramName] = value;
        this._events.emit('parameterChanged', new CombatEffectParameterChangedEvent(paramName, oldValue, value));
    }
    /** Gets the current value of a parameter */
    getParameter(paramName) {
        return this.parameters[paramName];
    }
    getApplicatorParameter(paramName) {
        if (this.applicatorParameters === undefined)
            return 0;
        return this.applicatorParameters[paramName];
    }
    /** Gets the number of times a stat group has been applied to the character */
    getStatGroup(statGroupName) {
        return this.statGroups[statGroupName].value;
    }
    /** Checks a comparison condition based on this objects values or its characters */
    checkCondition(condition) {
        return checkComparison(condition.lhValue(this), condition.rhValue(this), condition.operator);
    }
    /** Returns the result of damage calculations from a given damageGroup. If the source of this effect was an attack, the damageDealt property is set to the attacks damage. */
    getDamage(damageName) {
        const group = this.effect.damageGroups[damageName];
        let damage = this.sourceCharacter.reduceDamage(group.damage, this.source.damageDealt, this.source.damageTaken);
        if (group.applyTypeModifiers === 'Bleed' || group.applyTypeModifiers === 'BarrierBleed')
            damage += numberMultiplier * this.sourceCharacter.modifiers.flatTotalBleedDamage;
        if (group.applyDamageModifiers)
            damage = this.sourceCharacter.applyDamageModifiers(this.character, damage);
        if (group.applyTypeModifiers !== undefined)
            damage *= 1 + this.character.getDotDamageModifier(group.applyTypeModifiers) / 100;
        damage = Math.min(numberMultiplier * group.damageCap, damage);
        if (group.applyResistance)
            damage *= 1 - this.character.stats.getResistance(this.sourceCharacter.damageType) / 100;
        return damage;
    }
    /** Sets the value of a stat group. Automatically updates the amount of times the stats in the group have been applied to the character. Does not emit events if the new value is the same as the current one. */
    setStats(statGroupName, value) {
        const activeGroup = this.statGroups[statGroupName];
        const oldValue = activeGroup.value;
        if (oldValue === value)
            return;
        activeGroup.value = value;
        const statGroup = this.effect.statGroups[statGroupName];
        if (statGroup.modifiers !== undefined) {
            if (oldValue === 0) {
                this.character.modifiers.addModifiers(activeGroup.source, statGroup.modifiers, value, value);
            } else if (value === 0) {
                this.character.modifiers.removeModifiers(activeGroup.source);
            } else {
                this.character.modifiers.updateModifiers(activeGroup.source, value, value);
            }
            this.character.stats.setDirty();
        }
        if (statGroup.combatEffects !== undefined) {
            const oldMult = Math.max(0, oldValue);
            const newMult = Math.max(0, value);
            const diff = newMult - oldMult;
            if (diff > 0)
                this.character.mergeEffectApplicators(statGroup.combatEffects, diff);
            else
                this.character.splitEffectApplicators(statGroup.combatEffects, -diff);
        }
        this._events.emit('statsChanged', new CombatEffectStatsChangedEvent(statGroupName, oldValue, value));
    }
    /** Adds the modifiers of stat groups from this effect to the character it is active on */
    addAllModifiers() {
        Object.entries(this.statGroups).forEach(([name, activeGroup]) => {
            const statGroup = this.effect.statGroups[name];
            if (statGroup.modifiers === undefined || activeGroup.value === 0)
                return;
            this.character.modifiers.addModifiers(activeGroup.source, statGroup.modifiers, activeGroup.value, activeGroup.value);
        });
    }
    /** Merges the effect applicators of stat groups from this effect onto the character it is active on */
    mergeAllApplicators() {
        Object.entries(this.statGroups).forEach(([name, activeGroup]) => {
            const statGroup = this.effect.statGroups[name];
            if (statGroup.combatEffects === undefined || activeGroup.value <= 0)
                return;
            this.character.mergeEffectApplicators(statGroup.combatEffects, activeGroup.value);
        });
    }
    /** Starts the specified timer with an interval in [ms] */
    startTimer(timerName, interval) {
        const timer = this.timers[timerName];
        timer.start(interval);
        this.character.addCombatEffectTimer(timer);
    }
    /** Stops the specified timer */
    stopTimer(timerName) {
        const timer = this.timers[timerName];
        timer.stop();
        this.character.removeCombatEffectTimer(timer);
    }
    /** Callback function for when a timer fires */
    fireTimerEvent(timerName) {
        this._events.emit('timerFired', new CombatEffectTimerFiredEvent(timerName));
    }
    /** Assigns event listeners for the behaviours of the effect, and stores their unassigners */
    assignBehaviourListeners() {
        this.effect.behaviours.forEach((behaviour) => {
            const onTrigger = () => behaviour.execute(this.character, this);
            behaviour.triggersOn.forEach((trigger) => {
                this.behaviourUnlisteners.push(trigger.assignHandler(onTrigger, this, this.character));
            });
        });
    }
    /** Assigns event listeners for the rendering of the effect, and stores their unassigners */
    assignRenderListeners() {
        const queueRender = () => {
            this.character.renderQueue.effects = true;
        };
        this.renderUnlisteners.push(...this.effect.renderListener.assignHandlers(queueRender, this, this.character));
    }
    /** Unassigns all event listeners assigned by this object */
    unassignListeners() {
        this.behaviourUnlisteners.forEach((unlistener) => unlistener());
        this.behaviourUnlisteners = [];
        this.renderUnlisteners.forEach((unlistener) => unlistener());
        this.renderUnlisteners = [];
    }
    encode(writer) {
        writer.writeBoolean(this.sourceCharacter === this.character.manager.player);
        let sourceID = 0;
        switch (this.source.type) {
            case 'Attack':
                sourceID = 0;
                break;
            case 'Effect':
                sourceID = 1;
                break;
            case 'Other':
                sourceID = 2;
                break;
        }
        writer.writeUint8(sourceID);
        writer.writeFloat64(this.source.damageDealt);
        writer.writeFloat64(this.source.damageTaken);
        writer.writeArray(Object.entries(this.parameters), ([name, value]) => {
            writer.writeString(name);
            writer.writeInt32(value);
        });
        writer.writeArray(Object.entries(this.statGroups), ([name, activeGroup]) => {
            writer.writeString(name);
            writer.writeInt32(activeGroup.value);
        });
        writer.writeArray(Object.entries(this.timers), ([name, timer]) => {
            writer.writeString(name);
            timer.encode(writer);
        });
        return writer;
    }
    decode(reader, version) {
        this.sourceCharacter = reader.getBoolean() ? this.character.manager.player : this.character.manager.enemy;
        switch (reader.getUint8()) {
            case 0:
                this.source.type = 'Attack';
                break;
            case 1:
                this.source.type = 'Effect';
                break;
            default:
                this.source.type = 'Other';
        }
        this.source.damageDealt = reader.getFloat64();
        this.source.damageTaken = reader.getFloat64();
        // Decode Parameters
        reader.getArray((reader) => {
            const name = reader.getString();
            const value = reader.getInt32();
            if (this.effect.parameters[name] !== undefined)
                this.parameters[name] = value;
        });
        if (!Object.keys(this.effect.parameters).every((name) => this.parameters[name] !== undefined))
            this.decodeInvalid = true;
        // Decode Stat Groups (and previously modifier groups)
        reader.getArray((reader) => {
            const name = reader.getString();
            const value = reader.getInt32();
            if (this.effect.statGroups[name] !== undefined)
                this.statGroups[name] = {
                    source: new ForwardingModifierSource(this.effect),
                    value,
                };
        });
        if (version < 119 /* SaveVersion.CombatEffectStatGroups */ ) {
            // Decode Effect Applicators
            reader.getArray((reader) => {
                const name = reader.getString();
                const value = reader.getInt32();
                const existing = this.statGroups[name];
                if (existing !== undefined) {
                    if (existing.value !== value)
                        this.decodeInvalid = true;
                } else {
                    this.statGroups[name] = {
                        source: new ForwardingModifierSource(this.effect),
                        value,
                    };
                }
            });
        }
        if (!Object.keys(this.effect.statGroups).every((name) => this.statGroups[name] !== undefined))
            this.decodeInvalid = true;
        // Decode Timers
        reader.getArray((reader) => {
            const name = reader.getString();
            const timer = new Timer('DOT', () => this.fireTimerEvent(name));
            timer.decode(reader, version);
            if (this.effect.timers.some((t) => t.name === name)) {
                this.timers[name] = timer;
            }
        });
        if (!this.effect.timers.every((t) => this.timers[t.name] !== undefined))
            this.decodeInvalid = true;
    }
    /** Skips over any bytes that were encoded by an object of this type */
    static skipData(reader, version) {
        reader.skipBytes(18);
        reader.getArray((reader) => {
            reader.getString();
            reader.skipBytes(4);
        });
        reader.getArray((reader) => {
            reader.getString();
            reader.skipBytes(4);
        });
        reader.getArray((reader) => {
            reader.getString();
            reader.skipBytes(4);
        });
        reader.getArray((reader) => {
            reader.getString();
            Timer.skipData(reader, version);
        });
    }
}
//# sourceMappingURL=combatEffects.js.map
checkFileVersion('?12097')