"use strict";
class HerbloreRecipe extends CategorizedArtisanRecipe {
    constructor(namespace, data, game, skill) {
        super(namespace, data, game, skill);
        this.skill = skill;
        try {
            this._name = data.name;
            if (data.potionIDs.length !== 4)
                throw new Error(`Incorrect number of potions defined. Expected 4, but got ${data.potionIDs.length}`);
            this.potions = game.items.potions.getArrayFromIds(data.potionIDs);
            this.potions.forEach((item) => (item.recipe = this));
        } catch (e) {
            throw new DataConstructionError(HerbloreRecipe.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`POTION_NAME_${this.localID}`);
        }
    }
    get media() {
        return this.potions[this.skill.getPotionTier(this)].media;
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            if (data.potionIDs !== undefined) {
                this.potions.forEach((item) => (item.recipe = undefined));
                if (data.potionIDs.length !== 4)
                    throw new Error(`Incorrect number of potions defined. Expected 4, but got ${data.potionIDs.length}`);
                this.potions = game.items.potions.getArrayFromIds(data.potionIDs);
                this.potions.forEach((item) => (item.recipe = this));
            }
        } catch (e) {
            throw new DataModificationError(HerbloreRecipe.name, e, this.id);
        }
    }
}
class Herblore extends ArtisanSkill {
    constructor(namespace, game) {
        super(namespace, 'Herblore', game, HerbloreRecipe.name);
        this._media = "assets/media/skills/herblore/herblore.png" /* Assets.Herblore */ ;
        this.baseInterval = 2000;
        this.selectionTabs = herbloreSelectionTabs;
        this.renderQueue = new ArtisanSkillRenderQueue();
        this.potionToRecipeMap = new Map();
        this.categories = new NamespaceRegistry(game.registeredNamespaces, 'HerbloreCategory');
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    get menu() {
        return herbloreArtisanMenu;
    }
    get categoryMenu() {
        return herbloreCategoryMenu;
    }
    get noCostsMessage() {
        return getLangString('TOASTS_MATERIALS_REQUIRED_TO_BREW');
    }
    get actionItem() {
        return this.activeRecipe.potions[this.getPotionTier(this.activeRecipe)];
    }
    get unmodifiedActionQuantity() {
        return 1;
    }
    get activeRecipe() {
        if (this.selectedRecipe === undefined)
            throw new Error('Tried to get active recipe, but none is selected.');
        return this.selectedRecipe;
    }
    get masteryModifiedInterval() {
        return 1700;
    }
    registerData(namespace, data) {
        var _a, _b;
        (_a = data.categories) === null || _a === void 0 ? void 0 : _a.forEach((categoryData) => {
            this.categories.registerObject(new SkillCategory(namespace, categoryData, this, this.game));
        });
        (_b = data.recipes) === null || _b === void 0 ? void 0 : _b.forEach((recipeData) => {
            this.actions.registerObject(new HerbloreRecipe(namespace, recipeData, this.game, this));
        });
        super.registerData(namespace, data);
    }
    modifyData(data) {
        var _a;
        super.modifyData(data);
        (_a = data.recipes) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const recipe = this.actions.getObjectByID(modData.id);
            if (recipe === undefined)
                throw new UnregisteredDataModError(HerbloreRecipe.name, modData.id);
            recipe.applyDataModification(modData, this.game);
        });
    }
    postDataRegistration() {
        super.postDataRegistration();
        const itemUpgrades = [];
        this.actions.forEach((recipe) => {
            recipe.potions.forEach((potion) => this.potionToRecipeMap.set(potion, recipe));
            for (let i = 0; i < 3; i++) {
                itemUpgrades.push({
                    upgradedItemID: recipe.potions[i + 1].id,
                    itemCosts: [{
                        id: recipe.potions[i].id,
                        quantity: 3,
                    }, ],
                    rootItemIDs: [recipe.potions[i].id],
                    isDowngrade: false,
                });
            }
        });
        this.game.bank.registerItemUpgrades(itemUpgrades);
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
    /** Returns the recipe for a given potion. If none exists, returns undefined instead. */
    getRecipeForPotion(potion) {
        return this.potionToRecipeMap.get(potion);
    }
    getPotionTier(recipe) {
        const masteryLevel = this.getMasteryLevel(recipe);
        for (let i = Herblore.tierMasteryLevels.length - 1; i >= 0; i--) {
            if (masteryLevel >= Herblore.tierMasteryLevels[i])
                return i;
        }
        return 0;
    }
    resetToDefaultSelectedRecipeBasedOnRealm() {
        super.resetToDefaultSelectedRecipeBasedOnRealm();
        if (this.selectedRecipe !== undefined)
            switchToCategory(herbloreSelectionTabs)(this.selectedRecipe.category);
    }
    updateRealmSelection() {
        herbloreCategoryMenu.setCurrentRealm(this.currentRealm);
        herbloreCategoryMenu.addOptions(game.herblore.categories.allObjects, getLangString('MENU_TEXT_SELECT_HERBLORE_CATEGORY'), switchToCategory(herbloreSelectionTabs));
    }
    onMasteryLevelUp(action, oldLevel, newLevel) {
        super.onMasteryLevelUp(action, oldLevel, newLevel);
        if (this.selectedRecipe === action) {
            this.renderQueue.selectedRecipe = true;
            this.renderQueue.selectionTabs = true;
        }
    }
    recordCostPreservationStats(costs) {
        super.recordCostPreservationStats(costs);
        costs.recordBulkItemStat(this.game.stats.Herblore, HerbloreStats.ItemsPreserved);
    }
    recordCostConsumptionStats(costs) {
        super.recordCostConsumptionStats(costs);
        costs.recordBulkItemStat(this.game.stats.Herblore, HerbloreStats.ItemsUsed);
    }
    getActionModifierQueryParams(action) {
        const scope = super.getActionModifierQueryParams(action);
        if (action instanceof HerbloreRecipe) {
            scope.category = action.category;
        }
        return scope;
    }
    preAction() {}
    get actionRewards() {
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
        const randomHerblorePotionChance = this.game.modifiers.getValue("melvorD:randomHerblorePotionChance" /* ModifierIDs.randomHerblorePotionChance */ , query);
        if (rollPercentage(randomHerblorePotionChance)) {
            const randomPotion = getRandomArrayElement(recipe.potions);
            rewards.addItem(randomPotion, potionQuantity);
            this.game.stats.Herblore.add(HerbloreStats.PotionsMade, potionQuantity);
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
        this.game.stats.Herblore.inc(HerbloreStats.Actions);
        this.game.stats.Herblore.add(HerbloreStats.TimeSpent, this.currentActionInterval);
        this.renderQueue.recipeInfo = true;
        this.renderQueue.quantities = true;
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.herbloreRecipes[oldActionID];
    }
    setFromOldOffline(offline, idMap) {
        const recipe = this.actions.getObjectByID(idMap.herbloreRecipes[offline.action]);
        if (recipe !== undefined) {
            this.selectRecipeOnClick(recipe);
            this.createButtonOnClick();
        }
    }
    testTranslations() {
        super.testTranslations();
        this.actions.forEach((action) => {
            action.name;
        });
        this.categories.forEach((category) => {
            category.name;
        });
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        this.actions.forEach((action) => {
            action.potions.forEach((item) => obtainable.add(item));
        });
        return obtainable;
    }
    getRegistry(type) {
        switch (type) {
            case ScopeSourceType.Category:
                return this.categories;
            case ScopeSourceType.Action:
                return this.actions;
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
            }
        }
    }
}
/** Mastery levels required to craft a tier of potion */
Herblore.tierMasteryLevels = [1, 20, 50, 90];
//# sourceMappingURL=herblore.js.map
checkFileVersion('?12097')