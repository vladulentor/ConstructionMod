"use strict";
class AstrologyModifier {
    constructor(data, game, itemID, where) {
        this.incrementValue = 1;
        this.timesBought = 0;
        this.unlockRequirements = [];
        try {
            this.stats = new StatObject(data, game, `${AstrologyModifier.name}`);
            if (this.stats.modifiers !== undefined)
                this.incrementValue = this.stats.modifiers[0].value;
            this.maxCount = data.maxCount;
            const item = game.items.getObjectSafe(itemID);
            this.costs = data.costs.map((quantity) => ({
                item,
                quantity
            }));
        } catch (e) {
            throw new DataConstructionError(AstrologyModifier.name, e);
        }
        game.queueForSoftDependencyReg(data, this, where);
    }
    /** If this modifier has been bought at least once */
    get isBought() {
        return this.timesBought > 0;
    }
    /** If this modifier has been bought maximum number of times */
    get isMaxed() {
        return this.timesBought >= this.maxCount;
    }
    /** Returns the cost of upgrading this modifier to the next level */
    get upgradeCost() {
        return this.costs[this.timesBought];
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.unlockRequirements !== undefined)
                this.unlockRequirements = game.getRequirementsFromData(data.unlockRequirements);
        } catch (e) {
            throw new DataConstructionError(AstrologyModifier.name, e);
        }
    }
    applyDataModification(data, game) {
        var _a, _b;
        try {
            this.stats.applyDataModification(data, game);
            if (data.maxCount !== undefined)
                this.maxCount = data.maxCount;
            if (data.costs !== undefined) {
                const item = this.costs[0].item;
                (_a = data.costs.modify) === null || _a === void 0 ? void 0 : _a.forEach(({
                    index,
                    value
                }) => {
                    this.costs[index].quantity = value;
                });
                (_b = data.costs.add) === null || _b === void 0 ? void 0 : _b.forEach((quantity) => {
                    this.costs.push({
                        item,
                        quantity,
                    });
                });
            }
            if (data.unlockRequirements !== undefined) {
                if (data.unlockRequirements.remove !== undefined) {
                    const removals = data.unlockRequirements.remove;
                    this.unlockRequirements = this.unlockRequirements.filter((req) => !removals.includes(req.type));
                }
                if (data.unlockRequirements.add !== undefined) {
                    this.unlockRequirements.push(...game.getRequirementsFromData(data.unlockRequirements.add));
                }
            }
        } catch (e) {
            throw new DataModificationError(AstrologyModifier.name, e);
        }
    }
}
class AstrologyRecipe extends BasicSkillRecipe {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        /** Determines the random items that can be rolled for this constellation */
        this.randomItems = [];
        this.standardModifiers = [];
        this.uniqueModifiers = [];
        this.abyssalModifiers = [];
        /** Cache of max value modifiers */
        this.maxValueModifiers = 0;
        this.canLocateMeteorite = true;
        this.canLocateStarfalls = false;
        try {
            this._name = data.name;
            this._media = data.media;
            this.skills = game.skills.getArrayFromIds(data.skillIDs);
            this.standardModifiers = data.standardModifiers.map((modData) => new AstrologyModifier(modData, game, "melvorF:Stardust" /* ItemIDs.Stardust */ , `${AstrologyRecipe.name} with id "${this.id}"`));
            this.uniqueModifiers = data.uniqueModifiers.map((modData) => new AstrologyModifier(modData, game, "melvorF:Golden_Stardust" /* ItemIDs.Golden_Stardust */ , `${AstrologyRecipe.name} with id "${this.id}"`));
            if (data.abyssalModifiers !== undefined)
                this.abyssalModifiers = data.abyssalModifiers.map((modData) => new AstrologyModifier(modData, game, "melvorItA:Abyssal_Stardust" /* ItemIDs.Abyssal_Stardust */ , `${AstrologyRecipe.name} with id "${this.id}"`));
            if (data.masteryXPModifier !== undefined) {
                const id = Modifier.getIdFromKey(data.masteryXPModifier);
                this.masteryXPModifier = game.modifierRegistry.getObjectSafe(id);
            }
            const randomItemIDs = data.randomItems === undefined ? AstrologyRecipe.DEFAULT_RANDOM_ITEMS : data.randomItems;
            this.randomItems = game.items.getArrayFromIds(randomItemIDs);
            if (data.canLocateMeteorites !== undefined)
                this.canLocateMeteorite = data.canLocateMeteorites;
            if (data.canLocateStarfalls !== undefined)
                this.canLocateStarfalls = data.canLocateStarfalls;
        } catch (e) {
            throw new DataConstructionError(AstrologyRecipe.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`ASTROLOGY_NAME_${this.localID}`);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    applyDataModification(data, game) {
        var _a, _b, _c;
        super.applyDataModification(data, game);
        try {
            if (data.skillIDs !== undefined) {
                if (data.skillIDs.remove !== undefined) {
                    const removals = data.skillIDs.remove;
                    this.skills = this.skills.filter((skill) => !removals.includes(skill.id));
                }
                if (data.skillIDs.add !== undefined) {
                    this.skills.push(...game.skills.getArrayFromIds(data.skillIDs.add));
                }
            }
            if (data.randomItems !== undefined) {
                if (data.randomItems.remove !== undefined) {
                    const removals = data.randomItems.remove;
                    this.randomItems = this.randomItems.filter((item) => !removals.includes(item.id));
                }
                if (data.randomItems.add !== undefined) {
                    this.randomItems.push(...game.items.getArrayFromIds(data.randomItems.add));
                }
            }
            if (data.canLocateMeteorites !== undefined)
                this.canLocateMeteorite = data.canLocateMeteorites;
            if (data.canLocateStarfalls !== undefined)
                this.canLocateStarfalls = data.canLocateStarfalls;
            (_a = data.standardModifiers) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
                const astroMod = this.standardModifiers[modData.index];
                if (astroMod === undefined)
                    throw new Error(`Standard Modifier with index ${modData.index} does not exist.`);
                astroMod.applyDataModification(modData, game);
            });
            (_b = data.uniqueModifiers) === null || _b === void 0 ? void 0 : _b.forEach((modData) => {
                const astroMod = this.uniqueModifiers[modData.index];
                if (astroMod === undefined)
                    throw new Error(`Unique Modifier with index ${modData.index} does not exist.`);
                astroMod.applyDataModification(modData, game);
            });
            (_c = data.abyssalModifiers) === null || _c === void 0 ? void 0 : _c.forEach((modData) => {
                const astroMod = this.abyssalModifiers[modData.index];
                if (astroMod === undefined)
                    throw new Error(`Abyssal Modifier with index ${modData.index} does not exist.`);
                astroMod.applyDataModification(modData, game);
            });
            if (data.masteryXPModifier !== undefined) {
                this.masteryXPModifier = game.modifierRegistry.getObjectSafe(Modifier.getIdFromKey(data.masteryXPModifier));
            }
        } catch (e) {
            throw new DataModificationError(AstrologyRecipe.name, e, this.id);
        }
    }
    /** Recomputes the maxValueModifiers property */
    computeMaxValueModifiers() {
        this.maxValueModifiers = 0;
        this.maxValueModifiers += this.standardModifiers.reduce((total, astroMod) => {
            if (astroMod.isMaxed)
                total++;
            return total;
        }, 0);
        this.maxValueModifiers += this.uniqueModifiers.reduce((total, astroMod) => {
            if (astroMod.isMaxed)
                total++;
            return total;
        }, 0);
        this.maxValueModifiers += this.abyssalModifiers.reduce((total, astroMod) => {
            if (astroMod.isMaxed)
                total++;
            return total;
        }, 0);
    }
}
AstrologyRecipe.DEFAULT_RANDOM_ITEMS = ["melvorF:Stardust" /* ItemIDs.Stardust */ , "melvorF:Golden_Stardust" /* ItemIDs.Golden_Stardust */ ];
class DummyAstrologyRecipe extends AstrologyRecipe {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            baseExperience: 0,
            level: 0,
            name: '',
            media: '',
            skillIDs: [],
            randomItems: [],
            standardModifiers: [],
            uniqueModifiers: [],
        }, game);
    }
}
class Astrology extends GatheringSkill {
    constructor(namespace, game) {
        super(namespace, 'Astrology', game, AstrologyRecipe.name);
        this._media = "assets/media/skills/astrology/astrology.png" /* Assets.Astrology */ ;
        this.renderQueue = new AstrologyRenderQueue();
        /** Constellations which have a modifier that provides increased mastery xp */
        this.masteryXPConstellations = [];
        this.baseRandomItemChances = new Map();
        this.shouldRefundStardust = false;
        this.shouldRefundStardustAgain = false;
        this.newRefundDate = 1666051201000;
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    isConstellationComplete(constellation) {
        return (this.getMasteryLevel(constellation) >= 99 &&
            constellation.standardModifiers.every((astroMod) => astroMod.isMaxed) &&
            constellation.uniqueModifiers.every((astroMod) => astroMod.isMaxed) &&
            constellation.abyssalModifiers.every((astroMod) => astroMod.isMaxed));
    }
    get actionInterval() {
        return this.getConstellationInterval(this.activeConstellation);
    }
    get actionLevel() {
        return this.activeConstellation.level;
    }
    get masteryAction() {
        return this.activeConstellation;
    }
    get meteoriteChance() {
        var _a;
        if (!((_a = this.studiedConstellation) === null || _a === void 0 ? void 0 : _a.canLocateMeteorite))
            return 0;
        let chance = 0.25;
        chance += this.game.modifiers.getValue("melvorD:meteoriteLocationChance" /* ModifierIDs.meteoriteLocationChance */ , this.getActionModifierQuery(this.studiedConstellation));
        return chance;
    }
    get starfallChance() {
        var _a;
        if (!((_a = this.studiedConstellation) === null || _a === void 0 ? void 0 : _a.canLocateStarfalls))
            return 0;
        let chance = 0.1;
        chance += this.game.modifiers.getValue("melvorD:starFallChance" /* ModifierIDs.starFallChance */ , this.getActionModifierQuery(this.studiedConstellation));
        return chance;
    }
    /** The constellation that is currently being studied. Undefined if none is selected. */
    get activeConstellation() {
        if (this.studiedConstellation === undefined)
            throw new Error('Tried to get active constellation, but none is being studied.');
        return this.studiedConstellation;
    }
    registerData(namespace, data) {
        var _a, _b;
        super.registerData(namespace, data);
        (_a = data.recipes) === null || _a === void 0 ? void 0 : _a.forEach((data) => {
            this.actions.registerObject(new AstrologyRecipe(namespace, data, this.game));
        });
        (_b = data.baseRandomItemChances) === null || _b === void 0 ? void 0 : _b.forEach(({
            itemID,
            chance
        }) => {
            const item = this.getItemForRegistration(itemID);
            this.baseRandomItemChances.set(item, chance);
        });
    }
    modifyData(data) {
        var _a;
        super.modifyData(data);
        (_a = data.recipes) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const recipe = this.actions.getObjectByID(modData.id);
            if (recipe === undefined)
                throw new UnregisteredDataModError(AstrologyRecipe.name, modData.id);
            recipe.applyDataModification(modData, this.game);
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
        this.masteryXPConstellations = this.actions.filter((action) => action.masteryXPModifier !== undefined);
    }
    isModifierUnlocked(constellation, type, modID) {
        switch (type) {
            case AstrologyModifierType.Standard:
                return isRequirementMet(constellation.standardModifiers[modID].unlockRequirements);
            case AstrologyModifierType.Unique:
                return isRequirementMet(constellation.uniqueModifiers[modID].unlockRequirements);
            case AstrologyModifierType.Abyssal:
                return isRequirementMet(constellation.abyssalModifiers[modID].unlockRequirements);
        }
    }
    refundStardust() {
        if (!this.shouldRefundStardust)
            return;
        const stardust = this.game.items.getObjectByID("melvorF:Stardust" /* ItemIDs.Stardust */ );
        if (stardust !== undefined) {
            const stardustInBank = this.game.bank.getQty(stardust);
            const stardustFound = this.game.stats.itemFindCount(stardust);
            const stardustToRefund = stardustFound - stardustInBank;
            if (stardustToRefund > 0) {
                this.game.bank.addItem(stardust, stardustToRefund, false, false, true, true, 'Other.AstrologyRefund');
            }
        }
        const goldenStardust = this.game.items.getObjectByID("melvorF:Golden_Stardust" /* ItemIDs.Golden_Stardust */ );
        if (goldenStardust !== undefined) {
            const goldenStardustInBank = this.game.bank.getQty(goldenStardust);
            const goldenStardustFound = this.game.stats.itemFindCount(goldenStardust);
            const goldenStardustToRefund = goldenStardustFound - goldenStardustInBank;
            if (goldenStardustToRefund > 0) {
                this.game.bank.addItem(goldenStardust, goldenStardustToRefund, false, false, true, true, 'Other.AstrologyRefund');
            }
        }
        this.shouldRefundStardust = false;
    }
    refundStardustAgain() {
        const stardust = this.game.items.getObjectByID("melvorF:Stardust" /* ItemIDs.Stardust */ );
        if (!this.shouldRefundStardustAgain ||
            !this.isUnlocked ||
            game.stats.General.get(GeneralStats.AccountCreationDate) > this.newRefundDate ||
            this.game.stats.itemFindCount(stardust) < 1) {
            this.shouldRefundStardustAgain = false;
            return;
        }
        if (stardust !== undefined) {
            const count = this.getTotalCurrentMasteryLevels('melvorF') * 50;
            if (count > 0) {
                this.game.bank.addItem(stardust, count, false, false, true, true, 'Other.AnotherAstrologyRefund');
            }
        }
        const goldenStardust = this.game.items.getObjectByID("melvorF:Golden_Stardust" /* ItemIDs.Golden_Stardust */ );
        if (goldenStardust !== undefined) {
            const count = this.getTotalCurrentMasteryLevels('melvorF') * 30;
            if (count > 0) {
                this.game.bank.addItem(goldenStardust, count, false, false, true, true, 'Other.AnotherAstrologyRefund');
            }
        }
        this.shouldRefundStardustAgain = false;
    }
    /** Gets the chance to received a given random item from a constellation */
    getRandomItemChance(item) {
        var _a;
        let chance = (_a = this.baseRandomItemChances.get(item)) !== null && _a !== void 0 ? _a : 0;
        chance += this.game.modifiers.getValue("melvorD:randomProductChance" /* ModifierIDs.randomProductChance */ , this.getItemModifierQuery(item));
        return chance;
    }
    /** Gets the quantity of a random item to give from a constellation */
    getRandomItemQuantity(item, action) {
        let quantity = 1;
        quantity += this.game.modifiers.getValue("melvorD:flatBaseRandomProductQuantity" /* ModifierIDs.flatBaseRandomProductQuantity */ , this.getItemModifierQuery(item));
        if (rollPercentage(this.getDoublingChance(action)))
            quantity *= 2;
        return quantity;
    }
    getConstellationInterval(constellation) {
        return this.modifyInterval(Astrology.baseInterval, constellation);
    }
    addProvidedStats() {
        super.addProvidedStats();
        this.actions.forEach((recipe) => {
            const mult = this.hasMasterRelic(recipe.realm) && this.isConstellationComplete(recipe) ? 2 : 1;
            this.addAstroModProvidedStats(recipe, recipe.standardModifiers, mult);
            this.addAstroModProvidedStats(recipe, recipe.uniqueModifiers, mult);
            this.addAstroModProvidedStats(recipe, recipe.abyssalModifiers, mult);
        });
    }
    addAstroModProvidedStats(recipe, astroMods, multi) {
        astroMods.forEach((astroMod) => {
            if (astroMod.timesBought <= 0)
                return;
            const mult = astroMod.timesBought * multi;
            this.providedStats.addStatObject(recipe, astroMod.stats, mult, mult);
        });
    }
    preAction() {}
    get actionRewards() {
        const constellation = this.activeConstellation;
        const rewards = new Rewards(this.game);
        rewards.setActionInterval(this.actionInterval);
        const actionEvent = new AstrologyActionEvent(this, constellation);
        rewards.addXP(this, constellation.baseExperience, constellation);
        rewards.addAbyssalXP(this, constellation.baseAbyssalExperience, constellation);
        constellation.randomItems.forEach((item) => {
            const chance = this.getRandomItemChance(item);
            if (rollPercentage(chance)) {
                rewards.addItem(item, this.getRandomItemQuantity(item, constellation));
            }
        });
        this.addCommonRewards(rewards, constellation);
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    postAction() {
        this.rollForMeteorite();
        this.rollForStarfall();
        this.game.stats.Astrology.inc(AstrologyStats.Actions);
        this.game.stats.Astrology.add(AstrologyStats.TimeSpent, this.currentActionInterval);
        this.renderQueue.constellationRates = true;
        this.renderQueue.stardustRates = true;
    }
    /** Queues up rendering for explored constellation modifiers */
    queueModifierRender(constellation, type, modId) {
        if (this.exploredConstellation !== constellation)
            return;
        switch (type) {
            case AstrologyModifierType.Standard:
                if (constellation.standardModifiers[modId] !== undefined)
                    this.renderQueue.exploredStandardModifiers.add(modId);
                break;
            case AstrologyModifierType.Unique:
                if (constellation.uniqueModifiers[modId] !== undefined)
                    this.renderQueue.exploredUniqueModifiers.add(modId);
                break;
            case AstrologyModifierType.Abyssal:
                if (constellation.abyssalModifiers[modId] !== undefined)
                    this.renderQueue.exploredAbyssalModifiers.add(modId);
                break;
        }
    }
    /** Gets the modified cost to upgrade an astrology modifier */
    getAstroModUpgradeCost(constellation, astroMod) {
        const baseCost = astroMod.upgradeCost;
        const costModifier = this.game.modifiers.getValue("melvorD:astrologyModifierCost" /* ModifierIDs.astrologyModifierCost */ , this.getActionModifierQuery(constellation));
        let quantity = baseCost.quantity;
        quantity *= 1 + costModifier / 100;
        quantity = Math.max(1, Math.floor(quantity));
        return {
            item: baseCost.item,
            quantity
        };
    }
    /** Checks for stardust costs, and uses them. Returns true if successful. */
    checkAndConsumeAstroModCosts(constellation, astroMod) {
        const cost = this.getAstroModUpgradeCost(constellation, astroMod);
        const costs = new Costs(this.game);
        costs.setSource(`Skill.${this.id}.UpgradeConstellation.${cost.item.id}`);
        costs.addItem(cost.item, cost.quantity);
        if (costs.checkIfOwned()) {
            costs.consumeCosts();
            return true;
        } else {
            notifyPlayer(this, templateString(getLangString('ASTROLOGY_MISC_4'), {
                itemName: cost.item.name
            }), 'danger');
            return false;
        }
    }
    /** Perform actions when an upgrade of a star is performed */
    onConstellationUpgrade(constellation, type, modID) {
        switch (type) {
            case AstrologyModifierType.Standard:
                astrologyMenus.explorePanel.setStandardUpgradeCost(this, constellation, modID);
                break;
            case AstrologyModifierType.Unique:
                astrologyMenus.explorePanel.setUniqueUpgradeCost(this, constellation, modID);
                break;
            case AstrologyModifierType.Abyssal:
                astrologyMenus.explorePanel.setAbyssalUpgradeCost(this, constellation, modID);
                break;
        }
        this.queueModifierRender(constellation, type, modID);
    }
    /** onClick callback function for upgrading standard modifiers */
    upgradeStandardModifier(constellation, modID) {
        if (!this.isModifierUnlocked(constellation, AstrologyModifierType.Standard, modID))
            return;
        const astroMod = constellation.standardModifiers[modID];
        if (astroMod.isMaxed)
            return;
        if (this.checkAndConsumeAstroModCosts(constellation, astroMod)) {
            astroMod.timesBought++;
            if (astroMod.isMaxed)
                constellation.maxValueModifiers++;
            this.computeProvidedStats(true);
            this.onConstellationUpgrade(constellation, AstrologyModifierType.Standard, modID);
        }
    }
    /** onClick callback function for upgrading unique modifiers */
    upgradeUniqueModifier(constellation, modID) {
        if (!this.isModifierUnlocked(constellation, AstrologyModifierType.Unique, modID))
            return;
        const astroMod = constellation.uniqueModifiers[modID];
        if (astroMod.isMaxed)
            return;
        if (this.checkAndConsumeAstroModCosts(constellation, astroMod)) {
            astroMod.timesBought++;
            if (astroMod.isMaxed)
                constellation.maxValueModifiers++;
            this.computeProvidedStats(true);
            this.onConstellationUpgrade(constellation, AstrologyModifierType.Unique, modID);
        }
    }
    /** onClick callback function for upgrading abyssal modifiers */
    upgradeAbyssalModifier(constellation, modID) {
        if (!this.isModifierUnlocked(constellation, AstrologyModifierType.Abyssal, modID))
            return;
        const astroMod = constellation.abyssalModifiers[modID];
        if (astroMod.isMaxed)
            return;
        if (this.checkAndConsumeAstroModCosts(constellation, astroMod)) {
            astroMod.timesBought++;
            if (astroMod.isMaxed)
                constellation.maxValueModifiers++;
            this.computeProvidedStats(true);
            this.onConstellationUpgrade(constellation, AstrologyModifierType.Abyssal, modID);
        }
    }
    get masteryModifiedInterval() {
        return this.actionInterval;
    }
    onLoad() {
        super.onLoad();
        this.actions.forEach((constellation) => {
            var _a;
            (_a = astrologyMenus.constellations.get(constellation)) === null || _a === void 0 ? void 0 : _a.setConstellation(constellation);
            this.renderQueue.actionMastery.add(constellation);
            // Cache the Max level modifiers
            constellation.computeMaxValueModifiers();
        });
        astrologyMenus.infoPanel.setModifierCallback(this);
        astrologyMenus.explorePanel.setMaxStandardMods(Astrology.standardModifierLevels.length);
        astrologyMenus.explorePanel.setMaxUniqueMods(Astrology.uniqueModifierLevels.length);
        astrologyMenus.explorePanel.setMaxAbyssalMods(Astrology.abyssalModifierLevels.length);
        if (this.isActive) {
            this.renderQueue.progressBar = true;
        }
        this.renderQueue.visibleConstellations = true;
        if (this.exploredConstellation !== undefined)
            this.onConstellationExplore();
        this.refundStardust();
        this.refundStardustAgain();
    }
    onPageChange() {
        this.renderQueue.stardustQuantities = true;
        super.onPageChange();
    }
    queueBankQuantityRender(item) {
        if (this.baseRandomItemChances.has(item))
            this.renderQueue.stardustQuantities = true;
    }
    onModifierChange() {
        super.onModifierChange();
        this.renderQueue.constellationRates = true;
        this.renderQueue.stardustRates = true;
        this.renderQueue.upgradeCosts = true;
    }
    onEquipmentChange() {}
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.queueModifierRenderOnUnlock();
        this.renderQueue.visibleConstellations = true;
    }
    onAncientRelicUnlock() {
        super.onAncientRelicUnlock();
        this.computeProvidedStats(false);
        if (this.exploredConstellation !== undefined)
            this.onConstellationExplore();
    }
    getErrorLog() {
        var _a;
        return `${super.getErrorLog()}
Studied Constellation: ${(_a = this.studiedConstellation) === null || _a === void 0 ? void 0 : _a.id}
Explored Constellation: ${this.exploredConstellation !== undefined ? `${this.exploredConstellation.id}` : 'Unset'}`;
    }
    /** Queues the rendering of the currently explored constellation's modifiers when it's unlock condition changes */
    queueModifierRenderOnUnlock() {
        const constellation = this.exploredConstellation;
        if (constellation === undefined ||
            this.level < constellation.level ||
            this.abyssalLevel < constellation.abyssalLevel)
            return;
        const masteryLevel = this.getMasteryLevel(constellation);
        constellation.standardModifiers.every((astroMod, i) => {
            const levelRequired = Astrology.standardModifierLevels[i];
            if (masteryLevel >= levelRequired) {
                if (!astroMod.isBought)
                    this.queueModifierRender(constellation, AstrologyModifierType.Standard, i);
                return true;
            }
            return false;
        });
        constellation.uniqueModifiers.every((astroMod, i) => {
            const levelRequired = Astrology.uniqueModifierLevels[i];
            if (masteryLevel >= levelRequired) {
                if (!astroMod.isBought)
                    this.queueModifierRender(constellation, AstrologyModifierType.Unique, i);
                return true;
            }
            return false;
        });
        constellation.abyssalModifiers.every((astroMod, i) => {
            const levelRequired = Astrology.abyssalModifierLevels[i];
            if (masteryLevel >= levelRequired) {
                if (!astroMod.isBought)
                    this.queueModifierRender(constellation, AstrologyModifierType.Abyssal, i);
                return true;
            }
            return false;
        });
    }
    onUnlock() {
        super.onUnlock();
        if (this.isUnlocked)
            this.queueModifierRenderOnUnlock();
    }
    onMasteryLevelUp(action, oldLevel, newLevel) {
        super.onMasteryLevelUp(action, oldLevel, newLevel);
        if (action === this.exploredConstellation)
            this.queueModifierRenderOnUnlock();
    }
    /** Sets rendering when a constellation is explored */
    onConstellationExplore() {
        this.renderQueue.upgradeCosts = true;
        this.renderQueue.stardustQuantities = true;
        Astrology.standardModifierLevels.forEach((_, i) => this.renderQueue.exploredStandardModifiers.add(i));
        Astrology.uniqueModifierLevels.forEach((_, i) => this.renderQueue.exploredUniqueModifiers.add(i));
        Astrology.abyssalModifierLevels.forEach((_, i) => this.renderQueue.exploredAbyssalModifiers.add(i));
    }
    onRealmChange() {
        super.onRealmChange();
        this.renderQueue.visibleConstellations = true;
        if (this.isActive)
            this.renderQueue.progressBar = true;
    }
    render() {
        super.render();
        this.renderProgressBar();
        this.renderConstellationRates();
        this.renderStardustQuantities();
        this.renderExploredStandardMods();
        this.renderExploredUniqueMods();
        this.renderStardustRates();
        this.renderVisibleConstellations();
        this.renderUpgradeCosts();
        this.renderExploredAbyssalMods();
    }
    renderProgressBar() {
        var _a, _b;
        if (!this.renderQueue.progressBar)
            return;
        const progressBar = this.studiedConstellation && ((_a = astrologyMenus.constellations.get(this.activeConstellation)) === null || _a === void 0 ? void 0 : _a.progressBar);
        if (progressBar !== this.renderedProgressBar)
            (_b = this.renderedProgressBar) === null || _b === void 0 ? void 0 : _b.stopAnimation();
        if (progressBar !== undefined) {
            if (this.isActive) {
                progressBar.animateProgressFromTimer(this.actionTimer);
                this.renderedProgressBar = progressBar;
            } else {
                progressBar.stopAnimation();
                this.renderedProgressBar = undefined;
            }
        }
        this.renderQueue.progressBar = false;
    }
    renderStardustRates() {
        if (!this.renderQueue.stardustRates)
            return;
        const itemChances = [];
        this.baseRandomItemChances.forEach((_, item) => {
            itemChances.push(this.getRandomItemChance(item));
        });
        astrologyMenus.infoPanel.updateChances(itemChances, this.getDoublingChance(this.studiedConstellation), this.getDoublingSources(this.studiedConstellation), this.meteoriteChance, this.starfallChance);
        this.renderQueue.stardustRates = false;
    }
    renderConstellationRates() {
        if (!this.renderQueue.constellationRates)
            return;
        this.actions.forEach((constellation) => {
            var _a, _b;
            const masteryXP = this.getMasteryXPToAddForAction(constellation, this.getConstellationInterval(constellation));
            const baseMasteryXP = this.getBaseMasteryXPToAddForAction(constellation, this.getConstellationInterval(constellation));
            const poolXP = this.getMasteryXPToAddToPool(masteryXP);
            (_a = astrologyMenus.constellations
                .get(constellation)) === null || _a === void 0 ? void 0 : _a.updateGrants(this.modifyXP(constellation.baseExperience, constellation), constellation.baseExperience, masteryXP, baseMasteryXP, poolXP, this.getConstellationInterval(constellation), constellation);
            (_b = astrologyMenus.constellations
                .get(constellation)) === null || _b === void 0 ? void 0 : _b.updateAbyssalGrants(this.modifyAbyssalXP(constellation.baseAbyssalExperience, constellation), constellation.baseAbyssalExperience);
        });
        this.renderQueue.constellationRates = false;
    }
    renderStardustQuantities() {
        var _a;
        if (!this.renderQueue.stardustQuantities)
            return;
        const explored = this.exploredConstellation;
        if (explored !== undefined) {
            (_a = astrologyMenus.constellations.get(explored)) === null || _a === void 0 ? void 0 : _a.updateQuantities(this.game);
        }
        this.renderQueue.stardustQuantities = false;
    }
    renderExploredStandardMods() {
        if (this.renderQueue.exploredStandardModifiers.size === 0)
            return;
        const explored = this.exploredConstellation;
        if (explored !== undefined) {
            const multi = this.hasMasterRelic(explored.realm) && this.isConstellationComplete(explored) ? 2 : 1;
            this.renderQueue.exploredStandardModifiers.forEach((modID) => {
                const astroMod = explored.standardModifiers[modID];
                if (astroMod === undefined) {
                    astrologyMenus.explorePanel.setStandardHidden(modID);
                    return;
                }
                astrologyMenus.explorePanel.setStandardShow(modID);
                if (this.isModifierUnlocked(explored, AstrologyModifierType.Standard, modID)) {
                    astrologyMenus.explorePanel.setStandardModifier(modID, astroMod, astroMod.timesBought * multi);
                    astrologyMenus.explorePanel.setStandardModifierStatus(modID, astroMod.timesBought, astroMod);
                } else {
                    astrologyMenus.explorePanel.setStandardLocked(modID, astroMod.unlockRequirements);
                    astrologyMenus.explorePanel.setStandardLockedStatus(modID, astroMod);
                }
            });
        }
        this.renderQueue.exploredStandardModifiers.clear();
    }
    renderExploredUniqueMods() {
        if (this.renderQueue.exploredUniqueModifiers.size === 0)
            return;
        const explored = this.exploredConstellation;
        if (explored !== undefined) {
            const multi = this.hasMasterRelic(explored.realm) && this.isConstellationComplete(explored) ? 2 : 1;
            this.renderQueue.exploredUniqueModifiers.forEach((modID) => {
                const astroMod = explored.uniqueModifiers[modID];
                if (astroMod === undefined) {
                    astrologyMenus.explorePanel.setUniqueHidden(modID);
                    return;
                }
                astrologyMenus.explorePanel.setUniqueShow(modID);
                if (this.isModifierUnlocked(explored, AstrologyModifierType.Unique, modID)) {
                    astrologyMenus.explorePanel.setUniqueModifier(modID, astroMod, astroMod.timesBought * multi);
                    astrologyMenus.explorePanel.setUniqueModifierStatus(modID, astroMod.timesBought, astroMod);
                } else {
                    astrologyMenus.explorePanel.setUniqueLocked(modID, astroMod.unlockRequirements);
                    astrologyMenus.explorePanel.setUniqueLockedStatus(modID, astroMod);
                }
            });
        }
        this.renderQueue.exploredUniqueModifiers.clear();
    }
    renderExploredAbyssalMods() {
        if (this.renderQueue.exploredAbyssalModifiers.size === 0)
            return;
        const explored = this.exploredConstellation;
        if (explored !== undefined) {
            const multi = this.hasMasterRelic(explored.realm) && this.isConstellationComplete(explored) ? 2 : 1;
            this.renderQueue.exploredAbyssalModifiers.forEach((modID) => {
                const astroMod = explored.abyssalModifiers[modID];
                if (astroMod === undefined) {
                    astrologyMenus.explorePanel.setAbyssalHidden(modID);
                    return;
                }
                astrologyMenus.explorePanel.setAbyssalShow(modID);
                if (this.isModifierUnlocked(explored, AstrologyModifierType.Abyssal, modID)) {
                    astrologyMenus.explorePanel.setAbyssalModifier(modID, astroMod, astroMod.timesBought * multi);
                    astrologyMenus.explorePanel.setAbyssalModifierStatus(modID, astroMod.timesBought, astroMod);
                } else {
                    astrologyMenus.explorePanel.setAbyssalLocked(modID, astroMod.unlockRequirements);
                    astrologyMenus.explorePanel.setAbyssalLockedStatus(modID, astroMod);
                }
            });
        }
        this.renderQueue.exploredAbyssalModifiers.clear();
    }
    renderVisibleConstellations() {
        if (!this.renderQueue.visibleConstellations)
            return;
        if (this.exploredConstellation === undefined) {
            let lowestLocked;
            this.actions.forEach((constellation) => {
                const menu = astrologyMenus.constellations.get(constellation);
                const isInRealm = constellation.realm === this.currentRealm;
                const isUnlocked = this.level >= constellation.level &&
                    (constellation.abyssalLevel < 1 || this.abyssalLevel >= constellation.abyssalLevel);
                if (isInRealm && !isUnlocked) {
                    if (lowestLocked === undefined ||
                        lowestLocked.level > constellation.level ||
                        lowestLocked.abyssalLevel > constellation.abyssalLevel)
                        lowestLocked = constellation;
                }
                if (menu === undefined)
                    return;
                if (isInRealm && isUnlocked) {
                    showElement(menu);
                } else {
                    hideElement(menu);
                }
            });
            if (lowestLocked === undefined) {
                hideElement(astrologyMenus.locked);
            } else {
                astrologyMenus.locked.setConstellation(lowestLocked, this);
                showElement(astrologyMenus.locked);
            }
            hideElement(astrologyMenus.explorePanel);
        } else {
            this.actions.forEach((constellation) => {
                const menu = astrologyMenus.constellations.get(constellation);
                if (menu === undefined)
                    return;
                if (constellation !== this.exploredConstellation) {
                    hideElement(menu);
                } else {
                    showElement(menu);
                    menu.setExplored();
                }
            });
            hideElement(astrologyMenus.locked);
            showElement(astrologyMenus.explorePanel);
            astrologyMenus.explorePanel.setConstellation(this.exploredConstellation);
        }
        this.renderQueue.visibleConstellations = false;
    }
    renderUpgradeCosts() {
        if (!this.renderQueue.upgradeCosts)
            return;
        if (this.exploredConstellation !== undefined) {
            astrologyMenus.explorePanel.setUpgradeCosts(this, this.exploredConstellation);
        }
        this.renderQueue.upgradeCosts = false;
    }
    /** Callback function for when the "View All Active Modifiers" button is clicked */
    viewAllModifiersOnClick() {
        const summary = new StatObjectSummary();
        const addAstroModProvidedStats = (recipe, astroMods, relicMultiplier) => {
            astroMods.forEach((astroMod) => {
                if (astroMod.timesBought <= 0)
                    return;
                const mult = relicMultiplier * astroMod.timesBought;
                summary.addStatObject(recipe, astroMod.stats, mult, mult);
            });
        };
        this.actions.forEach((recipe) => {
            const mult = this.hasMasterRelic(recipe.realm) && this.isConstellationComplete(recipe) ? 2 : 1;
            addAstroModProvidedStats(recipe, recipe.standardModifiers, mult);
            addAstroModProvidedStats(recipe, recipe.uniqueModifiers, mult);
            addAstroModProvidedStats(recipe, recipe.abyssalModifiers, mult);
        });
        const html = summary
            .getAllDescriptions()
            .map(getElementHTMLDescriptionFormatter('h5', 'font-w400 font-size-sm mb-1', false))
            .join('');
        SwalLocale.fire({
            title: getLangString('ASTROLOGY_MISC_6'),
            html,
        });
    }
    /** Callback function for when the "Study" button is clicked */
    studyConstellationOnClick(constellation) {
        const wasActive = this.isActive;
        if (this.isActive && !this.stop())
            return;
        if (!wasActive || constellation !== this.studiedConstellation) {
            this.studiedConstellation = constellation;
            this.start();
        }
    }
    /** Callback function for when the "Explore" button is clicked */
    exploreConstellationOnClick(constellation) {
        var _a;
        if (this.exploredConstellation === undefined) {
            this.exploredConstellation = constellation;
            this.onConstellationExplore();
        } else {
            (_a = astrologyMenus.constellations.get(this.exploredConstellation)) === null || _a === void 0 ? void 0 : _a.setUnexplored();
            this.exploredConstellation = undefined;
            this.renderQueue.progressBar = true;
        }
        this.renderQueue.visibleConstellations = true;
        this.render();
    }
    resetActionState() {
        super.resetActionState();
        this.studiedConstellation = undefined;
    }
    encodeAction(writer, recipe) {
        writer.writeNamespacedObject(recipe);
        writer.writeArray(recipe.standardModifiers, (astroMod, writer) => writer.writeUint8(astroMod.timesBought));
        writer.writeArray(recipe.uniqueModifiers, (astroMod, writer) => writer.writeUint8(astroMod.timesBought));
        writer.writeArray(recipe.abyssalModifiers, (astroMod, writer) => writer.writeUint8(astroMod.timesBought));
    }
    encode(writer) {
        super.encode(writer);
        writer.writeBoolean(this.studiedConstellation !== undefined);
        if (this.studiedConstellation)
            writer.writeNamespacedObject(this.studiedConstellation);
        writer.writeBoolean(this.exploredConstellation !== undefined);
        if (this.exploredConstellation)
            writer.writeNamespacedObject(this.exploredConstellation);
        writer.writeArray(this.actions.allObjects, (recipe, writer) => {
            this.encodeAction(writer, recipe);
        });
        writer.writeUint32(this.actions.dummySize);
        this.actions.forEachDummy((recipe) => {
            this.encodeAction(writer, recipe);
        });
        return writer;
    }
    decodeAction(reader, version) {
        const recipe = reader.getNamespacedObject(this.actions);
        const standardModsBought = reader.getArray((reader) => reader.getUint8());
        const uniqueModsBought = reader.getArray((reader) => reader.getUint8());
        if (!(typeof recipe === 'string')) {
            recipe.standardModifiers.forEach((astroMod, i) => (astroMod.timesBought = standardModsBought[i]));
            recipe.uniqueModifiers.forEach((astroMod, i) => (astroMod.timesBought = uniqueModsBought[i]));
        } else if (recipe.startsWith('melvor')) {
            const dummyRecipe = this.actions.getDummyObject(recipe, DummyAstrologyRecipe, this.game);
            dummyRecipe.standardModifiers = this.createDummyAstroMods(standardModsBought);
            dummyRecipe.uniqueModifiers = this.createDummyAstroMods(uniqueModsBought);
        }
        if (version >= 100 /* SaveVersion.IntoTheAbyss */ ) {
            const abyssalModsBought = reader.getArray((reader) => reader.getUint8());
            if (!(typeof recipe === 'string')) {
                recipe.abyssalModifiers.forEach((astroMod, i) => (astroMod.timesBought = abyssalModsBought[i]));
            } else if (recipe.startsWith('melvor')) {
                const dummyRecipe = this.actions.getDummyObject(recipe, DummyAstrologyRecipe, this.game);
                dummyRecipe.abyssalModifiers = this.createDummyAstroMods(abyssalModsBought);
            }
        }
    }
    createDummyAstroMods(timesBought) {
        return timesBought.map((timesBought) => {
            const astroMod = new AstrologyModifier({
                maxCount: timesBought,
                costs: []
            }, this.game, "melvorD:Normal_Logs" /* ItemIDs.Normal_Logs */ , '');
            astroMod.timesBought = timesBought;
            return astroMod;
        });
    }
    decode(reader, version) {
        super.decode(reader, version);
        if (reader.getBoolean()) {
            const studied = reader.getNamespacedObject(this.actions);
            if (typeof studied === 'string')
                this.shouldResetAction = true;
            else
                this.studiedConstellation = studied;
        }
        if (reader.getBoolean()) {
            const explored = reader.getNamespacedObject(this.actions);
            if (typeof explored !== 'string')
                this.exploredConstellation = explored;
        }
        reader.getArray((reader) => {
            this.decodeAction(reader, version);
        });
        const numDummyRecipes = reader.getUint32();
        for (let i = 0; i < numDummyRecipes; i++) {
            this.decodeAction(reader, version);
        }
        if (this.shouldResetAction)
            this.resetActionState();
        if (version < 34) {
            this.shouldRefundStardustAgain = true;
        }
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        const getConstellation = (id) => {
            const recipe = this.actions.getObjectByID(idMap.astrologyConstellations[id]);
            return recipe;
        };
        const studiedID = reader.getNumber();
        const exploredID = reader.getNumber();
        if (this.isActive) {
            this.studiedConstellation = getConstellation(studiedID);
            if (this.studiedConstellation === undefined)
                this.shouldResetAction = true;
        }
        if (exploredID >= 0) {
            this.exploredConstellation = getConstellation(exploredID);
        }
        if (version < 18) {
            this.shouldRefundStardust = true;
        }
        if (version > 18) {
            const numConstellations = reader.getNumber();
            for (let i = 0; i < numConstellations; i++) {
                const recipe = getConstellation(reader.getNumber());
                const standard = reader.getAstrologyModifierArray(this.game, idMap);
                const unique = reader.getAstrologyModifierArray(this.game, idMap);
                const getModBuyCount = (modArray, modsPossible) => {
                    const value = modArray[0].value;
                    return Math.round(value / modsPossible.incrementValue);
                };
                if (recipe !== undefined) {
                    standard.forEach((modArray, index) => {
                        recipe.standardModifiers[index].timesBought = getModBuyCount(modArray, recipe.standardModifiers[index]);
                    });
                    unique.forEach((modArray, index) => {
                        recipe.uniqueModifiers[index].timesBought = getModBuyCount(modArray, recipe.uniqueModifiers[index]);
                    });
                }
            }
        }
        if (this.shouldResetAction)
            this.resetActionState();
        if (version < 34) {
            this.shouldRefundStardustAgain = true;
        }
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.astrologyConstellations[oldActionID];
    }
    setFromOldOffline(offline, idMap) {
        const recipe = this.actions.getObjectByID(idMap.astrologyConstellations[offline.action]);
        if (recipe !== undefined)
            this.studyConstellationOnClick(recipe);
    }
    rollForMeteorite() {
        const random = Math.random() * 100;
        if (this.meteoriteChance > random)
            this.game.mining.addMeteoriteVein();
    }
    rollForStarfall() {
        const random = Math.random() * 100;
        if (this.starfallChance > random) {
            const starfallSize = Math.random();
            this.game.mining.addAbyciteVein(starfallSize);
            this.game.mining.addMysticiteVein(starfallSize);
            this.game.mining.addEchociteVein(starfallSize);
        }
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
            action.randomItems.forEach((item) => obtainable.add(item));
        });
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
                    return skillData.recipes;
            }
        }
    }
}
/** Mastery level required to unlock each standard modifier */
Astrology.standardModifierLevels = [1, 40, 80];
/** Mastery level required to unlock each unique modifier */
Astrology.uniqueModifierLevels = [20, 60, 99];
Astrology.abyssalModifierLevels = [1, 40, 80, 99]; // TODO_C - link to something abyssal related
Astrology.baseInterval = 3000;
/** The chances to roll for a modifier */
Astrology.modifierMagnitudeChances = [50, 30, 15, 4, 1];
var AstrologyModifierType;
(function(AstrologyModifierType) {
    AstrologyModifierType[AstrologyModifierType["Standard"] = 0] = "Standard";
    AstrologyModifierType[AstrologyModifierType["Unique"] = 1] = "Unique";
    AstrologyModifierType[AstrologyModifierType["Abyssal"] = 2] = "Abyssal";
})(AstrologyModifierType || (AstrologyModifierType = {}));
class AstrologyRenderQueue extends GatheringSkillRenderQueue {
    constructor() {
        super(...arguments);
        /** Updates the XP, Mastery XP, Mastery Pool XP, Interval, Stardust Chances and Doubling Chance of all constellations */
        this.constellationRates = false;
        /** Updates the owned stardust quantities for the visible explored constellation */
        this.stardustQuantities = false;
        /** Updates the specific standard modifier in the explore panel */
        this.exploredStandardModifiers = new Set();
        /** Updates the specific unique modifier in the explore panel */
        this.exploredUniqueModifiers = new Set();
        /** Updates the chances to obtain stardust and their doubling chance */
        this.stardustRates = false;
        /** Updates which constellations to display, and if the explore panel should be visible */
        this.visibleConstellations = false;
        /** Updates the costs to reroll a modifier */
        this.upgradeCosts = false;
        /** Updates the specific abyssal modifier in the explore panel */
        this.exploredAbyssalModifiers = new Set();
    }
}
//# sourceMappingURL=astrology.js.map
checkFileVersion('?12097')