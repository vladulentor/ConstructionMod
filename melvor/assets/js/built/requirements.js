"use strict";
// Generalized requirements system
/** Base class for all requirements */
class GameRequirement {
    constructor(game) {
        this.game = game;
    }
    /** Checks if this requirement is met, and optionally fires a notification if it is not */
    check(notifyOnFailure = false) {
        const met = this.isMet();
        if (!met && notifyOnFailure)
            this.notifyFailure();
        return met;
    }
    /**
     * Assigns an event handler for when the requirement changes
     * @param callback The function to call when the requirement changes
     * @returns A function that may be called to unassign the handlers
     */
    assignHandler(callback) {
        const handler = this.getHandler(callback);
        this._assignHandler(handler);
        return () => this._unassignHandler(handler);
    }
    getHandler(callback) {
        return callback;
    }
    /** Creates an image element for use in node templating */
    createImage(media, imageClass) {
        return createElement('img', {
            className: imageClass,
            attributes: [
                ['src', media]
            ]
        });
    }
}
/** Requires that the player has achieved percent total completion in the specified namespace */
class CompletionRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'Completion';
        try {
            this.percent = data.percent;
            this.namespace = game.registeredNamespaces.getNamespaceSafe(data.namespace);
        } catch (e) {
            throw new DataConstructionError(CompletionRequirement.name, e);
        }
    }
    isMet() {
        return this.game.completion.totalProgressMap.get(this.namespace.name) >= this.percent;
    }
    notifyFailure() {
        const langID = this.namespace.isModded ?
            'COMPLETION_PERCENT_REQUIRED_MOD' :
            `COMPLETION_PERCENT_REQUIRED_${this.namespace.name}`;
        notifyPlayer(this.game.attack, templateLangString(`TOASTS_${langID}`, {
            percent: `${this.percent}`,
            modName: `${this.namespace.displayName}`,
        }), 'danger');
    }
    getHandler(callback) {
        return (e) => {
            if (e.namespace === this.namespace.name)
                callback(e);
        };
    }
    _assignHandler(handler) {
        this.game.completion.on('percentChanged', handler);
    }
    _unassignHandler(handler) {
        this.game.completion.off('percentChanged', handler);
    }
    getNodes(imageClass) {
        return [
            templateLangString(`MENU_TEXT_${this.namespace.isModded ? 'REQUIRES_COMPLETION_MOD' : `REQUIRES_COMPLETION_${this.namespace.name}`}`, {
                percent: `${this.percent}`,
                modName: this.namespace.displayName
            }),
        ];
    }
}
/** Requires that the given skills level is greater or equal than level */
class SkillLevelRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'SkillLevel';
        try {
            this.skill = this.game.skills.getObjectSafe(data.skillID);
            this.level = data.level;
        } catch (e) {
            throw new DataConstructionError(SkillLevelRequirement.name, e);
        }
    }
    isMet() {
        return this.skill.isUnlocked && this.skill.level >= this.level;
    }
    notifyFailure() {
        if (!this.skill.isUnlocked) {
            lockedSkillAlert(this.skill, 'SKILL_UNLOCK_DO_THAT');
        } else {
            notifyPlayer(this.skill, templateLangString('TOASTS_SKILL_LEVEL_REQUIRED', {
                level: `${this.level}`,
                skillName: this.skill.name,
            }), 'danger');
        }
    }
    _assignHandler(handler) {
        this.skill.on('levelChanged', handler);
    }
    _unassignHandler(handler) {
        this.skill.off('levelChanged', handler);
    }
    getNodes(imageClass) {
        return templateLangStringWithNodes('MENU_TEXT_REQUIRES_SKILL_LEVEL', {
            skillImage: this.createImage(this.skill.media, imageClass)
        }, {
            level: `${this.level}`
        });
    }
}
/** Requires that the given skill's abyssal level is greater or equal than level */
class AbyssalLevelRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'AbyssalLevel';
        try {
            const skill = this.game.skills.getObjectSafe(data.skillID);
            if (!skill.hasAbyssalLevels)
                throw new Error(`${Skill.name} with id: "${data.skillID}" does not have abyssal levels.`);
            this.skill = skill;
            this.level = data.level;
        } catch (e) {
            throw new DataConstructionError(AbyssalLevelRequirement.name, e);
        }
    }
    isMet() {
        return this.skill.isUnlocked && this.skill.abyssalLevel >= this.level;
    }
    notifyFailure() {
        if (!this.skill.isUnlocked) {
            lockedSkillAlert(this.skill, 'SKILL_UNLOCK_DO_THAT');
        } else {
            notifyPlayer(this.skill, templateLangString('ABYSSAL_LEVEL_REQUIRED_TO_DO_THAT', {
                level: `${this.level}`,
                skillName: this.skill.name
            }), 'danger');
        }
    }
    _assignHandler(handler) {
        this.skill.on('abyssalLevelChanged', handler);
    }
    _unassignHandler(handler) {
        this.skill.off('abyssalLevelChanged', handler);
    }
    getNodes(imageClass) {
        return templateLangStringWithNodes('REQUIRES_ABYSSAL_LEVEL', {
            skillImage: this.createImage(this.skill.media, imageClass)
        }, {
            level: `${this.level}`
        });
    }
}
/** Requires that all skill registered to the game have a level greater than or equal to the level */
class AllSkillLevelRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'AllSkillLevels';
        try {
            this.level = data.level;
            if (data.namespace !== undefined) {
                this.namespace = game.registeredNamespaces.getNamespaceSafe(data.namespace);
            }
            if (data.exceptions !== undefined) {
                this.exceptions = game.skills.getSetFromIds(data.exceptions);
            }
        } catch (e) {
            throw new DataConstructionError(AllSkillLevelRequirement.name, e);
        }
    }
    checkSkill(skill) {
        return skill.level >= this.level || (this.exceptions !== undefined && this.exceptions.has(skill));
    }
    isMet() {
        let met = false;
        if (this.namespace !== undefined) {
            met = this.game.skills.everyInNamespace(this.namespace.name, (s) => this.checkSkill(s));
        } else {
            met = this.game.skills.every((s) => this.checkSkill(s));
        }
        return met;
    }
    notifyFailure() {
        let message;
        if (this.namespace === undefined || this.namespace.name === "melvorTrue" /* Namespaces.True */ ) {
            message = templateLangString('TOASTS_ALL_SKILL_LEVEL_REQUIRED', {
                level: `${this.level}`
            });
        } else {
            const langID = this.namespace.isModded ?
                'TOASTS_ALL_SKILL_LEVEL_REQUIRED_MOD' :
                `TOASTS_ALL_SKILL_LEVEL_REQUIRED_${this.namespace.name}`;
            message = templateLangString(langID, {
                level: `${this.level}`,
                modName: `${this.namespace.displayName}`,
            });
        }
        imageNotify(assets.getURI('assets/media/main/milestones_header.png'), message, 'danger');
    }
    _assignHandler(handler) {
        if (this.namespace !== undefined) {
            this.game.skills.forEachInNamespace(this.namespace.name, (skill) => {
                if (this.exceptions !== undefined && this.exceptions.has(skill))
                    return;
                skill.on('levelChanged', handler);
            });
        } else {
            this.game.skills.forEach((skill) => {
                if (this.exceptions !== undefined && this.exceptions.has(skill))
                    return;
                skill.on('levelChanged', handler);
            });
        }
    }
    _unassignHandler(handler) {
        if (this.namespace !== undefined) {
            this.game.skills.forEachInNamespace(this.namespace.name, (skill) => {
                if (this.exceptions !== undefined && this.exceptions.has(skill))
                    return;
                skill.off('levelChanged', handler);
            });
        } else {
            this.game.skills.forEach((skill) => {
                if (this.exceptions !== undefined && this.exceptions.has(skill))
                    return;
                skill.off('levelChanged', handler);
            });
        }
    }
    getNodes(imageClass) {
        var _a, _b;
        const templateData = {
            level: `${this.level}`,
            skillNames: this.exceptions !== undefined ? joinAsList([...this.exceptions].map((skill) => skill.name)) : '',
            modName: (_b = (_a = this.namespace) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '',
        };
        let langID = this.exceptions === undefined ? 'MENU_TEXT_REQUIRES_ALL_SKILL' : 'MENU_TEXT_REQUIRES_ALL_SKILL_EXCEPTION';
        if (this.namespace !== undefined && !(this.namespace.name === "melvorTrue" /* Namespaces.True */ )) {
            if (this.namespace.isModded) {
                langID = `${langID}_MOD`;
            } else {
                langID = `${langID}_${this.namespace.name}`;
            }
        }
        return [templateLangString(langID, templateData)];
    }
}
/** Requires that the given action within the given skills mastery level is greater or equal than level */
class MasteryLevelRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'MasteryLevel';
        try {
            this.skill = this.game.masterySkills.getObjectSafe(data.skillID);
            this.action = this.skill.actions.getObjectSafe(data.actionID);
            this.level = data.level;
        } catch (e) {
            throw new DataConstructionError(MasteryLevelRequirement.name, e);
        }
    }
    isMet() {
        return this.skill.getMasteryLevel(this.action) >= this.level;
    }
    notifyFailure() {
        notifyPlayer(this.skill, templateLangString('MASTERY_LEVEL_REQUIRED_TO_DO_THAT', {
            level: `${this.level}`,
            actionName: this.action.name,
        }), 'danger');
    }
    getHandler(callback) {
        return (e) => {
            if (e.action === this.action)
                callback(e);
        };
    }
    _assignHandler(handler) {
        this.skill.on('masteryLevelChanged', handler);
    }
    _unassignHandler(handler) {
        this.skill.off('masteryLevelChanged', handler);
    }
    getNodes(imageClass) {
        return templateLangStringWithNodes('REQUIRES_MASTERY_LEVEL', {
            masteryImage: this.createImage(assets.getURI("assets/media/main/mastery_header.png" /* Assets.MasteryIcon */ ), imageClass),
            actionImage: this.createImage(this.action.media, imageClass),
        }, {
            actionName: this.action.name,
            level: `${this.level}`
        });
    }
}
/** Requires that the given dungeon has been completed count times */
class DungeonRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'DungeonCompletion';
        try {
            this.dungeon = game.dungeons.getObjectSafe(data.dungeonID);
            this.count = data.count;
        } catch (e) {
            throw new DataConstructionError(DungeonRequirement.name, e);
        }
    }
    isMet() {
        return this.game.combat.getDungeonCompleteCount(this.dungeon) >= this.count;
    }
    notifyFailure() {
        const templateData = {
            dungeonName: this.dungeon.name,
            count: `${this.count}`,
        };
        if (this.count > 1) {
            notifyPlayer(this.game.attack, templateLangString('TOASTS_DUNGEON_COMPLETION_REEQUIRED_MULTIPLE', templateData));
        } else {
            notifyPlayer(this.game.attack, templateLangString('TOASTS_DUNGEON_COMPLETION_REQUIRED_ONCE', templateData));
        }
    }
    getHandler(callback) {
        return (e) => {
            if (e.dungeon === this.dungeon)
                callback(e);
        };
    }
    _assignHandler(handler) {
        this.game.combat.on('dungeonCompleted', handler);
    }
    _unassignHandler(handler) {
        this.game.combat.off('dungeonCompleted', handler);
    }
    getNodes(imageClass) {
        return templateLangStringWithNodes(`MENU_TEXT_${this.count > 1 ? 'COMPLETE_DUNGEON_TIMES' : 'COMPLETE_DUNGEON_ONCE'}`, {
            dungeonImage: this.createImage(this.dungeon.media, imageClass)
        }, {
            dungeonName: this.dungeon.name,
            count: `${this.count}`
        });
    }
}
/** Requires that the given dungeon has been completed count times */
class StrongholdRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'StrongholdCompletion';
        try {
            this.stronghold = game.strongholds.getObjectSafe(data.strongholdID);
            this.count = data.count;
        } catch (e) {
            throw new DataConstructionError(StrongholdRequirement.name, e);
        }
    }
    isMet() {
        return this.stronghold.timesCompleted >= this.count;
    }
    notifyFailure() {
        const templateData = {
            dungeonName: this.stronghold.name,
            count: `${this.count}`,
        };
        if (this.count > 1) {
            notifyPlayer(this.game.attack, templateLangString('TOASTS_DUNGEON_COMPLETION_REEQUIRED_MULTIPLE', templateData));
        } else {
            notifyPlayer(this.game.attack, templateLangString('TOASTS_DUNGEON_COMPLETION_REQUIRED_ONCE', templateData));
        }
    }
    getHandler(callback) {
        return (e) => {
            if (e.stronghold === this.stronghold)
                callback(e);
        };
    }
    _assignHandler(handler) {
        this.game.combat.on('strongholdCompleted', handler);
    }
    _unassignHandler(handler) {
        this.game.combat.off('strongholdCompleted', handler);
    }
    getNodes(imageClass) {
        return templateLangStringWithNodes(`MENU_TEXT_${this.count > 1 ? 'COMPLETE_DUNGEON_TIMES' : 'COMPLETE_DUNGEON_ONCE'}`, {
            dungeonImage: this.createImage(this.stronghold.media, imageClass)
        }, {
            dungeonName: this.stronghold.name,
            count: `${this.count}`
        });
    }
}
/** Requires that the given depth within The Abyss has been completed count times */
class AbyssDepthRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'AbyssDepthCompletion';
        try {
            this.depth = game.abyssDepths.getObjectSafe(data.depthID);
            this.count = data.count;
        } catch (e) {
            throw new DataConstructionError(AbyssDepthRequirement.name, e);
        }
    }
    isMet() {
        return this.depth.timesCompleted >= this.count;
    }
    notifyFailure() {
        const templateData = {
            depthName: this.depth.name,
            count: `${this.count}`,
        };
        if (this.count > 1) {
            notifyPlayer(this.game.attack, templateLangString('TOASTS_THE_ABYSS_COMPLETION_REEQUIRED_MULTIPLE', templateData));
        } else {
            notifyPlayer(this.game.attack, templateLangString('TOASTS_THE_ABYSS_COMPLETION_REQUIRED_ONCE', templateData));
        }
    }
    getHandler(callback) {
        return (e) => {
            if (e.depth === this.depth)
                callback(e);
        };
    }
    _assignHandler(handler) {
        this.game.combat.on('abyssDepthCompleted', handler);
    }
    _unassignHandler(handler) {
        this.game.combat.off('abyssDepthCompleted', handler);
    }
    getNodes(imageClass) {
        return templateLangStringWithNodes(`MENU_TEXT_${this.count > 1 ? 'COMPLETE_THE_ABYSS_TIMES' : 'COMPLETE_THE_ABYSS_ONCE'}`, {
            depthImage: this.createImage(this.depth.media, imageClass)
        }, {
            depthName: this.depth.name,
            count: `${this.count}`
        });
    }
}
/** Requires that the given shop purchase has been bought count times */
class ShopPurchaseRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'ShopPurchase';
        try {
            this.purchase = game.shop.purchases.getObjectSafe(data.purchaseID);
            this.count = data.count;
        } catch (e) {
            throw new DataConstructionError(ShopPurchaseRequirement.name, e);
        }
    }
    isMet() {
        return this.game.shop.getPurchaseCount(this.purchase) >= this.count;
    }
    notifyFailure() {
        notifyPlayer(this.game.attack, templateLangString('TOASTS_SHOP_PURCHASE_REQUIRED', {
            purchaseName: this.purchase.name,
        }), 'danger');
    }
    getHandler(callback) {
        return (e) => {
            if (e.purchase === this.purchase)
                callback(e);
        };
    }
    _assignHandler(handler) {
        this.game.shop.on('purchaseMade', handler);
    }
    _unassignHandler(handler) {
        this.game.shop.off('purchaseMade', handler);
    }
    getNodes(imageClass) {
        return templateLangStringWithNodes('MENU_TEXT_SHOP_ITEM_PURCHASED', {
            shopImage: this.createImage(this.purchase.media, imageClass)
        }, {
            shopName: this.purchase.name
        });
    }
}
/** Requires that the player has the specified item equipped, or an item that bypasses the requirement */
class SlayerItemRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'SlayerItem';
        try {
            this.item = game.items.equipment.getObjectSafe(data.itemID);
        } catch (e) {
            throw new DataConstructionError(SlayerItemRequirement.name, e);
        }
    }
    check(notifyOnFailure, slayerLevelReq = 0) {
        const met = this.isMet(slayerLevelReq);
        if (!met && notifyOnFailure)
            this.notifyFailure();
        return met;
    }
    isMet(slayerLevelReq = 0) {
        return (this.game.modifiers.bypassAllSlayerItems > 0 ||
            (slayerLevelReq < 100 && this.game.modifiers.bypassSlayerItems > 0) ||
            this.game.combat.player.equipment.checkForItem(this.item));
    }
    notifyFailure() {
        notifyPlayer(this.game.attack, templateLangString('TOASTS_ITEM_EQUIPPED_REQUIRED', {
            itemName: this.item.name
        }), 'danger');
    }
    _assignHandler(handler) {
        this.game.combat.player.on('equipmentChanged', handler);
    }
    _unassignHandler(handler) {
        this.game.combat.player.off('equipmentChanged', handler);
    }
    getNodes(imageClass) {
        return [this.createImage(this.item.media, imageClass), getLangString('COMBAT_MISC_110')];
    }
}
class SlayerTaskRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'SlayerTask';
        try {
            let categoryID;
            if (data.tier !== undefined) {
                console.warn(`The "tier" property of SlayerTaskRequirementData is deprecated and will be removed in a future update. Please use the category property instead.`);
                categoryID = SlayerTask.TIER_CATEGORY_MAP[SlayerTierID[data.tier]];
            } else {
                categoryID = data.category;
            }
            this.category = this.game.combat.slayerTask.categories.getObjectSafe(categoryID);
            this.count = data.count;
        } catch (e) {
            throw new DataConstructionError(SlayerTaskRequirement.name, e);
        }
    }
    isMet() {
        return this.game.combat.slayerTask.getTaskCompletionsForTierAndAbove(this.category) >= this.count;
    }
    notifyFailure() {
        imageNotify(this.game.slayer.media, templateString(this.category.reqToast, {
            count: `${this.count}`,
        }), 'danger');
    }
    getHandler(callback) {
        return (e) => {
            if (e.category === this.category)
                callback(e);
        };
    }
    _assignHandler(handler) {
        this.game.combat.slayerTask.on('taskCompleted', handler);
    }
    _unassignHandler(handler) {
        this.game.combat.slayerTask.off('taskCompleted', handler);
    }
    getNodes(imageClass) {
        const currentCount = this.game.combat.slayerTask.getTaskCompletionsForTierAndAbove(this.category);
        return [
            templateString(this.category.unlockText, {
                count: `${Math.max(this.count - currentCount, 0)}`,
            }),
        ];
    }
}
class ItemFoundRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'ItemFound';
        try {
            this.item = game.items.getObjectSafe(data.itemID);
        } catch (e) {
            throw new DataConstructionError(ItemFoundRequirement.name, e);
        }
    }
    isMet() {
        return this.game.stats.itemFindCount(this.item) > 0;
    }
    notifyFailure() {
        imageNotify(this.item.media, templateLangString('TOASTS_ITEM_FOUND_REQUIRED', {
            itemName: this.item.name
        }), 'danger');
    }
    getHandler(callback) {
        return (e) => {
            if (e.item === this.item)
                callback(e);
        };
    }
    _assignHandler(handler) {
        this.game.bank.on('itemFound', handler);
    }
    _unassignHandler(handler) {
        this.game.bank.off('itemFound', handler);
    }
    getNodes(imageClass) {
        return templateLangStringWithNodes('MENU_TEXT_FIND_ITEM', {
            itemImage: this.createImage(this.item.media, imageClass)
        }, {
            itemName: this.item.name
        });
    }
}
class MonsterKilledRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'MonsterKilled';
        try {
            this.monster = game.monsters.getObjectSafe(data.monsterID);
            this.count = data.count;
        } catch (e) {
            throw new DataConstructionError(MonsterKilledRequirement.name, e);
        }
    }
    isMet() {
        return this.game.stats.monsterKillCount(this.monster) >= this.count;
    }
    notifyFailure() {
        imageNotify(this.monster.media, templateLangString(`TOASTS_${this.count > 1 ? 'MONSTER_KILLS_REQUIRED' : 'MONSTER_KILLED_REQUIRED'}`, {
            monsterName: this.monster.name,
            count: `${this.count}`,
        }), 'danger');
    }
    getHandler(callback) {
        return (e) => {
            if (e.monster === this.monster)
                callback(e);
        };
    }
    _assignHandler(handler) {
        this.game.combat.on('monsterKilled', handler);
    }
    _unassignHandler(handler) {
        this.game.combat.off('monsterKilled', handler);
    }
    getNodes(imageClass) {
        return templateLangStringWithNodes(`MENU_TEXT_${this.count > 1 ? 'DEFEAT_MONSTER_TIMES' : 'DEFEAT_MONSTER_ONCE'}`, {
            monsterImage: this.createImage(this.monster.media, imageClass)
        }, {
            monsterName: this.monster.name,
            count: `${this.count}`
        });
    }
}
class TownshipTaskCompletionRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'TownshipTask';
        this.count = data.count;
        if (data.realm !== undefined) {
            this.realm = game.realms.getObjectSafe(data.realm);
        } else {
            this.realm = game.defaultRealm;
        }
    }
    isMet() {
        return this.game.township.tasks.getTasksCompletedInRealm(this.realm) >= this.count;
    }
    notifyFailure() {
        const tasksLeft = this.count - this.game.township.tasks.getTasksCompletedInRealm(this.realm);
        imageNotify(this.game.township.media, `You must complete ${tasksLeft} more Township tasks to do that!`, 'danger');
    }
    getHandler(callback) {
        return (e) => {
            if (e.task.realm === this.realm)
                callback(e);
        };
    }
    _assignHandler(handler) {
        this.game.township.tasks.on('townshipTaskCompleted', handler);
    }
    _unassignHandler(handler) {
        this.game.township.tasks.off('townshipTaskCompleted', handler);
    }
    getNodes(imageClass) {
        if (this.game.realms.size <= 1)
            [templateLangString('MENU_TEXT_REQUIRES_TOWNSHIP_TASKS', {
                count: `${this.count}`
            })];
        return [
            ...templateLangStringWithNodes('MENU_TEXT_REQUIRES_TOWNSHIP_TASKS_REALM', {
                realmIcon: createImage(this.realm.media, 'skill-icon-xs mr-1'),
            }, {
                count: `${this.count}`,
                realmName: this.realm.name,
            }),
        ];
    }
}
class TownshipBuildingRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'TownshipBuilding';
        try {
            this.building = game.township.buildings.getObjectSafe(data.buildingID);
            this.count = data.count;
        } catch (e) {
            throw new DataConstructionError(TownshipBuildingRequirement.name, e);
        }
    }
    isMet() {
        return this.game.township.countNumberOfBuildings(this.building) >= this.count;
    }
    notifyFailure() {
        const buildingsLeft = this.count - this.game.township.countNumberOfBuildings(this.building);
        imageNotify(this.building.media, templateLangString('TOWNSHIP_BUILDINGS_REQUIRED_TO_DO_THAT', {
            count: `${buildingsLeft}`,
            buildingName: this.building.name,
        }), 'danger');
    }
    getHandler(callback) {
        return (e) => {
            if (e.building === this.building)
                callback(e);
        };
    }
    _assignHandler(handler) {
        this.game.township.on('buildingCountChanged', handler);
    }
    _unassignHandler(handler) {
        this.game.township.off('buildingCountChanged', handler);
    }
    getNodes(imageClass) {
        return [
            templateLangString('MENU_TEXT_REQUIRES_TOWNSHIP_BUILDINGS', {
                count: `${this.count}`,
                buildingName: `${this.building.name}`,
            }),
        ];
    }
}
class CartographyHexDiscoveryRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'CartographyHexDiscovery';
        try {
            if (game.cartography === undefined)
                throw new UnregisteredObjectError(Skill.name, "melvorAoD:Cartography" /* SkillIDs.Cartography */ );
            this.cartography = game.cartography;
            this.worldMap = game.cartography.worldMaps.getObjectSafe(data.worldMapID);
            this.count = data.count;
        } catch (e) {
            throw new DataConstructionError(CartographyHexDiscoveryRequirement.name, e);
        }
    }
    isMet() {
        return this.worldMap.fullySurveyedHexes >= this.count;
    }
    notifyFailure() {
        const hexesLeft = this.count - this.worldMap.fullySurveyedHexes;
        imageNotify(assets.getURI(TODO_REPLACE_MEDIA), templateLangString('TOASTS_SURVEY_HEX_REQUIRED', {
            hexCount: `${hexesLeft}`,
            worldName: this.worldMap.name,
        }), 'danger');
    }
    getHandler(callback) {
        return (e) => {
            if (e.worldMap === this.worldMap)
                callback(e);
        };
    }
    _assignHandler(handler) {
        this.cartography.on('hexSurveyed', handler);
    }
    _unassignHandler(handler) {
        this.cartography.off('hexSurveyed', handler);
    }
    getNodes(imageClass) {
        return [
            templateLangString('REQUIRES_HEX_SURVEY', {
                worldName: this.worldMap.name,
                count: `${this.count}`,
            }),
        ];
    }
}
class CartographyPOIDiscoveryRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'CartographyPOIDiscovery';
        try {
            if (game.cartography === undefined)
                throw new UnregisteredObjectError(Skill.name, "melvorAoD:Cartography" /* SkillIDs.Cartography */ );
            this.cartography = game.cartography;
            this.worldMap = game.cartography.worldMaps.getObjectSafe(data.worldMapID);
            this.pois = this.worldMap.pointsOfInterest.getArrayFromIds(data.poiIDs);
        } catch (e) {
            throw new DataConstructionError(CartographyPOIDiscoveryRequirement.name, e);
        }
    }
    isMet() {
        return this.pois.every((poi) => poi.isDiscovered);
    }
    notifyFailure() {
        this.game.combat.notifications.add({
            type: 'Player',
            args: [
                this.game.attack,
                templateLangString('TOASTS_POI_DISCOVERY_REQUIRED', {
                    worldName: this.worldMap.name
                }),
                'danger',
            ],
        });
    }
    getHandler(callback) {
        return (e) => {
            if (e.worldMap === this.worldMap && this.pois.includes(e.poi))
                callback(e);
        };
    }
    _assignHandler(handler) {
        this.cartography.on('poiDiscovered', handler);
    }
    _unassignHandler(handler) {
        this.cartography.off('poiDiscovered', handler);
    }
    getNodes(imageClass) {
        return [
            templateLangString('REQUIRES_POI_DISCOVERY', {
                placeNames: joinAsList(this.pois.map((poi) => poi.name)),
                worldName: this.worldMap.name,
            }),
        ];
    }
}
class ArchaeologyItemsDonatedRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'ArchaeologyItemsDonated';
        try {
            this.count = data.count;
            if (game.archaeology === undefined)
                throw new UnregisteredObjectError(Skill.name, "melvorAoD:Archaeology" /* SkillIDs.Archaeology */ );
            this.archaeology = game.archaeology;
        } catch (e) {
            throw new DataConstructionError(ArchaeologyItemsDonatedRequirement.name, e);
        }
    }
    isMet() {
        return this.archaeology.museum.donationCount >= this.count;
    }
    notifyFailure() {
        this.game.combat.notifications.add({
            type: 'Player',
            args: [
                this.archaeology,
                templateLangString('TOASTS_ITEM_DONATION_REQUIRED', {
                    count: `${this.count}`
                }),
                'danger',
            ],
        });
    }
    _assignHandler(handler) {
        this.archaeology.museum.on('itemDonated', handler);
    }
    _unassignHandler(handler) {
        this.archaeology.museum.off('itemDonated', handler);
    }
    getNodes(imageClass) {
        return [
            templateLangString('REQUIRES_ITEMS_DONATED', {
                count: `${this.count}`,
            }),
        ];
    }
}
/** Requires that the given Node in a Skill's Skill Tree is unlocked */
class SkillTreeNodeUnlockedRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'SkillTreeNodeUnlocked';
        try {
            this.skill = game.skills.getObjectSafe(data.skillID);
            this.skillTree = this.skill.skillTrees.getObjectSafe(data.skillTreeID);
            this.node = this.skillTree.nodes.getObjectSafe(data.nodeID);
        } catch (e) {
            throw new DataConstructionError(SkillTreeNodeUnlockedRequirement.name, e);
        }
    }
    isMet() {
        return this.node.isUnlocked;
    }
    notifyFailure() {
        this.game.combat.notifications.add({
            type: 'Player',
            args: [this.skill, 'Skill Tree Node not unlocked', 'danger'],
        });
    }
    getHandler(callback) {
        return (e) => {
            if (e.node === this.node)
                callback(e);
        };
    }
    _assignHandler(handler) {
        this.skillTree.on('nodeUnlocked', handler);
    }
    _unassignHandler(handler) {
        this.skillTree.off('nodeUnlocked', handler);
    }
    getNodes(imageClass) {
        return templateLangStringWithNodes('REQUIRES_SKILL_TREE_NODE_UNLOCKED', {}, {
            skillTree: `${this.skillTree.name}`,
            node: `${this.node.shortName}`,
            skillName: `${this.skill.name}`,
        });
    }
}
//# sourceMappingURL=requirements.js.map
checkFileVersion('?12097')