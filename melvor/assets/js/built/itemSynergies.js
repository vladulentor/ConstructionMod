"use strict";
class ItemSynergy {
    constructor(data, game) {
        try {
            this.items = data.itemIDs.map((id) => {
                switch (id) {
                    case 'ThrowingWeapon':
                    case 'Melee2HWeapon':
                        return id;
                    default:
                        {
                            return game.items.equipment.getObjectSafe(id);
                        }
                }
            });
            if (data.conditionalModifiers !== undefined)
                this.conditionalModifiers = data.conditionalModifiers.map((data) => new ConditionalModifier(data, game));
            if (data.equipmentStats !== undefined)
                this.equipmentStats = game.getEquipStatsFromData(data.equipmentStats);
            if (data.combatEffects !== undefined)
                this.combatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(data.combatEffects);
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(ItemSynergy.name, e);
        }
    }
    get name() {
        return `${this.items
            .map((item) => {
            if (typeof item === 'string') {
                switch (item) {
                    case 'ThrowingWeapon':
                        return getLangString('THROWING_WEAPON');
                    case 'Melee2HWeapon':
                        return getLangString('MELEE_2H_WEAPON');
                }
            }
            return item.name;
        })
            .join(' + ')} Synergy`; // TODO_L
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.playerModifiers !== undefined)
                this.playerModifiers = game.getModifierValuesFromData(data.playerModifiers);
            if (data.enemyModifiers !== undefined)
                this.enemyModifiers = game.getEnemyModifierValuesFromData(data.enemyModifiers);
        } catch (e) {
            throw new DataConstructionError(ItemSynergy.name, e);
        }
    }
}
//# sourceMappingURL=itemSynergies.js.map
checkFileVersion('?12097')