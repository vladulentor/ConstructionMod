"use strict";
class Crafting extends ArtisanSkill {
    constructor(namespace, game) {
        super(namespace, 'Crafting', game, CraftingRecipe.name);
        this._media = "assets/media/skills/crafting/crafting.png" /* Assets.Crafting */ ;
        this.baseInterval = 3000;
        this.selectionTabs = craftingSelectionTabs;
        this.renderQueue = new ArtisanSkillRenderQueue();
        this.categories = new NamespaceRegistry(game.registeredNamespaces, 'CraftingCategory');
        this.subcategories = new NamespaceRegistry(game.registeredNamespaces, 'CraftingSubcategory');
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    get menu() {
        return craftingArtisanMenu;
    }
    get categoryMenu() {
        return craftingCategoryMenu;
    }
    get noCostsMessage() {
        return getLangString('TOASTS_MATERIALS_REQUIRED_TO_CRAFT');
    }
    get actionItem() {
        return this.activeRecipe.product;
    }
    get unmodifiedActionQuantity() {
        return this.activeRecipe.baseQuantity;
    }
    get activeRecipe() {
        if (this.selectedRecipe === undefined)
            throw new Error('Tried to get active crafting recipe, but none is selected.');
        return this.selectedRecipe;
    }
    get masteryModifiedInterval() {
        return 1650;
    }
    registerData(namespace, data) {
        var _a, _b, _c;
        (_a = data.categories) === null || _a === void 0 ? void 0 : _a.forEach((categoryData) => {
            this.categories.registerObject(new SkillCategory(namespace, categoryData, this, this.game));
        });
        (_b = data.subcategories) === null || _b === void 0 ? void 0 : _b.forEach((subcategoryData) => {
            this.subcategories.registerObject(new SkillSubcategory(namespace, subcategoryData));
        });
        (_c = data.recipes) === null || _c === void 0 ? void 0 : _c.forEach((recipeData) => {
            this.actions.registerObject(new CraftingRecipe(namespace, recipeData, this.game, this));
        });
        super.registerData(namespace, data);
    }
    modifyData(data) {
        var _a;
        super.modifyData(data);
        (_a = data.recipes) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const recipe = this.actions.getObjectByID(modData.id);
            if (recipe === undefined)
                throw new UnregisteredDataModError(CraftingRecipe.name, modData.id);
            recipe.applyDataModification(modData, this.game);
        });
    }
    postDataRegistration() {
        super.postDataRegistration();
        // Set up sorted mastery
        this.sortedMasteryActions = sortRecipesByCategoryAndLevel(this.actions.allObjects, this.categories.allObjects);
        // Add Milestones
        this.actions.forEach((action) => {
            if (action.abyssalLevel > 0)
                this.abyssalMilestones.push(action);
            else
                this.milestones.push(action);
        });
        this.sortMilestones();
    }
    resetToDefaultSelectedRecipeBasedOnRealm() {
        super.resetToDefaultSelectedRecipeBasedOnRealm();
        if (this.selectedRecipe !== undefined)
            switchToCategory(craftingSelectionTabs)(this.selectedRecipe.category);
    }
    updateRealmSelection() {
        craftingCategoryMenu.setCurrentRealm(this.currentRealm);
        craftingCategoryMenu.addOptions(game.crafting.categories.allObjects, getLangString('MENU_TEXT_SELECT_CRAFTING_CATEGORY'), switchToCategory(craftingSelectionTabs));
    }
    getRecipeAutoSubcategory(recipe) {
        if (recipe.product instanceof EquipmentItem) {
            if (recipe.product.fitsInSlot("melvorD:Ring" /* EquipmentSlotIDs.Ring */ ) || recipe.product.fitsInSlot("melvorD:Amulet" /* EquipmentSlotIDs.Amulet */ )) {
                return this.subcategories.getObjectByID("melvorF:Jewelry" /* CraftingSubcategoryIDs.Jewelry */ );
            } else if (recipe.product.fitsInSlot("melvorD:Consumable" /* EquipmentSlotIDs.Consumable */ )) {
                return this.subcategories.getObjectByID("melvorF:Consumables" /* CraftingSubcategoryIDs.Consumables */ );
            }
        }
        return undefined;
    }
    getFlatCostReduction(action, item) {
        let reduction = super.getFlatCostReduction(action, item);
        // TODO_MR Convert to category scoped modifier
        // Monkey + Pig Synergy: Dragonhide cost reduced by 1. Minimum 1.
        if ((action === null || action === void 0 ? void 0 : action.category.id) === "melvorF:Dragonhide" /* CraftingCategoryIDs.Dragonhide */ ) {
            reduction -= this.game.modifiers.flatCraftingDragonhideCost;
        }
        return reduction;
    }
    getActionModifierQueryParams(action) {
        const scope = super.getActionModifierQueryParams(action);
        if (action instanceof CraftingRecipe) {
            scope.category = action.category;
            scope.subcategory = action.subcategory;
        }
        return scope;
    }
    onMasteryLevelUp(action, oldLevel, newLevel) {
        super.onMasteryLevelUp(action, oldLevel, newLevel);
        if (this.selectedRecipe === action)
            this.renderQueue.selectedRecipe = true;
    }
    recordCostPreservationStats(costs) {
        super.recordCostPreservationStats(costs);
        costs.recordBulkItemStat(this.game.stats.Crafting, CraftingStats.ItemsPreserved);
    }
    recordCostConsumptionStats(costs) {
        super.recordCostConsumptionStats(costs);
        costs.recordBulkItemStat(this.game.stats.Crafting, CraftingStats.ItemsUsed);
    }
    preAction() {}
    get actionRewards() {
        const rewards = new Rewards(this.game);
        const recipe = this.activeRecipe;
        rewards.setActionInterval(this.actionInterval);
        const actionEvent = new CraftingActionEvent(this, recipe);
        // Main product
        let item = recipe.product;
        const qtyToAdd = this.modifyPrimaryProductQuantity(item, this.unmodifiedActionQuantity, recipe);
        if (rollPercentage(this.game.modifiers.craftingEnchantedUrnChance)) {
            switch (item.id) {
                case "melvorF:Small_Urn" /* ItemIDs.Small_Urn */ :
                    item = game.items.getObjectByID("melvorF:Small_Urn_Enchanted" /* ItemIDs.Small_Urn_Enchanted */ );
                    break;
                case "melvorF:Medium_Urn" /* ItemIDs.Medium_Urn */ :
                    item = game.items.getObjectByID("melvorF:Medium_Urn_Enchanted" /* ItemIDs.Medium_Urn_Enchanted */ );
                    break;
                case "melvorTotH:Large_Urn" /* ItemIDs.Large_Urn */ :
                    item = game.items.getObjectByID("melvorTotH:Large_Urn_Enchanted" /* ItemIDs.Large_Urn_Enchanted */ );
                    break;
            }
        }
        rewards.addItem(item, qtyToAdd);
        this.addCurrencyFromPrimaryProductGain(rewards, item, qtyToAdd, recipe);
        actionEvent.productQuantity = qtyToAdd;
        this.game.stats.Crafting.add(CraftingStats.ItemsCrafted, qtyToAdd);
        // Currency Reward
        if (rollPercentage(this.game.modifiers.getValue("melvorD:crafting30CurrencyGainChance" /* ModifierIDs.crafting30CurrencyGainChance */ , item.sellsFor.currency.modQuery))) {
            let currencyToAdd = item.sellsFor.quantity * 0.3;
            currencyToAdd = this.modifyCurrencyReward(item.sellsFor.currency, currencyToAdd, recipe);
            rewards.addCurrency(item.sellsFor.currency, currencyToAdd);
        }
        // XP Reward
        rewards.addXP(this, this.actionXP, recipe);
        rewards.addAbyssalXP(this, this.actionAbyssalXP, recipe);
        this.addCommonRewards(rewards, recipe);
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    postAction() {
        this.game.stats.Crafting.inc(CraftingStats.Actions);
        this.game.stats.Crafting.add(CraftingStats.TimeSpent, this.currentActionInterval);
        this.renderQueue.recipeInfo = true;
        this.renderQueue.quantities = true;
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.craftingRecipes[oldActionID];
    }
    setFromOldOffline(offline, idMap) {
        const recipe = this.actions.getObjectByID(idMap.craftingRecipes[offline.action]);
        if (recipe !== undefined) {
            this.selectRecipeOnClick(recipe);
            this.createButtonOnClick();
        }
    }
    testTranslations() {
        super.testTranslations();
        this.categories.forEach((category) => {
            category.name;
        });
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        this.actions.forEach((action) => obtainable.add(action.product));
        this.game.randomGemTable.sortedDropsArray.forEach((drop) => obtainable.add(drop.item));
        obtainable.add(game.items.getObjectByID("melvorF:Small_Urn_Enchanted" /* ItemIDs.Small_Urn_Enchanted */ ));
        obtainable.add(game.items.getObjectByID("melvorF:Medium_Urn_Enchanted" /* ItemIDs.Medium_Urn_Enchanted */ ));
        obtainable.add(game.items.getObjectByID("melvorTotH:Large_Urn_Enchanted" /* ItemIDs.Large_Urn_Enchanted */ ));
        return obtainable;
    }
    getRegistry(type) {
        switch (type) {
            case ScopeSourceType.Category:
                return this.categories;
            case ScopeSourceType.Action:
                return this.actions;
            case ScopeSourceType.Subcategory:
                return this.subcategories;
        }
    }
    getPkgObjects(pkg, type) {
        var _a, _b;
        const skillData = (_b = (_a = pkg.data) === null || _a === void 0 ? void 0 : _a.skillData) === null || _b === void 0 ? void 0 : _b.find(({
            skillID
        }) => skillID === this.id);
        if (skillData !== undefined) {
            switch (type) {
                case ScopeSourceType.Category:
                    return skillData.categories;
                case ScopeSourceType.Action:
                    return skillData.recipes;
                case ScopeSourceType.Subcategory:
                    return skillData.subcategories;
            }
        }
    }
}
class CraftingRecipe extends SingleProductArtisanSkillRecipe {
    constructor(namespace, data, game, skill) {
        super(namespace, data, game, skill);
        try {
            if (data.subcategoryID !== undefined)
                this.subcategory = skill.subcategories.getObjectSafe(data.subcategoryID);
            const autoSubcategory = skill.getRecipeAutoSubcategory(this);
            if (autoSubcategory !== undefined)
                this.subcategory = autoSubcategory;
        } catch (e) {
            throw new DataConstructionError(CraftingRecipe.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            if (data.subcategoryID !== undefined)
                this.subcategory = game.crafting.subcategories.getObjectSafe(data.subcategoryID);
        } catch (e) {
            throw new DataModificationError(CraftingRecipe.name, e, this.id);
        }
    }
}
//# sourceMappingURL=crafting.js.map
checkFileVersion('?12097')