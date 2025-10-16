"use strict";
class SummoningCategory extends SkillCategory {
    constructor(namespace, data, skill, game) {
        super(namespace, data, skill, game);
        this.type = data.type;
    }
}
class SummoningRecipe extends CategorizedArtisanRecipe {
    constructor(namespace, data, game, skill) {
        super(namespace, data, game, skill);
        /** The maximum Summoning Mark level this familiar can reach */
        this.maxMarkLevel = Summoning.markLevels.length;
        try {
            this._markMedia = data.markMedia;
            this.product = game.items.equipment.getObjectSafe(data.productID);
            this.baseQuantity = data.baseQuantity;
            this.nonShardItemCosts = game.items.getArrayFromIds(data.nonShardItemCosts);
            this.tier = data.tier;
            this.skills = game.skills.getArrayFromIds(data.skillIDs);
            if (data.maxMarkLevel !== undefined)
                this.maxMarkLevel = data.maxMarkLevel;
        } catch (e) {
            throw new DataConstructionError(SummoningRecipe.name, e, this.id);
        }
    }
    get name() {
        return this.product.name;
    }
    get media() {
        return this.product.media;
    }
    get markMedia() {
        return this.getMediaURL(this._markMedia);
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            if (data.nonShardItemCosts !== undefined) {
                if (data.nonShardItemCosts.remove !== undefined) {
                    const removals = data.nonShardItemCosts.remove;
                    this.nonShardItemCosts = this.nonShardItemCosts.filter((item) => !removals.includes(item.id));
                }
                if (data.nonShardItemCosts.add !== undefined) {
                    this.nonShardItemCosts.push(...game.items.getArrayFromIds(data.nonShardItemCosts.add));
                }
            }
            if (data.tier !== undefined)
                this.tier = data.tier;
            if (data.skillIDs !== undefined) {
                if (data.skillIDs.remove !== undefined) {
                    const removals = data.skillIDs.remove;
                    this.skills = this.skills.filter((skill) => !removals.includes(skill.id));
                }
                if (data.skillIDs.add !== undefined) {
                    this.skills.push(...game.skills.getArrayFromIds(data.skillIDs.add));
                }
            }
            if (data.maxMarkLevel !== undefined)
                this.maxMarkLevel = data.maxMarkLevel;
        } catch (e) {
            throw new DataModificationError(SummoningRecipe.name, e, this.id);
        }
    }
}
class DummySummoningRecipe extends SummoningRecipe {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            markMedia: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
            nonShardItemCosts: [],
            tier: 1,
            skillIDs: [],
            productID: game.emptyEquipmentItem.id,
            baseQuantity: 0,
            categoryID: "melvorD:Marks" /* SummoningCategoryIDs.Marks */ ,
            itemCosts: [],
            baseExperience: -1,
            level: -1,
        }, game, game.summoning);
    }
}
class SummoningSynergy {
    constructor(data, game, summoning) {
        this.modifiers = [];
        try {
            if (data.conditionalModifiers !== undefined)
                this.conditionalModifiers = data.conditionalModifiers.map((conditionalData) => new ConditionalModifier(conditionalData, game));
            if (data.combatEffects !== undefined)
                this.combatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(data.combatEffects);
            const summon0 = summoning.actions.getObjectSafe(data.summonIDs[0]);
            const summon1 = summoning.actions.getObjectSafe(data.summonIDs[1]);
            if (summon0 === summon1)
                throw new Error(`Cannot have synergy where both summons are identical.`);
            this.summons = [summon0, summon1];
            this.consumesOn = data.consumesOn.map((data) => game.events.constructMatcher(data));
            if (data.customDescription !== undefined)
                this._customDescription = data.customDescription;
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(SummoningSynergy.name, e);
        }
    }
    get description() {
        if (this._customDescription !== undefined) {
            // TODO: Fix these descriptions so they include numberMultiplier or similar adjustments.
            return getLangString(`SUMMONING_SYNERGY_DESC_${this.summons[0].localID}_${this.summons[1].localID}`);
            // TODO: Make modded summoning synergies able to use the _customDescription property
        } else {
            const descriptions = StatObject.formatDescriptions(this, plainDescriptionFormatter);
            return joinAsLineBreakList(descriptions);
        }
    }
    get name() {
        return templateLangString('SUMMONING_SYNERGY_COMBINED', {
            summonName1: this.summons[0].name,
            summonName2: this.summons[1].name,
        });
    }
    registerSoftDependencies(data, game) {
        try {
            this.modifiers = game.getModifierValuesFromData(data.modifiers);
            if (data.enemyModifiers !== undefined)
                this.enemyModifiers = game.getEnemyModifierValuesFromData(data.enemyModifiers);
        } catch (e) {
            throw new DataConstructionError(SummoningSynergy.name, e, `${this.summons[0].id}-${this.summons[1].id}`);
        }
    }
}
class Summoning extends ArtisanSkill {
    constructor(namespace, game) {
        super(namespace, 'Summoning', game, SummoningRecipe.name);
        this._media = "assets/media/skills/summoning/summoning.png" /* Assets.Summoning */ ;
        this.baseInterval = 5000;
        this.selectionTabs = summoningSelectionTabs;
        this.renderQueue = new SummoningRenderQueue();
        this.synergies = [];
        this.synergiesByItem = new Map();
        this.recipesByProduct = new Map();
        /** Maps Skills -> Realms -> SummoningRecipes for quick access when rolling for marks. Populated after data registration. */
        this.recipesBySkillAndRealm = new Map();
        /** Stores the non-shard costs selected for a recipe */
        this.selectedNonShardCosts = new Map();
        /** Stores the number of each mark that has been unlocked */
        this.marksUnlocked = new Map();
        this.categories = new NamespaceRegistry(game.registeredNamespaces, 'SummoningCategory');
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    /** Returns the total number of synergies unlocked */
    get totalSynergiesUnlocked() {
        return this.synergies.reduce((prev, synergy) => {
            if (this.isSynergyUnlocked(synergy))
                prev++;
            return prev;
        }, 0);
    }
    get menu() {
        return summoningArtisanMenu;
    }
    get categoryMenu() {
        return summoningCategoryMenu;
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
            throw new Error('Tried to access active recipe, but none is selected.');
        return this.selectedRecipe;
    }
    get masteryModifiedInterval() {
        return 4850;
    }
    /** Gets the non-shard cost set for the currently selected recipe */
    get activeNonShardCost() {
        var _a;
        return (_a = this.selectedNonShardCosts.get(this.activeRecipe)) !== null && _a !== void 0 ? _a : this.activeRecipe.nonShardItemCosts[0];
    }
    get totalMarksDiscovered() {
        let total = 0;
        this.marksUnlocked.forEach((count, mark) => {
            total += count;
        });
        return total;
    }
    registerData(namespace, data) {
        var _a, _b, _c;
        (_a = data.categories) === null || _a === void 0 ? void 0 : _a.forEach((category) => {
            this.categories.registerObject(new SummoningCategory(namespace, category, this, this.game));
        });
        (_b = data.recipes) === null || _b === void 0 ? void 0 : _b.forEach((recipe) => {
            this.actions.registerObject(new SummoningRecipe(namespace, recipe, this.game, this));
        });
        super.registerData(namespace, data);
        (_c = data.synergies) === null || _c === void 0 ? void 0 : _c.forEach((synergyData) => {
            const synergy = new SummoningSynergy(synergyData, this.game, this);
            const summon0 = synergy.summons[0];
            const summon1 = synergy.summons[1];
            let summon0Map = this.synergiesByItem.get(summon0.product);
            let summon1Map = this.synergiesByItem.get(summon1.product);
            if ((summon0Map === null || summon0Map === void 0 ? void 0 : summon0Map.get(summon1.product)) !== undefined)
                throw new Error(`Error registering summon synergy between ${summon0.id} and ${summon1.id}. Synergy already exists.`);
            if (summon0Map === undefined) {
                summon0Map = new Map();
                this.synergiesByItem.set(summon0.product, summon0Map);
            }
            if (summon1Map === undefined) {
                summon1Map = new Map();
                this.synergiesByItem.set(summon1.product, summon1Map);
            }
            summon0Map.set(summon1.product, synergy);
            summon1Map.set(summon0.product, synergy);
            this.synergies.push(synergy);
        });
    }
    modifyData(data) {
        var _a;
        super.modifyData(data);
        (_a = data.recipes) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const recipe = this.actions.getObjectByID(modData.id);
            if (recipe === undefined)
                throw new UnregisteredDataModError(SummoningRecipe.name, modData.id);
            recipe.applyDataModification(modData, this.game);
        });
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.actions.forEach((recipe) => {
            this.recipesByProduct.set(recipe.product, recipe);
            recipe.skills.forEach((skill) => {
                let realmMap = this.recipesBySkillAndRealm.get(skill);
                if (realmMap === undefined) {
                    realmMap = new Map();
                    this.recipesBySkillAndRealm.set(skill, realmMap);
                }
                let recipeArray = realmMap.get(recipe.realm);
                if (recipeArray === undefined) {
                    recipeArray = [];
                    realmMap.set(recipe.realm, recipeArray);
                }
                recipeArray.push(recipe);
            });
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
    addXPForTabletConsumption(tablet, interval) {
        const recipe = this.recipesByProduct.get(tablet);
        if (recipe !== undefined) {
            if (recipe.baseExperience > 0) {
                const xpBefore = this.xp;
                const levelBefore = this.level;
                this.addXP(Summoning.getTabletConsumptionXP(recipe, interval));
                this.game.telemetry.createOnlineXPGainEvent(this, interval, xpBefore, this.xp, levelBefore, this.level);
            }
            if (recipe.baseAbyssalExperience > 0) {
                const xpBefore = this.abyssalXP;
                const levelBefore = this.abyssalLevel;
                this.addAbyssalXP(Summoning.getTabletConsumptionAXP(recipe, interval));
                this.game.telemetry.createOnlineAXPGainEvent(this, interval, xpBefore, this.abyssalXP, levelBefore, this.abyssalLevel);
            }
        }
    }
    resetToDefaultSelectedRecipeBasedOnRealm() {
        super.resetToDefaultSelectedRecipeBasedOnRealm();
        if (this.selectedRecipe !== undefined)
            switchSummoningCategory(this.selectedRecipe.category);
    }
    updateRealmSelection() {
        summoningCategoryMenu.setCurrentRealm(game.summoning.currentRealm);
        summoningCategoryMenu.addOptions(game.summoning.categories.allObjects, getLangString('MENU_TEXT_SELECT_SUMMONING_CATEGORY'), switchSummoningCategory);
    }
    getRecipeFromProduct(product) {
        return this.recipesByProduct.get(product);
    }
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.actions.forEach((recipe) => {
            if (this.level >= recipe.level && this.abyssalLevel >= recipe.abyssalLevel)
                this.renderQueue.markState.add(recipe);
        });
    }
    getErrorLog() {
        const altRecipeLog = [];
        this.selectedNonShardCosts.forEach((altID, recipe) => {
            altRecipeLog.push(`${recipe.id}: ${altID}`);
        });
        return `${super.getErrorLog()}
Selected Alt Recipes (Mastery ID | altID):
${altRecipeLog.join('\n')}`;
    }
    getMarkSnapshot() {
        return new Map(this.marksUnlocked);
    }
    getNonShardCostReduction(recipe, item) {
        if (recipe.id === "melvorF:Salamander" /* SummoningRecipeIDs.Salamander */ &&
            this.game.modifiers.disableSalamanderItemReduction &&
            item !== undefined)
            return 0;
        let modifier = this.getUncappedCostReduction(recipe, item);
        modifier += this.game.modifiers.getValue("melvorD:nonShardSummoningCostReduction" /* ModifierIDs.nonShardSummoningCostReduction */ , this.getActionModifierQuery(recipe));
        return Math.min(80, modifier);
    }
    modifyNonShardItemCost(item, quantity, recipe) {
        const costReduction = this.getNonShardCostReduction(recipe, item);
        quantity *= 1 - costReduction / 100;
        quantity = Math.ceil(quantity);
        quantity -= this.getFlatCostReduction(recipe, item);
        return Math.max(1, quantity);
    }
    getFlatCostReduction(recipe, item) {
        let reduction = super.getFlatCostReduction(recipe, item);
        if (item !== undefined && item.type === 'Shard') {
            reduction -= this.game.modifiers.getValue("melvorD:flatSummoningShardCost" /* ModifierIDs.flatSummoningShardCost */ , this.getActionModifierQuery(recipe));
            if (recipe !== undefined) {
                switch (recipe.tier) {
                    case 1:
                        reduction -= this.game.modifiers.flatTier1SummoningShardCost;
                        break;
                    case 2:
                        reduction -= this.game.modifiers.flatTier2SummoningShardCost;
                        break;
                    case 3:
                        reduction -= this.game.modifiers.flatTier3SummoningShardCost;
                        break;
                }
            }
        }
        return reduction;
    }
    modifyCurrencyCost(currency, quantity, recipe) {
        const costReduction = this.getNonShardCostReduction(recipe);
        quantity *= 1 - costReduction / 100;
        quantity = Math.ceil(quantity);
        quantity -= this.getFlatCostReduction(recipe);
        return Math.max(1, quantity);
    }
    /** Adds the Non shard costs of making a summoning tablet */
    addNonShardCosts(recipe, item, costs) {
        const salePrice = Math.max(20, item.sellsFor.quantity);
        const recipeCost = item.sellsFor.currency.id === "melvorItA:AbyssalPieces" /* CurrencyIDs.AbyssalPieces */ ? Summoning.recipeAPCost : Summoning.recipeGPCost;
        const baseQuantity = recipeCost / salePrice;
        const qtyToAdd = this.modifyNonShardItemCost(item, baseQuantity, recipe);
        costs.addItem(item, qtyToAdd);
    }
    getActionModifierQueryParams(action) {
        const scope = super.getActionModifierQueryParams(action);
        if (action instanceof SummoningRecipe) {
            scope.category = action.category;
        }
        return scope;
    }
    onLoad() {
        super.onLoad();
        this.actions.forEach((recipe) => this.renderQueue.markState.add(recipe));
        summoningSearchMenu.initialize();
        const category = this.categories.find((category) => category.realm === this.currentRealm);
        if (category !== undefined)
            switchSummoningCategory(category);
    }
    onEquipmentChange() {
        this.renderQueue.synergyQuantities = true;
        super.onEquipmentChange();
    }
    render() {
        super.render();
        this.renderMarkState();
        this.renderMarkProgress();
        this.renderSynergyUnlock();
        this.renderSynergyQuantity();
    }
    /** Gets the costs for a specific alt recipe */
    getAltRecipeCosts(recipe, nonShardItem) {
        const costs = super.getRecipeCosts(recipe);
        if (recipe.nonShardItemCosts.length > 0)
            this.addNonShardCosts(recipe, nonShardItem, costs);
        return costs;
    }
    getRecipeCosts(recipe) {
        var _a;
        return this.getAltRecipeCosts(recipe, (_a = this.selectedNonShardCosts.get(recipe)) !== null && _a !== void 0 ? _a : recipe.nonShardItemCosts[0]);
    }
    /** Callback function for selecting an alternative recipe */
    selectNonShardCostOnClick(index) {
        const item = this.activeRecipe.nonShardItemCosts[index];
        if (item !== this.activeNonShardCost && this.isActive && !this.stop())
            return;
        this.selectedNonShardCosts.set(this.activeRecipe, item);
        this.renderQueue.selectedRecipe = true;
        this.render();
    }
    renderSelectedRecipe() {
        if (!this.renderQueue.selectedRecipe)
            return;
        if (this.selectedRecipe !== undefined) {
            if (this.activeRecipe.nonShardItemCosts.length > 1) {
                this.menu.setRecipeDropdown(this.activeRecipe.nonShardItemCosts.map((item, i) => {
                    const costs = this.getAltRecipeCosts(this.activeRecipe, item);
                    return {
                        items: costs.getItemQuantityArray(),
                        currencies: costs.getCurrencyQuantityArray(),
                    };
                }), (recipeID) => () => this.selectNonShardCostOnClick(recipeID));
                this.menu.showRecipeDropdown();
            } else {
                this.menu.hideRecipeDropdown();
            }
        } else {
            this.menu.hideRecipeDropdown();
        }
        super.renderSelectedRecipe();
    }
    renderMarkState() {
        if (this.renderQueue.markState.size === 0)
            return;
        this.renderQueue.markState.forEach((mark) => {
            summoningMarkMenu.updateMarkState(mark, this);
        });
        this.renderQueue.markState.clear();
    }
    renderMarkProgress() {
        if (this.renderQueue.markCount.size === 0)
            return;
        this.renderQueue.markCount.forEach((mark) => {
            summoningMarkMenu.updateDiscoveryCount(mark);
        });
        this.renderQueue.markCount.clear();
    }
    renderSynergyUnlock() {
        if (!this.renderQueue.synergyUnlock)
            return;
        if (summoningSearchMenu.offsetParent !== null)
            summoningSearchMenu.updateVisibleElementUnlocks();
        this.renderQueue.synergyUnlock = false;
    }
    renderSynergyQuantity() {
        if (!this.renderQueue.synergyQuantities)
            return;
        if (summoningSearchMenu.offsetParent !== null)
            summoningSearchMenu.updateVisibleElementQuantities();
        this.renderQueue.synergyQuantities = false;
    }
    queueMarkDiscoveryModal(mark) {
        if (!this.game.settings.showSummoningMarkDiscoveryModals || loadingOfflineProgress)
            return;
        if (!game.settings.useLegacyNotifications)
            this.game.notifications.createSummoningMarkNotification(mark);
        else {
            const discoveryCount = this.getMarkCount(mark);
            let html = `<small class="text-info">${getLangString('MENU_TEXT_MARK_DISCOVERED_TEXT0')}<br><br>${getLangString('MENU_TEXT_MARK_DISCOVERED_TEXT1')}</small>`;
            if (discoveryCount > 1)
                html = `<small class="text-info">${templateLangString('MENU_TEXT_MARK_DISCOVERED_TEXT2', {
                    markName: `<span class="font-w700 text-success">${this.getMarkName(mark)}</span>`,
                })}<br><br>${getLangString('MENU_TEXT_MARK_DISCOVERED_TEXT3')}</small>`;
            const modal = {
                title: getLangString('MENU_TEXT_MARK_DISCOVERED'),
                html: html,
                imageUrl: mark.markMedia,
                imageWidth: 64,
                imageHeight: 64,
                imageAlt: getLangString('MENU_TEXT_MARK_DISCOVERED'),
            };
            addModalToQueue(modal);
        }
    }
    queueMarkLevelUpModal(mark) {
        const markLevel = this.getMarkLevel(mark);
        const title = templateLangString('MENU_TEXT_MARK_LEVEL', {
            level: `${markLevel}`
        });
        let html = `<small>${templateLangString('MENU_TEXT_MARK_LEVELUP_TEXT0', {
            markName: `<span class="font-w700 text-success">${this.getMarkName(mark)}</span>`,
        })}<br><br>${getLangString('MENU_TEXT_MARK_LEVELUP_TEXT1')}<br><br><span class="font-w700 text-warning">${getLangString('MENU_TEXT_MARK_LEVELUP_TEXT2')}</span></small>`;
        if (markLevel >= 2) {
            html = `<small>${templateLangString('MENU_TEXT_MARK_LEVELUP_TEXT3', {
                markName: `<span class="font-w700 text-success">${this.getMarkName(mark)}</span>`,
            })}<br><br>${templateLangString('MENU_TEXT_MARK_LEVELUP_TEXT4', {
                tierNum: `${markLevel - 1}`,
                markLevel: `${markLevel}`,
            })}</small>`;
        }
        const modal = {
            title: title,
            html: html,
            imageUrl: mark.markMedia,
            imageWidth: 64,
            imageHeight: 64,
            imageAlt: title,
        };
        addModalToQueue(modal);
    }
    onMasteryLevelUp(action, oldLevel, newLevel) {
        super.onMasteryLevelUp(action, oldLevel, newLevel);
        if (this.selectedRecipe === action)
            this.renderQueue.selectedRecipe = true;
    }
    recordCostPreservationStats(costs) {
        super.recordCostPreservationStats(costs);
        costs.recordBulkItemStat(this.game.stats.Summoning, SummoningStats.ItemsPreserved);
    }
    recordCostConsumptionStats(costs) {
        super.recordCostConsumptionStats(costs);
        costs.recordBulkItemStat(this.game.stats.Summoning, SummoningStats.ItemsUsed);
    }
    preAction() {}
    get actionRewards() {
        const rewards = new Rewards(this.game);
        const recipe = this.activeRecipe;
        rewards.setActionInterval(this.actionInterval);
        const actionEvent = new SummoningActionEvent(this, recipe, this.activeNonShardCost);
        // Main product
        const item = recipe.product;
        const qtyToAdd = this.modifyPrimaryProductQuantity(item, this.unmodifiedActionQuantity, recipe);
        if (qtyToAdd > 0) {
            rewards.addItem(item, qtyToAdd);
            this.addCurrencyFromPrimaryProductGain(rewards, item, qtyToAdd, recipe);
        }
        actionEvent.productQuantity = qtyToAdd;
        this.game.stats.Summoning.add(SummoningStats.ItemsMade, qtyToAdd);
        // XP Reward
        rewards.addXP(this, this.actionXP, recipe);
        rewards.addAbyssalXP(this, this.actionAbyssalXP, recipe);
        this.addCommonRewards(rewards, recipe);
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    postAction() {
        this.game.stats.Summoning.inc(SummoningStats.Actions);
        this.game.stats.Summoning.add(SummoningStats.TimeSpent, this.currentActionInterval);
        this.renderQueue.recipeInfo = true;
        this.renderQueue.quantities = true;
    }
    encode(writer) {
        super.encode(writer);
        writer.writeMap(this.selectedNonShardCosts, writeNamespaced, writeNamespaced);
        writer.writeMap(this.marksUnlocked, writeNamespaced, (value, writer) => writer.writeUint8(value));
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        if (version < 107 /* SaveVersion.SkillDataModifications */ ) {
            const oldSelection = reader.getMap(readNamespacedReject(this.actions), (reader) => reader.getUint8());
            oldSelection.forEach((index, recipe) => {
                const item = recipe.nonShardItemCosts[index];
                if (item !== undefined)
                    this.selectedNonShardCosts.set(recipe, item);
            });
        } else {
            this.selectedNonShardCosts = reader.getMap(readNamespacedReject(this.actions), readNamespacedReject(this.game.items));
        }
        this.marksUnlocked = reader.getMap((reader) => {
            const mark = reader.getNamespacedObject(this.actions);
            if (typeof mark === 'string') {
                if (mark.startsWith('melvor'))
                    return this.actions.getDummyObject(mark, DummySummoningRecipe, this.game);
                else
                    return undefined;
            } else
                return mark;
        }, (reader) => reader.getUint8());
        // Ensure that the selected non shard costs are actually available to the recipe
        this.selectedNonShardCosts.forEach((item, recipe) => {
            if (!recipe.nonShardItemCosts.includes(item))
                this.selectedNonShardCosts.delete(recipe);
        });
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        const getRecipe = (id) => {
            return this.actions.getObjectByID(idMap.summoningMarks[id]);
        };
        const numSetAlts = reader.getNumber();
        for (let i = 0; i < numSetAlts; i++) {
            const recipe = getRecipe(reader.getNumber());
            const altID = reader.getNumber();
            if (recipe !== undefined) {
                const item = recipe.nonShardItemCosts[altID];
                if (item !== undefined)
                    this.selectedNonShardCosts.set(recipe, item);
            }
        }
        const numMarksUnlocked = reader.getNumber();
        for (let i = 0; i < numMarksUnlocked; i++) {
            const recipeID = idMap.summoningMarks[reader.getNumber()];
            let recipe = this.actions.getObjectByID(recipeID);
            if (recipe === undefined)
                recipe = this.actions.getDummyObject(recipeID, DummySummoningRecipe, this.game);
            this.marksUnlocked.set(recipe, reader.getNumber());
        }
    }
    /** Sets object data using the old summoningData variable */
    convertFromOldFormat(summoningData, idMap) {
        Object.entries(summoningData.MarksDiscovered).forEach(([key, count]) => {
            const markID = parseInt(key);
            const newID = idMap.summoningMarks[markID];
            let mark = this.actions.getObjectByID(newID);
            if (mark === undefined)
                mark = this.actions.getDummyObject(newID, DummySummoningRecipe, this.game);
            if (count <= 0)
                return;
            this.marksUnlocked.set(mark, count);
        });
        if (summoningData.defaultRecipe === undefined)
            return;
        Object.entries(summoningData.defaultRecipe).forEach(([key, altID]) => {
            const markID = parseInt(key);
            const mark = this.actions.getObjectByID(idMap.summoningMarks[markID]);
            if (mark === undefined || altID <= 0 || altID >= mark.nonShardItemCosts.length)
                return;
            this.selectedNonShardCosts.set(mark, mark.nonShardItemCosts[altID]);
        });
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.summoningMarks[oldActionID];
    }
    setFromOldOffline(offline, idMap) {
        const recipe = this.actions.getObjectByID(idMap.summoningMarks[offline.action]);
        if (recipe !== undefined) {
            this.selectRecipeOnClick(recipe);
            this.createButtonOnClick();
        }
    }
    /** Gets the number of times a mark has been discovered */
    getMarkCount(mark) {
        var _a;
        return (_a = this.marksUnlocked.get(mark)) !== null && _a !== void 0 ? _a : 0;
    }
    /** Gets the media string of the mark. Returns question mark if undiscovered. */
    getMarkImage(mark) {
        let media;
        if (this.getMarkCount(mark) <= 0) {
            media = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        } else {
            media = mark.markMedia;
        }
        return media;
    }
    /** Gets the mark name of the mark. Returns question marks if undiscovered or the level requirement is not met. */
    getMarkName(mark) {
        if (this.level < mark.level || this.getMarkCount(mark) === 0) {
            return getLangString('MENU_TEXT_QUESTION_MARKS');
        } else {
            return templateString(getLangString('MENU_TEXT_MARK_OF_THE'), {
                familiarName: mark.product.name
            });
        }
    }
    /** Gets the level of the mark */
    getMarkLevel(mark) {
        const count = this.getMarkCount(mark);
        const index = Summoning.markLevels.findIndex((countRequired) => count < countRequired);
        if (index === -1)
            return Summoning.markLevels.length;
        else
            return index;
    }
    /** Gets a summoning synergy between 2 items. Returns undefined if the synergy does not exist */
    getSynergy(summon1, summon2) {
        var _a;
        return (_a = this.synergiesByItem.get(summon1)) === null || _a === void 0 ? void 0 : _a.get(summon2);
    }
    /** Gets a summoning synergy between 2 items if it is unlocked. Returns undefined if the synergy does not exist or is not unlocked*/
    getUnlockedSynergy(summon1, summon2) {
        const synergyData = this.getSynergy(summon1, summon2);
        if (synergyData !== undefined && this.isSynergyUnlocked(synergyData))
            return synergyData;
        return undefined;
    }
    /** Checks if the synergy is unlocked */
    isSynergyUnlocked(synergy) {
        const mark1 = synergy.summons[0];
        const mark2 = synergy.summons[1];
        return (this.game.modifiers.unlockAllSummoningSynergies > 0 ||
            this.game.summoning.hasMasterRelic(this.game.defaultRealm) ||
            (mark1.tier < this.getMarkLevel(mark2) && mark2.tier < this.getMarkLevel(mark1)));
    }
    /** Gets the chance to roll for a given mark */
    getChanceForMark(mark, skill, modifiedInterval) {
        let equippedModifier = 1;
        if (this.game.combat.player.equipment.checkForItem(mark.product)) {
            if (skill.hasMastery)
                equippedModifier = 2.5;
            else
                equippedModifier = 2;
        }
        return (equippedModifier * modifiedInterval) / (2000 * Math.pow(mark.tier + 1, 2));
    }
    /** Rolls for a summoning mark.*/
    rollForMark(mark, skill, modifiedInterval) {
        const markLevel = this.getMarkLevel(mark);
        const levelReqTooLow = mark.realm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ? this.abyssalLevel < mark.abyssalLevel : this.level < mark.level;
        const cantRoll = levelReqTooLow || // Summoning level too low
            !mark.skills.includes(skill) || // Skill does not belong to this mark
            (markLevel > 0 && this.game.stats.itemFindCount(mark.product) < 1) || // Mark was unlocked, but tablet has not been made yet
            markLevel >= mark.maxMarkLevel; // Mark is already at maximum level
        if (!cantRoll && rollPercentage(this.getChanceForMark(mark, skill, modifiedInterval))) {
            this.discoverMark(mark);
        }
    }
    discoverMark(mark) {
        const prevLevel = this.getMarkLevel(mark);
        this.marksUnlocked.set(mark, this.getMarkCount(mark) + 1);
        const curLevel = this.getMarkLevel(mark);
        this.queueMarkDiscoveryModal(mark);
        if (prevLevel !== curLevel) {
            this.queueMarkLevelUpModal(mark);
            this.renderQueue.markState.add(mark);
            this.renderQueue.synergyUnlock = true;
            // Update player stats if the mark is equipped
            if (this.game.combat.player.equipment.checkForItem(mark.product))
                this.game.combat.computeAllStats();
            if (curLevel === 1)
                this.renderQueue.selectionTabs = true;
            this.checkForPetMark();
        } else {
            this.renderQueue.markCount.add(mark);
        }
    }
    /** Checks if the player meets the conditions for the pet "Mark" */
    checkForPetMark() {
        const baseGameActions = this.actions.namespaceMaps.get("melvorF" /* Namespaces.Full */ );
        if (baseGameActions === undefined)
            return;
        let unlock = true;
        for (const [_, mark] of baseGameActions) {
            if (this.getMarkCount(mark) < Summoning.markLevels[3]) {
                unlock = false;
                break;
            }
        }
        if (unlock)
            this.game.petManager.unlockPetByID("melvorF:Mark" /* PetIDs.Mark */ );
    }
    /**
     * Rolls for all the summoning marks applicable for the given skill
     * @param skill The skill to roll marks for
     * @param modifiedInterval The interval to use to compute the chance for a mark
     * @param realm The realm that marks must belong to
     */
    rollMarksForSkill(skill, modifiedInterval, realm = this.game.defaultRealm) {
        if (!skill.isUnlocked)
            return;
        const realmMap = this.recipesBySkillAndRealm.get(skill);
        if (realmMap === undefined)
            return;
        const recipes = realmMap.get(realm);
        if (recipes !== undefined)
            recipes.forEach((mark) => {
                this.rollForMark(mark, skill, modifiedInterval);
            });
    }
    getMarkForSkill(skill) {
        var _a;
        const realmMap = this.recipesBySkillAndRealm.get(skill);
        if (realmMap === undefined)
            return undefined;
        const recipes = (_a = realmMap.get(skill.currentRealm)) !== null && _a !== void 0 ? _a : realmMap.get(game.defaultRealm);
        if (recipes === undefined)
            return undefined;
        return recipes[0];
    }
    testTranslations() {
        super.testTranslations();
        this.synergies.forEach((synergy) => {
            synergy.description;
        });
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
    /** Returns the summoning xp to be given for consuming a summoning tablet */
    static getTabletConsumptionXP(summon, interval) {
        return ((interval / 1000) * summon.level) / ((summon.level + 10) / 10);
    }
    /** Returns the Abyssal Summoning XP to be given for consuming a summoning tablet */
    static getTabletConsumptionAXP(summon, interval) {
        const value = summon.abyssalLevel + 120;
        return (value * summon.abyssalLevel) / 2;
    }
    static updateSearchArray() {
        Summoning.searchArray = game.summoning.synergies.map((synergy) => {
            const name1 = synergy.summons[0].product.name;
            const name2 = synergy.summons[1].product.name;
            return {
                synergy,
                description: synergy.description,
                name1,
                name2,
                name1long: templateLangString('MENU_TEXT_THE_FAMILIAR', {
                    name: name1
                }),
                name2long: templateLangString('MENU_TEXT_THE_FAMILIAR', {
                    name: name2
                }),
            };
        });
    }
}
/** GP value required for non shard costs */
Summoning.recipeGPCost = 1000;
/** AP value required for non shard costs */
Summoning.recipeAPCost = 5000;
/** Number of mark discoveries required for each level */
Summoning.markLevels = [1, 6, 16, 31, 46, 61];
Summoning.searchArray = [];

function localizeSummoning() {
    summoningSelectionTabs.forEach((tab) => tab.localize(game.summoning));
}
class SummoningRenderQueue extends ArtisanSkillRenderQueue {
    constructor() {
        super(...arguments);
        /** Performs a complete update of a mark discovery */
        this.markState = new Set();
        /** Performs an update of a marks discovery progress */
        this.markCount = new Set();
        /** Updates the synergy search menu quantities */
        this.synergyQuantities = false;
        /** Updates the synergy search menu unlocks */
        this.synergyUnlock = false;
    }
}
//# sourceMappingURL=summoning.js.map
checkFileVersion('?12097')