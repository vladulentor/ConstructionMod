export function addCurrencyCancel({ patch }) {
    patch(Currency, "add").replace(function (orig, amount) {
        const query = new ModifierQuery({ currency: this });
        const neg = game.modifiers.getValue("rielkConstruction:fuckYourGold", query);
        if (neg) {
            const toLose = Math.floor(amount * neg / 100);
            if (this.canAfford(toLose))
                this.remove(toLose);
            else { if(game.activeAction.stop())
                    game.combat.player.hitpoints = 0;}
        }
        else orig(amount);
    })

}