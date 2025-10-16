"use strict";
class FarmingRecipe extends SingleProductRecipe {
    constructor(namespace, data, skill, game) {
        super(namespace, data, game);
        this.baseQuantity = 5;
        try {
            this.baseInterval = data.baseInterval;
            this.category = skill.categories.getObjectSafe(data.categoryID);
            this.seedCost = game.items.getQuantity(data.seedCost);
            this._grownName = data.grownName;
            this._grownMedia = data.grownMedia;
            this._grownNameLang = data.grownNameLang;
            if (data.baseQuantity !== undefined)
                this.baseQuantity = data.baseQuantity;
        } catch (e) {
            throw new DataConstructionError(FarmingRecipe.name, e, this.id);
        }
    }
    get name() {
        if (this._grownNameLang !== undefined) {
            return getLangString(this._grownNameLang);
        } else if (this._grownName !== undefined) {
            return this._grownName;
        } else {
            return super.name;
        }
    }
    get media() {
        if (this._grownMedia !== undefined) {
            return this.getMediaURL(this._grownMedia);
        } else {
            return super.media;
        }
    }
}
class FarmingCategory extends SkillCategory {
    constructor(namespace, data, skill, game) {
        super(namespace, data, skill, game);
        this.returnSeeds = data.returnSeeds;
        this.scaleXPWithQuantity = data.scaleXPWithQuantity;
        this.harvestMultiplier = data.harvestMultiplier;
        this.masteryXPDivider = data.masteryXPDivider;
        this.giveXPOnPlant = data.giveXPOnPlant;
        this._singularName = data.singularName;
        this._description = data.description;
        this._seedNotice = data.seedNotice;
    }
    get singularName() {
        if (this.isModded) {
            return this._singularName;
        } else {
            return getLangString(`SKILL_CATEGORY_${this.skill.localID}_${this.localID}_singular`);
        }
    }
    get description() {
        if (this.isModded) {
            return this._description;
        } else {
            return getLangString(`SKILL_CATEGORY_${this.skill.localID}_${this.localID}_description`);
        }
    }
    get seedNotice() {
        if (this.isModded) {
            return this._seedNotice;
        } else {
            return getLangString(`SKILL_CATEGORY_${this.skill.localID}_${this.localID}_seedNotice`);
        }
    }
}
class FarmingPlot extends NamespacedObject {
    constructor(namespace, data, farming) {
        super(namespace, data.id);
        this.farming = farming;
        this.currencyCosts = [];
        this.itemCosts = [];
        /** Current state of the crop growing in the plot */
        this.state = 1 /* FarmingPlotState.Empty */ ;
        /** Current compost level. Ranges from 0-100 */
        this.compostLevel = 0;
        /** Growth time of plot in seconds */
        this.growthTime = 0;
        this.abyssalLevel = 0;
        try {
            this.category = farming.categories.getObjectSafe(data.categoryID);
            this.level = data.level;
            if (data.currencyCosts !== undefined)
                this.currencyCosts.push(...game.getCurrencyQuantities(data.currencyCosts));
            // TODO_D - deprecated property support
            if (data.gpCost)
                this.currencyCosts.push({
                    currency: game.gp,
                    quantity: data.gpCost
                });
            if (data.itemCosts !== undefined)
                this.itemCosts.push(...game.items.getQuantities(data.itemCosts));
            if (data.abyssalLevel !== undefined)
                this.abyssalLevel = data.abyssalLevel;
            this.state =
                this.currencyCosts.length === 0 && this.itemCosts.length === 0 && this.level === 1 ?
                1 /* FarmingPlotState.Empty */ :
                0 /* FarmingPlotState.Locked */ ;
        } catch (e) {
            throw new DataConstructionError(FarmingPlot.name, e, this.id);
        }
    }
    encode(writer) {
        writer.writeUint8(this.state);
        writer.writeBoolean(this.plantedRecipe !== undefined);
        if (this.plantedRecipe !== undefined)
            writer.writeNamespacedObject(this.plantedRecipe);
        writer.writeBoolean(this.compostItem !== undefined);
        if (this.compostItem !== undefined)
            writer.writeNamespacedObject(this.compostItem);
        writer.writeUint8(this.compostLevel);
        writer.writeBoolean(this.selectedRecipe !== undefined);
        if (this.selectedRecipe !== undefined)
            writer.writeNamespacedObject(this.selectedRecipe);
        writer.writeFloat64(this.growthTime);
        return writer;
    }
    decode(reader, version) {
        this.state = reader.getUint8();
        let resetPlanted = false;
        let resetCompost = false;
        if (reader.getBoolean()) {
            const planted = reader.getNamespacedObject(this.farming.actions);
            if (typeof planted === 'string') {
                resetPlanted = true;
            } else
                this.plantedRecipe = planted;
        }
        if (reader.getBoolean()) {
            const compost = reader.getNamespacedObject(this.farming.composts);
            if (typeof compost === 'string') {
                resetCompost = true;
            } else
                this.compostItem = compost;
        }
        this.compostLevel = reader.getUint8();
        if (reader.getBoolean()) {
            const selected = reader.getNamespacedObject(this.farming.actions);
            if (typeof selected === 'string' || selected.category !== this.category) {
                this.selectedRecipe = this.farming.actions.find((recipe) => recipe.category === this.category);
            } else
                this.selectedRecipe = selected;
        }
        this.growthTime = reader.getFloat64();
        if (resetPlanted || (this.state === 3 /* FarmingPlotState.Grown */ && this.plantedRecipe === undefined)) {
            this.state = 1 /* FarmingPlotState.Empty */ ;
            this.growthTime = 0;
        }
        if (resetCompost) {
            this.compostLevel = 0;
        }
    }
}
class DummyFarmingPlot extends FarmingPlot {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            categoryID: "melvorD:Allotment" /* FarmingCategoryIDs.Allotment */ ,
            level: 1,
            itemCosts: []
        }, game.farming);
    }
    decode(reader, version) {
        super.decode(reader, version);
    }
}
class FarmingRenderQueue extends MasterySkillRenderQueue {
    constructor() {
        super(...arguments);
        this.growthTime = new Set();
        this.growthState = new Set();
        this.compost = new Set();
        this.growthChance = new Set();
        this.selectedSeed = new Set();
        this.grants = new Set();
        this.growthIndicators = false;
        this.compostQuantity = false;
        /** Updates which plots should be shown based on currently selected category */
        this.plotVisibility = false;
        /** Updates the unlock cost quantities */
        this.plotUnlockQuantities = false;
    }
}
class FarmingGrowthTimer extends Timer {
    constructor(plots, farming) {
        super('Skill', () => farming.growPlots(this));
        this.plots = plots;
        this.farming = farming;
    }
    encode(writer) {
        super.encode(writer);
        writer.writeArray(this.plots, writeNamespaced);
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.plots = reader.getArray(readNamespacedReject(this.farming.plots));
    }
}
class Farming extends SkillWithMastery {
    constructor(namespace, game) {
        super(namespace, 'Farming', game, FarmingRecipe.name);
        this._media = "assets/media/skills/farming/farming.png" /* Assets.Farming */ ;
        /** Map of herb seeds to herb items */
        this.herbSeedToProductMap = new Map();
        /** Map of category to recipes in that category, sorted by level requirement */
        this.categoryRecipeMap = new Map();
        this.categoryPlotMap = new Map();
        /** Save State Property */
        this.growthTimers = new Set();
        /** Maps farming plots to growth timers */
        this.growthTimerMap = new Map();
        this.renderQueue = new FarmingRenderQueue();
        /** Temporarily stores the bonus to harvest quantity from compost so it gets included in modifier calculations */
        this.tempCompostQuantityModifier = 0;
        this.categories = new NamespaceRegistry(game.registeredNamespaces, FarmingCategory.name);
        this.plots = new NamespaceRegistry(game.registeredNamespaces, FarmingPlot.name);
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    get isPotionActive() {
        return this.game.potions.isPotionActiveForAction(this);
    }
    get activePotion() {
        return this.game.potions.getActivePotionForAction(this);
    }
    get composts() {
        return this.game.items.composts;
    }
    get isAnyPlotGrown() {
        return this.plots.some((plot) => plot.state === 3 /* FarmingPlotState.Grown */ || plot.state === 4 /* FarmingPlotState.Dead */ );
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    initMenus() {
        var _a;
        super.initMenus();
        const compostIconContainer = createElement('div', {
            className: 'row justify-content-center icon-size-32'
        });
        (_a = this.header) === null || _a === void 0 ? void 0 : _a.appendUpper(compostIconContainer);
        this.game.items.composts.forEach((item) => {
            const icon = createElement('item-current-icon', {
                parent: compostIconContainer
            });
            icon.setItem(item, 1, game, true);
            farmingMenus.compostIcons.push(icon);
        });
    }
    onLoad() {
        super.onLoad();
        this.showPlotsInCategory(this.categories.firstObject);
        this.renderQueue.growthIndicators = true;
        this.plots.forEach((plot) => {
            this.renderQueue.grants.add(plot);
        });
    }
    onPageChange() {
        this.renderQueue.compostQuantity = true;
        this.renderQueue.plotUnlockQuantities = true;
        super.onPageChange();
    }
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.renderQueue.plotVisibility = true;
    }
    onAncientRelicUnlock() {
        super.onAncientRelicUnlock();
        this.renderQueue.growthIndicators = true;
    }
    renderModifierChange() {
        this.plots.forEach((plot) => {
            if (plot.plantedRecipe !== undefined) {
                this.renderQueue.growthChance.add(plot);
                this.renderQueue.grants.add(plot);
            }
        });
    }
    getRealmsWithMasteryInCategory(category) {
        const realmsWithMastery = game.farming.getRealmsWithMastery();
        return realmsWithMastery.filter((realm) => {
            return game.farming.actions.some((action) => action.realm === realm && action.category === category);
        });
    }
    queueBankQuantityRender(item) {
        if (item instanceof CompostItem)
            this.renderQueue.compostQuantity = true;
        this.renderQueue.plotUnlockQuantities = true;
    }
    queueCurrencyQuantityRender(currency) {
        if (currency instanceof GP)
            this.renderQueue.plotUnlockQuantities = true;
    }
    getErrorLog() {
        const plotLog = [];
        this.plots.forEach((plot) => {
            var _a, _b, _c;
            plotLog.push(`id: ${plot.id}; state: ${plot.state}; plantedRecipe: ${(_a = plot.plantedRecipe) === null || _a === void 0 ? void 0 : _a.id}; compostItem: ${(_b = plot.compostItem) === null || _b === void 0 ? void 0 : _b.id}; compostLevel: ${plot.compostLevel}; selectedRecipe: ${(_c = plot.selectedRecipe) === null || _c === void 0 ? void 0 : _c.id}; growthTime: ${plot.growthTime};`);
        });
        const timerLog = [];
        this.growthTimers.forEach((timer) => {
            timerLog.push(`plots: ${timer.plots.map((plot) => plot.id).join(',')};`);
        });
        return `== Timer Information ==
${timerLog.join('\n')}
== Plot Information == 
${plotLog.join('\n')}`;
    }
    registerData(namespace, data) {
        var _a, _b, _c;
        (_a = data.categories) === null || _a === void 0 ? void 0 : _a.forEach((categoryData) => {
            this.categories.registerObject(new FarmingCategory(namespace, categoryData, this, this.game));
        });
        (_b = data.recipes) === null || _b === void 0 ? void 0 : _b.forEach((recipeData) => {
            this.actions.registerObject(new FarmingRecipe(namespace, recipeData, this, this.game));
        });
        super.registerData(namespace, data);
        (_c = data.plots) === null || _c === void 0 ? void 0 : _c.forEach((plotData) => {
            this.plots.registerObject(new FarmingPlot(namespace, plotData, this));
        });
    }
    modifyData(data) {
        super.modifyData(data);
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.actions.forEach((recipe) => {
            if (recipe.category.id === "melvorD:Herb" /* FarmingCategoryIDs.Herb */ )
                this.herbSeedToProductMap.set(recipe.seedCost.item, recipe.product);
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
        // Populate category recipe map
        this.categories.forEach((category) => {
            const recipes = this.actions.filter((recipe) => recipe.category === category).sort((a, b) => a.level - b.level);
            this.categoryRecipeMap.set(category, recipes);
            const plots = this.plots.filter((plot) => plot.category === category).sort((a, b) => a.level - b.level);
            this.categoryPlotMap.set(category, plots);
            // Populate selected seed for plots
            plots.forEach((plot) => {
                if (plot.selectedRecipe === undefined)
                    plot.selectedRecipe = recipes[0];
            });
        });
    }
    growPlots(timer) {
        let anyFailed = false;
        let anyGrown = false;
        timer.plots.forEach((plot) => {
            var _a;
            const success = rollPercentage(this.getPlotGrowthChance(plot));
            plot.state = success ? 3 /* FarmingPlotState.Grown */ : 4 /* FarmingPlotState.Dead */ ;
            (_a = this.renderQueue).growthIndicators || (_a.growthIndicators = success);
            this.renderQueue.growthState.add(plot);
            this.growthTimerMap.delete(plot);
            this.game.stats.Farming.add(success ? FarmingStats.TimeSpentWaitingForCrops : FarmingStats.TimeSpentWaitingForDeadCrops, plot.growthTime);
            if (!success)
                this.game.stats.Farming.inc(FarmingStats.CropsDied);
            anyFailed || (anyFailed = !success);
            anyGrown || (anyGrown = success);
        });
        if (anyFailed) {
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, getLangString('TOASTS_CROP_FAILED'), 'danger'],
            });
        }
        if (anyGrown) {
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, getLangString('TOASTS_CROP_READY')],
            });
        }
        this.removeGrowthTimer(timer);
    }
    removeGrowthTimer(timer) {
        this.growthTimers.delete(timer);
        this.renderQueue.growthTime.delete(timer);
    }
    getHerbFromSeed(seedItem) {
        return this.herbSeedToProductMap.get(seedItem);
    }
    getRecipesForCategory(category) {
        var _a;
        return (_a = this.categoryRecipeMap.get(category)) !== null && _a !== void 0 ? _a : [];
    }
    getPlotsForCategory(category) {
        var _a;
        return (_a = this.categoryPlotMap.get(category)) !== null && _a !== void 0 ? _a : [];
    }
    getOwnedRecipeSeeds(recipe) {
        return this.game.bank.getQty(recipe.seedCost.item);
    }
    getRecipeSeedCost(recipe) {
        let quantity = recipe.seedCost.quantity;
        const modQuery = this.getActionModifierQuery(recipe);
        const modifier = this.game.modifiers.getValue("melvorD:farmingSeedCost" /* ModifierIDs.farmingSeedCost */ , modQuery);
        quantity *= 1 + modifier / 100;
        quantity = Math.floor(quantity);
        quantity += this.game.modifiers.getValue("melvorD:flatFarmingSeedCost" /* ModifierIDs.flatFarmingSeedCost */ , modQuery);
        return Math.max(1, quantity);
    }
    getRecipeInterval(recipe) {
        return this.modifyInterval(recipe.baseInterval, recipe);
    }
    /** Returns the chance for a plot to grow */
    getPlotGrowthChance(plot) {
        let chance = 50 + plot.compostLevel / 2;
        const cantDie = this.game.modifiers.getValue("melvorD:farmingCropsCannotDie" /* ModifierIDs.farmingCropsCannotDie */ , this.getActionModifierQuery(plot.plantedRecipe));
        if (cantDie > 0)
            chance = 100;
        return chance;
    }
    getPlotGrowthTime(plot) {
        const timer = this.growthTimerMap.get(plot);
        if (timer === undefined)
            return 0;
        return timer.ticksLeft * TICK_INTERVAL;
    }
    getHarvestAllCost(category) {
        return 2000;
    }
    getPlantAllCost(category) {
        return 5000;
    }
    getActionModifierQueryParams(action) {
        const scope = super.getActionModifierQueryParams(action);
        if (action instanceof FarmingRecipe) {
            scope.category = action.category;
        }
        return scope;
    }
    getBasePrimaryProductQuantityModifier(item, query) {
        let modifier = super.getBasePrimaryProductQuantityModifier(item, query);
        modifier += this.tempCompostQuantityModifier;
        return modifier;
    }
    applyPrimaryProductMultipliers(item, quantity, action, query) {
        quantity = super.applyPrimaryProductMultipliers(item, quantity, action, query);
        if (action instanceof FarmingRecipe)
            quantity *= action.category.harvestMultiplier;
        return quantity;
    }
    harvestPlot(plot) {
        if (plot.state !== 3 /* FarmingPlotState.Grown */ || plot.plantedRecipe === undefined)
            return false;
        const recipe = plot.plantedRecipe;
        const modifierQuery = this.getActionModifierQuery(recipe);
        let disableSeedRefund = false;
        if (plot.compostItem !== undefined) {
            this.tempCompostQuantityModifier = plot.compostItem.harvestBonus;
            disableSeedRefund = plot.compostItem.disableSeedRefund;
        }
        const harvestQuantity = this.modifyPrimaryProductQuantity(recipe.product, recipe.baseQuantity, recipe);
        this.tempCompostQuantityModifier = 0;
        // Attempt to add the items to the bank
        if (!this.game.bank.addItem(recipe.product, harvestQuantity, false, true, false, true, `Skill.${this.id}`))
            return false;
        // Give additional rewards
        const rewards = new Rewards(this.game);
        this.addCurrencyFromPrimaryProductGain(rewards, recipe.product, harvestQuantity, recipe);
        rewards.setActionInterval(plot.growthTime);
        this.rollForPets(plot.growthTime, recipe);
        const maxSeeds = this.game.modifiers.getValue("melvorD:farmingSeedReturn" /* ModifierIDs.farmingSeedReturn */ , modifierQuery);
        if (recipe.category.returnSeeds && maxSeeds > 1 && !disableSeedRefund) {
            const seedQty = Math.round(Math.random() * maxSeeds);
            if (seedQty > 0)
                rewards.addItem(recipe.seedCost.item, seedQty);
        }
        if (recipe.namespace === "melvorItA" /* Namespaces.IntoTheAbyss */ &&
            recipe.category.id === "melvorD:Tree" /* FarmingCategoryIDs.Tree */ &&
            !disableSeedRefund) {
            const chance = this.game.modifiers.regainAbyssalTreeSeedChance;
            if (rollPercentage(chance))
                rewards.addItem(recipe.seedCost.item, 1);
        }
        this.rollForRareDrops(recipe.level, rewards, recipe);
        this.rollForAdditionalItems(rewards, plot.growthTime, recipe);
        this.rollForAncientRelics(recipe.level, recipe.realm);
        this.rollForMasteryTokens(rewards, recipe.realm);
        let xpToAdd = recipe.baseExperience;
        if (recipe.category.scaleXPWithQuantity)
            xpToAdd *= harvestQuantity;
        rewards.addXP(this, xpToAdd, recipe);
        let abyssalXPToAdd = recipe.baseAbyssalExperience;
        if (recipe.category.scaleXPWithQuantity)
            abyssalXPToAdd *= harvestQuantity;
        rewards.addAbyssalXP(this, abyssalXPToAdd, recipe);
        this.addMasteryForAction(recipe, (plot.growthTime * harvestQuantity) / recipe.category.masteryXPDivider);
        rewards.setSource(this.id);
        rewards.giveRewards();
        // Track stats
        switch (recipe.category.id) {
            case "melvorD:Allotment" /* FarmingCategoryIDs.Allotment */ :
                this.game.stats.Farming.inc(FarmingStats.AllotmentsHarvested);
                this.game.stats.Farming.add(FarmingStats.FoodGained, harvestQuantity);
                break;
            case "melvorD:Tree" /* FarmingCategoryIDs.Tree */ :
                this.game.stats.Farming.inc(FarmingStats.TreesHarvested);
                this.game.stats.Farming.add(recipe.product instanceof FoodItem ? FarmingStats.FoodGained : FarmingStats.LogsGained, harvestQuantity);
                break;
            case "melvorD:Herb" /* FarmingCategoryIDs.Herb */ :
                this.game.stats.Farming.inc(FarmingStats.HerbsHarvested);
                this.game.stats.Farming.add(FarmingStats.HerbsGained, harvestQuantity);
                break;
        }
        this.game.stats.Items.add(recipe.seedCost.item, ItemStats.TimesGrown, 1);
        this.game.stats.Items.add(recipe.product, ItemStats.HarvestAmount, harvestQuantity);
        this.game.stats.Items.add(recipe.seedCost.item, ItemStats.TimeWaited, plot.growthTime);
        // Reset the plot state and queue renders
        this.resetPlot(plot);
        const event = new FarmingHarvestActionEvent(this, recipe);
        event.productQuantity = harvestQuantity;
        event.successful = true;
        this._events.emit('harvest', event);
        return true;
    }
    clearDeadPlot(plot) {
        if (plot.state !== 4 /* FarmingPlotState.Dead */ || plot.plantedRecipe === undefined)
            return;
        const event = new FarmingHarvestActionEvent(this, plot.plantedRecipe);
        this.resetPlot(plot);
        event.successful = false;
        this._events.emit('harvest', event);
    }
    resetPlot(plot) {
        const preserveChance = this.game.modifiers.getValue("melvorD:compostPreservationChance" /* ModifierIDs.compostPreservationChance */ , this.getActionModifierQuery(plot.plantedRecipe)) +
            this.game.modifiers.getValue("melvorD:bypassCompostPreservationChance" /* ModifierIDs.bypassCompostPreservationChance */ , this.getActionModifierQuery(plot.plantedRecipe));
        plot.state = 1 /* FarmingPlotState.Empty */ ;
        plot.plantedRecipe = undefined;
        plot.growthTime = 0;
        this.renderQueue.growthState.add(plot);
        this.renderQueue.growthChance.add(plot);
        this.renderQueue.grants.add(plot);
        this.renderQueue.growthIndicators = true;
        // Chance to preserve compost
        if (!rollPercentage(preserveChance)) {
            this.removeCompostFromPlot(plot);
        }
    }
    removeCompostFromPlot(plot) {
        plot.compostItem = undefined;
        plot.compostLevel = 0;
        this.renderQueue.compost.add(plot);
    }
    plantPlot(plot, recipe, isSelected = false) {
        if (plot.state !== 1 /* FarmingPlotState.Empty */ )
            return -1;
        const costs = new Costs(this.game);
        costs.setSource(`Skill.${this.id}.PlantSeed`);
        const seedQuantity = this.getRecipeSeedCost(recipe);
        costs.addItem(recipe.seedCost.item, seedQuantity);
        if (!costs.checkIfOwned()) {
            if (isSelected) {
                this.game.combat.notifications.add({
                    type: 'Player',
                    args: [
                        this,
                        templateLangString('TOASTS_SEED_PLANT_FAILURE', {
                            itemName: recipe.seedCost.item.name
                        }),
                        'danger',
                    ],
                });
            } else {
                this.game.combat.notifications.add({
                    type: 'Player',
                    args: [this, getLangString('TOASTS_NOT_ENOUGH_SEEDS'), 'danger'],
                });
            }
            return -1;
        }
        const interval = this.modifyInterval(recipe.baseInterval, recipe);
        // Set Plot State
        plot.state = this.game.currentGamemode.enableInstantActions ? 3 /* FarmingPlotState.Grown */ : 2 /* FarmingPlotState.Growing */ ;
        plot.plantedRecipe = recipe;
        plot.growthTime = interval / 1000;
        this.selectRealm(recipe.realm); //Used to handle default selected realms for popups. Does nothing else in the Skill.
        // Queue Rendering
        this.renderQueue.growthState.add(plot);
        this.renderQueue.growthChance.add(plot);
        this.renderQueue.grants.add(plot);
        costs.consumeCosts();
        this.game.stats.Farming.add(FarmingStats.SeedsPlanted, seedQuantity);
        if (recipe.category.giveXPOnPlant)
            this.addXP(recipe.baseExperience, recipe);
        const event = new FarmingPlantActionEvent(this, recipe);
        this._events.emit('plant', event);
        return interval;
    }
    plantAllPlots(category, forceRecipe) {
        if (forceRecipe !== undefined && forceRecipe.category !== category)
            throw new Error('Tried to plant all plots with recipe that does not match plot category.');
        const isSelected = forceRecipe === undefined;
        const cost = this.getPlantAllCost(category);
        if (!this.game.gp.canAfford(cost)) {
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, getLangString('TOASTS_PLANT_ALL_GP'), 'danger'],
            });
            return;
        }
        let anyPlanted = false;
        const plotIntervalMap = new Map();
        const plots = this.getPlotsForCategory(category);
        plots.forEach((plot) => {
            const recipe = forceRecipe !== null && forceRecipe !== void 0 ? forceRecipe : plot.selectedRecipe;
            if (recipe === undefined)
                return;
            const plantInterval = this.plantPlot(plot, recipe, isSelected);
            if (plantInterval <= 0)
                return;
            const sameIntervalPlots = plotIntervalMap.get(plantInterval);
            if (sameIntervalPlots !== undefined) {
                sameIntervalPlots.push(plot);
            } else {
                plotIntervalMap.set(plantInterval, [plot]);
            }
            anyPlanted = true;
            this.renderQueue.compost.add(plot);
        });
        plotIntervalMap.forEach((plots, interval) => this.createGrowthTimer(plots, interval));
        if (anyPlanted) {
            this.game.gp.remove(cost);
            this.game.telemetry.createGPAdjustedEvent(-cost, this.game.gp.amount, `Skill.${this.id}.PlantAll`);
        }
    }
    onMasteryLevelUp(action, oldLevel, newLevel) {
        super.onMasteryLevelUp(action, oldLevel, newLevel);
        if (newLevel >= 50 && oldLevel < 50) {
            this.plots.forEach((plot) => {
                if (plot.plantedRecipe === action) {
                    this.renderQueue.growthChance.add(plot);
                    this.renderQueue.grants.add(plot);
                }
            });
        }
    }
    passiveTick() {
        if (this.growthTimers.size > 0) {
            this.growthTimers.forEach((timer) => {
                timer.tick();
                if (timer.ticksLeft % TICKS_PER_MINUTE === 0 && timer.ticksLeft > 0)
                    this.renderQueue.growthTime.add(timer);
            });
        }
    }
    onUnlock() {
        super.onUnlock();
        this.renderQueue.growthIndicators = true;
    }
    render() {
        super.render();
        this.renderGrowthStatus();
        this.renderGrowthState();
        this.renderCompost();
        this.renderGrowthChance();
        this.renderSelectedSeed();
        this.renderGrowthIndicators();
        this.renderCompostQuantity();
        this.renderPlotVisibility();
        this.renderPlotUnlockQuantities();
        this.renderGrants();
    }
    renderGrants() {
        if (this.renderQueue.grants.size === 0)
            return;
        this.renderQueue.grants.forEach((plot) => {
            const menu = farmingMenus.plotMap.get(plot);
            if (menu === undefined)
                return;
            const recipe = plot.plantedRecipe;
            if (recipe === undefined) {
                menu.updateGrants(0, 0, 0, 0, 0);
                menu.updateAbyssalGrants(0, 0);
                return;
            }
            const mxp = this.getMasteryXPToAddForAction(recipe, plot.growthTime / recipe.category.masteryXPDivider);
            const baseMXP = this.getBaseMasteryXPToAddForAction(recipe, plot.growthTime / recipe.category.masteryXPDivider);
            const xp = this.modifyXP(recipe.baseExperience);
            const mpxp = this.getMasteryXPToAddToPool(mxp);
            menu.updateGrants(xp, recipe.baseExperience, mxp, baseMXP, mpxp, recipe);
            const abyssalXP = this.modifyAbyssalXP(recipe.baseAbyssalExperience);
            menu.updateAbyssalGrants(abyssalXP, recipe.baseAbyssalExperience);
        });
        this.renderQueue.grants.clear();
    }
    renderGrowthStatus() {
        if (this.renderQueue.growthTime.size === 0)
            return;
        this.renderQueue.growthTime.forEach((timer) => {
            timer.plots.forEach((plot) => {
                var _a;
                (_a = farmingMenus.plotMap.get(plot)) === null || _a === void 0 ? void 0 : _a.updateGrowthTime(plot, this);
            });
        });
        this.renderQueue.growthTime.clear();
    }
    renderGrowthState() {
        if (this.renderQueue.growthState.size === 0)
            return;
        this.renderQueue.growthState.forEach((plot) => {
            var _a;
            (_a = farmingMenus.plotMap.get(plot)) === null || _a === void 0 ? void 0 : _a.updatePlotState(plot);
        });
        this.renderQueue.growthState.clear();
    }
    renderGrowthChance() {
        if (this.renderQueue.growthChance.size === 0)
            return;
        this.renderQueue.growthChance.forEach((plot) => {
            var _a;
            (_a = farmingMenus.plotMap.get(plot)) === null || _a === void 0 ? void 0 : _a.updateGrowthChance(plot, this);
        });
        this.renderQueue.growthChance.clear();
    }
    renderCompost() {
        if (this.renderQueue.compost.size === 0)
            return;
        this.renderQueue.compost.forEach((plot) => {
            var _a;
            (_a = farmingMenus.plotMap.get(plot)) === null || _a === void 0 ? void 0 : _a.updateCompost(plot);
        });
        this.renderQueue.compost.clear();
    }
    renderSelectedSeed() {
        if (this.renderQueue.selectedSeed.size === 0)
            return;
        this.renderQueue.selectedSeed.forEach((plot) => {
            var _a;
            (_a = farmingMenus.plotMap.get(plot)) === null || _a === void 0 ? void 0 : _a.updateSelectedSeed(plot);
        });
        this.renderQueue.selectedSeed.clear();
    }
    renderGrowthIndicators() {
        if (!this.renderQueue.growthIndicators)
            return;
        let anyGrown = false;
        this.categories.forEach((category) => {
            var _a;
            const plots = this.getPlotsForCategory(category);
            const hasGrown = plots.some((plot) => plot.state === 3 /* FarmingPlotState.Grown */ || plot.state === 4 /* FarmingPlotState.Dead */ );
            (_a = farmingMenus.categoryButtons.get(category)) === null || _a === void 0 ? void 0 : _a.updateNotice(hasGrown);
            anyGrown || (anyGrown = hasGrown);
        });
        skillNav.setGlowing(this, this.isUnlocked && anyGrown);
        this.renderQueue.growthIndicators = false;
    }
    renderCompostQuantity() {
        if (!this.renderQueue.compostQuantity)
            return;
        farmingMenus.compostIcons.forEach((icon) => icon.updateQuantity(this.game.bank));
        this.renderQueue.compostQuantity = false;
    }
    renderPlotVisibility() {
        if (!this.renderQueue.plotVisibility)
            return;
        if (this.visibleCategory !== undefined) {
            this.showPlotsInCategory(this.visibleCategory);
            this.renderQueue.plotUnlockQuantities = false;
        }
        this.renderQueue.plotVisibility = false;
    }
    renderPlotUnlockQuantities() {
        if (!this.renderQueue.plotUnlockQuantities)
            return;
        farmingMenus.lockedPlotMap.forEach((lockedElement, plot) => {
            lockedElement.updateQuantities(this.game);
            lockedElement.updateUnlockButton(plot, this);
        });
        this.renderQueue.plotUnlockQuantities = false;
    }
    /** Shows all plots that are part of the category */
    showPlotsInCategory(category) {
        const plots = this.getPlotsForCategory(category);
        let unlockedPlots = 0;
        let lockedPlots = 0;
        // Generate locked/unlocked plots, and arrange them correctly
        farmingMenus.plotMap.clear();
        farmingMenus.lockedPlotMap.clear();
        let lastPlotElement = farmingMenus.categoryOptions;
        let lastLevelLockedShown = false;
        plots.forEach((plot) => {
            if (plot.state !== 0 /* FarmingPlotState.Locked */ ) {
                let unlockedPlot = farmingMenus.plots[unlockedPlots];
                if (unlockedPlot === undefined) {
                    unlockedPlot = createElement('farming-plot', {
                        className: 'col-6 col-xl-3'
                    });
                    lastPlotElement.after(unlockedPlot);
                    farmingMenus.plots.push(unlockedPlot);
                }
                lastPlotElement = unlockedPlot;
                unlockedPlot.setPlot(plot, this.game);
                farmingMenus.plotMap.set(plot, unlockedPlot);
                this.renderQueue.grants.add(plot);
                showElement(unlockedPlot);
                unlockedPlots++;
            } else if ((this.level >= plot.level && this.abyssalLevel >= plot.abyssalLevel) || !lastLevelLockedShown) {
                let lockedPlot = farmingMenus.lockedPlots[lockedPlots];
                if (lockedPlot === undefined) {
                    lockedPlot = createElement('locked-farming-plot', {
                        className: 'col-6 col-xl-3'
                    });
                    farmingMenus.lockedPlots.push(lockedPlot);
                }
                lastPlotElement.after(lockedPlot);
                lastPlotElement = lockedPlot;
                lockedPlot.setPlot(plot, this, this.game);
                farmingMenus.lockedPlotMap.set(plot, lockedPlot);
                showElement(lockedPlot);
                lockedPlots++;
                if (plot.level > this.level)
                    lastLevelLockedShown = true;
            }
        });
        // Hide Extra Locked/Unlocked Plots
        for (let i = unlockedPlots; i < farmingMenus.plots.length; i++) {
            hideElement(farmingMenus.plots[i]);
        }
        for (let i = lockedPlots; i < farmingMenus.lockedPlots.length; i++) {
            hideElement(farmingMenus.lockedPlots[i]);
        }
        farmingMenus.categoryOptions.setCategory(category, this.game);
        this.visibleCategory = category;
    }
    /** Callback function for the Harvest All button */
    harvestAllOnClick(category) {
        const cost = this.getHarvestAllCost(category);
        if (!this.game.gp.canAfford(cost)) {
            notifyPlayer(this, getLangString('TOASTS_HARVEST_ALL_GP'), 'danger');
            return;
        }
        const plots = this.getPlotsForCategory(category);
        let harvestCount = 0;
        this.game.combat.notifications.disableMaxQueue();
        plots.forEach((plot) => {
            switch (plot.state) {
                case 3 /* FarmingPlotState.Grown */ :
                    if (this.harvestPlot(plot))
                        harvestCount++;
                    break;
                case 4 /* FarmingPlotState.Dead */ :
                    this.clearDeadPlot(plot);
                    harvestCount++;
                    break;
            }
        });
        if (harvestCount > 0) {
            this.game.gp.remove(cost);
            this.game.telemetry.createGPAdjustedEvent(-cost, this.game.gp.amount, `Skill.${this.id}.HarvestAll`);
        }
        this.game.combat.notifications.enableMaxQueue();
    }
    /** Callback function for adding compost to a plot */
    compostPlot(plot, compost, amount) {
        if (plot.state !== 1 /* FarmingPlotState.Empty */ )
            return false;
        const freeCompost = compost.id === "melvorD:Compost" /* ItemIDs.Compost */ && this.game.modifiers.freeCompost > 0;
        const owned = freeCompost ? Infinity : this.game.bank.getQty(compost);
        if (plot.compostItem !== undefined && plot.compostItem.harvestBonus >= compost.harvestBonus) {
            if (plot.compostItem.harvestBonus > compost.harvestBonus || plot.compostLevel === 100)
                return false;
            // Add to it
            const amountNeeded = Math.ceil((100 - plot.compostLevel) / compost.compostValue);
            amount = Math.min(amount, amountNeeded, owned);
            if (amount > 0) {
                plot.compostLevel += amount * compost.compostValue;
                plot.compostLevel = Math.min(plot.compostLevel, 100);
                if (!freeCompost)
                    this.game.bank.removeItemQuantity(compost, amount, true);
                this.recordCompostStat(compost, amount);
                this.renderQueue.compost.add(plot);
                this.renderQueue.growthChance.add(plot);
                return true;
            } else {
                this.notifyNoCompost(compost);
                return false;
            }
        } else {
            // Replace it
            const amountNeeded = Math.ceil(100 / compost.compostValue);
            amount = Math.min(amount, amountNeeded, owned);
            if (amount > 0) {
                plot.compostLevel = amount * compost.compostValue;
                plot.compostLevel = Math.min(plot.compostLevel, 100);
                plot.compostItem = compost;
                if (!freeCompost)
                    this.game.bank.removeItemQuantity(compost, amount, true);
                this.recordCompostStat(compost, amount);
                this.renderQueue.compost.add(plot);
                this.renderQueue.growthChance.add(plot);
                return true;
            } else {
                this.notifyNoCompost(compost);
                return false;
            }
        }
    }
    notifyNoCompost(compost) {
        let message;
        switch (compost.id) {
            case "melvorD:Compost" /* ItemIDs.Compost */ :
                message = getLangString('TOASTS_NEED_COMPOST');
                break;
            case "melvorD:Weird_Gloop" /* ItemIDs.Weird_Gloop */ :
                message = getLangString('TOASTS_NEED_GLOOP');
                break;
            default:
                message = templateLangString('FARMING_MISC_NEED_ITEM_TO_APPLY', {
                    itemName: compost.name
                });
        }
        this.game.combat.notifications.add({
            type: 'Player',
            args: [this, message, 'danger'],
        });
    }
    notifyCantAffordCompostAll(compost) {
        let message;
        switch (compost.id) {
            case "melvorD:Compost" /* ItemIDs.Compost */ :
                message = getLangString('TOASTS_COMPOST_ALL_GP');
                break;
            case "melvorD:Weird_Gloop" /* ItemIDs.Weird_Gloop */ :
                message = getLangString('TOASTS_GLOOP_ALL_GP');
                break;
            default:
                message = templateLangString('FARMING_MISC_NO_CURRENCY_APPLY_ITEM', {
                    currencyName: compost.compostAllCost.currency.name,
                    itemName: compost.name,
                });
        }
        this.game.combat.notifications.add({
            type: 'Player',
            args: [this, message, 'danger'],
        });
    }
    recordCompostStat(compost, amount) {
        switch (compost.id) {
            case "melvorD:Compost" /* ItemIDs.Compost */ :
                this.game.stats.Farming.add(FarmingStats.CompostUsed, amount);
                break;
            case "melvorD:Weird_Gloop" /* ItemIDs.Weird_Gloop */ :
                this.game.stats.Farming.add(FarmingStats.GloopUsed, amount);
                break;
        }
    }
    /** Callback function for the Compost All button */
    compostAllOnClick(category, compost) {
        const cost = compost.compostAllCost;
        if (!cost.currency.canAfford(cost.quantity)) {
            this.notifyCantAffordCompostAll(compost);
            return;
        }
        let appliedAny = false;
        const plots = this.getPlotsForCategory(category);
        plots.forEach((plot) => {
            if (!this.game.bank.hasItem(compost))
                return;
            if (this.compostPlot(plot, compost, Infinity))
                appliedAny = true;
        });
        if (appliedAny) {
            cost.currency.remove(cost.quantity);
            if (cost.currency === this.game.gp) {
                this.game.telemetry.createAPAdjustedEvent(-cost.quantity, cost.currency.amount, `Skill.${this.id}.CompostAll`);
            } else if (cost.currency === this.game.abyssalPieces) {
                this.game.telemetry.createGPAdjustedEvent(-cost.quantity, cost.currency.amount, `Skill.${this.id}.CompostAll`);
            }
        }
    }
    /** Callback function for the Plant All button */
    plantAllOnClick(category) {
        const plots = this.getPlotsForCategory(category);
        if (!plots.some((plot) => plot.state === 1 /* FarmingPlotState.Empty */ )) {
            notifyPlayer(this, getLangString('TOASTS_NO_EMPTY_PATCHES'), 'danger');
            return;
        }
        farmingMenus.seedSelect.setSeedSelection(category, this.game, this.currentRealm);
        farmingMenus.seedSelect.setUnselectedRecipe();
        $('#modal-farming-seed').modal('show');
    }
    /** Callback function for the Plant All Selected button */
    plantAllSelectedOnClick(category) {
        this.plantAllPlots(category);
    }
    /** Callback function for changing recipe associated with the Plant All Selected for a plot */
    setPlantAllSelected(plot, recipe) {
        if (this.level >= recipe.level && (recipe.abyssalLevel === 0 || this.abyssalLevel >= recipe.abyssalLevel)) {
            plot.selectedRecipe = recipe;
            this.renderQueue.selectedSeed.add(plot);
        } else {
            if (this.level < recipe.level)
                this.game.combat.notifications.add({
                    type: 'Player',
                    args: [
                        this,
                        templateLangString('TOASTS_SKILL_LEVEL_REQUIRED', {
                            level: `${recipe.level}`,
                            skillName: this.name
                        }),
                        'danger',
                    ],
                });
            if (this.abyssalLevel < recipe.abyssalLevel)
                this.game.combat.notifications.add({
                    type: 'Player',
                    args: [
                        this,
                        templateLangString('ABYSSAL_LEVEL_REQUIRED_TO_DO_THAT', {
                            level: `${recipe.abyssalLevel}`,
                            skillName: this.name,
                        }),
                        'danger',
                    ],
                });
        }
    }
    /** Callback function for destroying an individual plot */
    destroyPlotOnClick(plot) {
        if (plot.state !== 2 /* FarmingPlotState.Growing */ )
            return;
        if (this.game.settings.showCropDestructionConfirmations) {
            SwalLocale.fire({
                title: getLangString('MENU_TEXT_DESTROY_CROP'),
                html: `<h5 class="font-w600 text-danger font-size-sm mb-1">${getLangString('MENU_TEXT_CANNOT_UNDO')}</h5>`,
                showCancelButton: true,
                icon: 'warning',
                confirmButtonText: getLangString('MENU_TEXT_DESTROY'),
            }).then((result) => {
                if (result.value) {
                    this.destroyPlot(plot);
                }
            });
        } else {
            this.destroyPlot(plot);
        }
    }
    destroyPlot(plot) {
        if (plot.state !== 2 /* FarmingPlotState.Growing */ )
            return;
        this.resetPlot(plot);
        // Clean up timers
        const timer = this.growthTimerMap.get(plot);
        if (timer === undefined)
            throw new Error('Tried destroying plot, but no timer is set for it.');
        const plotIndex = timer.plots.findIndex((timerPlot) => timerPlot === plot);
        if (plotIndex === -1)
            throw new Error('Tried destroying plot, but plot is not a member of timer.');
        this.growthTimerMap.delete(plot);
        timer.plots.splice(plotIndex, 1);
        if (timer.plots.length === 0) {
            this.removeGrowthTimer(timer);
        }
        this.renderQueue.compost.add(plot);
    }
    /** Callback function for the Plant a Seed button on a plot */
    plantPlotOnClick(plot) {
        if (plot.state !== 1 /* FarmingPlotState.Empty */ )
            return;
        farmingMenus.seedSelect.setSeedSelection(plot.category, this.game, this.currentRealm, plot);
        farmingMenus.seedSelect.setUnselectedRecipe();
        $('#modal-farming-seed').modal('show');
    }
    /** Callback function for the Harvest button on a plot */
    harvestPlotOnClick(plot) {
        switch (plot.state) {
            case 3 /* FarmingPlotState.Grown */ :
                this.harvestPlot(plot);
                break;
            case 4 /* FarmingPlotState.Dead */ :
                this.clearDeadPlot(plot);
                break;
        }
    }
    getPlotUnlockCosts(plot) {
        const costs = new Costs(this.game);
        plot.currencyCosts.forEach(({
            currency,
            quantity
        }) => {
            costs.addCurrency(currency, quantity);
        });
        plot.itemCosts.forEach(({
            item,
            quantity
        }) => {
            costs.addItem(item, quantity);
        });
        return costs;
    }
    /** Returns if the plots requirements and costs are met */
    canUnlockPlot(plot) {
        const abyssalLevelMet = plot.abyssalLevel === 0 || this.abyssalLevel >= plot.abyssalLevel;
        return (this.level >= plot.level &&
            this.abyssalLevel >= plot.abyssalLevel &&
            this.getPlotUnlockCosts(plot).checkIfOwned() &&
            abyssalLevelMet);
    }
    /** Callback function for the Unlock button on a plot */
    unlockPlotOnClick(plot) {
        const costs = this.getPlotUnlockCosts(plot);
        costs.setSource(`Skill.${this.id}.UnlockPlot`);
        if (!costs.checkIfOwned() || this.level < plot.level || this.abyssalLevel < plot.abyssalLevel)
            return;
        costs.consumeCosts();
        plot.state = 1 /* FarmingPlotState.Empty */ ;
        this.showPlotsInCategory(plot.category);
    }
    /** Callback function for the Plant button in the Plant a seed modal */
    plantRecipe(recipe, plot) {
        const plantInterval = this.plantPlot(plot, recipe);
        if (plantInterval <= 0)
            return;
        // Set up timer
        this.createGrowthTimer([plot], plantInterval);
    }
    /** Callback function for the Plant button in the Plant a seed modal */
    plantAllRecipe(recipe) {
        this.plantAllPlots(recipe.category, recipe);
    }
    createGrowthTimer(plots, interval) {
        const timer = new FarmingGrowthTimer(plots, this);
        this.growthTimers.add(timer);
        plots.forEach((plot) => {
            this.growthTimerMap.set(plot, timer);
        });
        this.renderQueue.growthTime.add(timer);
        timer.start(interval);
        // TODO: Implement push notifications
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
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.farmingRecipes[oldActionID];
    }
    encode(writer) {
        super.encode(writer);
        writer.writeUint32(this.plots.size);
        this.plots.forEach((plot) => {
            writer.writeNamespacedObject(plot);
            plot.encode(writer);
        });
        writer.writeUint32(this.plots.dummySize);
        this.plots.forEachDummy((plot) => {
            writer.writeNamespacedObject(plot);
            plot.encode(writer);
        });
        writer.writeSet(this.growthTimers, (timer, writer) => timer.encode(writer));
        return writer;
    }
    decodePlot(reader, version) {
        let plot = reader.getNamespacedObject(this.plots);
        if (typeof plot === 'string') {
            if (plot.startsWith('melvor'))
                plot = this.plots.getDummyObject(plot, DummyFarmingPlot, this.game);
            else
                plot = this.game.constructDummyObject(plot, DummyFarmingPlot);
        }
        plot.decode(reader, version);
    }
    decode(reader, version) {
        super.decode(reader, version);
        const numPlots = reader.getUint32();
        for (let i = 0; i < numPlots; i++) {
            this.decodePlot(reader, version);
        }
        const numDummyPlots = reader.getUint32();
        for (let i = 0; i < numDummyPlots; i++) {
            this.decodePlot(reader, version);
        }
        this.growthTimers = reader.getSet((reader) => {
            const timer = new FarmingGrowthTimer([], this);
            timer.decode(reader, version);
            if (timer.plots.length === 0)
                return undefined; // Reject empty timers
            return timer;
        });
        this.growthTimers.forEach((timer) => {
            timer.plots.forEach((plot) => {
                this.growthTimerMap.set(plot, timer);
            });
        });
    }
    convertFromOldFormat(save, idMap) {
        const compost = this.game.items.composts.getObjectByID("melvorD:Compost" /* ItemIDs.Compost */ );
        const gloop = this.game.items.composts.getObjectByID("melvorD:Weird_Gloop" /* ItemIDs.Weird_Gloop */ );
        if (compost === undefined || gloop === undefined)
            throw new Error(`Error converting farming data. Compost not registered.`);
        const currentTime = new Date().getTime();
        if (save.newFarmingAreas !== undefined) {
            save.newFarmingAreas.forEach((area, catID) => {
                area.patches.forEach((patch, i) => {
                    var _a;
                    const plot = this.plots.getObjectByID(idMap.farmingPlots[`${catID}:${i}`]);
                    if (plot === undefined)
                        return;
                    plot.compostLevel = patch.compost;
                    if (patch.compost > 0)
                        plot.compostItem = patch.gloop ? gloop : compost;
                    if (patch.unlocked) {
                        if (patch.seedID > 0) {
                            const recipe = this.actions.getObjectByID(idMap.farmingSeedToRecipe[patch.seedID]);
                            if (recipe === undefined) {
                                plot.state = 1 /* FarmingPlotState.Empty */ ;
                                return;
                            }
                            plot.plantedRecipe = recipe;
                            if (patch.hasGrown) {
                                plot.state = 3 /* FarmingPlotState.Grown */ ;
                            } else {
                                plot.state = 2 /* FarmingPlotState.Growing */ ;
                                const growthTime = (_a = patch.setInterval) !== null && _a !== void 0 ? _a : recipe.baseInterval / 1000;
                                plot.growthTime = growthTime;
                                let timeLeft = patch.timePlanted + growthTime * 1000 - currentTime;
                                timeLeft = Math.max(TICK_INTERVAL, timeLeft);
                                this.createGrowthTimer([plot], timeLeft);
                            }
                        } else {
                            plot.state = 1 /* FarmingPlotState.Empty */ ;
                        }
                    }
                });
            });
        }
        if (save.plantAllSelected !== undefined) {
            Object.entries(save.plantAllSelected).forEach(([catID, seeds]) => {
                seeds.forEach((seedID, i) => {
                    const plot = this.plots.getObjectByID(idMap.farmingPlots[`${catID}:${i}`]);
                    if (plot === undefined)
                        return;
                    const recipe = this.actions.getObjectByID(idMap.farmingSeedToRecipe[seedID]);
                    if (recipe !== undefined)
                        plot.selectedRecipe = recipe;
                });
            });
        }
    }
    testTranslations() {
        super.testTranslations();
        this.actions.forEach((action) => {
            action.name;
        });
        this.categories.forEach((category) => {
            category.name;
            category.singularName;
            category.description;
            category.seedNotice;
        });
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        this.actions.forEach((action) => obtainable.add(action.product));
        return obtainable;
    }
}
//# sourceMappingURL=farming2.js.map
checkFileVersion('?12097')