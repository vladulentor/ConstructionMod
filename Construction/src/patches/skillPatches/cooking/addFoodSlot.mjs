export function addFoodSlot(tier) {
    const food = game.combat.player.food;
    if (food.maxSlots == 3) {
        food.maxSlots = 4;
        food.addSlot();
        if (game.construction.notifs) {
            const foodMenu = document.getElementById("combat-food-select");
            const thievingMenu = document.getElementById("thieving-food-select");
                    foodMenu.render(game.combat.player);
                    thievingMenu.render(game.combat.player);
        }
    }
}
