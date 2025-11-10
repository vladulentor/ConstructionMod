export function perfectFoodHealing(ctx) {
 ctx.patch(Cooking, 'decode').after(function(){
 this.perfectFoods = [];
 this.actions.registeredObjects.forEach(recipe => {
    this.perfectFoods.push(recipe.perfectItem.id);
 });})

ctx.patch(Player, 'getFoodHealingBonus').after(function(food, item) {
    const perfBonus = game.modifiers.getValue('rielkConstruction:increasePerfectFoodHealing', ModifierQuery.EMPTY)
    if (game.cooking.perfectFoods.includes(item.id) && perfBonus)
   { food += perfBonus;
    return food;
   }
}  );

}
