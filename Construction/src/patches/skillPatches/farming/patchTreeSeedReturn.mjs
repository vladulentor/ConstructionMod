export function patchTreeSeedReturn(ctx) {
    ctx.patch(Farming, 'rollForAdditionalItems').after(function (_, rewards, growthTime, recipe) {
        if (recipe.category.id === "melvorD:Tree") {
            const chance = this.game.modifiers.getValue("rielkConstruction:farmingTreeSeedReturn", this.getActionModifierQuery(recipe));

            if (rollPercentage(chance)) {
                rewards.addItem(recipe.seedCost.item, 1);
            }
        }});
}
