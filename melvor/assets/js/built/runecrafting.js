"use strict";
class Runecrafting extends ArtisanSkill {
    constructor(namespace, game) {
        super(namespace, 'Runecrafting', game, RunecraftingRecipe.name);
        this._media = "assets/media/skills/runecrafting/runecrafting.png" /* Assets.Runecrafting */ ;
        this.baseInterval = 2000;
        this.selectionTabs = runecraftingSelectionTabs;
        this.renderQueue = new ArtisanSkillRenderQueue();
        this.elementalRunes = [];
        this.comboRunes = [];
        this.categories = new NamespaceRegistry(game.registeredNamespaces, 'RunecraftingCategory');
        this.subcategories = new NamespaceRegistry(game.registeredNamespaces, 'RunecraftingSubcategory');
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    get menu() {
        return runecraftingArtisanMenu;
    }
    get categoryMenu() {
        return runecraftingCategoryMenu;
    }
    get noCostsMessage() {
        return getLangString('TOASTS_MATERIALS_REQUIRED_TO_CREATE');
    }
    get actionXP() {
        let xp = super.actionXP;
        if (this.isMakingRunes)
            xp *= 1 + this.game.modifiers.runecraftingBaseXPForRunes / 100;
        return xp;
    }
    get actionAbyssalXP() {
        let xp = super.actionAbyssalXP;
        if (this.isMakingRunes)
            xp *= 1 + this.game.modifiers.runecraftingBaseAXPForRunes / 100;
        return xp;
    }
    get actionItem() {
        return this.activeRecipe.product;
    }
    get unmodifiedActionQuantity() {
        return this.activeRecipe.baseQuantity;
    }
    get activeRecipe() {
        if (this.selectedRecipe === undefined)
            throw new Error('Tried to get active recipe, but none is selected.');
        return this.selectedRecipe;
    }
    get masteryModifiedInterval() {
        return 1700;
    }
    get isMakingRunes() {
        return this.activeRecipe.subcategories.some((subcat) => subcat.id === "melvorF:Runes" /* RunecraftingSubcategoryIDs.Runes */ );
    }
    registerData(namespace, data) {
        var _a, _b, _c, _d, _e;
        (_a = data.categories) === null || _a === void 0 ? void 0 : _a.forEach((categoryData) => {
            this.categories.registerObject(new SkillCategory(namespace, categoryData, this, this.game));
        });
        (_b = data.subcategories) === null || _b === void 0 ? void 0 : _b.forEach((subcategoryData) => {
            this.subcategories.registerObject(new SkillSubcategory(namespace, subcategoryData));
        });
        (_c = data.recipes) === null || _c === void 0 ? void 0 : _c.forEach((recipeData) => {
            this.actions.registerObject(new RunecraftingRecipe(namespace, recipeData, this.game, this));
        });
        super.registerData(namespace, data);
        (_d = data.elementalRuneIDs) === null || _d === void 0 ? void 0 : _d.forEach((runeID) => {
            this.elementalRunes.push(this.getItemForRegistration(runeID));
        });
        (_e = data.comboRuneIDs) === null || _e === void 0 ? void 0 : _e.forEach((runeID) => {
            this.comboRunes.push(this.getItemForRegistration(runeID));
        });
    }
    modifyData(data) {
        super.modifyData(data);
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
    /** Determines if a recipe makes combo runes that use water runes as an ingredient */
    doesRecipeMakeWaterComboRunes(recipe) {
        return (recipe.category.id === "melvorF:CombinationRunes" /* RunecraftingCategoryIDs.CombinationRunes */ &&
            recipe.itemCosts.some((cost) => cost.item.id === "melvorD:Water_Rune" /* ItemIDs.Water_Rune */ ));
    }
    resetToDefaultSelectedRecipeBasedOnRealm() {
        super.resetToDefaultSelectedRecipeBasedOnRealm();
        if (this.selectedRecipe !== undefined)
            switchToCategory(runecraftingSelectionTabs)(this.selectedRecipe.category);
    }
    updateRealmSelection() {
        runecraftingCategoryMenu.setCurrentRealm(this.currentRealm);
        runecraftingCategoryMenu.addOptions(game.runecrafting.categories.allObjects, getLangString('MENU_TEXT_SELECT_RUNECRAFTING_CATEGORY'), switchToCategory(runecraftingSelectionTabs));
    }
    getRecipeAutoSubcategory(recipe) {
        const item = recipe.product;
        if (item instanceof WeaponItem && item.attackType === 'magic') {
            if (item.occupiesSlot("melvorD:Shield" /* EquipmentSlotIDs.Shield */ )) {
                return this.subcategories.getObjectByID("melvorF:Staves" /* RunecraftingSubcategoryIDs.Staves */ );
            } else {
                return this.subcategories.getObjectByID("melvorF:Wands" /* RunecraftingSubcategoryIDs.Wands */ );
            }
        }
        return undefined;
    }
    getUncappedCostReduction(recipe, item) {
        let reduction = super.getUncappedCostReduction(recipe, item);
        if (item instanceof RuneItem || (recipe === null || recipe === void 0 ? void 0 : recipe.product) instanceof EquipmentItem) {
            reduction += this.game.modifiers.getValue("melvorD:runecraftingRuneCostReduction" /* ModifierIDs.runecraftingRuneCostReduction */ , this.getActionModifierQuery(recipe));
        }
        return reduction;
    }
    _buildRuneItemCostReductionSources(action) {
        const totalLangString = setLang === 'en' ? 'Rune Costs Only:' : getLangString('COMBAT_MISC_76');
        const builder = new ModifierSourceBuilder(this.game.modifiers, true, totalLangString);
        builder.addSources("melvorD:runecraftingRuneCostReduction" /* ModifierIDs.runecraftingRuneCostReduction */ , this.getActionModifierQuery(action));
        return builder;
    }
    getRuneItemCostReductionSources(action) {
        return this._buildRuneItemCostReductionSources(action).getSpans();
    }
    getCostReductionSources(action) {
        return super.getCostReductionSources(action).concat(this.getRuneItemCostReductionSources(action));
    }
    getActionModifierQueryParams(action) {
        const scope = super.getActionModifierQueryParams(action);
        if (action instanceof RunecraftingRecipe) {
            scope.category = action.category;
            if (action.subcategories.length > 0)
                scope.subcategory = action.subcategories;
        }
        return scope;
    }
    onMasteryLevelUp(action, oldLevel, newLevel) {
        super.onMasteryLevelUp(action, oldLevel, newLevel);
        if (this.selectedRecipe === action)
            this.renderQueue.selectedRecipe = true;
    }
    checkMasteryLevelBonusFilter(action, filter) {
        switch (filter) {
            case 'Rune':
                return action.subcategories.some((subcat) => subcat.id === "melvorF:Runes" /* RunecraftingSubcategoryIDs.Runes */ );
            case 'Equipment':
                return action.product instanceof EquipmentItem;
        }
        return true;
    }
    recordCostPreservationStats(costs) {
        super.recordCostPreservationStats(costs);
        costs.recordBulkItemStat(this.game.stats.Runecrafting, RunecraftingStats.ItemsPreserved);
    }
    recordCostConsumptionStats(costs) {
        super.recordCostConsumptionStats(costs);
        costs.recordBulkItemStat(this.game.stats.Runecrafting, RunecraftingStats.ItemsUsed);
    }
    preAction() {}
    get actionRewards() {
        const rewards = new Rewards(this.game);
        const recipe = this.activeRecipe;
        rewards.setActionInterval(this.actionInterval);
        const actionEvent = new RunecraftingActionEvent(this, this.activeRecipe);
        // Main product
        const item = recipe.product;
        const qtyToAdd = this.modifyPrimaryProductQuantity(item, this.unmodifiedActionQuantity, recipe);
        rewards.addItem(item, qtyToAdd);
        this.addCurrencyFromPrimaryProductGain(rewards, item, qtyToAdd, recipe);
        actionEvent.productQuantity = qtyToAdd;
        this.game.stats.Runecrafting.add(RunecraftingStats.ItemsCrafted, qtyToAdd);
        // Bonus Runes per Craft
        const bonusRuneChance = this.game.modifiers.elementalRuneChance;
        if ((bonusRuneChance > 0 && this.activeRecipe.category.id === "melvorF:StandardRunes" /* RunecraftingCategoryIDs.StandardRunes */ ) ||
            this.activeRecipe.category.id === "melvorF:CombinationRunes" /* RunecraftingCategoryIDs.CombinationRunes */ ) {
            let bonusRuneQuantity = this.game.modifiers.elementalRuneQuantity;
            bonusRuneQuantity = Math.max(1, bonusRuneQuantity);
            // Chance for Elemental Runes
            if (rollPercentage(bonusRuneChance)) {
                rewards.addItem(getRandomArrayElement(this.elementalRunes), bonusRuneQuantity);
                this.game.stats.Runecrafting.add(RunecraftingStats.ItemsCrafted, bonusRuneQuantity);
            }
            // Chance for Combo Runes
            if (this.game.modifiers.giveRandomComboRunesRunecrafting > 0 && rollPercentage(bonusRuneChance)) {
                rewards.addItem(getRandomArrayElement(this.comboRunes), bonusRuneQuantity);
                this.game.stats.Runecrafting.add(RunecraftingStats.ItemsCrafted, bonusRuneQuantity);
            }
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
        this.game.stats.Runecrafting.inc(RunecraftingStats.Actions);
        this.game.stats.Runecrafting.add(RunecraftingStats.TimeSpent, this.currentActionInterval);
        this.renderQueue.recipeInfo = true;
        this.renderQueue.quantities = true;
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.runecraftingRecipes[oldActionID];
    }
    setFromOldOffline(offline, idMap) {
        const recipe = this.actions.getObjectByID(idMap.runecraftingOldOffline[offline.action]);
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
        this.elementalRunes.forEach((rune) => obtainable.add(rune));
        this.comboRunes.forEach((rune) => obtainable.add(rune));
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
class RunecraftingRecipe extends SingleProductArtisanSkillRecipe {
    constructor(namespace, data, game, skill) {
        super(namespace, data, game, skill);
        this.subcategories = [];
        try {
            if (data.subcategories !== undefined)
                this.subcategories = skill.subcategories.getArrayFromIds(data.subcategories);
            const autoSubcategory = skill.getRecipeAutoSubcategory(this);
            if (autoSubcategory !== undefined)
                this.subcategories.push(autoSubcategory);
        } catch (e) {
            throw new DataConstructionError(RunecraftingRecipe.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            if (data.subcategories !== undefined) {
                if (data.subcategories.remove !== undefined) {
                    const removals = data.subcategories.remove;
                    this.subcategories = this.subcategories.filter((subcat) => !removals.includes(subcat.id));
                }
                if (data.subcategories.add !== undefined) {
                    this.subcategories.push(...game.runecrafting.subcategories.getArrayFromIds(data.subcategories.add));
                }
            }
        } catch (e) {
            throw new DataModificationError(RunecraftingRecipe.name, e, this.id);
        }
    }
}
//# sourceMappingURL=runecrafting.js.map
checkFileVersion('?12097')