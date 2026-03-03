export function patchMagicUsageCheck({ patch }) {

    patch(Player, 'checkMagicUsage').replace(function (_) {
        // Validate standard, ancient and archaic spells for required items
        const spell = this.spellSelection.attack;
        if (spell !== undefined &&
            ((spell.requiredItem !== undefined && !(this.equipment.checkForItem(spell.requiredItem) || this.game.modifiers.getValue(`rielkConstruction:fake_${spell.requiredItem.localID}`, ModifierQuery.EMPTY))) ||
                !spell.spellbook.canUseWithDamageType(this.damageType)))
            this.resetAttackSpell();
        // Validate auroras and curses for required items and primary spell/modifiers
        if (this.attackType === 'magic') {
            const spell = this.spellSelection.attack;
            if (spell === undefined) {
                this.canCurse = false;
                this.canAurora = false;
            }
            else {
                this.canCurse = spell.spellbook.allowCurses;
                this.canAurora = spell.spellbook.allowAuroras;
            }
        }
        else {
            const allowMagic = this.modifiers.allowAttackAugmentingMagic > 0;
            this.canCurse = allowMagic || this.modifiers.allowNonMagicCurses > 0;
            this.canAurora = allowMagic || this.game.modifiers.getValue("rielkConstruction:AllowAurorasAnytime", ModifierQuery.EMPTY) > 0;
        }


    })
    patch(Player, 'canUseCombatSpell').replace(function (_, spell, ignoreReqs = false) {
        return ((ignoreReqs ||
            (this.game.altMagic.level >= spell.level &&
                this.game.altMagic.abyssalLevel >= spell.abyssalLevel &&
                this.game.checkRequirements(spell.requirements))) &&
            (spell.requiredItem === undefined || (this.equipment.checkForItem(spell.requiredItem) || this.game.modifiers.getValue(`rielkConstruction:fake_${spell.requiredItem.localID}`, ModifierQuery.EMPTY))));
    })


    patch(LockedSpellTooltipElement, 'setSpell').replace(function (_, spell, game, player, ignoreReqs) {
        if (!ignoreReqs) {
            this.levelRequired.textContent = templateLangString('MENU_TEXT_SKILLNAME_LEVEL', {
                skillName: game.altMagic.name,
                level: `${spell.level}`,
            });
            toggleDangerSuccess(this.levelRequired, game.altMagic.level >= spell.level);
            if (spell.abyssalLevel > 0) {
                this.abyssalLevelRequired.textContent = templateLangString('REQUIRES_ABYSSAL_LEVEL', {
                    skillImage: game.altMagic.name,
                    level: `${spell.abyssalLevel}`,
                });
                toggleDangerSuccess(this.abyssalLevelRequired, game.altMagic.abyssalLevel >= spell.abyssalLevel);
            }
            else {
                hideElement(this.abyssalLevelRequired);
            }
            this.setRequirements(spell);
        }
        else {
            hideElement(this.levelRequired);
            hideElement(this.abyssalLevelRequired);
            this.removeRequirements();
        }
        if (spell.requiredItem !== undefined) {
            this.itemRequired.textContent = templateLangString('COMBAT_MISC_REQUIRES_ITEM_TO_BE_EQUIPPED', {
                itemName: spell.requiredItem.name,
            });
            toggleDangerSuccess(this.itemRequired, (player.equipment.checkForItem(spell.requiredItem) || game.modifiers.getValue(`rielkConstruction:fake_${spell.requiredItem.localID}`, ModifierQuery.EMPTY)));
            showElement(this.itemRequired);
        }
        else {
            hideElement(this.itemRequired);
        }

    })

}