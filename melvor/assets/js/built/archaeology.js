"use strict";
var __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new(P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }

        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }

        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var ArtefactType;
(function(ArtefactType) {
    ArtefactType["TINY"] = "tiny";
    ArtefactType["SMALL"] = "small";
    ArtefactType["MEDIUM"] = "medium";
    ArtefactType["LARGE"] = "large";
})(ArtefactType || (ArtefactType = {}));
var ArtefactWeightRange;
(function(ArtefactWeightRange) {
    ArtefactWeightRange[ArtefactWeightRange["NOTHING"] = 696969] = "NOTHING";
    ArtefactWeightRange[ArtefactWeightRange["COMMON"] = 1500] = "COMMON";
    ArtefactWeightRange[ArtefactWeightRange["UNCOMMON"] = 500] = "UNCOMMON";
    ArtefactWeightRange[ArtefactWeightRange["RARE"] = 18] = "RARE";
    ArtefactWeightRange[ArtefactWeightRange["VERYRARE"] = 4] = "VERYRARE";
    ArtefactWeightRange[ArtefactWeightRange["LEGENDARY"] = 1] = "LEGENDARY";
})(ArtefactWeightRange || (ArtefactWeightRange = {}));
class ArchaeologyTool extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        this.game = game;
        try {
            this._name = data.name;
            this._description = data.description;
            this._media = data.media;
            this.artefactType = data.artefactType;
            this.upgradeChain = game.shop.upgradeChains.getObjectSafe(data.upgradeChainID);
        } catch (e) {
            throw new DataConstructionError(ArchaeologyTool.name, e, this.id);
        }
    }
    get name() {
        const lowestPurchase = this.game.shop.getLowestUpgradeInChain(this.upgradeChain.rootUpgrade);
        return lowestPurchase === undefined ? this.upgradeChain.defaultName : lowestPurchase.name;
    }
    get description() {
        if (this.isModded) {
            return this._description;
        } else {
            return this._description;
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get level() {
        switch (this.artefactType) {
            case ArtefactType.TINY:
                return game.modifiers.sieveToolLevel;
            case ArtefactType.SMALL:
                return game.modifiers.trowelToolLevel;
            case ArtefactType.MEDIUM:
                return game.modifiers.brushToolLevel;
            case ArtefactType.LARGE:
                return game.modifiers.shovelToolLevel;
            default:
                return 0;
        }
    }
}
class ArchaeologyDigSite extends BasicSkillRecipe {
    /* #endregion */
    constructor(namespace, data, game, archaeology) {
        super(namespace, data, game);
        this.game = game;
        this.archaeology = archaeology;
        /** If this dig site has a combat area associated with it */
        this.hasCombatArea = false;
        /* #endregion */
        /* #region Game State Properties */
        this.maps = [];
        /** Index of map that is currently selected. -1 if none. */
        this.selectedMapIndex = -1;
        this.selectedTools = [];
        /** Index of map that is currently selected for upgrading. -1 if none. */
        this.selectedUpgradeIndex = -1;
        try {
            this._name = data.name;
            this._description = data.description;
            this._media = data.media;
            this.artefacts = {
                tiny: new DropTable(game, data.artefacts.tiny),
                small: new DropTable(game, data.artefacts.small),
                medium: new DropTable(game, data.artefacts.medium),
                large: new DropTable(game, data.artefacts.large),
            };
            this.mapCreationCost = new FixedCosts(data.mapCreationCost, game);
            this.mapUpgradeCost = data.mapUpgradeCost.map((costData) => new FixedCosts(costData, game));
            this.containsDigSiteRequirement = data.containsDigSiteRequirement;
        } catch (e) {
            throw new DataConstructionError(ArchaeologyDigSite.name, e, this.id);
        }
    }
    /* #region Data Properties */
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`POI_NAME_Melvor_${this.localID}`);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    /** Returns true if the poi associated with this dig site has been discovered */
    get isDiscovered() {
        return this.poi !== undefined && this.poi.isDiscovered;
    }
    /** Returns true if the poi associated with this dig site is hidden */
    get isHidden() {
        return this.poi !== undefined && this.poi.hidden !== undefined;
    }
    /** Returns the Cartography level required for the POI associated with this dig site */
    get poiCartographyLevel() {
        if (this.poi === undefined)
            return 1;
        return this.poi.hex.cartographyLevel;
    }
    /** Currently selected DigSiteMap. Undefined if none is selected. */
    get selectedMap() {
        if (this.selectedMapIndex === -1)
            return undefined;
        return this.maps[this.selectedMapIndex];
    }
    /** Currently selected DigSiteMap for upgrading. Undefined if none is selected */
    get selectedUpgradeMap() {
        if (this.selectedUpgradeIndex === -1)
            return undefined;
        return this.maps[this.selectedUpgradeIndex];
    }
    encode(writer) {
        writer.writeArray(this.maps, (map, writer) => map.encode(writer));
        writer.writeInt8(this.selectedMapIndex);
        writer.writeArray(this.selectedTools, writeNamespaced);
        writer.writeInt8(this.selectedUpgradeIndex);
        return writer;
    }
    decode(reader, version) {
        this.maps = reader.getArray((reader) => {
            const map = new DigSiteMap(this, this.game, this.game.cartography);
            map.decode(reader, version);
            return map;
        });
        this.selectedMapIndex = reader.getInt8();
        this.selectedTools = reader.getArray(readNamespacedReject(this.archaeology.tools));
        this.selectedUpgradeIndex = reader.getInt8();
    }
    getActiveDropTable(type) {
        switch (type) {
            case ArtefactType.TINY:
                return this.artefacts.tiny;
            case ArtefactType.SMALL:
                return this.artefacts.small;
            case ArtefactType.MEDIUM:
                return this.artefacts.medium;
            case ArtefactType.LARGE:
                return this.artefacts.large;
            default:
                return this.artefacts.tiny;
        }
    }
    getMaxMaps() {
        return 1 + this.game.modifiers.getValue("melvorAoD:digSiteMapSlots" /* ModifierIDs.digSiteMapSlots */ , this.archaeology.getActionModifierQuery(this));
    }
}
class DummyArchaeologyDigSite extends ArchaeologyDigSite {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            baseExperience: 0,
            level: 1,
            name: '',
            description: '',
            media: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
            artefacts: {
                tiny: [],
                small: [],
                medium: [],
                large: [],
            },
            mapCreationCost: {},
            mapUpgradeCost: [],
            containsDigSiteRequirement: false,
        }, game, game.archaeology);
    }
}
class ArchaeologyRenderQueue extends GatheringSkillRenderQueue {
    constructor() {
        super(...arguments);
        /** Update selected Digsite */
        this.digSites = new Set();
        /** Update selected Digsite Map Charges */
        this.selectedMapCharges = new Set();
        /** Update selected Digsite Map details */
        this.selectedMap = new Set();
        /** Update Digsite Map selection */
        this.mapSelection = new Set();
        /** Updates the visibility of dig sites */
        this.digSiteVisibility = false;
        /** Updates Grants Rates for Dig Sites */
        this.digSiteRates = false;
    }
}
class ArchaeologyMuseumReward extends NamespacedObject {
    constructor(namepsace, data, game) {
        super(namepsace, data.id);
        /** Save State property. Determines if this reward has been awarded to the player. */
        this.awarded = false;
        try {
            this.museumCount = data.museumCount;
            this.stats = new StatObject(data, game, `${ArchaeologyMuseumReward.name} with id "${this.id}"`);
            if (data.pets !== undefined)
                this.pets = game.pets.getArrayFromIds(data.pets);
            if (data.currencies !== undefined)
                this.currencies = game.getCurrencyQuantities(data.currencies);
            // TODO_D - deprecated property support
            if (data.gp) {
                if (!this.currencies)
                    this.currencies = [];
                this.currencies.push({
                    currency: game.gp,
                    quantity: data.gp
                });
            }
            if (data.sc) {
                if (!this.currencies)
                    this.currencies = [];
                this.currencies.push({
                    currency: game.slayerCoins,
                    quantity: data.sc
                });
            }
            if (data.items !== undefined)
                this.items = game.items.getQuantities(data.items);
        } catch (e) {
            throw new DataConstructionError(ArchaeologyMuseumReward.name, e, this.id);
        }
    }
}
class ArchaeologyItemDonatedEvent extends GameEvent {
    constructor(oldCount, newCount) {
        super();
        this.oldCount = oldCount;
        this.newCount = newCount;
    }
}
class Archaeology extends GatheringSkill {
    constructor(namespace, game) {
        super(namespace, 'Archaeology', game, ArchaeologyDigSite.name);
        this._media = "assets/media/skills/archaeology/archaeology.png" /* Assets.Archaeology */ ;
        this.baseInterval = 4000;
        this.lastRarityLocated = ArtefactWeightRange.NOTHING;
        this.renderQueue = new ArchaeologyRenderQueue();
        this.artefactTypeTools = new Map();
        this.artefactLocationCache = new Map();
        /** Chance for bone drops when finding no artefacts (%) */
        this.chanceForBones = 15;
        this.hiddenDigSites = new Set();
        this.museumRewardSource = {
            get name() {
                return getLangString('ARCHAEOLOGY_MUSEUM_REWARDS');
            },
        };
        /** Flag used to determine if provided stats should update when stopped. Prevents duplicate stat recalculation */
        this.updateModifiersOnStop = true;
        this.museum = new ArchaeologyMuseum(game, this);
        this.tools = new NamespaceRegistry(game.registeredNamespaces, ArchaeologyTool.name);
    }
    get maxLevelCap() {
        return 120;
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    get masteryAction() {
        if (this.currentDigSite === undefined)
            throw new Error(`Error getting masteryAction. No Dig Site is selected.`);
        return this.currentDigSite;
    }
    get actionLevel() {
        if (this.currentDigSite === undefined)
            return 0;
        return this.currentDigSite.level;
    }
    get defaultTool() {
        const tool = this.tools.getObjectByID("melvorAoD:Sieve" /* ArchaeologyToolIDs.Sieve */ );
        if (tool !== undefined)
            return tool;
        throw new Error(`Error getting defaultTool. No default tool is set.`);
    }
    getBaseSkillXPForDigSite(digSite) {
        if (digSite.selectedMap === undefined)
            return 0;
        return Math.max(1, 0.12 * digSite.level);
    }
    getArtefactSkillXPForDigSite(digSite) {
        return this.getBaseSkillXPForDigSite(digSite) * 50;
    }
    registerData(namespace, data) {
        data.digSites.forEach((digSite) => {
            this.actions.registerObject(new ArchaeologyDigSite(namespace, digSite, this.game, this));
        });
        super.registerData(namespace, data);
        data.tools.forEach((tool) => {
            this.tools.registerObject(new ArchaeologyTool(namespace, tool, this.game));
        });
        this.museum.registerRewards(namespace, data.museumRewards);
    }
    modifyData(data) {
        super.modifyData(data);
    }
    postDataRegistration() {
        super.postDataRegistration();
        // set up tool artefact types
        this.tools.forEach((tool) => {
            this.artefactTypeTools.set(tool.artefactType, tool);
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
        this.museum.postDataRegistration();
    }
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.renderQueue.digSiteVisibility = true;
    }
    render() {
        super.render();
        this.renderProgressBar();
        this.renderMapCharges();
        this.renderSelectedMap();
        this.renderDigSiteVisibility();
        this.renderDigSites();
        this.renderMapSelection();
        this.renderDigSiteRates();
        this.museum.render();
    }
    renderProgressBar() {
        var _a, _b;
        if (!this.renderQueue.progressBar)
            return;
        if (this.lastActiveDigSiteProgressBar !== undefined) {
            (_a = archaeologyMenus.digSites.get(this.lastActiveDigSiteProgressBar)) === null || _a === void 0 ? void 0 : _a.getProgressBar().stopAnimation();
            this.lastActiveDigSiteProgressBar = undefined;
        }
        if (this.currentDigSite === undefined)
            return;
        const progressBar = (_b = archaeologyMenus.digSites.get(this.currentDigSite)) === null || _b === void 0 ? void 0 : _b.getProgressBar();
        if (progressBar !== undefined) {
            if (this.isActive) {
                progressBar.animateProgressFromTimer(this.actionTimer);
                this.lastActiveDigSiteProgressBar = this.currentDigSite;
            } else {
                progressBar.stopAnimation();
                this.lastActiveDigSiteProgressBar = undefined;
            }
        }
        this.renderQueue.progressBar = false;
    }
    renderMapCharges() {
        if (this.renderQueue.selectedMapCharges.size === 0)
            return;
        this.renderQueue.selectedMapCharges.forEach((digSite) => {
            const map = digSite.selectedMap;
            const element = archaeologyMenus.digSites.get(digSite);
            if (element === undefined)
                return;
            /** Change to select next available map */
            if (map === undefined || map.charges < 1) {
                element.removeActiveMap();
                return;
            }
            element.updateMapCharges(map);
        });
        this.renderQueue.selectedMapCharges.clear();
    }
    renderSelectedMap() {
        if (this.renderQueue.selectedMap.size === 0)
            return;
        this.renderQueue.selectedMap.forEach((digSite) => {
            const map = digSite.selectedMap;
            const element = archaeologyMenus.digSites.get(digSite);
            if (element === undefined)
                return;
            /** Change to select next available map */
            if (map === undefined || map.charges < 1) {
                element.removeActiveMap();
                return;
            }
            element.setActiveMap(digSite, this);
        });
        this.renderQueue.selectedMap.clear();
    }
    renderDigSiteVisibility() {
        if (!this.renderQueue.digSiteVisibility)
            return;
        this.actions.forEach((digSite) => {
            const menu = archaeologyMenus.digSites.get(digSite);
            if (menu === undefined)
                return;
            if (digSite.isDiscovered && this.level >= digSite.level) {
                menu.setUnlocked();
                if (this.hiddenDigSites.has(digSite))
                    menu.hideArea();
                else
                    menu.showArea();
            } else {
                menu.setLocked();
                menu.setUnlockRequirements(digSite, this);
            }
        });
        this.renderQueue.digSiteVisibility = false;
    }
    renderDigSites() {
        if (this.renderQueue.digSites.size === 0)
            return;
        this.renderQueue.digSites.forEach((digSite) => {
            const menu = archaeologyMenus.digSites.get(digSite);
            if (menu === undefined)
                return;
            if (!this.canExcavate(digSite))
                menu.disableExcavateButton();
            else
                menu.enableExcavateButton();
            menu.setActiveTools(digSite, this);
            showElement(menu);
            if (this.hiddenDigSites.has(digSite))
                menu.hideArea();
            else
                menu.showArea();
        });
        this.renderQueue.digSites.clear();
    }
    renderMapSelection() {
        if (this.renderQueue.mapSelection.size === 0)
            return;
        this.renderQueue.mapSelection.forEach((digSite) => {
            const elements = document.querySelectorAll(`dig-site-map-select[data-digSite-id="${digSite.id}"]`);
            elements.forEach((element) => element.updateMapSelection(digSite, this));
        });
        this.renderQueue.mapSelection.clear();
    }
    renderDigSiteRates() {
        if (!this.renderQueue.digSiteRates)
            return;
        this.actions.forEach((digsite) => {
            const menu = archaeologyMenus.digSites.get(digsite);
            if (menu === undefined)
                return;
            let interval = this.modifyInterval(this.baseInterval, digsite);
            const mxp = this.getMasteryXPToAddForAction(digsite, interval);
            const baseMXP = this.getBaseMasteryXPToAddForAction(digsite, interval);
            interval /= 1000;
            const baseXP = this.getArtefactSkillXPForDigSite(digsite);
            const xp = this.modifyXP(baseXP, digsite);
            const mpxp = this.getMasteryXPToAddToPool(mxp);
            menu.updateGrants(xp, baseXP, mxp, baseMXP, mpxp, interval * 1000, this.getDoublingChance(digsite), this.getDoublingSources(digsite), digsite);
            menu.updateArtefactChances(digsite, this);
        });
        this.renderQueue.digSiteRates = false;
    }
    toggleDigSiteVisibility(digSite) {
        this.hiddenDigSites.has(digSite) ? this.hiddenDigSites.delete(digSite) : this.hiddenDigSites.add(digSite);
        this.renderQueue.digSites.add(digSite);
    }
    encode(writer) {
        super.encode(writer);
        writer.writeBoolean(this.currentDigSite !== undefined);
        if (this.currentDigSite !== undefined)
            writer.writeNamespacedObject(this.currentDigSite);
        writer.writeArray(this.actions.allObjects, (digSite, writer) => {
            writer.writeNamespacedObject(digSite);
            digSite.encode(writer);
        });
        this.museum.encode(writer);
        writer.writeSet(this.hiddenDigSites, writeNamespaced);
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        if (reader.getBoolean()) {
            const digSite = reader.getNamespacedObject(this.actions);
            if (typeof digSite === 'string') {
                this.shouldResetAction = true;
            } else {
                this.currentDigSite = digSite;
            }
        }
        reader.getArray((reader) => {
            let digSite = reader.getNamespacedObject(this.actions);
            if (typeof digSite === 'string') {
                digSite = this.actions.getDummyObject(digSite, DummyArchaeologyDigSite, this.game);
            }
            digSite.decode(reader, version);
        });
        if (version > 54) {
            this.museum.decode(reader, version);
        }
        if (version >= 72) {
            this.hiddenDigSites = reader.getSet(readNamespacedReject(this.actions));
        }
        if (this.shouldResetAction)
            this.resetActionState();
    }
    resetActionState() {
        super.resetActionState();
        this.currentDigSite = undefined;
    }
    onLoad() {
        super.onLoad();
        this.setAllDigSites();
        this.renderQueue.digSiteVisibility = true;
        this.actions.forEach((action) => {
            this.renderQueue.digSites.add(action);
        });
        this.renderQueue.digSiteRates = true;
        if (this.isActive && this.currentDigSite !== undefined) {
            this.renderQueue.progressBar = true;
        }
        this.museum.onLoad();
    }
    postLoad() {
        archaeologyUI.loadArchaeologyUI();
    }
    onPageChange() {
        if (archaeologyUI.isMuseumVisible) {
            this.onMuseumVisible();
        }
        super.onPageChange();
    }
    /** Queues renders when the museum becomes visible */
    onMuseumVisible() {
        this.museum.renderQueue.genericDonationInfo = true;
        this.museum.renderQueue.museumTokenCount = true;
        this.museum.renderQueue.allArtefacts = true;
    }
    queueBankQuantityRender(item) {
        if (item === this.museum.tokenItem)
            this.museum.renderQueue.museumTokenCount = true;
        if (!item.isArtefact)
            return;
        if (archaeologyUI.isMuseumVisible) {
            this.museum.renderQueue.artefacts.add(item);
            if (item.isGenericArtefact)
                this.museum.renderQueue.genericDonationInfo = true;
        }
    }
    onModifierChange() {
        super.onModifierChange();
        this.renderQueue.digSiteRates = true;
        this.renderQueue.mapSelection = new Set(this.actions.allObjects);
    }
    onAncientRelicUnlock() {
        super.onAncientRelicUnlock();
        this.actions.forEach((action) => {
            this.renderQueue.digSites.add(action);
        });
    }
    addProvidedStats() {
        var _a;
        super.addProvidedStats();
        if (this.isActive && ((_a = this.currentDigSite) === null || _a === void 0 ? void 0 : _a.selectedMap) !== undefined) {
            this.providedStats.modifiers.addModifiers(this.currentDigSite, this.currentDigSite.selectedMap.refinements);
        }
        this.museum.sortedRewards.some((reward) => {
            if (reward.awarded)
                this.providedStats.addStatObject(this.museumRewardSource, reward.stats);
            return !reward.awarded;
        });
    }
    canExcavate(digSite) {
        return (digSite !== undefined &&
            digSite.selectedMap !== undefined &&
            digSite.selectedTools.length > 0 &&
            digSite.selectedMap.charges > 0);
    }
    /** Callback function for when the Excavate button is clicked */
    startDigging(digSite) {
        const prevDigSite = this.currentDigSite;
        const startNewAction = prevDigSite !== digSite && this.canExcavate(digSite);
        this.updateModifiersOnStop = !startNewAction;
        if (this.isActive && !this.stop())
            return;
        this.updateModifiersOnStop = true;
        if (startNewAction) {
            this.currentDigSite = digSite;
            if (!this.start()) {
                this.currentDigSite = undefined;
            }
        }
        this.render();
    }
    start() {
        // Custom start method to accomadate map refinements
        const canStart = !this.game.idleChecker(this);
        if (canStart) {
            if (!this.game.currentGamemode.enableInstantActions) {
                this.isActive = true;
                this.game.renderQueue.activeSkills = true;
                this.computeProvidedStats(true); // Compute provided stats just before interval
                this.startActionTimer();
                this.game.activeAction = this;
                this.game.scheduleSave();
            } else {
                this.isActive = true;
                this.game.renderQueue.activeSkills = true;
                this.game.activeAction = this;
                this.computeProvidedStats(true); // Compute provided stats just before interval
                const actionsToPerform = this.game.modifiers.getInstantActionsToPerform();
                for (let i = 0; i < actionsToPerform; i++) {
                    this.action();
                }
                showActionsRunOutSwal();
                this.stop();
            }
        }
        return canStart;
    }
    onStop() {
        this.currentDigSite = undefined;
        if (this.updateModifiersOnStop)
            this.computeProvidedStats(true);
    }
    /** Returns the interval an npc in ms */
    getDigSiteInterval(digSite) {
        return this.modifyInterval(this.baseInterval, digSite);
    }
    applyPrimaryProductMultipliers(item, quantity, action, query) {
        quantity = super.applyPrimaryProductMultipliers(item, quantity, action, query);
        if (item instanceof EquipmentItem && item.fitsInSlot("melvorD:Consumable" /* EquipmentSlotIDs.Consumable */ ))
            quantity *= Math.pow(2, this.game.modifiers.doubleConsumablesArchaeology);
        return quantity;
    }
    get actionRewards() {
        const rewards = new Rewards(this.game);
        const currentDigSite = this.currentDigSite;
        if (currentDigSite === undefined)
            throw new Error('Error getting Archaeology action rewards. No current Dig Site is selected.');
        const selectedMap = currentDigSite.selectedMap;
        if (selectedMap === undefined)
            throw new Error('Error getting Archaeology action rewards. No current map is selected.');
        const actionEvent = new ArchaeologyActionEvent(this, currentDigSite);
        const type = this.getArtifactType(currentDigSite);
        const chanceForArtefact = selectedMap.getChanceForArtefact(type);
        let xpToAdd = 0;
        if (rollPercentage(chanceForArtefact)) {
            // Primary Product
            const activeDropTable = currentDigSite.getActiveDropTable(type);
            const {
                drop,
                quantity
            } = activeDropTable.getRawDrop();
            const qtyToAdd = this.modifyPrimaryProductQuantity(drop.item, quantity, currentDigSite);
            rewards.addItem(drop.item, qtyToAdd);
            this.addCurrencyFromPrimaryProductGain(rewards, drop.item, quantity, currentDigSite);
            switch (type) {
                case ArtefactType.TINY:
                    this.game.stats.Archaeology.add(3 /* ArchaeologyStats.TinyArtefactsFound */ , qtyToAdd);
                    break;
                case ArtefactType.SMALL:
                    this.game.stats.Archaeology.add(4 /* ArchaeologyStats.SmallArtefactsFound */ , qtyToAdd);
                    break;
                case ArtefactType.MEDIUM:
                    this.game.stats.Archaeology.add(5 /* ArchaeologyStats.MediumArtefactsFound */ , qtyToAdd);
                    break;
                case ArtefactType.LARGE:
                    this.game.stats.Archaeology.add(6 /* ArchaeologyStats.LargeArtefactsFound */ , qtyToAdd);
                    break;
            }
            actionEvent.productQuantity = qtyToAdd;
            this.lastRarityLocated = drop.weight;
            xpToAdd += this.getArtefactSkillXPForDigSite(currentDigSite);
            rewards.addXP(this, xpToAdd, currentDigSite);
            this.addCommonRewards(rewards, currentDigSite);
            actionEvent.artifactFound = true;
            this.game.stats.Archaeology.inc(0 /* ArchaeologyStats.SuccessfulActions */ );
        } else {
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, getLangString('FOUND_NOTHING_OF_INTEREST'), 'info'],
            });
            this.lastRarityLocated = ArtefactWeightRange.NOTHING;
            const basicItem = game.items.getObjectByID("melvorD:Bones" /* ItemIDs.Bones */ );
            if (basicItem !== undefined && rollPercentage(this.chanceForBones))
                rewards.addItem(basicItem, 1);
            actionEvent.productQuantity = 1;
            xpToAdd += this.getBaseSkillXPForDigSite(currentDigSite);
            rewards.addXP(this, xpToAdd, currentDigSite);
            this.game.modifiers.forEachCurrency("melvorD:flatCurrencyGainPerArchaeologyLevelNoArtefact" /* ModifierIDs.flatCurrencyGainPerArchaeologyLevelNoArtefact */ , (value, currency) => {
                let amount = this.level * value;
                if (amount > 0)
                    amount = this.modifyCurrencyReward(currency, amount, currentDigSite);
                rewards.addCurrency(currency, amount);
            });
            this.game.stats.Archaeology.inc(1 /* ArchaeologyStats.FailedActions */ );
        }
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    getXPModifier(masteryAction) {
        let modifier = super.getXPModifier(masteryAction);
        if (this.lastRarityLocated >= ArtefactWeightRange.COMMON && this.lastRarityLocated < ArtefactWeightRange.NOTHING)
            modifier += this.game.modifiers.archaeologyCommonItemSkillXP;
        return modifier;
    }
    getArtefactValue(type, digsite, map) {
        let value;
        switch (type) {
            case ArtefactType.TINY:
                value = map.artefactValues.tiny;
                break;
            case ArtefactType.SMALL:
                value = map.artefactValues.small;
                break;
            case ArtefactType.MEDIUM:
                value = map.artefactValues.medium;
                break;
            case ArtefactType.LARGE:
                value = map.artefactValues.large;
                break;
        }
        value += this.game.modifiers.getValue("melvorAoD:artefactValue" /* ModifierIDs.artefactValue */ , this.getActionModifierQuery(digsite));
        value = Math.max(1, value);
        return value;
    }
    get actionInterval() {
        if (this.currentDigSite === undefined)
            return 0;
        return this.getDigSiteInterval(this.currentDigSite);
    }
    get masteryModifiedInterval() {
        return this.actionInterval;
    }
    action() {
        this.preAction();
        const continueSkill = this.addActionRewards();
        this.postAction();
        if (continueSkill && this.canExcavate(this.currentDigSite)) {
            this.startActionTimer();
        } else {
            this.stop();
        }
    }
    preAction() {
        if (this.currentDigSite === undefined)
            throw new Error('Error during Archaeology pre-action stage. No current Dig Site is selected.');
        if (!this.canExcavate(this.currentDigSite) && this.isActive)
            this.stop();
    }
    postAction() {
        this.game.stats.Archaeology.add(2 /* ArchaeologyStats.TimeSpent */ , this.currentActionInterval);
        this.renderQueue.digSiteRates = true;
        this.consumeMapCharge();
    }
    getArtifactType(digSite) {
        const random = Math.floor(Math.random() * digSite.selectedTools.length);
        const type = digSite.selectedTools[random].artefactType;
        return type;
    }
    getChanceToPreserveMapCharge(digSite) {
        let chance = this.game.modifiers.bypassGlobalPreservationChance;
        chance += this.game.modifiers.getValue("melvorAoD:mapChargePreservationChance" /* ModifierIDs.mapChargePreservationChance */ , this.getActionModifierQuery(digSite));
        chance = clampValue(chance, 0, 80);
        return chance;
    }
    consumeMapCharge() {
        if (this.currentDigSite === undefined || this.currentDigSite.selectedMap == undefined)
            return;
        // Check for preservation
        if ((this.game.modifiers.archaeologyVeryRareMapPreservation > 0 &&
                this.lastRarityLocated > ArtefactWeightRange.VERYRARE) ||
            rollPercentage(this.getChanceToPreserveMapCharge(this.currentDigSite))) {
            this.game.stats.Archaeology.inc(8 /* ArchaeologyStats.ExcavationActionsPreserved */ );
        } else {
            this.currentDigSite.selectedMap.consumeCharges();
            this.game.stats.Archaeology.inc(7 /* ArchaeologyStats.ExcavationActionsUsed */ );
        }
    }
    onEquipmentChange() {}
    //I guess we don't need this for new skills
    getActionIDFromOldID(oldActionID, idMap) {
        return '';
    }
    deselectMap(digSite) {
        digSite.selectedMapIndex = -1;
        this.renderQueue.mapSelection.add(digSite);
        this.renderQueue.selectedMap.add(digSite);
    }
    /** Callback function for when a dig site map is selected */
    setMapAsActive(digSite, index) {
        var _a;
        if (digSite.maps[index] === undefined)
            return;
        digSite.selectedMapIndex = index;
        (_a = archaeologyMenus.digSites.get(digSite)) === null || _a === void 0 ? void 0 : _a.setActiveMap(digSite, this);
        this.onActiveMapChange(digSite);
        if (this.currentDigSite === digSite && this.isActive)
            this.computeProvidedStats(true);
    }
    onActiveMapChange(digSite) {
        this.renderQueue.mapSelection.add(digSite);
        this.renderQueue.selectedMap.add(digSite);
        this.renderQueue.digSites.add(digSite);
    }
    toggleTool(digSite, tool) {
        digSite.selectedTools.includes(tool) ? this.setToolAsInactive(digSite, tool) : this.setToolAsActive(digSite, tool);
    }
    setToolAsActive(digSite, tool) {
        const element = archaeologyMenus.digSites.get(digSite);
        element === null || element === void 0 ? void 0 : element.deselectTool(tool);
        digSite.selectedTools.push(tool);
        element === null || element === void 0 ? void 0 : element.selectTool(tool);
        element === null || element === void 0 ? void 0 : element.setActiveTools(digSite, this);
        this.renderQueue.digSites.add(digSite);
    }
    setToolAsInactive(digSite, tool) {
        const element = archaeologyMenus.digSites.get(digSite);
        element === null || element === void 0 ? void 0 : element.deselectTool(tool);
        digSite.selectedTools.splice(digSite.selectedTools.indexOf(tool), 1);
        element === null || element === void 0 ? void 0 : element.setActiveTools(digSite, this);
        this.renderQueue.digSites.add(digSite);
        if (digSite.selectedTools.length <= 0 && this.isActive && this.currentDigSite === digSite)
            this.stop();
    }
    setAllDigSites() {
        this.actions.forEach((digSite) => {
            const element = archaeologyMenus.digSites.get(digSite);
            element === null || element === void 0 ? void 0 : element.setDigSite(digSite, this);
        });
    }
    showArtefactsForDigSite(digSite) {
        const dropList = new ArtefactDropListElement();
        dropList.setList(digSite);
        SwalLocale.fire({
            title: digSite.name,
            html: dropList,
            showCloseButton: true,
            showConfirmButton: false,
            showCancelButton: false,
        });
    }
    cacheArtefactTypeAndLocation(item, digSite, type) {
        this.artefactLocationCache.set(item, {
            size: type,
            digSite
        });
    }
    getArtefactTypeAndLocation(item) {
        let location;
        for (const digSite of this.actions.allObjects) {
            let foundLocation = digSite.artefacts.tiny.sortedDropsArray.find((artefact) => artefact.item === item);
            if (foundLocation !== undefined) {
                this.cacheArtefactTypeAndLocation(item, digSite, ArtefactType.TINY);
                location = {
                    size: ArtefactType.TINY,
                    digSite
                };
                break;
            }
            foundLocation = digSite.artefacts.small.sortedDropsArray.find((artefact) => artefact.item === item);
            if (foundLocation !== undefined) {
                this.cacheArtefactTypeAndLocation(item, digSite, ArtefactType.SMALL);
                location = {
                    size: ArtefactType.SMALL,
                    digSite
                };
                break;
            }
            foundLocation = digSite.artefacts.medium.sortedDropsArray.find((artefact) => artefact.item === item);
            if (foundLocation !== undefined) {
                this.cacheArtefactTypeAndLocation(item, digSite, ArtefactType.MEDIUM);
                location = {
                    size: ArtefactType.MEDIUM,
                    digSite
                };
                break;
            }
            foundLocation = digSite.artefacts.large.sortedDropsArray.find((artefact) => artefact.item === item);
            if (foundLocation !== undefined) {
                this.cacheArtefactTypeAndLocation(item, digSite, ArtefactType.LARGE);
                location = {
                    size: ArtefactType.LARGE,
                    digSite
                };
                break;
            }
        }
        if (location === undefined)
            throw new Error(`Item ${item.name} was not found in any dig site`);
        return location;
    }
    getArtefactTypeAndLocationFromCache(item) {
        if (!item.isArtefact)
            throw new Error(`Item ${item.name} is not an artefact`);
        const cache = this.artefactLocationCache.get(item);
        if (cache === undefined) {
            const location = this.getArtefactTypeAndLocation(item);
            this.cacheArtefactTypeAndLocation(item, location.digSite, location.size);
            return location;
        }
        return cache;
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();

        function addDropTable(table) {
            table.sortedDropsArray.forEach((drop) => obtainable.add(drop.item));
        }
        this.actions.forEach((action) => {
            addDropTable(action.artefacts.tiny);
            addDropTable(action.artefacts.small);
            addDropTable(action.artefacts.medium);
            addDropTable(action.artefacts.large);
        });
        this.museum.sortedRewards.forEach((reward) => {
            var _a;
            (_a = reward.items) === null || _a === void 0 ? void 0 : _a.forEach(({
                item
            }) => obtainable.add(item));
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
                    return skillData.digSites;
            }
        }
    }
}
class ArchaeologyUI {
    constructor(archaeology) {
        this.archaeology = archaeology;
        this.currentPage = 0 /* ArchaeologyPage.DigSites */ ;
        this.defaultElements = {
            containers: {
                digSites: document.getElementById('archaeology-dig-sites-container'),
                museum: document.getElementById('archaeology-museum-container'),
            },
            menu: {
                digSites: document.getElementById('archaeology-dig-sites-menu'),
                museum: document.getElementById('archaeology-museum-menu'),
            },
            museum: document.getElementById('archaeology-museum-container'),
        };
    }
    /** If the museum is currently visible */
    get isMuseumVisible() {
        return this.currentPage === 1 /* ArchaeologyPage.Museum */ ;
    }
    loadArchaeologyUI() {
        this.defaultElements.museum.init(this.archaeology);
        this.defaultElements.menu.digSites.onclick = () => this.showPage(0 /* ArchaeologyPage.DigSites */ );
        this.defaultElements.menu.museum.onclick = () => this.showPage(1 /* ArchaeologyPage.Museum */ );
        this.showPage(this.currentPage);
    }
    getPageButton(page) {
        switch (page) {
            case 0 /* ArchaeologyPage.DigSites */ :
                return this.defaultElements.menu.digSites;
            case 1 /* ArchaeologyPage.Museum */ :
                return this.defaultElements.menu.museum;
        }
    }
    updatePageHighlight(oldPage, newPage) {
        const oldButton = this.getPageButton(oldPage);
        oldButton.classList.remove('township-tab-selected');
        const newButton = this.getPageButton(newPage);
        newButton.classList.add('township-tab-selected');
    }
    showPage(pageID) {
        this.updatePageHighlight(this.currentPage, pageID);
        this.currentPage = pageID;
        this.defaultElements.containers.digSites.classList.add('d-none');
        this.defaultElements.containers.museum.classList.add('d-none');
        switch (pageID) {
            case 0 /* ArchaeologyPage.DigSites */ :
                this.defaultElements.containers.digSites.classList.remove('d-none');
                break;
            case 1 /* ArchaeologyPage.Museum */ :
                this.defaultElements.containers.museum.classList.remove('d-none');
                this.archaeology.onMuseumVisible();
                break;
        }
    }
}
class ArchaeologyMuseumRenderQueue {
    constructor() {
        /** Updates the progress towards rewards */
        this.donationProgress = false;
        /** Updates the information for generic donations */
        this.genericDonationInfo = false;
        /** Updates the amount of museum tokens in the bank */
        this.museumTokenCount = false;
        /** Updates all artefacts */
        this.allArtefacts = false;
        /** Updates Museum artefacts completion */
        this.artefacts = new Set();
    }
}
class ArchaeologyMuseum extends GameEventEmitter {
    constructor(game, archaeology) {
        super();
        this.game = game;
        this.archaeology = archaeology;
        this.genericArtefacts = [];
        /** The rewards for donating items to the museum, sorted by lowest to highest number of items required */
        this.sortedRewards = [];
        /** Save state property. The artefact items which have been donated to the museum */
        this.donatedItems = new Set();
        this.renderQueue = new ArchaeologyMuseumRenderQueue();
        this.rewards = new NamespaceRegistry(game.registeredNamespaces, ArchaeologyMuseumReward.name);
    }
    get tokenItem() {
        return this._tokenItem;
    }
    /** Gets the total number of different items that have been donated to the museum */
    get donationCount() {
        return this.donatedItems.size;
    }
    registerRewards(namespace, data) {
        data.forEach((rewardData) => {
            this.rewards.registerObject(new ArchaeologyMuseumReward(namespace, rewardData, game));
        });
    }
    postDataRegistration() {
        this.genericArtefacts = game.items.allObjects.filter((item) => item.isGenericArtefact);
        this.sortedRewards = this.rewards.allObjects.sort((a, b) => a.museumCount - b.museumCount);
        const museumToken = this.game.items.getObjectByID('melvorAoD:Museum_Token');
        if (museumToken === undefined)
            throw new Error('Error loading Archaeology Museum. Museum Token item not found.');
        this._tokenItem = museumToken;
    }
    onLoad() {
        this.cleanupDonatedMuseumArtefacts();
        this.renderQueue.donationProgress = true;
    }
    render() {
        this.renderDonationProgress();
        this.renderGenericDonation();
        this.renderMuseumTokeCount();
        this.renderAllArtefacts();
        this.renderArtefacts();
    }
    renderDonationProgress() {
        if (!this.renderQueue.donationProgress)
            return;
        archaeologyUI.defaultElements.museum.updateDonationProgress(this);
        this.renderQueue.donationProgress = false;
    }
    renderGenericDonation() {
        if (!this.renderQueue.genericDonationInfo)
            return;
        archaeologyUI.defaultElements.museum.updateGenericDonationInfo(this);
        this.renderQueue.genericDonationInfo = false;
    }
    renderMuseumTokeCount() {
        if (!this.renderQueue.museumTokenCount)
            return;
        archaeologyUI.defaultElements.museum.updateMuseumTokenCount(this.game, this);
        this.renderQueue.museumTokenCount = false;
    }
    renderAllArtefacts() {
        if (!this.renderQueue.allArtefacts)
            return;
        archaeologyUI.defaultElements.museum.updateAllArtefacts(this.game, this);
        this.renderQueue.artefacts.clear();
        this.renderQueue.allArtefacts = false;
    }
    renderArtefacts() {
        if (this.renderQueue.artefacts.size === 0)
            return;
        this.renderQueue.artefacts.forEach((item) => {
            archaeologyUI.defaultElements.museum.updateArtefact(item, this.game, this);
        });
        this.renderQueue.artefacts.clear();
    }
    /** Removes non-artefact items from the donatedItems set */
    cleanupDonatedMuseumArtefacts() {
        this.donatedItems.forEach((item) => {
            if (!item.isArtefact) {
                this.donatedItems.delete(item);
            }
        });
    }
    /** Checks if the given item has been donated to the museum */
    isItemDonated(item) {
        return this.donatedItems.has(item);
    }
    /** Gets the number of artefacts that must be donated until the next reward is unlocked */
    getItemsUntilNextReward() {
        const nextReward = this.sortedRewards.find((reward) => !reward.awarded);
        if (nextReward === undefined)
            return 0;
        return nextReward.museumCount - this.donatedItems.size;
    }
    /** Callback function for when an individual item is selected to be donated */
    donateItem(item) {
        if (this.isItemDonated(item)) {
            notifyPlayer(this.archaeology, getLangString('ITEM_ALREADY_DONATED'), 'danger');
            return;
        }
        const itemInBank = this.game.bank.getQty(item);
        if (itemInBank <= 0) {
            notifyPlayer(this.archaeology, getLangString('ITEM_NOT_FOUND'), 'danger');
            return;
        }
        this.game.bank.removeItemQuantity(item, 1, false);
        const oldCount = this.donationCount;
        this.donatedItems.add(item);
        this.giveUnawardedRewards();
        this.renderQueue.artefacts.add(item);
        this.renderQueue.donationProgress = true;
        notifyPlayer(this.archaeology, templateLangString('ITEM_DONATED', {
            itemName: item.name,
            totalCount: `${this.donationCount}`,
        }), 'success');
        this._events.emit('itemDonated', new ArchaeologyItemDonatedEvent(oldCount, this.donationCount));
    }
    /** Awards any unawarded rewards to the player */
    giveUnawardedRewards() {
        let statsUnlocked = false;
        for (let i = 0; i < this.sortedRewards.length; i++) {
            const reward = this.sortedRewards[i];
            if (this.donationCount >= reward.museumCount && !reward.awarded) {
                this.giveReward(reward);
                if (reward.stats.hasStats)
                    statsUnlocked = true;
            }
        }
        if (statsUnlocked)
            this.archaeology.computeProvidedStats(true);
    }
    /**
     * Awards a museum reward to the player. Does not recompute provided stats.
     * @param bonus The bonus to give
     */
    giveReward(reward) {
        var _a, _b, _c;
        this.queueRewardModal(reward);
        (_a = reward.pets) === null || _a === void 0 ? void 0 : _a.forEach((pet) => {
            this.game.petManager.unlockPet(pet);
        });
        (_b = reward.currencies) === null || _b === void 0 ? void 0 : _b.forEach(({
            currency,
            quantity
        }) => {
            currency.add(quantity);
        });
        (_c = reward.items) === null || _c === void 0 ? void 0 : _c.forEach(({
            item,
            quantity
        }) => {
            this.game.bank.addItem(item, quantity, false, true, true, true, `Skill.${this.archaeology.id}`);
        });
        reward.awarded = true;
    }
    /**
     * Queues a modal for unlocking a new museum bonus
     * @param bonus The bonus unlocked
     */
    queueRewardModal(reward) {
        const modalBody = createElement('div', {
            className: 'justify-vertical-center'
        });
        createElement('h5', {
            text: getLangString('MUSEUM_GRANTED_AWARD'),
            className: 'font-w400 mb-0',
            parent: modalBody,
        });
        if (reward.stats.hasStats) {
            createElement('h5', {
                text: getLangString('PERMANENT_BONUS_UNLOCKED'),
                className: 'font-w600 font-size-lg text-warning mb-0 mt-2',
                parent: modalBody,
            });
            modalBody.append(...reward.stats.describeAsSpans());
        }
        const rewardNodes = this.createItemCurrencyNodes(reward);
        if (rewardNodes.length > 0) {
            createElement('h5', {
                text: getLangString('REWARDS_UNLOCKED'),
                className: 'font-w600 font-size-lg text-warning mb-0 mt-2',
                parent: modalBody,
            });
            modalBody.append(...rewardNodes);
        }
        if (reward.pets !== undefined) {
            createElement('h5', {
                text: reward.pets.length > 1 ? getLangString('PETS_UNLOCKED') : getLangString('COMPLETION_LOG_PETS_UNLOCKED'),
                className: 'font-w600 font-size-lg text-warning mb-0 mt-2',
                parent: modalBody,
            });
            reward.pets.forEach((pet) => {
                const petSpan = createElement('span', {
                    className: 'text-success',
                    parent: modalBody
                });
                petSpan.append(createElement('img', {
                    className: 'skill-icon-md mr-1',
                    attributes: [
                        ['src', pet.media]
                    ]
                }), pet.name);
            });
        }
        addModalToQueue({
            titleText: getLangString('MUSEUM_REWARD_UNLOCKED'),
            imageUrl: this.archaeology.media,
            html: modalBody,
            allowOutsideClick: false,
            showConfirmButton: true,
            imageWidth: 128,
            imageHeight: 128,
        });
    }
    createItemCurrencyNodes(costs) {
        var _a, _b;
        const nodes = [];
        const createSpan = (children) => {
            nodes.push(createElement('span', {
                className: 'text-success',
                children
            }));
        };
        const smallImage = (media) => createElement('img', {
            className: 'skill-icon-xs',
            attributes: [
                ['src', media]
            ]
        });
        (_a = costs.currencies) === null || _a === void 0 ? void 0 : _a.forEach(({
            currency,
            quantity
        }) => {
            createSpan(templateStringWithNodes(currency.gainTemplate, {
                curIcon: smallImage(currency.media)
            }, {
                count: numberWithCommas(quantity)
            }));
        });
        (_b = costs.items) === null || _b === void 0 ? void 0 : _b.forEach(({
            item,
            quantity
        }) => {
            createSpan(templateLangStringWithNodes('MENU_TEXT_YOU_GAINED_ITEM', {
                itemImage: smallImage(item.media)
            }, {
                count: numberWithCommas(quantity),
                itemName: item.name
            }));
        });
        return nodes;
    }
    /**
     * Iterates over each generic artefact in the bank that will be donated
     * @param callbackfn
     */
    forEachGenericArtefactInBank(callbackfn) {
        for (let i = 0; i < this.genericArtefacts.length; i++) {
            const item = this.genericArtefacts[i];
            if (!this.game.bank.hasUnlockedItem(item))
                continue;
            const bankQuantity = this.game.bank.getQty(item);
            const donateQuantity = this.game.settings.genericArtefactAllButOne ? bankQuantity - 1 : bankQuantity;
            if (donateQuantity <= 0)
                continue;
            callbackfn(item, donateQuantity);
        }
    }
    /**
     * Gets information about the "Donate Generic Artefacts" action
     * @returns The number of Museum Tokens gained, The total currency value of all donated items, and the total count of items donated
     */
    getDonateGenericInfo() {
        let tokenGain = 0;
        const currencyValue = new SparseNumericMap();
        let itemCount = 0;
        this.forEachGenericArtefactInBank((item, donateQuantity) => {
            tokenGain += donateQuantity;
            itemCount += donateQuantity;
            currencyValue.add(item.sellsFor.currency, item.sellsFor.quantity * donateQuantity);
            if (!this.isItemDonated(item)) {
                tokenGain--;
            }
        });
        return {
            tokenGain,
            currencyValue,
            itemCount
        };
    }
    /** Callback function for when the "Donate Generic Artefacts" button is pressed */
    onDonateGenericClick() {
        return __awaiter(this, void 0, void 0, function*() {
            const userReponse = yield this.fireConfirmDonateGenericModal();
            if (userReponse === null || userReponse === void 0 ? void 0 : userReponse.value)
                this.donateAllGenericArtefacts();
        });
    }
    fireConfirmDonateGenericModal() {
        return __awaiter(this, void 0, void 0, function*() {
            const {
                tokenGain,
                currencyValue,
                itemCount
            } = this.getDonateGenericInfo();
            if (itemCount < 1)
                return;
            let html = `${templateLangString('ARCHAEOLOGY_DONATE_CONFIRMATION', {
                qty: `<strong>${numberWithCommas(itemCount)}</strong>`,
            })}<br><br>
    ${templateLangString('ARCHAEOLOGY_MUSEUM_TOKENS_FROM_DONATION', {
                qty: numberWithCommas(tokenGain),
                itemIcon: `<img class="skill-icon-xs mr-1" src="${assets.getURI("assets/media/bank/Museum_Token.png" /* Assets.MuseumToken */)}">`,
            })}<br><small>
    ${getLangString('TOTAL_ITEM_VALUE')}<br>`;
            currencyValue.forEach((value, currency) => {
                html += `<span>${currency.formatAmount(numberWithCommas(value))}</span><br>`;
            });
            html += '</small>';
            return yield SwalLocale.fire({
                title: getLangString('ARCHAEOLOGY_BTN_DONATE_JUNK_TO_MUSEUM'),
                html,
                showCancelButton: true,
                showConfirmButton: true,
                cancelButtonText: getLangString('CHARACTER_SELECT_45'),
                confirmButtonText: getLangString('PAGE_NAME_MISC_16'),
            });
        });
    }
    /** Executes the donation of all generic artefacts in the bank */
    donateAllGenericArtefacts() {
        const {
            tokenGain
        } = this.getDonateGenericInfo();
        let tokensAdded = false;
        if (tokenGain > 0) {
            tokensAdded = this.game.bank.addItem(this._tokenItem, tokenGain, false, true, false, true, `Skill.${this.archaeology.id}.MuseumDonation`);
        } else {
            tokensAdded = true;
        }
        if (tokensAdded) {
            const oldCount = this.donationCount;
            this.forEachGenericArtefactInBank((item, donateQuantity) => {
                this.game.bank.removeItemQuantity(item, donateQuantity, true);
                if (!this.isItemDonated(item)) {
                    this.donatedItems.add(item);
                }
            });
            if (oldCount !== this.donationCount) {
                this.giveUnawardedRewards();
                this.renderQueue.donationProgress = true;
                this._events.emit('itemDonated', new ArchaeologyItemDonatedEvent(oldCount, this.donationCount));
            }
        } else {
            bankFullNotify();
        }
    }
    encode(writer) {
        writer.writeArray(this.rewards.allObjects, (reward) => {
            writer.writeNamespacedObject(reward);
            writer.writeBoolean(reward.awarded);
        });
        writer.writeSet(this.donatedItems, writeNamespaced);
        return writer;
    }
    decode(reader, version) {
        reader.getArray((reader) => {
            const reward = reader.getNamespacedObject(this.rewards);
            const awarded = reader.getBoolean();
            if (typeof reward !== 'string')
                reward.awarded = awarded;
        });
        this.donatedItems = reader.getSet((reader) => {
            const item = reader.getNamespacedObject(this.game.items);
            if (typeof item === 'string') {
                if (item.startsWith('melvor'))
                    return this.game.items.getDummyObject(item, DummyItem, this.game);
                else
                    return undefined;
            }
            return item;
        });
    }
}
//# sourceMappingURL=archaeology.js.map
checkFileVersion('?12097')