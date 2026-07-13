export function patchAutoEat({ patch }) { // Since we add a case where autoEatEfficiency can be 1, we add a case where autoEatHealing could be 0, which breaks assumptions. We replace the functio nto add a min of 1 food healed with auto eat.
    patch(Player, "autoEat").replace(function (_, foodSwapped = false) {
        const foodItem = this.food.currentSlot.item;
        if ((this.hitpoints <= this.autoEatThreshold || foodSwapped) && foodItem !== this.game.emptyFoodItem) {
            const autoEatHealing = Math.max(1, Math.floor((this.getFoodHealing(foodItem) * this.autoEatEfficiency) / 100));
            let foodQty = Math.ceil((this.autoEatHPLimit - this.hitpoints) / autoEatHealing);
            foodQty = Math.min(foodQty, this.food.currentSlot.quantity);
            this.eatFood(foodQty, false, this.autoEatEfficiency);
            if (this.food.currentSlot.quantity < 1 &&
                this.modifiers.autoSwapFoodUnlocked > 0 &&
                this.game.settings.enableAutoSwapFood) {
                const nonEmptySlot = this.food.slots.findIndex((slot) => slot.item !== this.game.emptyFoodItem);
                if (nonEmptySlot >= 0) {
                    const oldFood = this.food.currentSlot.item;
                    this.food.setSlot(nonEmptySlot);
                    this.onSelectedFoodChange(oldFood, this.food.currentSlot.item);
                    if (this.hitpoints < this.autoEatHPLimit)
                        this.autoEat(true);
                }
            }
        }
    }) // Similar as above
    patch(Player, "autoEatHPLimit").replace(function () {
        let percent = this.modifiers.autoEatHPLimit;
        percent = Math.max(2, Math.min(100, percent));
        return (this.stats.maxHitpoints * percent) / 100;
    })
}