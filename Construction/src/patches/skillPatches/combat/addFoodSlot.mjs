export function addFoodSlot() { // Should this be in cooking?
    const food = game.combat.player.food;
    if (food.maxSlots == 3) {
        food.maxSlots = 4;
        food.addSlot();
        if (game.construction.notifs) {
            const foodMenu = combatMenus.combatFood;
            const thievingMenu = combatMenus.thievingFood;
            const player = game.combat.player
            foodMenu.addDropdownOption()
            foodMenu.setCallbacks(player);
            foodMenu.render(player);
            thievingMenu.addDropdownOption()
            thievingMenu.setCallbacks(player);
            thievingMenu.render(player);
        }
    }
}
