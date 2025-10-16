"use strict";
class CustomSkillMilestone {
    constructor(data) {
        this.abyssalLevel = 0;
        this.level = data.level;
        this._media = data.media;
        this._name = data.name;
        this._milestoneID = data.milestoneID;
        if (data.abyssalLevel)
            this.abyssalLevel = data.abyssalLevel;
    }
    get name() {
        if (this._milestoneID !== undefined)
            return getLangString(`MILESTONES_${this._milestoneID}`);
        return this._name;
    }
    get media() {
        return assets.getURI(this._media); // TODO_C: Adjust to get mod data
    }
}
class EquipItemMilestone {
    constructor(data, game, skill) {
        this.level = 1;
        this.abyssalLevel = 0;
        try {
            this.item = game.items.equipment.getObjectSafe(data.itemID);
        } catch (e) {
            throw new DataConstructionError(EquipItemMilestone.name, e);
        }
    }
    get name() {
        return this.item.name;
    }
    get media() {
        return this.item.media;
    }
    setLevel(skill) {
        let level = 1;
        let abyssalLevel = 0;
        this.item.equipRequirements.some((requirement) => {
            if (requirement.type === 'SkillLevel' && requirement.skill === skill) {
                level = requirement.level;
                return true;
            }
            if (requirement.type === 'AllSkillLevels' &&
                (requirement.exceptions === undefined || !requirement.exceptions.has(skill)) &&
                (requirement.namespace === undefined || requirement.namespace.name === skill.namespace)) {
                level = requirement.level;
                return true;
            }
        });
        this.item.equipRequirements.some((requirement) => {
            if (requirement.type === 'AbyssalLevel' && requirement.skill === skill) {
                abyssalLevel = requirement.level;
                return true;
            }
        });
        this.level = level;
        this.abyssalLevel = abyssalLevel;
    }
}
class SkillMasteryMilestone {
    constructor(skill) {
        this.skill = skill;
    }
    get level() {
        return 99;
    }
    get media() {
        return this.skill.media;
    }
    get name() {
        return getLangString('MILESTONES_SKILL_MASTERY');
    }
}
class AgilityObstacleMilestone {
    constructor(tier, course) {
        this.tier = tier;
        this.course = course;
    }
    get media() {
        return assets.getURI('assets/media/main/stamina.png');
    }
    get name() {
        // TODO_C Differentiate between Melvor and Abyssal Realm courses
        return templateLangString('MENU_TEXT_OBSTACLE_NUMBER', {
            obstacleNumber: numberWithCommas(this.tier + 1)
        });
    }
    get level() {
        return this.course.obstacleSlots[this.tier].level;
    }
    get abyssalLevel() {
        var _a;
        return (_a = this.course.obstacleSlots[this.tier].abyssalLevel) !== null && _a !== void 0 ? _a : 0;
    }
}
class AgilityPillarMilestone {
    constructor(agility, tier, course) {
        this.agility = agility;
        this.tier = tier;
        this.course = course;
    }
    get level() {
        return this.course.pillarSlots[this.tier].level;
    }
    get abyssalLevel() {
        var _a;
        return (_a = this.course.pillarSlots[this.tier].abyssalLevel) !== null && _a !== void 0 ? _a : 0;
    }
    get media() {
        return this.agility.media;
    }
    get name() {
        switch (this.tier) {
            case 0:
                return getLangString('MENU_TEXT_PASSIVE_PILLAR');
            case 1:
                return getLangString('MENU_TEXT_ELITE_PASSIVE_PILLAR');
            default:
                return getLangString('MENU_TEXT_PASSIVE_PILLAR');
        }
    }
}
class SlayerAreaMilestone {
    constructor(area, level, abyssalLevel = 0) {
        this.area = area;
        this.level = level;
        this.abyssalLevel = abyssalLevel;
    }
    get name() {
        return this.area.name;
    }
    get media() {
        return this.area.media;
    }
}
//# sourceMappingURL=milestones.js.map
checkFileVersion('?12097')