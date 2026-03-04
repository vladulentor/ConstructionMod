export function addBeamsMasteryPoolBonus() {

    const fletchbon = game.fletching.masteryPoolBonuses.get(game.realms.getObjectByID("melvorD:Melvor")).find(mas => mas.percent === 50);
    const ourcat = game.fletching.categories.getObjectSafe("rielkConstruction:Wood_Beams");
    const ourmod = new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:flatBasePrimaryProductQuantity'), 1, { skill: game.fletching, category: ourcat })
    fletchbon.modifiers.push(ourmod)
    game.fletching.computeProvidedStats(game.construction.notifs);

}