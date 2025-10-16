"use strict";
class Smithing extends ArtisanSkill {
    constructor(namespace, game) {
        super(namespace, 'Smithing', game, SmithingRecipe.name);
        this._media = "assets/media/skills/smithing/smithing.png" /* Assets.Smithing */ ;
        this.baseInterval = 2000;
        this.selectionTabs = smithingSelectionTabs;
        this.renderQueue = new ArtisanSkillRenderQueue();
        /** Map of smithing ore to bars */
        this.oreToBarMap = new Map();
        this.categories = new NamespaceRegistry(game.registeredNamespaces, 'SmithingCategory');
        this.subcategories = new NamespaceRegistry(game.registeredNamespaces, 'SmithingSubcategory');
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    get menu() {
        return smithingArtisanMenu;
    }
    get categoryMenu() {
        return smithingCategoryMenu;
    }
    get noCostsMessage() {
        return getLangString('TOASTS_MATERIALS_REQUIRED_TO_SMITH');
    }
    get actionItem() {
        return this.activeRecipe.product;
    }
    get unmodifiedActionQuantity() {
        return this.activeRecipe.baseQuantity;
    }
    get activeRecipe() {
        if (this.selectedRecipe === undefined)
            throw new Error('Tried to access active recipe, but none is selected.');
        return this.selectedRecipe;
    }
    get isMakingBar() {
        return this.activeRecipe.category.id === "melvorD:Bars" /* SmithingCategoryIDs.Bars */ ;
    }
    get masteryModifiedInterval() {
        return 1700;
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
            this.actions.registerObject(new SmithingRecipe(namespace, recipeData, this.game, this));
        });
        super.registerData(namespace, data);
    }
    modifyData(data) {
        var _a;
        super.modifyData(data);
        (_a = data.recipes) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const recipe = this.actions.getObjectByID(modData.id);
            if (recipe === undefined)
                throw new UnregisteredDataModError(SmithingRecipe.name, modData.id);
            recipe.applyDataModification(modData, this.game);
        });
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.actions.forEach((recipe) => {
            if (recipe.category.id === "melvorD:Bars" /* SmithingCategoryIDs.Bars */ || recipe.category.id === "melvorItA:AbyssalBars" /* SmithingCategoryIDs.AbyssalBars */ ) {
                recipe.itemCosts.forEach(({
                    item
                }) => {
                    if (item.id !== "melvorD:Coal_Ore" /* ItemIDs.Coal_Ore */ && !this.oreToBarMap.has(item) && item.id.includes('_Ore')) {
                        this.oreToBarMap.set(item, recipe.product);
                    }
                });
            }
        });
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
            switchToCategory(smithingSelectionTabs)(this.selectedRecipe.category);
    }
    updateRealmSelection() {
        smithingCategoryMenu.setCurrentRealm(game.smithing.currentRealm);
        smithingCategoryMenu.addOptions(game.smithing.categories.allObjects, getLangString('MENU_TEXT_SELECT_SMITHING_CATEGORY'), switchToCategory(smithingSelectionTabs));
    }
    getSmithedVersionOfOre(ore) {
        return this.oreToBarMap.get(ore);
    }
    getUncappedCostReduction(action, item) {
        let reduction = super.getUncappedCostReduction(action, item);
        if (item !== undefined && item.id == "melvorD:Coal_Ore" /* ItemIDs.Coal_Ore */ ) {
            reduction -= this.game.modifiers.smithingCoalCost;
        }
        return reduction;
    }
    getFlatCostReduction(action, item) {
        let reduction = super.getFlatCostReduction(action, item);
        if (item !== undefined && item.id == "melvorD:Coal_Ore" /* ItemIDs.Coal_Ore */ ) {
            reduction -= this.game.modifiers.flatSmithingCoalCost;
        }
        return reduction;
    }
    modifyItemCost(item, quantity, recipe) {
        const cost = super.modifyItemCost(item, quantity, recipe);
        if (item.id === "melvorD:Coal_Ore" /* ItemIDs.Coal_Ore */ &&
            this.game.modifiers.getValue("melvorD:removeSmithingCoalCosts" /* ModifierIDs.removeSmithingCoalCosts */ , this.getActionModifierQuery(recipe)))
            return 0;
        return cost;
    }
    getActionModifierQueryParams(action) {
        const scope = super.getActionModifierQueryParams(action);
        if (action instanceof SmithingRecipe) {
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
        const statToTrack = this.isMakingBar ? SmithingStats.OresPreserved : SmithingStats.BarsPreserved;
        costs.recordBulkItemStat(this.game.stats.Smithing, statToTrack);
    }
    recordCostConsumptionStats(costs) {
        super.recordCostConsumptionStats(costs);
        const statToTrack = this.isMakingBar ? SmithingStats.OresUsed : SmithingStats.BarsUsed;
        costs.recordBulkItemStat(this.game.stats.Smithing, statToTrack);
    }
    preAction() {}
    get actionRewards() {
        const rewards = new Rewards(this.game);
        const recipe = this.activeRecipe;
        rewards.setActionInterval(this.actionInterval);
        const actionEvent = new SmithingActionEvent(this, recipe);
        // Main product
        const item = recipe.product;
        const qtyToAdd = this.modifyPrimaryProductQuantity(item, this.unmodifiedActionQuantity, recipe);
        rewards.addItem(item, qtyToAdd);
        this.addCurrencyFromPrimaryProductGain(rewards, item, qtyToAdd, recipe);
        actionEvent.productQuantity = qtyToAdd;
        this.game.stats.Smithing.add(this.isMakingBar ? SmithingStats.TotalBarsSmelted : SmithingStats.TotalItemsSmithed, qtyToAdd);
        // XP Reward
        rewards.addXP(this, this.actionXP, recipe);
        rewards.addAbyssalXP(this, this.actionAbyssalXP, recipe);
        this.addCommonRewards(rewards, recipe);
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    postAction() {
        this.game.stats.Smithing.inc(this.isMakingBar ? SmithingStats.SmeltingActions : SmithingStats.SmithingActions);
        this.game.stats.Smithing.add(SmithingStats.TimeSpent, this.currentActionInterval);
        this.renderQueue.recipeInfo = true;
        this.renderQueue.quantities = true;
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.smithingRecipes[oldActionID];
    }
    setFromOldOffline(offline, idMap) {
        const recipe = this.actions.getObjectByID(idMap.smithingOldOffline[offline.action]);
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
class SmithingRecipe extends SingleProductArtisanSkillRecipe {
    constructor(namespace, data, game, skill) {
        super(namespace, data, game, skill);
        try {
            if (data.subcategoryID !== undefined)
                this.subcategory = skill.subcategories.getObjectSafe(data.subcategoryID);
        } catch (e) {
            throw new DataConstructionError(SmithingRecipe.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            if (data.subcategoryID !== undefined)
                this.subcategory = game.smithing.subcategories.getObjectSafe(data.subcategoryID);
        } catch (e) {
            throw new DataModificationError(SmithingRecipe.name, e, this.id);
        }
    }
}
//# sourceMappingURL=smithing.js.map
checkFileVersion('?12097')