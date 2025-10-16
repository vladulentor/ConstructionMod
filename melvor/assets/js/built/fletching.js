"use strict";
class Fletching extends ArtisanSkill {
    constructor(namespace, game) {
        super(namespace, 'Fletching', game, FletchingRecipe.name);
        this._media = "assets/media/skills/fletching/fletching.png" /* Assets.Fletching */ ;
        this.baseInterval = 2000;
        this.selectionTabs = fletchingSelectionTabs;
        this.renderQueue = new ArtisanSkillRenderQueue();
        /** Stores the associated alt. recipe index for a recipe */
        this.setAltRecipes = new Map();
        this.categories = new NamespaceRegistry(game.registeredNamespaces, 'FletchingCategory');
        this.subcategories = new NamespaceRegistry(game.registeredNamespaces, 'FletchingSubcategory');
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    get menu() {
        return fletchingArtisanMenu;
    }
    get categoryMenu() {
        return fletchingCategoryMenu;
    }
    get noCostsMessage() {
        return getLangString('TOASTS_MATERIALS_REQUIRED_TO_FLETCH');
    }
    get actionItem() {
        return this.activeRecipe.product;
    }
    get unmodifiedActionQuantity() {
        const recipe = this.activeRecipe;
        let baseQuantity = recipe.baseQuantity;
        if (recipe.alternativeCosts !== undefined) {
            baseQuantity *= recipe.alternativeCosts[this.selectedAltRecipe].quantityMultiplier;
        }
        return baseQuantity;
    }
    get activeRecipe() {
        if (this.selectedRecipe === undefined)
            throw new Error('Tried to get active fletching recipe, but none is selected.');
        return this.selectedRecipe;
    }
    get masteryModifiedInterval() {
        return 1300;
    }
    /** Gets the set alt. recipe index for the currently selected recipe */
    get selectedAltRecipe() {
        var _a;
        return (_a = this.setAltRecipes.get(this.activeRecipe)) !== null && _a !== void 0 ? _a : 0;
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
            this.actions.registerObject(new FletchingRecipe(namespace, recipeData, this.game, this));
        });
        super.registerData(namespace, data);
    }
    modifyData(data) {
        var _a;
        super.modifyData(data);
        (_a = data.recipes) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const recipe = this.actions.getObjectByID(modData.id);
            if (recipe === undefined)
                throw new UnregisteredDataModError(FletchingRecipe.name, modData.id);
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
            switchToCategory(fletchingSelectionTabs)(this.selectedRecipe.category);
    }
    updateRealmSelection() {
        fletchingCategoryMenu.setCurrentRealm(this.currentRealm);
        fletchingCategoryMenu.addOptions(game.fletching.categories.allObjects, getLangString('MENU_TEXT_SELECT_FLETCHING_CATEGORY'), switchToCategory(fletchingSelectionTabs));
    }
    getRecipeAutoSubcategory(recipe) {
        if (recipe.product instanceof EquipmentItem) {
            switch (recipe.product.ammoType) {
                case AmmoTypeID.Arrows:
                    return this.subcategories.getObjectByID("melvorF:Arrows" /* FletchingSubcategoryIDs.Arrows */ );
                case AmmoTypeID.Javelins:
                    return this.subcategories.getObjectByID("melvorF:Javelins" /* FletchingSubcategoryIDs.Javelins */ );
                case AmmoTypeID.Bolts:
                    return this.subcategories.getObjectByID("melvorF:Bolts" /* FletchingSubcategoryIDs.Bolts */ );
            }
        }
        return undefined;
    }
    getActionModifierQueryParams(action) {
        const scope = super.getActionModifierQueryParams(action);
        if (action instanceof FletchingRecipe) {
            scope.category = action.category;
            scope.subcategory = action.subcategory;
        }
        return scope;
    }
    getRecipeCosts(recipe) {
        var _a;
        const costs = super.getRecipeCosts(recipe);
        if (recipe.alternativeCosts !== undefined) {
            const altID = (_a = this.setAltRecipes.get(recipe)) !== null && _a !== void 0 ? _a : 0;
            const altCosts = recipe.alternativeCosts[altID];
            altCosts.itemCosts.forEach(({
                item,
                quantity
            }) => {
                costs.addItem(item, this.modifyItemCost(item, quantity, recipe));
            });
        }
        return costs;
    }
    /** Callback function for selecting an alternative recipe */
    selectAltRecipeOnClick(altID) {
        if (altID !== this.selectedAltRecipe && this.isActive && !this.stop())
            return;
        this.setAltRecipes.set(this.activeRecipe, altID);
        this.renderQueue.selectedRecipe = true;
        this.render();
    }
    renderSelectedRecipe() {
        if (!this.renderQueue.selectedRecipe)
            return;
        if (this.selectedRecipe !== undefined) {
            if (this.activeRecipe.alternativeCosts !== undefined) {
                this.menu.setRecipeDropdown(this.activeRecipe.alternativeCosts.map((cost) => {
                    return {
                        items: cost.itemCosts,
                        currencies: []
                    };
                }), (recipeID) => () => this.selectAltRecipeOnClick(recipeID));
                this.menu.showRecipeDropdown();
            } else {
                this.menu.hideRecipeDropdown();
            }
        } else {
            this.menu.hideRecipeDropdown();
        }
        super.renderSelectedRecipe();
    }
    onMasteryLevelUp(action, oldLevel, newLevel) {
        super.onMasteryLevelUp(action, oldLevel, newLevel);
        if (this.selectedRecipe === action)
            this.renderQueue.selectedRecipe = true;
    }
    recordCostPreservationStats(costs) {
        super.recordCostPreservationStats(costs);
        costs.recordBulkItemStat(this.game.stats.Fletching, FletchingStats.ItemsPreserved);
    }
    recordCostConsumptionStats(costs) {
        super.recordCostConsumptionStats(costs);
        costs.recordBulkItemStat(this.game.stats.Fletching, FletchingStats.ItemsUsed);
    }
    preAction() {}
    get actionRewards() {
        const rewards = new Rewards(this.game);
        const recipe = this.activeRecipe;
        rewards.setActionInterval(this.actionInterval);
        const actionEvent = new FletchingActionEvent(this, recipe);
        if (recipe.alternativeCosts !== undefined)
            actionEvent.altRecipeID = this.selectedAltRecipe;
        // Main product
        const item = recipe.product;
        const qtyToAdd = this.modifyPrimaryProductQuantity(item, this.unmodifiedActionQuantity, recipe);
        // Roll for chance to convert items into sale price instead of adding items to bank
        const itemValue = item.sellsFor;
        const conversionChance = this.game.modifiers.getValue("melvorD:fletchingItemToCurrencyChance" /* ModifierIDs.fletchingItemToCurrencyChance */ , itemValue.currency.modQuery);
        if (rollPercentage(conversionChance)) {
            let currencyToAdd = itemValue.quantity * qtyToAdd * 1.5;
            if (currencyToAdd > 0) {
                currencyToAdd = this.modifyCurrencyReward(itemValue.currency, currencyToAdd, recipe);
                rewards.addCurrency(itemValue.currency, currencyToAdd);
            }
        } else {
            rewards.addItem(item, qtyToAdd);
            this.addCurrencyFromPrimaryProductGain(rewards, item, qtyToAdd, recipe);
        }
        actionEvent.productQuantity = qtyToAdd;
        this.game.stats.Fletching.add(FletchingStats.ItemsFletched, qtyToAdd);
        if (item.id === "melvorF:Arrow_Shafts" /* ItemIDs.Arrow_Shafts */ )
            this.game.stats.Fletching.add(FletchingStats.ArrowShaftsMade, qtyToAdd);
        // XP Reward
        rewards.addXP(this, this.actionXP, recipe);
        rewards.addAbyssalXP(this, this.actionAbyssalXP, recipe);
        this.addCommonRewards(rewards, recipe);
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    postAction() {
        this.game.stats.Fletching.inc(FletchingStats.Actions);
        this.game.stats.Fletching.add(FletchingStats.TimeSpent, this.currentActionInterval);
        this.renderQueue.recipeInfo = true;
        this.renderQueue.quantities = true;
    }
    getErrorLog() {
        const altRecipeLog = [];
        this.setAltRecipes.forEach((altID, recipe) => {
            altRecipeLog.push(`${recipe.id} : ${altID}`);
        });
        return `${super.getErrorLog()}
Selected Alt Recipes (Mastery ID | altID):
${altRecipeLog.join('\n')}`;
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
    encode(writer) {
        super.encode(writer);
        writer.writeMap(this.setAltRecipes, writeNamespaced, (altId, writer) => {
            writer.writeUint16(altId);
        });
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.setAltRecipes = reader.getMap(readNamespacedReject(this.actions), (reader) => reader.getUint16());
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        const numSetAlts = reader.getNumber();
        for (let i = 0; i < numSetAlts; i++) {
            const recipe = this.actions.getObjectByID(idMap.fletchingRecipes[reader.getNumber()]);
            const altID = reader.getNumber();
            if (recipe === undefined)
                return;
            if (recipe.alternativeCosts !== undefined && altID < recipe.alternativeCosts.length)
                this.setAltRecipes.set(recipe, altID);
        }
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.fletchingRecipes[oldActionID];
    }
    setFromOldOffline(offline, idMap) {
        const recipe = this.actions.getObjectByID(idMap.fletchingOldOffline[offline.action[0]]);
        const altLogID = offline.action[1];
        if (recipe !== undefined) {
            this.selectRecipeOnClick(recipe);
            if (recipe.alternativeCosts !== undefined && altLogID < recipe.alternativeCosts.length)
                this.selectAltRecipeOnClick(altLogID);
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
}
class FletchingRecipe extends SingleProductArtisanSkillRecipe {
    constructor(namespace, data, game, skill) {
        super(namespace, data, game, skill);
        try {
            if (data.subcategoryID !== undefined)
                this.subcategory = skill.subcategories.getObjectSafe(data.subcategoryID);
            if (data.alternativeCosts !== undefined) {
                this.alternativeCosts = data.alternativeCosts.map(({
                    itemCosts,
                    quantityMultiplier
                }) => {
                    return {
                        itemCosts: game.items.getQuantities(itemCosts),
                        quantityMultiplier,
                    };
                });
            }
            const autoSubcategory = skill.getRecipeAutoSubcategory(this);
            if (autoSubcategory !== undefined)
                this.subcategory = autoSubcategory;
        } catch (e) {
            throw new DataConstructionError(FletchingRecipe.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            if (data.subcategoryID !== undefined)
                this.subcategory = game.fletching.subcategories.getObjectSafe(data.subcategoryID);
            if (data.alternativeCosts !== undefined) {
                if (this.alternativeCosts === undefined)
                    this.alternativeCosts = [];
                data.alternativeCosts.forEach(({
                    itemCosts,
                    quantityMultiplier
                }) => {
                    var _a;
                    (_a = this.alternativeCosts) === null || _a === void 0 ? void 0 : _a.push({
                        itemCosts: game.items.getQuantities(itemCosts),
                        quantityMultiplier,
                    });
                });
            }
        } catch (e) {
            throw new DataModificationError(FletchingRecipe.name, e, this.id);
        }
    }
}
//# sourceMappingURL=fletching.js.map
checkFileVersion('?12097')