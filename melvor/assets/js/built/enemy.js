"use strict";
class Enemy extends Character {
    constructor(manager, game) {
        super(manager, game);
        this.manager = manager;
        this.game = game;
        /* #region GameEventEmitter Boilerplate */
        this._events = mitt();
        this.on = this._events.on;
        this.off = this._events.off;
        // Properties that need to be saved
        this.state = EnemyState.Dead;
        // Properties that can be derived from saved Properties
        this.modifiers = new CharacterModifierTable();
        this.spellSelection = new SpellSelection(this.game);
        this.stats = new CharacterCombatStats(this);
        this.renderQueue = new EnemyRenderQueue();
        this.randomAttackType = 'unset';
        this.assignEffectApplicatorListeners();
        this.on('effectGroupApplied', (e) => {
            if (e.group.id === "melvorItA:Corruption" /* CombatEffectGroupIDs.Corruption */ )
                this.renderQueue.image = true;
        });
    }
    /* #endregion */
    get type() {
        return 'Enemy';
    }
    get statElements() {
        return enemyHTMLElements;
    }
    get splashManager() {
        return combatMenus.enemySplashManager;
    }
    get effectRenderer() {
        return combatMenus.enemyEffectRenderer;
    }
    get attackBar() {
        return combatMenus.progressBars.enemyAttack;
    }
    get attackBarMinibar() {
        return combatMenus.progressBars.enemyAttackMinibar;
    }
    /** Flag for if the monster property should be encoded */
    get encodeMonster() {
        return true;
    }
    /** Sets a new monster to this enemy, preparing it for spawning */
    setNewMonster(monster) {
        this.resetForSpawning();
        this.state = EnemyState.Dead;
        // Perform a partial recalculation of stats
        const oldMonster = this.monster;
        if (oldMonster !== monster) {
            if (oldMonster !== undefined) {
                this.splitEffectApplicators(oldMonster.combatEffects);
            }
            this.mergeEffectApplicators(monster.combatEffects);
            this.setStatsFromMonster(monster);
            // Compute/Set all of the stats that come from the monster itself
            this.monster = monster;
            this.computeDamageType();
        }
        // Recompute the damage type to support override damage types from combat areas if set
        if (this.overrideDamageType !== undefined)
            this.computeDamageType();
        // Always recompute the attack type to support random attack types
        this.randomAttackType = 'unset';
        this.computeAttackType();
        this.computePostModifierStats();
        this.setHitpoints(this.stats.maxHitpoints);
        this.setBarrier(this.stats.maxBarrier);
        this.timers.regen.start(this.hpRegenInterval);
    }
    computeAttackType() {
        if (this.monster === undefined) {
            this.attackType = 'melee';
            return;
        }
        if (this.monster.attackType === 'random') {
            if (this.randomAttackType === 'unset') {
                let newAttackType;
                switch (rollInteger(0, 2)) {
                    case 0:
                        newAttackType = 'melee';
                        break;
                    case 1:
                        newAttackType = 'ranged';
                        break;
                    default:
                        newAttackType = 'magic';
                        break;
                }
                this.randomAttackType = newAttackType;
                this.attackType = newAttackType;
            } else {
                this.attackType = this.randomAttackType;
            }
        } else {
            this.attackType = this.monster.attackType;
        }
    }
    computeDamageType() {
        const prev = this.damageType;
        if (this.monster === undefined) {
            this.damageType = game.normalDamage;
            return;
        }
        if (this.overrideDamageType !== undefined)
            this.damageType = this.overrideDamageType;
        else
            this.damageType = this.monster.damageType;
        if (prev !== this.damageType) {
            this.selfModifierQuery.replace({
                damageType: this.damageType
            });
        }
    }
    computeAttackSelection() {
        if (this.monster !== undefined)
            this.availableAttacks = [...this.monster.specialAttacks];
        else
            this.availableAttacks = [];
        if (this.game.currentGamemode.enemySpecialAttacks !== undefined)
            this.availableAttacks.push(...this.game.currentGamemode.enemySpecialAttacks);
        const totalChance = this.availableAttacks.reduce((prev, attack) => {
            return prev + attack.chance;
        }, 0);
        if (totalChance < 100)
            this.availableAttacks.push({
                attack: this.game.normalAttack,
                chance: 100 - totalChance,
            });
        this.renderQueue.attacks = true;
    }
    mergeInheritedEffectApplicators() {
        super.mergeInheritedEffectApplicators();
        // Passives
        this.manager.activeCombatPassives.forEach((_, passive) => {
            if (passive.enemyCombatEffects !== undefined)
                this.mergeEffectApplicators(passive.enemyCombatEffects);
        });
        // Monster
        if (this.monster !== undefined)
            this.mergeEffectApplicators(this.monster.combatEffects);
    }
    mergeUninheritedEffectApplicators() {
        // Gamemode
        if (this.game.currentGamemode.enemyCombatEffects !== undefined)
            this.mergeEffectApplicators(this.game.currentGamemode.enemyCombatEffects);
    }
    computeLevels() {
        if (this.monster !== undefined)
            Object.assign(this.levels, this.monster.levels);
    }
    computeAbyssalLevels() {
        if (this.monster !== undefined)
            this.abyssalLevels.Corruption = this.monster.levels.Corruption;
    }
    computeEquipmentStats() {
        this.equipmentStats.resetStats();
        if (this.monster !== undefined) {
            this.equipmentStats.addStats(this.monster.equipmentStats);
        }
    }
    computeModifiers() {
        this.modifiers.empty();
        this.addAuroraModifiers();
        this.addPassiveModifiers();
        this.addProviderModifiers();
        this.addPlayerAttackStyleModifiers();
        this.addPlayerEquipmentModifiers();
        this.addPlayerFoodModifiers();
        this.addPlayerPrayerModifiers();
        this.addPlayerAuroraModifiers();
        this.addConditionalModifiers();
        this.addEffectModifiers();
        this.addGamemodeModifiers();
    }
    addPassiveModifiers() {
        this.manager.activeCombatPassives.forEach((_, passive) => {
            if (passive.enemyModifiers !== undefined)
                this.modifiers.addModifiers(passive, passive.enemyModifiers);
        });
    }
    addGamemodeModifiers() {
        if (this.game.currentGamemode.enemyModifiers !== undefined)
            this.modifiers.addModifiers(this.game.currentGamemode, this.game.currentGamemode.enemyModifiers);
    }
    /** Adds the enemy modifiers from stat providers */
    addProviderModifiers() {
        this.manager.statProviders.forEach((provider) => {
            if (provider.enemyModifiers !== undefined)
                this.modifiers.addTable(provider.enemyModifiers);
        });
    }
    /** Adds the enemy modifiers from player attack styles */
    addPlayerAttackStyleModifiers() {
        const attackStyle = this.manager.player.attackStyle;
        if ((attackStyle === null || attackStyle === void 0 ? void 0 : attackStyle.stats.enemyModifiers) !== undefined) {
            this.modifiers.addModifiers(attackStyle, attackStyle.stats.enemyModifiers);
        }
    }
    /** Adds the enemy modifiers from the player's equipment */
    addPlayerEquipmentModifiers() {
        this.manager.player.equipment.equippedArray.forEach((equipped) => {
            const item = equipped.item;
            if (equipped.providesStats && item.enemyModifiers !== undefined) {
                this.modifiers.addModifiers(item, item.enemyModifiers);
            }
        });
        this.manager.player.activeItemSynergies.forEach((synergy) => {
            if (synergy.enemyModifiers !== undefined)
                this.modifiers.addModifiers(synergy, synergy.enemyModifiers);
        });
        const synergy = this.manager.player.activeSummoningSynergy;
        if ((synergy === null || synergy === void 0 ? void 0 : synergy.enemyModifiers) !== undefined) {
            this.modifiers.addModifiers(synergy, synergy.enemyModifiers);
        }
    }
    /** Adds the enemy modifiers from the player's food */
    addPlayerFoodModifiers() {
        const item = this.manager.player.food.currentSlot.item;
        if (item.stats.enemyModifiers !== undefined) {
            this.modifiers.addModifiers(item, item.stats.enemyModifiers);
        }
    }
    addPlayerPrayerModifiers() {
        const player = this.manager.player;
        player.activePrayers.forEach((prayer) => {
            if (prayer.stats.enemyModifiers !== undefined) {
                if (!prayer.isUnholy) {
                    this.modifiers.addModifiers(prayer, prayer.stats.enemyModifiers);
                } else {
                    this.modifiers.addModifiers(prayer, prayer.stats.enemyModifiers, player.unholyPrayerMultiplier, player.unholyPrayerMultiplier);
                }
            }
        });
    }
    addPlayerAuroraModifiers() {
        const aurora = this.manager.player.spellSelection.aurora;
        if (this.manager.player.canAurora && (aurora === null || aurora === void 0 ? void 0 : aurora.stats.enemyModifiers) !== undefined) {
            this.modifiers.addModifiers(aurora, aurora.stats.enemyModifiers);
        }
    }
    /** Adds all conditional modifiers that are active */
    addConditionalModifiers() {
        this.manager.activeConditionalModifiers.forEach((active) => {
            if (active.conditional.enemyModifiers !== undefined && active.isActive) {
                this.modifiers.addModifiers(active.source, active.conditional.enemyModifiers, active.mult, active.mult);
            }
        });
    }
    getAccuracyValues() {
        let effectiveLevel = 0;
        let accuracyBonus = 0;
        switch (this.attackType) {
            case 'melee':
                effectiveLevel = this.levels.Attack;
                accuracyBonus = this.equipmentStats.stabAttackBonus;
                break;
            case 'magic':
                effectiveLevel = this.levels.Magic;
                accuracyBonus = this.equipmentStats.magicAttackBonus;
                break;
            case 'ranged':
                effectiveLevel = this.levels.Ranged;
                accuracyBonus = this.equipmentStats.rangedAttackBonus;
                break;
            default:
                throw new Error(`Invalid attacktype set: ${this.attackType}`);
        }
        return {
            effectiveLevel: effectiveLevel,
            bonus: accuracyBonus,
        };
    }
    getFlatReflectDamage() {
        return this.modifiers.getFlatReflectDamage() * numberMultiplier;
    }
    damage(amount, source) {
        this.manager.addMonsterStat(MonsterStats.DamageTakenFromPlayer, amount);
        this.manager.addCombatStat(CombatStats.DamageDealt, amount);
        super.damage(amount, source);
    }
    processDeath() {
        this.state = EnemyState.Dead;
        this.removeAllEffects();
        this.renderQueue.image = true;
        this.renderQueue.hitpoints = true;
        this.renderQueue.stats = true;
        this.renderQueue.hitChance = true;
        this.renderQueue.levels = true;
        this.renderQueue.attacks = true;
        this.renderQueue.passives = true;
        this.renderQueue.barrier = true;
    }
    regen() {
        if (this.modifiers.disableHPRegeneration < 1) {
            let regen = numberMultiplier * this.modifiers.flatHPRegen;
            regen += this.bufferedRegen;
            regen += (this.modifiers.hitpointRegeneration * this.stats.maxHitpoints) / 100;
            regen = Math.floor(regen);
            regen = Math.min(regen, this.stats.maxHitpoints - this.hitpoints);
            if (regen > 0) {
                regen = this.heal(regen);
                this._events.emit('hitpointRegen', new HitpointRegenerationEvent(regen));
            }
            this.bufferedRegen = 0;
        }
        this.timers.regen.start(this.hpRegenInterval);
    }
    /** Sets the enemy to render as spawning */
    setSpawning() {
        this.state = EnemyState.Spawning;
        this.renderQueue.image = true;
    }
    setRenderAll() {
        super.setRenderAll();
        this.renderQueue.image = true;
        this.renderQueue.levels = true;
    }
    initializeForCombat() {
        this.renderQueue.image = true;
        this.renderQueue.levels = true;
        this.renderQueue.passives = true;
        super.initializeForCombat();
    }
    render() {
        this.renderLevels();
        if (this.renderQueue.image)
            this.renderImageAndName();
        this.renderPassives();
        this.renderAttacks();
        super.render();
    }
    /** Updates all barrier numbers and bars */
    renderBarrier() {
        if (this.state === EnemyState.Alive) {
            super.renderBarrier();
        } else {
            this.statElements.barrier.forEach((elem) => (elem.textContent = '-'));
            this.statElements.barrierBar.forEach((elem) => (elem.style.width = `0%`));
            this.statElements.barrierContainer.forEach((elem) => elem.classList.add('invisible'));
            this.renderQueue.barrier = false;
        }
    }
    renderHitchance() {
        if (!this.renderQueue.hitChance)
            return;
        if (this.manager.fightInProgress) {
            combatMenus.enemyOffensiveStats.setHitChance(this);
        } else {
            combatMenus.enemyOffensiveStats.unsetHitChance();
        }
        this.renderQueue.hitChance = false;
    }
    renderHitpoints() {
        if (this.state === EnemyState.Alive) {
            super.renderHitpoints();
        } else {
            this.statElements.hitpoints.forEach((elem) => (elem.textContent = '-'));
            this.statElements.hitpointsBar.forEach((elem) => (elem.style.width = `0%`));
            this.renderQueue.hitpoints = false;
        }
        this.renderQueue.barrier = true;
    }
    renderPassives() {
        if (!this.renderQueue.passives)
            return;
        if (this.state === EnemyState.Alive && combatMenus.enemyPassives.setPassives(this.manager.activeCombatPassives)) {
            showElement(combatMenus.enemyPassives);
        } else {
            hideElement(combatMenus.enemyPassives);
        }
        this.renderQueue.passives = false;
    }
    renderAttacks() {
        if (!this.renderQueue.attacks)
            return;
        if (this.state === EnemyState.Alive && !EnemySpecialAttacksElement.shouldHideAttacks(this.availableAttacks)) {
            combatMenus.enemySpecialAttacks.setAttacks(this.availableAttacks, this);
            showElement(combatMenus.enemySpecialAttacks);
        } else {
            hideElement(combatMenus.enemySpecialAttacks);
        }
        this.renderQueue.attacks = false;
    }
    renderDamageValues() {
        if (this.state === EnemyState.Alive && !EnemySpecialAttacksElement.shouldHideAttacks(this.availableAttacks))
            combatMenus.enemySpecialAttacks.updateMaxHits(this.availableAttacks, this);
        super.renderDamageValues();
    }
    renderNormalDamage(minHit, maxHit) {
        combatMenus.enemyOffensiveStats.setNormalDamage(minHit, maxHit);
    }
    renderLevels() {
        if (!this.renderQueue.levels)
            return;
        if (this.state === EnemyState.Alive && this.monster !== undefined) {
            if (this.monster !== undefined)
                combatMenus.enemyLevels.setCombatLevel(this.monster.combatLevel);
            combatMenus.enemyLevels.setLevels(this);
        } else {
            combatMenus.enemyLevels.setEmpty();
        }
        this.renderQueue.levels = false;
    }
    renderImageAndName() {
        let name = '-';
        const imageNodes = [];
        switch (this.state) {
            case EnemyState.Alive:
                {
                    if (this.monster === undefined)
                        return;
                    name = this.isCorrupted ?
                    templateLangString('CORRUPTED_MONSTER_NAME', {
                        monsterName: this.monster.name
                    }) :
                        this.monster.name;
                    const image = document.createElement('img');
                    image.src = this.isCorrupted && !this.isBoss ? this.monster.corruptedMedia : this.monster.media;
                    if (this.game.settings.enableEyebleachMode && this.game.combat.spiderLairMonsters.includes(this.monster)) {
                        image.src = assets.getURI(`assets/media/monsters/eyebleach_${Math.floor(Math.random() * 5) + 1}.png`);
                    }
                    image.classList.add('combat-enemy-img');
                    for (const [passive] of this.manager.activeCombatPassives) {
                        if (passive.id === "melvorF:Afflicted" /* CombatPassiveIDs.Afflicted */ ) {
                            name = templateLangString('COMBAT_MISC_AFFLICTED_NAME', {
                                monsterName: name
                            });
                            image.style.filter = 'saturate(15%)';
                            break;
                        }
                        if (passive.id === "melvorF:ControlledAffliction" /* CombatPassiveIDs.ControlledAffliction */ ) {
                            image.style.filter = 'saturate(15%)';
                            break;
                        }
                    }
                    if (this.isBoss) {
                        image.classList.add('dungeon-boss');
                    }
                    imageNodes.push(image);
                    if (this.monster.hasDescription) {
                        imageNodes.push(document.createElement('br'));
                        const span = document.createElement('span');
                        span.textContent = this.monster.description;
                        span.classList.add('text-danger');
                        imageNodes.push(span);
                    }
                    break;
                }
            case EnemyState.Spawning:
                {
                    const div = createElement('div', {
                        className: 'combat-enemy-img-spinner-mobile spinner-border text-danger',
                        attributes: [
                            ['role', 'status']
                        ],
                    });
                    imageNodes.push(div);
                    break;
                }
        }
        this.statElements.name.forEach((elem) => (elem.textContent = name));
        this.statElements.image.textContent = '';
        this.statElements.image.append(...imageNodes);
        this.renderQueue.image = false;
    }
    renderStats() {
        this.statElements.attackType.forEach((el) => {
            el.src = OffensiveStatsElement.getAttackTypeMedia(this.attackType);
        });
        this.statElements.maxBarrier.forEach((elem) => (elem.textContent = formatNumber(this.stats.maxBarrier)));
        if (this.state === EnemyState.Alive) {
            combatMenus.enemyOffensiveStats.setStats(this);
            combatMenus.enemyDefensiveStats.setStats(this);
            super.renderStats();
        } else {
            this.renderNoStats();
        }
    }
    renderNoStats() {
        combatMenus.enemyOffensiveStats.setEmpty();
        combatMenus.enemyDefensiveStats.setEmpty(this);
        const text = '-';
        this.statElements.maxHitpoints.forEach((elem) => (elem.textContent = text));
        this.statElements.attackInterval.forEach((elem) => (elem.textContent = text));
        this.statElements.maxBarrier.forEach((elem) => (elem.textContent = text));
        this.renderQueue.stats = false;
    }
    resetActionState() {
        super.resetActionState();
        this.state = EnemyState.Dead;
        this.monster = undefined;
    }
    encode(writer) {
        super.encode(writer);
        writer.writeUint8(this.state);
        writer.writeUint8(AttackTypeID[this.randomAttackType]);
        if (this.encodeMonster) {
            writer.writeBoolean(this.monster !== undefined);
            if (this.monster !== undefined)
                writer.writeNamespacedObject(this.monster);
        }
        writer.writeBoolean(this.overrideDamageType !== undefined);
        if (this.overrideDamageType !== undefined)
            writer.writeNamespacedObject(this.overrideDamageType);
        return writer;
    }
    setStatsFromMonster(monster) {
        this.spellSelection.attack = monster.selectedSpell;
        this.computeSpellModifierQuery(); // TODO_MR this could be optimized by checking if the spell actually changed
        this.isBoss = monster.isBoss;
        this.hasBarrier = monster.hasBarrier;
        this.maxBarrierPercent = monster.barrierPercent;
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.state = reader.getUint8();
        this.randomAttackType = AttackTypeID[reader.getUint8()];
        if (this.encodeMonster && reader.getBoolean()) {
            const monster = reader.getNamespacedObject(this.game.monsters);
            if (typeof monster === 'string') {
                if (this.manager.fightInProgress)
                    this.manager.shouldResetAction = true;
            } else {
                this.monster = monster;
                this.setStatsFromMonster(monster);
            }
        }
        if (version >= 129 /* SaveVersion.EnemyDamageTypeOverride */ ) {
            if (reader.getBoolean()) {
                const overrideDamageType = reader.getNamespacedObject(this.game.damageTypes);
                if (typeof overrideDamageType === 'string') {
                    if (this.manager.fightInProgress)
                        this.manager.shouldResetAction = true;
                } else {
                    this.overrideDamageType = overrideDamageType;
                }
            }
        }
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        const monster = this.game.monsters.getObjectByID(idMap.monsters[reader.getNumber()]);
        if (monster === undefined) {
            if (this.manager.fightInProgress)
                this.manager.shouldResetAction = true;
        } else {
            this.monster = monster;
            this.setStatsFromMonster(monster);
        }
        this.state = reader.getNumber();
        if (version >= 7)
            this.randomAttackType = reader.getRandomAttackType();
    }
    postAttack() {}
    onHit() {
        this.manager.addMonsterStat(MonsterStats.HitsToPlayer);
    }
    onMiss() {
        this.manager.addMonsterStat(MonsterStats.EnemyMissed);
    }
}
var EnemyState;
(function(EnemyState) {
    EnemyState[EnemyState["Dead"] = 0] = "Dead";
    EnemyState[EnemyState["Alive"] = 1] = "Alive";
    EnemyState[EnemyState["Spawning"] = 2] = "Spawning";
})(EnemyState || (EnemyState = {}));
class EnemyRenderQueue extends CharacterRenderQueue {
    constructor() {
        super(...arguments);
        this.image = false;
        this.levels = false;
    }
}
//# sourceMappingURL=enemy.js.map
checkFileVersion('?12097')