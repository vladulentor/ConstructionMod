const { loadModule, onInterfaceReady } = mod.getContext(import.meta);

const { ConstructionActionEvent } = await loadModule('src/construction/gameEvents.mjs');
const { ConstructionStats } = await loadModule('src/construction/statistics.mjs');
const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');
const { ConstructionInterface } = await loadModule('src/interface/constructionInterface.mjs');
const { Encoder } = await loadModule('src/construction/encoder.mjs');

const { ConstructionCategory } = await loadModule('src/construction/constructionCategory.mjs');
const { ConstructionFixture } = await loadModule('src/construction/constructionFixture.mjs');
const { ConstructionFixtureRecipes } = await loadModule('src/construction/constructionFixtureRecipes.mjs');
const { ConstructionRecipe } = await loadModule('src/construction/constructionRecipe.mjs');
const { ConstructionRoom } = await loadModule('src/construction/constructionRoom.mjs');

export class Construction extends ArtisanSkill {
    constructor(namespace, game) {
        super(namespace, 'Construction', game, ConstructionRecipe.name);
        this._media = 'assets/icon.png';
        this.baseInterval = 3000;
        this.ui = undefined;
        this.categories = new NamespaceRegistry(game.registeredNamespaces, 'ConstructionCategory');
        this.rooms = new NamespaceRegistry(game.registeredNamespaces, 'ConstructionRoom');
        this.fixtures = new NamespaceRegistry(game.registeredNamespaces, 'ConstructionFixture');
        this.hiddenRooms = new Set();

        this._actionMode = undefined;

        this.stats = new StatTracker();
        game.stats.Construction = this.stats;
    }

    initMenus() {
        this.ui = new ConstructionInterface(this);
        super.initMenus(...arguments);
    }

    get name() {
        return getRielkLangString('SKILL_NAME_Construction');
    }

    get maxLevelCap() {
        return 99;
    }

    get renderQueue() {
        return this.ui.renderQueue;
    }

    isMasteryActionUnlocked(action) {
        return this.isBasicSkillRecipeUnlocked(action);
    }

    get selectionTabs() {
        return this.ui.constructionSelectionTabs;
    }

    get sortedRooms() {
        const ret = [];
        this.rooms.forEach(r => ret.push(r));
        ret.sort((a, b) => a.level - b.level);
        return ret;
    }

    get menu() {
        return this.ui.constructionArtisanMenu;
    }
    get categoryMenu() {
        return this.ui.constructionCategoryMenu;
    }
    get noCostsMessage() {
        return getLangString('TOASTS_MATERIALS_REQUIRED_TO_CRAFT');
    }
    get noBuildCostsMessage() {
        return getRielkLangString('TOASTS_MATERIALS_REQUIRED_TO_BUILD');
    }
    get actionItem() {
        return this.activeRecipe.product;
    }
    get masteryAction() {
        return this.activeRecipe;
    }
    get unmodifiedActionQuantity() {
        return this.activeRecipe.baseQuantity;
    }
    get activeRecipe() {
        if (this.selectedRecipe === undefined)
            throw new Error('Tried to get active crafting recipe, but none is selected.');
        return this.selectedRecipe;
    }
    get activeBuildRecipe() {
        if (this.selectedFixtureRecipe === undefined)
            throw new Error('Tried to get active building recipe, but none is selected.');
        return this.selectedFixtureRecipe;
    }
    getCurrentBuildRecipeCosts() {
        return this.getRecipeCosts(this.activeBuildRecipe);
    }
    get buildActionXP() {
        return this.activeBuildRecipe.baseExperience;
    }
    get buildActionAbyssalXP() {
        return this.activeBuildRecipe.baseAbyssalExperience;
    }

    get masteryModifiedInterval() {
        return 1700;
    }

    getFixtureInterval(fixture) {
        return this.modifyInterval(this.baseInterval, fixture);
    }

    createButtonOnClick() {
        if (this.isActive && this._actionMode != 0) {
            this.stop();
        }
        this._actionMode = 0;
        super.createButtonOnClick();
        if (!this.isActive)
            this._actionMode = undefined;
    }

    registerData(namespace, data) {
        var _a, _b, _c, _d, _e;
        (_a = data.categories) === null || _a === void 0 ? void 0 : _a.forEach((categoryData) => {
            this.categories.registerObject(new ConstructionCategory(namespace, categoryData, this, this.game));
        }
        );
        (_b = data.recipes) === null || _b === void 0 ? void 0 : _b.forEach((recipeData) => {
            this.actions.registerObject(new ConstructionRecipe(namespace, recipeData, this.game, this));
        }
        );
        (_c = data.fixtureRecipes) === null || _c === void 0 ? void 0 : _c.forEach((fixtureRecipeData) => {
            this.actions.registerObject(new ConstructionFixtureRecipes(namespace, fixtureRecipeData, this.game, this));
        }
        );
        (_d = data.fixtures) === null || _d === void 0 ? void 0 : _d.forEach((fixtureData) => {
            this.fixtures.registerObject(new ConstructionFixture(namespace, fixtureData, this.game, this));
        }
        );
        (_e = data.rooms) === null || _e === void 0 ? void 0 : _e.forEach((roomData) => {
            this.rooms.registerObject(new ConstructionRoom(namespace, roomData, this.game, this));
        }
        );
        super.registerData(namespace, data);
    }
    modifyData(data) {
        var _a, _b, _c, _d;
        super.modifyData(data);
        (_a = data.recipes) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const recipe = this.actions.getObjectByID(modData.id);
            if (recipe === undefined)
                throw new UnregisteredDataModError(ConstructionRecipe.name, modData.id);
            recipe.applyDataModification(modData, this.game);
        }
        );
        (_b = data.fixtureRecipes) === null || _b === void 0 ? void 0 : _b.forEach((modData) => {
            const fixtureRecipe = this.actions.getObjectByID(modData.id);
            if (fixtureRecipe === undefined)
                throw new UnregisteredDataModError(ConstructionRecipe.name, modData.id);
            fixtureRecipe.applyDataModification(modData, this.game);
        }
        );
        (_c = data.fixture) === null || _c === void 0 ? void 0 : _c.forEach((modData) => {
            const fixture = this.fixtures.getObjectByID(modData.id);
            if (fixture === undefined)
                throw new UnregisteredDataModError(ConstructionRecipe.name, modData.id);
            fixture.applyDataModification(modData, this.game);
        }
        );
        (_d = data.rooms) === null || _d === void 0 ? void 0 : _d.forEach((modData) => {
            const room = this.rooms.getObjectByID(modData.id);
            if (room === undefined)
                throw new UnregisteredDataModError(ConstructionRecipe.name, modData.id);
            room.applyDataModification(modData, this.game);
        }
        );
    }
    computeTotalMasteryActions() {
        this.actions.namespaceMaps.forEach((actionMap, namespace) => {
            let total = 0;
            actionMap.forEach((action) => {
                const id = action.id || "(no id)";
                const cat = action.category?.type || "(no category)";
                if (action.hasMastery) {
                    if (!action.realm?.ignoreCompletion) total++;
                    if (action.realm) this.totalMasteryActionsInRealm.inc(action.realm);
                }
            });
            this.totalMasteryActions.set(namespace, total);
        });
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.sortedMasteryActions = sortRecipesByCategoryAndLevel(this.actions.allObjects.filter(act => act.category.type === 'Artisan'), this.categories.allObjects);
        this.rooms.forEach(room => room.sortFixtures());
        this.actions.forEach((action) => {
            if (action.abyssalLevel > 0)
                this.abyssalMilestones.push(action);
            else
                this.milestones.push(action);
        }
        );
        this.sortMilestones();
    }
    onRealmChange() {
        super.onRealmChange();
        this.renderQueue.roomRealmVisibility = true;
        if (this.isActive)
            this.renderQueue.progressBar = true;
    }
    updateRealmSelection() {
        this.ui.updateRealmSelection(this.currentRealm);
    }
    render() {
        super.render();
        this.ui.render();
    }
    renderProgressBar() {
        //handled by ui.render();
    }
    getActionModifierQueryParams(action) {
        const scope = super.getActionModifierQueryParams(action);
        if (action instanceof ConstructionRecipe) {
            scope.category = action.category;
            scope.subcategory = action.subcategory;
        }
        return scope;
    }
    onMasteryLevelUp(action, oldLevel, newLevel) {
        super.onMasteryLevelUp(action, oldLevel, newLevel);
        if (this.selectedRecipe === action)
            this.renderQueue.selectedRecipe = true;
    }
    recordCostPreservationStats(costs) {
        super.recordCostPreservationStats(costs);
        costs.recordBulkItemStat(this.stats, ConstructionStats.ItemsPreserved);
    }
    recordCostConsumptionStats(costs) {
        super.recordCostConsumptionStats(costs);
        costs.recordBulkItemStat(this.stats, ConstructionStats.ItemsUsed);
    }
    onStop() {
        super.onStop();
        this._actionMode = undefined;
    }
    addProvidedStats() {
        super.addProvidedStats();
        this.fixtures.forEach((fixture) => {
            fixture.addProvidedStatsTo(this.providedStats)
        });
    }
    viewAllModifiersOnClick() {
        const summary = new StatObjectSummary();
        this.fixtures.forEach((fixture) => {
            fixture.addProvidedStatsTo(summary)
        });
        const html = summary.getAllDescriptions().map(getElementHTMLDescriptionFormatter('h5', 'font-w400 font-size-sm mb-1', false)).join('');
        SwalLocale.fire({
            title: getRielkLangString('MENU_TEXT_ALL_ACTIVE_CONSTRUCTION_MODIFIERS'),
            html,
        });
    }
    preAction() { }
    get actionRewards() {
        const rewards = new Rewards(this.game);
        var recipe;
        rewards.setActionInterval(this.actionInterval);
        var actionEvent;
        switch (this._actionMode) {
            case 0: {
                recipe = this.activeRecipe;
                actionEvent = new ConstructionActionEvent(this, recipe);
                const item = recipe.product;
                const qtyToAdd = this.modifyPrimaryProductQuantity(item, this.unmodifiedActionQuantity, recipe);
                rewards.addItem(item, qtyToAdd);
                this.addCurrencyFromPrimaryProductGain(rewards, item, qtyToAdd, recipe);
                actionEvent.productQuantity = qtyToAdd;
                this.stats.add(ConstructionStats.ItemsProduced, qtyToAdd);
                rewards.addXP(this, this.actionXP, recipe);
                rewards.addAbyssalXP(this, this.actionAbyssalXP, recipe);
                break;
            }
            case 1: {
                recipe = this.activeBuildRecipe;
                actionEvent = new ConstructionActionEvent(this, recipe);
                this.stats.add(ConstructionStats.FixtureProgressBuilt, 1);
                rewards.addXP(this, this.buildActionXP, recipe);
                rewards.addAbyssalXP(this, this.buildActionAbyssalXP, recipe);
                break;
            }
        }
        this.addCommonRewards(rewards, recipe);
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    addMasteryXPReward() {
        switch (this._actionMode) {
            case 0: {
                this.addMasteryForAction(this.masteryAction, this.masteryModifiedInterval);
                break;
            }
            case 1: {
                const masteryActions = this.activeBuildRecipe.itemCosts.map(cost => {
                    if (cost.item.namespace == 'rielkConstruction')
                        return this.sortedMasteryActions.find(action => action.product == cost.item);
                });
                masteryActions.forEach(action => {
                    if (action != undefined)
                        this.addMasteryForAction(action, this.masteryModifiedInterval);
                });
                break;
            }
        }
    }
    postAction() {
        this.stats.inc(ConstructionStats.Actions);
        this.stats.add(ConstructionStats.TimeSpent, this.currentActionInterval);
        this.renderQueue.recipeInfo = true;
        this.renderQueue.quantities = true;
    }
    action() {
        switch (this._actionMode) {
            case 0:
                super.action();
                break;
            case 1:
                this.buildAction();
                break;
            case undefined():
                break;
        }
    }

    buildAction() {
        const recipeCosts = this.getCurrentBuildRecipeCosts();
        if (!recipeCosts.checkIfOwned()) {
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, this.noCostsMessage, 'danger']
            });
            this.stop();
            return;
        }
        this.preAction();
        const preserve = rollPercentage(this.getPreservationChance(this.activeBuildRecipe));
        if (preserve) {
            this.game.combat.notifications.add({
                type: 'Preserve',
                args: [this]
            });
            this.recordCostPreservationStats(recipeCosts);
        } else {
            recipeCosts.consumeCosts();
            this.recordCostConsumptionStats(recipeCosts);
        }
        const continueSkill1 = this.addActionRewards();
        const continueSkill2 = this.selectedFixtureRecipe.makeProgress();
        this.postAction();
        const nextCosts = this.getCurrentBuildRecipeCosts();
        if (continueSkill1 && continueSkill2 && nextCosts.checkIfOwned()) {
            this.startActionTimer();
        } else {
            if (!nextCosts.checkIfOwned())
                this.game.combat.notifications.add({
                    type: 'Player',
                    args: [this, this.noCostsMessage, 'danger']
                });
            this.stop();
        }
    }

    toggleBuilding(room, fixture) {
        if (this.isActive) {
            if (this._actionMode == 1) {
                this.stop();
                return;
            } else if (!this.stop())
                return;
        }
        if (room == undefined || fixture == undefined)
            return;
        if (!this.getRecipeCosts(fixture.currentRecipe).checkIfOwned()) {
            notifyPlayer(this, this.noBuildCostsMessage, 'danger');
            return;
        }
        this._actionMode = 1;
        this.selectedRoom = room;
        this.selectedFixture = fixture;
        this.selectedFixtureRecipe = fixture.currentRecipe;
        this.start();

    }
    getRegistry(type) {
        switch (type) {
            case ScopeSourceType.Category:
                return this.categories;
            case ScopeSourceType.Action:
                return this.actions;
        }
    }
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.renderQueue.fictureUnlock = true;
        this.renderQueue.menu = true;
    }
    onLoad() {
        super.onLoad();
        this.renderQueue.menu = true;
        this.renderQueue.fictureUnlock = true;
        this.selectRealm(this.currentRealm);
        onInterfaceReady(async () => {
            this.ui.renderVisibleRooms();
            this.render();
        });
        if (this._actionMode == 1) {
            var recipe = this.activeBuildRecipe;
            this.ui.switchConstructionCategory(recipe.category)
            this.ui.selectFixture(recipe.fixture, recipe.fixture.room, this);
        }
        this.fixtures.forEach(fixture => fixture.onLoad());
        this.render();
    }
    resetActionState() {
        super.resetActionState();
        this._actionMode = undefined;
        this.selectedRoom = undefined;
        this.selectedFixture = undefined;
        this.selectedFixtureRecipe = undefined;
    }
    updateForExistingCapIncreases() {
        var _a;
        var initalLevel;
        (_a = this.game.currentGamemode.initialLevelCaps) === null || _a === void 0 ? void 0 : _a.forEach(({skill, value})=>{
            if (skill == this)
                initalLevel = value;
        });
        if (initalLevel == undefined)
            initalLevel = this.game.currentGamemode.defaultInitialLevelCap;
        if (initalLevel == undefined)
            initalLevel = -1;
        this.setLevelCap(initalLevel);
        this.game.activeLevelCapIncreases.forEach((capIncrease) => {
            capIncrease.requirementSets.forEach((reqSet) => {
                if (!reqSet.given)
                    return;
                switch (capIncrease.levelType) {
                    case 'Standard':
                        capIncrease.fixedIncreases.forEach((skillIncrease) => {
                            if (skillIncrease.skill == this)
                                this.applyLevelCapIncrease(skillIncrease);
                        });
                        capIncrease.setIncreases.forEach(({ value }) => {
                            if (skillIncrease.skill == this)
                                this.applySetLevelCap(value);
                        }
                        );
                        break;
                    case 'Abyssal':
                        capIncrease.fixedIncreases.forEach((skillIncrease) => {
                            if (skillIncrease.skill == this)
                                this.skill.applyAbyssalLevelCapIncrease(skillIncrease);
                        }
                        );
                        capIncrease.setIncreases.forEach(({ value }) => {
                            if (skillIncrease.skill == this)
                                this.setAbyssalLevelCap(value);
                        }
                        );
                        break;
                }
                this.game.validateRandomLevelCapIncreases();
            })
        });
    }
    encode(writer) {
        super.encode(writer);
        Encoder.encode(this, writer);
        return writer;
    }

    decode(reader, saveVersion) {
        super.decode(reader, saveVersion);
        Encoder.decode(this, reader);
    }
}
