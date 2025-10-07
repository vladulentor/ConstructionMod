export function patchFarming(ctx) {
    ctx.patch(Farming, 'rollForAdditionalItems').after(function (_, rewards, growthTime, recipe){
        if (recipe.category.id === "melvorD:Tree") {
            const chance = this.game.modifiers.farmingTreeSeedReturn;
            if (rollPercentage(chance))
                rewards.addItem(recipe.seedCost.item, 1);
        }
    });
}