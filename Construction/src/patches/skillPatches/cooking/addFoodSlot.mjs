export function addFoodSlot(tier) {
    const food = game.combat.player.food;
    if (food.maxSlots == 3) {
        food.maxSlots = 4;
        food.addSlot();
        food.render(game.combat.player);
    }
}
