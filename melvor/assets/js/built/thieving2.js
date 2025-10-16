"use strict";
class ThievingNPC extends BasicSkillRecipe {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.allowedDamageTypes = new Set();
        try {
            this._name = data.name;
            this._media = data.media;
            this.perception = data.perception;
            this.maxHit = data.maxHit;
            if (data.maxGP !== undefined) {
                // TODO_D
                console.warn('ThievingNPCData.maxGP has been deprecated. Please use currencyDrops instead');
                this.currencyDrops = [{
                    currency: game.gp,
                    quantity: data.maxGP
                }];
            } else {
                this.currencyDrops = game.getCurrencyQuantities(data.currencyDrops);
            }
            if (data.uniqueDrop !== undefined)
                this.uniqueDrop = game.items.getQuantity(data.uniqueDrop);
            this.lootTable = new DropTable(game, data.lootTable);
            if (data.allowedDamageTypeIDs !== undefined) {
                this.allowedDamageTypes = new Set(data.allowedDamageTypeIDs.map((id) => game.damageTypes.getObjectSafe(id)));
            }
        } catch (e) {
            throw new DataConstructionError(ThievingNPC.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`THIEVING_NPC_NAME_${this.localID}`);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            if (data.perception !== undefined)
                this.perception = data.perception;
            if (data.maxHit !== undefined)
                this.maxHit = data.maxHit;
            if (data.currencyDrops !== undefined) {
                this.currencyDrops = game.modifyCurrencyQuantities(this.currencyDrops, data.currencyDrops);
            }
            if (data.uniqueDrop !== undefined)
                this.uniqueDrop = game.items.getQuantity(data.uniqueDrop);
            if (data.lootTable !== undefined) {
                if (data.lootTable.remove !== undefined)
                    this.lootTable.unregisterDrops(data.lootTable.remove);
                if (data.lootTable.add !== undefined)
                    this.lootTable.registerDrops(game, data.lootTable.add);
            }
            if (data.allowedDamageTypeIDs !== undefined) {
                if (data.allowedDamageTypeIDs.remove !== undefined) {
                    data.allowedDamageTypeIDs.remove.forEach((id) => {
                        this.allowedDamageTypes.delete(game.damageTypes.getObjectSafe(id));
                    });
                }
                if (data.allowedDamageTypeIDs.add !== undefined) {
                    data.allowedDamageTypeIDs.add.forEach((id) => {
                        this.allowedDamageTypes.add(game.damageTypes.getObjectSafe(id));
                    });
                }
            }
        } catch (e) {
            throw new DataModificationError(ThievingNPC.name, e, this.id);
        }
    }
    canUseWithDamageType(damageType) {
        return this.allowedDamageTypes.size === 0 || this.allowedDamageTypes.has(damageType);
    }
}
class ThievingArea extends RealmedObject {
    constructor(namespace, data, game, thieving) {
        super(namespace, data, game);
        try {
            this._name = data.name;
            this.npcs = thieving.actions.getArrayFromIds(data.npcIDs);
            this.uniqueDrops = game.items.getQuantities(data.uniqueDrops);
            this.npcs.forEach((npc) => {
                if (npc.area !== undefined)
                    throw new Error(`NPC with id: ${npc.id} is already in an area.`);
                npc.area = this;
            });
        } catch (e) {
            throw new DataConstructionError(ThievingArea.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`THIEVING_AREA_NAME_${this.localID}`);
        }
    }
}
class ThievingRenderQueue extends GatheringSkillRenderQueue {
    constructor() {
        super(...arguments);
        this.menu = false;
        this.stopButton = false;
        /** Updates the NPC buttons based on skill level */
        this.npcUnlock = false;
        this.areaRealmVisibility = false;
    }
}
class Thieving extends GatheringSkill {
    constructor(namespace, game) {
        super(namespace, 'Thieving', game, ThievingNPC.name);
        this.stunTimer = new Timer('Skill', () => this.stunned());
        this._media = "assets/media/skills/thieving/thieving.png" /* Assets.Thieving */ ;
        this.baseInterval = 3000;
        this.baseStunInterval = 3000;
        this.itemChance = 75;
        this.baseAreaUniqueChance = 0.2;
        this.renderQueue = new ThievingRenderQueue();
        this.generalRareItems = [];
        this.barItems = [];
        this.abyssalBarItems = [];
        this.hiddenAreas = new Set();
        this.stunState = 0 /* ThievingStunState.None */ ;
        this.areas = new NamespaceRegistry(game.registeredNamespaces, ThievingArea.name);
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }
    /** Get the chance of a unique area drop with modifiers */
    get areaUniqueChance() {
        let chance = this.baseAreaUniqueChance;
        const query = this.getActionModifierQuery(this.currentNPC);
        chance += this.game.modifiers.getValue("melvorD:thievingAreaUniqueChance" /* ModifierIDs.thievingAreaUniqueChance */ , query);
        chance *= 1 + this.game.modifiers.getValue("melvorD:thievingAreaUniqueChancePercent" /* ModifierIDs.thievingAreaUniqueChancePercent */ , query) / 100;
        return chance;
    }
    get masteryAction() {
        if (this.currentNPC === undefined)
            throw new Error(`Error getting masteryAction. No NPC is selected.`);
        return this.currentNPC;
    }
    get actionLevel() {
        if (this.currentNPC === undefined)
            return 0;
        return this.currentNPC.level;
    }
    get canStop() {
        // Override to prevent skill stopping while stunned
        let canStop = super.canStop;
        if (canStop && this.isStunned) {
            this.notifyStunBlockingAction();
            canStop = false;
        }
        return canStop;
    }
    get stunAvoidanceChance() {
        return this.game.modifiers.getValue("melvorD:thievingStunAvoidanceChance" /* ModifierIDs.thievingStunAvoidanceChance */ , this.getActionModifierQuery(this.currentNPC));
    }
    get stunInterval() {
        return this.getStunInterval(this.currentNPC);
    }
    registerData(namespace, data) {
        var _a, _b, _c;
        (_a = data.npcs) === null || _a === void 0 ? void 0 : _a.forEach((npc) => {
            this.actions.registerObject(new ThievingNPC(namespace, npc, this.game));
        });
        super.registerData(namespace, data);
        (_b = data.areas) === null || _b === void 0 ? void 0 : _b.forEach((area) => {
            this.areas.registerObject(new ThievingArea(namespace, area, this.game, this));
        });
        (_c = data.generalRareItems) === null || _c === void 0 ? void 0 : _c.forEach((rareData) => {
            const generalRare = {
                item: this.getItemForRegistration(rareData.itemID),
                chance: rareData.chance,
                realms: new Set(),
            };
            if (rareData.npcs !== undefined)
                generalRare.npcs = new Set(rareData.npcs.map((id) => {
                    const npc = this.actions.getObjectByID(id);
                    if (npc === undefined)
                        throw new Error(`Error registering general rare item. NPC with id: ${id} is not registered.`);
                    return npc;
                }));
            if (rareData.realms !== undefined) {
                rareData.realms.forEach((realmID) => {
                    const realm = this.game.realms.getObjectSafe(realmID);
                    generalRare.realms.add(realm);
                });
            }
            this.generalRareItems.push(generalRare);
        });
        if (data.entLeprechaunItem !== undefined)
            this.entLeprechaunItem = this.getItemForRegistration(data.entLeprechaunItem);
        if (data.bearLeprechaunItem !== undefined)
            this.bearLeprechaunItem = this.getItemForRegistration(data.bearLeprechaunItem);
        if (data.easterEgg !== undefined) {
            const equipped = this.getItemForRegistration(data.easterEgg.equippedID);
            if (!(equipped instanceof EquipmentItem))
                throw new Error(`Error registering easter egg. ${data.easterEgg.equippedID} is not equipment. Blame Coolrox.`);
            this.easterEgg = {
                equipped,
                positioned: this.getItemForRegistration(data.easterEgg.positionedID),
                reward: this.getItemForRegistration(data.easterEgg.rewardID),
            };
        }
    }
    isCorrectRealmForGeneralRareDrop(drop, realm) {
        return drop.realms.size === 0 || drop.realms.has(realm);
    }
    modifyData(data) {
        var _a;
        super.modifyData(data);
        (_a = data.npcs) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const npc = this.actions.getObjectByID(modData.id);
            if (npc === undefined)
                throw new UnregisteredDataModError(ThievingNPC.name, modData.id);
            npc.applyDataModification(modData, this.game);
        });
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.game.smithing.actions.forEach((recipe) => {
            if (recipe.category.id === "melvorD:Bars" /* SmithingCategoryIDs.Bars */ ) {
                this.barItems.push(recipe.product);
            }
            if (recipe.category.id === "melvorItA:AbyssalBars" /* SmithingCategoryIDs.AbyssalBars */ ) {
                this.abyssalBarItems.push(recipe.product);
            }
        });
        // Set up sorted mastery
        this.areas.forEach((area) => {
            this.sortedMasteryActions.push(...area.npcs);
        });
        // Add Milestones
        this.actions.forEach((action) => {
            if (action.abyssalLevel > 0)
                this.abyssalMilestones.push(action);
            else
                this.milestones.push(action);
        });
        this.sortMilestones();
    }
    activeTick() {
        this.stunTimer.tick();
        super.activeTick();
    }
    getErrorLog() {
        var _a, _b;
        return `${super.getErrorLog}
  Selected Area: ${(_a = this.currentArea) === null || _a === void 0 ? void 0 : _a.id}
  Selected NPC: ${(_b = this.currentNPC) === null || _b === void 0 ? void 0 : _b.id}
  Stun State: ${this.stunState}`;
    }
    onRealmChange() {
        super.onRealmChange();
        this.renderQueue.areaRealmVisibility = true;
        if (this.isActive)
            this.renderQueue.progressBar = true;
    }
    render() {
        super.render();
        this.renderMenu();
        this.renderProgressBar();
        this.renderStopButton();
        this.renderNPCUnlock();
        this.renderAreaRealmVisibility();
    }
    renderAreaRealmVisibility() {
        if (!this.renderQueue.areaRealmVisibility)
            return;
        this.areas.forEach((area) => {
            area.realm === this.currentRealm ? thievingMenu.showArea(area) : thievingMenu.hideArea(area);
        });
        this.renderQueue.areaRealmVisibility = false;
    }
    renderNPCUnlock() {
        if (!this.renderQueue.npcUnlock)
            return;
        thievingMenu.updateNPCsForLevel(this);
        this.renderQueue.npcUnlock = false;
    }
    resetActionState() {
        super.resetActionState();
        this.stunTimer.stop();
        this.currentArea = undefined;
        this.currentNPC = undefined;
        this.stunState = 0 /* ThievingStunState.None */ ;
    }
    encode(writer) {
        super.encode(writer);
        this.stunTimer.encode(writer);
        if (this.isActive && this.currentArea !== undefined && this.currentNPC !== undefined) {
            writer.writeNamespacedObject(this.currentArea);
            writer.writeNamespacedObject(this.currentNPC);
        }
        writer.writeSet(this.hiddenAreas, writeNamespaced);
        writer.writeUint8(this.stunState);
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.stunTimer.decode(reader, version);
        if (this.isActive) {
            const area = reader.getNamespacedObject(this.areas);
            if (typeof area === 'string')
                this.shouldResetAction = true;
            else
                this.currentArea = area;
            const npc = reader.getNamespacedObject(this.actions);
            if (typeof npc === 'string')
                this.shouldResetAction = true;
            else
                this.currentNPC = npc;
        }
        this.hiddenAreas = reader.getSet(readNamespacedReject(this.areas));
        this.stunState = reader.getUint8();
        if (this.shouldResetAction)
            this.resetActionState();
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        this.stunTimer.deserialize(reader.getChunk(3), version);
        const currentAreaID = reader.getNumber();
        const currentNPCID = reader.getNumber();
        const getArea = (id) => {
            return this.areas.getObjectByID(idMap.thievingAreas[id]);
        };
        const getNPC = (id) => {
            return this.actions.getObjectByID(idMap.thievingNPCs[id]);
        };
        if (this.isActive) {
            this.currentArea = getArea(currentAreaID);
            this.currentNPC = getNPC(currentNPCID);
            if (this.currentArea === undefined || this.currentNPC === undefined)
                this.shouldResetAction = true;
        }
        if (version >= 17) {
            const numHiddenAreas = reader.getNumber();
            for (let i = 0; i < numHiddenAreas; i++) {
                const area = getArea(reader.getNumber());
                if (area !== undefined)
                    this.hiddenAreas.add(area);
            }
        }
        if (this.shouldResetAction)
            this.resetActionState();
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.thievingNPCs[oldActionID];
    }
    getRegistry(type) {
        switch (type) {
            case ScopeSourceType.Category:
                return this.areas;
            case ScopeSourceType.Action:
                return this.actions;
        }
    }
    getPkgObjects(pkg, type) {
        var _a, _b;
        const skillData = (_b = (_a = pkg.data) === null || _a === void 0 ? void 0 : _a.skillData) === null || _b === void 0 ? void 0 : _b.find(({
            skillID
        }) => skillID === this.id);
        if (skillData !== undefined) {
            switch (type) {
                case ScopeSourceType.Category:
                    return skillData.areas;
                case ScopeSourceType.Action:
                    return skillData.npcs;
            }
        }
    }
    getActionModifierQueryParams(action) {
        const options = super.getActionModifierQueryParams(action);
        if (action instanceof ThievingNPC) {
            options.category = action.area;
        }
        return options;
    }
    onModifierChange() {
        super.onModifierChange();
        this.renderQueue.menu = true;
    }
    onEquipmentChange() {}
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.renderQueue.npcUnlock = true;
    }
    onLoad() {
        super.onLoad();
        this.renderQueue.menu = true;
        this.renderQueue.npcUnlock = true;
        if (this.isActive && this.currentNPC !== undefined && this.currentArea !== undefined) {
            thievingMenu.selectNPC(this.currentNPC, this.currentArea, this);
            this.renderQueue.progressBar = true;
            this.renderQueue.stopButton = true;
        }
        this.actions.forEach((npc) => {
            this.renderQueue.actionMastery.add(npc);
        });
        this.selectRealm(this.currentRealm);
        this.renderVisibleAreas();
        this.render();
    }
    onStop() {
        this.game.combat.giveFreeDeath = false;
        this.renderQueue.stopButton = true;
    }
    onAncientRelicUnlock() {
        super.onAncientRelicUnlock();
        if (this.isActive && this.currentNPC !== undefined && this.currentArea !== undefined) {
            thievingMenu.selectNPC(this.currentNPC, this.currentArea, this);
        }
    }
    stopOnDeath() {
        // Stops when player is dead
        this.stunState = 0 /* ThievingStunState.None */ ;
        this.stunTimer.stop();
        this.stop();
    }
    notifyStunBlockingAction() {
        this.game.combat.notifications.add({
            type: 'Player',
            args: [this, getLangString('TOASTS_CANNOT_WHILE_STUNNED'), 'danger'],
        });
    }
    renderMenu() {
        if (this.renderQueue.menu) {
            thievingMenu.updateAllAreaPanels(this);
            thievingMenu.updateNPCButtons(this.game);
        }
        this.renderQueue.menu = false;
    }
    renderStopButton() {
        if (this.renderQueue.stopButton) {
            if (this.isActive && this.currentArea !== undefined)
                thievingMenu.setStopButton(this, this.currentArea);
            else
                thievingMenu.removeStopButton(this);
        }
        this.renderQueue.stopButton = false;
    }
    renderProgressBar() {
        var _a;
        if (!this.renderQueue.progressBar)
            return;
        if (this.lastActiveAreaProgressBar !== undefined) {
            (_a = thievingMenu.getProgressBar(this.lastActiveAreaProgressBar)) === null || _a === void 0 ? void 0 : _a.stopAnimation();
            this.lastActiveAreaProgressBar = undefined;
        }
        if (this.currentArea === undefined)
            return;
        const progressBar = thievingMenu.getProgressBar(this.currentArea);
        if (progressBar !== undefined) {
            if (this.isActive) {
                if (this.stunState === 1 /* ThievingStunState.Stunned */ ) {
                    progressBar.setStyle('bg-danger');
                    progressBar.animateProgressFromTimer(this.stunTimer);
                } else {
                    progressBar.setStyle('bg-info');
                    progressBar.animateProgressFromTimer(this.actionTimer);
                }
                this.lastActiveAreaProgressBar = this.currentArea;
            } else {
                progressBar.stopAnimation();
                this.lastActiveAreaProgressBar = undefined;
            }
        }
        this.renderQueue.progressBar = false;
    }
    /** Updates the visibility of areas */
    renderVisibleAreas() {
        this.areas.forEach((area) => {
            if (this.hiddenAreas.has(area)) {
                thievingMenu.hideAreaPanel(area);
            } else {
                thievingMenu.showAreaPanel(area);
            }
        });
    }
    /** Callback function for when thieving area menu panel is clicked */
    onAreaHeaderClick(area) {
        if (this.hiddenAreas.has(area)) {
            this.hiddenAreas.delete(area);
            thievingMenu.showAreaPanel(area);
        } else {
            this.hiddenAreas.add(area);
            thievingMenu.hideAreaPanel(area);
        }
    }
    /** Determines what should be done when an npc is selected in an area
     * Returns true if the panel should update
     */
    onNPCPanelSelection(npc, area) {
        if (this.isActive && area === this.currentArea && npc !== this.currentNPC) {
            return this.stop();
        } else {
            return true;
        }
    }
    startThieving(area, npc) {
        if (this.isActive && !this.stop())
            return;
        this.currentArea = area;
        this.currentNPC = npc;
        if (!this.currentNPC.canUseWithDamageType(this.game.combat.player.damageType)) {
            this.notifyIncorrectDamageType(this.currentNPC);
        } else if (this.level >= this.currentNPC.level) {
            this.start();
            this.renderQueue.stopButton = true;
        }
    }
    getStunInterval(npc) {
        let interval = this.baseStunInterval;
        interval *=
            1 + this.game.modifiers.getValue("melvorD:thievingStunInterval" /* ModifierIDs.thievingStunInterval */ , this.getActionModifierQuery(npc)) / 100;
        interval = roundToTickInterval(interval);
        return Math.max(interval, 250);
    }
    getNPCSuccessRate(npc) {
        return Math.min(100, (100 * (100 + this.getStealthAgainstNPC(npc))) / (100 + npc.perception));
    }
    getNPCSleightOfHand(npc) {
        return (100 * this.getStealthAgainstNPC(npc)) / 4 / npc.perception;
    }
    getNPCPickpocket(npc) {
        return (100 + this.getStealthAgainstNPC(npc)) / 100 / npc.perception;
    }
    getStealthAgainstNPC(npc) {
        let stealth = this.level;
        stealth += this.game.modifiers.getValue("melvorD:thievingStealth" /* ModifierIDs.thievingStealth */ , this.getActionModifierQuery(npc));
        return stealth;
    }
    getStealthSources(npc) {
        const builder = new ModifierSourceBuilder(this.game.modifiers);
        builder.addBaseSource(`${templateLangString('SKILL_LEVEL', { skillName: this.name })}:`, this.level);
        builder.addSources("melvorD:thievingStealth" /* ModifierIDs.thievingStealth */ , this.getActionModifierQuery(npc));
        return builder.getSpans();
    }
    getUncappedDoublingChance(action) {
        let chance = super.getUncappedDoublingChance(action);
        if (action instanceof ThievingNPC && !this.game.currentGamemode.disableItemDoubling) {
            chance += this.getNPCSleightOfHand(action);
        }
        return chance;
    }
    _buildDoublingSources(action) {
        const builder = super._buildDoublingSources(action);
        if (action instanceof ThievingNPC && !this.game.currentGamemode.disableItemDoubling) {
            builder.addBaseSource(`${getLangString('STEALTH')}:`, this.getNPCSleightOfHand(action), true);
        }
        return builder;
    }
    getPercentageIntervalModifier(action) {
        let modifier = super.getPercentageIntervalModifier(action);
        // TODO_MR Convert to action scoped modifier
        if (action.id === "melvorF:FISHERMAN" /* ThievingNPCIDs.FISHERMAN */ )
            modifier += this.game.modifiers.summoningSynergy_Octopus_Leprechaun;
        return modifier;
    }
    _buildPercentageIntervalSources(action) {
        const builder = super._buildPercentageIntervalSources(action);
        if (action instanceof ThievingNPC && action.id === "melvorF:FISHERMAN" /* ThievingNPCIDs.FISHERMAN */ ) {
            builder.addSources("melvorD:summoningSynergy_Octopus_Leprechaun" /* ModifierIDs.summoningSynergy_Octopus_Leprechaun */ );
        }
        return builder;
    }
    /** Returns the interval an npc in ms */
    getNPCInterval(npc) {
        return this.modifyInterval(this.baseInterval, npc);
    }
    getNPCCurrencyRange(npc, currency, max) {
        let min = this.getMinCurrencyRoll(currency, max);
        min = this.modifyCurrencyReward(currency, min, npc);
        max = this.modifyCurrencyReward(currency, max, npc);
        return {
            min,
            max
        };
    }
    getMinCurrencyRoll(currency, max) {
        let maxPercent = 0;
        maxPercent += this.game.modifiers.getValue("melvorD:minThievingCurrencyGain" /* ModifierIDs.minThievingCurrencyGain */ , currency.modQuery);
        return Math.max(1, Math.floor((max * maxPercent) / 100));
    }
    modifyCurrencyReward(currency, amount, npc) {
        amount += this.game.modifiers.getValue("melvorD:flatThievingCurrencyGain" /* ModifierIDs.flatThievingCurrencyGain */ , currency.modQuery);
        return super.modifyCurrencyReward(currency, amount, npc);
    }
    /** Method for processing a stunned thieving turn */
    stunned() {
        this.stunState = 0 /* ThievingStunState.None */ ;
        this.addStat(ThievingStats.TimeSpentStunned, this.stunTimer.maxTicks * TICK_INTERVAL);
        if (this.game.settings.continueThievingOnStun)
            this.startActionTimer();
        else
            this.stop();
    }
    get isStunned() {
        return this.stunState !== 0 /* ThievingStunState.None */ ;
    }
    get actionRewards() {
        const currentNPC = this.currentNPC;
        if (currentNPC === undefined)
            throw new Error('Tried to get actionRewards, but no NPC is selected.');
        if (this.currentArea === undefined)
            throw new Error('Tried to get actionRewards, but no Area is selected.');
        const actionEvent = new ThievingActionEvent(this, currentNPC, this.currentArea);
        const rewards = new Rewards(this.game);
        rewards.setSource(`Skill.${this.id}.Pickpocket.${currentNPC.id}`);
        rewards.setActionInterval(this.actionInterval);
        if (this.stunState === 0 /* ThievingStunState.None */ ) {
            let giveItems = true;
            let giveGP = true;
            let giveAP = true;
            let quantityMultiplier = 1;
            let gpMultiplier = 1;
            let apMultiplier = 1;
            let baseQuantityBonus = 0;
            const skillXPModifier = 0;
            if (rollPercentage(this.getDoublingChance(currentNPC)))
                quantityMultiplier *= 2;
            // Devil/Lep -> 50% chance to gain +100% GP, 35% to gain 4x items, 15% chance to receive no items/gp
            if (this.game.modifiers.summoningSynergy_Abyssal_Leprechaun_Devil > 0) {
                const result = selectFromWeightedArray(Thieving.ABYSSAL_LEPRECHAUN_DEVIL_TABLE, 100).result;
                switch (result) {
                    case 0 /* AbyssalLeprechaunDevilResult.DOUBLE_AP */ :
                        apMultiplier *= 2;
                        break;
                    case 1 /* AbyssalLeprechaunDevilResult.QUAD_ITEMS */ :
                        quantityMultiplier *= 4;
                        break;
                    case 2 /* AbyssalLeprechaunDevilResult.NOTHING */ :
                        giveItems = false;
                        giveAP = false;
                        break;
                }
            } else if (this.game.modifiers.summoningSynergy_Leprechaun_Devil > 0) {
                const result = selectFromWeightedArray(Thieving.LEPRECHAUN_DEVIL_TABLE, 100).result;
                switch (result) {
                    case 0 /* LeprechaunDevilResult.DOUBLE_GP */ :
                        gpMultiplier *= 2;
                        break;
                    case 1 /* LeprechaunDevilResult.QUAD_ITEMS */ :
                        quantityMultiplier *= 4;
                        break;
                    case 2 /* LeprechaunDevilResult.NOTHING */ :
                        giveItems = false;
                        giveGP = false;
                        break;
                }
            }
            // Ent/Leprechaun -> replace GP with Bird Nest, when lumberjack
            if (this.game.modifiers.summoningSynergy_Ent_Leprechaun > 0 &&
                currentNPC.id === "melvorF:LUMBERJACK" /* ThievingNPCIDs.LUMBERJACK */ &&
                this.entLeprechaunItem !== undefined) {
                giveGP = false;
                rewards.addItem(this.entLeprechaunItem, this.game.modifiers.summoningSynergy_Ent_Leprechaun);
                this.game.stats.Thieving.add(ThievingStats.CommonDrops, this.game.modifiers.summoningSynergy_Ent_Leprechaun);
            }
            // Octo/Leprechaun -> +50% interval for fisherman, +2 base item qty for fisherman
            if (this.game.modifiers.summoningSynergy_Octopus_Leprechaun > 0 && currentNPC.id === "melvorF:FISHERMAN" /* ThievingNPCIDs.FISHERMAN */ ) {
                baseQuantityBonus += 2;
            }
            if (giveItems) {
                // Item rewards from NPC Loot Table
                if (currentNPC.lootTable.size > 0 && rollPercentage(this.itemChance)) {
                    actionEvent.commonDropObtained = true;
                    const {
                        item,
                        quantity
                    } = currentNPC.lootTable.getDrop();
                    // Abyssal Ent/Lep -> Increase base quantity of shadow drake nests when found when thieving Blighted Treant
                    if (this.game.modifiers.flatDrakeNestsFromThievingTreant > 0 &&
                        currentNPC.id === "melvorItA:BlightedTreant" /* ThievingNPCIDs.BlightedTreant */ &&
                        item.id === "melvorItA:Shadow_Drake_Nest" /* ItemIDs.Shadow_Drake_Nest */ ) {
                        baseQuantityBonus += this.game.modifiers.flatDrakeNestsFromThievingTreant;
                    }
                    // Monkey/Lep -> When gaining a common drop sell it for 1500% of its sale price
                    const autoSellMultiplier = this.game.modifiers.getValue("melvorD:thievingAutoSellPrice" /* ModifierIDs.thievingAutoSellPrice */ , item.sellsFor.currency.modQuery);
                    if (autoSellMultiplier > 0) {
                        let currencyToAdd = item.sellsFor.quantity * autoSellMultiplier;
                        currencyToAdd = this.modifyCurrencyReward(item.sellsFor.currency, currencyToAdd, currentNPC);
                        rewards.addCurrency(item.sellsFor.currency, currencyToAdd);
                    } else {
                        const qtyToAdd = (quantity + baseQuantityBonus) * quantityMultiplier +
                            this.game.modifiers.getValue("melvorD:flatAdditionalThievingCommonDropQuantity" /* ModifierIDs.flatAdditionalThievingCommonDropQuantity */ , this.getActionModifierQuery(currentNPC));
                        rewards.addItem(item, qtyToAdd);
                        this.game.stats.Thieving.add(ThievingStats.CommonDrops, qtyToAdd);
                    }
                    // Salamander/Lep -> Miner has 50% chance to give random bar when gaining an item
                    if (currentNPC.id === "melvorF:MINER" /* ThievingNPCIDs.MINER */ &&
                        this.game.modifiers.thievingMinerRandomBarChance > 0 &&
                        rollPercentage(this.game.modifiers.thievingMinerRandomBarChance)) {
                        rewards.addItem(getRandomArrayElement(this.barItems), 1);
                        this.game.stats.Thieving.inc(ThievingStats.CommonDrops);
                    }
                    // Bear/Lep -> 3% chance to gain 1 Herb sack on top of original item when thieving Bob
                    if (currentNPC.id === "melvorF:BOB_THE_FARMER" /* ThievingNPCIDs.BOB_THE_FARMER */ &&
                        this.bearLeprechaunItem !== undefined &&
                        this.game.modifiers.thievingFarmerHerbSackChance > 0 &&
                        rollPercentage(this.game.modifiers.thievingFarmerHerbSackChance)) {
                        rewards.addItem(this.bearLeprechaunItem, 1);
                        this.game.stats.Thieving.inc(ThievingStats.CommonDrops);
                    }
                    // Abyssal Lep/Salamander -> 50% chance to gain random bar when gaining a common item
                    if (this.currentArea.id === "melvorItA:WitheringRuins" /* ThievingAreaIDs.WitheringRuins */ &&
                        this.game.modifiers.randomBarThievingWitheringRuinsChance > 0 &&
                        rollPercentage(this.game.modifiers.randomBarThievingWitheringRuinsChance)) {
                        rewards.addItem(getRandomArrayElement(this.abyssalBarItems), 1);
                        this.game.stats.Thieving.inc(ThievingStats.CommonDrops);
                    }
                }
                const rareItemQty = (1 + baseQuantityBonus) * quantityMultiplier;
                // Rare drops that are in all areas
                this.generalRareItems.forEach((rareItem) => {
                    if (this.isCorrectRealmForGeneralRareDrop(rareItem, currentNPC.realm) &&
                        (rareItem.npcs === undefined || rareItem.npcs.has(currentNPC)) &&
                        rollPercentage(rareItem.chance)) {
                        rewards.addItem(rareItem.item, rareItemQty);
                        this.game.stats.Thieving.add(ThievingStats.RareDrops, rareItemQty);
                    }
                });
                // Rare drops that are from the current area
                const areaUniqueChance = this.areaUniqueChance;
                this.currentArea.uniqueDrops.forEach((drop) => {
                    if (rollPercentage(areaUniqueChance)) {
                        const qty = (drop.quantity + baseQuantityBonus) * quantityMultiplier;
                        rewards.addItem(drop.item, qty);
                        this.game.stats.Thieving.add(ThievingStats.AreaDrops, qty);
                        this.addJesterHatGP(drop.item, rewards, currentNPC);
                    }
                });
                // Rare drops that are from the current NPC
                if (currentNPC.uniqueDrop !== undefined && rollPercentage(this.getNPCPickpocket(currentNPC))) {
                    const qty = (currentNPC.uniqueDrop.quantity + baseQuantityBonus) * quantityMultiplier;
                    rewards.addItem(currentNPC.uniqueDrop.item, qty);
                    this.game.stats.Thieving.add(ThievingStats.NpcDrops, qty);
                    this.addJesterHatGP(currentNPC.uniqueDrop.item, rewards, currentNPC);
                }
            }
            if (this.easterEgg !== undefined &&
                currentNPC.id === "melvorF:LUMBERJACK" /* ThievingNPCIDs.LUMBERJACK */ &&
                this.getMasteryLevel(currentNPC) >= 99 &&
                this.getMasteryPoolProgress(this.game.defaultRealm) >= 100 &&
                this.game.combat.player.equipment.checkForItem(this.easterEgg.equipped) &&
                this.game.bank.isItemInPosition(this.easterEgg.positioned, 0, 0) &&
                rollPercentage(0.01))
                rewards.addItem(this.easterEgg.reward, 1);
            currentNPC.currencyDrops.forEach(({
                currency,
                quantity
            }) => {
                switch (currency.id) {
                    case "melvorD:GP" /* CurrencyIDs.GP */ :
                        if (!giveGP)
                            return;
                        break;
                    case "melvorItA:AbyssalPieces" /* CurrencyIDs.AbyssalPieces */ :
                        if (!giveAP)
                            return;
                        break;
                }
                const minRoll = this.getMinCurrencyRoll(currency, quantity);
                let amount = rollInteger(minRoll, quantity);
                amount = this.modifyCurrencyReward(currency, amount, currentNPC);
                switch (currency.id) {
                    case "melvorD:GP" /* CurrencyIDs.GP */ :
                        amount *= gpMultiplier;
                        break;
                    case "melvorItA:AbyssalPieces" /* CurrencyIDs.AbyssalPieces */ :
                        amount *= apMultiplier;
                        break;
                }
                if (amount > 0)
                    rewards.addCurrency(currency, amount);
            });
            const baseXP = currentNPC.baseExperience * (1 + skillXPModifier / 100);
            rewards.addXP(this, baseXP, currentNPC);
            rewards.addAbyssalXP(this, currentNPC.baseAbyssalExperience, currentNPC);
            this.addCommonRewards(rewards, currentNPC);
        } else if (this.stunState === 1 /* ThievingStunState.Stunned */ ) {
            actionEvent.successful = false;
            let damageDealt = rollInteger(1, Math.floor(currentNPC.maxHit * numberMultiplier));
            if (currentNPC.realm.id === "melvorD:Melvor" /* RealmIDs.Melvor */ )
                damageDealt *= 1 - this.game.combat.player.stats.getResistance(game.normalDamage) / 100;
            damageDealt = Math.floor(damageDealt);
            const query = this.getActionModifierQuery(currentNPC);
            if (this.game.modifiers.getValue("melvorD:ignoreThievingDamage" /* ModifierIDs.ignoreThievingDamage */ , query) > 0 ||
                rollPercentage(this.game.modifiers.getValue("melvorD:ignoreThievingDamageChance" /* ModifierIDs.ignoreThievingDamageChance */ , query))) {
                damageDealt = 0;
            }
            this.addStat(ThievingStats.DamageTakenFromNPCs, damageDealt);
            this.game.combat.player.damage(damageDealt, 'Attack', true);
            this.game.combat.notifications.add({
                type: 'Stun',
                args: [damageDealt],
            });
        } else {
            this.stunState = 0 /* ThievingStunState.None */ ;
        }
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    addJesterHatGP(item, rewards, currentNPC) {
        if (item.sellsFor.currency.id !== "melvorD:GP" /* CurrencyIDs.GP */ ||
            !this.game.combat.player.equipment.checkForItemID("melvorF:Jesters_Hat" /* ItemIDs.Jesters_Hat */ ))
            return;
        const percent = rollInteger(50, 300);
        let gpToAdd = Math.floor((item.sellsFor.quantity * percent) / 100);
        gpToAdd = this.modifyCurrencyReward(this.game.gp, gpToAdd, currentNPC);
        if (gpToAdd > 0)
            rewards.addGP(gpToAdd);
    }
    get actionInterval() {
        if (this.currentNPC === undefined)
            return 0;
        return this.getNPCInterval(this.currentNPC);
    }
    get masteryModifiedInterval() {
        return this.actionInterval;
    }
    startActionTimer() {
        // Override to prevent action timer starting when stunned
        if (!(this.stunState === 1 /* ThievingStunState.Stunned */ )) {
            super.startActionTimer();
        }
    }
    notifyIncorrectDamageType(npc) {
        const currentDamageType = this.game.combat.player.damageType;
        let html = ``;
        html += templateLangString(`THIEVING_DAMAGE_TYPE_NOTICE_0`, {
            damageType: `<img class="skill-icon-xs mr-1" src="${currentDamageType.media}"><span class="${currentDamageType.spanClass}">${currentDamageType.name}</span>`,
        });
        html += `<br><br>${getLangString(`THIEVING_DAMAGE_TYPE_NOTICE_1`)}${Array.from(npc.allowedDamageTypes).map((damageType) => {
            return `<br><img class="skill-icon-xs mr-1" src="${damageType.media}"><span class="${damageType.spanClass}">${damageType.name}</span>`;
        })}`;
        if (npc.allowedDamageTypes.size === 1 &&
            Array.from(npc.allowedDamageTypes).some((damageType) => damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ )) {
            html += `<br><br>
      <div class="bg-light rounded p-2 text-center text-info">
        <i class="fa fa-fw fa-info-circle mr-2"></i>
        <small>${getLangString(`THIEVING_DAMAGE_TYPE_NOTICE_EXTRA`)}</small>
      </div>`;
        }
        SwalLocale.fire({
            title: getLangString('THIEVING_DAMAGE_TYPE_NOTICE_TITLE'),
            html,
            imageUrl: npc.media,
            imageWidth: 64,
            imageHeight: 64,
        });
    }
    preAction() {
        if (this.currentNPC === undefined)
            throw new Error('Error during Thieving pre-action stage. No NPC is selected.');
        if (!this.currentNPC.canUseWithDamageType(this.game.combat.player.damageType) && this.isActive) {
            this.notifyIncorrectDamageType(this.currentNPC);
            this.stop();
        } else if (!rollPercentage(this.getNPCSuccessRate(this.currentNPC))) {
            if (!rollPercentage(this.stunAvoidanceChance)) {
                this.stunState = 1 /* ThievingStunState.Stunned */ ;
            } else
                this.stunState = 2 /* ThievingStunState.AvoidedStun */ ;
            this.addStat(ThievingStats.FailedPickpockets);
        } else {
            this.addStat(ThievingStats.SuccessfulPickpockets);
        }
    }
    postAction() {
        this.addStat(ThievingStats.TimeSpent, this.currentActionInterval);
        if (this.stunState === 1 /* ThievingStunState.Stunned */ ) {
            if (!this.game.currentGamemode.enableInstantActions) {
                this.stunTimer.start(this.stunInterval);
                this.renderQueue.progressBar = true;
            } else {
                this.stunState = 0 /* ThievingStunState.None */ ;
                this.stop();
            }
        }
        this.renderQueue.menu = true;
    }
    addStat(stat, amount = 1) {
        this.game.stats.Thieving.add(stat, amount);
    }
    formatSpecialDrop(item, qty = 1) {
        const found = game.stats.itemFindCount(item);
        const media = found ? item.media : assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        const name = found ? item.name : getLangString('THIEVING_UNDISCOVERED_ITEM');
        return `${formatNumber(qty)} x <img class="skill-icon-xs mr-2" src="${media}">${name}`;
    }
    fireNPCDropsModal(area, npc) {
        const sortedTable = npc.lootTable.sortedDropsArray;
        let html = '<span class="text-dark">';
        npc.currencyDrops.forEach(({
            currency,
            quantity
        }) => {
            const {
                min,
                max
            } = this.getNPCCurrencyRange(npc, currency, quantity);
            html += `<small><img class="skill-icon-xs mr-2" src="${currency.media}"> ${currency.formatAmount(`${formatNumber(min)}-${formatNumber(max)}`)}</small><br>`;
        });
        html += `${getLangString('THIEVING_POSSIBLE_COMMON')}<br><small>`;
        // Common drops for the npc
        if (sortedTable.length) {
            html += `${getLangString('THIEVING_MOST_TO_LEAST_COMMON')}<br>`;
            const totalWeight = npc.lootTable.weight;
            html += sortedTable
                .map(({
                    item,
                    weight,
                    minQuantity,
                    maxQuantity
                }) => {
                    let text = `${maxQuantity > minQuantity ? `${minQuantity}-` : ''}${maxQuantity} x <img class="skill-icon-xs mr-2" src="${item.media}">${item.name}`;
                    if (DEBUGENABLED)
                        text += ` (${((100 * weight) / totalWeight).toFixed(2)}%)`;
                    return text;
                })
                .join('<br>');
            if (DEBUGENABLED) {
                html += `<br>Average Value: `;
                const averageDropValue = npc.lootTable.getAverageDropValue();
                averageDropValue.forEach((quantity, currency) => {
                    html += `<br>${quantity.toFixed(2)} ${currency.name}`;
                });
            }
        } else {
            html += getLangString('THIEVING_NO_COMMON_DROPS');
        }
        html += `</small><br>`;
        // Add in rare drops in all areas (hide if not discovered)
        html += `${getLangString('THIEVING_POSSIBLE_RARE')}<br><small>`;
        const generalRareHTML = [];
        this.generalRareItems.forEach((drop) => {
            if (this.isCorrectRealmForGeneralRareDrop(drop, npc.realm) && (drop.npcs === undefined || drop.npcs.has(npc)))
                generalRareHTML.push(this.formatSpecialDrop(drop.item));
        });
        html += generalRareHTML.join('<br>');
        html += `</small><br>`;
        // Add in rare drops from the specific area (hide if not discovered)
        if (area.uniqueDrops.length) {
            html += `${getLangString('THIEVING_POSSIBLE_AREA_UNIQUE')}<br><small>`;
            html += area.uniqueDrops.map((drop) => this.formatSpecialDrop(drop.item, drop.quantity)).join('<br>');
            html += '</small><br>';
        }
        // Add in rare drops from the specific npc (hide if not discovered)
        if (npc.uniqueDrop !== undefined) {
            html += `${getLangString('THIEVING_POSSIBLE_NPC_UNIQUE')}<br><small>${this.formatSpecialDrop(npc.uniqueDrop.item, npc.uniqueDrop.quantity)}</small>`;
        }
        html += '</span>';
        SwalLocale.fire({
            title: npc.name,
            html,
            imageUrl: npc.media,
            imageWidth: 64,
            imageHeight: 64,
            imageAlt: npc.name,
        });
    }
    testTranslations() {
        super.testTranslations();
        this.actions.forEach((action) => {
            action.name;
        });
        this.areas.forEach((area) => {
            area.name;
        });
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        this.actions.forEach((action) => {
            action.lootTable.sortedDropsArray.forEach((drop) => obtainable.add(drop.item));
            if (action.uniqueDrop)
                obtainable.add(action.uniqueDrop.item);
        });
        this.barItems.forEach((item) => obtainable.add(item));
        this.abyssalBarItems.forEach((item) => obtainable.add(item));
        if (this.entLeprechaunItem)
            obtainable.add(this.entLeprechaunItem);
        this.game.randomGemTable.sortedDropsArray.forEach((drop) => obtainable.add(drop.item));
        if (this.bearLeprechaunItem)
            obtainable.add(this.bearLeprechaunItem);
        this.generalRareItems.forEach((rare) => obtainable.add(rare.item));
        this.areas.forEach((area) => {
            area.uniqueDrops.forEach((drop) => obtainable.add(drop.item));
        });
        if (this.easterEgg)
            obtainable.add(this.easterEgg.reward);
        return obtainable;
    }
}
Thieving.LEPRECHAUN_DEVIL_TABLE = [{
        result: 0 /* LeprechaunDevilResult.DOUBLE_GP */ ,
        weight: 50,
    },
    {
        result: 1 /* LeprechaunDevilResult.QUAD_ITEMS */ ,
        weight: 35,
    },
    {
        result: 2 /* LeprechaunDevilResult.NOTHING */ ,
        weight: 15,
    },
];
Thieving.ABYSSAL_LEPRECHAUN_DEVIL_TABLE = [{
        result: 0 /* AbyssalLeprechaunDevilResult.DOUBLE_AP */ ,
        weight: 50,
    },
    {
        result: 1 /* AbyssalLeprechaunDevilResult.QUAD_ITEMS */ ,
        weight: 35,
    },
    {
        result: 2 /* AbyssalLeprechaunDevilResult.NOTHING */ ,
        weight: 15,
    },
];
//# sourceMappingURL=thieving2.js.map
checkFileVersion('?12097')