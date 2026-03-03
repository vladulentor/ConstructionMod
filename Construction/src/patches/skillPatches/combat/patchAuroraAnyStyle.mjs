export function patchAuroraAnyStyle({ patch }) {
    patch(Player, 'attack').after(function (_, target, attack) {
        if (this.canAurora && this.spellSelection.aurora !== undefined && this.attackType !== 'magic') {
            const auroraCosts = this.getRuneCosts(this.spellSelection.aurora);
            for (let i = 1; i <= 2; i++) // If we want to add an upgrade that removes the triple cost we can add it here.
            {
                if (this.manager.bank.checkForItems(auroraCosts)) {
                    this.consumeRunes(auroraCosts);
                }
                else {
                    this.toggleAurora(this.spellSelection.aurora, false);
                    this.manager.notifications.add({
                        type: 'Player',
                        args: [this.game.altMagic, getLangString('TOASTS_RUNES_REQUIRED_AURORA'), 'danger'],
                    });
                }
            }
        }
    });
    patch(SpellTooltipRunesElement, 'setSpell').before(function (spell) {
        if (spell instanceof AuroraSpell && game?.combat?.player?.attackType !== 'magic' && game?.modifiers?.getValue("rielkConstruction:AllowAurorasAnytime", ModifierQuery.EMPTY)) {
            this.tripledrora = 1;
            spell.runesRequired.forEach(a => a.quantity *= 3)
            return spell;
        }
    });
    patch(SpellTooltipRunesElement, 'setSpell').after(function (_, spell) { // I'm sure this is perfectly safe and reasonable
        if (this.tripledrora) {
            spell.runesRequired.forEach(a => a.quantity /= 3);
            this.tripledora = 0;
        }
    });
}