export function additionalPotionsHighTier({ patch }) {

    game.herblore.getRandomFlatAdditionalPrimaryProductQuantity = function (item, action, query) {
        let quantity = 0;
        if (!this.game.modifiers.getValue("rielkConstruction:ChangeAddiIntoHighTier", ModifierQuery.EMPTY) && rollPercentage(this.game.modifiers.getValue("melvorD:additionalPrimaryProductChance", query)))
        quantity++;
        if (rollPercentage(this.game.modifiers.getValue("melvorD:additional2PrimaryProductChance" /* ModifierIDs.additional2PrimaryProductChance */, query)))
            quantity += 2;
        if (rollPercentage(this.game.modifiers.getValue("melvorD:additional3PrimaryProductChance" /* ModifierIDs.additional3PrimaryProductChance */, query)))
            quantity += 3;
        if (rollPercentage(this.game.modifiers.getValue("melvorD:additional5PrimaryProductChance" /* ModifierIDs.additional5PrimaryProductChance */, query)))
            quantity += 5;
        if (rollPercentage(this.game.modifiers.getValue("melvorD:additional8PrimaryProductChance" /* ModifierIDs.additional8PrimaryProductChance */, query)))
            quantity += 8;
        return quantity;
    };
    patch(Herblore, 'actionRewards').get(function (orig) {
        const rewards = orig();
        const recipe = this.activeRecipe
        const ourTier = this.getPotionTier(recipe);
        if (this.game.modifiers.getValue("rielkConstruction:ChangeAddiIntoHighTier", ModifierQuery.EMPTY) &&
            rollPercentage(this.game.modifiers.getValue("melvorD:additionalPrimaryProductChance", this.getActionModifierQuery(recipe)))) {
            let randomPotionTier = rollInteger(ourTier, 3);
            rewards.addItem(recipe.potions[randomPotionTier], 1)
        }
        const extranices= this.game.modifiers.getValue("rielkConstruction:ExtraTier1Potions", ModifierQuery.EMPTY)
        if(extranices && this.getMasteryLevel(recipe) >= 99)
        {rewards.addItem(recipe.potions[0], extranices)}
        return rewards;
    });
}