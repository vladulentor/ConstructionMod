"use strict";
/** Combat Management class for golbin raid */
class RaidManager extends BaseManager {
    constructor(game, namespace) {
        super(game, namespace, 'GolbinRaid');
        /* #region GameEventEmitter Boilerplate */
        this._events = mitt();
        this.on = this._events.on;
        this.off = this._events.off;
        this.activeSkills = [];
        this.randomModifierSource = {
            get name() {
                return getLangString('RANDOM_MODIFIERS');
            },
        };
        this.staticPlayerModifiers = [];
        this.randomPlayerModifiers = [];
        this.randomEnemyModifiers = [];
        this.player = new RaidPlayer(this, this.game);
        this.state = RaidState.Unstarted;
        /** Difficulty selected in the UI */
        this.selectedDifficulty = RaidDifficulty.Medium;
        /** Internal difficulty to actually use */
        this._setDifficulty = RaidDifficulty.Easy;
        this.enemy = new Golbin(this, this.game);
        this.bank = new GolbinRaidBank(this.game, 1, 100);
        this.itemCharges = new ItemCharges(this.game); // Note that this is a dummy item charges object that serves just to have events assigned to it. If at some point we want golbin raid to actually use item charges this can be implemented fully
        this.potions = new PotionManager(this.game); // Note that this is a dummy potion manager object that serves just to have events assigned to it. If at some point we want golbin raid to actually use potions this can be implemented fully
        // Registered data for raid
        this.bannedItems = new Set();
        this.bannedPassiveItems = new Set();
        this.crateItems = [];
        this.golbinPassives = [];
        this.startingWeapons = [];
        this.startingRunes = [];
        this.possibleModifiers = [];
        this.itemSelection = {
            weapons: [
                [],
                [],
                []
            ],
            armour: [
                [],
                [],
                []
            ],
            ammo: [
                [],
                [],
                []
            ],
            runes: [
                [],
                [],
                []
            ],
            food: [
                [],
                [],
                []
            ],
            passives: [
                [],
                [],
                []
            ],
        };
        this.exclusiveItemSelection = {
            weapons: [
                [],
                [],
                []
            ],
            armour: [
                [],
                [],
                []
            ],
            ammo: [
                [],
                [],
                []
            ],
            runes: [
                [],
                [],
                []
            ],
            food: [
                [],
                [],
                []
            ],
            passives: [
                [],
                [],
                []
            ],
        };
        this.itemLevelBrackets = [70, 85, 121];
        this.wave = 0;
        this.waveProgress = 0;
        this.killCount = 0;
        this.specialAttackSelection = [];
        this.isFightingITMBoss = false;
        this.onSlayerTask = false;
        this.startTimestamp = 0;
        this.endTimestamp = 0;
        this.ownedCrateItems = new Set();
        this.randomModifiersBeingSelected = [];
        this.isSelectingPositiveModifier = false;
        this.itemsBeingSelected = {
            weapons: [],
            armour: [],
            ammo: [],
            runes: [],
            food: [],
            passives: [],
        };
        this.itemCategoryBeingSelected = 'weapons';
        this.posModsSelected = 0;
        this.negModsSelected = 0;
        this.isPaused = false;
        /** History of previous raids */
        this.history = [];
        this.toggleOffSelectors = [
            '.combat-equipment-set-container',
            '#combat-slayer-task-menu',
            '#combat-corruption-settings',
            '#combat-loot',
            '#destroy-combat-loot-container',
            '#combat-menu-item-5',
            '#combat-menu-item-6',
            '#combat-menu-item-7',
            '#combat-btn-monster-drops',
            '#combat-area-selection',
            '#combat-spellbook-use-combo-runes',
            '#combat-top-menu',
            '#combat-area-category-menu',
        ];
        this.toggleOnSelectors = [
            '.combat-player-golbin-stats',
            '#combat-golbin-raid-wave-skip',
            '#combat-btn-pause-raid',
            '#combat-btn-modifiers-raid',
        ];
        this.prayerUnlockedSelectors = ['#combat-menu-item-2', '.golbin-raid-prayer-level'];
    }
    /* #endregion */
    get media() {
        return assets.getURI("assets/media/pets/golden_golbin.png" /* Assets.GolbinRaid */ );
    }
    get name() {
        return getLangString('PAGE_NAME_GolbinRaid');
    }
    get canStop() {
        return this.isActive;
    }
    get areaType() {
        return CombatAreaType.None;
    }
    get difficulty() {
        return RaidManager.difficulties[this._setDifficulty];
    }
    get waveLength() {
        return Math.floor(2 + this.wave / 4);
    }
    get fightingBoss() {
        return (this.wave + 1) % 10 === 0 && this.waveLength - 1 === this.waveProgress;
    }
    get waveBracket() {
        const brackets = [10, 20, Infinity];
        return brackets.findIndex((x) => this.wave < x);
    }
    get waveSkipCost() {
        return Math.floor((this.wave + 1) * 100 * (1 + this.player.modifiers.golbinRaidWaveSkipCost / 100));
    }
    get coinsEarned() {
        if (this.wave > 2) {
            return Math.floor(this.difficulty.coinMultiplier *
                3.6 *
                this.wave *
                Math.floor(2 + this.wave / 4) *
                Math.floor(this.wave / 15 + 1));
        } else {
            return 0;
        }
    }
    get canInteruptAttacks() {
        return this.fightInProgress;
    }
    get areaRequirementsMet() {
        return true;
    }
    get enemyAreaModifiers() {
        return [];
    }
    get ignoreSpellRequirements() {
        return true;
    }
    get combatTriangle() {
        return this.game.normalCombatTriangleSet[this.difficulty.combatTriangle];
    }
    get combatTriangleSet() {
        return this.game.normalCombatTriangleSet;
    }
    get raidRunning() {
        return this.state !== RaidState.Unstarted && !this.isPaused;
    }
    get cratesPurchased() {
        return this.ownedCrateItems.size;
    }
    registerData(data) {
        const getItem = (itemID) => {
            const item = this.game.items.getObjectByID(itemID);
            if (item === undefined)
                throw new Error(`Error registering data for Golbin Raid. Item with id: ${itemID} is not registered.`);
            return item;
        };
        data.bannedItems.forEach((itemID) => {
            this.bannedItems.add(getItem(itemID));
        });
        data.bannedPassiveItems.forEach((itemID) => {
            this.bannedPassiveItems.add(getItem(itemID));
        });
        data.crateItems.forEach(({
            itemID,
            weight
        }) => {
            const item = getItem(itemID);
            this.crateItems.push({
                weight,
                item
            });
        });
        data.golbinPassives.forEach((id) => {
            const passive = this.game.combatPassives.getObjectByID(id);
            if (passive === undefined)
                throw new Error(`Error registering data for Golbin Raid. Passive with id: ${id} is not registered.`);
            this.golbinPassives.push(passive);
        });
        if (data.startingWeapons !== undefined) {
            data.startingWeapons.forEach((itemID) => {
                const weapon = this.game.items.weapons.getObjectByID(itemID);
                if (weapon === undefined)
                    throw new Error(`Error registering data for Golbin Raid. Weapon with id: ${itemID} is not registered.`);
                this.startingWeapons.push(weapon);
            });
        }
        if (data.startingFood !== undefined) {
            const food = this.game.items.food.getObjectByID(data.startingFood);
            if (food === undefined)
                throw new Error(`Error registering data for Golbin Raid. Food with id: ${data.startingFood} is not registered.`);
            this.startingFood = food;
        }
        if (data.startingAmmo !== undefined) {
            const itemQuantity = this.game.items.equipment.getQuantity(data.startingAmmo);
            if (!itemQuantity.item.fitsInSlot("melvorD:Quiver" /* EquipmentSlotIDs.Quiver */ ))
                throw new Error(`Error registering data for Golbin Raid. Starting ammo with id: ${data.startingAmmo.id} is not a quiver item.`);
            this.startingAmmo = itemQuantity;
        }
        if (data.startingRunes !== undefined) {
            this.startingRunes.push(...this.game.items.getQuantities(data.startingRunes));
        }
        if (data.randomModifiers !== undefined) {
            data.randomModifiers.forEach(({
                key,
                multiplier
            }) => {
                const data = {
                    [key]: multiplier === undefined ? 1 : multiplier,
                };
                this.possibleModifiers.push(...this.game.getModifierValuesFromData(data));
            });
        }
        if (data.playerModifiers !== undefined) {
            this.staticPlayerModifiers.push(...game.getModifierValuesFromData(data.playerModifiers));
        }
    }
    activeTick() {
        if (this.state !== RaidState.FightingWave)
            return;
        this.player.passiveTick();
        this.spawnTimer.tick();
        this.enemy.passiveTick();
        this.player.activeTick();
        this.enemy.activeTick();
        this.checkDeath();
    }
    onPageChange() {
        this.loadHistory();
        updateStats(StatCategories.GolbinRaid);
    }
    render() {
        super.render();
        this.bank.render();
    }
    preStartRaid() {
        if (this.state !== RaidState.Unstarted)
            return; // Prevents clicking start again while selecting modifiers breaking the game
        // Pre-start raid process, Set Difficulty, then start
        this._setDifficulty = this.selectedDifficulty;
        // Start selecting negative modifiers
        this.state = RaidState.SelectingModifiersStart;
        this.resetModifiers();
        this.resetModsSelected();
        this.continueModifierSelection();
    }
    resetModsSelected() {
        this.isSelectingPositiveModifier = true;
        this.posModsSelected = 0;
        this.negModsSelected = 0;
    }
    resetModifiers() {
        this.randomEnemyModifiers = [];
        this.randomPlayerModifiers = [];
    }
    fireStateModals() {
        switch (this.state) {
            case RaidState.SelectingCategory:
                // Fire the category selection modal
                this.fireCategorySelectModal();
                break;
            case RaidState.SelectingItem:
                // Fire the item selection modal
                this.fireItemSelectModal();
                break;
            case RaidState.SelectingModifiersWave:
            case RaidState.SelectingModifiersStart:
                this.fireRandomModifierSelection();
                break;
        }
    }
    startRaid() {
        // Reset the state to the start of raid
        this.startTimestamp = new Date().getTime();
        this.wave = 0;
        this.waveProgress = 0;
        this.killCount = 0;
        this.pauseGame();
        this.setDefaultEquipment();
        this.onSelection();
    }
    updateSkipCost() {
        $('#golbin-raid-skip-cost').html(templateString(getLangString('COMBAT_MISC_85'), {
            coinImage: `<img class="skill-icon-xs mr-1 " src="${assets.getURI("assets/media/main/raid_coins.png" /* Assets.RaidCoinIcon */)}">`,
            qty: `${numberWithCommas(this.waveSkipCost)}`,
        }));
    }
    pause() {
        if (this.state === RaidState.Unstarted)
            return;
        this.isPaused = true;
        this.renderStartMenu();
        this.resumeGame();
    }
    unpause() {
        if (!this.isPaused)
            return;
        this.pauseGame();
        this.fireStateModals();
        this.game.renderQueue.combatMinibar = true;
        this.isPaused = false;
    }
    pauseGame() {
        if (confirmedLoaded) {
            this.game.pauseActiveSkill();
        }
        this.game.activeAction = this;
        // Perform all neccessary UI takeover and rendering
        this.initialize();
        this.toggleUIOff();
        this.renderQueue.spellBook = true;
        this.updateSkipCost();
        const page = this.game.getPageForAction(this.game.combat);
        if (page !== undefined)
            changePage(page, -1, undefined, false, false);
        this.isPaused = false;
        this.game.scheduleSave();
    }
    resumeGame() {
        if (confirmedLoaded) {
            this.game.unpauseActiveSkill();
            this.game.triggerOfflineLoop();
        }
        // Perform all neccessary UI releasing and rendering
        this.game.combat.initialize();
        this.toggleUIOn();
        this.game.combat.renderQueue.spellBook = true;
        changeCombatMenu(0);
        const page = this.game.getPageForAction(this);
        if (page !== undefined)
            changePage(page, -1, undefined, false, false);
        this.game.scheduleSave();
    }
    onLoad() {
        this.renderStartMenu();
        if (this.state === RaidState.Unstarted || this.isPaused)
            return;
        this.initialize();
        this.toggleUIOff();
        this.updateSkipCost();
        this.fireStateModals();
    }
    toggleUIOff() {
        this.toggleOffSelectors.forEach((selector) => {
            $(selector).addClass('d-none');
        });
        combatAreaMenus.closeOpen();
        this.toggleOnSelectors.forEach((selector) => {
            $(selector).removeClass('d-none');
        });
        if (this.player.isPrayerUnlocked) {
            this.prayerUnlockedSelectors.forEach((selector) => {
                $(selector).removeClass('d-none');
            });
            combatMenus.prayer.updateForLevel(this.player, this.player.levels.Prayer, 0);
        } else {
            this.prayerUnlockedSelectors.forEach((selector) => {
                $(selector).addClass('d-none');
            });
        }
        combatMenus.runes.updateCounts(this.bank);
        combatMenus.equipment.forEach((grid) => grid.setQuickEquipEnabled(false));
        this.game.renderQueue.title = true;
    }
    toggleUIOn() {
        this.toggleOffSelectors.forEach((selector) => {
            $(selector).removeClass('d-none');
        });
        this.toggleOnSelectors.forEach((selector) => {
            $(selector).addClass('d-none');
        });
        this.prayerUnlockedSelectors.forEach((selector) => {
            $(selector).removeClass('d-none');
        });
        $(this.prayerUnlockedSelectors[1]).addClass('d-none');
        combatMenus.prayer.updateForLevel(this.game.combat.player, this.game.prayer.level, this.game.prayer.abyssalLevel);
        combatMenus.runes.updateCounts(this.bank);
        combatMenus.equipment.forEach((grid) => grid.setQuickEquipEnabled(true));
        this.game.combat.renderQueue.corruptionMenus = true;
        this.game.renderQueue.title = true;
    }
    stop(fled = true) {
        if (!this.canStop)
            return false;
        super.stop(fled);
        this.endTimestamp = new Date().getTime();
        this.recordRaidHistory();
        if (this.coinsEarned > 0) {
            this.game.raidCoins.add(this.coinsEarned);
            this.game.stats.GolbinRaid.add(RaidStats.RaidCoinsEarned, this.coinsEarned);
        }
        this.game.stats.GolbinRaid.set(RaidStats.HighestWave, Math.max(this.game.stats.GolbinRaid.get(RaidStats.HighestWave), this.wave));
        const title = fled ? getLangString('COMBAT_MISC_RAN_AWAY') : getLangString('COMBAT_MISC_YOU_DIED');
        if (!fled) {
            this.game.stats.GolbinRaid.inc(RaidStats.TotalDeath);
        }
        addModalToQueue({
            title: title,
            html: '<span class="text-dark">' +
                templateString(getLangString('GOLBIN_RAID_WAVE_FINISH'), {
                    num: `${numberWithCommas(this.wave)}`
                }) +
                '</span><br><br>' +
                this.getGolbinRaidHistory(this.history.length - 1),
            imageUrl: assets.getURI("assets/media/skills/combat/combat.png" /* Assets.Combat */ ),
            imageWidth: 64,
            imageHeight: 64,
            imageAlt: getLangString('PAGE_NAME_Combat'),
        });
        this.state = RaidState.Unstarted;
        this.resumeGame();
        this.renderStartMenu();
        return true;
    }
    skipWave() {
        if (this.game.raidCoins.canAfford(this.waveSkipCost)) {
            this.game.raidCoins.remove(this.waveSkipCost);
            this.endFight();
            if (this.spawnTimer.isActive)
                this.spawnTimer.stop();
            if (this.enemy.state !== EnemyState.Dead)
                this.enemy.processDeath();
            this.waveProgress = this.waveLength;
            this.loadNextEnemy();
        }
    }
    recordRaidHistory() {
        if (this.history.length >= 5)
            this.history.splice(0, 1);
        const timestamp = this.endTimestamp - this.startTimestamp;
        const newHistory = {
            skillLevels: this.player.getLevelHistory(),
            equipment: this.player.getEquipmentHistory(),
            ammo: this.player.equipment.getQuantityInSlot("melvorD:Quiver" /* EquipmentSlotIDs.Quiver */ ),
            inventory: this.bank.getHistory(),
            food: {
                item: this.player.food.currentSlot.item,
                quantity: this.player.food.currentSlot.quantity,
            },
            wave: this.wave + 1,
            kills: this.killCount,
            timestamp: timestamp,
            raidCoinsEarned: this.coinsEarned,
            difficulty: this._setDifficulty,
        };
        this.history.push(newHistory);
        this.game.stats.GolbinRaid.add(RaidStats.TotalTimeSpent, timestamp);
        this.game.stats.GolbinRaid.set(RaidStats.LongestRaid, Math.max(this.game.stats.GolbinRaid.get(RaidStats.LongestRaid), timestamp));
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.computeItemSelection();
    }
    computeItemSelection() {
        this.game.items.forEach((item) => {
            if (!this.bannedItems.has(item) &&
                item.namespace !== "melvorAprilFools2024" /* Namespaces.AprilFools2024 */ &&
                item.namespace !== "melvorItA" /* Namespaces.IntoTheAbyss */ ) {
                const selection = item.golbinRaidExclusive ? this.exclusiveItemSelection : this.itemSelection;
                if (item instanceof EquipmentItem && !item.fitsInSlot("melvorD:Summon1" /* EquipmentSlotIDs.Summon1 */ )) {
                    const levelReqs = item.equipRequirements.filter((req) => req.type === 'SkillLevel' || req.type === 'AllSkillLevels');
                    const maxLevel = Math.max(...levelReqs.map((level) => level.level));
                    const waveBracket = this.itemLevelBrackets.findIndex((levelReq) => maxLevel < levelReq);
                    if (item instanceof WeaponItem)
                        selection.weapons[waveBracket].push(item);
                    else if (item.fitsInSlot("melvorD:Quiver" /* EquipmentSlotIDs.Quiver */ ))
                        selection.ammo[waveBracket].push(item);
                    else
                        selection.armour[waveBracket].push(item);
                    if (item.specialAttacks.length > 0)
                        this.specialAttackSelection.push(...item.specialAttacks);
                    if (item.fitsInSlot("melvorD:Passive" /* EquipmentSlotIDs.Passive */ ) && !this.bannedPassiveItems.has(item))
                        selection.passives[0].push(item);
                } else if (item.type === 'Rune') {
                    selection.runes[0].push(item);
                } else if (item instanceof FoodItem) {
                    selection.food[0].push(item);
                }
            }
        });
    }
    getItemSelection(category) {
        const selection = [];
        const categoryBrackets = this.itemSelection[category];
        const exclusiveBrackets = this.exclusiveItemSelection[category];
        for (let i = 0; i <= this.waveBracket; i++) {
            selection.push(...categoryBrackets[i]);
            exclusiveBrackets[i].forEach((item) => {
                if (this.ownedCrateItems.has(item))
                    selection.push(item);
            });
        }
        return selection;
    }
    getCategoryQuantity(category) {
        switch (category) {
            case 'ammo':
                return (Math.floor(Math.random() * applyModifier(this.wave * 25, this.player.modifiers.golbinRaidMaximumAmmo)) + 1);
            case 'food':
                return Math.floor(Math.random() * this.wave * 11) + this.wave + this.player.modifiers.golbinRaidMinimumFood;
            case 'runes':
                return (Math.floor(Math.random() * applyModifier(this.wave * 25, this.player.modifiers.golbinRaidMaximumRunes)) + 10);
            default:
                return 1;
        }
    }
    getItemChoices(category, count) {
        const itemSelection = this.getItemSelection(category);
        const rolledItems = [];
        const inSelection = new Set();
        while (rolledItems.length < count) {
            const item = getRandomArrayElement(itemSelection);
            if (inSelection.has(item))
                continue; // Item is already in random selection, reroll it
            if (item instanceof EquipmentItem && this.player.equipment.checkForItem(item))
                continue; // Player has item equipped, reroll it
            const isAlt = item instanceof EquipmentItem &&
                item.specialAttacks.length > 0 &&
                (rollPercentage(25) || item.id === "melvorD:Mystery_Wand" /* ItemIDs.Mystery_Wand */ );
            rolledItems.push({
                item,
                quantity: this.getCategoryQuantity(category),
                isAlt,
            });
        }
        return rolledItems;
    }
    createNewEnemy() {
        this.enemy.setNewMonster(this.enemy.getMonster(this.wave, this.fightingBoss, this.difficulty.hasSecondPassiveChange, this.game));
    }
    onEnemyDeath() {
        const stopCombat = super.onEnemyDeath();
        this.waveProgress++;
        this.killCount++;
        this.renderQueue.location = true;
        this.game.stats.GolbinRaid.inc(RaidStats.GolbinsKilled);
        return stopCombat;
    }
    loadNextEnemy() {
        if (this.waveProgress === this.waveLength) {
            this.wave++;
            this.game.stats.GolbinRaid.inc(RaidStats.WavesCompleted);
            this.waveProgress = 0;
            if (this.player.isPrayerUnlocked)
                this.player.addPrayerPoints(this.player.prayerPointsOnWaveCompletion);
            if (this.wave % 10 == 0 && this.difficulty.positiveModifierCount > 0) {
                this.state = RaidState.SelectingModifiersWave;
                this.resetModsSelected();
                this.render();
                this.continueModifierSelection();
            } else {
                this.state = RaidState.SelectingCategory;
                this.render();
                this.fireCategorySelectModal();
            }
        } else {
            this.state = RaidState.FightingWave;
            super.loadNextEnemy();
        }
    }
    fireCategorySelectModal() {
        let html = `<small>${getLangString('GOLBIN_RAID_POPUP_1')}</small><br>
		<small class="text-danger">${getLangString('GOLBIN_RAID_POPUP_2')}</small><br>
		<small>${templateString(getLangString('GOLBIN_RAID_POPUP_3'), {
            num: `${this.itemLevelBrackets[this.waveBracket] - 1}`,
        })}</small><br>
		<button class="btn btn-outline-success m-2" onClick="game.golbinRaid.showEquipmentSelectionModal('weapons');" style="width: 80%;">
			<img class="skill-icon-xs mr-2" src="${assets.getURI("assets/media/bank/weapon_scimitar_dragon.png" /* Assets.DragonScimitar */)}">${getLangString('GOLBIN_RAID_POPUP_4')}
		</button><br>
		<button class="btn btn-outline-success m-2" onClick="game.golbinRaid.showEquipmentSelectionModal('armour');" style="width: 80%;">
			<img class="skill-icon-xs mr-2" src="${assets.getURI("assets/media/bank/armour_helmet_adamant.png" /* Assets.AdamantHelmet */)}">${getLangString('GOLBIN_RAID_POPUP_5')}
		</button><br>
		<button class="btn btn-outline-success m-2" onClick="game.golbinRaid.showEquipmentSelectionModal('ammo');" style="width: 80%;">
			<img class="skill-icon-xs mr-2" src="${assets.getURI("assets/media/bank/ammo_arrow_rune.png" /* Assets.RuneArrows */)}">${getLangString('GOLBIN_RAID_POPUP_6')}
		</button><br>
		<button class="btn btn-outline-success m-2" onClick="game.golbinRaid.showEquipmentSelectionModal('runes');" style="width: 80%;">
			<img class="skill-icon-xs mr-2" src="${assets.getURI("assets/media/bank/rune_fire.png" /* Assets.FireRune */)}">${getLangString('GOLBIN_RAID_POPUP_7')}
		</button><br>
		<button class="btn btn-outline-success m-2" onClick="game.golbinRaid.showEquipmentSelectionModal('food');" style="width: 80%;">
			<img class="skill-icon-xs mr-2" src="${assets.getURI("assets/media/bank/whale_cooked.png" /* Assets.Whale */)}">${getLangString('GOLBIN_RAID_POPUP_8')}
		</button>`;
        if (this.player.modifiers.golbinRaidPassiveSlotUnlocked > 0 && this.wave >= 5 && this.wave % 5 === 0)
            html += `<br>
		<button class="btn btn-outline-warning m-2" onClick="game.golbinRaid.rerollPassiveCallback();" style="width: 80%;">
			<img class="skill-icon-xs mr-2" src="${assets.getURI("assets/media/bank/guardian_amulet.png" /* Assets.GuardianAmulet */)}">${getLangString('GOLBIN_RAID_POPUP_17')}
		</button>`;
        html += `<button class="btn btn-danger m-2 w-80" onClick="game.golbinRaid.closeModalAndPause();">${getLangString('GOLBIN_RAID_PAUSE_RAID')}</button><br>`;
        SwalLocale.fire({
            title: getLangString('GOLBIN_RAID_POPUP_0'),
            html: html,
            imageUrl: assets.getURI("assets/media/pets/golden_golbin.png" /* Assets.GolbinRaid */ ),
            imageWidth: 64,
            imageHeight: 64,
            imageAlt: getLangString('PAGE_NAME_GolbinRaid'),
            allowOutsideClick: false,
            showConfirmButton: false,
            allowEscapeKey: false,
        });
    }
    closeModalAndPause() {
        Swal.close();
        this.pause();
    }
    continueRaid() {
        this.itemsBeingSelected[this.itemCategoryBeingSelected] = [];
        this.computeAllStats();
        this.updateSkipCost();
        this.loadNextEnemy();
    }
    addRunesCallback(item, quantity) {
        this.bank.addItem(item, quantity, false, false, true, false);
        this.continueRaid();
        Swal.close();
    }
    addFoodCallback(item, quantity) {
        this.player.equipFood(item, quantity);
        this.continueRaid();
        Swal.close();
    }
    /** Callback function for equipping items
     *  @param item The ItemID to equip
     *  @param quantity The amount of the item to equip
     *  @param isAlt Whether to roll new random special attacks for the weapon
     */
    equipItemCallback(item, quantity, isAlt) {
        const attacks = [];
        if (isAlt) {
            attacks.push(getRandomArrayElement(this.specialAttackSelection));
            if (item.id === "melvorD:Mystery_Wand" /* ItemIDs.Mystery_Wand */ ) {
                attacks.push(getRandomArrayElement(this.specialAttackSelection));
            }
        }
        this.player.equipItem(item, this.player.selectedEquipmentSet, undefined, quantity, attacks);
        this.continueRaid();
        Swal.close();
    }
    rerollPassiveCallback() {
        const newPassive = this.getItemChoices('passives', 1)[0];
        this.player.equipItem(newPassive.item, this.player.selectedEquipmentSet, this.game.equipmentSlots.getObjectByID("melvorD:Passive" /* EquipmentSlotIDs.Passive */ ));
        this.continueRaid();
        Swal.close();
    }
    addExistingRunesCallback(quantity) {
        this.bank.addQuantityToExistingItems(quantity);
        this.continueRaid();
        Swal.close();
    }
    spawnEnemy() {
        super.spawnEnemy();
        if (this.waveProgress === 0)
            this.player.heal(numberMultiplier);
        this.startFight();
    }
    selectNothingCallback() {
        this.continueRaid();
        Swal.close();
    }
    showEquipmentSelectionModal(category) {
        this.state = RaidState.SelectingItem;
        this.setEquipmentSelection(category);
        this.fireItemSelectModal();
    }
    /** Sets the state data for a selection of equipment */
    setEquipmentSelection(category) {
        this.itemCategoryBeingSelected = category;
        switch (category) {
            case 'weapons':
                this.itemsBeingSelected.weapons = this.getItemChoices(category, 3);
                break;
            case 'armour':
                this.itemsBeingSelected.armour = this.getItemChoices(category, 4);
                break;
            case 'ammo':
                this.itemsBeingSelected.ammo = this.getItemChoices(category, 2);
                this.itemsBeingSelected.ammo.push({
                    item: this.game.emptyEquipmentItem,
                    quantity: this.getCategoryQuantity(category),
                    isAlt: false,
                });
                break;
            case 'runes':
                this.itemsBeingSelected.runes = this.getItemChoices(category, 2);
                this.itemsBeingSelected.runes.push({
                    item: this.game.emptyEquipmentItem,
                    quantity: this.getCategoryQuantity(category),
                    isAlt: false,
                });
                break;
            case 'food':
                this.itemsBeingSelected.food = this.getItemChoices(category, 3);
                break;
        }
    }
    /** Fires the equipment selection modal for the current state data */
    fireItemSelectModal() {
        const category = this.itemCategoryBeingSelected;
        const modalBody = createElement('div');
        switch (category) {
            case 'weapons':
                modalBody.append(...this.getEquipmentSelectionNodes(this.itemsBeingSelected.weapons));
                break;
            case 'armour':
                modalBody.append(...this.getEquipmentSelectionNodes(this.itemsBeingSelected.armour));
                break;
            case 'ammo':
                modalBody.append(createElement('small', {
                    text: getLangString('GOLBIN_RAID_POPUP_16')
                }), createElement('br'));
                modalBody.append(...this.getEquipmentSelectionNodes(this.itemsBeingSelected.ammo));
                break;
            case 'runes':
                modalBody.append(...this.getRuneSelectionNodes(this.itemsBeingSelected.runes));
                break;
            case 'food':
                modalBody.append(createElement('small', {
                    text: getLangString('GOLBIN_RAID_POPUP_15')
                }), createElement('br'));
                modalBody.append(...this.getFoodSelectionNodes(this.itemsBeingSelected.food));
                break;
        }
        const selectNothingButton = createElement('button', {
            className: 'btn btn-outline-danger m-2 w-80',
            text: getLangString('GOLBIN_RAID_POPUP_9'),
        });
        selectNothingButton.onclick = () => this.selectNothingCallback();
        const pauseButton = createElement('button', {
            className: 'btn btn-danger m-2 w-80',
            text: getLangString('GOLBIN_RAID_PAUSE_RAID'),
        });
        pauseButton.onclick = () => this.closeModalAndPause();
        modalBody.append(selectNothingButton, createElement('br'), pauseButton, createElement('br'));
        SwalLocale.fire({
            title: getLangString('MISC_STRING_29'),
            html: modalBody,
            imageUrl: assets.getURI("assets/media/pets/golden_golbin.png" /* Assets.GolbinRaid */ ),
            imageWidth: 64,
            imageHeight: 64,
            imageAlt: getLangString('PAGE_NAME_GolbinRaid'),
            allowOutsideClick: false,
            showConfirmButton: false,
            allowEscapeKey: false,
        });
    }
    getEquipmentSelectionNodes(selection) {
        const nodes = [];
        selection.forEach(({
            item,
            quantity,
            isAlt
        }) => {
            if (item === this.game.emptyEquipmentItem) {
                const existingQuiverItem = this.player.equipment.getItemInSlot("melvorD:Quiver" /* EquipmentSlotIDs.Quiver */ );
                if (existingQuiverItem !== this.game.emptyEquipmentItem) {
                    const equipExistingAmmo = createElement('button', {
                        className: 'btn btn-outline-success m-2 w-80',
                        text: templateLangString('GOLBIN_RAID_POPUP_13', {
                            num: `${quantity}`
                        }),
                    });
                    equipExistingAmmo.onclick = () => this.equipItemCallback(existingQuiverItem, quantity, false);
                    nodes.push(equipExistingAmmo, createElement('br'));
                }
                return;
            }
            const equipButton = createElement('button', {
                className: 'btn btn-outline-success w-80'
            });
            equipButton.append(createElement('img', {
                className: 'skill-icon-xs mr-2',
                attributes: [
                    ['src', item.media]
                ]
            }));
            if (isAlt) {
                equipButton.append(`${quantity} x `, createElement('span', {
                    className: 'text-warning',
                    text: `(ALT) ${item.name}`
                })); // TODO_L: Localize ALT
            } else {
                equipButton.append(`${quantity} x ${item.name}`);
            }
            equipButton.onclick = () => this.equipItemCallback(item, quantity, isAlt);
            const viewStatsButton = createElement('button', {
                className: 'btn btn-outline-warning'
            });
            viewStatsButton.style.width = '15%';
            viewStatsButton.onclick = () => viewItemStats(item, this.player.equipment);
            viewStatsButton.append(createElement('img', {
                className: 'skill-icon-xs m-1',
                attributes: [
                    ['src', assets.getURI('assets/media/main/statistics_header.png')]
                ],
            }));
            nodes.push(createElement('div', {
                className: 'btn-group m-2 w-80',
                attributes: [
                    ['role', 'group'],
                    ['aria-label', 'Horizontal Primary'],
                ],
                children: [equipButton, viewStatsButton],
            }), createElement('br'));
            const replacedItem = this.player.equipment.getItemInSlot(item.validSlots[0].id);
            let replaceName = getLangString('GOLBIN_RAID_POPUP_9');
            if (!(replacedItem === this.game.emptyEquipmentItem))
                replaceName = replacedItem.name;
            nodes.push(createElement('small', {
                text: `${getLangString('GOLBIN_RAID_POPUP_10')} ${replaceName}`
            }), createElement('br'));
            const allReplaced = this.player.equipment.getItemsAddedOnEquip(item);
            allReplaced.forEach(({
                item
            }) => {
                if (item !== replacedItem) {
                    nodes.push(createElement('small', {
                        text: `${getLangString('GOLBIN_RAID_POPUP_11')} ${item.name}`
                    }), createElement('br'));
                }
            });
        });
        return nodes;
    }
    getRuneSelectionNodes(selection) {
        const nodes = [];
        selection.forEach(({
            item,
            quantity
        }) => {
            const addRunesButton = createElement('button', {
                className: 'btn btn-outline-success m-2 w-80'
            });
            if (item === this.game.emptyEquipmentItem) {
                addRunesButton.onclick = () => this.addExistingRunesCallback(quantity);
                addRunesButton.append(templateLangString('GOLBIN_RAID_POPUP_14', {
                    num: `${quantity}`
                }));
            } else {
                addRunesButton.onclick = () => this.addRunesCallback(item, quantity);
                addRunesButton.append(createElement('img', {
                    className: 'skill-icon-xs mr-2',
                    attributes: [
                        ['src', item.media]
                    ]
                }), `${quantity} x ${item.name}`);
            }
            nodes.push(addRunesButton, createElement('br'));
        });
        return nodes;
    }
    getFoodSelectionNodes(selection) {
        const nodes = [];
        selection.forEach(({
            item,
            quantity
        }) => {
            const addFoodButton = createElement('button', {
                className: 'btn btn-outline-success m-2 w-80'
            });
            addFoodButton.onclick = () => this.addFoodCallback(item, quantity);
            addFoodButton.append(createElement('img', {
                className: 'skill-icon-xs mr-2',
                attributes: [
                    ['src', item.media]
                ]
            }), `${quantity} x ${item.name} (+${this.player.getFoodHealing(item)} ${getLangString('MENU_TEXT_HP')})`);
            nodes.push(addFoodButton, createElement('br'));
            if (this.player.food.currentSlot.item !== item) {
                const itemName = this.player.food.currentSlot.item === this.game.emptyFoodItem ?
                    getLangString('GOLBIN_RAID_POPUP_9') :
                    this.player.food.currentSlot.item.name;
                nodes.push(createElement('small', {
                    text: `${getLangString('GOLBIN_RAID_POPUP_12')} ${itemName}`,
                }));
            } else {
                nodes.push(createElement('small', {
                    text: getLangString('GOLBIN_RAID_POPUP_18')
                }));
            }
            nodes.push(createElement('br'));
        });
        return nodes;
    }
    renderLocation() {
        const floorText = ` ${templateString(getLangString('GOLBIN_RAID_WAVE'), { num1: `${this.wave + 1}` })}`;
        const countText = ` ${templateString(getLangString('GOLBIN_RAID_PROGRESS'), {
            qty1: `${this.waveProgress + 1}`,
            qty2: `${this.waveLength}`,
        })}`;
        const effectText = '';
        const areaName = getLangString('GOLBIN_RAID_AREA_NAME');
        const areaMedia = assets.getURI("assets/media/pets/golden_golbin.png" /* Assets.GolbinRaid */ );
        combatMenus.locationElements.name.textContent = areaName;
        combatMenus.locationElements.floorCount.textContent = floorText;
        combatMenus.locationElements.count.textContent = countText;
        combatMenus.locationElements.areaEffect.textContent = effectText;
        combatMenus.locationElements.image.src = areaMedia;
        this.renderQueue.location = false;
    }
    renderStartMenu() {
        if (this.isPaused) {
            hideElement(document.getElementById('raid-start-button'));
            showElement(document.getElementById('raid-continue-button'));
        } else {
            showElement(document.getElementById('raid-start-button'));
            hideElement(document.getElementById('raid-continue-button'));
        }
        this.renderDifficulty();
    }
    addMonsterStat(statID, amount = 1) {
        // Do not track any monster stats
    }
    addCombatStat(statID, amount = 1) {
        // Do not track any combat stats
    }
    addCurrency(currency, baseAmount, source, modifier) {
        // Do not add currencies
    }
    setDefaultEquipment() {
        this.player.setEquipmentToDefault();
        this.bank.empty();
        this.startingRunes.forEach(({
            item,
            quantity
        }) => {
            this.bank.addItem(item, quantity + this.player.modifiers.golbinRaidStartingRuneCount, false, false, true, false);
        });
    }
    changeDifficulty(newDifficulty) {
        this.selectedDifficulty = newDifficulty;
        this.renderDifficulty();
    }
    renderDifficulty() {
        const diffToSet = this.isPaused ? this._setDifficulty : this.selectedDifficulty;
        Object.values(RaidManager.difficulties).forEach((data, i) => {
            const btn = document.getElementById(`raid-difficulty-btn-${i}`);
            if (i === diffToSet) {
                btn.classList.add(data.selectedClass);
                btn.classList.remove(data.unselectedClass);
            } else {
                btn.classList.remove(data.selectedClass);
                btn.classList.add(data.unselectedClass);
            }
            btn.disabled = this.isPaused;
        });
        const diffText = document.getElementById('raid-difficulty-text');
        const newDiffText = new DocumentFragment();
        const diffData = RaidManager.difficulties[diffToSet];
        newDiffText.append(createElement('li', {
            text: getLangString(`GOLBIN_RAID_TRIANGLE_${diffData.combatTriangle}`)
        }), createElement('li', {
            text: templateLangString('GOLBIN_RAID_COIN_MODIFIER', {
                mult: formatFixed(diffData.coinMultiplier, 1)
            }),
        }), createElement('li', {
            text: templateLangString('GOLBIN_RAID_HP_MODIFIER', {
                mult: formatFixed(1 + diffData.enemyHPModifier / 100, 2),
            }),
        }));
        if (diffData.positiveModifierCount > 0) {
            newDiffText.append(createElement('li', {
                text: templateLangString('GOLBIN_RAID_MODIFIER_CHOICE', {
                    posCount: `${diffData.positiveModifierCount}`,
                    negCount: `${diffData.negativeModifierCount}`,
                    waveCount: '10',
                }),
            }));
        }
        if (diffData.enemyAccuracyModifier > 0) {
            newDiffText.append(createElement('li', {
                text: templateLangString('GOLBIN_RAID_STAT_MODIFIER', {
                    mult: formatFixed(1 + diffData.enemyAccuracyModifier / 100, 1),
                }),
            }));
        }
        if (diffData.hasSecondPassiveChange) {
            newDiffText.append(createElement('li', {
                text: getLangString('GOLBIN_RAID_SECOND_PASSIVE')
            }));
        }
        diffText.textContent = '';
        diffText.append(newDiffText);
    }
    rollForCrateItem() {
        if (this.crateItems.length === this.ownedCrateItems.size)
            throw new Error('All Golbin Crate Items already ownded');
        // Compute the total weight of remaining crate items
        const totalWeight = this.crateItems.reduce((sum, item) => {
            if (this.ownedCrateItems.has(item.item))
                return sum;
            return sum + item.weight;
        }, 0);
        // Roll for the random item
        const crateRoll = Math.floor(Math.random() * totalWeight);
        let cumWeight = 0;
        const itemRolled = this.crateItems.find((item) => {
            if (this.ownedCrateItems.has(item.item))
                return false;
            cumWeight += item.weight;
            return crateRoll < cumWeight;
        });
        if (itemRolled === undefined)
            throw new Error('Error rolling crate item, could not find item.');
        return itemRolled;
    }
    openGolbinCrate() {
        const item = this.rollForCrateItem();
        this.fireCrateModal(item);
        this.ownedCrateItems.add(item.item);
    }
    fireCrateModal(crateItem) {
        const modalBody = createElement('div', {
            className: 'media d-flex align-items-center flex-column'
        });
        modalBody.style.overflow = 'clip';
        const animationCont = createElement('div', {
            className: 'lootBoxAnimationCont'
        });
        const crateCont = createElement('div', {
            className: 'crateContainer'
        });
        const corner0 = createElement('img', {
            className: 'crateCorner crateCorner0',
            attributes: [
                ['src', assets.getURI('assets/media/shop/golbin_crate.png')]
            ],
        });
        crateCont.append(corner0, createElement('img', {
            className: 'crateCorner crateCorner1',
            attributes: [
                ['src', assets.getURI('assets/media/shop/golbin_crate.png')]
            ],
        }), createElement('img', {
            className: 'crateCorner crateCorner2',
            attributes: [
                ['src', assets.getURI('assets/media/shop/golbin_crate.png')]
            ],
        }), createElement('img', {
            className: 'crateCorner crateCorner3',
            attributes: [
                ['src', assets.getURI('assets/media/shop/golbin_crate.png')]
            ],
        }));
        const openCont = createElement('div', {
            className: `lootboxOpenCont lootbox${CrateRarity[crateItem.weight]}`,
        });
        const rayCont = createElement('div');
        rayCont.append(createElement('div', {
            className: 'lootboxRay0'
        }), createElement('div', {
            className: 'lootboxRay1'
        }));
        openCont.append(rayCont, createElement('img', {
            className: 'lootboxImg',
            attributes: [
                ['src', crateItem.item.media]
            ]
        }), createElement('span', {
            className: 'lootboxTextTop',
            text: getLangString(`GOLBIN_RAID_${CrateRarity[crateItem.weight]}`),
        }), createElement('span', {
            className: 'lootboxTextBot',
            text: crateItem.item.name
        }));
        animationCont.append(openCont, crateCont);
        modalBody.append(animationCont);
        const item = crateItem.item;
        if (item instanceof EquipmentItem) {
            const viewStatsButton = createElement('button', {
                className: 'btn btn-info invisible mt-2',
                text: getLangString('MENU_TEXT_VIEW_STATS'),
            });
            viewStatsButton.onclick = () => viewItemStats(item, false);
            corner0.onanimationend = () => {
                viewStatsButton.classList.remove('invisible');
            };
            modalBody.append(viewStatsButton);
        }
        addModalToQueue({
            title: getLangString('GOLBIN_RAID_OPENING_CRATE'),
            html: modalBody,
            allowOutsideClick: false,
            showConfirmButton: true,
        });
    }
    /** Sets the random modifier selection state */
    setRandomModifierSelection(isPositive, amount = 3) {
        const randomSelection = getExclusiveRandomArrayElements(this.possibleModifiers, amount);
        this.randomModifiersBeingSelected = [];
        randomSelection.forEach((randomSelection) => {
            const modValue = randomSelection.clone();
            modValue.value *= rollInteger(1, 5);
            this.randomModifiersBeingSelected.push(modValue);
        });
        this.isSelectingPositiveModifier = isPositive;
    }
    fireRandomModifierSelection() {
        const modalBody = createElement('div', {
            className: 'media d-flex align-items-center flex-column'
        });
        let posHead = getLangString('GOLBIN_RAID_GIVES_YOU');
        let negHead = getLangString('GOLBIN_RAID_GIVES_GOLBINS');
        let buttonStyle = 'btn-outline-success';
        if (!this.isSelectingPositiveModifier) {
            posHead = getLangString('GOLBIN_RAID_GIVES_GOLBINS');
            negHead = getLangString('GOLBIN_RAID_GIVES_YOU');
            buttonStyle = 'btn-outline-danger';
        }
        this.randomModifiersBeingSelected.forEach((selection, idx) => {
            const selectionButton = createElement('button', {
                className: `btn ${buttonStyle} m-2 w-80`
            });
            selectionButton.append(createElement('span', {
                text: selection.isNegative ? negHead : posHead
            }), createElement('br'), createElement('span', {
                text: selection.print().text
            }));
            selectionButton.onclick = () => this.selectRandomModifier(idx);
            modalBody.append(selectionButton);
        });
        const pauseButton = createElement('button', {
            text: getLangString('GOLBIN_RAID_PAUSE_RAID'),
            className: 'btn btn-danger m-2 w-80',
        });
        pauseButton.onclick = () => this.closeModalAndPause();
        modalBody.append(pauseButton);
        SwalLocale.fire({
            title: getLangString(`GOLBIN_RAID_SELECT_${this.isSelectingPositiveModifier ? 'POSITIVE' : 'NEGATIVE'}_MOD`),
            html: modalBody,
            allowOutsideClick: false,
            showConfirmButton: false,
            allowEscapeKey: false,
        });
    }
    fireViewModifiersModal() {
        const modalBody = createElement('div', {
            className: 'media d-flex align-items-center flex-column'
        });
        const playerMods = new ModifierTable();
        playerMods.addModifiers(this.randomModifierSource, this.randomPlayerModifiers);
        const golbinMods = new ModifierTable();
        golbinMods.addModifiers(this.randomModifierSource, this.randomEnemyModifiers);
        const formatter = getElementDescriptionFormatter('h5', 'font-w400 font-size-sm m-1', false);
        modalBody.append(createElement('h5', {
            text: getLangString('GOLBIN_RAID_GIVES_YOU'),
            className: 'mb-1',
        }), ...playerMods.getActiveModifierDescriptions().map(formatter));
        modalBody.append(createElement('h5', {
            text: getLangString('GOLBIN_RAID_GIVES_GOLBINS'),
            className: 'mb-1',
        }), ...golbinMods.getActiveModifierDescriptions().map(formatter));
        SwalLocale.fire({
            title: getLangString('GOLBIN_RAID_ALL_MODIFIERS'),
            html: modalBody,
        });
    }
    selectRandomModifier(index) {
        const selection = this.randomModifiersBeingSelected[index];
        if (selection === undefined)
            throw new Error('Invalid index selected.');
        // Logical XOR
        if (selection.isNegative !== this.isSelectingPositiveModifier) {
            // neg + enemy, pos + player
            this.randomPlayerModifiers.push(selection);
        } else {
            // neg + player, pos + enemy
            this.randomEnemyModifiers.push(selection);
        }
        if (this.isSelectingPositiveModifier)
            this.posModsSelected++;
        else
            this.negModsSelected++;
        Swal.close();
        this.continueModifierSelection();
    }
    continueModifierSelection() {
        this.randomModifiersBeingSelected = [];
        if (this.isSelectingPositiveModifier) {
            if (this.posModsSelected < this.difficulty.positiveModifierCount) {
                this.setRandomModifierSelection(true);
                this.fireRandomModifierSelection();
            } else {
                this.isSelectingPositiveModifier = false;
                this.continueModifierSelection();
            }
        } else {
            if (this.negModsSelected < this.difficulty.negativeModifierCount) {
                this.setRandomModifierSelection(false);
                this.fireRandomModifierSelection();
            } else if (this.state == RaidState.SelectingModifiersStart) {
                this.startRaid();
            } else {
                this.state = RaidState.SelectingCategory;
                this.fireCategorySelectModal();
            }
        }
    }
    encode(writer) {
        super.encode(writer);
        writer.writeModifierValues(this.randomPlayerModifiers);
        writer.writeModifierValues(this.randomEnemyModifiers);
        writer.writeUint8(this.state);
        writer.writeUint8(this._setDifficulty);
        this.bank.encode(writer);
        writer.writeUint32(this.wave);
        writer.writeUint32(this.waveProgress);
        writer.writeUint32(this.killCount);
        writer.writeFloat64(this.startTimestamp);
        writer.writeSet(this.ownedCrateItems, writeNamespaced);
        writer.writeModifierValues(this.randomModifiersBeingSelected);
        writer.writeBoolean(this.isSelectingPositiveModifier);
        const writeItemSelection = (object, writer) => {
            writer.writeNamespacedObject(object.item);
            writer.writeUint32(object.quantity);
            writer.writeBoolean(object.isAlt);
        };
        writer.writeArray(this.itemsBeingSelected.weapons, writeItemSelection);
        writer.writeArray(this.itemsBeingSelected.armour, writeItemSelection);
        writer.writeArray(this.itemsBeingSelected.ammo, writeItemSelection);
        writer.writeArray(this.itemsBeingSelected.runes, writeItemSelection);
        writer.writeArray(this.itemsBeingSelected.food, writeItemSelection);
        writer.writeArray(this.itemsBeingSelected.passives, writeItemSelection);
        writer.writeUint8(RaidItemSelectionID[this.itemCategoryBeingSelected]);
        writer.writeUint8(this.posModsSelected);
        writer.writeUint8(this.negModsSelected);
        writer.writeBoolean(this.isPaused);
        writer.writeArray(this.history, (history, writer) => {
            writer.writeArray(history.skillLevels, (level, writer) => writer.writeUint32(level));
            writer.writeArray(history.equipment, writeNamespaced);
            writer.writeUint32(history.ammo);
            writer.writeArray(history.inventory, writeItemQuantity);
            writeItemQuantity(history.food, writer);
            writer.writeUint32(history.wave);
            writer.writeUint32(history.kills);
            writer.writeFloat64(history.timestamp);
            writer.writeUint32(history.raidCoinsEarned);
            writer.writeUint8(history.difficulty);
        });
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.randomPlayerModifiers = reader.getModifierValues(this.game, version);
        this.randomEnemyModifiers = reader.getModifierValues(this.game, version);
        this.state = reader.getUint8();
        this._setDifficulty = reader.getUint8();
        this.bank.decode(reader, version);
        this.wave = reader.getUint32();
        this.waveProgress = reader.getUint32();
        this.killCount = reader.getUint32();
        if (version >= 47) {
            this.startTimestamp = reader.getFloat64();
        } else {
            reader.getUint32();
            this.startTimestamp = Date.now(); // Reset to the current time
        }
        this.ownedCrateItems = reader.getSet((reader) => {
            const item = reader.getNamespacedObject(this.game.items);
            if (typeof item !== 'string')
                return item;
            else if (item.startsWith('melvor'))
                return this.game.items.getDummyObject(item, DummyItem, this.game);
            return undefined;
        });
        this.randomModifiersBeingSelected = reader.getModifierValues(this.game, version);
        this.isSelectingPositiveModifier = reader.getBoolean();
        const getSelection = (itemRegistry) => {
            return (reader) => {
                const item = reader.getNamespacedObject(itemRegistry);
                const quantity = reader.getUint32();
                const isAlt = reader.getBoolean();
                if (typeof item === 'string')
                    return undefined;
                return {
                    item,
                    quantity,
                    isAlt,
                };
            };
        };
        this.itemsBeingSelected.weapons = reader.getArray(getSelection(this.game.items.weapons));
        this.itemsBeingSelected.armour = reader.getArray(getSelection(this.game.items.equipment));
        this.itemsBeingSelected.ammo = reader.getArray(getSelection(this.game.items.equipment));
        this.itemsBeingSelected.runes = reader.getArray(getSelection(this.game.items));
        this.itemsBeingSelected.food = reader.getArray(getSelection(this.game.items.food));
        this.itemsBeingSelected.passives = reader.getArray(getSelection(this.game.items.equipment));
        this.itemCategoryBeingSelected = RaidItemSelectionID[reader.getUint8()];
        this.posModsSelected = reader.getUint8();
        this.negModsSelected = reader.getUint8();
        this.isPaused = reader.getBoolean();
        const readFood = (reader) => {
            let item = reader.getNamespacedObject(this.game.items);
            const quantity = reader.getInt32();
            if (typeof item === 'string')
                item = this.game.emptyFoodItem;
            return {
                item,
                quantity
            };
        };
        this.history = reader.getArray((reader) => {
            return {
                skillLevels: reader.getArray((reader) => reader.getUint32()),
                equipment: reader.getArray((reader) => {
                    const equipment = reader.getNamespacedObject(this.game.items.equipment);
                    if (typeof equipment !== 'string')
                        return equipment;
                    else if (equipment.startsWith('melvor'))
                        return this.game.items.equipment.getDummyObject(equipment, DummyEquipmentItem, this.game);
                    else
                        return undefined;
                }),
                ammo: reader.getUint32(),
                inventory: reader.getArray((reader) => {
                    const item = reader.getNamespacedObject(this.game.items);
                    const quantity = reader.getInt32();
                    if (typeof item !== 'string')
                        return {
                            item,
                            quantity
                        };
                    else if (item.startsWith('melvor'))
                        return {
                            item: this.game.items.getDummyObject(item, DummyItem, this.game),
                            quantity,
                        };
                    return undefined;
                }),
                food: readFood(reader),
                wave: reader.getUint32(),
                kills: reader.getUint32(),
                timestamp: reader.getFloat64(),
                raidCoinsEarned: reader.getUint32(),
                difficulty: reader.getUint8(),
            };
        });
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        this.randomPlayerModifiers = reader.getCombatModifierArray();
        this.randomEnemyModifiers = reader.getCombatModifierArray();
        this.state = reader.getNumber();
        this._setDifficulty = reader.getNumber();
        const bankReader = reader.getVariableLengthChunk();
        for (let i = 0; i < bankReader.dataLength / 2; i++) {
            const item = this.game.getItemFromOldID(bankReader.getNumber(), idMap);
            const quantity = bankReader.getNumber();
            if (item !== undefined)
                this.bank.addItem(item, quantity, false, false, true, false);
        }
        this.wave = reader.getNumber();
        this.waveProgress = reader.getNumber();
        this.killCount = reader.getNumber();
        this.startTimestamp = reader.getNumber();
        this.ownedCrateItems = new Set();
        reader
            .getVariableLengthChunk()
            .getRawData()
            .forEach((id) => {
                if (id === 1199 /* OldItemIDs.Ultima_Godsword */ ) {
                    return;
                }
                const newID = idMap.items[id];
                let item = this.game.items.getObjectByID(newID);
                if (item === undefined)
                    item = this.game.items.getDummyObject(newID, DummyItem, this.game);
                this.ownedCrateItems.add(item);
            });
        this.randomModifiersBeingSelected = reader.getCombatModifierArray();
        this.isSelectingPositiveModifier = reader.getBool();
        const oldItemSelection = reader.getRaidSelectionArray();
        this.itemCategoryBeingSelected = RaidItemSelectionID[reader.getNumber()];
        const getSelection = (registry) => {
            const selection = [];
            oldItemSelection.forEach(({
                itemID,
                quantity,
                isAlt
            }) => {
                const item = registry.getObjectByID(idMap.items[itemID]);
                if (item !== undefined)
                    selection.push({
                        item,
                        quantity,
                        isAlt,
                    });
            });
            return selection;
        };
        switch (this.itemCategoryBeingSelected) {
            case 'weapons':
                this.itemsBeingSelected.weapons = getSelection(this.game.items.weapons);
                break;
            case 'armour':
            case 'ammo':
            case 'passives':
                this.itemsBeingSelected[this.itemCategoryBeingSelected] = getSelection(this.game.items.equipment);
                break;
            case 'food':
                this.itemsBeingSelected.food = getSelection(this.game.items.food);
                break;
            case 'runes':
                this.itemsBeingSelected.runes = getSelection(this.game.items);
                break;
        }
        this.posModsSelected = reader.getNumber();
        this.negModsSelected = reader.getNumber();
        this.isPaused = reader.getBool();
    }
    convertFromOldFormat(save, idMap) {
        if (this.player.equipmentSets.length === 0) {
            this.player.setDefaultEquipmentSets();
            this.player.setDefaultAttackStyles();
            this.player.setDefaultSpells();
        }
        if (save.golbinRaidHistory !== undefined) {
            save.golbinRaidHistory.forEach((oldHistory) => {
                const equipment = [];
                oldHistory.equipment.forEach((itemID) => {
                    const newID = idMap.items[itemID];
                    let item = this.game.emptyEquipmentItem;
                    if (itemID !== 0 && newID !== undefined)
                        item = this.game.items.getObjectByID(newID);
                    if (item === undefined)
                        item = this.game.items.equipment.getDummyObject(newID, DummyEquipmentItem, this.game);
                    if (!(item instanceof EquipmentItem))
                        return;
                    equipment.push(item);
                });
                const inventory = [];
                oldHistory.inventory.forEach(({
                    id,
                    qty
                }) => {
                    const newID = idMap.items[id];
                    let item = this.game.items.getObjectByID(newID);
                    if (item === undefined && newID !== undefined)
                        item = this.game.items.getDummyObject(newID, DummyItem, this.game);
                    if (item !== undefined)
                        inventory.push({
                            item,
                            quantity: qty,
                        });
                });
                let foodItem = this.game.items.getObjectByID(idMap.items[oldHistory.food.itemID]);
                if (oldHistory.food.itemID === 0 || foodItem === undefined)
                    foodItem = this.game.emptyFoodItem;
                const food = {
                    item: foodItem,
                    quantity: oldHistory.food.qty,
                };
                const newHistory = {
                    skillLevels: oldHistory.skillLevels,
                    equipment,
                    ammo: oldHistory.ammo,
                    inventory,
                    food,
                    wave: oldHistory.wave,
                    kills: oldHistory.kills,
                    timestamp: oldHistory.timestamp,
                    raidCoinsEarned: oldHistory.raidCoinsEarned,
                    difficulty: oldHistory.difficulty,
                };
                this.history.push(newHistory);
            });
        }
        const golbin = this.game.monsters.getObjectByID("melvorD:Golbin" /* MonsterIDs.Golbin */ );
        if (golbin !== undefined) {
            this.game.stats.Monsters.add(golbin, MonsterStats.KilledByPlayer, -this.game.stats.GolbinRaid.get(RaidStats.GolbinsKilled));
        }
    }
    getGolbinRaidHistory(historyID) {
        const history = this.history[historyID];
        let html = '';
        let raidCoinsEarned = getLangString('MENU_TEXT_QUESTION_MARKS');
        if (history.raidCoinsEarned !== undefined)
            raidCoinsEarned = formatNumber(history.raidCoinsEarned);
        html += `<div class="block-content">
          <div class="block block-rounded-double bg-combat-inner-dark text-center font-size-sm p-3">
          <span class="font-w400 text-combat-smoke">
        ${templateString(getLangString('GOLBIN_RAID_HISTORY_6'), {
            difficulty: RaidManager.difficulties[history.difficulty].name,
        })}  | 
        ${templateString(getLangString('GOLBIN_RAID_HISTORY_0'), { num: `${numberWithCommas(history.wave)}` })}  | 
        ${templateString(getLangString('GOLBIN_RAID_HISTORY_1'), { num: `${numberWithCommas(history.kills)}` })}  | 
        ${templateString(getLangString('GOLBIN_RAID_HISTORY_2'), {
            time: `${formatAsTimePeriod(history.timestamp)}`,
        })} |
        ${templateString(getLangString('GOLBIN_RAID_HISTORY_3'), { num: `${numberWithCommas(raidCoinsEarned)}` })} 
      </span><br>
          <img class="skill-icon-xs m-1" src="${assets.getURI("assets/media/skills/attack/attack.png" /* Assets.Attack */)}">${history.skillLevels[0]}
          <img class="skill-icon-xs m-1" src="${assets.getURI("assets/media/skills/strength/strength.png" /* Assets.Strength */)}">${history.skillLevels[1]}
          <img class="skill-icon-xs m-1" src="${assets.getURI("assets/media/skills/defence/defence.png" /* Assets.Defence */)}">${history.skillLevels[2]}
          <img class="skill-icon-xs m-1" src="${assets.getURI("assets/media/skills/hitpoints/hitpoints.png" /* Assets.Hitpoints */)}">${history.skillLevels[3]}
          <img class="skill-icon-xs m-1" src="${assets.getURI("assets/media/skills/ranged/ranged.png" /* Assets.Ranged */)}">${history.skillLevels[4]}
          <img class="skill-icon-xs m-1" src="${assets.getURI("assets/media/skills/magic/magic.png" /* Assets.Magic */)}">${history.skillLevels[5]}
          <br>`;
        if (history.food.item !== this.game.emptyFoodItem) {
            html += `${history.food.quantity}x <img class="skill-icon-xs m-1" src="${history.food.item.media}"><br>`;
        }
        history.equipment.forEach((item) => {
            if (item !== this.game.emptyEquipmentItem)
                html += `<img class="skill-icon-xs m-1" src="${item.media}">`;
        });
        html += `<br><span class="font-w400 text-combat-smoke">${templateString(getLangString('GOLBIN_RAID_HISTORY_4'), {
            num: `${numberWithCommas(history.ammo)}`,
        })}</span></div></div>`;
        return html;
    }
    /** Loads golbin raid history into the DOM */
    loadHistory() {
        $('#golbinraid-history').html();
        let html = '';
        for (let i = this.history.length - 1; i >= 0; i--) {
            try {
                // Attempt to read the raid history
                html += this.getGolbinRaidHistory(i);
            } catch (_a) {
                // The raid history is corrupt, cull it from the array. Since we are working through it backwards this should not break the array
                this.history.splice(i, 1);
            }
        }
        $('#golbinraid-history').html(html);
    }
}
RaidManager.difficulties = {
    0: {
        combatTriangle: 'Standard',
        coinMultiplier: 0.5,
        enemyHPModifier: -25,
        enemyAccuracyModifier: 0,
        enemyMaxHitModifier: 0,
        enemyEvasionModifier: 0,
        negativeModifierCount: 0,
        positiveModifierCount: 0,
        selectedClass: 'btn-success',
        unselectedClass: 'btn-outline-success',
        hasSecondPassiveChange: false,
        get name() {
            return getLangString('COMBAT_MISC_23');
        },
    },
    1: {
        combatTriangle: 'Standard',
        coinMultiplier: 1,
        enemyHPModifier: 0,
        enemyAccuracyModifier: 0,
        enemyMaxHitModifier: 0,
        enemyEvasionModifier: 0,
        negativeModifierCount: 1,
        positiveModifierCount: 1,
        selectedClass: 'btn-warning',
        unselectedClass: 'btn-outline-warning',
        hasSecondPassiveChange: false,
        get name() {
            return getLangString('COMBAT_MISC_96');
        },
    },
    2: {
        combatTriangle: 'Hardcore',
        coinMultiplier: 1.5,
        enemyHPModifier: 25,
        enemyAccuracyModifier: 10,
        enemyMaxHitModifier: 10,
        enemyEvasionModifier: 10,
        negativeModifierCount: 2,
        positiveModifierCount: 1,
        selectedClass: 'btn-danger',
        unselectedClass: 'btn-outline-danger',
        hasSecondPassiveChange: false,
        get name() {
            return getLangString('COMBAT_MISC_25');
        },
    },
};
var RaidItemSelectionID;
(function(RaidItemSelectionID) {
    RaidItemSelectionID[RaidItemSelectionID["weapons"] = 0] = "weapons";
    RaidItemSelectionID[RaidItemSelectionID["armour"] = 1] = "armour";
    RaidItemSelectionID[RaidItemSelectionID["ammo"] = 2] = "ammo";
    RaidItemSelectionID[RaidItemSelectionID["runes"] = 3] = "runes";
    RaidItemSelectionID[RaidItemSelectionID["food"] = 4] = "food";
    RaidItemSelectionID[RaidItemSelectionID["passives"] = 5] = "passives";
})(RaidItemSelectionID || (RaidItemSelectionID = {}));
var RaidDifficulty;
(function(RaidDifficulty) {
    RaidDifficulty[RaidDifficulty["Easy"] = 0] = "Easy";
    RaidDifficulty[RaidDifficulty["Medium"] = 1] = "Medium";
    RaidDifficulty[RaidDifficulty["Hard"] = 2] = "Hard";
})(RaidDifficulty || (RaidDifficulty = {}));
var RaidState;
(function(RaidState) {
    RaidState[RaidState["Unstarted"] = 0] = "Unstarted";
    RaidState[RaidState["SelectingModifiersStart"] = 1] = "SelectingModifiersStart";
    RaidState[RaidState["FightingWave"] = 2] = "FightingWave";
    RaidState[RaidState["SelectingCategory"] = 3] = "SelectingCategory";
    RaidState[RaidState["SelectingItem"] = 4] = "SelectingItem";
    RaidState[RaidState["SelectingModifiersWave"] = 5] = "SelectingModifiersWave";
})(RaidState || (RaidState = {}));
//# sourceMappingURL=raidManager.js.map
checkFileVersion('?12097')