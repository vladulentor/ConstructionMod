export function patchRunePreservationCap({ patch }) {

    patch(AltMagic, 'runePreservationChance').get(function (orig) {
        let preserveChance = this.game.modifiers.getRunePreservationChance();
        preserveChance += this.game.modifiers.altMagicRunePreservationChance;
        let maxPreserve = 80 + this.game.modifiers.getValue("rielkConstruction:runePreservationCap", ModifierQuery.EMPTY)
        return Math.min(preserveChance, maxPreserve);

    })
    patch(PlayerModifierTable, 'getRunePreservationChance').replace(function () {
        let chance = this.bypassRunePreservationChance;
        chance += this.runePreservationChance;
        let maxPreserve = 80 + game.modifiers.getValue("rielkConstruction:runePreservationCap", ModifierQuery.EMPTY)
        return clampValue(chance, 0, maxPreserve);

    })
}