export function addFishonTreasureRollPlusExtra(ctx) {
    ctx.patch(Fishing, 'actionRewards').get(function (orig) {
        const rewards = orig();
        const fish = this.activeFish;
            const rewardItem = fish.product;
        if (this.game.modifiers.getValue("rielkConstruction:fishingTreasureNoReplace", ModifierQuery.EMPTY) && !rewards._items.has(rewardItem)) // If we don't have the fish we're fishing for, means we have junk/special
        {
            if (rollPercentage(this.game.modifiers.getValue("melvorD:fishingCurrencyGainChance" /* ModifierIDs.fishingCurrencyGainChance */, rewardItem.sellsFor.currency.modQuery))) {
                const currencyToAdd = this.modifyCurrencyReward(rewardItem.sellsFor.currency, rewardItem.sellsFor.quantity, fish);
                rewards.addCurrency(rewardItem.sellsFor.currency, currencyToAdd);
            }
            const rewardQty = this.modifyPrimaryProductQuantity(fish.product, 1, fish);
            this.addCurrencyFromPrimaryProductGain(rewards, rewardItem, rewardQty, fish);
            this.game.stats.Fishing.add(FishingStats.FishCaught, rewardQty);
            rewards.addItem(rewardItem, rewardQty);
        }
        if(this.game.modifiers.getValue("rielkConstruction:fishPerfectCookedFish", ModifierQuery.EMPTY) && rewards._items.has(this.game.cooking.getIngredientCookedVersion(fish.product)))
        {   const cooked = this.game.cooking.getIngredientCookedVersion(fish.product);
            const catchqty = rewards._items.get(cooked)
            rewards._items.delete(cooked);

            rewards._items.set(game.cooking.actions.getObjectByID(cooked.id).perfectItem, catchqty);
        }
        const tarJar = game.items.getObjectByID('rielkConstruction:Tar_Jar');        //Also since the reward is hardcoded to only give one, or 2 per, we just multiply it by 300 if we get the tar jar
        const existing = rewards._items.get(tarJar);
        if (existing !== undefined) {
            rewards._items.set(tarJar, existing * 300);
        } 
        return rewards;

    });
}
