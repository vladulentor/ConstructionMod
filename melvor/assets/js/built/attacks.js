"use strict";
/** Convenience class for generating normal damage */
class NormalDamage {
    constructor(amplitude, attackCount = -1) {
        this.character = 'Attacker';
        this.maxRoll = 'MaxHit';
        this.maxPercent = 100;
        this.minRoll = 'MinHit';
        this.minPercent = 100;
        this.roll = true;
        if (attackCount !== -1)
            this.attackCount = attackCount;
        this.maxPercent = amplitude;
        this.minPercent = amplitude;
    }
}
/**
 * Gets a Callback Function for Array<Damage>.reduce. Used to roll the damage from Special Attacks and Combat Effects
 * @param attacker The character performing the Attack
 * @param target The character recieving the Attack
 * @param prevDamage The Damage Dealt when the Combat Effect was applied
 * @param damageTaken The Damage Taken when the Combat Effect was applied
 * @returns A Callback function for use in Array<Damage>.reduce
 */
function damageReducer(attacker, target, prevDamage = 0, damageTaken = 0) {
    return (totalDamage, damage) => {
        if (damage.attackCount !== undefined && damage.attackCount !== attacker.attackCount)
            return totalDamage;
        let character;
        switch (damage.character) {
            case 'Attacker':
                character = attacker;
                break;
            case 'Target':
                character = target;
                break;
            default:
                throw new Error(`Invalid damage character type: ${damage.character}`);
        }
        const maxRoll = getDamageRoll(character, damage.maxRoll, damage.maxPercent, prevDamage, damageTaken);
        if (damage.roll) {
            const minRoll = getDamageRoll(character, damage.minRoll, damage.minPercent, prevDamage, damageTaken);
            return rollInteger(minRoll, maxRoll) + totalDamage;
        } else {
            return maxRoll + totalDamage;
        }
    };
}
/**
 * Gets the maximum amount of damage that can be rolled by a Damage object during a Special Attack
 * @param damage The damage object
 * @param attacker The character performing the Attack
 * @param target The character recieving the Attack
 * @param prevDamage The cumulative damage dealt with the Attack
 * @param damageTaken The value to use for DamageDealt damage rolls
 * @returns The maximum amount of damage that can be rolled
 */
function getMaxDamage(damage, attacker, target, prevDamage = 0, damageTaken = 0) {
    let character;
    switch (damage.character) {
        case 'Attacker':
            character = attacker;
            break;
        case 'Target':
            character = target;
            break;
        default:
            throw new Error(`Invalid damage character type: ${damage.character}`);
    }
    const maxRoll = getDamageRoll(character, damage.maxRoll, damage.maxPercent, prevDamage, damageTaken);
    return maxRoll;
}
/**
 * Computes the minimum/maximum range of damage that a Damage object can deal
 * @param character The Character to use the stats of
 * @param type The type of damage roll
 * @param percent The scaling of the damage range (Note: This is not always actually a percent)
 * @param damageDealt The cumulative damage dealt by a SpecialAttack, or the damage dealt when the CombatEffect was applied
 * @param damageTaken The damage taken when the CombatEffect was applied
 * @returns
 */
function getDamageRoll(character, type, percent, damageDealt = 0, damageTaken = 0) {
    let value = 0;
    switch (type) {
        case 'CurrentHP':
            value = character.hitpoints;
            break;
        case 'CurrentHPCapped200':
            value = Math.min(character.hitpoints, 200 * numberMultiplier);
            break;
        case 'MaxHP':
            value = character.stats.maxHitpoints;
            break;
        case 'DamageDealt':
            value = damageDealt;
            break;
        case 'DamageTaken':
            value = damageTaken;
            break;
        case 'MaxHit':
            value = character.stats.maxHit;
            break;
        case 'MinHit':
            value = character.stats.minHit;
            break;
        case 'Fixed':
            return percent * numberMultiplier;
        case 'MagicScaling':
            value = (character.levels.Magic + 1) * numberMultiplier;
            break;
        case 'One':
            return 1;
        case 'Rend':
            if (character.target.hitpoints !== character.target.stats.maxHitpoints)
                percent = 250;
            value = damageDealt;
            break;
        case 'Poisoned':
            if (character.isPoisoned)
                return numberMultiplier * percent;
            else
                return 0;
        case 'Bleeding':
            if (character.isBleeding)
                return numberMultiplier * percent;
            else
                return 0;
        case 'PoisonMin35':
            value = character.stats.minHit;
            if (character.target.isPoisoned)
                percent += 35;
            break;
        case 'PoisonMax35':
            value = character.stats.maxHit;
            if (character.target.isPoisoned)
                percent += 35;
            break;
        case 'PoisonFixed100':
            value = numberMultiplier * percent;
            if (character.target.isPoisoned)
                value *= 2;
            return value;
        case 'BurnFixed100':
            value = numberMultiplier * percent;
            if (character.target.isBurning)
                value *= 2;
            return value;
        case 'BurnMaxHit100':
            value = character.stats.maxHit;
            if (character.target.isBurning)
                percent += 100;
            break;
        case 'CursedFixed100':
            value = numberMultiplier * percent;
            if (character.target.isCursed)
                value *= 2;
            return value;
        case 'MaxHitDR':
            value = character.stats.maxHit;
            percent += character.stats.getResistance(game.normalDamage);
            break;
        case 'MaxHitScaledByHP':
            value = (character.stats.maxHit * character.hitpointsPercent) / 100;
            break;
        case 'MaxHitScaledByHP2x':
            value = (character.stats.maxHit * (character.hitpointsPercent * 2)) / 100;
            break;
        case 'FixedPlusMaxHit50':
            return numberMultiplier * percent + character.stats.maxHit / 2;
        case 'HPUnder90':
            if (character.hitpointsPercent <= 90)
                return numberMultiplier * percent;
            else
                return 0;
        case 'PoisonedMaxHit':
            value = character.target.isPoisoned ? character.stats.maxHit : 0;
            break;
        case 'Reflection':
            value = (character.levels.Attack + character.levels.Ranged + character.levels.Magic) * numberMultiplier;
            break;
        case 'DefenceLevel':
            value = character.levels.Defence * numberMultiplier;
            break;
        case 'Crystallize':
            value = character.isCrystallized ? character.stats.maxHit : Math.floor(character.stats.maxHit / 2);
            break;
        case 'BaseMaxHP':
            value = character.levels.Hitpoints * numberMultiplier;
            if (character.abyssalLevels.Hitpoints > 0) {
                value = Math.min(99, character.levels.Hitpoints) * numberMultiplier;
                value += numberMultiplier * (character.abyssalLevels.Hitpoints * 20);
                value *= 10;
            }
            break;
        default:
            throw new Error(`Invalid damage type: ${type}`);
    }
    return Math.floor((value * percent) / 100);
}
/** Data associated with Each DamageRollType */
const rollData = {
    CurrentHP: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: (name) => ` of ${name} current hitpoints`,
    },
    CurrentHPCapped200: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: (name) => ` of ${name} current hitpoints (Capped at 200 * HP Level)`,
    },
    MaxHP: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: (name) => ` of ${name} max hitpoints`,
    },
    DamageDealt: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: () => ` of the damage dealt`,
    },
    DamageTaken: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: () => ` of the damage taken`,
    },
    MaxHit: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: (name) => ` of ${name} max hit`,
    },
    FixedPlusMaxHit50: {
        formatPercent: (value) => `\${${value}}`,
        formatName: (name) => ` plus 50% of ${name} max hit`,
        modValue: multiplyByNumberMultiplier,
    },
    MinHit: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: (name) => ` of ${name} min hit`,
    },
    Fixed: {
        formatPercent: (value) => `\${${value}}`,
        formatName: () => '',
        modValue: multiplyByNumberMultiplier,
    },
    MagicScaling: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: (name) => ` of ${name} Magic level + 1`,
        modValue: multiplyByNumberMultiplier,
    },
    One: {
        formatPercent: () => '1',
        formatName: () => '',
    },
    Rend: {
        formatPercent: (value) => `\${${value}}% if the target has full HP, otherwise 250%,`,
        formatName: () => ` of the damage dealt`,
    },
    Poisoned: {
        formatPercent: (value) => `\${${value}} if the target is poisoned`,
        formatName: () => '',
        modValue: multiplyByNumberMultiplier,
    },
    Bleeding: {
        formatPercent: (value) => `\${${value}} if the target is bleeding`,
        formatName: () => '',
        modValue: multiplyByNumberMultiplier,
    },
    PoisonMax35: {
        formatPercent: (value) => `\${${value}}% + ${20}% damage if the target is poisoned`,
        formatName: (name) => ` of ${name} max hit`,
    },
    PoisonMin35: {
        formatPercent: (value) => `\${${value}}% + ${20}% damage if the target is poisoned`,
        formatName: (name) => ` of ${name} min hit`,
    },
    PoisonFixed100: {
        formatPercent: (value) => `\${${value}} + ${100}% damage if the target is poisoned`,
        formatName: () => '',
        modValue: multiplyByNumberMultiplier,
    },
    BurnFixed100: {
        formatPercent: (value) => `\${${value}} + ${100}% damage if the target is burning`,
        formatName: () => '',
        modValue: multiplyByNumberMultiplier,
    },
    BurnMaxHit100: {
        formatPercent: (value) => `\${${value}}% + ${100}% damage if the target is burning`,
        formatName: (name) => ` of ${name} max hit`,
    },
    CursedFixed100: {
        formatPercent: (value) => `\${${value}} + ${100}% damage if the target is cursed`,
        formatName: () => '',
        modValue: multiplyByNumberMultiplier,
    },
    MaxHitScaledByHP: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: (name) => ` of ${name} max hit multiplied by ${name} current hitpoints percent`,
    },
    HPUnder90: {
        formatPercent: (value) => `\${${value}} if the target's current hitpoints are under 90%`,
        formatName: () => '',
        modValue: multiplyByNumberMultiplier,
    },
    MaxHitScaledByHP2x: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: (name) => ` of ${name} max hit multiplied by 2 x ${name} current hitpoints percent`,
    },
    MaxHitDR: {
        formatPercent: (value) => `\${${value}}% + (Attacker DR%)`,
        formatName: () => ``,
    },
    PoisonedMaxHit: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: (name) => ` of ${name} max hit if the target is poisoned`,
    },
    Reflection: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: (name) => ` of ${name} combined Attack, Ranged and Magic Levels`,
        modValue: multiplyByNumberMultiplier,
    },
    DefenceLevel: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: (name) => ` of ${name} Defence Level`,
        modValue: multiplyByNumberMultiplier,
    },
    Crystallize: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: (name) => ` of ${name} max hit. This is doubled if Target is Crystallized`,
    },
    BaseMaxHP: {
        formatPercent: (value) => `\${${value}}%`,
        formatName: (name) => ` of ${name} base max hitpoints`,
    },
};
/**
 * Embeds the HTML of an image into a description string.
 * @param description The description to modify
 * @returns
 */
const applyDescriptionModifications = (() => {
    const DESCRIPTION_MODIFICATIONS = {
        stun: () => `<span class="text-warning font-w600"><img class="skill-icon-xxs" src="${assets.getURI(effectMedia.stun)}">Stun</span>`,
        stunned: () => `<span class="text-warning font-w600"><img class="skill-icon-xxs" src="${assets.getURI(effectMedia.stun)}">Stunned</span>`,
        shock: () => `<span class="text-warning font-w600"><img class="skill-icon-xxs" src="${assets.getURI(effectMedia.shocked)}">Shock</span>`,
        regen: () => `<span class="text-danger font-w600"><img class="skill-icon-xxs" src="${"assets/media/skills/hitpoints/hitpoints.png" /* Assets.Hitpoints */}">Regen</span>`,
        sleep: () => `<span class="text-primary font-w600"><img class="skill-icon-xxs" src="${assets.getURI(effectMedia.sleep)}">Sleep</span>`,
        frostburn: () => `<span class="text-primary font-w600"><img class="skill-icon-xxs" src="${assets.getURI(effectMedia.frostBurn)}">Frostburn</span>`,
        freeze: () => `<span class="text-primary font-w600"><img class="skill-icon-xxs" src="${assets.getURI(effectMedia.frozen)}">Freeze</span>`,
        bleed: () => `<span class="text-danger font-w600"><img class="skill-icon-xxs" src="${assets.getURI(dotMedia.Bleed)}">Bleed</span>`,
        burn: () => `<span class="text-danger font-w600"><img class="skill-icon-xxs" src="${assets.getURI(dotMedia.Burn)}">Burn</span>`,
        'inflicts poison': () => `inflicts <span class="text-success font-w600"><img class="skill-icon-xxs" src="${assets.getURI(dotMedia.Poison)}">Poison</span>`,
        'inflict poison': () => `apply <span class="text-success font-w600"><img class="skill-icon-xxs" src="${assets.getURI(dotMedia.Poison)}">Poison</span>`,
        'apply poison': () => `apply <span class="text-success font-w600"><img class="skill-icon-xxs" src="${assets.getURI(dotMedia.Poison)}">Poison</span>`,
        'deadly poison': () => `<span class="text-success font-w600"><img class="skill-icon-xxs" src="${assets.getURI(dotMedia.DeadlyPoison)}">Deadly Poison</span>`,
        affliction: () => `<span class="text-secondary font-w600"><img class="skill-icon-xxs" src="${assets.getURI(effectMedia.afflicted)}">Affliction</span>`,
        'mark of death': () => `<span class="text-secondary font-w600"><img class="skill-icon-xxs" src="${assets.getURI(effectMedia.markOfDeath)}">Mark of Death</span>`,
        decay: () => `<span class="text-secondary font-w600"><img class="skill-icon-xxs" src="${assets.getURI(effectMedia.decay)}">Decay</span>`,
        slow: () => `<span class="text-secondary font-w600"><img class="skill-icon-xxs" src="${assets.getURI(effectMedia.slowed)}">Slow</span>`,
        crystallized: () => `<span class="text-info font-w600"><img class="skill-icon-xxs" src="${assets.getURI(effectMedia.crystallize)}">Crystallized</span>`,
        crystallization: () => `<span class="text-info font-w600"><img class="skill-icon-xxs" src="${assets.getURI(effectMedia.crystallize)}">Crystallization</span>`,
        'crystal sanction': () => `<span class="text-danger font-w600"><img class="skill-icon-xxs" src="${assets.getURI(effectMedia.crystalSanction)}">Crystal Sanction</span>`,
        'unholy prayers': () => `<span class="text-danger font-w600"><img class="skill-icon-xxs" src="${assets.getURI('assets/media/skills/prayer/unholy_prayer.png')}">Unholy Prayers</span>`,
        barrier: () => `<span class="text-info font-w600"><img class="skill-icon-xxs" src="${assets.getURI("assets/media/skills/combat/barrier.png" /* Assets.Barrier */)}">Barrier</span>`,
        laceration: () => `<span class="text-danger font-w600"><img class="skill-icon-xxs" src="${assets.getURI("assets/media/status/laceration.png" /* Assets.Laceration */)}">Laceration</span>`,
        toxin: () => `<span class="text-toxin font-w600"><img class="skill-icon-xxs" src="${assets.getURI("assets/media/status/Toxin.png" /* Assets.Toxin */)}">Toxin</span>`,
        ablaze: () => `<span class="text-ablaze font-w600"><img class="skill-icon-xxs" src="${assets.getURI("assets/media/status/ablaze.png" /* Assets.Ablaze */)}">Ablaze</span>`,
        blight: () => `<span class="text-blight font-w600"><img class="skill-icon-xxs" src="${assets.getURI("assets/media/status/blight.png" /* Assets.Blight */)}">Blight</span>`,
        fear: () => `<span class="text-danger font-w600"><img class="skill-icon-xxs" src="${assets.getURI("assets/media/status/fear.png" /* Assets.Fear */)}">Fear</span>`,
        wither: () => `<span class="text-secondary font-w600"><img class="skill-icon-xxs" src="${assets.getURI("assets/media/status/wither.png" /* Assets.Wither */)}">Wither</span>`,
        silence: () => `<span class="text-secondary font-w600"><img class="skill-icon-xxs" src="${assets.getURI("assets/media/status/silence.png" /* Assets.Silence */)}">Silence</span>`,
        voidburst: () => `<span class="text-voidburst font-w600"><img class="skill-icon-xxs" src="${assets.getURI("assets/media/status/voidburst.png" /* Assets.Voidburst */)}">Voidburst</span>`,
        'skill xp': () => `<span class="text-info font-w700">Skill XP</span>`,
        'abyssal xp': () => `<span class="text-danger font-w700">Abyssal XP</span>`,
    };
    const DESCRIPTION_MODIFICATION_REGEXP = new RegExp(`\\b(${Object.keys(DESCRIPTION_MODIFICATIONS).join('|')})\\b`, 'gi');

    function applyDescriptionModifications(description) {
        if (setLang !== 'en')
            return description;
        description = description.replace(DESCRIPTION_MODIFICATION_REGEXP, (match) => {
            return DESCRIPTION_MODIFICATIONS[match.toLowerCase()]();
        });
        description = description.replace(/(\+\d+% Attack Interval)/gi, (match, number) => `<span class="text-secondary font-w600"><img class="skill-icon-xxs" src="${assets.getURI(effectMedia.slowed)}">${number}</span>`);
        description = description.replace(/(\+\d+% Reflect Damage)/gi, (match, number) => `<span class="text-danger font-w600"><img class="skill-icon-xxs" src="${game.defence.media}">${number}</span>`);
        /**game.skills.forEach((skill) => {
          let regexp = `\\b${skill.name}\\b`;
          if (skill.id === SkillIDs.Slayer) {
            regexp = `\\b${skill.name}(?! Coins)\\b`; // Manually ignore Slayer Coin string
          }
          description = description.replace(
            new RegExp(regexp, 'g'),
            `<span class="font-w600"><img class="skill-icon-xxs" src="${skill.media}">${skill.name}</span>`
          );
        });
        game.realms.forEach((realm) => {
          description = description.replace(
            new RegExp(`\\b${realm.name}\\b`, 'g'),
            `<span class="font-w600"><img class="skill-icon-xxs" src="${realm.media}">${realm.name}</span>`
          );
        });
        game.damageTypes.forEach((damageType) => {
          description = description.replace(
            new RegExp(`\\b${damageType.name}\\b`, 'g'),
            `<span class="font-w600" style="color:${damageType.spanColour};"><img class="skill-icon-xxs" src="${damageType.media}">${damageType.name}</span>`
          );
        });
        game.currencies.forEach((currency) => {
          let regexp = `\\b${currency.name}\\b`;
          if (currency.id === CurrencyIDs.SlayerCoins) {
            regexp = `\\b(?<!Abyssal )${currency.name}\\b`;
          }
          description = description.replace(
            new RegExp(regexp, 'g'),
            `<span class="font-w600"><img class="skill-icon-xxs" src="${currency.media}">${currency.name}</span>`
          );
        });**/
        return description;
    }
    return applyDescriptionModifications;
})();
/** Gets the prefix to use for a special attack's effect's string template data */
function effectPrefix(preHit, idx) {
    return preHit ? `preHitEffect${idx}` : `onHitEffect${idx}`;
}
/**
 * Adds string template data to an existing object for a Special Attack's effect
 * @param data The data object to add to
 * @param applicator The effect applicator
 * @param preHit If this effect applicator is from the prehit array of the attack
 * @param idx The index of the applicator in the attacks prehit/onhit array
 */
function addEffectApplicatorTemplateData(data, applicator, preHit, idx) {
    const prefix = effectPrefix(preHit, idx);
    applicator.addTemplateData(data, prefix);
    if (applicator instanceof TableCombatEffectApplicator) {
        switch (applicator.table.id) {
            case "melvorF:NaturesWrath0" /* CombatEffectTableIDs.NaturesWrath0 */ :
            case "melvorF:NaturesCall0" /* CombatEffectTableIDs.NaturesCall0 */ :
                applicator.table.table.forEach(({
                    applicator
                }, i) => {
                    applicator.effect.addTemplateData(data, effectPrefix(preHit, i + 1), applicator.initialParams);
                });
                break;
        }
    }
}
/**
 * Adds string template data to an existing object for a damage array
 * @param data The data object to add to
 * @param damage The damage array
 * @param prefix A prefix for the template data keys
 */
function addDamageTemplateData(data, damage, prefix) {
    damage.forEach((damage, i) => {
        const maxData = rollData[damage.maxRoll];
        let maxVal = damage.maxPercent;
        if (maxData.modValue !== undefined)
            maxVal = maxData.modValue(maxVal);
        data[`${prefix}DamageMaxValue${i}`] = `${maxVal}`;
        if (damage.roll) {
            const minData = rollData[damage.minRoll];
            let minVal = damage.minPercent;
            if (minData.modValue !== undefined)
                minVal = minData.modValue(minVal);
            data[`${prefix}DamageMinValue${i}`] = `${minVal}`;
        }
    });
}
/** Utility object for generating attack descriptions */
const attackDescriptions = (() => {
    /**
     * Contains functions that return the strings to fill in attack descriptions
     * Portions of text in descriptions surrounded by <> indicate sections that will be replaced by a descriptor
     */
    const attackDescriptors = {
        /** Number of Attacks Performed */
        Count: (attack, attNoun, targNoun) => '${hitCount}',
        /** Describes the damage dealt: e.g. Perform an attack that does <Damage> */
        Damage: (attack, attNoun, targNoun) => joinAsList(attack.damage.map((damage, i) => getDamageDescription(damage, attNoun, targNoun, i, 'attack'))),
        /** Describes the lifesteal */
        Lifesteal: (attack, attNoun, targNoun) => '${lifesteal}%',
        /** Name of target */
        Target: (attack, attNoun, targNoun) => `${targNoun.plain}`,
        /** Name of attacker */
        Attacker: (attack, attNoun, targNoun) => `${attNoun.plain}`,
        /** Name of target */
        TarPos: (attack, attNoun, targNoun) => `${targNoun.possesive}`,
        /** Name of attacker */
        AttPos: (attack, attNoun, targNoun) => `${attNoun.possesive}`,
        /** Description of effects applies before a hit: e.g. Perform an attack that <PrehitEffect>. */
        PrehitEffect: (attack, attNoun, targNoun) => joinAsSuperList(attack.prehitEffects.map((app, i) => getAttackEffectDescription(app, attNoun, targNoun, effectPrefix(true, i)))),
        /** Description of effects applied on a hit: e.g. Perform an attack that <HitEffect> on a hit. */
        HitEffect: (attack, attNoun, targNoun) => joinAsSuperList(attack.onhitEffects.map((app, i) => getAttackEffectDescription(app, attNoun, targNoun, effectPrefix(false, i)))),
        /** Gives "can miss" or "can't miss" depending on cantMiss */
        CanMiss: (attack, attNoun, targNoun) => (attack.cantMiss ? `can't miss` : 'can miss'),
        /** Gives "avoidable" or "unavoidable" depending on cantMiss */
        Avoidable: (attack, attNoun, targNoun) => (attack.cantMiss ? `unavoidable` : 'avoidable'),
        /** Gives the duration of the attack */
        Duration: (attack, attNoun, tarNoun) => '${duration}s',
        /** Gives the interval between multiple hits. */
        Interval: (attack, attNoun, tarNoun) => '${interval}s',
        Taris: (attack, attNoun, tarNoun) => `${tarNoun.is}`,
        Attis: (attack, attNoun, tarNoun) => `${attNoun.is}`,
        /** Gives a verbose description of the mechanics of an effect. */
        EffectMechanics: (attack, attNoun, tarNoun) => {
            return [
                    ...attack.prehitEffects.map((app, i) => getAttackEffectMechanics(app, attNoun, tarNoun, effectPrefix(true, i))),
                    ...attack.onhitEffects.map((app, i) => getAttackEffectMechanics(app, attNoun, tarNoun, effectPrefix(false, i))),
                ]
                .filter((d) => d !== '')
                .join();
        },
    };
    /**
     * Gets the description of a Damage object in the context of a Special Attack
     * @param damage The damage object
     * @param attackerNoun A Noun object for the character performing the attack
     * @param targetNoun A Noun object for the character recieving the attack
     * @param idx The index of the damage in the attacks damage array
     * @param prefix A prefix for any template data keys
     * @returns A description of the damage
     */
    function getDamageDescription(damage, attackerNoun, targetNoun, idx, prefix) {
        let description = '';
        let name = 'Unknown Name';
        switch (damage.character) {
            case 'Attacker':
                name = attackerNoun.possesive;
                break;
            case 'Target':
                name = targetNoun.possesive;
                break;
            default:
                throw new Error(`Invalid Damage Character`);
        }
        const maxData = rollData[damage.maxRoll];
        const maxKey = `DamageMaxValue${idx}`;
        const minKey = `DamageMinValue${idx}`;
        if (damage.roll) {
            const minData = rollData[damage.minRoll];
            if (damage.maxRoll === damage.minRoll) {
                description = `${minData.formatPercent(prefix + minKey)}-${maxData.formatPercent(prefix + maxKey)}${minData.formatName(name)}`;
            } else if (damage.maxRoll === 'MaxHit' &&
                damage.minRoll === 'MinHit' &&
                damage.maxPercent === damage.minPercent) {
                description = `\${${prefix + maxKey}}% of ${name} normal damage`;
            } else if (damage.maxRoll === 'PoisonMax35' &&
                damage.minRoll === 'PoisonMin35' &&
                damage.maxPercent === damage.minPercent) {
                description = `\${${prefix + maxKey}}% + ${20}% if ${targetNoun.plain} ${targetNoun.is} poisoned of ${name} normal damage`;
            } else {
                description = `${minData.formatPercent(prefix + minKey)}${minData.formatName(name)} to ${maxData.formatPercent(prefix + maxKey)}${maxData.formatName(name)}`;
            }
        } else {
            description = `${maxData.formatPercent(prefix + maxKey)}${maxData.formatName(name)}`;
        }
        if (damage.attackCount !== undefined)
            description += ` on the ${formatAsOrdinal(damage.attackCount + 1)} attack`;
        description = description.trimEnd();
        return description;
    }
    /** Gets a verbose description of a comparison operator */
    function describeComparison(operator) {
        switch (operator) {
            case '==':
                return 'equal to';
            case '!=':
                return 'not equal to';
            case '>':
                return 'above';
            case '<':
                return 'below';
            case '<=':
                return 'below or equal to';
            case '>=':
                return 'above or equal to';
        }
    }
    /**
     * Generates a description of a condition that must be met for an effect applicator to process
     * @param condition The condition to get a description of
     * @param attackerNoun A Noun object for the character performing the Special Attack
     * @param targetNoun A Noun object for the character recieving the Special Attack
     * @param prefix A prefix for any template data keys
     * @returns A description of the condition
     */
    function describeApplicatorCondition(condition, attackerNoun, targetNoun, prefix) {
        if (condition instanceof CharacterValueCondition || condition instanceof CharacterBooleanCondition) {
            let description = '';
            const condSelfNoun = condition.character === 'Player' ? attackerNoun : targetNoun;
            const condTargetNoun = condition.character === 'Player' ? targetNoun : attackerNoun;
            if (condition instanceof HitpointsCondition) {
                description += `${condSelfNoun.possesive} hitpoints are ${describeComparison(condition.operator)} \${${prefix}hpThreshold}%`;
            } else if (condition instanceof CombatEffectGroupCondition) {
                description += `${condSelfNoun.plain} ${condSelfNoun.is} ${condition.inverted ? 'not ' : ''}${condition.group.adjective}`;
            } else if (condition instanceof CombatEffectCondition) {
                description += `${condSelfNoun.plain} ${condSelfNoun.is} ${condition.inverted ? 'not ' : ''}${condition.effect.name}`;
            } else if (condition instanceof AttackTypeCondition) {
                if (condition.thisAttackType !== 'any' && condition.targetAttackType === 'any') {
                    description += `${condSelfNoun.plain} ${condSelfNoun.is} ${condition.inverted ? 'not ' : ''}using ${condition.thisAttackType}`;
                } else if (condition.thisAttackType === 'any' && condition.targetAttackType !== 'any') {
                    description += `${condTargetNoun.plain} ${condTargetNoun.is} ${condition.inverted ? 'not ' : ''}using ${condition.thisAttackType}`;
                } else {
                    if (condition.inverted) {
                        description += `${condSelfNoun.plain} ${condSelfNoun.is} using ${condition.thisAttackType} nand ${condTargetNoun.plain} ${condTargetNoun.is} using ${condition.thisAttackType}`;
                    } else {
                        description += `${condSelfNoun.plain} ${condSelfNoun.is} using ${condition.thisAttackType} and ${condTargetNoun.plain} ${condTargetNoun.is} using ${condition.thisAttackType}`;
                    }
                }
            } else if (condition instanceof DamageTypeCondition) {
                description += `${condSelfNoun.plain} ${condSelfNoun.is} ${condition.inverted ? 'not ' : ''}deals ${condition.damageType} Damage`;
            } else if (condition instanceof BarrierCondition) {
                description += `${condSelfNoun.possesive} barrier is ${describeComparison(condition.operator)} \${${prefix}barrierThreshold}%%`;
            }
            return description;
        }
        switch (condition.type) {
            case 'Every':
                return joinAsList(condition.conditions.map((c) => describeApplicatorCondition(c, attackerNoun, targetNoun, prefix)));
            case 'Some':
                return joinAsOrList(condition.conditions.map((c) => describeApplicatorCondition(c, attackerNoun, targetNoun, prefix)));
            case 'DamageTaken':
                return `the damage taken is ${describeComparison(condition.operator)} <TODO_Describe_Value>`;
            case 'DamageDealt':
                return `the damage dealt is ${describeComparison(condition.operator)} <TODO_Describe_Value>`;
            case 'CharacterValue':
                return `<TODO_Describe_lhValue> is ${describeComparison(condition.operator)} <TODO_Describe_rhValue>`;
        }
    }
    /**
     * Generates a description for an Effect Applicator in the context of a special attack
     * @param applicator The effect applicator to generate a description for
     * @param attackerNoun The character performing the Special Attack
     * @param targetNoun The character recieving the Special attack
     * @param prefix A prefix to use before any template data keys
     * @returns A description of the effect applicator
     */
    function getAttackEffectDescription(applicator, attackerNoun, targetNoun, prefix) {
        let description = '';
        let chance = applicator.baseChance;
        if (applicator.conditionChances.length > 0) {
            chance = applicator.conditionChances[0].chance;
            description += `if ${describeApplicatorCondition(applicator.conditionChances[0].condition, attackerNoun, targetNoun, prefix)}, `;
        }
        if (applicator instanceof TableCombatEffectApplicator) {
            if (chance === 100) {
                description += `applies `;
            } else {
                description += `has a \${${prefix}chance}% chance to apply `;
            }
            switch (applicator.table.id) {
                case "melvorF:RandomCurse" /* CombatEffectTableIDs.RandomCurse */ :
                    description += `a random Curse for 3 turns`;
                    break;
                case "melvorF:ElementalEffect" /* CombatEffectTableIDs.ElementalEffect */ :
                    description += `Burn, Frostburn or Freeze`;
                    break;
                default:
                    description += `one of the following:`;
                    description += joinAsSuperList(applicator.table.table.map(({
                        applicator
                    }, i) => {
                        return getAttackEffectDescription(applicator, attackerNoun, targetNoun, `${prefix}row${i}`);
                    }));
            }
        } else {
            const effect = applicator.effect;
            const params = Object.assign({}, effect.parameters, applicator.initialParams);
            if (effect.template === undefined) {
                switch (effect.id) {
                    case "melvorD:CurrentHitpointsHeal" /* CombatEffectIDs.CurrentHitpointsHeal */ :
                        {
                            if (chance === 100) {
                                description += `${attackerNoun.plain} heals for \${${prefix}percent}% of ${attackerNoun.possesive} current hitpoints`;
                            } else {
                                description += `${attackerNoun.plain} has a \${${prefix}chance}% chance to heal for \${${prefix}percent}% of ${attackerNoun.possesive} current hitpoints`;
                            }
                        }
                        break;
                    default:
                        if (chance === 100) {
                            description += `gives ${effect.name}`;
                        } else {
                            description += `has a \${${prefix}chance}% chance to give ${effect.name}`;
                        }
                }
            } else {
                // Specialized descriptions for specific effects
                let hasEffectSpecificDescription = true;
                switch (effect.id) {
                    case "melvorD:Frostburn" /* CombatEffectIDs.Frostburn */ :
                        if (chance === 100) {
                            description += `gives ${targetNoun.plain} Frostburn for \${${prefix}turns} of ${targetNoun.possesive} turns`;
                        } else {
                            description += `has a \${${prefix}chance}% chance to give ${targetNoun.plain} Frostburn for \${${prefix}turns} of ${targetNoun.possesive} turns`;
                        }
                        break;
                    case "melvorItA:Silence" /* CombatEffectIDs.Silence */ :
                        {
                            if (chance === 100) {
                                description += `inflicts Silence, which prevents ${targetNoun.plain} from performing special attacks for \${${prefix}turns} of ${targetNoun.possesive} turns`;
                            } else {
                                description += `has a \${${prefix}chance}% chance to inflict Silence, which prevents ${targetNoun.plain} from performing special attacks for \${${prefix}turns} of ${targetNoun.possesive} turns`;
                            }
                        }
                        break;
                    case "melvorItA:Voidburst" /* CombatEffectIDs.Voidburst */ :
                        if (chance === 100) {
                            description += `inflicts \${${prefix}stacks} stack${pluralS(params.stacksToAdd)} of Voidburst`;
                        } else {
                            description += `has a \${${prefix}chance}% chance to inflict \${${prefix}stacks} stack${pluralS(params.stacksToAdd)} of Voidburst`;
                        }
                        break;
                    case "melvorItA:EldritchCurse" /* CombatEffectIDs.EldritchCurse */ :
                        if (chance === 100) {
                            description += `inflicts `;
                        } else {
                            description += `has a \${${prefix}chance}% chance to inflict `;
                        }
                        description += `${effect.name} which disables ${targetNoun.possesive} lifesteal and hitpoint regeneration for \${${prefix}turns} of ${targetNoun.possesive} turns`;
                        break;
                    default:
                        hasEffectSpecificDescription = false;
                }
                if (hasEffectSpecificDescription)
                    return description;
                // Generalized descriptions based on the effect's template
                switch (effect.template.id) {
                    case "melvorD:Regen" /* CombatEffectTemplateIDs.Regen */ :
                        {
                            const damageDescriptions = effect.damageGroups.totalHealing.damage.map((damage, i) => getDamageDescription(damage, attackerNoun, targetNoun, i, prefix));
                            if (chance === 100) {
                                description += `gives ${effect.name} `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to give ${effect.name} `;
                            }
                            description += `that heals ${joinAsList(damageDescriptions)} over \${${prefix}duration}s`;
                        }
                        break;
                    case "melvorD:BurnDOT" /* CombatEffectTemplateIDs.BurnDOT */ :
                    case "melvorD:BleedDOT" /* CombatEffectTemplateIDs.BleedDOT */ :
                    case "melvorD:PoisonDOT" /* CombatEffectTemplateIDs.PoisonDOT */ :
                    case "melvorD:DeadlyPoisonDOT" /* CombatEffectTemplateIDs.DeadlyPoisonDOT */ :
                    case "melvorD:BarrierBleedDOT" /* CombatEffectTemplateIDs.BarrierBleedDOT */ :
                    case "melvorD:BarrierBurnDOT" /* CombatEffectTemplateIDs.BarrierBurnDOT */ :
                    case "melvorItA:AblazeDOT" /* CombatEffectTemplateIDs.AblazeDOT */ :
                    case "melvorItA:ToxinDOT" /* CombatEffectTemplateIDs.ToxinDOT */ :
                        {
                            const damageDescriptions = effect.damageGroups.total.damage.map((damage, i) => getDamageDescription(damage, attackerNoun, targetNoun, i, prefix));
                            if (chance === 100) {
                                description += `inflicts ${effect.name} `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to inflict ${effect.name} `;
                            }
                            description += `that deals ${joinAsList(damageDescriptions)} as damage over \${${prefix}duration}s`;
                        }
                        break;
                    case "melvorD:UnendingRegen" /* CombatEffectTemplateIDs.UnendingRegen */ :
                        {
                            const damageDescriptions = effect.damageGroups.healingPerProc.damage.map((damage, i) => getDamageDescription(damage, attackerNoun, targetNoun, i, prefix));
                            if (chance === 100) {
                                description += `gives ${effect.name} `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to give ${effect.name} `;
                            }
                            description += `that heals ${joinAsList(damageDescriptions)} every \${${prefix}interval}s`;
                        }
                        break;
                    case "melvorD:SelfCountingReflexive" /* CombatEffectTemplateIDs.SelfCountingReflexive */ :
                    case "melvorD:NonCountingReflexive" /* CombatEffectTemplateIDs.NonCountingReflexive */ :
                        {
                            if (chance === 100) {
                                description += `gives ${attackerNoun.plain} `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to give ${attackerNoun.plain} `;
                            }
                            const statDescription = getStatGroupDataDescription(effect.statGroups.stacks, prefix);
                            description += `${statDescription} each time ${attackerNoun.pronoun} are hit (Stacks up to \${${prefix}maxStacks} times) `;
                            if (effect.template.id === "melvorD:NonCountingReflexive" /* CombatEffectTemplateIDs.NonCountingReflexive */ ) {
                                description += 'until the end of the fight';
                            } else if (params.turns === 1) {
                                description += 'for the duration of this attack';
                            } else if (params.turns === 2) {
                                description += `for 1 turn`;
                            } else {
                                description += `for \${${prefix}turns} turns`;
                            }
                        }
                        break;
                    case "melvorD:SelfCountingReductive" /* CombatEffectTemplateIDs.SelfCountingReductive */ :
                    case "melvorD:NonCountingReductive" /* CombatEffectTemplateIDs.NonCountingReductive */ :
                        {
                            if (chance === 100) {
                                description += `gives ${attackerNoun.plain} `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to give ${attackerNoun.plain} `;
                            }
                            const statDescription = getStatGroupDataDescription(effect.statGroups.stacks, prefix);
                            description += `\${${prefix}maxStacks} stacks that provide ${statDescription} each. One stack is removed each time ${attackerNoun.pronoun} are hit. `;
                        }
                        if (effect.template.id === "melvorD:NonCountingReductive" /* CombatEffectTemplateIDs.NonCountingReductive */ ) {
                            description += 'Lasts until the end of the fight.';
                        } else if (params.turns === 1) {
                            description += 'Lasts for the duration of this attack.';
                        } else if (params.turns === 2) {
                            description += `Lasts for 1 turn.`;
                        } else {
                            description += `Lasts for \${${prefix}turns} turns.`;
                        }
                        break;
                    case "melvorD:NonCountingIncremental" /* CombatEffectTemplateIDs.NonCountingIncremental */ :
                    case "melvorD:SelfCountingIncremental" /* CombatEffectTemplateIDs.SelfCountingIncremental */ :
                    case "melvorD:NonCountingResettingIncremental" /* CombatEffectTemplateIDs.NonCountingResettingIncremental */ :
                    case "melvorD:SelfCountingResettingIncremental" /* CombatEffectTemplateIDs.SelfCountingResettingIncremental */ :
                        {
                            if (chance === 100) {
                                description += `gives ${attackerNoun.plain} `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to give ${attackerNoun.plain} `;
                            }
                            const statDescription = getStatGroupDataDescription(effect.statGroups.stacks, prefix);
                            description += `${statDescription} each turn (Stacks up to \${${prefix}maxStacks} times). `;
                            if (effect.template.id === "melvorD:NonCountingResettingIncremental" /* CombatEffectTemplateIDs.NonCountingResettingIncremental */ ||
                                effect.template.id === "melvorD:SelfCountingResettingIncremental" /* CombatEffectTemplateIDs.SelfCountingResettingIncremental */ ) {
                                description += `Stacks reset to 0 at maximum stacks. `;
                            }
                            if (effect.template.id === "melvorD:SelfCountingIncremental" /* CombatEffectTemplateIDs.SelfCountingIncremental */ ||
                                effect.template.id === "melvorD:SelfCountingResettingIncremental" /* CombatEffectTemplateIDs.SelfCountingResettingIncremental */ ) {
                                if (params.turns === 1) {
                                    description += 'Lasts for the duration of this attack.';
                                } else if (params.turns === 2) {
                                    description += `Lasts for 1 turn.`;
                                } else {
                                    description += `Lasts for \${${prefix}turns} turns.`;
                                }
                            } else {
                                description += 'Lasts until the end of the fight.';
                            }
                        }
                        break;
                    case "melvorD:Stacking" /* CombatEffectTemplateIDs.Stacking */ :
                        {
                            const statDescription = getStatGroupDataDescription(effect.statGroups.debuff, prefix);
                            if (chance === 100) {
                                description += `applies `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to apply `;
                            }
                            description += `+\${${prefix}stacks} stack${pluralS(params.stacksToAdd)} of ${effect.name} to ${targetNoun.plain} (Max \${${prefix}maxStacks} stack${pluralS(params.maxStacks)}). ${effect.name} gives ${statDescription} regardless of the number of stacks. One stack is removed after each of ${targetNoun.possesive} turns`;
                        }
                        break;
                    case "melvorD:StaticSelfCountingModifier" /* CombatEffectTemplateIDs.StaticSelfCountingModifier */ :
                    case "melvorD:StaticTargetCountingModifier" /* CombatEffectTemplateIDs.StaticTargetCountingModifier */ :
                    case "melvorD:StaticNonCountingModifier" /* CombatEffectTemplateIDs.StaticNonCountingModifier */ :
                        {
                            const statDescription = getStatGroupDataDescription(effect.statGroups.stacks, prefix);
                            const name = effect.target === 'Self' ? attackerNoun : targetNoun;
                            if (chance === 100) {
                                description += `gives ${name.plain} `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to give ${name.plain} `;
                            }
                            description += `${statDescription} `;
                            switch (effect.template.id) {
                                case "melvorD:StaticSelfCountingModifier" /* CombatEffectTemplateIDs.StaticSelfCountingModifier */ :
                                    if (params.turns === 0) {
                                        description += 'until the end of this attack';
                                    } else {
                                        description += `for \${${prefix}turns} of ${name.possesive} turns`;
                                    }
                                    break;
                                case "melvorD:StaticTargetCountingModifier" /* CombatEffectTemplateIDs.StaticTargetCountingModifier */ :
                                    {
                                        const counter = effect.target === 'Self' ? targetNoun : attackerNoun;
                                        if (params.turns === 0) {
                                            description += 'until the end of this attack';
                                        } else {
                                            description += `for \${${prefix}turns} of ${counter.possesive} turns`;
                                        }
                                    }
                                    break;
                                case "melvorD:StaticNonCountingModifier" /* CombatEffectTemplateIDs.StaticNonCountingModifier */ :
                                    description += 'until the end of the fight';
                                    break;
                            }
                        }
                        break;
                    case "melvorD:StackingSelfCountingModifier" /* CombatEffectTemplateIDs.StackingSelfCountingModifier */ :
                    case "melvorD:StackingTargetCountingModifier" /* CombatEffectTemplateIDs.StackingTargetCountingModifier */ :
                    case "melvorD:StackingNonCountingModifier" /* CombatEffectTemplateIDs.StackingNonCountingModifier */ :
                        {
                            const statDescription = getStatGroupDataDescription(effect.statGroups.stacks, prefix);
                            const name = effect.target === 'Self' ? attackerNoun : targetNoun;
                            switch (effect.id) {
                                case "melvorItA:Wither" /* CombatEffectIDs.Wither */ :
                                    if (chance === 100) {
                                        description += `inflicts ${effect.name} which gives ${name.plain} `;
                                    } else {
                                        description += `has a \${${prefix}chance}% chance to inflict ${effect.name} which gives ${name.plain} `;
                                    }
                                    break;
                                default:
                                    if (chance === 100) {
                                        description += `gives ${name.plain} `;
                                    } else {
                                        description += `has a \${${prefix}chance}% chance to give ${name.plain} `;
                                    }
                            }
                            description += `${statDescription} that stacks up to \${${prefix}maxStacks} times `;
                            switch (effect.template.id) {
                                case "melvorD:StackingSelfCountingModifier" /* CombatEffectTemplateIDs.StackingSelfCountingModifier */ :
                                    if (params.turns === 0) {
                                        description += 'until the end of this attack';
                                    } else {
                                        description += `for \${${prefix}turns} of ${name.possesive} turns`;
                                    }
                                    break;
                                case "melvorD:StackingTargetCountingModifier" /* CombatEffectTemplateIDs.StackingTargetCountingModifier */ :
                                    {
                                        const counter = effect.target === 'Self' ? targetNoun : attackerNoun;
                                        if (params.turns === 0) {
                                            description += 'until the end of this attack';
                                        } else {
                                            description += `for \${${prefix}turns} of ${counter.possesive} turns`;
                                        }
                                    }
                                    break;
                                case "melvorD:StackingNonCountingModifier" /* CombatEffectTemplateIDs.StackingNonCountingModifier */ :
                                    description += 'until the end of the fight';
                                    break;
                            }
                        }
                        break;
                    case "melvorD:Sleep" /* CombatEffectTemplateIDs.Sleep */ :
                        {
                            if (chance === 100) {
                                description += `applies `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to apply `;
                            }
                            description += `sleep for \${${prefix}turns} turn${pluralS(params.turns)}`;
                        }
                        break;
                    case "melvorD:Stun" /* CombatEffectTemplateIDs.Stun */ :
                        {
                            if (chance === 100) {
                                description += `applies `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to apply `;
                            }
                            description += `stun for \${${prefix}turns} turn${pluralS(params.turns)}`;
                        }
                        break;
                    case "melvorD:Freeze" /* CombatEffectTemplateIDs.Freeze */ :
                        {
                            if (chance === 100) {
                                description += `applies `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to apply `;
                            }
                            description += `freeze for \${${prefix}turns} turn${pluralS(params.turns)}`;
                        }
                        break;
                    case "melvorD:Crystallize" /* CombatEffectTemplateIDs.Crystallize */ :
                        {
                            if (chance === 100) {
                                description += `applies `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to apply `;
                            }
                            description += `crystallize for \${${prefix}turns} turn${pluralS(params.turns)}`;
                        }
                        break;
                    case "melvorD:Combo" /* CombatEffectTemplateIDs.Combo */ :
                        {
                            const statDescription = getStatGroupDataDescription(effect.statGroups.stacks, prefix);
                            if (chance === 100) {
                                description += `gives `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to give `;
                            }
                            description += `${attackerNoun.plain} ${statDescription} each time ${attackerNoun.pronoun} successfully hit, stacking up to \${${prefix}maxStacks} times. Stacks reset on a miss.`;
                        }
                        break;
                    case "melvorD:Curse" /* CombatEffectTemplateIDs.Curse */ :
                        {
                            if (chance === 100) {
                                description += `applies `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to apply `;
                            }
                            description += `the ${effect.name} Curse for 3 turns`;
                        }
                        break;
                    case "melvorD:Slow" /* CombatEffectTemplateIDs.Slow */ :
                        {
                            if (chance === 100) {
                                description += `inflicts `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to inflict `;
                            }
                            description += `a Slow that gives ${targetNoun.plain} +\${${prefix}magnitude}% Attack Interval for \${${prefix}turns} of ${targetNoun.possesive} turns`;
                        }
                        break;
                    case "melvorItA:StackingLacerationDOT" /* CombatEffectTemplateIDs.StackingLacerationDOT */ :
                        {
                            const stacksToAdd = params.stacksToAdd === 1 ? 'a stack of ' : `\${${prefix}stacks} stacks of `;
                            if (chance === 100) {
                                description += `inflicts ${stacksToAdd}${effect.name}`;
                            } else {
                                description += `has a \${${prefix}chance}% chance to inflict ${stacksToAdd}${effect.name}`;
                            }
                        }
                        break;
                    case "melvorItA:Blight" /* CombatEffectTemplateIDs.Blight */ :
                        {
                            if (chance === 100) {
                                description += `inflicts ${effect.name}`;
                            } else {
                                description += `has a \${${prefix}chance}% chance to inflict ${effect.name}`;
                            }
                        }
                        break;
                    case "melvorD:Fear" /* CombatEffectTemplateIDs.Fear */ :
                        {
                            if (chance === 100) {
                                description += `applies `;
                            } else {
                                description += `has a \${${prefix}chance}% chance to apply `;
                            }
                            description += `${effect.name} for \${${prefix}turns} turn${pluralS(params.turns)}`;
                        }
                        break;
                    default:
                        if (chance === 100) {
                            description += `applies ${effect.name}`;
                        } else {
                            description += `has a \${${prefix}chance}% chance to apply ${effect.name}`;
                        }
                        break;
                }
            }
        }
        return description;
    }
    /**
     * Generates a templated description for a stat group
     * @param statGroup The stat group to generate a description for
     * @param prefix A prefix to place before any description data
     */
    function getStatGroupDataDescription(statGroup, prefix) {
        const descriptions = [];
        if (statGroup.modifiers !== undefined) {
            descriptions.push(...getModifierDataDescriptions(statGroup.modifiers, prefix));
        }
        if (statGroup.combatEffects !== undefined) {
            statGroup.combatEffects.forEach((a) => descriptions.push(a.description));
        }
        return joinAsList(descriptions);
    }
    /**
     * Gets mechanical descriptions of effect applicators for use in special attacks
     * @param applicator The applicator to get a description from
     * @param attackerNoun A Noun object for the character performing the Attack
     * @param targetNoun A Noun object for the character recieving the Attack
     * @param prefix A prefix to use before any template data keys
     * @returns A description of any mechanics in the effect. Returns an empty string if there are none.
     */
    function getAttackEffectMechanics(applicator, attackerNoun, targetNoun, prefix) {
        if (applicator instanceof TableCombatEffectApplicator) {
            // Any mechanical explanations for effect tables go here
        } else {
            const effect = applicator.effect;
            const params = Object.assign({}, effect.parameters, applicator.initialParams);
            if (effect.template === undefined) {
                // Future custom effects with mechanics descriptions go here
            } else {
                switch (effect.template.id) {
                    case "melvorItA:StackingLacerationDOT" /* CombatEffectTemplateIDs.StackingLacerationDOT */ :
                        {
                            return `${effect.name} deals damage equal to \${${prefix}percent}% of ${attackerNoun.possesive} max hit per stack (Stacks up to \${${prefix}maxStacks} times) every \${${prefix}interval}s.`;
                        }
                    case "melvorItA:Blight" /* CombatEffectTemplateIDs.Blight */ :
                        {
                            const statDescription = getStatGroupDataDescription(effect.statGroups.stacks, prefix);
                            return `${effect.name} gives ${statDescription} every \${${prefix}interval}s (Stacks up to \${${prefix}maxStacks} times). Stacks reset to 0 at maximum stacks.`;
                        }
                }
                switch (effect.id) {
                    case "melvorItA:Voidburst" /* CombatEffectIDs.Voidburst */ :
                        {
                            return `${effect.name} stacks up to \${${prefix}maxStacks} times. Upon reaching maximum stacks, ${targetNoun.pronoun} take damage equal to \${${prefix}percent}% of ${attackerNoun.possesive} base max hitpoints.`;
                        }
                }
            }
        }
        return '';
    }
    /** Returns a filled in description of an attack includes HTML*/
    const generateAttackDescription = (attack, attackerNoun, targetNoun) => {
        if (attack.descriptionGenerator === undefined)
            throw new Error(`Error generating attack description, no generator present.`);
        let description = attack.descriptionGenerator;
        Object.entries(attackDescriptors).forEach(([replaceName, describer]) => {
            description = description.replace(new RegExp(`<${replaceName}>`, 'gi'), (match) => {
                let replaceText = describer(attack, attackerNoun, targetNoun);
                if (match[1].toUpperCase() === match[1])
                    replaceText = `${replaceText[0].toUpperCase()}${replaceText.substring(1)}`;
                return replaceText;
            });
        });
        return description;
    };
    const youNoun = {
        plain: 'you',
        possesive: 'your',
        pronoun: 'you',
        is: 'are',
    };
    const enemyNoun = {
        plain: 'the enemy',
        possesive: "the enemy's",
        pronoun: 'they',
        is: 'is',
    };
    return {
        generateAttackDescription,
        attackDescriptors,
        youNoun,
        enemyNoun,
    };
})();
// These actually need to exist in global scope for mods
const generateAttackDescription = attackDescriptions.generateAttackDescription;
const attackDescriptors = attackDescriptions.attackDescriptors;
const youNoun = attackDescriptions.youNoun;
const enemyNoun = attackDescriptions.enemyNoun;
//# sourceMappingURL=attacks.js.map
checkFileVersion('?12097')