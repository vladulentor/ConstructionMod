function Multiplystuff(mult) {
    const divisor = game.firemaking.actions.getObjectByID("melvorD:Oak_Logs").roaringStats.modifiers[0].value / 10; // Quick way to check if we've already multiplied shit
    const ItemList = game.firemaking.actions.registeredObjects;
    ItemList.forEach(item => {
        const stat = item.roaringStats;
        if (stat === undefined || stat.modifiers.length === 0) return;

        stat.modifiers.forEach((mod) => {
            mod.value *= mult;
        });
    });
}

export function multiplyRoaringEffects() {

    if (this.tier >= 5)
        Multiplystuff(1.5);
game.firemaking.renderQueue.logInfo = true;

}
