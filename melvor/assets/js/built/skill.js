"use strict";
const TOTH_SKILL_LEVEL_BREAKDOWN = [{
        namespace: "melvorD" /* Namespaces.Demo */ ,
        levels: 99,
    },
    {
        namespace: "melvorTotH" /* Namespaces.Throne */ ,
        levels: 21,
    },
];
class SkillRenderQueue {
    constructor() {
        this.xp = false;
        this.level = false;
        this.xpCap = false;
        this.levelCapPurchase = false;
        this.abyssalLevelCapPurchase = false;
        /** The previous level that was rendered */
        this.previousLevel = 1;
        this.lock = false;
        this.ancientRelics = false;
        this.abyssalXP = false;
        this.abyssalLevel = false;
        /** The previous level that was rendered */
        this.previousAbyssalLevel = 1;
        /** Render realm selection element */
        this.realmSelection = false;
        /** Render respective realm visibility */
        this.realmVisibility = new Set();
        /** Updates the visibility of this skill's levels in the UI */
        this.levelVisibility = false;
        /** Updates the visibility of this skill's abyssal levels in the UI */
        this.abyssalLevelVisibility = false;
    }
}
class SkillLevelChangedEvent extends GameEvent {
    constructor(skill, oldLevel, newLevel) {
        super();
        this.skill = skill;
        this.oldLevel = oldLevel;
        this.newLevel = newLevel;
    }
}
class SkillXPEarnedEvent extends GameEvent {
    constructor(skill, oldXP, newXP) {
        super();
        this.skill = skill;
        this.oldXP = oldXP;
        this.newXP = newXP;
    }
}
/** Base class for all skills */
class Skill extends NamespacedObject {
    constructor(namespace, id,
        /** Game object to which this skill is registered to */
        game) {
        super(namespace, id);
        this.game = game;
        /* #endregion */
        this.providedStats = new StatProvider();
        /** Pets that can be rolled after completing an action for the skill */
        this.pets = [];
        /** Rare item drops that occur on an action */
        this.rareDrops = [];
        /** Stores the sets of ancient relics for each realm */
        this.ancientRelicSets = new Map();
        /** Requirements that must be met to unlock this skill */
        this.unlockRequirements = [];
        /** Event Unhandling methods for skill unlocking */
        this.unlockUnlisteners = [];
        this.BASE_CORRUPT_CHANCE = 5;
        this.minibarOptions = {
            defaultItems: new Set(),
            upgrades: [],
            pets: [],
        };
        this.milestones = [];
        this.abyssalMilestones = [];
        this._currentLevelCap = -1;
        this._currentAbyssalLevelCap = -1;
        this.isGatingLevelCapPurchases = false;
        this.isGatingAbyssalLevelCapPurchases = false;
        this.levelCapButtons = [];
        this.abyssalLevelCapButtons = [];
        this.headerUpgradeChains = [];
        this.headerItemCharges = [];
        /** Stores the current level of the skill */
        this._level = 1;
        /** Stores the current xp of the skill */
        this._xp = 0;
        /** Stores the current abyssal level of the skill */
        this._abyssalLevel = 1;
        /** Stores the current abyssal xp of the skill */
        this._abyssalXP = 0;
        /** Stores if the skill is unlocked */
        this._unlocked = false;
        /** Determines whether this skill has abyssal levels */
        this._hasAbyssalLevels = false;
        this.timeToLevelTracker = new Map();
        this.timeToLevelTicks = 0;
        this.timeToLevelPercentStart = 0;
        this.actionQueryCache = new Map();
        this.acionItemQueryCache = new Map();
        this.itemQueryCache = new Map();
        /** Flags if the currentRealm property failed to load from a save */
        this.realmLoadFailed = false;
        /** Temp variable used to store equipment milestones before categorizing into standard/abyssal */
        this.equipMilestones = [];
        if (this.startingLevel > 1)
            this._xp = exp.levelToXP(this.startingLevel) + 1;
        if (this.startingAbyssalLevel > 1)
            this._abyssalXP = exp.levelToXP(this.startingAbyssalLevel) + 1;
        this._level = this.startingLevel;
        this._abyssalLevel = this.startingAbyssalLevel;
        if (this.maxLevelCap >= 99)
            this.milestones.push(new SkillMasteryMilestone(this));
        this.currentRealm = game.defaultRealm;
        this.skillTrees = new NamespaceRegistry(game.registeredNamespaces, SkillTree.name);
        this.modQuery = new ModifierQuery({
            skill: this
        });
        const events = mitt();
        this.on = events.on;
        this.off = events.off;
        this._events = {
            emit: events.emit,
        };
    }
    /** Readonly. Returns the current level of the skill. */
    get level() {
        return this._level;
    }
    /** Readonly. Returns the current xp of the skill */
    get xp() {
        return this._xp;
    }
    /** Readonly. Returns the percent progress of the skill to the next level */
    get nextLevelProgress() {
        let percent = 100;
        if (this.level < this.currentLevelCap) {
            const currentLevelXP = exp.levelToXP(this.level);
            const nextLevelXP = exp.levelToXP(this.level + 1);
            percent = (100 * (this.xp - currentLevelXP)) / (nextLevelXP - currentLevelXP);
        }
        return percent;
    }
    /** Readonly. Returns the percent progress of the skill to the next level */
    get nextAbyssalLevelProgress() {
        let percent = 100;
        if (this.abyssalLevel < this.currentAbyssalLevelCap) {
            const currentLevelXP = abyssalExp.levelToXP(this.abyssalLevel);
            const nextLevelXP = abyssalExp.levelToXP(this.abyssalLevel + 1);
            percent = (100 * (this.abyssalXP - currentLevelXP)) / (nextLevelXP - currentLevelXP);
        }
        return percent;
    }
    /** Readonly. Localized name of skill */
    get name() {
        return getLangString(`SKILL_NAME_${this.localID}`);
    }
    /** Readonly: URL of skills icon image */
    get media() {
        return this.getMediaURL(this._media);
    }
    get hasMastery() {
        return false;
    }
    /** If the skill is a combat skill or not */
    get isCombat() {
        return false;
    }
    /** Readonly: If the skill has a Skilling Minibar */
    get hasMinibar() {
        return true;
    }
    /** Readonly. Returns the current abyssal xp of the skill */
    get abyssalXP() {
        return this._abyssalXP;
    }
    /** Readonly. Returns the current abyssal level of the skill */
    get abyssalLevel() {
        return this._abyssalLevel;
    }
    /** Returns if this skill has ancient relics */
    get hasAncientRelics() {
        return this.ancientRelicSets.size > 0;
    }
    /** Sorts the milestones by skill level (ascending) */
    sortMilestones() {
        this.milestones = this.milestones.filter((milestone) => milestone.level > 0);
        this.milestones.sort((a, b) => a.level - b.level);
        this.abyssalMilestones.sort((a, b) => a.abyssalLevel - b.abyssalLevel);
    }
    /** Readonly. Returns the current virtual level of the skill */
    get virtualLevel() {
        return exp.xpToLevel(this._xp);
    }
    /** Readonly. Returns the current virtual abyssal level of the skill */
    get virtualAbyssalLevel() {
        return abyssalExp.xpToLevel(this._abyssalXP);
    }
    /** The absolute maximum skill level achievable */
    get maxLevelCap() {
        return cloudManager.hasTotHEntitlementAndIsEnabled ? 120 : 99;
    }
    /** If a level cap has been set for this skill */
    get levelCapSet() {
        return this._currentLevelCap > 0;
    }
    /** The current maximum skill level achievable, factoring in gamemode/other restrictions */
    get currentLevelCap() {
        if (this.levelCapSet)
            return Math.min(this.maxLevelCap, this._currentLevelCap);
        return this.maxLevelCap;
    }
    /** The absolute maximum abyssal level achievable */
    get maxAbyssalLevelCap() {
        return cloudManager.hasItAEntitlementAndIsEnabled ? 60 : 1;
    }
    /** If an abyssal level cap has been set for this skill */
    get abyssalLevelCapSet() {
        return this._currentAbyssalLevelCap > 0;
    }
    /** The current maximum abyssal level achievable, factoring in gamemode/other restrictions */
    get currentAbyssalLevelCap() {
        if (this.abyssalLevelCapSet)
            return Math.min(this.maxAbyssalLevelCap, this._currentAbyssalLevelCap);
        return this.maxAbyssalLevelCap;
    }
    /** The level the skill should start at */
    get startingLevel() {
        return 1;
    }
    /** The abyssal level the skill should start at */
    get startingAbyssalLevel() {
        return 1;
    }
    /** Maximum skill level achievable during the tutorial */
    get tutorialLevelCap() {
        return 3;
    }
    /** A breakdown of which levels of this skill are associated with each completion category */
    get levelCompletionBreakdown() {
        return [{
            namespace: this.namespace,
            levels: this.maxLevelCap,
        }, ];
    }
    /** A breakdown of which abyssal levels of this skill are associated with each completion category */
    get abyssalLevelCompletionBreakdown() {
        const breakdown = [];
        if (this.hasAbyssalLevels)
            breakdown.push({
                namespace: "melvorItA" /* Namespaces.IntoTheAbyss */ ,
                levels: this.maxAbyssalLevelCap,
            });
        return breakdown;
    }
    get isUnlocked() {
        return this._unlocked;
    }
    get hasSkillTree() {
        return this.skillTrees.size > 0;
    }
    get hasAbyssalLevels() {
        return this._hasAbyssalLevels;
    }
    /** If the standard levels of this skill should be shown in the UI */
    get shouldShowStandardLevels() {
        return (this.maxLevelCap > 1 &&
            (this.standardLevelRealm === undefined || this.standardLevelRealm.isUnlocked) &&
            ((!this.game.settings.useLegacyRealmSelection && this.game.currentRealm.id !== "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ) ||
                this.game.settings.useLegacyRealmSelection ||
                this.game.settings.sidebarLevels === 0 /* SidebarLevelSetting.Both */ ));
    }
    /** If the abyssal levels of this skill should be shown in the UI */
    get shouldShowAbyssalLevels() {
        return (this._hasAbyssalLevels &&
            (this.abyssalLevelRealm === undefined || this.abyssalLevelRealm.isUnlocked) &&
            ((!this.game.settings.useLegacyRealmSelection && this.game.currentRealm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ) ||
                this.game.settings.useLegacyRealmSelection ||
                this.game.settings.sidebarLevels === 0 /* SidebarLevelSetting.Both */ ));
    }
    get availableRealmCount() {
        return this.game.realms.filter((realm) => {
            return isRequirementMet(realm.unlockRequirements);
        }).length;
    }
    getItemForRegistration(id) {
        const item = this.game.items.getObjectByID(id);
        if (item === undefined)
            throw new Error(`Error registering data for skill: ${this.id}. Item with id: ${id} is not registered.`);
        return item;
    }
    /** Gets the realm options that should show for this skill in a RealmSelectMenuElement */
    getRealmOptions() {
        return [];
    }
    shouldShowSkillInSidebar() {
        return (this.game.realms.size < 2 ||
            this.game.settings.useLegacyRealmSelection ||
            !this.game.settings.showOpacityForSkillNavs ||
            this.getRealmOptions().includes(this.game.currentRealm));
    }
    /** Callback function for when the current realm for this skill is changed */
    selectRealm(realm) {
        if (!realm.isUnlocked) {
            this.game.realmManager.showRealmUnlockRequirementsModal(realm);
            return;
        }
        this.currentRealm = realm;
        this.onRealmChange();
    }
    /** Queues rendering changes for this skill when the current realm changes */
    onRealmChange() {
        this.updateSkillHeaderRealm();
    }
    updateSkillHeaderRealm() {
        if (this.header !== undefined) {
            this.header.setRealmClass(this.currentRealm);
            this.header.setRealmText(this.currentRealm.name);
            this.header.setRealmVisibility(!this.game.settings.useLegacyRealmSelection &&
                this.game.unlockedRealms.length > 1 &&
                this._hasAbyssalLevels &&
                !(this instanceof ArtisanSkill));
        }
        if (!this.game.settings.useLegacyRealmSelection) {
            this.renderQueue.levelVisibility = true;
            this.renderQueue.abyssalLevelVisibility = true;
        }
    }
    /** Initializes menus for this skill */
    initMenus() {
        RealmSelectMenuElement.initializeForSkill(this);
        SkillHeaderElement.initializeForSkill(this);
        LevelCapPurchaseButtonElement.initializeForSkill(this);
    }
    onLoad() {
        this.renderQueue.level = true;
        this.renderQueue.xp = true;
        this.renderQueue.xpCap = true;
        this.renderQueue.levelCapPurchase = true;
        this.renderQueue.abyssalLevelCapPurchase = true;
        this.renderQueue.previousLevel = this.level;
        this.renderQueue.previousAbyssalLevel = this.abyssalLevel;
        this.renderQueue.lock = true;
        this.renderQueue.abyssalLevel = true;
        this.renderQueue.abyssalXP = true;
        this.skillTrees.forEach((skillTree) => {
            skillTree.onLoad();
            // Retroactive bug fix for missing points in tree. See: https://github.com/MelvorIdle/melvoridle.github.io/issues/4346
            const missingPoints = this.abyssalLevel - 1 - skillTree.points - skillTree.getTotalPointsSpent();
            if (missingPoints > 0)
                skillTree.addPoints(missingPoints);
        });
        this.renderQueue.realmSelection = true;
        this.game.realms.forEach((realm) => this.renderQueue.realmVisibility.add(realm));
        this.renderQueue.levelVisibility = true;
        this.renderQueue.abyssalLevelVisibility = true;
        this.updateSkillHeaderRealm();
        this.assignUnlockListeners();
        this.computeProvidedStats(false);
    }
    /**
     * Recomputes the stats provided by this skill
     * @param updatePlayer If the stats of the player should be recomputed
     */
    computeProvidedStats(updatePlayer = false) {
        this.providedStats.reset();
        this.addProvidedStats();
        if (updatePlayer)
            this.game.combat.computeAllStats();
    }
    /** Adds any stats that this skill provides to it's StatProvider interface members */
    addProvidedStats() {
        this.ancientRelicSets.forEach((relicSet) => {
            relicSet.foundRelics.forEach((count, relic) => {
                this.providedStats.addStatObject(relic, relic.stats);
            });
            if (relicSet.isComplete)
                this.providedStats.addStatObject(relicSet.completedRelic, relicSet.completedRelic.stats);
        });
        this.skillTrees.forEach((tree) => {
            tree.unlockedNodes.forEach((node) => {
                this.providedStats.addStatObject(node, node.stats);
            });
        });
    }
    render() {
        this.renderXP();
        this.renderLockStatus();
        this.renderLevelVisibility();
        this.renderLevel();
        this.renderXPCap();
        this.renderAbyssalXP();
        this.renderAbyssalLevelVisibility();
        this.renderAbyssalLevel();
        this.renderLevelCapPurchase();
        this.renderAbyssalLevelCapPurchase();
        this.renderRealmSelection();
        this.renderRealmVisibility();
    }
    renderXP() {
        var _a;
        if (!this.renderQueue.xp)
            return;
        skillProgressDisplay.updateXP(this);
        (_a = this.header) === null || _a === void 0 ? void 0 : _a.updateXP(this.game, this);
        if (this.isCombat)
            combatSkillProgressTable.updateXP(this.game, this);
        this.renderQueue.xp = false;
    }
    renderLevel() {
        var _a;
        if (!this.renderQueue.level)
            return;
        if (this.renderQueue.previousLevel < this.level) {
            if (!this.game.settings.useSmallLevelUpNotifications || this.level === 99) {
                this.fireLevelUpModal(this.renderQueue.previousLevel);
                if (this.level === 99)
                    showFireworks();
            } else {
                this.game.combat.notifications.add({
                    type: 'LevelUp',
                    args: [this],
                });
            }
            this.renderQueue.previousLevel = this.level;
        }
        skillNav.updateSkillLevel(this);
        skillProgressDisplay.updateLevel(this);
        (_a = this.header) === null || _a === void 0 ? void 0 : _a.updateLevel(this.game, this);
        if (this.isCombat)
            combatSkillProgressTable.updateLevel(this.game, this);
        this.renderQueue.level = false;
    }
    renderAbyssalXP() {
        var _a;
        if (!this.renderQueue.abyssalXP)
            return;
        skillProgressDisplay.updateAbyssalXP(this);
        (_a = this.header) === null || _a === void 0 ? void 0 : _a.updateAbyssalXP(this.game, this);
        if (this.isCombat)
            combatSkillProgressTable.updateAbyssalXP(this.game, this);
        this.renderQueue.abyssalXP = false;
    }
    renderAbyssalLevel() {
        var _a;
        if (!this.renderQueue.abyssalLevel)
            return;
        if (this.renderQueue.previousAbyssalLevel < this.abyssalLevel) {
            if (!this.game.settings.useSmallLevelUpNotifications || this.abyssalLevel === this.maxAbyssalLevelCap) {
                this.fireAbyssalLevelUpModal(this.renderQueue.previousAbyssalLevel);
                if (this.abyssalLevel === this.maxAbyssalLevelCap)
                    showFireworks();
            } else {
                this.game.combat.notifications.add({
                    type: 'AbyssalLevelUp',
                    args: [this],
                });
            }
            this.renderQueue.previousAbyssalLevel = this.abyssalLevel;
        }
        skillNav.updateAbyssalSkillLevel(this);
        skillProgressDisplay.updateAbyssalLevel(this);
        (_a = this.header) === null || _a === void 0 ? void 0 : _a.updateAbyssalLevel(this.game, this);
        if (this.isCombat)
            combatSkillProgressTable.updateAbyssalLevel(this.game, this);
        this.renderQueue.abyssalLevel = false;
    }
    renderLockStatus() {
        if (!this.renderQueue.lock)
            return;
        skillNav.updateSkillLock(this);
        this.renderQueue.lock = false;
    }
    renderRealmSelection() {
        if (!this.renderQueue.realmSelection || this.realmSelect === undefined) {
            this.renderQueue.realmSelection = false;
            return;
        }
        if (this.availableRealmCount > 1 &&
            (this.game.settings.useLegacyRealmSelection ||
                (this.id === "melvorD:Agility" /* SkillIDs.Agility */ && this.game.settings.alwaysShowRealmSelectAgility))) {
            showElement(this.realmSelect);
        } else
            hideElement(this.realmSelect);
        this.renderQueue.realmSelection = false;
    }
    renderRealmVisibility() {
        if (this.renderQueue.realmVisibility.size === 0)
            return;
        if (this.realmSelect !== undefined) {
            this.renderQueue.realmVisibility.forEach((realm) => {
                this.realmSelect.updateRealmVisibility(realm);
            });
        }
        this.renderQueue.realmVisibility.clear();
    }
    renderLevelVisibility() {
        var _a;
        if (!this.renderQueue.levelVisibility)
            return;
        skillNav.updateLevelVisibility(this);
        (_a = this.header) === null || _a === void 0 ? void 0 : _a.updateLevelVisibility(this);
        if (this.isCombat)
            combatSkillProgressTable.updateLevelVisibility(this);
        this.renderQueue.levelVisibility = false;
    }
    renderAbyssalLevelVisibility() {
        var _a;
        if (!this.renderQueue.abyssalLevelVisibility)
            return;
        skillNav.updateAbyssalLevelVisibility(this);
        (_a = this.header) === null || _a === void 0 ? void 0 : _a.updateAbyssalLevelVisibility(this);
        if (this.isCombat)
            combatSkillProgressTable.updateAbyssalLevelVisibility(this);
        this.renderQueue.abyssalLevelVisibility = false;
    }
    fireLevelUpModal(previousLevel) {
        addModalToQueue({
            title: getLangString('COMPLETION_CONGRATS'),
            html: `<span class="text-dark">${templateLangString('TOASTS_SKILL_LEVEL_UP', {
                skillName: this.name,
                level: `${numberWithCommas(this.level)}`,
            })}${this.getNewMilestoneHTML(previousLevel)}</span>`,
            imageUrl: this.media,
            imageWidth: 64,
            imageHeight: 64,
            imageAlt: this.name,
        });
    }
    fireAbyssalLevelUpModal(previousLevel) {
        addModalToQueue({
            title: getLangString('COMPLETION_CONGRATS'),
            html: `<span class="text-dark">${templateLangString('ABYSSAL_LEVEL_UP_MSG', {
                skillName: this.name,
                level: `${this.abyssalLevel}`,
            })}${this.getNewAbyssalMilestoneHTML(previousLevel)}</span>`,
            imageUrl: this.media,
            imageWidth: 64,
            imageHeight: 64,
            imageAlt: this.name,
        });
    }
    getNewMilestoneHTML(previousLevel) {
        let html = ``;
        let milestoneCount = 0;
        this.milestones.forEach((milestone) => {
            if (previousLevel < milestone.level && this.level >= milestone.level) {
                html += `<div class="h5 font-w600 mb-0"><img class="skill-icon-xs mr-2" src="${milestone.media}">${milestone.name}</div>`;
                milestoneCount++;
            }
        });
        if (milestoneCount > 0) {
            html =
                `<h5 class="font-w600 font-size-sm pt-3 mb-1 text-success">${getLangString('COMPLETION_SKILL_LEVEL_MILESTONES')}</div>` + html;
        }
        if (this.level >= 99 && previousLevel < 99) {
            const skillCape = this.game.shop.purchases.find((purchase) => {
                return (purchase.category.id === "melvorD:Skillcapes" /* ShopCategoryIDs.Skillcapes */ &&
                    purchase.purchaseRequirements.length === 1 &&
                    purchase.purchaseRequirements[0].type === 'SkillLevel' &&
                    purchase.purchaseRequirements[0].skill === this);
            });
            if (skillCape !== undefined)
                html += `<div class="h5 font-w400 font-size-sm text-success pt-3">${templateLangString('COMPLETION_SKILL_LEVEL_99_NOTICE', { itemName: `<strong>${skillCape.contains.items[0].item.name}</strong>` })}`;
        }
        if (this.level >= 120 && previousLevel < 120) {
            const superiorSkillCape = this.game.shop.purchases.find((purchase) => {
                return (purchase.category.id === "melvorTotH:SuperiorSkillcapes" /* ShopCategoryIDs.SuperiorSkillcapes */ &&
                    purchase.purchaseRequirements.length === 1 &&
                    purchase.purchaseRequirements[0].type === 'SkillLevel' &&
                    purchase.purchaseRequirements[0].skill === this);
            });
            if (superiorSkillCape !== undefined)
                html += `<div class="h5 font-w400 font-size-sm text-success pt-3">${templateLangString('COMPLETION_SKILL_LEVEL_99_NOTICE', { itemName: `<strong>${superiorSkillCape.contains.items[0].item.name}</strong>` })}`;
        }
        return html;
    }
    /** Gets the HTML for Abyssal level milestones for use in the level up modal */
    getNewAbyssalMilestoneHTML(previousLevel) {
        let html = ``;
        let milestoneCount = 0;
        this.abyssalMilestones.forEach((milestone) => {
            if (previousLevel < milestone.abyssalLevel && this.abyssalLevel >= milestone.abyssalLevel) {
                html += `<div class="h5 font-w600 mb-0"><img class="skill-icon-xs mr-2" src="${milestone.media}">${milestone.name}</div>`;
                milestoneCount++;
            }
        });
        if (milestoneCount > 0) {
            html =
                `<h5 class="font-w600 font-size-sm pt-3 mb-1 text-success">${getLangString('COMPLETION_SKILL_LEVEL_MILESTONES')}</div>` + html;
        }
        return html;
    }
    /** Rendering for the xp cap message */
    renderXPCap() {
        var _a, _b;
        if (!this.renderQueue.xpCap)
            return;
        if (this.game.currentGamemode.capNonCombatSkillLevels && !this.isCombat) {
            const combatLevel = this.game.playerNormalCombatLevel;
            const xpCap = exp.levelToXP(combatLevel + 1) - 1;
            (_a = this.header) === null || _a === void 0 ? void 0 : _a.toggleCombatLevelCap(this._xp >= xpCap);
        } else {
            (_b = this.header) === null || _b === void 0 ? void 0 : _b.toggleCombatLevelCap(false);
        }
        this.renderQueue.xpCap = false;
    }
    renderLevelCapPurchase() {
        if (!this.renderQueue.levelCapPurchase)
            return;
        const capCost = this.game.currentGamemode.levelCapCost;
        if (!this.isGatingLevelCapPurchases && capCost !== undefined && this.currentLevelCap < this.maxLevelCap) {
            const canPurchase = capCost.canIncreaseLevelCap(this);
            const oldCap = this.currentLevelCap;
            const newCap = Math.min(this.maxLevelCap, oldCap + capCost.increase);
            if (canPurchase) {
                this.levelCapButtons.forEach((button) => {
                    button.setCapChange(oldCap, newCap);
                    button.setAvailable();
                });
            } else {
                this.levelCapButtons.forEach((button) => {
                    button.setCapChange(oldCap, newCap);
                    button.setUnavailable();
                });
            }
        } else {
            this.levelCapButtons.forEach(hideElement);
        }
        this.renderQueue.levelCapPurchase = false;
    }
    renderAbyssalLevelCapPurchase() {
        if (!this.renderQueue.abyssalLevelCapPurchase)
            return;
        const capCost = this.game.currentGamemode.abyssalLevelCapCost;
        if (this.hasAbyssalLevels &&
            !this.isGatingAbyssalLevelCapPurchases &&
            capCost !== undefined &&
            this.currentAbyssalLevelCap < this.maxAbyssalLevelCap) {
            const canPurchase = capCost.canIncreaseAbyssalLevelCap(this);
            const oldCap = this.currentAbyssalLevelCap;
            const newCap = Math.min(this.maxAbyssalLevelCap, oldCap + capCost.increase);
            if (canPurchase) {
                this.abyssalLevelCapButtons.forEach((button) => {
                    button.setCapChange(oldCap, newCap);
                    button.setAvailable();
                });
            } else {
                this.abyssalLevelCapButtons.forEach((button) => {
                    button.setCapChange(oldCap, newCap);
                    button.setUnavailable();
                });
            }
        } else {
            this.abyssalLevelCapButtons.forEach(hideElement);
        }
        this.renderQueue.abyssalLevelCapPurchase = false;
    }
    /**
     * Adds experience to the skill
     * @param amount The unmodified experience to add
     * @param action Optional, the action the xp came from
     * @returns True if the xp added resulted in a level increase
     */
    addXP(amount, action) {
        if (!this._unlocked || amount === 0)
            return false;
        amount = this.modifyXP(amount, action);
        const oldXP = this._xp;
        this._xp += amount;
        this.capXPForTutorial();
        this.capXPForGamemode();
        const newXP = this._xp;
        if (oldXP !== newXP)
            this._events.emit('xpEarned', new SkillXPEarnedEvent(this, oldXP, newXP));
        const levelIncreased = this._xp > exp.levelToXP(this.level + 1) && this.level < this.currentLevelCap;
        if (levelIncreased) {
            this.levelUp();
        }
        this.game.combat.notifications.add({
            type: 'SkillXP',
            args: [this, amount],
        });
        this.renderQueue.xp = true;
        return levelIncreased;
    }
    /**
     * Adds Abyssal XP to the skill
     * @param amount The unmodified experience to add
     * @param action Optional, the action the xp came from
     * @returns True if the abyssal xp added resulted in a level increase
     */
    addAbyssalXP(amount, action) {
        if (!this._unlocked || !this.hasAbyssalLevels || amount === 0)
            return false;
        amount = this.modifyAbyssalXP(amount, action);
        const oldXP = this._abyssalXP;
        this._abyssalXP += amount;
        this.capAXPForGamemode();
        const newXP = this._abyssalXP;
        if (oldXP !== newXP)
            this._events.emit('abyssalXPEarned', new SkillXPEarnedEvent(this, oldXP, newXP));
        const levelIncreased = this._abyssalXP > abyssalExp.levelToXP(this.abyssalLevel + 1) && this.abyssalLevel < this.currentAbyssalLevelCap;
        if (levelIncreased) {
            this.abyssalLevelUp();
        }
        //TODO_C - add specific abyssal xp notification
        this.game.combat.notifications.add({
            type: 'AbyssalXP',
            args: [this, amount],
        });
        this.renderQueue.abyssalXP = true;
        return levelIncreased;
    }
    /** Caps skill experience during the tutorial */
    capXPForTutorial() {
        if (this.game.tutorial.complete)
            return;
        const xpCap = exp.levelToXP(this.tutorialLevelCap + 1) - 1;
        if (this._xp > xpCap) {
            this._xp = xpCap;
            this.game.combat.notifications.add({
                type: 'Player',
                args: [
                    this,
                    getLangString(`MISC_STRING_${this.tutorialLevelCap === 3 ? 'TUTORIAL_0' : 'TUTORIAL_1'}`),
                    'danger',
                ],
            });
        }
    }
    /** Caps skill experience based on the current gamemode */
    capXPForGamemode() {
        if (this.game.currentGamemode.capNonCombatSkillLevels) {
            if (this.isCombat)
                return;
            const combatLevel = this.game.playerNormalCombatLevel;
            const xpCap = exp.levelToXP(combatLevel + 1) - 1;
            if (this._xp > xpCap) {
                this._xp = xpCap;
                this.renderQueue.xpCap = true;
            }
        } else if (!this.game.currentGamemode.allowXPOverLevelCap) {
            const xpCap = exp.levelToXP(this.currentLevelCap + 1) - 1;
            if (this._xp > xpCap) {
                this._xp = xpCap;
                this.renderQueue.xpCap = true;
            }
        }
    }
    /** Caps abyssal experience based on the current gamemode */
    capAXPForGamemode() {
        if (!this.game.currentGamemode.allowXPOverLevelCap) {
            const axpCap = abyssalExp.levelToXP(this.currentAbyssalLevelCap + 1) - 1;
            if (this._abyssalXP > axpCap) {
                this._abyssalXP = axpCap;
            }
        }
    }
    isLevelCapBelow(cap) {
        return this._currentLevelCap < cap;
    }
    applyLevelCapIncrease(increase) {
        this.increaseLevelCap(increase.increase, increase.maximum);
    }
    increaseLevelCap(amount, max = Infinity) {
        const newCap = Math.min(this._currentLevelCap + amount, max);
        if (newCap < this._currentLevelCap)
            return;
        this.setLevelCap(newCap);
    }
    applySetLevelCap(newCap) {
        if (this._currentLevelCap >= newCap)
            return;
        this.setLevelCap(newCap);
    }
    setLevelCap(newCap) {
        this._currentLevelCap = newCap;
        this.renderQueue.level = true;
        this.renderQueue.xp = true;
        if (this._xp > exp.levelToXP(this.level + 1) && this.level < this.currentLevelCap) {
            this.levelUp();
        }
    }
    isAbyssalLevelCapBelow(cap) {
        return this._currentAbyssalLevelCap < cap;
    }
    applyAbyssalLevelCapIncrease(increase) {
        this.increaseAbyssalLevelCap(increase.increase, increase.maximum);
    }
    increaseAbyssalLevelCap(amount, max = Infinity) {
        const newCap = Math.min(this._currentAbyssalLevelCap + amount, max);
        if (newCap < this._currentAbyssalLevelCap)
            return;
        this.setAbyssalLevelCap(newCap);
    }
    applySetAbyssalLevelCap(newCap) {
        if (this._currentAbyssalLevelCap >= newCap)
            return;
        this.setAbyssalLevelCap(newCap);
    }
    setAbyssalLevelCap(count) {
        this._currentAbyssalLevelCap = count;
        this.renderQueue.abyssalLevel = true;
        this.renderQueue.abyssalXP = true;
        if (this._abyssalXP > abyssalExp.levelToXP(this.abyssalLevel + 1) &&
            this.abyssalLevel < this.currentAbyssalLevelCap) {
            this.abyssalLevelUp();
        }
    }
    /** Method for performing a level up on this skill */
    levelUp() {
        const oldLevel = this._level;
        this._level = Math.min(this.currentLevelCap, exp.xpToLevel(this._xp));
        const newLevel = this._level;
        this.onLevelUp(oldLevel, newLevel);
    }
    /** Method for performing an abyssal level up on this skill */
    abyssalLevelUp() {
        const oldLevel = this._abyssalLevel;
        this._abyssalLevel = Math.min(this.currentAbyssalLevelCap, abyssalExp.xpToLevel(this._abyssalXP));
        const newLevel = this._abyssalLevel;
        this.onAbyssalLevelUp(oldLevel, newLevel);
    }
    getActionModifierQuery(action) {
        const cached = this.actionQueryCache.get(action);
        if (cached !== undefined)
            return cached;
        const query = new ModifierQuery(this.getActionModifierQueryParams(action));
        this.actionQueryCache.set(action, query);
        return query;
    }
    getActionItemModifierQuery(action) {
        const cached = this.acionItemQueryCache.get(action);
        if (cached !== undefined)
            return cached;
        const query = this.getActionModifierQuery(action).clone();
        query.add({
            item: true
        });
        this.acionItemQueryCache.set(action, query);
        return query;
    }
    /**
     * Gets a modifier scope for this skill
     * @param action Optional action to apply to the scope
     */
    getActionModifierQueryParams(action) {
        const scope = {
            skill: this,
            action,
        };
        if (action instanceof RealmedObject) {
            scope.realm = action.realm;
        }
        return scope;
    }
    getCurrencyModifierQuery(currency, action) {
        const query = this.getActionModifierQuery(action).clone();
        query.add({
            currency
        });
        // TODO_MR Consider caching these queries as well
        return query;
    }
    getItemModifierQuery(item) {
        const cached = this.itemQueryCache.get(item);
        if (cached !== undefined)
            return cached;
        const query = new ModifierQuery({
            skill: this,
            item
        });
        this.itemQueryCache.set(item, query);
        return query;
    }
    /**
     * Gets the modified xp to add to the skill
     * @param amount The unmodified experience
     * @param action Optional, the action the xp came from
     * @returns The experience with modifiers applied
     */
    modifyXP(amount, action) {
        amount *= 1 + this.getXPModifier(action) / 100;
        if (this.game.modifiers.halveSkillXP > 0)
            amount /= 2;
        return amount;
    }
    _buildXPSources(action) {
        const builder = new ModifierSourceBuilder(this.game.modifiers, true);
        builder.addSources("melvorD:skillXP" /* ModifierIDs.skillXP */ , this.getActionModifierQuery(action));
        if (!this.isCombat)
            builder.addSources("melvorD:nonCombatSkillXP" /* ModifierIDs.nonCombatSkillXP */ );
        return builder;
    }
    getXPSources(action) {
        return this._buildXPSources(action).getSpans();
    }
    /**
     * Gets the modified abyssal xp to add to the skill
     * @param amount The unmodified experience
     * @param action Optional, the action the abyssal xp came from
     * @returns The experience with modifiers applied
     */
    modifyAbyssalXP(amount, action) {
        amount *= 1 + this.getAbyssalXPModifier(action) / 100;
        return amount;
    }
    _buildAbyssalXPSources(action) {
        const builder = new ModifierSourceBuilder(this.game.modifiers, true);
        builder.addSources("melvorD:abyssalSkillXP" /* ModifierIDs.abyssalSkillXP */ , this.getActionModifierQuery(action));
        if (this.isCombat)
            builder.addSources("melvorD:abyssalCombatSkillXP" /* ModifierIDs.abyssalCombatSkillXP */ );
        return builder;
    }
    getAbyssalXPSources(action) {
        return this._buildAbyssalXPSources(action).getSpans();
    }
    /**
     * Gets the percentage xp modifier for a skill
     * @param action Optional, the action the xp came from
     */
    getXPModifier(action) {
        let modifier = this.game.modifiers.getValue("melvorD:skillXP" /* ModifierIDs.skillXP */ , this.getActionModifierQuery(action));
        if (!this.isCombat)
            modifier += this.game.modifiers.nonCombatSkillXP;
        return modifier;
    }
    /**
     * Gets the percentage abyssal xp modifier for a skill
     * @param action Optional, the action the abyssal xp came from
     */
    getAbyssalXPModifier(action) {
        let modifier = this.game.modifiers.getValue("melvorD:abyssalSkillXP" /* ModifierIDs.abyssalSkillXP */ , this.getActionModifierQuery(action));
        if (this.isCombat) {
            modifier += this.game.modifiers.abyssalCombatSkillXP;
        }
        return modifier;
    }
    /** Gets the uncapped doubling chance for this skill.
     *  This should be overrode to add skill specific bonuses
     */
    getUncappedDoublingChance(action) {
        let chance = this.game.modifiers.globalItemDoublingChance;
        chance += this.game.modifiers.getValue("melvorD:skillItemDoublingChance" /* ModifierIDs.skillItemDoublingChance */ , this.getActionModifierQuery(action));
        return chance;
    }
    /** Gets the clamped doubling chance for this skill */
    getDoublingChance(action) {
        return clampValue(this.getUncappedDoublingChance(action), 0, 100);
    }
    _buildDoublingSources(action) {
        const builder = new ModifierSourceBuilder(this.game.modifiers, true);
        builder.addSources("melvorD:globalItemDoublingChance" /* ModifierIDs.globalItemDoublingChance */ );
        builder.addSources("melvorD:skillItemDoublingChance" /* ModifierIDs.skillItemDoublingChance */ , this.getActionModifierQuery(action));
        return builder;
    }
    /** Gets the sources of item doubling for this skill */
    getDoublingSources(action) {
        return this._buildDoublingSources(action).getSpans();
    }
    /**
     * Gets the uncapped cost reduction for this skill
     * @param action Optional action to provide for action specific modifiers
     * @param item Optional item to provide for item specific modifiers
     * @returns The uncapped percentage cost reduction
     * @virtual
     */
    getUncappedCostReduction(action, item) {
        return this.game.modifiers.getValue("melvorD:skillCostReduction" /* ModifierIDs.skillCostReduction */ , this.getActionModifierQuery(action));
    }
    /**
     * Gets the clamped cost reduction for this skill
     * @param action Optional action to provide for action specific modifiers
     * @param item Optional item to provide for item specific modifiers
     * @returns The percentage reduction clamped to the maximum value
     */
    getCostReduction(action, item) {
        return Math.min(80, this.getUncappedCostReduction(action, item));
    }
    _buildCostReductionSources(action) {
        const builder = new ModifierSourceBuilder(this.game.modifiers, true);
        builder.addSources("melvorD:skillCostReduction" /* ModifierIDs.skillCostReduction */ , this.getActionModifierQuery(action));
        return builder;
    }
    getCostReductionSources(action) {
        return this._buildCostReductionSources(action).getSpans();
    }
    /**
     * Gets the flat cost reduction for this skill
     * @param action Optional action to provide for action specific modifiers
     * @param item Optional item to provide for item specific modifiers
     */
    getFlatCostReduction(action, item) {
        return 0;
    }
    /** Modifies the cost of a specific item for a recipe */
    modifyItemCost(item, quantity, recipe) {
        const costReduction = this.getCostReduction(recipe, item);
        quantity *= 1 - costReduction / 100;
        quantity = Math.ceil(quantity);
        quantity -= this.getFlatCostReduction(recipe, item);
        return Math.max(1, quantity);
    }
    /** Modifies the cost of a specific currency for a recipe */
    modifyCurrencyCost(currency, quantity, recipe) {
        const costReduction = this.getCostReduction(recipe);
        quantity *= 1 - costReduction / 100;
        quantity = Math.ceil(quantity);
        quantity -= this.getFlatCostReduction(recipe);
        return Math.max(1, quantity);
    }
    /** Gets the flat change in [ms] for the given action */
    getFlatIntervalModifier(action) {
        return this.game.modifiers.getValue("melvorD:flatSkillInterval" /* ModifierIDs.flatSkillInterval */ , this.getActionModifierQuery(action));
    }
    _buildFlatIntervalSources(action) {
        const builder = new ModifierSourceBuilder(this.game.modifiers);
        builder.addSources("melvorD:flatSkillInterval" /* ModifierIDs.flatSkillInterval */ , this.getActionModifierQuery(action));
        return builder;
    }
    getFlatIntervalSources(action) {
        return this._buildFlatIntervalSources(action).getSpans();
    }
    /** Gets the percentage change in interval for the given action */
    getPercentageIntervalModifier(action) {
        return this.game.modifiers.getValue("melvorD:skillInterval" /* ModifierIDs.skillInterval */ , this.getActionModifierQuery(action));
    }
    _buildPercentageIntervalSources(action) {
        const builder = new ModifierSourceBuilder(this.game.modifiers, true);
        builder.addSources("melvorD:skillInterval" /* ModifierIDs.skillInterval */ , this.getActionModifierQuery(action));
        return builder;
    }
    getPercentageIntervalSources(action) {
        return this._buildPercentageIntervalSources(action).getSpans();
    }
    getIntervalSources(action) {
        return this.getPercentageIntervalSources(action).concat(this.getFlatIntervalSources(action));
    }
    modifyInterval(interval, action) {
        const flatModifier = this.getFlatIntervalModifier(action);
        const percentModifier = this.getPercentageIntervalModifier(action);
        interval *= 1 + percentModifier / 100;
        interval += flatModifier;
        if (this.game.modifiers.halveSkillInterval > 0)
            interval /= 2;
        interval = roundToTickInterval(interval);
        return Math.max(interval, 250);
    }
    /** Gets the flat increase to the base quantity of the primary product produced by this skill */
    getFlatBasePrimaryProductQuantityModifier(item, query) {
        return this.game.modifiers.getValue("melvorD:flatBasePrimaryProductQuantity" /* ModifierIDs.flatBasePrimaryProductQuantity */ , query);
    }
    /** Gets any random increases to the base quantity of the primary product produced by this skill */
    getRandomFlatBasePrimaryProductQuantity(item, query) {
        let quantity = 0;
        const plusOneChance = this.game.modifiers.getValue("melvorD:flatBasePrimaryProductQuantityChance" /* ModifierIDs.flatBasePrimaryProductQuantityChance */ , query);
        if (rollPercentage(plusOneChance))
            quantity++;
        return quantity;
    }
    /** Gets the percentage increase to the base quantity of the primary product produced by this skill */
    getBasePrimaryProductQuantityModifier(item, query) {
        return this.game.modifiers.getValue("melvorD:basePrimaryProductQuantity" /* ModifierIDs.basePrimaryProductQuantity */ , query);
    }
    /** Applies multipliers to the quantity of the primary product produced by this skill */
    applyPrimaryProductMultipliers(item, quantity, action, query) {
        if (rollPercentage(this.getDoublingChance(action)))
            quantity *= 2;
        quantity *= Math.pow(2, this.game.modifiers.getValue("melvorD:doubleItemsSkill" /* ModifierIDs.doubleItemsSkill */ , query));
        quantity *= Math.pow(2, this.game.modifiers.getValue("melvorD:bypassDoubleItemsSkill" /* ModifierIDs.bypassDoubleItemsSkill */ , query));
        return quantity;
    }
    getRandomFlatAdditionalPrimaryProductQuantity(item, action, query) {
        let quantity = 0;
        if (rollPercentage(this.game.modifiers.getValue("melvorD:additionalPrimaryProductChance" /* ModifierIDs.additionalPrimaryProductChance */ , query)))
            quantity++;
        if (rollPercentage(this.game.modifiers.getValue("melvorD:additional2PrimaryProductChance" /* ModifierIDs.additional2PrimaryProductChance */ , query)))
            quantity += 2;
        if (rollPercentage(this.game.modifiers.getValue("melvorD:additional3PrimaryProductChance" /* ModifierIDs.additional3PrimaryProductChance */ , query)))
            quantity += 3;
        if (rollPercentage(this.game.modifiers.getValue("melvorD:additional5PrimaryProductChance" /* ModifierIDs.additional5PrimaryProductChance */ , query)))
            quantity += 5;
        if (rollPercentage(this.game.modifiers.getValue("melvorD:additional8PrimaryProductChance" /* ModifierIDs.additional8PrimaryProductChance */ , query)))
            quantity += 8;
        return quantity;
    }
    /** Gets the additional resource quantity in the skill. Cannot be doubled. */
    getFlatAdditionalPrimaryProductQuantity(item, query) {
        const quantity = this.game.modifiers.getValue("melvorD:flatAdditionalPrimaryProductQuantity" /* ModifierIDs.flatAdditionalPrimaryProductQuantity */ , query);
        return Math.max(quantity, 0);
    }
    _buildAdditionalPrimaryResourceQuantitySources(query) {
        const builder = new ModifierSourceBuilder(this.game.modifiers);
        builder.addSources("melvorD:flatAdditionalPrimaryProductQuantity" /* ModifierIDs.flatAdditionalPrimaryProductQuantity */ , query);
        return builder;
    }
    getAdditionalPrimaryResourceQuantitySources(query) {
        return this._buildAdditionalPrimaryResourceQuantitySources(query).getSpans();
    }
    /**
     * Calculates the minimum base quantity of the primary product given by this skill
     * @param item The product being given
     * @param quantity The un-modified base quantity
     * @param scope The scoping to apply to modifiers
     * @returns The minimum guaranteed quantity produced
     */
    getMinimumPrimaryProductBaseQuantity(item, quantity, query) {
        quantity += this.getFlatBasePrimaryProductQuantityModifier(item, query);
        quantity *= 1 + this.getBasePrimaryProductQuantityModifier(item, query) / 100;
        quantity = Math.floor(quantity);
        return quantity;
    }
    /**
     * Modifies the quantity of a primary product given by this skill
     * @param item The item being produced
     * @param quantity The original base quantity of the product
     * @param query The scoping to apply to modifiers
     * @returns The modified product. Minimum of 1.
     */
    modifyPrimaryProductQuantity(item, quantity, action) {
        const query = this.getActionModifierQuery(action);
        quantity += this.getFlatBasePrimaryProductQuantityModifier(item, query);
        quantity += this.getRandomFlatBasePrimaryProductQuantity(item, query);
        quantity *= 1 + this.getBasePrimaryProductQuantityModifier(item, query) / 100;
        quantity = Math.floor(quantity);
        quantity = this.applyPrimaryProductMultipliers(item, quantity, action, query);
        quantity += this.getFlatAdditionalPrimaryProductQuantity(item, query);
        quantity += this.getRandomFlatAdditionalPrimaryProductQuantity(item, action, query);
        return Math.max(quantity, 1);
    }
    addCurrencyFromPrimaryProductGain(rewards, item, quantity, action) {
        const currency = item.sellsFor.currency;
        const modifier = this.game.modifiers.getValue("melvorD:currencyGainBasedOnProduct" /* ModifierIDs.currencyGainBasedOnProduct */ , this.getCurrencyModifierQuery(currency, action));
        if (modifier > 0) {
            let quantity = Math.floor((item.sellsFor.quantity * modifier) / 100);
            quantity = this.modifyCurrencyReward(currency, quantity, action);
            if (quantity > 0)
                rewards.addCurrency(currency, quantity);
        }
    }
    /** Gets the preservation chance for the skill for a given action */
    getPreservationChance(action) {
        let chance = this.game.modifiers.getValue("melvorD:skillPreservationChance" /* ModifierIDs.skillPreservationChance */ , this.getActionModifierQuery(action));
        chance += this.game.modifiers.bypassGlobalPreservationChance;
        return clampValue(chance, 0, this.getPreservationCap(action));
    }
    _buildPreservationSources(action) {
        const builder = new ModifierSourceBuilder(this.game.modifiers, true);
        builder.addSources("melvorD:skillPreservationChance" /* ModifierIDs.skillPreservationChance */ , this.getActionModifierQuery(action));
        builder.addSources("melvorD:bypassGlobalPreservationChance" /* ModifierIDs.bypassGlobalPreservationChance */ );
        return builder;
    }
    getPreservationSources(action) {
        return this._buildPreservationSources(action).getSpans();
    }
    /** Gets the maximum preservation change for a skill */
    getPreservationCap(action) {
        const baseCap = 80;
        const modifier = this.game.modifiers.getValue("melvorD:skillPreservationCap" /* ModifierIDs.skillPreservationCap */ , this.getActionModifierQuery(action));
        return baseCap + modifier;
    }
    /**
     * Gets the percentage modifier to apply to a currency reward
     * @param currency The currency to reward
     * @param action Optional. The action the currency is being rewarded for
     */
    getCurrencyModifier(currency, action) {
        return this.game.modifiers.getValue("melvorD:currencyGain" /* ModifierIDs.currencyGain */ , this.getCurrencyModifierQuery(currency, action));
    }
    /**
     * Gets the flat modifier to apply to a currency reward, after applying the percentage modifier
     * @param currency The currency to reward
     * @param action Optional. The action the currency is being rewarded for
     */
    getFlatCurrencyModifier(currency, action) {
        return this.game.modifiers.getValue("melvorD:flatCurrencyGain" /* ModifierIDs.flatCurrencyGain */ , this.getCurrencyModifierQuery(currency, action));
    }
    /**
     * Modifies a currency reward
     * @param currency The currency to reward
     * @param amount The base amount of currency
     * @param action Optional. The action the currency is being rewarded for
     */
    modifyCurrencyReward(currency, amount, action) {
        amount *= 1 + this.getCurrencyModifier(currency, action) / 100;
        amount = Math.floor(amount);
        if (this.id !== "melvorD:Magic" /* SkillIDs.Magic */ )
            amount += this.getFlatCurrencyModifier(currency, action);
        return Math.max(amount, 0);
    }
    /** Sets the experience of the skill to the specified value */
    setXP(value) {
        this._xp = value;
        const oldLevel = this._level;
        this._level = Math.min(this.currentLevelCap, exp.xpToLevel(this._xp));
        this.renderQueue.xp = true;
        this.onLevelUp(oldLevel, this._level);
    }
    /** Sets the abyssal experience of the skill to the specified value */
    setAbyssalXP(value) {
        this._abyssalXP = value;
        const oldLevel = this._abyssalLevel;
        this._abyssalLevel = Math.min(this.currentAbyssalLevelCap, abyssalExp.xpToLevel(this._abyssalXP));
        this.renderQueue.abyssalXP = true;
        this.onAbyssalLevelUp(oldLevel, this._abyssalLevel);
    }
    setUnlock(isUnlocked) {
        this._unlocked = isUnlocked;
        if (isUnlocked) {
            this.unassignUnlockListeners();
        } else {
            this.assignUnlockListeners();
        }
        this.onUnlock();
    }
    /** Called when the lock status of this skill has changed */
    onUnlock() {
        this.renderQueue.lock = true;
    }
    /** Callback function for attempted to unlock the skill */
    unlockOnClick() {
        if (this._unlocked)
            return;
        const cost = this.game.getSkillUnlockCost();
        if (!this.game.gp.canAfford(cost))
            return;
        this.game.gp.remove(cost);
        this.setUnlock(true);
        SwalLocale.fire({
            icon: 'success',
            title: getLangString('MENU_TEXT_SKILL_UNLOCKED'),
            html: `<span class='text-dark'>${getLangString('MENU_TEXT_YOU_MAY_USE_SKILL')}</span>`,
        });
        this.game.telemetry.createGPAdjustedEvent(-cost, this.game.gp.amount, `AdventureMode.UnlockSkill.${this.id}`);
    }
    assignUnlockListeners() {
        if (this._unlocked || this.unlockRequirements.length === 0)
            return;
        this.unassignUnlockListeners();
        this.unlockUnlisteners = this.unlockRequirements.map((requirement) => {
            return requirement.assignHandler(() => this.autoUnlock());
        });
    }
    unassignUnlockListeners() {
        this.unlockUnlisteners.forEach((unlistener) => unlistener());
        this.unlockUnlisteners = [];
    }
    autoUnlock() {
        if (!this.game.checkRequirements(this.unlockRequirements))
            return;
        this.setUnlock(true);
        addModalToQueue({
            title: templateLangString('SKILL_UNLOCKED', {
                skillName: this.name
            }),
            html: `<span class='text-dark'>${getLangString('MENU_TEXT_YOU_MAY_USE_SKILL')}</span>`,
            imageUrl: this.media,
            imageHeight: 128,
            imageWidth: 128,
        });
    }
    rollForPets(interval, action) {
        this.pets.forEach((pet) => {
            if (action === undefined || pet.isCorrectRealmForPetDrop(action.realm))
                this.game.petManager.rollForSkillPet(pet, interval, this);
        });
    }
    /** Method called when skill is leveled up */
    onLevelUp(oldLevel, newLevel) {
        this._events.emit('levelChanged', new SkillLevelChangedEvent(this, oldLevel, newLevel));
        this.game.completion.updateSkill(this);
        this.renderQueue.level = true;
        if (this.isCombat) {
            this.game.skills.forEach((skill) => {
                if (!skill.isCombat)
                    skill.renderQueue.xpCap = true;
            });
        }
        if (this.isGatingLevelCapPurchases) {
            this.game.skills.forEach((skill) => {
                if (!skill.isGatingLevelCapPurchases)
                    skill.renderQueue.levelCapPurchase = true;
            });
        } else if (newLevel === this.currentLevelCap && this.game.currentGamemode.levelCapCost !== undefined) {
            this.renderQueue.levelCapPurchase = true;
        }
        this.unlockAncientRelicsOnLevelUp(oldLevel, newLevel);
        this.onAnyLevelUp();
    }
    /** Method called when skill is leveled up */
    onAbyssalLevelUp(oldLevel, newLevel) {
        this._events.emit('abyssalLevelChanged', new SkillLevelChangedEvent(this, oldLevel, newLevel));
        this.game.completion.updateSkill(this);
        this.timeToLevelTracker.set(newLevel, this.timeToLevelTicks);
        this.timeToLevelTicks = 0;
        this.renderQueue.abyssalLevel = true;
        this.skillTrees.forEach((skillTree) => {
            skillTree.addPoints(newLevel - oldLevel);
        });
        if (this.isGatingAbyssalLevelCapPurchases) {
            this.game.skills.forEach((skill) => {
                if (!skill.isGatingAbyssalLevelCapPurchases)
                    skill.renderQueue.abyssalLevelCapPurchase = true;
            });
        } else if (newLevel === this.currentAbyssalLevelCap &&
            this.game.currentGamemode.abyssalLevelCapCost !== undefined) {
            this.renderQueue.abyssalLevelCapPurchase = true;
        }
        this.unlockAncientRelicsOnAbyssalLevelUp(oldLevel, newLevel);
        this.onAnyLevelUp();
    }
    /** Method called when the standard or abyssal level of this skill increases */
    onAnyLevelUp() {
        if (this.isCombat) {
            this.game.combat.player.renderQueue.combatLevel = true;
        }
        this.game.queueRequirementRenders();
        this.game.stats.General.wasMutated = true;
    }
    isCorrectGamemodeForRareDrop(drop) {
        return drop.gamemodes === undefined || drop.gamemodes.includes(this.game.currentGamemode);
    }
    isCorrectRealmForRareDrop(drop, realm) {
        return drop.realms.size === 0 || drop.realms.has(realm);
    }
    /** Rolls for additional items from modifiers */
    rollForAdditionalItems(rewards, interval, action) {
        const query = this.getActionItemModifierQuery(action);
        const chanceResult = this.game.modifiers.query("melvorD:additionalRandomSkillItemChance" /* ModifierIDs.additionalRandomSkillItemChance */ , query);
        const intervalChanceResult = this.game.modifiers.query("melvorD:additionalRandomSkillItemChancePerInterval" /* ModifierIDs.additionalRandomSkillItemChancePerInterval */ , query);
        if (chanceResult.length > 0 || intervalChanceResult.length > 0) {
            const itemChances = new SparseNumericMap();
            chanceResult.forEach((entry) => {
                itemChances.add(entry.scope.item, entry.value);
            });
            intervalChanceResult.forEach((entry) => {
                itemChances.add(entry.scope.item, (entry.value * interval) / 1000);
            });
            itemChances.forEach((chance, item) => {
                if (rollPercentage(chance))
                    rewards.addItem(item, 1);
            });
        }
        this.game.modifiers.query("melvorD:flatAdditionalSkillItem" /* ModifierIDs.flatAdditionalSkillItem */ , query).forEach((entry) => {
            rewards.addItem(entry.scope.item, entry.value);
        });
        const gemChance = this.game.modifiers.getValue("melvorD:additionalRandomGemChance" /* ModifierIDs.additionalRandomGemChance */ , query);
        if (gemChance > 0 && rollPercentage(gemChance)) {
            rewards.addItem(this.game.randomGemTable.getDrop().item, 1);
        }
        const abyssalGemChance = this.game.modifiers.getValue("melvorD:additionalRandomAbyssalGemChance" /* ModifierIDs.additionalRandomAbyssalGemChance */ , query) +
            (this.game.modifiers.getValue("melvorD:additionalRandomAbyssalGemChancePerInterval" /* ModifierIDs.additionalRandomAbyssalGemChancePerInterval */ , query) * interval) / 1000;
        if (abyssalGemChance > 0 && this.game.randomAbyssalGemTable.size > 0 && rollPercentage(abyssalGemChance)) {
            rewards.addItem(this.game.randomAbyssalGemTable.getDrop().item, 1);
        }
        const fragmentChance = this.game.modifiers.getValue("melvorD:additionalRandomFragmentChance" /* ModifierIDs.additionalRandomFragmentChance */ , query);
        if (fragmentChance > 0 && this.game.randomFragmentTable.size > 0 && rollPercentage(fragmentChance)) {
            rewards.addItem(this.game.randomFragmentTable.getDrop().item, 1);
        }
        const firemakingOilChance = this.game.modifiers.getValue("melvorD:additionalRandomFiremakingOilChance" /* ModifierIDs.additionalRandomFiremakingOilChance */ , query);
        if (firemakingOilChance > 0 && this.game.randomFiremakingOilTable.size > 0 && rollPercentage(firemakingOilChance)) {
            rewards.addItem(this.game.randomFiremakingOilTable.getDrop().item, 1);
        }
    }
    rollForRareDrops(level, rewards, action) {
        this.rareDrops.forEach((drop) => {
            let realmToCheck = game.defaultRealm;
            if (action !== undefined)
                realmToCheck = action.realm;
            if (this.game.checkRequirements(drop.requirements) &&
                this.isCorrectGamemodeForRareDrop(drop) &&
                this.isCorrectRealmForRareDrop(drop, realmToCheck) &&
                ((drop.item.localID.includes('Birthday_Present') && this.game.settings.toggleBirthdayEvent) ||
                    !drop.item.localID.includes('Birthday_Present')) &&
                rollForOffItem(this.getRareDropChance(level, drop.chance))) {
                if (drop.altItem !== undefined && this.game.modifiers.allowSignetDrops) {
                    rewards.addItem(drop.altItem, drop.quantity);
                } else {
                    rewards.addItem(drop.item, drop.quantity);
                }
            }
        });
    }
    rollForAncientRelics(level, realm) {
        if (!this.game.currentGamemode.allowAncientRelicDrops || !this.hasAncientRelics)
            return;
        const relicSet = this.ancientRelicSets.get(realm);
        if (relicSet === undefined || relicSet.isComplete)
            return;
        for (let i = 0; i < relicSet.relicDrops.length; i++) {
            const drop = relicSet.relicDrops[i];
            if (relicSet.isRelicFound(drop.relic) || !this.game.checkRequirements(drop.requirements))
                continue;
            if (this.rollForAncientRelic(level, realm, drop)) {
                this.locateAncientRelic(relicSet, drop.relic);
                break; // Only allow 1 relic to be found per action
            }
        }
    }
    rollForAncientRelic(level, realm, drop) {
        let chance = this.getRareDropChance(level, drop.chance);
        chance *= 1 + this.game.modifiers.getValue("melvorD:ancientRelicLocationChance" /* ModifierIDs.ancientRelicLocationChance */ , realm.modQuery) / 100;
        return rollPercentage(chance);
    }
    /** Unlocks ancient relics on leveling up this skill */
    unlockAncientRelicsOnLevelUp(oldLevel, newLevel) {
        if (!this.hasAncientRelics || !this.game.currentGamemode.allowAncientRelicDrops)
            return;
        this.ancientRelicSets.forEach((relicSet) => {
            if (relicSet.levelUpUnlocks.length === 0 || relicSet.isComplete)
                return;
            let relicsToUnlock = 0;
            for (let i = 0; i < relicSet.levelUpUnlocks.length; i++) {
                const level = relicSet.levelUpUnlocks[i];
                if (newLevel >= level && oldLevel < level)
                    relicsToUnlock++;
            }
            this.unlockRelicDrops(relicSet, relicsToUnlock);
        });
    }
    /** Unlocks ancient relics upon an abyssal level up of this skill */
    unlockAncientRelicsOnAbyssalLevelUp(oldLevel, newLevel) {
        if (!this.hasAncientRelics || !this.game.currentGamemode.allowAncientRelicDrops)
            return;
        this.ancientRelicSets.forEach((relicSet) => {
            if (relicSet.abyssalLevelUpUnlocks.length === 0 || relicSet.isComplete)
                return;
            let relicsToUnlock = 0;
            for (let i = 0; i < relicSet.abyssalLevelUpUnlocks.length; i++) {
                const level = relicSet.abyssalLevelUpUnlocks[i];
                if (newLevel >= level && oldLevel < level)
                    relicsToUnlock++;
            }
            this.unlockRelicDrops(relicSet, relicsToUnlock);
        });
    }
    /** Unlocks a number of ancient relic drops from a relic set */
    unlockRelicDrops(relicSet, count) {
        const relicDrops = relicSet.relicDrops.filter((drop) => !relicSet.isRelicFound(drop.relic));
        count = Math.min(count, relicDrops.length);
        const drops = getExclusiveRandomArrayElements(relicDrops, count);
        drops.forEach((drop) => this.locateAncientRelic(relicSet, drop.relic));
    }
    getRareDropChance(level, chance) {
        switch (chance.type) {
            case 'Fixed':
                return chance.chance;
            case 'LevelScaling':
                return cappedLinearFunction(chance.scalingFactor, chance.baseChance, chance.maxChance, level);
            case 'TotalMasteryScaling':
                return cappedLinearFunction(chance.scalingFactor, chance.baseChance, chance.maxChance, this.game.completion.masteryProgress.currentCount.getSum());
        }
    }
    /** Callback function for showing the milestones for this skill */
    openMilestoneModal() {
        skillMilestoneDisplay.setSkill(this);
        $('#modal-milestone').modal('show');
    }
    getRegistry(type) {
        return undefined;
    }
    getPkgObjects(pkg, type) {
        return undefined;
    }
    encode(writer) {
        writer.writeFloat64(this._xp);
        writer.writeBoolean(this._unlocked);
        writer.writeMap(this.ancientRelicSets, writeNamespaced, (relicSet, writer) => {
            writer.writeMap(relicSet.foundRelics, writeNamespaced, (value, writer) => writer.writeUint8(value));
        });
        writer.writeInt16(this._currentLevelCap);
        writer.writeInt16(this._currentAbyssalLevelCap);
        writer.writeArray(this.skillTrees.allObjects, (skillTree, writer) => {
            writer.writeNamespacedObject(skillTree);
            skillTree.encode(writer);
        });
        writer.writeFloat64(this._abyssalXP);
        writer.writeNamespacedObject(this.currentRealm);
        return writer;
    }
    decode(reader, version) {
        this._xp = reader.getFloat64();
        this._unlocked = reader.getBoolean();
        if (version >= 54 && version < 111 /* SaveVersion.AbyssalRelics */ ) {
            const foundRelics = reader.getMap(readNamespacedReject(this.game.ancientRelics), (reader) => reader.getUint8());
            const relicSet = this.ancientRelicSets.get(this.game.defaultRealm);
            if (relicSet !== undefined)
                relicSet.foundRelics = foundRelics;
            reader.skipBytes(1);
        }
        if (version >= 111 /* SaveVersion.AbyssalRelics */ ) {
            reader.getMap(readNamespacedReject(this.game.realms), (reader, key) => {
                const foundRelics = reader.getMap(readNamespacedReject(this.game.ancientRelics), (reader) => reader.getUint8());
                if (key === undefined)
                    return;
                const relicSet = this.ancientRelicSets.get(key);
                if (relicSet !== undefined)
                    relicSet.foundRelics = foundRelics;
            });
        }
        if (version >= 113 /* SaveVersion.GamemodeLevelCaps */ ) {
            this._currentLevelCap = reader.getInt16();
            this._currentAbyssalLevelCap = reader.getInt16();
        } else if (version >= 56) {
            const capIncrease = reader.getInt16();
            if (this.game.currentGamemode.defaultInitialLevelCap !== undefined) {
                this._currentLevelCap = this.game.currentGamemode.defaultInitialLevelCap + capIncrease;
            }
        }
        if (version >= 100 /* SaveVersion.IntoTheAbyss */ ) {
            reader.getArray((reader) => {
                const skillTree = reader.getNamespacedObject(this.skillTrees);
                if (typeof skillTree === 'string') {
                    const dummySkillTree = this.skillTrees.getDummyObject(skillTree, DummySkillTree, this.game);
                    dummySkillTree.decode(reader, version);
                } else {
                    skillTree.decode(reader, version);
                }
            });
            this._abyssalXP = reader.getFloat64();
        }
        if (version >= 108 /* SaveVersion.RealmSaving */ ) {
            const realm = reader.getNamespacedObject(this.game.realms);
            if (typeof realm !== 'string') {
                this.currentRealm = realm;
            } else {
                this.realmLoadFailed = true;
            }
        }
        this._level = Math.min(this.currentLevelCap, exp.xpToLevel(this._xp));
        this._abyssalLevel = Math.min(this.currentAbyssalLevelCap, abyssalExp.xpToLevel(this._abyssalXP));
    }
    convertOldXP(xp) {
        this._xp = xp;
        this._level = Math.min(this.maxLevelCap, exp.xpToLevel(this._xp));
    }
    registerData(namespace, data) {
        var _a, _b;
        if (data.pets !== undefined)
            data.pets.forEach((petID) => {
                const pet = this.game.pets.getObjectByID(petID);
                if (pet === undefined)
                    throw new Error(`Error registering data for ${this.id}. Pet with id: ${petID} is not registered.`);
                this.pets.push(pet);
            });
        if (data.rareDrops !== undefined)
            data.rareDrops.forEach((rareDropData) => {
                const item = this.game.items.getObjectByID(rareDropData.itemID);
                if (item === undefined)
                    throw new Error(`Error registering data for ${this.id}. Rare drop item with id: ${rareDropData.itemID} is not registered.`);
                const rareDrop = {
                    item,
                    quantity: rareDropData.quantity,
                    chance: rareDropData.chance,
                    requirements: this.game.getRequirementsFromData(rareDropData.requirements),
                    realms: new Set(),
                };
                if (rareDropData.altItemID !== undefined) {
                    const altItem = this.game.items.getObjectByID(rareDropData.altItemID);
                    if (altItem === undefined)
                        throw new Error(`Error registering data for ${this.id}. Alt. Rare drop item with id: ${rareDropData.itemID} is not registered.`);
                    rareDrop.altItem = altItem;
                }
                if (rareDropData.gamemodes !== undefined) {
                    const gamemodes = [];
                    rareDropData.gamemodes.forEach((gm) => {
                        const gamemode = this.game.gamemodes.getObjectByID(gm);
                        if (gamemode === undefined)
                            throw new Error(`Error registering data for ${this.id}. Gamemode with id: ${gm} is not registered.`);
                        gamemodes.push(gamemode);
                    });
                    rareDrop.gamemodes = [...gamemodes];
                }
                if (rareDropData.realms !== undefined) {
                    rareDropData.realms.forEach((realmID) => {
                        const realm = this.game.realms.getObjectSafe(realmID);
                        rareDrop.realms.add(realm);
                    });
                }
                this.rareDrops.push(rareDrop);
            });
        if (data.ancientRelicSets !== undefined) {
            data.ancientRelicSets.forEach((setData) => {
                const set = new AncientRelicSet(setData, this.game, `${Skill.name} with id "${this.id}"`);
                this.ancientRelicSets.set(set.realm, set);
            });
        }
        if (data.ancientRelics !== undefined) {
            console.warn('The "ancientRelics" property is deprecated. Use "ancientRelicSets" instead.');
            if (data.completedAncientRelic !== undefined) {
                const setData = {
                    realmID: "melvorD:Melvor" /* RealmIDs.Melvor */ ,
                    relicDrops: data.ancientRelics,
                    completedRelicID: data.completedAncientRelic,
                };
                const set = new AncientRelicSet(setData, this.game, `${Skill.name} with id "${this.id}"`);
                this.ancientRelicSets.set(set.realm, set);
            }
        }
        if (data.completedAncientRelic !== undefined) {
            console.warn('The "completedAncientRelic" property is deprecated. Use "ancientRelicSets" instead.');
        }
        if (data.minibar !== undefined) {
            data.minibar.defaultItems.forEach((itemID) => {
                const item = this.game.items.equipment.getObjectByID(itemID);
                if (item === undefined)
                    throw new Error(`Error registering data for ${this.id}. Minibar item with id: ${itemID} is not registered.`);
                this.minibarOptions.defaultItems.add(item);
            });
            this.minibarOptions.pets.push(...data.minibar.pets.map((petID) => {
                const pet = this.game.pets.getObjectByID(petID);
                if (pet === undefined)
                    throw new Error(`Error registering data for ${this.id}. Pet with id: ${petID} is not registered.`);
                return pet;
            }));
            this.minibarOptions.upgrades.push(...data.minibar.upgrades.map((upgradeID) => {
                const upgrade = this.game.shop.purchases.getObjectByID(upgradeID);
                if (upgrade === undefined)
                    throw new Error(`Error registering data for ${this.id}. ShopPurchase with id: ${upgradeID} is not registered.`);
                return upgrade;
            }));
        }
        (_a = data.customMilestones) === null || _a === void 0 ? void 0 : _a.forEach((milestoneData) => {
            switch (milestoneData.type) {
                case 'Custom':
                    {
                        const milestone = new CustomSkillMilestone(milestoneData);
                        if (milestone.abyssalLevel > 0)
                            this.abyssalMilestones.push(milestone);
                        else
                            this.milestones.push(milestone);
                    }
                    break;
                case 'EquipItem':
                    this.equipMilestones.push(new EquipItemMilestone(milestoneData, this.game, this));
                    break;
            }
        });
        (_b = data.skillTrees) === null || _b === void 0 ? void 0 : _b.forEach((data) => {
            this.skillTrees.registerObject(new SkillTree(namespace, data, this.game, this));
        });
        if (data.unlockRequirements !== undefined)
            this.unlockRequirements.push(...this.game.getRequirementsFromData(data.unlockRequirements));
        if (data.hasAbyssalLevels !== undefined)
            this._hasAbyssalLevels = data.hasAbyssalLevels;
        if (data.headerUpgradeChains !== undefined) {
            this.headerUpgradeChains.push(...this.game.shop.upgradeChains.getArrayFromIds(data.headerUpgradeChains));
        }
        if (data.headerItemCharges !== undefined) {
            this.headerItemCharges.push(...this.game.items.equipment.getArrayFromIds(data.headerItemCharges));
        }
        if (data.standardLevelRealm !== undefined)
            this.standardLevelRealm = this.game.realms.getObjectSafe(data.standardLevelRealm);
        if (data.abyssalLevelRealm !== undefined)
            this.abyssalLevelRealm = this.game.realms.getObjectSafe(data.abyssalLevelRealm);
    }
    /** Applies modifications to the data registered to this skill */
    modifyData(data) {
        // TODO_SD Implement
    }
    /** Method called after all game data has been registered. */
    postDataRegistration() {
        this.equipMilestones.forEach((milestone) => {
            milestone.setLevel(this);
            if (milestone.abyssalLevel > 0) {
                this.abyssalMilestones.push(milestone);
            } else {
                this.milestones.push(milestone);
            }
        });
        this.equipMilestones = [];
    }
    testTranslations() {
        this.name;
        this.milestones.forEach((milestone) => {
            milestone.name;
        });
    }
    /** Gets the set of items that are obtainable for this skill. Used for testing if all items can be obtained */
    getObtainableItems() {
        const obtainable = new Set();
        this.rareDrops.forEach((drop) => {
            obtainable.add(drop.item);
            if (drop.altItem)
                obtainable.add(drop.altItem);
        });
        return obtainable;
    }
    getAncientRelicsSnapshot() {
        const snapshot = new Map();
        this.ancientRelicSets.forEach((set) => {
            set.foundRelics.forEach((count, relic) => {
                snapshot.set(relic, count);
            });
        });
        return snapshot;
    }
    locateAncientRelic(relicSet, relic) {
        this.queueAncientRelicFoundModal(relicSet, relic);
        relicSet.addRelic(relic);
        if (relicSet.isComplete)
            this.queueAncientRelicFoundModal(relicSet, relicSet.completedRelic);
        this.onAncientRelicUnlock();
    }
    hasMasterRelic(realm) {
        if (!this.game.currentGamemode.allowAncientRelicDrops)
            return false;
        const relicSet = this.ancientRelicSets.get(realm);
        return relicSet !== undefined && relicSet.isComplete;
    }
    onAncientRelicUnlock() {
        this.computeProvidedStats(true);
        this.renderQueue.ancientRelics = true;
        this.game.astrology.renderQueue.constellationRates = true;
    }
    queueAncientRelicFoundModal(relicSet, ancientRelic) {
        const html = `<small class="text-info">${setLang === 'en' ? `${ancientRelic.name} Located!` : getLangString('ANCIENT_RELIC_LOCATED')}<br><br>${ancientRelic.stats.describeAsSpanHTML()}<br><br>${templateLangString('ANCIENT_RELICS_LOCATED_COUNT', {
            value: numberWithCommas(relicSet.foundCount + 1),
            skillName: this.name,
        })}</small>`;
        const modal = {
            title: getLangString('ANCIENT_RELIC_LOCATED'),
            html: html,
            imageUrl: assets.getURI('assets/media/main/relic_progress_5.png'),
            imageWidth: 128,
            imageHeight: 128,
            imageAlt: getLangString('ANCIENT_RELIC_LOCATED'),
        };
        addModalToQueue(modal);
    }
    /** Callback function for opening the skill tree modal */
    openSkillTreeModal() {
        //TODO_C - implement current skill tree selection
        const skillTree = this.skillTrees.getObjectByID('melvorItA:Abyssal');
        if (skillTree === undefined)
            return;
        $('#modal-skill-tree').modal('show');
        skillTreeMenu.updateMenu(this);
        skillTreeMenu.setSkillTree(skillTree, this.game);
    }
}
class MasteryLevelUnlock {
    constructor(data, skill) {
        this.skill = skill;
        this._descriptionID = data.descriptionID;
        this._description = data.description;
        this.level = data.level;
    }
    get description() {
        if (this._descriptionID !== undefined)
            return getLangString(`MASTERY_BONUS_${this.skill.localID}_${this._descriptionID}`);
        return this._description;
    }
}
class MasteryLevelBonus {
    constructor(data, game) {
        /** The base modifiers to apply for this bonus */
        this.modifiers = [];
        /** If the modifiers for this bonus should automatically be scoped to the mastery action */
        this.autoScopeToAction = true;
        if (data.autoScopeToAction !== undefined)
            this.autoScopeToAction = data.autoScopeToAction;
        this.level = data.level;
        if (data.levelScalingSlope !== undefined)
            this.levelScalingSlope = data.levelScalingSlope;
        if (data.levelScalingMax !== undefined)
            this.levelScalingMax = data.levelScalingMax;
        if (data.filter !== undefined)
            this.filter = data.filter;
        game.queueForSoftDependencyReg(data, this);
    }
    registerSoftDependencies(data, game) {
        try {
            this.modifiers = game.getModifierValuesFromData(data.modifiers);
        } catch (e) {
            throw new DataConstructionError(MasteryLevelBonus.name, e);
        }
    }
    /** Returns the scaling that should be applied to this bonuses moodifiers for a given mastery level */
    getBonusScale(masteryLevel) {
        if (masteryLevel < this.level)
            return {
                scale: 0,
                effectiveLevel: 0
            };
        if (this.levelScalingSlope !== undefined) {
            if (this.levelScalingMax !== undefined)
                masteryLevel = Math.min(masteryLevel, this.levelScalingMax);
            const xValue = Math.floor((masteryLevel - this.level) / this.levelScalingSlope);
            const scale = xValue + 1;
            const effectiveLevel = this.level + xValue * this.levelScalingSlope;
            return {
                scale,
                effectiveLevel
            };
        }
        return {
            scale: 1,
            effectiveLevel: this.level
        };
    }
    /** Returns modifiers for this bonus that are scoped to the given action */
    getScopedModifiers(action) {
        if (!this.autoScopeToAction)
            return this.modifiers;
        return this.modifiers.map((value) => {
            if (value.action !== undefined) {
                const newValue = value.clone();
                newValue.action = action;
                return newValue;
            }
            return value;
        });
    }
}
class MasteryPoolBonus {
    constructor(data, game) {
        this.modifiers = [];
        try {
            this.realm = game.realms.getObjectSafe(data.realm);
            this.percent = data.percent;
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(MasteryPoolBonus.name, e);
        }
    }
    registerSoftDependencies(data, game) {
        try {
            this.modifiers = game.getModifierValuesFromData(data.modifiers);
        } catch (e) {
            throw new DataConstructionError(MasteryPoolBonus.name, e);
        }
    }
}
class MasterySkillRenderQueue extends SkillRenderQueue {
    constructor() {
        super(...arguments);
        this.actionMastery = new Set();
        this.masteryPool = new Set();
    }
}
class MasteryLevelChangedEvent extends GameEvent {
    constructor(skill, action, oldLevel, newLevel) {
        super();
        this.skill = skill;
        this.action = action;
        this.oldLevel = oldLevel;
        this.newLevel = newLevel;
    }
}
/** Base class for skills that have mastery */
class SkillWithMastery extends Skill {
    constructor(namespace, id, game, actionClassName = `${id}Action`) {
        super(namespace, id, game);
        this.actionMastery = new Map();
        /** Save state property. Stores the mastery pool XP for each Realm */
        this._masteryPoolXP = new SparseNumericMap();
        /** Cache of Mastery Tokens which can be utilized for this skill per realm */
        this.masteryTokens = new Map();
        /** Sorted array of all mastery actions for the skill */
        this.sortedMasteryActions = [];
        this.masteryLevelUnlocks = [];
        this.totalMasteryActions = new CompletionMap();
        /** Stores a count of how many mastery actions exist in each realm */
        this.totalMasteryActionsInRealm = new SparseNumericMap();
        this._totalCurrentMasteryLevel = new CompletionMap();
        this._totalCurrentMasteryLevelInRealm = new SparseNumericMap();
        /** Stores the mastery pool bonuses provided by this skill per realm */
        this.masteryPoolBonuses = new Map();
        /** Stores the mastery level bonuses provided by this skill */
        this.masteryLevelBonuses = [];
        this._sortedMasteryActionsPerRealm = new Map();
        /** Returns the total number of actions that have mastery that are currently unlocked */
        this.totalUnlockedMasteryActions = 0;
        /** Returns the total number of actions that have mastery that are currently unlocked within a specific realm */
        this.totalUnlockedMasteryActionsInRealm = new SparseNumericMap();
        this.actions = new NamespaceRegistry(game.registeredNamespaces, actionClassName);
    }
    get hasMastery() {
        return true;
    }
    get masteryLevelCap() {
        return 99;
    }
    /** Readonly. Returns the percent of the base mastery pool xp the skill an reach */
    get masteryPoolCapPercent() {
        return 100 + this.game.modifiers.masteryPoolCap;
    }
    /** The chance to receive a mastery token for this skill per action */
    get masteryTokenChance() {
        let chance = this.totalUnlockedMasteryActionsInRealm.get(this.game.defaultRealm) / 185;
        chance *= 1 + this.game.modifiers.offItemChance / 100;
        return chance;
    }
    getRealmOptions() {
        return this.getRealmsWithMastery();
    }
    onLoad() {
        super.onLoad();
        this.queueAllMasteryPoolsForRender();
        this.updateTotalCurrentMasteryLevel();
        this.updateTotalUnlockedMasteryActions();
    }
    onPageChange() {
        this.renderModifierChange();
        this.render();
    }
    renderModifierChange() {
        this.onModifierChange();
    }
    /**
     * @description Rendering hook for when skill modifiers change
     * @deprecated This method will be removed in an upcoming major update. Use renderModifierChange instead.
     */
    onModifierChange() {
        this.queueAllMasteryPoolsForRender();
    }
    render() {
        super.render();
        this.renderActionMastery();
        this.renderMasteryPool();
    }
    renderRealmVisibility() {
        if (this.renderQueue.realmVisibility.size === 0)
            return;
        this.renderQueue.realmVisibility.forEach((realm) => {
            var _a;
            (_a = this.realmSelect) === null || _a === void 0 ? void 0 : _a.updateRealmVisibility(realm);
            if (spendMasteryMenu.curentSkill === this)
                spendMasteryMenu.updateRealmUnlock(realm);
        });
        this.renderQueue.realmVisibility.clear();
    }
    renderActionMastery() {
        if (this.renderQueue.actionMastery.size === 0)
            return;
        this.renderQueue.actionMastery.forEach((action) => {
            this.updateMasteryDisplays(action);
            if (spendMasteryMenu.curentSkill === this && spendMasteryMenu.currentRealm === action.realm)
                spendMasteryMenu.updateAction(this, action);
        });
        this.renderQueue.actionMastery.clear();
    }
    /** Queues every mastery pool in this skill for rendering */
    queueAllMasteryPoolsForRender() {
        this.totalMasteryActionsInRealm.forEach((_, realm) => this.renderQueue.masteryPool.add(realm));
    }
    renderMasteryPool() {
        if (this.renderQueue.masteryPool.size === 0)
            return;
        this.renderQueue.masteryPool.forEach((realm) => {
            const poolDisplays = document.querySelectorAll(`mastery-pool-display[data-skill-id="${this.id}"]`);
            poolDisplays.forEach((icon) => icon.updateProgress(this, realm));
            if (spendMasteryMenu.curentSkill === this && spendMasteryMenu.currentRealm === realm)
                spendMasteryMenu.updateAllActions();
        });
        this.renderQueue.masteryPool.clear();
    }
    /**
     * Callback function to level up a mastery with pool xp
     * @param action The action object to level up
     * @param levels The number of levels to increase the action by
     */
    levelUpMasteryWithPoolXP(action, levels) {
        const currentLevel = this.getMasteryLevel(action);
        const currentXP = this.getMasteryXP(action);
        const nextLevel = Math.min(99, currentLevel + levels);
        const nextXP = exp.levelToXP(nextLevel) + 1;
        const xpToAdd = nextXP - currentXP;
        if (this._masteryPoolXP.get(action.realm) < xpToAdd)
            return;
        const poolLevelChange = this.getPoolBonusChange(action.realm, -xpToAdd);
        if (poolLevelChange < 0 && this.game.settings.showMasteryCheckpointconfirmations) {
            SwalLocale.fire({
                title: getLangString('MENU_TEXT_HOLD_UP'),
                html: `<h5 class="font-w600 text-combat-smoke mb-1">${getLangString('MENU_TEXT_HOLD_UP_0')}</h5><h5 class="font-w300 font-size-sm text-combat-smoke mb-1">${getLangString('MENU_TEXT_HOLD_UP_1')}</h5><h5 class="font-w300 font-size-sm text-danger mb-1"><small>${getLangString('MENU_TEXT_HOLD_UP_2')}</small></h5>`,
                imageUrl: assets.getURI("assets/media/main/mastery_header.png" /* Assets.MasteryIcon */ ),
                imageWidth: 64,
                imageHeight: 64,
                imageAlt: getLangString('MENU_TEXT_MASTERY'),
                showCancelButton: true,
                confirmButtonText: getLangString('MENU_TEXT_CONFIRM'),
            }).then((result) => {
                if (result.value) {
                    this.exchangePoolXPForActionXP(action, xpToAdd);
                }
            });
        } else {
            this.exchangePoolXPForActionXP(action, xpToAdd);
        }
    }
    exchangePoolXPForActionXP(action, xpToAdd) {
        this.addMasteryXP(action, xpToAdd);
        this.addMasteryPoolXP(action.realm, -xpToAdd);
    }
    /**
     * Adds mastery xp and mastery pool xp for completing an action with the given interval
     * @param action The action object to give mastery xp to
     * @param interval The interval of the action performed
     */
    addMasteryForAction(action, interval) {
        const xpToAdd = this.getMasteryXPToAddForAction(action, interval);
        this.addMasteryXP(action, xpToAdd);
        const poolXPToAdd = this.getMasteryXPToAddToPool(xpToAdd);
        this.addMasteryPoolXP(action.realm, poolXPToAdd);
    }
    /**
     * Adds mastery xp for the specified action
     * @param action The action object to give mastery xp to
     * @param xp The experience to add to the action. Modifiers will not be applied.
     * @returns True, if the mastery level was increased
     */
    addMasteryXP(action, xp) {
        let mastery = this.actionMastery.get(action);
        if (mastery === undefined) {
            mastery = {
                xp: 0,
                level: 1,
            };
            this.actionMastery.set(action, mastery);
        }
        mastery.xp += xp;
        const levelIncreased = mastery.xp > exp.levelToXP(mastery.level + 1) && mastery.level < this.masteryLevelCap;
        if (levelIncreased) {
            const oldLevel = mastery.level;
            mastery.level = Math.min(this.masteryLevelCap, exp.xpToLevel(mastery.xp));
            this.onMasteryLevelUp(action, oldLevel, mastery.level);
        }
        if (this.toStrang && mastery.xp > exp.levelToXP(120))
            this.game.petManager.unlockPet(this.toStrang);
        this.renderQueue.actionMastery.add(action);
        return levelIncreased;
    }
    /**
     * Checks if a given action passes the mastery level bonus filter
     * @param action The action to check against the filter
     * @param filter The filter string
     * @returns If the action passes the filter
     */
    checkMasteryLevelBonusFilter(action, filter) {
        return true;
    }
    willMasteryLevelBonusChange(action, oldLevel, newLevel) {
        let oldBonusCount = 0;
        let newBonusCount = 0;
        this.masteryLevelBonuses.every((bonus) => {
            if (bonus.filter === undefined || this.checkMasteryLevelBonusFilter(action, bonus.filter)) {
                oldBonusCount += bonus.getBonusScale(oldLevel).scale;
                newBonusCount += bonus.getBonusScale(newLevel).scale;
            }
            return newLevel >= bonus.level;
        });
        return newBonusCount !== oldBonusCount;
    }
    onMasteryLevelUp(action, oldLevel, newLevel) {
        const oldTotalLevel = this.totalCurrentMasteryLevel;
        this.updateTotalCurrentMasteryLevel();
        if (this.willMasteryLevelBonusChange(action, oldLevel, newLevel))
            this.computeProvidedStats(true);
        this._events.emit('masteryLevelChanged', new MasteryLevelChangedEvent(this, action, oldLevel, newLevel));
        this.game.completion.updateSkillMastery(this);
        if (newLevel >= 99) {
            this.game.combat.notifications.add({
                type: 'Mastery99',
                args: [action],
            });
        } else {
            this.game.combat.notifications.add({
                type: 'Mastery',
                args: [action, newLevel],
            });
        }
        if (oldTotalLevel !== this.totalCurrentMasteryLevel &&
            this.totalCurrentMasteryLevel === this.trueMaxTotalMasteryLevel) {
            this.fireMaximumMasteryModal();
        }
    }
    /** Fires a modal indicating the skill has reached the maximum mastery level */
    fireMaximumMasteryModal() {
        let html = `<h5 class="font-w400">${getLangString('MENU_TEXT_ACHIEVED_100_MASTERY')}</h5><h2 class="text-warning font-w600"><img class="resize-40 mr-1" src="${this.media}">${this.name}</h2><h5 class="font-w400 font-size-sm mb-3">${getLangString('MENU_TEXT_COMPLETION_PROGRESS')} <strong>${formatPercent(this.game.completion.totalProgressTrue, 2)}</strong></h5>`;
        if (this.game.currentGamemode.isEvent) {
            const stat = this.game.stats.General.get(GeneralStats.AccountCreationDate);
            if (stat === 0)
                return;
            html += `<h5 class="font-w400 font-size-sm">${templateLangString('COMPLETION_CHARACTER_AGE', {
                localisedAge: formatAsTimePeriod(new Date().getTime() - stat),
            })}</h5>`;
        }
        addModalToQueue({
            title: getLangString('COMPLETION_CONGRATS'),
            html,
            imageUrl: assets.getURI("assets/media/main/mastery_header.png" /* Assets.MasteryIcon */ ),
            imageWidth: 64,
            imageHeight: 64,
            imageAlt: getLangString('MENU_TEXT_100_PERCENT_MASTERY'),
        });
        showFireworks();
    }
    /** Gets the base XP cap for the mastery pool for the given realm */
    getBaseMasteryPoolCap(realm) {
        return this.getTrueTotalMasteryActionsInRealm(realm) * 500000;
    }
    /** Gets the XP cap for the mastery pool for the given realm */
    getMasteryPoolCap(realm) {
        return Math.floor((this.getBaseMasteryPoolCap(realm) * this.masteryPoolCapPercent) / 100);
    }
    /** Gets the current XP in a mastery pool for the given realm */
    getMasteryPoolXP(realm) {
        return this._masteryPoolXP.get(realm);
    }
    /** Gets the percent progress in a mastery pool for the given realm */
    getMasteryPoolProgress(realm) {
        let percent = (100 * this._masteryPoolXP.get(realm)) / this.getBaseMasteryPoolCap(realm);
        percent += this.game.modifiers.masteryPoolProgress;
        return clampValue(percent, 0, 100);
    }
    /** Method fired when a mastery pool bonus is lost/gained */
    onMasteryPoolBonusChange(realm, oldBonusCount, newBonusCount) {
        if (oldBonusCount !== newBonusCount)
            this.computeProvidedStats(true);
    }
    /** Adds Mastery Pool XP to the given realm */
    addMasteryPoolXP(realm, xp) {
        const oldXP = this._masteryPoolXP.get(realm);
        const xpCap = this.getMasteryPoolCap(realm);
        const newXP = Math.min(oldXP + xp, xpCap);
        this._masteryPoolXP.set(realm, newXP);
        // Check for changes in Mastery Pool Bonuses
        const oldBonusLevel = this.getActiveMasteryPoolBonusCount(realm, oldXP);
        const newBonusLevel = this.getActiveMasteryPoolBonusCount(realm, newXP);
        if (oldBonusLevel !== newBonusLevel) {
            this.onMasteryPoolBonusChange(realm, oldBonusLevel, newBonusLevel);
        }
        this.renderQueue.masteryPool.add(realm);
    }
    /** Gets the change in mastery pool bonus level if xp is added/removed */
    getPoolBonusChange(realm, xp) {
        const oldXP = this._masteryPoolXP.get(realm);
        const newXP = oldXP + xp;
        const oldBonusLevel = this.getActiveMasteryPoolBonusCount(realm, oldXP);
        const newBonusLevel = this.getActiveMasteryPoolBonusCount(realm, newXP);
        return newBonusLevel - oldBonusLevel;
    }
    /** Gets the number of mastery pool bonuses active based on an amount of pool xp, for the given realm */
    getActiveMasteryPoolBonusCount(realm, xp) {
        const progress = (100 * xp) / this.getBaseMasteryPoolCap(realm);
        const bonusArray = this.masteryPoolBonuses.get(realm);
        if (bonusArray === undefined)
            return 0;
        let count = bonusArray.findIndex((bonus) => progress < bonus.percent);
        if (count === -1)
            count = bonusArray.length;
        return count - 1;
    }
    /** Gets the mastery pool bonuses associated with a given realm */
    getMasteryPoolBonusesInRealm(realm) {
        const bonuses = this.masteryPoolBonuses.get(realm);
        if (bonuses === undefined)
            return [];
        return bonuses;
    }
    /** Gets the realms that this skill has actions with mastery in */
    getRealmsWithMastery() {
        return [...this.totalMasteryActionsInRealm.keys()];
    }
    updateTotalCurrentMasteryLevel() {
        this._totalCurrentMasteryLevel.clear();
        this._totalCurrentMasteryLevelInRealm.clear();
        const trueMasteries = new SparseNumericMap();
        const trueMasteriesInRealm = new SparseNumericMap();
        this.actionMastery.forEach(({
            level
        }, action) => {
            if (!(action instanceof DummyMasteryAction)) {
                this._totalCurrentMasteryLevel.add(action.namespace, !action.realm.ignoreCompletion ? level : 1);
                this._totalCurrentMasteryLevelInRealm.add(action.realm, !action.realm.ignoreCompletion ? level : 1);
                trueMasteries.add(action.namespace, 1);
                trueMasteriesInRealm.add(action.realm, 1);
            }
        });
        // Account for 0 xp masteries that are not stored
        this.totalMasteryActions.forEach((total, namespace) => {
            this._totalCurrentMasteryLevel.add(namespace, total - trueMasteries.get(namespace));
        });
        this.totalMasteryActionsInRealm.forEach((total, realm) => {
            this._totalCurrentMasteryLevelInRealm.add(realm, total - trueMasteriesInRealm.get(realm));
        });
    }
    /** Returns the sum of all current mastery levels */
    get totalCurrentMasteryLevel() {
        return this._totalCurrentMasteryLevel.getSum();
    }
    /** Gets an array of mastery actions belonging to a given realm, sorted by display order */
    getSortedMasteryActionsInRealm(realm) {
        const cached = this._sortedMasteryActionsPerRealm.get(realm);
        if (cached === undefined) {
            const filtered = this.sortedMasteryActions.filter((a) => a.realm === realm);
            this._sortedMasteryActionsPerRealm.set(realm, filtered);
            return filtered;
        } else {
            return cached;
        }
    }
    /** Returns the sum of all current mastery levels for within a specific realm */
    getTotalCurrentMasteryLevelInRealm(realm) {
        return this._totalCurrentMasteryLevelInRealm.get(realm);
    }
    getTotalCurrentMasteryLevels(namespace) {
        return this._totalCurrentMasteryLevel.getCompValue(namespace);
    }
    getMaxTotalMasteryLevels(namespace) {
        return this.totalMasteryActions.getCompValue(namespace) * this.masteryLevelCap;
    }
    addTotalCurrentMasteryToCompletion(completion) {
        this._totalCurrentMasteryLevel.forEach((total, namespace) => {
            completion.add(namespace, total);
        });
    }
    /** The maximum total mastery level obtainable for the skill */
    get trueMaxTotalMasteryLevel() {
        return this.trueTotalMasteryActions * this.masteryLevelCap;
    }
    /** The maximum total mastery level obtainable for the skill within the given Realm */
    getTrueMaxTotalMasteryLevelInRealm(realm) {
        return this.getTrueTotalMasteryActionsInRealm(realm) * this.masteryLevelCap;
    }
    /** Readonly. Returns the total amount of mastery XP earned for the skill */
    get totalMasteryXP() {
        let total = 0;
        this.actionMastery.forEach(({
            xp
        }) => {
            total += xp;
        });
        return total;
    }
    /**
     * Utility method for checking if a basic skill recipe is unlocked for this skill
     * @param recipe
     */
    isBasicSkillRecipeUnlocked(recipe) {
        return (((this.hasAbyssalLevels && this.abyssalLevel >= recipe.abyssalLevel) || !this.hasAbyssalLevels) &&
            this.level >= recipe.level);
    }
    /** Recomputes the values of totalUnlockedMasteryActions and totalUnlockedMasteryActionsInRealm */
    updateTotalUnlockedMasteryActions() {
        this.totalUnlockedMasteryActions = 0;
        this.totalUnlockedMasteryActionsInRealm.clear();
        this.actions.forEach((action) => {
            if (this.isMasteryActionUnlocked(action)) {
                this.totalUnlockedMasteryActions++;
                this.totalUnlockedMasteryActionsInRealm.inc(action.realm);
            }
        });
    }
    /** Returns the total number of actions that have mastery for this skill */
    get trueTotalMasteryActions() {
        return this.totalMasteryActions.getSum();
    }
    /** Returns the total number of actions that have mastery for this skill within the given Realm*/
    getTrueTotalMasteryActionsInRealm(realm) {
        return this.totalMasteryActionsInRealm.get(realm);
    }
    /**
     * Gets the modified mastery xp to add for performing an action.
     * @param action The action object to compute mastery xp for
     * @param interval The interval of the action performed
     * @returns The modified XP to add
     */
    getMasteryXPToAddForAction(action, interval) {
        let xpToAdd = this.getBaseMasteryXPToAddForAction(action, interval);
        xpToAdd *= 1 + this.getMasteryXPModifier(action) / 100;
        if (this.game.modifiers.halveMasteryXP > 0)
            xpToAdd /= 2;
        return xpToAdd;
    }
    /**
     * Gets the base mastery xp to add for performing an action.
     * @param action The action object to compute mastery xp for
     * @param interval The interval of the action performed
     * @returns The modified XP to add
     */
    getBaseMasteryXPToAddForAction(action, interval) {
        const totalUnlockedInRealm = this.totalUnlockedMasteryActionsInRealm.get(action.realm);
        const totalCurrent = this.getTotalCurrentMasteryLevelInRealm(action.realm);
        const trueMax = this.getTrueMaxTotalMasteryLevelInRealm(action.realm);
        const trueTotal = this.getTrueTotalMasteryActionsInRealm(action.realm);
        const xpToAdd = (((totalUnlockedInRealm * totalCurrent) / trueMax + this.getMasteryLevel(action) * (trueTotal / 10)) *
                (interval / 1000)) /
            2;
        return xpToAdd;
    }
    /**
     * Gets the mastery XP to add to the pool for performing an action
     * @param xp The modified action mastery xp
     * @returns The mastery XP to add to the pool
     */
    getMasteryXPToAddToPool(xp) {
        if (this.level >= 99)
            return xp / 2;
        return xp / 4;
    }
    getMasteryXPModifier(action) {
        let modifier = this.game.modifiers.getValue("melvorD:masteryXP" /* ModifierIDs.masteryXP */ , this.getActionModifierQuery(action));
        this.game.astrology.masteryXPConstellations.forEach((constellation) => {
            const modValue = this.game.modifiers.getValue(constellation.masteryXPModifier.id, this.modQuery);
            if (modValue > 0)
                modifier += modValue * constellation.maxValueModifiers;
        });
        return modifier;
    }
    _buildMasteryXPSources(action) {
        const builder = new ModifierSourceBuilder(this.game.modifiers, true);
        builder.addSources("melvorD:masteryXP" /* ModifierIDs.masteryXP */ , this.getActionModifierQuery(action));
        this.game.astrology.masteryXPConstellations.forEach((constellation) => {
            builder.addSources(constellation.masteryXPModifier.id, this.modQuery, constellation.maxValueModifiers);
        });
        return builder;
    }
    getMasteryXPSources(action) {
        return this._buildMasteryXPSources(action).getSpans();
    }
    getMasteryLevel(action) {
        const mastery = this.actionMastery.get(action);
        if (mastery === undefined)
            return 1;
        return mastery.level;
    }
    getMasteryXP(action) {
        const mastery = this.actionMastery.get(action);
        if (mastery === undefined)
            return 0;
        return mastery.xp;
    }
    get isAnyMastery99() {
        for (const [_, mastery] of this.actionMastery) {
            if (mastery.level >= 99)
                return true;
        }
        return false;
    }
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.updateTotalUnlockedMasteryActions();
    }
    registerData(namespace, data) {
        var _a, _b, _c;
        super.registerData(namespace, data);
        (_a = data.masteryLevelUnlocks) === null || _a === void 0 ? void 0 : _a.forEach((unlockData) => {
            this.masteryLevelUnlocks.push(new MasteryLevelUnlock(unlockData, this));
        });
        (_b = data.masteryPoolBonuses) === null || _b === void 0 ? void 0 : _b.forEach((bonusData) => {
            const bonus = new MasteryPoolBonus(bonusData, this.game);
            let bonusArray = this.masteryPoolBonuses.get(bonus.realm);
            if (bonusArray === undefined) {
                bonusArray = [];
                this.masteryPoolBonuses.set(bonus.realm, bonusArray);
            }
            bonusArray.push(bonus);
        });
        (_c = data.masteryLevelBonuses) === null || _c === void 0 ? void 0 : _c.forEach((bonusData) => {
            this.masteryLevelBonuses.push(new MasteryLevelBonus(bonusData, this.game));
        });
    }
    modifyData(data) {
        super.modifyData(data);
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.computeTotalMasteryActions();
        this.masteryLevelUnlocks.sort((a, b) => a.level - b.level);
        this.masteryLevelBonuses.sort((a, b) => a.level - b.level);
        this.masteryPoolBonuses.forEach((bonusArray) => {
            bonusArray.sort((a, b) => a.percent - b.percent);
        });
        this.game.items.masteryTokens.forEach((item) => {
            if (item.skill !== this)
                return;
            let tokenArray = this.masteryTokens.get(item.realm);
            if (tokenArray === undefined) {
                tokenArray = [];
                this.masteryTokens.set(item.realm, tokenArray);
            }
            tokenArray.push(item);
        });
        this.toStrang = this.game.pets.getObjectByID(new TextDecoder().decode(new TextEncoder().encode('\\T[e^a5)BPZX').map((a) => a + 17)));
    }
    computeTotalMasteryActions() {
        this.actions.namespaceMaps.forEach((actionMap, namespace) => {
            let total = 0;
            actionMap.forEach((action) => {
                if (!action.realm.ignoreCompletion)
                    total++;
                this.totalMasteryActionsInRealm.inc(action.realm);
            });
            this.totalMasteryActions.set(namespace, total);
        });
    }
    getMasteryProgress(action) {
        const xp = this.getMasteryXP(action);
        const level = this.getMasteryLevel(action);
        const nextLevelXP = exp.levelToXP(level + 1);
        let percent;
        if (level >= 99)
            percent = 100;
        else {
            const currentLevelXP = exp.levelToXP(level);
            percent = (100 * (xp - currentLevelXP)) / (nextLevelXP - currentLevelXP);
        }
        return {
            xp,
            level,
            percent,
            nextLevelXP
        };
    }
    /** Updates all mastery displays in the DOM for the given action */
    updateMasteryDisplays(action) {
        const progress = this.getMasteryProgress(action);
        const attributes = `[data-skill-id="${this.id}"][data-action-id="${action.id}"]`;
        const displays = document.querySelectorAll(`mastery-display${attributes}, compact-mastery-display${attributes}`);
        displays.forEach((display) => display.updateValues(progress));
    }
    /** Gets the best realm to display mastery bonuses + the spend mastery XP modal on when opening */
    getBestMasteryRealm() {
        let candidate = this.currentRealm;
        if (!this.totalMasteryActionsInRealm.has(candidate))
            candidate = this.getRealmsWithMastery()[0];
        return candidate;
    }
    /** Callback function for opening the spend mastery xp modal */
    openSpendMasteryXPModal() {
        this.openSpendMasteryXPModalForRealm(this.getBestMasteryRealm());
    }
    /** Callback function for opening the spend mastery xp modal */
    openSpendMasteryXPModalForRealm(realm) {
        spendMasteryMenu.setSkill(this, realm, this.game);
        $('#modal-spend-mastery-xp').modal('show');
    }
    /** Callback function for opening the mastery level unlocks modal */
    openMasteryLevelUnlockModal() {
        const masteryHTML = `
    <div class="block block-rounded block-link-pop border-top border-${setToLowercase(this.localID)} border-4x">
      <div class="block-header">
        <h3 class="block-title"><img class="mastery-icon-xs mr-2" src="${assets.getURI("assets/media/main/mastery_header.png" /* Assets.MasteryIcon */)}">${this.name}</h3>
        <div class="block-options">
          <button type="button" class="btn-block-option" data-dismiss="modal" aria-label="Close">
            <i class="fa fa-fw fa-times"></i>
          </button>
        </div>
      </div>
      <div class="row">
        <div class="col-12">
          <div class="block-content">
            <table class="table table-sm table-vcenter">
              <thead>
                <tr>
                  <th class="text-center" style="width: 65px;">${getLangString('MENU_TEXT_MASTERY')}</th>
                  <th>${getLangString('MENU_TEXT_UNLOCKS')}</th>
                </tr>
              </thead>
              <tbody>
                ${this.masteryLevelUnlocks
            .map((unlock) => `
                <tr>
                  <th class="text-center" scope="row">${unlock.level}</th>
                  <td class="font-w600 font-size-sm">${unlock.description}</td>
                </tr>`)
            .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
        $('#modal-content-mastery').html(masteryHTML);
        $('#modal-mastery').modal('show');
    }
    openMasteryPoolBonusModal() {
        this.openMasteryPoolBonusModalForRealm(this.getBestMasteryRealm());
    }
    /** Opens the mastery pool bonus modal for a given realm */
    openMasteryPoolBonusModalForRealm(realm) {
        const bonusesElement = document.getElementById('modal-mastery-pool-bonuses');
        bonusesElement.setSkill(this, realm);
        $('#modal-mastery-checkpoints').modal('show');
    }
    /** Rolls for all pets that have been registered to the skill */
    rollForPets(interval, action) {
        this.pets.forEach((pet) => {
            if (action === undefined || pet.isCorrectRealmForPetDrop(action.realm)) {
                if (pet.scaleChanceWithMasteryPool)
                    interval *= 1 + this.getMasteryPoolProgress(this.game.defaultRealm) / 100;
                this.game.petManager.rollForSkillPet(pet, interval, this);
            }
        });
    }
    /** Rolls to add a mastery token to action rewards */
    rollForMasteryTokens(rewards, realm) {
        const tokens = this.masteryTokens.get(realm);
        if (tokens === undefined)
            return;
        tokens.forEach((token) => {
            if (!token.rollInSkill)
                return;
            if (rollPercentage(this.masteryTokenChance)) {
                const qty = 1 + this.game.modifiers.flatMasteryTokens;
                rewards.addItem(token, qty);
            }
        });
    }
    addProvidedStats() {
        super.addProvidedStats();
        this.addMasteryLevelBonusStats();
        this.addMasteryPoolBonusStats();
    }
    getMasteryLevelSource(action, level) {
        return {
            name: templateLangString('MASTERY_LEVEL_SOURCE', {
                itemName: action.name,
                level: `${level}`
            }),
        };
    }
    /** Adds the modifiers provided by this skill's mastery level bonuses to the provided modifiers object */
    addMasteryLevelBonusStats() {
        this.actions.forEach((action) => {
            const masteryLevel = this.getMasteryLevel(action);
            this.masteryLevelBonuses.every((bonus) => {
                if (bonus.filter === undefined || this.checkMasteryLevelBonusFilter(action, bonus.filter)) {
                    const {
                        scale,
                        effectiveLevel
                    } = bonus.getBonusScale(masteryLevel);
                    if (scale > 0) {
                        this.providedStats.modifiers.addModifiers(this.getMasteryLevelSource(action, effectiveLevel), bonus.getScopedModifiers(action), scale, scale);
                    }
                }
                return masteryLevel >= bonus.level;
            });
        });
    }
    getMasteryPoolSource(percent) {
        return {
            name: templateLangString('MASTERY_POOL_SOURCE', {
                percent: percent.toString(),
                skillName: this.name
            }),
        };
    }
    /** Adds the modifiers provided by this skill's mastery pool bonuses to the provided modifiers object */
    addMasteryPoolBonusStats() {
        this.masteryPoolBonuses.forEach((bonusArray, realm) => {
            const poolPercent = this.getMasteryPoolProgress(realm);
            for (let i = 0; i < bonusArray.length; i++) {
                const bonus = bonusArray[i];
                if (poolPercent < bonus.percent)
                    break;
                this.providedStats.modifiers.addModifiers(this.getMasteryPoolSource(bonus.percent), bonus.modifiers);
            }
        });
    }
    encode(writer) {
        super.encode(writer);
        writer.writeMap(this.actionMastery, writeNamespaced, ({
            xp
        }, writer) => {
            writer.writeFloat64(xp);
        });
        writer.writeSparseNumericMap(this._masteryPoolXP, writeNamespaced);
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.actionMastery = reader.getMap((reader) => {
            const action = reader.getNamespacedObject(this.actions);
            if (typeof action !== 'string')
                return action;
            else if (action.startsWith('melvor'))
                return this.game.constructDummyObject(action, DummyMasteryAction);
            else
                return undefined;
        }, (reader) => {
            const xp = reader.getFloat64();
            const level = Math.min(this.masteryLevelCap, exp.xpToLevel(xp));
            return {
                xp,
                level,
            };
        });
        if (version < 103 /* SaveVersion.MasteryPool */ ) {
            const poolXP = reader.getFloat64();
            this._masteryPoolXP.set(this.game.defaultRealm, poolXP);
        } else {
            this._masteryPoolXP = reader.getSparseNumericMap(readNamespacedReject(this.game.realms));
        }
    }
    /** Converts the old mastery array for the skill */
    convertOldMastery(oldMastery, idMap) {
        this._masteryPoolXP.set(this.game.defaultRealm, oldMastery.pool);
        oldMastery.xp.forEach((xp, oldActionID) => {
            if (xp <= 0)
                return;
            const actionID = this.getActionIDFromOldID(oldActionID, idMap);
            if (actionID === undefined)
                return;
            let action = this.actions.getObjectByID(actionID);
            if (action === undefined)
                action = this.game.constructDummyObject(actionID, DummyMasteryAction);
            this.actionMastery.set(action, {
                xp,
                level: Math.min(this.masteryLevelCap, exp.xpToLevel(xp)),
            });
        });
    }
}
// TODO: Work in push notifications into all skills
/** Base class for gathering skills. E.g. Skills that return resources but does not consume them. */
class GatheringSkill extends SkillWithMastery {
    constructor() {
        super(...arguments);
        /** Timer for skill action */
        this.actionTimer = new Timer('Skill', () => this.action());
        /** If the skill is the currently active skill */
        this.isActive = false;
        /** If the action state should be reset after save load */
        this.shouldResetAction = false;
    }
    get activeSkills() {
        if (!this.isActive)
            return [];
        else
            return [this];
    }
    /** Returns if the skill can currently stop */
    get canStop() {
        return this.isActive && !this.game.isGolbinRaid;
    }
    /** Gets the interval of the currently running action in [ms] */
    get currentActionInterval() {
        return this.actionTimer.maxTicks * TICK_INTERVAL;
    }
    get activePotion() {
        return this.game.potions.getActivePotionForAction(this);
    }
    /** Processes a tick of time for the skill */
    activeTick() {
        this.timeToLevelTicks++;
        this.actionTimer.tick();
    }
    onPageChange() {
        if (this.isActive) {
            this.renderQueue.progressBar = true;
        }
        super.onPageChange();
    }
    /** Performs rendering for the skill */
    render() {
        super.render();
    }
    /** Gets debugging information for the skill */
    getErrorLog() {
        return `Is Active: ${this.isActive}\n`;
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        this.masteryTokens.forEach((tokenArray) => {
            tokenArray.forEach((item) => {
                if (item.rollInSkill)
                    obtainable.add(item);
            });
        });
        return obtainable;
    }
    /** Starts up the skill with whatever selections have been made. Returns true if the skill was successfully started. */
    start() {
        const canStart = !this.game.idleChecker(this);
        if (canStart) {
            if (!this.game.currentGamemode.enableInstantActions) {
                this.isActive = true;
                this.game.renderQueue.activeSkills = true;
                this.startActionTimer();
                this.game.activeAction = this;
                this.game.scheduleSave();
            } else {
                this.isActive = true;
                this.game.renderQueue.activeSkills = true;
                this.game.activeAction = this;
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
    /** Returns true if action stopped successfully */
    stop() {
        if (!this.canStop)
            return false;
        this.isActive = false;
        this.actionTimer.stop();
        this.renderQueue.progressBar = true;
        this.game.renderQueue.activeSkills = true;
        this.game.clearActiveAction(false);
        this.onStop();
        this.game.scheduleSave();
        // Fire XP telemetry events on stop
        this.game.telemetry.fireEventType('online_xp_gain');
        this.game.telemetry.fireEventType('offline_xp_gain'); // Just in case there is still an offline event in queue
        return true;
    }
    /** Method that occurs on stopping a skill, but before saving.
     *  Usage is for state changes required
     */
    onStop() {}
    /** Starts the timer for the skill with the actionInterval */
    startActionTimer() {
        this.actionTimer.start(this.actionInterval);
        this.renderQueue.progressBar = true;
    }
    /** Performs the main action for the skill, then determines if it should continue */
    action() {
        this.preAction();
        const continueSkill = this.addActionRewards();
        this.postAction();
        if (continueSkill) {
            this.startActionTimer();
        } else {
            this.stop();
        }
    }
    /** Addes rewards to player, returns false if skill should stop */
    addActionRewards() {
        const rewards = this.actionRewards;
        rewards.setSourceIfUnknown(`Skill.${this.id}`);
        rewards.recordSkillCurrencyStats(this, 0 /* SkillCurrencyStats.Earned */ );
        const notAllGiven = rewards.giveRewards();
        return !(notAllGiven && !this.game.settings.continueIfBankFull);
    }
    /** Adds rewards that are common to all skills for a successful action */
    addCommonRewards(rewards, action) {
        this.rollForRareDrops(this.actionLevel, rewards, action);
        this.rollForAdditionalItems(rewards, this.currentActionInterval, action);
        this.addMasteryXPReward();
        if (action !== undefined) {
            this.rollForMasteryTokens(rewards, action.realm);
            this.rollForAncientRelics(this.actionLevel, action.realm); // TODO_AR the level used should depend on the realm
        }
        this.rollForPets(this.currentActionInterval, action);
        eventManager.rollForEventRewards(this.currentActionInterval, this, rewards);
        this.game.summoning.rollMarksForSkill(this, this.masteryModifiedInterval, action === null || action === void 0 ? void 0 : action.realm);
    }
    /** Adds the mastery XP reward for the current action */
    addMasteryXPReward() {
        this.addMasteryForAction(this.masteryAction, this.masteryModifiedInterval);
    }
    resetActionState() {
        if (this.isActive)
            this.game.clearActionIfActiveOrPaused(this);
        this.isActive = false;
        this.actionTimer.stop();
    }
    encode(writer) {
        super.encode(writer);
        writer.writeBoolean(this.isActive);
        this.actionTimer.encode(writer);
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.isActive = reader.getBoolean();
        this.actionTimer.decode(reader, version);
    }
    /** Deserializes the skills state data */
    deserialize(reader, version, idMap) {
        this.isActive = reader.getBool();
        this.actionTimer.deserialize(reader.getChunk(3), version);
    }
}
/** Base class for crafting skills. E.g. Skills that consume resources to make other resources. */
class CraftingSkill extends GatheringSkill {
    /** Records statistics for preserving resources */
    recordCostPreservationStats(costs) {
        costs.recordSkillCurrencyStats(this, 2 /* SkillCurrencyStats.Preserved */ );
    }
    /** Records statistics for consuming resources */
    recordCostConsumptionStats(costs) {
        costs.recordSkillCurrencyStats(this, 1 /* SkillCurrencyStats.Spent */ );
    }
    /** Performs the main action for the skill, stopping if the required resources are not met */
    action() {
        const recipeCosts = this.getCurrentRecipeCosts();
        if (!recipeCosts.checkIfOwned()) {
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, this.noCostsMessage, 'danger']
            });
            this.stop();
            return;
        }
        this.preAction();
        const preserve = rollPercentage(this.getPreservationChance(this.masteryAction));
        if (preserve) {
            this.game.combat.notifications.add({
                type: 'Preserve',
                args: [this]
            });
            this.recordCostPreservationStats(recipeCosts);
        } else {
            recipeCosts.consumeCosts();
            this.recordCostConsumptionStats(recipeCosts);
        }
        const continueSkill = this.addActionRewards();
        this.postAction();
        const nextCosts = this.getCurrentRecipeCosts();
        if (nextCosts.checkIfOwned() && continueSkill) {
            this.startActionTimer();
        } else {
            if (!nextCosts.checkIfOwned())
                this.game.combat.notifications.add({
                    type: 'Player',
                    args: [this, this.noCostsMessage, 'danger']
                });
            this.stop();
        }
    }
}
class DummyActiveAction extends NamespacedObject {
    constructor(dummyData) {
        super(dummyData.dataNamespace, dummyData.localID);
        this.isActive = false;
    }
    get name() {
        if (this.isModded) {
            return `Unregistered Modded Action: ${this.id}`; // TODO_L: Localize
        } else {
            return `Error Unregistered Game Skill: ${this.id}`; // TODO_L: Localize
        }
    }
    get media() {
        return assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
    }
    get activeSkills() {
        return [];
    }
    getErrorLog() {
        return `Error: Unregistered Action: ${this.id}`;
    }
    stop() {
        return false;
    }
    activeTick() {
        throw new Error('Error Tried to tick dummy active action.');
    }
}
/** Base class for skill recipes with a level requirement and fixed xp */
class BasicSkillRecipe extends MasteryAction {
    constructor(namespace, data, game) {
        var _a, _b;
        super(namespace, data, game);
        this.baseExperience = data.baseExperience;
        this.level = data.level;
        this.abyssalLevel = (_a = data.abyssalLevel) !== null && _a !== void 0 ? _a : 0;
        this.baseAbyssalExperience = (_b = data.baseAbyssalExperience) !== null && _b !== void 0 ? _b : 0;
    }
    applyDataModification(data, game) {
        if (data.baseExperience !== undefined)
            this.baseExperience = data.baseExperience;
        if (data.level !== undefined)
            this.level = data.level;
        if (data.abyssalLevel !== undefined)
            this.abyssalLevel = data.abyssalLevel;
        if (data.baseAbyssalExperience !== undefined)
            this.baseAbyssalExperience = data.baseAbyssalExperience;
    }
}
/** Sorting callback function for this class, that sorts by level, then by abyssalLevel */
BasicSkillRecipe.sortByLevels = (a, b) => {
    if (a.level === b.level) {
        return a.abyssalLevel - b.abyssalLevel;
    }
    return a.level - b.level;
};
/** Base class for skill recipes that produce a single product item */
class SingleProductRecipe extends BasicSkillRecipe {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        try {
            this.product = game.items.getObjectSafe(data.productId);
        } catch (e) {
            throw new DataConstructionError(SingleProductRecipe.name, e, this.id);
        }
    }
    get name() {
        return this.product.name;
    }
    get media() {
        return this.product.media;
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            if (data.productId !== undefined)
                this.product = game.items.getObjectSafe(data.productId);
        } catch (e) {
            throw new DataModificationError(SingleProductRecipe.name, e, this.id);
        }
    }
}
class SkillCategory extends RealmedObject {
    constructor(namespace, data, skill, game) {
        super(namespace, data, game);
        this.skill = skill;
        this._name = data.name;
        this._media = data.media;
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`SKILL_CATEGORY_${this.skill.localID}_${this.localID}`);
        }
    }
}
class SkillSubcategory extends NamespacedObject {
    constructor(namespace, data) {
        super(namespace, data.id);
        this._name = data.name;
        if (data.nameLang !== undefined)
            this._nameLang = data.nameLang;
    }
    get name() {
        if (this._nameLang !== undefined)
            return getLangString(this._nameLang);
        return this._name;
    }
}
class GatheringSkillRenderQueue extends MasterySkillRenderQueue {
    constructor() {
        super(...arguments);
        this.progressBar = false;
    }
}
/** Utility class for Defining Fixed costs */
class FixedCosts {
    constructor(data, game) {
        try {
            if (data.currencies !== undefined)
                this.currencies = game.getCurrencyQuantities(data.currencies);
            // TODO_D - deprecated property support
            if (data.gp) {
                if (!this.currencies)
                    this.currencies = [];
                this.currencies.push({
                    currency: game.gp,
                    quantity: data.gp,
                });
            }
            if (data.sc) {
                if (!this.currencies)
                    this.currencies = [];
                this.currencies.push({
                    currency: game.slayerCoins,
                    quantity: data.sc,
                });
            }
            if (data.items !== undefined)
                this.items = game.items.getQuantities(data.items);
        } catch (e) {
            throw new DataConstructionError(FixedCosts.name, e);
        }
    }
}
/** Class to manage the item, gp, and slayer coin costs of crafting skills */
class Costs {
    constructor(game) {
        this.game = game;
        this._items = new Map();
        this._currencies = new Map();
        this._source = 'Unknown';
    }
    /** Returns true if all of the costs are zero */
    get isFree() {
        return this._currencies.size === 0 && this._items.size === 0;
    }
    /** Adds an item by its unique string identifier */
    addItemByID(itemID, quantity) {
        const item = this.game.items.getObjectByID(itemID);
        if (item === undefined)
            throw new Error(`Error adding item with id: ${itemID}, item is not registered.`);
        this.addItem(item, quantity);
    }
    addItem(item, quantity) {
        var _a;
        this._items.set(item, quantity + ((_a = this._items.get(item)) !== null && _a !== void 0 ? _a : 0));
    }
    addCurrency(currency, quantity) {
        var _a;
        this._currencies.set(currency, quantity + ((_a = this._currencies.get(currency)) !== null && _a !== void 0 ? _a : 0));
    }
    /** Shortcut for addCurrency(game.gp, amount) */
    addGP(amount) {
        this.addCurrency(this.game.gp, amount);
    }
    /** Shortcut for addCurrency(game.slayerCoins, amount) */
    addSlayerCoins(amount) {
        this.addCurrency(this.game.slayerCoins, amount);
    }
    setSource(source) {
        this._source = source;
    }
    setSourceIfUnknown(source) {
        if (this._source === 'Unknown')
            this._source = source;
    }
    /**
     * Adds an ItemCurrencyLikes costs to the costs.
     * @param costs The costs to add
     * @param multiplier Optional multiplier to all of the costs. Item costs can not be reduced below 1.
     */
    addItemsAndCurrency(costs, multiplier = 1) {
        var _a, _b;
        (_a = costs.currencies) === null || _a === void 0 ? void 0 : _a.forEach(({
            currency,
            quantity
        }) => {
            this.addCurrency(currency, Math.floor(quantity * multiplier));
        });
        (_b = costs.items) === null || _b === void 0 ? void 0 : _b.forEach(({
            item,
            quantity
        }) => {
            quantity = Math.max(Math.floor(quantity * multiplier), 1);
            this.addItem(item, quantity);
        });
    }
    /**
     * Gets an ItemQuantity array to interface with UI classes
     */
    getItemQuantityArray() {
        const costArray = [];
        this._items.forEach((quantity, item) => costArray.push({
            item,
            quantity
        }));
        return costArray;
    }
    /** Gets a CurrencyQuantity array to interface with UI classes */
    getCurrencyQuantityArray() {
        const currencies = [];
        this._currencies.forEach((quantity, currency) => currencies.push({
            currency,
            quantity
        }));
        return currencies;
    }
    /** Increments the skill stat provided for each currency by their amount */
    recordSkillCurrencyStats(skill, stat) {
        this._currencies.forEach((amount, currency) => {
            currency.stats.skill.add(skill, stat, amount);
        });
    }
    /** Increments the stat provided for each currency by their amount */
    recordCurrencyStats(stat) {
        this._currencies.forEach((amount, currency) => {
            currency.stats.add(stat, amount);
        });
    }
    /** Increments the stat provided by the quantity of all item costs */
    recordBulkItemStat(tracker, stat) {
        let statTotal = 0;
        this._items.forEach((qty) => {
            statTotal += qty;
        });
        tracker.add(stat, statTotal);
    }
    /** Increments the stat provided by the base sale cost of all item costs */
    recordItemSkillCurrencyStat(skill, stat) {
        this._items.forEach((qty, item) => {
            item.sellsFor.currency.stats.skill.add(skill, stat, qty * item.sellsFor.quantity);
        });
    }
    /** Increments the Item stat provided for all item costs by their quantity */
    recordIndividualItemStat(stat) {
        this._items.forEach((qty, item) => {
            this.game.stats.Items.add(item, stat, qty);
        });
    }
    /** Resets all stored costs */
    reset() {
        this._currencies.clear();
        this._items.clear();
    }
    /** Checks if the player has all the costs */
    checkIfOwned() {
        let owned = true;
        this._currencies.forEach((qty, currency) => {
            owned && (owned = currency.canAfford(qty));
        });
        this._items.forEach((qty, item) => {
            owned && (owned = this.game.bank.getQty(item) >= qty);
        });
        return owned;
    }
    /** Consumes all the stored costs from the player */
    consumeCosts() {
        this._currencies.forEach((quantity, currency) => {
            currency.remove(quantity);
            if (currency === this.game.gp)
                this.game.telemetry.createGPAdjustedEvent(-quantity, currency.amount, this._source);
            if (currency === this.game.abyssalPieces)
                this.game.telemetry.createAPAdjustedEvent(-quantity, currency.amount, this._source);
        });
        this._items.forEach((quantity, item) => {
            if (quantity > 0)
                this.game.bank.removeItemQuantity(item, quantity, true);
        });
    }
    /** Creates a clone of this costs object */
    clone() {
        const clone = new Costs(this.game);
        clone.addCosts(this);
        return clone;
    }
    /** Adds another costs object's costs to this one */
    addCosts(costs) {
        costs._currencies.forEach((quantity, currency) => {
            this.addCurrency(currency, quantity);
        });
        costs._items.forEach((quantity, item) => {
            this.addItem(item, quantity);
        });
    }
}
/** Class to manage the gain of rewards from crafting skills */
class Rewards extends Costs {
    constructor() {
        super(...arguments);
        this.source = 'Game.Unknown'; // Used for Telemetry
        this.actionInterval = 0; // Used for Telemetry
        this._xp = new Map();
        this._abyssalXP = new Map();
    }
    addXP(skill, amount, action) {
        Rewards.addToXPMap(this._xp, skill, amount, action);
    }
    getXP(skill, action) {
        return Rewards.getFromXPMap(this._xp, skill, action);
    }
    addAbyssalXP(skill, amount, action) {
        Rewards.addToXPMap(this._abyssalXP, skill, amount, action);
    }
    getAbyssalXP(skill, action) {
        return Rewards.getFromXPMap(this._abyssalXP, skill, action);
    }
    setActionInterval(interval) {
        this.actionInterval = interval;
    }
    /** Gives the currently set rewards to the player, returns true if not all items were given */
    giveRewards(ignoreBankSpace = false) {
        let notAllItemsGiven = false;
        this._items.forEach((quantity, item) => {
            notAllItemsGiven = !this.game.bank.addItem(item, quantity, true, true, ignoreBankSpace, true, this.source) || notAllItemsGiven;
        });
        this._currencies.forEach((quantity, currency) => {
            currency.add(quantity);
            if (currency === this.game.gp)
                this.game.telemetry.createGPAdjustedEvent(quantity, currency.amount, this.source);
            if (currency === this.game.abyssalPieces)
                this.game.telemetry.createAPAdjustedEvent(quantity, currency.amount, this.source);
        });
        this._xp.forEach((xp, skill) => {
            const xpBefore = skill.xp;
            const levelBefore = skill.level;
            if (xp.noAction > 0)
                skill.addXP(xp.noAction);
            xp.action.forEach((amount, action) => {
                skill.addXP(amount, action);
            });
            if (skill.xp > xpBefore) {
                this.game.telemetry.createOnlineXPGainEvent(skill, this.actionInterval, xpBefore, skill.xp, levelBefore, skill.level);
            }
        });
        this._abyssalXP.forEach((xp, skill) => {
            const xpBefore = skill.abyssalXP;
            const levelBefore = skill.abyssalLevel;
            if (xp.noAction > 0)
                skill.addAbyssalXP(xp.noAction);
            xp.action.forEach((amount, action) => {
                skill.addAbyssalXP(amount, action);
            });
            if (skill.abyssalXP > xpBefore) {
                this.game.telemetry.createOnlineAXPGainEvent(skill, this.actionInterval, xpBefore, skill.abyssalXP, levelBefore, skill.abyssalLevel);
            }
        });
        return notAllItemsGiven;
    }
    /** Forcefully gives the currently set rewards to the player, ignoring bank space for the items */
    forceGiveRewards() {
        return this.giveRewards(true);
    }
    reset() {
        super.reset();
        this._xp.clear();
    }
    setSource(source) {
        this.source = source;
    }
    static addToXPMap(xpMap, skill, amount, action) {
        var _a;
        let xp = xpMap.get(skill);
        if (xp === undefined) {
            xp = {
                noAction: 0,
                action: new Map(),
            };
            xpMap.set(skill, xp);
        }
        if (action === undefined) {
            xp.noAction += amount;
        } else {
            xp.action.set(action, amount + ((_a = xp.action.get(action)) !== null && _a !== void 0 ? _a : 0));
        }
    }
    static getFromXPMap(xpMap, skill, action) {
        var _a;
        const xp = xpMap.get(skill);
        if (xp === undefined)
            return 0;
        if (action === undefined) {
            return xp.noAction;
        } else {
            return (_a = xp.action.get(action)) !== null && _a !== void 0 ? _a : 0;
        }
    }
}
//# sourceMappingURL=skill.js.map
checkFileVersion('?12097')