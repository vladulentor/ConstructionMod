export function patchTreeSeedReturn(ctx) {
    ctx.patch(Farming, 'rollForAdditionalItems').after(function (_, rewards, growthTime, recipe){
        if (recipe.category.id === "melvorD:Tree") {
            const chance = this.game.modifiers.getValue("rielkConstruction:farmingTreeSeedReturn", ModifierQuery.EMPTY);
            if (rollPercentage(chance)) // this most likely didn't work before as it didn't use the correct getter, but I'm too lazy to cehck
                rewards.addItem(recipe.seedCost.item, 1);
        }
    });
}