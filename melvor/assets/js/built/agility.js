"use strict";
class BaseAgilityObject extends MasteryAction {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.currencyCosts = [];
        this.modifiers = [];
        try {
            this._name = data.name;
            this.itemCosts = game.items.getQuantities(data.itemCosts);
            if (data.currencyCosts)
                this.currencyCosts = game.getCurrencyQuantities(data.currencyCosts);
            // TODO_D - Deprecated property support
            if (data.gpCost)
                this.currencyCosts.push({
                    currency: game.gp,
                    quantity: data.gpCost
                });
            if (data.scCost)
                this.currencyCosts.push({
                    currency: game.slayerCoins,
                    quantity: data.scCost
                });
            if (data.combatEffects !== undefined)
                this.combatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(data.combatEffects);
            const course = game.agility.courses.get(this.realm);
            if (course === undefined)
                throw new Error(`No course exists for realm with id: "${this.realm.id}".`);
            this.course = course;
        } catch (e) {
            throw new DataConstructionError(BaseAgilityObject.name, e, this.id);
        }
    }
    /** If this object has a negative modifier or effect applicatoe */
    get hasNegativeModifiers() {
        return this.modifiers.some((modifier) => modifier.isNegative);
    }
    registerSoftDependencies(data, game) {
        try {
            this.modifiers = game.getModifierValuesFromData(data.modifiers);
            if (data.enemyModifiers !== undefined)
                this.enemyModifiers = game.getEnemyModifierValuesFromData(data.enemyModifiers);
        } catch (e) {
            throw new DataConstructionError(BaseAgilityObject.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        var _a;
        try {
            if (data.itemCosts !== undefined) {
                this.itemCosts = game.items.modifyQuantities(this.itemCosts, data.itemCosts);
            }
            if (data.currencyCosts !== undefined) {
                this.currencyCosts = game.modifyCurrencyQuantities(this.currencyCosts, data.currencyCosts);
            }
            if (data.modifiers !== undefined) {
                this.modifiers = game.modifyModifierValues(this.modifiers, data.modifiers);
            }
            if (data.combatEffects !== undefined) {
                if (this.combatEffects === undefined) {
                    if (data.combatEffects.add !== undefined)
                        this.combatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(data.combatEffects.add);
                } else {
                    game.modifyCombatEffectApplicators((_a = this.combatEffects) !== null && _a !== void 0 ? _a : [], data.combatEffects, BaseAgilityObject.name);
                }
            }
            if (data.enemyModifiers !== undefined) {
                if (this.enemyModifiers === undefined) {
                    if (data.enemyModifiers.add !== undefined)
                        this.enemyModifiers = game.getEnemyModifierValuesFromData(data.enemyModifiers.add);
                } else {
                    this.enemyModifiers = game.modifyModifierValues(this.enemyModifiers, data.enemyModifiers);
                }
            }
        } catch (e) {
            throw new DataModificationError(BaseAgilityObject.name, e, this.id);
        }
    }
}
class AgilityObstacle extends BaseAgilityObject {
    constructor(namespace, data, game) {
        var _a, _b;
        super(namespace, data, game);
        this.level = 0;
        this.abyssalLevel = 0;
        this.skillRequirements = [];
        this.currencyRewards = [];
        try {
            this._media = data.media;
            this.category = data.category;
            this.baseInterval = data.baseInterval;
            this.baseExperience = data.baseExperience;
            if (data.currencyRewards)
                this.currencyRewards = game.getCurrencyQuantities(data.currencyRewards);
            // TODO_D - Deprecated property support
            if (data.gpReward)
                this.currencyRewards.push({
                    currency: game.gp,
                    quantity: data.gpReward
                });
            if (data.scReward)
                this.currencyRewards.push({
                    currency: game.slayerCoins,
                    quantity: data.scReward
                });
            this.itemRewards = game.items.getQuantities(data.itemRewards);
            this.level = this.slot.level;
            this.abyssalLevel = (_a = this.slot.abyssalLevel) !== null && _a !== void 0 ? _a : 0;
            this.baseAbyssalExperience = (_b = data.baseAbyssalExperience) !== null && _b !== void 0 ? _b : 0;
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(AgilityObstacle.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`AGILITY_OBSTACLE_NAME_${this.localID}`);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    /** If this obstacle has been built in its course */
    get isBuilt() {
        return this.course.builtObstacles.get(this.category) === this;
    }
    get slot() {
        return this.course.obstacleSlots[this.category];
    }
    registerSoftDependencies(data, game) {
        super.registerSoftDependencies(data, game);
        try {
            this.skillRequirements = this.getSkillRequirements(data.skillRequirements, game);
        } catch (e) {
            throw new DataConstructionError(AgilityObstacle.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            if (data.category !== undefined)
                this.category = data.category;
            if (data.baseInterval !== undefined)
                this.baseInterval = data.baseInterval;
            if (data.skillRequirements !== undefined) {
                if (data.skillRequirements.remove !== undefined) {
                    const removals = data.skillRequirements.remove;
                    this.skillRequirements = this.skillRequirements.filter((req) => !removals.includes(req.skill.id));
                }
                if (data.skillRequirements.add !== undefined) {
                    this.skillRequirements.push(...this.getSkillRequirements(data.skillRequirements.add, game));
                }
            }
            if (data.baseExperience !== undefined)
                this.baseExperience = data.baseExperience;
            if (data.currencyRewards !== undefined) {
                this.currencyRewards = game.modifyCurrencyQuantities(this.currencyRewards, data.currencyRewards);
            }
            if (data.itemRewards !== undefined) {
                this.itemRewards = game.items.modifyQuantities(this.itemRewards, data.itemRewards);
            }
            if (data.baseAbyssalExperience !== undefined)
                this.baseAbyssalExperience = data.baseAbyssalExperience;
        } catch (e) {
            throw new DataModificationError(AgilityObstacle.name, e, this.id);
        }
    }
    getSkillRequirements(reqData, game) {
        return reqData.map((data) => {
            if (data.type === 'SkillLevel')
                return new SkillLevelRequirement(data, game);
            else
                return new AbyssalLevelRequirement(data, game);
        });
    }
}
class DummyObstacle extends AgilityObstacle {
    get name() {
        return `Full Version Only Obstacle.`;
    }
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            name: '',
            itemCosts: [],
            modifiers: {},
            media: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
            category: 0,
            baseInterval: -1,
            skillRequirements: [],
            baseExperience: -1,
            itemRewards: [],
        }, game);
    }
}
class AgilityPillar extends BaseAgilityObject {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.category = data.slot;
        game.queueForSoftDependencyReg(data, this);
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`AGILITY_PILLAR_NAME_${this.localID}`);
        }
    }
    get media() {
        return ''; // No media exists for agility pillars at this time
    }
    /** If this pillar has been built in its course */
    get isBuilt() {
        return this.course.builtPillars.get(this.category) === this;
    }
    get slot() {
        return this.course.pillarSlots[this.category];
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        if (data.slot !== undefined)
            this.category = data.slot;
    }
    static getPillarType(slot) {
        if (slot.nameLang !== undefined)
            return getLangString(slot.nameLang);
        return slot.name;
    }
}
class DummyPillar extends AgilityPillar {
    get name() {
        return 'Full Version Only Pillar';
    }
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            name: '',
            itemCosts: [],
            modifiers: {},
            slot: 0,
        }, game);
    }
}
class AgilityCourse {
    constructor(data, game) {
        /** Map of obstacle tier to the obstacle currently built in the slot */
        this.builtObstacles = new Map();
        /** Map of pillar tier to the pillar currently built in the slot */
        this.builtPillars = new Map();
        /** Stores blueprints for this course */
        this.blueprints = new Map();
        /** The maximum number of obstacles that the player can build */
        this.maxObstacles = 0;
        /** The current number of obstacles the player has unlocked in this course */
        this.numObstaclesUnlocked = 0;
        this.obstacleSlots = data.obstacleSlots;
        this.pillarSlots = data.pillarSlots;
    }
    /** Returns the number of sequentially built obstacles in the course */
    get activeObstacleCount() {
        let num = 0;
        for (let tier = 0; tier < this.numObstaclesUnlocked; tier++) {
            if (this.builtObstacles.get(tier) === undefined)
                break;
            num++;
        }
        return num;
    }
    postDataRegistration(agility) {
        this.maxObstacles = this.obstacleSlots.reduce((total, slot) => {
            if (slot.level <= agility.maxLevelCap &&
                (slot.abyssalLevel === undefined || slot.abyssalLevel <= agility.maxAbyssalLevelCap))
                total++;
            return total;
        }, 0);
    }
    /** Recomputes the number of obstacles the player has unlocked in this course */
    computeNumUnlockedObstacles(agility) {
        let numObstacles = this.obstacleSlots.findIndex((slot) => slot.level > agility.level || (slot.abyssalLevel !== undefined && slot.abyssalLevel > agility.abyssalLevel));
        if (numObstacles === -1)
            numObstacles = this.obstacleSlots.length;
        this.numObstaclesUnlocked = numObstacles;
    }
    /** Returns the skill level required to build an obstacle in the given category */
    getObstacleLevel(category) {
        return this.obstacleSlots[category].level;
    }
    /** Returns the abyssal skill level required to build an obstacle in the given category */
    getObstacleAbyssalLevel(category) {
        var _a, _b;
        return (_b = (_a = this.obstacleSlots[category]) === null || _a === void 0 ? void 0 : _a.abyssalLevel) !== null && _b !== void 0 ? _b : 0;
    }
}
class Agility extends GatheringSkill {
    constructor(namespace, game) {
        super(namespace, 'Agility', game, AgilityObstacle.name);
        this._media = "assets/media/skills/agility/agility.png" /* Assets.Agility */ ;
        /** Determines the maximum number of blueprints allowed per course */
        this.maxBlueprints = 5;
        this.renderQueue = new AgilityRenderQueue();
        /** Map of obstacles to the number of times they have been built */
        this.obstacleBuildCount = new Map();
        /** Index of builtObstacles that is currently active */
        this.currentlyActiveObstacle = -1;
        /** Agility Courses that exist. Only one can exist per realm. */
        this.courses = new Map();
        this.pillars = new NamespaceRegistry(game.registeredNamespaces, AgilityPillar.name);
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    get actionInterval() {
        return this.getObstacleInterval(this.activeObstacle);
    }
    get actionLevel() {
        return this.activeObstacle.level;
    }
    get masteryAction() {
        return this.activeObstacle;
    }
    /** Gets the currently active course based on the selected realm */
    get activeCourse() {
        const course = this.courses.get(this.currentRealm);
        if (course === undefined)
            throw new Error('Agility course does not exist for currently selected realm');
        return course;
    }
    /** Gets the currently active obstacle */
    get activeObstacle() {
        const obstacle = this.activeCourse.builtObstacles.get(this.currentlyActiveObstacle);
        if (obstacle === undefined)
            throw new Error('Tried to get active obstacle, but none is built.');
        return obstacle;
    }
    registerData(namespace, data) {
        var _a, _b, _c;
        (_a = data.courses) === null || _a === void 0 ? void 0 : _a.forEach((data) => {
            const realm = this.game.realms.getObjectByID(data.realm);
            if (realm === undefined)
                throw new Error(`Error registering AgilityCourse. Realm with ID: ${data.realm} is not registered.`);
            if (this.courses.has(realm))
                throw new Error(`Error registering AgilityCourse. Course already exists for realm ${realm.id}`);
            this.courses.set(realm, new AgilityCourse(data, this.game));
        });
        this.game.realms.forEach((realm) => {
            if (this.courses.get(realm) === undefined) {
                const emptyData = {
                    realm: realm.id,
                    obstacleSlots: [],
                    pillarSlots: [],
                };
                this.courses.set(realm, new AgilityCourse(emptyData, this.game));
            }
        });
        (_b = data.obstacles) === null || _b === void 0 ? void 0 : _b.forEach((data) => {
            this.actions.registerObject(new AgilityObstacle(namespace, data, this.game));
        });
        super.registerData(namespace, data);
        (_c = data.pillars) === null || _c === void 0 ? void 0 : _c.forEach((data) => {
            this.pillars.registerObject(new AgilityPillar(namespace, data, this.game));
        });
    }
    modifyData(data) {
        var _a, _b;
        super.modifyData(data);
        (_a = data.obstacles) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const obstacle = this.actions.getObjectByID(modData.id);
            if (obstacle === undefined)
                throw new UnregisteredDataModError(AgilityObstacle.name, modData.id);
            obstacle.applyDataModification(modData, this.game);
        });
        (_b = data.pillars) === null || _b === void 0 ? void 0 : _b.forEach((modData) => {
            const pillar = this.pillars.getObjectByID(modData.id);
            if (pillar === undefined)
                throw new UnregisteredDataModError(AgilityPillar.name, modData.id);
            pillar.applyDataModification(modData, this.game);
        });
    }
    postDataRegistration() {
        super.postDataRegistration();
        // Compute maximum number of obstacle tiers
        this.courses.forEach((course) => course.postDataRegistration(this));
        // Set up sorted mastery
        this.sortedMasteryActions = this.actions.allObjects.sort((a, b) => a.category - b.category);
        // Set up milestones
        this.courses.forEach((course) => {
            for (let tier = 0; tier < course.maxObstacles; tier++) {
                const slot = course.obstacleSlots[tier];
                if (slot.abyssalLevel !== undefined) {
                    this.abyssalMilestones.push(new AgilityObstacleMilestone(tier, course));
                } else {
                    this.milestones.push(new AgilityObstacleMilestone(tier, course));
                }
            }
            course.pillarSlots.forEach((slot, tier) => {
                if (slot.abyssalLevel !== undefined) {
                    this.abyssalMilestones.push(new AgilityPillarMilestone(this, tier, course));
                } else if (this.maxLevelCap >= slot.level)
                    this.milestones.push(new AgilityPillarMilestone(this, tier, course));
            });
        });
        this.sortMilestones();
    }
    /** Determines if the level requirements have been met for an agility obstacle/pillar slot */
    isSlotUnlocked(slot) {
        return this.level >= slot.level && (slot.abyssalLevel === undefined || this.abyssalLevel >= slot.abyssalLevel);
    }
    /** Gets the total number of times the player has built an obstacle */
    getObstacleBuildCount(obstacle) {
        var _a;
        return (_a = this.obstacleBuildCount.get(obstacle)) !== null && _a !== void 0 ? _a : 0;
    }
    getObstacleBuildCosts(obstacle) {
        const costs = new Costs(this.game);
        this.addSingleObstacleBuildCost(obstacle, costs);
        costs.setSource(`Skill.${this.id}.BuildObstacle.${obstacle.id}`);
        return costs;
    }
    addSingleObstacleBuildCost(obstacle, costs) {
        obstacle.currencyCosts.forEach(({
            currency,
            quantity
        }) => {
            const costModifier = this.getObstacleCostModifier(obstacle, currency);
            costs.addCurrency(currency, Math.floor(quantity * (1 + costModifier / 100)));
        });
        const itemCostModifier = this.getObstacleItemCostModifier(obstacle);
        obstacle.itemCosts.forEach(({
            item,
            quantity
        }) => {
            const costQty = Math.floor(quantity * (1 + itemCostModifier / 100));
            if (costQty > 0)
                costs.addItem(item, costQty);
        });
    }
    getPillarBuildCosts(pillar) {
        const costs = new Costs(this.game);
        this.addSinglePillarBuildCost(pillar, costs);
        costs.setSource(`Skill.${this.id}.BuildPillar.${pillar.id}`);
        return costs;
    }
    addSinglePillarBuildCost(pillar, costs) {
        const costModifier = this.game.modifiers.getValue("melvorD:agilityPillarCost" /* ModifierIDs.agilityPillarCost */ , this.getActionModifierQuery(pillar));
        pillar.currencyCosts.forEach(({
            currency,
            quantity
        }) => {
            costs.addCurrency(currency, Math.floor(quantity * (1 + costModifier / 100)));
        });
        pillar.itemCosts.forEach(({
            item,
            quantity
        }) => {
            const costQty = Math.floor(quantity * (1 + costModifier / 100));
            if (costQty > 0)
                costs.addItem(item, costQty);
        });
    }
    /** Returns the total number of obstacles that have ever been built */
    getTotalObstacleBuiltCount() {
        let total = 0;
        this.obstacleBuildCount.forEach((count) => {
            total += count;
        });
        return total;
    }
    /** Gets the interval required to complete an obstacle */
    getObstacleInterval(obstacle) {
        return this.modifyInterval(obstacle.baseInterval, obstacle);
    }
    getXPModifier(masteryAction) {
        let modifier = super.getXPModifier(masteryAction);
        if (masteryAction !== undefined && masteryAction.hasNegativeModifiers) {
            modifier += this.game.modifiers.xpFromNegativeObstacles;
        }
        return modifier;
    }
    _buildXPSources(action) {
        const builder = super._buildXPSources(action);
        if (action instanceof AgilityObstacle && action.hasNegativeModifiers) {
            builder.addSources("melvorD:xpFromNegativeObstacles" /* ModifierIDs.xpFromNegativeObstacles */ );
        }
        return builder;
    }
    getCurrencyModifier(currency, obstacle) {
        let modifier = super.getCurrencyModifier(currency, obstacle);
        const query = this.getCurrencyModifierQuery(currency, obstacle);
        if (obstacle.hasNegativeModifiers) {
            modifier += this.game.modifiers.getValue("melvorD:currencyGainFromNegativeObstacles" /* ModifierIDs.currencyGainFromNegativeObstacles */ , query);
        }
        modifier +=
            obstacle.course.activeObstacleCount *
            this.game.modifiers.getValue("melvorD:currencyGainFromAgilityPerActiveObstacle" /* ModifierIDs.currencyGainFromAgilityPerActiveObstacle */ , query);
        return modifier;
    }
    getMasteryXPModifier(action) {
        let modifier = super.getMasteryXPModifier(action);
        if (action.hasNegativeModifiers) {
            modifier += this.game.modifiers.masteryXPFromNegativeObstacles;
        }
        return modifier;
    }
    _buildMasteryXPSources(action) {
        const builder = super._buildMasteryXPSources(action);
        if (action instanceof AgilityObstacle && action.hasNegativeModifiers) {
            builder.addSources("melvorD:masteryXPFromNegativeObstacles" /* ModifierIDs.masteryXPFromNegativeObstacles */ );
        }
        return builder;
    }
    /** Gets the negative multiplier for an obstacles negative modifiers/effect applicators */
    getObstacleNegMult(obstacle, checkSelfModifiers = false) {
        const query = this.getActionModifierQuery(obstacle);
        let modifier = this.game.modifiers.getValue("melvorD:halveAgilityObstacleNegatives" /* ModifierIDs.halveAgilityObstacleNegatives */ , query);
        if (checkSelfModifiers) {
            modifier += this.providedStats.modifiers.getValue("melvorD:halveAgilityObstacleNegatives" /* ModifierIDs.halveAgilityObstacleNegatives */ , query);
        }
        let negMult = modifier > 0 ? 0.5 : 1;
        if (this.hasMasterRelic(this.game.defaultRealm))
            negMult = 0;
        return negMult;
    }
    getObstacleCostModifier(obstacle, currency) {
        const query = this.getActionModifierQuery(obstacle);
        let modifier = this.game.modifiers.getValue("melvorD:agilityObstacleCost" /* ModifierIDs.agilityObstacleCost */ , query);
        if (currency !== undefined) {
            const query = this.getCurrencyModifierQuery(currency, obstacle);
            modifier += this.game.modifiers.getValue("melvorD:agilityObstacleCurrencyCost" /* ModifierIDs.agilityObstacleCurrencyCost */ , query);
        }
        const cap = this.game.modifiers.agilityItemCostReductionCanReach100 > 0 ? 100 : 95;
        return Math.max(modifier, -cap);
    }
    getObstacleItemCostModifier(obstacle) {
        let modifier = this.getObstacleCostModifier(obstacle);
        const query = this.getActionModifierQuery(obstacle);
        modifier += this.game.modifiers.getValue("melvorD:agilityObstacleItemCost" /* ModifierIDs.agilityObstacleItemCost */ , query);
        // Build Count Bonus: -4% per build, up to 10
        let buildCount = this.obstacleBuildCount.get(obstacle);
        if (buildCount !== undefined) {
            buildCount = Math.min(buildCount, 10);
            modifier -= 4 * buildCount;
        }
        const cap = this.game.modifiers.agilityItemCostReductionCanReach100 > 0 ? 100 : 95;
        return Math.max(modifier, -cap);
    }
    preAction() {}
    get actionRewards() {
        const rewards = new Rewards(this.game);
        rewards.setSource(`Skill.${this.id}.ObstacleAction.${this.activeObstacle.id}`);
        rewards.setActionInterval(this.actionInterval);
        const obstacle = this.activeObstacle;
        const actionEvent = new AgilityActionEvent(this, obstacle);
        rewards.addXP(this, obstacle.baseExperience, obstacle);
        rewards.addAbyssalXP(this, obstacle.baseAbyssalExperience, obstacle);
        if (obstacle.currencyRewards.length > 0) {
            obstacle.currencyRewards.forEach(({
                currency,
                quantity
            }) => {
                quantity = this.modifyCurrencyReward(currency, quantity, obstacle);
                rewards.addCurrency(currency, quantity);
            });
        }
        if (obstacle.itemRewards.length > 0) {
            obstacle.itemRewards.forEach(({
                item,
                quantity
            }) => {
                quantity = this.modifyPrimaryProductQuantity(item, quantity, obstacle);
                rewards.addItem(item, quantity);
                this.addCurrencyFromPrimaryProductGain(rewards, item, quantity, obstacle);
                this.game.stats.Agility.add(AgilityStats.ItemsEarned, quantity);
            });
        }
        this.addCommonRewards(rewards, obstacle);
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    start() {
        if (!this.game.currentGamemode.enableInstantActions || this.currentlyActiveObstacle < 0)
            this.currentlyActiveObstacle = 0;
        this.renderQueue.obstacleHighlights.add(this.currentlyActiveObstacle);
        this.renderQueue.startButtons = true;
        return super.start();
    }
    onStop() {
        this.renderQueue.obstacleHighlights.add(this.currentlyActiveObstacle);
        if (!this.game.currentGamemode.enableInstantActions)
            this.currentlyActiveObstacle = -1;
        this.renderQueue.startButtons = true;
    }
    postAction() {
        const course = this.activeCourse;
        // Perform tracking/rendering for current obstacle
        this.renderQueue.obstacleHighlights.add(this.currentlyActiveObstacle); // Remove Highlight
        this.game.stats.Agility.inc(AgilityStats.ObstaclesCompleted);
        this.game.stats.Agility.add(AgilityStats.TimeSpent, this.currentActionInterval);
        this.renderQueue.obstacleRates = true;
        // Transition to next obstacle
        this.currentlyActiveObstacle++;
        const nextObstacle = course.builtObstacles.get(this.currentlyActiveObstacle);
        if (nextObstacle === undefined ||
            nextObstacle instanceof DummyObstacle ||
            this.currentlyActiveObstacle >= course.numObstaclesUnlocked) {
            this.currentlyActiveObstacle = 0;
            this.game.stats.Agility.inc(AgilityStats.CoursesCompleted);
        }
        this.renderQueue.obstacleHighlights.add(this.currentlyActiveObstacle); // Add Highlight
    }
    get masteryModifiedInterval() {
        return this.actionInterval;
    }
    onMasteryLevelUp(action, oldLevel, newLevel) {
        super.onMasteryLevelUp(action, oldLevel, newLevel);
        if (newLevel >= 99 && action.isBuilt) {
            this.renderQueue.obstacleModifiers = true;
            this.computeProvidedStats();
        }
    }
    /** Constructs a new AgilityBlueprintData object */
    createNewBlueprint() {
        return {
            name: getLangString('SLOT_EMPTY'),
            obstacles: new Map(),
            pillars: new Map(),
        };
    }
    loadBlueprints() {
        this.setupBlueprints();
        this.updateBlueprintNames();
    }
    updateBlueprintNames() {
        const course = this.activeCourse;
        for (let i = 0; i < this.maxBlueprints; i++) {
            const blueprint = course.blueprints.get(i);
            document.querySelectorAll(`#agility-blueprint-name-${i}`).forEach((el) => {
                if (blueprint !== undefined && blueprint.obstacles.size > 0) {
                    el.textContent = blueprint.name;
                    el.classList.add('text-warning');
                    el.classList.remove('text-success');
                } else {
                    el.textContent = getLangString('SLOT_EMPTY');
                    el.classList.remove('text-warning');
                    el.classList.add('text-success');
                }
            });
            document.querySelectorAll(`#agility-blueprint-realm-${i}`).forEach((el) => {
                const imgEl = el;
                imgEl.src = this.currentRealm.media;
                this.game.unlockedRealms.length > 1 ? imgEl.classList.remove('d-none') : imgEl.classList.add('d-none');
            });
        }
    }
    setupBlueprints() {
        for (let i = 0; i < this.maxBlueprints; i++) {
            this.courses.forEach((course) => {
                if (!course.blueprints.has(i))
                    course.blueprints.set(i, this.createNewBlueprint());
            });
            // Set Save/Load button callbacks
            document.getElementById(`agility-save-blueprint-button-${i}`).onclick = () => this.nameBlueprintSwal(i);
            document.getElementById(`agility-load-blueprint-button-${i}`).onclick = () => this.loadBlueprint(i);
        }
    }
    nameBlueprintSwal(index) {
        Swal.fire({
            title: getLangString('MENU_TEXT_NAME_BLUEPRINT'),
            input: 'text',
            inputAttributes: {
                autocapitalize: 'off',
                maxLength: '20',
            },
            showCancelButton: true,
            confirmButtonText: getLangString('MENU_TEXT_CONFIRM'),
            cancelButtonText: getLangString('CHARACTER_SELECT_45'),
            customClass: {
                input: 'text-combat-smoke'
            },
        }).then((result) => {
            if (result.isConfirmed) {
                result.value == '' || typeof result.value !== 'string' ?
                    this.saveBlueprint(index, 'No name') :
                    this.saveBlueprint(index, result.value);
            }
        });
    }
    saveBlueprint(index, name) {
        const course = this.activeCourse;
        const blueprint = course.blueprints.get(index);
        if (blueprint === undefined)
            throw new Error('Blueprint is undefined. Game not loaded correctly?');
        for (let i = 0; i < course.maxObstacles; i++) {
            const builtObstacle = course.builtObstacles.get(i);
            if (builtObstacle !== undefined)
                blueprint.obstacles.set(i, builtObstacle);
            else
                blueprint.obstacles.delete(i);
        }
        course.pillarSlots.forEach((_, i) => {
            const builtPillar = course.builtPillars.get(i);
            if (builtPillar !== undefined)
                blueprint.pillars.set(i, builtPillar);
            else
                blueprint.pillars.delete(i);
        });
        blueprint.name = name;
        this.updateBlueprintNames();
        this.game.combat.notifications.add({
            type: 'Player',
            args: [this.game.agility, getLangString('MENU_TEXT_BLUEPRINT_SAVED'), 'success'],
        });
        console.log('Blueprint saved');
    }
    loadBlueprint(index) {
        const course = this.activeCourse;
        const blueprint = course.blueprints.get(index);
        if (blueprint !== undefined && blueprint.obstacles.size > 0)
            this.displayBlueprintSwal(blueprint);
    }
    getBlueprintCostToBuild(blueprint) {
        const costs = new Costs(this.game);
        costs.setSource(`Skill.${this.id}.BuildBlueprint`);
        blueprint.obstacles.forEach((obstacle) => {
            if (!obstacle.isBuilt)
                this.addSingleObstacleBuildCost(obstacle, costs);
        });
        blueprint.pillars.forEach((pillar) => {
            if (!pillar.isBuilt)
                this.addSinglePillarBuildCost(pillar, costs);
        });
        return costs;
    }
    displayBlueprintObstacleNames(blueprint) {
        const course = this.activeCourse;
        const element = createElement('div', {
            className: 'font-size-sm mb-1'
        });
        for (let tier = 0; tier < course.maxObstacles; tier++) {
            let obstacleName = getLangString('NO_OBSTACLE');
            let className;
            const obstacle = blueprint.obstacles.get(tier);
            if (obstacle !== undefined) {
                obstacleName = obstacle.name;
                className = obstacle.isBuilt ? 'text-success' : 'text-white';
            } else
                className = 'text-danger font-w600';
            const obstacleElement = createElement('span', {
                text: obstacleName,
                className,
            });
            element.appendChild(obstacleElement);
            if (tier < course.maxObstacles - 1) {
                const join = createElement('span', {
                    text: ` -> `,
                });
                element.appendChild(join);
            }
        }
        const pillars = createElement('div', {
            className: 'font-size-sm mb-2'
        });
        const pillarSpans = [];
        course.pillarSlots.forEach((slot, tier) => {
            var _a;
            if (this.isSlotUnlocked(slot)) {
                const pillar = blueprint.pillars.get(tier);
                const pillarElement = createElement('span', {
                    text: (_a = pillar === null || pillar === void 0 ? void 0 : pillar.name) !== null && _a !== void 0 ? _a : templateLangString('NO_PILLAR_TYPE', {
                        pillarType: AgilityPillar.getPillarType(slot)
                    }),
                    className: pillar !== undefined && pillar.isBuilt ? 'text-success' : 'text-white',
                });
                pillarSpans.push(pillarElement);
            }
        });
        pillarSpans.forEach((span, i) => {
            pillars.append(span);
            if (i < pillarSpans.length - 1) {
                pillars.append(createElement('span', {
                    text: ` -> `
                }));
            }
        });
        element.appendChild(pillars);
        return element;
    }
    displayBlueprintCostToBuild(costs) {
        const container = createElement('div', {});
        container.append(createElement('h5', {
            className: 'font-w600 mb-2 font-size-sm',
            text: getLangString('MENU_TEXT_COST_TO_SWAP_BLUEPRINT'),
        }));
        const createAndAppendReq = (media, qty, name, currentQty) => {
            const newReq = createElement('inline-requirement', {
                className: `font-size-sm font-w400 mr-2 ml-2 ${currentQty >= qty ? 'text-success' : 'text-danger'}`,
            });
            container.append(newReq);
            newReq.setContent(media, formatNumber(qty), name);
        };
        costs.getCurrencyQuantityArray().forEach(({
            currency,
            quantity
        }) => {
            createAndAppendReq(currency.media, quantity, currency.name, currency.amount);
        });
        costs.getItemQuantityArray().forEach(({
            item,
            quantity
        }) => {
            createAndAppendReq(item.media, quantity, item.name, this.game.bank.getQty(item));
        });
        return container;
    }
    getAllBlueprintPassives(blueprint) {
        const modifiers = new ModifierTable();
        const combatEffects = [];
        const enemyModifiers = new ModifierTable();
        blueprint.obstacles.forEach((obstacle) => {
            const negMult = this.getObstacleNegMult(obstacle);
            modifiers.addModifiers(obstacle, obstacle.modifiers, negMult);
            if (obstacle.combatEffects !== undefined) {
                obstacle.combatEffects.forEach((applicator) => applicator.mergeWithArray(combatEffects, negMult));
            }
            if (obstacle.enemyModifiers !== undefined)
                enemyModifiers.addModifiers(obstacle, obstacle.enemyModifiers, 1, negMult);
        });
        blueprint.pillars.forEach((pillar) => {
            modifiers.addModifiers(pillar, pillar.modifiers);
            if (pillar.combatEffects !== undefined)
                pillar.combatEffects.forEach((applicator) => applicator.mergeWithArray(combatEffects));
            if (pillar.enemyModifiers !== undefined)
                enemyModifiers.addModifiers(pillar, pillar.enemyModifiers);
        });
        return {
            modifiers,
            combatEffects,
            enemyModifiers
        };
    }
    displayBlueprintSwal(blueprint) {
        const costs = this.getBlueprintCostToBuild(blueprint);
        const canAfford = costs.checkIfOwned();
        const {
            modifiers,
            combatEffects,
            enemyModifiers
        } = this.getAllBlueprintPassives(blueprint);
        const descriptions = modifiers.getActiveModifierDescriptions();
        combatEffects.forEach((applicator) => {
            const desc = applicator.getDescription();
            if (desc !== undefined)
                descriptions.push(desc);
        });
        descriptions.push(...enemyModifiers.getEnemyModifierDescriptions());
        const modifierContainer = createElement('div', {
            className: 'mb-2'
        });
        modifierContainer.innerHTML = descriptions
            .map(getElementHTMLDescriptionFormatter('h5', 'font-w400 font-size-sm mb-1', false))
            .join('');
        const content = createElement('div');
        content.append(this.displayBlueprintObstacleNames(blueprint));
        content.append(this.displayBlueprintCostToBuild(costs));
        content.append(createElement('h5', {
            className: 'font-w600 mb-2 mt-3 font-size-sm',
            text: getLangString('MENU_TEXT_BLUEPRINT_MODIFIERS'),
        }));
        content.append(modifierContainer);
        SwalLocale.fire({
            titleText: blueprint.name,
            html: content,
            showCancelButton: true,
            showConfirmButton: canAfford,
            confirmButtonText: getLangString('MENU_TEXT_REPLACE_COURSE'),
            cancelButtonText: getLangString('CHARACTER_SELECT_45'),
        }).then((result) => {
            if (result.value)
                this.replaceCourseWithBlueprint(blueprint);
        });
    }
    replaceCourseWithBlueprint(blueprint) {
        const course = this.activeCourse;
        const numUnlocked = course.numObstaclesUnlocked;
        for (let tier = 0; tier < numUnlocked; tier++) {
            const obstacle = blueprint.obstacles.get(tier);
            if (obstacle !== undefined) {
                if (!obstacle.isBuilt)
                    this.buildObstacle(obstacle);
            } else {
                this.destroyObstacle(tier);
            }
        }
        blueprint.pillars.forEach((pillar) => {
            if (!pillar.isBuilt)
                this.buildPillar(pillar);
        });
    }
    /** Recomputes the number of obstacles the player has unlocked for each course */
    computeNumUnlockedObstacles() {
        this.courses.forEach((course) => course.computeNumUnlockedObstacles(this));
    }
    onLoad() {
        this.computeNumUnlockedObstacles(); // Before super call as required for provided stat calculation
        super.onLoad();
        if (!this.courses.has(this.currentRealm))
            this.currentRealm = this.game.defaultRealm;
        if (!cloudManager.hasFullVersionEntitlement)
            return;
        this.renderQueue.builtObstacles = true;
        this.renderQueue.obstacleRates = true;
        this.renderQueue.obstacleModifiers = true;
        this.renderQueue.startButtons = true;
        const progressBar = document.getElementById('agility-progress-bar');
        progressBar.setSegmentPattern(['bg-info', 'bg-agility']);
        if (this.isActive) {
            this.renderQueue.progressBar = true;
            this.renderQueue.obstacleHighlights.add(this.currentlyActiveObstacle);
        }
        // Set Start/Stop button callbacks
        document.getElementById('agility-start-button').onclick = () => this.startAgilityOnClick();
        document.getElementById('agility-stop-button').onclick = () => this.stopAgilityOnClick();
        // Localize obstacle selection modals
        document.getElementById('agility-obstacle-info-0').textContent = templateLangString('MENU_TEXT_OBSTACLE_INFO_0', {
            reduction: `4`,
            maxStacks: `10`
        });
        document.getElementById('agility-obstacle-info-1').textContent = templateLangString('MENU_TEXT_OBSTACLE_INFO_1', {
            reductionCap: `95`
        });
        agilityBreakdownMenu.init(this);
        //Blueprints
        this.loadBlueprints();
    }
    onModifierChange() {
        super.onModifierChange();
        this.renderQueue.obstacleRates = true;
    }
    onEquipmentChange() {}
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.computeNumUnlockedObstacles();
        this.renderQueue.builtObstacles = true;
    }
    onAncientRelicUnlock() {
        super.onAncientRelicUnlock();
        this.computeProvidedStats(false);
        this.renderQueue.obstacleRates = true;
        this.renderQueue.obstacleModifiers = true;
    }
    onRealmChange() {
        if (this.isActive)
            this.stop();
        super.onRealmChange();
        this.renderQueue.builtObstacles = true;
        this.renderQueue.obstacleModifiers = true;
        this.renderQueue.obstacleRates = true;
        this.updateBlueprintNames();
        agilityBreakdownMenu.onSearchChange(false);
    }
    getErrorLog() {
        const obstacleLog = [];
        const course = this.courses.get(this.currentRealm);
        course === null || course === void 0 ? void 0 : course.builtObstacles.forEach((obstacle, tier) => {
            obstacleLog.push(`${tier}:${obstacle.id}`);
        });
        return `${super.getErrorLog()}
Active Realm: ${this.currentRealm.id}
Active Obstacle Tier: ${this.currentlyActiveObstacle}
Built Obstacles (tier|obstacleID):
${obstacleLog.join('\n')}`;
    }
    render() {
        super.render();
        this.renderBuiltObstacles();
        this.renderCourseRates();
        this.renderCourseModifiers();
        this.renderObstacleHighlights();
        this.renderProgressBar();
        this.renderStartStopButtons();
    }
    renderCourseRates() {
        if (!this.renderQueue.obstacleRates)
            return;
        let obstaclesActive = true;
        let totalInterval = 0;
        let totalXP = 0;
        let totalAXP = 0;
        const totalRewards = new Rewards(this.game);
        const course = this.activeCourse;
        const maxObstacles = course.numObstaclesUnlocked;
        for (let tier = 0; tier < maxObstacles; tier++) {
            const obstacle = course.builtObstacles.get(tier);
            if (obstacle !== undefined) {
                const interval = this.getObstacleInterval(obstacle);
                const xp = this.modifyXP(obstacle.baseExperience, obstacle);
                const axp = this.modifyAbyssalXP(obstacle.baseAbyssalExperience, obstacle);
                const currencies = [];
                if (obstaclesActive) {
                    totalInterval += interval;
                    totalXP += xp;
                    totalAXP += axp;
                    obstacle.currencyRewards.forEach(({
                        currency,
                        quantity
                    }) => {
                        quantity = this.modifyCurrencyReward(currency, quantity, obstacle);
                        totalRewards.addCurrency(currency, quantity);
                        currencies.push({
                            currency,
                            quantity
                        });
                    });
                    obstacle.itemRewards.forEach(({
                        item,
                        quantity
                    }) => {
                        totalRewards.addItem(item, quantity);
                    });
                }
                const menu = agilityObstacleMenus[tier];
                menu.updateRates(interval, xp, axp, obstacle.itemRewards, currencies);
            } else {
                obstaclesActive = false;
            }
        }
        agilityBreakdownMenu.updateRates(totalInterval, totalXP, totalAXP, totalRewards.getItemQuantityArray(), totalRewards.getCurrencyQuantityArray());
        this.renderQueue.obstacleRates = false;
    }
    /** Contructs sufficient menus to display all obstacles and pillars in a course */
    constructObstacleMenus(course) {
        const obstacleMenuContainer = document.getElementById('skill-content-container-20');
        while (agilityObstacleMenus.length < course.obstacleSlots.length) {
            const menu = new BuiltAgilityObstacleElement();
            menu.className = 'col-12 col-lg-6 d-none';
            if (agilityObstacleMenus.length > 0) {
                agilityObstacleMenus[agilityObstacleMenus.length - 1].after(menu);
            } else {
                obstacleMenuContainer.append(menu);
            }
            agilityObstacleMenus.push(menu);
        }
        while (agilityPillarMenus.length < course.pillarSlots.length) {
            const menu = new PassivePillarMenuElement();
            menu.className = 'col-12 col-lg-6 d-none';
            obstacleMenuContainer.append(menu);
            agilityPillarMenus.push(menu);
        }
    }
    renderBuiltObstacles() {
        if (!this.renderQueue.builtObstacles)
            return;
        const course = this.activeCourse;
        this.constructObstacleMenus(course);
        const maxTier = course.numObstaclesUnlocked;
        let sequenceBroken = false;
        let numSequentiallybuilt = 0;
        for (let tier = 0; tier < maxTier; tier++) {
            const menu = agilityObstacleMenus[tier];
            const obstacle = course.builtObstacles.get(tier);
            if (obstacle === undefined) {
                menu.setUnbuilt(tier);
                menu.setUnlocked();
                sequenceBroken = true;
            } else {
                menu.setBuiltObstacle(obstacle);
                if (sequenceBroken)
                    menu.setInactive();
                else {
                    menu.setActive();
                    numSequentiallybuilt++;
                }
            }
            showElement(menu);
        }
        for (let i = maxTier; i < agilityObstacleMenus.length; i++) {
            hideElement(agilityObstacleMenus[i]);
        }
        if (maxTier < course.maxObstacles) {
            // Show the next tier as requiring a level
            const nextTierMenu = agilityObstacleMenus[maxTier];
            nextTierMenu.setUnbuilt(maxTier);
            nextTierMenu.setLevelLocked(course.obstacleSlots[maxTier], this);
            showElement(nextTierMenu);
        }
        let numUnlockedPillars = 0;
        course.pillarSlots.forEach((slot, tier) => {
            const menu = agilityPillarMenus[tier];
            if (this.isSlotUnlocked(slot)) {
                showElement(menu);
                const pillar = course.builtPillars.get(tier);
                if (pillar === undefined)
                    menu.setUnbuilt(slot, tier);
                else {
                    menu.setBuilt(pillar);
                    if (numSequentiallybuilt >= slot.obstacleCount)
                        menu.setActive();
                    else
                        menu.setInactive();
                }
                numUnlockedPillars++;
            }
        });
        for (let i = numUnlockedPillars; i < agilityPillarMenus.length; i++) {
            hideElement(agilityPillarMenus[i]);
        }
        this.renderQueue.builtObstacles = false;
    }
    renderCourseModifiers() {
        if (!this.renderQueue.obstacleModifiers)
            return;
        const course = this.activeCourse;
        course.builtObstacles.forEach((obstacle, tier) => {
            if (tier > course.maxObstacles)
                return;
            const menu = agilityObstacleMenus[tier];
            menu.updatePassives(obstacle, this.getObstacleNegMult(obstacle));
        });
        this.renderQueue.obstacleModifiers = false;
    }
    renderObstacleHighlights() {
        if (this.renderQueue.obstacleHighlights.size === 0)
            return;
        this.renderQueue.obstacleHighlights.forEach((tier) => {
            agilityObstacleMenus[tier].setHighlight(this.currentlyActiveObstacle === tier);
        });
        this.renderQueue.obstacleHighlights.clear();
    }
    renderProgressBar() {
        if (!this.renderQueue.progressBar)
            return;
        const progressBar = document.getElementById('agility-progress-bar');
        progressBar.setMaxSegments(this.activeCourse.numObstaclesUnlocked);
        if (this.isActive) {
            progressBar.animateFromTimer(this.currentlyActiveObstacle, this.actionTimer);
        } else {
            progressBar.stopAnimation();
        }
        this.renderQueue.progressBar = false;
    }
    renderStartStopButtons() {
        if (!this.renderQueue.startButtons)
            return;
        const startButton = document.getElementById('agility-start-button');
        const stopButton = document.getElementById('agility-stop-button');
        if (this.isActive) {
            startButton.disabled = true;
            stopButton.disabled = false;
        } else {
            startButton.disabled = false;
            stopButton.disabled = true;
        }
        this.renderQueue.startButtons = false;
    }
    /** Callback function for when the Start Agility button is clicked */
    startAgilityOnClick() {
        if (this.isActive || !this.activeCourse.builtObstacles.has(0))
            return;
        this.start();
    }
    /** Callback function for when the Stop Agility button is clicked */
    stopAgilityOnClick() {
        this.stop();
    }
    /** Creates new obstacle selection menus in the modal up to the count specified */
    createSelectionMenus(count) {
        const selectionContainer = document.getElementById('modal-select-agility-obstacle-content');
        while (agilityObstacleSelectMenus.length < count) {
            const newMenu = new AgilityObstacleSelectionElement();
            newMenu.classList.add('col-12');
            selectionContainer.append(newMenu);
            agilityObstacleSelectMenus.push(newMenu);
        }
    }
    /** Callbck function for when the "View Obstacle Selection" button is clicked */
    viewObstacleSelectionOnClick(category) {
        var _a, _b;
        const course = this.activeCourse;
        if (!this.isSlotUnlocked(course.obstacleSlots[category]))
            return;
        const obstacleSelection = this.actions.filter((obstacle) => obstacle.category === category && obstacle.course === course);
        // Generate new selection menus as required
        this.createSelectionMenus(obstacleSelection.length);
        agilityObstacleSelectMenus.forEach((menu, i) => {
            if (i < obstacleSelection.length) {
                showElement(menu);
                menu.setObstacle(obstacleSelection[i]);
            } else {
                hideElement(menu);
            }
        });
        (_a = document.getElementById('build-pillar-info')) === null || _a === void 0 ? void 0 : _a.classList.replace('d-flex', 'd-none');
        (_b = document.getElementById('build-obstacle-info')) === null || _b === void 0 ? void 0 : _b.classList.replace('d-none', 'd-flex');
        document.getElementById('select-agility-obstacle-type').textContent = getLangString('MENU_TEXT_SELECT_OBSTACLE');
        $('#modal-select-agility-obstacle').modal('show');
    }
    /** Callback function for when the "Destroy Obstacle" button is clicked */
    destroyObstacleOnClick(category) {
        SwalLocale.fire({
            title: getLangString('MENU_TEXT_DESTROY_OBSTACLE?'),
            html: `<h5 class="font-w400 text-combat-smoke font-size-sm mb-2">${getLangString('MENU_TEXT_DISABLE_OBSTACLE')}</h5><h5 class="font-w600 text-danger font-size-sm mb-1">${getLangString('MENU_TEXT_CANNOT_UNDO')}</h5>`,
            showCancelButton: true,
            icon: 'warning',
            confirmButtonText: getLangString('MENU_TEXT_DESTROY'),
            cancelButtonText: getLangString('CHARACTER_SELECT_45'),
        }).then((result) => {
            if (result.value) {
                this.destroyObstacle(category);
            }
        });
    }
    /** Iterates through each active obstacle and pillar in all courses */
    forEachActiveObstacle(obstacleCallback, pillarCallback) {
        this.courses.forEach((course) => {
            const maxTier = course.numObstaclesUnlocked;
            let numSequentiallybuilt = 0;
            for (let tier = 0; tier < maxTier; tier++) {
                const obstacle = course.builtObstacles.get(tier);
                if (obstacle === undefined || obstacle instanceof DummyObstacle) {
                    break;
                } else {
                    numSequentiallybuilt++;
                    obstacleCallback(obstacle);
                }
            }
            course.pillarSlots.forEach((slot, tier) => {
                const builtPillar = course.builtPillars.get(tier);
                if (this.isSlotUnlocked(slot) && numSequentiallybuilt >= slot.obstacleCount && builtPillar !== undefined) {
                    pillarCallback(builtPillar);
                }
            });
        });
    }
    addProvidedStats() {
        super.addProvidedStats();
        this.forEachActiveObstacle((obstacle) => {
            const negMult = this.getObstacleNegMult(obstacle, true); // We check self modifiers here, so the halving mastery bonus works correctly
            this.providedStats.addStatObject(obstacle, obstacle, negMult);
        }, (pillar) => {
            this.providedStats.addStatObject(pillar, pillar);
        });
    }
    /** Rendering/state updates when the obstacles change */
    onObstacleChange() {
        this.renderQueue.builtObstacles = true;
        this.renderQueue.obstacleRates = true;
        this.computeProvidedStats(true);
    }
    /** Destroys the obstacle in the given category if it exists */
    destroyObstacle(category) {
        const course = this.activeCourse;
        if (!course.builtObstacles.has(category))
            return;
        if (this.isActive && !this.stop())
            return;
        course.builtObstacles.delete(category);
        this.onObstacleChange();
    }
    /** Builds an obstacle in the given category */
    buildObstacle(obstacle) {
        if (this.isActive && !this.stop())
            return;
        const costs = this.getObstacleBuildCosts(obstacle);
        costs.consumeCosts();
        obstacle.course.builtObstacles.set(obstacle.category, obstacle);
        this.obstacleBuildCount.set(obstacle, this.getObstacleBuildCount(obstacle) + 1);
        this.renderQueue.obstacleModifiers = true;
        this.onObstacleChange();
    }
    /** Builds the specified pillar and consumes its costs */
    buildPillar(pillar) {
        const costs = this.getPillarBuildCosts(pillar);
        costs.consumeCosts();
        pillar.course.builtPillars.set(pillar.category, pillar);
        this.renderQueue.obstacleModifiers = true;
        this.onObstacleChange();
    }
    /** Destroys the currently built pillar in the given slot */
    destroyPillar(category) {
        const course = this.activeCourse;
        if (!course.builtPillars.has(category))
            return;
        course.builtPillars.delete(category);
        this.onObstacleChange();
    }
    /** Callback function for when the "View Passive Pillar Selection" button is clicked */
    viewPillarSelectionOnClick(category) {
        var _a, _b;
        const course = this.activeCourse;
        const slot = course.pillarSlots[category];
        if (!this.isSlotUnlocked(slot))
            return;
        const pillarSelection = this.pillars.filter((pillar) => pillar.category === category && pillar.course === course);
        this.createSelectionMenus(pillarSelection.length);
        agilityObstacleSelectMenus.forEach((menu, i) => {
            if (i < pillarSelection.length) {
                showElement(menu);
                menu.setPillar(pillarSelection[i]);
            } else {
                hideElement(menu);
            }
        });
        (_a = document.getElementById('build-pillar-info')) === null || _a === void 0 ? void 0 : _a.classList.replace('d-none', 'd-flex');
        (_b = document.getElementById('build-obstacle-info')) === null || _b === void 0 ? void 0 : _b.classList.replace('d-flex', 'd-none');
        const pillarType = AgilityPillar.getPillarType(slot);
        document.getElementById('select-agility-obstacle-type').textContent = templateLangString('SELECT_PILLAR_TYPE', {
            pillarType,
        });
        document.getElementById('agility-pillar-cost-info').textContent = templateLangString('PILLAR_TYPE_COSTS', {
            pillarType,
        });
        $('#modal-select-agility-obstacle').modal('show');
    }
    /** Callback function for when the "Destroy Passive Pillar" button is clicked */
    destroyPillarOnClick(slot, category) {
        const pillarType = AgilityPillar.getPillarType(slot);
        SwalLocale.fire({
            title: templateLangString('MENU_TEXT_DESTROY_PILLAR_TYPE?', {
                pillarType,
            }),
            html: `<h5 class="font-w400 text-combat-smoke font-size-sm mb-2">${templateLangString('MENU_TEXT_DISABLE_PILLAR_TYPE', {
                pillarType,
            })}</h5><h5 class="font-w600 text-danger font-size-sm mb-1">${getLangString('MENU_TEXT_CANNOT_UNDO')}</h5>`,
            showCancelButton: true,
            icon: 'warning',
            confirmButtonText: getLangString('MENU_TEXT_DESTROY'),
            cancelButtonText: getLangString('CHARACTER_SELECT_45'),
        }).then((result) => {
            if (result.value) {
                this.destroyPillar(category);
            }
        });
    }
    /** Callback function for when an obstacle is built  */
    buildObstacleOnClick(obstacle) {
        const costs = this.getObstacleBuildCosts(obstacle);
        if (!costs.checkIfOwned() ||
            !this.isSlotUnlocked(obstacle.slot) ||
            obstacle.isBuilt ||
            !this.game.checkRequirements(obstacle.skillRequirements, true))
            return;
        SwalLocale.fire({
            title: getLangString('MENU_TEXT_BUILD_OBSTACLE?'),
            html: `<h5 class="font-w400 text-combat-smoke font-size-sm mb-2">${getLangString('MENU_TEXT_REPLACE_OBSTACLE')}</h5><h5 class="font-w600 text-danger font-size-sm mb-1">${getLangString('MENU_TEXT_CANNOT_UNDO')}</h5>`,
            showCancelButton: true,
            icon: 'warning',
            confirmButtonText: getLangString('MENU_TEXT_BUILD'),
            cancelButtonText: getLangString('CHARACTER_SELECT_45'),
        }).then((result) => {
            if (result.value) {
                $('#modal-select-agility-obstacle').modal('hide');
                this.buildObstacle(obstacle);
            }
        });
    }
    /** Callback function for when a passive pillar is built */
    buildPillarOnClick(pillar) {
        const costs = this.getPillarBuildCosts(pillar);
        if (!costs.checkIfOwned() || !this.isSlotUnlocked(pillar.slot) || pillar.isBuilt)
            return;
        const pillarType = AgilityPillar.getPillarType(pillar.slot);
        SwalLocale.fire({
            title: templateLangString('BUILD_PILLAR_TYPE?', {
                pillarType
            }),
            html: `<h5 class="font-w400 text-combat-smoke font-size-sm mb-2">${templateLangString('MENU_TEXT_REPLACE_PILLAR_TYPE', { pillarType })}</h5><h5 class="font-w600 text-danger font-size-sm mb-1">${getLangString('MENU_TEXT_CANNOT_UNDO')}</h5>`,
            showCancelButton: true,
            icon: 'warning',
            confirmButtonText: getLangString('MENU_TEXT_BUILD'),
            cancelButtonText: getLangString('CHARACTER_SELECT_45'),
        }).then((result) => {
            if (result.value) {
                $('#modal-select-agility-obstacle').modal('hide');
                this.buildPillar(pillar);
            }
        });
    }
    viewAllPassivesOnClick() {
        let passives = `<h5 class="font-w600 font-size-sm mb-1 text-combat-smoke">${getLangString('MENU_TEXT_CURRENT_PASSIVES')}</h5><h5 class="font-w600 font-size-sm mb-3 text-warning"><small>(${getLangString('MENU_TEXT_DOES_NOT_SHOW_DISABLED')})</small></h5>`;
        const summary = new StatObjectSummary();
        this.forEachActiveObstacle((obstacle) => {
            const negMult = this.getObstacleNegMult(obstacle);
            summary.addStatObject(obstacle, obstacle, negMult, 1);
        }, (pillar) => {
            summary.addStatObject(pillar, pillar);
        });
        const formatter = getElementHTMLDescriptionFormatter('h5', 'font-w400 font-size-sm mb-1', false);
        passives += summary.getAllDescriptions().map(formatter).join('');
        SwalLocale.fire({
            html: passives,
        });
    }
    resetActionState() {
        super.resetActionState();
        this.currentlyActiveObstacle = -1;
    }
    encode(writer) {
        super.encode(writer);
        writer.writeInt16(this.currentlyActiveObstacle);
        writer.writeMap(this.obstacleBuildCount, writeNamespaced, (count, writer) => writer.writeUint32(count));
        writer.writeMap(this.courses, writeNamespaced, (course, writer) => {
            writer.writeMap(course.builtObstacles, (category, writer) => writer.writeUint8(category), writeNamespaced);
            writer.writeMap(course.builtPillars, (category, writer) => writer.writeUint8(category), writeNamespaced);
            writer.writeMap(course.blueprints, (i, writer) => writer.writeUint8(i), (blueprint, writer) => {
                writer.writeString(blueprint.name);
                writer.writeMap(blueprint.obstacles, (tier, writer) => writer.writeUint8(tier), writeNamespaced);
                writer.writeMap(blueprint.pillars, (tier, writer) => writer.writeUint8(tier), writeNamespaced);
            });
        });
        return writer;
    }
    getDummyObstacle(id) {
        if (id.startsWith('melvor'))
            return this.actions.getDummyObject(id, DummyObstacle, this.game);
        else
            return undefined;
    }
    decode(reader, version) {
        super.decode(reader, version);
        const defaultCourse = this.courses.get(this.game.defaultRealm);
        this.currentlyActiveObstacle = reader.getInt16();
        if (version < 100 /* SaveVersion.IntoTheAbyss */ ) {
            const builtObstacles = reader.getMap((reader) => reader.getUint8(), (reader) => {
                const obstacle = reader.getNamespacedObject(this.actions);
                if (typeof obstacle === 'string') {
                    this.shouldResetAction = true;
                    return this.getDummyObstacle(obstacle);
                }
                return obstacle;
            });
            if (defaultCourse !== undefined)
                defaultCourse.builtObstacles = builtObstacles;
        }
        this.obstacleBuildCount = reader.getMap((reader) => {
            const obstacle = reader.getNamespacedObject(this.actions);
            if (typeof obstacle === 'string')
                return this.getDummyObstacle(obstacle);
            return obstacle;
        }, (reader) => reader.getUint32());
        if (version < 100 /* SaveVersion.IntoTheAbyss */ ) {
            if (reader.getBoolean()) {
                let pillar = reader.getNamespacedObject(this.pillars);
                if (typeof pillar === 'string' && pillar.startsWith('melvor'))
                    pillar = this.pillars.getDummyObject(pillar, DummyPillar, this.game);
                if (pillar instanceof AgilityPillar && defaultCourse !== undefined)
                    defaultCourse.builtPillars.set(0, pillar);
            }
            if (reader.getBoolean()) {
                let pillar = reader.getNamespacedObject(this.pillars);
                if (typeof pillar === 'string' && pillar.startsWith('melvor'))
                    pillar = this.pillars.getDummyObject(pillar, DummyPillar, this.game);
                if (pillar instanceof AgilityPillar && defaultCourse !== undefined)
                    defaultCourse.builtPillars.set(1, pillar);
            }
        }
        if (version >= 26 && version < 100 /* SaveVersion.IntoTheAbyss */ ) {
            const blueprints = reader.getMap((reader) => reader.getUint8(), (reader) => {
                const blueprint = {
                    name: '',
                    obstacles: new Map(),
                    pillars: new Map(),
                };
                blueprint.name = reader.getString();
                blueprint.obstacles = reader.getMap((reader) => reader.getUint8(), readNamespacedReject(this.actions));
                if (reader.getBoolean()) {
                    const pillar = reader.getNamespacedObject(this.pillars);
                    if (typeof pillar !== 'string')
                        blueprint.pillars.set(0, pillar);
                }
                if (reader.getBoolean()) {
                    const elitePillar = reader.getNamespacedObject(this.pillars);
                    if (typeof elitePillar !== 'string')
                        blueprint.pillars.set(1, elitePillar);
                }
                return blueprint;
            });
            if (defaultCourse !== undefined)
                defaultCourse.blueprints = blueprints;
        }
        if (version >= 100 /* SaveVersion.IntoTheAbyss */ ) {
            reader.getMap(readNamespacedReject(this.game.realms), (reader, realm) => {
                const builtObstacles = reader.getMap((reader) => reader.getUint8(), (reader) => {
                    const obstacle = reader.getNamespacedObject(this.actions);
                    if (typeof obstacle === 'string') {
                        this.shouldResetAction = true;
                        return this.getDummyObstacle(obstacle);
                    }
                    return obstacle;
                });
                const builtPillars = reader.getMap((reader) => reader.getUint8(), (reader) => {
                    const pillar = reader.getNamespacedObject(this.pillars);
                    if (typeof pillar === 'string') {
                        return this.pillars.getDummyObject(pillar, DummyPillar, this.game);
                    }
                    return pillar;
                });
                const blueprints = reader.getMap((reader) => reader.getUint8(), (reader) => {
                    const blueprint = this.createNewBlueprint();
                    blueprint.name = reader.getString();
                    blueprint.obstacles = reader.getMap((reader) => reader.getUint8(), readNamespacedReject(this.actions));
                    blueprint.pillars = reader.getMap((reader) => reader.getUint8(), readNamespacedReject(this.pillars));
                    return blueprint;
                });
                if (realm !== undefined) {
                    const course = this.courses.get(realm);
                    if (course !== undefined) {
                        course.builtObstacles = builtObstacles;
                        course.builtPillars = builtPillars;
                        course.blueprints = blueprints;
                    }
                }
            });
        }
        if (this.realmLoadFailed)
            this.shouldResetAction = true;
        if (this.shouldResetAction)
            this.resetActionState();
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        const defaultCourse = this.courses.get(this.game.defaultRealm);
        const getObstacle = (id) => {
            const newID = idMap.agilityObstacles[id];
            let obstacle = this.actions.getObjectByID(newID);
            if (obstacle === undefined) {
                obstacle = this.getDummyObstacle(newID);
                this.shouldResetAction = true;
            }
            if (obstacle === undefined)
                throw new Error('Error could not get dummy obstacle.');
            return obstacle;
        };
        const getPillar = (id) => {
            const newID = idMap.agilityPillars[id];
            let pillar = this.pillars.getObjectByID(newID);
            if (pillar === undefined)
                pillar = this.pillars.getDummyObject(newID, DummyPillar, this.game);
            return pillar;
        };
        const getElitePillar = (id) => {
            const newID = idMap.agilityElitePillars[id];
            let pillar = this.pillars.getObjectByID(newID);
            if (pillar === undefined)
                pillar = this.pillars.getDummyObject(newID, DummyPillar, this.game);
            return pillar;
        };
        this.currentlyActiveObstacle = reader.getNumber();
        const builtObstacles = new Map();
        const numBuiltObstacles = reader.getNumber();
        for (let i = 0; i < numBuiltObstacles; i++) {
            builtObstacles.set(reader.getNumber(), getObstacle(reader.getNumber()));
        }
        if (defaultCourse !== undefined)
            defaultCourse.builtObstacles = builtObstacles;
        const numBuiltCountObstacles = reader.getNumber();
        for (let i = 0; i < numBuiltCountObstacles; i++) {
            this.obstacleBuildCount.set(getObstacle(reader.getNumber()), reader.getNumber());
        }
        const passivePillarID = reader.getNumber();
        if (passivePillarID !== -1 && defaultCourse !== undefined) {
            defaultCourse.builtPillars.set(0, getPillar(passivePillarID));
        }
        if (version >= 20) {
            const elitePassivePillarID = reader.getNumber();
            if (elitePassivePillarID !== -1 && defaultCourse !== undefined) {
                defaultCourse.builtPillars.set(1, getElitePillar(elitePassivePillarID));
            }
        }
        if (this.shouldResetAction)
            this.resetActionState();
    }
    /** Converts the old agility variables to class state */
    convertFromOldFormat(savegame, idMap) {
        const defaultCourse = this.courses.get(this.game.defaultRealm);
        if (savegame.chosenAgilityObstacles !== undefined) {
            const builtObstacles = new Map();
            savegame.chosenAgilityObstacles.forEach((id) => {
                const newID = idMap.agilityObstacles[id];
                if (newID === undefined)
                    return;
                let obstacle = this.actions.getObjectByID(newID);
                if (obstacle === undefined)
                    obstacle = this.getDummyObstacle(newID);
                if (obstacle !== undefined)
                    builtObstacles.set(obstacle.category, obstacle);
            });
            if (defaultCourse !== undefined)
                defaultCourse.builtObstacles = builtObstacles;
        }
        if (savegame.agilityObstacleBuildCount !== undefined) {
            savegame.agilityObstacleBuildCount.forEach((count, id) => {
                const newID = idMap.agilityObstacles[id];
                let obstacle = this.actions.getObjectByID(newID);
                if (obstacle === undefined)
                    obstacle = this.getDummyObstacle(newID);
                if (count > 0 && obstacle !== undefined)
                    this.obstacleBuildCount.set(obstacle, count);
            });
        }
        if (savegame.agilityPassivePillarActive !== undefined && savegame.agilityPassivePillarActive !== -1) {
            const newID = idMap.agilityPillars[savegame.agilityPassivePillarActive];
            let pillar = this.pillars.getObjectByID(newID);
            if (pillar === undefined)
                pillar = this.pillars.getDummyObject(newID, DummyPillar, this.game);
            if (defaultCourse !== undefined)
                defaultCourse.builtPillars.set(0, pillar);
        }
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.agilityObstacles[oldActionID];
    }
    setFromOldOffline(offline) {
        this.currentlyActiveObstacle = offline.action;
        this.renderQueue.obstacleHighlights.add(this.currentlyActiveObstacle);
        this.renderQueue.startButtons = true;
        super.start();
    }
    testTranslations() {
        super.testTranslations();
        this.actions.forEach((action) => {
            action.name;
        });
        this.pillars.forEach((pillar) => {
            pillar.name;
        });
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        this.actions.forEach((action) => action.itemRewards.forEach(({
            item
        }) => obtainable.add(item)));
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
                    return skillData.obstacles;
            }
        }
    }
    static updateSearchArray() {
        // TODO: This search currently does not include combat effects, enemy modifiers or conditional modifiers
        Agility.searchArray = game.agility.actions.allObjects.map((action) => {
            const positiveModifiers = action.modifiers.filter((mod) => !mod.isNegative);
            const modifiers = joinAsList(formatModifiers(searchDescriptionFormatter, positiveModifiers));
            return {
                modifiers,
                category: action.category,
                course: action.course,
                obstacle: action,
                pillar: undefined,
            };
        });
        game.agility.pillars.allObjects.forEach((pillar) => {
            const modifiers = joinAsList(formatModifiers(searchDescriptionFormatter, pillar.modifiers));
            Agility.searchArray.push({
                modifiers,
                category: pillar.category,
                course: pillar.course,
                obstacle: undefined,
                pillar,
            });
        });
    }
}
Agility.searchArray = [];
class AgilityRenderQueue extends GatheringSkillRenderQueue {
    constructor() {
        super(...arguments);
        /** Updates the intervals, GP and XP for each obstacle */
        this.obstacleRates = false;
        /** Updates the obstacles that are currently built (or not built) and the passive pillar */
        this.builtObstacles = false;
        /** Updates the modifiers that each obstacle provides */
        this.obstacleModifiers = false;
        /** Updates the highlighting on an obstacle */
        this.obstacleHighlights = new Set();
        /** Sets the start/stop button disabled/enabled */
        this.startButtons = false;
    }
}
//# sourceMappingURL=agility.js.map
checkFileVersion('?12097')