"use strict";
class PlayerCombatStats extends CharacterCombatStats {
    constructor(player) {
        super(player);
        this._canSummonAttack = false;
        this._summoningMaxHit = 0;
        this._barrierDamage = 0;
    }
    /** If the player can currently attack with summons */
    get canSummonAttack() {
        this.dirtyCheck();
        return this._canSummonAttack;
    }
    set canSummonAttack(value) {
        this._canSummonAttack = value;
    }
    get summoningMaxHit() {
        this.dirtyCheck();
        return this._summoningMaxHit;
    }
    set summoningMaxHit(value) {
        this._summoningMaxHit = value;
    }
    get barrierDamage() {
        this.dirtyCheck();
        return this._barrierDamage;
    }
    set barrierDamage(value) {
        this._barrierDamage = value;
    }
    getValueTable() {
        const valueTable = super.getValueTable();
        valueTable.push({
            name: 'Summoning Max Hit',
            value: this.summoningMaxHit,
        });
        valueTable.push({
            name: 'Barrier Damage',
            value: this.barrierDamage,
        });
        return valueTable;
    }
}
class Player extends Character {
    constructor(manager, game) {
        super(manager, game);
        this.manager = manager;
        /* #region GameEventEmitter Boilerplate */
        this._events = mitt();
        this.on = this._events.on;
        this.off = this._events.off;
        // Properties that need to be saved
        this.equipmentSets = [];
        this.selectedEquipmentSet = 0;
        /** Current multiplier for unholy prayer modifiers */
        this.unholyPrayerMultiplier = 0;
        this.food = new EquippedFood(3, this.game);
        this.attackStyles = {};
        // Properties that can be derived from saved properties
        this.equipToSet = 0;
        this.modifiers = new PlayerModifierTable();
        this.runesProvided = new Map();
        this.prayerPoints = 0;
        this.soulPoints = 0;
        this.target = this;
        this.stats = new PlayerCombatStats(this);
        this.eatTimeout = -1;
        this.allowToEatFromTimeout = false; //used to determine whether or not hold to eat has been cancelled (Stops double eating)
        this.renderQueue = new PlayerRenderQueue();
        this.activeItemSynergies = new Set();
        this._pets = 0;
        this.baseSpawnInterval = 3000;
        /** The array of event unassigners for events that consume resources based on current equipment */
        this.equipmentEventUnassigners = [];
        this.summoningSynergyEventUnassigners = [];
        this.hitpoints = numberMultiplier * 10;
        this.timers = {
            act: new Timer('Act', () => this.act()),
            regen: new Timer('Regen', () => this.regen()),
            summon: new Timer('Summon', () => this.summonAttack()),
        };
        this.timers.regen.start(this.hpRegenInterval);
        this.assignEffectApplicatorListeners();
    }
    /* #endregion */
    get type() {
        return 'Player';
    }
    get activePrayers() {
        return this.equipmentSets[this.selectedEquipmentSet].prayerSelection;
    }
    get statElements() {
        return playerHTMLElements;
    }
    get splashManager() {
        return combatMenus.playerSplashManager;
    }
    get effectRenderer() {
        return combatMenus.playerEffectRenderer;
    }
    get attackBar() {
        return combatMenus.progressBars.playerAttack;
    }
    get attackBarMinibar() {
        return combatMenus.progressBars.playerAttackMinibar;
    }
    get summonBar() {
        return combatMenus.progressBars.playerSummon;
    }
    get summonBarMinibar() {
        return combatMenus.progressBars.playerSummonMinibar;
    }
    get summonAttackInterval() {
        let interval = 3000;
        interval *= 1 + this.modifiers.summoningAttackInterval / 100;
        interval += this.modifiers.flatSummoningAttackInterval;
        interval = roundToTickInterval(interval);
        return Math.max(interval, 250);
    }
    get equipment() {
        return this.equipmentSets[this.selectedEquipmentSet].equipment;
    }
    /** Gets the equipment for the "Equip to Set" */
    get equipToSetEquipment() {
        return this.equipmentSets[this.equipToSet].equipment;
    }
    get spellSelection() {
        return this.equipmentSets[this.selectedEquipmentSet].spellSelection;
    }
    get attackStyle() {
        return this.attackStyles[this.attackType];
    }
    /** Player automatically eats below this HP */
    get autoEatThreshold() {
        let percent = this.modifiers.autoEatThreshold;
        percent = Math.min(100, percent);
        return (this.stats.maxHitpoints * percent) / 100;
    }
    /** Player automatically eats to this HP */
    get autoEatHPLimit() {
        let percent = this.modifiers.autoEatHPLimit;
        percent = Math.min(100, percent);
        return (this.stats.maxHitpoints * percent) / 100;
    }
    /** Player automatically eats food at this efficiency */
    get autoEatEfficiency() {
        const percent = this.modifiers.autoEatEfficiency;
        return Math.max(percent, 1);
    }
    /** Returns a description of the current synergy */
    get synergyDescription() {
        const synergy = this.equippedSummoningSynergy;
        if (synergy !== undefined) {
            if (this.game.summoning.isSynergyUnlocked(synergy)) {
                return synergy.description;
            } else {
                return getLangString('MENU_TEXT_LOCKED');
            }
        } else {
            return '';
        }
    }
    get numEquipSets() {
        return Math.max(this.modifiers.equipmentSets + 1, 1);
    }
    /** Modified max cost of all active prayers */
    get maxPrayerCost() {
        let max = 0;
        this.activePrayers.forEach((prayer) => {
            max = Math.max(max, this.computePrayerMaxCost(prayer));
        });
        return max;
    }
    /** Modified max cost of all active prayers using soul points */
    get maxSoulPointCost() {
        let max = 0;
        this.activePrayers.forEach((prayer) => {
            max = Math.max(max, this.computeSoulPointMaxCost(prayer));
        });
        return max;
    }
    get pets() {
        return this._pets;
    }
    set pets(value) {
        this._pets = value;
        if (this._pets % 95 === 0) {
            this.manager.bank.addItemByID("melvorD:Cool_Glasses" /* ItemIDs.Cool_Glasses */ , 1, true, true);
        }
    }
    /** If the player should use combination runes for spellcasting */
    get useCombinationRunes() {
        return this.game.settings.useCombinationRunes;
    }
    get allowRegen() {
        return this.game.currentGamemode.hasRegen && this.modifiers.disableHPRegeneration < 1;
    }
    get addItemsToBankOnLoadFail() {
        return true;
    }
    setDefaultEquipmentSets() {
        this.equipmentSets.push(new EquipmentSet(this.game));
    }
    setDefaultAttackStyles() {
        this.attackStyles.melee = this.game.attackStyles.find((style) => style.attackType === 'melee');
        this.attackStyles.ranged = this.game.attackStyles.find((style) => style.attackType === 'ranged');
        this.attackStyles.magic = this.game.attackStyles.find((style) => style.attackType === 'magic');
    }
    setCallbacks() {
        combatMenus.combatFood.setCallbacks(this);
        combatMenus.thievingFood.setCallbacks(this);
        this.setAttackStyleButtonCallbacks();
    }
    setRenderAll() {
        super.setRenderAll();
        this.renderQueue.prayerPoints = true;
        this.renderQueue.prayerSelection = true;
        this.renderQueue.attackSpellSelection = true;
        this.renderQueue.curseSelection = true;
        this.renderQueue.auroraSelection = true;
        this.renderQueue.attackStyle = true;
        this.renderQueue.equipment = true;
        this.renderQueue.food = true;
        this.renderQueue.combatLevel = true;
        this.renderQueue.summonBar = true;
        this.renderQueue.summonBarMinibar = true;
        this.renderQueue.attacks = true;
        this.renderQueue.equipmentSets = true;
        this.renderQueue.runesUsed = true;
        this.renderQueue.autoEat = true;
        this.renderQueue.combatTriangle = true;
        this.renderQueue.levels = true;
        this.renderQueue.soulPoints = true;
    }
    activeTick() {
        super.activeTick();
        this.timers.summon.tick();
    }
    getErrorLog() {
        let log = super.getErrorLog();
        log += `\nActive Prayers:`;
        if (this.activePrayers.size) {
            this.activePrayers.forEach((prayer) => {
                log += `${prayer.id}, `;
            });
        } else {
            log += ' None';
        }
        log += '\nEquipped Food:';
        this.food.slots.forEach((slot) => {
            if (slot.item !== this.game.emptyFoodItem)
                log += `\nItem: ${slot.item.id}, Qty: ${slot.quantity}`;
        });
        return log;
    }
    queueNextAction(noSpec, tickOffset) {
        super.queueNextAction(noSpec, tickOffset);
        // Check if the player is starting to attack and has no map charges. If so, stop combat.
        if (this.turnsTaken !== 0 &&
            this.nextAction === 'Attack' &&
            !this.isAttacking &&
            this.manager.shouldStopOnPlayerAttack())
            this.manager.stop();
    }
    getMonsterSpawnTime() {
        let spawnTime = this.baseSpawnInterval;
        spawnTime += this.modifiers.flatMonsterRespawnInterval;
        return Math.max(spawnTime, 250);
    }
    isEquipmentSlotUnlocked(slot) {
        return this.game.checkRequirements(slot.requirements);
    }
    /** Returns true if the given item is equipped in any equipment set */
    checkEquipmentSetsForItem(item) {
        return this.equipmentSets.some(({
            equipment
        }) => equipment.checkForItem(item));
    }
    /** Checks and unequips items that the player does not meet the requirements for */
    checkEquipmentRequirements() {
        const itemsToAdd = new Map();
        this.equipmentSets.forEach(({
            equipment
        }) => {
            const slotsToRemove = [];
            equipment.equippedArray.forEach((equippedItem) => {
                var _a;
                if (equippedItem.providesStats) {
                    if (!this.game.checkRequirements(equippedItem.item.equipRequirements) ||
                        !equippedItem.item.fitsInSlot(equippedItem.slot.id)) {
                        itemsToAdd.set(equippedItem.item, ((_a = itemsToAdd.get(equippedItem.item)) !== null && _a !== void 0 ? _a : 0) + equippedItem.quantity);
                        slotsToRemove.push(equippedItem.slot);
                        if (this.game.activeAction === this.game.thieving || this.game.activeAction === this.game.combat)
                            this.manager.giveFreeDeath = true;
                    }
                }
            });
            slotsToRemove.forEach((slotType) => equipment.unequipItem(slotType));
        });
        itemsToAdd.forEach((quantity, item) => {
            this.game.bank.addItem(item, quantity, false, false, false, true, `Game.Unequip`);
        });
        if (itemsToAdd.size > 0) {
            this.updateForEquipmentChange();
            this.updateForEquipSetChange();
        }
    }
    modifyResistance(damageType, resistance) {
        // Player Specific flat modifiers
        if (this.manager.fightInProgress) {
            if (this.manager.enemy.isBoss) {
                resistance += this.modifiers.getValue("melvorD:flatResistanceAgainstBosses" /* ModifierIDs.flatResistanceAgainstBosses */ , damageType.modQuery);
            }
        }
        if (this.manager.onSlayerTask) {
            resistance += this.modifiers.getValue("melvorD:flatResistanceAgainstSlayerTasks" /* ModifierIDs.flatResistanceAgainstSlayerTasks */ , damageType.modQuery);
        }
        if (this.attackType === 'magic' && this.equipment.isWeapon2H) {
            resistance += this.modifiers.getValue("melvorD:flatResistanceWithMagic2HWeapon" /* ModifierIDs.flatResistanceWithMagic2HWeapon */ , damageType.modQuery);
        }
        resistance +=
            this.modifiers.getValue("melvorD:flatResistancePer30Defence" /* ModifierIDs.flatResistancePer30Defence */ , damageType.modQuery) *
            Math.floor(this.levels.Defence / 30);
        if (this.activePrayers.size > 0) {
            resistance += this.modifiers.getValue("melvorD:flatResistanceWithActivePrayer" /* ModifierIDs.flatResistanceWithActivePrayer */ , damageType.modQuery);
        }
        resistance = super.modifyResistance(damageType, resistance);
        if (this.manager.fightInProgress)
            resistance *= this.manager.combatTriangle.reductionModifier[this.attackType][this.target.attackType];
        return resistance;
    }
    computePreConditionalStats() {
        super.computePreConditionalStats();
        this.computeSpellModifierQuery();
        this.computeItemSynergies();
        this.computeSummoningSynergy();
    }
    computePostModifierStats() {
        var _a;
        super.computePostModifierStats();
        this.computeRuneProvision();
        this.updateEquipmentSets();
        this.game.mining.updateAllRockMaxHPs();
        (_a = this.game.harvesting) === null || _a === void 0 ? void 0 : _a.updateAllVeinMaxIntensity();
    }
    computeCombatStats() {
        this.computeSummonMaxHit();
        super.computeCombatStats();
        this.renderQueue.autoEat = true;
    }
    /** Resets the attack spell selection to the first valid spell that can be used with the current damage type */
    resetAttackSpell() {
        let attackSpell;
        this.game.attackSpellbooks.some((book) => {
            if (!book.canUseWithDamageType(this.damageType))
                return false;
            attackSpell = book.spells.find((spell) => {
                return this.canUseCombatSpell(spell);
            });
            return attackSpell !== undefined;
        });
        this.spellSelection.attack = attackSpell;
        this.renderQueue.attackSpellSelection = true;
        this.renderQueue.runesUsed = true;
        this.computeSpellModifierQuery();
    }
    /** Checks the usage of combat spells and disables them if they are not usable */
    checkMagicUsage() {
        // Validate standard, ancient and archaic spells for required items
        const spell = this.spellSelection.attack;
        if (spell !== undefined &&
            ((spell.requiredItem !== undefined && !this.equipment.checkForItem(spell.requiredItem)) ||
                !spell.spellbook.canUseWithDamageType(this.damageType)))
            this.resetAttackSpell();
        // Validate auroras and curses for required items and primary spell/modifiers
        if (this.attackType === 'magic') {
            const spell = this.spellSelection.attack;
            if (spell === undefined) {
                this.canCurse = false;
                this.canAurora = false;
            } else {
                this.canCurse = spell.spellbook.allowCurses;
                this.canAurora = spell.spellbook.allowAuroras;
            }
        } else {
            const allowMagic = this.modifiers.allowAttackAugmentingMagic > 0;
            this.canCurse = allowMagic || this.modifiers.allowNonMagicCurses > 0;
            this.canAurora = allowMagic;
        }
        const curse = this.spellSelection.curse;
        if (curse !== undefined &&
            (!this.canCurse || (curse.requiredItem !== undefined && !this.equipment.checkForItem(curse.requiredItem)))) {
            this.spellSelection.curse = undefined;
            this.renderQueue.curseSelection = true;
            this.renderQueue.runesUsed = true;
        }
        const aurora = this.spellSelection.aurora;
        if (aurora !== undefined &&
            (!this.canAurora || (aurora.requiredItem !== undefined && !this.equipment.checkForItem(aurora.requiredItem)))) {
            this.spellSelection.aurora = undefined;
            this.renderQueue.auroraSelection = true;
            this.renderQueue.runesUsed = true;
        }
    }
    computeLevels() {
        const getEffectiveLevel = (skill) => {
            return skill.level + this.modifiers.getHiddenSkillLevels(skill);
        };
        this.levels.Hitpoints = getEffectiveLevel(this.game.hitpoints);
        this.levels.Attack = getEffectiveLevel(this.game.attack);
        this.levels.Strength = getEffectiveLevel(this.game.strength);
        this.levels.Defence = getEffectiveLevel(this.game.defence);
        this.levels.Ranged = getEffectiveLevel(this.game.ranged);
        this.levels.Magic = getEffectiveLevel(this.game.altMagic);
        this.levels.Prayer = getEffectiveLevel(this.game.prayer);
        this.levels.Corruption = 0;
    }
    computeAbyssalLevels() {
        var _a, _b;
        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            this.abyssalLevels.Hitpoints = this.game.hitpoints.abyssalLevel;
            this.abyssalLevels.Attack = this.game.attack.abyssalLevel;
            this.abyssalLevels.Strength = this.game.strength.abyssalLevel;
            this.abyssalLevels.Defence = this.game.defence.abyssalLevel;
            this.abyssalLevels.Ranged = this.game.ranged.abyssalLevel;
            this.abyssalLevels.Magic = this.game.altMagic.abyssalLevel;
            this.abyssalLevels.Prayer = this.game.prayer.abyssalLevel;
            this.abyssalLevels.Corruption = (_b = (_a = this.game.corruption) === null || _a === void 0 ? void 0 : _a.abyssalLevel) !== null && _b !== void 0 ? _b : 0;
        }
    }
    getAccuracyValues() {
        var _a;
        let effectiveLevel = 0;
        let accuracyBonus = 0;
        let twoHandModifier = 1;
        let modifier = 0;
        if (this.equipment.isWeapon2H)
            twoHandModifier = 2;
        switch (this.attackType) {
            case 'melee':
                effectiveLevel = this.levels.Attack;
                if (this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ || this.damageType.id === "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ )
                    effectiveLevel += this.abyssalLevels.Attack;
                switch ((_a = this.attackStyles.melee) === null || _a === void 0 ? void 0 : _a.id) {
                    case "melvorD:Stab" /* AttackStyleIDs.Stab */ :
                        accuracyBonus = this.equipmentStats.stabAttackBonus + this.modifiers.flatStabAttackBonus;
                        break;
                    case "melvorD:Block" /* AttackStyleIDs.Block */ :
                        accuracyBonus = this.equipmentStats.blockAttackBonus + this.modifiers.flatBlockAttackBonus;
                        break;
                    case "melvorD:Slash" /* AttackStyleIDs.Slash */ :
                        accuracyBonus = this.equipmentStats.slashAttackBonus + this.modifiers.flatSlashAttackBonus;
                        modifier += this.modifiers.slashAttackBonus;
                        break;
                }
                accuracyBonus +=
                    this.modifiers.flatMeleeAccuracyBonusPerAttackInterval *
                    Math.floor(this.stats.attackInterval / 100) *
                    twoHandModifier;
                break;
            case 'magic':
                effectiveLevel = this.levels.Magic;
                if (this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ || this.damageType.id === "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ )
                    effectiveLevel += this.abyssalLevels.Magic;
                accuracyBonus = this.equipmentStats.magicAttackBonus + this.modifiers.flatMagicAttackBonus;
                accuracyBonus +=
                    this.modifiers.flatMagicAccuracyBonusPerAttackInterval *
                    Math.floor(this.stats.attackInterval / 100) *
                    twoHandModifier;
                break;
            case 'ranged':
                effectiveLevel = this.levels.Ranged;
                if (this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ || this.damageType.id === "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ )
                    effectiveLevel += this.abyssalLevels.Ranged;
                accuracyBonus = this.equipmentStats.rangedAttackBonus + this.modifiers.flatRangedAttackBonus;
                if (this.manager.fightInProgress) {
                    if (this.equipment.getItemInSlot("melvorD:Weapon" /* EquipmentSlotIDs.Weapon */ ).id === "melvorF:Stormsnap" /* ItemIDs.Stormsnap */ ) {
                        accuracyBonus += Math.floor(124 * (1 + (this.target.levels.Magic * 6) / 5500));
                    }
                }
                accuracyBonus +=
                    this.modifiers.flatRangedAccuracyBonusPerAttackInterval *
                    Math.floor(this.stats.attackInterval / 100) *
                    twoHandModifier;
                break;
            default:
                throw new Error(`Invalid attacktype set: ${this.attackType}`);
        }
        accuracyBonus = applyModifier(accuracyBonus, modifier);
        return {
            effectiveLevel: effectiveLevel,
            bonus: accuracyBonus,
        };
    }
    computeAttackSelection() {
        this.renderQueue.attacks = true;
        this.renderQueue.runesUsed = true;
        if (this.modifiers.disabledSpecialAttacks) {
            this.availableAttacks = [{
                attack: this.game.normalAttack,
                chance: 100,
            }, ];
            return;
        }
        if (this.attackType === 'magic') {
            const spell = this.spellSelection.attack;
            if (spell !== undefined && spell.specialAttack !== undefined) {
                this.availableAttacks = [{
                    attack: spell.specialAttack,
                    chance: 100,
                }, ];
                return;
            }
        }
        this.availableAttacks = [];
        this.equipment.equippedArray.forEach((equipped) => {
            if (!equipped.providesStats)
                return;
            this.getSlotAttacks(equipped).forEach((attack, id) => {
                if (attack.attackTypes === undefined || attack.attackTypes.has(this.attackType)) {
                    let chance = attack.defaultChance;
                    if (equipped.item.overrideSpecialChances !== undefined)
                        chance = equipped.item.overrideSpecialChances[id];
                    this.availableAttacks.push({
                        attack: attack,
                        chance: chance,
                    });
                }
            });
        });
        const totalChance = this.availableAttacks.reduce((prev, attack) => {
            return prev + attack.chance;
        }, 0);
        if (totalChance < 100) {
            this.availableAttacks.push({
                attack: this.game.normalAttack,
                chance: 100 - totalChance,
            });
        } else if (totalChance > 100) {
            const ratio = 100 / totalChance;
            this.availableAttacks.forEach((attack) => (attack.chance *= ratio));
        }
    }
    mergeInheritedEffectApplicators() {
        super.mergeInheritedEffectApplicators();
        // Stat Providers
        this.manager.statProviders.forEach((provider) => {
            if (provider.combatEffects !== undefined)
                this.mergeEffectApplicators(provider.combatEffects);
        });
        // Equipment
        this.equipment.equippedArray.forEach((equipped) => {
            if (!equipped.providesStats || equipped.item.combatEffects === undefined)
                return;
            this.mergeEffectApplicators(equipped.item.combatEffects);
        });
        // Food
        const item = this.food.currentSlot.item;
        if (item.stats.combatEffects !== undefined)
            this.mergeEffectApplicators(item.stats.combatEffects);
        // Attack Styles
        if (this.attackStyle !== undefined && this.attackStyle.stats.combatEffects !== undefined)
            this.mergeEffectApplicators(this.attackStyle.stats.combatEffects);
        // Item Synergies
        this.activeItemSynergies.forEach((synergy) => {
            if (synergy.combatEffects !== undefined)
                this.mergeEffectApplicators(synergy.combatEffects);
        });
        // Prayers. TODO_MR: This should apply scaling with unholy prayer multiplier
        this.activePrayers.forEach((_, prayer) => {
            if (prayer.stats.combatEffects !== undefined)
                this.mergeEffectApplicators(prayer.stats.combatEffects);
        });
        // Combat Passives
        this.manager.activeCombatPassives.forEach((_, passive) => {
            if (passive.combatEffects !== undefined)
                this.mergeEffectApplicators(passive.combatEffects);
        });
    }
    mergeUninheritedEffectApplicators() {
        var _a;
        // Summoning Synergies
        if (((_a = this.activeSummoningSynergy) === null || _a === void 0 ? void 0 : _a.combatEffects) !== undefined)
            this.mergeEffectApplicators(this.activeSummoningSynergy.combatEffects);
        // Gamemode
        if (this.game.currentGamemode.playerCombatEffects !== undefined)
            this.mergeEffectApplicators(this.game.currentGamemode.playerCombatEffects);
    }
    assignEffectApplicatorListeners() {
        super.assignEffectApplicatorListeners();
        this.on('summonAttack', (e) => {
            if (!e.missed)
                this.onEffectApplicatorTrigger('SummonAttack', {
                    type: 'Other'
                });
        });
    }
    getSlotAttacks(slot) {
        return slot.item.specialAttacks;
    }
    computeRuneProvision() {
        this.runesProvided.clear();
        this.equipment.equippedArray.forEach((equipped) => {
            if (equipped.slot.id !== "melvorD:Passive" /* EquipmentSlotIDs.Passive */ &&
                equipped.providesStats &&
                equipped.item.providedRunes.length > 0) {
                equipped.item.providedRunes.forEach(({
                    item,
                    quantity
                }) => {
                    var _a;
                    quantity *= Math.pow(2, this.modifiers.doubleRuneProvision);
                    const newQuantity = ((_a = this.runesProvided.get(item)) !== null && _a !== void 0 ? _a : 0) + quantity;
                    this.runesProvided.set(item, newQuantity);
                });
            }
        });
    }
    rollToHit(target, attack) {
        return this.manager.areaRequirementsMet && super.rollToHit(target, attack);
    }
    damage(amount, source, thieving = false) {
        super.damage(amount, source);
        if (!thieving) {
            this.addPrayerPointsBasedOnDamage(amount);
            this.manager.addMonsterStat(MonsterStats.DamageDealtToPlayer, amount);
            this.manager.addCombatStat(CombatStats.DamageTaken, amount);
            this.trackArmourStat(ItemStats.DamageTaken, amount);
        }
        if (this.hitpoints > 0) {
            this.autoEat();
            if (this.hitpoints < (this.stats.maxHitpoints * this.modifiers.redemptionThreshold) / 100) {
                this.heal(applyModifier(this.stats.maxHitpoints, this.modifiers.redemptionHealing));
            }
        }
    }
    addPrayerPointsBasedOnDamage(amount) {
        const percent = this.modifiers.damageTakenAddedAsPrayerPoints / numberMultiplier;
        if (percent > 0) {
            this.addPrayerPoints(Math.floor(amount * (percent / 100)));
        }
    }
    addHitpoints(amount) {
        super.addHitpoints(amount);
        this.game.renderQueue.title = true;
    }
    setHitpoints(value) {
        super.setHitpoints(value);
        this.game.renderQueue.title = true;
    }
    autoEat(foodSwapped = false) {
        const foodItem = this.food.currentSlot.item;
        if ((this.hitpoints <= this.autoEatThreshold || foodSwapped) && foodItem !== this.game.emptyFoodItem) {
            const autoEatHealing = Math.floor((this.getFoodHealing(foodItem) * this.autoEatEfficiency) / 100);
            let foodQty = Math.ceil((this.autoEatHPLimit - this.hitpoints) / autoEatHealing);
            foodQty = Math.min(foodQty, this.food.currentSlot.quantity);
            this.eatFood(foodQty, false, this.autoEatEfficiency);
            if (this.food.currentSlot.quantity < 1 &&
                this.modifiers.autoSwapFoodUnlocked > 0 &&
                this.game.settings.enableAutoSwapFood) {
                const nonEmptySlot = this.food.slots.findIndex((slot) => slot.item !== this.game.emptyFoodItem);
                if (nonEmptySlot >= 0) {
                    const oldFood = this.food.currentSlot.item;
                    this.food.setSlot(nonEmptySlot);
                    this.onSelectedFoodChange(oldFood, this.food.currentSlot.item);
                    if (this.hitpoints < this.autoEatHPLimit)
                        this.autoEat(true);
                }
            }
        }
    }
    getRuneCosts(spell) {
        let runeCost = spell.runesRequired;
        const spellCost = [];
        if (this.useCombinationRunes && spell.runesRequiredAlt !== undefined)
            runeCost = spell.runesRequiredAlt;
        let flatModifier = 0;
        if (spell instanceof AttackSpell) {
            flatModifier += this.modifiers.getValue("melvorD:flatAttackSpellRuneCost" /* ModifierIDs.flatAttackSpellRuneCost */ , spell.modQuery);
        }
        runeCost.forEach((cost) => {
            var _a;
            let modifiedQuantity = cost.quantity - ((_a = this.runesProvided.get(cost.item)) !== null && _a !== void 0 ? _a : 0) + flatModifier;
            modifiedQuantity += this.modifiers.getValue("melvorD:flatSpellRuneCost" /* ModifierIDs.flatSpellRuneCost */ , cost.item.modQuery);
            modifiedQuantity = Math.max(1, modifiedQuantity);
            spellCost.push({
                item: cost.item,
                quantity: modifiedQuantity,
            });
        });
        return spellCost;
    }
    castCurseSpell(curse) {
        if (this.target.isEffectActive(curse.effect) || this.target.getEffectIgnoreChance(curse.effect) >= 100)
            return;
        const runeCosts = this.getRuneCosts(curse);
        if (this.manager.bank.checkForItems(runeCosts)) {
            this.consumeRunes(runeCosts);
            super.castCurseSpell(curse);
        } else {
            this.toggleCurse(curse, false);
            this.manager.notifications.add({
                type: 'Player',
                args: [this.game.altMagic, getLangString('TOASTS_RUNES_REQUIRED_CURSE'), 'danger'],
            });
        }
    }
    onMagicAttackFailure() {
        this.manager.notifications.add({
            type: 'Player',
            args: [
                this.game.altMagic,
                getLangString(`TOASTS_${this.useCombinationRunes ? 'NOT_ENOUGH_COMBO_RUNES' : 'NOT_ENOUGH_STANDARD_RUNES'}`),
                'danger',
            ],
        });
    }
    onRangedAttackFailure(quiver) {
        let message;
        if (quiver === this.game.emptyEquipmentItem)
            message = getLangString('TOASTS_NO_AMMO');
        else
            message = getLangString('TOASTS_WRONG_AMMO');
        this.manager.notifications.add({
            type: 'Player',
            args: [this.game.ranged, message, 'danger'],
        });
    }
    rewardForDamage(damage) {
        this.rewardXPAndPetsForDamage(damage);
        this.rewardCurrencyForDamage(damage);
        this.trackWeaponStat(ItemStats.DamageDealt, damage);
    }
    attack(target, attack) {
        let canAttack = true;
        let runeCosts = [];
        const weapon = this.equipment.getItemInSlot("melvorD:Weapon" /* EquipmentSlotIDs.Weapon */ );
        const quiver = this.equipment.getItemInSlot("melvorD:Quiver" /* EquipmentSlotIDs.Quiver */ );
        if (this.attackCount === 0 || (this.attackCount > 0 && this.attackType === 'magic' && attack.usesRunesPerProc)) {
            switch (this.attackType) {
                case 'magic':
                    {
                        const spell = this.spellSelection.attack;
                        if (spell === undefined)
                            throw new Error('No spell is selected.');
                        runeCosts = this.getRuneCosts(spell);
                        if (attack.extraRuneConsumption !== undefined)
                            runeCosts.push(...attack.extraRuneConsumption);
                        if (this.manager.bank.checkForItems(runeCosts)) {
                            this.consumeRunes(runeCosts);
                        } else {
                            canAttack = false;
                            this.onMagicAttackFailure();
                        }
                        break;
                    }
                case 'ranged':
                    {
                        if (weapon.ammoTypeRequired === 4)
                            break;
                        if (weapon.ammoTypeRequired !== quiver.ammoType) {
                            this.onRangedAttackFailure(quiver);
                            canAttack = false;
                        }
                        break;
                    }
            }
        }
        if (this.canAurora && this.spellSelection.aurora !== undefined) {
            const auroraCosts = this.getRuneCosts(this.spellSelection.aurora);
            if (this.manager.bank.checkForItems(auroraCosts)) {
                this.consumeRunes(auroraCosts);
            } else {
                this.toggleAurora(this.spellSelection.aurora, false);
                this.manager.notifications.add({
                    type: 'Player',
                    args: [this.game.altMagic, getLangString('TOASTS_RUNES_REQUIRED_AURORA'), 'danger'],
                });
            }
        }
        let damage = 0;
        if (canAttack)
            damage = super.attack(target, attack);
        else {
            this.isAttacking = false;
            return damage;
        }
        if (damage > 0) {
            this.rewardForDamage(damage);
        }
        // Consume PP after attack so player gets benefit until it runs out
        this.activePrayers.forEach((prayer) => {
            if (this.attackCount === 1 || (attack.usesPrayerPointsPerProc && attack.attackCount > 1) || prayer.isUnholy) {
                !prayer.isAbyssal ?
                    this.consumePrayerPoints(prayer.pointsPerPlayer, prayer.isUnholy) :
                    this.consumeSoulPoints(prayer.pointsPerPlayer);
            }
        });
        // Consume ammo and quiver items post attack, so player gets the benefit until it runs out
        if (this.attackCount === 1) {
            switch (this.attackType) {
                case 'ranged':
                    if (weapon.ammoTypeRequired !== 4)
                        this.consumeAmmo();
                    break;
            }
            let healing = 0;
            this.modifiers.forEachDamageType("melvorD:healingOnAttackBasedOnResistance" /* ModifierIDs.healingOnAttackBasedOnResistance */ , (value, damageType) => {
                healing += (value / 100) * this.stats.getResistance(damageType) * numberMultiplier;
            });
            healing = Math.floor(healing);
            if (healing > 0)
                this.heal(healing);
        }
        return damage;
    }
    lifesteal(attack, damage, flatBonus) {
        const healing = super.lifesteal(attack, damage, flatBonus);
        this.modifiers.forEachCurrency("melvorD:currencyGainFromLifesteal" /* ModifierIDs.currencyGainFromLifesteal */ , (value, currency) => {
            const amountToAdd = ((healing / numberMultiplier) * value) / 100;
            if (amountToAdd > 0)
                this.manager.addCurrency(currency, amountToAdd, 'Lifesteal');
        });
        return healing;
    }
    /**
     * Provides rewards for when a summon attack deals damage
     * @param damage The damage dealt
     * @param isBarrier If the damage was dealt to barrier
     */
    rewardForSummonDamage(damage, isBarrier) {
        this.rewardCurrencyForSummonDamage(damage, isBarrier);
        if (isBarrier)
            this.rewardXPForSummonBarrierDamage(damage);
    }
    /**
     * Applies combat triangle, modifiers and damage reduction to summoning attack damage
     * @param damage The base damage to modify
     * @param isBarrier If this summon attack is damaging barrier
     * @returns The modified damage
     */
    modifySummonAttackDamage(damage, isBarrier) {
        damage = this.applyTriangleToDamage(this.target, damage);
        damage = this.applySummonDamageModifiers(damage, isBarrier);
        if (this.manager.fightInProgress)
            damage *= 1 - this.target.stats.getResistance(game.normalDamage) / 100;
        return Math.floor(damage);
    }
    /** Applies multiplicative and flat damage modifiers to summoning attack damage */
    applySummonDamageModifiers(damage, isBarrier) {
        if (!isBarrier)
            return damage;
        // Apply Multiplicative Bonuses
        let modifier = this.modifiers.barrierSummonDamage;
        if (this.manager.onSlayerTask)
            modifier += this.modifiers.barrierSummonDamageIfSlayerTask;
        damage *= 1 + modifier / 100;
        // Apply Flat Bonuses
        let flatBonus = this.modifiers.flatBarrierSummonDamage;
        switch (this.attackType) {
            case 'melee':
                flatBonus += this.modifiers.flatBarrierSummonDamageMelee;
                break;
            case 'ranged':
                flatBonus += this.modifiers.flatBarrierSummonDamageRanged;
                break;
            case 'magic':
                flatBonus += this.modifiers.flatBarrierSummonDamageMagic;
                break;
        }
        damage += flatBonus * numberMultiplier;
        return damage;
    }
    /** Clamps summoning attack damage to remaining barrier or hitpoints */
    clampSummonAttackDamage(damage, target) {
        if (target.isBarrierActive)
            return Math.min(damage, target.barrier);
        return Math.min(damage, target.hitpoints);
    }
    summonAttack() {
        const event = new PlayerSummonAttackEvent();
        const targetImmune = this.target.isImmuneTo(this) || this.stats.summoningMaxHit === 0;
        if (this.manager.areaRequirementsMet &&
            (this.target.modifiers.cantEvade > 0 || rollPercentage(this.stats.hitChance)) &&
            !targetImmune) {
            const isBarrier = this.target.isBarrierActive;
            let damage = rollInteger(1, this.stats.summoningMaxHit);
            damage = this.modifySummonAttackDamage(damage, isBarrier);
            damage = this.clampSummonAttackDamage(damage, this.target);
            this.target.damage(damage, 'SummonAttack');
            const lifesteal = Math.floor((this.modifiers.summoningAttackLifesteal / 100) * damage);
            if (lifesteal > 0)
                this.heal(lifesteal);
            if (damage > 0)
                this.rewardForSummonDamage(damage, isBarrier);
            event.damage = damage;
        } else {
            this.target.fireMissSplash(targetImmune);
            event.missed = true;
        }
        event.interval = this.timers.summon.maxTicks * TICK_INTERVAL;
        this._events.emit('summonAttack', event);
        this.startSummonAttack();
    }
    startSummonAttack(tickOffset = false) {
        if (!this.stats.canSummonAttack)
            return;
        this.timers.summon.start(this.summonAttackInterval, tickOffset);
        this.renderQueue.summonBar = true;
        this.renderQueue.summonBarMinibar = true;
    }
    postAttack() {
        this.activePrayers.forEach((prayer) => {
            if (prayer.id === "melvorF:Protect_Item" /* PrayerIDs.Protect_Item */ && this.modifiers.freeProtectItem > 0)
                return;
            !prayer.isAbyssal ?
                this.consumePrayerPoints(prayer.pointsPerEnemy, prayer.isUnholy) :
                this.consumeSoulPoints(prayer.pointsPerEnemy);
        });
    }
    onHit() {
        this.manager.addMonsterStat(MonsterStats.HitsFromPlayer);
        this.trackWeaponStat(ItemStats.TotalAttacks);
        // Award Currencies for hitting the enemy
        const currencySource = `OnMonsterBeingHit.${this.manager.enemy.monster !== undefined ? this.manager.enemy.monster.id : 'Unknown'}`;
        const currencyGain = new SparseNumericMap();
        this.modifiers.forEachCurrency("melvorD:flatCurrencyGainOnEnemyHit" /* ModifierIDs.flatCurrencyGainOnEnemyHit */ , (value, currency) => {
            currencyGain.add(currency, value);
        });
        if (this.firstHit && this.manager.enemy.monster !== undefined) {
            const combatLevel = this.manager.enemy.monster.combatLevel;
            this.modifiers.forEachCurrency("melvorD:flatCurrencyGainOnEnemyHitBasedOnCombatLevel" /* ModifierIDs.flatCurrencyGainOnEnemyHitBasedOnCombatLevel */ , (value, currency) => {
                currencyGain.add(currency, value * combatLevel);
            });
        }
        if (this.manager.onSlayerTask) {
            this.modifiers
                .query("melvorD:flatCurrencyGainOnHitOnSlayerTask" /* ModifierIDs.flatCurrencyGainOnHitOnSlayerTask */ , ModifierQuery.ANY_CURRENCY_AND_DAMAGETYPE)
                .forEach((entry) => {
                    currencyGain.add(entry.scope.currency, entry.value * this.target.equipmentStats.getResistance(entry.scope.damageType));
                });
        }
        currencyGain.forEach((amount, currency) => {
            if (amount > 0)
                this.manager.addCurrency(currency, amount, currencySource);
        });
        // Provide healing for hitting the enemy
        if (this.firstHit) {
            let healing = 0;
            this.modifiers.forEachDamageType("melvorD:healingOnHitBasedOnTargetResistance" /* ModifierIDs.healingOnHitBasedOnTargetResistance */ , (value, damageType) => {
                healing += (value * numberMultiplier * this.target.equipmentStats.getResistance(damageType)) / 100;
            });
            healing = Math.floor(healing);
            if (healing > 0)
                this.heal(healing);
        }
    }
    onBeingHit() {
        if (this.target.firstHit) {
            const currencySource = `OnPlayerBeingHit.${this.manager.enemy.monster !== undefined ? this.manager.enemy.monster.id : 'Unknown'}`;
            const currencyGain = new SparseNumericMap();
            this.modifiers
                .query("melvorD:flatCurrencyGainWhenHitBasedOnResistance" /* ModifierIDs.flatCurrencyGainWhenHitBasedOnResistance */ , ModifierQuery.ANY_CURRENCY_AND_DAMAGETYPE)
                .forEach((entry) => {
                    currencyGain.add(entry.scope.currency, entry.value * this.stats.getResistance(entry.scope.damageType));
                });
            currencyGain.forEach((amount, currency) => {
                if (amount > 0)
                    this.manager.addCurrency(currency, amount, currencySource);
            });
        }
        if (this.modifiers.flatPrayerPointsWhenHit > 0)
            this.addPrayerPoints(this.modifiers.flatPrayerPointsWhenHit);
        if (this.modifiers.flatSoulPointsWhenHit > 0)
            this.addSoulPoints(this.modifiers.flatSoulPointsWhenHit);
        super.onBeingHit();
    }
    onMiss() {
        this.manager.addMonsterStat(MonsterStats.PlayerMissed);
        this.trackWeaponStat(ItemStats.MissedAttacks);
        this.manager.addCombatStat(CombatStats.AttacksMissed);
    }
    trackWeaponStat(stat, amount = 1) {
        const weapon = this.equipment.getItemInSlot("melvorD:Weapon" /* EquipmentSlotIDs.Weapon */ );
        const quiver = this.equipment.getItemInSlot("melvorD:Quiver" /* EquipmentSlotIDs.Quiver */ );
        if (weapon !== this.game.emptyEquipmentItem) {
            this.addItemStat(weapon, stat, amount);
        }
        if (this.attackType === 'ranged' && quiver !== this.game.emptyEquipmentItem && quiver !== weapon) {
            this.addItemStat(quiver, stat, amount);
        }
    }
    trackArmourStat(stat, amount = 1) {
        this.equipment.equippedArray.forEach((equipped) => {
            if (equipped.slot.id !== "melvorD:Quiver" /* EquipmentSlotIDs.Quiver */ &&
                equipped.slot.id !== "melvorD:Weapon" /* EquipmentSlotIDs.Weapon */ &&
                equipped.providesStats) {
                this.addItemStat(equipped.item, stat, amount);
            }
        });
    }
    addItemStat(item, stat, amount) {
        this.game.stats.Items.add(item, stat, amount);
    }
    consumeRunes(costs) {
        const event = new RuneConsumptionEvent(costs);
        if (!rollPercentage(this.modifiers.getRunePreservationChance())) {
            this.manager.bank.consumeItems(costs);
            this.trackItemUsage(costs);
            event.preserved = false;
        }
        this._events.emit('runesUsed', event);
    }
    /** Event Handler for item charge use */
    consumeItemCharges(e, item) {
        if (e instanceof CharacterAttackEvent && e.isPlayerMulti)
            return;
        this.game.itemCharges.removeCharges(item, 1);
    }
    /** Event Handler for item quantity use */
    consumeItemQuantities(e, equipped) {
        if (e instanceof CharacterAttackEvent && e.isPlayerMulti)
            return;
        let interval = 0;
        if (e instanceof IntervaledGameEvent)
            interval = e.interval;
        switch (equipped.slot.id) {
            case "melvorD:Summon1" /* EquipmentSlotIDs.Summon1 */ :
            case "melvorD:Summon2" /* EquipmentSlotIDs.Summon2 */ :
                // Summoning Charge Consumption
                this.removeSummonCharge(equipped.slot.id, interval);
                break;
            case "melvorD:Consumable" /* EquipmentSlotIDs.Consumable */ :
                if (rollPercentage(this.getConsumablePreservationChance()))
                    return;
                // fallthrough
            default:
                // Other Slot Consumption
                if (this.equipment.removeQuantityFromSlot(equipped.slot.id, 1)) {
                    this.onUnequipFromQuantityUse();
                }
                this.renderQueue.equipment = true;
                break;
        }
    }
    getConsumablePreservationChance() {
        return clampValue(this.modifiers.consumablePreservationChance, 0, 80);
    }
    /** Event Handler for bank item use */
    consumeBankItem(e, consumption) {
        if (e instanceof CharacterAttackEvent && e.isPlayerMulti)
            return;
        if (this.manager.bank.hasItem(consumption.item) && rollPercentage(consumption.chance)) {
            this.manager.bank.removeItemQuantity(consumption.item, 1, true);
        }
    }
    /** Event Handler for Summoning Synergy tablet usage */
    consumeSynergyTablets(e) {
        let interval = 0;
        if (e instanceof IntervaledGameEvent)
            interval = e.interval;
        this.removeSummonCharge("melvorD:Summon1" /* EquipmentSlotIDs.Summon1 */ , interval);
        this.removeSummonCharge("melvorD:Summon2" /* EquipmentSlotIDs.Summon2 */ , interval);
    }
    removeFromQuiver(qty = 1) {
        if (this.equipment.removeQuantityFromSlot("melvorD:Quiver" /* EquipmentSlotIDs.Quiver */ , qty))
            this.onUnequipFromQuantityUse();
        this.renderQueue.equipment = true;
    }
    consumeAmmo() {
        if (!rollPercentage(this.modifiers.getAmmoPreservationChance())) {
            this.trackItemUsage([{
                item: this.equipment.getItemInSlot("melvorD:Quiver" /* EquipmentSlotIDs.Quiver */ ),
                quantity: 1
            }]);
            this.removeFromQuiver(1);
        }
    }
    trackItemUsage(costs) {
        costs.forEach((cost) => {
            this.addItemStat(cost.item, ItemStats.AmountUsedInCombat, cost.quantity);
        });
    }
    getFlatReflectDamage() {
        const maxRoll = this.modifiers.getFlatReflectDamage() * numberMultiplier;
        return rollInteger(1, maxRoll);
    }
    applyDamageModifiers(target, damage) {
        damage = this.applyTriangleToDamage(target, damage);
        if (this.cantUseDamageModifiers) {
            return damage;
        } else {
            return super.applyDamageModifiers(target, damage);
        }
    }
    applyTriangleToDamage(target, damage) {
        if (this.manager.fightInProgress)
            damage *= this.manager.combatTriangle.damageModifier[this.attackType][target.attackType];
        return damage;
    }
    getDamageModifiers(target) {
        let totalModifier = 0;
        if (this.manager.enemy.isBoss) {
            totalModifier += this.modifiers.damageDealtToBosses;
        }
        if (this.manager.onSlayerTask) {
            totalModifier += this.modifiers.damageDealtToSlayerTasks;
            totalModifier += this.modifiers.getValue("melvorD:damageDealtToDamageTypeSlayerTasks" /* ModifierIDs.damageDealtToDamageTypeSlayerTasks */ , target.damageType.modQuery);
        }
        totalModifier += this.modifiers.getValue("melvorD:damageDealtToMonstersInArea" /* ModifierIDs.damageDealtToMonstersInArea */ , this.manager.areaModQuery);
        totalModifier += this.modifiers.damageDealtToAllMonsters;
        return super.getDamageModifiers(target) + totalModifier;
    }
    quickEquipItem(item, skill) {
        let quantity = this.manager.bank.getQty(item);
        const templateData = {
            itemName: item.name,
            quantity: `${quantity}`
        };
        if (quantity > 0) {
            const slot = item.validSlots[0];
            if (!slot.allowQuantity)
                quantity = 1;
            this.equipItem(item, this.selectedEquipmentSet, undefined, quantity);
            if (this.equipment.checkForItem(item)) {
                if (quantity > 1) {
                    notifyPlayer(skill, templateLangString('TOASTS_ITEM_QTY_EQUIPPED', templateData), 'success');
                } else {
                    notifyPlayer(skill, templateLangString('TOASTS_ITEM_EQUIPPED', templateData), 'success');
                }
            } else
                notifyPlayer(skill, templateLangString('TOASTS_CANT_EQUIP_ITEM', templateData), 'danger');
        } else if (this.equipment.checkForItem(item))
            notifyPlayer(skill, templateLangString('TOASTS_ITEM_ALREADY_EQUIPPED', templateData), 'info');
        else
            notifyPlayer(skill, templateLangString('TOASTS_ITEM_NOT_IN_BANK', templateData), 'danger');
    }
    equipCallback(item, slot, quantity = 1) {
        this.equipItem(item, this.equipToSet, slot, quantity);
    }
    /** Attempts to quick equip the summons in a summoning synergy */
    quickEquipSynergy(synergy) {
        const item1 = synergy.summons[0].product;
        const item2 = synergy.summons[1].product;
        const existingSlot1 = this.equipment.getSlotOfItem(item1);
        const existingSlot2 = this.equipment.getSlotOfItem(item2);
        const otherSlot = (item, slot) => {
            return item.validSlots.find((s) => s !== slot);
        };
        const equipArgs = [];
        if (existingSlot1 === undefined && existingSlot2 !== undefined) {
            const newSlot1 = otherSlot(item1, existingSlot2);
            if (newSlot1 !== undefined)
                equipArgs.push([item1, this.selectedEquipmentSet, newSlot1, 69696969]);
        } else if (existingSlot1 !== undefined && existingSlot2 === undefined) {
            // Equip Summon2 to the slot Summon1 isn't
            const newSlot2 = otherSlot(item2, existingSlot1);
            if (newSlot2 !== undefined)
                equipArgs.push([item2, this.selectedEquipmentSet, newSlot2, 69696969]);
        } else if (existingSlot1 === undefined && existingSlot2 === undefined) {
            // Equip both items
            let item1Slot = item1.validSlots[0];
            let item2Slot = otherSlot(item2, item1Slot);
            if (item2Slot === undefined)
                throw new Error('Error quick equipping synergy, no alternative slot exists for 2nd item');
            if (this.equipment.getItemInSlot(item2Slot.id).cantEquipWith.includes(item1)) {
                // Handles the edge case of the current item in slot 2 blocking slot 1
                [item2Slot, item1Slot] = [item1Slot, item2Slot];
            }
            equipArgs.push([item1, this.selectedEquipmentSet, item1Slot, 69696969], [item2, this.selectedEquipmentSet, item2Slot, 69696969]);
        }
        if (existingSlot1 !== undefined && existingSlot2 !== undefined) {
            notifyPlayer(this.game.summoning, getLangString('TOASTS_SYNERGY_ALREADY_EQUIPPED'), 'info');
        } else {
            const itemsOwned = equipArgs.every((arg) => {
                const ownedQuantity = this.manager.bank.getQty(arg[0]);
                if (ownedQuantity === 0)
                    notifyPlayer(this.game.summoning, templateLangString('TOASTS_NO_TABLETS', {
                        itemName: arg[0].name
                    }), 'danger');
                return ownedQuantity > 0;
            });
            if (itemsOwned) {
                equipArgs.forEach((arg) => {
                    this.equipItem(...arg);
                });
                notifyPlayer(this.game.summoning, getLangString('TOASTS_SYNERGY_EQUIPPED'), 'success');
            }
        }
    }
    checkSlayerItemEquipRestrictionsOnEquipSetChange(restrictions, newEquipment) {
        if (restrictions.slayer === undefined)
            return true;
        const isPre99Req = restrictions.slayer.level < 100;
        // Compute the new value of the bypass modifiers, and check if they are valid
        let bypassAllSlayerItems = this.modifiers.bypassAllSlayerItems;
        let bypassSlayerItems = this.modifiers.bypassSlayerItems;
        this.equipment.equippedArray.forEach((equippedItem) => {
            var _a;
            if (!equippedItem.providesStats)
                return;
            (_a = equippedItem.item.modifiers) === null || _a === void 0 ? void 0 : _a.forEach((modValue) => {
                switch (modValue.modifier.id) {
                    case "melvorD:bypassAllSlayerItems" /* ModifierIDs.bypassAllSlayerItems */ :
                        bypassAllSlayerItems -= modValue.value;
                        break;
                    case "melvorD:bypassSlayerItems" /* ModifierIDs.bypassSlayerItems */ :
                        bypassSlayerItems -= modValue.value;
                        break;
                }
            });
        });
        newEquipment.equippedArray.forEach((equippedItem) => {
            var _a;
            if (!equippedItem.providesStats)
                return;
            (_a = equippedItem.item.modifiers) === null || _a === void 0 ? void 0 : _a.forEach((modValue) => {
                switch (modValue.modifier.id) {
                    case "melvorD:bypassAllSlayerItems" /* ModifierIDs.bypassAllSlayerItems */ :
                        bypassAllSlayerItems += modValue.value;
                        break;
                    case "melvorD:bypassSlayerItems" /* ModifierIDs.bypassSlayerItems */ :
                        bypassSlayerItems += modValue.value;
                        break;
                }
            });
        });
        if (bypassAllSlayerItems > 0 || (isPre99Req && bypassSlayerItems > 0))
            return true;
        // Check that the new equipment contains all of the required items
        return restrictions.slayer.items.every((item) => {
            const hasItem = newEquipment.checkForItem(item);
            if (!hasItem)
                notifyPlayer(this.game.slayer, templateLangString('MENU_TEXT_ITEM_MUST_BE_EQUIPPED', {
                    itemName: item.name
                }), 'danger');
            return hasItem;
        });
    }
    /** Checks if the player can change to the defined equipment set */
    checkEquipRestrictionsOnEquipSetChange(setID) {
        const restrictions = this.manager.getEquipmentRestrictions();
        const equipment = this.equipmentSets[setID].equipment;
        const damageType = this.getEquipmentDamageType(equipment);
        if (!this.checkDamageTypeEquipRestrictions(restrictions, damageType) ||
            !this.checkSlayerItemEquipRestrictionsOnEquipSetChange(restrictions, equipment))
            return false;
        if (restrictions.areaItems !== undefined) {
            const missingItem = restrictions.areaItems.find((item) => !equipment.checkForItem(item));
            if (missingItem !== undefined) {
                notifyPlayer(this.game.attack, templateLangString('MENU_TEXT_ITEM_MUST_BE_EQUIPPED_STRONGHOLD', {
                    itemName: missingItem.name
                }), `danger`);
                return false;
            }
        }
        return true;
    }
    /** Callback function for changing equipment set */
    changeEquipmentSet(setID) {
        if (this.equipmentSets.length <= setID)
            throw new Error(`Invalid equipment set id: ${setID}`);
        if (!this.checkIfCantEquip() && this.checkEquipRestrictionsOnEquipSetChange(setID)) {
            this.selectedEquipmentSet = setID;
            this.updateForEquipmentChange();
            this.renderQueue.prayerSelection = true;
            this.renderQueue.attackSpellSelection = true;
            this.renderQueue.auroraSelection = true;
            this.renderQueue.curseSelection = true;
            this.renderQueue.runesUsed = true;
        }
    }
    changeEquipToSet(setID) {
        if (this.equipmentSets.length <= setID)
            throw new Error(`Set ID exceed maximum equipment sets.`);
        this.equipToSet = setID;
    }
    /** Adds equipment sets based on the modifier value */
    updateEquipmentSets() {
        while (this.numEquipSets > this.equipmentSets.length) {
            const newSet = new EquipmentSet(this.game);
            newSet.spellSelection.attack = this.game.attackSpells.firstObject;
            this.equipmentSets.push(newSet);
            this.renderQueue.equipmentSets = true;
        }
        let setsExceedAmount = false;
        while (this.equipmentSets.length > this.numEquipSets) {
            setsExceedAmount = true;
            const removedSet = this.equipmentSets.pop();
            if (removedSet === undefined)
                throw new Error('Error updating equipment sets, number of sets is 0 or negative');
            removedSet.equipment.forceAddAllToBank();
        }
        if (setsExceedAmount && this.selectedEquipmentSet >= this.numEquipSets) {
            this.changeEquipmentSet(0);
        }
    }
    onUnequipFromQuantityUse() {
        this.manager.computeAllStats();
        this.assignEquipmentEventHandlers();
    }
    /** Perform stat recalculation and ui update, interrupt current player action */
    updateForEquipmentChange() {
        var _a, _b;
        // Store reference to current HP percent
        const hpPercent = this.hitpointsPercent;
        this.renderQueue.equipment = true;
        this._events.emit('equipmentChanged', new EquipmentChangedEvent(this));
        this.manager.computeAllStats();
        this.assignEquipmentEventHandlers();
        this.renderQueue.attackStyle = true;
        this.renderQueue.equipmentSets = true;
        this.game.renderQueue.activeSkills = true;
        this.manager.renderQueue.resistanceMenus = true;
        this.interruptAttack();
        // Set hitpoints to the stored reference in the event we are equipping an item that changed the max HP
        if (hpPercent !== this.hitpointsPercent)
            this.setHitpoints(Math.round(this.stats.maxHitpoints * (hpPercent / 100)));
        this.render();
        this.manager.renderQueue.spellBook = true;
        this.manager.renderQueue.areaRequirements = true;
        this.renderQueue.food = true;
        this.renderQueue.combatLevel = true;
        this.game.woodcutting.onEquipmentChange();
        this.game.fishing.onEquipmentChange();
        this.game.firemaking.onEquipmentChange();
        this.game.cooking.onEquipmentChange();
        this.game.mining.onEquipmentChange();
        this.game.smithing.onEquipmentChange();
        this.game.thieving.onEquipmentChange();
        // game.farming.onEquipmentChange();
        this.game.fletching.onEquipmentChange();
        this.game.crafting.onEquipmentChange();
        this.game.runecrafting.onEquipmentChange();
        this.game.herblore.onEquipmentChange();
        this.game.agility.onEquipmentChange();
        this.game.summoning.onEquipmentChange();
        this.game.astrology.onEquipmentChange();
        this.game.altMagic.onEquipmentChange();
        (_a = this.game.cartography) === null || _a === void 0 ? void 0 : _a.onEquipmentChange();
        (_b = this.game.harvesting) === null || _b === void 0 ? void 0 : _b.onEquipmentChange();
        this.game.bank.onEquipmentChange();
        this.game.minibar.updateEquippedTicks();
    }
    /** Updates and renders the equipment sets */
    updateForEquipSetChange() {
        this.renderQueue.equipmentSets = true;
        this.game.bank.onEquipmentChange();
        this.render();
    }
    /**
     * Checks damage type based equipment restrictions when changing damage types. Fires notifications for the first violation
     * @param restrictions The restrictions to check
     * @param damageType The new damage type being used
     * @returns If the new damage type is valid
     */
    checkDamageTypeEquipRestrictions(restrictions, damageType) {
        if (restrictions.areaDamageTypes !== undefined && !restrictions.areaDamageTypes.has(damageType)) {
            notifyPlayer(this.game.attack, getLangString('INVALID_DAMAGE_TYPE_MSG_1'), 'danger');
            return false;
        }
        if (restrictions.monsterDamageType !== undefined && restrictions.monsterDamageType.immuneTo.has(damageType)) {
            notifyPlayer(this.game.attack, getLangString('INVALID_DAMAGE_TYPE_MSG_0'), 'danger');
            return false;
        }
        return true;
    }
    /**
     * Checks slayer item requirements when equipping/unequipping items. Fires notifications if the operation is invalid
     * @param restrictions The restrictions to check
     * @param removedItems The items being removed
     * @param newItem The new item being equipped (if any)
     * @returns If the slayer item requirements will still be met after changing equipment
     */
    checkSlayerItemEquipRestrictions(restrictions, removedItems, newItem) {
        var _a;
        if (restrictions.slayer === undefined)
            return true;
        let failedItem;
        const isPre99Req = restrictions.slayer.level < 100;
        // Compute the new value of the bypass modifiers, and check if they are valid
        let bypassAllSlayerItems = this.modifiers.bypassAllSlayerItems;
        let bypassSlayerItems = this.modifiers.bypassSlayerItems;
        removedItems.forEach(({
            item
        }) => {
            var _a;
            (_a = item.modifiers) === null || _a === void 0 ? void 0 : _a.forEach((modValue) => {
                switch (modValue.modifier.id) {
                    case "melvorD:bypassAllSlayerItems" /* ModifierIDs.bypassAllSlayerItems */ :
                        bypassAllSlayerItems -= modValue.value;
                        failedItem !== null && failedItem !== void 0 ? failedItem : (failedItem = item);
                        break;
                    case "melvorD:bypassSlayerItems" /* ModifierIDs.bypassSlayerItems */ :
                        bypassSlayerItems -= modValue.value;
                        if (isPre99Req)
                            failedItem !== null && failedItem !== void 0 ? failedItem : (failedItem = item);
                        break;
                }
            });
        });
        (_a = newItem === null || newItem === void 0 ? void 0 : newItem.modifiers) === null || _a === void 0 ? void 0 : _a.forEach((modValue) => {
            switch (modValue.modifier.id) {
                case "melvorD:bypassAllSlayerItems" /* ModifierIDs.bypassAllSlayerItems */ :
                    bypassAllSlayerItems += modValue.value;
                    break;
                case "melvorD:bypassSlayerItems" /* ModifierIDs.bypassSlayerItems */ :
                    bypassSlayerItems += modValue.value;
                    break;
            }
        });
        if (bypassAllSlayerItems > 0 || (isPre99Req && bypassSlayerItems > 0))
            return true;
        // Check that all the required items would be equipped after the swap
        const willHaveItems = restrictions.slayer.items.every((item) => {
            if (newItem === item || (this.equipment.checkForItem(item) && !removedItems.some((r) => r.item === item)))
                return true;
            failedItem !== null && failedItem !== void 0 ? failedItem : (failedItem = item);
            return false;
        });
        if (!willHaveItems && failedItem !== undefined) {
            notifyPlayer(this.game.slayer, templateLangString('MENU_TEXT_ITEM_MUST_BE_EQUIPPED', {
                itemName: failedItem.name
            }), 'danger');
        }
        return willHaveItems;
    }
    /**
     * Checks item based combat equipment restrictions when uneuipping items. Fires notifications for the first violation
     * @param restrictions The restrictions to check
     * @param removedItems The items being removed
     * @returns If the unequip operation is valid
     */
    checkItemEquipRestrictions(restrictions, removedItems) {
        if (restrictions.areaItems !== undefined &&
            restrictions.areaItems.some((item) => removedItems.some((r) => r.item === item))) {
            const requiredItem = removedItems.find(({
                item
            }) => restrictions.areaItems.includes(item));
            if (requiredItem !== undefined) {
                notifyPlayer(this.game.attack, templateLangString('MENU_TEXT_ITEM_MUST_BE_EQUIPPED_STRONGHOLD', {
                    itemName: requiredItem.item.name
                }), `danger`);
                return false;
            }
        }
        return true;
    }
    /**
     * Checks if the current restrictions on equipment will be violated when equipping an item. Fires a notification for the first violation.
     * @param set The equipment set that is being equipped to
     * @param item The item being equipped
     * @param removedItems The items that will be removed
     * @returns If the item can be equipped
     */
    checkEquipRestrictionsOnEquip(set, item, removedItems) {
        if (set !== this.selectedEquipmentSet)
            return true; // Apply no restrictions when swapping non active slot
        const restrictions = this.manager.getEquipmentRestrictions();
        if (item instanceof WeaponItem && !this.checkDamageTypeEquipRestrictions(restrictions, item.damageType))
            return false;
        return (this.checkSlayerItemEquipRestrictions(restrictions, removedItems, item) &&
            this.checkItemEquipRestrictions(restrictions, removedItems));
    }
    /** Function for equipping an item */
    equipItem(item, set, slot = item.validSlots[0], quantity = 1) {
        const equipment = this.equipmentSets[set].equipment;
        if (this.checkIfCantEquip()) {
            return false;
        }
        if (!slot.allowQuantity)
            quantity = 1;
        quantity = Math.min(this.manager.bank.getQty(item), quantity);
        if (quantity === 0)
            throw new Error('Tried to equip item when none is owned.');
        const existingSlot = equipment.getSlotOfItem(item);
        if (existingSlot !== undefined) {
            // Edge case for adding quantity to an existing slot
            if (slot.allowQuantity && existingSlot === slot) {
                equipment.addQuantityToSlot(slot, quantity);
                this.game.bank.removeItemQuantity(item, quantity, false);
                // Update user interface for increased quantity
                this.renderQueue.equipment = true;
                this.render();
                const event = new ItemEquippedEvent(item, quantity);
                this._events.emit('itemEquipped', event);
                return true;
            } else {
                notifyPlayer(this.game.attack, templateLangString('TOASTS_ITEM_ALREADY_EQUIPPED', {
                    itemName: item.name
                }), 'danger');
                return false;
            }
        }
        if (!this.game.checkRequirements(item.equipRequirements, true))
            return false;
        const itemsToAdd = equipment.getItemsAddedOnEquip(item, slot);
        // Check for restrictions due to current combat state
        if (!this.checkEquipRestrictionsOnEquip(set, item, itemsToAdd))
            return false;
        // Check for items that cannot be equipped together (ignoring them if they are to be removed)
        const conflictingItems = [];
        item.cantEquipWith.forEach((conflictingItem) => {
            if (equipment.checkForItem(conflictingItem) && !itemsToAdd.some((removed) => removed.item === conflictingItem)) {
                conflictingItems.push(conflictingItem);
            }
        });
        if (conflictingItems.length > 0) {
            notifyPlayer(this.game.attack, templateLangString('TOASTS_CANNOT_EQUIP_WITH', {
                itemName: item.name,
                conflictingItemName: conflictingItems[0].name,
            }), 'danger');
            return false;
        }
        let newBankSlotsUsed = itemsToAdd.length;
        let bankSlotsFreed = 0;
        itemsToAdd.forEach((itemToAdd) => {
            if (this.game.bank.hasItem(itemToAdd.item))
                newBankSlotsUsed--;
        });
        // Remove a slot requirement if the quantity in the bank is the same as being equipped
        if (this.manager.bank.getQty(item) === quantity)
            bankSlotsFreed++;
        if (this.game.bank.maximumSlots >= this.game.bank.occupiedSlots + newBankSlotsUsed - bankSlotsFreed ||
            newBankSlotsUsed === 0) {
            // Change the equipment object and the bank, conserving item quantities
            this.game.bank.removeItemQuantity(item, quantity, false);
            itemsToAdd.forEach((itemToAdd) => {
                this.game.bank.addItem(itemToAdd.item, itemToAdd.quantity, false, false, false, true, `Game.Unequip`);
            });
            equipment.equipItem(item, slot, quantity);
            if (set === this.selectedEquipmentSet) {
                this.updateForEquipmentChange();
            } else {
                this.updateForEquipSetChange();
            }
            const event = new ItemEquippedEvent(item, quantity);
            this._events.emit('itemEquipped', event);
            return true;
        } else {
            notifyPlayer(this.game.attack, getLangString('TOASTS_CANT_FIT_CURRENT_EQUIPMENT'), 'danger');
            return false;
        }
    }
    /** Returns a callback function for unequipping an item from a slot*/
    unequipCallback(slot) {
        return () => this.unequipItem(this.selectedEquipmentSet, slot);
    }
    /**
     * Checks if the current restrictions on equipment will be violated when unequipping an item. Fires a notification for the first violation.
     * @param set The equipment set the item is being unequipped from
     * @param removed The item that is being removed
     * @returns If the item can be removed
     */
    checkEquipRestrictionsOnUnequip(set, removed) {
        if (set !== this.selectedEquipmentSet)
            return true; // Allow unequipping from the non-current set
        const restrictions = this.manager.getEquipmentRestrictions();
        if (removed.item instanceof WeaponItem) {
            if (restrictions.areaDamageTypes !== undefined && !restrictions.areaDamageTypes.has(this.game.normalDamage)) {
                notifyPlayer(this.game.attack, getLangString('MENU_TEXT_NORMAL_DAMAGE_NOT_ALLOWED'), 'danger');
                return false;
            }
            if (restrictions.monsterDamageType !== undefined &&
                restrictions.monsterDamageType.immuneTo.has(this.game.normalDamage)) {
                notifyPlayer(this.game.attack, getLangString('MENU_TEXT_NORMAL_DAMAGE_IMMUNE'), 'danger');
                return false;
            }
        }
        return (this.checkSlayerItemEquipRestrictions(restrictions, [removed]) &&
            this.checkItemEquipRestrictions(restrictions, [removed]));
    }
    /** Function for unequipping an item from a slot */
    unequipItem(set, slot) {
        if (this.checkIfCantEquip()) {
            return false;
        }
        const itemsToAdd = this.equipment.getItemsAddedOnUnequip(slot);
        if (!this.checkEquipRestrictionsOnUnequip(set, itemsToAdd))
            return false;
        const addResult = this.game.bank.addItem(itemsToAdd.item, itemsToAdd.quantity, false, false, false, true, `Game.Unequip`);
        if (addResult) {
            this.equipment.unequipItem(slot);
            if (this.selectedEquipmentSet === set) {
                this.updateForEquipmentChange();
            } else {
                this.updateForEquipSetChange();
            }
        }
        return addResult;
    }
    /**
     * Callback function for setting the quick equip item of a given slot
     * @param slot The slot to set the quick equip item
     * @param pos The quick equip position
     * @returns If the quick equip item was changed
     */
    setQuickEquipItem(slot, pos) {
        if (this.equipment.isQuickEquipEmpty(slot, pos)) {
            if (this.equipment.isSlotEmpty(slot.id)) {
                this.game.combat.notifications.add({
                    type: 'Player',
                    args: [this.game.attack, getLangString('NO_ITEM_EQUIPPED_TO_SET'), 'danger'],
                });
                return false;
            } else {
                this.equipment.setQuickEquip(slot, pos);
                return true;
            }
        } else {
            if (this.equipment.isSlotEmpty(slot.id)) {
                this.equipment.setQuickEquip(slot, pos);
                return true;
            } else if (!this.equipment.isQuickEquipValid(slot, pos)) {
                this.game.combat.notifications.add({
                    type: 'Player',
                    args: [this.game.attack, getLangString('ITEM_DOES_NOT_GO_IN_SLOT'), 'danger'],
                });
                return false;
            } else {
                this.equipment.setQuickEquip(slot, pos);
                return true;
            }
        }
    }
    onQuickEquipClick(slot, pos) {
        const item = this.equipment.getQuickEquipItem(slot, pos);
        if (item === this.game.emptyEquipmentItem)
            return;
        const qty = slot.allowQuantity ? this.manager.bank.getQty(item) - 1 : 1;
        if (qty >= 1)
            this.equipItem(item, this.selectedEquipmentSet, slot, qty);
    }
    assignEquipmentEventHandlers() {
        this.game.events.unassignMatchers(this.equipmentEventUnassigners);
        this.equipmentEventUnassigners = [];
        const golbinRaid = this instanceof RaidPlayer;
        this.equipment.equippedArray.forEach((equipped) => {
            if (!equipped.providesStats)
                return;
            if (equipped.item.consumesOn !== undefined) {
                const handler = (e) => this.consumeItemQuantities(e, equipped);
                this.equipmentEventUnassigners.push(...this.game.events.assignMatchers(equipped.item.consumesOn, handler, golbinRaid));
            }
            if (equipped.item.consumesChargesOn !== undefined) {
                const handler = (e) => this.consumeItemCharges(e, equipped.item);
                this.equipmentEventUnassigners.push(...this.game.events.assignMatchers(equipped.item.consumesChargesOn, handler, golbinRaid));
            }
            if (equipped.item.consumesItemOn !== undefined) {
                const consumption = equipped.item.consumesItemOn;
                const handler = (e) => this.consumeBankItem(e, consumption);
                this.equipmentEventUnassigners.push(...this.game.events.assignMatchers(equipped.item.consumesItemOn.matchers, handler, golbinRaid));
            }
        });
    }
    assignSynergyEventHandlers() {
        this.game.events.unassignMatchers(this.summoningSynergyEventUnassigners);
        if (this.activeSummoningSynergy === undefined)
            return;
        const handler = (e) => this.consumeSynergyTablets(e);
        this.summoningSynergyEventUnassigners = this.game.events.assignMatchers(this.activeSummoningSynergy.consumesOn, handler, this instanceof RaidManager);
    }
    /** Automatically equips the selected food, without taking it from the bank
     *  Will update the completion log and item statistics
     */
    autoEquipFood(item, quantity) {
        const oldFood = this.food.currentSlot.item;
        const equipped = this.food.equip(item, quantity);
        if (equipped) {
            this.onSelectedFoodChange(oldFood, this.food.currentSlot.item);
            const newItem = this.game.stats.itemFindCount(item) === 0;
            this.game.stats.Items.add(item, ItemStats.TimesFound, quantity);
            if (newItem)
                this.game.completion.updateItem(item);
            this.manager.notifications.add({
                type: 'Item',
                args: [item, quantity],
            });
            const event = new FoodEquippedEvent(item, quantity);
            this._events.emit('foodEquipped', event);
            this.renderQueue.food = true;
        }
        return equipped;
    }
    /** Callback function for equipping the selected food from bank */
    equipFood(item, quantity) {
        // Make sure operation is valid
        if (this.checkIfCantEquip()) {
            return;
        }
        // Proceed to equip the food
        const oldFood = this.food.currentSlot.item;
        const equipped = this.food.equip(item, quantity);
        if (equipped) {
            this.onSelectedFoodChange(oldFood, this.food.currentSlot.item);
            // Remove from bank
            this.game.bank.removeItemQuantity(item, quantity, false);
            notifyPlayer(this.game.hitpoints, getLangString('TOASTS_FOOD_EQUIPPED'), 'success', 0);
            const event = new FoodEquippedEvent(item, quantity);
            this._events.emit('foodEquipped', event);
            this.renderFood();
            return true;
        } else {
            notifyPlayer(this.game.hitpoints, getLangString('TOASTS_NEED_FREE_SLOT'), 'danger');
            return false;
        }
    }
    /** Unequips the player's currently selected food */
    unequipFood() {
        const foodData = this.food.currentSlot;
        if (foodData.quantity === 0) {
            return;
        }
        if (this.checkIfCantEquip()) {
            return;
        }
        const addResult = this.game.bank.addItem(foodData.item, foodData.quantity, false, false, false, true, `Game.Unequip`);
        if (addResult) {
            const oldFood = foodData.item;
            this.food.unequipSelected();
            this.onSelectedFoodChange(oldFood, this.food.currentSlot.item);
            this.renderFood();
        } else {
            notifyPlayer(this.game.attack, getLangString('TOASTS_NO_BANK_ROOM'), 'danger');
        }
    }
    /** Changes the player's currently selected food */
    selectFood(slotID) {
        if (this.checkIfCantEquip()) {
            return;
        }
        const oldFood = this.food.currentSlot.item;
        this.food.setSlot(slotID);
        this.onSelectedFoodChange(oldFood, this.food.currentSlot.item);
        this.renderFood();
    }
    /** Handles modifier changes when the players selected food item changes */
    onSelectedFoodChange(oldFood, newFood) {
        if (oldFood === newFood)
            return;
        if (oldFood.stats.hasStats || newFood.stats.hasStats) {
            this.manager.computeAllStats();
        }
    }
    /** Eats food */
    eatFood(quantity = 1, interrupt = true, efficiency = 100) {
        const item = this.food.currentSlot.item;
        if (this.stats.maxHitpoints === this.hitpoints ||
            (item === this.game.emptyFoodItem &&
                (!this.game.settings.enableAutoSwapFood || this.modifiers.autoSwapFoodUnlocked < 1))) {
            return;
        } else if (this.food.currentSlot.quantity < 1 &&
            this.modifiers.autoSwapFoodUnlocked > 0 &&
            this.game.settings.enableAutoSwapFood) {
            const nonEmptySlot = this.food.slots.findIndex((slot) => slot.item !== this.game.emptyFoodItem);
            if (nonEmptySlot >= 0) {
                const oldFood = this.food.currentSlot.item;
                this.food.setSlot(nonEmptySlot);
                this.onSelectedFoodChange(oldFood, this.food.currentSlot.item);
            } else {
                return;
            }
        }
        let healingAmount = quantity * Math.max(Math.floor((this.getFoodHealing(item) * efficiency) / 100), 1);
        healingAmount = this.heal(healingAmount);
        this.addItemStat(item, ItemStats.TimesEaten, quantity);
        this.manager.addCombatStat(CombatStats.FoodConsumed, quantity);
        this.addItemStat(item, ItemStats.HealedFor, healingAmount);
        this.manager.addCombatStat(CombatStats.HPFromFood, healingAmount);
        if (!rollPercentage(this.modifiers.getFoodPreservationChance())) {
            const oldFood = this.food.currentSlot.item;
            this.food.consume(quantity);
            this.onSelectedFoodChange(oldFood, this.food.currentSlot.item);
            this.renderQueue.food = true;
        }
        if (interrupt)
            this.interruptAttack();
        const event = new FoodEatenEvent(item, quantity, healingAmount);
        this._events.emit('foodEaten', event);
    }
    getFoodHealing(item) {
        const value = item.healsFor * numberMultiplier;
        return applyModifier(value, this.getFoodHealingBonus(item));
    }
    getFoodHealingBonus(item) {
        return this.modifiers.getValue("melvorD:foodHealingValue" /* ModifierIDs.foodHealingValue */ , new ModifierQuery({
            damageType: this.damageType,
            skill: this.game.cooking,
            action: this.game.cooking.getActionForFood(item),
        }, false));
    }
    startHoldToEat() {
        //set allow to eat from interval to true
        this.allowToEatFromTimeout = true;
        //clear existing interval just in case
        clearInterval(this.eatTimeout);
        this.eatTimeout = window.setInterval(() => {
            if (this.allowToEatFromTimeout)
                this.eatFood();
            this.render();
        }, 200);
    }
    stopHoldToEat() {
        this.allowToEatFromTimeout = false;
        clearInterval(this.eatTimeout);
        this.eatTimeout = -1;
    }
    interruptAttack() {
        if (this.manager.canInteruptAttacks) {
            this.queueNextAction(true);
            this.startSummonAttack();
        }
    }
    canEnablePrayer(prayer) {
        if (!prayer.canUseWithDamageType(this.damageType)) {
            // Incompatible damage type
            notifyPlayer(this.game.altMagic, `This Prayer cannot be used with ${this.damageType.name}`, 'danger');
            return false;
        } else if (prayer.isUnholy && this.modifiers.allowUnholyPrayerUse < 2) {
            // Not enough Unholy items equipped
            notifyPlayer(this.game.prayer, getLangString('TOASTS_EQUIP_UNHOLY_ITEMS'), 'danger');
            return false;
        } else if (!prayer.isAbyssal && this.computePrayerMaxCost(prayer) > this.prayerPoints) {
            // Can't afford prayer
            notifyPlayer(this.game.prayer, getLangString('TOASTS_NOT_ENOUGH_PP'), 'danger');
            return false;
        } else if (prayer.isAbyssal && this.computeSoulPointMaxCost(prayer) > this.soulPoints) {
            // Can't afford prayer
            notifyPlayer(this.game.prayer, getLangString('NOTE_ENOUGH_SOUL_POINTS'), 'danger');
            return false;
        }
        return true;
    }
    /** Callback Function for clicking on a prayer */
    togglePrayer(prayer, render = true) {
        // Flag if Prayers in use are currently unholy
        let isCurrentUnholy = false;
        // Flag if Prayers in use are currently abyssal
        let isCurrentAbyssal = false;
        for (const prayer of this.activePrayers) {
            if (prayer.isUnholy) {
                isCurrentUnholy = true;
                break;
            }
            if (prayer.isAbyssal) {
                isCurrentAbyssal = true;
                break;
            }
        }
        if (this.activePrayers.size > 0 && (isCurrentUnholy !== prayer.isUnholy || isCurrentAbyssal !== prayer.isAbyssal)) {
            notifyPlayer(this.game.prayer, getLangString('INVALID_PRAYER_BOOK_SELECTED'), 'danger');
            return;
        }
        let statUpdateRequired = false;
        if (this.activePrayers.has(prayer)) {
            // Turn prayer off
            this.activePrayers.delete(prayer);
            statUpdateRequired = true;
        } else if (this.activePrayers.size >= 2) {
            // Too many prayers active already
            notifyPlayer(this.game.prayer, getLangString('TOASTS_MAX_PRAYERS_ACTIVE'), 'danger');
        } else if (this.canEnablePrayer(prayer)) {
            // Turn prayer on
            this.activePrayers.add(prayer);
            statUpdateRequired = true;
        }
        if (statUpdateRequired) {
            this.manager.computeAllStats();
            this.game.renderQueue.activeSkills = true;
            this.renderQueue.prayerSelection = true;
            if (render)
                this.render();
        }
    }
    /** Checks if the player meets the requirements to use the currently selected prayers */
    checkPrayerUsage() {
        this.activePrayers.forEach((prayer) => {
            if (!this.canEnablePrayer(prayer)) {
                this.activePrayers.delete(prayer);
                this.game.renderQueue.activeSkills = true;
                this.renderQueue.prayerSelection = true;
            }
        });
    }
    /**
     * Checks if a combat spell can be used by the player
     * @param spell The combat spell to check
     * @param ignoreReqs Whether to ignore requirements other than equipped item requirements
     * @returns If the spell can be used
     */
    canUseCombatSpell(spell, ignoreReqs = false) {
        return ((ignoreReqs ||
                (this.game.altMagic.level >= spell.level &&
                    this.game.altMagic.abyssalLevel >= spell.abyssalLevel &&
                    this.game.checkRequirements(spell.requirements))) &&
            (spell.requiredItem === undefined || this.equipment.checkForItem(spell.requiredItem)));
    }
    selectAttackSpell(spell, render = true) {
        if (spell === this.spellSelection.attack)
            return;
        if (!spell.spellbook.canUseWithDamageType(this.damageType)) {
            notifyPlayer(this.game.altMagic, `This spell cannot be used with ${this.damageType.name}`, 'danger');
            return;
        }
        this.spellSelection.attack = spell;
        if (!spell.spellbook.allowCurses && this.spellSelection.curse !== undefined) {
            this.spellSelection.curse = undefined;
            this.renderQueue.curseSelection = true;
        }
        if (!spell.spellbook.allowAuroras && this.spellSelection.aurora !== undefined) {
            this.spellSelection.aurora = undefined;
            this.renderQueue.auroraSelection = true;
        }
        if (this.attackType === 'magic') {
            this.manager.computeAllStats();
            if (this.manager.fightInProgress)
                this.interruptAttack();
        }
        this.renderQueue.attackSpellSelection = true;
        this.renderQueue.runesUsed = true;
        if (render)
            this.render();
    }
    toggleCurse(spell, render = true) {
        let renderRequired = false;
        if (this.spellSelection.attack !== undefined && !this.spellSelection.attack.spellbook.allowCurses) {
            // Can't use curse
            notifyPlayer(this.game.altMagic, templateLangString('NO_CURSES_WITH_SPELLBOOK', {
                spellbookName: this.spellSelection.attack.spellbook.name
            }), 'danger');
        } else if (spell === this.spellSelection.curse) {
            // De-select curse
            this.spellSelection.curse = undefined;
            renderRequired = true;
        } else if (this.canCurse) {
            // Select curse
            this.spellSelection.curse = spell;
            renderRequired = true;
        }
        if (renderRequired) {
            this.renderQueue.curseSelection = true;
            this.renderQueue.runesUsed = true;
            if (render)
                this.render();
        }
    }
    toggleAurora(spell, render = true) {
        if (this.spellSelection.attack !== undefined && !this.spellSelection.attack.spellbook.allowAuroras) {
            // Can't use Auroras
            notifyPlayer(this.game.altMagic, templateLangString('NO_AURORAS_WITH_SPELLBOOK', {
                spellbookName: this.spellSelection.attack.spellbook.name
            }), 'danger');
        } else if (spell === this.spellSelection.aurora) {
            // De-select aurora
            this.spellSelection.aurora = undefined;
        } else {
            if (!this.canAurora)
                return;
            // Select aurora
            this.spellSelection.aurora = spell;
        }
        this.renderQueue.auroraSelection = true;
        this.renderQueue.runesUsed = true;
        this.manager.computeAllStats();
        if (render)
            this.render();
    }
    consumePrayerPoints(amount, isUnholy) {
        if (amount > 0) {
            amount = this.applyModifiersToPrayerCost(amount, isUnholy);
            const event = new PrayerPointConsumptionEvent(amount, isUnholy);
            this._events.emit('prayerPointsUsed', event);
            this.prayerPoints -= amount;
            if (this.prayerPoints < 0)
                this.prayerPoints = 0;
            this.trackPrayerStats(PrayerStats.PrayerPointsSpent, amount);
            this.renderQueue.prayerPoints = true;
            if (this.prayerPoints < this.maxPrayerCost) {
                this.disableActivePrayers();
            }
        }
    }
    consumeSoulPoints(amount) {
        if (amount > 0) {
            amount = this.applyModifiersToSoulPointCost(amount);
            const event = new SoulPointConsumptionEvent(amount);
            this._events.emit('soulPointsUsed', event);
            this.soulPoints -= amount;
            if (this.soulPoints < 0)
                this.soulPoints = 0;
            this.trackPrayerStats(PrayerStats.SoulPointsSpent, amount);
            this.renderQueue.soulPoints = true;
            if (this.soulPoints < this.maxSoulPointCost) {
                this.disableActivePrayers();
            }
        }
    }
    disableActivePrayers() {
        this.activePrayers.forEach((pID) => {
            if (pID.id !== "melvorF:Protect_Item" /* PrayerIDs.Protect_Item */ || this.modifiers.freeProtectItem < 1)
                this.togglePrayer(pID, false);
        });
    }
    addPrayerPoints(amount) {
        this.prayerPoints += amount;
        this.trackPrayerStats(PrayerStats.PrayerPointsEarned, amount);
        this.renderQueue.prayerPoints = true;
    }
    addSoulPoints(amount) {
        this.soulPoints += amount;
        this.trackPrayerStats(PrayerStats.SoulPointsEarned, amount);
        this.renderQueue.soulPoints = true;
    }
    trackPrayerStats(stat, amount) {
        this.game.stats.Prayer.add(stat, amount);
    }
    applyCostModifiersToPrayerCost(amount) {
        amount += this.modifiers.flatPrayerPointCost;
        amount *= 1 + this.modifiers.prayerPointCost / 100;
        amount = Math.max(Math.floor(amount), 1);
        return amount;
    }
    applyCostModifiersToSoulPointCost(amount) {
        amount += this.modifiers.flatSoulPointCost;
        amount *= 1 + this.modifiers.soulPointCost / 100;
        amount = Math.max(Math.floor(amount), 1);
        return amount;
    }
    applyPreservationToPrayerCost(amount, isUnholy) {
        let preserveChance = this.modifiers.prayerPointPreservationChance + this.modifiers.prayerPointPreservationChancePerPoint * amount;
        if (isUnholy)
            preserveChance += this.modifiers.unholyPrayerPointPreservationChance;
        preserveChance = clampValue(preserveChance, 0, 80);
        if (rollPercentage(preserveChance)) {
            this.trackPrayerStats(PrayerStats.PrayerPointsPreserved, amount);
            amount = 0;
        }
        return amount;
    }
    applyPreservationToSoulPointCost(amount) {
        let preserveChance = this.modifiers.soulPointPreservationChance + this.modifiers.soulPointPreservationChanceBypass;
        preserveChance = clampValue(preserveChance, 0, 80);
        if (rollPercentage(preserveChance)) {
            this.trackPrayerStats(PrayerStats.SoulPointsPreserved, amount);
            amount = 0;
        }
        return amount;
    }
    applyModifiersToPrayerCost(amount, isUnholy) {
        amount = this.applyCostModifiersToPrayerCost(amount);
        amount = this.applyPreservationToPrayerCost(amount, isUnholy);
        return amount;
    }
    applyModifiersToSoulPointCost(amount) {
        amount = this.applyCostModifiersToSoulPointCost(amount);
        amount = this.applyPreservationToSoulPointCost(amount);
        return amount;
    }
    computePrayerMaxCost(prayer) {
        if (prayer.id === "melvorF:Protect_Item" /* PrayerIDs.Protect_Item */ && this.modifiers.freeProtectItem > 0)
            return 0;
        return this.applyCostModifiersToPrayerCost(Math.max(prayer.pointsPerEnemy, prayer.pointsPerPlayer, prayer.pointsPerRegen));
    }
    computeSoulPointMaxCost(prayer) {
        return this.applyCostModifiersToSoulPointCost(Math.max(prayer.pointsPerEnemy, prayer.pointsPerPlayer, prayer.pointsPerRegen));
    }
    renderPrayerPoints() {
        if (!this.renderQueue.prayerPoints)
            return;
        if (!this.game.settings.showSPNextToPrayerSidebar) {
            const navText = `${formatNumber(this.prayerPoints)}`;
            this.statElements.navPrayerPoints.forEach((elem) => {
                elem.textContent = navText;
                if (this.prayerPoints > 0) {
                    elem.classList.add('text-success');
                    elem.classList.remove('text-danger');
                } else {
                    elem.classList.add('text-danger');
                    elem.classList.remove('text-success');
                }
            });
        }
        combatMenus.playerStats.setPrayerPoints(this);
        this.renderQueue.prayerPoints = false;
    }
    renderSoulPoints() {
        if (!this.renderQueue.soulPoints)
            return;
        if (this.game.settings.showSPNextToPrayerSidebar) {
            const navText = `${formatNumber(this.soulPoints)}`;
            this.statElements.navPrayerPoints.forEach((elem) => {
                elem.textContent = navText;
                if (this.soulPoints > 0) {
                    elem.classList.add('text-success');
                    elem.classList.remove('text-danger');
                } else {
                    elem.classList.add('text-danger');
                    elem.classList.remove('text-success');
                }
            });
        }
        combatMenus.playerStats.setSoulPoints(this);
        this.renderQueue.soulPoints = false;
    }
    renderPrayerSelection() {
        if (!this.renderQueue.prayerSelection)
            return;
        combatMenus.prayer.setActiveButtons(this.activePrayers);
        combatMenus.playerStats.setActivePrayers(this, this.activePrayers);
        this.renderQueue.prayerSelection = false;
    }
    renderAttackSpellSelection() {
        if (!this.renderQueue.attackSpellSelection)
            return;
        combatMenus.spells.attackSpellMenu.highlightSpell(this.spellSelection.attack);
        this.renderQueue.attackSpellSelection = false;
    }
    renderCurseSelection() {
        if (!this.renderQueue.curseSelection)
            return;
        combatMenus.spells.curseSpellMenu.highlightSpell(this.spellSelection.curse);
        this.renderQueue.curseSelection = false;
    }
    renderAuroraSelection() {
        if (!this.renderQueue.auroraSelection)
            return;
        combatMenus.spells.auroraSpellMenu.highlightSpell(this.spellSelection.aurora);
        this.renderQueue.auroraSelection = false;
    }
    renderRunesUsed() {
        if (!this.renderQueue.runesUsed)
            return;
        combatMenus.runes.updateHighlights(this.spellSelection, this.availableAttacks, this.useCombinationRunes);
        this.renderQueue.runesUsed = false;
    }
    /** Determines in the player can (un)equip an item currently */
    checkIfCantEquip() {
        let cantEquip = false;
        if (this.game.combat.selectedArea !== undefined &&
            this.manager.areaType === CombatAreaType.Dungeon &&
            this.modifiers.dungeonEquipmentSwapping === 0) {
            cantEquip = true;
            notifyPlayer(this.game.attack, getLangString('TOASTS_CANNOT_DURING_DUNGEON'), 'danger');
        } else if (this.game.combat.selectedArea !== undefined &&
            this.manager.areaType === CombatAreaType.Stronghold &&
            this.modifiers.strongholdEquipmentSwapping === 0) {
            cantEquip = true;
            notifyPlayer(this.game.attack, getLangString('TOASTS_CANNOT_DURING_STRONGHOLD'), 'danger');
        } else if (this.game.isGolbinRaid) {
            cantEquip = true;
            notifyPlayer(this.game.attack, getLangString('TOASTS_CANNOT_DURING_RAID'), 'danger');
        }
        return cantEquip;
    }
    computeEquipmentStats() {
        this.equipmentStats.resetStats();
        // Providers
        this.manager.statProviders.forEach((provider) => {
            if (provider.equipmentStats !== undefined)
                this.equipmentStats.addStats(provider.equipmentStats);
        });
        // Equipment
        this.equipment.addEquipmentStats(this.equipmentStats);
        this.activeItemSynergies.forEach((synergy) => {
            if (synergy.equipmentStats !== undefined)
                this.equipmentStats.addStats(synergy.equipmentStats);
        });
    }
    /** Calculates the Max HP stat */
    computeMaxHP() {
        const oldMax = this.stats.maxHitpoints;
        let maxHP = numberMultiplier * this.levels.Hitpoints;
        if (this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ || this.damageType.id === "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ ) {
            maxHP = numberMultiplier * Math.min(99, this.levels.Hitpoints);
            maxHP += numberMultiplier * (this.abyssalLevels.Hitpoints * 20);
            maxHP *= 10;
        }
        maxHP = this.modifyMaxHP(maxHP);
        if (this.game.currentGamemode.overrideMaxHitpoints)
            maxHP = this.game.currentGamemode.overrideMaxHitpoints;
        this.stats.maxHitpoints = maxHP;
        const oldCurrent = this.hitpoints;
        if (this.hitpoints >= maxHP)
            this.setHitpoints(maxHP);
        this._events.emit('hitpointsChanged', new HitpointsChangedEvent(oldCurrent, oldMax, this.hitpoints, this.stats.maxHitpoints));
    }
    computeMeleeMaxHit() {
        let strengthBonus = this.equipmentStats.meleeStrengthBonus + this.modifiers.flatMeleeStrengthBonus;
        let twoHandModifier = 1;
        if (this.equipment.isWeapon2H)
            twoHandModifier = 2;
        this.modifiers
            .query("melvorD:flatMeleeStrengthBonusBasedOnSkillLevel" /* ModifierIDs.flatMeleeStrengthBonusBasedOnSkillLevel */ , ModifierQuery.ANY_SKILL)
            .forEach((entry) => {
                strengthBonus += entry.scope.skill.level;
            });
        strengthBonus +=
            this.modifiers.flatMeleeStrengthBonusPerAttackInterval *
            Math.floor(this.stats.attackInterval / 100) *
            twoHandModifier;
        let modifier = this.modifiers.meleeStrengthBonus;
        if (this.equipment.isWeapon2H)
            modifier += this.modifiers.meleeStrengthBonusWith2HWeapon;
        if (this.manager.fightInProgress) {
            this.modifiers.forEachDamageType("melvorD:meleeStrengthBonusPer10EnemyResistance" /* ModifierIDs.meleeStrengthBonusPer10EnemyResistance */ , (value, damageType) => {
                modifier += value * Math.floor(this.target.stats.getResistance(damageType) / 10);
            });
        }
        strengthBonus = applyModifier(strengthBonus, modifier);
        let strengthLevel = this.levels.Strength;
        if (this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ || this.damageType.id === "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ )
            strengthLevel += this.abyssalLevels.Strength;
        return Character.calculateStandardMaxHit(strengthLevel, strengthBonus);
    }
    computeRangedMaxHit() {
        let strengthBonus = this.equipmentStats.rangedStrengthBonus + this.modifiers.flatRangedStrengthBonus;
        let twoHandModifier = 1;
        if (this.equipment.isWeapon2H)
            twoHandModifier = 2;
        strengthBonus +=
            this.modifiers.flatRangedStrengthBonusPerAttackInterval *
            Math.floor(this.stats.attackInterval / 100) *
            twoHandModifier;
        let modifier = this.modifiers.rangedStrengthBonus;
        if (this.manager.fightInProgress) {
            const weaponID = this.equipment.getItemInSlot("melvorD:Weapon" /* EquipmentSlotIDs.Weapon */ ).id;
            if ((this.manager.onSlayerTask || this.manager.areaType === CombatAreaType.Slayer) &&
                weaponID === "melvorF:Slayer_Crossbow" /* ItemIDs.Slayer_Crossbow */ )
                modifier += 33;
            if (weaponID === "melvorF:Stormsnap" /* ItemIDs.Stormsnap */ ) {
                strengthBonus += Math.floor(129 + (1 + (this.target.levels.Magic * 6) / 33));
            }
        }
        modifier += this.modifiers.rangedStrengthBonusPer8Ranged * Math.floor(this.levels.Ranged / 8);
        if (this.equipment.isWeapon2H)
            modifier += this.modifiers.rangedStrengthBonusWith2HWeapon;
        strengthBonus = applyModifier(strengthBonus, modifier);
        let rangedLevel = this.levels.Ranged;
        if (this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ || this.damageType.id === "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ )
            rangedLevel += this.abyssalLevels.Ranged;
        return Character.calculateStandardMaxHit(rangedLevel, strengthBonus);
    }
    computeMagicMaxHit() {
        const spell = this.spellSelection.attack;
        if (spell !== undefined) {
            if (!spell.spellbook.allowDamageModifiers) {
                return Math.round(numberMultiplier * spell.maxHit);
            }
            let damageBonus = this.equipmentStats.magicDamageBonus;
            let modifier = this.modifiers.magicDamageBonus;
            if (this.equipment.isWeapon2H)
                modifier += this.modifiers.magicDamageBonusWith2HWeapon;
            damageBonus = applyModifier(damageBonus, modifier);
            let magicLevel = this.levels.Magic;
            if (this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ )
                magicLevel += this.abyssalLevels.Magic;
            return Math.floor(numberMultiplier * spell.maxHit * (1 + damageBonus / 100) * (1 + (magicLevel + 1) / 200));
        } else {
            return 0;
        }
    }
    computeSummonMaxHit() {
        const canAttack = !this.equipmentStats.summoningMaxHit.isEmpty;
        this.stats.canSummonAttack = canAttack;
        let maxHit;
        if (canAttack) {
            maxHit = this.equipmentStats.getSummoningMaxHit(this.damageType);
            maxHit = applyModifier(maxHit, this.modifiers.summoningMaxHit);
        } else {
            maxHit = 0;
        }
        this.stats.summoningMaxHit = maxHit;
    }
    computeAttackType() {
        const item = this.equipment.getItemInSlot("melvorD:Weapon" /* EquipmentSlotIDs.Weapon */ );
        if (item !== this.game.emptyEquipmentItem) {
            if (item instanceof WeaponItem) {
                this.attackType = item.attackType;
            } else {
                throw new Error(`Equipped weapon ${item.name} is not a weapon!`);
            }
        } else {
            this.attackType = 'melee';
        }
        this.renderQueue.combatTriangle = true;
    }
    /**
     * Gets the damage type that a given set of equipment is using
     * @param equipment The equipment to check
     * @returns The damage type of the equipment
     */
    getEquipmentDamageType(equipment) {
        const item = equipment.getItemInSlot("melvorD:Weapon" /* EquipmentSlotIDs.Weapon */ );
        if (item !== this.game.emptyEquipmentItem) {
            if (item instanceof WeaponItem) {
                return item.damageType;
            } else {
                throw new Error(`Equipped weapon ${item.name} is not a weapon!`);
            }
        } else {
            return this.game.normalDamage;
        }
    }
    computeDamageType() {
        const old = this.damageType;
        this.damageType = this.getEquipmentDamageType(this.equipment);
        if (old !== this.damageType)
            this.selfModifierQuery.replace({
                damageType: this.damageType
            });
    }
    setAttackStyle(attackType, style) {
        this.attackStyles[attackType] = style;
        if (attackType === this.attackType) {
            this.renderQueue.attackStyle = true;
            this.game.renderQueue.activeSkills = true;
            this.manager.computeAllStats();
            this.render();
        }
    }
    computeModifiers() {
        var _a;
        this.modifiers.empty();
        this.addProviderModifiers();
        this.addEquippedItemModifiers();
        this.addSelectedFoodModifiers();
        this.addConditionalModifiers();
        this.addAttackStyleModifiers();
        this.addPassiveModifiers();
        this.checkPrayerUsage();
        this.addPrayerModifiers();
        this.addGamemodeModifiers();
        this.checkMagicUsage();
        this.addAuroraModifiers();
        this.addSummonSynergyModifiers();
        this.addEffectModifiers();
        this.addInheretedModifiers();
        this.renderQueue.autoEat = true;
        this.renderQueue.activeSkillModifierChange = true;
        this.manager.renderQueue.slayerAreaEffects = true;
        if (((_a = this.game.activeAction) === null || _a === void 0 ? void 0 : _a.onModifierChangeWhileActive) !== undefined)
            this.game.activeAction.onModifierChangeWhileActive();
    }
    addInheretedModifiers() {
        this.game.registeredNamespaces.forEach((namespace) => {
            switch (namespace.name) {
                case "melvorAoD" /* Namespaces.AtlasOfDiscovery */ :
                    this.addAoDSkillcapeInheretedModifiers();
                    break;
            }
        });
    }
    addAoDSkillcapeInheretedModifiers() {
        var _a, _b;
        const capeItem = this.equipment.getItemInSlot("melvorD:Cape" /* EquipmentSlotIDs.Cape */ );
        switch (capeItem.id) {
            case "melvorF:Max_Skillcape" /* ItemIDs.Max_Skillcape */ :
            case "melvorTotH:Superior_Max_Skillcape" /* ItemIDs.Superior_Max_Skillcape */ :
            case "melvorTotH:Superior_Cape_Of_Completion" /* ItemIDs.Superior_Cape_Of_Completion */ :
            case "melvorF:Cape_of_Completion" /* ItemIDs.Cape_of_Completion */ :
                {
                    this.game.archaeology !== undefined && ((_a = this.game.archaeology) === null || _a === void 0 ? void 0 : _a.level) < 120 ?
                    this.inheritModifiersFromItem(capeItem, "melvorAoD:Archaeology_Skillcape" /* ItemIDs.Archaeology_Skillcape */ ) :
                        this.inheritModifiersFromItem(capeItem, "melvorAoD:Superior_Archaeology_Skillcape" /* ItemIDs.Superior_Archaeology_Skillcape */ );
                    this.game.cartography !== undefined && ((_b = this.game.cartography) === null || _b === void 0 ? void 0 : _b.level) < 120 ?
                    this.inheritModifiersFromItem(capeItem, "melvorAoD:Cartography_Skillcape" /* ItemIDs.Cartography_Skillcape */ ) :
                        this.inheritModifiersFromItem(capeItem, "melvorAoD:Superior_Cartography_Skillcape" /* ItemIDs.Superior_Cartography_Skillcape */ );
                    break;
                }
        }
    }
    // Inherit modifiers from defined item if equip requirements for defined item are met.
    inheritModifiersFromItem(source, itemID) {
        const item = this.game.items.getObjectByID(itemID);
        if (item === undefined || !(item instanceof EquipmentItem))
            return;
        const hasReqs = isRequirementMet(item.equipRequirements);
        if (hasReqs && item.modifiers !== undefined)
            this.modifiers.addModifiers(source, item.modifiers);
    }
    addProviderModifiers() {
        this.manager.statProviders.forEach((provider) => {
            if (provider.modifiers !== undefined)
                this.modifiers.addTable(provider.modifiers);
        });
    }
    addAttackStyleModifiers() {
        if (this.attackStyle !== undefined && this.attackStyle.stats.modifiers !== undefined)
            this.modifiers.addModifiers(this.attackStyle, this.attackStyle.stats.modifiers);
    }
    addPassiveModifiers() {
        this.manager.activeCombatPassives.forEach((_, passive) => {
            if (passive.modifiers !== undefined)
                this.modifiers.addModifiers(passive, passive.modifiers);
        });
    }
    addEquippedItemModifiers() {
        this.equipment.equippedArray.forEach((equipped) => {
            const item = equipped.item;
            if (equipped.providesStats) {
                if (item.modifiers !== undefined)
                    this.modifiers.addModifiers(item, item.modifiers);
            }
        });
        this.activeItemSynergies.forEach((synergy) => {
            if (synergy.playerModifiers !== undefined)
                this.modifiers.addModifiers(synergy, synergy.playerModifiers);
        });
    }
    addSelectedFoodModifiers() {
        const item = this.food.currentSlot.item;
        if (item.stats.modifiers !== undefined)
            this.modifiers.addModifiers(item, item.stats.modifiers);
    }
    computeItemSynergies() {
        this.activeItemSynergies.clear();
        const potentialSynergies = new Set();
        this.equipment.equippedArray.forEach((equipped) => {
            if (equipped.providesStats) {
                const synergies = this.game.itemSynergies.get(equipped.item);
                if (synergies !== undefined)
                    synergies.forEach((synergy) => potentialSynergies.add(synergy));
            }
        });
        potentialSynergies.forEach((synergy) => {
            if (this.equipment.checkForItemIDs(synergy.items))
                this.activeItemSynergies.add(synergy);
        });
    }
    computeSummoningSynergy() {
        this.activeSummoningSynergy = this.game.summoning.getUnlockedSynergy(this.equipment.getItemInSlot("melvorD:Summon1" /* EquipmentSlotIDs.Summon1 */ ), this.equipment.getItemInSlot("melvorD:Summon2" /* EquipmentSlotIDs.Summon2 */ ));
        this.assignSynergyEventHandlers();
    }
    /** Adds all conditional modifiers that are active */
    addConditionalModifiers() {
        this.manager.activeConditionalModifiers.forEach((active) => {
            if (active.conditional.modifiers !== undefined && active.isActive) {
                this.modifiers.addModifiers(active.source, active.conditional.modifiers, active.mult, active.mult);
            }
        });
    }
    addPrayerModifiers() {
        this.activePrayers.forEach((prayer) => {
            if (prayer.stats.modifiers === undefined)
                return;
            if (!prayer.isUnholy) {
                this.modifiers.addModifiers(prayer, prayer.stats.modifiers);
            } else {
                this.modifiers.addModifiers(prayer, prayer.stats.modifiers, this.unholyPrayerMultiplier, this.unholyPrayerMultiplier);
            }
        });
    }
    addGamemodeModifiers() {
        if (this.game.currentGamemode.playerModifiers !== undefined)
            this.modifiers.addModifiers(this.game.currentGamemode, this.game.currentGamemode.playerModifiers);
    }
    addSummonSynergyModifiers() {
        const synergy = this.activeSummoningSynergy;
        if (synergy !== undefined) {
            this.modifiers.addModifiers(synergy, synergy.modifiers);
        }
    }
    get equippedSummoningSynergy() {
        return this.game.summoning.getSynergy(this.equipment.getItemInSlot("melvorD:Summon1" /* EquipmentSlotIDs.Summon1 */ ), this.equipment.getItemInSlot("melvorD:Summon2" /* EquipmentSlotIDs.Summon2 */ ));
    }
    /** Gets the chance to preserve a summoning tablet */
    getSummoningTabletPreservationChance(item) {
        if (item.id === "melvorItA:Summoning_Familiar_Abyssal_Octopus" /* ItemIDs.Summoning_Familiar_Abyssal_Octopus */ && this.modifiers.useNoSummoningChargesAbyssalOctopus)
            return 100;
        const chance = this.modifiers.summoningChargePreservationChance + this.modifiers.summoningChargePreservationChanceBypass;
        return clampValue(chance, 0, 80);
    }
    /** Removes a quantity from the summoning familiar equipped in the slot, and rewards XP for it */
    removeSummonCharge(slotID, interval) {
        const item = this.equipment.getItemInSlot(slotID);
        if (this.damageType.id !== "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ )
            this.game.summoning.addXPForTabletConsumption(item, interval);
        const event = new SummonTabletUsedEvent(item, this.game.summoning.getRecipeFromProduct(item));
        if (!rollPercentage(this.getSummoningTabletPreservationChance(item))) {
            this.game.stats.Summoning.inc(SummoningStats.TabletsUsed);
            if (this.equipment.removeQuantityFromSlot(slotID, 1)) {
                this.onUnequipFromQuantityUse();
                this.manager.notifications.add({
                    type: 'Player',
                    args: [this.game.summoning, getLangString('TOASTS_FAMILIAR_OUT_OF_CHARGES'), 'danger'],
                });
            }
            this.game.summoning.renderQueue.synergyQuantities = true;
        }
        this._events.emit('summonTabletUsed', event);
        this.renderQueue.equipment = true;
    }
    calculateAreaEffectValue(value, realm) {
        switch (realm.id) {
            case "melvorD:Melvor" /* RealmIDs.Melvor */ :
                value -= this.modifiers.flatSlayerAreaEffectNegation;
                break;
            case "melvorItA:Abyssal" /* RealmIDs.Abyssal */ :
                value -= this.modifiers.flatAbyssalSlayerAreaEffectNegation;
                break;
        }
        return Math.max(value, 0);
    }
    updateUnholyPrayerMultiplier(newMultiplier) {
        const multChange = newMultiplier - this.unholyPrayerMultiplier;
        if (multChange === 0)
            return;
        this.activePrayers.forEach((prayer) => {
            if (!prayer.isUnholy)
                return;
            if (prayer.stats.enemyModifiers !== undefined) {
                this.manager.enemy.modifiers.updateModifiers(prayer, newMultiplier, newMultiplier);
                this.target.stats.setDirty();
            }
            if (prayer.stats.modifiers !== undefined) {
                this.modifiers.updateModifiers(prayer, newMultiplier, newMultiplier);
                this.stats.setDirty();
            }
            if (prayer.stats.conditionalModifiers !== undefined) {
                this.manager.updateConditionalModifierMults(prayer.stats.conditionalModifiers, newMultiplier);
            }
        });
        this.unholyPrayerMultiplier = newMultiplier;
    }
    getMeleeDefenceBonus() {
        let bonus = super.getMeleeDefenceBonus();
        this.modifiers.forEachDamageType("melvorD:flatMeleeDefenceBonusBasedOnResistance" /* ModifierIDs.flatMeleeDefenceBonusBasedOnResistance */ , (value, damageType) => {
            bonus += value * this.stats.getResistance(damageType);
        });
        bonus += this.modifiers.flatMeleeDefenceBonus;
        bonus += this.modifiers.flatMeleeDefenceBonusPerAbyssalLevel * this.game.defence.abyssalLevel;
        if (this.equipment.checkForItemID("melvorD:Obsidian_Cape" /* ItemIDs.Obsidian_Cape */ ))
            bonus += this.levels.Defence;
        return bonus;
    }
    getRangedDefenceBonus() {
        let bonus = super.getRangedDefenceBonus();
        this.modifiers.forEachDamageType("melvorD:flatRangedDefenceBonusBasedOnResistance" /* ModifierIDs.flatRangedDefenceBonusBasedOnResistance */ , (value, damageType) => {
            bonus += value * this.stats.getResistance(damageType);
        });
        bonus += this.modifiers.flatRangedDefenceBonus;
        bonus += this.modifiers.flatRangedDefenceBonusPerAbyssalLevel * this.game.defence.abyssalLevel;
        if (this.equipment.checkForItemID("melvorD:Obsidian_Cape" /* ItemIDs.Obsidian_Cape */ ))
            bonus += this.levels.Ranged;
        return bonus;
    }
    getMagicDefenceBonus() {
        let bonus = super.getMagicDefenceBonus();
        this.modifiers.forEachDamageType("melvorD:flatMagicDefenceBonusBasedOnResistance" /* ModifierIDs.flatMagicDefenceBonusBasedOnResistance */ , (value, damageType) => {
            bonus += value * this.stats.getResistance(damageType);
        });
        bonus += this.modifiers.flatMagicDefenceBonus;
        bonus += this.modifiers.flatMagicDefenceBonusPerAbyssalLevel * this.game.defence.abyssalLevel;
        return bonus;
    }
    processDeath() {
        this.removeAllEffects();
        this.setHitpoints(Math.max(1, Math.floor(this.stats.maxHitpoints * 0.2)));
        this.manager.addCombatStat(CombatStats.Deaths);
        this.manager.addMonsterStat(MonsterStats.KilledPlayer);
        this.applyDeathPenalty();
        this.disableActivePrayers();
    }
    getAccuracyModifier() {
        let modifier = super.getAccuracyModifier();
        if (this.attackType === 'melee' && this.equipment.isWeapon2H) {
            modifier += this.modifiers.meleeAccuracyRatingWith2H;
        }
        return modifier;
    }
    getEvasionModifiers() {
        const modifiers = super.getEvasionModifiers();
        if (this.equipment.isWeapon2H) {
            modifiers.melee += this.modifiers.evasionWith2HWeapon;
            modifiers.magic += this.modifiers.evasionWith2HWeapon;
            modifiers.ranged += this.modifiers.evasionWith2HWeapon;
        }
        return modifiers;
    }
    getMaxHitModifier() {
        let modifier = 0;
        let totalPrayerCost = 0;
        let abyssalCount = 0;
        this.activePrayers.forEach((prayer) => {
            totalPrayerCost += prayer.pointsPerEnemy + prayer.pointsPerPlayer + prayer.pointsPerRegen;
            if (prayer.isAbyssal)
                abyssalCount++;
        });
        modifier += applyModifier(totalPrayerCost, this.modifiers.maxHitBasedOnPrayerCost, 3);
        if (this.attackType === 'magic' && this.activePrayers.size > 0)
            modifier += this.modifiers.magicMaxHitWithActivePrayer;
        if (abyssalCount >= 2)
            modifier += this.modifiers.maxHitWith2AbyssalPrayers;
        modifier += super.getMaxHitModifier();
        return modifier;
    }
    getMinHitFromMaxHitPercent() {
        let percent = super.getMinHitFromMaxHitPercent();
        if (this.manager.onSlayerTask) {
            switch (this.attackType) {
                case 'melee':
                    percent += this.modifiers.meleeMinHitBasedOnMaxHitSlayerTask;
                    break;
                case 'ranged':
                    percent += this.modifiers.rangedMinHitBasedOnMaxHitSlayerTask;
                    break;
                case 'magic':
                    percent += this.modifiers.magicMinHitBasedOnMaxHitSlayerTask;
                    break;
            }
        }
        return percent;
    }
    /** Removes an item from the player's equipment on death */
    applyDeathPenalty() {
        let lostItem = false;
        if (this.modifiers.itemProtection <= 0 && !this.manager.giveFreeDeath) {
            const priorityOrderSlots = [...this.equipment.equippedArray].sort((a, b) => a.item.deathPenaltyPriority - b.item.deathPenaltyPriority);
            const lowestPriority = priorityOrderSlots[0].item.deathPenaltyPriority;
            let minPriorityLength = priorityOrderSlots.findIndex((equipped) => equipped.item.deathPenaltyPriority > lowestPriority);
            if (minPriorityLength === -1)
                minPriorityLength = priorityOrderSlots.length;
            const priorityIndex = rollInteger(0, minPriorityLength - 1);
            const equipped = priorityOrderSlots[priorityIndex];
            const itemLost = equipped.item;
            if (!equipped.isEmpty && this.game.tutorial.complete) {
                lostItem = true;
                addModalToQueue({
                    title: getLangString('COMBAT_MISC_YOU_DIED'),
                    html: `${getLangString('COMBAT_MISC_YOU_LOST_YOUR')}<br>
          <img class="skill-icon-sm mr-2" src="${itemLost.media}">${itemLost.name}${equipped.quantity > 1 ? ` x ${equipped.quantity}` : ''}`,
                    imageUrl: assets.getURI("assets/media/skills/combat/combat.png" /* Assets.Combat */ ),
                    imageWidth: 64,
                    imageHeight: 64,
                    imageAlt: getLangString('PAGE_NAME_Combat'),
                });
                this.addItemStat(equipped.item, ItemStats.TimesLostToDeath, equipped.quantity);
                this.game.telemetry.updatePlayerDeathEventItemLost(equipped.item, equipped.quantity);
                this.equipment.unequipItem(equipped.slot);
                this.updateForEquipmentChange();
                if (this.game.itemCharges.itemHasCharge(itemLost)) {
                    this.game.itemCharges.removeAllCharges(itemLost);
                }
            }
        }
        if (!lostItem) {
            addModalToQueue({
                title: getLangString('COMBAT_MISC_YOU_DIED'),
                html: '<span class="text-dark">' + getLangString('COMBAT_MISC_YOU_DIED_DESC') + '</span>',
                imageUrl: assets.getURI("assets/media/skills/combat/combat.png" /* Assets.Combat */ ),
                imageWidth: 64,
                imageHeight: 64,
                imageAlt: getLangString('PAGE_NAME_Combat'),
            });
        }
    }
    regen() {
        if (this.hitpoints < this.stats.maxHitpoints && this.allowRegen) {
            let regen = this.stats.maxHitpoints / 100;
            regen += numberMultiplier * this.modifiers.flatHPRegen;
            if (this.modifiers.hPRegenBasedOnMaxHP > 0) {
                regen += this.modifiers.hPRegenBasedOnMaxHP * (this.stats.maxHitpoints / 100);
            }
            regen += this.bufferedRegen;
            switch (this.attackType) {
                case 'melee':
                    regen += (this.modifiers.flatHPRegenBasedOnMeleeMaxHit * this.stats.maxHit) / 100;
                    break;
                case 'ranged':
                    regen += (this.modifiers.flatHPRegenBasedOnRangedMaxHit * this.stats.maxHit) / 100;
                    break;
                case 'magic':
                    regen += (this.modifiers.flatHPRegenBasedOnMagicMaxHit * this.stats.maxHit) / 100;
                    break;
            }
            let regenModifier = this.modifiers.hitpointRegeneration;
            if (this.modifiers.hpRegenWhenEnemyHasMoreEvasion > 0 &&
                this.manager.fightInProgress &&
                this.stats.averageEvasion < this.target.stats.averageEvasion)
                regenModifier += this.modifiers.hpRegenWhenEnemyHasMoreEvasion;
            if (this.manager.onSlayerTask)
                regenModifier += this.modifiers.hitpointRegenerationAgainstSlayerTasks;
            regen = applyModifier(regen, regenModifier);
            regen = Math.floor(regen);
            regen = this.heal(regen);
            this.modifiers.forEachCurrency("melvorD:currencyGainOnRegenBasedOnHPGained" /* ModifierIDs.currencyGainOnRegenBasedOnHPGained */ , (value, currency) => {
                const amountToAdd = regen * (value / numberMultiplier / 100);
                if (amountToAdd > 0)
                    this.manager.addCurrency(currency, amountToAdd, 'HPRegen');
            });
            this.activePrayers.forEach((prayer) => {
                !prayer.isAbyssal ?
                    this.consumePrayerPoints(prayer.pointsPerRegen, prayer.isUnholy) :
                    this.consumeSoulPoints(prayer.pointsPerRegen);
            });
            const regenEvent = new HitpointRegenerationEvent(regen);
            this._events.emit('hitpointRegen', regenEvent);
        }
        this.bufferedRegen = 0;
        this.timers.regen.start(this.hpRegenInterval);
    }
    renderStats() {
        combatMenus.playerStats.setStats(this, this.game);
        super.renderStats();
    }
    /** Renders the attack style selection menu */
    renderAttackStyle() {
        ['melee', 'ranged', 'magic'].forEach((attackType) => {
            const container = document.getElementById(`${attackType}-attack-style-buttons`);
            if (attackType === this.attackType) {
                showElement(container);
            } else {
                hideElement(container);
            }
        });
        this.game.attackStyles.forEach((style) => {
            if (style.attackType === this.attackType) {
                const button = document.getElementById(style.buttonID);
                if (this.attackStyle === style) {
                    button.classList.add('btn-secondary');
                    button.classList.remove('btn-outline-secondary');
                } else {
                    button.classList.add('btn-outline-secondary');
                    button.classList.remove('btn-secondary');
                }
            }
        });
        this.renderQueue.attackStyle = false;
    }
    setAttackStyleButtonCallbacks() {
        this.game.attackStyles.forEach((style) => {
            const button = document.getElementById(style.buttonID);
            button.onclick = () => this.setAttackStyle(style.attackType, style);
        });
    }
    renderHitchance() {
        if (!this.renderQueue.hitChance)
            return;
        if (this.manager.fightInProgress) {
            combatMenus.playerStats.setHitChance(this);
        } else {
            combatMenus.playerStats.unsetHitChance();
        }
        this.renderQueue.hitChance = false;
    }
    renderHitpoints() {
        super.renderHitpoints();
        const navText = `(${formatNumber(this.hitpoints)})`;
        let remove = 'text-danger';
        let add = 'text-success';
        if (this.hitpoints < this.stats.maxHitpoints) {
            remove = 'text-success';
            add = 'text-danger';
        }
        this.statElements.navHitpoints.forEach((elem) => {
            elem.textContent = navText;
            elem.classList.remove(remove);
            elem.classList.add(add);
        });
    }
    renderSummonMaxHit() {
        const canAttack = this.stats.canSummonAttack;
        let maxHit;
        let barrierMaxHit;
        if (canAttack) {
            maxHit = Math.floor(this.modifySummonAttackDamage(this.stats.summoningMaxHit, false));
            barrierMaxHit = Math.floor(this.modifySummonAttackDamage(this.stats.summoningMaxHit, true));
        } else {
            maxHit = 0;
            barrierMaxHit = 0;
        }
        combatMenus.playerStats.setSummonMaxHit(canAttack, maxHit, barrierMaxHit, this.manager.fightInProgress);
        if (canAttack) {
            $('.summoning-combat-bar').removeClass('invisible');
        } else {
            $('.summoning-combat-bar').addClass('invisible');
        }
    }
    renderDamageValues() {
        super.renderDamageValues();
        this.renderSummonMaxHit();
    }
    renderNormalDamage(minHit, maxHit) {
        combatMenus.playerStats.setNormalDamage(minHit, maxHit);
    }
    renderFood() {
        combatMenus.combatFood.render(this);
        combatMenus.thievingFood.render(this);
        $('#combat-food-current-qty-1').text(this.food.currentSlot.quantity);
        $('#combat-footer-minibar-food-img').attr('src', this.food.currentSlot.item.media);
        this.renderQueue.food = false;
    }
    render() {
        this.renderPrayerPoints();
        this.renderSoulPoints();
        if (this.renderQueue.attackStyle)
            this.renderAttackStyle();
        if (this.renderQueue.equipment)
            this.renderEquipment();
        this.renderPrayerSelection();
        this.renderAttackSpellSelection();
        this.renderCurseSelection();
        this.renderAuroraSelection();
        this.renderRunesUsed();
        if (this.renderQueue.food)
            this.renderFood();
        if (this.renderQueue.combatLevel)
            this.renderCombatLevel();
        if (this.renderQueue.summonBar)
            this.renderSummonBar();
        if (this.renderQueue.attacks)
            this.renderAttackIcon();
        if (this.renderQueue.equipmentSets)
            this.renderEquipmentSets();
        if (this.renderQueue.autoEat)
            this.renderAutoEat();
        if (this.renderQueue.combatTriangle)
            this.renderCombatTriangle();
        this.renderActiveSkillModifiers();
        super.render();
    }
    renderAutoEat() {
        let efficiencyClass = 'text-danger';
        if (this.autoEatThreshold > 0) {
            if (this.autoEatEfficiency >= 100)
                efficiencyClass = 'text-success';
            const tooltipContent = `<div class='text-center'>
      <span class='text-warning'> 
        ${getLangString('COMBAT_MISC_AUTO_EAT')}
      </span><br>
      <small class='text-success'> 
        ${templateLangString('COMBAT_MISC_AUTO_EAT_THRESHOLD', { amount: `${Math.floor(this.autoEatThreshold)}` })}
      </small><br>
      <small>
        ${templateLangString('COMBAT_MISC_AUTO_EAT_DESCRIPTION', {
                limitPercent: `${this.modifiers.autoEatHPLimit}`,
                threshHoldPercent: `${this.modifiers.autoEatThreshold}`,
            })}<br>
        ${getLangString('COMBAT_MISC_FOOD_EFFICIENCY')} 
        <span class="${efficiencyClass}">${formatPercent(this.modifiers.autoEatEfficiency)}</span><br>
        ${getLangString('COMBAT_MISC_WORKS_COMBAT_THIEVING')}
      </small>
    </div>`;
            this.statElements.autoEatTooltips.forEach((tooltip) => {
                tooltip.setContent(tooltipContent);
            });
            this.statElements.autoEatSpans.forEach((el) => {
                el.innerHTML = `${numberWithCommas(Math.floor(this.autoEatThreshold))}`;
                showElement(el);
            });
            this.statElements.autoEatIcons.forEach(showElement);
        } else {
            this.statElements.autoEatIcons.forEach(hideElement);
            this.statElements.autoEatSpans.forEach(hideElement);
        }
        this.renderQueue.autoEat = false;
    }
    renderCombatTriangle() {
        if (this.manager.fightInProgress) {
            /*
            //showElement(this.statElements.triangleReductionIcon);
            const reductionMod = this.manager.combatTriangle.reductionModifier[this.attackType][this.target.attackType];
            let reductionText = getLangString('COMBAT_MISC_NO_CHANGE');
            let textStyle = 'info';
            if (reductionMod !== 1) {
              reductionText = `x${reductionMod}`;
              if (reductionMod < 1) {
                textStyle = 'danger';
              } else {
                textStyle = 'success';
              }
            }
            const reductionTooltipContent = `
            <div class="text-center font-size-sm">${tooltipInfo}<br>
            <span class="text-warning">${getLangString('COMBAT_MISC_DAMAGE_REDUCTION_MULT')} </span>
            <span class="text-${textStyle}">${reductionText}</span>`;
            this.statElements.triangleReductionTooltip.setContent(reductionTooltipContent);
            */
            combatMenus.playerStats.setCombatTriangle(this, this.manager.combatTriangle, this.manager.combatTriangleSet);
        } else {
            combatMenus.playerStats.hideCombatTriangle();
        }
        this.renderQueue.combatTriangle = false;
    }
    getExperienceGainSkills() {
        const skills = [];
        if (this.attackStyle !== undefined) {
            this.attackStyle.experienceGain.forEach((gain) => {
                skills.push(gain.skill);
            });
        }
        skills.push(this.game.hitpoints);
        if (this.activePrayers.size > 0)
            skills.push(this.game.prayer);
        if (this.manager.onSlayerTask)
            skills.push(this.game.slayer);
        return skills;
    }
    /** Renders changes in the UI due to mutations in player modifiers */
    renderActiveSkillModifiers() {
        var _a, _b, _c, _d;
        if (!this.renderQueue.activeSkillModifierChange)
            return;
        if (((_b = (_a = this.game.openPage) === null || _a === void 0 ? void 0 : _a.action) === null || _b === void 0 ? void 0 : _b.renderModifierChange) !== undefined)
            (_d = (_c = this.game.openPage) === null || _c === void 0 ? void 0 : _c.action) === null || _d === void 0 ? void 0 : _d.renderModifierChange();
        this.game.bank.renderModifierChange();
        this.renderQueue.activeSkillModifierChange = false;
    }
    renderEquipment() {
        combatMenus.equipment.forEach((grid) => {
            grid.setEquipment(this);
        });
        const menuMedia = this.equipment.equipMenuMedia;
        combatMenus.equipmentMenuIcons.forEach((icon) => (icon.src = menuMedia));
        // TODO_C: Item charge rendering could likely be put in a seperate render call
        if (!(this instanceof RaidPlayer))
            this.renderItemCharges();
        this.renderQueue.equipment = false;
    }
    renderItemCharges() {
        const equippedIDs = new Map();
        this.equipment.itemChargeUsers.forEach((equipped) => {
            equippedIDs.set(equipped.item.id, equipped.item);
        });
        const chargeDisplays = document.querySelectorAll('item-charge-display');
        chargeDisplays.forEach((display) => {
            const itemID = display.getAttribute('data-item-id');
            if (itemID !== null && equippedIDs.has(itemID)) {
                if (!display.initialized) {
                    const item = equippedIDs.get(itemID);
                    if (item !== undefined) {
                        display.setItem(item);
                        display.updateCharges(this.game.itemCharges.getCharges(item));
                    }
                    display.setInitialized();
                }
                showElement(display);
            } else {
                hideElement(display);
            }
        });
    }
    renderEquipmentSets() {
        combatMenus.equipSets.forEach((menu) => {
            menu.render(this.equipmentSets, this.selectedEquipmentSet, this);
        });
        this.renderQueue.equipmentSets = false;
    }
    renderAttackIcon() {
        let tooltipContent = '';
        this.availableAttacks.forEach((selection) => {
            let chanceText = formatPercent(selection.chance);
            if (Math.floor(selection.chance) !== selection.chance) {
                chanceText = formatPercent(selection.chance, 2);
            }
            if (selection.attack !== this.game.normalAttack) {
                tooltipContent += `
        <div class='text-center'>
          <small class='text-success'>${getLangString('BANK_STRING_37')}<br>
            <span class='text-danger'>${selection.attack.name} (${chanceText}): </span>
            <span class='text-warning'>${selection.attack.modifiedDescription}</span>
          </small>
        </div>`;
            }
        });
        if (tooltipContent !== '') {
            showElement(this.statElements.specialIcon);
            this.statElements.specialTooltip.setContent(tooltipContent);
        } else {
            hideElement(this.statElements.specialIcon);
        }
        this.renderQueue.attacks = false;
    }
    renderSummonBar() {
        this.renderQueue.summonBar = false;
        this.renderQueue.summonBarMinibar = false;
        if (!this.timers.summon.isActive) {
            this.summonBar.stopAnimation();
            this.summonBarMinibar.stopAnimation();
            return;
        }
        this.summonBar.animateProgressFromTimer(this.timers.summon);
        this.summonBarMinibar.animateProgressFromTimer(this.timers.summon);
    }
    /** Rewards XP and rolls for pets */
    rewardXPAndPetsForDamage(damage) {
        damage = damage / numberMultiplier;
        const attackInterval = this.timers.act.maxTicks * TICK_INTERVAL;
        // Combat Style
        if (this.attackStyle !== undefined) {
            this.attackStyle.experienceGain.forEach((gain) => {
                const xpBefore = gain.skill.xp;
                const levelBefore = gain.skill.level;
                const axpBefore = gain.skill.abyssalXP;
                const abyssalLevelBefore = gain.skill.abyssalLevel;
                // TODO_C - Replace when damage type modifiers are added
                if (this.damageType.id !== "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ ) {
                    this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ ?
                        gain.skill.addAbyssalXP(gain.ratio * damage) :
                        gain.skill.addXP(gain.ratio * damage);
                }
                this.rollForSummoningMarks(gain.skill, attackInterval);
                gain.skill.rollForPets(attackInterval);
                if (this.attackCount === 1)
                    gain.skill.rollForAncientRelics(gain.skill.level, this.manager.areaRealm);
                if (gain.skill.xp > xpBefore) {
                    this.game.telemetry.createOnlineXPGainEvent(gain.skill, attackInterval, xpBefore, gain.skill.xp, levelBefore, gain.skill.level);
                }
                if (gain.skill.abyssalXP > axpBefore) {
                    this.game.telemetry.createOnlineAXPGainEvent(gain.skill, attackInterval, axpBefore, gain.skill.abyssalXP, abyssalLevelBefore, gain.skill.abyssalLevel);
                }
            });
        }
        // Hitpoints
        const hpXpBefore = this.game.hitpoints.xp;
        const hpLevelBefore = this.game.hitpoints.level;
        const hpAXpBefore = this.game.hitpoints.abyssalXP;
        const hpAbyssalLevelBefore = this.game.hitpoints.abyssalLevel;
        // TODO_C - Replace when damage type modifiers are added
        if (this.damageType.id !== "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ ) {
            this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ ?
                this.game.hitpoints.addAbyssalXP(damage * 1.33) :
                this.game.hitpoints.addXP(damage * 1.33);
        }
        this.rollForSummoningMarks(this.game.hitpoints, attackInterval);
        this.game.hitpoints.rollForPets(attackInterval);
        if (this.attackCount === 1)
            this.game.hitpoints.rollForAncientRelics(this.game.hitpoints.level, this.manager.areaRealm);
        if (this.game.hitpoints.xp > hpXpBefore) {
            this.game.telemetry.createOnlineXPGainEvent(this.game.hitpoints, attackInterval, hpXpBefore, this.game.hitpoints.xp, hpLevelBefore, this.game.hitpoints.level);
        }
        if (this.game.hitpoints.abyssalXP > hpAXpBefore) {
            this.game.telemetry.createOnlineAXPGainEvent(this.game.hitpoints, attackInterval, hpAXpBefore, this.game.hitpoints.abyssalXP, hpAbyssalLevelBefore, this.game.hitpoints.abyssalLevel);
        }
        // Prayer
        let prayerRatio = 0;
        let prayerXPToAdd = 0;
        let abyssalPrayerRatio = 0;
        let abyssalPrayerXPToAdd = 0;
        this.activePrayers.forEach((prayer) => {
            if (prayer.isAbyssal)
                abyssalPrayerRatio += prayer.pointsPerPlayer;
            else
                prayerRatio += prayer.pointsPerPlayer;
        });
        prayerRatio /= 3;
        abyssalPrayerRatio /= 3;
        if (this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ ) {
            abyssalPrayerXPToAdd = abyssalPrayerRatio * damage;
        } else {
            prayerXPToAdd = prayerRatio * damage;
        }
        if ((prayerRatio > 0 || abyssalPrayerRatio > 0) && this.attackCount === 1) {
            const xpBefore = this.game.prayer.xp;
            const levelBefore = this.game.prayer.level;
            const axpBefore = this.game.prayer.abyssalXP;
            const abyssalLevelBefore = this.game.prayer.abyssalLevel;
            if (prayerXPToAdd > 0)
                this.game.prayer.addXP(prayerXPToAdd);
            if (abyssalPrayerXPToAdd > 0)
                this.game.prayer.addAbyssalXP(abyssalPrayerXPToAdd);
            this.rollForSummoningMarks(this.game.prayer, attackInterval);
            this.game.prayer.rollForPets(attackInterval);
            if (this.attackCount === 1)
                this.game.prayer.rollForAncientRelics(this.game.prayer.level, this.manager.areaRealm);
            if (this.game.prayer.xp > xpBefore) {
                this.game.telemetry.createOnlineXPGainEvent(this.game.prayer, attackInterval, xpBefore, this.game.prayer.xp, levelBefore, this.game.prayer.level);
            }
            if (this.game.prayer.abyssalXP > axpBefore) {
                this.game.telemetry.createOnlineAXPGainEvent(this.game.prayer, attackInterval, axpBefore, this.game.prayer.abyssalXP, abyssalLevelBefore, this.game.prayer.abyssalLevel);
            }
        }
        if (this.manager.onSlayerTask) {
            this.rollForSummoningMarks(this.game.slayer, attackInterval);
            this.game.slayer.rollForPets(attackInterval);
            if (this.attackCount === 1)
                this.game.slayer.rollForAncientRelics(this.game.slayer.level, this.manager.areaRealm);
        }
        if (this.target.isCorrupted && this.game.corruption !== undefined) {
            this.rollForSummoningMarks(this.game.corruption, attackInterval);
            this.game.corruption.rollForPets(attackInterval);
            if (this.attackCount === 1)
                this.game.corruption.rollForAncientRelics(this.game.corruption.abyssalLevel, this.manager.areaRealm);
        }
    }
    rollForSummoningMarks(skill, interval) {
        this.game.summoning.rollMarksForSkill(skill, interval, this.manager.areaRealm);
    }
    rewardCurrencyForSummonDamage(damage, isBarrierDmg) {
        damage = damage / numberMultiplier;
        if (isBarrierDmg) {
            this.modifiers.forEachCurrency("melvorD:currencyGainBasedOnBarrierDamage" /* ModifierIDs.currencyGainBasedOnBarrierDamage */ , (value, currency) => {
                const amount = (damage * value) / 100;
                if (amount > 0)
                    this.manager.addCurrency(currency, amount, `Combat.SummonDealsDamage`);
            });
        } else {
            this.modifiers.forEachCurrency("melvorD:currencyGainBasedOnSummonDamage" /* ModifierIDs.currencyGainBasedOnSummonDamage */ , (value, currency) => {
                const amount = (damage * value) / 100;
                if (amount > 0)
                    this.manager.addCurrency(currency, amount, `Combat.SummonDealsDamage`);
            });
        }
    }
    rewardXPForSummonBarrierDamage(damage) {
        damage = damage / numberMultiplier;
        if (damage > 0) {
            this.game.summoning.addXP(damage * 0.67);
        }
    }
    rewardCurrencyForDamage(damage) {
        damage = damage / numberMultiplier;
        const currencyMults = new SparseNumericMap();
        this.modifiers.forEachCurrency("melvorD:currencyGainPerDamageDealt" /* ModifierIDs.currencyGainPerDamageDealt */ , (value, currency) => {
            currencyMults.add(currency, value);
        });
        switch (this.attackType) {
            case 'melee':
                this.modifiers.forEachCurrency("melvorD:currencyGainPerMeleeDamageDealt" /* ModifierIDs.currencyGainPerMeleeDamageDealt */ , (value, currency) => currencyMults.add(currency, value));
                break;
            case 'ranged':
                this.modifiers.forEachCurrency("melvorD:currencyGainPerRangedDamageDealt" /* ModifierIDs.currencyGainPerRangedDamageDealt */ , (value, currency) => currencyMults.add(currency, value));
                break;
            case 'magic':
                this.modifiers.forEachCurrency("melvorD:currencyGainPerMagicDamageDealt" /* ModifierIDs.currencyGainPerMagicDamageDealt */ , (value, currency) => currencyMults.add(currency, value));
                if (this.manager.onSlayerTask)
                    this.modifiers.forEachCurrency("melvorD:currencyGainPerMagicDamageDealtOnSlayerTask" /* ModifierIDs.currencyGainPerMagicDamageDealtOnSlayerTask */ , (value, currency) => currencyMults.add(currency, value));
                break;
        }
        this.modifiers.forEachCurrency("melvorD:currencyGainPerDamageDealtBasedOnCurrencyAmount" /* ModifierIDs.currencyGainPerDamageDealtBasedOnCurrencyAmount */ , (value, currency) => {
            let multToAdd = (currency.amount / 1e6) * value;
            multToAdd = clampValue(multToAdd, this.modifiers.getValue("melvorD:minCurrencyMultiplierPerDamage" /* ModifierIDs.minCurrencyMultiplierPerDamage */ , currency.modQuery), this.modifiers.getValue("melvorD:maxCurrencyMultiplierPerDamage" /* ModifierIDs.maxCurrencyMultiplierPerDamage */ , currency.modQuery));
            currencyMults.add(currency, multToAdd);
        });
        currencyMults.forEach((mult, currency) => {
            const amountToAdd = (damage * mult) / 100;
            if (amountToAdd > 0)
                this.manager.addCurrency(currency, amountToAdd, `Combat.PlayerDealsDamage`);
        });
    }
    rewardForKill() {
        this.rewardCurrencyForKill();
        this.rewardPrayerPointsForKill();
    }
    rewardCurrencyForKill() {
        this.modifiers.forEachCurrency("melvorD:currencyGainOnMonsterKillBasedOnEvasion" /* ModifierIDs.currencyGainOnMonsterKillBasedOnEvasion */ , (value, currency) => {
            const amount = (this.target.stats.maxEvasion * value) / 100;
            if (amount > 0)
                this.manager.addCurrency(currency, amount, `Combat.OnMonsterKill`);
        });
        if (this.manager.enemy.monster === undefined)
            return;
        const combatLevel = this.manager.enemy.monster.combatLevel;
        this.modifiers.forEachCurrency("melvorD:flatCurrencyGainOnMonsterKillBasedOnCombatLevel" /* ModifierIDs.flatCurrencyGainOnMonsterKillBasedOnCombatLevel */ , (value, currency) => {
            const amount = combatLevel * value;
            if (amount > 0)
                this.manager.addCurrency(currency, amount, `Combat.OnMonsterKill`);
        });
    }
    rewardPrayerPointsForKill() {
        if (this.modifiers.flatPrayerPointsPerMonsterKill > 0)
            this.addPrayerPoints(this.modifiers.flatPrayerPointsPerMonsterKill);
        if (this.modifiers.flatSoulPointsPerMonsterKill > 0)
            this.addSoulPoints(this.modifiers.flatSoulPointsPerMonsterKill);
    }
    initializeForCombat() {
        this.renderQueue.summonBar = true;
        this.renderQueue.summonBarMinibar = true;
        this.renderQueue.combatTriangle = true;
        super.initializeForCombat();
    }
    stopFighting() {
        this.timers.summon.stop();
        super.stopFighting();
    }
    renderCombatLevel() {
        const text = templateString(getLangString('COMBAT_MISC_93'), {
            level: `${this.game.playerCombatLevel}`
        });
        this.statElements.combatLevel.forEach((elem) => (elem.textContent = text));
        this.renderQueue.combatLevel = false;
    }
    resetActionState() {
        super.resetActionState();
        this.timers.summon.stop();
    }
    encode(writer) {
        super.encode(writer);
        writer.writeBoolean(this.attackStyles.melee !== undefined);
        if (this.attackStyles.melee)
            writer.writeNamespacedObject(this.attackStyles.melee);
        writer.writeBoolean(this.attackStyles.ranged !== undefined);
        if (this.attackStyles.ranged)
            writer.writeNamespacedObject(this.attackStyles.ranged);
        writer.writeBoolean(this.attackStyles.magic !== undefined);
        if (this.attackStyles.magic)
            writer.writeNamespacedObject(this.attackStyles.magic);
        writer.writeUint32(this.prayerPoints);
        writer.writeUint16(this.selectedEquipmentSet);
        writer.writeArray(this.equipmentSets, (set, writer) => set.encode(writer));
        this.food.encode(writer);
        this.timers.summon.encode(writer);
        writer.writeUint32(this.soulPoints);
        writer.writeUint8(this.unholyPrayerMultiplier);
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        const oldSpellSelection = new SpellSelection(this.game);
        if (version <= 24) {
            oldSpellSelection.decode(reader, version);
        }
        if (reader.getBoolean()) {
            const style = reader.getNamespacedObject(this.game.attackStyles);
            if (typeof style === 'string')
                this.attackStyles.melee = this.game.attackStyles.find((style) => style.attackType === 'melee');
            else
                this.attackStyles.melee = style;
        }
        if (reader.getBoolean()) {
            const style = reader.getNamespacedObject(this.game.attackStyles);
            if (typeof style === 'string')
                this.attackStyles.ranged = this.game.attackStyles.find((style) => style.attackType === 'ranged');
            else
                this.attackStyles.ranged = style;
        }
        if (reader.getBoolean()) {
            const style = reader.getNamespacedObject(this.game.attackStyles);
            if (typeof style === 'string')
                this.attackStyles.magic = this.game.attackStyles.find((style) => style.attackType === 'magic');
            else
                this.attackStyles.magic = style;
        }
        this.prayerPoints = reader.getUint32();
        this.selectedEquipmentSet = reader.getUint16();
        if (version <= 24) {
            this.equipmentSets = reader.getArray((reader) => {
                const set = new EquipmentSet(this.game);
                set.equipment.decode(reader, version, this.addItemsToBankOnLoadFail);
                return set;
            });
        } else {
            this.equipmentSets = reader.getArray((reader) => {
                const set = new EquipmentSet(this.game);
                set.decode(reader, version, this.addItemsToBankOnLoadFail);
                return set;
            });
        }
        this.food.decode(reader, version, this.addItemsToBankOnLoadFail);
        if (version <= 24) {
            this.equipmentSets[this.selectedEquipmentSet].spellSelection = oldSpellSelection;
            const oldPrayerSelection = reader.getSet(readNamespacedReject(this.game.prayers));
            this.equipmentSets[this.selectedEquipmentSet].prayerSelection = oldPrayerSelection;
            this.equipmentSets.forEach((set) => set.spellSelection.validate());
        }
        this.timers.summon.decode(reader, version);
        if (version >= 100 /* SaveVersion.IntoTheAbyss */ ) {
            this.soulPoints = reader.getUint32();
            this.unholyPrayerMultiplier = reader.getUint8();
        }
        if (this.timers.summon.isActive &&
            this.equipment.isSlotEmpty("melvorD:Summon1" /* EquipmentSlotIDs.Summon1 */ ) &&
            this.equipment.isSlotEmpty("melvorD:Summon2" /* EquipmentSlotIDs.Summon2 */ ))
            this.timers.summon.stop();
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        const spellSelection = new SpellSelection(this.game);
        const standardID = reader.getNumber();
        if (standardID >= 0) {
            spellSelection.attack = this.game.attackSpells.getObjectByID(idMap.magicStandardSpells[standardID]);
        }
        const ancientID = reader.getNumber();
        if (ancientID >= 0) {
            spellSelection.attack = this.game.attackSpells.getObjectByID(idMap.magicAncients[ancientID]);
        }
        const auroraID = reader.getNumber();
        if (auroraID >= 0) {
            spellSelection.aurora = this.game.auroraSpells.getObjectByID(idMap.magicAuroras[auroraID]);
        }
        const curseID = reader.getNumber();
        if (curseID >= 0) {
            spellSelection.curse = this.game.curseSpells.getObjectByID(idMap.magicCurses[curseID]);
        }
        const getStyle = (oldID, type) => {
            let style = this.game.attackStyles.getObjectByID(idMap.attackStyles[oldID]);
            if (style === undefined)
                style = this.game.attackStyles.find((style) => style.attackType === type);
            return style;
        };
        this.attackStyles.melee = getStyle(reader.getNumber(), 'melee');
        this.attackStyles.ranged = getStyle(reader.getNumber(), 'ranged');
        this.attackStyles.magic = getStyle(reader.getNumber(), 'magic');
        this.prayerPoints = reader.getNumber();
        if (this.prayerPoints < 0)
            this.prayerPoints = 0;
        this.selectedEquipmentSet = reader.getNumber();
        const slayerCoins = reader.getNumber();
        if (!(this instanceof RaidPlayer))
            this.game.slayerCoins.set(slayerCoins);
        const numSets = reader.getNumber();
        for (let i = 0; i < numSets; i++) {
            if (this.equipmentSets[i] === undefined) {
                this.equipmentSets.push(new EquipmentSet(this.game));
            }
            const equipment = this.equipmentSets[i].equipment;
            equipment.deserialize(reader.getVariableLengthChunk(), version, idMap, this.addItemsToBankOnLoadFail);
        }
        this.food.deserialize(reader.getVariableLengthChunk(), version, idMap, this.addItemsToBankOnLoadFail);
        const numPrayers = reader.getNumber();
        const activePrayers = new Set();
        for (let i = 0; i < numPrayers; i++) {
            const prayerID = reader.getNumber();
            const prayer = this.game.prayers.getObjectByID(idMap.prayers[prayerID]);
            if (prayer !== undefined)
                activePrayers.add(prayer);
        }
        this.timers.summon.deserialize(reader.getChunk(3), version);
        if (this.timers.summon.isActive &&
            this.equipment.isSlotEmpty("melvorD:Summon1" /* EquipmentSlotIDs.Summon1 */ ) &&
            this.equipment.isSlotEmpty("melvorD:Summon2" /* EquipmentSlotIDs.Summon2 */ ))
            this.timers.summon.stop();
        if (version >= 21)
            this.deserializeQuickEquip(reader.getVariableLengthChunk(), version, idMap);
        this.equipmentSets[this.selectedEquipmentSet].spellSelection = spellSelection;
        this.equipmentSets[this.selectedEquipmentSet].prayerSelection = activePrayers;
        this.equipmentSets.forEach((set) => set.spellSelection.validate());
    }
    deserializeQuickEquip(reader, version, idMap) {
        const numEquipSets = reader.getNumber();
        for (let i = 0; i < numEquipSets; i++) {
            const setID = reader.getNumber();
            const numEquipSlots = reader.getNumber();
            const equipSet = this.equipmentSets[setID];
            for (let j = 0; j < numEquipSlots; j++) {
                const oldSlotID = reader.getNumber();
                const numItems = reader.getNumber();
                const slot = this.game.equipmentSlots.getObjectByID(Equipment.slotIDMap[oldSlotID]);
                const quickEquipItems = [];
                for (let k = 0; k < numItems; k++) {
                    const itemID = reader.getNumber();
                    if (itemID === -1)
                        quickEquipItems.push(this.game.emptyEquipmentItem);
                    else {
                        const item = this.game.items.equipment.getObjectByID(idMap.items[itemID]);
                        if (item === undefined)
                            quickEquipItems.push(this.game.emptyEquipmentItem);
                        else
                            quickEquipItems.push(item);
                    }
                }
                if (equipSet !== undefined && slot !== undefined)
                    equipSet.equipment.setQuickEquipItems(slot, quickEquipItems);
            }
        }
    }
    /** Sets properties based on the old save file variables */
    convertFromOldSaveFormat(saveGame, idMap) {
        var _a, _b, _c, _d, _e, _f, _g;
        this.game.slayerCoins.set((_a = saveGame.slayerCoins) !== null && _a !== void 0 ? _a : 0);
        this.prayerPoints = (_b = saveGame.prayerPoints) !== null && _b !== void 0 ? _b : 0;
        if (this.prayerPoints < 0)
            this.prayerPoints = 0;
        const spellSelection = new SpellSelection(this.game);
        const standardID = (_c = saveGame.selectedSpell) !== null && _c !== void 0 ? _c : 0;
        if (standardID >= 0) {
            let spell = this.game.attackSpells.getObjectByID(idMap.magicStandardSpells[standardID]);
            if (spell === undefined)
                spell = this.game.attackSpells.firstObject;
            spellSelection.attack = spell;
        }
        const auroraId = (_d = saveGame.activeAurora) !== null && _d !== void 0 ? _d : -1;
        if (auroraId >= 0) {
            const aurora = this.game.auroraSpells.getObjectByID(idMap.magicAuroras[auroraId]);
            if (aurora !== undefined)
                spellSelection.aurora = aurora;
        }
        this.hitpoints = (_f = (_e = saveGame.combatData) === null || _e === void 0 ? void 0 : _e.player.hitpoints) !== null && _f !== void 0 ? _f : 10 * numberMultiplier;
        this.selectedEquipmentSet = (_g = saveGame.selectedEquipmentSet) !== null && _g !== void 0 ? _g : 0;
        const getStyle = (oldID, type) => {
            let style = this.game.attackStyles.getObjectByID(idMap.attackStyles[oldID]);
            if (style === undefined)
                style = this.game.attackStyles.find((style) => style.attackType === type);
            return style;
        };
        if (saveGame.selectedAttackStyle !== undefined) {
            this.attackStyles.melee = getStyle(saveGame.selectedAttackStyle[0], 'melee');
            this.attackStyles.ranged = getStyle(saveGame.selectedAttackStyle[1], 'ranged');
            this.attackStyles.magic = getStyle(saveGame.selectedAttackStyle[1], 'magic');
        }
        if (saveGame.equipmentSets !== undefined) {
            for (let i = 0; i < 3; i++) {
                const oldSet = saveGame.equipmentSets[i];
                if (this.equipmentSets[i] === undefined) {
                    this.equipmentSets.push(new EquipmentSet(this.game));
                }
                const equipment = this.equipmentSets[i].equipment;
                equipment.convertFromOldFormat(oldSet, idMap);
            }
        }
        if (saveGame.equippedFood !== undefined)
            this.food.convertFromOldSaveFormat(saveGame.equippedFood, idMap);
        this.equipmentSets[this.selectedEquipmentSet].spellSelection = spellSelection;
        this.equipmentSets.forEach((set) => set.spellSelection.validate());
    }
}
class PlayerRenderQueue extends CharacterRenderQueue {
    constructor() {
        super(...arguments);
        this.prayerPoints = false;
        this.prayerSelection = false;
        this.attackSpellSelection = false;
        this.curseSelection = false;
        this.auroraSelection = false;
        this.attackStyle = false;
        this.equipment = false;
        this.food = false;
        this.combatLevel = false;
        this.summonBar = false;
        this.summonBarMinibar = false;
        this.attacks = false;
        this.equipmentSets = false;
        this.runesUsed = false;
        this.autoEat = false;
        this.combatTriangle = false;
        this.levels = false;
        this.activeSkillModifierChange = false;
        this.soulPoints = false;
    }
}
//# sourceMappingURL=player.js.map
checkFileVersion('?12097')