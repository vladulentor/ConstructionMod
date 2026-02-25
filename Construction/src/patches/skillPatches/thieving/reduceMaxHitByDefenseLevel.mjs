export function reduceMaxHitByDefenseLevel({ patch }) {
    for (const thieved of game.thieving.actions.allObjects) {
        thieved._maxHit = thieved.maxHit;
        delete thieved.maxHit;
    }

    Object.defineProperty(ThievingNPC.prototype, "maxHit", {
        get() {
            const base = this._maxHit * 10;
            const reducto = game.modifiers.getValue(
                "rielkConstruction:ReduceThievingTargetMaxHitBasedOnDefLevel",
                ModifierQuery.EMPTY
            ) * game.defence.level;
            const scaled = base + reducto;
            const minimum = Math.ceil(this._maxHit * 5); // *10 /2 == *5. It's magic
            return Math.max(minimum, scaled) / 10;
        },
        set(value) {
            this._maxHit = value;
        },
        configurable: true
    });

    patch(ThievingNPCNavElement, 'updateNPC').after(function (_, npc, game) {

        if (game.modifiers.getValue("rielkConstruction:ReduceThievingTargetMaxHitBasedOnDefLevel", ModifierQuery.EMPTY)) {
            let maxHit = numberMultiplier * npc.maxHit;
            if (npc.realm === game.defaultRealm) {
                maxHit = Math.floor(maxHit * (1 - game.combat.player.stats.getResistance(game.normalDamage) / 100));
            }
            let reduc = Math.min(maxHit, Math.floor(numberMultiplier * (npc._maxHit - npc.maxHit)))
            const reducedToHalf = maxHit === reduc; // There's probably more "correct" ways to do this
            this.maxHit.innerHTML = templateLangString('MENU_TEXT_MAX_HIT', { value: `${maxHit}` }) + `<span class="construction-${((game.defence.maxLevelCap == game.defence.level) || reducedToHalf) ? 'victory' : 'success'}">  (-${reduc})</span>`

        }
    }
    )
}
