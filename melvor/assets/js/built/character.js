"use strict";
class Character {
    /** Baseclass for Enemy, Player and Golbin */
    constructor(manager, game) {
        this.manager = manager;
        this.game = game;
        // Properties that need to be saved
        this.hitpoints = 0;
        /** Effect applicators that have been merged with this character, and need to be processed as the "applyEffectWhenMerged" property is true */
        this.effectApplicatorsToProcess = [];
        this.effectApplicators = new Map();
        /** Stores a count of the number of active combat effects that belong to each group id */
        this.activeEffectGroups = new SparseNumericMap();
        /** Stores all CombatEffects that are active on this character */
        this.activeEffects = new Map();
        /** All timers for active effects that are currently started. */
        this.activeEffectTimers = new Set();
        /** If this character is considered to be a boss. */
        this.isBoss = false;
        this.nextAction = 'Attack';
        this.attackCount = 1;
        /** Controls if the character is performing hits in a multi-hit attack */
        this.isAttacking = false;
        /** True if first hit of attack has not occurred */
        this.firstHit = true;
        /** True if the first miss of an attack has not occured */
        this.firstMiss = true;
        /** The amount of Barrier remaining */
        this.barrier = 0;
        /** The percent of max hitpoints that the maximum barrier should be */
        this.maxBarrierPercent = 0;
        this.barrierTurns = 0;
        this.hasBarrier = false;
        /** Stores additional hitpoints that will be regenerated on the next HP regen proc */
        this.bufferedRegen = 0;
        this.target = this;
        // Properties that can be derived from saved properties
        this.equipmentStats = new EquipmentStats();
        /** Combat levels of character including hidden levels */
        this.levels = {
            Hitpoints: 0,
            Attack: 0,
            Strength: 0,
            Defence: 0,
            Ranged: 0,
            Magic: 0,
            Prayer: 0,
            Corruption: 0,
        };
        /** Abyssal levels of character including hidden levels. Mainly used for Player-related functions that require abyssal level to be included in the calcs. */
        this.abyssalLevels = {
            Hitpoints: 0,
            Attack: 0,
            Strength: 0,
            Defence: 0,
            Ranged: 0,
            Magic: 0,
            Prayer: 0,
            Corruption: 0,
        };
        /** Current Combat Stats */
        this.stats = new CharacterCombatStats(this);
        this.attackType = 'melee';
        this.availableAttacks = [];
        this.canCurse = false;
        this.canAurora = false;
        /** Turns taken in the current fight */
        this.turnsTaken = 0;
        this.BASE_REGEN_INTERVAL = 10000;
        this.MIN_REGEN_INTERVAL = 2500;
        this.spellModifierQuery = ModifierQuery.EMPTY;
        /** If thie character's attack method was interrupted */
        this.attackInterrupted = false;
        /** If this character is currently processing code inside of the attack method */
        this.inAttack = false;
        this.damageType = game.normalDamage;
        this.timers = {
            act: new Timer('Act', () => this.act()),
            regen: new Timer('Regen', () => this.regen()),
        };
        this.nextAttack = game.normalAttack;
        this.selfModifierQuery = new ModifierQuery({
            damageType: this.damageType
        });
    }
    /** Returns if the Character has an active effect belonging to the Curse group */
    get isCursed() {
        return this.activeEffectGroups.has("melvorD:Curse" /* CombatEffectGroupIDs.Curse */ );
    }
    /** Returns if the Character has an active effect belonging to the Sleep group */
    get isSleeping() {
        return this.activeEffectGroups.has("melvorD:Sleep" /* CombatEffectGroupIDs.Sleep */ );
    }
    /** Returns if the character has an active effect belonging to the StunLike group */
    get isStunned() {
        return this.activeEffectGroups.has("melvorD:StunLike" /* CombatEffectGroupIDs.StunLike */ );
    }
    /** Returns if the character has an active effect belonging to the Crystallize group */
    get isCrystallized() {
        return this.activeEffectGroups.has("melvorD:Crystallize" /* CombatEffectGroupIDs.Crystallize */ );
    }
    /** Returns if the character has an active effect belonging to the Freeze group */
    get isFrozen() {
        return this.activeEffectGroups.has("melvorD:Freeze" /* CombatEffectGroupIDs.Freeze */ );
    }
    /** Returns if the character has an active effect belonging to the Slow group */
    get isSlowed() {
        return this.activeEffectGroups.has("melvorD:Slow" /* CombatEffectGroupIDs.Slow */ );
    }
    /** Returns if the character has an active effect belonging to the BurnDOT group */
    get isBurning() {
        return this.activeEffectGroups.has("melvorD:BurnDOT" /* CombatEffectGroupIDs.BurnDOT */ );
    }
    /** Returns if the character has an active effect belonging to the BleedDOT group */
    get isBleeding() {
        return this.activeEffectGroups.has("melvorD:BleedDOT" /* CombatEffectGroupIDs.BleedDOT */ );
    }
    /** Returns if the character has an active effect belonging to the PoisonDOT group */
    get isPoisoned() {
        return this.activeEffectGroups.has("melvorD:PoisonDOT" /* CombatEffectGroupIDs.PoisonDOT */ );
    }
    /** Returns if the character has an active effect belonging to the Corruption group */
    get isCorrupted() {
        return this.activeEffectGroups.has("melvorItA:Corruption" /* CombatEffectGroupIDs.Corruption */ );
    }
    /** Returns if the character has an active effect belonging to the Blight group */
    get isBlighted() {
        return this.activeEffectGroups.has("melvorItA:Blight" /* CombatEffectGroupIDs.Blight */ );
    }
    /** Returns if the character has an active effect belonging to the AblazeDOT group */
    get isAblaze() {
        return this.activeEffectGroups.has("melvorItA:AblazeDOT" /* CombatEffectGroupIDs.AblazeDOT */ );
    }
    /** Returns if the character has an active effect belonging to the ToxinDOT group */
    get isToxined() {
        return this.activeEffectGroups.has("melvorItA:ToxinDOT" /* CombatEffectGroupIDs.ToxinDOT */ );
    }
    /** Returns the number of effects belonging to the Debuff group that are active on this character */
    get debuffCount() {
        var _a;
        return (_a = this.activeEffectGroups.get("melvorD:Debuff" /* CombatEffectGroupIDs.Debuff */ )) !== null && _a !== void 0 ? _a : 0;
    }
    /** Returns the total number of CombatEffects that are active on the character */
    get activeEffectCount() {
        return this.activeEffects.size;
    }
    get hitpointsPercent() {
        return (100 * this.hitpoints) / this.stats.maxHitpoints;
    }
    get barrierPercent() {
        return (100 * this.barrier) / this.stats.maxBarrier;
    }
    /** If this character cannot benefit from max hit/damage modifiers */
    get cantUseDamageModifiers() {
        return (this.attackType === 'magic' &&
            this.spellSelection.attack !== undefined &&
            !this.spellSelection.attack.spellbook.allowDamageModifiers);
    }
    /** If this character is currently using a spell that only has one special attack */
    get isUsingSpecialAttackSpell() {
        return (this.attackType === 'magic' &&
            this.spellSelection.attack !== undefined &&
            this.spellSelection.attack.specialAttack !== undefined);
    }
    get isBarrierActive() {
        return this.hasBarrier && this.barrier > 0;
    }
    get hpRegenInterval() {
        let interval = this.BASE_REGEN_INTERVAL;
        interval += this.modifiers.getValue("melvorD:flatRegenerationInterval" /* ModifierIDs.flatRegenerationInterval */ , this.damageType.modQuery);
        return Math.max(interval, this.MIN_REGEN_INTERVAL);
    }
    isFightingTypeVsType(thisType, targetType) {
        return this.manager.fightInProgress && this.attackType === thisType && this.target.attackType === targetType;
    }
    actOnClick() {
        if (this.manager.fightInProgress) {
            this.act();
        }
    }
    /** Resets all properties of this class, preparing it for an enemy spawn */
    resetForSpawning() {
        this.nextAction = 'Attack';
        this.attackCount = 1;
        this.nextAttack = this.game.normalAttack;
        this.isAttacking = false;
        this.firstHit = true;
        this.firstMiss = true;
        this.barrierTurns = 0;
        this.timers.act.stop();
        this.timers.regen.stop();
        this.target = this;
        this.turnsTaken = 0;
    }
    setDefaultSpells() {
        this.spellSelection.attack = this.game.attackSpells.firstObject;
    }
    /** Sets all renders required to true */
    setRenderAll() {
        this.renderQueue.attackBar = true;
        this.renderQueue.attackBarMinibar = true;
        this.renderQueue.attacks = true;
        this.renderQueue.damageSplash = true;
        this.renderQueue.damageValues = true;
        this.effectRenderer.queueRemoveAll();
        this.renderQueue.effects = true;
        this.renderQueue.hitChance = true;
        this.renderQueue.hitpoints = true;
        this.renderQueue.passives = true;
        this.renderQueue.stats = true;
    }
    /** Performs stat updates for when an enemy spawns, or a fight ends */
    initializeForCombat() {
        this.computeCombatStats();
        this.renderQueue.attackBar = true;
        this.renderQueue.attackBarMinibar = true;
        this.manager.renderQueue.resistanceMenus = true;
    }
    /** Stops timers and sets stats to update */
    stopFighting() {
        this.timers.act.stop();
        this.isAttacking = false;
        this.initializeForCombat();
        this.target = this;
    }
    /** Computes the attack interval */
    computeAttackInterval() {
        let attackInterval = this.equipmentStats.attackSpeed || 4000;
        attackInterval = this.modifyAttackInterval(attackInterval);
        attackInterval = roundToTickInterval(attackInterval);
        attackInterval = Math.max(attackInterval, 250);
        this.stats.attackInterval = attackInterval;
    }
    /** Calculates the Min Hit stat */
    computeMinHit() {
        let minHit = 1;
        minHit = this.modifyMinHit(minHit);
        this.stats.minHit = minHit;
    }
    /** Calculates the Max HP stat */
    computeMaxHP() {
        const oldMax = this.stats.maxHitpoints;
        let maxHP = numberMultiplier * this.levels.Hitpoints;
        maxHP = this.modifyMaxHP(maxHP);
        this.stats.maxHitpoints = maxHP;
        const oldCurrent = this.hitpoints;
        if (this.hitpoints >= maxHP)
            this.setHitpoints(maxHP);
        this._events.emit('hitpointsChanged', new HitpointsChangedEvent(oldCurrent, oldMax, this.hitpoints, this.stats.maxHitpoints));
    }
    /** Sets barrier to a given value */
    setBarrier(value) {
        this.barrier = value;
        this.renderQueue.barrier = true;
    }
    /** Calculates the Max Barrier stat */
    computeMaxBarrier() {
        const oldMax = this.stats.maxBarrier;
        let maxBarrier = 0;
        if (this.hasBarrier) {
            maxBarrier = Math.floor(this.stats.maxHitpoints * (this.maxBarrierPercent / 100));
        }
        this.stats.maxBarrier = maxBarrier;
        const oldCurrent = this.barrier;
        if (this.barrier >= maxBarrier)
            this.setBarrier(maxBarrier);
        this._events.emit('barrierChanged', new BarrierChangedEvent(oldCurrent, oldMax, this.barrier, this.stats.maxBarrier));
    }
    /** Calculates base accuracy stat */
    computeAccuracy() {
        let accuracy = Character.calculateStandardStat(this.getAccuracyValues());
        accuracy = this.modifyAccuracy(accuracy);
        this.stats.accuracy = accuracy;
    }
    /** Calculates base max hit stat */
    computeMaxHit() {
        let maxHit;
        switch (this.attackType) {
            case 'magic':
                maxHit = this.computeMagicMaxHit();
                break;
            case 'ranged':
                maxHit = this.computeRangedMaxHit();
                break;
            case 'melee':
                maxHit = this.computeMeleeMaxHit();
                break;
            default:
                throw new Error(`Invalid Attack Type: ${this.attackType}`);
        }
        maxHit = this.modifyMaxHit(maxHit);
        this.stats.maxHit = maxHit;
    }
    /** Calculates the max hit of the character for melee */
    computeMeleeMaxHit() {
        let level = this.levels.Strength;
        if (this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ || this.damageType.id === "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ )
            level += this.abyssalLevels.Strength;
        return Character.calculateStandardMaxHit(level, this.equipmentStats.meleeStrengthBonus);
    }
    /** Calculates the max hit of the character for ranged */
    computeRangedMaxHit() {
        let level = this.levels.Ranged;
        if (this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ || this.damageType.id === "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ )
            level += this.abyssalLevels.Ranged;
        return Character.calculateStandardMaxHit(level, this.equipmentStats.rangedStrengthBonus);
    }
    /** Calculates the max hit of the character for magic */
    computeMagicMaxHit() {
        const spell = this.spellSelection.attack;
        if (spell !== undefined) {
            if (!spell.spellbook.allowDamageModifiers) {
                return Math.round(numberMultiplier * spell.maxHit);
            }
            let magicLevel = this.levels.Magic;
            if (this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ || this.damageType.id === "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ )
                magicLevel += this.abyssalLevels.Magic;
            return Math.floor(numberMultiplier *
                spell.maxHit *
                (1 + this.equipmentStats.magicDamageBonus / 100) *
                (1 + (magicLevel + 1) / 200));
        } else {
            console.warn('Calculating Magic Max Hit, but no spell is selected.');
            return 0;
        }
    }
    /** Calculates base evasion stats */
    computeEvasion() {
        let effectiveDefenceLevel = this.levels.Defence;
        let effectiveMagicLevel = this.levels.Magic;
        if (this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ || this.damageType.id === "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ ) {
            effectiveDefenceLevel += this.abyssalLevels.Defence;
            effectiveMagicLevel += this.abyssalLevels.Magic;
        }
        const evasion = {
            melee: Character.calculateStandardStat({
                effectiveLevel: effectiveDefenceLevel,
                bonus: this.getMeleeDefenceBonus(),
            }),
            ranged: Character.calculateStandardStat({
                effectiveLevel: effectiveDefenceLevel,
                bonus: this.getRangedDefenceBonus(),
            }),
            magic: Character.calculateStandardStat({
                effectiveLevel: Math.floor(effectiveDefenceLevel * 0.3 + effectiveMagicLevel * 0.7),
                bonus: this.getMagicDefenceBonus(),
            }),
        };
        this.modifyEvasion(evasion);
        Object.assign(this.stats.evasion, evasion);
    }
    /** Calculates the average and max evasion stats */
    computeAverageEvasion() {
        const averageEvasion = (this.stats.evasion.melee + this.stats.evasion.ranged + this.stats.evasion.magic) / 3;
        this.stats.averageEvasion = averageEvasion;
        const maxEvasion = Math.max(this.stats.evasion.melee, this.stats.evasion.ranged, this.stats.evasion.magic);
        this.stats.maxEvasion = maxEvasion;
    }
    getMeleeDefenceBonus() {
        return this.equipmentStats.meleeDefenceBonus;
    }
    getRangedDefenceBonus() {
        return this.equipmentStats.rangedDefenceBonus;
    }
    getMagicDefenceBonus() {
        return this.equipmentStats.magicDefenceBonus;
    }
    /** Calculates base resistances */
    computeAllResistances() {
        this.game.damageTypes.forEach((damageType) => this.computeResistance(damageType));
    }
    computeResistance(damageType) {
        if (this.manager.fightInProgress &&
            damageType === this.target.damageType &&
            this.damageType.immuneTo.has(damageType)) {
            this.stats.setResistance(damageType, 100);
            return;
        }
        let resistance = this.equipmentStats.getResistance(damageType);
        resistance = this.modifyResistance(damageType, resistance);
        this.stats.setResistance(damageType, clampValue(resistance, 0, damageType.resistancCap));
    }
    /** Standard Stat calculation for accuracy and evasion */
    static calculateStandardStat(values) {
        return (values.effectiveLevel + 9) * (values.bonus + 64);
    }
    /** Standard MaxHit calculation for Melee and Ranged */
    static calculateStandardMaxHit(baseLevel, strengthBonus) {
        const effectiveLevel = baseLevel + 9;
        return Math.floor(numberMultiplier * (1.3 + effectiveLevel / 10 + strengthBonus / 80 + (effectiveLevel * strengthBonus) / 640));
    }
    computeSpellModifierQuery() {
        const spell = this.spellSelection.attack;
        if (spell !== undefined)
            this.spellModifierQuery = spell.modQuery;
        else
            this.spellModifierQuery = ModifierQuery.EMPTY;
    }
    /** Gets the percent modifier to accuracy rating */
    getAccuracyModifier() {
        let modifier = this.modifiers.accuracyRating;
        switch (this.attackType) {
            case 'melee':
                modifier += this.modifiers.meleeAccuracyRating;
                modifier += this.modifiers.meleeAccuracyMaxHitPer8Strength * Math.floor(this.levels.Strength / 8);
                break;
            case 'ranged':
                modifier += this.modifiers.rangedAccuracyRating;
                break;
            case 'magic':
                modifier += this.modifiers.getValue("melvorD:magicAccuracyRating" /* ModifierIDs.magicAccuracyRating */ , this.spellModifierQuery);
                break;
        }
        if (this.manager.fightInProgress) {
            modifier += this.modifiers.getValue("melvorD:accuracyRatingAgainstDamageType" /* ModifierIDs.accuracyRatingAgainstDamageType */ , this.target.damageType.modQuery);
        }
        return modifier;
    }
    /** Applies modifiers to accuracy rating */
    modifyAccuracy(accuracy) {
        const accuracyModifier = this.getAccuracyModifier();
        accuracy = applyModifier(accuracy, accuracyModifier);
        if (this.modifiers.accuracyRatingHPScaling > 0) {
            const modifier = (this.modifiers.accuracyRatingHPScaling * this.hitpointsPercent) / 100;
            accuracy = Math.floor(accuracy * modifier);
        }
        return accuracy;
    }
    /** Gets the modifiers for each evasion type */
    getEvasionModifiers() {
        const modifiers = {
            melee: this.modifiers.meleeEvasion,
            ranged: this.modifiers.rangedEvasion,
            magic: this.modifiers.magicEvasion,
        };
        let globalModifier = this.modifiers.evasion;
        globalModifier += this.modifiers.evasionBasedOnCorruptionLevel * this.abyssalLevels.Corruption;
        this.modifiers.forEachDamageType("melvorD:evasionBasedOnResistance" /* ModifierIDs.evasionBasedOnResistance */ , (value, damageType) => {
            const baseResistance = this.equipmentStats.getResistance(damageType);
            globalModifier += Math.floor((baseResistance / 2) * value);
        });
        if (this.manager.fightInProgress) {
            switch (this.target.attackType) {
                case 'melee':
                    globalModifier += this.modifiers.evasionAgainstMelee;
                    break;
                case 'ranged':
                    globalModifier += this.modifiers.evasionAgainstRanged;
                    break;
                case 'magic':
                    globalModifier += this.modifiers.evasionAgainstMagic;
                    break;
            }
            globalModifier += this.modifiers.getValue("melvorD:evasionAgainstDamageType" /* ModifierIDs.evasionAgainstDamageType */ , this.target.damageType.modQuery);
        }
        modifiers.melee += globalModifier;
        modifiers.ranged += globalModifier;
        modifiers.magic += globalModifier;
        return modifiers;
    }
    /** Applies modifiers to evasion rating */
    modifyEvasion(evasion) {
        const modifiers = this.getEvasionModifiers();
        evasion.melee = applyModifier(evasion.melee, modifiers.melee);
        evasion.ranged = applyModifier(evasion.ranged, modifiers.ranged);
        evasion.magic = applyModifier(evasion.magic, modifiers.magic);
        if (this.modifiers.globalEvasionHPScaling > 0) {
            const modifier = (this.modifiers.globalEvasionHPScaling * this.hitpointsPercent) / 100;
            evasion.melee = Math.floor(evasion.melee * modifier);
            evasion.ranged = Math.floor(evasion.ranged * modifier);
            evasion.magic = Math.floor(evasion.magic * modifier);
        }
    }
    /** Applies modifiers to max hit */
    modifyMaxHit(maxHit) {
        if (this.cantUseDamageModifiers)
            return maxHit;
        maxHit = applyModifier(maxHit, this.getMaxHitModifier());
        maxHit += numberMultiplier * this.getFlatMaxHitModifier();
        maxHit = Math.max(maxHit, 1);
        return maxHit;
    }
    getFlatMaxHitModifier() {
        let modifier = this.modifiers.flatMaxHit;
        switch (this.attackType) {
            case 'melee':
                modifier += this.modifiers.flatMeleeMaxHit;
                break;
            case 'ranged':
                modifier += this.modifiers.flatRangedMaxHit;
                break;
            case 'magic':
                {
                    modifier += this.modifiers.getValue("melvorD:flatMagicMaxHit" /* ModifierIDs.flatMagicMaxHit */ , this.spellModifierQuery);
                    if (this.spellSelection.attack !== undefined &&
                        this.spellSelection.attack.id === "melvorTotH:MeteorShower" /* AttackSpellIDs.MeteorShower */ ) {
                        modifier += this.modifiers.flatMinMeteorShowerSpellDamage; // TODO_MR is this even the correct place for this?
                    }
                }
                break;
        }
        return modifier;
    }
    getMaxHitModifier() {
        let modifier = this.modifiers.maxHit;
        switch (this.attackType) {
            case 'melee':
                modifier += this.modifiers.meleeMaxHit;
                modifier += this.modifiers.meleeAccuracyMaxHitPer8Strength * Math.floor(this.levels.Strength / 8);
                break;
            case 'ranged':
                modifier += this.modifiers.rangedMaxHit;
                break;
            case 'magic':
                modifier += this.modifiers.getValue("melvorD:magicMaxHit" /* ModifierIDs.magicMaxHit */ , this.spellModifierQuery);
                break;
        }
        if (this.manager.fightInProgress) {
            switch (this.attackType) {
                case 'melee':
                    modifier += this.modifiers.meleeMaxHitAgainstRanged * (this.target.attackType === 'ranged' ? 3 : 1);
                    break;
                case 'ranged':
                    modifier += this.modifiers.rangedMaxHitAgainstMagic * (this.target.attackType === 'magic' ? 3 : 1);
                    break;
                case 'magic':
                    modifier += this.modifiers.magicMaxHitAgainstMelee * (this.target.attackType === 'melee' ? 3 : 1);
                    break;
            }
            modifier += this.modifiers.getValue("melvorD:maxHitAgainstDamageType" /* ModifierIDs.maxHitAgainstDamageType */ , this.target.damageType.modQuery);
            this.modifiers.forEachDamageType("melvorD:maxHitBasedOnTargetResistance" /* ModifierIDs.maxHitBasedOnTargetResistance */ , (value, damageType) => {
                modifier += value * this.target.equipmentStats.getResistance(damageType);
            });
            this.modifiers.forEachDamageType("melvorD:maxHitBasedOnResistance" /* ModifierIDs.maxHitBasedOnResistance */ , (value, damageType) => {
                modifier += value * this.stats.getResistance(damageType);
            });
            modifier += this.modifiers.maxHitBasedOnTargetCurrentHitpoints * Math.floor(this.manager.enemy.hitpointsPercent);
        }
        return modifier;
    }
    getMinHitFromMaxHitPercent() {
        let percent = this.modifiers.minHitBasedOnMaxHit;
        switch (this.attackType) {
            case 'melee':
                percent += this.modifiers.meleeMinHitBasedOnMaxHit;
                break;
            case 'ranged':
                percent += this.modifiers.rangedMinHitBasedOnMaxHit;
                break;
            case 'magic':
                percent += this.modifiers.getValue("melvorD:magicMinHitBasedOnMaxHit" /* ModifierIDs.magicMinHitBasedOnMaxHit */ , this.spellModifierQuery);
                break;
        }
        return percent;
    }
    /** Applies modifiers to min hit */
    modifyMinHit(minHit) {
        minHit += Math.floor((this.stats.maxHit * this.getMinHitFromMaxHitPercent()) / 100);
        let flatModifier = this.modifiers.flatMinHit;
        switch (this.attackType) {
            case 'magic':
                flatModifier += this.modifiers.getValue("melvorD:flatMagicMinHit" /* ModifierIDs.flatMagicMinHit */ , this.spellModifierQuery);
                break;
        }
        minHit += numberMultiplier * flatModifier;
        minHit = clampValue(minHit, 1, this.stats.maxHit);
        return minHit;
    }
    /** Applies modifiers to max hp */
    modifyMaxHP(maxHP) {
        maxHP += numberMultiplier * this.modifiers.flatMaxHitpoints;
        let modPercent = this.modifiers.getValue("melvorD:maxHitpoints" /* ModifierIDs.maxHitpoints */ , this.damageType.modQuery);
        if (this.manager.fightInProgress) {
            modPercent += this.modifiers.getValue("melvorD:maxHitpointsAgainstDamageType" /* ModifierIDs.maxHitpointsAgainstDamageType */ , this.target.damageType.modQuery);
        }
        maxHP = applyModifier(maxHP, modPercent);
        maxHP = Math.max(maxHP, numberMultiplier);
        return maxHP;
    }
    /** Applies modifiers to attack interval */
    modifyAttackInterval(attackInterval) {
        let modifier = this.modifiers.attackInterval;
        switch (this.attackType) {
            case 'melee':
                modifier += this.modifiers.meleeAttackInterval;
                break;
            case 'ranged':
                modifier += this.modifiers.rangedAttackInterval;
                break;
            case 'magic':
                modifier += this.modifiers.magicAttackInterval;
                break;
        }
        attackInterval = applyModifier(attackInterval, modifier);
        attackInterval += this.modifiers.flatAttackInterval;
        if (this.modifiers.halveAttackInterval > 0)
            attackInterval /= 2;
        return attackInterval;
    }
    /** Modifies the specified resistance */
    modifyResistance(damageType, resistance) {
        // Add Flat bonuses
        resistance += this.modifiers.getValue("melvorD:flatResistance" /* ModifierIDs.flatResistance */ , damageType.modQuery);
        switch (this.target.attackType) {
            case 'melee':
                resistance += this.modifiers.getValue("melvorD:flatResistanceAgainstMelee" /* ModifierIDs.flatResistanceAgainstMelee */ , damageType.modQuery);
                break;
            case 'ranged':
                resistance += this.modifiers.getValue("melvorD:flatResistanceAgainstRanged" /* ModifierIDs.flatResistanceAgainstRanged */ , damageType.modQuery);
                break;
            case 'magic':
                resistance += this.modifiers.getValue("melvorD:flatResistanceAgainstMagic" /* ModifierIDs.flatResistanceAgainstMagic */ , damageType.modQuery);
                break;
        }
        const percentModifier = this.modifiers.getValue("melvorD:resistance" /* ModifierIDs.resistance */ , damageType.modQuery);
        resistance *= 1 + percentModifier / 100;
        if (this.modifiers.getValue("melvorD:halveResistance" /* ModifierIDs.halveResistance */ , damageType.modQuery))
            resistance *= 0.5;
        return resistance;
    }
    /** Modified normal damage reduction
     * @deprecated Use modifyResistance instead
     */
    modifyDamageReduction(reduction) {
        return this.modifyResistance(this.game.normalDamage, reduction);
    }
    /** Computes all stats that should be computed before conditional modifiers are calculated */
    computePreConditionalStats() {
        this.computeAttackType();
        this.computeDamageType();
    }
    /** Computes all modifiers and combat effects, excluding area-effects */
    computeModifiersAndEffects() {
        this.computeEffectApplicators();
        this.checkEffectApplicators();
        this.computeModifiers();
    }
    /** Computes all stats that should be computed after modifiers have been calculated */
    computePostModifierStats() {
        this.computeAttackSelection();
        this.computeLevels();
        this.computeAbyssalLevels();
        this.computeEquipmentStats();
        this.computeCombatStats();
    }
    /** Performs a calculation of currentStats property */
    computeCombatStats() {
        this.computeMaxHP();
        this.computeAllResistances();
        this.computeAttackInterval();
        this.computeAccuracy();
        this.computeEvasion();
        this.computeAverageEvasion();
        this.computeMaxHit();
        this.computeMinHit();
        this.computeMaxBarrier();
        if (this.manager.fightInProgress) {
            this.computeHitchance();
            this.target.computeHitchance();
            this.target.renderQueue.damageValues = true;
        }
        this.renderQueue.stats = true;
        this.renderQueue.damageValues = true;
    }
    computeHitchance() {
        const protection = this.target.modifiers.getProtectionValue(this.attackType);
        if (protection !== 0) {
            this.stats.hitChance = 100 - protection;
        } else {
            const targetEvasion = this.target.stats.evasion[this.attackType];
            const accuracy = this.stats.accuracy;
            if (accuracy < targetEvasion) {
                this.stats.hitChance = ((0.5 * accuracy) / targetEvasion) * 100;
            } else {
                this.stats.hitChance = (1 - (0.5 * targetEvasion) / accuracy) * 100;
            }
        }
        this.stats.hitChance = clampValue(this.stats.hitChance, 0, 100);
        this.renderQueue.hitChance = true;
    }
    canDamageBarrier(source) {
        return source === 'SummonAttack' || source === 'BarrierBleed' || source === 'BarrierBurn';
    }
    /** Deals damage to self */
    damage(amount, source) {
        if (this.isBarrierActive && this.canDamageBarrier(source))
            this.damageBarrier(amount, source); //Only attacks from a summon can damage the barrier
        else if (this.isBarrierActive)
            this.damageBarrier(0, source); //Only attacks from a summon can damage the barrier. Deal 0 dmg for the splash
        else {
            if (source === 'Burn' && this.target.modifiers.maxHPBurnDamage > 0)
                amount += Math.floor((this.stats.maxHitpoints * (this.target.modifiers.maxHPBurnDamage / 100)) / 10);
            this.addHitpoints(-amount);
            this.splashManager.add({
                source: source,
                amount: -amount,
                xOffset: this.hitpointsPercent,
            });
            if (this.hitpoints <= 0 && rollPercentage(this.modifiers.rebirthChance)) {
                this.heal(this.stats.maxHitpoints);
                this._events.emit('rebirth', new CharacterRebirthEvent());
            }
        }
        this.renderQueue.damageSplash = true;
    }
    /** Heals self, returns healing amount */
    heal(amount) {
        amount = Math.min(amount, this.stats.maxHitpoints - this.hitpoints);
        this.addHitpoints(amount);
        this.splashManager.add({
            source: 'Heal',
            amount,
            xOffset: this.hitpointsPercent,
        });
        this.renderQueue.damageSplash = true;
        return amount;
    }
    addHitpoints(amount) {
        const old = this.hitpoints;
        this.hitpoints += amount;
        this.renderQueue.hitpoints = true;
        if (this.manager.fightInProgress) {
            this.target.renderQueue.damageValues = true;
            this.renderQueue.damageValues = true;
        }
        this._events.emit('hitpointsChanged', new HitpointsChangedEvent(old, this.stats.maxHitpoints, this.hitpoints, this.stats.maxHitpoints));
        if (this.modifiers.globalEvasionHPScaling > 0 ||
            this.modifiers.accuracyRatingHPScaling > 0 ||
            this.modifiers.maxHitBasedOnTargetCurrentHitpoints > 0)
            this.stats.setDirty();
    }
    damageBarrier(amount, source) {
        const prevBarrier = this.barrier;
        this.addBarrier(-amount);
        if (prevBarrier > 0 && this.barrier <= 0) {
            this.onBarrierRemoval();
        }
        this.splashManager.add({
            source: source,
            amount: -amount,
            xOffset: this.barrierPercent,
        });
        this.renderQueue.damageSplash = true;
    }
    addBarrier(amount) {
        const old = this.barrier;
        this.barrier += amount;
        this.barrier = Math.min(this.barrier, this.stats.maxBarrier);
        this.barrier = Math.max(this.barrier, 0);
        this.renderQueue.barrier = true;
        if (this.manager.fightInProgress) {
            this.target.renderQueue.damageValues = true;
            this.renderQueue.damageValues = true;
        }
        this._events.emit('barrierChanged', new BarrierChangedEvent(old, this.stats.maxBarrier, this.barrier, this.stats.maxBarrier));
    }
    /** Actions to perform when Barrier is removed */
    onBarrierRemoval() {}
    /** Sets hitpoints to a given value */
    setHitpoints(value) {
        this.hitpoints = value;
        this.renderQueue.hitpoints = true;
    }
    /**
     * Determines if this character is immune to the attacks/effects from another. Checks for attack type and damage type immunities
     * @param attacker The character that is attacking or processing effects
     * @returns If this character is immune to attacks/effects
     */
    isImmuneTo(attacker) {
        return (this.damageType.immuneTo.has(attacker.damageType) ||
            this.modifiers.getImmunity(attacker.attackType) ||
            (this.modifiers.otherStyleImmunity > 0 && attacker.attackType !== this.attackType));
    }
    fireMissSplash(immune) {
        const text = getLangString(`COMBAT_MISC_${immune ? 'IMMUNE' : 'MISS'}`);
        this.splashManager.add({
            source: 'Attack',
            amount: 0,
            text,
            xOffset: this.hitpointsPercent,
        });
        this.renderQueue.damageSplash = true;
    }
    /**
     * Merges (adds) an effect applicator to this character. Matching applicators will have their chances added together.
     * @param applicator The applicator to merge
     * @param mult Optional multiplier to apply to the applicator's chances
     */
    mergeEffectApplicator(applicator, mult = 1) {
        let arr = this.effectApplicators.get(applicator.appliesWhen);
        if (arr === undefined) {
            arr = [];
            this.effectApplicators.set(applicator.appliesWhen, arr);
        }
        const match = arr.find((a) => a.matches(applicator));
        if (match !== undefined)
            match.merge(applicator, mult);
        else
            arr.push(applicator.clone(mult));
        if (applicator.applyEffectWhenMerged)
            this.effectApplicatorsToProcess.push(applicator);
    }
    /**
     * Splits (removes) an effect applicator from this character.
     * @param applicator The applicator to split
     * @param mult Optional multiplier to apply to the applicators chances
     */
    splitEffectApplicator(applicator, mult = 1) {
        const arr = this.effectApplicators.get(applicator.appliesWhen);
        if (arr === undefined)
            throw new Error('Cannot split effect applicator. Applicator was not merged into appliesWhen map');
        const matchIndex = arr.findIndex((a) => a.matches(applicator));
        if (matchIndex === -1)
            throw new Error('Cannot split effect applicator. No matching applicator was found.');
        const match = arr[matchIndex];
        match.split(applicator, mult);
        if (match.cannotApply)
            arr.splice(matchIndex, 1);
        if (arr.length === 0)
            this.effectApplicators.delete(applicator.appliesWhen);
    }
    /**
     * Merges (adds) an array of effect applicators onto this character. Matching applicators will have their chances added together.
     * @param applicators The array of applicators to merge
     * @param mult Optional multiplier to apply to the applicators' chances
     */
    mergeEffectApplicators(applicators, mult = 1) {
        applicators.forEach((a) => this.mergeEffectApplicator(a, mult));
    }
    /**
     * Splits (removes) an array of effect applicators from this character.
     * @param applicators The array of applicators to split
     * @param mult Optional multiplier to apply to the applicators' chances
     */
    splitEffectApplicators(applicators, mult = 1) {
        applicators.forEach((a) => this.splitEffectApplicator(a, mult));
    }
    /** Listener for when the appropriate effect application trigger event occurs. */
    onEffectApplicatorTrigger(trigger, source) {
        const applicators = this.effectApplicators.get(trigger);
        if (applicators === undefined)
            return;
        this.processEffectApplicators(applicators, source);
    }
    /** Assigns event handlers for processing effect applicators that have been merged with this character */
    assignEffectApplicatorListeners() {
        this.on('preAttack', (e) => this.onEffectApplicatorTrigger('PreAttack', {
            type: 'Attack',
            damageDealt: e.rawDamage
        }));
        this.on('beingAttacked', (e) => {
            this.onEffectApplicatorTrigger('BeingAttacked', {
                type: 'Other'
            });
        });
        this.on('hitByAttack', (e) => {
            this.onEffectApplicatorTrigger('HitByAttack', {
                type: 'Other',
                damageTaken: e.rawDamage
            });
            if (e.firstHit)
                this.onEffectApplicatorTrigger('HitByFirstAttack', {
                    type: 'Other',
                    damageTaken: e.rawDamage
                });
        });
        this.on('evadedAttack', (e) => {
            this.onEffectApplicatorTrigger('EvadedAttack', {
                type: 'Other',
                damageTaken: e.rawDamage
            });
        });
        this.on('hitWithAttack', (e) => {
            this.onEffectApplicatorTrigger('HitWithAttack', {
                type: 'Attack',
                damageDealt: e.rawDamage
            });
            if (e.firstHit)
                this.onEffectApplicatorTrigger('HitWithFirstAttack', {
                    type: 'Attack',
                    damageDealt: e.rawDamage
                });
            if (e.isCritical)
                this.onEffectApplicatorTrigger('CritWithAttack', {
                    type: 'Attack',
                    damageDealt: e.rawDamage
                });
        });
        this.on('attack', (e) => {
            this.onEffectApplicatorTrigger('PostAttack', {
                type: 'Attack',
                damageDealt: e.rawDamage
            });
            if (e.attackCount === 0)
                this.onEffectApplicatorTrigger('PostFirstAttack', {
                    type: 'Attack',
                    damageDealt: e.rawDamage
                });
        });
        this.on('wasAttacked', (e) => {
            this.onEffectApplicatorTrigger('WasAttacked', {
                type: 'Other',
                damageTaken: e.rawDamage
            });
        });
        this.on('rebirth', (e) => {
            this.onEffectApplicatorTrigger('Rebirth', {
                type: 'Other'
            });
        });
        this.manager.on('startOfFight', (e) => this.onEffectApplicatorTrigger('StartOfFight', {
            type: 'Other'
        }));
    }
    /** Returns the percent chance that this character is immune to an effect */
    getEffectIgnoreChance(effect) {
        const immunity = this.modifiers.getValue("melvorD:effectImmunity" /* ModifierIDs.effectImmunity */ , effect.modQuery);
        if (immunity > 0)
            return 100;
        return this.modifiers.getValue("melvorD:effectIgnoreChance" /* ModifierIDs.effectIgnoreChance */ , effect.modQuery);
    }
    /** Applies a combat effect to this character */
    applyCombatEffect(effect, sourceCharacter, source, initialParams) {
        const ignoreChance = this.getEffectIgnoreChance(effect);
        if (ignoreChance >= 100 || rollPercentage(ignoreChance))
            return;
        const existingEffect = this.activeEffects.get(effect);
        if (existingEffect === undefined) {
            if (effect.exclusiveGroups.some((group) => this.activeEffectGroups.has(group.id)))
                return;
            const newEffect = new ActiveCombatEffect(effect, this, sourceCharacter, source, initialParams);
            newEffect.init();
            this.activeEffects.set(effect, newEffect);
            effect.effectGroups.forEach((group) => {
                if (!this.activeEffectGroups.has(group.id)) {
                    this.selfModifierQuery.add({
                        effectGroup: group
                    });
                }
                this.activeEffectGroups.inc(group.id);
                this._events.emit('effectGroupApplied', new CharacterEffectGroupAppliedEvent(group));
            });
            newEffect.onApplied(initialParams);
            this._events.emit('effectApplied', new CharacterEffectAppliedEvent(effect));
            this.renderQueue.effects = true;
        } else {
            existingEffect.onReapplied(source, initialParams);
        }
    }
    /** Computes the net chance to apply a CombatEffect */
    getEffectApplicatorChance(applicator, source) {
        let totalChance = applicator.baseChance;
        applicator.conditionChances.forEach(({
            condition,
            chance
        }) => {
            if (this.checkEffectApplicatorCondition(condition, source))
                totalChance += chance;
        });
        return totalChance;
    }
    checkEffectApplicatorCondition(condition, source) {
        var _a, _b;
        if (condition instanceof CharacterValueCondition || condition instanceof CharacterBooleanCondition) {
            return condition.isMetForCharacter(this);
        }
        switch (condition.type) {
            case 'Every':
                return checkEveryCondition(condition, (c) => this.checkEffectApplicatorCondition(c, source));
            case 'Some':
                return checkSomeCondition(condition, (c) => this.checkEffectApplicatorCondition(c, source));
            case 'DamageDealt':
                return checkComparison((_a = source.damageDealt) !== null && _a !== void 0 ? _a : 0, condition.rhValue(this), condition.operator);
            case 'DamageTaken':
                return checkComparison((_b = source.damageTaken) !== null && _b !== void 0 ? _b : 0, condition.rhValue(this), condition.operator);
            case 'CharacterValue':
                return checkComparison(condition.lhValue(this), condition.rhValue(this), condition.operator);
        }
    }
    /** Processes a combat effect, and applies it to the appropriate character via this one */
    processEffectApplicator(applicator, source) {
        var _a;
        const chanceToApply = this.getEffectApplicatorChance(applicator, source);
        if (chanceToApply < 100 && !rollPercentage(chanceToApply))
            return;
        const sApp = applicator.getSingleApplicator();
        const target = ((_a = applicator.targetOverride) !== null && _a !== void 0 ? _a : sApp.effect.target) === 'Self' ? this : this.target;
        if (target !== this && (target.isImmuneTo(this) || (target.barrier > 0 && !sApp.bypassBarrier)))
            return; // Prevent applying effects to targets that are immune, or have barrier
        target.applyCombatEffect(sApp.effect, this, source, sApp.initialParams);
    }
    /** Processes an array of combat effects, applying them to the appropriate characters via this one */
    processEffectApplicators(applicators, source) {
        applicators.forEach((applicator) => this.processEffectApplicator(applicator, source));
    }
    /** Removes a combat effect from this Character */
    removeCombatEffect(effect) {
        const activeEffect = this.activeEffects.get(effect);
        if (activeEffect === undefined)
            return;
        this.activeEffects.delete(effect);
        effect.effectGroups.forEach((group) => {
            this.activeEffectGroups.dec(group.id);
            if (this.activeEffectGroups.get(group.id) === 0) {
                this.selfModifierQuery.remove({
                    effectGroup: group
                });
                this._events.emit('effectGroupRemoved', new CharacterEffectGroupRemovedEvent(group));
            }
        });
        activeEffect.destroy();
        this._events.emit('effectRemoved', new CharacterEffectRemovedEvent(effect));
        this.effectRenderer.queueRemoval(activeEffect);
        this.renderQueue.effects = true;
    }
    initializeEffects() {
        this.activeEffects.forEach((activeEffect) => activeEffect.init());
    }
    clampDamageValue(damage, target) {
        if (target.isBarrierActive)
            return 0;
        return Math.min(damage, target.hitpoints);
    }
    /** Perform an attack against a target */
    attack(target, attack) {
        const targetImmune = target.isImmuneTo(this);
        let damage = 0;
        /** Percentage of current hitpoints to take as damage after the attack */
        let selfDamagePercent = 0;
        const attackEventData = {
            attacker: this,
            attack: attack,
            attackType: this.attackType,
            attackCount: this.attackCount,
            firstHit: false,
            isCritical: false,
        };
        const attackedEventData = {
            attack: attack,
            firstHit: false,
        };
        this._events.emit('preAttack', new CharacterAttackEvent('Pre', attackEventData));
        target._events.emit('beingAttacked', new CharacterAttackedEvent('Being', attackedEventData));
        // Apply Prehit Effects
        this.processEffectApplicators(attack.prehitEffects, {
            type: 'Attack'
        });
        if (!targetImmune) {
            // Apply Curse if character can do so
            if (this.canCurse && this.spellSelection.curse !== undefined) {
                this.castCurseSpell(this.spellSelection.curse);
            }
        }
        // Determine if attack hits
        const attackHit = !targetImmune && this.rollToHit(target, attack);
        if (attackHit) {
            // Calculate Damage
            // TODO_C - Confirm what modifiers work for what damage types
            damage = this.reduceDamage(attack.damage);
            damage += this.getFlatAttackDamageBonus(target);
            // Apply Critical Hit
            const crit = rollPercentage(this.modifiers.getCritChance(this.attackType));
            if (crit) {
                attackEventData.isCritical = true;
                const multiplier = 150 + this.modifiers.critMultiplier;
                damage *= multiplier / 100;
            }
            const rawDamage = (attackEventData.rawDamage = attackedEventData.rawDamage = damage);
            attackEventData.firstHit = attackedEventData.firstHit = this.firstHit;
            const applyReduction = rollPercentage(this.modifiers.getValue("melvorD:ignoreResistanceWhenAttackingChance" /* ModifierIDs.ignoreResistanceWhenAttackingChance */ , this.damageType.modQuery));
            damage = this.modifyAttackDamage(target, attack, damage, applyReduction);
            const flatLifesteal = this.getFlatLifestealBonus(target);
            // Apply Target Healing Effects. Applied before damage to prevent this blocking death
            let targetHealing = 0;
            targetHealing += (this.target.stats.maxHitpoints * this.target.modifiers.healingWhenHit) / 100;
            if (targetHealing > 0)
                this.target.heal(targetHealing);
            // Cap Damage at target hitpoints
            damage = this.clampDamageValue(damage, target);
            attackEventData.damage = attackedEventData.damage = damage;
            // Damage Target
            target.damage(damage, crit ? 'Crit' : 'Attack');
            // Heal from Lifesteal
            this.lifesteal(attack, damage, flatLifesteal);
            if (this.firstHit) {
                // Perform Reflect Damage
                let reflectDamage = (damage * target.modifiers.getReflectPercent()) / 100;
                reflectDamage += numberMultiplier * target.modifiers.getFlatReflectDamage();
                reflectDamage += rollInteger(0, numberMultiplier * target.modifiers.getRolledReflectDamage());
                reflectDamage += (rawDamage * target.modifiers.rawReflectDamage) / 100;
                reflectDamage = target.applyDamageModifiers(this, reflectDamage);
                reflectDamage *= 1 - target.stats.getResistance(this.damageType) / 100;
                reflectDamage = Math.floor(reflectDamage);
                reflectDamage = Math.min(reflectDamage, this.hitpoints - 1); // Cap at current hp - 1, to prevent death by reflect
                if (reflectDamage > 0)
                    this.damage(reflectDamage, 'Attack');
                // Perform Percent HP Damage
                const percentDamageCap = 1000 * numberMultiplier;
                let percentHPDamage = 0;
                percentHPDamage += Math.min(percentDamageCap, Math.floor((this.hitpoints * this.modifiers.currentHPDamageTakenOnAttack) / 100));
                percentHPDamage += Math.min(percentDamageCap, Math.floor((this.stats.maxHitpoints * this.modifiers.maxHPDamageTakenOnAttack) / 100));
                percentHPDamage *= 1 - this.stats.getResistance(this.damageType) / 100;
                percentHPDamage = Math.floor(percentHPDamage);
                percentHPDamage = Math.min(percentHPDamage, this.hitpoints);
                if (percentHPDamage > 0)
                    this.damage(percentHPDamage, 'Attack');
                // Perform flat barrier damage
                let dmgToBarrier = numberMultiplier * this.modifiers.flatBarrierDamage;
                dmgToBarrier = Math.min(dmgToBarrier, target.barrier);
                this.target.damageBarrier(dmgToBarrier, 'SummonAttack'); // Using SummonAttack here for the splash colour
            }
            // Perform Self HP Damage
            let selfHPDamageOnHit = 0;
            selfHPDamageOnHit += Math.floor(this.hitpoints * (this.modifiers.selfDamageOnHitBasedOnCurrentHitpoints / 100));
            selfHPDamageOnHit *= 1 - this.stats.getResistance(this.damageType) / 100;
            selfHPDamageOnHit = Math.floor(selfHPDamageOnHit);
            selfHPDamageOnHit = Math.min(selfHPDamageOnHit, this.hitpoints);
            if (selfHPDamageOnHit > 0)
                this.damage(selfHPDamageOnHit, 'Attack');
            // Add Buffered Regen
            target.bufferedRegen += Math.floor((damage * target.modifiers.regenPerDamageTaken) / 100);
            // Apply On Hit Effects
            this.processEffectApplicators(attack.onhitEffects, {
                type: 'Attack',
                damageDealt: attackEventData.rawDamage
            });
            this._events.emit('hitWithAttack', new CharacterAttackEvent('Hit', attackEventData));
            target._events.emit('hitByAttack', new CharacterAttackedEvent('Hit', attackedEventData));
            this.onHit();
            target.onBeingHit();
            this.firstHit = false;
        } else {
            this._events.emit('missedWithAttack', new CharacterAttackEvent('Miss', attackEventData));
            target._events.emit('evadedAttack', new CharacterAttackedEvent('Evaded', attackedEventData));
            target.fireMissSplash(targetImmune);
            this.onMiss();
            if (this.firstMiss)
                selfDamagePercent += this.modifiers.damageTakenPerMissedAttack;
            this.firstMiss = false;
        }
        if (this.attackCount === 0) {
            selfDamagePercent += this.modifiers.damageTakenPerAttack;
        }
        if (selfDamagePercent > 0) {
            const damageTaken = Math.floor((this.hitpoints * selfDamagePercent) / 100);
            if (damageTaken > 0)
                this.damage(damageTaken, 'Attack');
        }
        target.postAttack();
        this.attackCount++;
        if (attack.consumesEffect !== undefined) {
            let maxAttacks = attack.attackCount;
            const existingEffect = target.activeEffects.get(attack.consumesEffect.effect);
            if (existingEffect !== undefined) {
                maxAttacks += existingEffect.getParameter(attack.consumesEffect.paramName);
            }
            this.isAttacking = this.attackCount < maxAttacks;
            if (!this.isAttacking && existingEffect !== undefined) {
                target.removeCombatEffect(attack.consumesEffect.effect);
            }
        } else {
            this.isAttacking = this.attackCount < attack.attackCount;
        }
        const event = new CharacterAttackEvent('Post', attackEventData);
        event.interval = this.timers.act.maxTicks * TICK_INTERVAL;
        this._events.emit('attack', event);
        target._events.emit('wasAttacked', new CharacterAttackedEvent('Was', attackedEventData));
        if (this.attackInterrupted)
            this.isAttacking = false; // Stop multi-hit attacks if the character was interrupted
        return damage;
    }
    /** Computes the flat bonus to attack damage. Applied directly after computing the base damage from an attack. */
    getFlatAttackDamageBonus(target) {
        // TODO_C - Confirm what flat damage bonuses are applied to what damage types
        if (this.cantUseDamageModifiers)
            return 0;
        let bonus = 0;
        bonus +=
            this.damageType === this.game.normalDamage ?
            this.getNormalFlatAttackDamageBonus(target) :
            this.getAbyssalFlatAttackDamageBonus(target);
        return bonus;
    }
    /** Computes the flat bonus to normal attack damage. Applied directly after computing the base damage from an attack. */
    getNormalFlatAttackDamageBonus(target) {
        let bonus = 0;
        if (this.modifiers.lifestealDamageBasedOnCurrentHitpoints > 0) {
            bonus += (target.hitpoints * this.modifiers.lifestealDamageBasedOnCurrentHitpoints) / 100;
        }
        if (this.modifiers.damageBasedOnCurrentHitpoints > 0) {
            bonus += Math.min((target.hitpoints * this.modifiers.damageBasedOnCurrentHitpoints) / 100, 1000 * numberMultiplier);
        }
        if (this.modifiers.damageBasedOnMaxHitpoints > 0) {
            bonus += Math.min((target.stats.maxHitpoints * this.modifiers.damageBasedOnMaxHitpoints) / 100, 1000 * numberMultiplier);
        }
        if (this.modifiers.damageBasedOnMaxHitpointsSelf > 0) {
            bonus += (this.stats.maxHitpoints * this.modifiers.damageBasedOnMaxHitpointsSelf) / 100;
        }
        return bonus;
    }
    /** Computes the flat bonus to abyssal attack damage. Applied directly after computing the base damage from an attack. */
    getAbyssalFlatAttackDamageBonus(target) {
        let bonus = 0;
        if (this.modifiers.lifestealDamageBasedOnCurrentHitpoints > 0) {
            bonus += (target.hitpoints * this.modifiers.lifestealDamageBasedOnCurrentHitpoints) / 100;
        }
        if (this.modifiers.damageBasedOnCurrentHitpoints > 0) {
            bonus += Math.min((target.hitpoints * this.modifiers.damageBasedOnCurrentHitpoints) / 100, 1000 * numberMultiplier);
        }
        if (this.modifiers.damageBasedOnMaxHitpoints > 0) {
            bonus += Math.min((target.stats.maxHitpoints * this.modifiers.damageBasedOnMaxHitpoints) / 100, 1000 * numberMultiplier);
        }
        if (this.modifiers.damageBasedOnMaxHitpointsSelf > 0) {
            bonus += (this.stats.maxHitpoints * this.modifiers.damageBasedOnMaxHitpointsSelf) / 100;
        }
        return bonus;
    }
    /**
     * Modifies the damage dealt by an attack by damage modifiers and damage reduction
     * @param target The character being attacked
     * @param attack The attack being performed
     * @param damage The raw damage dealt
     * @param applyReduction If damage reduction should be applied. Defaults to true
     * @returns The modified attack damage
     */
    modifyAttackDamage(target, attack, damage, applyReduction = true) {
        if (target.isBarrierActive || this.modifiers.disableAttackDamage > 0)
            return 0; //No damage if there is a barrier or modifier.
        // Apply Damage Modifiers
        damage = this.applyDamageModifiers(target, damage);
        if (attack.isDragonbreath)
            damage *= 1 + target.modifiers.dragonBreathDamage / 100;
        // Apply Target Damage Reduction
        damage *= 1 - target.stats.getResistance(this.damageType) / 100;
        return Math.floor(damage);
    }
    /** Returns the maximum damage an attack can do in a single hit, accounting for all modifiers */
    getAttackMaxDamage(attack) {
        const computeDamage = (damage, prevDamage) => getMaxDamage(damage, this, this.target, prevDamage);
        let allHitDamage = 0;
        const specificHitDamage = new Map();
        attack.damage.forEach((damage) => {
            var _a;
            if (damage.attackCount !== undefined) {
                let existingDamage = (_a = specificHitDamage.get(damage.attackCount)) !== null && _a !== void 0 ? _a : allHitDamage;
                existingDamage += computeDamage(damage, existingDamage);
                specificHitDamage.set(damage.attackCount, existingDamage);
            } else {
                allHitDamage += computeDamage(damage, allHitDamage);
                // Traverse each specific hit path, to ensure proper simulation of previous damage based rolls
                specificHitDamage.forEach((specificDamage, attackCount) => {
                    specificHitDamage.set(attackCount, specificDamage + computeDamage(damage, specificDamage));
                });
            }
        });
        let maxHit = Math.max(allHitDamage, ...specificHitDamage.values());
        maxHit += this.getFlatAttackDamageBonus(this.target);
        return this.modifyAttackDamage(this.target, this.game.normalAttack, maxHit);
    }
    /** Computes the flat bonus to lifesteal from attacks. Computed before the attacks damage is performed. */
    getFlatLifestealBonus(target) {
        let bonus = 0;
        if (this.modifiers.lifestealDamageBasedOnCurrentHitpoints > 0) {
            bonus += (target.hitpoints * this.modifiers.lifestealDamageBasedOnCurrentHitpoints) / 100;
        }
        return bonus;
    }
    /** Gets the current modifier to lifesteal from attacks */
    getAttackLifestealModifier() {
        let modifier = this.modifiers.lifesteal;
        switch (this.attackType) {
            case 'melee':
                modifier += this.modifiers.meleeLifesteal;
                break;
            case 'ranged':
                modifier += this.modifiers.rangedLifesteal;
                break;
            case 'magic':
                modifier += this.modifiers.magicLifesteal;
        }
        modifier += (this.modifiers.lifestealBasedOnHPRegenEffectiveness / 100) * this.modifiers.hitpointRegeneration;
        if (this.manager.fightInProgress) {
            if (this.target.isCursed)
                modifier += this.modifiers.curseLifesteal;
        }
        return modifier;
    }
    /** Performs lifesteal from attack damage. Returns the true amount healed. */
    lifesteal(attack, damage, flatBonus) {
        if (this.modifiers.disableLifesteal > 0)
            return 0;
        let lifesteal = attack.lifesteal + this.getAttackLifestealModifier();
        if (this.modifiers.doubleLifesteal > 0)
            lifesteal *= 2;
        let healing = Math.floor((damage * lifesteal) / 100 + flatBonus);
        if (healing > 0)
            healing = this.heal(healing);
        return healing;
    }
    /** Method called when hit by an attack */
    onBeingHit() {}
    rollToHit(target, attack) {
        if (target.modifiers.getProtectionValue(this.attackType) === 100)
            return false;
        const dodge = rollPercentage(target.modifiers.dodgeChance);
        if (dodge)
            return false;
        if (this.modifiers.cantMiss > 0 ||
            target.modifiers.cantEvade > 0 ||
            (attack.cantMiss && this.stats.accuracy >= attack.minAccuracy))
            return true;
        const maxRolls = Math.min(1 + this.modifiers.attackRolls, 2);
        let hit = false;
        for (let i = 0; i < maxRolls; i++) {
            hit = rollPercentage(this.stats.hitChance);
            if (hit)
                break;
        }
        if (rollPercentage(this.modifiers.convertMissIntoHit))
            return true;
        return hit;
    }
    addAuroraModifiers() {
        const aurora = this.spellSelection.aurora;
        if (this.canAurora && aurora !== undefined && aurora.stats.modifiers !== undefined) {
            this.modifiers.addModifiers(aurora, aurora.stats.modifiers);
        }
    }
    /** Adds modifiers from active effects */
    addEffectModifiers() {
        this.activeEffects.forEach((activeEffect) => {
            activeEffect.addAllModifiers();
        });
    }
    /** Gets the modifier to damage taken by this character */
    getDamageTakenModifier() {
        let modifier = this.modifiers.getValue("melvorD:damageTaken" /* ModifierIDs.damageTaken */ , this.selfModifierQuery); // TODO_MR Convert to conditional modifiers
        if (this.modifiers.damageTakenBasedOnHP > 0) {
            modifier += (100 - this.hitpointsPercent) * this.modifiers.damageTakenBasedOnHP;
        }
        return modifier;
    }
    /** Gets the modifier to damage dealt by this character to a target character */
    getDamageDealtModifier() {
        let modifier = this.modifiers.damageDealtPerEffect * this.activeEffectCount;
        if (this.activeEffectCount >= 2) {
            modifier += this.modifiers.damageDealtWith2Effects;
        }
        return modifier;
    }
    /** Gets the damage modifiers for the character */
    getDamageModifiers(target) {
        let modifier = target.getDamageTakenModifier();
        modifier += this.getDamageDealtModifier();
        return modifier;
    }
    /** Reduces a damage array using this character as the Attacker and this character's target as the Target */
    reduceDamage(damage, damageDealt = 0, damageTaken = 0) {
        return damage.reduce(damageReducer(this, this.target, damageDealt, damageTaken), 0);
    }
    applyDamageModifiers(target, damage) {
        // Modify the damage dealt first by fixed percent if set (Used in Strongholds)
        damage = this.modifyDamageDealt(damage);
        // Then modify it
        damage *= 1 + this.getDamageModifiers(target) / 100;
        return damage;
    }
    modifyDamageDealt(damage) {
        damage *= 1 + this.modifiers.damageDealt / 100;
        return damage;
    }
    /** Gets the modifier to the amount of DOT damage taken by this character */
    getDotDamageModifier(type) {
        let value = this.modifiers.dotDamageTaken;
        switch (type) {
            case 'Burn':
            case 'BarrierBurn':
                value += this.modifiers.burnDOTDamageTaken;
                break;
            case 'Poison':
                value += this.modifiers.poisonDOTDamageTaken;
                break;
            case 'Bleed':
            case 'BarrierBleed':
                value += this.modifiers.bleedDOTDamageTaken;
                break;
            case 'DeadlyPoison':
                value += this.modifiers.deadlyPoisonDOTDamageTaken;
                break;
            case 'Ablaze':
                value += this.modifiers.ablazeDOTDamageTaken;
                if (this.isCorrupted)
                    value += this.modifiers.ablazeDOTDamageTakenIfCorrupted;
                break;
            case 'Toxin':
                value += this.modifiers.toxinDOTDamageTaken;
                break;
            case 'Laceration':
                value += this.modifiers.lacerationDOTDamageTaken;
                break;
            case 'Voidburst':
                value += this.modifiers.voidburstDOTDamageTaken;
                break;
        }
        return value;
    }
    /** Removes every effect from the character. Only occurs when this character dies. */
    removeAllEffects() {
        this.activeEffects.forEach((_, effect) => {
            this.removeCombatEffect(effect);
        });
        this.effectRenderer.queueRemoveAll();
        this.renderQueue.effects = true;
    }
    /** Attempts to cast the curse spell on this character's target. May contain rune costs. */
    castCurseSpell(curse) {
        const applicator = new SingleCombatEffectApplicator(curse.effect);
        applicator.baseChance = 100;
        this.processEffectApplicator(applicator, {
            type: 'Attack'
        });
    }
    /** Ticks regen, and effect timers */
    passiveTick() {
        this.timers.regen.tick();
        if (this.activeEffectTimers.size > 0) {
            this.activeEffectTimers.forEach((t) => t.tick());
        }
    }
    /** Ticks action and summons */
    activeTick() {
        this.timers.act.tick();
    }
    getErrorLog() {
        var _a, _b, _c;
        return `Next Action: ${this.nextAction}
Next Attack: ${this.nextAttack.id}
Is Attacking: ${this.isAttacking}
Attack Spell Selected: ${(_a = this.spellSelection.attack) === null || _a === void 0 ? void 0 : _a.id}
Aurora Selected: ${(_b = this.spellSelection.aurora) === null || _b === void 0 ? void 0 : _b.id}
Curse Selected: ${(_c = this.spellSelection.curse) === null || _c === void 0 ? void 0 : _c.id}`;
    }
    /** Performs an action: E.g. Sleep/Stun/Attack */
    act() {
        let endOfTurn = true;
        // Perform the next action
        switch (this.nextAction) {
            case 'Attack':
                this.inAttack = true;
                this.attack(this.target, this.nextAttack);
                this.inAttack = false;
                endOfTurn = this.nextAttack.attackCount === this.attackCount || this.attackInterrupted;
                this.attackInterrupted = false;
                break;
            case 'Nothing':
                break;
            default:
                throw new Error(`Invalid action type: ${this.nextAction}`);
        }
        if (endOfTurn) {
            this.turnsTaken++;
            this._events.emit('endOfTurn', new CharacterEndOfTurnEvent());
        }
        this.queueNextAction();
    }
    /** Adds a timer to the set of timers that should be ticked on this character's passive tick */
    addCombatEffectTimer(timer) {
        this.activeEffectTimers.add(timer);
    }
    /** Removes a timer from the set of timers that should be ticked on this character's passive tick */
    removeCombatEffectTimer(timer) {
        this.activeEffectTimers.delete(timer);
    }
    /** Interrupts the current action of the character, resetting their attack bar, and cancelling multi-hit special attacks */
    interruptAction() {
        if (this.inAttack) {
            this.attackInterrupted = true;
        } else {
            this.queueNextAction();
        }
    }
    /** Queues up the next action to perform. Will interrupt current action if called */
    queueNextAction(noSpec = false, tickOffset = false) {
        if (this.modifiers.cantAttack > 0) {
            this.nextAction = 'Nothing';
            this.attackCount = 0;
            this.isAttacking = false;
            this.firstHit = true;
            this.firstMiss = true;
            if (!this.game.currentGamemode.enableInstantActions)
                this.timers.act.start(this.stats.attackInterval, tickOffset);
        } else if (this.isAttacking && !noSpec) {
            this.nextAction = 'Attack';
            if (!this.game.currentGamemode.enableInstantActions)
                this.timers.act.start(this.nextAttack.attackInterval, tickOffset);
        } else {
            this.nextAction = 'Attack';
            this.firstHit = true;
            if (this.modifiers.cantSpecialAttack > 0 || (noSpec && !this.isUsingSpecialAttackSpell)) {
                this.nextAttack = this.game.normalAttack;
            } else {
                const attackRoll = Math.random() * 100;
                let percentTotal = 0;
                for (let i = 0; i < this.availableAttacks.length; i++) {
                    const attack = this.availableAttacks[i];
                    percentTotal += attack.chance;
                    if (percentTotal > attackRoll) {
                        this.nextAttack = attack.attack;
                        break;
                    }
                }
                if (this.isAttackAlreadyActive(this.nextAttack)) {
                    this.nextAttack = this.game.normalAttack;
                }
            }
            this.attackCount = 0;
            this.isAttacking = false;
            if (!this.game.currentGamemode.enableInstantActions)
                this.timers.act.start(this.stats.attackInterval, tickOffset);
        }
        this.renderQueue.attackBar = true;
        this.renderQueue.attackBarMinibar = true;
    }
    isAttackAlreadyActive(attack) {
        return (attack.canNormalAttack &&
            (attack.prehitEffects.some((a) => this.isEffectApplicatorApplied(a)) ||
                attack.onhitEffects.some((a) => this.isEffectApplicatorApplied(a))));
    }
    isEffectApplicatorApplied(applicator) {
        if (applicator instanceof SingleCombatEffectApplicator) {
            const char = applicator.effect.target === 'Self' ? this : this.target;
            return char.isEffectActive(applicator.effect);
        } else {
            return applicator.table.table.some((row) => this.isEffectApplicatorApplied(row.applicator));
        }
    }
    /** Checks if a combat effect is active on this character */
    isEffectActive(effect) {
        return this.activeEffects.has(effect);
    }
    /** Checks if a combat effect group is active on this character */
    isEffectGroupActive(group) {
        return this.activeEffectGroups.has(group.id);
    }
    /** Renders the character's current stats */
    renderStats() {
        this.statElements.maxHitpoints.forEach((elem) => {
            const decimals = this.stats.maxHitpoints >= 1000000 ? 2 : 0;
            elem.textContent = formatNumber(this.stats.maxHitpoints, decimals);
        });
        this.statElements.attackInterval.forEach((elem) => (elem.textContent = templateLangString('MENU_TEXT_SECONDS_SHORT', {
            seconds: formatFixed(this.stats.attackInterval / 1000, 2),
        })));
        this.renderQueue.stats = false;
    }
    renderDamageValues() {
        let minHitText;
        let maxHitText;
        if (this.manager.fightInProgress) {
            minHitText = this.formatNormalAttackDamage(this.stats.minHit);
            maxHitText = this.formatNormalAttackDamage(this.stats.maxHit);
        } else {
            minHitText = formatNumber(this.stats.minHit);
            maxHitText = formatNumber(this.stats.maxHit);
        }
        this.renderNormalDamage(minHitText, maxHitText);
        this.renderQueue.damageValues = false;
    }
    formatNormalAttackDamage(damage) {
        damage += this.getFlatAttackDamageBonus(this.target);
        damage = this.modifyAttackDamage(this.target, this.game.normalAttack, damage);
        return `(${formatNumber(damage)})`;
    }
    /** Updates all hitpoint numbers and bars */
    renderHitpoints() {
        const decimals = this.hitpoints >= 1000000 ? 2 : 0;
        const text = formatNumber(this.hitpoints, decimals);
        this.statElements.hitpoints.forEach((elem) => (elem.textContent = text));
        const hpRatio = `${Math.floor((this.hitpoints / this.stats.maxHitpoints) * 100)}%`;
        this.statElements.hitpointsBar.forEach((elem) => (elem.style.width = hpRatio));
        this.renderQueue.hitpoints = false;
    }
    /** Updates all barrier numbers and bars */
    renderBarrier() {
        if (this.hasBarrier) {
            const text = formatNumber(this.barrier);
            this.statElements.barrier.forEach((elem) => (elem.textContent = text));
            const barrierRatio = `${Math.floor((this.barrier / this.stats.maxBarrier) * 100)}%`;
            this.statElements.barrierBar.forEach((elem) => (elem.style.width = barrierRatio));
            this.statElements.barrierContainer.forEach((elem) => elem.classList.remove('invisible'));
        } else {
            this.statElements.barrierContainer.forEach((elem) => elem.classList.add('invisible'));
        }
        this.renderQueue.barrier = false;
    }
    /** Processes the damage splash queue and renders them all */
    renderDamageSplashes() {
        this.splashManager.render();
        this.renderQueue.damageSplash = false;
    }
    renderEffects() {
        this.effectRenderer.removeEffects();
        this.activeEffects.forEach((a) => this.effectRenderer.add(a));
        this.renderQueue.effects = false;
    }
    renderAttackBar() {
        this.renderQueue.attackBar = false;
        this.renderQueue.attackBarMinibar = false;
        let attackText = getLangString('COMBAT_MISC_9');
        if (!this.timers.act.isActive) {
            this.attackBar.stopAnimation();
            this.attackBarMinibar.stopAnimation();
            this.statElements.attackName.forEach((elem) => (elem.textContent = attackText));
            return;
        }
        let newStyle = 'bg-info';
        let setStriped = false;
        switch (this.nextAction) {
            case 'Nothing':
                newStyle = 'bg-danger';
                if (this.isCrystallized)
                    attackText = getLangString('COMBAT_MISC_CRYSTALLIZED');
                else if (this.isStunned)
                    attackText = getLangString('COMBAT_MISC_STUNNED');
                else if (this.isSleeping)
                    attackText = getLangString('COMBAT_MISC_SLEEPING');
                this.statElements.attackName.forEach((elem) => (elem.textContent = attackText));
                break;
            case 'Attack':
                if (this.isAttacking) {
                    setStriped = true;
                    newStyle = 'bg-warning';
                } else if (this.isSlowed)
                    newStyle = 'bg-slowed';
                else if (this.nextAttack !== this.game.normalAttack)
                    newStyle = 'bg-warning';
                if (this.nextAttack !== this.game.normalAttack) {
                    this.statElements.attackName.forEach((elem) => {
                        elem.textContent = '';
                        elem.append(...templateLangStringWithNodes('COMBAT_MISC_USING_ATTACK', {
                            attackName: createElement('strong', {
                                text: this.nextAttack.name
                            })
                        }, {}));
                    });
                } else {
                    this.statElements.attackName.forEach((elem) => (elem.textContent = attackText));
                }
                break;
        }
        if (setStriped) {
            this.attackBar.animateStriped();
            this.attackBarMinibar.animateStriped();
        } else {
            this.attackBar.animateProgressFromTimer(this.timers.act);
            this.attackBarMinibar.animateProgressFromTimer(this.timers.act);
        }
        this.attackBar.setStyle(newStyle);
        this.attackBarMinibar.setStyle(newStyle);
    }
    render() {
        if (this.stats.dirty)
            this.renderQueue.stats = true;
        this.renderHitchance();
        if (this.renderQueue.hitpoints)
            this.renderHitpoints();
        if (this.renderQueue.stats)
            this.renderStats();
        if (this.renderQueue.damageValues)
            this.renderDamageValues();
        if (this.renderQueue.damageSplash)
            this.renderDamageSplashes();
        if (this.renderQueue.effects)
            this.renderEffects();
        if (this.renderQueue.attackBar)
            this.renderAttackBar();
        if (this.renderQueue.barrier)
            this.renderBarrier();
    }
    resetActionState() {
        this.timers.act.stop();
        this.isAttacking = false;
        this.activeEffectGroups.clear();
        this.activeEffects.clear(); // Do not need to unassign listeners, or timers as this happens before effect init
        this.target = this;
        this.selfModifierQuery.replace({
            effectGroup: []
        });
    }
    encode(writer) {
        writer.writeUint32(this.hitpoints);
        writer.writeUint8(this.nextAction === 'Attack' ? 1 : 0);
        writer.writeUint32(this.attackCount);
        writer.writeNamespacedObject(this.nextAttack);
        writer.writeBoolean(this.isAttacking);
        writer.writeBoolean(this.firstHit);
        this.timers.act.encode(writer);
        this.timers.regen.encode(writer);
        // Next Chunk
        writer.writeUint32(this.turnsTaken);
        writer.writeUint32(this.bufferedRegen);
        this.encodeActiveEffects(writer);
        writer.writeBoolean(this.firstMiss);
        writer.writeUint32(this.barrier);
        return writer;
    }
    decode(reader, version) {
        this.hitpoints = reader.getUint32();
        if (version < 100 /* SaveVersion.IntoTheAbyss */ ) {
            // Dump old effects data. Stun/Sleep
            reader.skipBytes(3);
        }
        this.nextAction = reader.getUint8() === 1 ? 'Attack' : 'Nothing';
        this.attackCount = reader.getUint32();
        const nextAttack = reader.getNamespacedObject(this.game.specialAttacks);
        if (typeof nextAttack === 'string')
            this.nextAttack = this.game.normalAttack;
        else
            this.nextAttack = nextAttack;
        this.isAttacking = reader.getBoolean();
        this.firstHit = reader.getBoolean();
        if (version < 100 /* SaveVersion.IntoTheAbyss */ ) {
            // Dump old effects data. Slow Count/Curse
            reader.skipBytes(4);
            if (reader.getBoolean()) {
                reader.skipBytes(1);
                reader.getNamespacedObject(this.game.curseSpells);
            }
        }
        this.timers.act.decode(reader, version);
        this.timers.regen.decode(reader, version);
        if (version < 100 /* SaveVersion.IntoTheAbyss */ ) {
            // Dump old effects data. Modifier, Reflexive, Stacking, Dots
            for (let i = 0; i < 4; i++) {
                reader.skipMap(skipBytes(2), (reader) => {
                    reader.skipMap(skipAttackEffectData, skipBytes(16));
                });
            }
            this.skipReflexiveLikeData(reader, version);
            reader.skipMap(skipBytes(2), skipBytes(8));
            reader.skipComplexMap(skipBytes(34));
        }
        if (version < 109 /* SaveVersion.CombatStatRework */ )
            this.manager.decodePassives(reader, version);
        this.turnsTaken = reader.getUint32();
        if (version < 100 /* SaveVersion.IntoTheAbyss */ ) {
            // Dump old effects data. Combo Effects
            reader.skipComplexMap((reader) => {
                reader.skipBytes(2);
                skipAttackEffectData(reader);
                reader.skipBytes(8);
            });
        }
        if (version > 29 && version < 100 /* SaveVersion.IntoTheAbyss */ )
            reader.getUint8(); // Dump old effects data. Stun immunity
        if (typeof nextAttack === 'string') {
            this.attackCount = 0;
            this.isAttacking = false;
        }
        // Dump old effects data. Reductive and Incremental
        if (version < 100 /* SaveVersion.IntoTheAbyss */ ) {
            if (version > 50) {
                this.skipReflexiveLikeData(reader, version);
            }
            if (version >= 85 /* SaveVersion.ReductiveEffects */ ) {
                this.skipReflexiveLikeData(reader, version);
            }
            if (version > 50) {
                this.skipReflexiveLikeData(reader, version);
            }
        }
        if (version >= 62) {
            this.bufferedRegen = reader.getUint32();
        }
        if (version >= 100 /* SaveVersion.IntoTheAbyss */ ) {
            this.decodeActiveEffects(reader, version);
            this.firstMiss = reader.getBoolean();
        }
        if (version >= 124 /* SaveVersion.BarrierSaving */ ) {
            this.barrier = reader.getUint32();
        }
    }
    /** Skips old effects data for Reflexive, reductive and incremental effects */
    skipReflexiveLikeData(reader, version) {
        reader.skipComplexMap((reader) => {
            reader.skipBytes(2);
            skipAttackEffectData(reader);
            reader.skipBytes(16);
        });
    }
    encodeActiveEffects(writer) {
        writer.writeMap(this.activeEffects, writeNamespaced, (activeEffect) => activeEffect.encode(writer));
    }
    decodeActiveEffects(reader, version) {
        this.activeEffects = reader.getMap(readNamespacedReject(this.game.combatEffects), (reader, key) => {
            if (key === undefined) {
                ActiveCombatEffect.skipData(reader, version);
                return undefined;
            } else {
                const activeEffect = new ActiveCombatEffect(key, this, this, {
                    type: 'Other'
                });
                activeEffect.decode(reader, version);
                if (activeEffect.decodeInvalid)
                    return undefined;
                else
                    return activeEffect;
            }
        });
        const groups = new Set();
        this.activeEffects.forEach((_, effect) => {
            effect.effectGroups.forEach((effectGroup) => {
                groups.add(effectGroup);
                this.activeEffectGroups.inc(effectGroup.id);
            });
        });
        this.selfModifierQuery.add({
            effectGroup: [...groups]
        });
    }
    deserialize(reader, version, idMap) {
        this.hitpoints = reader.getNumber();
        reader.skipValues(3); // Dump old effects data. Stun, Sleep
        this.nextAction = reader.getActionType();
        this.attackCount = reader.getNumber();
        const nextAttack = reader.getAttack(this.game, idMap);
        if (nextAttack === undefined)
            this.nextAttack = this.game.normalAttack;
        else
            this.nextAttack = nextAttack;
        this.isAttacking = reader.getBool();
        this.firstHit = reader.getBool();
        reader.skipValues(4); // Dump old effects data. slowCount, curse
        this.timers.act.deserialize(reader.getChunk(3), version);
        this.timers.regen.deserialize(reader.getChunk(3), version);
        for (let i = 0; i < 7; i++) {
            reader.skipVariableLengthChunk(); // Dump old effects data
        }
        if (version >= 7) {
            this.manager.deserializePassives(reader.getVariableLengthChunk(), version, idMap);
            this.turnsTaken = reader.getNumber();
            reader.skipVariableLengthChunk(); // Dump old effects data
        }
        if (nextAttack === undefined) {
            this.attackCount = 0;
            this.isAttacking = false;
        }
    }
    /** Computes sources of CombatEffects outside of special attacks */
    computeEffectApplicators() {
        this.effectApplicators.clear();
        this.mergeInheritedEffectApplicators();
        this.mergeUninheritedEffectApplicators();
    }
    /** Merges effect applicators common to all sub-classes */
    mergeInheritedEffectApplicators() {
        this.activeEffects.forEach((activeEffect) => {
            activeEffect.mergeAllApplicators();
        });
        // Attack Spell
        if (this.attackType === 'magic') {
            const spell = this.spellSelection.attack;
            if ((spell === null || spell === void 0 ? void 0 : spell.combatEffects) !== undefined)
                this.mergeEffectApplicators(spell.combatEffects);
        }
        // Aurora Spells
        const aurora = this.spellSelection.aurora;
        if (this.canAurora && aurora !== undefined && aurora.stats.combatEffects !== undefined) {
            this.mergeEffectApplicators(aurora.stats.combatEffects);
        }
    }
    /** Checks for removed effect applicators that have the removeEffectWhenRemove property */
    checkEffectApplicators() {
        if (this.manager.fightInProgress)
            this.processEffectApplicators(this.effectApplicatorsToProcess, {
                type: 'Other'
            });
        this.effectApplicatorsToProcess = [];
    }
}
Character.numberExprTranspiler = expressions.getCharacterNumberTranspiler();
class SpellSelection {
    constructor(game) {
        this.game = game;
    }
    encode(writer) {
        writer.writeBoolean(this.attack !== undefined);
        if (this.attack)
            writer.writeNamespacedObject(this.attack);
        writer.writeBoolean(this.aurora !== undefined);
        if (this.aurora)
            writer.writeNamespacedObject(this.aurora);
        writer.writeBoolean(this.curse !== undefined);
        if (this.curse)
            writer.writeNamespacedObject(this.curse);
        return writer;
    }
    decode(reader, version) {
        if (version >= 112 /* SaveVersion.AttackSpellbooks */ ) {
            if (reader.getBoolean()) {
                const spell = reader.getNamespacedObject(this.game.attackSpells);
                if (typeof spell !== 'string')
                    this.attack = spell;
            }
        } else {
            if (reader.getBoolean()) {
                const spell = reader.getNamespacedObject(this.game.attackSpells);
                if (typeof spell !== 'string')
                    this.attack = spell;
            }
            if (reader.getBoolean()) {
                const ancient = reader.getNamespacedObject(this.game.attackSpells);
                if (typeof ancient !== 'string')
                    this.attack = ancient;
            }
        }
        if (reader.getBoolean()) {
            const aurora = reader.getNamespacedObject(this.game.auroraSpells);
            if (typeof aurora !== 'string')
                this.aurora = aurora;
        }
        if (reader.getBoolean()) {
            const curse = reader.getNamespacedObject(this.game.curseSpells);
            if (typeof curse !== 'string')
                this.curse = curse;
        }
        if (version >= 23 && version < 112 /* SaveVersion.AttackSpellbooks */ ) {
            if (reader.getBoolean()) {
                const archaic = reader.getNamespacedObject(this.game.attackSpells);
                if (typeof archaic !== 'string')
                    this.attack = archaic;
            }
        }
        if (version >= 101 /* SaveVersion.AbyssalSpells */ && version < 112 /* SaveVersion.AttackSpellbooks */ ) {
            if (reader.getBoolean()) {
                const abyssal = reader.getNamespacedObject(this.game.attackSpells);
                if (typeof abyssal !== 'string')
                    this.attack = abyssal;
            }
        }
        this.validate();
    }
    validate() {
        if (this.attack === undefined) {
            this.attack = this.game.attackSpells.firstObject;
        }
    }
}
class EquipmentStats {
    constructor(stats) {
        this.attackSpeed = 0;
        this.stabAttackBonus = 0;
        this.slashAttackBonus = 0;
        this.blockAttackBonus = 0;
        this.rangedAttackBonus = 0;
        this.magicAttackBonus = 0;
        this.meleeStrengthBonus = 0;
        this.rangedStrengthBonus = 0;
        this.magicDamageBonus = 0;
        this.meleeDefenceBonus = 0;
        this.rangedDefenceBonus = 0;
        this.magicDefenceBonus = 0;
        this.summoningMaxHit = new SparseNumericMap();
        this.resistances = new SparseNumericMap();
        if (stats !== undefined)
            this.addStats(stats);
    }
    /** @deprecated Use resistances instead */
    get damageReduction() {
        return this.getResistance(game.normalDamage);
    }
    addItemStats(item) {
        this.addStats(item.equipmentStats);
    }
    remItemStats(item) {
        this.subtractStats(item.equipmentStats);
    }
    addStats(stats) {
        stats.forEach((stat) => {
            switch (stat.key) {
                case 'resistance':
                    this.resistances.add(stat.damageType, stat.value);
                    break;
                case 'summoningMaxhit':
                    this.summoningMaxHit.add(stat.damageType, this.adjustSummoningMaxHit(stat.value));
                    break;
                default:
                    this[stat.key] += stat.value;
                    break;
            }
        });
    }
    subtractStats(stats) {
        stats.forEach((stat) => {
            switch (stat.key) {
                case 'resistance':
                    this.resistances.sub(stat.damageType, stat.value);
                    break;
                case 'summoningMaxhit':
                    this.summoningMaxHit.sub(stat.damageType, this.adjustSummoningMaxHit(stat.value));
                    break;
                default:
                    this[stat.key] -= stat.value;
                    break;
            }
        });
    }
    adjustSummoningMaxHit(value) {
        return Math.round(value * numberMultiplier);
    }
    getResistance(damageType) {
        return this.resistances.get(damageType);
    }
    getSummoningMaxHit(damageType) {
        return this.summoningMaxHit.get(damageType);
    }
    resetStats() {
        this.attackSpeed = 0;
        this.stabAttackBonus = 0;
        this.slashAttackBonus = 0;
        this.blockAttackBonus = 0;
        this.rangedAttackBonus = 0;
        this.magicAttackBonus = 0;
        this.meleeStrengthBonus = 0;
        this.rangedStrengthBonus = 0;
        this.magicDamageBonus = 0;
        this.meleeDefenceBonus = 0;
        this.rangedDefenceBonus = 0;
        this.magicDefenceBonus = 0;
        this.resistances.clear();
        this.summoningMaxHit.clear();
    }
}
class DamageType extends NamespacedObject {
    constructor(namespace, data, game) {
        var _a;
        super(namespace, data.id);
        this.onlyShowIfUsing = false;
        this.immuneTo = new Set();
        try {
            this._name = data.name;
            this._media = data.media;
            this._resistanceName = data.resistanceName;
            this._resistanceCap = data.resistanceCap;
            if (data.immuneTo !== undefined) {
                this.immuneTo = game.damageTypes.getSetFromIds(data.immuneTo);
            }
            this.spanClass = data.spanClass;
            this.onlyShowIfUsing = (_a = data.onlyShowIfUsing) !== null && _a !== void 0 ? _a : false;
            this.modQuery = new ModifierQuery({
                damageType: this
            });
        } catch (e) {
            throw new DataConstructionError(DamageType.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`DAMAGE_TYPE_${this.localID}`);
        }
    }
    get resistanceName() {
        if (this.isModded) {
            return this._resistanceName;
        } else {
            return getLangString(`DAMAGE_TYPE_RESISTANCE_${this.localID}`);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get resistancCap() {
        return this._resistanceCap;
    }
    applyDataModification(modData, game) {
        if (modData.resistanceCap !== undefined)
            this._resistanceCap = modData.resistanceCap;
        if (modData.immuneTo !== undefined) {
            if (modData.immuneTo.remove !== undefined) {
                modData.immuneTo.remove.forEach((id) => {
                    const damageType = game.damageTypes.getObjectByID(id);
                    if (damageType === undefined)
                        throw new Error(`Error modifying Damage Type immunity with id: ${this.id}, damage type with ${id} is not registered.`);
                    this.immuneTo.delete(damageType);
                });
            }
            if (modData.immuneTo.add !== undefined) {
                modData.immuneTo.add.forEach((id) => {
                    const damageType = game.damageTypes.getObjectByID(id);
                    if (damageType === undefined)
                        throw new Error(`Error modifying Damage Type immunity with id: ${this.id}, damage type with ${id} is not registered.`);
                    this.immuneTo.add(damageType);
                });
            }
        }
    }
}
class CharacterCombatStats {
    constructor(character) {
        this.character = character;
        // Private backing fields for all stats
        this._evasion = {
            melee: 0,
            ranged: 0,
            magic: 0,
        };
        this._averageEvasion = 0;
        this._maxEvasion = 0;
        this._minHit = 0;
        this._maxHit = 0;
        this._accuracy = 0;
        this._maxHitpoints = 1;
        this._attackInterval = 0;
        this._maxBarrier = 0;
        this._hitChance = 0;
        this._resistances = new Map();
        /** Flags if these stats need to be re-calculated when getting a value */
        this._dirty = false;
    }
    get maxHitpoints() {
        this.dirtyCheck();
        return this._maxHitpoints;
    }
    set maxHitpoints(value) {
        this._maxHitpoints = value;
    }
    get attackInterval() {
        this.dirtyCheck();
        return this._attackInterval;
    }
    set attackInterval(value) {
        this._attackInterval = value;
    }
    get accuracy() {
        this.dirtyCheck();
        return this._accuracy;
    }
    set accuracy(value) {
        this._accuracy = value;
    }
    get evasion() {
        this.dirtyCheck();
        return this._evasion;
    }
    get averageEvasion() {
        this.dirtyCheck();
        return this._averageEvasion;
    }
    set averageEvasion(value) {
        this._averageEvasion = value;
    }
    get maxEvasion() {
        this.dirtyCheck();
        return this._maxEvasion;
    }
    set maxEvasion(value) {
        this._maxEvasion = value;
    }
    get maxHit() {
        this.dirtyCheck();
        return this._maxHit;
    }
    set maxHit(value) {
        this._maxHit = value;
    }
    get minHit() {
        this.dirtyCheck();
        return this._minHit;
    }
    set minHit(value) {
        this._minHit = value;
    }
    get maxBarrier() {
        this.dirtyCheck();
        return this._maxBarrier;
    }
    set maxBarrier(value) {
        this._maxBarrier = value;
    }
    get hitChance() {
        this.dirtyCheck();
        return this._hitChance;
    }
    set hitChance(value) {
        this._hitChance = value;
    }
    get dirty() {
        return this._dirty;
    }
    setDirty() {
        this._dirty = true;
    }
    getResistance(damageType) {
        var _a;
        this.dirtyCheck();
        return (_a = this._resistances.get(damageType)) !== null && _a !== void 0 ? _a : 0;
    }
    getResistanceByID(damageTypeID) {
        this.dirtyCheck();
        const damageType = game.damageTypes.getObjectByID(damageTypeID);
        if (damageType === undefined)
            throw new Error(`Invalid damage type with id: ${damageTypeID}`);
        return this.getResistance(damageType);
    }
    setResistance(damageType, resistance) {
        this._resistances.set(damageType, resistance);
    }
    dirtyCheck() {
        if (this._dirty)
            this.update();
    }
    update() {
        this._dirty = false;
        this.character.computeCombatStats();
    }
    getValueTable() {
        const valueTable = [];
        valueTable.push({
            name: 'Melee Evasion',
            value: this.evasion.melee,
        });
        valueTable.push({
            name: 'Ranged Evasion',
            value: this.evasion.ranged,
        });
        valueTable.push({
            name: 'Magic Evasion',
            value: this.evasion.magic,
        });
        valueTable.push({
            name: 'Min Hit',
            value: this.minHit,
        });
        valueTable.push({
            name: 'Max Hit',
            value: this.maxHit,
        });
        valueTable.push({
            name: 'Accuracy',
            value: this.accuracy,
        });
        valueTable.push({
            name: 'Max HP',
            value: this.maxHitpoints,
        });
        valueTable.push({
            name: 'Attack Interval',
            value: this.attackInterval,
        });
        this._resistances.forEach((value, damageType) => {
            valueTable.push({
                name: damageType.resistanceName,
                value,
            });
        });
        return valueTable;
    }
}
class CharacterRenderQueue {
    constructor() {
        this.stats = false;
        this.hitChance = false;
        this.hitpoints = false;
        this.damageSplash = false;
        this.effects = false;
        this.attackBar = false;
        this.attackBarMinibar = false;
        this.attacks = false;
        this.passives = false;
        this.damageValues = false;
        this.barrier = false;
    }
}
//# sourceMappingURL=character.js.map
checkFileVersion('?12097')