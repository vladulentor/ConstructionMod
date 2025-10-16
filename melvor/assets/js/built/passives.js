"use strict";
class CombatPassive extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        try {
            this._name = data.name;
            this._customDescription = data.customDescription;
            if (data.playerCombatEffects !== undefined)
                this.combatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(data.playerCombatEffects);
            if (data.combatEffects !== undefined)
                this.enemyCombatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(data.combatEffects);
            if (data.conditionalModifiers !== undefined)
                this.conditionalModifiers = data.conditionalModifiers.map((data) => new ConditionalModifier(data, game));
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(CombatPassive.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`PASSIVES_NAME_${this.localID}`);
        }
    }
    get englishName() {
        return this._name;
    }
    get description() {
        if (this._customDescription !== undefined) {
            if (this.isModded) {
                return this._customDescription;
            } else {
                return getLangString(`PASSIVES_DESC_${this.localID}`);
            }
        }
        const descriptions = [];
        if (this.modifiers !== undefined) {
            this.modifiers.forEach((modValue) => {
                const desc = modValue.print();
                desc.text = `${getLangString('GOLBIN_RAID_GIVES_YOU')} ${desc.text}`;
                descriptions.push(desc);
            });
        }
        if (this.combatEffects !== undefined) {
            this.combatEffects.forEach((applicator) => {
                const desc = applicator.getDescription();
                if (desc !== undefined) {
                    desc.text = `${getLangString('GOLBIN_RAID_GIVES_YOU')} ${desc.text}`;
                    descriptions.push(desc);
                }
            });
        }
        if (this.enemyModifiers !== undefined) {
            this.enemyModifiers.forEach((modValue) => {
                descriptions.push(modValue.print());
            });
        }
        if (this.enemyCombatEffects !== undefined) {
            this.enemyCombatEffects.forEach((applicator) => {
                const desc = applicator.getDescription();
                if (desc !== undefined)
                    descriptions.push(desc);
            });
        }
        if (this.conditionalModifiers !== undefined) {
            this.conditionalModifiers.forEach((conditional) => {
                const desc = conditional.getDescription();
                if (desc !== undefined)
                    descriptions.push(desc);
            });
        }
        return joinAsList(descriptions.map(plainDescriptionFormatter));
    }
    get modifiedDescription() {
        if (this._modifiedDescription !== undefined)
            return this._modifiedDescription;
        this._modifiedDescription = applyDescriptionModifications(this.description);
        return this._modifiedDescription;
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.playerModifiers !== undefined)
                this.modifiers = game.getModifierValuesFromData(data.playerModifiers);
            if (data.modifiers !== undefined)
                this.enemyModifiers = game.getEnemyModifierValuesFromData(data.modifiers);
        } catch (e) {
            throw new DataConstructionError(CombatPassive.name, e, this.id);
        }
    }
}
class ControlledAffliction extends CombatPassive {
    constructor(namespace, game) {
        super(namespace, {
            id: 'ControlledAffliction',
            name: 'Controlled Affliction',
            modifiers: {
                increasedFlatMaxHitpoints: 50,
            },
        }, game);
        try {
            const affliction = game.combatEffects.getObjectSafe("melvorD:Affliction" /* CombatEffectIDs.Affliction */ );
            const afflictionApplicator = new SingleCombatEffectApplicator(affliction);
            Object.defineProperty(afflictionApplicator, 'baseChance', {
                get: () => {
                    return 30 + 5 * game.combat.eventProgress;
                },
            });
            this.enemyCombatEffects = [afflictionApplicator];
        } catch (e) {
            throw new DataConstructionError(ControlledAffliction.name, e, this.id);
        }
    }
    registerSoftDependencies(data, game) {
        super.registerSoftDependencies(data, game);
        Object.defineProperty(this.enemyModifiers[0], 'value', {
            get: () => {
                return 50 * (game.combat.eventProgress + 1);
            },
        });
    }
}
//# sourceMappingURL=passives.js.map
checkFileVersion('?12097')