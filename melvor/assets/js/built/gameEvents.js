"use strict";
class GameEventEmitter {
    constructor() {
        this._events = mitt();
        this.on = this._events.on;
        this.off = this._events.off;
    }
}
/** Base Class for all game events */
class GameEvent {}
/** Base Class for matching game events */
class GameEventMatcher {
    constructor(game) {
        this.game = game;
    }
    /**
     * Assigns an event handler
     * @param handler The function to execute when a matching event occurs
     * @param golbinRaid If this handler is being assigned for Golbin Raid Combat
     * @returns A function that may be called to unassign the handlers
     */
    assignHandler(handler, golbinRaid = false) {
        const newHandler = (e) => {
            if (this.doesEventMatch(e))
                handler(e);
        };
        this._assignHandler(newHandler, golbinRaid);
        return () => this._unassignHandler(newHandler, golbinRaid);
    }
}
/** Base Class for Game Event Matchers that should not apply to Golbin Raid */
class NonRaidGameEventMatcher extends GameEventMatcher {
    _assignHandler(handler, golbinRaid) {
        if (golbinRaid)
            return;
        this._assignNonRaidHandler(handler);
    }
    _unassignHandler(handler, golbinRaid) {
        if (golbinRaid)
            return;
        this._unassignNonRaidHandler(handler);
    }
}
/** Base class for Game Event Matchers that deal with Enemy/Player related events */
class CharacterGameEventMatcher extends GameEventMatcher {
    _assignHandler(handler, golbinRaid) {
        this._assignCharacterHandler(handler, golbinRaid ? this.game.golbinRaid : this.game.combat);
    }
    _unassignHandler(handler, golbinRaid) {
        this._unassignCharacterHandler(handler, golbinRaid ? this.game.golbinRaid : this.game.combat);
    }
}
class IntervaledGameEvent extends GameEvent {
    constructor() {
        super();
        /** The interval of the timer that triggered this event */
        this.interval = 0;
    }
}
/** Base Class for all skill action events */
class SkillActionEvent extends IntervaledGameEvent {
    constructor() {
        super(...arguments);
        /** If the action was sucessful. (e.g. not stunned or food burned) */
        this.successful = true;
        /** The quantity of the primary action product gained */
        this.productQuantity = 0;
    }
    /** If the potion was active during the action */
    get isPotionActive() {
        return this.activePotion !== undefined;
    }
}
/** Matches any skill action */
class SkillActionEventMatcher extends NonRaidGameEventMatcher {
    constructor(options, game) {
        super(game);
        try {
            this.isPotionActive = options.isPotionActive;
            this.succesful = options.succesful;
            if (options.activePotionIDs !== undefined) {
                this.activePotions = game.items.potions.getSetFromIds(options.activePotionIDs);
            }
            if (options.realms !== undefined) {
                this.realms = game.realms.getSetFromIds(options.realms);
            }
        } catch (e) {
            throw new DataConstructionError(SkillActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.isPotionActive === undefined || this.isPotionActive === event.isPotionActive) &&
            (this.activePotions === undefined ||
                (event.activePotion !== undefined && this.activePotions.has(event.activePotion))) &&
            (this.succesful === undefined || this.succesful === event.successful) &&
            (this.realms === undefined || (event.realm !== undefined && this.realms.has(event.realm))));
    }
}
/** Event for a Woodcutting Skill Action */
class WoodcuttingActionEvent extends SkillActionEvent {
    constructor(
        /** The skill the event originated from */
        skill,
        /** The active woodcutting trees during the event */
        actions) {
        super();
        this.skill = skill;
        this.actions = actions;
        /** If a bird's nest or similar item was received during the action */
        this.nestGiven = false;
        this.activePotion = skill.activePotion;
        if (actions.size > 0) {
            this.realm = [...actions.values()][0].realm;
        }
    }
}
/** Matches a WoodcuttingActionEvent */
class WoodcuttingActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'WoodcuttingAction';
        try {
            this.nestGiven = options.nestGiven;
            if (options.actionIDs !== undefined) {
                this.actions = game.woodcutting.actions.getSetFromIds(options.actionIDs);
            }
        } catch (e) {
            throw new DataConstructionError(WoodcuttingActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.nestGiven === undefined || this.nestGiven === event.nestGiven) &&
            (this.actions === undefined || isAnySetMemberInSet(this.actions, event.actions)) &&
            super.doesEventMatch(event));
    }
    _assignNonRaidHandler(handler) {
        this.game.woodcutting.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.woodcutting.off('action', handler);
    }
}
class FishingActionEvent extends SkillActionEvent {
    constructor(
        /** The skill the event originated from */
        skill,
        /** The fish being caught */
        action,
        /** The area being fished in */
        area) {
        super();
        this.skill = skill;
        this.action = action;
        this.area = area;
        /** If a gem item was given as the primary reward */
        this.gemGiven = false;
        /** If a cooked version exists for the primary reward */
        this.cookedVersionExists = false;
        /** If a special item was given as the primary reward */
        this.specialItemGiven = false;
        this.activePotion = skill.activePotion;
        this.rewardItem = action.product;
        this.realm = action.realm;
    }
}
class FishingActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'FishingAction';
        try {
            if (options.actionIDs !== undefined) {
                this.actions = game.fishing.actions.getSetFromIds(options.actionIDs);
            }
            if (options.areaIDs !== undefined) {
                this.areas = game.fishing.areas.getSetFromIds(options.areaIDs);
            }
            this.gemGiven = options.gemGiven;
            this.cookedVersionExists = options.cookedVersionExists;
        } catch (e) {
            throw new DataConstructionError(FishingActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.actions === undefined || this.actions.has(event.action)) &&
            (this.areas === undefined || this.areas.has(event.area)) &&
            (this.gemGiven === undefined || this.gemGiven === event.gemGiven) &&
            (this.cookedVersionExists === undefined || this.cookedVersionExists === event.cookedVersionExists) &&
            (this.specialItemGiven === undefined || this.specialItemGiven === event.specialItemGiven) &&
            super.doesEventMatch(event));
    }
    _assignNonRaidHandler(handler) {
        this.game.fishing.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.fishing.off('action', handler);
    }
}
class FiremakingActionEvent extends SkillActionEvent {
    constructor(
        /** The Source Skill for the event */
        skill,
        /** The log being burnt */
        action) {
        super();
        this.skill = skill;
        this.action = action;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
    }
}
class FiremakingActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'FiremakingAction';
        try {
            if (options.actionIDs !== undefined) {
                this.actions = game.firemaking.actions.getSetFromIds(options.actionIDs);
            }
        } catch (e) {
            throw new DataConstructionError(FiremakingActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return (this.actions === undefined || this.actions.has(event.action)) && super.doesEventMatch(event);
    }
    _assignNonRaidHandler(handler) {
        this.game.firemaking.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.firemaking.off('action', handler);
    }
}
class BonfireLitEvent extends GameEvent {
    constructor(
        /** The Source skill for the event */
        skill,
        /** The log a bonfire is being lit with */
        log) {
        super();
        this.skill = skill;
        this.log = log;
    }
}
class BonfireLitEventMatcher extends NonRaidGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'BonfireLit';
        try {
            if (options.logIDs !== undefined) {
                this.logs = game.firemaking.actions.getSetFromIds(options.logIDs);
            }
            if (options.realms !== undefined)
                this.realms = game.realms.getSetFromIds(options.realms);
        } catch (e) {
            throw new DataConstructionError(BonfireLitEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.logs === undefined || this.logs.has(event.log)) &&
            (this.realms === undefined || (event.log !== undefined && this.realms.has(event.log.realm))));
    }
    _assignNonRaidHandler(handler) {
        this.game.firemaking.on('bonfireLit', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.firemaking.off('bonfireLit', handler);
    }
}
class CookingActionEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The current recipe being cooked */
        action,
        /** The category being cooked in */
        category) {
        super();
        this.skill = skill;
        this.action = action;
        this.category = category;
        /** If anything was passive cooking during the event */
        this.isPassiveCooking = false;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
    }
}
class CookingActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'CookingAction';
        try {
            if (options.actionIDs !== undefined) {
                this.actions = game.cooking.actions.getSetFromIds(options.actionIDs);
            }
            if (options.categoryIDs !== undefined) {
                this.categories = game.cooking.categories.getSetFromIds(options.categoryIDs);
            }
            this.isPassiveCooking = options.isPassiveCooking;
        } catch (e) {
            throw new DataConstructionError(CookingActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.actions === undefined || this.actions.has(event.action)) &&
            (this.categories === undefined || this.categories.has(event.category)) &&
            (this.isPassiveCooking === undefined || event.isPassiveCooking === this.isPassiveCooking) &&
            super.doesEventMatch(event));
    }
    _assignNonRaidHandler(handler) {
        this.game.cooking.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.cooking.off('action', handler);
    }
}
class MiningActionEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The current rock being mined */
        action) {
        super();
        this.skill = skill;
        this.action = action;
        /** If a gem was obtained from the action */
        this.gemObtained = false;
        /** If a smithed version of the primary product exists */
        this.smithedVersionExists = false;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
    }
}
class MiningActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'MiningAction';
        try {
            if (options.actionIDs !== undefined) {
                this.actions = game.mining.actions.getSetFromIds(options.actionIDs);
            }
            this.gemObtained = options.gemObtained;
            this.smithedVersionExists = options.smithedVersionExists;
            this.actionGivesGems = options.actionGivesGems;
            if (options.categories !== undefined) {
                this.categories = game.mining.categories.getSetFromIds(options.categories);
            } else if (options.oreTypes !== undefined) {
                console.warn(`The oreTypes property for ${MiningActionEventMatcher.name} is deprecated. Use categories instead.`);
                this.categories = game.mining.categories.getSetFromIds(options.oreTypes.map((t) => `${"melvorD" /* Namespaces.Demo */}:${t}`));
            }
        } catch (e) {
            throw new DataConstructionError(MiningActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.actions === undefined || this.actions.has(event.action)) &&
            (this.gemObtained === undefined || this.gemObtained === event.gemObtained) &&
            (this.smithedVersionExists === undefined || this.smithedVersionExists === event.smithedVersionExists) &&
            (this.actionGivesGems === undefined || this.actionGivesGems === event.action.giveGems) &&
            (this.actionGivesSuperiorGems === undefined || this.actionGivesSuperiorGems === event.action.giveSuperiorGems) &&
            (this.actionGivesAbyssalGems === undefined || this.actionGivesAbyssalGems === event.action.giveAbyssalGems) &&
            (this.categories === undefined || this.categories.has(event.action.category)) &&
            super.doesEventMatch(event));
    }
    _assignNonRaidHandler(handler) {
        this.game.mining.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.mining.off('action', handler);
    }
}
class SmithingActionEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The current recipe being smithed */
        action) {
        super();
        this.skill = skill;
        this.action = action;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
    }
}
class SmithingActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'SmithingAction';
        try {
            if (options.actionIDs !== undefined)
                this.actions = game.smithing.actions.getSetFromIds(options.actionIDs);
            if (options.categoryIDs !== undefined)
                this.categories = game.smithing.categories.getSetFromIds(options.categoryIDs);
            if (options.consumedItemIDs !== undefined)
                this.consumedItems = game.items.getSetFromIds(options.consumedItemIDs);
        } catch (e) {
            throw new DataConstructionError(SmithingActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.actions === undefined || this.actions.has(event.action)) &&
            (this.categories === undefined || this.categories.has(event.action.category)) &&
            (this.consumedItems === undefined || event.action.itemCosts.some(({
                item
            }) => this.consumedItems.has(item))) &&
            super.doesEventMatch(event));
    }
    _assignNonRaidHandler(handler) {
        this.game.smithing.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.smithing.off('action', handler);
    }
}
class ThievingActionEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The current NPC being stolen from */
        npc,
        /** The area the NPC is from */
        area) {
        super();
        this.skill = skill;
        this.npc = npc;
        this.area = area;
        /** If a common drop from the NPC was obtained */
        this.commonDropObtained = false;
        this.activePotion = skill.activePotion;
        this.realm = npc.realm;
    }
}
class ThievingActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'ThievingAction';
        try {
            if (options.npcIDs !== undefined)
                this.npcs = game.thieving.actions.getSetFromIds(options.npcIDs);
            if (options.areaIDs !== undefined)
                this.areas = game.thieving.areas.getSetFromIds(options.areaIDs);
            this.commonDropObtained = options.commonDropObtained;
        } catch (e) {
            throw new DataConstructionError(ThievingActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.npcs === undefined || this.npcs.has(event.npc)) &&
            (this.areas === undefined || this.areas.has(event.area)) &&
            (this.commonDropObtained === undefined || this.commonDropObtained === event.commonDropObtained) &&
            super.doesEventMatch(event));
    }
    _assignNonRaidHandler(handler) {
        this.game.thieving.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.thieving.off('action', handler);
    }
}
class FarmingPlantActionEventMatcher extends NonRaidGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'FarmingPlantAction';
        try {
            if (options.actionIDs !== undefined)
                this.actions = game.farming.actions.getSetFromIds(options.actionIDs);
            if (options.categoryIDs !== undefined)
                this.categories = game.farming.categories.getSetFromIds(options.categoryIDs);
        } catch (e) {
            throw new DataConstructionError(FarmingPlantActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.actions === undefined || this.actions.has(event.action)) &&
            (this.categories === undefined || this.categories.has(event.action.category)));
    }
    _assignNonRaidHandler(handler) {
        this.game.farming.on('plant', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.farming.off('plant', handler);
    }
}
class FarmingPlantActionEvent extends GameEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The farming recipe being planted */
        action) {
        super();
        this.skill = skill;
        this.action = action;
    }
}
class FarmingHarvestActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'FarmingHarvestAction';
        try {
            if (options.actionIDs !== undefined)
                this.actions = game.farming.actions.getSetFromIds(options.actionIDs);
            if (options.categoryIDs !== undefined)
                this.categories = game.farming.categories.getSetFromIds(options.categoryIDs);
        } catch (e) {
            throw new DataConstructionError(FarmingHarvestActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.actions === undefined || this.actions.has(event.action)) &&
            (this.categories === undefined || this.categories.has(event.action.category)) &&
            super.doesEventMatch(event));
    }
    _assignNonRaidHandler(handler) {
        this.game.farming.on('harvest', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.farming.off('harvest', handler);
    }
}
class FarmingHarvestActionEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The farming recipe being harvested */
        action) {
        super();
        this.skill = skill;
        this.action = action;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
    }
}
class FletchingActionEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The fletching recipe being made */
        action) {
        super();
        this.skill = skill;
        this.action = action;
        /** The alternative recipe ID of the action */
        this.altRecipeID = -1;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
    }
}
class FletchingActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'FletchingAction';
        try {
            if (options.actionIDs !== undefined)
                this.actions = game.fletching.actions.getSetFromIds(options.actionIDs);
            if (options.categoryIDs !== undefined)
                this.categories = game.fletching.categories.getSetFromIds(options.categoryIDs);
            this.isArrows = options.isArrows;
            this.isUnstrungBows = options.isUnstrungBows;
        } catch (e) {
            throw new DataConstructionError(FletchingActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        var _a, _b;
        return ((this.actions === undefined || this.actions.has(event.action)) &&
            (this.categories === undefined || this.categories.has(event.action.category)) &&
            (this.isArrows === undefined ||
                this.isArrows === (((_a = event.action.subcategory) === null || _a === void 0 ? void 0 : _a.id) === "melvorF:Arrows" /* FletchingSubcategoryIDs.Arrows */ )) &&
            (this.isUnstrungBows === undefined ||
                this.isUnstrungBows === (((_b = event.action.subcategory) === null || _b === void 0 ? void 0 : _b.id) === "melvorF:UnstrungBows" /* FletchingSubcategoryIDs.UnstrungBows */ )) &&
            super.doesEventMatch(event));
    }
    _assignNonRaidHandler(handler) {
        this.game.fletching.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.fletching.off('action', handler);
    }
}
class CraftingActionEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The crafting recipe being made */
        action) {
        super();
        this.skill = skill;
        this.action = action;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
        this.isConsumable =
            action.product instanceof EquipmentItem && action.product.fitsInSlot("melvorD:Consumable" /* EquipmentSlotIDs.Consumable */ );
    }
}
class CraftingActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'CraftingAction';
        try {
            if (options.actionIDs !== undefined)
                this.actions = game.crafting.actions.getSetFromIds(options.actionIDs);
            if (options.categoryIDs !== undefined)
                this.categories = game.crafting.categories.getSetFromIds(options.categoryIDs);
            if (options.subcategoryIDs !== undefined)
                this.subcategories = game.crafting.subcategories.getSetFromIds(options.subcategoryIDs);
        } catch (e) {
            throw new DataConstructionError(CraftingActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.actions === undefined || this.actions.has(event.action)) &&
            (this.categories === undefined || this.categories.has(event.action.category)) &&
            (this.subcategories === undefined ||
                (event.action.subcategory !== undefined && this.subcategories.has(event.action.subcategory))) &&
            (this.isConsumable === undefined || this.isConsumable === event.isConsumable) &&
            super.doesEventMatch(event));
    }
    _assignNonRaidHandler(handler) {
        this.game.crafting.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.crafting.off('action', handler);
    }
}
class RunecraftingActionEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The runecrafting recipe being made */
        action) {
        super();
        this.skill = skill;
        this.action = action;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
    }
}
class RunecraftingActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'RunecraftingAction';
        try {
            if (options.actionIDs !== undefined)
                this.actions = game.runecrafting.actions.getSetFromIds(options.actionIDs);
            if (options.categoryIDs !== undefined)
                this.categories = game.runecrafting.categories.getSetFromIds(options.categoryIDs);
            if (options.consumedItemIDs !== undefined)
                this.consumedItems = game.items.getSetFromIds(options.consumedItemIDs);
            if (options.subcategoryIDs !== undefined) {
                this.subCategories = game.runecrafting.subcategories.getSetFromIds(options.subcategoryIDs);
            }
            if (options.subCategories !== undefined) {
                console.warn(`The subCategories property for ${RunecraftingActionEventMatcher.name} is deprecated. Use subcategoryIDs instead.`);
            }
        } catch (e) {
            throw new DataConstructionError(RunecraftingActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.actions === undefined || this.actions.has(event.action)) &&
            (this.categories === undefined || this.categories.has(event.action.category)) &&
            (this.consumedItems === undefined || event.action.itemCosts.some(({
                item
            }) => this.consumedItems.has(item))) &&
            (this.subCategories === undefined ||
                event.action.subcategories.some((subCat) => this.subCategories.has(subCat))) &&
            super.doesEventMatch(event));
    }
    _assignNonRaidHandler(handler) {
        this.game.runecrafting.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.runecrafting.off('action', handler);
    }
}
class HerbloreActionEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The herblore recipe being made */
        action) {
        super();
        this.skill = skill;
        this.action = action;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
    }
}
class HerbloreActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'HerbloreAction';
        try {
            if (options.actionIDs !== undefined)
                this.actions = game.herblore.actions.getSetFromIds(options.actionIDs);
            if (options.categoryIDs !== undefined)
                this.categories = game.herblore.categories.getSetFromIds(options.categoryIDs);
        } catch (e) {
            throw new DataConstructionError(HerbloreActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.actions === undefined || this.actions.has(event.action)) &&
            (this.categories === undefined || this.categories.has(event.action.category)) &&
            super.doesEventMatch(event));
    }
    _assignNonRaidHandler(handler) {
        this.game.herblore.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.herblore.off('action', handler);
    }
}
class AgilityActionEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The obstacle being completed */
        action) {
        super();
        this.skill = skill;
        this.action = action;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
    }
}
class AgilityActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'AgilityAction';
        try {
            if (options.actionIDs !== undefined)
                this.actions = game.agility.actions.getSetFromIds(options.actionIDs);
            if (options.categories !== undefined)
                this.categories = new Set(options.categories);
        } catch (e) {
            throw new DataConstructionError(AgilityActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.actions === undefined || this.actions.has(event.action)) &&
            (this.categories === undefined || this.categories.has(event.action.category)) &&
            super.doesEventMatch(event));
    }
    _assignNonRaidHandler(handler) {
        this.game.agility.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.agility.off('action', handler);
    }
}
class SummoningActionEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The summoning recipe being made */
        action, nonShardCost) {
        super();
        this.skill = skill;
        this.action = action;
        this.nonShardCost = nonShardCost;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
    }
}
class SummoningActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'SummoningAction';
        try {
            if (options.actionIDs !== undefined)
                this.actions = game.summoning.actions.getSetFromIds(options.actionIDs);
            if (options.categoryIDs !== undefined)
                this.categories = game.summoning.categories.getSetFromIds(options.categoryIDs);
        } catch (e) {
            throw new DataConstructionError(SummoningActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.actions === undefined || this.actions.has(event.action)) &&
            (this.categories === undefined || this.categories.has(event.action.category)) &&
            super.doesEventMatch(event));
    }
    _assignNonRaidHandler(handler) {
        this.game.summoning.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.summoning.off('action', handler);
    }
}
class AstrologyActionEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The astrology recipe being made */
        action) {
        super();
        this.skill = skill;
        this.action = action;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
    }
}
class AstrologyActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'AstrologyAction';
        try {
            if (options.actionIDs !== undefined)
                this.actions = game.astrology.actions.getSetFromIds(options.actionIDs);
        } catch (e) {
            throw new DataConstructionError(AstrologyActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return (this.actions === undefined || this.actions.has(event.action)) && super.doesEventMatch(event);
    }
    _assignNonRaidHandler(handler) {
        this.game.astrology.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.astrology.off('action', handler);
    }
}
class AltMagicActionEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The spell being cast */
        spell,
        /** If alternative runes were used during this event */
        altRunes) {
        super();
        this.skill = skill;
        this.spell = spell;
        this.altRunes = altRunes;
        this.activePotion = skill.activePotion;
        this.realm = spell.realm;
    }
}
class AltMagicActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'AltMagicAction';
        try {
            if (options.actionIDs !== undefined)
                this.spells = game.altMagic.actions.getSetFromIds(options.actionIDs);
            if (options.produces !== undefined)
                this.produces = new Set(options.produces.map((id) => AltMagicProductionID[id]));
            if (options.usedRuneIDs !== undefined)
                this.usedRunes = game.items.getSetFromIds(options.usedRuneIDs);
        } catch (e) {
            throw new DataConstructionError(AltMagicActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.spells === undefined || this.spells.has(event.spell)) &&
            (this.produces === undefined ||
                (!(event.spell.produces instanceof Item) && this.produces.has(event.spell.produces))) &&
            this.checkRunes(event) &&
            super.doesEventMatch(event));
    }
    /** Checks if the usedRunes property matches */
    checkRunes(event) {
        if (this.usedRunes === undefined)
            return true;
        const runes = event.altRunes && event.spell.runesRequiredAlt !== undefined ?
            event.spell.runesRequiredAlt :
            event.spell.runesRequired;
        return runes.some(({
            item
        }) => {
            return this.usedRunes.has(item);
        });
    }
    _assignNonRaidHandler(handler) {
        this.game.altMagic.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.altMagic.off('action', handler);
    }
}
class MonsterDropEvent extends GameEvent {
    constructor(
        /** The item that was dropped */
        item,
        /** The quantity dropped */
        quantity,
        /** The drop was/is a herb seed */
        herbSeed) {
        super();
        this.item = item;
        this.quantity = quantity;
        this.herbSeed = herbSeed;
    }
}
class MonsterDropEventMatcher extends NonRaidGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'MonsterDrop';
        this.herbSeed = options.herbSeed;
    }
    doesEventMatch(event) {
        return this.herbSeed === undefined || this.herbSeed === event.herbSeed;
    }
    _assignNonRaidHandler(handler) {
        this.game.combat.on('monsterDrop', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.combat.off('monsterDrop', handler);
    }
}
class BoneDropEvent extends GameEvent {
    constructor(
        /** The monster that dropped a bone */
        monster,
        /** The bone item that dropped */
        item,
        /** The quantity of the item that dropped */
        quantity) {
        super();
        this.monster = monster;
        this.item = item;
        this.quantity = quantity;
    }
}
class BoneDropEventMatcher extends NonRaidGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'BoneDrop';
        if (options.isBone !== undefined)
            this.isBone = options.isBone;
        if (options.isSoul !== undefined)
            this.isSoul = options.isSoul;
    }
    doesEventMatch(event) {
        return ((this.isBone === undefined || this.isBone === event.item instanceof BoneItem) &&
            (this.isSoul === undefined || this.isSoul === event.item instanceof SoulItem));
    }
    _assignNonRaidHandler(handler) {
        this.game.combat.on('boneDrop', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.combat.off('boneDrop', handler);
    }
}
class CharacterAttackEvent extends IntervaledGameEvent {
    constructor(
        /** The type of attack event */
        type, props) {
        super();
        this.type = type;
        Object.assign(this, {
            rawDamage: 0,
            damage: 0
        }, props);
    }
    /** Returns true if this is a subsequent hit of a multi-attack special, originating from the player */
    get isPlayerMulti() {
        return this.attacker instanceof Player && this.attackCount > 0;
    }
}
class PlayerAttackEventMatcher extends CharacterGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'PlayerAttack';
        if (options.attackTypes !== undefined)
            this.attackTypes = new Set(options.attackTypes);
    }
    doesEventMatch(event) {
        return this.attackTypes === undefined || this.attackTypes.has(event.attackType);
    }
    _assignCharacterHandler(handler, combat) {
        combat.player.on('attack', handler);
    }
    _unassignCharacterHandler(handler, combat) {
        combat.player.off('attack', handler);
    }
}
class EnemyAttackEventMatcher extends CharacterGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'EnemyAttack';
        if (options.attackTypes !== undefined)
            this.attackTypes = new Set(options.attackTypes);
    }
    doesEventMatch(event) {
        return this.attackTypes === undefined || this.attackTypes.has(event.attackType);
    }
    _assignCharacterHandler(handler, combat) {
        combat.enemy.on('attack', handler);
    }
    _unassignCharacterHandler(handler, combat) {
        combat.enemy.off('attack', handler);
    }
}
class FoodEatenEvent extends GameEvent {
    constructor(
        /** The Food item that was eaten */
        food,
        /** The amount of the item that was eaten */
        quantity,
        /** The amoun that was healed */
        healed) {
        super();
        this.food = food;
        this.quantity = quantity;
        this.healed = healed;
    }
}
class FoodEatenEventMatcher extends CharacterGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'FoodEaten';
    }
    doesEventMatch(event) {
        return true;
    }
    _assignCharacterHandler(handler, combat) {
        combat.player.on('foodEaten', handler);
    }
    _unassignCharacterHandler(handler, combat) {
        combat.player.off('foodEaten', handler);
    }
}
class PrayerPointConsumptionEvent extends GameEvent {
    constructor(
        /** The amount of points used */
        pointsUsed,
        /** If the prayer used was unholy */
        isUnholy) {
        super();
        this.pointsUsed = pointsUsed;
        this.isUnholy = isUnholy;
    }
}
class PrayerPointConsumptionEventMatcher extends CharacterGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'PrayerPointConsumption';
        this.isUnholy = options.isUnholy;
    }
    doesEventMatch(event) {
        return this.isUnholy === undefined || this.isUnholy === event.isUnholy;
    }
    _assignCharacterHandler(handler, combat) {
        combat.player.on('prayerPointsUsed', handler);
    }
    _unassignCharacterHandler(handler, combat) {
        combat.player.off('prayerPointsUsed', handler);
    }
}
class HitpointRegenerationEvent extends GameEvent {
    constructor(hitpointsGained) {
        super();
        this.hitpointsGained = hitpointsGained;
    }
}
/** Event that occurs when either the maximum or current hitpoints of a character changes */
class HitpointsChangedEvent extends GameEvent {
    constructor(oldCurrent, oldMax, newCurrent, newMax) {
        super();
        this.oldCurrent = oldCurrent;
        this.oldMax = oldMax;
        this.newCurrent = newCurrent;
        this.newMax = newMax;
    }
    get oldPercent() {
        return (this.oldCurrent / this.oldMax) * 100;
    }
    get newPercent() {
        return (this.newCurrent / this.newMax) * 100;
    }
}
/** Event that occurs when either the maximum or current barrier of a character changes */
class BarrierChangedEvent extends GameEvent {
    constructor(oldCurrent, oldMax, newCurrent, newMax) {
        super();
        this.oldCurrent = oldCurrent;
        this.oldMax = oldMax;
        this.newCurrent = newCurrent;
        this.newMax = newMax;
    }
    get oldPercent() {
        return (this.oldCurrent / this.oldMax) * 100;
    }
    get newPercent() {
        return (this.newCurrent / this.newMax) * 100;
    }
}
/** Event that is fired at the end of a Character's turn */
class CharacterEndOfTurnEvent extends GameEvent {
    constructor() {
        super();
    }
}
class CharacterAttackedEvent extends GameEvent {
    constructor(type, props) {
        super();
        this.type = type;
        Object.assign(this, {
            rawDamage: 0,
            damage: 0
        }, props);
    }
}
/** Event that occurs when an effect that belongs to the group is added to a character */
class CharacterEffectGroupAppliedEvent extends GameEvent {
    constructor(group) {
        super();
        this.group = group;
    }
}
/** Event that occurs when all effects that belong to the group are removed from a character */
class CharacterEffectGroupRemovedEvent extends GameEvent {
    constructor(group) {
        super();
        this.group = group;
    }
}
/** Event that occurs when the given effect is applied to a character */
class CharacterEffectAppliedEvent extends GameEvent {
    constructor(effect) {
        super();
        this.effect = effect;
    }
}
/** Event that occurs when the given effect is removed from a character */
class CharacterEffectRemovedEvent extends GameEvent {
    constructor(effect) {
        super();
        this.effect = effect;
    }
}
/** Event that occurs at the start of a fight in combat */
class StartOfFightEvent extends GameEvent {
    constructor() {
        super();
    }
}
/** Event that occurs at the end of a fight in combat */
class EndOfFightEvent extends GameEvent {
    constructor() {
        super();
    }
}
class PlayerHitpointRegenerationMatcher extends CharacterGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'PlayerHitpointRegeneration';
    }
    doesEventMatch(event) {
        return true;
    }
    _assignCharacterHandler(handler, combat) {
        combat.player.on('hitpointRegen', handler);
    }
    _unassignCharacterHandler(handler, combat) {
        combat.player.off('hitpointRegen', handler);
    }
}
class PlayerSummonAttackEvent extends IntervaledGameEvent {
    constructor() {
        super();
        this.missed = false;
        this.damage = 0;
    }
}
class PlayerSummonAttackEventMatcher extends CharacterGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'PlayerSummonAttack';
    }
    doesEventMatch(event) {
        return true;
    }
    _assignCharacterHandler(handler, combat) {
        combat.player.on('summonAttack', handler);
    }
    _unassignCharacterHandler(handler, combat) {
        combat.player.off('summonAttack', handler);
    }
}
class RuneConsumptionEvent extends GameEvent {
    constructor(
        /** The runes that were consumed */
        runes) {
        super();
        this.runes = runes;
        /** If the runes were preserved */
        this.preserved = true;
    }
}
class RuneConsumptionEventMatcher extends GameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'RuneConsumption';
    }
    doesEventMatch(event) {
        return true;
    }
    _assignHandler(handler, golbinRaid) {
        (golbinRaid ? this.game.golbinRaid : this.game.combat).player.on('runesUsed', handler);
        if (!golbinRaid)
            this.game.altMagic.on('runesUsed', handler);
    }
    _unassignHandler(handler, golbinRaid) {
        (golbinRaid ? this.game.golbinRaid : this.game.combat).player.off('runesUsed', handler);
        if (!golbinRaid)
            this.game.altMagic.off('runesUsed', handler);
    }
}
class PotionUsedEvent extends GameEvent {
    constructor(
        /** The potion item that was used */
        potion,
        /** The number of charges gained from the potion */
        charges) {
        super();
        this.potion = potion;
        this.charges = charges;
    }
}
class PotionUsedEventMatcher extends NonRaidGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'PotionUsed';
    }
    doesEventMatch(event) {
        return true;
    }
    _assignNonRaidHandler(handler) {
        this.game.potions.on('potionUsed', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.potions.off('potionUsed', handler);
    }
}
class PotionChargeUsedEvent extends GameEvent {
    constructor(
        /** The potion item that charges were consumed from */
        potion) {
        super();
        this.potion = potion;
        /** If the charges were preserved */
        this.preserved = false;
    }
}
class PotionChargeUsedEventMatcher extends NonRaidGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'PotionChargeUsed';
    }
    doesEventMatch(event) {
        return true;
    }
    _assignNonRaidHandler(handler) {
        this.game.potions.on('chargeUsed', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.potions.off('chargeUsed', handler);
    }
}
class PotionChangedEvent extends GameEvent {
    constructor(
        /** The action whose potion changed */
        action,
        /** The previous potion being used. Undefined if none. */
        oldPotion,
        /** The new potion being used. Undefined if none. */
        newPotion) {
        super();
        this.action = action;
        this.oldPotion = oldPotion;
        this.newPotion = newPotion;
    }
}
class MonsterKilledEvent extends GameEvent {
    constructor(
        /** The monster that was killed */
        monster,
        /** The attack type that the player was using when the monster was killed */
        killedByType,
        /** The player class that killed the monster */
        player,
        /** If the monster killed was corrupted */
        wasCorrupted) {
        super();
        this.monster = monster;
        this.killedByType = killedByType;
        this.player = player;
        this.wasCorrupted = wasCorrupted;
    }
}
class MonsterKilledEventMatcher extends NonRaidGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'MonsterKilled';
        try {
            if (options.monsterIDs !== undefined)
                this.monsters = game.monsters.getSetFromIds(options.monsterIDs);
            if (options.droppedCurrencies !== undefined)
                this.droppedCurrencies = game.currencies.getSetFromIds(options.droppedCurrencies);
            if (options.droppedSoul !== undefined)
                this.droppedSoul = options.droppedSoul;
            if (options.isCorrupted !== undefined)
                this.isCorrupted = options.isCorrupted;
        } catch (e) {
            throw new DataConstructionError(MonsterKilledEventMatcher.name, e);
        }
    }
    get monsterList() {
        if (this.monsters === undefined)
            return [];
        return [...this.monsters];
    }
    doesEventMatch(event) {
        return ((this.monsters === undefined || this.monsters.has(event.monster)) &&
            (this.killedWithType === undefined || event.killedByType === this.killedWithType) &&
            (this.droppedCurrencies === undefined ||
                event.monster.currencyDrops.some(({
                    currency
                }) => {
                    var _a;
                    return (_a = this.droppedCurrencies) === null || _a === void 0 ? void 0 : _a.has(currency);
                })) &&
            (this.droppedSoul === undefined ||
                this.droppedSoul === (event.monster.bones !== undefined && event.monster.bones.item instanceof SoulItem)) &&
            (this.isCorrupted === undefined || event.wasCorrupted === this.isCorrupted));
    }
    _assignNonRaidHandler(handler) {
        this.game.combat.on('monsterKilled', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.combat.off('monsterKilled', handler);
    }
}
class MonsterSpawnedEvent extends GameEvent {
    constructor(
        /** The monster that spawned */
        monster) {
        super();
        this.monster = monster;
    }
}
class MonsterSpawnedEventMatcher extends NonRaidGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'MonsterSpawned';
        try {
            if (options.monsterIDs !== undefined)
                this.monsters = game.monsters.getSetFromIds(options.monsterIDs);
        } catch (e) {
            throw new DataConstructionError(MonsterSpawnedEventMatcher.name, e);
        }
    }
    get monsterList() {
        if (this.monsters === undefined)
            return [];
        return [...this.monsters];
    }
    doesEventMatch(event) {
        return this.monsters === undefined || this.monsters.has(event.monster);
    }
    _assignNonRaidHandler(handler) {
        this.game.combat.on('monsterSpawned', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.combat.off('monsterSpawned', handler);
    }
}
/** Triggers when a character "Respwans" from the increasedRebirthChance modifier */
class CharacterRebirthEvent extends GameEvent {
    constructor() {
        super();
    }
}
/** Fires when the player changes their currently equipped items. Occurs before stats are computed. */
class EquipmentChangedEvent extends GameEvent {
    constructor(player) {
        super();
        this.player = player;
    }
}
class ItemEquippedEvent extends GameEvent {
    constructor(
        /** The item that was equipped */
        item,
        /** The quantity of the item that was equipped */
        quantity) {
        super();
        this.item = item;
        this.quantity = quantity;
    }
}
class ItemEquippedEventMatcher extends CharacterGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'ItemEquipped';
        try {
            if (options.itemIDs !== undefined)
                this.items = game.items.equipment.getSetFromIds(options.itemIDs);
        } catch (e) {
            throw new DataConstructionError(ItemEquippedEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return this.items === undefined || this.items.has(event.item);
    }
    _assignCharacterHandler(handler, combat) {
        combat.player.on('itemEquipped', handler);
    }
    _unassignCharacterHandler(handler, combat) {
        combat.player.off('itemEquipped', handler);
    }
}
class FoodEquippedEvent extends GameEvent {
    constructor(
        /** The food that was equipped */
        item,
        /** The quantity of the food that was equipped */
        quantity) {
        super();
        this.item = item;
        this.quantity = quantity;
    }
}
class FoodEquippedEventMatcher extends CharacterGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'FoodEquipped';
        try {
            if (options.itemIDs !== undefined)
                this.items = game.items.food.getSetFromIds(options.itemIDs);
        } catch (e) {
            throw new DataConstructionError(FoodEquippedEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return this.items === undefined || this.items.has(event.item);
    }
    _assignCharacterHandler(handler, combat) {
        combat.player.on('foodEquipped', handler);
    }
    _unassignCharacterHandler(handler, combat) {
        combat.player.off('foodEquipped', handler);
    }
}
class ShopPurchaseMadeEvent extends GameEvent {
    constructor(
        /** The Purchase that was made */
        purchase,
        /** The quantity of the purchase bought */
        quantity) {
        super();
        this.purchase = purchase;
        this.quantity = quantity;
    }
}
class ShopPurchaseMadeEventMatcher extends NonRaidGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'ShopPurchaseMade';
        try {
            if (options.purchaseIDs !== undefined)
                this.purchases = game.shop.purchases.getSetFromIds(options.purchaseIDs);
        } catch (e) {
            throw new DataConstructionError(ShopPurchaseMadeEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return this.purchases === undefined || this.purchases.has(event.purchase);
    }
    _assignNonRaidHandler(handler) {
        this.game.shop.on('purchaseMade', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.shop.off('purchaseMade', handler);
    }
}
class SummonTabletUsedEvent extends GameEvent {
    constructor(
        /** The tablet that was used */
        tablet,
        /** The summoning recipe associated with the tablet */
        recipe) {
        super();
        this.tablet = tablet;
        this.recipe = recipe;
    }
}
class SummonTabletUsedEventMatcher extends CharacterGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'SummonTabletUsed';
        try {
            if (options.tabletIDs !== undefined)
                this.tablets = game.items.equipment.getSetFromIds(options.tabletIDs);
            if (options.realms !== undefined)
                this.realms = game.realms.getSetFromIds(options.realms);
        } catch (e) {
            throw new DataConstructionError(SummonTabletUsedEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.tablets === undefined || this.tablets.has(event.tablet)) &&
            (this.realms === undefined || (event.recipe !== undefined && this.realms.has(event.recipe.realm))));
    }
    _assignCharacterHandler(handler, combat) {
        combat.player.on('summonTabletUsed', handler);
    }
    _unassignCharacterHandler(handler, combat) {
        combat.player.off('summonTabletUsed', handler);
    }
}
class GameEventSystem {
    constructor(game) {
        this.game = game;
    }
    /** Constructs a GameEventMatcher object from any event matcher datat type */
    constructMatcher(data) {
        switch (data.type) {
            case 'WoodcuttingAction':
                return new WoodcuttingActionEventMatcher(data, this.game);
            case 'FishingAction':
                return new FishingActionEventMatcher(data, this.game);
            case 'FiremakingAction':
                return new FiremakingActionEventMatcher(data, this.game);
            case 'BonfireLit':
                return new BonfireLitEventMatcher(data, this.game);
            case 'CookingAction':
                return new CookingActionEventMatcher(data, this.game);
            case 'MiningAction':
                return new MiningActionEventMatcher(data, this.game);
            case 'SmithingAction':
                return new SmithingActionEventMatcher(data, this.game);
            case 'ThievingAction':
                return new ThievingActionEventMatcher(data, this.game);
            case 'FarmingPlantAction':
                return new FarmingPlantActionEventMatcher(data, this.game);
            case 'FarmingHarvestAction':
                return new FarmingHarvestActionEventMatcher(data, this.game);
            case 'FletchingAction':
                return new FletchingActionEventMatcher(data, this.game);
            case 'CraftingAction':
                return new CraftingActionEventMatcher(data, this.game);
            case 'RunecraftingAction':
                return new RunecraftingActionEventMatcher(data, this.game);
            case 'HerbloreAction':
                return new HerbloreActionEventMatcher(data, this.game);
            case 'AgilityAction':
                return new AgilityActionEventMatcher(data, this.game);
            case 'SummoningAction':
                return new SummoningActionEventMatcher(data, this.game);
            case 'AstrologyAction':
                return new AstrologyActionEventMatcher(data, this.game);
            case 'AltMagicAction':
                return new AltMagicActionEventMatcher(data, this.game);
            case 'MonsterDrop':
                return new MonsterDropEventMatcher(data, this.game);
            case 'PlayerAttack':
                return new PlayerAttackEventMatcher(data, this.game);
            case 'EnemyAttack':
                return new EnemyAttackEventMatcher(data, this.game);
            case 'FoodEaten':
                return new FoodEatenEventMatcher(data, this.game);
            case 'PrayerPointConsumption':
                return new PrayerPointConsumptionEventMatcher(data, this.game);
            case 'PlayerHitpointRegeneration':
                return new PlayerHitpointRegenerationMatcher(data, this.game);
            case 'PlayerSummonAttack':
                return new PlayerSummonAttackEventMatcher(data, this.game);
            case 'RuneConsumption':
                return new RuneConsumptionEventMatcher(data, this.game);
            case 'PotionUsed':
                return new PotionUsedEventMatcher(data, this.game);
            case 'PotionChargeUsed':
                return new PotionChargeUsedEventMatcher(data, this.game);
            case 'MonsterKilled':
                return new MonsterKilledEventMatcher(data, this.game);
            case 'ItemEquipped':
                return new ItemEquippedEventMatcher(data, this.game);
            case 'FoodEquipped':
                return new FoodEquippedEventMatcher(data, this.game);
            case 'ShopPurchaseMade':
                return new ShopPurchaseMadeEventMatcher(data, this.game);
            case 'SummonTabletUsed':
                return new SummonTabletUsedEventMatcher(data, this.game);
            case 'MonsterSpawned':
                return new MonsterSpawnedEventMatcher(data, this.game);
            case 'CartographySurvey':
                return new CartographySurveyEventMatcher(data, this.game);
            case 'CartographyPaperMaking':
                return new CartographyPaperMakingEventMatcher(data, this.game);
            case 'CartographyMapUpgrade':
                return new CartographyMapUpgradeEventMatcher(data, this.game);
            case 'CartographyMapRefinement':
                return new CartographyMapRefinementEventMatcher(data, this.game);
            case 'CartographyTravel':
                return new CartographyTravelEventMatcher(data, this.game);
            case 'ArchaeologyAction':
                return new ArchaeologyActionEventMatcher(data, this.game);
            case 'TownshipTaskCompleted':
                return new TownshipTaskCompletedEventMatcher(data, this.game);
            case 'HarvestingAction':
                return new HarvestingActionEventMatcher(data, this.game);
            case 'SoulPointConsumption':
                return new SoulPointConsumptionEventMatcher(data, this.game);
            case 'BoneDrop':
                return new BoneDropEventMatcher(data, this.game);
        }
    }
    /**
     * Assigns the handler function for each game event matcher
     * @param matchers An array of game event matchers
     * @param handler The handler to call each time an event matches
     * @param golbinRaid If these matchers were assigned from a golbin raid related class
     * @returns An array of unassigner functions
     */
    assignMatchers(matchers, handler, golbinRaid = false) {
        return matchers.map((matcher) => {
            return matcher.assignHandler(handler, golbinRaid);
        });
    }
    /** Calls each unassigner in an array of unassigner functions */
    unassignMatchers(unassigners) {
        unassigners.forEach((unassigner) => unassigner());
    }
}
class CartographySurveyEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The hex that was surveyed */
        hex) {
        super();
        this.skill = skill;
        this.hex = hex;
        this.activePotion = skill.activePotion;
    }
}
class CartographySurveyEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        var _a;
        super(options, game);
        this.type = 'CartographySurvey';
        try {
            if (options.worldMaps !== undefined)
                this.worldMaps = (_a = game.cartography) === null || _a === void 0 ? void 0 : _a.worldMaps.getSetFromIds(options.worldMaps);
        } catch (e) {
            throw new DataConstructionError(CartographySurveyEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return (this.worldMaps === undefined || this.worldMaps.has(event.hex.map)) && super.doesEventMatch(event);
    }
    _assignNonRaidHandler(handler) {
        if (this.game.cartography !== undefined)
            this.game.cartography.on('survey', handler);
    }
    _unassignNonRaidHandler(handler) {
        if (this.game.cartography !== undefined)
            this.game.cartography.off('survey', handler);
    }
}
class CartographyTravelEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The hex that was travelled to */
        hex) {
        super();
        this.skill = skill;
        this.hex = hex;
        this.activePotion = skill.activePotion;
    }
}
class CartographyTravelEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        var _a;
        super(options, game);
        this.type = 'CartographyTravel';
        try {
            if (options.worldMaps !== undefined)
                this.worldMaps = (_a = game.cartography) === null || _a === void 0 ? void 0 : _a.worldMaps.getSetFromIds(options.worldMaps);
        } catch (e) {
            throw new DataConstructionError(CartographyTravelEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return (this.worldMaps === undefined || this.worldMaps.has(event.hex.map)) && super.doesEventMatch(event);
    }
    _assignNonRaidHandler(handler) {
        if (this.game.cartography !== undefined)
            this.game.cartography.on('travel', handler);
    }
    _unassignNonRaidHandler(handler) {
        if (this.game.cartography !== undefined)
            this.game.cartography.off('travel', handler);
    }
}
class CartographyPaperMakingEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** Recipe that is being used to make paper */
        recipe) {
        super();
        this.skill = skill;
        this.recipe = recipe;
        this.activePotion = skill.activePotion;
        this.realm = recipe.realm;
    }
}
class CartographyPaperMakingEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        var _a;
        super(options, game);
        this.type = 'CartographyPaperMaking';
        try {
            if (options.recipes !== undefined)
                this.recipes = (_a = game.cartography) === null || _a === void 0 ? void 0 : _a.paperRecipes.getSetFromIds(options.recipes);
        } catch (e) {
            throw new DataConstructionError(CartographyPaperMakingEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return (this.recipes === undefined || this.recipes.has(event.recipe)) && super.doesEventMatch(event);
    }
    _assignNonRaidHandler(handler) {
        if (this.game.cartography !== undefined)
            this.game.cartography.on('madePaper', handler);
    }
    _unassignNonRaidHandler(handler) {
        if (this.game.cartography !== undefined)
            this.game.cartography.off('madePaper', handler);
    }
}
class CartographyMapUpgradeEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** Map that is being upgraded for the event */
        map) {
        super();
        this.skill = skill;
        this.map = map;
        this.activePotion = skill.activePotion;
        this.realm = map.digSite.realm;
    }
}
class CartographyMapUpgradeEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        var _a;
        super(options, game);
        this.type = 'CartographyMapUpgrade';
        try {
            if (options.digSites !== undefined)
                this.digSites = (_a = game.archaeology) === null || _a === void 0 ? void 0 : _a.actions.getSetFromIds(options.digSites);
        } catch (e) {
            throw new DataConstructionError(CartographyMapUpgradeEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return (this.digSites === undefined || this.digSites.has(event.map.digSite)) && super.doesEventMatch(event);
    }
    _assignNonRaidHandler(handler) {
        if (this.game.cartography !== undefined)
            this.game.cartography.on('upgradeMap', handler);
    }
    _unassignNonRaidHandler(handler) {
        if (this.game.cartography !== undefined)
            this.game.cartography.off('upgradeMap', handler);
    }
}
class CartographyMapRefinementEvent extends GameEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The map that had a refinement bought for it */
        map) {
        super();
        this.skill = skill;
        this.map = map;
    }
}
class CartographyMapRefinementEventMatcher extends NonRaidGameEventMatcher {
    constructor(options, game) {
        var _a;
        super(game);
        this.type = 'CartographyMapRefinement';
        try {
            if (options.digSites !== undefined)
                this.digSites = (_a = game.archaeology) === null || _a === void 0 ? void 0 : _a.actions.getSetFromIds(options.digSites);
        } catch (e) {
            throw new DataConstructionError(CartographyMapRefinementEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return this.digSites === undefined || this.digSites.has(event.map.digSite);
    }
    _assignNonRaidHandler(handler) {
        if (this.game.cartography !== undefined)
            this.game.cartography.on('mapRefinement', handler);
    }
    _unassignNonRaidHandler(handler) {
        if (this.game.cartography !== undefined)
            this.game.cartography.off('mapRefinement', handler);
    }
}
/** Event for an Archaeology Skill Action */
class ArchaeologyActionEvent extends SkillActionEvent {
    constructor(
        /** The skill the event originated from */
        skill,
        /** The dig site being dug in */
        action) {
        super();
        this.skill = skill;
        this.action = action;
        /** If an artifact was found during the action */
        this.artifactFound = false;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
    }
}
/** Matches a WoodcuttingActionEvent */
class ArchaeologyActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        var _a;
        super(options, game);
        this.type = 'ArchaeologyAction';
        try {
            if (game.archaeology === undefined)
                throw new UnregisteredObjectError(Skill.name, "melvorAoD:Archaeology" /* SkillIDs.Archaeology */ );
            if (options.actionIDs !== undefined) {
                this.actions = (_a = game.archaeology) === null || _a === void 0 ? void 0 : _a.actions.getSetFromIds(options.actionIDs);
            }
            if (options.artifactFound !== undefined)
                this.artifactFound = options.artifactFound;
        } catch (e) {
            throw new DataConstructionError(ArchaeologyActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return ((this.actions === undefined || this.actions.has(event.action)) &&
            (this.artifactFound === undefined || event.artifactFound === this.artifactFound) &&
            super.doesEventMatch(event));
    }
    _assignNonRaidHandler(handler) {
        if (this.game.archaeology !== undefined)
            this.game.archaeology.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        if (this.game.archaeology !== undefined)
            this.game.archaeology.off('action', handler);
    }
}
/** Event that is fired when anything changes that may meet/fail to meet the requirements system */
class RequirementChangedEvent extends GameEvent {
    constructor() {
        super();
    }
}
class TownshipTaskCompletedEvent extends SkillActionEvent {
    constructor(
        /** The task that was completed */
        task) {
        super();
        this.task = task;
    }
}
class TownshipTaskCompletedEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'TownshipTaskCompleted';
        try {
            if (options.taskIDs !== undefined)
                this.tasks = game.township.tasks.tasks.getSetFromIds(options.taskIDs);
        } catch (e) {
            throw new DataConstructionError(TownshipTaskCompletedEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return this.tasks === undefined || this.tasks.has(event.task);
    }
    _assignNonRaidHandler(handler) {
        this.game.township.tasks.on('townshipTaskCompleted', handler);
    }
    _unassignNonRaidHandler(handler) {
        this.game.township.tasks.off('townshipTaskCompleted', handler);
    }
}
class DungeonCompletedEvent extends GameEvent {
    constructor(
        /** The dungeon that was completed */
        dungeon) {
        super();
        this.dungeon = dungeon;
    }
}
class AbyssDepthCompletedEvent extends GameEvent {
    constructor(
        /** The depth of The Abyss that was completed */
        depth) {
        super();
        this.depth = depth;
    }
}
class StrongholdCompletedEvent extends GameEvent {
    constructor(
        /** The Stronghold that was completed */
        stronghold) {
        super();
        this.stronghold = stronghold;
    }
}
class HarvestingActionEvent extends SkillActionEvent {
    constructor(
        /** The source skill for the event */
        skill,
        /** The current vein being harvested */
        action) {
        super();
        this.skill = skill;
        this.action = action;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
    }
}
class HarvestingActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        var _a;
        super(options, game);
        this.type = 'HarvestingAction';
        try {
            if (options.actionIDs !== undefined) {
                this.actions = (_a = game.harvesting) === null || _a === void 0 ? void 0 : _a.actions.getSetFromIds(options.actionIDs);
            }
        } catch (e) {
            throw new DataConstructionError(HarvestingActionEventMatcher.name, e);
        }
    }
    doesEventMatch(event) {
        return (this.actions === undefined || this.actions.has(event.action)) && super.doesEventMatch(event);
    }
    _assignNonRaidHandler(handler) {
        var _a;
        (_a = this.game.harvesting) === null || _a === void 0 ? void 0 : _a.on('action', handler);
    }
    _unassignNonRaidHandler(handler) {
        var _a;
        (_a = this.game.harvesting) === null || _a === void 0 ? void 0 : _a.off('action', handler);
    }
}
class SoulPointConsumptionEvent extends GameEvent {
    constructor(
        /** The amount of points used */
        pointsUsed) {
        super();
        this.pointsUsed = pointsUsed;
    }
}
class SoulPointConsumptionEventMatcher extends CharacterGameEventMatcher {
    constructor(options, game) {
        super(game);
        this.type = 'SoulPointConsumption';
    }
    doesEventMatch(event) {
        return true;
    }
    _assignCharacterHandler(handler, combat) {
        combat.player.on('soulPointsUsed', handler);
    }
    _unassignCharacterHandler(handler, combat) {
        combat.player.off('soulPointsUsed', handler);
    }
}
//# sourceMappingURL=gameEvents.js.map
checkFileVersion('?12097')