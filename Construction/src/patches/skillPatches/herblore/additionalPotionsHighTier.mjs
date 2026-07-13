export function additionalPotionsHighTier({ patch }) {

    
    patch(Herblore, 'actionRewards').get(function () {
        const rewards = new Rewards(this.game);
        const recipe = this.activeRecipe;
        rewards.setActionInterval(this.actionInterval);
        const actionEvent = new HerbloreActionEvent(this, recipe);
        // Potion Item Reward
        const item = this.actionItem;
        const potionQuantity = this.modifyPrimaryProductQuantity(item, this.unmodifiedActionQuantity, recipe);
        rewards.addItem(item, potionQuantity);
        this.addCurrencyFromPrimaryProductGain(rewards, item, potionQuantity, recipe);
        actionEvent.productQuantity = potionQuantity;
        this.game.stats.Herblore.add(HerbloreStats.PotionsMade, potionQuantity);
        // Random Potion Item Reward
        const query = this.getActionModifierQuery(recipe);
        const randomHerblorePotionChance = this.game.modifiers.getValue("melvorD:randomHerblorePotionChance" /* ModifierIDs.randomHerblorePotionChance */, query);
        const permAddAdd = this.game.modifiers.getValue("rielkConstruction:ChangeAddiIntoHighTier", ModifierQuery.EMPTY);
        if (rollPercentage(randomHerblorePotionChance)) {
            const randomPotion = !permAddAdd? getRandomArrayElement(recipe.potions) : recipe.potions[rollInteger(this.getPotionTier(recipe),3)];
            rewards.addItem(randomPotion, potionQuantity);
            this.game.stats.Herblore.add(HerbloreStats.PotionsMade, potionQuantity);
        }
        // XP Reward
        rewards.addXP(this, this.actionXP, recipe);
        rewards.addAbyssalXP(this, this.actionAbyssalXP, recipe);
        this.addCommonRewards(rewards, recipe);
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);

        const extranices = this.game.modifiers.getValue("rielkConstruction:ExtraTier1Potions", ModifierQuery.EMPTY)
        if (extranices && this.getMasteryLevel(recipe) >= 99) { rewards.addItem(recipe.potions[0], extranices) }
        return rewards;

    });
}