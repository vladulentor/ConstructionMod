"use strict";
var CombatAreaType;
(function(CombatAreaType) {
    CombatAreaType[CombatAreaType["Combat"] = 0] = "Combat";
    CombatAreaType[CombatAreaType["Slayer"] = 1] = "Slayer";
    CombatAreaType[CombatAreaType["Dungeon"] = 2] = "Dungeon";
    CombatAreaType[CombatAreaType["None"] = 3] = "None";
    CombatAreaType[CombatAreaType["AbyssDepth"] = 4] = "AbyssDepth";
    CombatAreaType[CombatAreaType["Stronghold"] = 5] = "Stronghold";
})(CombatAreaType || (CombatAreaType = {}));
/** Interval between combat ticks in ms */
const TICK_INTERVAL = 50;
/** Number of ticks contained in a second */
const TICKS_PER_SECOND = 1000 / TICK_INTERVAL;
/** Number of ticks contained in a minute */
const TICKS_PER_MINUTE = (60 * 1000) / TICK_INTERVAL;
class CombatEvent extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        try {
            this.itemRewards = game.items.getArrayFromIds(data.itemRewardIDs);
            this.pet = game.pets.getObjectSafe(data.petID);
            this.slayerAreas = game.slayerAreas.getArrayFromIds(data.slayerAreaIDs);
            this.passiveSelection = game.combatPassives.getArrayFromIds(data.passiveSelectionIDs);
            this.enemyPassives = game.combatPassives.getArrayFromIds(data.enemyPassives);
            this.bossPassives = game.combatPassives.getArrayFromIds(data.bossPassives);
            this.firstBossMonster = game.monsters.getObjectSafe(data.firstBossMonster);
            this.finalBossMonster = game.monsters.getObjectSafe(data.finalBossMonster);
        } catch (e) {
            throw new DataConstructionError(CombatEvent.name, e, this.id);
        }
    }
}
class CombatManager extends BaseManager {
    /** Management class for combat */
    constructor(game, namespace) {
        super(game, namespace, 'Combat');
        /* #region GameEventEmitter Boilerplate */
        this._events = mitt();
        this.on = this._events.on;
        this.off = this._events.off;
        /* #endregion */
        this.player = new Player(this, this.game);
        this.enemy = new Enemy(this, this.game);
        /** Stores the number of times a dungeon has been completed */
        this.dungeonCompletion = new Map();
        /** Stores the current progress the player has made in a combat area */
        this.areaProgress = 0;
        /** The current tier of stronghold the player is fighting in. */
        this.strongholdTier = 'Standard';
        this.bank = this.game.bank;
        this.itemCharges = this.game.itemCharges;
        this.potions = this.game.potions;
        this.loot = new CombatLoot(100, this.game);
        this.slayerTask = new SlayerTask(this.player, this.game);
        this.paused = false;
        /** If event state should be reset after loading save */
        this.shouldResetEvent = false;
        this.eventProgress = 0;
        this.eventPassives = [];
        this.availableEventPassives = [];
        this.eventPassivesBeingSelected = new Set();
        this.eventDungeonLength = 0;
        this.activeEventAreas = new Map();
        this.itmMonsters = [];
        this.spiderLairMonsters = [];
        /** Stores debouncing for gp telemetry events */
        this.gpTelemetryDebouncing = new Map();
        /** Stores debouncing for ap telemetry events */
        this.apTelemetryDebouncing = new Map();
        /** The interval between GP Telemetry events */
        this.GP_TELEMETRY_DEBOUNCE_INTERVAL = 500;
        /** Temporary flag that prevents the next dungeon/abyss depth from automatically restarting */
        this.preventAutoRestart = false;
        this.enableStatParityCheck = false;
    }
    get media() {
        return assets.getURI("assets/media/skills/combat/combat.png" /* Assets.Combat */ );
    }
    get name() {
        return getLangString('PAGE_NAME_Combat');
    }
    get activeSkills() {
        if (!this.isActive || this.areaType === CombatAreaType.None)
            return [];
        return this.player.getExperienceGainSkills();
    }
    get canStop() {
        return this.isActive && !this.game.isGolbinRaid;
    }
    get areaRealm() {
        if (this.selectedArea === undefined)
            return this.game.defaultRealm;
        return this.selectedArea.realm;
    }
    get inAbyssalArea() {
        return this.selectedArea !== undefined && this.selectedArea.realm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ;
    }
    get combatTriangle() {
        var _a, _b;
        const triangleSet = (_b = (_a = this.selectedArea) === null || _a === void 0 ? void 0 : _a.combatTriangleSet) !== null && _b !== void 0 ? _b : this.game.normalCombatTriangleSet;
        return triangleSet[this.game.currentGamemode.combatTriangleType];
    }
    get combatTriangleSet() {
        var _a, _b;
        return (_b = (_a = this.selectedArea) === null || _a === void 0 ? void 0 : _a.combatTriangleSet) !== null && _b !== void 0 ? _b : this.game.normalCombatTriangleSet;
    }
    get isEventActive() {
        return this.activeEvent !== undefined;
    }
    get isFightingITMBoss() {
        if (!(this.selectedArea instanceof Dungeon))
            return false;
        return (this.selectedArea.id === "melvorF:Into_the_Mist" /* DungeonIDs.Into_the_Mist */ && this.areaProgress > this.selectedArea.monsters.length - 4);
    }
    get onSlayerTask() {
        return (this.slayerTask.active &&
            this.slayerTask.monster === this.selectedMonster &&
            this.selectedArea !== undefined &&
            this.selectedArea.allowSlayerKills);
    }
    get ignoreSpellRequirements() {
        return false;
    }
    get canInteruptAttacks() {
        return this.fightInProgress && !this.paused;
    }
    get areaRequirementsMet() {
        if (this.selectedArea === undefined)
            return true;
        if (this.selectedArea instanceof Stronghold &&
            !this.canFightInStrongholdTier(this.selectedArea, this.strongholdTier))
            return false;
        let slayerLevelReq = 0;
        if (this.selectedArea instanceof SlayerArea)
            slayerLevelReq = this.selectedArea.slayerLevelRequired;
        return this.game.checkRequirements(this.selectedArea.entryRequirements, false, slayerLevelReq);
    }
    addDungeonCompletion(dungeon) {
        this.dungeonCompletion.set(dungeon, this.getDungeonCompleteCount(dungeon) + 1);
    }
    getDungeonCompleteCount(dungeon) {
        var _a;
        return (_a = this.dungeonCompletion.get(dungeon)) !== null && _a !== void 0 ? _a : 0;
    }
    getDungeonCompletionSnapshot() {
        return new Map(this.dungeonCompletion);
    }
    setDungeonCompleteCount(dungeon, count) {
        if (count <= 0)
            this.dungeonCompletion.delete(dungeon);
        else
            this.dungeonCompletion.set(dungeon, count);
    }
    getMonsterDropsHTML(monster, respectArea) {
        let drops = '';
        if (monster.lootChance > 0 &&
            monster.lootTable.size > 0 &&
            !(respectArea && this.selectedArea !== undefined && !this.selectedArea.dropsLoot)) {
            drops = monster.lootTable.sortedDropsArray
                .map((drop) => {
                    let dropText = templateLangString('BANK_STRING_40', {
                        qty: `${drop.maxQuantity}`,
                        itemImage: `<img class="skill-icon-xs mr-2" src="${drop.item.media}">`,
                        itemName: drop.item.name,
                    });
                    if (DEBUGENABLED)
                        dropText += ` (${((monster.lootChance * drop.weight) / monster.lootTable.weight).toFixed(2)}%) (1 in ${(1 /
                        ((monster.lootChance * drop.weight) / monster.lootTable.weight / 100)).toFixed(1)})`;
                    return dropText;
                })
                .join('<br>');
        }
        let always = `${getLangString('MISC_STRING_7')}`;
        if (!(respectArea && this.selectedArea !== undefined && !this.selectedArea.dropsCurrency)) {
            monster.currencyDrops.forEach((currencyDrop) => {
                always += `<br>${templateLangString('BETWEEN_VALUE', {
                    qty1: numberWithCommas(currencyDrop.min),
                    qty2: numberWithCommas(currencyDrop.max),
                })} <img class="skill-icon-xs mr-2" src="${currencyDrop.currency.media}">${currencyDrop.currency.name}`;
            });
        }
        let bones = '';
        const dropsBones = monster.bones !== undefined && !(respectArea && this.selectedArea !== undefined && !this.selectedArea.dropsBones);
        const dropsBarrierDust = monster.hasBarrier;
        if (dropsBarrierDust || dropsBones) {
            if (dropsBones && monster.bones !== undefined) {
                bones += `<br>${monster.bones.quantity} x <img class="skill-icon-xs mr-2" src="${monster.bones.item.media}">${monster.bones.item.name}`;
            }
            if (dropsBarrierDust) {
                const barrierDustItem = this.game.items.getObjectByID("melvorAoD:Barrier_Dust" /* ItemIDs.Barrier_Dust */ );
                if (barrierDustItem !== undefined) {
                    bones += `<br><img class="skill-icon-xs mr-2" src="${barrierDustItem.media}">${barrierDustItem.name}`;
                }
            }
            bones += `<br><br>`;
        } else {
            bones = `<br><small class="text-danger">${getLangString('COMBAT_MISC_107')}</small><br><br>`;
        }
        let html = `<span class="text-dark">${always}${bones}<br>`;
        if (drops !== '') {
            html += `${getLangString('MISC_STRING_8')}<br><small>${getLangString('MISC_STRING_9')}</small><br>${drops}`;
        }
        html += '</span>';
        return html;
    }
    getAreaEffectMagnitude(areaEffect, realm) {
        let bonus = 0;
        if (this.isEventActive && this.eventPassives.some((passive) => passive.id === "melvorF:EventPassive12" /* CombatPassiveIDs.EventPassive12 */ )) {
            bonus = 5;
        }
        return this.player.calculateAreaEffectValue(areaEffect.magnitude + bonus, realm);
    }
    get atLastEventDungeon() {
        return this.activeEventAreas.size === 1;
    }
    initialize() {
        this.slayerTask.renderQueue.task = true;
        this.slayerTask.renderQueue.newButton = true;
        this.renderQueue.eventMenu = true;
        this.renderQueue.areaRequirements = true;
        this.renderQueue.corruptionMenus = true;
        this.renderQueue.resistanceMenus = true;
        this.game.combatAreas.forEach((area) => {
            if (area instanceof Dungeon || area instanceof Stronghold) {
                this.renderQueue.completionCount.add(area);
                this.renderQueue.petStatus.add(area);
            }
            if (area instanceof SlayerArea) {
                this.renderQueue.petStatus.add(area);
            }
        });
        super.initialize();
        if (this.isEventActive) {
            if (this.eventPassivesBeingSelected.size > 0)
                this.fireEventPassiveModal();
            this.renderEventAreas();
        }
        combatMenus.eventMenu.setButtonCallbacks();
    }
    getEquipmentRestrictions() {
        const restrictions = {};
        if (this.isActive && this.selectedArea !== undefined) {
            const area = this.selectedArea;
            if (area.allowedDamageTypes.size > 0) {
                restrictions.areaDamageTypes = area.allowedDamageTypes;
            }
            if (area instanceof SlayerArea) {
                const reqs = area.entryRequirements.filter((req) => req.type === 'SlayerItem');
                if (reqs.length > 0) {
                    restrictions.slayer = {
                        level: area.slayerLevelRequired,
                        items: reqs.map((req) => req.item),
                    };
                }
            } else if (area instanceof Stronghold) {
                restrictions.areaItems = area.tiers[this.strongholdTier].requiredItems;
            }
        }
        if (this.fightInProgress) {
            restrictions.monsterDamageType = this.enemy.damageType;
        }
        return restrictions;
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.slayerTask.postDataRegistration();
    }
    passiveTick() {
        this.player.passiveTick();
        this.slayerTask.tick();
    }
    activeTick() {
        // Do Time statistic tracking
        if (this.paused) {
            this.addCombatStat(CombatStats.TimeSpentPaused, TICK_INTERVAL);
            return;
        } else if (this.enemy.state === EnemyState.Spawning) {
            this.addCombatStat(CombatStats.TimeSpentSpawning, TICK_INTERVAL);
        } else if (this.fightInProgress) {
            this.addCombatStat(CombatStats.TimeSpentFighting, TICK_INTERVAL);
        }
        this.spawnTimer.tick();
        this.enemy.passiveTick();
        this.player.activeTick();
        this.enemy.activeTick();
    }
    getErrorLog() {
        var _a;
        return `${super.getErrorLog()}
Current Area Type: ${CombatAreaType[this.areaType]}
Current Area ID: ${(_a = this.selectedArea) === null || _a === void 0 ? void 0 : _a.id}`;
    }
    /** Renders combat in current state */
    render() {
        if (this.renderQueue.slayerAreaEffects)
            this.renderSlayerAreaEffects();
        this.renderAreaSkillUnlockCounts();
        super.render();
        this.renderAreaRequirements();
        this.loot.render();
        this.slayerTask.render();
        this.renderEventMenu();
        this.renderPause();
        this.renderCompletionCount();
        this.renderPetStatus();
        this.renderCorruptionMenus();
        this.renderResistanceMenus();
        this.renderRealmVisibility();
        this.renderCategoryVisibilityByRealm();
    }
    renderPause() {
        if (this.renderQueue.pause) {
            if (this.paused) {
                $('#combat-pause-container').removeClass('d-none');
            } else {
                $('#combat-pause-container').addClass('d-none');
            }
        }
        this.renderQueue.pause = false;
    }
    renderLocation() {
        let floorText = '';
        let countText = '';
        let effectText = '';
        let areaName = getLangString('COMBAT_MISC_39');
        let areaMedia = this.game.unknownCombatArea.media;
        if (this.selectedArea !== undefined) {
            areaMedia = this.selectedArea.media;
            areaName = this.selectedArea.name;
            if (this.selectedArea instanceof AbyssDepth) {
                countText = templateLangString('ABYSS_DEPTH_PROGRESS', {
                    progress: `${this.areaProgress + 1}`,
                    length: `${this.selectedArea.monsters.length}`,
                });
            } else if (this.selectedArea instanceof Dungeon) {
                if (this.selectedArea.floors !== undefined) {
                    let floorCount = 0;
                    let floor = 0;
                    for (let i = 0; i < this.selectedArea.floors.length; i++) {
                        floorCount += this.selectedArea.floors[i];
                        floor++;
                        if (floorCount > this.areaProgress) {
                            floorCount -= this.selectedArea.floors[i];
                            break;
                        }
                    }
                    floorText = templateLangString('COMBAT_MISC_FLOOR_COUNT', {
                        currentFloor: `${floor}`,
                        totalFloors: `${this.selectedArea.floors.length}`,
                    });
                    countText = templateLangString('PROGRESS_GENERAL', {
                        progress: `${this.areaProgress - floorCount + 1}`,
                        length: `${this.selectedArea.floors[floor - 1]}`,
                    });
                } else {
                    countText = templateLangString('PROGRESS_GENERAL', {
                        progress: `${this.areaProgress + 1}`,
                        length: `${this.selectedArea.monsters.length}`,
                    });
                }
            } else if (this.selectedArea instanceof SlayerArea) {
                if (this.selectedArea.areaEffect) {
                    effectText = templateString(this.selectedArea.areaEffectDescription, {
                        effectValue: `${this.getAreaEffectMagnitude(this.selectedArea.areaEffect, this.selectedArea.realm)}`,
                    });
                    combatMenus.locationElements.areaEffect.classList.add('text-danger');
                    combatMenus.locationElements.areaEffect.classList.remove('text-success');
                } else {
                    effectText = getLangString('COMBAT_MISC_NO_AREA_EFFECT');
                    combatMenus.locationElements.areaEffect.classList.remove('text-danger');
                    combatMenus.locationElements.areaEffect.classList.add('text-success');
                }
            } else if (this.selectedArea instanceof Stronghold) {
                areaName = this.selectedArea.getTierName(this.strongholdTier);
                countText = `(${this.areaProgress + 1} / ${this.selectedArea.monsters.length})`;
            }
        }
        combatMenus.locationElements.name.textContent = areaName;
        combatMenus.locationElements.floorCount.textContent = floorText;
        combatMenus.locationElements.count.textContent = countText;
        combatMenus.locationElements.areaEffect.textContent = effectText;
        combatMenus.locationElements.image.src = areaMedia;
        this.renderQueue.location = false;
    }
    renderSlayerAreaEffects() {
        if (this.renderQueue.slayerAreaEffects)
            combatAreaMenus.all.forEach((menu) => menu.updateAreaEffectValues());
        if (this.areaType === CombatAreaType.Slayer)
            this.renderQueue.location = true;
        this.renderQueue.slayerAreaEffects = false;
    }
    renderEventMenu() {
        if (!this.renderQueue.eventMenu)
            return;
        if (this.isEventActive) {
            showElement(combatMenus.eventMenu);
        } else {
            hideElement(combatMenus.eventMenu);
        }
        this.renderQueue.eventMenu = false;
    }
    renderAreaRequirements() {
        if (!this.renderQueue.areaRequirements)
            return;
        combatAreaMenus.all.forEach((menu) => menu.updateRequirements());
        this.renderQueue.areaRequirements = false;
    }
    renderCompletionCount() {
        this.renderQueue.completionCount.forEach((area) => {
            combatAreaMenus.all.forEach((menu) => menu.updateCompletionCount(area));
        });
        this.renderQueue.completionCount.clear();
    }
    renderPetStatus() {
        this.renderQueue.petStatus.forEach((area) => {
            combatAreaMenus.all.forEach((menu) => menu.updatePetStatus(area));
        });
        this.renderQueue.petStatus.clear();
    }
    renderResistanceMenus() {
        if (!this.renderQueue.resistanceMenus)
            return;
        this.game.damageTypes.forEach((damageType) => this.updateResistanceMenuVisibility(damageType));
        this.renderQueue.resistanceMenus = false;
    }
    renderRealmVisibility() {
        if (this.renderQueue.realmVisibility.size === 0)
            return;
        this.renderQueue.realmVisibility.forEach((realm) => {
            combatMenus.runes.updateRealmUnlock(realm);
            if (!this.game.settings.useLegacyRealmSelection && this.game.unlockedRealms.length > 1) {
                combatAreaMenus.showMenuRealmHeader();
            } else {
                combatAreaMenus.hideMenuRealmHeader();
            }
            combatAreaMenus.toggleCategoryVisibilityByRealm(game.currentRealm);
        });
        this.renderQueue.realmVisibility.clear();
    }
    renderCategoryVisibilityByRealm() {
        if (this.renderQueue.categoryVisibilityByRealm.size === 0)
            return;
        this.renderQueue.categoryVisibilityByRealm.forEach((realm) => {
            combatAreaMenus.toggleCategoryVisibilityByRealm(realm);
            combatAreaMenus.updateMenuHeaderClass(realm);
            combatAreaMenus.updateMenuHeaderText(realm.name);
        });
        this.renderQueue.categoryVisibilityByRealm.clear();
    }
    updateResistanceMenuVisibility(damageType) {
        if (damageType.onlyShowIfUsing) {
            const shouldShow = this.isDamageTypeInUse(damageType);
            //resistanceMenus.itemUpgrade.get(damageType)?.toggleResistanceView(shouldShow);
            //resistanceMenus.viewEquipmentStats.get(damageType)?.toggleResistanceView(shouldShow);
            //resistanceMenus.viewItemStats.get(damageType)?.toggleResistanceView(shouldShow);
        }
    }
    renderCorruptionMenus() {
        var _a;
        if (!this.renderQueue.corruptionMenus)
            return;
        const shouldShow = this.game.corruption !== undefined && this.game.corruption.isUnlocked;
        if (shouldShow) {
            showElement(combatMenus.corruptionSettings);
            showElement(combatMenus.menuTabs[7 /* CombatMenuId.Corruption */ ]);
        } else {
            hideElement(combatMenus.corruptionSettings);
            hideElement(combatMenus.menuTabs[7 /* CombatMenuId.Corruption */ ]);
        }
        if (localStorage.getItem('corruptionMenuGlow') !== null ||
            this.game.corruption === undefined ||
            !((_a = this.game.corruption) === null || _a === void 0 ? void 0 : _a.isUnlocked))
            combatMenus.menuTabs[7 /* CombatMenuId.Corruption */ ].classList.remove('glow-animation');
        this.renderQueue.corruptionMenus = false;
    }
    renderAreaSkillUnlockCounts() {
        if (!this.renderQueue.areaSkillUnlock)
            return;
        combatAreaMenus.all.forEach((menu) => menu.updateAreaSkillUnlock());
        this.renderQueue.areaSkillUnlock = false;
    }
    onPlayerDeath() {
        super.onPlayerDeath();
        const shouldDeleteSave = !(this.game.isGolbinRaid || this.isEventActive || this.giveFreeDeath);
        if (this.isEventActive)
            this.stopEvent();
        this.game.telemetry.fireEventType('player_death');
        if (this.game.currentGamemode.isPermaDeath && shouldDeleteSave) {
            let killed = 'Thieving';
            if (this.game.activeAction !== this.game.thieving && this.enemy.monster !== undefined)
                killed = this.enemy.monster.name;
            localStorage.setItem('LatestHCDeath', JSON.stringify({
                PlayerName: this.game.characterName,
                TotalSkillLevel: this.game.completion.skillLevelProgress.currentCount.getSum(),
                killedBy: killed,
                timestamp: new Date().getTime(),
            }));
            if (connectedToSteam)
                unlockSteamAchievement('NEW_ACHIEVEMENT_2_29', 61);
            resetAccountData();
        }
        this.giveFreeDeath = false;
    }
    /** Called on enemy death, returns if combat should be stopped as a result */
    onEnemyDeath() {
        var _a;
        if (this.enemy.monster === undefined)
            throw new Error('Enemy died, but has no monster set.');
        const killedEvent = new MonsterKilledEvent(this.enemy.monster, this.player.attackType, this.player, this.enemy.isCorrupted);
        if (!loadingOfflineProgress)
            this.game.telemetry.createMonsterKillEvent(this.enemy.monster);
        let stopCombat = false;
        this.player.trackWeaponStat(ItemStats.EnemiesKilled);
        this.addCombatStat(CombatStats.MonstersKilled);
        this.player.rewardForKill();
        if (this.activeEvent !== undefined) {
            this.renderQueue.location = true;
            this.areaProgress++;
            if (this.areaProgress === this.eventDungeonLength) {
                this.loot.lootAll();
                stopCombat = true;
                if (!(this.selectedArea instanceof SlayerArea))
                    throw new Error('Error increasing event progress. Selected area is invalid.');
                this.activeEventAreas.delete(this.selectedArea);
                this.renderEventAreas();
                if (this.activeEventAreas.size === 0) {
                    const reward = this.activeEvent.itemRewards[this.eventProgress];
                    this.bank.addItem(reward, 1, true, true, false, true, `Dungeon.${(_a = this.selectedArea) === null || _a === void 0 ? void 0 : _a.id}`);
                    this.increaseEventProgress(this.activeEvent);
                }
            }
        } else {
            if (this.selectedArea !== undefined)
                this.rewardForEnemyDeath(this.enemy.monster, this.selectedArea);
            if (this.selectedArea instanceof AbyssDepth) {
                stopCombat = this.increaseAbyssProgress(this.selectedArea, this.enemy.monster) || stopCombat;
            } else if (this.selectedArea instanceof Dungeon) {
                stopCombat = this.increaseDungeonProgress(this.selectedArea, this.enemy.monster) || stopCombat;
            } else if (this.selectedArea instanceof Stronghold) {
                stopCombat = this.increaseStrongholdProgress(this.selectedArea, this.enemy.monster) || stopCombat;
            }
        }
        stopCombat = super.onEnemyDeath() || stopCombat;
        this.game.queueRequirementRenders();
        // Update completion for first monster kill
        if (this.game.stats.monsterKillCount(this.enemy.monster) === 1)
            this.game.completion.updateMonster(this.enemy.monster);
        this._events.emit('monsterKilled', killedEvent);
        this.enemy.monster.emit('killed', killedEvent);
        return stopCombat;
    }
    /** Checks to add one time rewards from dungeon completion that were added after completion */
    retroactivelyAddOneTimeRewards() {
        this.game.dungeons.forEach((dungeon) => {
            const completeCount = this.getDungeonCompleteCount(dungeon);
            if (dungeon.oneTimeReward !== undefined &&
                this.game.stats.itemFindCount(dungeon.oneTimeReward) <= 0 &&
                completeCount > 0) {
                this.game.bank.addItem(dungeon.oneTimeReward, 1, false, true, true);
            }
            if (dungeon.pet !== undefined && dungeon.fixedPetClears && completeCount >= dungeon.pet.weight)
                this.game.petManager.unlockPet(dungeon.pet.pet);
        });
    }
    rewardForEnemyDeath(monster, area) {
        var _a;
        if (area instanceof SlayerArea && area.pet !== undefined) {
            this.game.petManager.rollForPet(area.pet);
            this.renderQueue.petStatus.add(area);
        }
        const receiveNoItemDrops = rollPercentage(this.player.modifiers.noCombatDropChance);
        if (!receiveNoItemDrops) {
            if (area.dropsBones)
                this.dropEnemyBones(monster);
            if (area.dropsLoot) {
                this.dropEnemyLoot(monster);
                this.dropBarrierDust(monster);
            }
            this.dropBirthdayPresent();
            this.dropSignetHalfB(monster);
        }
        if (area.dropsCurrency)
            this.dropEnemyCurrency(monster);
        let slayerXPReward = 0;
        let slayerAXPReward = 0;
        if (this.areaType === CombatAreaType.Slayer && this.player.damageType.id !== "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ ) {
            if (this.inAbyssalArea)
                slayerAXPReward += this.enemy.stats.maxHitpoints / numberMultiplier;
            else
                slayerXPReward += this.enemy.stats.maxHitpoints / numberMultiplier / 2;
        }
        if (this.onSlayerTask) {
            this.rewardSlayerTaskCurrency(this.slayerTask.category);
            this.slayerTask.addKill();
            const chanceForDoubleReward = this.player.modifiers.doubleSlayerTaskKillChance;
            if (rollPercentage(chanceForDoubleReward) && this.onSlayerTask) {
                this.rewardSlayerTaskCurrency(this.slayerTask.category);
                this.slayerTask.addKill();
            }
            if (this.slayerTask.isAbyssal)
                slayerAXPReward += this.enemy.stats.maxHitpoints / numberMultiplier;
            else
                slayerXPReward += this.enemy.stats.maxHitpoints / numberMultiplier;
        }
        if (slayerXPReward > 0) {
            this.game.slayer.addXP(slayerXPReward);
        }
        if (slayerAXPReward > 0) {
            this.game.slayer.addAbyssalXP(slayerAXPReward);
        }
        if (this.enemy.isCorrupted && this.player.damageType.id !== "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ ) {
            (_a = this.game.corruption) === null || _a === void 0 ? void 0 : _a.addAbyssalXP(Math.floor(400 + (monster.levels.Hitpoints * monster.levels.Corruption) / 25));
        }
    }
    /** Gets the chance to double loot against a certain monster */
    getLootDoublingChance(monster) {
        let chance = this.player.modifiers.globalItemDoublingChance;
        chance += this.player.modifiers.combatLootDoublingChance;
        chance += this.player.modifiers.getValue("melvorD:doubleItemsChanceAgainstDamageType" /* ModifierIDs.doubleItemsChanceAgainstDamageType */ , monster.damageType.modQuery);
        return chance;
    }
    dropEnemyLoot(monster) {
        if (!this.game.tutorial.complete)
            return;
        if (rollPercentage(monster.lootChance)) {
            let {
                item,
                quantity
            } = monster.lootTable.getDrop();
            // Lucky Herb Potion
            const herbItem = this.game.farming.getHerbFromSeed(item);
            if (herbItem !== undefined) {
                if (rollPercentage(this.player.modifiers.seedDropConversionChance)) {
                    item = herbItem;
                    quantity += 3;
                }
            }
            if (rollPercentage(this.getLootDoublingChance(monster)))
                quantity *= 2;
            const autoLooted = this.player.modifiers.autoLooting &&
                this.bank.addItem(item, quantity, false, true, false, true, `Monster.${monster.id}`);
            if (autoLooted) {
                this.addCombatStat(CombatStats.ItemsLooted, quantity);
            } else {
                let stack = false;
                if (this.player.modifiers.allowLootContainerStacking > 0)
                    stack = true;
                this.loot.add(item, quantity, stack);
            }
            const event = new MonsterDropEvent(item, quantity, herbItem !== undefined);
            this._events.emit('monsterDrop', event);
        }
    }
    dropBarrierDust(monster) {
        if (!monster.hasBarrier)
            return;
        const barrierDustItem = this.game.items.getObjectByID("melvorAoD:Barrier_Dust" /* ItemIDs.Barrier_Dust */ );
        if (barrierDustItem === undefined)
            return;
        let qty = Math.max(Math.floor((monster.levels.Hitpoints * (monster.barrierPercent / 100)) / 20), 1);
        if (rollPercentage(this.getLootDoublingChance(monster)))
            qty *= 2;
        const autoLooted = this.player.modifiers.autoLooting &&
            this.bank.addItem(barrierDustItem, qty, false, true, false, true, `Monster.${monster.id}`);
        if (autoLooted) {
            this.addCombatStat(CombatStats.ItemsLooted, qty);
        } else {
            let stack = false;
            if (this.player.modifiers.allowLootContainerStacking > 0)
                stack = true;
            this.loot.add(barrierDustItem, qty, stack);
        }
        const event = new MonsterDropEvent(barrierDustItem, qty, false);
        this._events.emit('monsterDrop', event);
    }
    dropSignetHalfB(monster) {
        const chance = monster.combatLevel / 5000;
        if (this.player.damageType.id === "melvorD:Normal" /* DamageTypeIDs.Normal */ && rollPercentage(chance)) {
            let itemID = "melvorD:Gold_Topaz_Ring" /* ItemIDs.Gold_Topaz_Ring */ ;
            if (this.player.modifiers.allowSignetDrops)
                itemID = "melvorD:Signet_Ring_Half_B" /* ItemIDs.Signet_Ring_Half_B */ ;
            const item = this.game.items.getObjectByID(itemID);
            if (item === undefined)
                throw new Error(`Invalid item ID ${itemID}`);
            this.bank.addItem(item, 1, true, true, false, true, `GlobalRare.${item.id}`);
            if (itemID === "melvorD:Gold_Topaz_Ring" /* ItemIDs.Gold_Topaz_Ring */ )
                this.game.stats.General.inc(GeneralStats.SignetRingHalvesMissed);
        }
    }
    dropBirthdayPresent() {
        if (!cloudManager.isBirthdayEvent2023Active() || !game.settings.toggleBirthdayEvent)
            return;
        const chance = 1 / 20;
        if (rollPercentage(chance)) {
            const itemID = "melvorF:Birthday_Present_Combat" /* ItemIDs.Birthday_Present_Combat */ ;
            const item = this.game.items.getObjectByID(itemID);
            if (item === undefined)
                throw new Error(`Invalid item ID ${itemID}`);
            this.bank.addItem(item, 1, true, true, false, true, `BirthdayEvent2023.${item.id}`);
        }
    }
    dropEnemyBones(monster) {
        if (!this.game.tutorial.complete)
            return;
        if (monster.bones !== undefined) {
            let item = monster.bones.item;
            let itemQty = monster.bones.quantity;
            let doubleChance = this.getLootDoublingChance(monster);
            if (item instanceof BoneItem) {
                if (this.player.modifiers.doubleBoneDrops > 0)
                    itemQty *= 2;
            } else if (item instanceof SoulItem) {
                doubleChance += this.player.modifiers.doubleSoulDropChance;
                itemQty *= Math.pow(2, this.player.modifiers.doubleSoulDrops);
            }
            if (rollPercentage(doubleChance))
                itemQty *= 2;
            if (this.game.modifiers.convertBoneDropsIntoCake > 0) {
                const birthdayItem = game.items.getObjectByID("melvorF:Birthday_Cake_Slice" /* ItemIDs.Birthday_Cake_Slice */ );
                if (birthdayItem !== undefined)
                    item = birthdayItem;
            }
            if (item instanceof BoneItem && this.player.modifiers.autoBurying > 0 && this.game.prayer.isUnlocked) {
                this.game.stats.Prayer.add(PrayerStats.BonesBuried, itemQty);
                this.game.stats.Items.add(item, ItemStats.TimesBuried, itemQty);
                this.player.addPrayerPoints(applyModifier(itemQty * this.bank.getPrayerPointsPerBone(item), this.player.modifiers.autoBurying));
            } else {
                const autoLooted = this.player.modifiers.autoLooting &&
                    this.bank.addItem(item, itemQty, false, true, false, true, `Monster.${monster.id}`);
                if (autoLooted) {
                    this.addCombatStat(CombatStats.ItemsLooted, itemQty);
                } else {
                    this.loot.add(item, itemQty, true);
                }
            }
            this._events.emit('boneDrop', new BoneDropEvent(monster, item, itemQty));
        }
    }
    /** Rolls for each currency that a monster can drop, and rewards it to the player */
    dropEnemyCurrency(monster) {
        monster.currencyDrops.forEach(({
            currency,
            min,
            max
        }) => {
            let quantity = rollInteger(min, max);
            quantity += this.player.modifiers.getValue("melvorD:flatCurrencyGainFromMonsterDrops" /* ModifierIDs.flatCurrencyGainFromMonsterDrops */ , currency.modQuery);
            let modifier = this.player.modifiers.getValue("melvorD:currencyGainFromMonsterDrops" /* ModifierIDs.currencyGainFromMonsterDrops */ , currency.modQuery);
            if (this.onSlayerTask)
                modifier += this.player.modifiers.getValue("melvorD:currencyGainFromSlayerTaskMonsterDrops" /* ModifierIDs.currencyGainFromSlayerTaskMonsterDrops */ , currency.modQuery);
            modifier +=
                this.player.modifiers.getValue("melvorD:currencyGainFromMonsterDropsBasedOnDebuffs" /* ModifierIDs.currencyGainFromMonsterDropsBasedOnDebuffs */ , currency.modQuery) *
                this.enemy.debuffCount;
            if (quantity > 0)
                this.addCurrency(currency, quantity, `MonsterKill.${monster.id}`, modifier);
        });
    }
    /** Gets the base currency modifier to apply to all gains */
    getCurrencyModifier(currency) {
        let modifier = this.player.modifiers.getValue("melvorD:currencyGain" /* ModifierIDs.currencyGain */ , currency.modQuery);
        modifier += this.player.modifiers.getValue("melvorD:currencyGainFromCombat" /* ModifierIDs.currencyGainFromCombat */ , currency.modQuery);
        return modifier;
    }
    addCurrency(currency, baseAmount, source, modifier = 0) {
        modifier += this.getCurrencyModifier(currency);
        let amount = applyModifier(baseAmount, modifier);
        amount += this.player.modifiers.getValue("melvorD:flatCurrencyGain" /* ModifierIDs.flatCurrencyGain */ , currency.modQuery);
        if (amount <= 0)
            return;
        currency.add(amount);
        currency.stats.add(2 /* CurrencyStats.EarnedFromCombat */ , amount);
        switch (currency.id) {
            case "melvorD:GP" /* CurrencyIDs.GP */ :
                {
                    let existingDebounce = this.gpTelemetryDebouncing.get(source);
                    if (existingDebounce === undefined) {
                        existingDebounce = {
                            timeoutID: -1,
                            quantity: 0,
                        };
                        this.gpTelemetryDebouncing.set(source, existingDebounce);
                    } else {
                        window.clearTimeout(existingDebounce.timeoutID);
                    }
                    const debounce = existingDebounce;
                    debounce.quantity += amount;
                    debounce.timeoutID = window.setTimeout(() => {
                        this.game.telemetry.createGPAdjustedEvent(debounce.quantity, this.game.gp.amount, source);
                        this.gpTelemetryDebouncing.delete(source);
                    }, this.GP_TELEMETRY_DEBOUNCE_INTERVAL);
                }
                break;
            case "melvorItA:AbyssalPieces" /* CurrencyIDs.AbyssalPieces */ :
                {
                    let existingDebounce = this.apTelemetryDebouncing.get(source);
                    if (existingDebounce === undefined) {
                        existingDebounce = {
                            timeoutID: -1,
                            quantity: 0,
                        };
                        this.apTelemetryDebouncing.set(source, existingDebounce);
                    } else {
                        window.clearTimeout(existingDebounce.timeoutID);
                    }
                    const debounce = existingDebounce;
                    debounce.quantity += amount;
                    debounce.timeoutID = window.setTimeout(() => {
                        if (this.game.abyssalPieces !== undefined) {
                            this.game.telemetry.createAPAdjustedEvent(debounce.quantity, this.game.abyssalPieces.amount, source);
                            this.apTelemetryDebouncing.delete(source);
                        }
                    }, this.GP_TELEMETRY_DEBOUNCE_INTERVAL);
                }
                break;
        }
    }
    /** Gives currency rewards for killing a slayer task monster */
    rewardSlayerTaskCurrency(category) {
        var _a, _b;
        const normallizedHP = this.enemy.stats.maxHitpoints / numberMultiplier;
        const combatLevel = (_b = (_a = this.enemy.monster) === null || _a === void 0 ? void 0 : _a.combatLevel) !== null && _b !== void 0 ? _b : 0;
        category.currencyRewards.forEach(({
            currency,
            percent
        }) => {
            let quantity = (normallizedHP * percent) / 10;
            switch (this.enemy.attackType) {
                case 'melee':
                    quantity +=
                        this.player.modifiers.getValue("melvorD:flatCurrencyGainFromMeleeSlayerTasksBasedOnCombatLevel" /* ModifierIDs.flatCurrencyGainFromMeleeSlayerTasksBasedOnCombatLevel */ , currency.modQuery) * combatLevel;
                    break;
                case 'ranged':
                    quantity +=
                        this.player.modifiers.getValue("melvorD:flatCurrencyGainFromRangedSlayerTasksBasedOnCombatLevel" /* ModifierIDs.flatCurrencyGainFromRangedSlayerTasksBasedOnCombatLevel */ , currency.modQuery) * combatLevel;
                    break;
                case 'magic':
                    quantity +=
                        this.player.modifiers.getValue("melvorD:flatCurrencyGainFromMagicSlayerTasksBasedOnCombatLevel" /* ModifierIDs.flatCurrencyGainFromMagicSlayerTasksBasedOnCombatLevel */ , currency.modQuery) * combatLevel;
                    break;
            }
            const modifier = this.player.modifiers.getValue("melvorD:currencyGainFromSlayerTasks" /* ModifierIDs.currencyGainFromSlayerTasks */ , currency.modQuery);
            this.addCurrency(currency, quantity, 'SlayerTaskKill', modifier);
        });
    }
    /**
     * Increments the progress through a Dungeon by 1
     * @param dungeon The dungeon to progress through
     * @param monster The monster that was killed
     * @returns If combat should be stopped as a result
     */
    increaseDungeonProgress(dungeon, monster) {
        this.areaProgress++;
        this.renderQueue.location = true;
        let stopCombat = false;
        if (this.areaProgress === dungeon.monsters.length) {
            const dungeonCompleted = new DungeonCompletedEvent(dungeon);
            this.areaProgress = 0;
            const lootQty = rollPercentage(this.getLootDoublingChance(monster)) ? 2 : 1;
            const receiveNoItemDrops = rollPercentage(this.player.modifiers.noCombatDropChance);
            if (lootQty > 0 && !receiveNoItemDrops) {
                dungeon.rewards.forEach((item) => {
                    if (this.bank.addItem(item, lootQty, true, true, false, true, `Dungeon.${dungeon.id}`)) {
                        this.addCombatStat(CombatStats.DungeonRewards, lootQty);
                    }
                });
            }
            if (dungeon.oneTimeReward !== undefined && this.game.stats.itemFindCount(dungeon.oneTimeReward) <= 0)
                this.bank.addItem(dungeon.oneTimeReward, 1, false, true, true, true, `Dungeon.${dungeon.id}`);
            this.dropEnemyCurrency(monster);
            this.addDungeonCompletion(dungeon);
            if (dungeon.pet !== undefined && dungeon.fixedPetClears) {
                if (this.getDungeonCompleteCount(dungeon) >= dungeon.pet.weight) {
                    this.game.petManager.unlockPet(dungeon.pet.pet);
                }
            } else if (dungeon.pet !== undefined) {
                this.game.petManager.rollForPet(dungeon.pet);
            }
            this.player.renderQueue.equipment = true;
            this.renderQueue.completionCount.add(dungeon);
            this.renderQueue.petStatus.add(dungeon);
            if (this.player.modifiers.bonusCoalOnDungeonCompletion) {
                if (rollPercentage(1))
                    this.bank.addItemByID("melvorD:Coal_Ore" /* ItemIDs.Coal_Ore */ , this.player.modifiers.bonusCoalOnDungeonCompletion, true, true);
            }
            this.preventAutoRestart = false;
            this._events.emit('dungeonCompleted', dungeonCompleted);
            if (!(this.game.settings.autoRestartDungeon && dungeon.id !== "melvorF:Into_the_Mist" /* DungeonIDs.Into_the_Mist */ ) ||
                this.preventAutoRestart) {
                this.loot.lootAll();
                stopCombat = true;
                addModalToQueue({
                    title: getLangString('COMBAT_MISC_DUNGEON_COMPLETE'),
                    text: getLangString('COMBAT_MISC_DUNGEON_COMPLETE_TEXT'),
                    imageUrl: assets.getURI('assets/media/skills/combat/dungeon.png'),
                    imageWidth: 64,
                    imageHeight: 64,
                    imageAlt: getLangString('COMBAT_MISC_DUNGEON_COMPLETE'),
                });
            }
            this.preventAutoRestart = false;
        }
        return stopCombat;
    }
    /** Increases the progress through The Abyss by 1 */
    increaseAbyssProgress(depth, monster) {
        this.areaProgress++;
        this.renderQueue.location = true;
        let stopCombat = false;
        if (this.areaProgress === depth.monsters.length) {
            const abyssDepthCompleted = new AbyssDepthCompletedEvent(depth);
            this.areaProgress = 0;
            depth.timesCompleted++;
            const lootQty = rollPercentage(this.getLootDoublingChance(monster)) ? 2 : 1;
            const receiveNoItemDrops = rollPercentage(this.player.modifiers.noCombatDropChance);
            if (lootQty > 0 && !receiveNoItemDrops) {
                depth.rewards.forEach((item) => {
                    if (this.bank.addItem(item, lootQty, true, true, false, true, `AbyssDepth.${depth === null || depth === void 0 ? void 0 : depth.id}`)) {
                        //TODO_C add stats
                    }
                });
            }
            if (depth.oneTimeReward !== undefined && this.game.stats.itemFindCount(depth.oneTimeReward) <= 0)
                this.bank.addItem(depth.oneTimeReward, 1, false, true, true, true, `AbyssDepth.${depth === null || depth === void 0 ? void 0 : depth.id}`);
            this.dropEnemyCurrency(monster);
            if (depth.pet !== undefined) {
                if (depth.fixedPetClears) {
                    if (depth.timesCompleted >= depth.pet.weight)
                        this.game.petManager.unlockPet(depth.pet.pet);
                } else {
                    this.game.petManager.rollForPet(depth.pet);
                }
            }
            this.player.renderQueue.equipment = true;
            this.renderQueue.completionCount.add(depth);
            this.preventAutoRestart = false;
            this._events.emit('abyssDepthCompleted', abyssDepthCompleted);
            if (!this.game.settings.autoRestartDungeon || this.preventAutoRestart) {
                this.loot.lootAll();
                stopCombat = true;
                addModalToQueue({
                    title: getLangString('COMBAT_MISC_DUNGEON_COMPLETE'),
                    text: getLangString('COMBAT_MISC_DUNGEON_COMPLETE_TEXT'),
                    imageUrl: assets.getURI('assets/media/skills/combat/dungeon.png'),
                    imageWidth: 64,
                    imageHeight: 64,
                    imageAlt: getLangString('COMBAT_MISC_DUNGEON_COMPLETE'),
                });
            }
            this.preventAutoRestart = false;
        }
        return stopCombat;
    }
    /** Increases the progress through a Stronghold by 1 */
    increaseStrongholdProgress(stronghold, monster) {
        this.areaProgress++;
        this.renderQueue.location = true;
        let stopCombat = false;
        if (this.areaProgress === stronghold.monsters.length) {
            const gameEvent = new StrongholdCompletedEvent(stronghold);
            this.areaProgress = 0;
            stronghold.timesCompleted++;
            const lootMult = rollPercentage(this.getLootDoublingChance(monster)) ? 2 : 1;
            const receiveNoItemDrops = rollPercentage(this.player.modifiers.noCombatDropChance);
            const rewards = stronghold.tiers[this.strongholdTier].rewards;
            let rewardGiven = false;
            if (rollPercentage(rewards.chance)) {
                if (rewards.items !== undefined && !receiveNoItemDrops) {
                    rewards.items.forEach(({
                        item,
                        quantity
                    }) => {
                        quantity *= lootMult;
                        if (this.bank.addItem(item, quantity, true, true, false, true, `Stronghold.${stronghold.id}`)) {
                            // TODO_C Track stats
                        }
                    });
                }
                if (rewards.currencies !== undefined)
                    rewards.currencies.forEach(({
                        currency,
                        quantity
                    }) => this.addCurrency(currency, quantity, `Stronghold.${stronghold.id}`));
                rewardGiven = true;
            }
            if (stronghold.pet !== undefined && this.strongholdTier === 'Superior') {
                if (stronghold.pet.fixedClears) {
                    if (stronghold.timesCompleted >= stronghold.pet.weight) {
                        this.game.petManager.unlockPet(stronghold.pet.pet);
                    }
                } else {
                    this.game.petManager.rollForPet(stronghold.pet);
                }
            }
            this.renderQueue.completionCount.add(stronghold);
            this.renderQueue.petStatus.add(stronghold);
            if (!this.game.settings.autoRestartDungeon) {
                this.loot.lootAll();
                stopCombat = true;
                addModalToQueue({
                    title: getLangString('STRONGHOLD_COMPLETE'),
                    text: getLangString(rewardGiven ? 'STRONGHOLD_COMPLETE_REWARD' : 'STRONGHOLD_COMPLETE_NO_REWARD'),
                    imageUrl: assets.getURI('assets/media/skills/combat/strongholds.png'),
                    imageWidth: 64,
                    imageHeight: 64,
                    imageAlt: getLangString('STRONGHOLD_COMPLETE'),
                });
            }
            this._events.emit('strongholdCompleted', gameEvent);
        }
        return stopCombat;
    }
    /** Callback function for starting event */
    startEvent(event) {
        this.eventProgress = -1;
        this.activeEvent = event;
        this.eventPassives = [];
        this.computeAvailableEventPassives(event);
        this.increaseEventProgress(event);
        combatAreaMenus.openCategory(this.game.combatAreaCategories.getObjectByID('melvorF:SlayerAreas')); // TODO_C Fix this
        this.renderQueue.eventMenu = true;
        this.renderEventMenu();
    }
    computeAvailableEventPassives(event) {
        // -1 is special value for doubling slayer area effects
        this.availableEventPassives = [...event.passiveSelection];
        this.eventPassives.forEach((passive) => this.removeAvailablePassive(passive));
    }
    fireEventStageCompletionModal(event) {
        const modalBody = createElement('div');
        const item = event.itemRewards[this.eventProgress - 1];
        let title = getLangString('COMBAT_MISC_BANE_FLED');
        const itemFlavour = getLangString('COMBAT_MISC_IN_WAKE_FOUND');
        if (this.eventProgress === 5) {
            title = getLangString('COMBAT_MISC_BANE_DEFEATED');
        }
        const descriptionEl = createElement('small', {
            className: 'text-info',
            text: item.modifiedDescription
        });
        descriptionEl.innerHTML = item.modifiedDescription;
        modalBody.append(createElement('h5', {
            text: itemFlavour,
            className: 'text-info'
        }), createElement('img', {
            className: 'bank-img',
            attributes: [
                ['src', item.media]
            ]
        }), createElement('br'), createElement('span', {
            className: 'text-success',
            text: item.name
        }), createElement('br'), descriptionEl);
        addModalToQueue({
            title,
            html: modalBody,
            allowOutsideClick: false,
            showConfirmButton: true,
        });
    }
    fireEventPassiveModal() {
        const modalBody = createElement('div');
        this.eventPassivesBeingSelected.forEach((passive) => {
            const selectButton = createElement('button', {
                className: 'btn btn-outline-danger m-2'
            });
            selectButton.style.width = '80%';
            selectButton.onclick = () => this.onPassiveSelection(passive);
            selectButton.append(createElement('small', {
                innerHTML: passive.description
            }));
            modalBody.append(selectButton);
        });
        addModalToQueue({
            title: getLangString('BANE_EVENT_3'),
            html: modalBody,
            allowOutsideClick: false,
            showConfirmButton: false,
        });
    }
    showEventPassivesModal() {
        const modalBody = createElement('div');
        this.eventPassives.map((passive) => {
            modalBody.append(createElement('small', {
                innerHTML: passive.description,
                className: 'text-danger'
            }), createElement('br'));
        });
        addModalToQueue({
            title: getLangString('BANE_EVENT_4'),
            html: modalBody,
        });
    }
    showStartEventModal(event) {
        const modalBody = createElement('div');
        modalBody.append(createElement('h5', {
            text: getLangString('BANE_EVENT_START_TEXT_0')
        }));
        modalBody.append(createElement('p', {
            text: getLangString('BANE_EVENT_START_TEXT_1'),
        }));
        if (this.game.currentGamemode.isPermaDeath) {
            modalBody.append(createElement('p', {
                text: getLangString('BANE_EVENT_START_TEXT_2'),
            }));
        }
        for (let i = 3; i < 9; i++) {
            modalBody.append(createElement('p', {
                text: getLangString(`BANE_EVENT_START_TEXT_${i}`),
            }));
        }
        SwalLocale.fire({
            title: getLangString('BANE_EVENT_5'),
            html: modalBody,
            confirmButtonText: getLangString('MENU_TEXT_START'),
            showCancelButton: true,
            cancelButtonText: getLangString('CHARACTER_SELECT_50'),
        }).then((result) => {
            if (result.isConfirmed) {
                this.startEvent(event);
            }
        });
    }
    showStopEventModal() {
        const modalBody = createElement('div');
        modalBody.append(createElement('h5', {
            text: getLangString('BANE_EVENT_STOP_WARNING')
        }));
        modalBody.append(createElement('p', {
            text: getLangString('BANE_EVENT_ARE_YOU_SURE'),
        }));
        SwalLocale.fire({
            title: getLangString('BANE_EVENT_BTN_1'),
            html: modalBody,
            confirmButtonText: getLangString('MISC_STRING_30'),
            showCancelButton: true,
        }).then((result) => {
            if (result.isConfirmed) {
                this.stopEvent();
                this.stop(true);
            }
        });
    }
    onPassiveSelection(passive) {
        if (!this.eventPassivesBeingSelected.has(passive))
            return; // Bug fix for being able to spam multiple passives
        this.eventPassives.push(passive);
        this.removeAvailablePassive(passive);
        this.eventPassivesBeingSelected.clear();
        if (passive.id === "melvorF:EventPassive12" /* CombatPassiveIDs.EventPassive12 */ )
            this.renderQueue.slayerAreaEffects = true;
        Swal.close();
    }
    removeAvailablePassive(passive) {
        const index = this.availableEventPassives.indexOf(passive);
        if (index === -1)
            throw new Error('Tried to remove passive that is not available');
        this.availableEventPassives.splice(index, 1);
    }
    increaseEventProgress(event) {
        this.eventProgress++;
        if (this.eventProgress > 0)
            this.fireEventStageCompletionModal(event);
        if (this.eventProgress === 5) {
            this.game.petManager.unlockPet(event.pet);
            // This is a bit slow, but it should work
            const eventDungeon = this.game.dungeons.find((dungeon) => dungeon.event === event);
            if (eventDungeon !== undefined) {
                this.addDungeonCompletion(eventDungeon);
                this._events.emit('dungeonCompleted', new DungeonCompletedEvent(eventDungeon));
                this.renderQueue.completionCount.add(eventDungeon);
                this.renderQueue.petStatus.add(eventDungeon);
            }
            this.stopEvent();
            return;
        }
        this.activeEventAreas.clear();
        event.slayerAreas.forEach((area) => {
            this.activeEventAreas.set(area, rollInteger(5, 8));
        });
        this.renderEventAreas();
        this.eventPassivesBeingSelected = getExclusiveRandomArrayElements(this.availableEventPassives, 3);
        this.fireEventPassiveModal();
    }
    stopEvent() {
        this.activeEvent = undefined;
        this.renderEventAreas();
        this.renderQueue.eventMenu = true;
        this.renderEventMenu();
    }
    renderEventAreas() {
        if (this.isEventActive) {
            combatAreaMenus.all.forEach((menu, category) => {
                if (category.id === 'melvorF:SlayerAreas')
                    menu.updateEvent(this.activeEventAreas);
                else
                    menu.updateEvent(new Map());
            });
        } else {
            combatAreaMenus.all.forEach((menu) => menu.removeEvent());
        }
    }
    checkAreaEntryRequirements(area) {
        const slayerLevelReq = area instanceof SlayerArea ? area.slayerLevelRequired : 0;
        return this.game.checkRequirements(area.entryRequirements, true, slayerLevelReq);
    }
    checkDamageTypeRequirementsForMonster(monster, notify = false) {
        const isImmuneTo = this.isDamageTypeBlockedFromMonster(this.player.damageType, monster);
        if (isImmuneTo && notify) {
            notifyPlayer(this.game.attack, getLangString('MENU_TEXT_MONSTER_IMMUNE_DAMAGE_TYPE'), 'danger');
            this.notifyIncorrectDamageTypeForMonster(monster);
        }
        return !isImmuneTo;
    }
    isDamageTypeBlockedFromMonster(damageType, monster) {
        return monster.damageType.immuneTo.has(damageType);
    }
    isCurrentDamageTypeDisallowed(area, notify = false) {
        const damageTypeBlocked = this.isDamageTypeBlockedFromArea(this.player.damageType, area);
        if (damageTypeBlocked && notify) {
            notifyPlayer(this.game.attack, getLangString('MENU_TEXT_CANNOT_USE_DAMAGE_TYPE'), 'danger');
            this.notifyIncorrectDamageTypeForArea(area);
        }
        return damageTypeBlocked;
    }
    isDamageTypeBlockedFromArea(damageType, area) {
        const damageTypeBlocked = !area.canEnterWithDamageType(damageType) ||
            (area.overrideDamageType !== undefined && area.overrideDamageType.immuneTo.has(damageType));
        return damageTypeBlocked;
    }
    notifyIncorrectDamageTypeForMonster(monster) {
        const currentDamageType = this.player.damageType;
        const compatibleDamageTypes = game.damageTypes.filter((damageType) => {
            return (!this.isDamageTypeBlockedFromMonster(damageType, monster) &&
                damageType.id !== "melvorF:Pure" /* DamageTypeIDs.Pure */ &&
                damageType.id !== "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ );
        });
        let html = ``;
        html += this.getCurrentDamageTypeHTML(currentDamageType);
        const damageTypeList = this.getCompatibleDamageTypesHTML(compatibleDamageTypes);
        html += `<br><br>${getLangString(`THIEVING_DAMAGE_TYPE_NOTICE_1`)}${damageTypeList}`;
        this.fireDamageTypeSwal(html, monster.media);
    }
    notifyIncorrectDamageTypeForArea(area) {
        const currentDamageType = this.player.damageType;
        const compatibleDamageTypes = game.damageTypes.filter((damageType) => {
            return (!this.isDamageTypeBlockedFromArea(damageType, area) &&
                damageType.id !== "melvorF:Pure" /* DamageTypeIDs.Pure */ &&
                damageType.id !== "melvorItA:Eternal" /* DamageTypeIDs.Eternal */ );
        });
        let html = ``;
        html += this.getCurrentDamageTypeHTML(currentDamageType);
        const damageTypeList = this.getCompatibleDamageTypesHTML(compatibleDamageTypes);
        html += `<br><br>${getLangString(`THIEVING_DAMAGE_TYPE_NOTICE_1`)}${damageTypeList}`;
        if (setLang === 'en') {
            if (area.id === "melvorItA:Into_The_Abyss" /* DungeonIDs.Into_The_Abyss */ ) {
                html += `<br><br><span class="font-size-sm">Maybe that <strong class="text-success">Strange Sword</strong> will help here?</span>`;
            } else {
                html += `<br><br><span class="font-size-sm">Check the Damage Type on your equipped Weapon.</span>`;
            }
        }
        this.fireDamageTypeSwal(html, area.media);
    }
    getCurrentDamageTypeHTML(damageType) {
        return templateLangString(`COMBAT_AREA_DAMAGE_TYPE_NOTICE_0`, {
            damageType: `<img class="skill-icon-xs mr-1" src="${damageType.media}"><span class="${damageType.spanClass}">${damageType.name}</span>`,
        });
    }
    fireDamageTypeSwal(content, media) {
        SwalLocale.fire({
            title: getLangString('THIEVING_DAMAGE_TYPE_NOTICE_TITLE'),
            html: content,
            imageUrl: media,
            imageWidth: 128,
            imageHeight: 128,
        });
    }
    getCompatibleDamageTypesHTML(compatibleDamageTypes) {
        return compatibleDamageTypes
            .map((damageType) => {
                return `<br><img class="skill-icon-xs mr-1" src="${damageType.media}"><span class="${damageType.spanClass}">${damageType.name}</span>`;
            })
            .join('');
    }
    /** Callback function for selecting a monster */
    selectMonster(monster, area) {
        if (!this.game.tutorial.complete && !this.game.tutorial.allowedMonsters.has(monster)) {
            notifyPlayer(this.game.attack, getLangString('TOASTS_FIGHT_WRONG_MONSTER'), 'danger');
            return;
        }
        if (!this.checkAreaEntryRequirements(area))
            return;
        if (this.isCurrentDamageTypeDisallowed(area, true))
            return;
        if (!this.checkDamageTypeRequirementsForMonster(monster, true))
            return;
        const canStart = this.preSelection();
        if (canStart) {
            this.setCombatArea(area);
            this.selectedMonster = monster;
            this.onSelection();
        }
    }
    /** Callback function for selecting a dungeon */
    selectDungeon(dungeon) {
        if (!this.checkAreaEntryRequirements(dungeon))
            return;
        if (this.isCurrentDamageTypeDisallowed(dungeon, true))
            return;
        if (dungeon.event !== undefined) {
            this.showStartEventModal(dungeon.event);
            return;
        }
        const canStart = this.preSelection();
        if (canStart) {
            this.setCombatArea(dungeon);
            this.areaProgress = 0;
            this.onSelection();
        }
    }
    /** Callback function for selecting a dungeon */
    selectAbyssDepth(depth) {
        if (!this.checkAreaEntryRequirements(depth))
            return;
        if (this.isCurrentDamageTypeDisallowed(depth, true))
            return;
        const canStart = this.preSelection();
        if (canStart) {
            this.setCombatArea(depth);
            this.areaProgress = 0;
            this.onSelection();
        }
    }
    /** Returns if the player currently meets the requirements to fight a stronghold at the given tier */
    canFightInStrongholdTier(stronghold, tier) {
        const itemsRequired = stronghold.tiers[tier].requiredItems;
        return itemsRequired.every((item) => this.player.equipment.checkForItem(item));
    }
    /** Callback function for selecting a stronghold */
    selectStronghold(stronghold, tier) {
        if (!this.checkAreaEntryRequirements(stronghold) || !this.canFightInStrongholdTier(stronghold, tier))
            return;
        if (this.isCurrentDamageTypeDisallowed(stronghold, true))
            return;
        const canStart = this.preSelection();
        if (canStart) {
            this.setCombatArea(stronghold);
            this.areaProgress = 0;
            this.strongholdTier = tier;
            this.onSelection();
        }
    }
    /** Callback function for selecting an event area */
    selectEventArea(area) {
        if (!this.checkAreaEntryRequirements(area))
            return;
        if (this.isCurrentDamageTypeDisallowed(area, true))
            return;
        const areaLength = this.activeEventAreas.get(area);
        if (areaLength === undefined)
            throw new Error('Tried to select an event area that is not active!');
        const canStart = this.preSelection();
        if (canStart) {
            this.setCombatArea(area);
            this.areaProgress = 0;
            this.eventDungeonLength = areaLength + (this.atLastEventDungeon ? 1 : 0);
            this.onSelection();
        }
    }
    preSelection() {
        const canStart = !this.game.idleChecker(this);
        if (canStart) {
            this.stop(true, true);
        }
        return canStart;
    }
    /** Callback function for running from combat */
    stop(fled = true, areaChange = false) {
        if (!this.canStop)
            return false;
        if (this.enemy.state === EnemyState.Alive && fled) {
            this.addMonsterStat(MonsterStats.RanAway);
        }
        super.stop(fled);
        if (fled && !areaChange)
            this.loot.lootAll();
        this.setCombatArea(undefined);
        if (this.paused) {
            this.renderQueue.pause = true;
            this.paused = false;
        }
        this.game.clearActiveAction(!areaChange && !loadingOfflineProgress);
        // Fire XP telemetry events on stop
        this.game.telemetry.fireEventType('online_xp_gain');
        this.game.telemetry.fireEventType('offline_xp_gain');
        this.giveFreeDeath = false;
        return true;
    }
    loadNextEnemy() {
        let nextMonster;
        if (this.selectedArea instanceof Dungeon || this.selectedArea instanceof Stronghold) {
            nextMonster = this.selectedArea.monsters[this.areaProgress];
        } else if (this.selectedArea instanceof CombatArea && this.selectedMonster !== undefined) {
            nextMonster = this.selectedMonster;
        } else {
            throw new Error('Error loading next enemy. Area or Monster is not selected.');
        }
        if (nextMonster.id === "melvorF:RandomITM" /* MonsterIDs.RandomITM */ ) {
            nextMonster = getRandomArrayElement(this.itmMonsters);
        } else if (nextMonster.id === "melvorTotH:RandomSpiderLair" /* MonsterIDs.RandomSpiderLair */ ) {
            nextMonster = getRandomArrayElement(this.spiderLairMonsters);
        }
        if (this.activeEvent !== undefined) {
            if (this.atLastEventDungeon && this.areaProgress === this.eventDungeonLength - 1) {
                nextMonster = this.eventProgress === 4 ? this.activeEvent.finalBossMonster : this.activeEvent.firstBossMonster;
            } else {
                nextMonster = getRandomArrayElement(this.selectedArea.monsters);
            }
        }
        this.selectedMonster = nextMonster;
        super.loadNextEnemy();
    }
    createNewEnemy() {
        var _a;
        if (this.selectedMonster === undefined)
            throw new Error('Error creating new enemy, no monster is selected.');
        this.enemy.overrideDamageType = undefined;
        if (((_a = this.selectedArea) === null || _a === void 0 ? void 0 : _a.overrideDamageType) !== undefined)
            this.enemy.overrideDamageType = this.selectedArea.overrideDamageType;
        this.enemy.setNewMonster(this.selectedMonster);
        const passiveList = this.computePassivesForEnemy(this.selectedMonster);
        this.adjustPassives(passiveList);
    }
    getPassivesForMonster(monster, area) {
        const passives = [];
        const addUnsavedPassive = (passive) => {
            passives.push({
                passive,
                display: true,
                save: false,
            });
        };
        monster.passives.forEach(addUnsavedPassive);
        if (this.game.currentGamemode.enemyPassives.length > 0) {
            this.game.currentGamemode.enemyPassives.forEach(addUnsavedPassive);
        }
        if ((area instanceof Stronghold || area instanceof Dungeon) && monster.isBoss) {
            area.bossOnlyPassives.forEach(addUnsavedPassive);
        }
        if (area instanceof Dungeon && area.nonBossPassives !== undefined && !monster.isBoss) {
            area.nonBossPassives.forEach(addUnsavedPassive);
        }
        return passives;
    }
    computeUnsavedPassives() {
        const passives = super.computeUnsavedPassives();
        if (this.selectedMonster !== undefined)
            passives.push(...this.getPassivesForMonster(this.selectedMonster, this.selectedArea));
        if (this.selectedArea instanceof Stronghold) {
            this.selectedArea.tiers[this.strongholdTier].passives.forEach((passive) => {
                passives.push({
                    passive,
                    display: true,
                    save: false,
                });
            });
        }
        return passives;
    }
    computePassivesForEnemy(monster) {
        const passives = this.computeUnsavedPassives();
        const addSavedPassive = (passive) => {
            passives.push({
                passive,
                display: true,
                save: true,
            });
        };
        if (this.activeEvent !== undefined) {
            this.eventPassives.forEach((passive) => passives.push({
                passive,
                display: false,
                save: true,
            }));
            if (monster !== this.activeEvent.firstBossMonster && monster !== this.activeEvent.finalBossMonster) {
                this.activeEvent.enemyPassives.forEach(addSavedPassive);
            }
            if (this.areaProgress === this.eventDungeonLength - (this.atLastEventDungeon ? 2 : 1)) {
                this.activeEvent.bossPassives.forEach(addSavedPassive);
            }
        }
        this.applyAutoCorruption(monster, passives);
        return passives;
    }
    /* #region Permanent Corruption */
    /**
     * Applies permanent coruption to an enemy when they spawn
     * @param monster The monster to attempt to apply perma-corruption to
     */
    applyAutoCorruption(monster, passives) {
        var _a;
        if (!this.game.settings.enablePermaCorruption ||
            monster.levels.Corruption <= 0 ||
            !((_a = this.game.corruption) === null || _a === void 0 ? void 0 : _a.isUnlocked))
            return;
        const soulPointCost = this.getAutoCorruptionCost(monster);
        if (this.player.soulPoints >= soulPointCost) {
            this.player.consumeSoulPoints(soulPointCost);
            const passive = this.game.combatPassives.getObjectByID("melvorItA:PermanentCorruption" /* CombatPassiveIDs.PermanentCorruption */ );
            if (passive !== undefined)
                passives.push({
                    passive,
                    save: true,
                    display: false
                });
            this.game.stats.Corruption.add(3 /* CorruptionStats.SoulPointsSpent */ , soulPointCost);
            this.game.stats.Corruption.inc(2 /* CorruptionStats.MonstersAutoCorrupted */ );
        } else {
            if (!loadingOfflineProgress)
                notifyPlayer(this.game.prayer, getLangString('NOT_ENOUGH_SOUL_POINTS'), 'danger');
        }
    }
    /** Gets the amount of soul points it costs to permanently corrupt a monster */
    getAutoCorruptionCost(monster) {
        let cost = monster.levels.Corruption;
        cost *= 1 + this.player.modifiers.permanentCorruptionCost / 100;
        cost = Math.floor(cost);
        return cost;
    }
    /* #endregion */
    onPageChange() {
        // Override due to how golbin raid and combat share the same page
        if (this.game.isGolbinRaid)
            this.game.golbinRaid.onCombatPageChange();
        else
            this.onCombatPageChange();
    }
    renderModifierChange() {
        // Override due to how golbin raid and combat share the same page
        if (this.game.isGolbinRaid)
            this.game.golbinRaid.renderAutoSwapFood();
        else
            this.renderAutoSwapFood();
    }
    spawnEnemy() {
        super.spawnEnemy();
        if (this.enemy.monster !== undefined)
            this._events.emit('monsterSpawned', new MonsterSpawnedEvent(this.enemy.monster));
        if ((this.selectedArea instanceof Dungeon &&
                this.selectedArea.pauseOnBosses &&
                this.selectedArea.monsters[this.areaProgress].isBoss) ||
            (this.activeEvent !== undefined &&
                (this.enemy.monster === this.activeEvent.firstBossMonster ||
                    this.enemy.monster === this.activeEvent.finalBossMonster))) {
            this.pauseDungeon();
        } else {
            this.startFight();
        }
    }
    pauseDungeon() {
        this.renderQueue.pause = true;
        this.paused = true;
    }
    resumeDungeon() {
        this.renderQueue.pause = true;
        this.startFight(false);
        this.paused = false;
    }
    onSelection() {
        this.game.activeAction = this;
        super.onSelection();
        combatAreaMenus.closeOpen();
    }
    resetActionState() {
        super.resetActionState();
        this.selectedArea = undefined;
        this.areaProgress = 0;
        this.selectedMonster = undefined;
        this.paused = false;
    }
    resetEventState() {
        this.activeEvent = undefined;
        this.eventPassives = [];
        this.eventPassivesBeingSelected.clear();
        this.eventDungeonLength = 0;
        this.activeEventAreas.clear();
        this.eventProgress = 0;
        if (this.isActive)
            this.shouldResetAction = true;
    }
    encode(writer) {
        super.encode(writer);
        writer.writeBoolean(this.selectedArea !== undefined);
        if (this.selectedArea !== undefined) {
            writer.writeUint8(this.areaType);
            writer.writeNamespacedObject(this.selectedArea);
        }
        writer.writeUint32(this.areaProgress);
        writer.writeBoolean(this.selectedMonster !== undefined);
        if (this.selectedMonster !== undefined) {
            writer.writeNamespacedObject(this.selectedMonster);
        }
        writer.writeBoolean(this.paused);
        this.loot.encode(writer);
        this.slayerTask.encode(writer);
        writer.writeBoolean(this.isEventActive);
        if (this.activeEvent !== undefined)
            writer.writeNamespacedObject(this.activeEvent);
        writer.writeArray(this.eventPassives, writeNamespaced);
        writer.writeSet(this.eventPassivesBeingSelected, writeNamespaced);
        writer.writeUint32(this.eventDungeonLength);
        writer.writeMap(this.activeEventAreas, writeNamespaced, (monsterCount, writer) => writer.writeUint32(monsterCount));
        writer.writeUint32(this.eventProgress);
        writer.writeMap(this.dungeonCompletion, writeNamespaced, (count, writer) => writer.writeUint32(count));
        writer.writeUint8(Stronghold.TierIDs[this.strongholdTier]);
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        if (reader.getBoolean()) {
            let selectedArea;
            switch (reader.getUint8()) {
                case CombatAreaType.Dungeon:
                    selectedArea = reader.getNamespacedObject(this.game.dungeons);
                    break;
                case CombatAreaType.Slayer:
                    selectedArea = reader.getNamespacedObject(this.game.slayerAreas);
                    break;
                case CombatAreaType.Combat:
                    selectedArea = reader.getNamespacedObject(this.game.combatAreas);
                    break;
                case CombatAreaType.AbyssDepth:
                    selectedArea = reader.getNamespacedObject(this.game.abyssDepths);
                    break;
                case CombatAreaType.Stronghold:
                    selectedArea = reader.getNamespacedObject(this.game.strongholds);
                    break;
                default:
                    throw new Error(`Error decoding combat. Invalid CombatAreaType.`);
            }
            if (typeof selectedArea === 'string')
                this.shouldResetAction = true;
            else
                this.selectedArea = selectedArea;
        }
        this.areaProgress = reader.getUint32();
        if (reader.getBoolean()) {
            const selectedMonster = reader.getNamespacedObject(this.game.monsters);
            if (typeof selectedMonster === 'string')
                this.shouldResetAction = true;
            else
                this.selectedMonster = selectedMonster;
        }
        this.paused = reader.getBoolean();
        this.loot.decode(reader, version);
        this.slayerTask.decode(reader, version);
        if (reader.getBoolean()) {
            const activeEvent = reader.getNamespacedObject(this.game.combatEvents);
            if (typeof activeEvent === 'string')
                this.shouldResetEvent = true;
            else
                this.activeEvent = activeEvent;
        }
        this.eventPassives = reader.getArray(readNamespacedReject(this.game.combatPassives));
        this.eventPassivesBeingSelected = reader.getSet(readNamespacedReject(this.game.combatPassives));
        this.eventDungeonLength = reader.getUint32();
        this.activeEventAreas = reader.getMap((reader) => {
            const area = reader.getNamespacedObject(this.game.slayerAreas);
            if (typeof area === 'string') {
                this.shouldResetEvent = true;
                return undefined;
            } else
                return area;
        }, (reader) => reader.getUint32());
        this.eventProgress = reader.getUint32();
        this.dungeonCompletion = reader.getMap((reader) => {
            const dungeon = reader.getNamespacedObject(this.game.dungeons);
            if (typeof dungeon === 'string') {
                if (dungeon.startsWith('melvor'))
                    return this.game.dungeons.getDummyObject(dungeon, DummyDungeon, this.game);
                else
                    return undefined;
            } else
                return dungeon;
        }, (reader) => reader.getUint32());
        if (version >= 100 /* SaveVersion.IntoTheAbyss */ )
            this.strongholdTier = Stronghold.TierIDs[reader.getUint8()];
        if (version >= 102 /* SaveVersion.PermaCorruption */ && version < 104 /* SaveVersion.ITASettings */ )
            reader.skipArrayBytes(2);
        if (this.activeEvent !== undefined)
            this.computeAvailableEventPassives(this.activeEvent);
        if (this.shouldResetEvent)
            this.resetEventState();
        if (this.shouldResetAction)
            this.resetActionState();
        if (!this.isActive)
            this.selectedArea = undefined; // Fix for invalid state
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        this.selectedArea = reader.getLocation(this.game, idMap);
        if (this.selectedArea === undefined)
            this.shouldResetAction = true;
        this.areaProgress = reader.getNumber();
        const selectedMonster = this.game.monsters.getObjectByID(idMap.monsters[reader.getNumber()]);
        if (selectedMonster === undefined)
            this.shouldResetAction = true;
        else
            this.selectedMonster = selectedMonster;
        this.paused = reader.getBool();
        this.loot.deserialize(reader.getVariableLengthChunk(), version, idMap);
        this.slayerTask.deserialize(reader.getVariableLengthChunk(), version, idMap);
        if (version >= 7) {
            const eventActive = reader.getBool();
            if (eventActive) {
                this.activeEvent = this.game.combatEvents.getObjectByID(idMap.combatEvents[0]);
                if (this.activeEvent === undefined)
                    this.shouldResetEvent = true;
            }
            let eventPassiveIDs = reader.getVariableLengthChunk().getRawData();
            if (version < 9) {
                // Fix for bad event data
                const oldPassiveIDs = eventPassiveIDs;
                eventPassiveIDs = [];
                oldPassiveIDs.forEach((passiveID) => {
                    if (passiveID >= 31 /* EventPassive6 */ )
                        passiveID--;
                    if (passiveID !== 31 /* EventPassive6 */ )
                        eventPassiveIDs.push(passiveID);
                });
            }
            eventPassiveIDs.forEach((passiveID) => {
                const passive = this.game.combatPassives.getObjectByID(idMap.combatPassives[passiveID]);
                if (passive !== undefined)
                    this.eventPassives.push(passive);
            });
            let selectedPassiveIDs = reader.getVariableLengthChunk().getRawData();
            if (version < 9) {
                // Fix for bad event data
                const oldPassivesSelected = selectedPassiveIDs;
                selectedPassiveIDs = [];
                oldPassivesSelected.forEach((passiveID) => {
                    if (passiveID >= 31 /* EventPassive6 */ )
                        passiveID--;
                    if (passiveID !== 31 /* EventPassive6 */ )
                        selectedPassiveIDs.push(passiveID);
                });
            }
            selectedPassiveIDs.forEach((passiveID) => {
                const passive = this.game.combatPassives.getObjectByID(idMap.combatPassives[passiveID]);
                if (passive !== undefined)
                    this.eventPassivesBeingSelected.add(passive);
            });
            this.eventDungeonLength = reader.getNumber();
            const numAreas = reader.getNumber();
            for (let i = 0; i < numAreas; i++) {
                const slayerArea = this.game.slayerAreas.getObjectByID(idMap.slayerAreas[reader.getNumber()]);
                if (slayerArea === undefined)
                    this.shouldResetEvent = true;
                const monsterCount = reader.getNumber();
                if (slayerArea !== undefined)
                    this.activeEventAreas.set(slayerArea, monsterCount);
            }
        }
        if (version >= 8) {
            this.eventProgress = reader.getNumber();
        }
        if (this.activeEvent !== undefined) {
            // This is a bug fix for bricked saves that have duplicate passives
            if (version < 13) {
                const newPassives = [];
                this.eventPassives.forEach((passive) => {
                    if (!newPassives.includes(passive))
                        newPassives.push(passive);
                });
                this.eventPassives = newPassives;
            }
            this.computeAvailableEventPassives(this.activeEvent);
        }
        if (this.shouldResetEvent)
            this.resetEventState();
        if (this.shouldResetAction)
            this.resetActionState();
        if (!this.isActive)
            this.selectedArea = undefined; // Fix for invalid state
    }
    resetOfflineTracking() {
        this.loot.lostLoot.clear();
        this.bank.lostItems.clear();
    }
    /** Sets properties based on the old save file variables */
    convertFromOldSaveFormat(saveGame, idMap) {
        var _a, _b;
        this.player.convertFromOldSaveFormat(saveGame, idMap);
        this.slayerTask.convertFromOldSaveFormat((_a = saveGame.slayerTask) !== null && _a !== void 0 ? _a : [], (_b = saveGame.slayerTaskCompletion) !== null && _b !== void 0 ? _b : defaultSaveValues.slayerTaskCompletion, idMap);
    }
    convertDungeonCompletion(dungeonCompletion, idMap) {
        dungeonCompletion.forEach((count, oldDungeonID) => {
            const newID = idMap.dungeons[oldDungeonID];
            let dungeon = this.game.dungeons.getObjectByID(newID);
            if (dungeon === undefined)
                dungeon = this.game.dungeons.getDummyObject(newID, DummyDungeon, this.game);
            this.dungeonCompletion.set(dungeon, count);
        });
    }
    getCombatStatsLog() {
        return {
            player: {
                stats: this.player.stats.getValueTable(),
                modifiers: this.player.modifiers.getLog(),
            },
            enemy: {
                stats: this.enemy.stats.getValueTable(),
                modifiers: this.enemy.modifiers.getLog(),
            },
        };
    }
    /** Logs player and enemy combat stats to console */
    saveStats() {
        setItem(`${key}statsLog`, this.getCombatStatsLog());
    }
    getSavedStats() {
        return getItem(`${key}statsLog`);
    }
    compareSavedStats() {
        const oldStats = this.getSavedStats();
        if (oldStats !== null)
            this.compareCombatStatLogs(oldStats);
    }
    compareCombatStatLogs(oldStats) {
        const curStats = this.getCombatStatsLog();
        let statDiff = false;
        statDiff =
            compareNameValuePairs(curStats.player.stats, oldStats.player.stats, 'Player Stat Difference:') || statDiff;
        statDiff =
            compareNameValuePairs(curStats.player.modifiers, oldStats.player.modifiers, 'Player Modifier Difference') ||
            statDiff;
        if (this.fightInProgress) {
            statDiff =
                compareNameValuePairs(curStats.enemy.stats, oldStats.enemy.stats, 'Enemy Stat Difference:') || statDiff;
            statDiff =
                compareNameValuePairs(curStats.enemy.modifiers, oldStats.enemy.modifiers, 'Player Stat Difference') || statDiff;
        }
        return statDiff;
    }
    testInitializationStatParity() {
        const oldStats = this.getCombatStatsLog();
        this.initialize();
        const failed = this.compareCombatStatLogs(oldStats);
        if (failed)
            this.game.stopMainLoop();
    }
}
class Timer {
    constructor(type, action) {
        this.type = type;
        this.action = action;
        this._ticksLeft = -1;
        this._maxTicks = -1;
        this.active = false;
    }
    tick() {
        if (this.active) {
            this._ticksLeft--;
            if (this._ticksLeft === 0) {
                this.active = false;
                this.action();
            }
        }
    }
    start(time, offsetByTick = false) {
        let ticks = Math.floor(time / TICK_INTERVAL);
        if (offsetByTick)
            ticks++;
        if (ticks < 1)
            throw new Error(`Tried to start timer: ${this.type} with invalid tick amount: ${ticks}`);
        this.active = true;
        this._maxTicks = ticks;
        this._ticksLeft = ticks;
    }
    stop() {
        this.active = false;
    }
    get isActive() {
        return this.active;
    }
    get maxTicks() {
        return this._maxTicks;
    }
    get ticksLeft() {
        return this._ticksLeft;
    }
    get progress() {
        if (this.active)
            return (this._maxTicks - this._ticksLeft) / this._maxTicks;
        return 0;
    }
    encode(writer) {
        writer.writeInt32(this._ticksLeft);
        writer.writeInt32(this._maxTicks);
        writer.writeBoolean(this.active);
        return writer;
    }
    decode(reader, version) {
        this._ticksLeft = reader.getInt32();
        this._maxTicks = reader.getInt32();
        this.active = reader.getBoolean();
    }
    deserialize(sData, version) {
        this._ticksLeft = sData[0];
        this._maxTicks = sData[1];
        this.active = sData[2] === 1;
    }
    static skipData(reader, version) {
        reader.skipBytes(9);
    }
}
//# sourceMappingURL=combatManager.js.map
checkFileVersion('?12097')