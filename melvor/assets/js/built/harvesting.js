"use strict";
class HarvestingRenderQueue extends GatheringSkillRenderQueue {
    constructor() {
        super(...arguments);
        this.veinIntensity = new Set();
        this.veinStatus = new Set();
        this.veinItemDrops = new Set();
        this.veinRates = false;
        this.veinUnlock = false;
        this.veinVisibility = false;
    }
}
const veinMenus = new Map();

function loadHarvestingVeins() {
    var _a;
    const veinContainer = document.getElementById('harvesting-veins-container');
    const sortedActions = (_a = game.harvesting) === null || _a === void 0 ? void 0 : _a.actions.allObjects.sort((a, b) => a.abyssalLevel - b.abyssalLevel);
    if (sortedActions === undefined)
        throw new Error('Tried to load veins, but Harvesting is not registered.');
    sortedActions.forEach((vein) => {
        const veinMenu = createElement('harvesting-vein', {
            className: 'col-12 col-lg-6 col-xl-4'
        });
        veinMenus.set(vein, veinMenu);
        veinContainer.append(veinMenu);
        veinMenu.setVein(vein);
    });
}

function localizeHarvesting() {
    var _a;
    (_a = game.harvesting) === null || _a === void 0 ? void 0 : _a.onLoad();
}
class HarvestingVein extends BasicSkillRecipe {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        // Active Data
        this.currentIntensity = 0;
        this.maxIntensity = 0;
        this.products = [];
        this.totalProductWeight = 0;
        try {
            this._name = data.name;
            this._media = data.media;
            // this.baseInterval = data.baseInterval;
            this.baseQuantity = data.baseQuantity;
            if (data.shopItemPurchased !== undefined) {
                this.shopItemPurchased = game.shop.purchases.getObjectSafe(data.shopItemPurchased);
            }
            data.products.forEach((product) => {
                this.products.push({
                    item: game.items.getObjectSafe(product.itemID),
                    minIntensityPercent: product.minIntensityPercent,
                    weight: product.weight,
                });
            });
            this.totalProductWeight = this.products.reduce((total, product) => total + product.weight, 0);
            this.uniqueProduct = {
                item: game.items.getObjectSafe(data.uniqueProduct.id),
                quantity: data.uniqueProduct.quantity,
            };
        } catch (e) {
            throw new DataConstructionError(HarvestingVein.name, e, this.id);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`HARVESTING_VEIN_${this.localID}`);
        }
    }
    get intensityPercent() {
        return (this.currentIntensity / this.maxIntensity) * 100;
    }
}
class Harvesting extends GatheringSkill {
    constructor(namespace, game) {
        super(namespace, 'Harvesting', game, HarvestingVein.name);
        this._media = 'assets/media/skills/harvesting/harvesting.png';
        this.hasRealmSelection = true;
        this.renderQueue = new HarvestingRenderQueue();
        this.baseInterval = 3000;
        this.baseVeinIntensity = 28800;
        this.passiveRegenInterval = 20000;
        this.baseUniqueProductChance = 0.1;
        this.hpCheckpoints = [40, 80, 100];
        this.veinDecayTimer = new Timer('Skill', () => this.reduceVeinIntensity());
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    get uniqueProductChance() {
        let chance = this.baseUniqueProductChance;
        if (this.game.modifiers.harvestingUniqueProductChance > 0) {
            chance += this.baseUniqueProductChance * (this.game.modifiers.harvestingUniqueProductChance / 100);
        }
        return chance;
    }
    get actionInterval() {
        return this.modifyInterval(this.baseInterval, this.activeVein);
    }
    get actionLevel() {
        return this.activeVein.level;
    }
    get masteryAction() {
        return this.activeVein;
    }
    get masteryModifiedInterval() {
        return this.actionInterval;
    }
    get maxLevelCap() {
        return 1;
    }
    // End of properties to save
    get activeVein() {
        if (this.selectedVein === undefined)
            throw new Error('Tried to get active vein data, but none is selected.');
        return this.selectedVein;
    }
    registerData(namespace, data) {
        var _a;
        (_a = data.veinData) === null || _a === void 0 ? void 0 : _a.forEach((data) => {
            this.actions.registerObject(new HarvestingVein(namespace, data, this.game));
        });
        super.registerData(namespace, data);
    }
    modifyData(data) {
        super.modifyData(data);
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
    canHarvestVein(vein) {
        return (vein.level <= this.level &&
            vein.abyssalLevel <= this.abyssalLevel &&
            (vein.shopItemPurchased === undefined || this.game.shop.isUpgradePurchased(vein.shopItemPurchased)));
    }
    passiveTick() {
        this.veinDecayTimer.tick();
    }
    getErrorLog() {
        var _a;
        return `${super.getErrorLog()}
Selected Vein ID: ${(_a = this.selectedVein) === null || _a === void 0 ? void 0 : _a.id}
Active VEin Data:
${this.actions.allObjects
            .map((vein) => {
            return `id: ${vein.id}; currentIntensity: ${vein.currentIntensity}; maxIntensity: ${vein.maxIntensity};`;
        })
            .join('\n')}`;
    }
    onModifierChange() {
        super.onModifierChange();
        this.renderQueue.veinRates = true;
    }
    onEquipmentChange() {}
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.renderQueue.veinUnlock = true;
    }
    onRealmChange() {
        super.onRealmChange();
        this.renderQueue.veinVisibility = true;
        if (this.isActive)
            this.renderQueue.progressBar = true;
    }
    render() {
        super.render();
        this.renderVeinRates();
        this.renderVeinIntensity();
        this.renderProgressBar();
        this.renderVeinStatus();
        this.renderVeinUnlock();
        this.renderVeinItemDrops();
        this.renderVeinVisibility();
    }
    renderVeinRates() {
        if (!this.renderQueue.veinRates)
            return;
        this.actions.forEach((vein) => {
            const menu = veinMenus.get(vein);
            if (menu === undefined)
                return;
            let interval = this.modifyInterval(this.baseInterval, vein);
            const mxp = this.getMasteryXPToAddForAction(vein, interval);
            const baseMXP = this.getBaseMasteryXPToAddForAction(vein, interval);
            interval /= 1000;
            const mpxp = this.getMasteryXPToAddToPool(mxp);
            menu.updateGrants(mxp, baseMXP, mpxp, interval * 1000, vein);
            menu.updateAbyssalGrants(this.modifyAbyssalXP(vein.baseAbyssalExperience), vein.baseAbyssalExperience);
        });
        this.renderQueue.veinRates = false;
    }
    renderVeinIntensity() {
        if (this.renderQueue.veinIntensity.size === 0)
            return;
        this.renderQueue.veinIntensity.forEach((vein) => {
            const menu = veinMenus.get(vein);
            menu === null || menu === void 0 ? void 0 : menu.updateIntensity(vein);
            menu === null || menu === void 0 ? void 0 : menu.updateQuantity(vein, this);
            menu === null || menu === void 0 ? void 0 : menu.updateChanceForItem(vein);
        });
        this.renderQueue.veinIntensity.clear();
    }
    renderVeinStatus() {
        if (this.renderQueue.veinStatus.size === 0)
            return;
        this.renderQueue.veinStatus.forEach((vein) => {
            var _a;
            const newStatus = vein === this.selectedVein ? 'HARVESTING' : 'HARVEST';
            (_a = veinMenus.get(vein)) === null || _a === void 0 ? void 0 : _a.setStatus(newStatus);
        });
        this.renderQueue.veinStatus.clear();
    }
    renderVeinItemDrops() {
        if (this.renderQueue.veinItemDrops.size === 0)
            return;
        this.renderQueue.veinItemDrops.forEach((vein) => {
            var _a;
            (_a = veinMenus.get(vein)) === null || _a === void 0 ? void 0 : _a.updateProducts(vein);
        });
        this.renderQueue.veinItemDrops.clear();
    }
    renderProgressBar() {
        var _a;
        if (!this.renderQueue.progressBar)
            return;
        if (this.activeProgressVein !== this.selectedVein || !this.isActive) {
            this.stopActiveProgressBar();
        }
        if (this.isActive && this.selectedVein !== undefined) {
            (_a = veinMenus.get(this.selectedVein)) === null || _a === void 0 ? void 0 : _a.harvestingProgress.animateProgressFromTimer(this.actionTimer);
            this.activeProgressVein = this.selectedVein;
        }
        this.renderQueue.progressBar = false;
    }
    stopActiveProgressBar() {
        var _a;
        if (this.activeProgressVein !== undefined) {
            (_a = veinMenus.get(this.activeProgressVein)) === null || _a === void 0 ? void 0 : _a.harvestingProgress.stopAnimation();
            this.activeProgressVein = undefined;
        }
    }
    renderVeinVisibility() {
        if (!this.renderQueue.veinVisibility)
            return;
        this.actions.forEach((vein) => {
            const veinMenu = veinMenus.get(vein);
            if (veinMenu === undefined)
                return;
            if (vein.realm !== this.currentRealm) {
                hideElement(veinMenu);
            } else {
                showElement(veinMenu);
            }
        });
        this.renderQueue.veinVisibility = false;
    }
    renderVeinUnlock() {
        if (!this.renderQueue.veinUnlock)
            return;
        this.actions.forEach((vein) => {
            const veinMenu = veinMenus.get(vein);
            if (veinMenu === undefined)
                return;
            if (vein.level > this.level || vein.abyssalLevel > this.abyssalLevel) {
                veinMenu.setLockedContainer(vein);
                veinMenu.setLocked();
            } else {
                veinMenu.setUnlocked();
            }
        });
        this.renderQueue.veinUnlock = false;
    }
    /** Callback function for when an ore is clicked */
    onVeinClick(vein) {
        const prevVeinId = this.selectedVein;
        if (this.isActive && !this.stop())
            return;
        if (prevVeinId !== vein && this.canHarvestVein(vein)) {
            this.selectedVein = vein;
            if (!this.start()) {
                this.selectedVein = undefined;
            } else {
                this.renderQueue.veinStatus.add(vein);
            }
        }
        this.render();
    }
    onStop() {
        this.renderQueue.veinStatus.add(this.activeVein);
        this.selectedVein = undefined;
    }
    onLoad() {
        super.onLoad();
        this.actions.forEach((vein) => {
            this.renderQueue.veinIntensity.add(vein);
            this.renderQueue.actionMastery.add(vein);
            this.renderQueue.veinItemDrops.add(vein);
        });
        if (!this.actions.allObjects.some((vein) => {
                vein.realm === this.currentRealm;
            }))
            this.currentRealm = this.game.realms.getObjectSafe("melvorItA:Abyssal" /* RealmIDs.Abyssal */ );
        this.renderQueue.veinRates = true;
        this.renderQueue.veinUnlock = true;
        this.renderQueue.veinVisibility = true;
        if (!this.veinDecayTimer.isActive)
            this.veinDecayTimer.start(this.passiveRegenInterval);
        if (this.isActive) {
            this.renderQueue.progressBar = true;
            this.renderQueue.veinStatus.add(this.activeVein);
        }
    }
    encode(writer) {
        super.encode(writer);
        if (this.isActive)
            writer.writeNamespacedObject(this.activeVein);
        writer.writeArray(this.actions.allObjects, (vein, writer) => {
            writer.writeNamespacedObject(vein);
            writer.writeUint32(vein.currentIntensity);
            writer.writeUint32(vein.maxIntensity);
        });
        this.veinDecayTimer.encode(writer);
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        if (this.isActive) {
            const selectedVein = reader.getNamespacedObject(this.actions);
            if (typeof selectedVein === 'string')
                this.shouldResetAction = true;
            else
                this.selectedVein = selectedVein;
        }
        // Decode active data
        reader.getArray((reader) => {
            const vein = reader.getNamespacedObject(this.actions);
            const currentIntensity = reader.getUint32();
            const maxIntensity = reader.getUint32();
            if (!(typeof vein === 'string')) {
                vein.currentIntensity = currentIntensity;
                vein.maxIntensity = maxIntensity;
            }
        });
        this.veinDecayTimer.decode(reader, version);
        if (this.shouldResetAction)
            this.resetActionState();
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return '';
    }
    // Skill process methods
    preAction() {}
    get actionRewards() {
        const rewards = new Rewards(this.game);
        const vein = this.activeVein;
        rewards.setActionInterval(this.actionInterval);
        const actionEvent = new HarvestingActionEvent(this, vein);
        let impDevilMult = 1;
        if (this.game.modifiers.summoningSynergy_Imp_Devil > 0) {
            const result = selectFromWeightedArray(Harvesting.IMP_DEVIL_TABLE, 100).result;
            switch (result) {
                case 1 /* ImpDevilResult.GAIN_NOTHING */ :
                    impDevilMult = 0;
                    break;
                case 2 /* ImpDevilResult.TRIPLE_ITEMS */ :
                    impDevilMult = 3;
                    break;
                case 3 /* ImpDevilResult.ABYSSAL_PIECES */ :
                    if (this.game.abyssalPieces !== undefined) {
                        let apAmount = 2 * this.level;
                        apAmount = this.modifyCurrencyReward(this.game.abyssalPieces, apAmount, vein);
                        rewards.addCurrency(this.game.abyssalPieces, apAmount);
                    }
                    break;
            }
        }
        const veinItem = selectFromWeightedArray(vein.products, vein.totalProductWeight);
        if (veinItem.minIntensityPercent <= vein.intensityPercent) {
            const baseQuantity = vein.baseQuantity * this.getVeinBaseRewardQuantity(vein);
            let veinQty = this.modifyPrimaryProductQuantity(veinItem.item, baseQuantity, vein);
            veinQty *= impDevilMult;
            if (veinQty > 0) {
                rewards.addItem(veinItem.item, veinQty);
                this.game.stats.Harvesting.add(2 /* HarvestingStats.PrimaryItemsGained */ , veinQty);
                this.addCurrencyFromPrimaryProductGain(rewards, veinItem.item, veinQty, vein);
            }
            actionEvent.productQuantity = veinQty;
            rewards.addXP(this, vein.baseExperience, vein);
            rewards.addAbyssalXP(this, vein.baseAbyssalExperience, vein);
            this.addCommonRewards(rewards, vein);
        } else {
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, getLangString('HAVRESTING_FAILED_ACTION'), 'info'],
            });
        }
        if (vein.currentIntensity >= vein.maxIntensity && rollPercentage(this.uniqueProductChance) && impDevilMult > 0) {
            const quantity = vein.uniqueProduct.quantity * impDevilMult;
            if (quantity > 0) {
                rewards.addItem(vein.uniqueProduct.item, quantity);
                this.game.stats.Harvesting.add(3 /* HarvestingStats.UniqueItemsGained */ , quantity);
            }
        }
        this.game.modifiers.forEachCurrency("melvorD:currencyFromHarvestingChanceBasedOnLevel" /* ModifierIDs.currencyFromHarvestingChanceBasedOnLevel */ , (value, currency) => {
            if (rollPercentage(value)) {
                let amount = 50 * vein.abyssalLevel;
                amount = this.modifyCurrencyReward(currency, amount, vein);
                rewards.addCurrency(currency, amount);
            }
        });
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    postAction() {
        const vein = this.activeVein;
        this.renderQueue.veinRates = true;
        if (vein.currentIntensity < vein.maxIntensity) {
            let increase = 1 + this.game.modifiers.flatHarvestingIntensity;
            if (rollPercentage(this.game.modifiers.doubleHarvestingIntensityChance))
                increase *= 2;
            vein.currentIntensity += Math.min(increase, vein.maxIntensity - vein.currentIntensity);
        } else {
            vein.currentIntensity = vein.maxIntensity;
        }
        this.game.stats.Harvesting.inc(0 /* HarvestingStats.Actions */ );
        this.game.stats.Harvesting.add(1 /* HarvestingStats.TimeSpent */ , this.currentActionInterval);
        this.renderQueue.veinIntensity.add(vein);
        this.renderQueue.veinItemDrops.add(vein);
        this.updateVeinMaxIntensity(vein);
    }
    reduceVeinIntensity() {
        // Passively remove vein HP every 10 seconds
        this.actions.forEach((vein) => {
            const noDecay = this.game.modifiers.getValue("melvorItA:noHarvestingIntensityDecay" /* ModifierIDs.noHarvestingIntensityDecay */ , this.getActionModifierQuery(vein)) > 0;
            if (noDecay)
                return;
            if (vein.currentIntensity > 0 && (!this.isActive || (this.isActive && this.activeVein !== vein))) {
                const minIntensity = Math.floor(vein.maxIntensity * (this.game.modifiers.minimumHarvestingIntensity / 100));
                if (vein.currentIntensity > minIntensity) {
                    vein.currentIntensity--;
                    this.renderQueue.veinIntensity.add(vein);
                    this.renderQueue.veinItemDrops.add(vein);
                }
            }
        });
        this.veinDecayTimer.start(this.passiveRegenInterval);
    }
    getVeinMaxIntensity(vein) {
        let veinIntensity = this.baseVeinIntensity;
        veinIntensity *=
            1 + this.game.modifiers.getValue("melvorItA:maxHarvestingIntensity" /* ModifierIDs.maxHarvestingIntensity */ , this.getActionModifierQuery(vein)) / 100;
        veinIntensity = Math.floor(veinIntensity);
        return Math.max(veinIntensity, 1);
    }
    updateVeinMaxIntensity(vein) {
        const oldMax = vein.maxIntensity;
        vein.maxIntensity = this.getVeinMaxIntensity(vein);
        if (oldMax !== vein.maxIntensity) {
            const oldPercent = vein.intensityPercent;
            vein.currentIntensity = Math.min(vein.maxIntensity, vein.currentIntensity);
            this.renderQueue.veinIntensity.add(vein);
            if (oldPercent !== vein.intensityPercent)
                this.renderQueue.veinItemDrops.add(vein);
        }
    }
    updateAllVeinMaxIntensity() {
        this.actions.forEach((vein) => this.updateVeinMaxIntensity(vein));
    }
    /** Initializes the HP of rocks that were newly added. */
    initializeVeins() {
        this.actions.forEach((vein) => {
            if (vein.maxIntensity === 0) {
                const maxIntensity = this.getVeinMaxIntensity(vein);
                vein.currentIntensity = 0;
                vein.maxIntensity = maxIntensity;
            }
        });
        loadHarvestingVeins();
    }
    testTranslations() {
        super.testTranslations();
        this.actions.forEach((action) => {
            action.name;
        });
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        return obtainable;
    }
    getVeinBaseRewardQuantity(vein) {
        if (vein.currentIntensity >= Math.floor(vein.maxIntensity * (this.hpCheckpoints[2] / 100)))
            return 4;
        else if (vein.currentIntensity >= Math.floor(vein.maxIntensity * (this.hpCheckpoints[1] / 100)))
            return 3;
        else if (vein.currentIntensity >= Math.floor(vein.maxIntensity * (this.hpCheckpoints[0] / 100)))
            return 2;
        return 1;
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
                    return skillData.veinData;
            }
        }
    }
}
Harvesting.IMP_DEVIL_TABLE = [{
        result: 0 /* ImpDevilResult.DO_NOTHING */ ,
        weight: 5,
    },
    {
        result: 1 /* ImpDevilResult.GAIN_NOTHING */ ,
        weight: 25,
    },
    {
        result: 2 /* ImpDevilResult.TRIPLE_ITEMS */ ,
        weight: 30,
    },
    {
        result: 3 /* ImpDevilResult.ABYSSAL_PIECES */ ,
        weight: 40,
    },
];
//# sourceMappingURL=harvesting.js.map
checkFileVersion('?12097')