"use strict";
class CookingRecipe extends SingleProductArtisanSkillRecipe {
    constructor(namespace, data, game, cooking) {
        super(namespace, data, game, cooking);
        this.hasMastery = true;
        this.discoveredItems = [];
        try {
            this.perfectItem = game.items.getObjectSafe(data.perfectCookID);
            this.baseInterval = data.baseInterval;
            if (data.subcategoryID !== undefined)
                this.subcategory = cooking.subcategories.getObjectSafe(data.subcategoryID);
            if (data.noMastery)
                this.hasMastery = false;
            if (data.discoveredItems !== undefined) {
                this.discoveredItems = game.items.getArrayFromIds(data.discoveredItems);
            }
        } catch (e) {
            throw new DataConstructionError(CookingRecipe.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            if (data.perfectCookID !== undefined)
                this.perfectItem = game.items.getObjectSafe(data.perfectCookID);
            if (data.baseInterval !== undefined)
                this.baseInterval = data.baseInterval;
            if (data.subcategoryID !== undefined)
                this.subcategory = game.cooking.subcategories.getObjectSafe(data.subcategoryID);
        } catch (e) {
            throw new DataModificationError(CookingRecipe.name, e, this.id);
        }
    }
}
class CookingCategory extends SkillCategory {
    constructor(namespace, data, game, skill) {
        super(namespace, data, skill, game);
        this.game = game;
        this.skill = skill;
        try {
            this._modifierName = data.modifierName;
            if (data.modifierNameLang !== undefined)
                this._modifierNameLang = data.modifierNameLang;
            this.shopUpgrades = game.shop.purchases.getArrayFromIds(data.shopUpgradeIDs);
            this.upgradeRequired = data.upgradeRequired;
        } catch (e) {
            throw new DataConstructionError(CookingCategory.name, e, this.id);
        }
    }
    get media() {
        const upgrade = this.highestUpgrade;
        if (upgrade === undefined)
            return super.media;
        return upgrade.media;
    }
    get name() {
        if (this._modifierNameLang !== undefined)
            return getLangString(this._modifierNameLang);
        return this._modifierName;
    }
    get upgradeName() {
        const upgrade = this.highestUpgrade;
        if (upgrade === undefined)
            return super.name;
        return upgrade.name;
    }
    get upgradeOwned() {
        return this.highestUpgrade !== undefined;
    }
    get highestUpgrade() {
        return this.shopUpgrades.find((upgrade) => {
            return this.game.shop.isUpgradePurchased(upgrade);
        });
    }
    applyDataModification(modData, game) {
        modData.shopUpgradeIDs.forEach((id) => {
            const upgrade = game.shop.purchases.getObjectByID(id);
            if (upgrade === undefined)
                throw new UnregisteredApplyDataModError(this, ShopPurchase.name, id);
            this.shopUpgrades.unshift(upgrade);
        });
    }
}
class Cooking extends CraftingSkill {
    constructor(namespace, game) {
        super(namespace, 'Cooking', game, CookingRecipe.name);
        this._media = "assets/media/skills/cooking/cooking.png" /* Assets.Cooking */ ;
        this.renderQueue = new CookingRenderQueue();
        /** Recipes that are selected at each cooking station */
        this.selectedRecipes = new Map();
        /** Passive cooking timers */
        this.passiveCookTimers = new Map();
        /** Stockpiled items from passive Cooking */
        this.stockpileItems = new Map();
        /** Map of products/perfect items to recipes. Utilized for food healing mastery bonuses. */
        this.productRecipeMap = new Map();
        this.ingredientRecipeMap = new Map();
        this.categories = new NamespaceRegistry(game.registeredNamespaces, CookingCategory.name);
        this.subcategories = new NamespaceRegistry(game.registeredNamespaces, 'CookingSubcategory');
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    computeTotalMasteryActions() {
        this.actions.namespaceMaps.forEach((actionMap, namespace) => {
            let total = 0;
            actionMap.forEach((action) => {
                if (action.hasMastery) {
                    if (!action.realm.ignoreCompletion)
                        total++;
                    this.totalMasteryActionsInRealm.inc(action.realm);
                }
            });
            this.totalMasteryActions.set(namespace, total);
        });
    }
    isMasteryActionUnlocked(action) {
        return action.hasMastery && this.isBasicSkillRecipeUnlocked(action);
    }
    get actionInterval() {
        return this.getRecipeCookingInterval(this.activeRecipe);
    }
    get actionLevel() {
        return this.activeRecipe.level;
    }
    get masteryAction() {
        return this.activeRecipe;
    }
    get masteryModifiedInterval() {
        return this.getRecipeMasteryModifiedInterval(this.activeRecipe);
    }
    get activeRecipe() {
        if (this.activeCookingCategory === undefined)
            throw new Error(`Tried to get active recipe, but no category is active.`);
        const recipe = this.selectedRecipes.get(this.activeCookingCategory);
        if (recipe === undefined)
            throw new Error('Tried to access active recipe, but none is selected in the active category');
        return recipe;
    }
    get noCostsMessage() {
        return getLangString('MISC_STRING_COOKING_2');
    }
    get noPassiveCostsMessage() {
        return getLangString('TOASTS_PASSIVE_COOK_ITEMS_REQUIRED');
    }
    canStopPassiveCooking(category) {
        return this.passiveCookTimers.has(category) && !this.game.isGolbinRaid;
    }
    registerData(namespace, data) {
        var _a, _b, _c;
        (_a = data.categories) === null || _a === void 0 ? void 0 : _a.forEach((categoryData) => {
            this.categories.registerObject(new CookingCategory(namespace, categoryData, this.game, this));
        });
        (_b = data.subcategories) === null || _b === void 0 ? void 0 : _b.forEach((subcategoryData) => {
            this.subcategories.registerObject(new SkillSubcategory(namespace, subcategoryData));
        });
        (_c = data.recipes) === null || _c === void 0 ? void 0 : _c.forEach((recipe) => {
            this.actions.registerObject(new CookingRecipe(namespace, recipe, this.game, this));
        });
        super.registerData(namespace, data);
    }
    modifyData(data) {
        var _a, _b;
        super.modifyData(data);
        (_a = data.categories) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const category = this.categories.getObjectByID(modData.id);
            if (category === undefined)
                throw new UnregisteredDataModError(CookingCategory.name, modData.id);
            category.applyDataModification(modData, this.game);
        });
        (_b = data.recipes) === null || _b === void 0 ? void 0 : _b.forEach((modData) => {
            const recipe = this.actions.getObjectByID(modData.id);
            if (recipe === undefined)
                throw new UnregisteredDataModError(CookingRecipe.name, modData.id);
            recipe.applyDataModification(modData, this.game);
        });
    }
    postDataRegistration() {
        super.postDataRegistration();
        const downgradeData = [];
        this.actions.forEach((recipe) => {
            // Create Recipe mappings
            this.productRecipeMap.set(recipe.product, recipe);
            this.productRecipeMap.set(recipe.perfectItem, recipe);
            if (recipe.itemCosts.length === 1)
                this.ingredientRecipeMap.set(recipe.itemCosts[0].item, recipe);
            if (recipe.hasMastery) {
                this.sortedMasteryActions.push(recipe);
                if (recipe.abyssalLevel > 0)
                    this.abyssalMilestones.push(recipe);
                else
                    this.milestones.push(recipe);
            }
            // Generate Perfect Item Downgrades
            downgradeData.push({
                itemCosts: [{
                    id: recipe.perfectItem.id,
                    quantity: 1
                }],
                rootItemIDs: [recipe.perfectItem.id],
                upgradedItemID: recipe.product.id,
                isDowngrade: true,
            });
        });
        this.game.bank.registerItemUpgrades(downgradeData);
        // Set up sorted mastery
        this.sortedMasteryActions = sortRecipesByCategoryAndLevel(this.sortedMasteryActions, this.categories.allObjects);
        this.sortMilestones();
    }
    getIngredientCookedVersion(item) {
        var _a;
        return (_a = this.ingredientRecipeMap.get(item)) === null || _a === void 0 ? void 0 : _a.product;
    }
    activeTick() {
        // Override to allow passive cooking to tick
        super.activeTick();
        this.passiveCookTimers.forEach((timer) => {
            timer.tick();
        });
    }
    getStockpileSnapshot() {
        const snapshot = new Map();
        this.stockpileItems.forEach((items, category) => {
            snapshot.set(category, {
                item: items.item,
                quantity: items.quantity
            });
        });
        return snapshot;
    }
    getActionForFood(foodItem) {
        return this.productRecipeMap.get(foodItem);
    }
    getRecipeMasteryModifiedInterval(recipe) {
        return recipe.baseInterval * 0.85;
    }
    /** Gets the interval for performing a normal cook with a recipe */
    getRecipeCookingInterval(recipe) {
        return this.modifyInterval(recipe.baseInterval, recipe);
    }
    getPassiveIntervalSources(recipe) {
        const builder = new ModifierSourceBuilder(this.game.modifiers, true);
        builder.addSources("melvorD:passiveCookingInterval" /* ModifierIDs.passiveCookingInterval */ , this.getActionModifierQuery(recipe));
        return builder.getSpans();
    }
    /** Gets the interval for performing a passive cook with a recipe */
    getRecipePassiveCookingInterval(recipe) {
        const modifier = this.game.modifiers.getValue("melvorD:passiveCookingInterval" /* ModifierIDs.passiveCookingInterval */ , this.getActionModifierQuery(recipe));
        const interval = roundToTickInterval(this.getRecipeCookingInterval(recipe) * 5 * (1 + modifier / 100));
        return Math.max(interval, 250);
    }
    getRecipeSuccessChance(recipe) {
        let chance = Cooking.baseSuccessChance;
        chance += this.game.modifiers.getValue("melvorD:successfulCookChance" /* ModifierIDs.successfulCookChance */ , this.getActionModifierQuery(recipe));
        let chanceCap = 100;
        chanceCap += this.game.modifiers.cookingSuccessCap;
        return clampValue(chance, 0, chanceCap);
    }
    getRecipeSuccessChanceSources(recipe) {
        const builder = new ModifierSourceBuilder(this.game.modifiers, true);
        builder.addBaseSource(getLangString('COOKING_BASE_CHANCE'), Cooking.baseSuccessChance);
        builder.addSources("melvorD:successfulCookChance" /* ModifierIDs.successfulCookChance */ , this.getActionModifierQuery(recipe));
        return builder.getSpans();
    }
    // TODO: Change the cooking mastery text to not have the 99% cap message;
    getRecipePerfectChance(recipe) {
        if (!this.game.settings.enablePerfectCooking)
            return 0;
        const chance = this.game.modifiers.getValue("melvorD:perfectCookChance" /* ModifierIDs.perfectCookChance */ , this.getActionModifierQuery(recipe));
        return clampValue(chance, 0, 100);
    }
    getRecipePerfectChanceSources(recipe) {
        if (!this.game.settings.enablePerfectCooking)
            return [];
        const builder = new ModifierSourceBuilder(this.game.modifiers, true);
        builder.addSources("melvorD:perfectCookChance" /* ModifierIDs.perfectCookChance */ , this.getActionModifierQuery(recipe));
        return builder.getSpans();
    }
    getRecipeCosts(recipe) {
        const costs = new Costs(this.game);
        costs.setSource(`Skill.${this.id}.Recipe.${recipe.id}`);
        recipe.itemCosts.forEach(({
            item,
            quantity
        }) => {
            quantity = this.modifyItemCost(item, quantity, recipe);
            if (quantity > 0)
                costs.addItem(item, quantity);
        });
        recipe.currencyCosts.forEach(({
            currency,
            quantity
        }) => {
            quantity = this.modifyCurrencyCost(currency, quantity, recipe);
            costs.addCurrency(currency, quantity);
        });
        return costs;
    }
    getCurrentRecipeCosts() {
        return this.getRecipeCosts(this.activeRecipe);
    }
    getRandomFlatAdditionalPrimaryProductQuantity(item, action, query) {
        let quantity = super.getRandomFlatAdditionalPrimaryProductQuantity(item, action, query);
        if (action instanceof CookingRecipe &&
            item === action.perfectItem &&
            rollPercentage(this.game.modifiers.additionalPerfectItemChance)) {
            quantity++;
        }
        return quantity;
    }
    recordCostConsumptionStats(costs) {
        super.recordCostConsumptionStats(costs);
        costs.recordBulkItemStat(this.game.stats.Cooking, CookingsStats.ItemsUsed);
    }
    recordCostPreservationStats(costs) {
        super.recordCostPreservationStats(costs);
        costs.recordBulkItemStat(this.game.stats.Cooking, CookingsStats.ItemsPreserved);
    }
    preAction() {}
    get actionRewards() {
        const rewards = new Rewards(this.game);
        rewards.setActionInterval(this.actionInterval);
        const recipe = this.activeRecipe;
        const actionEvent = new CookingActionEvent(this, recipe, recipe.category);
        actionEvent.isPassiveCooking = this.passiveCookTimers.size > 0;
        if (rollPercentage(this.getRecipeSuccessChance(recipe)) ||
            (!this.game.tutorial.complete &&
                recipe.id === "melvorD:Shrimp" /* CookingRecipeIDs.Shrimp */ &&
                this.game.stats.itemFindCount(recipe.product) < 3) // Rigged chances for cooking shrimp during tutorial
        ) {
            // Successful cook
            let product = recipe.product;
            // Perfect Cooking
            if (rollPercentage(this.getRecipePerfectChance(recipe))) {
                product = recipe.perfectItem;
                this.game.stats.Cooking.inc(CookingsStats.PerfectCooks);
            }
            const itemQuantity = this.modifyPrimaryProductQuantity(product, recipe.baseQuantity, recipe);
            // Try to autoequip the food, and add to rewards if it does not
            if (!(this.game.modifiers.autoEquipFoodUnlocked > 0 &&
                    this.game.settings.enableAutoEquipFood &&
                    product instanceof FoodItem &&
                    this.game.combat.player.autoEquipFood(product, itemQuantity))) {
                rewards.addItem(product, itemQuantity);
            }
            this.addCurrencyFromPrimaryProductGain(rewards, product, itemQuantity, recipe);
            actionEvent.productQuantity = itemQuantity;
            rewards.addXP(this, recipe.baseExperience, recipe);
            rewards.addAbyssalXP(this, recipe.baseAbyssalExperience, recipe);
            this.addCommonRewards(rewards, recipe);
            this.game.stats.Cooking.inc(CookingsStats.SuccessfulActions);
            this.game.stats.Cooking.add(CookingsStats.FoodCooked, itemQuantity);
        } else {
            actionEvent.successful = false;
            // Unsuccessful cook, give no rewards unless Pig + Mole synergy is active
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, getLangString('MISC_STRING_COOKING_1'), 'danger'],
            });
            // Pig + Mole Synergy: Give 100 Coal when failing to cook.
            if (this.game.modifiers.flatCoalGainedOnCookingFailure > 0)
                rewards.addItemByID("melvorD:Coal_Ore" /* ItemIDs.Coal_Ore */ , this.game.modifiers.flatCoalGainedOnCookingFailure);
            // Abyssal Pig + Abyssal Mole Synergy: Give random abyssal gems when failing to cook.
            if (this.game.modifiers.flatAbyssalGemsGainedOnCookingFailure > 0)
                rewards.addItem(game.randomAbyssalGemTable.getDrop().item, this.game.modifiers.flatCoalGainedOnCookingFailure);
            this.game.stats.Cooking.inc(CookingsStats.FoodBurnt);
        }
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    postAction() {
        this.game.stats.Cooking.add(CookingsStats.TimeSpent, this.currentActionInterval);
        this.renderQueue.recipeRates = true;
        this.renderQueue.quantities = true;
    }
    addMasteryXPReward() {
        if (this.masteryAction.hasMastery)
            super.addMasteryXPReward();
    }
    /** Starts passive cooking in the selected category */
    startPassiveCooking(category) {
        let timer = this.passiveCookTimers.get(category);
        if (timer === undefined) {
            timer = new Timer('Skill', () => this.passiveCookingAction(category));
            this.passiveCookTimers.set(category, timer);
        }
        const recipe = this.selectedRecipes.get(category);
        if (recipe === undefined)
            throw new Error('Tried to start passive cooking, but no recipe is selected.');
        timer.start(this.getRecipePassiveCookingInterval(recipe));
        this.renderQueue.progressBar = true;
    }
    /** Stops passive cooking in the selected category. Returns true if passive cooking was successfully stopped. */
    stopPassiveCooking(category) {
        if (!this.canStopPassiveCooking(category))
            return false;
        this.passiveCookTimers.delete(category);
        this.renderQueue.progressBar = true;
        return true;
    }
    /** Adds an item to the stockpile for the given category */
    addItemToStockpile(category, item, quantity) {
        let items = this.stockpileItems.get(category);
        if (items === undefined) {
            items = {
                item,
                quantity,
            };
            this.stockpileItems.set(category, items);
        } else if (items.item === item) {
            items.quantity += quantity;
        } else {
            throw new Error("Tried to add item to stockpile but ids don't match.");
        }
        this.renderQueue.stockpile.add(category);
    }
    /** Performs passive cooking for a given category */
    passiveCookingAction(category) {
        const recipe = this.selectedRecipes.get(category);
        if (recipe === undefined)
            throw new Error('Tried to passive cook, but no recipe is selected.');
        const recipeCosts = this.getRecipeCosts(recipe);
        if (!recipeCosts.checkIfOwned()) {
            this.stopPassiveCooking(category);
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, this.noPassiveCostsMessage, 'danger']
            });
            return;
        }
        this.addItemToStockpile(category, recipe.product, recipe.baseQuantity);
        this.game.stats.Cooking.add(CookingsStats.FoodCooked, recipe.baseQuantity);
        recipeCosts.consumeCosts();
        recipeCosts.recordBulkItemStat(this.game.stats.Cooking, CookingsStats.ItemsUsed);
        this.game.stats.Cooking.inc(CookingsStats.PassiveCooks);
        if (recipeCosts.checkIfOwned()) {
            this.startPassiveCooking(category);
        } else {
            this.stopPassiveCooking(category);
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, this.noPassiveCostsMessage, 'danger']
            });
        }
    }
    onStop() {
        this.passiveCookTimers.forEach((_, category) => this.stopPassiveCooking(category));
    }
    /** Callback function for when the active cook button is pressed */
    onActiveCookButtonClick(category) {
        if (this.selectedRecipes.get(category) === undefined)
            return; // Do nothing if no recipe is selected
        const wasActive = this.isActive;
        if (this.isActive && !this.stop())
            return;
        // Start if category is different, or skill wasn't started
        if (!wasActive || category !== this.activeCookingCategory) {
            this.activeCookingCategory = category;
            const costs = this.getCurrentRecipeCosts();
            if (!costs.checkIfOwned()) {
                notifyPlayer(this, this.noCostsMessage, 'danger');
            } else {
                this.start();
            }
        }
    }
    /** Callback function for when the passive cook button is pressed */
    onPassiveCookButtonClick(category) {
        const recipe = this.selectedRecipes.get(category);
        if (recipe === undefined || (this.isActive && this.activeCookingCategory === category))
            return; // Do nothing if this is the active food, or if no recipe is selected
        if (this.passiveCookTimers.has(category)) {
            // Stop passive cooking if we already are cooking that
            this.stopPassiveCooking(category);
            return;
        }
        const stockpileItems = this.stockpileItems.get(category);
        if (!this.isActive)
            notifyPlayer(this, getLangString('MISC_STRING_COOKING_0'), 'danger');
        // Must be active cooking to passive cook
        else if (stockpileItems !== undefined && stockpileItems.item !== recipe.product)
            notifyPlayer(this, getLangString('MISC_STRING_COOKING_3'), 'danger');
        // Must have space in the stockpile
        else if (!this.getRecipeCosts(recipe).checkIfOwned())
            notifyPlayer(this, this.noPassiveCostsMessage, 'danger');
        // Ingredients not owned
        else
            this.startPassiveCooking(category);
    }
    /** Callback function for when the recipe select button is pressed */
    onRecipeSelectionClick(recipe) {
        const category = recipe.category;
        const existingRecipe = this.selectedRecipes.get(category);
        if (this.isActive) {
            if (category === this.activeCookingCategory && recipe !== this.activeRecipe && !this.stop())
                return;
            else if (this.passiveCookTimers.has(category) && recipe !== existingRecipe && !this.stopPassiveCooking(category))
                return;
        }
        this.selectRealm(recipe.realm); //Used to handle default selected realms for popups. Does nothing else in the Skill.
        this.selectedRecipes.set(category, recipe);
        this.renderQueue.selectedRecipes.add(category);
        this.renderQueue.recipeRates = true;
        this.renderQueue.quantities = true;
        this.render();
    }
    /** Callback function for when the recipe selection open button is pressed */
    onRecipeSelectionOpenClick(category, realm) {
        const recipes = this.actions
            .filter((recipe) => {
                if (recipe.product.id === "melvorF:Lemon_Cake" /* ItemIDs.Lemon_Cake */ ) {
                    return (recipe.category === category &&
                        recipe.realm === realm &&
                        recipe.discoveredItems.every((item) => this.game.stats.itemFindCount(item) > 0) &&
                        this.totalCurrentMasteryLevel >= this.trueMaxTotalMasteryLevel);
                } else {
                    return recipe.category === category && recipe.realm === realm;
                }
            })
            .sort((a, b) => a.level - b.level);
        const modalContainer = document.getElementById('modal-recipe-select-content');
        modalContainer.textContent = '';
        if (this.game.settings.useLegacyRealmSelection && this.game.realms.allObjects.length > 1) {
            const realmSelection = new RealmTabSelectElement();
            realmSelection.setOptions(this.getRealmsWithMastery(), (realm) => {
                if (this.currentRealm !== realm)
                    this.selectRealm(realm);
                this.onRecipeSelectionOpenClick(category, realm);
            }, true);
            this.game.realms.forEach((realm) => {
                realmSelection.updateRealmUnlock(realm);
            });
            realmSelection.setSelectedRealm(realm);
            modalContainer.append(realmSelection);
        }
        const rowDiv = createElement('div', {
            className: 'row row-deck'
        });
        modalContainer.append(rowDiv);
        recipes.forEach((recipe) => {
            let recipeElement;
            if (this.level >= recipe.level && (recipe.abyssalLevel === 0 || this.abyssalLevel >= recipe.abyssalLevel)) {
                recipeElement = new CookingRecipeSelectionElement();
            } else {
                recipeElement = new LockedCookingRecipeElement();
            }
            recipeElement.className = 'col-12 col-lg-6 d-flex';
            rowDiv.append(recipeElement);
            recipeElement.setRecipe(recipe, this, this.game);
        });
        $(`#modal-recipe-select`).modal('show');
    }
    /** Callback function for when the collect from stockpile button is pressed */
    onCollectStockpileClick(category) {
        const items = this.stockpileItems.get(category);
        if (items === undefined)
            return;
        const added = this.game.bank.addItem(items.item, items.quantity, false, true, false, true, `Skill.${this.id}`);
        if (added) {
            this.stockpileItems.delete(category);
            this.renderQueue.stockpile.add(category);
            this.render();
        }
    }
    renderModifierChange() {
        super.renderModifierChange();
        const setting = document.getElementById('cooking-food-auto-equip');
        if (setting !== null) {
            if (this.game.modifiers.autoEquipFoodUnlocked) {
                showElement(setting);
            } else {
                hideElement(setting);
            }
        }
    }
    onModifierChange() {
        super.onModifierChange();
        this.categories.forEach((category) => this.renderQueue.selectedRecipes.add(category));
        this.renderQueue.recipeRates = true;
    }
    onEquipmentChange() {}
    onAnyLevelUp() {
        super.onAnyLevelUp();
        // TODO: Update the recipe selections on a level up
    }
    getErrorLog() {
        var _a;
        const selectedRecipeLog = [];
        this.selectedRecipes.forEach((recipe, category) => {
            selectedRecipeLog.push(`${category.id}: ${recipe.id}`);
        });
        const passiveCategories = [];
        this.passiveCookTimers.forEach((timer, category) => {
            passiveCategories.push(category.id);
        });
        const stockPileLog = [];
        this.stockpileItems.forEach(({
            quantity,
            item
        }, category) => {
            stockPileLog.push(`${category.id}: item: ${item.id} qty: ${quantity}`);
        });
        return `${super.getErrorLog()}
Selected Cooking Recipes:
${selectedRecipeLog.join('\n')}
Active Cooking Category: ${(_a = this.activeCookingCategory) === null || _a === void 0 ? void 0 : _a.id}
Passive Cooking Categories: ${passiveCategories.join(',')}
Stockpile Contents:
${stockPileLog.join('\n')}
`;
    }
    initMenus() {
        var _a;
        super.initMenus();
        (_a = this.header) === null || _a === void 0 ? void 0 : _a.appendLower(createElement('settings-checkbox', {
            id: 'cooking-food-auto-equip',
            className: 'font-w400 font-size-sm text-center d-none',
            attributes: [
                ['data-setting-id', 'enableAutoEquipFood']
            ],
        }), createElement('settings-checkbox', {
            id: 'cooking-food-enable-perfect',
            className: 'font-w400 font-size-sm text-center',
            attributes: [
                ['data-setting-id', 'enablePerfectCooking']
            ],
        }));
    }
    onLoad() {
        super.onLoad();
        this.renderQueue.selectedRecipes = new Set(this.categories.allObjects);
        this.renderQueue.recipeRates = true;
        this.renderQueue.quantities = true;
        this.renderQueue.stockpile = new Set(this.categories.allObjects);
        if (this.isActive) {
            this.renderQueue.progressBar = true;
        }
    }
    onPageChange() {
        if (this.game.settings.enablePerfectCooking) {
            $('#cooking-food-enable-perfect').removeClass('d-none');
        }
        this.renderQueue.upgrades = true;
        this.renderQueue.quantities = true;
        super.onPageChange();
    }
    onAncientRelicUnlock() {
        super.onAncientRelicUnlock();
        this.renderQueue.recipeRates = true;
        this.renderQueue.quantities = true;
    }
    queueBankQuantityRender(item) {
        this.renderQueue.quantities = true;
    }
    render() {
        this.renderSelectedRecipes();
        super.render();
        this.renderRecipeRates();
        this.renderRecipeQuantities();
        this.renderProgressBars();
        this.renderStockpile();
        this.renderUpgrades();
    }
    renderSelectedRecipes() {
        if (this.renderQueue.selectedRecipes.size === 0)
            return;
        this.renderQueue.selectedRecipes.forEach((category) => {
            var _a;
            (_a = cookingMenus.get(category)) === null || _a === void 0 ? void 0 : _a.setSelectedRecipe(this.selectedRecipes.get(category), this, this.game);
        });
        this.renderQueue.selectedRecipes.clear();
    }
    renderRecipeRates() {
        if (!this.renderQueue.recipeRates)
            return;
        this.categories.forEach((category) => {
            const menu = cookingMenus.get(category);
            const recipe = this.selectedRecipes.get(category);
            if (recipe !== undefined) {
                const query = this.getActionModifierQuery(recipe);
                menu === null || menu === void 0 ? void 0 : menu.setRecipeRates(recipe, this);
                menu === null || menu === void 0 ? void 0 : menu.setBonusValues({
                    preserve: {
                        value: this.getPreservationChance(recipe),
                        cap: this.getPreservationCap(recipe),
                        sources: this.getPreservationSources(recipe),
                    },
                    double: {
                        value: this.getDoublingChance(recipe),
                        sources: this.getDoublingSources(recipe),
                    },
                    perfect: {
                        value: this.getRecipePerfectChance(recipe),
                        sources: this.getRecipePerfectChanceSources(recipe),
                    },
                    success: {
                        value: this.getRecipeSuccessChance(recipe),
                        sources: this.getRecipeSuccessChanceSources(recipe),
                    },
                }, this.getCostReduction(recipe), this.getCostReductionSources(recipe), this.getFlatAdditionalPrimaryProductQuantity(recipe.product, query), this.getAdditionalPrimaryResourceQuantitySources(query));
            }
        });
        this.renderQueue.recipeRates = false;
    }
    renderRecipeQuantities() {
        if (!this.renderQueue.quantities)
            return;
        this.categories.forEach((category) => {
            const menu = cookingMenus.get(category);
            const recipe = this.selectedRecipes.get(category);
            if (recipe !== undefined) {
                menu === null || menu === void 0 ? void 0 : menu.updateQuantities(recipe, this.game);
            }
        });
        this.renderQueue.quantities = false;
    }
    renderProgressBars() {
        if (!this.renderQueue.progressBar)
            return;
        if (this.isActive) {
            this.categories.forEach((category) => {
                const menu = cookingMenus.get(category);
                if (this.activeCookingCategory === category)
                    menu === null || menu === void 0 ? void 0 : menu.renderActiveProgress(this.actionTimer);
                else if (this.passiveCookTimers.has(category))
                    menu === null || menu === void 0 ? void 0 : menu.setProgressPassive();
                else
                    menu === null || menu === void 0 ? void 0 : menu.stopProgressBar();
            });
        } else {
            cookingMenus.forEach((menu) => menu.stopProgressBar());
        }
        this.renderQueue.progressBar = false;
    }
    renderStockpile() {
        if (this.renderQueue.stockpile.size === 0)
            return;
        this.renderQueue.stockpile.forEach((category) => {
            var _a;
            (_a = cookingMenus.get(category)) === null || _a === void 0 ? void 0 : _a.setStockPile(this.stockpileItems.get(category));
        });
        this.renderQueue.stockpile.clear();
    }
    renderUpgrades() {
        if (!this.renderQueue.upgrades)
            return;
        this.categories.forEach((category) => {
            var _a;
            (_a = cookingMenus.get(category)) === null || _a === void 0 ? void 0 : _a.updateUpgrade(category);
        });
        this.renderQueue.upgrades = false;
    }
    getActionModifierQueryParams(action) {
        const scope = super.getActionModifierQueryParams(action);
        if (action instanceof CookingRecipe) {
            scope.category = action.category;
            scope.subcategory = action.subcategory;
        }
        return scope;
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
    resetActionState() {
        super.resetActionState();
        this.passiveCookTimers.clear();
        this.activeCookingCategory = undefined;
    }
    encode(writer) {
        super.encode(writer);
        writer.writeMap(this.selectedRecipes, writeNamespaced, writeNamespaced);
        writer.writeMap(this.passiveCookTimers, writeNamespaced, writeEncodable);
        writer.writeMap(this.stockpileItems, writeNamespaced, writeItemQuantity);
        if (this.isActive) {
            if (this.activeCookingCategory === undefined)
                throw new Error(`Error saving Cooking data. Skill is active, but has no active category.`);
            writer.writeNamespacedObject(this.activeCookingCategory);
        }
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.selectedRecipes = reader.getMap(readNamespacedReject(this.categories), readNamespacedReject(this.actions));
        this.passiveCookTimers = reader.getMap(readNamespacedReject(this.categories), (reader, category) => {
            if (category === undefined) {
                const timer = new Timer('Skill', () => {});
                timer.decode(reader, version);
                return undefined;
            }
            const timer = new Timer('Skill', () => this.passiveCookingAction(category));
            timer.decode(reader, version);
            return timer;
        });
        this.stockpileItems = reader.getMap(readNamespacedReject(this.categories), (reader) => {
            const item = reader.getNamespacedObject(this.game.items);
            const quantity = reader.getInt32();
            if (typeof item === 'string') {
                if (item.startsWith('melvor')) {
                    this.game.bank.addDummyItemOnLoad(item, quantity);
                }
                return undefined;
            } else {
                return {
                    item,
                    quantity,
                };
            }
        });
        if (this.isActive) {
            const activeCategory = reader.getNamespacedObject(this.categories);
            if (typeof activeCategory === 'string')
                this.shouldResetAction = true;
            else
                this.activeCookingCategory = activeCategory;
        }
        if (this.shouldResetAction)
            this.resetActionState();
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        const getCategory = (id) => {
            const newID = idMap.cookingCategories[id];
            const category = this.categories.getObjectByID(newID);
            return category;
        };
        const getRecipe = (id) => {
            const recipe = this.actions.getObjectByID(idMap.cookingRecipes[id]);
            return recipe;
        };
        const numSelectedRecipes = reader.getNumber();
        for (let i = 0; i < numSelectedRecipes; i++) {
            const category = getCategory(reader.getNumber());
            const recipe = getRecipe(reader.getNumber());
            if (category !== undefined && recipe !== undefined)
                this.selectedRecipes.set(category, recipe);
        }
        const numPassiveTimers = reader.getNumber();
        for (let i = 0; i < numPassiveTimers; i++) {
            const category = getCategory(reader.getNumber());
            if (category === undefined) {
                const dummyTimer = new Timer('Skill', () => {});
                dummyTimer.deserialize(reader.getChunk(3), version);
            } else {
                const timer = new Timer('Skill', () => this.passiveCookingAction(category));
                timer.deserialize(reader.getChunk(3), version);
                this.passiveCookTimers.set(category, timer);
            }
        }
        const numStockpileItems = reader.getNumber();
        for (let i = 0; i < numStockpileItems; i++) {
            const category = getCategory(reader.getNumber());
            const itemID = idMap.items[reader.getNumber()];
            const item = this.game.items.getObjectByID(itemID);
            const quantity = reader.getNumber();
            if (item === undefined)
                this.game.bank.addDummyItemOnLoad(itemID, quantity);
            else if (category !== undefined)
                this.stockpileItems.set(category, {
                    item,
                    quantity
                });
        }
        const activeCategoryID = reader.getNumber();
        if (this.isActive) {
            this.activeCookingCategory = getCategory(activeCategoryID);
            if (this.activeCookingCategory === undefined)
                this.shouldResetAction = true;
        }
        if (this.shouldResetAction)
            this.resetActionState();
    }
    convertFromOldFormat(savegame, idMap) {
        if (savegame.cookingStockpiles !== undefined) {
            savegame.cookingStockpiles.forEach(({
                itemID,
                qty
            }, categoryID) => {
                if (itemID === -1)
                    return;
                const newID = idMap.items[itemID];
                const item = this.game.items.getObjectByID(newID);
                const category = this.categories.getObjectByID(idMap.cookingCategories[categoryID]);
                if (item === undefined)
                    this.game.bank.addDummyItemOnLoad(newID, qty);
                else if (category !== undefined)
                    this.stockpileItems.set(category, {
                        item,
                        quantity: qty
                    });
            });
        }
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.cookingRecipes[oldActionID];
    }
    setFromOldOffline(offline, idMap) {
        if (typeof offline.action === 'number') {
            const item = this.game.getItemFromOldID(offline.action, idMap);
            if (item === undefined)
                return;
            const recipe = this.ingredientRecipeMap.get(item);
            if (recipe !== undefined) {
                this.onRecipeSelectionClick(recipe);
                this.onActiveCookButtonClick(recipe.category);
            }
        } else {
            const productItem = this.game.getItemFromOldID(offline.action.active, idMap);
            if (productItem === undefined)
                return;
            const activeRecipe = this.productRecipeMap.get(productItem);
            const passiveRecipes = offline.action.passive.map((itemID) => {
                const productItem = this.game.getItemFromOldID(itemID, idMap);
                if (productItem === undefined)
                    return undefined;
                return this.productRecipeMap.get(productItem);
            });
            if (activeRecipe !== undefined) {
                this.onRecipeSelectionClick(activeRecipe);
                this.onActiveCookButtonClick(activeRecipe.category);
            }
            passiveRecipes.forEach((passiveRecipe) => {
                if (passiveRecipe !== undefined) {
                    this.onRecipeSelectionClick(passiveRecipe);
                    this.onPassiveCookButtonClick(passiveRecipe.category);
                }
            });
        }
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        this.actions.forEach((action) => {
            obtainable.add(action.product);
            obtainable.add(action.perfectItem);
        });
        // Excluded Coal
        return obtainable;
    }
}
Cooking.baseSuccessChance = 70;
class CookingRenderQueue extends GatheringSkillRenderQueue {
    constructor() {
        super(...arguments);
        /** Renders the recipes selected in the given categories */
        this.selectedRecipes = new Set();
        /** Updates the rates of all selected recipes, including HP gain */
        this.recipeRates = false;
        /** Updates the quantity icons of all selected recipes */
        this.quantities = false;
        /** Updates ths stockpile for the given categories */
        this.stockpile = new Set();
        /** Updates the purchased upgrades for each category */
        this.upgrades = false;
    }
}
//# sourceMappingURL=cooking.js.map
checkFileVersion('?12097')