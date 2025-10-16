"use strict";
class MiningRenderQueue extends GatheringSkillRenderQueue {
    constructor() {
        super(...arguments);
        this.rockHP = new Set();
        this.rockStatus = new Set();
        this.rockRates = false;
        this.rockUnlock = false;
        this.respawnProgress = new Set();
        this.rockVisibility = false;
    }
}
const rockMenus = new Map();

function loadMiningOres() {
    const oreContainer = document.getElementById('mining-ores-container');
    const sortedActions = game.mining.actions.allObjects.sort((a, b) => a.level - b.level);
    sortedActions.forEach((rock, id) => {
        const rockMenu = createElement('mining-rock', {
            className: 'col-6 col-lg-4 col-xl-3'
        });
        rockMenus.set(rock, rockMenu);
        oreContainer.append(rockMenu);
        rockMenu.setRock(rock);
    });
}
class MiningCategory extends NamespacedObject {
    constructor(namespace, data) {
        super(namespace, data.id);
        this.givesGemVeins = false;
        this.givesAbyssalGemVeins = false;
        this._name = data.name;
        this.badgeClass = data.badgeClass;
        if (data.givesGemVeins !== undefined)
            this.givesGemVeins = data.givesGemVeins;
        if (data.givesAbyssalGemVeins !== undefined)
            this.givesAbyssalGemVeins = data.givesAbyssalGemVeins;
    }
    get name() {
        if (this.isModded)
            return this._name;
        return getLangString(`MINING_TYPE_${this.localID}`);
    }
}
class MiningRock extends SingleProductRecipe {
    constructor(namespace, data, game) {
        var _a, _b;
        super(namespace, data, game);
        // Active Data
        this.currentHP = 0;
        this.maxHP = 0;
        this.isRespawning = false;
        try {
            this._name = data.name;
            this._media = data.media;
            this.baseRespawnInterval = data.baseRespawnInterval;
            this.baseQuantity = data.baseQuantity;
            this.totalMasteryRequired = (_a = data.totalMasteryRequired) !== null && _a !== void 0 ? _a : 0;
            this.hasPassiveRegen = data.hasPassiveRegen;
            this.giveGems = data.giveGems;
            this.superiorGemChance = data.superiorGemChance;
            if (data.shopItemPurchased !== undefined) {
                this.shopItemPurchased = game.shop.purchases.getObjectSafe(data.shopItemPurchased);
            }
            if (data.fixedMaxHP !== undefined)
                this.fixedMaxHP = data.fixedMaxHP;
            const categoryID = (_b = data.category) !== null && _b !== void 0 ? _b : `${"melvorD" /* Namespaces.Demo */}:${data.type}`;
            this.category = game.mining.categories.getObjectSafe(categoryID);
            if (data.gemVeinWeight !== undefined)
                this.gemVeinWeight = data.gemVeinWeight;
            if (data.abyssalGemVeinWeight !== undefined)
                this.abyssalGemVeinWeight = data.abyssalGemVeinWeight;
            this.abyssalGemChance = data.abyssalGemChance;
        } catch (e) {
            throw new DataConstructionError(MiningRock.name, e, this.id);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`ORE_NAME_${this.localID}`);
        }
    }
    get giveSuperiorGems() {
        return this.superiorGemChance !== undefined;
    }
    get giveAbyssalGems() {
        return this.abyssalGemChance !== undefined;
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            if (data.baseRespawnInterval !== undefined)
                this.baseRespawnInterval = data.baseRespawnInterval;
            if (data.baseQuantity !== undefined)
                this.baseQuantity = data.baseQuantity;
            if (data.totalMasteryRequired !== undefined)
                this.totalMasteryRequired = data.totalMasteryRequired;
            if (data.hasPassiveRegen !== undefined)
                this.hasPassiveRegen = data.hasPassiveRegen;
            if (data.giveGems !== undefined)
                this.giveGems = data.giveGems;
            if (data.superiorGemChance !== undefined)
                this.superiorGemChance = data.superiorGemChance;
            if (data.shopItemPurchased !== undefined)
                this.shopItemPurchased = game.shop.purchases.getObjectSafe(data.shopItemPurchased);
            if (data.fixedMaxHP !== undefined)
                this.fixedMaxHP = data.fixedMaxHP;
            if (data.category !== undefined)
                this.category = game.mining.categories.getObjectSafe(data.category);
            if (data.gemVeinWeight !== undefined)
                this.gemVeinWeight = data.gemVeinWeight;
            if (data.abyssalGemVeinWeight !== undefined)
                this.abyssalGemVeinWeight = data.abyssalGemVeinWeight;
            if (data.abyssalGemChance !== undefined)
                this.abyssalGemChance = data.abyssalGemChance;
        } catch (e) {
            throw new DataModificationError(MiningRock.name, e, this.id);
        }
    }
}
class Mining extends GatheringSkill {
    constructor(namespace, game) {
        super(namespace, 'Mining', game, MiningRock.name);
        this._media = "assets/media/skills/mining/mining.png" /* Assets.Mining */ ;
        this.hasRealmSelection = true;
        this.renderQueue = new MiningRenderQueue();
        this.baseInterval = 3000;
        this.baseRockHP = 5;
        this.passiveRegenInterval = 10000;
        this.rockRespawnTimers = new Map();
        this.passiveRegenTimer = new Timer('Skill', () => this.regenRockHP());
        this.gemVeins = [];
        this.totalGemVeinWeight = 0;
        this.abyssalGemVeins = [];
        this.totalAbyssalGemVeinWeight = 0;
        this.categories = new NamespaceRegistry(game.registeredNamespaces, MiningCategory.name);
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action) && this.totalCurrentMasteryLevel >= action.totalMasteryRequired;
    }
    get actionInterval() {
        return this.modifyInterval(this.baseInterval, this.activeRock);
    }
    get actionLevel() {
        return this.activeRock.level;
    }
    get masteryAction() {
        return this.activeRock;
    }
    get masteryModifiedInterval() {
        return this.actionInterval;
    }
    get activeRock() {
        if (this.selectedRock === undefined)
            throw new Error('Tried to get active rock data, but none is selected.');
        return this.selectedRock;
    }
    registerData(namespace, data) {
        var _a, _b;
        (_a = data.categories) === null || _a === void 0 ? void 0 : _a.forEach((data) => {
            this.categories.registerObject(new MiningCategory(namespace, data));
        });
        (_b = data.rockData) === null || _b === void 0 ? void 0 : _b.forEach((data) => {
            this.actions.registerObject(new MiningRock(namespace, data, this.game));
        });
        super.registerData(namespace, data);
        if (data.coalItemID !== undefined)
            this.coalItem = this.getItemForRegistration(data.coalItemID);
        if (data.runestoneItemID !== undefined)
            this.runestoneItem = this.getItemForRegistration(data.runestoneItemID);
    }
    modifyData(data) {
        var _a;
        super.modifyData(data);
        (_a = data.rockData) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const rock = this.actions.getObjectByID(modData.id);
            if (rock === undefined)
                throw new UnregisteredDataModError(MiningRock.name, modData.id);
            rock.applyDataModification(modData, this.game);
        });
    }
    postDataRegistration() {
        super.postDataRegistration();
        // Set up gem veins table
        this.actions.forEach((action) => {
            if (action.gemVeinWeight !== undefined) {
                this.gemVeins.push({
                    weight: action.gemVeinWeight,
                    rock: action
                });
                this.totalGemVeinWeight += action.gemVeinWeight;
            }
            if (action.abyssalGemVeinWeight !== undefined) {
                this.abyssalGemVeins.push({
                    weight: action.abyssalGemVeinWeight,
                    rock: action
                });
                this.totalAbyssalGemVeinWeight += action.abyssalGemVeinWeight;
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
    canMineOre(ore) {
        return (ore.level <= this.level &&
            ore.abyssalLevel <= this.abyssalLevel &&
            (ore.totalMasteryRequired <= 0 || this.totalCurrentMasteryLevel >= ore.totalMasteryRequired) &&
            (ore.shopItemPurchased === undefined || this.game.shop.isUpgradePurchased(ore.shopItemPurchased)));
    }
    passiveTick() {
        if (this.rockRespawnTimers.size)
            this.rockRespawnTimers.forEach((timer) => timer.tick());
        this.passiveRegenTimer.tick();
    }
    getErrorLog() {
        var _a;
        return `${super.getErrorLog()}
Selected Rock ID: ${(_a = this.selectedRock) === null || _a === void 0 ? void 0 : _a.id}
Active Rock Data:
${this.actions.allObjects
            .map((rock) => {
            return `id: ${rock.id}; isRespawning: ${rock.isRespawning}; currentHP: ${rock.currentHP}; maxHP: ${rock.maxHP};`;
        })
            .join('\n')}`;
    }
    onPageChange() {
        this.rockRespawnTimers.forEach((_, rock) => {
            this.renderQueue.respawnProgress.add(rock);
        });
        super.onPageChange();
    }
    onMasteryLevelUp(action, oldLevel, newLevel) {
        super.onMasteryLevelUp(action, oldLevel, newLevel);
        this.updateRockMaxHP(action);
    }
    onModifierChange() {
        super.onModifierChange();
        this.renderQueue.rockRates = true;
    }
    onEquipmentChange() {}
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.renderQueue.rockUnlock = true;
    }
    onRealmChange() {
        super.onRealmChange();
        this.renderQueue.rockVisibility = true;
        if (this.isActive)
            this.renderQueue.progressBar = true;
    }
    render() {
        super.render();
        this.renderRockRates();
        this.renderRespawnProgress();
        this.renderRockHP();
        this.renderProgressBar();
        this.renderRockStatus();
        this.renderRockUnlock();
        this.renderRockVisibility();
    }
    renderRockRates() {
        if (!this.renderQueue.rockRates)
            return;
        this.actions.forEach((rock) => {
            const menu = rockMenus.get(rock);
            if (menu === undefined)
                return;
            let interval = this.modifyInterval(this.baseInterval, rock);
            const mxp = this.getMasteryXPToAddForAction(rock, interval);
            const baseMXP = this.getBaseMasteryXPToAddForAction(rock, interval);
            interval /= 1000;
            const xp = this.modifyXP(rock.baseExperience);
            const mpxp = this.getMasteryXPToAddToPool(mxp);
            menu.updateGrants(xp, rock.baseExperience, mxp, baseMXP, mpxp, interval * 1000, rock);
            menu.updateAbyssalGrants(this.modifyAbyssalXP(rock.baseAbyssalExperience), rock.baseAbyssalExperience);
        });
        this.renderQueue.rockRates = false;
    }
    renderRockHP() {
        if (this.renderQueue.rockHP.size === 0)
            return;
        this.renderQueue.rockHP.forEach((rock) => {
            var _a;
            (_a = rockMenus.get(rock)) === null || _a === void 0 ? void 0 : _a.updateHP(rock);
        });
        this.renderQueue.rockHP.clear();
    }
    renderRockStatus() {
        if (this.renderQueue.rockStatus.size === 0)
            return;
        this.renderQueue.rockStatus.forEach((rock) => {
            var _a;
            const newStatus = rock === this.selectedRock ? 'MINING' : 'MINE';
            (_a = rockMenus.get(rock)) === null || _a === void 0 ? void 0 : _a.setStatus(newStatus);
        });
        this.renderQueue.rockStatus.clear();
    }
    renderProgressBar() {
        var _a;
        if (!this.renderQueue.progressBar)
            return;
        if (this.activeProgressRock !== this.selectedRock || !this.isActive) {
            this.stopActiveProgressBar();
        }
        if (this.isActive && this.selectedRock !== undefined) {
            (_a = rockMenus.get(this.selectedRock)) === null || _a === void 0 ? void 0 : _a.miningProgress.animateProgressFromTimer(this.actionTimer);
            this.activeProgressRock = this.selectedRock;
        }
        this.renderQueue.progressBar = false;
    }
    stopActiveProgressBar() {
        var _a;
        if (this.activeProgressRock !== undefined) {
            (_a = rockMenus.get(this.activeProgressRock)) === null || _a === void 0 ? void 0 : _a.miningProgress.stopAnimation();
            this.activeProgressRock = undefined;
        }
    }
    renderRespawnProgress() {
        if (this.renderQueue.respawnProgress.size === 0)
            return;
        this.renderQueue.respawnProgress.forEach((rock) => {
            const rockMenu = rockMenus.get(rock);
            if (rockMenu === undefined)
                return;
            const respawnTimer = this.rockRespawnTimers.get(rock);
            if (respawnTimer !== undefined) {
                rockMenu.hpProgress.setStyle('bg-warning');
                rockMenu.hpProgress.animateProgressFromTimer(respawnTimer);
            } else {
                rockMenu.hpProgress.setStyle('bg-danger');
                rockMenu.hpProgress.stopAnimation();
            }
        });
        this.renderQueue.respawnProgress.clear();
    }
    renderRockUnlock() {
        if (!this.renderQueue.rockUnlock)
            return;
        this.actions.forEach((rock) => {
            const rockMenu = rockMenus.get(rock);
            if (rockMenu === undefined)
                return;
            if (rock.level > this.level ||
                rock.abyssalLevel > this.abyssalLevel ||
                (rock.shopItemPurchased !== undefined && !this.game.shop.isUpgradePurchased(rock.shopItemPurchased))) {
                rockMenu.setLockedContainer(rock);
                rockMenu.setLocked();
            } else {
                rockMenu.setUnlocked();
            }
            if (rock.totalMasteryRequired > 0) {
                if (this.totalCurrentMasteryLevel > rock.totalMasteryRequired) {
                    rockMenu.hideRequirement();
                } else {
                    rockMenu.setRequirement(templateLangString('MENU_TEXT_DRAGON_ORE_REQ', {
                        level: numberWithCommas(rock.totalMasteryRequired)
                    }));
                }
            }
        });
        this.renderQueue.rockUnlock = false;
    }
    renderRockVisibility() {
        if (!this.renderQueue.rockVisibility)
            return;
        this.actions.forEach((rock) => {
            const rockMenu = rockMenus.get(rock);
            if (rockMenu === undefined)
                return;
            if (rock.realm !== this.currentRealm) {
                hideElement(rockMenu);
            } else {
                showElement(rockMenu);
            }
        });
        this.renderQueue.rockVisibility = false;
    }
    get chanceToDoubleGems() {
        const baseChance = super.getUncappedDoublingChance();
        return clampValue(baseChance, 0, 100);
    }
    getRockGemChance(ore) {
        let gemChance = 1;
        if (ore.giveGems && this.activeRock.id !== "melvorTotH:Pure_Essence" /* MiningRockIDs.Pure_Essence */ )
            gemChance += this.game.modifiers.miningGemChance;
        gemChance *= 1 + this.game.modifiers.offItemChance / 100;
        return gemChance;
    }
    getRockSuperiorGemChance(ore) {
        if (ore.superiorGemChance === undefined)
            return 0;
        let chance = ore.superiorGemChance;
        chance += this.game.modifiers.qualitySuperiorGemChance;
        return chance;
    }
    getRockAbyssalGemChance(ore) {
        if (ore.abyssalGemChance === undefined)
            return 0;
        let chance = ore.abyssalGemChance;
        chance += this.game.modifiers.abyssalGemChance;
        return chance;
    }
    /** Callback function for when an ore is clicked */
    onRockClick(rock) {
        if (rock.isRespawning) {
            this.game.stats.Mining.inc(MiningStats.EmptyOresMined);
        }
        const prevRockId = this.selectedRock;
        if (this.isActive && !this.stop())
            return;
        if (rock.isRespawning) {
            notifyPlayer(this, getLangString('TOASTS_ROCK_DEPLETED'), 'danger');
        } else if (prevRockId !== rock && this.canMineOre(rock)) {
            this.selectedRock = rock;
            if (!this.start()) {
                this.selectedRock = undefined;
            } else {
                this.renderQueue.rockStatus.add(rock);
            }
        }
        this.render();
    }
    onStop() {
        this.renderQueue.rockStatus.add(this.activeRock);
        this.selectedRock = undefined;
    }
    onLoad() {
        super.onLoad();
        this.actions.forEach((rock) => {
            this.renderQueue.rockHP.add(rock);
            this.renderQueue.actionMastery.add(rock);
            if (rock.isRespawning)
                this.renderQueue.respawnProgress.add(rock);
        });
        this.renderQueue.rockRates = true;
        this.renderQueue.rockUnlock = true;
        this.renderQueue.rockVisibility = true;
        if (!this.passiveRegenTimer.isActive)
            this.passiveRegenTimer.start(this.passiveRegenInterval);
        if (this.isActive) {
            this.renderQueue.progressBar = true;
            this.renderQueue.rockStatus.add(this.activeRock);
        }
    }
    onAncientRelicUnlock() {
        super.onAncientRelicUnlock();
        this.actions.forEach((rock) => {
            this.renderQueue.rockHP.add(rock);
        });
        this.renderQueue.rockRates = true;
        this.renderQueue.rockUnlock = true;
    }
    encode(writer) {
        super.encode(writer);
        if (this.isActive)
            writer.writeNamespacedObject(this.activeRock);
        writer.writeArray(this.actions.allObjects, (rock, writer) => {
            writer.writeNamespacedObject(rock);
            writer.writeBoolean(rock.isRespawning);
            writer.writeUint32(rock.currentHP);
            writer.writeUint32(rock.maxHP);
        });
        writer.writeMap(this.rockRespawnTimers, writeNamespaced, writeEncodable);
        this.passiveRegenTimer.encode(writer);
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        if (this.isActive) {
            const selectedRock = reader.getNamespacedObject(this.actions);
            if (typeof selectedRock === 'string')
                this.shouldResetAction = true;
            else
                this.selectedRock = selectedRock;
        }
        // Decode active data
        reader.getArray((reader) => {
            const rock = reader.getNamespacedObject(this.actions);
            const isRespawning = reader.getBoolean();
            const currentHP = reader.getUint32();
            const maxHP = reader.getUint32();
            if (!(typeof rock === 'string')) {
                rock.isRespawning = isRespawning;
                rock.currentHP = currentHP;
                rock.maxHP = maxHP;
            }
        });
        this.rockRespawnTimers = reader.getMap(readNamespacedReject(this.actions), (reader, rock) => {
            if (rock === undefined) {
                const tempTimer = new Timer('Skill', () => {});
                tempTimer.decode(reader, version);
                return undefined;
            } else {
                const timer = new Timer('Skill', () => this.respawnRock(rock));
                timer.decode(reader, version);
                return timer;
            }
        });
        this.passiveRegenTimer.decode(reader, version);
        if (this.shouldResetAction)
            this.resetActionState();
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        const getRock = (id) => {
            return this.actions.getObjectByID(idMap.miningOres[id]);
        };
        const selectedRockID = reader.getNumber();
        if (this.isActive) {
            this.selectedRock = getRock(selectedRockID);
            if (this.selectedRock === undefined)
                this.shouldResetAction = true;
        }
        const activeReader = reader.getVariableLengthChunk();
        for (let i = 0; i < activeReader.dataLength / 3; i++) {
            const rock = getRock(i);
            const isRespawning = activeReader.getBool();
            const currentHP = activeReader.getNumber();
            const maxHP = activeReader.getNumber();
            if (rock !== undefined) {
                rock.isRespawning = isRespawning;
                rock.currentHP = currentHP;
                rock.maxHP = maxHP;
            }
        }
        const timerReader = reader.getVariableLengthChunk();
        this.rockRespawnTimers.clear();
        for (let i = 0; i < timerReader.dataLength / 4; i++) {
            const rock = getRock(timerReader.getNumber());
            if (rock === undefined) {
                timerReader.getChunk(3);
            } else {
                const timer = new Timer('Skill', () => this.respawnRock(rock));
                timer.deserialize(timerReader.getChunk(3), version);
                this.rockRespawnTimers.set(rock, timer);
            }
        }
        this.passiveRegenTimer.deserialize(reader.getChunk(3), version);
        if (this.shouldResetAction)
            this.resetActionState();
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.miningOres[oldActionID];
    }
    getActionModifierQueryParams(action) {
        const scope = super.getActionModifierQueryParams(action);
        if (action instanceof MiningRock) {
            scope.category = action.category;
        }
        return scope;
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
                    return skillData.rockData;
            }
        }
    }
    setFromOldOffline(offline, idMap) {
        const rock = this.actions.getObjectByID(idMap.miningOres[offline.action]);
        if (rock !== undefined)
            this.onRockClick(rock);
    }
    // Skill process methods
    preAction() {}
    get actionRewards() {
        const rewards = new Rewards(this.game);
        const rock = this.activeRock;
        rewards.setActionInterval(this.actionInterval);
        const actionEvent = new MiningActionEvent(this, rock);
        const oreQty = this.modifyPrimaryProductQuantity(rock.product, rock.baseQuantity, rock);
        rewards.addItem(rock.product, oreQty);
        this.addCurrencyFromPrimaryProductGain(rewards, rock.product, oreQty, rock);
        this.game.stats.Mining.add(MiningStats.OresGained, oreQty);
        actionEvent.productQuantity = oreQty;
        if (rollPercentage(this.getRockGemChance(rock))) {
            actionEvent.gemObtained = true;
            this.addRandomGemReward(rewards);
            // Mole-Octopus, chance to collect another random gem when recieiving a gem
            if (this.game.modifiers.summoningSynergy_4_5 > 0 && rollPercentage(this.game.modifiers.summoningSynergy_4_5)) {
                this.addRandomGemReward(rewards);
            }
        }
        if (rock.giveSuperiorGems && rollPercentage(this.getRockSuperiorGemChance(rock))) {
            actionEvent.gemObtained = true;
            this.addRandomSuperiorGemReward(rewards);
        }
        if (rock.giveAbyssalGems && rollPercentage(this.getRockAbyssalGemChance(rock))) {
            actionEvent.gemObtained = true;
            this.addRandomAbyssalGemReward(rewards);
        }
        if (this.coalItem !== undefined &&
            this.game.modifiers.bonusCoalMining > 0 &&
            this.activeRock.category.id === "melvorD:Ore" /* MiningCategoryIDs.Ore */ ) {
            rewards.addItem(this.coalItem, this.game.modifiers.bonusCoalMining);
            this.game.stats.Mining.add(MiningStats.OresGained, this.game.modifiers.bonusCoalMining);
        }
        const barItem = this.game.smithing.getSmithedVersionOfOre(rock.product);
        // Mole-Salamander, chance to receive a smithed version of the ore mined
        if (barItem !== undefined) {
            actionEvent.smithedVersionExists = true;
            if (rollPercentage(this.game.modifiers.getValue("melvorD:miningBarChance" /* ModifierIDs.miningBarChance */ , this.getActionModifierQuery(rock))))
                rewards.addItem(barItem, 1);
        }
        rewards.addXP(this, rock.baseExperience, rock);
        if (rock.baseAbyssalExperience > 0)
            rewards.addAbyssalXP(this, rock.baseAbyssalExperience, rock);
        this.addCommonRewards(rewards, rock);
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    addRandomGemReward(rewards) {
        let gemQty = 1;
        if (rollPercentage(this.chanceToDoubleGems))
            gemQty *= 2;
        let gem;
        if (this.activeRock.id === "melvorTotH:Pure_Essence" /* MiningRockIDs.Pure_Essence */ && this.runestoneItem !== undefined)
            gem = this.runestoneItem;
        else
            gem = this.game.randomGemTable.getDrop().item;
        rewards.addItem(gem, gemQty);
        this.game.stats.Mining.add(MiningStats.GemsGained, gemQty);
    }
    addRandomSuperiorGemReward(rewards) {
        if (this.game.randomSuperiorGemTable.size === 0)
            return;
        const gemQty = 1;
        const gemItem = this.game.randomSuperiorGemTable.getDrop().item;
        rewards.addItem(gemItem, gemQty);
    }
    addRandomAbyssalGemReward(rewards) {
        if (this.game.randomAbyssalGemTable.size === 0)
            return;
        let gemQty = 1;
        if (rollPercentage(this.game.modifiers.additionalAbyssalGemChance))
            gemQty++;
        const gemItem = this.game.randomAbyssalGemTable.getDrop().item;
        rewards.addItem(gemItem, gemQty);
    }
    postAction() {
        this.renderQueue.rockRates = true;
        if (rollPercentage(this.game.modifiers.getValue("melvorD:noMiningNodeDamageChance" /* ModifierIDs.noMiningNodeDamageChance */ , this.getActionModifierQuery(this.activeRock)))) {
            this.game.stats.Mining.inc(MiningStats.RockHPPreserved);
            if (game.settings.useLegacyNotifications) {
                this.game.combat.notifications.add({
                    type: 'Player',
                    args: [this, getLangString('TOASTS_NO_ROCK_DAMAGE'), 'success'],
                });
            }
        } else {
            if (this.activeRock.currentHP > 0) {
                this.activeRock.currentHP--;
            } else {
                this.activeRock.currentHP = 0;
            }
            this.renderQueue.rockHP.add(this.activeRock);
            if (this.activeRock.currentHP <= 0) {
                this.game.stats.Mining.inc(MiningStats.RocksDepleted);
                this.startRespawningRock(this.activeRock);
            }
        }
        this.game.stats.Mining.inc(MiningStats.Actions);
        this.game.stats.Mining.add(MiningStats.TimeSpent, this.currentActionInterval);
        this.updateRockMaxHP(this.activeRock);
        this.rollForRandomGemVein(this.activeRock);
        this.rollForRandomAbyssalGemVein(this.activeRock);
    }
    startActionTimer() {
        if (!this.activeRock.isRespawning && this.activeRock.currentHP > 0) {
            super.startActionTimer();
        }
    }
    regenRockHP() {
        // Passively regenerate rock HP every 10 seconds
        this.actions.forEach((rock) => {
            if (!rock.isRespawning && !(rock.maxHP === rock.currentHP) && rock.hasPassiveRegen) {
                rock.currentHP++;
                this.renderQueue.rockHP.add(rock);
            }
        });
        this.passiveRegenTimer.start(this.passiveRegenInterval);
    }
    /** Gets the modifier to a rocks max HP that applies to all rocks */
    getGlobalRockHPModifier() {
        return this.game.modifiers.flatMiningNodeHP;
    }
    getRockMaxHP(rock) {
        if (rock.fixedMaxHP !== undefined)
            return rock.fixedMaxHP;
        let rockHP = this.baseRockHP;
        rockHP += this.game.modifiers.getValue("melvorD:flatMiningNodeHP" /* ModifierIDs.flatMiningNodeHP */ , this.getActionModifierQuery(rock));
        return Math.max(rockHP, 1);
    }
    updateRockMaxHP(rock) {
        rock.maxHP = this.getRockMaxHP(rock);
        if (rock.currentHP > rock.maxHP)
            rock.currentHP = rock.maxHP;
        this.renderQueue.rockHP.add(rock);
    }
    /** Checks if the global rock HP modifier has changed, and recomputes all rock hps if so */
    updateAllRockMaxHPs() {
        const modifier = this.getGlobalRockHPModifier();
        if (modifier !== this._previousRockHPModifier) {
            this.actions.forEach((rock) => this.updateRockMaxHP(rock));
            this._previousRockHPModifier = modifier;
        }
    }
    startRespawningRock(rock) {
        if (!rock.hasPassiveRegen)
            return; // Disables respawn timer for rocks that do not respawn
        rock.isRespawning = true;
        const respawnTimer = new Timer('Skill', () => this.respawnRock(rock));
        let respawnInterval = rock.baseRespawnInterval;
        if (this.game.currentGamemode.enableInstantActions)
            respawnInterval = 250;
        else {
            respawnInterval *=
                1 +
                this.game.modifiers.getValue("melvorD:miningNodeRespawnInterval" /* ModifierIDs.miningNodeRespawnInterval */ , this.getActionModifierQuery(rock)) / 100;
            respawnInterval = Math.max(respawnInterval, 250);
        }
        respawnTimer.start(respawnInterval);
        this.rockRespawnTimers.set(rock, respawnTimer);
        this.renderQueue.respawnProgress.add(rock);
    }
    respawnRock(rock) {
        rock.isRespawning = false;
        rock.currentHP = rock.maxHP;
        this.renderQueue.rockHP.add(rock);
        this.rockRespawnTimers.delete(rock);
        this.renderQueue.respawnProgress.add(rock);
        if (this.selectedRock === rock && this.isActive) {
            this.startActionTimer();
        }
    }
    /** Initializes the HP of rocks that were newly added. */
    initializeRocks() {
        this.actions.forEach((rock) => {
            if (rock.maxHP === 0) {
                const maxHP = this.getRockMaxHP(rock);
                rock.currentHP = rock.fixedMaxHP !== undefined ? 0 : maxHP;
                rock.maxHP = maxHP;
            }
        });
    }
    addMeteoriteVein() {
        const meteorite = this.actions.getObjectByID("melvorTotH:Meteorite_Ore" /* MiningRockIDs.Meteorite_Ore */ );
        if (meteorite === undefined)
            return;
        const hpToAdd = Math.floor(Math.random() * 20) + 5;
        meteorite.currentHP += hpToAdd;
        this.updateRockMaxHP(meteorite);
        this.game.stats.Astrology.inc(AstrologyStats.MeteoritesLocated);
        this.game.stats.Astrology.add(AstrologyStats.TotalMeteoriteHP, hpToAdd);
        const message = templateString(getLangString('MENU_TEXT_METEORITE_LOCATED_DESC'), {
            qty: `${numberWithCommas(hpToAdd)}`,
        });
        this.game.combat.notifications.add({
            type: 'Player',
            args: [this, message, 'info'],
        });
    }
    addAbyciteVein(starfallSize) {
        const abycite = this.actions.getObjectByID("melvorItA:Abycite" /* MiningRockIDs.Abycite */ );
        if (abycite === undefined)
            return;
        let hpToAdd = 0;
        if (starfallSize >= 0.875)
            hpToAdd = Math.floor(Math.random() * 120) + 80;
        else if (starfallSize >= 0.625)
            hpToAdd = Math.floor(Math.random() * 80) + 40;
        else
            hpToAdd = Math.floor(Math.random() * 40) + 20;
        abycite.currentHP += hpToAdd;
        this.updateRockMaxHP(abycite);
        this.game.stats.Astrology.inc(AstrologyStats.AbyciteLocated);
        this.game.stats.Astrology.add(AstrologyStats.TotalAbyciteHP, hpToAdd);
        const message = templateLangString('MINING_ABYCITE_LOCATED', {
            hpToAdd: `${hpToAdd}`
        });
        this.game.combat.notifications.add({
            type: 'Player',
            args: [this, message, 'info'],
        });
    }
    addMysticiteVein(starfallSize) {
        const mysticite = this.actions.getObjectByID("melvorItA:Mysticite" /* MiningRockIDs.Mysticite */ );
        if (mysticite === undefined)
            return;
        let hpToAdd = 0;
        if (starfallSize >= 0.875)
            hpToAdd = Math.floor(Math.random() * 60) + 30;
        else if (starfallSize >= 0.625)
            hpToAdd = Math.floor(Math.random() * 40) + 20;
        else
            hpToAdd = Math.floor(Math.random() * 20) + 10;
        mysticite.currentHP += hpToAdd;
        this.updateRockMaxHP(mysticite);
        this.game.stats.Astrology.inc(AstrologyStats.MysticiteLoated);
        this.game.stats.Astrology.add(AstrologyStats.TotalMysticiteHP, hpToAdd);
        const message = templateLangString('MINING_MYSTICITE_LOCATED', {
            hpToAdd: `${hpToAdd}`
        });
        this.game.combat.notifications.add({
            type: 'Player',
            args: [this, message, 'info'],
        });
    }
    addEchociteVein(starfallSize) {
        const echocite = this.actions.getObjectByID("melvorItA:Echocite" /* MiningRockIDs.Echocite */ );
        if (echocite === undefined)
            return;
        let hpToAdd = 0;
        if (starfallSize >= 0.875)
            hpToAdd = Math.floor(Math.random() * 15) + 6;
        else if (starfallSize >= 0.625)
            hpToAdd = Math.floor(Math.random() * 10) + 4;
        else
            hpToAdd = Math.floor(Math.random() * 5) + 2;
        echocite.currentHP += hpToAdd;
        this.updateRockMaxHP(echocite);
        this.game.stats.Astrology.inc(AstrologyStats.EchociteLocated);
        this.game.stats.Astrology.add(AstrologyStats.TotalEchociteHP, hpToAdd);
        const message = templateLangString('MINING_ECHOCITE_LOCATED', {
            hpToAdd: `${hpToAdd}`
        });
        this.game.combat.notifications.add({
            type: 'Player',
            args: [this, message, 'info'],
        });
    }
    /** Post action function to roll for a random Gem Vein and update Mining as required. */
    rollForRandomGemVein(rock) {
        if (rock.level < 100 || !rock.category.givesGemVeins)
            return;
        const gemVeinInfo = this.rollRandomHPForGemVein();
        if (gemVeinInfo.size > 0) {
            const gemVein = this.getRandomGemVein();
            gemVein.currentHP += gemVeinInfo.hpToAdd;
            this.updateRockMaxHP(gemVein);
            const size = this.getGemVeinSize(gemVeinInfo.size);
            const message = templateString(getLangString('MENU_TEXT_GEM_VEIN_LOCATED_DESC'), {
                size: `${size}`,
                name: `${gemVein.name}`,
                qty: `${numberWithCommas(gemVeinInfo.hpToAdd)}`,
            });
            switch (gemVein.id) {
                case "melvorTotH:Onyx" /* MiningRockIDs.Onyx */ :
                    this.game.stats.Mining.inc(MiningStats.OnyxGemNodesFound);
                    this.game.stats.Mining.add(MiningStats.TotalOnyxGemNodeHPFound, gemVeinInfo.hpToAdd);
                    break;
                case "melvorTotH:Oricha" /* MiningRockIDs.Oricha */ :
                    this.game.stats.Mining.inc(MiningStats.OrichaGemNodesFound);
                    this.game.stats.Mining.add(MiningStats.TotalOrichaGemNodeHPFound, gemVeinInfo.hpToAdd);
                    break;
                case "melvorTotH:Cerulean" /* MiningRockIDs.Cerulean */ :
                    this.game.stats.Mining.inc(MiningStats.CeruleanGemNodesFound);
                    this.game.stats.Mining.add(MiningStats.TotalCeruleanGemNodeHPFound, gemVeinInfo.hpToAdd);
                    break;
            }
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, message, 'info'],
            });
        }
    }
    /** Rolls HP value for size of Gem Vein and returns respective data to use for processing. */
    rollRandomHPForGemVein() {
        /**
         * 1/300 Chance to find a Small Gem Vein which can give between 5-15 Rock Hp
         * 1/750 Chance to find a Medium Gem Vein which can give between 10-25 Rock Hp
         * 1/1500 Chance to find a Large Gem Vein which can give between 20-60 Rock Hp
         */
        const chanceModifier = this.game.modifiers.gemVeinChance;
        const veinChance = (200 / 375) * (1 + chanceModifier / 100);
        let size = 0 /* GemVeinSize.None */ ;
        let hpToAdd = 0;
        if (rollPercentage(veinChance)) {
            const gemRoll = Math.floor(Math.random() * 8);
            if (gemRoll < 5) {
                size = 1 /* GemVeinSize.Small */ ;
                hpToAdd = Math.ceil(Math.random() * 10) + 5;
            } else if (gemRoll < 7) {
                size = 2 /* GemVeinSize.Medium */ ;
                hpToAdd = Math.ceil(Math.random() * 15) + 10;
            } else {
                size = 3 /* GemVeinSize.Large */ ;
                hpToAdd = Math.ceil(Math.random() * 40) + 20;
            }
        }
        return {
            size,
            hpToAdd,
        };
    }
    /** Decides which Gem vein was found */
    getRandomGemVein() {
        const gemVeinRoll = Math.floor(Math.random() * this.totalGemVeinWeight);
        let gemVeinWeight = 0;
        const veinIndex = this.gemVeins.findIndex(({
            weight
        }) => {
            gemVeinWeight += weight;
            return gemVeinWeight > gemVeinRoll;
        });
        return this.gemVeins[veinIndex].rock;
    }
    /** Returns size of Gem vein found as a string */
    getGemVeinSize(number) {
        let size = '';
        switch (number) {
            case 1:
                size = 'Small';
                break;
            case 2:
                size = 'Medium';
                break;
            case 3:
                size = 'Large';
                break;
        }
        return size;
    }
    /** Post action function to roll for a random Abyssal Gem Vein and update Mining as required. */
    rollForRandomAbyssalGemVein(rock) {
        if (!rock.category.givesAbyssalGemVeins)
            return;
        const gemVeinInfo = this.rollRandomHPForAbyssalGemVein();
        if (gemVeinInfo.size > 0) {
            const gemVein = this.getRandomAbyssalGemVein();
            gemVein.currentHP += gemVeinInfo.hpToAdd;
            this.updateRockMaxHP(gemVein);
            const size = this.getAbyssalGemVeinSize(gemVeinInfo.size);
            const message = templateString(getLangString('MENU_TEXT_GEM_VEIN_LOCATED_DESC'), {
                size: `${size}`,
                name: `${gemVein.name}`,
                qty: `${numberWithCommas(gemVeinInfo.hpToAdd)}`,
            });
            switch (gemVein.id) {
                case "melvorItA:Nightopal" /* MiningRockIDs.Nightopal */ :
                    this.game.stats.Mining.inc(MiningStats.NightopalGemNodesFound);
                    this.game.stats.Mining.add(MiningStats.TotalNightopalGemNodeHPFound, gemVeinInfo.hpToAdd);
                    break;
                case "melvorItA:Shadowpearl" /* MiningRockIDs.Shadowpearl */ :
                    this.game.stats.Mining.inc(MiningStats.ShadowpearlGemNodesFound);
                    this.game.stats.Mining.add(MiningStats.TotalShadowpearlGemNodeHPFound, gemVeinInfo.hpToAdd);
                    break;
                case "melvorItA:Moonstone" /* MiningRockIDs.Moonstone */ :
                    this.game.stats.Mining.inc(MiningStats.MoonstoneGemNodesFound);
                    this.game.stats.Mining.add(MiningStats.TotalMoonstoneGemNodeHPFound, gemVeinInfo.hpToAdd);
                    break;
                case "melvorItA:Voidheart" /* MiningRockIDs.Voidheart */ :
                    this.game.stats.Mining.inc(MiningStats.VoidheartGemNodesFound);
                    this.game.stats.Mining.add(MiningStats.TotalVoidheartGemNodeHPFound, gemVeinInfo.hpToAdd);
                    break;
            }
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, message, 'info'],
            });
        }
    }
    /** Rolls HP value for size of Gem Vein and returns respective data to use for processing. */
    rollRandomHPForAbyssalGemVein() {
        /**
         * 1/300 Chance to find a Small Abyssal Gem Vein which can give between 2-5 Rock Hp
         * 1/750 Chance to find a Medium Abyssal Gem Vein which can give between 5-10 Rock Hp
         * 1/1500 Chance to find a Large Abyssal Gem Vein which can give between 10-20 Rock Hp
         */
        const chanceModifier = this.game.modifiers.abyssalGemVeinChanceIncrease;
        const veinChance = (200 / 375) * (1 + chanceModifier / 100);
        let size = 0 /* GemVeinSize.None */ ;
        let hpToAdd = 0;
        if (rollPercentage(veinChance)) {
            const gemRoll = Math.floor(Math.random() * 8);
            if (gemRoll < 5) {
                size = 1 /* GemVeinSize.Small */ ;
                hpToAdd = Math.ceil(Math.random() * 3) + 2;
            } else if (gemRoll < 7) {
                size = 2 /* GemVeinSize.Medium */ ;
                hpToAdd = Math.ceil(Math.random() * 5) + 5;
            } else {
                size = 3 /* GemVeinSize.Large */ ;
                hpToAdd = Math.ceil(Math.random() * 10) + 10;
            }
        }
        return {
            size,
            hpToAdd,
        };
    }
    /** Decides which Abyssal Gem vein was found */
    getRandomAbyssalGemVein() {
        const gemVeinRoll = Math.floor(Math.random() * this.totalAbyssalGemVeinWeight);
        let gemVeinWeight = 0;
        const veinIndex = this.abyssalGemVeins.findIndex(({
            weight
        }) => {
            gemVeinWeight += weight;
            return gemVeinWeight > gemVeinRoll;
        });
        return this.abyssalGemVeins[veinIndex].rock;
    }
    /** Returns size of Abyssal Gem vein found as a string */
    getAbyssalGemVeinSize(number) {
        let size = '';
        switch (number) {
            case 1:
                size = 'Small';
                break;
            case 2:
                size = 'Medium';
                break;
            case 3:
                size = 'Large';
                break;
        }
        return size;
    }
    testTranslations() {
        super.testTranslations();
        this.actions.forEach((action) => {
            action.name;
        });
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        this.actions.forEach((action) => obtainable.add(action.product));
        if (this.coalItem)
            obtainable.add(this.coalItem);
        // Exclude smithed bar items
        this.game.randomGemTable.sortedDropsArray.forEach((drop) => obtainable.add(drop.item));
        this.game.randomSuperiorGemTable.sortedDropsArray.forEach((drop) => obtainable.add(drop.item));
        this.game.randomAbyssalGemTable.sortedDropsArray.forEach((drop) => obtainable.add(drop.item));
        return obtainable;
    }
}
//# sourceMappingURL=rockTicking.js.map
checkFileVersion('?12097')