export function reduceUpgradeLevelReq({patch}){
patch(ItemUpgradeMenuElement,'setUpgradeMasteryRequirement').after(function(_, upgrade, bank) {
    const red = game.modifiers.getValue("rielkConstruction:reducePotionUpReq",ModifierQuery.EMPTY)
if(red && upgrade.upgradedItem instanceof PotionItem)
    this.upgradeMasteryLevel.textContent = Math.max(+this.upgradeMasteryLevel.textContent + red, 1);
});
patch(Bank, 'checkUpgradePotionRequirement').replace(function (_,upgrade) {
            let requirementsMet = true;
        if (upgrade.upgradedItem instanceof PotionItem) {
            const recipe = this.game.herblore.getRecipeForPotion(upgrade.upgradedItem);
            requirementsMet =
                recipe !== undefined &&
                    this.game.herblore.getMasteryLevel(recipe) >= (Herblore.tierMasteryLevels[upgrade.upgradedItem.tier] + game.modifiers.getValue("rielkConstruction:reducePotionUpReq",ModifierQuery.EMPTY));
        }
        return requirementsMet;

})
}