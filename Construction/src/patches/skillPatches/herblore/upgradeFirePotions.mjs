export function upgradeFirePotions() {
    const potID = [];
    potID[0] = game.items.getObjectByID('melvorF:Controlled_Heat_Potion_I');
    potID[1] = game.items.getObjectByID('melvorF:Controlled_Heat_Potion_II');
    potID[2] = game.items.getObjectByID('melvorF:Controlled_Heat_Potion_III');
    potID[3] = game.items.getObjectByID('melvorF:Controlled_Heat_Potion_IV');

    const logReduction = [-5, -10, -15, -25];
    potID.forEach((potion, i) => {
        if (potion) {
            // Apply modifiers directly to the potion’s stats
            potion.stats.modifiers.push(
                new ModifierValue(game.modifierRegistry.getObjectByID('rielkConstruction:roaringLogCostReduction'), logReduction[i]),
            );
        };
    });
}