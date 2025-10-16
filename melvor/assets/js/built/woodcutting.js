"use strict";
class RandomWoodcuttingProduct {
    constructor(data, game) {
        this.minChance = 0;
        try {
            this.item = game.items.getObjectSafe(data.itemID);
            this.chance = data.chance;
            this.quantity = data.quantity;
            if (data.minChance !== undefined)
                this.minChance = data.minChance;
        } catch (e) {
            throw new DataConstructionError(RandomWoodcuttingProduct.name, e);
        }
    }
}
class WoodcuttingTree extends SingleProductRecipe {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.requirements = [];
        this._name = data.name;
        this._media = data.media;
        this.baseInterval = data.baseInterval;
        if (data.randomProducts !== undefined) {
            this.randomProducts = game.items.getArrayFromIds(data.randomProducts);
        } else {
            this.randomProducts = game.woodcutting.defaultRandomProducts;
        }
        game.queueForSoftDependencyReg(data, this);
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`TREE_NAME_${this.localID}`);
        }
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.requirements !== undefined)
                this.requirements = game.getRequirementsFromData(data.requirements);
        } catch (e) {
            throw new DataConstructionError(WoodcuttingTree.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            if (data.baseInterval !== undefined)
                this.baseInterval = data.baseInterval;
            if (data.randomProducts !== undefined) {
                if (this.randomProducts === game.woodcutting.defaultRandomProducts) {
                    this.randomProducts = [...game.woodcutting.defaultRandomProducts];
                }
                if (data.randomProducts.remove !== undefined) {
                    const removals = data.randomProducts.remove;
                    this.randomProducts = this.randomProducts.filter((item) => !removals.includes(item.id));
                }
                if (data.randomProducts.add !== undefined) {
                    this.randomProducts.push(...game.items.getArrayFromIds(data.randomProducts.add));
                }
            }
            if (data.requirements !== undefined) {
                this.requirements = game.modifyRequirements(this.requirements, data.requirements);
            }
        } catch (e) {
            throw new DataModificationError(WoodcuttingTree.name, e, this.id);
        }
    }
}
class Woodcutting extends GatheringSkill {
    constructor(namespace, game) {
        super(namespace, 'Woodcutting', game, WoodcuttingTree.name);
        this._media = "assets/media/skills/woodcutting/woodcutting.png" /* Assets.Woodcutting */ ;
        /** Trees that are currently being cut */
        this.activeTrees = new Set();
        this.renderQueue = new WoodcuttingRenderQueue();
        this.bannedJewelry = new Set();
        this.randomJewelry = [];
        this.randomProducts = new Map();
        this.defaultRandomProducts = [];
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    registerData(namespace, data) {
        var _a, _b, _c;
        super.registerData(namespace, data);
        (_a = data.trees) === null || _a === void 0 ? void 0 : _a.forEach((treeData) => {
            this.actions.registerObject(new WoodcuttingTree(namespace, treeData, this.game));
        });
        (_b = data.randomProducts) === null || _b === void 0 ? void 0 : _b.forEach((randomProductData) => {
            const product = new RandomWoodcuttingProduct(randomProductData, this.game);
            this.randomProducts.set(product.item, product);
        });
        (_c = data.defaultRandomProducts) === null || _c === void 0 ? void 0 : _c.forEach((itemID) => {
            this.defaultRandomProducts.push(this.getItemForRegistration(itemID));
        });
        if (data.bannedJewleryIDs !== undefined) {
            data.bannedJewleryIDs.forEach((id) => {
                const bannedItem = this.getItemForRegistration(id);
                this.bannedJewelry.add(bannedItem);
            });
        }
    }
    modifyData(data) {
        var _a;
        super.modifyData(data);
        (_a = data.trees) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const tree = this.actions.getObjectByID(modData.id);
            if (tree === undefined)
                throw new UnregisteredDataModError(WoodcuttingTree.name, modData.id);
            tree.applyDataModification(modData, this.game);
        });
    }
    postDataRegistration() {
        super.postDataRegistration();
        // Set up random Jewelry array
        this.game.crafting.actions.forEach((recipe) => {
            if ((recipe.category.id === "melvorF:Necklaces" /* CraftingCategoryIDs.Necklaces */ || recipe.category.id === "melvorF:Rings" /* CraftingCategoryIDs.Rings */ ) &&
                !this.bannedJewelry.has(recipe.product)) {
                this.randomJewelry.push(recipe.product);
            }
        });
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
    getUncappedDoublingChance(action) {
        let chance = super.getUncappedDoublingChance(action);
        if (this.game.modifiers.halveWoodcuttingDoubleChance > 0)
            chance = Math.floor(chance / 2);
        return chance;
    }
    getTreeInterval(tree) {
        return this.modifyInterval(tree.baseInterval, tree);
    }
    getTreeMultiplier(tree) {
        const treeInterval = this.getTreeInterval(tree);
        const actionInterval = this.actionInterval;
        if (treeInterval < actionInterval)
            return actionInterval / treeInterval;
        return 1;
    }
    getTreeMasteryXP(tree) {
        return this.getMasteryXPToAddForAction(tree, this.masteryModifiedInterval);
    }
    getBaseTreeMasteryXP(tree) {
        return this.getBaseMasteryXPToAddForAction(tree, this.masteryModifiedInterval);
    }
    get treeCutLimit() {
        return 1 + this.game.modifiers.treeCutLimit;
    }
    onStop() {
        this.activeTrees.clear();
        this.renderQueue.selectedTrees = true;
    }
    /** Returns if all requirements to cut the tree have been met */
    isTreeUnlocked(tree) {
        return (this.level >= tree.level &&
            this.game.checkRequirements(tree.requirements) &&
            (!this.hasAbyssalLevels || (this.hasAbyssalLevels && this.abyssalLevel >= tree.abyssalLevel)));
    }
    /** Callback function for selecting a tree */
    selectTree(tree) {
        if (this.game.isGolbinRaid)
            return;
        if (this.activeTrees.has(tree)) {
            // If in the active trees, remove it
            this.activeTrees.delete(tree);
        } else if (this.activeTrees.size < this.treeCutLimit &&
            Array.from(this.activeTrees).every((activeTree) => activeTree.realm === tree.realm)) {
            // If not in active trees and not at limit, add to active trees
            this.activeTrees.add(tree);
        } else {
            // If not in the active trees and at limit, notify player and do nothing
            if (this.activeTrees.size >= this.treeCutLimit)
                notifyPlayer(this, getLangString('TOASTS_CUT_LIMIT_REACHED'), 'danger');
            if (!Array.from(this.activeTrees).every((activeTree) => activeTree.realm === tree.realm))
                notifyPlayer(this, getLangString('WOODCUTTING_REALM_ERROR'), 'danger');
            return;
        }
        if (this.activeTrees.size === 0) {
            // If the active trees is empty, stop
            this.stop();
        } else {
            // If the active trees has something and was changed, reset/start the action
            this.renderQueue.selectedTrees = true;
            this.start();
        }
    }
    get actionInterval() {
        // Return the largest interval of active trees
        let interval = -Infinity;
        this.activeTrees.forEach((tree) => {
            interval = Math.max(interval, this.getTreeInterval(tree));
        });
        return interval;
    }
    /** Woodcutting xp to add per action inclusive of modifiers */
    get baseXPToAdd() {
        let baseXP = 0;
        this.activeTrees.forEach((tree) => {
            baseXP += this.getTreeMultiplier(tree) * tree.baseExperience;
        });
        return baseXP;
    }
    /** Woodcutting xp to add per action inclusive of modifiers */
    get totalXPToAdd() {
        return this.modifyXP(this.baseXPToAdd);
    }
    /* Pool xp to add per action inclusive of modifiers */
    get totalPoolXPToAdd() {
        let totalMasteryXP = 0;
        this.activeTrees.forEach((tree) => {
            totalMasteryXP += this.getMasteryXPToAddForAction(tree, this.masteryModifiedInterval);
        });
        return this.getMasteryXPToAddToPool(totalMasteryXP);
    }
    /** Woodcutting xp to add per action inclusive of modifiers */
    get baseAbyssalXPToAdd() {
        let baseXP = 0;
        this.activeTrees.forEach((tree) => {
            baseXP += this.getTreeMultiplier(tree) * tree.baseAbyssalExperience;
        });
        return baseXP;
    }
    /** Woodcutting xp to add per action inclusive of modifiers */
    get totalAbyssalXPToAdd() {
        return this.modifyAbyssalXP(this.baseAbyssalXPToAdd);
    }
    get actionLevel() {
        // For the purposes of signet ring rolls, use the highest level log
        let highestLevel = -Infinity;
        this.activeTrees.forEach((tree) => {
            highestLevel = Math.max(highestLevel, tree.level);
        });
        return highestLevel;
    }
    getWCXPtoFMXP() {
        return this.game.modifiers.woodcuttingXPAddedAsFiremakingXP / 100;
    }
    getWCAXPtoFMAXP() {
        return this.game.modifiers.woodcuttingAXPAddedAsFiremakingAXP / 100;
    }
    get masteryAction() {
        return [...this.activeTrees][0]; // This potentially has a performance impact
    }
    get masteryModifiedInterval() {
        return this.actionInterval;
    }
    getRandomProductInfo(item) {
        const query = this.getItemModifierQuery(item);
        let minChance = 0;
        let chance = this.game.modifiers.getValue("melvorD:randomProductChance" /* ModifierIDs.randomProductChance */ , query);
        let quantity = 0;
        const product = this.randomProducts.get(item);
        if (product !== undefined) {
            chance += product.chance;
            quantity = product.quantity;
            minChance = product.minChance;
        }
        quantity += this.game.modifiers.getValue("melvorD:flatBaseRandomProductQuantity" /* ModifierIDs.flatBaseRandomProductQuantity */ , query);
        chance = clampValue(chance, minChance, 100);
        quantity = Math.max(1, quantity);
        return {
            chance,
            quantity
        };
    }
    addArrowShaftReward(tree, rewards) {
        var _a;
        const shaftRecipe = this.game.fletching.actions.getObjectByID("melvorF:Arrow_Shafts" /* FletchingRecipeIDs.Arrow_Shafts */ );
        if (shaftRecipe === undefined)
            return;
        const altCostMatch = (_a = shaftRecipe.alternativeCosts) === null || _a === void 0 ? void 0 : _a.find((altCost) => {
            return altCost.itemCosts[0].item === tree.product;
        });
        if (altCostMatch === undefined)
            return;
        rewards.addItem(shaftRecipe.product, altCostMatch.quantityMultiplier * shaftRecipe.baseQuantity);
    }
    preAction() {}
    get actionRewards() {
        const rewards = new Rewards(this.game);
        const interval = this.currentActionInterval;
        rewards.setActionInterval(interval);
        const actionEvent = new WoodcuttingActionEvent(this, new Set(this.activeTrees));
        let firstTree;
        const randomProducts = new Set();
        // Add Log and XP rewards for each active tree
        this.activeTrees.forEach((tree) => {
            if (!firstTree)
                firstTree = tree;
            let logQuantity = this.modifyPrimaryProductQuantity(tree.product, 1, tree);
            const multiplier = this.getTreeMultiplier(tree);
            logQuantity = Math.floor(logQuantity * multiplier);
            this.game.stats.Woodcutting.add(WoodcuttingStats.LogsCut, logQuantity);
            rewards.addItem(tree.product, logQuantity);
            this.addCurrencyFromPrimaryProductGain(rewards, tree.product, logQuantity, tree);
            rewards.addXP(this, tree.baseExperience * multiplier, tree);
            rewards.addAbyssalXP(this, tree.baseAbyssalExperience * multiplier, tree);
            if (this.getWCXPtoFMXP() > 0 && tree.baseExperience > 0)
                rewards.addXP(this.game.firemaking, tree.baseExperience * multiplier * this.getWCXPtoFMXP());
            if (tree.baseAbyssalExperience > 0 && this.game.modifiers.woodcuttingAXPAddedAsFiremakingAXP > 0) {
                rewards.addAbyssalXP(this.game.firemaking, tree.baseAbyssalExperience * multiplier * this.getWCAXPtoFMAXP());
            }
            // Arrow shafts from synergy
            if (rollPercentage(this.game.modifiers.woodcuttingArrowShaftChance)) {
                this.addArrowShaftReward(tree, rewards);
            }
            tree.randomProducts.forEach((item) => randomProducts.add(item));
            const modifierProducts = this.game.modifiers.query("melvorD:additionalItemBasedOnPrimaryQuantityChance" /* ModifierIDs.additionalItemBasedOnPrimaryQuantityChance */ , this.getActionItemModifierQuery(tree));
            if (modifierProducts.length > 0) {
                const productChances = new SparseNumericMap();
                modifierProducts.forEach((entry) => productChances.add(entry.scope.item, entry.value));
                productChances.forEach((chance, item) => {
                    if (rollPercentage(chance))
                        rewards.addItem(item, logQuantity);
                });
            }
            actionEvent.productQuantity += logQuantity;
        });
        // Roll for random products
        randomProducts.forEach((item) => {
            const {
                chance,
                quantity
            } = this.getRandomProductInfo(item);
            if (rollForOffItem(chance)) {
                switch (item.id) {
                    // TODO_MR Convert to item scoped modifier
                    case "melvorD:Bird_Nest" /* ItemIDs.Bird_Nest */ :
                        actionEvent.nestGiven = true;
                        if (rollPercentage(this.game.modifiers.woodcuttingJewelryChance)) {
                            item = getRandomArrayElement(this.randomJewelry);
                        }
                        break;
                    case "melvorItA:Shadow_Drake_Nest" /* ItemIDs.Shadow_Drake_Nest */ :
                        if (rollPercentage(this.game.modifiers.woodcuttingDrakeNestJewelryChance)) {
                            item = getRandomArrayElement(this.randomJewelry);
                        }
                        break;
                }
                rewards.addItem(item, quantity);
                if (item.id === "melvorD:Bird_Nest" /* ItemIDs.Bird_Nest */ ) {
                    this.game.stats.Woodcutting.add(WoodcuttingStats.BirdNestsGotten, quantity);
                }
            }
        });
        this.addCommonRewards(rewards, firstTree);
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    /** Adds mastery XP for all active trees */
    addMasteryXPReward() {
        this.activeTrees.forEach((tree) => {
            this.addMasteryForAction(tree, this.masteryModifiedInterval);
        });
    }
    postAction() {
        this.game.stats.Woodcutting.inc(WoodcuttingStats.Actions);
        this.game.stats.Woodcutting.add(WoodcuttingStats.TimeSpent, this.currentActionInterval);
        this.renderQueue.treeGrants = true;
        this.renderQueue.treeRates = true;
    }
    onLoad() {
        super.onLoad();
        woodcuttingMenu.createTreeMenus(this.game);
        this.renderQueue.treeUnlocks = true;
        this.renderQueue.treeRates = true;
        this.renderQueue.selectedTrees = true;
        if (this.isActive) {
            this.renderQueue.progressBar = true;
        }
        this.actions.forEach((tree) => {
            this.renderQueue.actionMastery.add(tree);
        });
        this.render();
    }
    onRealmChange() {
        super.onRealmChange();
        this.renderQueue.treeUnlocks = true;
    }
    onMasteryLevelUp(action, oldLevel, newLevel) {
        super.onMasteryLevelUp(action, oldLevel, newLevel);
        if (newLevel >= 99)
            this.renderQueue.treeRates = true;
    }
    onModifierChange() {
        super.onModifierChange();
        this.renderQueue.treeRates = true;
        this.renderQueue.treeGrants = true;
    }
    onEquipmentChange() {}
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.renderQueue.treeUnlocks = true;
    }
    onAncientRelicUnlock() {
        super.onAncientRelicUnlock();
        this.renderQueue.treeRates = true;
    }
    getErrorLog() {
        const treeLog = [];
        this.activeTrees.forEach((tree) => {
            treeLog.push(`${tree.id}`);
        });
        return `${super.getErrorLog()}
Active Trees: ${treeLog.join('\n')}`;
    }
    render() {
        super.render();
        this.renderTreeRates();
        this.renderTreeUnlock();
        this.renderProgressBar();
        this.renderSelectedTrees();
        this.renderTreeGrants();
    }
    /** Renders all tree menu rates */
    renderTreeRates() {
        if (!this.renderQueue.treeRates)
            return;
        woodcuttingMenu.updateTreeRates(this);
        this.renderQueue.treeRates = false;
    }
    /** Renders trees that are unlocked, and the locked tree */
    renderTreeUnlock() {
        if (!this.renderQueue.treeUnlocks)
            return;
        woodcuttingMenu.updateTreeUnlocks(this.game);
        this.renderQueue.treeUnlocks = false;
    }
    renderProgressBar() {
        if (!this.renderQueue.progressBar)
            return;
        if (this.isActive)
            woodcuttingMenu.progressBar.animateProgressFromTimer(this.actionTimer);
        else
            woodcuttingMenu.progressBar.stopAnimation();
        this.renderQueue.progressBar = false;
    }
    renderSelectedTrees() {
        if (!this.renderQueue.selectedTrees)
            return;
        woodcuttingMenu.setTrees(this.activeTrees);
        this.renderQueue.selectedTrees = false;
    }
    renderTreeGrants() {
        if (!this.renderQueue.treeGrants)
            return;
        woodcuttingMenu.updateSelectedTrees();
        this.renderQueue.treeGrants = false;
    }
    resetActionState() {
        super.resetActionState();
        this.activeTrees.clear();
    }
    encode(writer) {
        super.encode(writer);
        writer.writeSet(this.activeTrees, writeNamespaced);
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.activeTrees = reader.getSet(readNamespacedReject(this.actions));
        if (this.isActive && this.activeTrees.size === 0)
            this.shouldResetAction = true;
        if (this.shouldResetAction)
            this.resetActionState();
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        this.activeTrees = new Set();
        reader
            .getVariableLengthChunk()
            .getRawData()
            .forEach((oldID) => {
                const tree = this.actions.getObjectByID(idMap.woodcuttingTrees[oldID]);
                if (tree !== undefined)
                    this.activeTrees.add(tree);
            });
        if (this.isActive && this.activeTrees.size === 0)
            this.shouldResetAction = true;
        if (this.shouldResetAction)
            this.resetActionState();
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
                    return skillData.trees;
            }
        }
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.woodcuttingTrees[oldActionID];
    }
    setFromOldOffline(offline, idMap) {
        offline.action.forEach((treeID) => {
            const tree = this.actions.getObjectByID(idMap.woodcuttingTrees[treeID]);
            if (tree !== undefined)
                this.selectTree(tree);
        });
    }
    testTranslations() {
        super.testTranslations();
        this.actions.forEach((action) => {
            action.name;
        });
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        this.actions.forEach((action) => {
            obtainable.add(action.product);
            action.randomProducts.forEach((item) => obtainable.add(item));
        });
        return obtainable;
    }
}
class WoodcuttingRenderQueue extends GatheringSkillRenderQueue {
    constructor() {
        super(...arguments);
        /** Updates the actively cut trees */
        this.selectedTrees = false;
        /** Updates the XP and interval of every tree */
        this.treeRates = false;
        /** Updates the unlocked trees. Required on skill level up. */
        this.treeUnlocks = false;
        /** Updates the grants of the selected trees */
        this.treeGrants = false;
    }
}
//# sourceMappingURL=woodcutting.js.map
checkFileVersion('?12097')