export function slayerCostReduction({patch}){
    patch(SlayerTask, "getRollCosts").replace(function(_, category){
        const costs = new Costs(this.game);
        const costMultiplier = Math.max(1 + (this.game.modifiers.slayerTaskCost + this.game.modifiers.getValue("rielkConstruction:slayerCostReduction", ModifierQuery.EMPTY)) / 100, 0);
        category.rollCost.forEach(({ currency, quantity }) => {
            quantity *= costMultiplier;
            quantity = Math.floor(quantity);
            costs.addCurrency(currency, quantity);
        });
        return costs;

    });
}