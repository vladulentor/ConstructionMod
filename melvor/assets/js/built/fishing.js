"use strict";
class Fish extends SingleProductRecipe {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.strengthXP = data.strengthXP;
        this.baseMinInterval = data.baseMinInterval;
        this.baseMaxInterval = data.baseMaxInterval;
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        if (data.strengthXP !== undefined)
            this.strengthXP = data.strengthXP;
        if (data.baseMinInterval !== undefined)
            this.baseMinInterval = data.baseMinInterval;
        if (data.baseMaxInterval !== undefined)
            this.baseMaxInterval = data.baseMaxInterval;
    }
}
class FishingArea extends RealmedObject {
    constructor(namespace, data, fishing, game) {
        super(namespace, data, game);
        this.isSecret = false;
        try {
            this._name = data.name;
            this.fishChance = data.fishChance;
            this.junkChance = data.junkChance;
            this.specialChance = data.specialChance;
            this.fish = fishing.actions.getArrayFromIds(data.fishIDs);
            this.fish.forEach((fish) => {
                if (fish.area !== undefined)
                    throw new Error(`${Fish.name} with id "${fish.id}" already belongs to an area`);
                fish.area = this;
            });
            this._description = data.description;
            if (data.requiredItemID !== undefined) {
                this.requiredItem = game.items.equipment.getObjectSafe(data.requiredItemID);
            }
            if (data.isSecret)
                this.isSecret = true;
            if (data.poiRequirement !== undefined)
                game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(FishingArea.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`FISHING_AREA_NAME_${this.localID}`);
        }
    }
    get description() {
        if (this._description === undefined)
            return undefined;
        if (this.isModded) {
            return this._description;
        } else {
            return getLangString(`FISHING_AREA_DESCRIPTION_${this.localID}`);
        }
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.poiRequirement !== undefined)
                this.poiRequirement = new CartographyPOIDiscoveryRequirement(data.poiRequirement, game);
        } catch (e) {
            throw new DataConstructionError(FishingArea.name, e, this.id);
        }
    }
}
class Fishing extends GatheringSkill {
    constructor(namespace, game) {
        super(namespace, 'Fishing', game, Fish.name);
        this._media = "assets/media/skills/fishing/fishing.png" /* Assets.Fishing */ ;
        this.renderQueue = new FishingRenderQueue();
        /** If the player has read the message in a bottle */
        this.secretAreaUnlocked = false;
        /** The fish that are currently selected in each area */
        this.selectedAreaFish = new Map();
        /** Areas which the user has decided to hide */
        this.hiddenAreas = new Set();
        this.junkItems = [];
        this.specialItemTables = new Map();
        this.areas = new NamespaceRegistry(game.registeredNamespaces, FishingArea.name);
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    get actionInterval() {
        const minTicks = this.getMinFishInterval(this.activeFish) / TICK_INTERVAL;
        const maxTicks = this.getMaxFishInterval(this.activeFish) / TICK_INTERVAL;
        return TICK_INTERVAL * rollInteger(minTicks, maxTicks);
    }
    get actionLevel() {
        return this.activeFish.level;
    }
    get masteryAction() {
        return this.activeFish;
    }
    /** The fish that is currently selected and being fished */
    get activeFish() {
        if (this.activeFishingArea === undefined)
            throw new Error(`Tried to get active fish, but no area is active`);
        const fish = this.selectedAreaFish.get(this.activeFishingArea);
        if (fish === undefined)
            throw new Error('Tried to get active fish from area, but area has no fish selected');
        return fish;
    }
    registerData(namespace, data) {
        var _a, _b, _c, _d;
        (_a = data.fish) === null || _a === void 0 ? void 0 : _a.forEach((data) => {
            this.actions.registerObject(new Fish(namespace, data, this.game));
        });
        super.registerData(namespace, data);
        (_b = data.areas) === null || _b === void 0 ? void 0 : _b.forEach((area) => {
            this.areas.registerObject(new FishingArea(namespace, area, this, this.game));
        });
        (_c = data.junkItemIDs) === null || _c === void 0 ? void 0 : _c.forEach((itemID) => {
            const junkItem = this.game.items.getObjectByID(itemID);
            if (junkItem === undefined)
                throw new Error(`Error registering fishing skill data, junk item with id: ${itemID} is not registered.`);
            this.junkItems.push(junkItem);
        });
        (_d = data.specialItems) === null || _d === void 0 ? void 0 : _d.forEach(({
            realmID,
            drops
        }) => {
            const realm = this.game.realms.getObjectSafe(realmID);
            let dropTable = this.specialItemTables.get(realm);
            if (dropTable === undefined) {
                dropTable = new DropTable(this.game, drops);
                this.specialItemTables.set(realm, dropTable);
            } else {
                dropTable.registerDrops(this.game, drops);
            }
        });
        if (data.easterEgg !== undefined) {
            const original = this.game.items.getObjectByID(data.easterEgg.originalID);
            const equipped = this.game.items.equipment.getObjectByID(data.easterEgg.equippedID);
            const reward = this.game.items.getObjectByID(data.easterEgg.rewardID);
            if (!(original !== undefined && equipped !== undefined && reward !== undefined))
                throw new Error('Error registering easter egg. Blame Coolrox.');
            this.easterEgg = {
                original,
                equipped,
                reward
            };
        }
        if (data.fishingContestFish !== undefined) {
            if (this.contest === undefined)
                this.contest = new FishingContest(this);
            this.contest.registerData(data.fishingContestFish);
        }
    }
    modifyData(data) {
        var _a;
        super.modifyData(data);
        (_a = data.fish) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const fish = this.actions.getObjectByID(modData.id);
            if (fish === undefined)
                throw new UnregisteredDataModError(Fish.name, modData.id);
            fish.applyDataModification(modData, this.game);
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
    unlockSecretArea() {
        if (this.secretAreaUnlocked)
            return;
        this.secretAreaUnlocked = true;
        this.renderQueue.areaUnlock = true;
        this.render();
    }
    getActionModifierQueryParams(action) {
        const params = super.getActionModifierQueryParams(action);
        if (action instanceof Fish) {
            params.category = action.area;
        }
        return params;
    }
    /** Gets the minimum interval of a fish */
    getMinFishInterval(fish) {
        return this.modifyInterval(fish.baseMinInterval, fish);
    }
    /** Gets the maximum interval of a fish */
    getMaxFishInterval(fish) {
        return this.modifyInterval(fish.baseMaxInterval, fish);
    }
    getAreaChances(area) {
        const chances = new FishingAreaChances();
        chances.setChancesFromArea(area);
        const fishToSpecialShift = this.game.modifiers.fishingSpecialChance;
        const fish = this.selectedAreaFish.get(area);
        const query = this.getActionModifierQuery(fish);
        const noJunk = this.game.modifiers.getValue("melvorD:cannotFishJunk" /* ModifierIDs.cannotFishJunk */ , query);
        const bonusSpecialChance = this.game.modifiers.getValue("melvorD:bonusFishingSpecialChance" /* ModifierIDs.bonusFishingSpecialChance */ , query);
        chances.addBonusSpecialChance(bonusSpecialChance);
        chances.shiftFishToSpecial(fishToSpecialShift);
        if (noJunk)
            chances.shiftJunkToFish(chances.junk);
        return chances;
    }
    applyPrimaryProductMultipliers(item, quantity, action, query) {
        quantity = super.applyPrimaryProductMultipliers(item, quantity, action, query);
        // Mastery Level Doubling
        if (rollPercentage(this.game.modifiers.getValue("melvorD:fishingMasteryDoublingChance" /* ModifierIDs.fishingMasteryDoublingChance */ , query)))
            quantity *= 2;
        return quantity;
    }
    preAction() {}
    get actionRewards() {
        const rewards = new Rewards(this.game);
        rewards.setActionInterval(this.actionInterval);
        if (this.activeFishingArea === undefined)
            throw new Error('Tried to get actionRewards but no area is active.');
        const chances = this.getAreaChances(this.activeFishingArea);
        const fish = this.activeFish;
        const actionEvent = new FishingActionEvent(this, fish, this.activeFishingArea);
        let rewardType = chances.rollForRewardType();
        if (!this.game.tutorial.complete)
            rewardType = FishingRewardType.Fish; // Force reward to be fish during the tutorial
        // Determine the quantity of the item to give
        let rewardQty = 1;
        switch (rewardType) {
            case FishingRewardType.Fish:
                rewardQty = this.modifyPrimaryProductQuantity(fish.product, rewardQty, fish);
                break;
            case FishingRewardType.Special:
            case FishingRewardType.Junk:
                // Special + Junk are considered secondary products, and only get doubling
                rewardQty = this.applyPrimaryProductMultipliers(fish.product, rewardQty, fish, this.getActionModifierQuery(fish));
                break;
        }
        // Determine which item to give the player
        let rewardItem;
        switch (rewardType) {
            case FishingRewardType.Fish:
                rewardItem = fish.product;
                if (rollPercentage(this.game.modifiers.getValue("melvorD:fishingCurrencyGainChance" /* ModifierIDs.fishingCurrencyGainChance */ , rewardItem.sellsFor.currency.modQuery))) {
                    const currencyToAdd = this.modifyCurrencyReward(rewardItem.sellsFor.currency, rewardItem.sellsFor.quantity, fish);
                    rewards.addCurrency(rewardItem.sellsFor.currency, currencyToAdd);
                }
                this.addCurrencyFromPrimaryProductGain(rewards, rewardItem, rewardQty, fish);
                this.game.stats.Fishing.add(FishingStats.FishCaught, rewardQty);
                break;
            case FishingRewardType.Junk:
                rewardItem = getRandomArrayElement(this.junkItems);
                this.game.stats.Fishing.add(FishingStats.JunkCaught, rewardQty);
                break;
            case FishingRewardType.Special:
                {
                    actionEvent.specialItemGiven = true;
                    const dropTable = this.specialItemTables.get(fish.realm);
                    if (dropTable !== undefined) {
                        rewardItem = dropTable.getDrop().item;
                        this.game.stats.Fishing.add(FishingStats.SpecialItemsCaught, rewardQty);
                        if (rollPercentage(this.game.modifiers.getValue("melvorD:fishingAdditionalSpecialItemChance" /* ModifierIDs.fishingAdditionalSpecialItemChance */ , this.getActionModifierQuery(fish)))) {
                            const additionalSpecialItem = dropTable.getDrop().item;
                            rewards.addItem(additionalSpecialItem, 1);
                            this.game.stats.Fishing.inc(FishingStats.SpecialItemsCaught);
                        }
                    } else {
                        rewardItem = fish.product;
                        this.game.stats.Fishing.add(FishingStats.FishCaught, rewardQty);
                    }
                }
                break;
        }
        if (this.easterEgg !== undefined &&
            rewardItem === this.easterEgg.original &&
            this.game.combat.player.equipment.checkForItem(this.easterEgg.equipped) &&
            this.getMasteryPoolProgress(this.game.defaultRealm) >= 100 &&
            this.getMasteryLevel(fish) >= 99 &&
            rollPercentage(0.01))
            rewardItem = this.easterEgg.reward;
        actionEvent.rewardItem = rewardItem;
        actionEvent.productQuantity = rewardQty;
        rewards.addItem(rewardItem, rewardQty);
        // Add XP Rewards
        if (rewardType !== FishingRewardType.Junk) {
            rewards.addXP(this, fish.baseExperience, fish);
            rewards.addAbyssalXP(this, fish.baseAbyssalExperience, fish);
            if (fish.strengthXP > 0)
                rewards.addXP(this.game.strength, fish.strengthXP);
        } else {
            rewards.addXP(this, 1, fish);
        }
        if (rollPercentage(this.game.modifiers.getValue("melvorD:additionalSameAreaFishChance" /* ModifierIDs.additionalSameAreaFishChance */ , this.getActionModifierQuery(fish)))) {
            if (this.activeFishingArea !== undefined) {
                const randomFish = getRandomArrayElement(this.activeFishingArea.fish);
                rewards.addItem(randomFish.product, 1);
            }
        }
        this.addCommonRewards(rewards, fish);
        if (rewardItem.type === 'Gem') {
            actionEvent.gemGiven = true;
            if (rollPercentage(this.game.modifiers.summoningSynergy_4_5))
                rewards.addItem(this.game.randomGemTable.getDrop().item, 1);
        }
        // Pig + Octopus => +75% to receive the cooked version of a fish
        const cookedItem = this.game.cooking.getIngredientCookedVersion(rewardItem);
        if (cookedItem !== undefined) {
            actionEvent.cookedVersionExists = true;
            if (rollPercentage(this.game.modifiers.getValue("melvorD:fishingCookedChance" /* ModifierIDs.fishingCookedChance */ , this.getActionModifierQuery(fish))))
                rewards.addItem(cookedItem, 1);
        }
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    postAction() {
        this.game.stats.Fishing.inc(FishingStats.Actions);
        this.game.stats.Fishing.add(FishingStats.TimeSpent, this.currentActionInterval);
        this.renderQueue.selectedAreaFishRates = true;
        this.renderQueue.areaChances = true;
    }
    get masteryModifiedInterval() {
        return this.currentActionInterval;
    }
    onModifierChange() {
        super.onModifierChange();
        this.renderQueue.areaChances = true;
        this.renderQueue.selectedAreaFishRates = true;
        this.renderQueue.areaButtons = true;
    }
    onEquipmentChange() {
        this.renderQueue.areaUnlock = true;
    }
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.renderQueue.areaButtons = true;
    }
    getErrorLog() {
        var _a;
        const selectedFishLog = [];
        this.selectedAreaFish.forEach((fish, area) => {
            selectedFishLog.push(`${area.id}:${fish.id}`);
        });
        return `${super.getErrorLog()}
Active Area: ${(_a = this.activeFishingArea) === null || _a === void 0 ? void 0 : _a.id}
Selected Area Fish: 
${selectedFishLog.join('\n')}
`;
    }
    onLoad() {
        var _a;
        super.onLoad();
        this.areas.forEach((area) => {
            var _a;
            (_a = fishingAreaMenus.get(area)) === null || _a === void 0 ? void 0 : _a.setAreaData(area);
        });
        this.renderQueue.selectedAreaFish = true;
        this.renderQueue.selectedAreaFishRates = true;
        this.renderQueue.areaChances = true;
        this.renderQueue.areaButtons = true;
        this.renderQueue.areaUnlock = true;
        if (this.isActive) {
            this.renderQueue.activeArea = true;
        }
        this.renderHiddenAreas();
        this.selectedAreaFish.forEach((fish) => {
            this.renderQueue.actionMastery.add(fish);
        });
        (_a = this.contest) === null || _a === void 0 ? void 0 : _a.onLoad();
    }
    onStop() {
        var _a;
        if (this.activeFishingArea !== undefined)
            (_a = fishingAreaMenus.get(this.activeFishingArea)) === null || _a === void 0 ? void 0 : _a.setActionInactive();
    }
    onAncientRelicUnlock() {
        super.onAncientRelicUnlock();
        this.renderQueue.selectedAreaFish = true;
        this.renderQueue.selectedAreaFishRates = true;
        this.renderQueue.areaChances = true;
        if (this.isActive) {
            this.renderQueue.activeArea = true;
        }
    }
    onRealmChange() {
        super.onRealmChange();
        this.renderQueue.areaUnlock = true;
    }
    /** Callback function for when the start button of an area is clicked */
    onAreaStartButtonClick(area) {
        const wasActive = this.isActive;
        if (this.isActive && !this.stop())
            return;
        const prevArea = this.activeFishingArea;
        this.activeFishingArea = area;
        if ((!wasActive || area !== prevArea) &&
            this.selectedAreaFish.get(area) !== undefined &&
            this.level >= this.activeFish.level &&
            (this.activeFish.abyssalLevel < 1 || this.abyssalLevel >= this.activeFish.abyssalLevel)) {
            this.start();
            this.renderQueue.activeArea = true;
        }
        this.render();
    }
    renderHiddenAreas() {
        this.areas.forEach((area) => {
            const menu = fishingAreaMenus.get(area);
            if (this.hiddenAreas.has(area))
                menu === null || menu === void 0 ? void 0 : menu.hideAreaPanel();
            else
                menu === null || menu === void 0 ? void 0 : menu.showAreaPanel();
        });
    }
    /** Callback function for when the fishing area menu header is clicked */
    onAreaHeaderClick(area) {
        var _a, _b;
        if (this.hiddenAreas.has(area)) {
            this.hiddenAreas.delete(area);
            (_a = fishingAreaMenus.get(area)) === null || _a === void 0 ? void 0 : _a.showAreaPanel();
        } else {
            this.hiddenAreas.add(area);
            (_b = fishingAreaMenus.get(area)) === null || _b === void 0 ? void 0 : _b.hideAreaPanel();
        }
    }
    /** Callback function for when a fish is selected */
    onAreaFishSelection(area, fish) {
        const previousSelection = this.selectedAreaFish.get(area);
        if (area === this.activeFishingArea && previousSelection !== fish && this.isActive && !this.stop())
            return;
        this.selectedAreaFish.set(area, fish);
        this.renderQueue.selectedAreaFish = true;
        this.renderQueue.selectedAreaFishRates = true;
        this.renderQueue.areaChances = true;
        this.renderQueue.actionMastery.add(fish);
        this.render();
    }
    render() {
        var _a;
        this.renderSelectedAreaFish();
        super.render();
        this.renderSelectedFishRates();
        this.renderAreaChances();
        this.renderAreaButtons();
        this.renderAreaUnlock();
        this.renderActiveArea();
        (_a = this.contest) === null || _a === void 0 ? void 0 : _a.render();
    }
    /** Renders the fish in areas that have one selected */
    renderSelectedAreaFish() {
        if (!this.renderQueue.selectedAreaFish)
            return;
        this.areas.forEach((area) => {
            const menu = fishingAreaMenus.get(area);
            const selectedFish = this.selectedAreaFish.get(area);
            if (selectedFish !== undefined) {
                menu === null || menu === void 0 ? void 0 : menu.setSelectedFish(selectedFish);
            } else {
                menu === null || menu === void 0 ? void 0 : menu.setUnselected();
            }
        });
        this.renderQueue.selectedAreaFish = false;
    }
    renderSelectedFishRates() {
        if (!this.renderQueue.selectedAreaFishRates)
            return;
        this.areas.forEach((area, id) => {
            const menu = fishingAreaMenus.get(area);
            const selectedFish = this.selectedAreaFish.get(area);
            if (selectedFish !== undefined) {
                menu === null || menu === void 0 ? void 0 : menu.updateSelectedFishRates(selectedFish);
            }
        });
        this.renderQueue.selectedAreaFishRates = false;
    }
    /** Renders the fish chances of all areas */
    renderAreaChances() {
        if (!this.renderQueue.areaChances)
            return;
        this.areas.forEach((area) => {
            var _a;
            (_a = fishingAreaMenus.get(area)) === null || _a === void 0 ? void 0 : _a.setChances(this.getAreaChances(area), area);
        });
        this.renderQueue.areaChances = false;
    }
    renderAreaButtons() {
        if (!this.renderQueue.areaButtons)
            return;
        this.areas.forEach((area) => {
            var _a;
            (_a = fishingAreaMenus.get(area)) === null || _a === void 0 ? void 0 : _a.updateButtons(area, this);
        });
        this.renderQueue.areaButtons = false;
    }
    renderAreaUnlock() {
        if (!this.renderQueue.areaUnlock)
            return;
        this.areas.forEach((area) => {
            const menu = fishingAreaMenus.get(area);
            if (menu === undefined)
                return;
            if ((area.isSecret && !this.secretAreaUnlocked) ||
                (area.requiredItem !== undefined && !this.game.combat.player.equipment.checkForItem(area.requiredItem)) ||
                (area.poiRequirement !== undefined && !area.poiRequirement.isMet()) ||
                area.realm !== this.currentRealm) {
                hideElement(menu);
            } else {
                showElement(menu);
            }
        });
        this.renderQueue.areaUnlock = false;
    }
    renderActiveArea() {
        var _a;
        if (!this.renderQueue.activeArea)
            return;
        if (this.isActive && this.activeFishingArea !== undefined) {
            (_a = fishingAreaMenus.get(this.activeFishingArea)) === null || _a === void 0 ? void 0 : _a.setActionActive();
        }
        this.renderQueue.activeArea = false;
    }
    encode(writer) {
        super.encode(writer);
        writer.writeBoolean(this.secretAreaUnlocked);
        if (this.isActive) {
            if (this.activeFishingArea === undefined)
                throw new Error(`Error encoding Fishing. Skill is active, but no area is active.`);
            writer.writeNamespacedObject(this.activeFishingArea);
        }
        writer.writeMap(this.selectedAreaFish, (key, writer) => {
            writer.writeNamespacedObject(key);
        }, (value, writer) => {
            writer.writeNamespacedObject(value);
        });
        writer.writeSet(this.hiddenAreas, (value, writer) => {
            writer.writeNamespacedObject(value);
        });
        writer.writeBoolean(this.contest !== undefined);
        if (this.contest !== undefined)
            this.contest.encode(writer);
        return writer;
    }
    resetActionState() {
        super.resetActionState();
        this.activeFishingArea = undefined;
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.secretAreaUnlocked = reader.getBoolean();
        if (this.isActive) {
            const area = reader.getNamespacedObject(this.areas);
            if (typeof area === 'string')
                this.shouldResetAction = true;
            else
                this.activeFishingArea = area;
        }
        this.selectedAreaFish = reader.getMap(readNamespacedReject(this.areas), readNamespacedReject(this.actions));
        this.hiddenAreas = reader.getSet(readNamespacedReject(this.areas));
        if (this.isActive &&
            this.activeFishingArea !== undefined &&
            this.selectedAreaFish.get(this.activeFishingArea) === undefined)
            this.shouldResetAction = true;
        if (this.shouldResetAction)
            this.resetActionState();
        if (version >= 71 && version < 76)
            FishingContest.dumpData(reader);
        if (version >= 76) {
            if (reader.getBoolean()) {
                if (this.contest !== undefined)
                    this.contest.decode(reader, version);
                else
                    FishingContest.dumpData(reader);
            }
        }
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        const getArea = (id) => {
            return this.areas.getObjectByID(idMap.fishingAreas[id]);
        };
        const getFish = (id) => {
            return this.actions.getObjectByID(idMap.fishingFish[id]);
        };
        this.secretAreaUnlocked = reader.getBool();
        const activeAreaID = reader.getNumber();
        if (this.isActive) {
            this.activeFishingArea = getArea(activeAreaID);
            if (this.activeFishingArea === undefined)
                this.shouldResetAction = true;
        }
        const numSetAreas = reader.getNumber();
        for (let i = 0; i < numSetAreas; i++) {
            const area = getArea(reader.getNumber());
            const fish = getFish(reader.getNumber());
            if (area !== undefined && fish !== undefined)
                this.selectedAreaFish.set(area, fish);
        }
        if (version >= 17) {
            const numHiddenAreas = reader.getNumber();
            for (let i = 0; i < numHiddenAreas; i++) {
                const area = getArea(reader.getNumber());
                if (area !== undefined)
                    this.hiddenAreas.add(area);
            }
        }
        if (this.isActive &&
            this.activeFishingArea !== undefined &&
            this.selectedAreaFish.get(this.activeFishingArea) === undefined)
            this.shouldResetAction = true;
        if (this.shouldResetAction)
            this.resetActionState();
    }
    convertFromOldFormat(savegame) {
        if (savegame.secretAreaUnlocked !== undefined)
            this.secretAreaUnlocked = savegame.secretAreaUnlocked;
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.fishingFish[oldActionID];
    }
    setFromOldOffline(offline, idMap) {
        const area = this.areas.getObjectByID(idMap.fishingAreas[offline.action[0]]);
        if (area !== undefined && offline.action[1] < area.fish.length) {
            this.onAreaFishSelection(area, area.fish[offline.action[1]]);
            this.onAreaStartButtonClick(area);
        }
    }
    testTranslations() {
        super.testTranslations();
        this.areas.forEach((area) => {
            area.name;
            area.description;
        });
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        this.specialItemTables.forEach((table) => {
            table.sortedDropsArray.forEach((drop) => obtainable.add(drop.item));
        });
        this.junkItems.forEach((item) => obtainable.add(item));
        this.actions.forEach((action) => obtainable.add(action.product));
        if (this.easterEgg)
            obtainable.add(this.easterEgg.reward);
        // Random Gems + Cooked item versions ignored
        return obtainable;
    }
    getRegistry(type) {
        switch (type) {
            case ScopeSourceType.Category:
                return this.areas;
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
                    return skillData.areas;
                case ScopeSourceType.Action:
                    return skillData.fish;
            }
        }
    }
}
class FishingAreaChances {
    constructor() {
        this.fish = 100;
        this.special = 0;
        this.junk = 0;
    }
    setChancesFromArea(area) {
        this.fish = area.fishChance;
        this.special = area.specialChance;
        this.junk = area.junkChance;
    }
    /** Adds bonus special chance, first taking from junk chance, then from fish chance */
    addBonusSpecialChance(amount) {
        const junkToSpecialShift = clampValue(amount, -this.special, this.junk);
        this.junk -= junkToSpecialShift;
        this.special += junkToSpecialShift;
        amount -= junkToSpecialShift;
        const fishToSpecialShift = clampValue(amount, -this.special, this.fish);
        this.fish -= fishToSpecialShift;
        this.special += fishToSpecialShift;
    }
    shiftFishToSpecial(amount) {
        amount = clampValue(amount, -this.special, this.fish);
        this.fish -= amount;
        this.special += amount;
    }
    shiftJunkToFish(amount) {
        amount = clampValue(amount, -this.fish, this.junk);
        this.junk -= amount;
        this.fish += amount;
    }
    rollForRewardType() {
        const roll = Math.random() * 100;
        if (roll < this.fish)
            return FishingRewardType.Fish;
        else if (roll < this.fish + this.junk)
            return FishingRewardType.Junk;
        else
            return FishingRewardType.Special;
    }
}
class FishingContest {
    constructor(fishing) {
        this.fishing = fishing;
        this.MAX_CONTESTANTS = 10; //INCLUDES PLAYER
        /** Fishing Contest Data. If not undefined - contest is available */
        this.availableFish = [];
        this.isActive = false;
        this.playerResults = [];
        this.contestantLeaderboard = [];
        this.actionsRemaining = 0;
        this.difficulties = ['Beginner', 'Novice', 'Intermediate', 'Hard', 'Expert', 'Master'];
        this.currentDifficulty = 0;
        this.completionTracker = [false, false, false, false, false, false];
        this.masteryTracker = [false, false, false, false, false, false];
        this.renderQueue = {
            status: false,
            results: false,
            leaderboard: false,
            remainingActions: false,
        };
        this.actionHandler = this.onFishingAction.bind(this);
    }
    registerData(data) {
        this.availableFish = data.map((fish) => {
            const fishItem = game.items.getObjectByID(fish.fishID);
            if (fishItem === undefined)
                throw new Error(`Error registering fishing contest fish. Blame Coolrox.`);
            return {
                fish: fishItem,
                level: fish.level,
                minLength: fish.minLength,
                maxLength: fish.maxLength,
            };
        });
    }
    onLoad() {
        const menu = new FishingContestMenuElement();
        menu.setHeader(this);
        menu.className = 'col-12';
        menu.updateContestStatus(this.isActive);
        menu.setDifficulties(this, this.difficulties);
        const fishingContestMenuContainer = document.getElementById('fishing-contest-menu-container');
        fishingContestMenuContainer.append(menu);
        this.menu = menu;
        this.renderQueue.status = true;
    }
    startFishingContest() {
        this.decideFishingContestFish();
        this.generateNewFishingContestLeaderboard();
        this.playerResults = [];
        this.actionsRemaining = 20;
        this.isActive = true;
        this.fishing.on('action', this.actionHandler);
        this.renderQueue.status = true;
        this.renderQueue.results = true;
        this.renderQueue.remainingActions = true;
    }
    stopFishingContest(forceStop) {
        var _a, _b;
        if (!forceStop)
            this.finalizeFishingContest();
        (_a = this.menu) === null || _a === void 0 ? void 0 : _a.updateContestStatus(false);
        (_b = this.menu) === null || _b === void 0 ? void 0 : _b.setDifficulties(this, this.difficulties);
        this.isActive = false;
        this.fishing.off('action', this.actionHandler);
        this.actionsRemaining = 0;
        this.renderQueue.status = true;
        this.renderQueue.results = true;
        this.renderQueue.remainingActions = true;
        this.renderQueue.leaderboard = true;
    }
    setFishingContestDifficulty(difficulty) {
        var _a;
        this.currentDifficulty = difficulty;
        (_a = this.menu) === null || _a === void 0 ? void 0 : _a.setDifficultyText(getLangString(`FISHING_CONTEST_DIFFICULTY_${this.difficulties[difficulty]}`));
        this.startFishingContest();
    }
    finalizeFishingContest() {
        let completion = false;
        let mastered = false;
        if (this.contestantLeaderboard[0].isPlayer) {
            const bestCatch = this.getBestFishingContestResultForPlayer();
            const fishRank = this.getFishRanking(bestCatch);
            if (fishRank === 'P') {
                mastered = true;
                completion = true;
                this.masteryTracker[this.currentDifficulty] = true;
                this.completionTracker[this.currentDifficulty] = true;
                if (this.completionTracker.every((completed) => completed)) {
                    game.birthdayEvent2023CompletionTracker[1] = true;
                    game.renderQueue.birthdayEventProgress = true;
                }
            } else if (fishRank === 'S') {
                completion = true;
                this.completionTracker[this.currentDifficulty] = true;
                if (this.completionTracker.every((completed) => completed)) {
                    game.birthdayEvent2023CompletionTracker[1] = true;
                    game.renderQueue.birthdayEventProgress = true;
                }
            }
        }
        this.showFishingContestResults(completion, mastered);
    }
    showFishingContestResults(completion, mastered) {
        SwalLocale.fire({
            title: getLangString('FISHING_CONTEST_RESULTS'),
            html: this.generateFishingContestResultsHTML(completion, mastered),
        });
    }
    generateFishingContestResultsHTML(completion, mastered) {
        const sortedLeaderboard = this.contestantLeaderboard.sort((a, b) => b.bestResult.weight - a.bestResult.weight);
        const placement = sortedLeaderboard.findIndex((contestant) => contestant.isPlayer);
        const results = sortedLeaderboard.find((contestant) => contestant.isPlayer);
        if (results === undefined)
            throw new Error('Could not find player in fishing contest leaderboard');
        const positions = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
        let html = `<h5 class="font-w600 text-center">${templateLangString('FISHING_CONTEST_FINISHED_POSITION', {
            position: getLangString(positions[placement]),
        })}</h5>
      <h5 class="font-w400 text-center">${getLangString('FISHING_CONTEST_BEST_CATCH_WAS')} <span class="text-success">
        ${templateLangString('FISHING_CONTEST_SIZE', { size: formatFixed(results === null || results === void 0 ? void 0 : results.bestResult.length, 2) })} | 
        ${templateLangString('FISHING_CONTEST_WEIGHT', {
            weight: formatFixed(results === null || results === void 0 ? void 0 : results.bestResult.weight, 4),
        })} | ${getLangString('FISHING_CONTEST_RANK')} ${this.getFishRanking(results.bestResult)}</span>
      </h5>`;
        if (completion) {
            html += `<h5 class="font-w600 text-center">${getLangString('COMPLETION_CONGRATS')} <img class="skill-icon-xxs mr-1" src="${assets.getURI("assets/media/main/milestones_header.png" /* Assets.SkillMilestones */)}">${templateLangString('FISHING_CONTEST_COMPLETION_ACHIEVED', {
                difficulty: getLangString(`FISHING_CONTEST_DIFFICULTY_${this.difficulties[this.currentDifficulty]}`),
            })}</h5>`;
        }
        if (mastered) {
            html += `<h5 class="font-w600 text-center">${getLangString('COMPLETION_CONGRATS')} <img class="skill-icon-xxs mr-1" src="${assets.getURI("assets/media/main/mastery_header.png" /* Assets.MasteryIcon */)}">${templateLangString('FISHING_CONTEST_MASTERY_ACHIEVED', {
                difficulty: getLangString(`FISHING_CONTEST_DIFFICULTY_${this.difficulties[this.currentDifficulty]}`),
            })}</h5>`;
        }
        return html;
    }
    generateNewFishingContestLeaderboard() {
        var _a;
        this.contestantLeaderboard = [];
        for (let i = 0; i < this.MAX_CONTESTANTS - 1; i++) {
            this.contestantLeaderboard.push({
                name: `${Golbin.names[Math.floor(Math.random() * Golbin.names.length)]}`,
                isPlayer: false,
                bestResult: {
                    length: 0,
                    weight: 0,
                },
            });
        }
        this.contestantLeaderboard.push({
            name: game.characterName,
            isPlayer: true,
            bestResult: {
                length: 0,
                weight: 0,
            },
        });
        (_a = this.menu) === null || _a === void 0 ? void 0 : _a.generateLeaderboard(this, this.contestantLeaderboard);
    }
    getBestFishingContestResultForPlayer() {
        var _a, _b;
        return ((_b = (_a = this.contestantLeaderboard.find((contestant) => contestant.isPlayer)) === null || _a === void 0 ? void 0 : _a.bestResult) !== null && _b !== void 0 ? _b : {
            length: 0,
            weight: 0,
        });
    }
    getBestFishingContestResultForContestant(index) {
        return this.contestantLeaderboard[index].bestResult;
    }
    decideFishingContestFish() {
        const availableFish = this.availableFish.filter((fish) => fish.level <= game.fishing.level);
        const fish = getRandomArrayElement(availableFish);
        this.activeFish = fish;
    }
    /** Handler for Fishing action event, when contest is active */
    onFishingAction(e) {
        var _a;
        if (!this.isActive || e.rewardItem !== ((_a = this.activeFish) === null || _a === void 0 ? void 0 : _a.fish))
            return;
        for (let i = 0; i < e.productQuantity; i++) {
            this.peformPlayerFishingContestAction();
        }
        this.peformContestantFishingContestActions();
        this.actionsRemaining--;
        this.renderQueue.remainingActions = true;
        if (this.actionsRemaining <= 0)
            this.stopFishingContest(false);
    }
    peformPlayerFishingContestAction() {
        if (this.activeFish === undefined)
            return;
        const fishResult = this.rollFishResult(this.activeFish, true);
        this.playerResults.unshift(fishResult);
        if (fishResult.weight > this.getBestFishingContestResultForPlayer().weight) {
            this.updateBestFishResultForPlayer(fishResult);
            this.renderQueue.leaderboard = true;
        }
    }
    peformContestantFishingContestActions() {
        this.contestantLeaderboard.forEach((contestant, id) => {
            if (contestant.isPlayer)
                return;
            if (this.activeFish === undefined)
                return;
            const fishResult = this.rollFishResult(this.activeFish, false);
            if (fishResult.weight > this.getBestFishingContestResultForContestant(id).weight) {
                this.updateBestFishResultForContestant(fishResult, id);
                this.renderQueue.leaderboard = true;
            }
        });
    }
    updateBestFishResultForPlayer(result) {
        const playerResult = this.contestantLeaderboard.find((contestant) => contestant.isPlayer);
        if (playerResult === undefined)
            throw new Error('Player result not found in leaderboard');
        playerResult.bestResult = result;
        this.renderQueue.results = true;
    }
    updateBestFishResultForContestant(result, index) {
        this.contestantLeaderboard[index].bestResult = result;
        this.renderQueue.results = true;
    }
    getMinLengthModifierForContestant() {
        switch (this.currentDifficulty) {
            case 1:
                return 0.2;
            case 2:
                return 0.4;
            case 3:
                return 0.6;
            case 4:
                return 0.8;
            case 5:
                return 0.9;
            default:
                return 0;
        }
    }
    getMaxLengthModifierForContestant() {
        switch (this.currentDifficulty) {
            case 0:
                return 0.85;
            case 1:
                return 0.95;
            case 2:
                return 0.98;
            default:
                return 1;
        }
    }
    rollFishResult(fish, isPlayer) {
        const lengthModifier = isPlayer ? 0.02 * this.playerResults.length : 0;
        const minLengthModifier = !isPlayer ? this.getMinLengthModifierForContestant() : 0;
        const maxLengthModifier = !isPlayer ? this.getMaxLengthModifierForContestant() : 0;
        const maxLength = isPlayer ? applyModifier(fish.maxLength, lengthModifier) : fish.maxLength * maxLengthModifier;
        let minLength = applyModifier(fish.minLength, lengthModifier);
        minLength += (maxLength - minLength) * minLengthModifier;
        const lengthRoll = Math.random() * (maxLength - minLength) + minLength;
        const weight = 0.00001 * Math.pow(lengthRoll, 3);
        return {
            length: lengthRoll,
            weight: weight,
        };
    }
    getFishRanking(result) {
        if (this.activeFish === undefined)
            throw new Error('No active fishing contest fish');
        if (result.length >= this.activeFish.maxLength)
            return 'P';
        if (result.length >= this.activeFish.maxLength * 0.99)
            return 'S';
        if (result.length >= this.activeFish.maxLength * 0.97)
            return 'A';
        if (result.length >= this.activeFish.maxLength * 0.9)
            return 'B';
        if (result.length >= this.activeFish.maxLength * 0.7)
            return 'C';
        if (result.length >= this.activeFish.maxLength * 0.35)
            return 'D';
        return 'E';
    }
    render() {
        this.renderStatus();
        this.renderResults();
        this.renderLeaderboard();
        this.renderRemainingActions();
    }
    renderStatus() {
        if (!this.renderQueue.status)
            return;
        if (this.menu !== undefined) {
            this.menu.updateContestStatus(this.isActive);
            if (this.activeFish !== undefined)
                this.menu.setActiveFish(this.activeFish);
        }
        this.renderQueue.status = false;
    }
    renderResults() {
        if (!this.renderQueue.results)
            return;
        if (this.menu !== undefined)
            this.menu.updateBestFish(this.getBestFishingContestResultForPlayer());
        this.renderQueue.results = false;
    }
    renderLeaderboard() {
        if (!this.renderQueue.leaderboard)
            return;
        if (this.menu !== undefined)
            this.menu.updateLeaderboard(this, this.contestantLeaderboard);
        this.renderQueue.leaderboard = false;
    }
    renderRemainingActions() {
        if (!this.renderQueue.remainingActions)
            return;
        if (this.menu !== undefined)
            this.menu.updateRemainingActions(this.actionsRemaining);
        this.renderQueue.remainingActions = false;
    }
    encode(writer) {
        writer.writeArray(this.completionTracker, (value, writer) => {
            writer.writeBoolean(value);
        });
        writer.writeArray(this.masteryTracker, (value, writer) => {
            writer.writeBoolean(value);
        });
        return writer;
    }
    decode(reader, version) {
        this.completionTracker = reader.getArray((reader) => reader.getBoolean());
        this.masteryTracker = reader.getArray((reader) => reader.getBoolean());
    }
    static dumpData(reader) {
        reader.skipArrayBytes(1);
        reader.skipArrayBytes(1);
    }
}
var FishingRewardType;
(function(FishingRewardType) {
    FishingRewardType[FishingRewardType["Fish"] = 0] = "Fish";
    FishingRewardType[FishingRewardType["Junk"] = 1] = "Junk";
    FishingRewardType[FishingRewardType["Special"] = 2] = "Special";
})(FishingRewardType || (FishingRewardType = {}));
class FishingRenderQueue extends GatheringSkillRenderQueue {
    constructor() {
        super(...arguments);
        /** Updates the fish specific information for an area */
        this.selectedAreaFish = false;
        /** Updates only the rates of the selected area fish */
        this.selectedAreaFishRates = false;
        /** Updates the chances for all areas */
        this.areaChances = false;
        /** Updates the display of areas based on unlock staus */
        this.areaUnlock = false;
        /** Updates the individual fish buttons of all area menus */
        this.areaButtons = false;
        /** Updates the status of the active fish/start button */
        this.activeArea = false;
    }
}
//# sourceMappingURL=fishing.js.map
checkFileVersion('?12097')