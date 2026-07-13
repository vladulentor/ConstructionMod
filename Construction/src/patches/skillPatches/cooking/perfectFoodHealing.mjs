export function perfectFoodHealing(ctx) {
   ctx.onModsLoaded(async (ctx) => {
      game.cooking.perfectFoods = [];
      game.cooking.actions.registeredObjects.forEach(recipe => {
    game.cooking.perfectFoods.push(recipe.perfectItem.id);
   })
});

ctx.patch(Player, 'getFoodHealingBonus').after(function(food, item) {
    const perfBonus = game.modifiers.getValue('rielkConstruction:increasePerfectFoodHealing', ModifierQuery.EMPTY)
    if (game.cooking.perfectFoods.includes(item.id) && perfBonus)
   { food += perfBonus;
    return food;
   }
}  );

}
