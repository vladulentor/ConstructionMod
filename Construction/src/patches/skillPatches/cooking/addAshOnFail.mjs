export function addAshOnFail(ctx) {
    ctx.patch(Cooking, 'actionRewards').get(function (orig) {
        const value = orig(); // get the original getter's return
        const ashToGain = this.game.modifiers.getValue("rielkConstruction:flatAshGainedOnCookingFailure", ModifierQuery.EMPTY);
        if (ashToGain && value._items.has(this.game.items.getObjectByID("melvorD:Coal_Ore"))) {
            value.addItemByID("melvorF:Ash" , ashToGain);
        }
        return value;
    });
}