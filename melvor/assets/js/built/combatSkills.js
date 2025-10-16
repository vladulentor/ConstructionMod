"use strict";
// Basic skill classes for combat skills
class CombatSkill extends Skill {
    get isCombat() {
        return true;
    }
    get hasMinibar() {
        return false;
    }
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.game.combat.computeAllStats();
    }
}
class Attack extends CombatSkill {
    constructor(namespace, game) {
        super(namespace, 'Attack', game);
        this._media = "assets/media/skills/attack/attack.png" /* Assets.Attack */ ;
        this.renderQueue = new SkillRenderQueue();
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.sortMilestones();
    }
    shouldShowSkillInSidebar() {
        return (super.shouldShowSkillInSidebar() || this.game.combatAreas.some((area) => area.realm === this.game.currentRealm));
    }
}
class Strength extends CombatSkill {
    constructor(namespace, game) {
        super(namespace, 'Strength', game);
        this._media = "assets/media/skills/strength/strength.png" /* Assets.Strength */ ;
        this.renderQueue = new SkillRenderQueue();
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.sortMilestones();
    }
    shouldShowSkillInSidebar() {
        return (super.shouldShowSkillInSidebar() || this.game.combatAreas.some((area) => area.realm === this.game.currentRealm));
    }
}
class Defence extends CombatSkill {
    constructor(namespace, game) {
        super(namespace, 'Defence', game);
        this._media = "assets/media/skills/defence/defence.png" /* Assets.Defence */ ;
        this.renderQueue = new SkillRenderQueue();
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.sortMilestones();
    }
    shouldShowSkillInSidebar() {
        return (super.shouldShowSkillInSidebar() || this.game.combatAreas.some((area) => area.realm === this.game.currentRealm));
    }
}
class Hitpoints extends CombatSkill {
    constructor(namespace, game) {
        super(namespace, 'Hitpoints', game);
        this._media = "assets/media/skills/hitpoints/hitpoints.png" /* Assets.Hitpoints */ ;
        this.renderQueue = new SkillRenderQueue();
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    get tutorialLevelCap() {
        return 10;
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.sortMilestones();
    }
    get startingLevel() {
        return 10;
    }
    onLevelUp(oldLevel, newLevel) {
        super.onLevelUp(oldLevel, newLevel);
        this.game.combat.player.heal((newLevel - oldLevel) * numberMultiplier);
    }
    onAbyssalLevelUp(oldLevel, newLevel) {
        super.onAbyssalLevelUp(oldLevel, newLevel);
        if (this.game.combat.player.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ ) {
            const healing = (newLevel - oldLevel) * numberMultiplier * 200;
            this.game.combat.player.heal(healing);
        }
    }
    shouldShowSkillInSidebar() {
        return (super.shouldShowSkillInSidebar() || this.game.combatAreas.some((area) => area.realm === this.game.currentRealm));
    }
}
class Ranged extends CombatSkill {
    constructor(namespace, game) {
        super(namespace, 'Ranged', game);
        this._media = "assets/media/skills/ranged/ranged.png" /* Assets.Ranged */ ;
        this.renderQueue = new SkillRenderQueue();
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.sortMilestones();
    }
    shouldShowSkillInSidebar() {
        return (super.shouldShowSkillInSidebar() || this.game.combatAreas.some((area) => area.realm === this.game.currentRealm));
    }
}
class PrayerRenderQueue extends SkillRenderQueue {
    constructor() {
        super(...arguments);
        this.prayerMenu = false;
    }
}
class Prayer extends CombatSkill {
    constructor(namespace, game) {
        super(namespace, 'Prayer', game);
        this._media = "assets/media/skills/prayer/prayer.png" /* Assets.Prayer */ ;
        /** Renders required for the skill */
        this.renderQueue = new PrayerRenderQueue();
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.game.prayers.forEach((prayer) => {
            if (prayer.abyssalLevel > 0)
                this.abyssalMilestones.push(prayer);
            else
                this.milestones.push(prayer);
        });
        this.sortMilestones();
    }
    render() {
        super.render();
        this.renderPrayerMenu();
    }
    renderPrayerMenu() {
        if (!this.renderQueue.prayerMenu)
            return;
        combatMenus.prayer.updateForLevel(this.game.combat.player, this.level, this.abyssalLevel);
        this.renderQueue.prayerMenu = false;
    }
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.renderQueue.prayerMenu = true;
    }
    shouldShowSkillInSidebar() {
        return (super.shouldShowSkillInSidebar() || this.game.prayers.some((prayer) => prayer.realm === this.game.currentRealm));
    }
}
class Slayer extends CombatSkill {
    constructor(namespace, game) {
        super(namespace, 'Slayer', game);
        this._media = "assets/media/skills/slayer/slayer.png" /* Assets.Slayer */ ;
        this.renderQueue = new SkillRenderQueue();
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.game.slayerAreas.forEach((area) => {
            let level = 1;
            let isAbyssal = false;
            const isMilestone = area.entryRequirements.some((req) => {
                switch (req.type) {
                    case 'AllSkillLevels':
                        if (req.exceptions !== undefined && req.exceptions.has(this))
                            return false;
                        if (req.namespace === undefined || req.namespace.name === this.namespace) {
                            level = req.level;
                            return true;
                        }
                        return true;
                    case 'SkillLevel':
                        if (req.skill === this) {
                            level = req.level;
                            return true;
                        }
                        break;
                    case 'AbyssalLevel':
                        if (req.skill === this) {
                            level = req.level;
                            isAbyssal = true;
                            return true;
                        }
                }
                return false;
            });
            if (isMilestone) {
                if (isAbyssal) {
                    this.abyssalMilestones.push(new SlayerAreaMilestone(area, 0, level));
                } else {
                    this.milestones.push(new SlayerAreaMilestone(area, level));
                }
            }
        });
        this.sortMilestones();
    }
    shouldShowSkillInSidebar() {
        return (super.shouldShowSkillInSidebar() || this.game.slayerAreas.some((area) => area.realm === this.game.currentRealm));
    }
}
//# sourceMappingURL=combatSkills.js.map
checkFileVersion('?12097')