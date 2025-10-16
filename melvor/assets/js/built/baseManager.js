"use strict";
/** Base Class for Combat Managers */
class BaseManager extends NamespacedObject {
    constructor(game, namespace, id) {
        super(namespace, id);
        this.game = game;
        this.fightInProgress = false;
        this.spawnTimer = new Timer('Spawn', () => this.spawnEnemy());
        this.notifications = new NotificationQueue(20);
        this.allowDuplicateDOTS = false;
        this.isActive = false;
        this.giveFreeDeath = false;
        this.renderQueue = new ManagerRenderQueue();
        this.shouldResetAction = false;
        this._dotID = 0;
        /** Stats provided to both the player/enemy in combat */
        this.statProviders = new Set();
        /** The CombatPassives that are currently active */
        this.activeCombatPassives = new Map();
        /** Conditional modifiers that are currently active */
        this.activeConditionalModifiers = new Map();
        /** Flags if the initialize function has not been called on this object */
        this.firstInit = true;
        this.areaEffectMult = 0;
    }
    /** Gets a modifier query for combat area specific modifiers */
    get areaModQuery() {
        if (this.selectedArea === undefined)
            return ModifierQuery.EMPTY;
        return this.selectedArea.modQuery;
    }
    /** The Type of combat area the player is currently in */
    get areaType() {
        if (this.selectedArea instanceof AbyssDepth) {
            return CombatAreaType.AbyssDepth;
        } else if (this.selectedArea instanceof Dungeon) {
            return CombatAreaType.Dungeon;
        } else if (this.selectedArea instanceof Stronghold) {
            return CombatAreaType.Stronghold;
        } else if (this.selectedArea instanceof SlayerArea) {
            return CombatAreaType.Slayer;
        } else if (this.selectedArea instanceof CombatArea) {
            return CombatAreaType.Combat;
        } else {
            return CombatAreaType.None;
        }
    }
    /** The realm of the combat area the player is currently in */
    get areaRealm() {
        return this.game.defaultRealm;
    }
    /** If the currently selected combat area belongs to the abyssal realm */
    get inAbyssalArea() {
        return false;
    }
    get dotID() {
        this._dotID++;
        return this._dotID;
    }
    initialize() {
        if (this.fightInProgress) {
            this.player.target = this.enemy;
            this.enemy.target = this.player;
            const unsavedPassives = this.computeUnsavedPassives();
            unsavedPassives.forEach((active) => {
                this.activeCombatPassives.set(active.passive, active);
            });
        }
        this.computeAllStats();
        // Second stat calculation to avoid bad HP percent modifiers
        this.player.computeCombatStats();
        this.enemy.computeCombatStats();
        this.player.assignEquipmentEventHandlers();
        if (this.firstInit) {
            this.player.initializeEffects();
            this.enemy.initializeEffects();
            this.firstInit = false;
        }
        this.player.setRenderAll();
        this.enemy.setRenderAll();
        this.renderQueue.location = true;
        this.renderQueue.pause = true;
        this.renderQueue.slayerAreaEffects = true;
        this.render();
        this.setCallbacks();
        this.setButtonVisibility();
    }
    setButtonVisibility() {
        this.game.currentGamemode.enableInstantActions ?
            combatMenus.attackMonsterButton.classList.remove('d-none') :
            combatMenus.attackMonsterButton.classList.add('d-none');
    }
    postDataRegistration() {
        this.player.modifiers.init(this.game);
        this.enemy.modifiers.init(this.game);
    }
    setCallbacks() {
        combatMenus.runButton.onclick = () => this.stop();
        combatMenus.viewDropsButton.onclick = () => {
            if (this.enemy.monster !== undefined && this.fightInProgress)
                viewMonsterDrops(this.enemy.monster, true);
        };
        combatMenus.attackMonsterButton.onclick = () => {
            if (this.enemy.monster !== undefined) {
                const actionsToPerform = this.game.modifiers.getInstantActionsToPerform();
                for (let i = 0; i < actionsToPerform; i++) {
                    this.player.actOnClick();
                }
                this.enemy.actOnClick();
            }
        };
        combatMenus.minibarEatButton.onclick = () => this.minibarEatCallback();
        /* MOBILE */
        combatMenus.minibarEatButton.ontouchstart = (e) => {
            this.minibarEatCallback();
            this.player.startHoldToEat();
            this.minibarShowHoldToEat();
            e.preventDefault(); //This prevents the mobile devices from selecting or displaying OS level popup menus
        };
        combatMenus.minibarEatButton.ontouchend = (e) => {
            this.player.stopHoldToEat();
            this.minibarHideHoldToEat();
            e.preventDefault();
        };
        /* DESKTOP */
        combatMenus.minibarEatButton.onmousedown = (e) => {
            this.player.startHoldToEat();
            this.minibarShowHoldToEat();
            e.preventDefault();
        };
        combatMenus.minibarEatButton.onmouseup = () => {
            this.player.stopHoldToEat();
            this.minibarHideHoldToEat();
        };
        combatMenus.minibarEatButton.onmouseleave = () => {
            this.player.stopHoldToEat();
            this.minibarHideHoldToEat();
        };
        combatMenus.minibarRunButton.onclick = () => this.minibarRunCallback();
        this.player.setCallbacks();
    }
    /**
     * Sets the current combat area, recomputing the area effect as needed
     * @param area The new combat area
     */
    setCombatArea(area) {
        const oldArea = this.selectedArea;
        if (oldArea === area)
            return;
        if (oldArea instanceof SlayerArea && oldArea.areaEffect !== undefined) {
            const areaEffect = oldArea.areaEffect;
            const character = areaEffect.target === 'Player' ? this.player : this.enemy;
            if (areaEffect.modifiers !== undefined) {
                character.modifiers.removeModifiers(oldArea);
            }
            if (areaEffect.applicator !== undefined) {
                character.splitEffectApplicator(areaEffect.applicator, this.areaEffectMult);
            }
        }
        this.selectedArea = area;
        this.computeAreaEffects();
    }
    /**
     *
     * @param areaEffect The area effect to get the magnitude of
     * @param realm The realm of the area the effect belongs to
     */
    getAreaEffectMagnitude(areaEffect, realm) {
        return this.player.calculateAreaEffectValue(areaEffect.magnitude, realm);
    }
    computeAreaEffects() {
        const area = this.selectedArea;
        if (!(area instanceof SlayerArea) || area.areaEffect === undefined)
            return;
        if (area.id === "melvorF:Runic_Ruins" /* SlayerAreaIDs.Runic_Ruins */ && this.player.attackType === 'magic')
            return;
        const areaEffect = area.areaEffect;
        const mult = this.getAreaEffectMagnitude(areaEffect, area.realm);
        const character = areaEffect.target === 'Player' ? this.player : this.enemy;
        if (areaEffect.modifiers !== undefined) {
            character.modifiers.addModifiers(area, areaEffect.modifiers, mult, mult);
        }
        if (areaEffect.applicator !== undefined) {
            character.mergeEffectApplicator(areaEffect.applicator, mult);
        }
        this.areaEffectMult = mult;
    }
    /** Gets the current restrictions to player equipment */
    getEquipmentRestrictions() {
        return {};
    }
    /** Registers a new stat provider for the player/enemy */
    registerStatProvider(provider) {
        if (this.statProviders.has(provider))
            throw new Error('Stat Provider is already registered.');
        this.statProviders.add(provider);
    }
    /** Performs a full stat recalculation of conditional modifiers, followed by player and enemy stats */
    computeAllStats() {
        this.player.computePreConditionalStats();
        this.enemy.computePreConditionalStats();
        this.computeActiveConditionalModifiers();
        this.player.computeModifiersAndEffects();
        this.enemy.computeModifiersAndEffects();
        this.computeAreaEffects();
        this.player.computePostModifierStats();
        this.enemy.computePostModifierStats();
        this.renderModifierChange();

    }

    /** Computes an array of active passives that are not encoded in the save */
    computeUnsavedPassives() {
        return [];
    }
    /** Adjusts the combat passives that are currently applied to the new array */
    adjustPassives(passives) {
        const oldPassives = this.activeCombatPassives;
        this.activeCombatPassives = new Map();
        passives.forEach((active) => {
            const passive = active.passive;
            if (oldPassives.has(passive)) {
                oldPassives.delete(passive);
            } else {
                this.addPassiveStats(passive);
            }
            this.activeCombatPassives.set(passive, active);
        });
        oldPassives.forEach((_, passive) => {
            this.removePassiveStats(passive);
        });
        this.enemy.renderQueue.passives = true;
    }
    addPassiveStats(passive) {
        if (passive.modifiers !== undefined) {
            this.player.modifiers.addModifiers(passive, passive.modifiers);
        }
        if (passive.combatEffects !== undefined) {
            this.player.mergeEffectApplicators(passive.combatEffects);
        }
        if (passive.enemyModifiers !== undefined) {
            this.enemy.modifiers.addModifiers(passive, passive.enemyModifiers);
        }
        if (passive.enemyCombatEffects !== undefined) {
            this.enemy.mergeEffectApplicators(passive.enemyCombatEffects);
        }
        if (passive.conditionalModifiers !== undefined) {
            this.addAndActivateConditionalModifiers(passive, passive.conditionalModifiers);
        }
    }
    removePassiveStats(passive) {
        if (passive.modifiers !== undefined) {
            this.player.modifiers.removeModifiers(passive);
        }
        if (passive.combatEffects !== undefined) {
            this.player.splitEffectApplicators(passive.combatEffects);
        }
        if (passive.enemyModifiers !== undefined) {
            this.enemy.modifiers.removeModifiers(passive);
        }
        if (passive.enemyCombatEffects !== undefined) {
            this.enemy.splitEffectApplicators(passive.enemyCombatEffects);
        }
        if (passive.conditionalModifiers !== undefined) {
            this.removeAndDeactivateConditionalModifiers(passive.conditionalModifiers);
        }
    }
    removeAllPassives() {
        this.activeCombatPassives.forEach((_, passive) => {
            this.removePassiveStats(passive);
        });
        this.activeCombatPassives.clear();
        this.enemy.renderQueue.passives = true;
    }
    /** Computes the conditional modifiers that are currently active */
    computeActiveConditionalModifiers() {
        this.resetActiveConditionalModifiers();
        // Stat Providers
        this.statProviders.forEach((provider) => {
            if (provider.conditionalModifiers !== undefined) {
                provider.conditionalModifiers.forEach(({
                    source,
                    conditionals,
                    negMult,
                    posMult
                }) => {
                    this.addActiveConditionalModifiers(source, conditionals, negMult, posMult);
                });
            }
        });
        // Player Attack Style
        const attackStyle = this.player.attackStyle;
        if ((attackStyle === null || attackStyle === void 0 ? void 0 : attackStyle.stats.conditionalModifiers) !== undefined) {
            this.addActiveConditionalModifiers(attackStyle, attackStyle.stats.conditionalModifiers);
        }
        // Player Equipment
        this.player.equipment.equippedArray.forEach((equipped) => {
            if (equipped.providesStats) {
                this.addActiveConditionalModifiers(equipped.item, equipped.item.conditionalModifiers);
            }
        });
        // Player Equipment Synergies
        this.player.activeItemSynergies.forEach((synergy) => {
            if (synergy.conditionalModifiers !== undefined)
                this.addActiveConditionalModifiers(synergy, synergy.conditionalModifiers);
        });
        // Player Summoning Synergy
        const synergy = this.player.activeSummoningSynergy;
        if ((synergy === null || synergy === void 0 ? void 0 : synergy.conditionalModifiers) !== undefined)
            this.addActiveConditionalModifiers(synergy, synergy.conditionalModifiers);
        // Player Prayers
        this.player.activePrayers.forEach((prayer) => {
            if (prayer.stats.conditionalModifiers === undefined)
                return;
            const mult = prayer.isUnholy ? this.player.unholyPrayerMultiplier : 1;
            this.addActiveConditionalModifiers(prayer, prayer.stats.conditionalModifiers, mult, mult);
        });
        // Player Food
        const foodItem = this.player.food.currentSlot.item;
        if (foodItem.stats.conditionalModifiers !== undefined) {
            this.addActiveConditionalModifiers(foodItem, foodItem.stats.conditionalModifiers);
        }
        // Player Aurora
        const aurora = this.player.spellSelection.aurora;
        if (this.player.canAurora && aurora !== undefined && aurora.stats.conditionalModifiers !== undefined) {
            this.addActiveConditionalModifiers(aurora, aurora.stats.conditionalModifiers);
        }
        // Passives
        this.activeCombatPassives.forEach((_, passive) => {
            if (passive.conditionalModifiers === undefined)
                return;
            this.addActiveConditionalModifiers(passive, passive.conditionalModifiers);
        });
    }
    /**
     * Adds conditional modifiers, without adjusting player/enemy stats
     * @param originalSource The object to use as a source for the modifiers
     * @param conditionals The conditional modifiers to add
     * @param negMult A multiplier for conditional modifiers that are negative
     * @param posMult A multiplier for conditional modifiers that are positive
     * @returns The newly created active modifiers, for further processing
     */
    addActiveConditionalModifiers(originalSource, conditionals, negMult = 1, posMult = 1) {
        return conditionals.map((conditional) => {
            const mult = conditional.isNegative ? negMult : posMult;
            const active = {
                source: new ForwardingModifierSource(originalSource),
                conditional,
                isActive: conditional.condition.checkIfMet(this),
                mult,
                unassigner: conditional.condition.assignHandler(this, (isMet) => this.onActiveConditionalModifierChange(active, isMet)),
            };
            this.activeConditionalModifiers.set(conditional, active);
            return active;
        });
    }
    /** Removes all active conditional modifiers */
    resetActiveConditionalModifiers() {
        this.activeConditionalModifiers.forEach(({
            unassigner
        }) => unassigner());
        this.activeConditionalModifiers.clear();
    }
    /** Fires when a conditional modifier's condition may have changed */
    onActiveConditionalModifierChange(active, isMet) {
        if (active.isActive === isMet)
            return;
        if (active.isActive) {
            this.removeConditionalModifierStats(active);
        } else {
            this.addConditionalModifierStats(active);
        }
        active.isActive = isMet;
    }
    /**
     * Adds the modifiers from an active conditional modifier to the Player/Enemy (does not check if the conditional is active)
     * @param active
     */
    addConditionalModifierStats(active) {
        if (active.conditional.modifiers !== undefined) {
            this.player.modifiers.addModifiers(active.source, active.conditional.modifiers, active.mult, active.mult);
            this.player.stats.setDirty();
        }
        if (active.conditional.enemyModifiers !== undefined) {
            this.enemy.modifiers.addModifiers(active.source, active.conditional.enemyModifiers, active.mult, active.mult);
            this.enemy.stats.setDirty();
        }
    }
    /**
     * Removes the modifiers from an active conditional modifier to the Player/Enemy (does not check if the conditional is inactive)
     * @param active
     */
    removeConditionalModifierStats(active) {
        if (active.conditional.modifiers !== undefined) {
            this.player.modifiers.removeModifiers(active.source);
            this.player.stats.setDirty();
        }
        if (active.conditional.enemyModifiers !== undefined) {
            this.enemy.modifiers.removeModifiers(active.source);
            this.enemy.stats.setDirty();
        }
    }
    updateConditionalModifierMult(conditional, mult) {
        const active = this.activeConditionalModifiers.get(conditional);
        if (active === undefined || active.mult === mult)
            return;
        active.mult = mult;
        if (active.isActive) {
            if (active.conditional.modifiers !== undefined) {
                this.player.modifiers.updateModifiers(active.source, mult, mult);
                this.player.stats.setDirty();
            }
            if (active.conditional.enemyModifiers !== undefined) {
                this.enemy.modifiers.updateModifiers(active.source, mult, mult);
                this.enemy.stats.setDirty();
            }
        }
    }
    updateConditionalModifierMults(conditionals, mult) {
        conditionals.forEach((conditional) => {
            this.updateConditionalModifierMult(conditional, mult);
        });
    }
    /**
     * Adds active conditional modifiers, and their stats to the Player/Enemy (if their condition is met)
     * @param originalSource The object to use as a source for the modifiers
     * @param conditionals The conditional modifiers to add
     * @param negMult A multiplier for conditional modifiers that are negative
     * @param posMult A multiplier for conditional modifiers that are positive
     */
    addAndActivateConditionalModifiers(originalSource, conditionals, negMult = 1, posMult = 1) {
        const activeConditionals = this.addActiveConditionalModifiers(originalSource, conditionals, negMult, posMult);
        activeConditionals.forEach((active) => {
            if (active.isActive)
                this.addConditionalModifierStats(active);
        });
    }
    /**
     * Removes active conditional modifiers, and their stats from the Player/Enemy
     * @param conditionals The conditional modifiers to remove
     */
    removeAndDeactivateConditionalModifiers(conditionals) {
        conditionals.forEach((conditional) => {
            const active = this.activeConditionalModifiers.get(conditional);
            if (active === undefined)
                throw new Error(`Tried to remove conditional modifier, but it is not active.`);
            active.unassigner();
            if (active.isActive)
                this.removeConditionalModifierStats(active);
            this.activeConditionalModifiers.delete(conditional);
        });
    }
    /** Checks if the given damage type is in use by either the player or enemy */
    isDamageTypeInUse(damageType) {
        return (this.player.damageType === damageType ||
            this.player.stats.getResistance(damageType) > 0 ||
            this.enemy.damageType === damageType ||
            this.enemy.stats.getResistance(damageType) > 0);
    }
    minibarEatCallback() {
        this.player.eatFood();
        this.player.render();
        combatMenus.minibarEatButton.blur();
    }
    minibarRunCallback() {
        this.stop();
        combatMenus.minibarRunButton.blur();
    }
    minibarShowHoldToEat() {
        combatMenus.minibarEatButton.classList.remove('btn-light');
        combatMenus.minibarEatButton.classList.add('btn-outline-success');
    }
    minibarHideHoldToEat() {
        combatMenus.minibarEatButton.classList.add('btn-light');
        combatMenus.minibarEatButton.classList.remove('btn-outline-success');
    }
    /** Renders combat in current state */
    render() {
        this.player.render();
        this.enemy.render();
        this.notifications.notify();
        if (this.renderQueue.location)
            this.renderLocation();
        this.renderSpellBook();
    }
    getErrorLog() {
        var _a;
        return `Is In Combat: ${this.isActive}
Fight in Progress: ${this.fightInProgress}
-- Start of Player Information --
${this.player.getErrorLog()}
-- End Player Information --
-- Start of Enemy Information --
Enemy: ${(_a = this.enemy.monster) === null || _a === void 0 ? void 0 : _a.id}
${this.enemy.getErrorLog()}
-- End Enemy Information --`;
    }
    renderSpellBook() {
        if (!this.renderQueue.spellBook)
            return;
        combatMenus.spells.updateRequirements(this.game, this.player, this.ignoreSpellRequirements);
        this.renderQueue.spellBook = false;
    }
    /** Checks for player or enemy death */
    checkDeath() {
        const playerDied = this.player.hitpoints <= 0;
        const enemyDied = this.enemy.state === EnemyState.Alive && this.enemy.hitpoints <= 0;
        if (playerDied) {
            this.onPlayerDeath();
        }
        let stopCombat = playerDied && this.isActive;
        if (enemyDied) {
            stopCombat = this.onEnemyDeath() || stopCombat;
        }
        if (stopCombat) {
            this.stop(false);
        } else if (enemyDied) {
            this.endFight();
            this.loadNextEnemy();
        } else if (playerDied && this.game.activeAction === this.game.thieving) {
            this.game.thieving.stopOnDeath();
        }
    }
    onPlayerDeath() {
        this.game.telemetry.createPlayerDeathEvent();
        if (this.enemy.monster !== undefined && this.fightInProgress)
            this.game.telemetry.updatePlayerDeathEventCause(this.enemy.monster);
        else if (this.game.activeAction === this.game.thieving)
            this.game.telemetry.updatePlayerDeathEventCause('Thieving');
        this.player.processDeath();
        this.game.telemetry.fireEventType('online_xp_gain');
    }
    /** Called on enemy death, returns if combat should be stopped as a result */
    onEnemyDeath() {
        var _a, _b;
        this.enemy.processDeath();
        this.addMonsterStat(MonsterStats.KilledByPlayer);
        if (((_a = this.enemy.monster) === null || _a === void 0 ? void 0 : _a.pet) !== undefined) {
            let kills = this.game.stats.monsterKillCount(this.enemy.monster);
            if (this.enemy.monster.id === "melvorD:Golbin" /* MonsterIDs.Golbin */)
                kills += this.game.stats.GolbinRaid.get(RaidStats.GolbinsKilled);
            if (kills >= this.enemy.monster.pet.kills)
                this.game.petManager.unlockPet(this.enemy.monster.pet.pet);
        }
        if (this.game.currentGamemode.isEvent &&
            ((_b = this.enemy.monster) === null || _b === void 0 ? void 0 : _b.id) === "melvorF:BaneInstrumentOfFear" /* MonsterIDs.BaneInstrumentOfFear */ &&
            this.game.stats.monsterKillCount(this.enemy.monster) === 1)
            showBaneCompletionModal();
        return false;
    }
    addMonsterStat(statID, amount = 1) {
        if (this.enemy.monster === undefined)
            return;
        this.game.stats.Monsters.add(this.enemy.monster, statID, amount);
    }
    addCombatStat(statID, amount = 1) {
        this.game.stats.Combat.add(statID, amount);
    }
    /** Called after the player queues up an attack action. Returns if combat will be fled from in this case. */
    shouldStopOnPlayerAttack() {
        return false;
    }
    onSelection() {
        this.game.renderQueue.combatMinibar = true;
        this.game.renderQueue.title = true;
        this.game.renderQueue.activeSkills = true;
        this.isActive = true;
        this.renderQueue.location = true;
        this.loadNextEnemy();
        this.game.scheduleSave();
    }
    /** Callback function for running from combat */
    stop(fled = true) {
        this.game.renderQueue.combatMinibar = true;
        this.game.renderQueue.title = true;
        this.game.renderQueue.activeSkills = true;
        this.isActive = false;
        this.renderQueue.location = true;
        this.removeAllPassives();
        if (this.enemy.state !== EnemyState.Dead)
            this.enemy.processDeath();
        this.endFight();
        if (this.spawnTimer.isActive)
            this.spawnTimer.stop();
        return true;
    }
    loadNextEnemy() {
        this.spawnTimer.start(this.player.getMonsterSpawnTime());
        this.enemy.setSpawning();
    }
    /** Spawns a new enemy when the spawn timer fires */
    spawnEnemy() {
        this.fightInProgress = true;
        this.createNewEnemy();
        this.addMonsterStat(MonsterStats.Seen);
        this.enemy.target = this.player;
        this.player.target = this.enemy;
        this.statUpdateOnEnemySpawn();
        this.enemy.setHitpoints(this.enemy.stats.maxHitpoints);
        this.enemy.setBarrier(this.enemy.stats.maxBarrier);
        this.enemy.state = EnemyState.Alive;
        this.player.turnsTaken = 0;
        this.enemy.turnsTaken = 0;
    }
    statUpdateOnEnemySpawn() {
        this.player.initializeForCombat();
        this.enemy.initializeForCombat();
    }
    startFight(tickOffset = true) {
        this._events.emit('startOfFight', new StartOfFightEvent());
        this.player.queueNextAction(false, tickOffset);
        this.player.startSummonAttack(tickOffset);
        this.enemy.queueNextAction(false, tickOffset);
    }
    /** Ends the fight the player is currently in */
    endFight() {
        if (this.fightInProgress) {
            this.fightInProgress = false;
            this._events.emit('endOfFight', new EndOfFightEvent());
            this.player.stopFighting();
            this.enemy.stopFighting();
        }
    }
    /** Function to execute on changing to the combat page */
    onCombatPageChange() {
        this.player.renderQueue.attackBar = true;
        this.player.renderQueue.attackBarMinibar = true;
        this.player.renderQueue.summonBar = true;
        this.player.renderQueue.summonBarMinibar = true;
        this.enemy.renderQueue.attackBar = true;
        this.enemy.renderQueue.attackBarMinibar = true;
        this.player.renderQueue.activeSkillModifierChange = true;
        this.renderQueue.areaRequirements = true;
        this.renderQueue.spellBook = true;
        this.renderQueue.areaSkillUnlock = true;
        this.renderQueue.resistanceMenus = true;
        this.render();
    }
    renderAutoSwapFood() {
        if (this.player.modifiers.autoSwapFoodUnlocked) {
            $('#combat-food-auto-swap').removeClass('d-none');
        } else {
            $('#combat-food-auto-swap').addClass('d-none');
        }
    }
    resetActionState() {
        this.player.resetActionState();
        this.enemy.resetActionState();
        if (this.isActive)
            this.game.clearActionIfActiveOrPaused(this);
        this.fightInProgress = false;
        this.spawnTimer.stop();
        this.isActive = false;
    }
    encodePassives(writer) {
        let passiveCount = 0;
        this.activeCombatPassives.forEach((active) => {
            if (active.save)
                passiveCount++;
        });
        writer.writeUint32(passiveCount);
        this.activeCombatPassives.forEach((active, passive) => {
            if (active.save) {
                writer.writeNamespacedObject(passive);
                writer.writeBoolean(active.display);
            }
        });
    }
    decodePassives(reader, version) {
        const passiveCount = reader.getUint32();
        for (let i = 0; i < passiveCount; i++) {
            const passive = reader.getNamespacedObject(this.game.combatPassives);
            const display = reader.getBoolean();
            if (typeof passive !== 'string')
                this.activeCombatPassives.set(passive, {
                    passive,
                    save: true,
                    display
                });
        }
    }
    encode(writer) {
        this.player.encode(writer);
        this.enemy.encode(writer);
        writer.writeBoolean(this.fightInProgress);
        this.spawnTimer.encode(writer);
        writer.writeBoolean(this.isActive);
        this.encodePassives(writer);
        return writer;
    }
    decode(reader, version) {
        this.player.decode(reader, version);
        this.enemy.decode(reader, version);
        this.fightInProgress = reader.getBoolean();
        this.spawnTimer.decode(reader, version);
        this.isActive = reader.getBoolean();
        if (version >= 109 /* SaveVersion.CombatStatRework */)
            this.decodePassives(reader, version);
    }
    deserialize(reader, version, idMap) {
        this.player.deserialize(reader.getVariableLengthChunk(), version, idMap);
        this.enemy.deserialize(reader.getVariableLengthChunk(), version, idMap);
        reader.getNumber(); // Remove old areaType
        this.fightInProgress = reader.getBool();
        if (version <= 3)
            reader.getNumber();
        this.spawnTimer.deserialize(reader.getChunk(3), version);
        this.isActive = reader.getBool();
        if (this.fightInProgress) {
            this.player.target = this.enemy;
            this.enemy.target = this.player;
        }
    }
    deserializePassives(reader, version, idMap) {
        const passiveCount = reader.getNumber();
        for (let i = 0; i < passiveCount; i++) {
            const passiveID = reader.getNumber();
            const display = reader.getBool();
            const passive = this.game.combatPassives.getObjectByID(idMap.combatPassives[passiveID]);
            if (passive !== undefined)
                this.activeCombatPassives.set(passive, {
                    passive,
                    save: true,
                    display
                });
        }
    }
}
class ManagerRenderQueue {
    constructor() {
        this.location = false;
        this.pause = false;
        this.slayerAreaEffects = false;
        this.eventMenu = false;
        /** Updates all combat/slayer/dungeons requirements */
        this.areaRequirements = false;
        /** Updates the currently open spellbook */
        this.spellBook = false;
        /** Updates dungeon completions remaining for next ancient relic skill unlock */
        this.areaSkillUnlock = false;
        /** Updates the Monster HP & Barrier values after loading depending on gamemode (Specifically for number multiplier) */
        this.areaMonsterStats = true;
        this.completionCount = new Set();
        this.petStatus = new Set();
        /** Updates the visibility of the corruption menus */
        this.corruptionMenus = false;
        /** Updates the visibility of resistances based on damage type equipped */
        this.resistanceMenus = false;
        /** Updates the visibility of realm related combat menus */
        this.realmVisibility = new Set();
        /** Updates the category visibility based on realm*/
        this.categoryVisibilityByRealm = new Set();
    }
}
//# sourceMappingURL=baseManager.js.map
checkFileVersion('?12097')