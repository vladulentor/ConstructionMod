export function loseGPOnFishing(ctx) {
    ctx.patch(Fishing, 'preAction').before(function () {
        const gpCost = this.game.modifiers.getValue("rielkConstruction:loseGPOnFishingBasedOnFish", ModifierQuery.EMPTY);
        if (gpCost) {
            const costs = new Costs(this.game);
            const fishDiscount = this.activeFish.product.sellsFor.quantity * 4 - 4; //Make fast fish expensive, and slow fish not so. The -4 is so shrimp gets the full cost.
            costs.addCurrency(game.currencies.getObjectByID('melvorD:GP'), Math.max(0, gpCost - fishDiscount));
            if (!costs.checkIfOwned()) {
                this.game.combat.notifications.add({ type: 'Player', args: [this, this.noCostsMessage, 'danger'] });
                this.stop();
                return;
            }
            costs.consumeCosts();

        }
    });
}
