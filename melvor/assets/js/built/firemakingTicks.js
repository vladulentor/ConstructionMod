"use strict";
class FiremakingLog extends BasicSkillRecipe {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.baseOilInterval = 100000;
        this.bonfireCost = 10;
        this.oilCost = 10;
        this.oilItems = []; // TODO_C This property is unused
        try {
            this.log = game.items.getObjectSafe(data.logID);
            this.baseInterval = data.baseInterval;
            if (data.primaryProducts !== undefined)
                this.primaryProducts = game.items.getArrayFromIds(data.primaryProducts);
            else
                this.primaryProducts = game.firemaking.defaultPrimaryProducts;
            if (data.secondaryProducts !== undefined)
                this.secondaryProducts = game.items.getArrayFromIds(data.secondaryProducts);
            else
                this.secondaryProducts = game.firemaking.defaultSecondaryProducts;
            this.baseBonfireInterval = data.baseBonfireInterval;
            this.bonfireXPBonus = data.bonfireXPBonus;
            if (data.bonfireAXPBonus)
                this.bonfireAXPBonus = data.bonfireAXPBonus;
            if (data.bonfireCost !== undefined)
                this.bonfireCost = data.bonfireCost;
        } catch (e) {
            throw new DataConstructionError(FiremakingLog.name, e, this.id);
        }
    }
    get name() {
        return this.log.name;
    }
    get media() {
        return this.log.media;
    }
    /** If this log has an "Abyssal Bonfire" that does not benefit from normal bonuses conferred to bonfires */
    get hasAbyssalBonfire() {
        return this.bonfireAXPBonus !== undefined;
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            if (data.logID !== undefined)
                this.log = game.items.getObjectSafe(data.logID);
            if (data.baseInterval !== undefined)
                this.baseInterval = data.baseInterval;
            if (data.primaryProducts !== undefined) {
                if (this.primaryProducts === game.firemaking.defaultPrimaryProducts) {
                    this.primaryProducts = [...game.firemaking.defaultPrimaryProducts];
                }
                if (data.primaryProducts.remove !== undefined) {
                    const removals = data.primaryProducts.remove;
                    this.primaryProducts = this.primaryProducts.filter((item) => !removals.includes(item.id));
                }
                if (data.primaryProducts.add !== undefined) {
                    this.primaryProducts.push(...game.items.getArrayFromIds(data.primaryProducts.add));
                }
            }
            if (data.secondaryProducts !== undefined) {
                if (this.secondaryProducts === game.firemaking.defaultSecondaryProducts) {
                    this.secondaryProducts = [...game.firemaking.defaultSecondaryProducts];
                }
                if (data.secondaryProducts.remove !== undefined) {
                    const removals = data.secondaryProducts.remove;
                    this.primaryProducts = this.primaryProducts.filter((item) => !removals.includes(item.id));
                }
                if (data.secondaryProducts.add !== undefined) {
                    this.secondaryProducts.push(...game.items.getArrayFromIds(data.secondaryProducts.add));
                }
            }
            if (data.baseBonfireInterval !== undefined)
                this.baseBonfireInterval = data.baseBonfireInterval;
            if (data.bonfireXPBonus !== undefined)
                this.bonfireXPBonus = data.bonfireXPBonus;
            if (data.bonfireAXPBonus !== undefined)
                this.bonfireAXPBonus = data.bonfireAXPBonus;
        } catch (e) {
            throw new DataModificationError(FiremakingLog.name, e, this.id);
        }
    }
}
class FiremakingProduct {
    constructor(data, game) {
        try {
            this.item = game.items.getObjectSafe(data.itemID);
            this.chance = data.chance;
            this.quantity = data.quantity;
            if (data.quantityScaling !== undefined)
                this.quantityScaling = data.quantityScaling;
        } catch (e) {
            throw new DataConstructionError(FiremakingProduct.name, e);
        }
    }
}
class Firemaking extends CraftingSkill {
    constructor(namespace, game) {
        super(namespace, 'Firemaking', game, FiremakingLog.name);
        this.bonfireTimer = new Timer('Skill', () => this.endBonFire());
        this.oilTimer = new Timer('Skill', () => this.endOilingOfMyLog());
        this._media = "assets/media/skills/firemaking/firemaking.png" /* Assets.Firemaking */ ;
        this.renderQueue = new FiremakingRenderQueue();
        /** Information on the primary products from burning logs */
        this.primaryProducts = new Map();
        /** Information on the secondary products from burning logs */
        this.secondaryProducts = new Map();
        /** The default primary products logs should have */
        this.defaultPrimaryProducts = [];
        /** The default secondary products logs should have */
        this.defaultSecondaryProducts = [];
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    get noCostsMessage() {
        return templateLangString('TOASTS_NO_LOGS_TO_BURN', {
            itemName: this.activeRecipe.log.name
        });
    }
    get actionInterval() {
        return this.modifyInterval(this.activeRecipe.baseInterval, this.masteryAction);
    }
    get masteryModifiedInterval() {
        return this.activeRecipe.baseInterval * 0.6;
    }
    get actionLevel() {
        return this.activeRecipe.level;
    }
    get masteryAction() {
        return this.activeRecipe;
    }
    get activeRecipe() {
        if (this.selectedRecipe === undefined)
            throw new Error('Tried to get active recipe, but none is selected.');
        return this.selectedRecipe;
    }
    get activeBonfire() {
        if (this.litBonfireRecipe === undefined)
            throw new Error('Tried to get active bonfire recipe, but none is lit.');
        return this.litBonfireRecipe;
    }
    get isBonfireActive() {
        return this.litBonfireRecipe !== undefined;
    }
    get activeOil() {
        if (this.oiledLogRecipe === undefined)
            throw new Error('Tried to get active oil recipe, but none is oiled.');
        return this.oiledLogRecipe;
    }
    get isOilingOfMyLogsActive() {
        return this.oiledLogRecipe !== undefined;
    }
    get isLogSelected() {
        return this.selectedRecipe !== undefined;
    }
    get isOilSelected() {
        return this.selectedOil !== undefined;
    }
    get bonfireBonusXP() {
        if (this.isBonfireActive)
            return this.activeBonfire.bonfireXPBonus;
        else
            return 0;
    }
    get bonfireBonusAXP() {
        if (this.isBonfireActive && this.activeBonfire.bonfireAXPBonus)
            return this.activeBonfire.bonfireAXPBonus;
        else
            return 0;
    }
    get hasAbyssalBonfireActive() {
        return this.litBonfireRecipe !== undefined && this.litBonfireRecipe.hasAbyssalBonfire;
    }
    get hasAbyssalBonfireLogSelected() {
        return this.selectedRecipe !== undefined && this.selectedRecipe.hasAbyssalBonfire;
    }
    registerData(namespace, data) {
        var _a, _b, _c;
        super.registerData(namespace, data);
        (_a = data.primaryProducts) === null || _a === void 0 ? void 0 : _a.forEach((productData) => {
            const product = new FiremakingProduct(productData, this.game);
            this.primaryProducts.set(product.item, product);
        });
        (_b = data.secondaryProducts) === null || _b === void 0 ? void 0 : _b.forEach((productData) => {
            const product = new FiremakingProduct(productData, this.game);
            this.secondaryProducts.set(product.item, product);
        });
        if (data.defaultPrimaryProducts !== undefined) {
            this.defaultPrimaryProducts.push(...this.game.items.getArrayFromIds(data.defaultPrimaryProducts));
        }
        if (data.defaultSecondaryProducts !== undefined) {
            this.defaultSecondaryProducts.push(...this.game.items.getArrayFromIds(data.defaultSecondaryProducts));
        }
        (_c = data.logs) === null || _c === void 0 ? void 0 : _c.forEach((log) => {
            this.actions.registerObject(new FiremakingLog(namespace, log, this.game));
        });
    }
    modifyData(data) {
        var _a;
        super.modifyData(data);
        (_a = data.logs) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const log = this.actions.getObjectByID(modData.id);
            if (log === undefined)
                throw new UnregisteredDataModError(FiremakingLog.name, modData.id);
            log.applyDataModification(modData, this.game);
        });
    }
    postDataRegistration() {
        super.postDataRegistration();
        // Set up sorted mastery
        this.sortedMasteryActions = this.actions.allObjects.sort((a, b) => a.level - b.level);
        // Add Milestones
        this.actions.forEach((action) => {
            if (action.abyssalLevel > 0)
                this.abyssalMilestones.push(action);
            else
                this.milestones.push(action);
        });
        this.sortMilestones();
    }
    onLoad() {
        super.onLoad();
        this.renderQueue.logSelection = true;
        if (this.selectedRecipe !== undefined) {
            this.renderQueue.selectedLog = true;
            this.renderQueue.logQty = true;
            this.renderQueue.logInfo = true;
            this.renderQueue.actionMastery.add(this.selectedRecipe);
        }
        if (this.isActive) {
            this.renderQueue.progressBar = true;
            if (this.isOilingOfMyLogsActive) {
                this.renderQueue.oilProgress = true;
            }
        }
        this.renderQueue.bonfireStatus = true;
        this.renderQueue.bonfireInfo = true;
        if (this.isBonfireActive) {
            this.renderQueue.bonfireProgress = true;
            this.renderQueue.bonfireQty = true;
        }
        this.renderQueue.selectedOil = true;
        this.renderQueue.oilQty = true;
        this.renderQueue.oilInfo = true;
        this.render();
    }
    onModifierChange() {
        super.onModifierChange();
        this.renderQueue.logInfo = true;
        this.renderQueue.bonfireInfo = true;
    }
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.renderQueue.logSelection = true;
    }
    onMasteryLevelUp(action, oldLevel, newLevel) {
        super.onMasteryLevelUp(action, oldLevel, newLevel);
        if (newLevel >= 99)
            this.computeProvidedStats();
    }
    onEquipmentChange() {}
    onPageChange() {
        if (this.isBonfireActive)
            this.renderQueue.bonfireProgress = true;
        if (this.isOilingOfMyLogsActive)
            this.renderQueue.oilProgress = true;
        this.renderQueue.selectedLog = true;
        this.renderQueue.logQty = true;
        this.renderQueue.bonfireQty = true;
        this.renderQueue.logInfo = true;
        this.renderQueue.selectedOil = true;
        this.renderQueue.oilQty = true;
        this.renderQueue.oilInfo = true;
        super.onPageChange();
    }
    queueBankQuantityRender(item) {
        this.renderQueue.logQty = true;
        this.renderQueue.bonfireQty = true;
        this.renderQueue.oilQty = true;
    }
    localize() {
        this.renderQueue.logSelection = true;
        this.renderOilSelection();
        this.renderQueue.bonfireStatus = true;
        this.renderQueue.oilStatus = true;
        this.renderQueue.selectedLog = true;
        this.renderQueue.selectedOil = true;
        this.render();
    }
    /** Callback function for when burn button is pressed */
    burnLog() {
        if (this.isActive) {
            this.stop();
        } else if (this.selectedRecipe !== undefined) {
            if (this.game.bank.getQty(this.activeRecipe.log) > 0) {
                this.start();
                this.renderQueue.bonfireProgress = true;
                this.renderQueue.oilProgress = true;
            } else
                notifyPlayer(this, this.noCostsMessage, 'danger');
        } else {
            notifyPlayer(this, getLangString('TOASTS_SELECT_LOGS'), 'danger');
        }
    }
    activeTick() {
        super.activeTick();
        this.bonfireTimer.tick();
        this.oilTimer.tick();
    }
    getErrorLog() {
        var _a, _b, _c;
        return `${super.getErrorLog()}
Selected Recipe ID: ${(_a = this.selectedRecipe) === null || _a === void 0 ? void 0 : _a.id}
Lit Bonfire ID: ${(_b = this.litBonfireRecipe) === null || _b === void 0 ? void 0 : _b.id}
Oiling Oil ID: ${(_c = this.oiledLogRecipe) === null || _c === void 0 ? void 0 : _c.id}`;
    }
    onStop() {
        super.onStop();
        this.renderQueue.bonfireProgress = true;
        this.renderQueue.oilProgress = true;
    }
    getCurrentRecipeCosts() {
        const costs = new Costs(this.game);
        costs.setSource(`Skill.${this.id}.BurnLog.${this.activeRecipe.id}`);
        costs.addItem(this.activeRecipe.log, 1);
        return costs;
    }
    recordCostConsumptionStats(costs) {
        super.recordCostConsumptionStats(costs);
        costs.recordBulkItemStat(this.game.stats.Firemaking, FiremakingStats.LogsBurnt);
        costs.recordItemSkillCurrencyStat(this, 6 /* SkillCurrencyStats.Burnt */ );
    }
    recordCostPreservationStats(costs) {
        super.recordCostPreservationStats(costs);
        costs.recordBulkItemStat(this.game.stats.Firemaking, FiremakingStats.ItemsPreserved);
    }
    computeProductInfo(item, action, product) {
        let chance = 0;
        let quantity = 1;
        if (product !== undefined) {
            chance = product.chance;
            quantity = product.quantity;
            if (product.quantityScaling !== undefined) {
                let factor = product.quantityScaling.factor;
                switch (product.quantityScaling.type) {
                    case 'AbyssalLevel':
                        factor *= action.abyssalLevel;
                        break;
                    case 'BaseInterval':
                        factor *= action.baseInterval;
                        break;
                }
                quantity = Math.floor(quantity * factor);
            }
        }
        const modifierProducts = this.game.modifiers.query("melvorD:randomProductChance" /* ModifierIDs.randomProductChance */ , this.getActionItemModifierQuery(action));
        if (modifierProducts.length > 0) {
            const productChances = new SparseNumericMap();
            modifierProducts.forEach((entry) => productChances.add(entry.scope.item, entry.value));
            productChances.forEach((productChance, productItem) => {
                if (productItem === item)
                    chance += productChance;
            });
        }
        const query = this.getItemModifierQuery(item);
        quantity += this.game.modifiers.getValue("melvorD:flatBaseRandomProductQuantity" /* ModifierIDs.flatBaseRandomProductQuantity */ , query);
        quantity = Math.max(quantity, 1);
        chance = clampValue(chance, 0, 100);
        return {
            chance,
            quantity
        };
    }
    getPrimaryProductInfo(item, action) {
        return this.computeProductInfo(item, action, this.primaryProducts.get(item));
    }
    getSecondaryProductInfo(item, action) {
        return this.computeProductInfo(item, action, this.secondaryProducts.get(item));
    }
    addProvidedStats() {
        super.addProvidedStats();
        if (this.oiledLogRecipe !== undefined)
            this.providedStats.addStatObject(this.oiledLogRecipe, this.oiledLogRecipe);
    }
    preAction() {}
    /** Modifies the quantity given by a secondary product */
    modifySecondaryProductQuantity(item, quantity, action, query) {
        // There are currently no multipliers that apply exclusively to to the primary product
        return this.applyPrimaryProductMultipliers(item, quantity, action, query);
    }
    get actionRewards() {
        const rewards = new Rewards(this.game);
        const recipe = this.activeRecipe;
        rewards.setSource(`Skill.${this.id}.BurnLog.${recipe.id}`);
        rewards.setActionInterval(this.actionInterval);
        const actionEvent = new FiremakingActionEvent(this, this.masteryAction);
        const baseSaleValue = recipe.log.sellsFor;
        let currencyToAdd = (baseSaleValue.quantity *
                this.game.modifiers.getValue("melvorD:firemakingLogCurrencyGain" /* ModifierIDs.firemakingLogCurrencyGain */ , baseSaleValue.currency.modQuery)) /
            100;
        currencyToAdd = this.modifyCurrencyReward(baseSaleValue.currency, currencyToAdd, this.masteryAction);
        if (currencyToAdd > 0)
            rewards.addCurrency(baseSaleValue.currency, currencyToAdd);
        const xpToAdd = recipe.baseExperience * (1 + this.bonfireBonusXP / 100);
        rewards.addXP(this, xpToAdd, recipe);
        const axpToAdd = recipe.baseAbyssalExperience * (1 + this.bonfireBonusAXP / 100);
        rewards.addAbyssalXP(this, axpToAdd, recipe);
        if (this.game.tutorial.complete) {
            // Give Primary Products
            recipe.primaryProducts.forEach((item) => {
                const {
                    chance,
                    quantity
                } = this.getPrimaryProductInfo(item, recipe);
                if (rollForOffItem(chance)) {
                    const productQuantity = this.modifyPrimaryProductQuantity(item, quantity, recipe);
                    rewards.addItem(item, productQuantity);
                    this.addCurrencyFromPrimaryProductGain(rewards, item, quantity, recipe);
                    if (item.id === "melvorD:Coal_Ore" /* ItemIDs.Coal_Ore */ )
                        this.game.stats.Firemaking.add(FiremakingStats.CoalGained, productQuantity);
                }
            });
            // Give Secondary products
            const modQuery = this.getActionModifierQuery(recipe);
            recipe.secondaryProducts.forEach((item) => {
                const {
                    chance,
                    quantity
                } = this.getSecondaryProductInfo(item, recipe);
                if (rollForOffItem(chance)) {
                    const productQuantity = this.modifySecondaryProductQuantity(item, quantity, recipe, modQuery);
                    rewards.addItem(item, productQuantity);
                }
            });
        }
        this.addCommonRewards(rewards, recipe);
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    postAction() {
        if (this.bonfireBonusXP > 0)
            this.game.stats.Firemaking.add(FiremakingStats.BonusBonfireXP, this.modifyXP(this.activeRecipe.baseExperience * (this.bonfireBonusXP / 100)));
        this.renderQueue.logQty = true;
        this.game.stats.Firemaking.inc(FiremakingStats.TotalActions);
        this.game.stats.Firemaking.add(FiremakingStats.TimeSpent, this.currentActionInterval);
    }
    stopBonfire() {
        if (this.litBonfireRecipe === undefined)
            return;
        this.bonfireTimer.stop();
        this.litBonfireRecipe = undefined;
        this.renderQueue.logInfo = true;
        this.renderQueue.bonfireStatus = true;
        this.renderQueue.bonfireProgress = true;
        this.renderQueue.bonfireInfo = true;
    }
    endBonFire() {
        const previousBonfire = this.litBonfireRecipe;
        this.litBonfireRecipe = undefined;
        this.renderQueue.logInfo = true;
        this.renderQueue.bonfireStatus = true;
        this.renderQueue.bonfireProgress = true;
        this.renderQueue.bonfireInfo = true;
        if (this.isActive) {
            // Attempt to re-light the same bonfire
            const relit = this.lightBonfire(previousBonfire);
            // On failure, attempt to light with the currently selected logs
            if (!relit)
                this.lightBonfire();
        }
    }
    getBonfireInterval(recipe) {
        let bonfireInterval = recipe.baseBonfireInterval;
        bonfireInterval *= 1 + this.game.modifiers.firemakingBonfireInterval / 100;
        bonfireInterval = roundToTickInterval(bonfireInterval);
        return Math.max(250, bonfireInterval);
    }
    getBonfireIntervalSources(recipe) {
        const builder = new ModifierSourceBuilder(this.game.modifiers, true);
        builder.addSources("melvorD:firemakingBonfireInterval" /* ModifierIDs.firemakingBonfireInterval */ );
        return builder.getSpans();
    }
    /**
     * Attempts to light a bonfire for the given recipe
     * @param recipe The recipe to light a bonfire for. If unspecified, uses the currently selected logs
     * @returns True if the bonfire was successfully lit
     */
    lightBonfire(recipe) {
        if (recipe === undefined)
            recipe = this.selectedRecipe;
        if (recipe === undefined)
            return false;
        const isAbyssal = recipe.hasAbyssalBonfire;
        const bonfireCosts = new Costs(this.game);
        bonfireCosts.setSource(`Skill.${this.id}.Bonfire.${recipe.id}`);
        if (!this.game.modifiers.freeBonfires || isAbyssal) {
            bonfireCosts.addItem(recipe.log, recipe.bonfireCost);
        }
        if (bonfireCosts.checkIfOwned()) {
            const bonfireEvent = new BonfireLitEvent(this, recipe);
            this.litBonfireRecipe = recipe;
            this.bonfireTimer.start(this.getBonfireInterval(recipe));
            this.renderQueue.logInfo = true;
            this.renderQueue.bonfireStatus = true;
            this.renderQueue.bonfireProgress = true;
            this.renderQueue.bonfireInfo = true;
            this.renderQueue.bonfireQty = true;
            bonfireCosts.consumeCosts();
            this.recordCostConsumptionStats(bonfireCosts);
            this._events.emit('bonfireLit', bonfireEvent);
            this.game.stats.Firemaking.inc(FiremakingStats.BonfiresLit);
            return true;
        } else {
            notifyPlayer(this, getLangString('TOASTS_NO_LOGS_FOR_BONFIRE'), 'danger');
            return false;
        }
    }
    stopOilingMyLog() {
        if (this.oiledLogRecipe === undefined)
            return;
        this.oilTimer.stop();
        this.oiledLogRecipe = undefined;
        this.renderQueue.oilInfo = true;
        this.renderQueue.oilProgress = true;
        this.renderQueue.oilStatus = true;
        this.onOilingOfLogsStatusChange();
    }
    endOilingOfMyLog() {
        this.oiledLogRecipe = undefined;
        this.renderQueue.oilInfo = true;
        this.renderQueue.oilProgress = true;
        this.renderQueue.oilStatus = true;
        if (this.isActive) {
            this.oilMyLog();
        } else {
            this.onOilingOfLogsStatusChange();
        }
    }
    onOilingOfLogsStatusChange() {
        this.computeProvidedStats(true);
    }
    getOilingOfMyLogInterval(oil) {
        let interval = oil.oilInterval;
        //space for oil interval modifiers if added
        interval = roundToTickInterval(interval);
        return Math.max(250, interval);
    }
    oilMyLog() {
        const oil = this.selectedOil;
        if (oil === undefined) {
            this.onOilingOfLogsStatusChange();
            return;
        }
        const oilCosts = new Costs(this.game);
        oilCosts.setSource(`Skill.${this.id}.Oil.${oil.id}`);
        oilCosts.addItem(oil, this.activeRecipe.oilCost);
        if (oilCosts.checkIfOwned()) {
            //const bonfireEvent = new BonfireLitEvent(this, recipe);
            this.oiledLogRecipe = oil;
            this.onOilingOfLogsStatusChange();
            this.oilTimer.start(this.getOilingOfMyLogInterval(oil));
            this.renderQueue.oilProgress = true;
            this.renderQueue.oilStatus = true;
            this.renderQueue.oilQty = true;
            oilCosts.consumeCosts();
            this.recordCostConsumptionStats(oilCosts);
            //this._events.emit('bonfireLit', bonfireEvent);
            //this.game.stats.Firemaking.inc(FiremakingStats.BonfiresLit);
        } else {
            notifyPlayer(this, getLangString('TOASTS_NO_OIL_FOR_LOGS'), 'danger');
        }
    }
    resetActionState() {
        super.resetActionState();
        this.bonfireTimer.stop();
        this.oilTimer.stop();
        this.selectedRecipe = undefined;
        this.litBonfireRecipe = undefined;
        this.oiledLogRecipe = undefined;
        this.onOilingOfLogsStatusChange();
    }
    encode(writer) {
        super.encode(writer);
        this.bonfireTimer.encode(writer);
        writer.writeBoolean(this.isLogSelected);
        if (this.selectedRecipe !== undefined) {
            writer.writeNamespacedObject(this.selectedRecipe);
        }
        writer.writeBoolean(this.isBonfireActive);
        if (this.litBonfireRecipe !== undefined) {
            writer.writeNamespacedObject(this.litBonfireRecipe);
        }
        this.oilTimer.encode(writer);
        writer.writeBoolean(this.isOilingOfMyLogsActive);
        if (this.oiledLogRecipe !== undefined) {
            writer.writeNamespacedObject(this.oiledLogRecipe);
        }
        writer.writeBoolean(this.isOilSelected);
        if (this.selectedOil !== undefined) {
            writer.writeNamespacedObject(this.selectedOil);
        }
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.bonfireTimer.decode(reader, version);
        if (reader.getBoolean()) {
            const recipe = reader.getNamespacedObject(this.actions);
            if (typeof recipe === 'string')
                this.shouldResetAction = true;
            else
                this.selectedRecipe = recipe;
        }
        if (reader.getBoolean()) {
            const recipe = reader.getNamespacedObject(this.actions);
            if (typeof recipe === 'string')
                this.shouldResetAction = true;
            else
                this.litBonfireRecipe = recipe;
        }
        if (version >= 117 /* SaveVersion.OilYourLogs */ ) {
            this.oilTimer.decode(reader, version);
            if (reader.getBoolean()) {
                const recipe = reader.getNamespacedObject(this.game.items.firemakingOils);
                if (typeof recipe === 'string')
                    this.shouldResetAction = true;
                else
                    this.oiledLogRecipe = recipe;
            }
        }
        if (version >= 118 /* SaveVersion.FiremakingSelectedOil */ ) {
            if (reader.getBoolean()) {
                const recipe = reader.getNamespacedObject(this.game.items.firemakingOils);
                if (typeof recipe === 'string')
                    this.shouldResetAction = true;
                else
                    this.selectedOil = recipe;
            }
        }
        // Retroactive fix for issue #4793
        if (this.litBonfireRecipe !== undefined && !this.bonfireTimer.isActive) {
            this.litBonfireRecipe = undefined;
        }
        if (this.shouldResetAction)
            this.resetActionState();
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        this.bonfireTimer.deserialize(reader.getChunk(3), version);
        const getRecipe = (id) => {
            return this.actions.getObjectByID(idMap.firemakingRecipes[id]);
        };
        const selectedRecipeID = reader.getNumber();
        if (selectedRecipeID >= 0) {
            this.selectedRecipe = getRecipe(selectedRecipeID);
        }
        const litBonfireRecipeID = reader.getNumber();
        if (litBonfireRecipeID >= 0) {
            this.litBonfireRecipe = getRecipe(litBonfireRecipeID);
        }
        if ((this.isActive && this.selectedRecipe === undefined) ||
            (this.bonfireTimer.isActive && this.litBonfireRecipe === undefined))
            this.shouldResetAction = true;
        if (this.shouldResetAction)
            this.resetActionState();
    }
    setFromOldOffline(offline, idMap) {
        const log = this.actions.getObjectByID(idMap.firemakingRecipes[offline.action]);
        if (log !== undefined) {
            this.selectLog(log);
            this.burnLog();
        }
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.firemakingRecipes[oldActionID];
    }
    selectLog(recipe) {
        if (recipe.level > this.level || recipe.abyssalLevel > this.abyssalLevel) {
            notifyPlayer(this, getLangString('TOASTS_LEVEL_REQUIRED_TO_BURN'), 'danger');
        } else {
            if (this.selectedRecipe !== recipe && this.isActive && !this.stop())
                return;
            this.selectedRecipe = recipe;
            this.renderQueue.selectedLog = true;
            this.renderQueue.logQty = true;
            this.renderQueue.logInfo = true;
            this.renderQueue.bonfireStatus = true;
            this.renderQueue.bonfireInfo = true;
            this.renderQueue.actionMastery.add(recipe);
        }
    }
    selectOil(oil) {
        if (this.selectedOil !== oil)
            this.stopOilingMyLog();
        this.selectedOil = oil;
        this.renderQueue.selectedOil = true;
        this.renderQueue.oilQty = true;
    }
    render() {
        this.renderLogSelection();
        this.renderSelectedLog();
        this.renderSelectedOil();
        super.render();
        this.renderLogQuantity();
        this.renderLogInfo();
        this.renderFireProgress();
        this.renderBonfireStatus();
        this.renderBonfireInfo();
        this.renderBonfireProgress();
        this.renderBonfireQuantity();
        this.renderOilProgress();
        this.renderOilQuantities();
        this.renderOilStatus();
    }
    renderRealmVisibility() {
        if (this.renderQueue.realmVisibility.size === 0)
            return;
        this.renderQueue.realmVisibility.forEach((realm) => {
            if (spendMasteryMenu.curentSkill === this)
                spendMasteryMenu.updateRealmUnlock(realm);
            firemakingMenu.logs.updateRealmUnlock(realm);
        });
        this.renderQueue.realmVisibility.clear();
    }
    renderBonfireStatus() {
        if (!this.renderQueue.bonfireStatus)
            return;
        if (!this.isBonfireActive) {
            firemakingMenu.bonfire.setInactive();
        } else {
            firemakingMenu.bonfire.setActive();
        }
        this.renderQueue.bonfireStatus = false;
    }
    renderBonfireInfo() {
        if (!this.renderQueue.bonfireInfo)
            return;
        const bonfireLog = this.isBonfireActive ? this.activeBonfire : this.selectedRecipe;
        firemakingMenu.bonfire.updateInfo(this, bonfireLog);
        this.renderQueue.bonfireInfo = false;
    }
    renderBonfireQuantity() {
        if (!this.renderQueue.bonfireQty)
            return;
        if (this.isBonfireActive)
            firemakingMenu.bonfire.updateItemQuantity(this.game, this.activeBonfire);
        this.renderQueue.bonfireQty = false;
    }
    renderFireProgress() {
        if (!this.renderQueue.progressBar)
            return;
        if (this.isActive)
            firemakingMenu.logs.progressBar.animateProgressFromTimer(this.actionTimer);
        else
            firemakingMenu.logs.progressBar.stopAnimation();
        this.renderQueue.progressBar = false;
    }
    renderBonfireProgress() {
        if (!this.renderQueue.bonfireProgress)
            return;
        if (this.isBonfireActive) {
            if (this.isActive)
                firemakingMenu.bonfire.progressBar.animateProgressFromTimer(this.bonfireTimer);
            else
                firemakingMenu.bonfire.progressBar.setFixedPosition(this.bonfireTimer.progress * 100);
        } else {
            firemakingMenu.bonfire.progressBar.stopAnimation();
        }
        this.renderQueue.bonfireProgress = false;
    }
    renderOilProgress() {
        if (!this.renderQueue.oilProgress)
            return;
        if (this.isOilingOfMyLogsActive) {
            if (this.isActive)
                firemakingMenu.oil.progressBar.animateProgressFromTimer(this.oilTimer);
            else
                firemakingMenu.oil.progressBar.setFixedPosition(this.oilTimer.progress * 100);
        } else {
            firemakingMenu.oil.progressBar.stopAnimation();
        }
        this.renderQueue.oilProgress = false;
    }
    renderOilStatus() {
        if (!this.renderQueue.oilStatus)
            return;
        if (!this.isOilingOfMyLogsActive) {
            firemakingMenu.oil.setInactive();
        } else {
            firemakingMenu.oil.setActive();
        }
        this.renderQueue.oilStatus = false;
    }
    renderSelectedLog() {
        if (!this.renderQueue.selectedLog)
            return;
        if (this.selectedRecipe === undefined) {
            firemakingMenu.logs.setUnselected();
        } else {
            firemakingMenu.logs.setLog(this.game, this, this.selectedRecipe);
        }
        this.renderQueue.selectedLog = false;
    }
    renderSelectedOil() {
        if (!this.renderQueue.selectedOil)
            return;
        if (this.selectedOil === undefined) {
            firemakingMenu.oil.setUnselected();
        } else {
            firemakingMenu.oil.setOil(this.game, this, this.selectedOil);
        }
        this.renderQueue.selectedOil = false;
    }
    renderLogQuantity() {
        if (!this.renderQueue.logQty)
            return;
        firemakingMenu.logs.updateQuantities(this.game);
        this.renderQueue.logQty = false;
    }
    renderLogSelection() {
        if (!this.renderQueue.logSelection)
            return;
        firemakingMenu.logs.updateOptions(this.game, this);
        this.renderQueue.logSelection = false;
    }
    renderOilQuantities() {
        if (!this.renderQueue.oilQty)
            return;
        firemakingMenu.oil.updateQuantities(this.game);
        this.renderQueue.oilQty = false;
    }
    renderOilSelection() {
        firemakingMenu.oil.updateOptions(this.game, this);
    }
    renderLogInfo() {
        if (!this.renderQueue.logInfo)
            return;
        const recipe = this.selectedRecipe;
        if (recipe !== undefined) {
            firemakingMenu.logs.updateLogInfo(this.game, this, recipe);
            firemakingMenu.bonfire.updateInfo(this, recipe);
        }
        this.renderQueue.logInfo = false;
    }
    renderOilInfo() {
        if (!this.renderQueue.oilInfo)
            return;
        const oil = this.selectedOil;
        if (oil !== undefined) {
            const oilCost = this.activeRecipe !== undefined ? this.activeRecipe.oilCost : 10;
            firemakingMenu.oil.updateInfo(this, oil, oilCost);
        }
        this.renderQueue.oilInfo = false;
    }
    getBestMasteryRealm() {
        if (this.selectedRecipe !== undefined)
            return this.selectedRecipe.realm;
        return super.getBestMasteryRealm();
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        this.primaryProducts.forEach((product) => obtainable.add(product.item));
        this.secondaryProducts.forEach((product) => obtainable.add(product.item));
        return obtainable;
    }
    getRegistry(type) {
        switch (type) {
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
                case ScopeSourceType.Action:
                    return skillData.logs;
            }
        }
    }
}
class FiremakingRenderQueue extends GatheringSkillRenderQueue {
    constructor() {
        super(...arguments);
        this.logSelection = false;
        this.selectedLog = false;
        this.bonfireProgress = false;
        this.bonfireStatus = false;
        this.bonfireInfo = false;
        this.bonfireQty = false;
        this.logQty = false;
        this.logInfo = false;
        this.selectedOil = false;
        this.oilQty = false;
        this.oilProgress = false;
        this.oilInfo = false;
        this.oilStatus = false;
    }
}
//# sourceMappingURL=firemakingTicks.js.map
checkFileVersion('?12097')