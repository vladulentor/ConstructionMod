"use strict";
class TownshipBiome extends RealmedObject {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.abyssalTier = 0;
        /** The number of buildings that have been built in the biome */
        this.buildingsBuilt = new Map();
        /** The efficiency of buildings that have been built in the biome */
        this.buildingEfficiency = new Map();
        /** Cache of buildings that are available in this biome. Used to only render buildings for the selected biome */
        this.availableBuildings = [];
        this.requirements = [];
        this._name = data.name;
        this._media = data.media;
        this.tier = data.tier;
        if (data.abyssalTier !== undefined)
            this.abyssalTier = data.abyssalTier;
        game.queueForSoftDependencyReg(data, this);
    }
    get name() {
        if (this.isModded)
            return this._name;
        return getLangString(`TOWNSHIP_BIOME_${this.localID}`);
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get englishName() {
        return this._name;
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.requirements !== undefined)
                this.requirements = game.getRequirementsFromData(data.requirements);
        } catch (e) {
            throw new DataConstructionError(TownshipBiome.name, e, this.id);
        }
    }
    /** Returns the number of a particular building that has been built in the biome */
    getBuildingCount(building) {
        var _a;
        return (_a = this.buildingsBuilt.get(building)) !== null && _a !== void 0 ? _a : 0;
    }
    getCurrentBuildingInUpgradeChain(building) {
        let currentBuilding = building.upgradeChain[0];
        let previousBuilding = undefined;
        building.upgradeChain.forEach((b, index) => {
            if (index > 0)
                previousBuilding = currentBuilding;
            if (this.getBuildingCount(b) > 0 ||
                (previousBuilding !== undefined && this.getBuildingCount(previousBuilding) === previousBuilding.maxUpgrades)) {
                currentBuilding = b;
            }
        });
        return currentBuilding;
    }
    removeBuildings(building, count) {
        const newCount = this.getBuildingCount(building) - count;
        if (newCount <= 0) {
            this.buildingsBuilt.delete(building);
            this.buildingEfficiency.delete(building);
        } else
            this.buildingsBuilt.set(building, newCount);
    }
    addBuildings(building, count) {
        const newCount = this.getBuildingCount(building) + count;
        this.buildingsBuilt.set(building, newCount);
        this.buildingEfficiency.set(building, 100);
    }
    getBuildingEfficiency(building) {
        var _a;
        return (_a = this.buildingEfficiency.get(building)) !== null && _a !== void 0 ? _a : 100;
    }
    reduceBuildingEfficiency(building, amount, game) {
        let newEfficiency = this.getBuildingEfficiency(building) - amount;
        newEfficiency = Math.max(20 + game.modifiers.minimumTownshipBuildingEfficiency, newEfficiency);
        this.buildingEfficiency.set(building, newEfficiency);
    }
    setBuildingEfficiency(building, amount) {
        const oldEfficiency = this.getBuildingEfficiency(building);
        this.buildingEfficiency.set(building, amount);
        this.buildingEfficiency.set(this.getCurrentBuildingInUpgradeChain(building), amount);
        return oldEfficiency < amount;
    }
}
class DummyTownshipBiome extends TownshipBiome {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            name: '',
            tier: 1,
            abyssalTier: 0,
            media: '',
        }, game);
    }
}
class TownshipBuildingProvides {
    constructor(data, game) {
        var _a, _b, _c;
        this.resources = new Map();
        try {
            this.population = data.population;
            this.happiness = data.happiness;
            this.education = data.education;
            this.storage = data.storage;
            data.resources.map(({
                id,
                quantity
            }) => {
                const resource = game.township.resources.getObjectSafe(id);
                this.resources.set(resource, quantity);
            });
            this.worship = (_a = data.worship) !== null && _a !== void 0 ? _a : 0;
            this.fortification = (_b = data.fortification) !== null && _b !== void 0 ? _b : 0;
            this.soulStorage = (_c = data.soulStorage) !== null && _c !== void 0 ? _c : 0;
        } catch (e) {
            throw new DataConstructionError(TownshipBuildingProvides.name, e);
        }
    }
    resourceCount(resource) {
        var _a;
        return (_a = this.resources.get(resource)) !== null && _a !== void 0 ? _a : 0;
    }
}
class TownshipBuilding extends RealmedObject {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.costs = new Map();
        this.provides = new Map();
        this.canDegrade = true;
        this.upgradeChain = [];
        this.abyssalTier = 0;
        this.requirements = [];
        /** Multipliers for the stats provided by this building */
        this.providedStatMultiplier = {
            pos: 0,
            neg: 0,
        };
        try {
            this._name = data.name;
            this._media = data.media;
            this.tier = data.tier;
            if (data.upgradesFrom !== undefined) {
                this.upgradesFrom = game.township.buildings.getObjectSafe(data.upgradesFrom);
            }
            data.cost.forEach((cost) => {
                const biome = game.township.biomes.getObjectSafe(cost.biomeID);
                this.costs.set(biome, game.township.getResourceQuantityFromData(cost.cost));
            });
            data.provides.forEach((provides) => {
                const biome = game.township.biomes.getObjectSafe(provides.biomeID);
                this.provides.set(biome, new TownshipBuildingProvides(provides, game));
            });
            this.biomes = game.township.biomes.getArrayFromIds(data.biomes);
            this.stats = new StatObject(data, game, `${TownshipBuilding.name} with id "${this.id}"`);
            this.maxUpgrades = data.maxUpgrades;
            if (data.canDegrade !== undefined)
                this.canDegrade = data.canDegrade;
            if (data.abyssalTier !== undefined)
                this.abyssalTier = data.abyssalTier;
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(TownshipBuilding.name, e, this.id);
        }
    }
    get name() {
        if (this._name === 'STATUE_NAME')
            return game.township.statueName;
        if (this.isModded)
            return this._name;
        return getLangString(`TOWNSHIP_BUILDING_${this.localID}`);
    }
    get media() {
        if (this._media === 'STATUE_MEDIA')
            return game.township.statueMedia;
        return this.getMediaURL(this._media);
    }
    get englishName() {
        return this._name;
    }
    get providesStats() {
        return StatObject.hasStats(this.stats);
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.requirements !== undefined)
                this.requirements = game.getRequirementsFromData(data.requirements);
        } catch (e) {
            throw new DataConstructionError(TownshipBuilding.name, e, this.id);
        }
    }
    get totalUpgrades() {
        return this.upgradeChain.length;
    }
    get upgradePosition() {
        return this.upgradeChain.indexOf(this);
    }
    calculateUpgradeData() {
        this.upgradeChain = [this];
        let hasUpgrade = this.upgradesFrom !== undefined;
        let nextBuilding = this.upgradesFrom;
        while (hasUpgrade) {
            if (nextBuilding !== undefined) {
                this.upgradeChain.unshift(nextBuilding);
                hasUpgrade = nextBuilding.upgradesFrom !== undefined;
                if (hasUpgrade)
                    nextBuilding = nextBuilding.upgradesFrom;
                else
                    break;
            } else
                break;
        }
        hasUpgrade = this.upgradesTo !== undefined;
        nextBuilding = this.upgradesTo;
        while (hasUpgrade) {
            if (nextBuilding !== undefined) {
                this.upgradeChain.push(nextBuilding);
                hasUpgrade = nextBuilding.upgradesTo !== undefined;
                if (hasUpgrade)
                    nextBuilding = nextBuilding.upgradesTo;
                else
                    break;
            } else
                break;
        }
    }
}
class DummyTownshipBuilding extends TownshipBuilding {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            name: '',
            media: '',
            tier: 1,
            cost: [],
            provides: [],
            biomes: [],
            maxUpgrades: 0,
            canDegrade: true,
            abyssalTier: 0,
        }, game);
    }
}
class TownshipWorship extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        this.modifiers = [];
        this.checkpoints = [];
        this.seasonMultiplier = new Map();
        try {
            this._name = data.name;
            this._description = data.description;
            this._media = data.media;
            this.isHidden = data.isHidden;
            this.unlockRequirements = data.unlockRequirements.map((reqData) => game.getRequirementFromData(reqData));
            this._statueName = data.statueName;
            this._statueMedia = data.statueMedia;
            data.seasonMultiplier.forEach((seasonData) => {
                const season = game.township.seasons.getObjectSafe(seasonData.seasonID);
                this.seasonMultiplier.set(season, seasonData.multiplier);
            });
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(TownshipWorship.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded)
            return this._name;
        return getLangString(`WORSHIP_${this.localID}`);
    }
    get description() {
        return this._description; // TODO_L: Localize
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get statueName() {
        if (this.isModded)
            return this._statueName;
        return getLangString(`TOWNSHIP_${this._statueName.replace(/ /g, '_')}`);
    }
    get statueMedia() {
        return this.getMediaURL(this._statueMedia);
    }
    get englishName() {
        return this._name;
    }
    registerSoftDependencies(data, game) {
        try {
            this.modifiers = game.getModifierValuesFromData(data.modifiers);
            this.checkpoints = data.checkpoints.map((modData) => game.getModifierValuesFromData(modData));
            if (this.checkpoints.length !== 5)
                throw new Error(`Error constructing ${TownshipWorship.name} with id: ${data.id}. Invalid number of checkpoints.`);
        } catch (e) {
            throw new DataConstructionError(TownshipWorship.name, e, this.id);
        }
    }
}
class DummyTownshipWorship extends TownshipWorship {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            name: '',
            description: '',
            media: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
            modifiers: {},
            isHidden: false,
            checkpoints: [{}, {}, {}, {}, {}],
            unlockRequirements: [],
            statueName: '',
            statueMedia: '',
            seasonMultiplier: [],
        }, game);
    }
}
class TownshipItemConversion {
    constructor(data, game) {
        this.unlockRequirements = [];
        this.baseCost = 0;
        try {
            this._item = game.items.getObjectByID(data.itemID);
            this.unlockRequirements = data.unlockRequirements.map((reqData) => game.getRequirementFromData(reqData));
            if (data.baseCost !== undefined)
                this.baseCost = data.baseCost;
        } catch (e) {
            throw new DataConstructionError(TownshipItemConversion.name, e);
        }
    }
    get item() {
        if (this._item === undefined)
            throw new Error(`Item is undefined`);
        return this._item;
    }
}
class TownshipSeason extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        try {
            this._name = data.name;
            this._media = data.media;
            this.order = data.order;
            this.seasonLength = data.seasonLength;
            this.stats = new StatObject(data, game, `${TownshipSeason.name} with id "${this.id}"`);
            this.disableWorshipChange = data.disableWorshipChange;
        } catch (e) {
            throw new DataConstructionError(TownshipSeason.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded)
            return this._name;
        return getLangString(`TOWNSHIP_SEASON_${this.localID}`);
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get englishName() {
        return this._name;
    }
    applyDataModification(modData, game) {
        try {
            if (modData.modifiers !== undefined) {
                if (this.stats.modifiers === undefined)
                    this.stats.modifiers = [];
                this.stats.modifiers = game.modifyModifierValues(this.stats.modifiers, modData.modifiers);
            }
            if (modData.combatEffects !== undefined) {
                if (this.stats.combatEffects === undefined)
                    this.stats.combatEffects = [];
                game.modifyCombatEffectApplicators(this.stats.combatEffects, modData.combatEffects, PotionItem.name);
            }
            if (modData.enemyModifiers !== undefined) {
                if (this.stats.enemyModifiers === undefined)
                    this.stats.enemyModifiers = [];
                this.stats.enemyModifiers = game.modifyModifierValues(this.stats.enemyModifiers, modData.enemyModifiers);
            }
        } catch (e) {
            throw new DataModificationError(TownshipSeason.name, e, this.id);
        }
    }
}
class DummyTownshipSeason extends TownshipSeason {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            name: '',
            media: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
            order: 0,
            seasonLength: 72,
            modifiers: {},
            disableWorshipChange: false,
        }, game);
    }
}
var TownshipResourceTypeID;
(function(TownshipResourceTypeID) {
    TownshipResourceTypeID[TownshipResourceTypeID["Currency"] = 0] = "Currency";
    TownshipResourceTypeID[TownshipResourceTypeID["Raw"] = 1] = "Raw";
})(TownshipResourceTypeID || (TownshipResourceTypeID = {}));
var TownshipStorageTypeID;
(function(TownshipStorageTypeID) {
    TownshipStorageTypeID[TownshipStorageTypeID["Normal"] = 0] = "Normal";
    TownshipStorageTypeID[TownshipStorageTypeID["Soul"] = 1] = "Soul";
})(TownshipStorageTypeID || (TownshipStorageTypeID = {}));
class TownshipResource extends NamespacedObject {
    constructor(namespace, data, game) {
        var _a;
        super(namespace, data.id);
        this._amount = 0;
        this._cap = 100;
        /** Current generation rate of resource */
        this.generation = 0;
        /** What storage this resource uses */
        this.storageType = 'Normal';
        this._name = data.name;
        this._media = data.media;
        this.type = TownshipResourceTypeID[data.type];
        this.startingAmount = data.startingAmount;
        this._amount = this.startingAmount;
        this.storageType = (_a = data.storageType) !== null && _a !== void 0 ? _a : 'Normal';
    }
    get name() {
        if (this.isModded)
            return this._name;
        return getLangString(`TOWNSHIP_RESOURCE_${this.localID}`);
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get englishName() {
        return this._name;
    }
    /** Amount of resource owned */
    get amount() {
        return this._amount;
    }
    /** Amount of resource owned */
    set amount(amount) {
        if (amount < 0)
            this._amount = 0;
        else
            this._amount = amount;
    }
    /** Resource cap (% of max storage) */
    get cap() {
        return this._cap;
    }
    /** Resource cap (% of max storage) */
    set cap(cap) {
        if (cap < 0)
            this._cap = 0;
        if (cap > 100)
            this._cap = 100;
        else
            this._cap = cap;
    }
}
class DummyTownshipResource extends TownshipResource {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            name: '',
            media: '',
            type: 'Raw',
            startingAmount: 0,
            storageType: 'Normal',
        }, game);
    }
}
class TownshipRenderQueue extends SkillRenderQueue {
    constructor() {
        super(...arguments);
        /** Renders population, workers, storage, happiness, education, health and worship. Impacted by modifiers. */
        this.townStats = false;
        /** Renders the amount of each resource owned */
        this.resourceAmounts = false;
        /** Renders the rate of each resource gain. Impacted by modifiers. */
        this.resourceRates = false;
        /** Renders the costs of all buildings. */
        this.buildingCosts = false;
        /** Renders the current age of the town */
        this.townAge = false;
        /** Renders the provision and resource output of buildings */
        this.buildingProvides = false;
        /** Renders the biome progress */
        this.biomeProgress = false;
        /** Renders the biome requirements */
        this.biomeRequirements = false;
        /** Renders the building efficiency in biomes */
        this.buildingEfficiency = false;
        /** Renders the current buildingprovides in biomes */
        this.buildingCurrentProvides = false;
        /** Renders the current total building resource generation in biomes */
        this.buildingResourceGeneration = false;
        /** Renders the build available icon in the biome select buttons */
        this.buildAvailable = false;
        /** Renders the time till the next passive tick */
        this.updateTimer = false;
        /** Renders the season name and media */
        this.updateSeason = false;
        /** Renders the building names */
        this.buildingNames = false;
        /** Updates the task ready icon */
        this.taskReadyIcon = false;
        /** Updates Town Summary for current biome */
        this.townSummary = false;
        /** Updates building modifier text */
        this.buildingModifiers = false;
        /** Updates next Abyssal Wave size */
        this.abyssalWaveSize = false;
        /** Updates next Fight Abyssal Wave button */
        this.fightAbyssalWave = false;
    }
}
class TownshipBuildingCountChangedEvent extends GameEvent {
    constructor(building, biome) {
        super();
        this.building = building;
        this.biome = biome;
    }
}
class Township extends Skill {
    constructor(namespace, game) {
        super(namespace, 'Township', game);
        this._media = "assets/media/skills/township/township.png" /* Assets.Township */ ;
        /** Tick length in seconds */
        this.TICK_LENGTH = 300;
        this.PASSIVE_TICK_LENGTH = 3600;
        this.LEGACY_TICK_LENGTH = 300;
        this.BASE_TAX_RATE = 0;
        this.BASE_STORAGE = 50000;
        this.BASE_SOUL_STORAGE = 0;
        this.WORSHIP_CHECKPOINTS = [5, 25, 50, 85, 95];
        this.MAX_WORSHIP = 2000;
        this.DECREASED_BUILDING_COST_CAP = -80;
        this.GP_PER_CITIZEN = 15;
        this.WORSHIP_CHANGE_COST = 50000000;
        this.RARE_SEASON_CHANCE = 20;
        this.ABYSSAL_WAVE_REWARD_DIVIDER = 1;
        this.BASE_MAX_HEALTH = 100;
        /** The cooldown time between fighting abyssal waves in [ms] */
        this.ABYSSAL_WAVE_COOLDOWN = 2000;
        this.populationForTier = {
            1: {
                population: 0,
                level: 1
            },
            2: {
                population: 0,
                level: 15
            },
            3: {
                population: 2500,
                level: 35
            },
            4: {
                population: 15000,
                level: 60
            },
            5: {
                population: 40000,
                level: 80
            },
            6: {
                population: 80000,
                level: 100
            },
            7: {
                population: 175000,
                level: 110
            },
            8: {
                population: 80000,
                level: 99
            },
        };
        this.abyssalTierRequirements = {
            0: {
                fortification: 0,
                abyssalLevel: 0
            },
            1: {
                fortification: 0,
                abyssalLevel: 1
            },
            2: {
                fortification: 0,
                abyssalLevel: 10
            },
            3: {
                fortification: 2.5,
                abyssalLevel: 20
            },
            4: {
                fortification: 7.5,
                abyssalLevel: 30
            },
            5: {
                fortification: 30,
                abyssalLevel: 40
            },
            6: {
                fortification: 70,
                abyssalLevel: 50
            },
            7: {
                fortification: 120,
                abyssalLevel: 60
            },
        };
        this.renderQueue = new TownshipRenderQueue();
        this.totalTicks = 0;
        this.convertQty = 1;
        this.convertQtyPercent = 50;
        this.convertQtyType = 1 /* TownshipConvertQtyType.Percent */ ; //number, percent or allbutone
        this.convertType = 1 /* TownshipConvertType.FromTownship */ ; //to or from township
        this.convertValues = {
            numbers: [10, 100, 1000, 10000, 100000],
            percentages: [1, 5, 10, 25, 50, 75, 90, 100],
        };
        this.itemConversions = {
            toTownship: new Map(),
            fromTownship: new Map(),
        };
        /** Number of legacy ticks the player has left to spend */
        this.legacyTicks = 0;
        this.upgradeQty = 1;
        this.tasks = new TownshipTasks(this.game);
        this.casualTasks = new TownshipCasualTasks(this.game);
        this.biomes = new NamespaceRegistry(this.game.registeredNamespaces, TownshipBiome.name);
        this.buildings = new NamespaceRegistry(this.game.registeredNamespaces, TownshipBuilding.name);
        this.worships = new NamespaceRegistry(this.game.registeredNamespaces, TownshipWorship.name);
        this.seasons = new NamespaceRegistry(this.game.registeredNamespaces, TownshipSeason.name);
        this.resources = new NamespaceRegistry(this.game.registeredNamespaces, TownshipResource.name);
        this.buildingDisplayOrder = new NamespacedArray(this.buildings);
        this.resourceDisplayOrder = new NamespacedArray(this.resources);
        this.townshipConverted = true;
        this.REDUCE_EFFICIENCY_CHANGE = 0.25;
        this.MINIMUM_HEALTH = 20;
        this.displayReworkNotification = false;
        this.gpRefunded = 0;
        this.tickTimer = new Timer('Skill', this.onTickTimer.bind(this));
        this.abyssalWaveTimer = new Timer('Skill', this.onAbyssalWaveTimer.bind(this));
        this.noWorship = new TownshipWorship(namespace, {
            id: 'None',
            get name() {
                return getLangString('MENU_TEXT_NONE');
            },
            description: '',
            media: TODO_REPLACE_MEDIA,
            modifiers: {},
            isHidden: false,
            checkpoints: [{}, {}, {}, {}, {}],
            unlockRequirements: [],
            get statueName() {
                return 'Statue_of_Nothing';
            },
            statueMedia: 'assets/media/skills/township/Statue_of_Nothing.png',
            seasonMultiplier: [],
        }, this.game);
        this.worships.registerObject(this.noWorship);
        this.townData = new TownshipData(this, this.game);
        this.currentTownBiome = this.biomes.getObjectByID("melvorF:Grasslands" /* TownshipBiomeIDs.Grasslands */ );
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    get abyssalGatewayBuilt() {
        const abyssalGateway = this.buildings.getObjectByID('melvorItA:Abyssal_Gateway');
        return abyssalGateway !== undefined && this.countNumberOfBuildings(abyssalGateway) > 0;
    }
    get canFightAbyssalWaves() {
        return cloudManager.hasItAEntitlementAndIsEnabled && this.hasAbyssalLevels && this.abyssalGatewayBuilt;
    }
    /** Returns if an abyssal wave is currently being fought */
    get isFightingAbyssalWave() {
        return this.abyssalWaveTimer.isActive;
    }
    get timeToNextUpdate() {
        return this.tickTimer.ticksLeft * TICK_INTERVAL;
    }
    get timeToNextSeason() {
        return (this.tickTimer.ticksLeft * TICK_INTERVAL +
            (this.townData.seasonTicksRemaining - 1) * this.tickTimer.maxTicks * TICK_INTERVAL);
    }
    get timeToNextAbyssalWave() {
        return (this.tickTimer.ticksLeft * TICK_INTERVAL +
            (this.townData.abyssalWaveTicksRemaining - 1) * this.tickTimer.maxTicks * TICK_INTERVAL);
    }
    get abyssalWaveSize() {
        return this.canFightAbyssalWaves ? this.abyssalLevel * 10000 : 0;
    }
    get soulsReward() {
        return Math.floor(this.abyssalWaveSize / this.ABYSSAL_WAVE_REWARD_DIVIDER);
    }
    get canWinAbyssalWave() {
        const totalArmourWeapon = this.getModifiedArmourWeaponryValueForAbyssalWave();
        const requiredForWave = this.abyssalWaveSize;
        const difference = totalArmourWeapon - requiredForWave;
        return difference >= 0;
    }
    get oneDayInTicks() {
        return 86400 / this.TICK_LENGTH;
    }
    get chanceForPet() {
        return 1 / (this.oneDayInTicks * 5); //1 in 5 day chance
    }
    get statueName() {
        return this.townData.worship.statueName;
    }
    get statueMedia() {
        return this.townData.worship.statueMedia;
    }
    /** The base rate of xp gained per tick, before modifiers */
    get baseXPRate() {
        return this.currentPopulation;
    }
    get currentPopulation() {
        return applyModifier(this.townData.population, this.townData.health, 3);
    }
    get currentFortification() {
        return Math.max(0, applyModifier(this.townData.fortification, this.townData.health, 4));
    }
    get currentEducation() {
        return this.townData.education;
    }
    get currentHappiness() {
        return this.townData.happiness;
    }
    get nightfallSeasonEnabled() {
        return this.game.modifiers.enableNightfallSeason > 0;
    }
    get solarEclipseSeasonEnabled() {
        return this.game.modifiers.enableSolarEclipseSeason > 0;
    }
    get lemonSeasonEnabled() {
        return this.game.modifiers.enableLemonSeason > 0;
    }
    get eternalDarknessSeasonEnabled() {
        return this.game.modifiers.enableEternalDarknessSeason > 0;
    }
    shouldShowSkillInSidebar() {
        return (super.shouldShowSkillInSidebar() ||
            this.biomes.some((biome) => biome.realm === this.game.currentRealm) ||
            this.buildings.some((building) => building.realm === this.game.currentRealm));
    }
    // (Weapon + Armour) * (1 + Fortification%) * Health%
    getModifiedArmourWeaponryValueForAbyssalWave() {
        let value = this.getTotalArmourWeaponry();
        value = applyModifier(value, this.townData.health, 3);
        return value;
    }
    getTotalArmourWeaponry() {
        const armourWeaponry = this.resources.getObjectByID('melvorItA:ArmourWeaponry');
        if (armourWeaponry === undefined)
            throw new Error(`Error getting ${TownshipResource.name} with ID: melvorItA:ArmourWeaponry`);
        return armourWeaponry.amount;
    }
    /** Callback function for the Repair All in this Biome button */
    repairAllBuildingsInCurrentBiome() {
        const biome = this.currentTownBiome;
        if (biome === undefined)
            return;
        const costs = this.getTotalRepairCostInBiome(biome);
        if (this.canAffordRepairAllCosts(costs)) {
            biome.buildingsBuilt.forEach((_, building) => {
                const wasRepaired = biome.setBuildingEfficiency(building, 100);
                if (wasRepaired)
                    this.rollForAncientRelics(this.level, this.game.defaultRealm);
            });
            this.subtractRepairAllCosts(costs);
            this.onRepairAllBuildings();
        }
    }
    /** Callback function for the Repair All button for specific storage types only */
    repairAllBuildingsFromStorageType(storageType) {
        const costs = this.getTotalRepairCostForStorage(storageType);
        if (this.canAffordRepairAllCosts(costs)) {
            this.biomes.forEach((biome) => {
                biome.buildingsBuilt.forEach((_, building) => {
                    if (!this.getBuildingCostsForBiome(building, biome).every(({
                            resource
                        }) => resource.storageType === storageType || resource.type === TownshipResourceTypeID.Currency))
                        return;
                    const wasRepaired = biome.setBuildingEfficiency(building, 100);
                    if (wasRepaired)
                        this.rollForAncientRelics(this.level, this.game.defaultRealm);
                });
            });
            this.subtractRepairAllCosts(costs);
            this.onRepairAllBuildings();
        }
    }
    /** Callback function for the Repair All button */
    repairAllBuildings() {
        const costs = this.getTotalRepairCosts();
        if (this.canAffordRepairAllCosts(costs)) {
            this.biomes.forEach((biome) => {
                biome.buildingsBuilt.forEach((_, building) => {
                    const wasRepaired = biome.setBuildingEfficiency(building, 100);
                    if (wasRepaired)
                        this.rollForAncientRelics(this.level, this.game.defaultRealm);
                });
            });
            this.subtractRepairAllCosts(costs);
            this.onRepairAllBuildings();
        }
    }
    onRepairAllBuildings() {
        this.updateAllBuildingProvidedStatsMultiplier();
        this.computeTownStats();
        this.setTownBiome(this.currentTownBiome);
        this.computeProvidedStats();
        this.onBuildingChange();
        this.renderQueue.resourceAmounts = true;
        this.renderQueue.resourceRates = true;
        this.renderQueue.townStats = true;
        this.renderQueue.townSummary = true;
        this.renderQueue.buildingModifiers = true;
    }
    getBuildingEfficiencyInBiome(building, biome) {
        if (biome === undefined)
            return 100;
        return biome === null || biome === void 0 ? void 0 : biome.getBuildingEfficiency(building);
    }
    reduceAllBuildingEfficiency(amount) {
        this.biomes.forEach((biome) => {
            biome.buildingsBuilt.forEach((_, b) => {
                if (!this.hasBuildingBeenUpgraded(b, biome) && Math.random() < this.REDUCE_EFFICIENCY_CHANGE && b.canDegrade)
                    biome.reduceBuildingEfficiency(b, amount, this.game);
            });
        });
        this.renderQueue.buildingEfficiency = true;
    }
    reduceAllAbyssalBuildingEfficiency(amount) {
        this.biomes.forEach((biome) => {
            biome.buildingsBuilt.forEach((_, b) => {
                if (b.namespace !== "melvorItA" /* Namespaces.IntoTheAbyss */ )
                    return;
                if (!this.hasBuildingBeenUpgraded(b, biome) && Math.random() < this.REDUCE_EFFICIENCY_CHANGE && b.canDegrade)
                    biome.reduceBuildingEfficiency(b, amount, this.game);
            });
        });
        this.renderQueue.buildingEfficiency = true;
    }
    getBiomeProgress(biome) {
        const buildings = this.buildingDisplayOrder.filter((b) => b.biomes.includes(biome));
        let count = 0;
        let total = 0;
        buildings.forEach((b) => {
            count += biome.getBuildingCount(b);
            total += b.maxUpgrades;
        });
        return (count / total) * 100;
    }
    getBasePopulationProvidesForBiome(building, biome) {
        if (biome === undefined)
            return 0;
        const provides = building.provides.get(biome);
        if (!provides)
            return 0;
        return provides.population;
    }
    getBaseEducationProvidesForBiome(building, biome) {
        if (biome === undefined)
            return 0;
        const provides = building.provides.get(biome);
        if (!provides)
            return 0;
        return provides.education;
    }
    getBaseHappinessProvidesForBiome(building, biome) {
        if (biome === undefined)
            return 0;
        const provides = building.provides.get(biome);
        if (!provides)
            return 0;
        return provides.happiness;
    }
    getBaseWorshipProvidesForBiome(building, biome) {
        if (biome === undefined)
            return 0;
        const provides = building.provides.get(biome);
        if (!provides)
            return 0;
        return provides.worship === undefined ? 0 : provides.worship;
    }
    getBaseStorageProvidesForBiome(building, biome) {
        if (biome === undefined)
            return 0;
        const provides = building.provides.get(biome);
        if (!provides)
            return 0;
        return provides.storage;
    }
    getBaseFortificationProvidesForBiome(building, biome) {
        if (biome === undefined)
            return 0;
        const provides = building.provides.get(biome);
        if (!provides)
            return 0;
        return provides.fortification;
    }
    getBaseSoulStorageProvidesForBiome(building, biome) {
        if (biome === undefined)
            return 0;
        const provides = building.provides.get(biome);
        if (!provides)
            return 0;
        return provides.soulStorage;
    }
    getPopulationProvidesForBiome(building, biome) {
        return applyModifier(this.getBasePopulationProvidesForBiome(building, biome), this.getBuildingEfficiencyInBiome(biome.getCurrentBuildingInUpgradeChain(building), biome), 4);
    }
    getEducationProvidesForBiome(building, biome) {
        return applyModifier(this.getBaseEducationProvidesForBiome(building, biome), this.getBuildingEfficiencyInBiome(biome.getCurrentBuildingInUpgradeChain(building), biome), 4);
    }
    getHappinessProvidesForBiome(building, biome) {
        return applyModifier(this.getBaseHappinessProvidesForBiome(building, biome), this.getBuildingEfficiencyInBiome(biome.getCurrentBuildingInUpgradeChain(building), biome), 4);
    }
    getWorshipProvidesForBiome(building, biome) {
        return applyModifier(this.getBaseWorshipProvidesForBiome(building, biome), this.getBuildingEfficiencyInBiome(biome.getCurrentBuildingInUpgradeChain(building), biome), 4);
    }
    getStorageProvidesForBiome(building, biome) {
        return applyModifier(this.getBaseStorageProvidesForBiome(building, biome), this.getBuildingEfficiencyInBiome(biome.getCurrentBuildingInUpgradeChain(building), biome), 4);
    }
    getFortificationProvidesForBiome(building, biome) {
        return applyModifier(this.getBaseFortificationProvidesForBiome(building, biome), this.getBuildingEfficiencyInBiome(biome.getCurrentBuildingInUpgradeChain(building), biome), 4);
    }
    getSoulStorageProvidesForBiome(building, biome) {
        return applyModifier(this.getBaseSoulStorageProvidesForBiome(building, biome), this.getBuildingEfficiencyInBiome(biome.getCurrentBuildingInUpgradeChain(building), biome), 4);
    }
    getProvidesForBiome(building, biome) {
        if (biome === undefined)
            return;
        const provides = building.provides.get(biome);
        return provides;
    }
    get currentWorshipName() {
        return this.townData.worship.name;
    }
    get worshipPercent() {
        return (this.townData.worshipCount / this.MAX_WORSHIP) * 100;
    }
    /** Returns the current tier of worship that is active. -1 Indicates none are active */
    get worshipTier() {
        const currentPercent = this.worshipPercent;
        let tier = this.WORSHIP_CHECKPOINTS.findIndex((checkpoint) => currentPercent < checkpoint);
        if (tier === -1)
            tier = this.WORSHIP_CHECKPOINTS.length;
        return tier - 1;
    }
    get taxRate() {
        const baseRate = this.BASE_TAX_RATE;
        const modifier = this.game.modifiers.townshipTaxPerCitizen;
        return Math.min(baseRate + modifier, 80);
    }
    get canAffordWorshipChange() {
        return this.game.gp.canAfford(this.WORSHIP_CHANGE_COST);
    }
    get isStorageFull() {
        return this.getUsedStorage() >= this.getMaxStorage() * 0.98;
    }
    get isSoulStorageFull() {
        return this.getUsedSoulStorage() >= this.getMaxSoulStorage() * 0.98;
    }
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.renderQueue.buildAvailable = true;
    }
    registerData(namespace, data) {
        var _a, _b, _c, _d, _e, _f, _g;
        super.registerData(namespace, data);
        (_a = data.biomes) === null || _a === void 0 ? void 0 : _a.forEach((biomeData) => {
            this.biomes.registerObject(new TownshipBiome(namespace, biomeData, this.game));
        });
        (_b = data.resources) === null || _b === void 0 ? void 0 : _b.forEach((resourceData) => {
            this.resources.registerObject(new TownshipResource(namespace, resourceData, this.game));
        });
        (_c = data.buildings) === null || _c === void 0 ? void 0 : _c.forEach((buildingData) => {
            this.buildings.registerObject(new TownshipBuilding(namespace, buildingData, this.game));
        });
        (_d = data.seasons) === null || _d === void 0 ? void 0 : _d.forEach((seasonData) => {
            this.seasons.registerObject(new TownshipSeason(namespace, seasonData, this.game));
        });
        (_e = data.worships) === null || _e === void 0 ? void 0 : _e.forEach((buildingData) => {
            this.worships.registerObject(new TownshipWorship(namespace, buildingData, this.game));
        });
        (_f = data.itemConversions) === null || _f === void 0 ? void 0 : _f.toTownship.forEach((conversionData) => {
            const resource = this.resources.getObjectByID(conversionData.resourceID);
            if (resource === undefined)
                throw new Error(`Error registering item conversion. ${TownshipResource.name} with id: ${conversionData.resourceID} is not registered.`);
            const items = conversionData.items.map((itemsData) => {
                return new TownshipItemConversion(itemsData, this.game);
            });
            const existing = this.itemConversions.toTownship.get(resource);
            if (existing === undefined)
                this.itemConversions.toTownship.set(resource, items);
            else
                existing.push(...items);
        });
        (_g = data.itemConversions) === null || _g === void 0 ? void 0 : _g.fromTownship.forEach((conversionData) => {
            const resource = this.resources.getObjectByID(conversionData.resourceID);
            if (resource === undefined)
                throw new Error(`Error registering item conversion. ${TownshipResource.name} with id: ${conversionData.resourceID} is not registered.`);
            const items = conversionData.items.map((itemsData) => {
                return new TownshipItemConversion(itemsData, this.game);
            });
            const existing = this.itemConversions.fromTownship.get(resource);
            if (existing === undefined)
                this.itemConversions.fromTownship.set(resource, items);
            else
                existing.push(...items);
        });
        if (data.buildingDisplayOrder !== undefined)
            this.buildingDisplayOrder.registerData(data.buildingDisplayOrder);
        if (data.resourceDisplayOrder !== undefined)
            this.resourceDisplayOrder.registerData(data.resourceDisplayOrder);
        if (data.taskCategories !== undefined)
            this.tasks.registerCategories(namespace, data.taskCategories);
        if (data.tasks !== undefined)
            this.tasks.registerTasks(namespace, data.tasks);
        if (data.casualTasks !== undefined)
            this.casualTasks.registerTasks(namespace, data.casualTasks);
    }
    modifyData(data) {
        var _a;
        super.modifyData(data);
        (_a = data.seasons) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const season = this.seasons.getObjectByID(modData.id);
            if (season === undefined)
                throw new UnregisteredDataModError(TownshipSeason.name, modData.id);
            season.applyDataModification(modData, this.game);
        });
    }
    getResourceQuantityFromData(resourceData) {
        return resourceData.map(({
            id,
            quantity
        }) => {
            const resource = this.resources.getObjectByID(id);
            if (resource === undefined)
                throw new Error(`Error getting resource quantity. ${TownshipResource.name} with id: ${id} is not registered.`);
            return {
                resource,
                quantity
            };
        });
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.buildings.forEach((building) => {
            if (building.upgradesFrom !== undefined) {
                if (building.upgradesFrom.upgradesTo !== undefined)
                    throw new Error(`Building: ${building.upgradesFrom.id} has multiple upgrade paths`);
                building.upgradesFrom.upgradesTo = building;
            }
        });
        this.buildings.forEach((building) => {
            building.calculateUpgradeData();
            building.biomes.forEach((biome) => biome.availableBuildings.push(building));
        });
        this.defaultSeason = this.seasons.getObjectByID("melvorF:Spring" /* TownshipSeasonIDs.Spring */ );
        if (this.townData.season === undefined)
            this.townData.season = this.seasons.getObjectByID("melvorF:Spring" /* TownshipSeasonIDs.Spring */ );
        if (this.townData.previousSeason === undefined)
            this.townData.previousSeason = this.seasons.getObjectByID("melvorF:Winter" /* TownshipSeasonIDs.Winter */ );
        this.tasks.postDataRegistration();
    }
    getRegistry(type) {
        switch (type) {
            case ScopeSourceType.Category:
                return this.biomes;
            case ScopeSourceType.Action:
                return this.resources;
            case ScopeSourceType.Subcategory:
                return this.buildings;
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
                    return skillData.biomes;
                case ScopeSourceType.Action:
                    return skillData.resources;
                case ScopeSourceType.Subcategory:
                    return skillData.buildings;
            }
        }
    }
    getBuildingCountRemainingForLevelUp(building, biome) {
        return building.maxUpgrades - biome.getBuildingCount(building);
    }
    isBuildingAvailable(building, biome) {
        if (building.upgradesFrom === undefined)
            return true;
        return this.isBuildingMaxed(building.upgradesFrom, biome);
    }
    hasBuildingBeenUpgraded(building, biome) {
        return building.upgradesTo !== undefined && this.isBuildingMaxed(building, biome);
    }
    isBuildingUpgradedButNotBuiltd(building, biome) {
        return building.upgradesFrom !== undefined && (biome === null || biome === void 0 ? void 0 : biome.getBuildingCount(building)) === 0;
    }
    isBuildingMaxed(building, biome) {
        if (biome === undefined)
            return false;
        return biome.getBuildingCount(building) >= building.maxUpgrades;
    }
    getIncreaseHealthCost(resource) {
        return Math.max(Math.floor(resource.generation / 10), 1);
    }
    get maxHealth() {
        return this.BASE_MAX_HEALTH + this.game.modifiers.townshipHealth;
    }
    /**
     * Callback function for when an increase health button is clicked
     * @param resource The resource to spend to increase health
     * @param amount The amount of the resource to use
     */
    increaseHealth(resource, amount) {
        amount = Math.min(this.townData.health + amount, this.maxHealth) - this.townData.health;
        const resourceCost = this.getIncreaseHealthCost(resource);
        let resourceQty = amount * resourceCost;
        if (resource.amount < resourceQty) {
            amount = Math.floor(resource.amount / resourceCost);
            resourceQty = amount * resourceCost;
        }
        resource.amount -= resourceQty;
        this.townData.health += amount;
        this.townData.health = Math.min(this.townData.health, this.maxHealth);
        this.computeTownResourceGain();
        this.renderQueue.resourceAmounts = true;
        this.renderQueue.resourceRates = true;
        this.renderQueue.townStats = true;
        this.renderQueue.townSummary = true;
        this.renderQueue.biomeRequirements = true;
        this.renderQueue.abyssalWaveSize = true;
    }
    convertOldTownshipToNew() {
        if (this.townshipConverted)
            return;
        this.biomes.forEach((biome) => {
            this.buildings.forEach((building) => {
                if (building.biomes.includes(biome) && building.id !== "melvorF:Town_Hall" /* TownshipBuildingIDs.Town_Hall */ ) {
                    if (this.level >= 120)
                        biome.addBuildings(building, building.maxUpgrades);
                    else if (this.level >= 110 && building.tier < 7)
                        biome.addBuildings(building, building.maxUpgrades);
                    else if (this.level >= 100 && building.tier < 6)
                        biome.addBuildings(building, building.maxUpgrades);
                    else if (this.level >= 80 && building.tier < 5)
                        biome.addBuildings(building, building.maxUpgrades);
                    else if (this.level >= 60 && building.tier < 4)
                        biome.addBuildings(building, building.maxUpgrades);
                    else if (this.level >= 35 && building.tier < 3)
                        biome.addBuildings(building, building.maxUpgrades);
                    else if (this.level >= 15 && building.tier < 2)
                        biome.addBuildings(building, building.maxUpgrades);
                }
            });
        });
        this.addStartingBuildings();
        //refund GP for slots purchased
        this.gpRefunded = 0;
        for (let i = 0; i < this.townData.sectionsPurchased; i++) {
            this.gpRefunded += Math.floor(Math.pow(15, 0.0100661358978 * ((i + 1) / 32) + Math.pow((i + 1) / 32, 0.42)));
        }
        this.game.gp.add(this.gpRefunded);
        this.townData.sectionsPurchased = 0;
        this.townshipConverted = true;
        this.displayReworkNotification = true;
        townshipUI.updateReworkNotification();
    }
    getErrorLog() {
        return `TODO: Implement Township Error Logging`;
    }
    encodeResource(writer, resource) {
        writer.writeNamespacedObject(resource);
        writer.writeFloat64(resource.amount);
        writer.writeUint8(resource.cap);
    }
    encodeBiome(writer, biome) {
        writer.writeNamespacedObject(biome);
        writer.writeMap(biome.buildingsBuilt, writeNamespaced, (count, writer) => writer.writeUint32(count));
        writer.writeMap(biome.buildingEfficiency, writeNamespaced, (count, writer) => writer.writeUint32(count));
    }
    encode(writer) {
        super.encode(writer);
        this.townData.encode(writer);
        writer.writeArray(this.resources.allObjects, (resource, writer) => this.encodeResource(writer, resource));
        writer.writeUint32(this.resources.dummySize);
        this.resources.forEachDummy((resource) => this.encodeResource(writer, resource));
        writer.writeArray(this.biomes.allObjects, (biome, writer) => this.encodeBiome(writer, biome));
        writer.writeUint32(this.biomes.dummySize);
        this.biomes.forEachDummy((biome) => this.encodeBiome(writer, biome));
        writer.writeUint32(this.legacyTicks);
        writer.writeUint32(this.totalTicks);
        writer.writeSet(this.tasks.completedTasks, writeNamespaced);
        writer.writeBoolean(this.townshipConverted);
        this.casualTasks.encode(writer);
        this.tickTimer.encode(writer);
        writer.writeBoolean(this.displayReworkNotification);
        writer.writeFloat64(this.gpRefunded);
        this.abyssalWaveTimer.encode(writer);
        return writer;
    }
    decodeResource(reader, version) {
        const resource = reader.getNamespacedObject(this.resources);
        const amount = reader.getFloat64();
        if (typeof resource !== 'string') {
            resource.amount = amount;
        } else if (resource.startsWith('melvor')) {
            const dummyResource = this.resources.getDummyObject(resource, DummyTownshipResource, this.game);
            dummyResource.amount = amount;
        }
        if (version > 34) {
            const cap = reader.getUint8();
            if (typeof resource !== 'string') {
                resource.cap = cap;
            } else if (resource.startsWith('melvor')) {
                const dummyResource = this.resources.getDummyObject(resource, DummyTownshipResource, this.game);
                dummyResource.cap = cap;
            }
        }
    }
    decodeBiome(reader, version) {
        const biome = reader.getNamespacedObject(this.biomes);
        const buildingsBuilt = reader.getMap((reader) => {
            const building = reader.getNamespacedObject(this.buildings);
            if (typeof building !== 'string')
                return building;
            else if (building.startsWith('melvor')) {
                return this.buildings.getDummyObject(building, DummyTownshipBuilding, this.game);
            } else {
                return undefined;
            }
        }, (reader) => reader.getUint32());
        if (version < 42)
            reader.skipBytes(12); // Dump old data for map sections
        let buildingEfficiency = new Map();
        if (version >= 40) {
            buildingEfficiency = reader.getMap((reader) => {
                const building = reader.getNamespacedObject(this.buildings);
                if (typeof building !== 'string')
                    return building;
                else if (building.startsWith('melvor')) {
                    return this.buildings.getDummyObject(building, DummyTownshipBuilding, this.game);
                } else {
                    return undefined;
                }
            }, (reader) => reader.getUint32());
            if (typeof biome !== 'string') {
                biome.buildingsBuilt = buildingsBuilt;
                biome.buildingEfficiency = buildingEfficiency;
            } else if (biome.startsWith('melvor')) {
                const dummyBiome = this.biomes.getDummyObject(biome, DummyTownshipBiome, this.game);
                dummyBiome.buildingsBuilt = buildingsBuilt;
                dummyBiome.buildingEfficiency = buildingEfficiency;
            }
        }
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.townData.decode(reader, version);
        if (version < 42) {
            reader.skipArrayBytes(7); // Dumps old citizen data
        }
        reader.getArray((reader) => {
            this.decodeResource(reader, version);
        });
        const numDummyResources = reader.getUint32();
        for (let i = 0; i < numDummyResources; i++) {
            this.decodeResource(reader, version);
        }
        if (version < 42) {
            reader.skipArrayBytes(6); // Dumps old Job data
        }
        reader.getArray((reader) => {
            this.decodeBiome(reader, version);
        });
        const numDummyBiomes = reader.getUint32();
        for (let i = 0; i < numDummyBiomes; i++) {
            this.decodeBiome(reader, version);
        }
        if (version < 47)
            reader.getUint32(); // Dump old buildQty property
        this.legacyTicks = reader.getUint32();
        if (version < 26)
            this.legacyTicks = Math.ceil(this.legacyTicks / 36);
        this.totalTicks = reader.getUint32();
        if (version < 26)
            this.totalTicks /= 36;
        if (version < 43)
            this.totalTicks /= 12;
        if (version < 43)
            reader.getFloat64();
        if (version > 28)
            this.tasks.completedTasks = reader.getSet((reader) => {
                const task = reader.getNamespacedObject(this.tasks.tasks);
                if (typeof task !== 'string')
                    return task;
                else if (task.startsWith('melvor')) {
                    return this.tasks.tasks.getDummyObject(task, DummyTownshipTask, this.game);
                }
                return undefined;
            });
        if (version >= 37 && version < 43)
            reader.getFloat64();
        if (version >= 38 && version < 43)
            reader.getBoolean();
        if (version < 41)
            this.townshipConverted = false;
        if (version >= 41) {
            this.townshipConverted = reader.getBoolean();
            this.casualTasks.decode(reader, version);
        }
        if (version >= 43)
            this.tickTimer.decode(reader, version);
        if (version > 45) {
            this.displayReworkNotification = reader.getBoolean();
            this.gpRefunded = reader.getFloat64();
        }
        if (version >= 121 /* SaveVersion.AbyssalWaveTimer */ ) {
            this.abyssalWaveTimer.decode(reader, version);
        }
    }
    deserialize(reader, version, idMap) {
        const getBiome = (oldID) => {
            const biome = this.biomes.getObjectByID(idMap.townshipBiomes[oldID]);
            if (biome === undefined)
                throw new Error('Error converting save. Biome is not registered.');
            return biome;
        };
        if (version >= 20) {
            this.deserializeTownData(reader.getVariableLengthChunk(), version, idMap);
            reader.getVariableLengthChunk(); // Dump old citizen data
            // TODO rewrite variable names
            const biomeCount = reader.getNumber();
            for (let i = 0; i < biomeCount; i++) {
                const biomeID = reader.getNumber();
                const buildingDataMap = reader.getTownshipBuildingDataMap(this.game, idMap);
                getBiome(biomeID).buildingsBuilt = buildingDataMap;
            }
            // Dump totalInMap for biomes
            const biomeCount2 = reader.getNumber();
            reader.getChunk(biomeCount2 * 2);
            // Dump availableInMap for biomes
            const biomeCount3 = reader.getNumber();
            reader.getChunk(biomeCount3 * 2);
            // Dump amountPurchased for biomes
            const biomeCount4 = reader.getNumber();
            reader.getChunk(biomeCount4 * 2);
            reader.getNumber(); // Dump buildQty property
            this.legacyTicks = reader.getNumber();
            this.totalTicks = reader.getNumber();
        }
        if (version >= 21)
            reader.getNumber();
    }
    deserializeTownData(reader, version, idMap) {
        reader.getNumber(); // Old Dead Property
        reader.getNumber(); // Dead Storage can be recalculated on load
        reader.getNumber(); // Education, can be recalculated on load
        reader.getNumber(); // Happiness, can be recalculated on load
        reader.getNumber(); // Old Population property
        reader.getString(); // Old Priority Job
        this.townData.sectionsPurchased = reader.getNumber();
        reader.getNumber(); // Old currentBuildBiome
        reader.getNumber(); // Storage, can be recalculated on load
        this.townData.townCreated = reader.getBool();
        const worshipID = reader.getNumber();
        const worship = this.worships.getObjectByID(idMap.townshipWorships[worshipID]);
        if (worship !== undefined)
            this.townData.worship = worship;
        reader.getNumber(); // WorshipCount, can be recalculated on load
        reader.getNumber(); // Old xp property
        reader.getVariableLengthChunk(); // Resource Generation, can be recalculated on load
        this.deserializeTownDataResources(reader.getVariableLengthChunk(), version, idMap);
        reader.getChunk(12); // Dump old data for jobs
    }
    deserializeTownDataResources(reader, version, idMap) {
        for (let i = 0; i < 13; i++) {
            const amount = reader.getNumber();
            const resource = this.resources.getObjectByID(idMap.townshipResourceDecode[i]);
            if (resource !== undefined)
                resource.amount = amount;
        }
    }
    /** Queues renders when resources change */
    onResourceAmountChange() {
        this.renderQueue.resourceAmounts = true;
        this.renderQueue.buildingCosts = true;
        this.renderQueue.buildAvailable = true;
        this.renderQueue.abyssalWaveSize = true;
    }
    /** Queues renders when buildings change */
    onBuildingChange() {
        this.renderQueue.biomeProgress = true;
        this.renderQueue.biomeRequirements = true;
        this.renderQueue.buildingCosts = true;
        this.renderQueue.buildingEfficiency = true;
        this.renderQueue.buildingCurrentProvides = true;
        this.renderQueue.buildingResourceGeneration = true;
        this.renderQueue.abyssalWaveSize = true;
        this.renderQueue.fightAbyssalWave = true;
    }
    renderTownStats() {
        if (!this.renderQueue.townStats)
            return;
        townshipUI.updateTownStats();
        this.renderQueue.townStats = false;
    }
    renderResourceAmounts() {
        if (!this.renderQueue.resourceAmounts)
            return;
        townshipUI.updateResourceAmounts();
        this.renderQueue.resourceAmounts = false;
    }
    renderResourceRates() {
        if (!this.renderQueue.resourceRates)
            return;
        townshipUI.updateResourceTickBreakdown();
        townshipUI.updateIncreaseHealthBtns();
        this.renderQueue.resourceRates = false;
    }
    renderBuildingCosts() {
        if (!this.renderQueue.buildingCosts)
            return;
        townshipUI.updateAllBuildingUpgradeCosts();
        townshipUI.updateRepairAllCostHTML();
        this.renderQueue.buildingCosts = false;
    }
    renderBuildingNames() {
        if (!this.renderQueue.buildingNames)
            return;
        townshipUI.updateAllBuildingNames();
        this.renderQueue.buildingNames = false;
    }
    renderTaskReadyIcon() {
        if (!this.renderQueue.taskReadyIcon)
            return;
        if (this.tasks.isAnyTaskReady || this.casualTasks.isAnyTaskReady) {
            townshipUI.showTaskReadyIcon();
        } else {
            townshipUI.hideTaskReadyIcon();
        }
        this.renderQueue.taskReadyIcon = false;
    }
    renderTownAge() {
        if (!this.renderQueue.townAge)
            return;
        townshipUI.updateTimeAlive();
        this.renderQueue.townAge = false;
    }
    renderBuildingProvides() {
        if (!this.renderQueue.buildingProvides)
            return;
        townshipUI.updateTownBuildingProvides();
        this.renderQueue.buildingProvides = false;
    }
    renderBiomeProgress() {
        if (!this.renderQueue.biomeProgress)
            return;
        townshipUI.updateAllBiomeProgress();
        this.renderQueue.biomeProgress = false;
    }
    renderBiomeRequirements() {
        if (!this.renderQueue.biomeRequirements)
            return;
        townshipUI.updateAllBiomeRequirements();
        this.renderQueue.biomeRequirements = false;
    }
    renderBuildingEfficiency() {
        if (!this.renderQueue.buildingEfficiency)
            return;
        townshipUI.updateAllBuildingEfficiency();
        this.renderQueue.buildingEfficiency = false;
    }
    renderBuildingCurrentProvides() {
        if (!this.renderQueue.buildingCurrentProvides)
            return;
        townshipUI.updateAllBuildingCurrentProvides();
        this.renderQueue.buildingCurrentProvides = false;
    }
    renderBuildingResourceGeneration() {
        if (!this.renderQueue.buildingResourceGeneration)
            return;
        townshipUI.updateAllBuildingCurrentResourceGeneration();
        this.renderQueue.buildingResourceGeneration = false;
    }
    renderBuildAvailable() {
        if (!this.renderQueue.buildAvailable)
            return;
        townshipUI.updateAllBuildAvailable();
        this.renderQueue.buildAvailable = false;
    }
    renderUpdateTime() {
        if (!this.renderQueue.updateTimer)
            return;
        townshipUI.updateTimeToNextUpdate();
        this.renderQueue.updateTimer = false;
    }
    renderUpdateSeason() {
        if (!this.renderQueue.updateSeason)
            return;
        townshipUI.updateSeason();
        this.renderQueue.updateSeason = false;
    }
    render() {
        super.render();
        this.renderTownStats();
        this.renderResourceAmounts();
        this.renderResourceRates();
        this.renderBuildingCosts();
        this.renderTownAge();
        this.renderBuildingProvides();
        this.renderBiomeProgress();
        this.renderBiomeRequirements();
        this.renderBuildingEfficiency();
        this.renderBuildingCurrentProvides();
        this.renderBuildingResourceGeneration();
        this.renderBuildAvailable();
        this.renderUpdateTime();
        this.renderUpdateSeason();
        this.renderBuildingNames();
        this.renderTaskReadyIcon();
        this.renderTownSummary();
        this.renderBuildingModifiers();
        this.renderNextAbyssalWaveSize();
        this.renderFightAbyssalWave();
        this.tasks.render();
        this.casualTasks.render();
    }
    renderNextAbyssalWaveSize() {
        if (!this.renderQueue.abyssalWaveSize)
            return;
        if (this.canFightAbyssalWaves) {
            townshipUI.updateNextAbyssalWaveSize();
        }
        this.renderQueue.abyssalWaveSize = false;
    }
    renderFightAbyssalWave() {
        if (!this.renderQueue.fightAbyssalWave)
            return;
        if (this.canFightAbyssalWaves) {
            townshipUI.updateAbyssalWaveUI();
        }
        this.renderQueue.fightAbyssalWave = false;
    }
    renderBuildingModifiers() {
        if (!this.renderQueue.buildingModifiers)
            return;
        townshipUI.updateAllBuildingTotalStatsElements();
        this.renderQueue.buildingModifiers = false;
    }
    renderTownSummary() {
        if (!this.renderQueue.townSummary)
            return;
        townshipUI.updateTownSummary();
        this.renderQueue.townSummary = false;
    }
    initTownCreation() {
        if (!cloudManager.hasFullVersionEntitlement)
            return; // No Full Version, No Township
        this.addStartingBuildings();
        townshipUI.createWorshipSelection();
        townshipUI.hideMainContainerDivs();
        townshipUI.showTownCreationDivs();
    }
    updateConvertType(type) {
        this.convertType = type;
        townshipUI.updateConvertQtyElements();
        townshipUI.updateConvertVisibility();
    }
    /** Callback method */
    confirmTownCreation() {
        var _a;
        this.confirmWorship();
        this.townData.townCreated = true;
        townshipUI.hideTownCreationDivs();
        townshipUI.showMainContainerDivs();
        (_a = document.getElementById('TOWNSHIP_ALERT_TUTORIAL')) === null || _a === void 0 ? void 0 : _a.classList.remove('d-none');
        this.onLoad();
        this.game.combat.computeAllStats();
        this.postStatLoad();
        this.startTickTimer();
    }
    getResourceItemConversionsToTownship(resource) {
        const conversions = this.itemConversions.toTownship.get(resource);
        return conversions !== undefined ? conversions : [];
    }
    getResourceItemConversionsFromTownship(resource) {
        const conversions = this.itemConversions.fromTownship.get(resource);
        return conversions !== undefined ? conversions : [];
    }
    selectWorship(worship) {
        this.worshipInSelection = worship;
        townshipUI.updateWorshipSelection();
    }
    confirmWorship() {
        if (this.worshipInSelection !== undefined)
            this.townData.worship = this.worshipInSelection;
        townshipUI.updateCurrentWorship();
        $('#modal-change-worship').modal('hide');
    }
    /** Callback function for the View Season Modifiers button */
    viewSeasonModifiers() {
        townshipUI.viewSeasonModifiers(this);
    }
    preLoad() {
        this.TICK_LENGTH = this.PASSIVE_TICK_LENGTH;
        this.convertOldTownshipToNew();
        this.removeDummyTownshipData();
        if (!this.tickTimer.isActive)
            this.startTickTimer();
        this.updateAllBuildingProvidedStatsMultiplier();
        this.computeBuildingTownStats();
        this.computeWorship();
        this.computeProvidedStats(false);
    }
    removeDummyTownshipData() {
        this.biomes.forEach((biome) => {
            biome.buildingsBuilt.forEach((_, building) => {
                if (building instanceof DummyTownshipBuilding)
                    biome.buildingsBuilt.delete(building);
            });
            biome.buildingEfficiency.forEach((_, building) => {
                if (building instanceof DummyTownshipBuilding)
                    biome.buildingsBuilt.delete(building);
            });
        });
    }
    postStatLoad() {
        if (!this.townData.townCreated)
            return;
        this.computeTownStats();
        townshipUI.loadTownshipUI();
        this.postLoad();
    }
    postLoad() {
        this.setTownBiome(this.biomes.getObjectByID("melvorF:Grasslands" /* TownshipBiomeIDs.Grasslands */ ));
        this.updateConvertType(1 /* TownshipConvertType.FromTownship */ );
        this.renderQueue.resourceAmounts = true;
        this.renderQueue.resourceRates = true;
        this.renderQueue.biomeProgress = true;
        this.renderQueue.biomeRequirements = true;
        this.renderQueue.buildingEfficiency = true;
        this.renderQueue.buildingCurrentProvides = true;
        this.renderQueue.buildingResourceGeneration = true;
        this.renderQueue.buildAvailable = true;
        this.renderQueue.abyssalWaveSize = true;
        this.renderQueue.townAge = true;
        this.renderQueue.taskReadyIcon = true;
    }
    onLoad() {
        super.onLoad();
        if (!this.townData.townCreated) {
            this.initTownCreation();
            return;
        }
        this.preLoad();
    }
    queueCurrencyQuantityRender(currency) {
        this.renderQueue.buildingCosts = true;
    }
    /** @deprecated This method will be removed in the next major update. Use renderModifierChange instead */
    onModifierChange() {
        this.renderQueue.buildingCosts = true;
        this.renderQueue.buildingProvides = true;
        this.computeTownStats(); // Should only trigger when this page is being viewed
    }
    onPageChange() {
        this.renderModifierChange();
        this.renderQueue.buildingCosts = true;
        this.renderQueue.biomeRequirements = true;
        this.renderQueue.townSummary = true;
        this.updateConvertType(this.convertType);
    }
    onAncientRelicUnlock() {
        super.onAncientRelicUnlock();
        this.computeProvidedStats(false);
        this.onBuildingChange();
        this.renderQueue.resourceAmounts = true;
        this.renderQueue.resourceRates = true;
        this.renderQueue.townStats = true;
    }
    renderModifierChange() {
        this.onModifierChange();
    }
    passiveTick() {
        this.tickTimer.tick();
        if (this.tickTimer.ticksLeft % TICKS_PER_SECOND === 0)
            this.renderQueue.updateTimer = true;
        this.casualTasks.tick();
        this.abyssalWaveTimer.tick();
    }
    /** Starts the tick timer at the passive tick interval */
    startTickTimer() {
        this.tickTimer.start(this.PASSIVE_TICK_LENGTH * 1000);
    }
    /** Method called each time the tick timer completes */
    onTickTimer() {
        this.tick();
        this.startTickTimer();
    }
    /** Method used to tick the timer manually based on defined amount. For Clicker gamemode. */
    tickTimerOnClick() {
        for (let i = 0; i < 4; i++)
            this.tickTimer.tick();
    }
    spendAllLegacyTicks() {
        this.spendLegacyTicks(this.legacyTicks);
    }
    spendLegacyTicks(ticksToSpend) {
        if (ticksToSpend > this.legacyTicks)
            return;
        /** Time till the next passive tick in [ms] */
        let timeTillNextTick = this.tickTimer.ticksLeft * TICK_INTERVAL;
        /** Legacy time remaining in [ms] */
        let legacyTime = ticksToSpend * this.LEGACY_TICK_LENGTH * 1000;
        // Convert legacy time into ticks until it runs out
        while (legacyTime >= timeTillNextTick) {
            this.tick();
            legacyTime -= timeTillNextTick;
            timeTillNextTick = this.PASSIVE_TICK_LENGTH * 1000;
        }
        // Reset the tick timer to the appropriate value accounting for remaining legacy time
        this.tickTimer.start(timeTillNextTick - legacyTime);
        this.renderQueue.updateTimer = true;
        this.legacyTicks -= ticksToSpend;
        townshipUI.updateLegacyTickButtons();
    }
    tick() {
        this.addResources();
        const xpBefore = this.xp;
        const levelBefore = this.level;
        this.addXP(this.baseXPRate);
        this.game.telemetry.createOnlineXPGainEvent(this, this.TICK_LENGTH * 1000, xpBefore, this.xp, levelBefore, this.level);
        this.applyPreTickTownUpdates();
        this.rollForPets(0);
        for (let i = 0; i < 10; i++)
            this.rollForAncientRelics(this.level, this.game.defaultRealm);
        this.computeWorshipAndStats();
        this.reduceAllBuildingEfficiency(1);
        this.updateAllBuildingProvidedStatsMultiplier();
        this.tickSeason();
        this.totalTicks++;
        this.renderQueue.townAge = true;
        this.renderQueue.biomeRequirements = true;
        this.renderQueue.buildingEfficiency = true;
        this.renderQueue.buildingCurrentProvides = true;
        this.renderQueue.buildingResourceGeneration = true;
        this.renderQueue.buildingModifiers = true;
        this.renderQueue.abyssalWaveSize = true;
        townshipUI.updateTimeToNextUpdate();
        this.renderQueue.townSummary = true;
        return true;
    }
    applyPreTickTownUpdates() {
        if (this.level >= 15 && rollPercentage(25) && this.game.modifiers.disableTownshipHealthDegradation < 1) {
            this.townData.health > this.MINIMUM_HEALTH ?
                this.townData.health--
                :
                (this.townData.health = this.MINIMUM_HEALTH);
        }
    }
    tickSeason() {
        var _a, _b, _c, _d;
        this.townData.seasonTicksRemaining--;
        if (this.townData.seasonTicksRemaining <= 0) {
            let nextSeasonIndex = (_b = (_a = this.townData.season) === null || _a === void 0 ? void 0 : _a.order) !== null && _b !== void 0 ? _b : 0;
            //Handle worship seasons
            let incrementSeason = true;
            if (this.game.modifiers.enableNightfallSeason && rollPercentage(this.RARE_SEASON_CHANCE)) {
                nextSeasonIndex = 4;
                this.townData.previousSeason = this.townData.season;
                incrementSeason = false;
            }
            if (this.game.modifiers.enableSolarEclipseSeason && rollPercentage(this.RARE_SEASON_CHANCE)) {
                nextSeasonIndex = 5;
                this.townData.previousSeason = this.townData.season;
                incrementSeason = false;
            }
            if (this.game.modifiers.enableLemonSeason && rollPercentage(this.RARE_SEASON_CHANCE)) {
                nextSeasonIndex = 6;
                this.townData.previousSeason = this.townData.season;
                incrementSeason = false;
            }
            if (this.game.modifiers.enableEternalDarknessSeason && rollPercentage(this.RARE_SEASON_CHANCE)) {
                nextSeasonIndex = 7;
                this.townData.previousSeason = this.townData.season;
                incrementSeason = false;
            }
            if (incrementSeason) {
                //If we were within a Worship season, reset back to the season prior to that
                if (nextSeasonIndex > 3)
                    nextSeasonIndex = (_d = (_c = this.townData.previousSeason) === null || _c === void 0 ? void 0 : _c.order) !== null && _d !== void 0 ? _d : 0;
                nextSeasonIndex < 3 ? nextSeasonIndex++ : (nextSeasonIndex = 0);
            }
            let newSeason = this.seasons.find((season) => season.order === nextSeasonIndex);
            if (newSeason == undefined)
                newSeason = this.seasons.find((season) => season.order === 0);
            if (newSeason == undefined)
                throw new Error('No season found for order ID 0. Game data corrupt?');
            this.townData.season = newSeason;
            this.townData.seasonTicksRemaining = newSeason.seasonLength;
            this.renderQueue.updateSeason = true;
            this.computeProvidedStats(true); //Season changed, recompute provided stats
        }
    }
    /** Callback function for when the player clicks the "Fight Wave Now" button */
    processAbyssalWaveOnClick() {
        if (this.isFightingAbyssalWave || !this.canFightAbyssalWaves)
            return;
        if (!this.canWinAbyssalWave) {
            notifyPlayer(this, getLangString('TOWNSHIP_CANNOT_WIN_NOTIFICATION'), 'danger');
            return;
        }
        this.abyssalWaveTimer.start(this.ABYSSAL_WAVE_COOLDOWN);
        this.renderQueue.fightAbyssalWave = true;
        this.renderFightAbyssalWave();
    }
    /** Method called when the abyssal wave timer fires */
    onAbyssalWaveTimer() {
        this.processAbyssalWave();
        this.renderQueue.fightAbyssalWave = true;
    }
    getAbyssalXPOnWin() {
        return applyModifier(this.abyssalWaveSize * 100, this.currentFortification);
    }
    getAbyssalXPOnLoss(fortificationValue) {
        return fortificationValue < this.abyssalWaveSize ? fortificationValue * 80 : this.abyssalWaveSize * 80;
    }
    processAbyssalWave() {
        var _a, _b, _c, _d;
        if (!this.canFightAbyssalWaves)
            return;
        const xpBefore = this.abyssalXP;
        const levelBefore = this.abyssalLevel;
        const waveSize = this.abyssalWaveSize;
        const apGain = this.getAPGainFromAbyssalWave();
        const ascGain = this.getASCGainFromAbyssalWave();
        this.addAbyssalXP(this.getAbyssalXPOnWin());
        if (apGain > 0) {
            (_a = this.game.abyssalPieces) === null || _a === void 0 ? void 0 : _a.add(apGain);
            this.game.telemetry.createAPAdjustedEvent(apGain, (_c = (_b = this.game.abyssalPieces) === null || _b === void 0 ? void 0 : _b.amount) !== null && _c !== void 0 ? _c : 0, `Skill.${this.id}`);
        }
        if (ascGain > 0)
            (_d = this.game.abyssalSlayerCoins) === null || _d === void 0 ? void 0 : _d.add(ascGain);
        this.removeArmourWeaponryAmount(waveSize);
        this.onAbyssalWaveProcessed();
        this.game.telemetry.createOnlineAXPGainEvent(this, this.TICK_LENGTH * 1000, xpBefore, this.abyssalXP, levelBefore, this.abyssalLevel);
    }
    onAbyssalWaveProcessed() {
        this.rollForAncientRelics(this.level, this.game.realms.getObjectSafe("melvorItA:Abyssal" /* RealmIDs.Abyssal */ ));
        this.computeProvidedStats(true);
        this.onBuildingChange();
        this.renderQueue.resourceAmounts = true;
        this.renderQueue.resourceRates = true;
        this.renderQueue.townStats = true;
        this.renderQueue.townSummary = true;
        this.renderQueue.buildingModifiers = true;
    }
    removeArmourWeaponryAmount(amount) {
        const armourWeaponry = this.resources.getObjectByID('melvorItA:ArmourWeaponry');
        if (armourWeaponry === undefined)
            throw new Error('Township resources with id melvorItA:ArmourWeaponry is not registered.');
        armourWeaponry.amount = Math.max(0, armourWeaponry.amount - amount);
    }
    rollForPets(interval) {
        this.pets.forEach((pet) => {
            if (this.game.petManager.isPetUnlocked(pet))
                return;
            if (this.chanceForPet > Math.random())
                this.game.petManager.unlockPet(pet);
        });
    }
    /** Adds the starting buildings to the town if they are missing */
    addStartingBuildings() {
        const grasslandsBiome = this.biomes.getObjectByID("melvorF:Grasslands" /* TownshipBiomeIDs.Grasslands */ );
        const forestBiome = this.biomes.getObjectByID("melvorF:Forest" /* TownshipBiomeIDs.Forest */ );
        const mountainBiome = this.biomes.getObjectByID("melvorF:Mountains" /* TownshipBiomeIDs.Mountains */ );
        const basicShelter = this.buildings.getObjectByID("melvorF:Basic_Shelter" /* TownshipBuildingIDs.Basic_Shelter */ );
        if (basicShelter === undefined)
            throw new Error('Error generating town. Basic Shelter is not registered.');
        const farmlands = this.buildings.getObjectByID("melvorF:Farmland" /* TownshipBuildingIDs.Farmland */ );
        if (farmlands === undefined)
            throw new Error('Error generating town. Farmlandis not registered.');
        const woodcuttersCamp = this.buildings.getObjectByID("melvorF:Woodcutters_Camp" /* TownshipBuildingIDs.Woodcutters_Camp */ );
        if (woodcuttersCamp === undefined)
            throw new Error('Error generating town. Woodcutters_Camp is not registered.');
        const minersPit = this.buildings.getObjectByID("melvorF:Miners_Pit" /* TownshipBuildingIDs.Miners_Pit */ );
        if (minersPit === undefined)
            throw new Error('Error generating town. Basic Shelter is not registered.');
        if ((grasslandsBiome === null || grasslandsBiome === void 0 ? void 0 : grasslandsBiome.getBuildingCount(basicShelter)) === 0)
            grasslandsBiome === null || grasslandsBiome === void 0 ? void 0 : grasslandsBiome.addBuildings(basicShelter, 1);
        if ((grasslandsBiome === null || grasslandsBiome === void 0 ? void 0 : grasslandsBiome.getBuildingCount(farmlands)) === 0)
            grasslandsBiome === null || grasslandsBiome === void 0 ? void 0 : grasslandsBiome.addBuildings(farmlands, 1);
        if ((forestBiome === null || forestBiome === void 0 ? void 0 : forestBiome.getBuildingCount(woodcuttersCamp)) === 0)
            forestBiome === null || forestBiome === void 0 ? void 0 : forestBiome.addBuildings(woodcuttersCamp, 1);
        if ((mountainBiome === null || mountainBiome === void 0 ? void 0 : mountainBiome.getBuildingCount(minersPit)) === 0)
            mountainBiome === null || mountainBiome === void 0 ? void 0 : mountainBiome.addBuildings(minersPit, 1);
    }
    setTownBiome(biome, jumpTo = true) {
        if (biome === undefined || !this.isBiomeUnlocked(biome))
            return;
        if (this.currentTownBiome !== biome) {
            townshipUI.unhighlightTownBiomeBtn(this.currentTownBiome);
        }
        this.currentTownBiome = biome;
        this.updateForBiomeSelectChange(biome);
        const yOffset = -355;
        const element = document.getElementById('ts-town');
        if (element !== null && isOnMobileLayout && jumpTo) {
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({
                top: y,
                behavior: 'smooth'
            });
        }
        this.onBuildingChange();
    }
    updateForBiomeSelectChange(biome) {
        townshipUI.highlightTownBiomeBtn(biome);
        this.renderQueue.townSummary = true;
        townshipUI.updateAllBuildingUpgradeCosts();
        townshipUI.updateAllBuildingUpgradeProvides();
        townshipUI.updateAllBuildingUpgradeProgress();
        townshipUI.updateAllBuildingUpgradeProgressText();
        townshipUI.updateAllBuildingEfficiency();
    }
    /** Recomputes all stats in the town that only depend on building count */
    computeBuildingTownStats() {
        this.computeBuildingStorage(); // Compute base storage provided by buildings. True storage depends on modifiers.
        this.computeSoulStorage(); // Compute base soul storage provided by buildings. True storage depends on modifiers.
    }
    /** Recomputes all the stats of the town */
    computeTownStats() {
        this.computeTownHappiness();
        this.computeTownPopulation();
        this.computeTownEducation();
        this.computeWorship();
        this.computeTownResourceGain(); // Compute resource generation rates. Depends on buildings, worker assignment, modifiers, population, tax rate
        this.computeFortification();
        this.renderQueue.townStats = true;
        this.renderQueue.resourceRates = true;
    }
    /** Recomputes worship, then provided modifiers if worship changes, then town stats */
    computeWorshipAndStats() {
        const worshipChanged = this.computeWorship();
        if (worshipChanged)
            this.computeProvidedStats(true); // This will trigger a town stat update
        else
            this.computeTownStats();
    }
    /** Recomputes the worship of the town provided by buildings an augmented by resource penalties. Returns if the worship tier has changed. */
    computeWorship() {
        const oldWorshipTier = this.worshipTier;
        let worship = 0;
        this.biomes.forEach((biome) => {
            this.buildings.forEach((building) => {
                const buildingCount = biome.getBuildingCount(building);
                worship += buildingCount * this.getWorshipProvidesForBiome(building, biome);
            });
        });
        this.townData.worshipCount = Math.floor(worship);
        const newWorshipTier = this.worshipTier;
        return oldWorshipTier !== newWorshipTier;
    }
    computeTownHappiness() {
        let happiness = 0;
        this.biomes.forEach((biome) => {
            this.buildings.forEach((building) => {
                const buildingCount = biome.getBuildingCount(building);
                happiness += buildingCount * this.getHappinessProvidesForBiome(building, biome);
            });
        });
        happiness += this.game.modifiers.flatTownshipHappiness;
        this.townData.happiness = happiness;
    }
    computeTownHealthPercent() {
        const totalWeight = 235;
        const percentages = [];
        percentages.push((this.townData.education / totalWeight) * 100);
        percentages.push((this.townData.happiness / totalWeight) * 100);
        let health = percentages.reduce((a, b) => a + b, 0);
        health *= 1 + this.game.modifiers.townshipHealth / 100;
        this.townData.healthPercent = Math.max(Math.min(health, this.maxHealth), 0);
    }
    computeTownEducation() {
        let education = 0;
        this.biomes.forEach((biome) => {
            this.buildings.forEach((building) => {
                const buildingCount = biome.getBuildingCount(building);
                education += buildingCount * this.getEducationProvidesForBiome(building, biome);
            });
        });
        education += this.game.modifiers.flatTownshipEducation;
        this.townData.education = Math.floor(education);
    }
    computeTownPopulation() {
        let population = 0;
        this.biomes.forEach((biome) => {
            this.buildings.forEach((building) => {
                const buildingCount = biome.getBuildingCount(building);
                population += buildingCount * this.getPopulationProvidesForBiome(building, biome);
            });
        });
        population += this.game.modifiers.flatTownshipPopulation;
        this.townData.population = applyModifier(population, this.townData.happiness);
    }
    /** Recomputes the base total storage provided by all buildings */
    computeBuildingStorage() {
        let storage = 0;
        this.biomes.forEach((biome) => {
            this.buildings.forEach((building) => {
                const buildingCount = biome.getBuildingCount(building);
                storage += buildingCount * this.getStorageProvidesForBiome(building, biome);
            });
        });
        this.townData.buildingStorage = Math.floor(storage);
    }
    /** Returns the modified storage of the town */
    getMaxStorage() {
        let maxStorage = this.townData.buildingStorage + this.BASE_STORAGE;
        maxStorage *= 1 + this.game.modifiers.townshipMaxStorage / 100;
        maxStorage = Math.max(1, Math.floor(maxStorage));
        return maxStorage;
    }
    /** Returns the total storage used by all resources, excepting GP. */
    getUsedStorage() {
        return this.resources.reduce((total, resource) => {
            if (resource.type === TownshipResourceTypeID.Currency || resource.storageType !== 'Normal')
                return total;
            return total + resource.amount;
        }, 0);
    }
    /** Recomputes the base total soul storage provided by all buildings */
    computeSoulStorage() {
        let soulStorage = 0;
        this.biomes.forEach((biome) => {
            this.buildings.forEach((building) => {
                const buildingCount = biome.getBuildingCount(building);
                soulStorage += buildingCount * this.getSoulStorageProvidesForBiome(building, biome);
            });
        });
        this.townData.soulStorage = Math.floor(soulStorage);
    }
    /** Returns the modified soul storage of the town */
    getMaxSoulStorage() {
        let maxSoulStorage = this.townData.soulStorage + this.BASE_SOUL_STORAGE;
        maxSoulStorage *= 1 + this.game.modifiers.townshipMaxSoulStorage / 100;
        maxSoulStorage = Math.max(1, Math.floor(maxSoulStorage));
        return maxSoulStorage;
    }
    /** Returns the total storage used by all resources, excepting GP. */
    getUsedSoulStorage() {
        return this.resources.reduce((total, resource) => {
            if (resource.type === TownshipResourceTypeID.Currency || resource.storageType !== 'Soul')
                return total;
            return total + resource.amount;
        }, 0);
    }
    computeFortification() {
        let fortification = 0;
        this.biomes.forEach((biome) => {
            this.buildings.forEach((building) => {
                const buildingCount = biome.getBuildingCount(building);
                fortification += buildingCount * this.getFortificationProvidesForBiome(building, biome);
            });
        });
        this.townData.fortification = fortification;
    }
    modifyBuildingResourceCost(quantity) {
        const modifier = Math.max(this.game.modifiers.townshipBuildingCost, this.DECREASED_BUILDING_COST_CAP);
        return Math.floor(quantity * (1 + modifier / 100));
    }
    getBuildingCostsForBiome(building, biome) {
        if (biome === undefined)
            return [];
        const costs = building.costs.get(biome);
        if (costs === undefined)
            return [];
        return costs;
    }
    canAffordBuilding(building, biome, qty = 1) {
        return this.getBuildingCostsForBiome(building, biome).every(({
            resource,
            quantity
        }) => {
            var _a, _b;
            let cost = quantity;
            if (resource.type !== TownshipResourceTypeID.Currency)
                cost = this.modifyBuildingResourceCost(cost);
            let amount = 0;
            switch (resource.id) {
                case "melvorF:GP" /* TownshipResourceIDs.GP */ :
                    amount = this.game.gp.amount;
                    break;
                case "melvorItA:AP" /* TownshipResourceIDs.AP */ :
                    amount = (_b = (_a = this.game.abyssalPieces) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : 0;
                    break;
                default:
                    amount = resource.amount;
                    break;
            }
            return cost <= 0 || amount >= cost * qty;
        });
    }
    getMaxAffordableBuildingQty(building, biome) {
        let qty = 1;
        const upgradesRemaining = building.maxUpgrades - biome.getBuildingCount(building);
        while (this.canAffordBuilding(building, biome, qty) && qty <= upgradesRemaining)
            qty++;
        return Math.max(1, qty - 1);
    }
    canAffordRepair(building, biome) {
        let buildingToUseForCosts = building;
        if ((biome === null || biome === void 0 ? void 0 : biome.getBuildingCount(building)) === 0 && building.upgradesFrom !== undefined)
            buildingToUseForCosts = building.upgradesFrom;
        return this.getBuildingCostsForBiome(buildingToUseForCosts, biome).every(({
            resource,
            quantity
        }) => {
            var _a, _b;
            const cost = this.getSingleResourceRepairCostForBuilding(building, biome, quantity);
            let amount = 0;
            switch (resource.id) {
                case "melvorF:GP" /* TownshipResourceIDs.GP */ :
                    amount = this.game.gp.amount;
                    break;
                case "melvorItA:AP" /* TownshipResourceIDs.AP */ :
                    amount = (_b = (_a = this.game.abyssalPieces) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : 0;
                    break;
                default:
                    amount = resource.amount;
                    break;
            }
            return cost <= 0 || amount >= cost;
        });
    }
    getSingleResourceRepairCostForBuilding(building, biome, resourceQuantity) {
        if (biome === undefined)
            throw new Error('Biome is undefined');
        let buildingCount = biome.getBuildingCount(building);
        if (buildingCount === 0 && building.upgradesFrom !== undefined)
            buildingCount = biome.getBuildingCount(building.upgradesFrom);
        const baseCost = this.modifyBuildingResourceCost(resourceQuantity) * buildingCount * this.getRepairCostModifier(building, biome);
        return Math.max(1, Math.floor(applyModifier(baseCost, this.game.modifiers.townshipRepairCost) / 3));
    }
    getRepairCostModifier(building, biome) {
        return 1 - this.getBuildingEfficiencyInBiome(building, biome) / 100;
    }
    subtractBuildingCosts(building, qty = 1) {
        this.getBuildingCostsForBiome(building, this.currentTownBiome).forEach(({
            resource,
            quantity
        }) => {
            var _a, _b, _c;
            let cost = quantity;
            if (resource.type !== TownshipResourceTypeID.Currency)
                cost = this.modifyBuildingResourceCost(cost);
            switch (resource.id) {
                case "melvorF:GP" /* TownshipResourceIDs.GP */ :
                    this.game.gp.remove(cost * qty);
                    this.game.telemetry.createGPAdjustedEvent(-cost * qty, this.game.gp.amount, `Skill.${this.id}.BuildBuilding.${building.id}`);
                    break;
                case "melvorItA:AP" /* TownshipResourceIDs.AP */ :
                    (_a = this.game.abyssalPieces) === null || _a === void 0 ? void 0 : _a.remove(cost * qty);
                    this.game.telemetry.createAPAdjustedEvent(-cost * qty, (_c = (_b = this.game.abyssalPieces) === null || _b === void 0 ? void 0 : _b.amount) !== null && _c !== void 0 ? _c : 0, `Skill.${this.id}.BuildBuilding.${building.id}`);
                    break;
                default:
                    resource.amount -= cost * qty;
                    break;
            }
        });
        this.onResourceAmountChange();
    }
    subtractRepairCosts(building, qty = 1, biome) {
        let buildingToUseForCosts = building;
        if ((biome === null || biome === void 0 ? void 0 : biome.getBuildingCount(building)) === 0 && building.upgradesFrom !== undefined)
            buildingToUseForCosts = building.upgradesFrom;
        this.getBuildingCostsForBiome(buildingToUseForCosts, biome).forEach(({
            resource,
            quantity
        }) => {
            var _a, _b, _c;
            const cost = this.getSingleResourceRepairCostForBuilding(building, biome, quantity);
            switch (resource.id) {
                case "melvorF:GP" /* TownshipResourceIDs.GP */ :
                    this.game.gp.remove(cost * qty);
                    this.game.telemetry.createGPAdjustedEvent(-cost * qty, this.game.gp.amount, `Skill.${this.id}.RepairBuilding.${buildingToUseForCosts.id}`);
                    break;
                case "melvorItA:AP" /* TownshipResourceIDs.AP */ :
                    (_a = this.game.abyssalPieces) === null || _a === void 0 ? void 0 : _a.remove(cost * qty);
                    this.game.telemetry.createAPAdjustedEvent(-cost * qty, (_c = (_b = this.game.abyssalPieces) === null || _b === void 0 ? void 0 : _b.amount) !== null && _c !== void 0 ? _c : 0, `Skill.${this.id}.RepairBuilding.${buildingToUseForCosts.id}`);
                    break;
                default:
                    resource.amount -= cost * qty;
                    break;
            }
        });
        this.onResourceAmountChange();
        this.onBuildingChange();
    }
    subtractRepairAllCosts(costs) {
        costs.forEach((quantity, resource) => {
            var _a, _b, _c;
            switch (resource.id) {
                case "melvorF:GP" /* TownshipResourceIDs.GP */ :
                    this.game.gp.remove(quantity);
                    this.game.telemetry.createGPAdjustedEvent(-quantity, this.game.gp.amount, `Skill.${this.id}.RepairAll`);
                    break;
                case "melvorItA:AP" /* TownshipResourceIDs.AP */ :
                    (_a = this.game.abyssalPieces) === null || _a === void 0 ? void 0 : _a.remove(quantity);
                    this.game.telemetry.createAPAdjustedEvent(-quantity, (_c = (_b = this.game.abyssalPieces) === null || _b === void 0 ? void 0 : _b.amount) !== null && _c !== void 0 ? _c : 0, `Skill.${this.id}.RepairAll`);
                    break;
                default:
                    resource.amount -= quantity;
                    break;
            }
        });
        this.onResourceAmountChange();
        this.onBuildingChange();
    }
    canAffordRepairAllCosts(costs) {
        return Array.from(costs).every(([resource, quantity]) => {
            var _a, _b;
            let amount = 0;
            switch (resource.id) {
                case "melvorF:GP" /* TownshipResourceIDs.GP */ :
                    amount = this.game.gp.amount;
                    break;
                case "melvorItA:AP" /* TownshipResourceIDs.AP */ :
                    amount = (_b = (_a = this.game.abyssalPieces) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : 0;
                    break;
                default:
                    amount = resource.amount;
                    break;
            }
            return quantity <= 0 || amount >= quantity;
        });
    }
    getTotalRepairCosts() {
        const costs = new Map();
        this.biomes.forEach((biome) => {
            const repairCostInBiome = this.getTotalRepairCostInBiome(biome);
            repairCostInBiome.forEach((cost, resource) => {
                const currentCost = costs.get(resource);
                if (currentCost !== undefined)
                    costs.set(resource, currentCost + cost);
                else
                    costs.set(resource, cost);
            });
        });
        return costs;
    }
    getTotalRepairCostForStorage(storageType) {
        let costs = new Map();
        this.biomes.forEach((biome) => {
            biome.buildingsBuilt.forEach((_, building) => {
                if (!this.getBuildingCostsForBiome(building, biome).every(({
                        resource
                    }) => resource.storageType === storageType || resource.type === TownshipResourceTypeID.Currency))
                    return;
                costs = this.getRepairCostInBiomeForBuilding(biome, building, costs);
            });
        });
        return costs;
    }
    getTotalRepairCostInBiome(biome) {
        let costs = new Map();
        biome.buildingsBuilt.forEach((_, building) => {
            costs = this.getRepairCostInBiomeForBuilding(biome, building, costs);
        });
        return costs;
    }
    getRepairCostInBiomeForBuilding(biome, building, costs) {
        if (biome.getBuildingEfficiency(building) < 100 &&
            !this.hasBuildingBeenUpgraded(building, biome) &&
            (biome.getBuildingCount(building) > 0 ||
                (biome.getBuildingCount(building) === 0 && building.upgradesFrom !== undefined))) {
            let buildingToUseForCosts = building;
            if (biome.getBuildingCount(building) === 0 && building.upgradesFrom !== undefined)
                buildingToUseForCosts = building.upgradesFrom;
            this.getBuildingCostsForBiome(buildingToUseForCosts, biome).forEach(({
                resource,
                quantity
            }) => {
                const cost = Math.floor(this.getSingleResourceRepairCostForBuilding(building, biome, quantity));
                const currentAmount = costs.get(resource);
                if (currentAmount !== undefined)
                    costs.set(resource, currentAmount + cost);
                else
                    costs.set(resource, cost);
            });
        }
        return costs;
    }
    checkTierPopulationReqs(tier) {
        return this.currentPopulation >= this.populationForTier[tier].population;
    }
    checkTierLevelReqs(tier) {
        return this.level >= this.populationForTier[tier].level;
    }
    checkTierReqs(tier) {
        return this.checkTierLevelReqs(tier) && this.checkTierPopulationReqs(tier);
    }
    checkAbyssalTierFortificationReqs(tier) {
        return this.currentFortification >= this.abyssalTierRequirements[tier].fortification;
    }
    checkAbyssalTierLevelReqs(tier) {
        return this.abyssalLevel >= this.abyssalTierRequirements[tier].abyssalLevel;
    }
    checkAbyssalTierReqs(tier) {
        return tier <= 0 || (this.checkAbyssalTierLevelReqs(tier) && this.checkAbyssalTierFortificationReqs(tier));
    }
    isBiomeUnlocked(biome) {
        return (this.checkTierReqs(biome.tier) &&
            this.checkAbyssalTierReqs(biome.abyssalTier) &&
            biome.requirements.every((req) => req.isMet()));
    }
    canBuildTierOfBuilding(building, notify = false) {
        const canBuild = this.checkTierLevelReqs(building.tier) &&
            this.checkTierPopulationReqs(building.tier) &&
            this.checkAbyssalTierLevelReqs(building.abyssalTier) &&
            this.checkAbyssalTierFortificationReqs(building.abyssalTier) &&
            building.requirements.every((req) => req.isMet());
        if (!canBuild && notify) {
            notifyPlayer(this, getLangString('TOWNSHIP_DO_NOT_MEET_REQUIREMENTS'), 'danger');
        }
        return canBuild;
    }
    buildBuilding(building) {
        if (!this.canBuildTierOfBuilding(building, true))
            return;
        const biome = this.currentTownBiome;
        if (biome === undefined)
            return;
        const upgradeQty = this.upgradeQty > 0 ? this.upgradeQty : this.getMaxAffordableBuildingQty(building, biome);
        const qtyToBuild = Math.min(this.getBuildingCountRemainingForLevelUp(building, biome), upgradeQty);
        if (qtyToBuild <= 0)
            return;
        if (!this.canAffordBuilding(building, biome, qtyToBuild)) {
            notifyPlayer(this, getLangString('TOWNSHIP_MENU_NOTICE_1'), 'danger');
            return;
        }
        this.subtractBuildingCosts(building, qtyToBuild);
        this.addBuildingToBiome(biome, building, qtyToBuild);
        this.updateBuildingProvidedStats(building);
        this.computeProvidedStats();
        this.updateForBuildingChange();
        townshipUI.updateBuilding(building);
        townshipUI.updateBuildingTotalStatsElement(building);
        townshipUI.updateTraderStatus();
        townshipUI.updateBuildingUpgradeProgressText(building);
        townshipUI.updateBuildingUpgradeProgress(building);
        if (biome.getBuildingCount(building) >= building.maxUpgrades) {
            townshipUI.performBuildingUpgradedUIChanges(building);
            if (building.upgradesTo !== undefined)
                this.addBuildingToBiome(biome, building.upgradesTo, 0);
        }
        for (let i = 0; i < qtyToBuild; i++)
            this.rollForAncientRelics(this.level, this.game.defaultRealm);
        this.computeTownStats();
        this.onBuildingChange();
        notifyPlayer(this, templateString(getLangString('TOWNSHIP_MENU_NOTICE_5'), {
            buildingName: `${building.name}`,
        }), 'success', qtyToBuild);
    }
    repairBuilding(building, render = true) {
        const biome = this.currentTownBiome;
        if (biome === undefined)
            return;
        if (!this.canAffordRepair(building, biome)) {
            notifyPlayer(this, 'You cannot afford that!', 'danger');
            return;
        }
        this.subtractRepairCosts(building, 1, biome);
        const wasRepaired = biome.setBuildingEfficiency(building, 100);
        this.updateBuildingProvidedStats(building);
        this.computeProvidedStats();
        this.updateForBuildingChange();
        if (wasRepaired)
            this.rollForAncientRelics(this.level, this.game.defaultRealm);
        if (render)
            this.onBuildingRepair(building, biome);
    }
    onBuildingRepair(building, biome) {
        townshipUI.updateBuilding(building);
        townshipUI.updateBuildingTotalStatsElement(building);
        townshipUI.updateTraderStatus();
        townshipUI.updateBuildingUpgradeProgressText(building);
        townshipUI.updateBuildingUpgradeProgress(building);
        this.renderQueue.townSummary = true;
        this.computeTownResourceGain();
        this.computeTownStats();
        this.setTownBiome(biome);
        this.onBuildingChange();
        this.renderQueue.buildingModifiers = true;
    }
    /** Removes a specified count from the town map. Returns the true amount of buildings removed */
    removeBuildingFromBiome(biome, building, count = 1) {
        const buildingCountInBiome = biome.getBuildingCount(building);
        count = Math.min(count, buildingCountInBiome);
        biome.removeBuildings(building, count);
        this._events.emit('buildingCountChanged', new TownshipBuildingCountChangedEvent(building, biome));
        return count;
    }
    /** Adds a specified count from the town map. Returns the true amount of buildings removed */
    addBuildingToBiome(biome, building, count = 1) {
        biome.addBuildings(building, count);
        this._events.emit('buildingCountChanged', new TownshipBuildingCountChangedEvent(building, biome));
        return count;
    }
    confirmChangeOfWorship() {
        var _a;
        if ((_a = this.townData.season) === null || _a === void 0 ? void 0 : _a.disableWorshipChange)
            return;
        this.game.gp.remove(this.WORSHIP_CHANGE_COST);
        this.game.telemetry.createGPAdjustedEvent(-this.WORSHIP_CHANGE_COST, this.game.gp.amount, `Skill.${this.id}.ChangeWorship`);
        this.destroyAllWorshipBuildings();
        this.biomes.forEach((biome) => {
            this.buildingDisplayOrder.forEach((building) => {
                const efficiency = biome.getBuildingEfficiency(building);
                if (efficiency > 50)
                    biome.setBuildingEfficiency(building, 50);
            });
        });
        this.updateAllBuildingProvidedStatsMultiplier();
        this.updateForBuildingChange();
        this.computeProvidedStats(true);
        this.renderQueue.buildingNames = true;
    }
    destroyAllWorshipBuildings() {
        this.biomes.forEach((biome) => {
            biome.buildingsBuilt.forEach((count, building) => {
                if (this.getWorshipProvidesForBiome(building, biome) > 0) {
                    this.removeBuildingFromBiome(biome, building, count);
                }
            });
        });
    }
    addProvidedStats() {
        super.addProvidedStats();
        if (!this.townData.townCreated)
            return;
        let worshipModifierMulti = 1;
        if (this.townData.season !== undefined) {
            this.providedStats.addStatObject(this.townData.season, this.townData.season.stats);
            const seasonMultiplier = this.townData.worship.seasonMultiplier.get(this.townData.season);
            if (seasonMultiplier !== undefined)
                worshipModifierMulti = seasonMultiplier;
        }
        this.providedStats.modifiers.addModifiers(this.townData.worship, this.townData.worship.modifiers, 1, worshipModifierMulti);
        this.WORSHIP_CHECKPOINTS.forEach((checkpoint, id) => {
            if (this.worshipPercent >= checkpoint)
                this.providedStats.modifiers.addModifiers(this.townData.worship, this.townData.worship.checkpoints[id], 1, worshipModifierMulti);
        });
        this.buildings.forEach((building) => {
            this.providedStats.addStatObject(building, building.stats, building.providedStatMultiplier.neg, building.providedStatMultiplier.pos);
        });
        this.renderQueue.abyssalWaveSize = true;
    }
    /** Sets the multipliers for a given buildings provided stats */
    setBuildingProvidedStatsMultiplier(building) {
        if (!building.providesStats)
            return;
        let negMult = 0;
        let posMult = 0;
        this.biomes.forEach((biome) => {
            const buildingCount = biome.getBuildingCount(building);
            if (buildingCount > 0) {
                const modifiedCount = Math.max(1, buildingCount * (biome.getBuildingEfficiency(building) / 100));
                negMult += buildingCount;
                posMult += modifiedCount;
            }
        });
        building.providedStatMultiplier.neg = negMult;
        building.providedStatMultiplier.pos = posMult;
    }
    updateBuildingProvidedStats(building) {
        this.setBuildingProvidedStatsMultiplier(building);
        this.computeProvidedStats();
    }
    updateAllBuildingProvidedStatsMultiplier() {
        const buildingsWithMods = this.buildings.filter((b) => b.providesStats);
        buildingsWithMods.forEach((b) => {
            this.setBuildingProvidedStatsMultiplier(b);
        });
    }
    updateForBuildingChange() {
        this.computeBuildingTownStats();
        this.computeWorshipAndStats();
        this.renderQueue.buildingCosts = true; // For upgrades that change due to building destruction/creation
        this.renderQueue.buildingProvides = true;
        this.renderQueue.abyssalWaveSize = true;
        this.renderQueue.abyssalXP = true;
        townshipUI.updateWorshipCountSpan();
    }
    getGPGainRate() {
        const gain = this.currentPopulation * this.GP_PER_CITIZEN * (this.taxRate / 100);
        const modifier = this.game.modifiers.townshipGPProduction;
        return applyModifier(gain, modifier);
    }
    getAPGainFromAbyssalWave() {
        const modifier = this.game.modifiers.abyssalWaveAPGain;
        let apGain = applyModifier(this.abyssalWaveSize, modifier, 3);
        if (apGain > 0 && this.game.abyssalPieces !== undefined)
            apGain = applyModifier(apGain, this.getCurrencyModifier(this.game.abyssalPieces));
        return Math.max(0, apGain);
    }
    getASCGainFromAbyssalWave() {
        const modifier = this.game.modifiers.abyssalWaveASCGain;
        let ascGain = applyModifier(this.abyssalWaveSize, modifier, 3);
        if (ascGain > 0 && this.game.abyssalSlayerCoins !== undefined)
            ascGain = applyModifier(ascGain, this.getCurrencyModifier(this.game.abyssalSlayerCoins));
        return Math.max(0, ascGain);
    }
    computeTownResourceGain() {
        this.resources.forEach((resource) => {
            let generation = 0;
            if (resource.id === "melvorF:GP" /* TownshipResourceIDs.GP */ )
                generation = this.getGPGainRate();
            else if (resource.type !== TownshipResourceTypeID.Currency) {
                this.biomes.forEach((biome) => {
                    biome.buildingsBuilt.forEach((buildingQty, building) => {
                        generation += this.getSingleResourceGainAmountInBiome(resource, building, biome, true) * buildingQty;
                    });
                });
            }
            resource.generation = generation;
        });
    }
    getBuildingProductionModifier(biome, building) {
        const buildings = [building];
        while (building.upgradesFrom !== undefined) {
            buildings.push(building.upgradesFrom);
            building = building.upgradesFrom;
        }
        return this.game.modifiers.getValue("melvorD:townshipBuildingProduction" /* ModifierIDs.townshipBuildingProduction */ , new ModifierQuery({
            skill: this,
            category: biome,
            subcategory: buildings,
        }, false));
    }
    getSingleResourceGainAmountInBiome(resource, building, biome, applyEfficiency) {
        const provides = this.getProvidesForBiome(building, biome);
        if (provides === undefined)
            return 0;
        let amount = provides.resourceCount(resource);
        if (amount > 0) {
            amount *= 1 + this.getBuildingProductionModifier(biome, building) / 100;
            amount *= 1 + this.getResourceGainModifier(resource) / 100;
            if (applyEfficiency)
                amount = applyModifier(amount, this.getBuildingEfficiencyInBiome(biome.getCurrentBuildingInUpgradeChain(building), biome), 4); //Building efficiency occurs after everything else
            return Math.max(amount, 0); //return a max of 0 for buildings that actually provide resources
        }
        return amount; //no need to max out at 0 for buildings that have negative resource production
    }
    getResourceGainModifier(resource) {
        let modifier = 0;
        modifier += this.townData.education;
        modifier += this.game.modifiers.getValue("melvorD:townshipResourceProduction" /* ModifierIDs.townshipResourceProduction */ , this.getActionModifierQuery(resource));
        return modifier;
    }
    countNumberOfBuildings(building) {
        return this.biomes.reduce((prev, biome) => {
            return prev + biome.getBuildingCount(building);
        }, 0);
    }
    getMaxRawCreationAmount(resource) {
        let amount = resource.generation;
        switch (resource.storageType) {
            case 'Normal':
                if (amount + this.getUsedStorage() >= this.getMaxStorage())
                    amount = this.getMaxStorage() - this.getUsedStorage();
                break;
            case 'Soul':
                if (amount + this.getUsedSoulStorage() >= this.getMaxSoulStorage())
                    amount = this.getMaxSoulStorage() - this.getUsedSoulStorage();
                break;
        }
        return amount;
    }
    getMaxSoulsToAddAmount(amount) {
        if (amount + this.getUsedSoulStorage() >= this.getMaxSoulStorage())
            amount = this.getMaxSoulStorage() - this.getUsedSoulStorage();
        return amount;
    }
    addResources() {
        this.resources.forEach((resource) => {
            // Special Case for adding GP
            if (resource.id === "melvorF:GP" /* TownshipResourceIDs.GP */ ) {
                const gpToAdd = this.getGPGainRate();
                if (gpToAdd >= 1) {
                    resource.amount += gpToAdd;
                    this.game.gp.add(gpToAdd);
                    this.game.telemetry.createGPAdjustedEvent(gpToAdd, this.game.gp.amount, `Skill.${this.id}`);
                }
                return;
            } else if (resource.type === TownshipResourceTypeID.Currency)
                return;
            const amount = this.getMaxRawCreationAmount(resource);
            resource.amount += amount;
            if (resource.amount > this.getMaxResourceAmount(resource))
                resource.amount = this.getMaxResourceAmount(resource);
        });
        this.onResourceAmountChange();
    }
    getMaxResourceAmount(resource) {
        switch (resource.storageType) {
            case 'Normal':
                return this.getMaxStorage() * (resource.cap / 100);
            case 'Soul':
                return this.getMaxSoulStorage() * (resource.cap / 100);
        }
    }
    setResourceCap(resource, cap) {
        resource.cap = cap;
        townshipUI.updateResourceCapElement(resource);
        townshipUI.updateResourceAmounts();
    }
    processYeet(resource, amount) {
        const amountOwned = resource.amount;
        const amountToYeet = Math.min(amountOwned, amount);
        resource.amount -= amountToYeet;
        this.computeWorshipAndStats();
        this.onResourceAmountChange();
        notifyPlayer(this, templateString(getLangString('TOWNSHIP_MENU_YEETED'), {
            qty: numberWithCommas(amountToYeet),
            resourceName: resource.name,
        }), 'info', 0);
    }
    /** Callback Method */
    updateConvertQty(value) {
        this.convertQty = value;
        townshipUI.updateConvertQtyElements();
    }
    updateConvertToQty(value, conversion) {
        switch (this.convertQtyType) {
            case 0 /* TownshipConvertQtyType.Number */ :
                this.convertQty = Math.min(value, Math.floor(game.bank.getQty(conversion.item) / this.getBaseConvertToTownshipRatio(conversion)));
                break;
            case 1 /* TownshipConvertQtyType.Percent */ :
                this.convertQty = Math.floor(game.bank.getQty(conversion.item) * (this.convertQtyPercent / 100));
                break;
            case 2 /* TownshipConvertQtyType.AllButOne */ :
                this.convertQty = Math.max(0, game.bank.getQty(conversion.item) - 1);
                break;
        }
    }
    updateConvertFromQty(value, resource, conversion) {
        const baseConvert = this.getBaseConvertFromTownshipRatio(conversion);
        switch (this.convertQtyType) {
            case 0 /* TownshipConvertQtyType.Number */ :
                this.convertQty = Math.min(value, Math.floor(resource.amount / baseConvert));
                break;
            case 1 /* TownshipConvertQtyType.Percent */ :
                this.convertQty = Math.max(1, Math.floor(resource.amount * (this.convertQtyPercent / 100)));
                this.convertQty = Math.floor(this.convertQty / baseConvert);
                break;
            case 2 /* TownshipConvertQtyType.AllButOne */ :
                this.convertQty = Math.floor(resource.amount - 1);
                this.convertQty = Math.floor(this.convertQty / baseConvert);
                break;
        }
    }
    getConvertToTownshipRatio(conversion) {
        return this.getBaseConvertToTownshipRatio(conversion) * this.convertQty;
    }
    getConvertFromTownshipRatio(conversion) {
        return this.getBaseConvertFromTownshipRatio(conversion) * this.convertQty;
    }
    getBaseConvertToTownshipRatio(conversion) {
        const baseRate = conversion.baseCost > 0 ? conversion.baseCost : conversion.item.sellsFor.quantity / 25;
        const rate = applyModifier(baseRate, -this.game.modifiers.townshipTraderCost, 2);
        return Math.max(rate, 1);
    }
    getBaseConvertFromTownshipRatio(conversion) {
        const baseRate = conversion.baseCost > 0 ? conversion.baseCost : conversion.item.sellsFor.quantity;
        const rate = applyModifier(baseRate, -this.game.modifiers.townshipTraderCost, 2);
        return Math.max(rate, 2);
    }
    processConversionToTownship(conversion, resource) {
        const convertRatio = this.convertQty;
        const quantityOwned = this.game.bank.getQty(conversion.item);
        if (quantityOwned >= 0) {
            const count = this.getMaxPossibleConvertToTownshipValue(conversion);
            if (count < this.convertQty)
                return notifyPlayer(this, getLangString('TOWNSHIP_MENU_NOTICE_8'), 'danger');
            const amountRequired = convertRatio;
            if (quantityOwned >= amountRequired) {
                this.game.bank.removeItemQuantity(conversion.item, amountRequired, true);
                resource.amount += count;
                itemNotify(conversion.item, -amountRequired);
                this.onResourceAmountChange();
                this.computeWorshipAndStats();
            } else if (amountRequired < 1)
                notifyPlayer(this, getLangString('TOWNSHIP_MENU_NOTICE_9'), 'danger');
            else if (quantityOwned < amountRequired)
                notifyPlayer(this, getLangString('TOWNSHIP_MENU_NOTICE_9'), 'danger');
        } else
            notifyPlayer(this, getLangString('TOWNSHIP_MENU_NOTICE_9'), 'danger');
    }
    processConversionFromTownship(conversion, resource) {
        const convertRatio = this.getConvertFromTownshipRatio(conversion);
        const count = this.getMaxPossibleConvertFromTownshipValue(resource, convertRatio);
        if (count <= 0)
            return notifyPlayer(this, getLangString('TOWNSHIP_MENU_NOTICE_11'), 'danger');
        const amountToGive = this.convertQty;
        if (!this.game.bank.addItem(conversion.item, amountToGive, true, true))
            return;
        resource.amount -= convertRatio;
        this.onResourceAmountChange();
        this.computeWorshipAndStats();
    }
    getMaxPossibleConvertToTownshipValue(conversion) {
        let count = this.getConvertToTownshipRatio(conversion);
        if (count + this.getUsedStorage() > this.getMaxStorage())
            count = this.getMaxStorage() - this.getUsedStorage();
        return count;
    }
    getMaxPossibleConvertFromTownshipValue(resource, convertRatio) {
        let count = this.convertQty;
        const currentResourceCount = resource.amount;
        if (currentResourceCount < convertRatio)
            count = Math.floor(currentResourceCount / convertRatio);
        return count;
    }
    testTranslations() {
        super.testTranslations();
        this.resources.forEach((resource) => {
            resource.name;
        });
        this.biomes.forEach((biome) => {
            biome.name;
        });
        this.buildings.forEach((building) => {
            building.name;
        });
        this.worships.forEach((worship) => {
            worship.name;
            worship.statueName;
        });
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        this.resources.forEach((resource) => {
            this.getResourceItemConversionsFromTownship(resource).forEach((conversion) => {
                obtainable.add(conversion.item);
            });
        });
        return obtainable;
    }
    buildingRequiresRepair(building, biome) {
        if (biome === undefined)
            return false;
        return this.getBuildingEfficiencyInBiome(building, biome) < 100;
    }
}
class TownshipUI {
    constructor(game, township) {
        this.township = township;
        this.currentPage = 0 /* TownshipPage.Town */ ;
        this.defaultElements = {
            btn: {
                town: document.getElementById('BTN_TOWN'),
                trader: document.getElementById('BTN_CONVERT_RESOURCES'),
                manageStorage: document.getElementById('BTN_YEET_RESOURCES'),
                tasks: document.getElementById('BTN_TASKS'),
                processAbyssalWave: document.getElementById('BTN_PROCESS_ABYSSAL_WAVE'),
            },
            div: {
                town: document.getElementById('DIV_TOWN'),
                trader: document.getElementById('DIV_CONVERT_RESOURCES'),
                manageStorage: document.getElementById('DIV_YEET_RESOURCES'),
                ticks: document.getElementById('DIV_TICKS'),
                mainInfo: document.getElementById('DIV_MAIN_INFO'),
                resources: document.getElementById('DIV_RESOURCES'),
                container: document.getElementById('DIV_CONTAINER'),
                worship: document.getElementById('DIV_WORSHIP'),
                currentWorshipModal: document.getElementById('DIV_CURRENT_WORSHIP_MODAL'),
                worshipModal: document.getElementById('DIV_WORSHIP_MODAL'),
                worshipModifiers: document.getElementById('DIV_WORSHIP_MODIFIERS'),
                worshipModifiersModal: document.getElementById('DIV_WORSHIP_MODIFIERS_MODAL'),
                generateTown: document.getElementById('DIV_GENERATE_TOWN'),
                tasks: document.getElementById('township-tasks-menu'),
                timeToNextUpdate: document.getElementById('TIME_TO_NEXT_UPDATE'),
                timeToNextSeason: document.getElementById('TIME_TO_NEXT_SEASON'),
                currentSeasonImg: document.getElementById('TS_SEASON_IMG'),
                currenSeasonName: document.getElementById('TS_SEASON_NAME'),
                passiveTicks: document.getElementById('DIV_PASSIVE_TICKS'),
                controlTicks: document.getElementById('DIV_CONTROL_TICKS'),
                categoryMenu: document.getElementById('DIV_CATEGORY_MENU'),
                worshipChangeCost: document.getElementById('TS_WORSHIP_CHANGE_COST'),
                cannotChangeWorship: document.getElementById('DIV_CANNOT_CHANGE_WORSHIP_SEASON'),
                increaseHealth: document.getElementById('DIV_INCREASE_HEALTH'),
                nextAbyssalWaveSize: document.getElementById('NEXT_ABYSSAL_WAVE_SIZE'),
                abyssalWave: document.getElementById('DIV_ABYSSAL_WAVE'),
                buildAbyssalGateway: document.getElementById('DIV_BUILD_ABYSSAL_GATEWAY'),
                abyssalWaveSize: document.getElementById('DIV_ABYSSAL_WAVE_SIZE'),
                abyssalXPOnWin: document.getElementById('ABYSSAL_XP_ON_WIN'),
                abyssalXPValues: document.getElementById('DIV_ABYSSAL_WAVE_XP_VALUES'),
            },
            town: {
                population: document.getElementById('TOWN_POPULATION'),
                happiness: document.getElementById('TOWN_HAPPINESS'),
                education: document.getElementById('TOWN_EDUCATION'),
                health: document.getElementById('TOWN_HEALTH'),
                worship: document.getElementById('TOWN_WORSHIP'),
                breakdown: {
                    worship: document.getElementById('TOWNSHIP_TOWN_SUMMARY_WORSHIP'),
                    worshipProgress: document.getElementById('TOWNSHIP_TOWN_SUMMARY_WORSHIP_PROGRESS'),
                    storage: document.getElementById('TOWNSHIP_TOWN_SUMMARY_STORAGE'),
                    population: document.getElementById('TOWNSHIP_TOWN_SUMMARY_POPULATION'),
                    happiness: document.getElementById('TOWNSHIP_TOWN_SUMMARY_HAPPINESS'),
                    education: document.getElementById('TOWNSHIP_TOWN_SUMMARY_EDUCATION'),
                    health: document.getElementById('TOWNSHIP_TOWN_SUMMARY_HEALTH'),
                    fortification: document.getElementById('TOWNSHIP_TOWN_SUMMARY_FORTIFICATION'),
                    soulStorage: document.getElementById('TOWNSHIP_TOWN_SUMMARY_SOUL_STORAGE'),
                    soulStorageDiv: document.getElementById('TOWNSHIP_TOWN_SUMMARY_SOUL_STORAGE_DIV'),
                    fortificationDiv: document.getElementById('TOWNSHIP_TOWN_SUMMARY_FORTIFICATION_DIV'),
                },
                fortification: document.getElementById('TOWN_FORTIFICATION'),
                soulStorage: document.getElementById('TOWN_SOULSTORAGE'),
            },
            trader: {
                trader: document.getElementById('TOWN_TRADER'),
                noTradingPost: document.getElementById('TOWN_TRADER_NO_TRADING_POST'),
            },
            notifications: {
                global: {
                    noStorage: document.getElementById('TOWN_NO_STORAGE_NOTIFICATION'),
                    noSoulStorage: document.getElementById('TOWN_NO_SOUL_STORAGE_NOTIFICATION'),
                },
            },
            icon: {
                taskReady: document.getElementById('TOWNSHIP_TASK_READY_ICON'),
            },
        };
        this.tasks = document.getElementById('township-tasks-menu');
        this.resourceDisplays = new Map();
        this.townBiomeSelectButtons = new Map();
        this.buildingsInTown = new Map();
        this.conversionElements = new Map();
        this.worshipSelects = new Map();
        this.worshipSelectsModal = new Map();
        this.capResourceElements = new Map();
        this.increaseHealthBtns = new Map();
        this.tickOptions = [1, 6, 12, 18, 24];
        this.townViewTab = 1;
        this.tasks.initialize(game, township.tasks);
    }
    loadTownshipUI() {
        this.displayTownSummary();
        this.createResourceBreakdownTable();
        this.createTickBtns();
        this.createBtnEvents();
        this.updateTownStats();
        this.setupTownTooltips();
        this.buildCapResourceElements();
        this.buildYeetItemElement();
        this.buildConvertItemElements();
        this.createWorshipSelection();
        this.showPage(this.currentPage);
        this.updateCurrentWorship();
        this.setTownViewTab(this.townViewTab);
        this.updateTimeToNextUpdate();
        this.updateTraderStatus();
        this.updateSeason();
        this.updateWorshipChangeCost();
        this.createIncreaseHealthBtns();
        this.updateReworkNotification();
        this.updateAbyssalWaveUI();
    }
    updateTownStats() {
        this.updatePopulation();
        this.updateHappiness();
        this.updateEducation();
        this.updateHealth();
        this.updateWorship();
        this.updateStorageBreakdown();
        this.updateFortification();
        this.updateSoulStorageBreakdown();
    }
    updateAbyssalWaveUI() {
        if (!cloudManager.hasItAEntitlementAndIsEnabled) {
            hideElement(this.defaultElements.div.abyssalWave);
            hideElement(this.defaultElements.div.abyssalXPValues);
            return;
        }
        showElement(this.defaultElements.div.abyssalWave);
        if (!this.township.canFightAbyssalWaves) {
            this.disableFightAbyssalWaveButton();
            showElement(this.defaultElements.div.buildAbyssalGateway);
            hideElement(this.defaultElements.div.abyssalWaveSize);
            hideElement(this.defaultElements.div.abyssalXPValues);
        } else {
            hideElement(this.defaultElements.div.buildAbyssalGateway);
            showElement(this.defaultElements.div.abyssalWaveSize);
            showElement(this.defaultElements.div.abyssalXPValues);
            if (this.township.isFightingAbyssalWave) {
                this.disableFightAbyssalWaveButton();
                this.showSpinnerOnFightAbyssalWaveButton();
            } else {
                this.enableFightAbyssalWaveButton();
                this.hideSpinnerOnFightAbyssalWaveButton();
            }
        }
    }
    showSpinnerOnFightAbyssalWaveButton() {
        this.defaultElements.btn.processAbyssalWave.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> ${getLangString('TOWNSHIP_BTN_FIGHT_ABYSSAL_WAVE_RIP')}`;
    }
    hideSpinnerOnFightAbyssalWaveButton() {
        this.defaultElements.btn.processAbyssalWave.innerHTML = getLangString('TOWNSHIP_BTN_FIGHT_ABYSSAL_WAVE');
    }
    disableFightAbyssalWaveButton() {
        this.defaultElements.btn.processAbyssalWave.disabled = true;
        this.defaultElements.btn.processAbyssalWave.classList.add('disabled');
    }
    enableFightAbyssalWaveButton() {
        this.defaultElements.btn.processAbyssalWave.disabled = false;
        this.defaultElements.btn.processAbyssalWave.classList.remove('disabled');
    }
    createIncreaseHealthBtns() {
        const herbs = this.township.resources.getObjectByID("melvorF:Herbs" /* TownshipResourceIDs.Herbs */ );
        if (herbs === undefined)
            throw new Error('Herbs not registered');
        const potions = this.township.resources.getObjectByID("melvorF:Potions" /* TownshipResourceIDs.Potions */ );
        if (potions === undefined)
            throw new Error('Potions not registered');
        const healthImage = createElement('img', {
            className: 'skill-icon-xxs mr-1',
            attributes: [
                ['src', assets.getURI(townshipIcons.health)]
            ],
        });
        const buttonTemplate = createElement('button', {
            className: 'btn btn-sm btn-outline-primary'
        });
        const createButtons = (resource) => {
            const buttons = [];
            const buttonGroup = createElement('div', {
                className: 'btn-group mr-2 mb-1'
            });
            const resourceImg = createElement('img', {
                className: 'skill-icon-xxs ml-1 mr-1',
                attributes: [
                    ['src', resource.media]
                ],
            });
            TownshipUI.increaseHealthOptions.forEach((amount) => {
                const button = buttonTemplate.cloneNode(true);
                const cost = createElement('span', {
                    text: `-${amount}`
                });
                button.append(healthImage.cloneNode(true), `+${amount}`, createElement('span', {
                    className: 'font-size-sm ml-2',
                    text: getLangString('MENU_TEXT_COST')
                }), resourceImg.cloneNode(true), cost);
                button.onclick = () => this.township.increaseHealth(resource, amount);
                buttonGroup.append(button);
                buttons.push({
                    button,
                    cost
                });
            });
            this.defaultElements.div.increaseHealth.append(buttonGroup);
            this.increaseHealthBtns.set(resource, buttons);
        };
        createButtons(herbs);
        createButtons(potions);
    }
    updateIncreaseHealthBtns() {
        this.increaseHealthBtns.forEach((btns, resource) => {
            const baseAmount = this.township.getIncreaseHealthCost(resource);
            btns.forEach(({
                cost
            }, i) => {
                cost.textContent = numberWithCommas(-baseAmount * TownshipUI.increaseHealthOptions[i]);
            });
        });
    }
    updateWorshipChangeCost() {
        const textClass = game.gp.amount >= this.township.WORSHIP_CHANGE_COST ? 'text-success' : 'text-danger';
        this.defaultElements.div.worshipChangeCost.className = `font-w600 ml-2 ${textClass}`;
        this.defaultElements.div.worshipChangeCost.innerHTML = `<img class="skill-icon-xs mr-1" src="${assets.getURI("assets/media/main/coins.png" /* Assets.GPIcon */)}">${formatNumber(this.township.WORSHIP_CHANGE_COST)}`;
    }
    updateTimeToNextUpdate() {
        this.defaultElements.div.timeToNextUpdate.innerText = formatAsShorthandTimePeriod(this.township.timeToNextUpdate, true);
        this.defaultElements.div.timeToNextSeason.innerText = formatAsShorthandTimePeriod(this.township.timeToNextSeason, true);
    }
    updateNextAbyssalWaveSize() {
        if (!game.township.canFightAbyssalWaves)
            return;
        const combatValue = Math.floor(this.township.getModifiedArmourWeaponryValueForAbyssalWave());
        this.defaultElements.div.nextAbyssalWaveSize.innerHTML = `${templateLangString('TOWNSHIP_PROTECTION_VALUE', {
            number: `<strong class="${getRequirementTextClass(combatValue >= this.township.abyssalWaveSize)}">${numberWithCommas(combatValue)}</strong>`,
        })} | ${templateLangString('TOWNSHIP_ABYSSAL_WAVE_SIZE', {
            number: `<strong>${numberWithCommas(this.township.abyssalWaveSize)}</strong>`,
        })}`;
        this.defaultElements.div.abyssalXPOnWin.innerHTML = templateLangString('ABYSSAL_XP_ON_WIN', {
            value: `${numberWithCommas(Math.floor(game.township.modifyAbyssalXP(game.township.getAbyssalXPOnWin())))}`,
        });
    }
    updateSeason() {
        this.defaultElements.div.currenSeasonName.innerText = this.township.townData.season.name;
        this.defaultElements.div.currentSeasonImg.src = this.township.townData.season.media;
    }
    updateLegacyTimeLeft() {
        const element = document.getElementById('TOWNSHIP_TICKS_AVAILABLE');
        if (element === null)
            return;
        element.innerHTML = formatAsSHTimePeriod(this.township.legacyTicks * this.township.LEGACY_TICK_LENGTH * 1000);
    }
    getPageButton(page) {
        switch (page) {
            case 0 /* TownshipPage.Town */ :
                return this.defaultElements.btn.town;
            case 1 /* TownshipPage.Trader */ :
                return this.defaultElements.btn.trader;
            case 2 /* TownshipPage.Tasks */ :
                return this.defaultElements.btn.tasks;
            case 3 /* TownshipPage.ManageStorage */ :
                return this.defaultElements.btn.manageStorage;
        }
    }
    createBtnEvents() {
        this.defaultElements.btn.town.addEventListener('click', () => {
            this.showPage(0 /* TownshipPage.Town */ );
        });
        this.defaultElements.btn.trader.addEventListener('click', () => {
            this.showPage(1 /* TownshipPage.Trader */ );
        });
        this.defaultElements.btn.tasks.addEventListener('click', () => {
            this.showPage(2 /* TownshipPage.Tasks */ );
        });
        this.defaultElements.btn.manageStorage.addEventListener('click', () => {
            this.showPage(3 /* TownshipPage.ManageStorage */ );
        });
    }
    updateLegacyTickButtons() {
        hideElement(this.defaultElements.div.controlTicks);
        if (this.township.legacyTicks > 0) {
            this.updateLegacyTimeLeft();
            this.tickOptions.forEach((time) => {
                const legacyTicks = (time * 3600) / this.township.LEGACY_TICK_LENGTH;
                const button = document.getElementById(`BTN_TICK_${time}`);
                if (button !== null)
                    button.disabled = legacyTicks > this.township.legacyTicks;
            });
        }
    }
    createTickBtns() {
        const tickTimes = [
            getLangString('TOWNSHIP_MENU_TIME_PERIOD_1H'),
            getLangString('TOWNSHIP_MENU_TIME_PERIOD_6H'),
            getLangString('TOWNSHIP_MENU_TIME_PERIOD_12H'),
            getLangString('TOWNSHIP_MENU_TIME_PERIOD_18H'),
            getLangString('TOWNSHIP_MENU_TIME_PERIOD_1D'),
        ];
        let html = `<ul class="nav-main nav-main-horizontal nav-main-horizontal-override">
      <li class="mr-2">
        ${getLangString('MENU_TEXT_TICK')}
        <div class="btn-group m-1">`;
        this.tickOptions.forEach((t, id) => {
            html += `<button class="btn btn-sm btn-outline-info" id="BTN_TICK_${t}" onclick="game.township.spendLegacyTicks(${(t * 3600) / this.township.LEGACY_TICK_LENGTH})">${tickTimes[id]}</button>`;
        });
        html += `</div></li>
    <li class="mr-2"><span class="font-size-sm text-dark font-w300 ml-3">${getLangString('TOWNSHIP_MENU_LEGACY_TIME_REMAINING')} <strong id="TOWNSHIP_TICKS_AVAILABLE"></strong></span></li>
    <li class="mr-2"><span class="font-size-sm text-dark font-w300 ml-3">${templateString(getLangString('TOWNSHIP_MENU_TOWN_TIME_EXISTED'), {
            localTime: `<span class="font-w600" id="TIME_ALIVE">${formatAsSHTimePeriod(this.township.totalTicks * (1000 * game.township.TICK_LENGTH))}</span>`,
        })}</span></li></ul>`;
        this.defaultElements.div.ticks.innerHTML = '';
        this.updateLegacyTickButtons();
    }
    showTownCreationDivs() {
        this.defaultElements.div.worship.classList.remove('d-none');
        this.defaultElements.div.worshipModifiers.classList.remove('d-none');
        this.defaultElements.div.generateTown.classList.remove('d-none');
    }
    hideTownCreationDivs() {
        this.defaultElements.div.worship.classList.add('d-none');
        this.defaultElements.div.worshipModifiers.classList.add('d-none');
        this.defaultElements.div.generateTown.classList.add('d-none');
    }
    hideMainContainerDivs() {
        this.defaultElements.div.passiveTicks.classList.add('d-none');
        this.defaultElements.div.categoryMenu.classList.add('d-none');
        this.defaultElements.div.mainInfo.classList.add('d-none');
        this.defaultElements.div.resources.classList.add('d-none');
        this.defaultElements.div.container.classList.add('d-none');
    }
    showMainContainerDivs() {
        this.defaultElements.div.passiveTicks.classList.remove('d-none');
        this.defaultElements.div.categoryMenu.classList.remove('d-none');
        this.defaultElements.div.mainInfo.classList.remove('d-none');
        this.defaultElements.div.resources.classList.remove('d-none');
        this.defaultElements.div.container.classList.remove('d-none');
    }
    updatePageHighlight(oldPage, newPage) {
        const oldButton = this.getPageButton(oldPage);
        oldButton.classList.remove('township-tab-selected');
        const newButton = this.getPageButton(newPage);
        newButton.classList.add('township-tab-selected');
    }
    showPage(pageID) {
        if (pageID === 1 /* TownshipPage.Trader */ ) {
            const tradingPost = this.township.buildings.getObjectByID("melvorF:Trading_Post" /* TownshipBuildingIDs.Trading_Post */ );
            if (tradingPost === undefined || this.township.countNumberOfBuildings(tradingPost) <= 0)
                return;
        }
        this.updatePageHighlight(this.currentPage, pageID);
        this.currentPage = pageID;
        this.defaultElements.div.town.classList.add('d-none');
        this.defaultElements.div.trader.classList.add('d-none');
        this.defaultElements.div.tasks.classList.add('d-none');
        this.defaultElements.div.manageStorage.classList.add('d-none');
        switch (pageID) {
            case 0 /* TownshipPage.Town */ :
                this.defaultElements.div.town.classList.remove('d-none');
                this.township.renderQueue.townSummary = true;
                break;
            case 1 /* TownshipPage.Trader */ :
                this.township.updateConvertType(this.township.convertType);
                this.defaultElements.div.trader.classList.remove('d-none');
                break;
            case 2 /* TownshipPage.Tasks */ :
                this.defaultElements.div.tasks.classList.remove('d-none');
                break;
            case 3 /* TownshipPage.ManageStorage */ :
                this.updateConvertVisibility();
                this.defaultElements.div.manageStorage.classList.remove('d-none');
                break;
        }
    }
    updateTraderStatus() {
        const tradingPost = this.township.buildings.getObjectByID("melvorF:Trading_Post" /* TownshipBuildingIDs.Trading_Post */ );
        if (tradingPost !== undefined && this.township.countNumberOfBuildings(tradingPost) <= 0) {
            showElement(this.defaultElements.trader.noTradingPost);
            this.defaultElements.trader.trader.classList.remove('text-success');
            this.defaultElements.trader.trader.classList.add('text-danger');
        } else {
            this.defaultElements.trader.trader.classList.add('text-success');
            this.defaultElements.trader.trader.classList.remove('text-danger');
            hideElement(this.defaultElements.trader.noTradingPost);
        }
    }
    addDropdownDivider() {
        return `<div role="separator" class="dropdown-divider"></div>`;
    }
    generateTownBiomeSummarySelection() {
        const container = document.getElementById('TOWNSHIP_BIOME_SELECT_ELEMENTS');
        if (container === null)
            throw new Error(`Error generating township biome select elements. Container does not exist in DOM.`);
        // Create Buttons for each biome
        this.township.biomes.forEach((biome) => {
            const viewButton = new TownshipTownBiomeSelectElement();
            viewButton.setBiome(biome, this.township);
            container.append(viewButton);
            this.townBiomeSelectButtons.set(biome, viewButton);
        });
    }
    updateUpgradeDropdowns() {
        const element = document.getElementsByClassName('upgrade-qty-dropdown');
        for (let i = 0; i < element.length; i++) {
            const dropdown = element[i];
            dropdown.innerText = `${this.township.upgradeQty === -1 ? getLangString('MENU_TEXT_MAX') : this.township.upgradeQty}`;
        }
    }
    /** Callback Method */
    setUpgradeQty(qty) {
        this.township.upgradeQty = qty;
        this.updateAllBuildingUpgradeCosts();
        this.updateUpgradeDropdowns();
    }
    getBuildingCostHTML(building, buildQty) {
        let html = '';
        this.township
            .getBuildingCostsForBiome(building, this.township.currentTownBiome)
            .forEach(({
                resource,
                quantity
            }) => {
                var _a, _b;
                let cost = quantity * buildQty;
                if (resource.type !== TownshipResourceTypeID.Currency)
                    cost = this.township.modifyBuildingResourceCost(cost);
                if (cost > 0) {
                    let currentAmount = 0;
                    switch (resource.id) {
                        case "melvorF:GP" /* TownshipResourceIDs.GP */ :
                            currentAmount = game.gp.amount;
                            break;
                        case "melvorItA:AP" /* TownshipResourceIDs.AP */ :
                            currentAmount = (_b = (_a = game.abyssalPieces) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : 0;
                            break;
                        default:
                            currentAmount = resource.amount;
                            break;
                    }
                    const textClass = currentAmount >= cost ? 'font-w400 text-success' : 'font-w600 text-danger';
                    html += `<li class="${textClass} mr-2"><img class="skill-icon-xxs mr-1" src="${resource.media}">${resource.type === TownshipResourceTypeID.Currency ? formatNumber(cost) : numberWithCommas(cost)}</li>`;
                }
            });
        return html;
    }
    getBuildingRepairCostHTML(building) {
        let html = '';
        const biome = this.township.currentTownBiome;
        let buildingToUseForCosts = building;
        if ((biome === null || biome === void 0 ? void 0 : biome.getBuildingCount(building)) === 0 && building.upgradesFrom !== undefined)
            buildingToUseForCosts = building.upgradesFrom;
        this.township.getBuildingCostsForBiome(buildingToUseForCosts, biome).forEach(({
            resource,
            quantity
        }) => {
            var _a, _b;
            const cost = Math.floor(this.township.getSingleResourceRepairCostForBuilding(building, biome, quantity));
            if (cost > 0) {
                let currentAmount = 0;
                switch (resource.id) {
                    case "melvorF:GP" /* TownshipResourceIDs.GP */ :
                        currentAmount = game.gp.amount;
                        break;
                    case "melvorItA:AP" /* TownshipResourceIDs.AP */ :
                        currentAmount = (_b = (_a = game.abyssalPieces) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : 0;
                        break;
                    default:
                        currentAmount = resource.amount;
                        break;
                }
                const textClass = currentAmount >= cost ? 'font-w400 text-success' : 'font-w600 text-danger';
                html += `<li class="${textClass} mr-2"><img class="skill-icon-xxs mr-1" src="${resource.media}">${resource.type === TownshipResourceTypeID.Currency ? formatNumber(cost) : numberWithCommas(cost)}</li>`;
            }
        });
        return html;
    }
    updateRepairAllCostHTML() {
        const biome = this.township.currentTownBiome;
        if (biome === undefined)
            return;
        const totalCost = this.township.getTotalRepairCosts();
        const biomeCost = this.township.getTotalRepairCostInBiome(biome);
        const totalHTML = this.getRepairAllCostHTML(totalCost);
        const biomeHTML = this.getRepairAllCostHTML(biomeCost);
        const totalEl = document.getElementById('TOWN_REPAIR_ALL_COSTS');
        const biomeEl = document.getElementById('TOWN_REPAIR_ALL_BIOME_COSTS');
        totalEl.innerHTML = totalHTML;
        biomeEl.innerHTML = biomeHTML;
    }
    getRepairAllCostHTML(costs) {
        let html = '';
        costs.forEach((quantity, resource) => {
            var _a, _b;
            if (quantity > 0) {
                let currentAmount = 0;
                switch (resource.id) {
                    case "melvorF:GP" /* TownshipResourceIDs.GP */ :
                        currentAmount = game.gp.amount;
                        break;
                    case "melvorItA:AP" /* TownshipResourceIDs.AP */ :
                        currentAmount = (_b = (_a = game.abyssalPieces) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : 0;
                        break;
                    default:
                        currentAmount = resource.amount;
                        break;
                }
                const textClass = currentAmount >= quantity ? 'font-w400 text-success' : 'font-w600 text-danger';
                html += `<li class="${textClass} mr-2"><img class="skill-icon-xxs mr-1" src="${resource.media}">${resource.type === TownshipResourceTypeID.Currency ? formatNumber(quantity) : numberWithCommas(quantity)}</li>`;
            }
        });
        return html;
    }
    getBuildingProvidesHTML(building, useEfficiency) {
        const biome = this.township.currentTownBiome;
        if (biome === undefined)
            return '';
        let html = '';
        const population = useEfficiency ?
            this.township.getPopulationProvidesForBiome(building, biome) :
            this.township.getBasePopulationProvidesForBiome(building, biome);
        const education = useEfficiency ?
            this.township.getEducationProvidesForBiome(building, biome) :
            this.township.getBaseEducationProvidesForBiome(building, biome);
        const storage = useEfficiency ?
            this.township.getStorageProvidesForBiome(building, biome) :
            this.township.getBaseStorageProvidesForBiome(building, biome);
        const happiness = useEfficiency ?
            this.township.getHappinessProvidesForBiome(building, biome) :
            this.township.getBaseHappinessProvidesForBiome(building, biome);
        const worship = useEfficiency ?
            this.township.getWorshipProvidesForBiome(building, biome) :
            this.township.getBaseWorshipProvidesForBiome(building, biome);
        const fortification = useEfficiency ?
            this.township.getFortificationProvidesForBiome(building, biome) :
            this.township.getBaseFortificationProvidesForBiome(building, biome);
        const soulStorage = useEfficiency ?
            this.township.getSoulStorageProvidesForBiome(building, biome) :
            this.township.getBaseSoulStorageProvidesForBiome(building, biome);
        if (population !== 0) {
            html += `<li class="font-w400 mr-2"><img class="skill-icon-xxs mr-1" src="${assets.getURI(townshipIcons.population)}"><span class="${population > 0 ? 'text-success' : 'text-danger'}">${population > 0 ? '+' : ''}${numberWithCommas(population)}</span></li>`;
        }
        if (fortification !== 0) {
            html += `<li class="font-w400 mr-2"><img class="skill-icon-xxs mr-1" src="${townshipIcons.fortification}"><span class="${fortification > 0 ? 'text-success' : 'text-danger'}">${fortification > 0 ? '+' : ''}${numberWithCommas(fortification)}</span></li>`;
        }
        if (storage !== 0) {
            html += `<li class="font-w400 mr-2"><img class="skill-icon-xxs mr-1" src="${assets.getURI(townshipIcons.storage)}"><span class="${storage > 0 ? 'text-success' : 'text-danger'}">${storage > 0 ? '+' : ''}${numberWithCommas(storage)}</span></li>`;
        }
        if (soulStorage !== 0) {
            html += `<li class="font-w400 mr-2"><img class="skill-icon-xxs mr-1" src="${assets.getURI(townshipIcons.soulStorage)}"><span class="${soulStorage > 0 ? 'text-success' : 'text-danger'}">${soulStorage > 0 ? '+' : ''}${numberWithCommas(soulStorage)}</span></li>`;
        }
        if (happiness !== 0) {
            html += `<li class="font-w400 mr-2"><img class="skill-icon-xxs mr-1" src="${assets.getURI(townshipIcons.happiness)}"><span class="${happiness > 0 ? 'text-success' : 'text-danger'}">${happiness > 0 ? '+' : ''}${numberWithCommas(happiness)}</span></li>`;
        }
        if (education !== 0) {
            html += `<li class="font-w400 mr-2"><img class="skill-icon-xxs mr-1" src="${assets.getURI(townshipIcons.education)}"><span class="${education > 0 ? 'text-success' : 'text-danger'}">${education > 0 ? '+' : ''}${numberWithCommas(education)}</span></li>`;
        }
        if (worship !== 0) {
            html += `<li class="font-w400 mr-2"><img class="skill-icon-xxs mr-1" src="${assets.getURI(townshipIcons.worship)}"><span class="${worship > 0 ? 'text-success' : 'text-danger'}">${worship > 0 ? '+' : ''}${numberWithCommas(worship)}</span></li>`;
        }
        return html;
    }
    getBuildingResourceOutputHTML(building) {
        if (this.township.currentTownBiome === undefined)
            return '';
        let html = '';
        const provides = this.township.getProvidesForBiome(building, this.township.currentTownBiome);
        provides === null || provides === void 0 ? void 0 : provides.resources.forEach((_, resource) => {
            const amount = this.township.currentTownBiome === undefined ?
                0 :
                this.township.getSingleResourceGainAmountInBiome(resource, building, this.township.currentTownBiome, false);
            let textClass = ''; //stays default if no change in value
            if (amount > 0)
                textClass = 'text-success';
            else
                textClass = 'text-danger';
            const textSymbol = amount < 0 ? '' : '+';
            if (amount !== 0) {
                html += `<ul class="nav-main nav-main-horizontal nav-main-horizontal-override font-w400 font-size-xs">
          <li class="mr-2 ${textClass} ${!game.settings.darkMode ? 'rounded bg-light px-1 mb-1' : ''}"><img class="skill-icon-xxs mr-1" src="${resource.media}"> ${textSymbol}${amount.toFixed(2)} /t</li></ul>`;
            }
        });
        return html;
    }
    updateBuilding(building) {
        const buildingInTown = this.buildingsInTown.get(building);
        this.updateBuildingTotalOutput(building);
        if (buildingInTown !== undefined) {
            if (this.township.currentTownBiome !== undefined &&
                building.biomes.includes(this.township.currentTownBiome) &&
                this.township.isBuildingAvailable(building, this.township.currentTownBiome)) {
                buildingInTown.classList.remove('d-none');
            } else
                buildingInTown.classList.add('d-none');
        }
    }
    performBuildingUpgradedUIChanges(building) {
        const upgradesTo = building.upgradesTo;
        if (upgradesTo === undefined) {
            this.updateTownSummaryForBuilding(building);
            return;
        }
        const currentBuildingInTown = this.buildingsInTown.get(building);
        const upgradedBuildingInTown = this.buildingsInTown.get(upgradesTo);
        if (currentBuildingInTown === undefined || upgradedBuildingInTown === undefined)
            return;
        hideElement(currentBuildingInTown);
        showElement(upgradedBuildingInTown);
        this.updateTownSummaryForBuilding(upgradesTo);
        upgradedBuildingInTown.addGlow();
        window.setTimeout(() => {
            upgradedBuildingInTown.removeGlow();
        }, 1500);
    }
    setupTownTooltips() {
        tippy(`#TOWN_POPULATION`, {
            placement: 'top',
            allowHTML: true,
            interactive: false,
            animation: false,
            onShow: (instance) => {
                instance.setContent(this.displayXPInfo());
            },
        });
        tippy(`#TOWN_HAPPINESS`, {
            placement: 'top',
            allowHTML: true,
            interactive: false,
            animation: false,
            onShow(instance) {
                instance.setContent(`<small>${templateLangString('TOWNSHIP_MENU_HAPPINESS_DESC', {
                    value: `${game.township.currentHappiness >= 0
                        ? `+${game.township.currentHappiness}`
                        : game.township.currentHappiness}`,
                })}</small>`);
            },
        });
        tippy(`#TOWN_EDUCATION`, {
            placement: 'top',
            allowHTML: true,
            interactive: false,
            animation: false,
            onShow(instance) {
                instance.setContent(`<small>${templateLangString('TOWNSHIP_MENU_EDUCATION_DESC', {
                    value: `${game.township.currentEducation}`,
                })}</small>`);
            },
        });
        tippy(`#TOWN_HEALTH`, {
            placement: 'top',
            allowHTML: true,
            interactive: false,
            animation: false,
            onShow(instance) {
                instance.setContent(`<div class="mb-2"><small>${getLangString('TOWNSHIP_MENU_HEALTH_DESC_0')}</small></div><div class="mb-2"><small>${getLangString('TOWNSHIP_MENU_HEALTH_DESC_1')}</small></div>
          <div class="mb-2"><small>${getLangString('TOWNSHIP_MENU_HEALTH_DESC_2')}</small></div>`);
            },
        });
        tippy(`#TOWN_WORSHIP`, {
            placement: 'bottom',
            allowHTML: true,
            interactive: false,
            animation: false,
            onShow: (instance) => {
                instance.setContent(this.displayWorshipTooltip());
            },
        });
        tippy(`#TOWN_FORTIFICATION`, {
            placement: 'top',
            allowHTML: true,
            interactive: false,
            animation: false,
            onShow: (instance) => {
                instance.setContent(`<small>${templateLangString('TOWNSHIP_PROTECTED_TOOLTIP', {
                    percent: game.township.currentFortification.toFixed(2),
                })}</small><br><br><small class="font-w600 text-info">${getLangString('TOWNSHIP_FORTIFICATION_TOOLTIP_2')}</small>`);
            },
        });
    }
    displayWorshipTooltip() {
        let tooltip = `<div class="text-center font-size-sm"><small>${getLangString('TOWNSHIP_MENU_ALWAYS_ACTIVE')}<br>${Object.keys(this.township.townData.worship.modifiers).length > 0
            ? describeModifierDataLineBreak(this.township.townData.worship.modifiers)
            : getLangString('TOWNSHIP_MENU_NO_MODIFIERS')}</small></div>`;
        if (this.township.townData.worship.seasonMultiplier.size > 0) {
            this.township.townData.worship.seasonMultiplier.forEach((value, season) => {
                tooltip += `<div class="text-center"><small class="font-w600 text-success">${templateLangString('TOWNSHIP_MENU_SEASON_MULTIPLIER', {
                    value: `${value}`,
                    seasonName: season.name,
                })}`;
            });
        }
        if (this.township.townData.worship.id !== "melvorD:None" /* TownshipWorshipIDs.None */ ) {
            this.township.WORSHIP_CHECKPOINTS.forEach((checkpoint, id) => {
                tooltip += this.addDropdownDivider();
                tooltip += `<div class="text-center font-size-sm"><small>${templateString(getLangString('TOWNSHIP_MENU_AT_PERCENT'), { value: `${checkpoint}` })}<br>${describeModifierDataLineBreak(this.township.townData.worship.checkpoints[id])}</div></small>`;
            });
        }
        return tooltip;
    }
    displayXPInfo() {
        let html = `<small>${templateString(getLangString('TOWNSHIP_MENU_XP_PER_TICK'), {
            value: `<span class="text-warning">${numberWithCommas(Math.floor(this.township.modifyXP(this.township.baseXPRate)))}</span>`,
        })}<br>${getLangString('TOWNSHIP_MENU_XP_PER_TICK_INFO')}</small>`;
        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            html += `<br><br><small class="font-w600 text-danger">${getLangString('MENU_TEXT_TOWNSHIP_ABYSSAL_XP_HINT')}</small>`;
        }
        return html;
    }
    updatePopulation() {
        const html = `<div class="media d-flex align-items-center" style="line-height: 1.15;">
                    <div class="mr-1">
                      <img class="skill-icon-xs mr-1" src="${assets.getURI(townshipIcons.population)}" />
                    </div>
                    <div class="media-body text-left">
                      <div>
                        <small class="font-w600 text-warning">
                          ${getLangString('TOWNSHIP_MENU_POPULATION')}
                        </small>
                      </div>
                      <div>
                        <small class="font-w600 mr-1">
                          ${numberWithCommas(this.township.currentPopulation)}
                        </small>
                      </div>
                    </div>
                  </div>`;
        this.defaultElements.town.population.innerHTML = html;
        this.defaultElements.town.breakdown.population.innerText = numberWithCommas(this.township.currentPopulation);
    }
    updateFortification() {
        const html = `<div class="media d-flex align-items-center" style="line-height: 1.15;">
                    <div class="mr-1">
                      <img class="skill-icon-xs mr-1" src="${townshipIcons.fortification}" />
                    </div>
                    <div class="media-body text-left">
                      <div>
                        <small class="font-w600 text-warning">
                          ${getLangString('FORTIFICATION')}
                        </small>
                      </div>
                      <div>
                        <small class="font-w600 mr-1">
                          ${this.township.currentFortification.toFixed(2)}%
                        </small>
                      </div>
                    </div>
                  </div>`;
        this.defaultElements.town.fortification.innerHTML = html;
        this.defaultElements.town.breakdown.fortification.innerText = this.township.currentFortification.toFixed(2);
        if (!cloudManager.hasItAEntitlementAndIsEnabled) {
            this.defaultElements.town.fortification.classList.add('d-none');
            this.defaultElements.town.breakdown.fortificationDiv.classList.add('d-none');
        } else {
            this.defaultElements.town.fortification.classList.remove('d-none');
            this.defaultElements.town.breakdown.fortificationDiv.classList.remove('d-none');
        }
    }
    updateHappiness() {
        const happiness = templateLangString('MENU_TEXT_PERCENTAGE', {
            value: `${this.township.townData.happiness.toPrecision(3)}`,
        });
        const html = `<div class="media d-flex align-items-center" style="line-height: 1.15;">
                    <div class="mr-1">
                    <img class="skill-icon-xs mr-1" src="${assets.getURI(townshipIcons.happiness)}" />
                    </div>
                    <div class="media-body text-left">
                      <div>
                        <small class="font-w600 text-warning">
                          ${getLangString('TOWNSHIP_MENU_HAPPINESS')}
                        </small>
                      </div>
                      <div>
                        <small class="font-w600 mr-1">
                          ${happiness}
                        </small>
                      </div>
                    </div>
                  </div>`;
        this.defaultElements.town.happiness.innerHTML = html;
        this.defaultElements.town.breakdown.happiness.innerText = happiness;
    }
    updateEducation() {
        const education = templateLangString('MENU_TEXT_PERCENTAGE', {
            value: `${this.township.townData.education.toFixed(2)}`,
        });
        const html = `<div class="media d-flex align-items-center" style="line-height: 1.15;">
                    <div class="mr-1">
                    <img class="skill-icon-xs mr-1" src="${assets.getURI(townshipIcons.education)}" />
                    </div>
                    <div class="media-body text-left">
                      <div>
                        <small class="font-w600 text-warning">
                          ${getLangString('TOWNSHIP_MENU_EDUCATION')}
                        </small>
                      </div>
                      <div>
                        <small class="font-w600 mr-1">
                          ${education}
                        </small>
                      </div>
                    </div>
                  </div>`;
        this.defaultElements.town.education.innerHTML = html;
        this.defaultElements.town.breakdown.education.innerText = education;
    }
    updateHealth() {
        const health = templateLangString('MENU_TEXT_PERCENTAGE', {
            value: `${this.township.townData.health}`,
        });
        const html = `<div class="media d-flex align-items-center" style="line-height: 1.15;">
                    <div class="mr-1">
                    <img class="skill-icon-xs mr-1" src="${assets.getURI(townshipIcons.health)}" />
                    </div>
                    <div class="media-body text-left">
                      <div>
                        <small class="font-w600 text-warning">
                          ${getLangString('TOWNSHIP_MENU_HEALTH')}
                        </small>
                      </div>
                      <div>
                        <small class="font-w600 mr-1">
                          ${health}
                        </small>
                      </div>
                    </div>
                  </div>`;
        this.defaultElements.town.health.innerHTML = html;
        this.defaultElements.town.breakdown.health.innerText = health;
    }
    updateWorship() {
        const html = `<div class="media d-flex align-items-center" style="line-height: 1.15;">
                    <div class="mr-1">
                        <img class="skill-icon-xs mr-1" src="${assets.getURI(townshipIcons.worship)}" />
                    </div>
                    <div class="media-body text-left">
                      <div>
                        <small class="font-w600 text-warning">
                          ${getLangString('TOWNSHIP_MENU_WORSHIP')}
                        </small>
                      </div>
                      <div>
                        <small class="font-w600 mr-1" id="CURRENT_WORSHIP">
                          ${this.getCurrentWorshipSpan()}
                        </small>
                      </div>
                    </div>
                  </div>`;
        this.defaultElements.town.worship.innerHTML = html;
        this.defaultElements.town.breakdown.worship.textContent = this.township.currentWorshipName;
        this.defaultElements.town.breakdown.worshipProgress.innerHTML = this.getCurrentWorshipProgressSpan();
    }
    /** Callback function for when the Change Worship button is clicked */
    showChangeWorshipSelection() {
        this.createWorshipSelection();
        this.updateWorshipChangeCost();
        this.updateWorshipChangeStatus();
        $('#modal-change-worship').modal('show');
    }
    updateWorshipChangeStatus() {
        var _a, _b;
        const disabled = (_b = (_a = this.township.townData.season) === null || _a === void 0 ? void 0 : _a.disableWorshipChange) !== null && _b !== void 0 ? _b : false;
        if (disabled)
            this.defaultElements.div.cannotChangeWorship.classList.remove('d-none');
        else
            this.defaultElements.div.cannotChangeWorship.classList.add('d-none');
    }
    updateWorshipCountSpan() {
        const element = document.getElementById('CURRENT_WORSHIP');
        if (element !== null)
            element.innerHTML = this.getCurrentWorshipSpan();
    }
    getCurrentWorshipSpan() {
        if (this.township.townData.worship.id === "melvorD:None" /* TownshipWorshipIDs.None */ )
            return this.township.currentWorshipName;
        return `<span>${this.township.currentWorshipName} - ${this.getCurrentWorshipProgressSpan()}`;
    }
    getCurrentWorshipProgressSpan() {
        return `${numberWithCommas(this.township.townData.worshipCount)} / ${numberWithCommas(this.township.MAX_WORSHIP)} <span class="font-w400">(${templateLangString('MENU_TEXT_PERCENTAGE', {
            value: `${this.township.worshipPercent.toFixed(1)}`,
        })})</span>`;
    }
    updateTimeAlive() {
        const element = document.getElementById('TIME_ALIVE');
        if (element !== null)
            element.innerText = `${formatAsSHTimePeriod(this.township.totalTicks * (1000 * game.township.TICK_LENGTH))}`;
    }
    createResourceBreakdownTable() {
        const resourceContainer = document.getElementById('TOWNSHIP_RESOURCE_TABLE_ELEMENTS');
        if (resourceContainer === null)
            throw new Error('Resource Container does not exist in DOM.');
        this.township.resourceDisplayOrder.forEach((resource) => {
            const resourceDisplay = new TownshipResourceDisplayElement();
            resourceContainer.append(resourceDisplay);
            resourceDisplay.setResource(resource, this.township);
            this.resourceDisplays.set(resource, resourceDisplay);
        });
    }
    updateStorageBreakdown() {
        const element = document.getElementById('RESOURCE_storage');
        element.innerText = this.getStorageBreakdown();
        this.defaultElements.town.breakdown.storage.textContent = this.getStorageBreakdown();
        this.updateStorageBreakdownColour();
    }
    updateStorageBreakdownColour() {
        const element = document.getElementById('RESOURCE_storage');
        if (this.township.isStorageFull) {
            element.classList.add('text-danger');
            this.defaultElements.town.breakdown.storage.classList.add('text-danger');
            this.defaultElements.notifications.global.noStorage.classList.remove('d-none');
        } else {
            element.classList.remove('text-danger');
            this.defaultElements.town.breakdown.storage.classList.remove('text-danger');
            this.defaultElements.notifications.global.noStorage.classList.add('d-none');
        }
    }
    updateSoulStorageBreakdown() {
        if (!cloudManager.hasItAEntitlementAndIsEnabled) {
            this.defaultElements.town.soulStorage.classList.add('d-none');
            this.defaultElements.town.breakdown.soulStorageDiv.classList.add('d-none');
        } else {
            this.defaultElements.town.soulStorage.classList.remove('d-none');
            this.defaultElements.town.breakdown.soulStorageDiv.classList.remove('d-none');
        }
        const element = document.getElementById('RESOURCE_soulStorage');
        element.innerText = this.getSoulStorageBreakdown();
        this.defaultElements.town.breakdown.soulStorage.textContent = this.getSoulStorageBreakdown();
        this.updateSoulStorageBreakdownColour();
    }
    updateSoulStorageBreakdownColour() {
        const element = document.getElementById('RESOURCE_soulStorage');
        if (this.township.isSoulStorageFull) {
            element.classList.add('text-danger');
            this.defaultElements.town.breakdown.soulStorage.classList.add('text-danger');
            if (cloudManager.hasItAEntitlementAndIsEnabled)
                this.defaultElements.notifications.global.noSoulStorage.classList.remove('d-none');
        } else {
            element.classList.remove('text-danger');
            this.defaultElements.town.breakdown.soulStorage.classList.remove('text-danger');
            this.defaultElements.notifications.global.noSoulStorage.classList.add('d-none');
        }
    }
    getStorageBreakdown() {
        return `${numberWithCommas(Math.floor(this.township.getUsedStorage()))} / ${numberWithCommas(this.township.getMaxStorage())}`;
    }
    getSoulStorageBreakdown() {
        return `${numberWithCommas(Math.floor(this.township.getUsedSoulStorage()))} / ${numberWithCommas(this.township.getMaxSoulStorage())}`;
    }
    updateResourceAmounts() {
        this.township.resources.forEach((resource) => {
            const display = this.resourceDisplays.get(resource);
            if (display !== undefined)
                display.updateResourceAmount(resource, this.township);
            const convert = document.getElementById(`convert-resource-${resource.id}-quantity`);
            if (convert !== null)
                convert.textContent = numberWithCommas(Math.floor(resource.amount));
        });
    }
    updateResourceTickBreakdown() {
        this.township.resources.forEach((resource) => {
            const display = this.resourceDisplays.get(resource);
            if (display === undefined)
                return;
            display.updateResourceRate(resource);
        });
    }
    unhighlightTownBiomeBtn(biome) {
        var _a;
        (_a = this.townBiomeSelectButtons.get(biome)) === null || _a === void 0 ? void 0 : _a.unhighlight(biome);
    }
    highlightTownBiomeBtn(biome) {
        var _a;
        (_a = this.townBiomeSelectButtons.get(biome)) === null || _a === void 0 ? void 0 : _a.highlight(biome);
    }
    shouldShowBuildingInTown(building) {
        return (this.township.currentTownBiome !== undefined &&
            building.biomes.includes(this.township.currentTownBiome) &&
            this.township.isBuildingAvailable(building, this.township.currentTownBiome) &&
            !this.township.hasBuildingBeenUpgraded(building, this.township.currentTownBiome));
    }
    updateTownSummary() {
        this.township.buildingDisplayOrder.forEach((building) => this.updateTownSummaryForBuilding(building));
    }
    updateTownSummaryForBuilding(building) {
        const buildingElement = this.buildingsInTown.get(building);
        if (buildingElement === undefined)
            return;
        if (this.shouldShowBuildingInTown(building)) {
            showElement(buildingElement);
            buildingElement.updateBuildingRequirements(building, this.township);
            const isMaxed = this.township.isBuildingMaxed(building, this.township.currentTownBiome);
            const isUpgradedButNotBuilt = this.township.isBuildingUpgradedButNotBuiltd(building, this.township.currentTownBiome);
            const requiresRepair = this.township.buildingRequiresRepair(building, this.township.currentTownBiome);
            if ((isMaxed || (isUpgradedButNotBuilt && !this.township.canBuildTierOfBuilding(building))) && requiresRepair) {
                buildingElement.showRepairButton();
                buildingElement.showRepairContainer();
                buildingElement.hideBuildButton();
                buildingElement.hideUpgradesToContainer();
            } else {
                buildingElement.hideRepairButton();
                buildingElement.toggleBuildOptions(isMaxed, this.township.canBuildTierOfBuilding(building), requiresRepair);
            }
        } else {
            hideElement(buildingElement);
        }
    }
    updateAllBiomeProgress() {
        this.township.biomes.forEach((biome) => this.updateBiomeProgress(biome));
    }
    updateBiomeProgress(biome) {
        const biomeSelect = this.townBiomeSelectButtons.get(biome);
        biomeSelect === null || biomeSelect === void 0 ? void 0 : biomeSelect.updateProgress(biome, this.township);
    }
    updateAllBiomeRequirements() {
        this.township.biomes.forEach((biome) => this.updateBiomeRequirements(biome));
    }
    updateBiomeRequirements(biome) {
        const biomeSelect = this.townBiomeSelectButtons.get(biome);
        biomeSelect === null || biomeSelect === void 0 ? void 0 : biomeSelect.updateRequirements(biome, this.township);
    }
    updateAllBuildingUpgradeCosts() {
        const biome = this.township.currentTownBiome;
        if (biome === undefined)
            return;
        biome.availableBuildings.forEach((building) => {
            const buildingCount = biome.getBuildingCount(building);
            if (buildingCount >= building.maxUpgrades ||
                (!this.township.canBuildTierOfBuilding(building) &&
                    (buildingCount > 0 || (buildingCount === 0 && building.upgradesFrom !== undefined)) &&
                    this.township.buildingRequiresRepair(building, biome)))
                this.updateBuildingRepairCosts(building);
            else
                this.updateBuildingUpgradeCosts(building);
        });
    }
    updateBuildingUpgradeCosts(building) {
        const buildingInTown = this.buildingsInTown.get(building);
        buildingInTown === null || buildingInTown === void 0 ? void 0 : buildingInTown.updateBuildingUpgradeCosts(building, this.township);
    }
    updateBuildingRepairCosts(building) {
        const buildingInTown = this.buildingsInTown.get(building);
        buildingInTown === null || buildingInTown === void 0 ? void 0 : buildingInTown.updateBuildingRepairCosts(building, this.township);
    }
    updateAllBuildingUpgradeProvides() {
        this.township.buildings.forEach((building) => this.updateBuildingUpgradeProvides(building));
    }
    updateBuildingUpgradeProvides(building) {
        const buildingInTown = this.buildingsInTown.get(building);
        buildingInTown === null || buildingInTown === void 0 ? void 0 : buildingInTown.updateBuildingUpgradeProvides(building, this.township);
    }
    updateAllBuildingUpgradeProgress() {
        this.township.buildings.forEach((building) => this.updateBuildingUpgradeProgress(building));
    }
    updateBuildingUpgradeProgress(building) {
        const buildingInTown = this.buildingsInTown.get(building);
        buildingInTown === null || buildingInTown === void 0 ? void 0 : buildingInTown.updateBuildingProgress(building, this.township.currentTownBiome, this.township);
    }
    updateAllBuildingUpgradeProgressText() {
        this.township.buildings.forEach((building) => this.updateBuildingUpgradeProgressText(building));
    }
    updateBuildingUpgradeProgressText(building) {
        const buildingInTown = this.buildingsInTown.get(building);
        buildingInTown === null || buildingInTown === void 0 ? void 0 : buildingInTown.updateBuildingProgressText(building, this.township.currentTownBiome);
    }
    updateAllBuildingEfficiency() {
        this.township.buildings.forEach((building) => this.updateBuildingEfficiency(building));
    }
    updateBuildingEfficiency(building) {
        const buildingInTown = this.buildingsInTown.get(building);
        buildingInTown === null || buildingInTown === void 0 ? void 0 : buildingInTown.updateBuildingEfficiency(building, this.township);
    }
    updateAllBuildingCurrentProvides() {
        this.township.buildings.forEach((building) => this.updateBuildingCurrentProvides(building));
    }
    updateBuildingCurrentProvides(building) {
        const buildingInTown = this.buildingsInTown.get(building);
        buildingInTown === null || buildingInTown === void 0 ? void 0 : buildingInTown.updateBuildingTotals(building, this.township);
    }
    updateAllBuildingCurrentResourceGeneration() {
        this.township.buildings.forEach((building) => this.updateBuildingCurrentResourceGeneration(building));
    }
    updateBuildingCurrentResourceGeneration(building) {
        const buildingInTown = this.buildingsInTown.get(building);
        buildingInTown === null || buildingInTown === void 0 ? void 0 : buildingInTown.updateResourceTotals(building, this.township);
    }
    updateTownBuildingProvides() {
        this.township.buildingDisplayOrder.forEach((building) => {
            const buildingInTown = this.buildingsInTown.get(building);
            if (buildingInTown === undefined)
                return;
            buildingInTown.updateResourceTotals(building, this.township);
        });
    }
    displayTownSummary() {
        this.generateTownBiomeSummarySelection();
        const buildingContainer = document.getElementById(`ts-town`);
        this.township.buildingDisplayOrder.forEach((building) => {
            const inTownElement = new BuildingInTownElement();
            inTownElement.className = `col-12 col-sm-6 col-xl-4${this.shouldShowBuildingInTown(building) ? '' : ' d-none'}`;
            inTownElement.initQtyDropdowns(this);
            buildingContainer.append(inTownElement);
            inTownElement.setBuilding(building, this.township);
            this.buildingsInTown.set(building, inTownElement);
        });
        this.township.renderQueue.townSummary = true;
    }
    updateAllBuildingNames() {
        this.township.buildings.forEach((building) => {
            var _a, _b;
            (_a = this.buildingsInTown.get(building)) === null || _a === void 0 ? void 0 : _a.setBuildingName(building);
            (_b = this.buildingsInTown.get(building)) === null || _b === void 0 ? void 0 : _b.setBuildingMedia(building);
        });
    }
    updateAllBuildingTotalStatsElements() {
        this.township.buildings.forEach((building) => this.updateBuildingTotalStatsElement(building));
    }
    updateBuildingTotalStatsElement(building) {
        var _a;
        if (!building.providesStats)
            return;
        (_a = this.buildingsInTown.get(building)) === null || _a === void 0 ? void 0 : _a.updateStatsTotals(building);
    }
    updateBuildingTotalOutput(building) {
        const buildingInTown = this.buildingsInTown.get(building);
        if (buildingInTown === undefined)
            return;
        buildingInTown.updateResourceTotals(building, this.township); // Needs to update on modifier change, needs to update on built quantity
        buildingInTown.updateBuildingTotals(building, this.township); // Needs to update on modifier change, needs to update on built quantity
    }
    createWorshipSelection() {
        const container = createElement('div', {
            className: 'row row-deck no-gutters'
        });
        const containerModal = createElement('div', {
            className: 'row row-deck no-gutters'
        });
        this.defaultElements.div.worship.innerHTML = '';
        this.defaultElements.div.worshipModal.innerHTML = '';
        this.defaultElements.div.worship.append(container);
        this.defaultElements.div.worshipModal.append(containerModal);
        this.township.worships.forEach((worship) => {
            if (!worship.isHidden) {
                const worshipButtons = new TownshipWorshipSelectButtonElement();
                const worshipButtonsModal = new TownshipWorshipSelectButtonElement();
                container.append(worshipButtons);
                containerModal.append(worshipButtonsModal);
                worshipButtons.setWorship(worship, this.township);
                worshipButtonsModal.setWorship(worship, this.township);
                this.worshipSelects.set(worship, worshipButtons);
                this.worshipSelectsModal.set(worship, worshipButtonsModal);
                if (worship === this.township.worshipInSelection) {
                    worshipButtons.setSelected();
                    worshipButtonsModal.setSelected();
                } else {
                    worshipButtons.setUnselected();
                    worshipButtonsModal.setUnselected();
                }
            }
        });
        this.updateWorshipSelection();
    }
    updateCurrentWorship() {
        this.defaultElements.div.currentWorshipModal.innerHTML = templateString(getLangString('TOWNSHIP_MENU_CURRENT_WORSHIP'), {
            worship: this.township.currentWorshipName
        });
    }
    isWorshipUnlocked(worship) {
        if (worship.isHidden)
            return false;
        return game.checkRequirements(worship.unlockRequirements, false);
    }
    updateWorshipSelection() {
        this.township.worships.forEach((worship) => {
            if (!worship.isHidden) {
                const worshipElement = this.worshipSelects.get(worship);
                const worshipElementModal = this.worshipSelectsModal.get(worship);
                if (worshipElement === undefined)
                    return;
                if (worshipElementModal === undefined)
                    return;
                if (worship !== this.township.worshipInSelection) {
                    worshipElement.setUnselected();
                    worshipElementModal.setUnselected();
                } else {
                    worshipElement.setSelected();
                    worshipElementModal.setSelected();
                    const modifiers = new TownshipWorshipSelectElement();
                    const modifiersModal = new TownshipWorshipSelectElement();
                    modifiers.setWorship(worship, this.township);
                    modifiersModal.setWorship(worship, this.township);
                    this.defaultElements.div.worshipModifiers.innerHTML = '';
                    this.defaultElements.div.worshipModifiers.append(modifiers);
                    this.defaultElements.div.worshipModifiersModal.innerHTML = '';
                    this.defaultElements.div.worshipModifiersModal.append(modifiersModal);
                }
            }
        });
    }
    buildCapResourceElements() {
        const resourceCapContainer = document.getElementById(`CAP_RESOURCES_DATA`);
        if (resourceCapContainer === null)
            throw new Error(`Error building TownshipUI, resource cap container is not in DOM.`);
        const elements = [];
        const title = createElement('div', {
            text: getLangString('TOWNSHIP_MENU_CAP_RESOURCES'),
            className: 'col-12 font-w600 mb-1',
        });
        elements.push(title);
        this.township.resources.forEach((resource) => {
            if (resource.type === TownshipResourceTypeID.Currency)
                return;
            const capResourceContainer = createElement('div', {
                className: 'col-12 col-xl-6',
            });
            const cap = new TownshipCapResourceElement();
            cap.setResource(resource, this.township);
            cap.initQtyDropdowns(resource, this.township);
            capResourceContainer.append(cap);
            elements.push(capResourceContainer);
            this.capResourceElements.set(resource, cap);
        });
        resourceCapContainer.after(...elements);
    }
    buildYeetItemElement() {
        const yeetContainer = document.getElementById('YEET_RESOURCES_DATA');
        if (yeetContainer === null)
            throw new Error(`Error building TownshipUI, yeet container is not in DOM.`);
        const title = createElement('div', {
            text: getLangString('TOWNSHIP_MENU_YEET_RESOURCES'),
            className: 'col-12 font-w600 mb-1 mt-3',
        });
        yeetContainer.append(title);
        this.township.resources.forEach((resource) => {
            if (resource.type === TownshipResourceTypeID.Currency)
                return;
            const resourceContainer = createElement('ul', {
                className: 'nav-main nav-main-horizontal nav-main-horizontal-override font-w400 font-size-sm mb-2',
            });
            TownshipUI.yeetResourceOptions.forEach((amount) => {
                const yeet = new TownshipYeetElement();
                yeet.setResource(resource, amount, this.township);
                resourceContainer.append(yeet);
            });
            yeetContainer.append(resourceContainer);
        });
    }
    buildConvertItemElements() {
        const jumpToList = document.getElementById('convert-resource-jump-to');
        this.township.convertValues.percentages.forEach((value) => {
            const btn = document.getElementById(`convert-resource-quick-qty-${value}`);
            if (btn !== null) {
                btn.onclick = () => {
                    this.township.convertQtyType = 1 /* TownshipConvertQtyType.Percent */ ;
                    this.township.convertQtyPercent = value;
                };
            }
        });
        const btn = document.getElementById(`convert-resource-quick-qty-all-but-1`);
        if (btn !== null) {
            btn.onclick = () => {
                this.township.convertQtyType = 2 /* TownshipConvertQtyType.AllButOne */ ;
            };
        }
        const toTownshipElement = document.getElementById('CONVERT_RESOURCES_DATA_TO_TOWN');
        this.township.resources.forEach((resource) => {
            if (game.township.getResourceItemConversionsToTownship(resource).length === 0 &&
                game.township.getResourceItemConversionsFromTownship(resource).length === 0)
                return;
            const jumpToResource = new TownshipConversionJumpToElement();
            jumpToResource.setIcon(resource);
            jumpToResource.onclick = () => {
                var _a;
                (_a = document
                    .getElementById(`jump-to-resource-${resource.id}`)) === null || _a === void 0 ? void 0 : _a.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
            };
            jumpToList.append(jumpToResource);
            const titleBlock = createElement('div', {
                className: 'block block-rounded-double bg-combat-inner-dark w-100 p-1',
                id: `jump-to-resource-${resource.id}`,
            });
            const titleImage = createElement('img', {
                className: 'skill-icon-sm mr-2'
            });
            const titleQuantity = createElement('span', {
                className: 'font-w600',
                id: `convert-resource-${resource.id}-quantity`,
            });
            titleImage.src = resource.media;
            titleQuantity.textContent = numberWithCommas(Math.floor(resource.amount));
            titleBlock.append(titleImage, titleQuantity);
            toTownshipElement.append(titleBlock);
            const convertTo = [];
            const convertFrom = [];
            const convertToContainer = createElement('ul', {
                className: 'nav-main nav-main-horizontal nav-main-horizontal-override font-w400 font-size-sm mb-2 convert-to-township',
            });
            const convertFromContainer = createElement('ul', {
                className: 'nav-main nav-main-horizontal nav-main-horizontal-override font-w400 font-size-sm mb-2 convert-from-township',
            });
            toTownshipElement.append(convertToContainer);
            toTownshipElement.append(convertFromContainer);
            game.township.getResourceItemConversionsToTownship(resource).forEach((conversion) => {
                const convertToElem = new TownshipConversionElement();
                convertToContainer.append(convertToElem);
                convertToElem.setItemToResource(resource, conversion, this.township);
                convertTo.push(convertToElem);
            });
            game.township.getResourceItemConversionsFromTownship(resource).forEach((conversion) => {
                const convertFromElem = new TownshipConversionElement();
                convertFromContainer.append(convertFromElem);
                convertFromElem.setItemToResource(resource, conversion, this.township);
                convertFrom.push(convertFromElem);
            });
            this.conversionElements.set(resource, {
                convertTo,
                convertFrom
            });
        });
    }
    updateConvertVisibility() {
        this.township.resources.forEach((resource) => {
            const conversions = this.conversionElements.get(resource);
            if (conversions === undefined)
                return;
            game.township.getResourceItemConversionsToTownship(resource).forEach((conversion, i) => {
                this.township.convertType === 0 /* TownshipConvertType.ToTownship */ ?
                    showElement(conversions.convertTo[i]) :
                    hideElement(conversions.convertTo[i]);
                if (!isRequirementMet(conversion.unlockRequirements)) {
                    conversions.convertTo[i].convertButton.classList.add('bg-trader-locked');
                    conversions.convertTo[i].convertButton.classList.remove('no-bg');
                    conversions.convertTo[i].convertButton.classList.remove('bg-trader-consumable');
                    conversions.convertTo[i].convertButton.classList.remove('bg-trader-special');
                } else if (conversion.item.localID.includes('Consumable_Enhancer')) {
                    conversions.convertTo[i].convertButton.classList.remove('bg-trader-locked');
                    conversions.convertTo[i].convertButton.classList.remove('no-bg');
                    conversions.convertTo[i].convertButton.classList.remove('bg-trader-consumable');
                    conversions.convertTo[i].convertButton.classList.add('bg-trader-special');
                } else if (conversion.item instanceof EquipmentItem) {
                    conversions.convertTo[i].convertButton.classList.remove('bg-trader-locked');
                    conversions.convertTo[i].convertButton.classList.remove('no-bg');
                    conversions.convertTo[i].convertButton.classList.add('bg-trader-consumable');
                    conversions.convertTo[i].convertButton.classList.remove('bg-trader-special');
                } else {
                    conversions.convertTo[i].convertButton.classList.remove('bg-trader-locked');
                    conversions.convertTo[i].convertButton.classList.add('no-bg');
                    conversions.convertTo[i].convertButton.classList.remove('bg-trader-consumable');
                    conversions.convertTo[i].convertButton.classList.remove('bg-trader-special');
                }
            });
            game.township.getResourceItemConversionsFromTownship(resource).forEach((conversion, i) => {
                this.township.convertType === 1 /* TownshipConvertType.FromTownship */ ?
                    showElement(conversions.convertFrom[i]) :
                    hideElement(conversions.convertFrom[i]);
                if (!isRequirementMet(conversion.unlockRequirements)) {
                    conversions.convertFrom[i].convertButton.classList.add('bg-trader-locked');
                    conversions.convertFrom[i].convertButton.classList.remove('no-bg');
                    conversions.convertFrom[i].convertButton.classList.remove('bg-trader-consumable');
                    conversions.convertFrom[i].convertButton.classList.remove('bg-trader-special');
                } else if (conversion.item.localID.includes('Consumable_Enhancer')) {
                    conversions.convertFrom[i].convertButton.classList.remove('bg-trader-locked');
                    conversions.convertFrom[i].convertButton.classList.remove('no-bg');
                    conversions.convertFrom[i].convertButton.classList.remove('bg-trader-consumable');
                    conversions.convertFrom[i].convertButton.classList.add('bg-trader-special');
                } else if (conversion.item instanceof EquipmentItem) {
                    conversions.convertFrom[i].convertButton.classList.remove('bg-trader-locked');
                    conversions.convertFrom[i].convertButton.classList.remove('no-bg');
                    conversions.convertFrom[i].convertButton.classList.add('bg-trader-consumable');
                    conversions.convertFrom[i].convertButton.classList.remove('bg-trader-special');
                } else {
                    conversions.convertFrom[i].convertButton.classList.remove('bg-trader-locked');
                    conversions.convertFrom[i].convertButton.classList.add('no-bg');
                    conversions.convertFrom[i].convertButton.classList.remove('bg-trader-consumable');
                    conversions.convertFrom[i].convertButton.classList.remove('bg-trader-special');
                }
            });
        });
    }
    updateConvertQtyElements() {
        this.township.resources.forEach((resource) => {
            const conversions = this.conversionElements.get(resource);
            if (conversions === undefined)
                return;
            game.township.getResourceItemConversionsToTownship(resource).forEach((conversion, i) => {
                conversions.convertTo[i].updateConvertRatio(resource, conversion, this.township);
            });
            game.township.getResourceItemConversionsFromTownship(resource).forEach((conversion, i) => {
                conversions.convertFrom[i].updateConvertRatio(resource, conversion, this.township);
            });
        });
    }
    showTaskReadyIcon() {
        this.defaultElements.icon.taskReady.classList.remove('d-none');
    }
    hideTaskReadyIcon() {
        this.defaultElements.icon.taskReady.classList.add('d-none');
    }
    updateResourceCapElement(resource) {
        const el = this.capResourceElements.get(resource);
        if (el === undefined)
            return;
        el.setCap(resource);
    }
    /** Callback function for when the Confirm Worship Change button is clicked */
    showChangeWorshipSwal() {
        var _a;
        const worship = this.township.worshipInSelection;
        const canChangeWorship = !((_a = this.township.townData.season) === null || _a === void 0 ? void 0 : _a.disableWorshipChange);
        if (worship === undefined || !canChangeWorship)
            return;
        if (!this.township.canAffordWorshipChange)
            return;
        SwalLocale.fire({
            title: 'Change Worship',
            html: `<div class="font-w600 mb-3 text-warning">${worship.name}</div>
      <div class="font-w600 mb-3">${getLangString('TOWNSHIP_MENU_CHANGE_WORSHIP_DESC_0')}</div>
      <div class="font-w600 text-danger mb-1">${getLangString('TOWNSHIP_MENU_CHANGE_WORSHIP_DESC_1')}</div>
      <div class="font-w600 text-danger mb-3">${getLangString('TOWNSHIP_MENU_CHANGE_WORSHIP_DESC_2')}</div>
      <div class="font-w600 mb-3">${templateLangString('TOWNSHIP_MENU_WORSHIP_CHANGE_COST', {
                gpIcon: `<img class="skill-icon-xxs" src="${assets.getURI("assets/media/main/coins.png" /* Assets.GPIcon */)}">`,
                value: `<span class="${this.township.canAffordWorshipChange ? 'text-success' : 'text-danger'}">${formatNumber(this.township.WORSHIP_CHANGE_COST)}`,
            })}</div>`,
            showCancelButton: true,
            showConfirmButton: this.township.canAffordWorshipChange,
            confirmButtonText: getLangString('MENU_TEXT_CONFIRM'),
            cancelButtonText: getLangString('CHARACTER_SELECT_45'),
        }).then((result) => {
            if (result.value && this.township.canAffordWorshipChange) {
                game.township.confirmWorship();
                game.township.confirmChangeOfWorship();
                game.township.updateForBuildingChange();
                game.township.setTownBiome(game.township.currentTownBiome);
            }
        });
    }
    setTownViewTab(tab) {
        this.hideAllTownViewTabs();
        tab === 0 ? this.showAllTownViewTabs() : this.showTownViewTab(tab);
        let btn = document.getElementById(`township-town-tab-btn-${this.townViewTab}`);
        if (btn !== null)
            btn.classList.replace('btn-primary', 'btn-outline-primary');
        btn = document.getElementById(`township-town-tab-btn-${tab}`);
        if (btn !== null)
            btn.classList.replace('btn-outline-primary', 'btn-primary');
        this.townViewTab = tab;
    }
    hideTownViewTab(tab) {
        const el = document.getElementById(`township-town-tab-${tab}`);
        if (el !== null)
            el.classList.add('d-none');
    }
    showTownViewTab(tab) {
        const el = document.getElementById(`township-town-tab-${tab}`);
        if (el !== null)
            el.classList.remove('d-none');
    }
    showAllTownViewTabs() {
        this.showTownViewTab(0);
        this.showTownViewTab(1);
        this.showTownViewTab(2);
        this.showTownViewTab(3);
    }
    hideAllTownViewTabs() {
        this.hideTownViewTab(0);
        this.hideTownViewTab(1);
        this.hideTownViewTab(2);
        this.hideTownViewTab(3);
    }
    /** Callback function for the Toggle Info Button */
    toggleTownInfo() {
        const el = document.getElementById('TOWN_TABLE');
        if (el !== null)
            el.classList.toggle('d-mobile-none');
    }
    /** Callback function for the Toggle Resources Button */
    toggleTownResources() {
        const el = document.getElementById('RESOURCES_TABLE');
        if (el !== null)
            el.classList.toggle('d-mobile-none');
    }
    updateAllBuildAvailable() {
        this.township.biomes.forEach((biome) => {
            const available = this.township.isBiomeUnlocked(biome) &&
                biome.availableBuildings.some((b) => this.township.isBuildingAvailable(b, biome) &&
                    !this.township.hasBuildingBeenUpgraded(b, biome) &&
                    this.township.canAffordBuilding(b, biome) &&
                    this.township.canBuildTierOfBuilding(b) &&
                    biome.getBuildingCount(b) < b.maxUpgrades &&
                    b.id !== "melvorTotH:Lemvor_Lemon_Stall" /* TownshipBuildingIDs.Lemvor_Lemon_Stall */ );
            const townBiome = this.townBiomeSelectButtons.get(biome);
            if (townBiome !== undefined) {
                available ? townBiome.showBuildAvailable() : townBiome.hideBuildAvailable();
            }
        });
    }
    viewSeasonModifiers(township) {
        let html = `<h5 class="mb-1 font-size-sm font-w400">${getLangString('TOWNSHIP_MENU_CURRENT_SEASON')}</h5><h5 class="mb-3 font-size-sm font-w700 text-warning"><img class="skill-icon-xs mr-1" src="${township.townData.season.media}">${township.townData.season.name}</h5>`;
        township.seasons.forEach((season) => {
            if ((season.id == "melvorF:Nightfall" /* TownshipSeasonIDs.Nightfall */ && this.township.nightfallSeasonEnabled) ||
                (season.id == "melvorF:SolarEclipse" /* TownshipSeasonIDs.SolarEclipse */ && this.township.solarEclipseSeasonEnabled) ||
                (season.id == "melvorAoD:Lemon" /* TownshipSeasonIDs.Lemon */ && this.township.lemonSeasonEnabled) ||
                (season.id == "melvorItA:EternalDarkness" /* TownshipSeasonIDs.EternalDarkness */ && this.township.eternalDarknessSeasonEnabled)) {
                html += `<h5 class="mb-1 font-size-sm font-w400">${templateLangString('TOWNSHIP_MENU_CHANCE_FOR_SEASON', {
                    value: `${this.township.RARE_SEASON_CHANCE}`,
                })}`;
                html += this.getSeasonModifierHTML(season);
            } else if (season.order < 4)
                html += this.getSeasonModifierHTML(season);
        });
        SwalLocale.fire({
            title: getLangString('TOWNSHIP_MENU_SEASON_MODIFIERS'),
            html: html,
        });
    }
    getSeasonModifierHTML(season) {
        let html = '';
        html += `<h5 class="mb-1 font-size-sm font-w700"><img class="skill-icon-xs mr-1" src="${season.media}">${season.name}</h5>`;
        html += `<div class="mb-3 font-size-sm">${season.stats.describeLineBreak()}</div>`;
        return html;
    }
    updateReworkNotification() {
        if (!this.township.displayReworkNotification)
            return;
        const notificationEl = document.getElementById('township-rework-notification');
        notificationEl === null || notificationEl === void 0 ? void 0 : notificationEl.classList.remove('d-none');
        const notification3El = document.getElementById('township-rework-notification-3');
        notification3El.innerHTML = templateLangString('TOWNSHIP_MENU_REWORK_NOTIFICATION_3', {
            value: numberWithCommas(this.township.gpRefunded),
        });
    }
    /** Callback function for the Dismiss button on the rework notification */
    dismissReworkNotification() {
        const notificationEl = document.getElementById('township-rework-notification');
        notificationEl === null || notificationEl === void 0 ? void 0 : notificationEl.classList.add('d-none');
        this.township.displayReworkNotification = false;
    }
}
/** Determines the quantities that health may be increased by using herbs/potions */
TownshipUI.increaseHealthOptions = [1, 5, 10];
TownshipUI.upgradeBuildingOptions = [1, 5, 10, 25, 50, -1];
TownshipUI.yeetResourceOptions = [1, 10, 100, 1000, 10000, 100000, 1000000];
TownshipUI.resourceCapOptions = [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
class TownshipData {
    constructor(township, game) {
        this.township = township;
        this.game = game;
        this.happiness = 0;
        this.education = 0;
        /** Current health percentage in the town */
        this.healthPercent = 0;
        /** Base storage provided by all buildings */
        this.buildingStorage = 0;
        this.worshipCount = 0;
        /** @deprecated Save State Property. Stores the total number of biome sections the user has purchased. Currently used to refund GP costs */
        this.sectionsPurchased = 0;
        /** Save State Property. Stores if the town has been created for the first time. */
        this.townCreated = false;
        /** Stores population. Saving not required */
        this.population = 0;
        /** Save State Property. Stores the ticks remaining until next season. */
        this.seasonTicksRemaining = 72;
        /** Save State Property. Stores health value of town. */
        this.health = 100;
        /** ItA Only: Stores to current fortification of the Town */
        this.fortification = 0;
        /** ItA Only: Save State Property. Stores to current amount of Souls collected */
        this.souls = 0;
        /** ItA Only: Base soul storage provided by all buildings */
        this.soulStorage = 0;
        /** Save State Property. Stores the ticks remaining until next wave of abyssal monsters. */
        this.abyssalWaveTicksRemaining = 24;
        this.worship = township.noWorship;
    }
    encode(writer) {
        writer.writeNamespacedObject(this.worship);
        writer.writeBoolean(this.townCreated);
        writer.writeInt16(this.seasonTicksRemaining);
        writer.writeBoolean(this.season !== undefined);
        if (this.season !== undefined)
            writer.writeNamespacedObject(this.season);
        writer.writeBoolean(this.previousSeason !== undefined);
        if (this.previousSeason !== undefined)
            writer.writeNamespacedObject(this.previousSeason);
        writer.writeInt8(this.health);
        writer.writeInt32(this.souls);
        writer.writeInt16(this.abyssalWaveTicksRemaining);
        return writer;
    }
    decode(reader, version) {
        if (version < 42) {
            reader.getUint32(); // Old Dead Property
            if (reader.getBoolean()) {
                reader.getUint16(); // Old Priority Job
            }
            if (reader.getBoolean()) {
                reader.getUint16(); // Old currentBuildBiome
            }
            this.sectionsPurchased = reader.getUint32();
        }
        const worship = reader.getNamespacedObject(this.township.worships);
        if (typeof worship !== 'string')
            this.worship = worship;
        else if (worship.startsWith('melvor'))
            this.worship = this.township.worships.getDummyObject(worship, DummyTownshipWorship, this.game);
        this.townCreated = reader.getBoolean();
        if (version < 42)
            reader.getUint32(); // Dump biomesUnlocked property
        if (version >= 36 && version < 42)
            reader.getUint32(); // Dump traderStock property
        if (version > 38 && version < 42)
            this.population = reader.getUint32();
        if (version > 43) {
            this.seasonTicksRemaining = reader.getInt16();
            if (version > 49) {
                if (reader.getBoolean())
                    this.season = this.decodeSeason(reader, version);
                if (reader.getBoolean())
                    this.previousSeason = this.decodeSeason(reader, version);
            } else {
                this.season = this.decodeSeason(reader, version);
                this.previousSeason = this.decodeSeason(reader, version);
            }
        }
        if (version > 44) {
            this.health = reader.getInt8();
        }
        if (version >= 100 /* SaveVersion.IntoTheAbyss */ ) {
            this.souls = reader.getInt32();
            this.abyssalWaveTicksRemaining = reader.getInt16();
        }
    }
    decodeSeason(reader, version) {
        const season = reader.getNamespacedObject(this.township.seasons);
        if (typeof season !== 'string') {
            return season;
        } else if (season.startsWith('melvor')) {
            return this.township.seasons.getDummyObject(season, DummyTownshipSeason, this.game);
        } else {
            return undefined;
        }
    }
}
const townshipIcons = {
    population: "assets/media/skills/township/population.png" /* Assets.TownshipPopulation */ ,
    happiness: "assets/media/skills/township/happiness.png" /* Assets.TownshipHappiness */ ,
    education: "assets/media/skills/township/education.png" /* Assets.TownshipEducation */ ,
    health: "assets/media/skills/township/health.png" /* Assets.TownshipHealth */ ,
    storage: "assets/media/skills/township/storage.png" /* Assets.TownshipStorage */ ,
    worship: "assets/media/skills/township/worship.png" /* Assets.TownshipWorship */ ,
    fortification: "assets/media/skills/township/protected.png" /* Assets.TownshipFortification */ ,
    soulStorage: "assets/media/skills/township/soul_storage.png" /* Assets.TownshipSoulStorage */ ,
};
//# sourceMappingURL=township.js.map
checkFileVersion('?12097')