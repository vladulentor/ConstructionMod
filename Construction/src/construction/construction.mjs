const { loadModule, onInterfaceReady } = mod.getContext(import.meta);

const { ConstructionActionEvent } = await loadModule('src/construction/gameEvents.mjs');
const { ConstructionStats } = await loadModule('src/construction/statistics.mjs');
const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');
const { ConstructionInterface } = await loadModule('src/interface/constructionInterface.mjs');
const { Encoder } = await loadModule('src/construction/encoder.mjs');

const { ConstructionCategory } = await loadModule('src/construction/constructionCategory.mjs');
const { ConstructionFixture } = await loadModule('src/construction/constructionFixture.mjs');
const { ConstructionFixtureRecipes } = await loadModule('src/construction/constructionFixtureRecipes.mjs');
const { ConstructionRecipe } = await loadModule('src/construction/constructionRecipe.mjs');
const { ConstructionRoom } = await loadModule('src/construction/constructionRoom.mjs');
const { ConstructionTierMastery } = await loadModule('src/construction/constructionTierMastery.mjs');
const { createOrangeNotification } = await loadModule('src/interface/elements/constructionEfficiencyNotification.mjs');
const { WeaponMastery } = await loadModule('src/patches/skillPatches/combat/weaponMastery/weaponType.mjs');


const { EfficiencySourceBuilder } = await loadModule('src/construction/constructionEfficiencySourceBuilder.mjs');

const ctx = mod.getContext(import.meta);


export class Construction extends ArtisanSkill {
    constructor(namespace, game) {
        super(namespace, 'Construction', game, ConstructionRecipe.name);
        this._media = 'assets/icon.png';
        this.baseInterval = 4000;
        this.efficient = false;
        this.wasEfficient = false
        this.ui = undefined;
        this.categories = new NamespaceRegistry(game.registeredNamespaces, 'ConstructionCategory');
        this.subCategories = new NamespaceRegistry(game.registeredNamespaces, 'ConstructionSubCategory');
        this.rooms = new NamespaceRegistry(game.registeredNamespaces, 'ConstructionRoom');
        this.fixtures = new NamespaceRegistry(game.registeredNamespaces, 'ConstructionFixture');
        this.tierMasteries = new NamespaceRegistry(game.registeredNamespaces, 'ConstructionTierMastery');
        game.weaponMasteries = new NamespaceRegistry(game.registeredNamespaces, 'WeaponMastery');
        this.totalMasteryActions = new CompletionMap();
        this.hiddenRooms = new Set();
        this.gamemode = undefined;
        this.recipeNumber = 0;
        this.recipeCountByTier = [];
        this.tothmode = cloudManager.hasTotHEntitlementAndIsEnabled;
        this._actionMode = undefined;
        this.extSaveData = {};
        this.extSaveData.showUpdateTooltip = true;
        this.extSaveData.hasStudiedDiagram = false;
        this.cachedpreservationchance = 0;
        this.stats = new StatTracker();
        game.stats.Construction = this.stats;
    }

    initMenus() {
        this.ui = new ConstructionInterface(this);
        super.initMenus(...arguments);
        const viewConstructionButton = createElement('button', {
            className: 'btn btn-small btn-info font-size-xs p-1',
            attributes: [['role', 'button']],
            text: getRielkLangString('MENU_VIEW_HOUSE_TIERS'),
        });

        // Append the button
        this.header?.appendUpper(viewConstructionButton);

        viewConstructionButton.onclick = () => {
            this.popTierMasteries();
            this.renderQueue.masteryBonusElements = true;

            // Using jQuery + Bootstrap
            $('#rielk-tier-mastery-modal').modal('show');
        }
    }
    get totaltier5fixtures() {
        return this.fixtures.reduce((acc, fix) => acc + (fix.currentTier >= 5 ? 1 : 0), 0);
    }
    updateTier5Effects() {
        this.fixtures.forEach(fix => total += fix.currentTier >= 5)
        const xp5 = this.game.modifiers.getValue("rielkConstruction:xpPer5Fixture", ModifierQuery.EMPTY)
        if (xp5) {
            removeModifiers
            const mod = new ModifierValue(
                game.modifierRegistry.getObjectByID('melvorD:skillXP'),
                2,
                {})
        }
    }
    get name() {
        return getRielkLangString('SKILL_NAME_Construction');
    }
    popTierMasteries() {
        this.tierMasteries.forEach(tm => {
            tm.maxProgress = this.recipeNumber;
            let tier = tm.tier;
            tm.currentProgress = this.recipeCountByTier[tier - 1];
            if (tm.currentProgress >= tm.maxProgress && !tm.completed)
                tm.onComplete(this); //special case if someone is loading from the normal construction mod, otherwise this shouldn't fire.
        });

    }
    get maxLevelCap() {
        return 99;
    }

    get renderQueue() {
        return this.ui.renderQueue;
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
    // get masteryAction() {
    //   switch (this._actionMode) {
    //     case 0: return this.activeRecipe;
    //   case 1: return this.activeBuildRecipe;
    //}}

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
        var _a, _b, _c, _d, _e, _f, _g, _h;
        (_a = data.categories) === null || _a === void 0 ? void 0 : _a.forEach((categoryData) => {
            this.categories.registerObject(new ConstructionCategory(namespace, categoryData, this, this.game));
        }
        );
        (_b = data.subcategories) === null || _b === void 0 ? void 0 : _b.forEach((subcategoryData) => {
            this.subCategories.registerObject(new SkillSubcategory(namespace, subcategoryData));
        });
        (_c = data.recipes) === null || _c === void 0 ? void 0 : _c.forEach((recipeData) => {
            this.actions.registerObject(new ConstructionRecipe(namespace, recipeData, this.game, this));
        }
        );
        (_d = data.fixtureRecipes) === null || _d === void 0 ? void 0 : _d.forEach((fixtureRecipeData) => {
            this.actions.registerObject(new ConstructionFixtureRecipes(namespace, fixtureRecipeData, this.game, this));
        }
        );
        (_e = data.fixtures) === null || _e === void 0 ? void 0 : _e.forEach((fixtureData) => {
            this.fixtures.registerObject(new ConstructionFixture(namespace, fixtureData, this.game, this));
        }
        );
        (_f = data.rooms) === null || _f === void 0 ? void 0 : _f.forEach((roomData) => {
            this.rooms.registerObject(new ConstructionRoom(namespace, roomData, this.game, this));
        }
        );
        (_g = data.tierMasteries)?.forEach(tmData => {
            this.tierMasteries.registerObject(new ConstructionTierMastery(namespace, tmData, this.game, this));
        });
        (_h = data.weaponMasteries)?.forEach(weaponMastery => {
            game.weaponMasteries.registerObject(new WeaponMastery(namespace, weaponMastery, this.game))
        })
        game.weaponMasteryXP = new Map();
        super.registerData(namespace, data);
    }
    modifyData(data) {
        var _a, _b, _c, _d, _e;
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
        (_e = data.tierMasteries)?.forEach(modData => {
            const tierMastery = this.tierMasteries.getObjectByID(modData.id);
            if (!tierMastery) throw new UnregisteredDataModError(ConstructionTierMastery.name, modData.id);
            tierMastery.applyDataModification(modData, this.game);
        });
    }
    createItemCurrencyNodes(costs) {
        var _a;
        const nodes = [];
        const createSpan = (children) => {
            nodes.push(createElement('span', { className: 'text-success', children }));
        };
        const smallImage = (media) => createElement('img', { className: 'skill-icon-xs', attributes: [['src', media]] });
        (_a = costs.itemAwards) === null || _a === void 0 ? void 0 : _a.forEach(({ item, quantity }) => {
            createSpan(templateLangStringWithNodes('MENU_TEXT_YOU_GAINED_ITEM', { itemImage: smallImage(item.media) }, { count: numberWithCommas(quantity), itemName: item.name }));
        });
        return nodes;
    }

    getRareDropChance(level, chance) {
        switch (chance.type) {
            case 'Fixed':
                return chance.chance;
            case 'LevelScaling':
                return cappedLinearFunction(chance.scalingFactor, chance.baseChance, chance.maxChance, level);
            case 'TotalMasteryScaling':
                return cappedLinearFunction(chance.scalingFactor, chance.baseChance, chance.maxChance, this.game.completion.masteryProgress.currentCount.getSum());
        }
    };

    get capIncrease() {
        return {
            levelType: 'Standard',
            fixedIncreases: Object.values(game.skills.allObjects)
                .filter(skill => !skill.isCombat)
                .map(skill => ({ skill, increase: Math.max(0, Math.min(5, 99 - skill._currentLevelCap)), maximum: skill.maxLevelCap })),
            setIncreases: [],
            randomIncreases: [],
            randomCount: 0,
            randomSelection: new Set(),
            randomIncreasesLeft: 0,
        };
    }
    locateAncientRelic(relicSet, relic) {
        this.queueAncientRelicFoundModal(relicSet, relic);
        relicSet.addRelic(relic);
        if (relic.id == "rielkConstruction:ConstructionRelic4") {
            if (game.currentGamemode.levelCapIncreases?.length > 0) {
                game.increaseSkillLevelCaps(this.capIncrease, {
                    requirements: [],
                    given: false,
                    unlisteners: []
                });
            }
            /* game.skills.allObjects.forEach(skill =>{
                if(!skill.isCombat && skill.level < 99) skill.addXP(exp.levelToXP(Math.min(99, skill.level + 5)) - skill._xp + 1) // To level up you need more xp than your levels, not equal, so we add 1
             })*/
        }
        if (relicSet.isComplete)
            this.queueAncientRelicFoundModal(relicSet, relicSet.completedRelic);
        this.onAncientRelicUnlock();
    }

    queueMasteryBonusModal(bonus) {
        const modalBody = createElement('div', { className: 'justify-vertical-center' });
        const title = createElement('h5', {
            className: 'font-w400 mb-0',
            parent: modalBody,
        });
        title.innerHTML = templateRielkLangString('MENU_UNLOCKED_MASTERY_FOR_TIER', { tiername: bonus.tier });
        if (bonus.modifiers._stats.hasStats) {
            createElement('h5', {
                text: getLangString('PERMANENT_BONUS_UNLOCKED'),
                className: 'font-w600 font-size-lg text-warning mb-0 mt-2',
                parent: modalBody,
            });
            modalBody.append(...bonus.modifiers._stats.describeAsSpans());
        }
        const rewardNodes = this.createItemCurrencyNodes(bonus);
        if (rewardNodes.length > 0) {
            createElement('h5', {
                text: getLangString('REWARDS_UNLOCKED'),
                className: 'font-w600 font-size-lg text-warning mb-0 mt-2',
                parent: modalBody,
            });
            modalBody.append(...rewardNodes);
        }
        if (bonus.pets !== undefined) {
            createElement('h5', {
                text: bonus.pets.length > 1 ? getLangString('PETS_UNLOCKED') : getLangString('COMPLETION_LOG_PETS_UNLOCKED'),
                className: 'font-w600 font-size-lg text-warning mb-0 mt-2',
                parent: modalBody,
            });
            bonus.pets.forEach((pet) => {
                const petSpan = createElement('span', { className: 'text-success', parent: modalBody });
                petSpan.append(createElement('img', { className: 'skill-icon-md mr-1', attributes: [['src', pet.media]] }), pet.name);
            });
        }
        addModalToQueue({
            titleText: getRielkLangString('MENU_HOUSE_TIER_BONUS_UNLOCKED'),
            imageUrl: ctx.getResourceUrl('assets/cabin.webp'),
            html: modalBody,
            allowOutsideClick: false,
            showConfirmButton: true,
            imageWidth: 128,
            imageHeight: 128,
        });
    }

    //Test function
    callConstructionCrew(x) {
        if (x > 5) {
            console.log("The construction crew tells you to wait for the TotH DLC before they can do that");
            return;
        }
        this.fixtures.allObjects.forEach(f => {
            while (f.currentTier < x)
                f.tierUp();
        })
    }

    computeTotalMasteryActions() {
        this.totalMasteryActions.clear();

        const namespace = 'rielkConstruction';
        let total = 0;
        this.fixtures.forEach(fixture => {
            total++;
        });
        this.totalMasteryActions.set(namespace, total);
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
    onPageChange() {
        super.onPageChange();
        this.renderQueue.renderfixtureItemUpdates = true;
        if (this.extSaveData.showUpdateTooltip) {
            if (this.annoyingText == null)
                this.annoyingText = this.level == 1 ? getRielkLangString('GUIDE_TOOLTIP_NEW') : getRielkLangString('GUIDE_TOOLTIP_UPDATE');
            const link = document.querySelector('#game-guide-header-link');
            this.annoying = tippy(link, {
                content: `<div class="text-center">${this.annoyingText}</div>`,
                placement: 'bottom',
                allowHTML: true,
                trigger: 'manual',
                hideOnClick: false,
                interactive: true,
                duration: [0, 0]
            });

            this.annoying.show();
            setTimeout(() => {
                if (!this.annoying.popper) return;
                const box = this.annoying.popper?.querySelector('.tippy-box');
                if (!box) return;
                box.classList.add('shake');
                setTimeout(() => box.classList.remove('shake'), 1000);
            }, 0);

            const check = setInterval(() => {
                if (game.openPage?.id !== 'rielkConstruction:Construction') {
                    this.annoying.destroy();
                    clearInterval(check);
                }
            }, 25);
            setTimeout(() => { this.annoying.destroy(); clearInterval(check); }, 5000);

        }
    }
    disableToolTip() { //This function gets called on gameguide click
        if (game.openPage.id == 'rielkConstruction:Construction') {
            this.extSaveData.showUpdateTooltipF = false;
            if (this.annoying?.state?.isDestroyed === false) {
                this.annoying.destroy();
                //technically doesn't clearInterval, but that happens on page change so it's not too big a deal.
            }
        }
    }
    updateMasteryDisplays() {
        //leave empty so it doesn't do anything
    }
    shouldShowSkillInSidebar() {
        return super.shouldShowSkillInSidebar() || this.game.currentRealm === this.game.defaultRealm; // only show in default realm
    }
    updateRecipeCounts() {
        const tierNum = 5 //this.tothmode ? 8 : 5;
        this.recipeCountByTier = Array(tierNum).fill(0);
        const allFixtures = this.fixtures.allObjects;
        //This is assuming all recipes have equal number tiers, which is technically not true with the AoD DLC, 
        // but the game lets you go to 120 with AoD and not TotH, this is in the spirit of that

        this.recipeNumber = allFixtures.length;
        allFixtures.forEach((fixture) => {
            const maxTier = fixture.currentTier; // currentTier = number from 1..max

            for (let t = 0; t < maxTier; t++) {
                this.recipeCountByTier[t]++;
            }
        });

    }

    get hasMastery() { // We inspect the call stack to determine if we have mastery, this is so we can be in the mastery log without having a mastery bar.
        const stack = new Error().stack;
        if (stack.includes('buildMasteryLog') || stack.includes('buildSkillsLog') || stack.includes('updateMasteryProgress')) return true;
        else return false;
    }

    isMasteryActionUnlocked(action) {
        return false;
    }
    updateTotalUnlockedMasteryActions() {

    }

    postDataRegistration() {
        super.postDataRegistration();
        this.computeTotalMasteryActions();
        this.sortedMasteryActions = sortRecipesByCategoryAndLevel(
            this.actions.allObjects.filter(act => act.category.type === 'Artisan'),
            this.categories.allObjects
        );
        this.rooms.forEach(room => room.sortFixtures());
        this.actions.forEach((action) => {
            this.milestones.push(action);
        })
        this.sortMilestones();
    }
    addTotalCurrentMasteryToCompletion(completion) {
        this.fixtures.forEach(fixture => {
            let totalTierLevel = fixture.currentTier;
            const namespace = 'rielkConstruction';
            completion.add(namespace, totalTierLevel);
        });
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

    getMaxTotalMasteryLevels() {
        let tiernum = 5; //cloudManager.hasTotHEntitlementAndIsEnabled ? 8 : 5;
        return this.recipeNumber * tiernum;
    }

    getTotalCurrentMasteryLevels() {
        return this.recipeCountByTier.reduce((a, b) => a + b, 0);

    }

    render() {
        super.render();
        this.ui.render();
    }
    renderProgressBar() {
        //handled by ui.render();
    }
    get masteryLevelCap() {
        return 5;  //cloudManager.hasTotH later
    }
    renderRecipeInfo() {
        if (!this.renderQueue.recipeInfo)
            return;
        if (this.ui.constructionHouseMenu?.root?.parentElement.parentElement.classList?.contains?.('d-none') && this.selectedRecipe) {
            const recipe = this.masteryAction;
            const masteryXPToAdd = this.getMasteryXPToAddForAction(recipe, this.masteryModifiedInterval);
            const baseMasteryXP = this.getBaseMasteryXPToAddForAction(recipe, this.masteryModifiedInterval);
            this.menu.updateGrants(this.modifyXP(this.actionXP), this.actionXP, masteryXPToAdd, baseMasteryXP, this.getMasteryXPToAddToPool(masteryXPToAdd), this.activeRecipe.realm);
            this.menu.updateGrantsSources(this, recipe);
            this.menu.updateChances(this.getPreservationChance(recipe), this.getPreservationCap(recipe), this.getPreservationSources(recipe), this.getDoublingChance(recipe), this.getDoublingSources(recipe),
                this.getEfficiencyChance(recipe),
                this.getEfficiencyPotencyMultiplier(recipe), this.getEfficiencyCostMultiplier(recipe), this.getEfficiencyChancePotencySources(recipe));
            const query = this.getActionModifierQuery(recipe);
            this.menu.updateAdditionalPrimaryQuantity(this.getFlatAdditionalPrimaryProductQuantity(this.actionItem, query), this.getAdditionalPrimaryResourceQuantitySources(query));
            this.menu.updateCostReduction(this.getCostReduction(recipe), this.getCostReductionSources(recipe));
            this.menu.updateInterval(this.actionInterval, this.getIntervalSources(recipe));
            this.menu.updateAbyssalGrants(this.modifyAbyssalXP(this.actionAbyssalXP), this.actionAbyssalXP);
        }
        else if (this.getPreservationChance(this) != this.cachedpreservationchance)
            this.renderQueue.menu = true;
        this.renderQueue.recipeInfo = false;
    }

    getActionModifierQueryParams(action) {
        const scope = super.getActionModifierQueryParams(action);
        if (action instanceof ConstructionRecipe) {
            scope.category = action.category;
            scope.subcategory = action.subcategory;
        }
        else if (action && action.category !== undefined)
            scope.category = action.category;
        return scope;
    }
    onMasteryLevelUp(action, oldLevel, newLevel) {
        // nope
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

    renderModifierChange() {
        super.renderModifierChange();
        this.renderQueue.menu = true;
    }

    addProvidedStats() {
        super.addProvidedStats();
        if (this.extSaveData.hasStudiedDiagram) this.studyTheDiagram(true);
        this.fixtures.forEach((fixture) => {
            fixture.addProvidedStatsTo(this.providedStats)
        });
        this.tierMasteries.forEach((tier) => {
            tier.addProvidedStatsTo(this.providedStats)
        });
    }
    viewAllModifiersOnClick() {
        const summary = new StatObjectSummary();
        this.fixtures.forEach((fixture) => {
            fixture.addProvidedStatsTo(summary)
        });
        this.tierMasteries.forEach(tier => {
            if (tier.completed) tier.addProvidedStatsTo(summary);
        });
        const html = summary.getAllDescriptions().map(getElementHTMLDescriptionFormatter('h5', 'font-w400 font-size-sm mb-1', false)).join('');
        SwalLocale.fire({
            title: getRielkLangString('MENU_TEXT_ALL_ACTIVE_CONSTRUCTION_MODIFIERS'),
            html,
        });
    }
    // Efficiency-related functions
    /** Gets the efficiency chance for a given action */
    // We can't disable efficiency from .jsons because malvs is a fuckEr
    getEfficiencyChance(action) {
        if (this.shouldDisableEfficiency === undefined)
            this.shouldDisableEfficiency = game.currentGamemode.disableItemDoubling;

        return (this.shouldDisableEfficiency ? 0 : this.getBaseEfficiencyChance(action)) + this.game.modifiers.getValue("rielkConstruction:bypassEfficiencyChance", this.getActionModifierQuery(action))
    }
    getBaseEfficiencyChance(action) {
        const quer = this.getActionModifierQuery(action)
        return Math.max(this.game.modifiers.getValue(
            "rielkConstruction:skillEfficiencyChance",
            quer
        ) + (this.tothmode ? this.game.modifiers.getValue('rielkConstruction:skillEfficiencyChancePerHamrielStar', quer) * game.astrology.actions.getObjectSafe("melvorTotH:Haemir").maxValueModifiers : 0), 0);

    }
    /** Gets the cost multiplier for efficiency (default 2) */
    getEfficiencyCostMultiplier(action) {
        const defaultCostMult = 200;
        const modifier = this.game.modifiers.getValue(
            "rielkConstruction:skillEfficiencyCost",
            this.getActionModifierQuery(action)
        ) || 0;
        return (defaultCostMult + modifier) / 100;
    }

    /** Gets the Potency/progress multiplier for efficiency (default 2) */
    getEfficiencyPotencyMultiplier(action) {
        const defaultPotencyMult = 200;
        const modifier = this.game.modifiers.getValue(
            "rielkConstruction:skillEfficiencyPotency",
            this.getActionModifierQuery(action)
        ) || 0;
        return (defaultPotencyMult + modifier) / 100;
    }

    _buildEfficiencyChancePotencySources(action) {
        const builder = new EfficiencySourceBuilder(this.game.modifiers, true);
        const query = this.getActionModifierQuery(action);
        builder.addPotencySources('rielkConstruction:skillEfficiencyPotency', query);
        if (!this.shouldDisableEfficiency) {
            builder.addChanceSources('rielkConstruction:skillEfficiencyChance', query);
            if (this.tothmode)
                builder.addChanceSources('rielkConstruction:skillEfficiencyChancePerHamrielStar', query, game.astrology.actions.getObjectSafe("melvorTotH:Haemir").maxValueModifiers);
        }
        builder.addChanceSources('rielkConstruction:bypassEfficiencyChance', query)
        return builder;
    }

    getEfficiencyChancePotencySources(action) {
        const builder = this._buildEfficiencyChancePotencySources(action);
        const spans = builder.getSpans();

        return spans;
    }

    applyPrimaryProductMultipliers(item, quantity, action, query) {
        //if (rollPercentage(this.getDoublingChance(action))) 
        //  quantity *= 2;
        //Construction skill has no "regular" doubling
        quantity *= Math.pow(2, this.game.modifiers.getValue("melvorD:doubleItemsSkill" /* ModifierIDs.doubleItemsSkill */, query));
        quantity *= Math.pow(2, this.game.modifiers.getValue("melvorD:bypassDoubleItemsSkill" /* ModifierIDs.bypassDoubleItemsSkill */, query));
        return quantity;
    }

    modifyPrimaryProductQuantity(item, quantity, action, effect) {
        const query = this.getActionModifierQuery(action);
        quantity += this.getFlatBasePrimaryProductQuantityModifier(item, query);
        quantity += this.getRandomFlatBasePrimaryProductQuantity(item, query);
        if (effect) quantity = this.applyEfficiencyProductMultipliers(item, quantity, action, query); //it's not an amazing workaround
        quantity *= 1 + this.getBasePrimaryProductQuantityModifier(item, query) / 100;
        quantity = Math.floor(quantity);
        quantity = this.applyPrimaryProductMultipliers(item, quantity, action, query);
        quantity += this.getFlatAdditionalPrimaryProductQuantity(item, query);
        quantity += this.getRandomFlatAdditionalPrimaryProductQuantity(item, action, query);
        return Math.max(quantity, 1);
    }
    applyEfficiencyProductMultipliers(item, quantity, action, query) {
        quantity *= this.getEfficiencyPotencyMultiplier(action);
        return quantity;
    }

    //        builder.addSources("melvorD:skillEfficiencyCostMult", this.getActionModifierQuery(action)); For later

    onEquipmentChange() {
        this.renderQueue.menu = true; // Note, we could optimize this to not re-render the entire menu.
    }

    preAction() { }
    get actionRewards() {
        const rewards = new Rewards(this.game);
        var recipe;
        rewards.setActionInterval(this.actionInterval);
        var actionEvent;
        var xpMult;
        switch (this._actionMode) {
            case 0: {
                recipe = this.activeRecipe;
                actionEvent = new ConstructionActionEvent(this, recipe);
                xpMult = this.efficient ? this.getEfficiencyPotencyMultiplier(recipe) : 1;
                const item = recipe.product;
                const qtyToAdd = this.modifyPrimaryProductQuantity(item, this.unmodifiedActionQuantity, recipe, this.efficient);
                rewards.addItem(item, qtyToAdd);
                this.addCurrencyFromPrimaryProductGain(rewards, item, qtyToAdd, recipe);
                actionEvent.productQuantity = qtyToAdd;
                this.stats.add(ConstructionStats.ItemsProduced, qtyToAdd);
                rewards.addXP(this, Math.floor(this.actionXP) * xpMult, recipe);
                rewards.addAbyssalXP(this, this.actionAbyssalXP, recipe);
                break;
            }
            case 1: {
                recipe = this.activeBuildRecipe;
                xpMult = this.efficient ? this.getEfficiencyPotencyMultiplier(recipe) : 1;
                actionEvent = new ConstructionActionEvent(this, recipe);
                this.stats.add(ConstructionStats.FixtureProgressBuilt, 1);
                rewards.addXP(this, Math.floor(this.buildActionXP) * Math.floor(xpMult), recipe);
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
        // no more mastery XP reward
    }
    postAction() {
        this.stats.inc(ConstructionStats.Actions);
        this.stats.add(ConstructionStats.TimeSpent, this.currentActionInterval);
        this.renderQueue.recipeInfo = true;
        this.renderQueue.quantities = true;
        this.cachedpreservationchance = this.getPreservationChance(this);
        this.wasEfficient = this.efficient;
        this.efficient = false;
    }
    renderSelectedRecipe() {
        if (!this.renderQueue.selectedRecipe)
            return;
        if (this.selectedRecipe !== undefined && this.ui.constructionHouseMenu?.root?.parentElement.parentElement.classList?.contains?.('d-none')) {
            const item = this.actionItem;
            const quantity = this.getMinimumPrimaryProductBaseQuantity(item, this.unmodifiedActionQuantity, this.getActionModifierQuery(this.selectedRecipe));
            this.menu.setProduct(item, quantity);
            this.menu.setSelected(this, this.selectedRecipe);
            const costs = this.getCurrentRecipeCosts();
            this.menu.setIngredients(costs.getItemQuantityArray(), costs.getCurrencyQuantityArray(), this.game);
            this.renderQueue.recipeInfo = true;
            this.renderQueue.actionMastery.add(this.masteryAction);
        }
        this.renderQueue.selectedRecipe = false;
    }

    action() {
        switch (this._actionMode) {
            case 0:
                this.artisanAction();
                break;
            case 1:
                this.buildAction();
                break;
            case undefined():
                break;
        }
    }

    studyTheDiagram(init = false) {
        if (!init && this.extSaveData.hasStudiedDiagram == true) return;

        if (init) ctx.onCharacterLoaded(async (ctx) => { this._studyTheDiagram() });
        else this._studyTheDiagram();

        this.extSaveData.hasStudiedDiagram = true;
    }
    _studyTheDiagram() {
        let twothingstoadd = [];
        const hitting = new ModifierValue(
            game.modifierRegistry.getObjectByID('melvorD:minHitBasedOnMaxHit'),
            2,
            {}
        );
        const reflect = new ModifierValue(
            game.modifierRegistry.getObjectByID('melvorD:damageTaken'),
            -2,
            {}
        );
        twothingstoadd.push(hitting, reflect);
        game.modifiers.addModifiers('Construct Knowledge', twothingstoadd, 1, 1);

    }
    addMasteryProgress(tier) {
        let tierData = this.tierMasteries.getObjectSafe(`rielkConstruction:${tier}`);

        tierData.addProgress(this);
        this.updateRecipeCounts();

        this.renderQueue.masteryBar = true;
        this.renderQueue.masteryBonusElements = true;

    }
    scalecost(cost, multiplier = 0) {
        if (cost.checkIfOwned()) {
            cost._currencies.forEach((quantity, currency, map) => {
                map.set(currency, Math.round(quantity * multiplier));
            });
            cost._items.forEach((quantity, item, map) => {
                map.set(item, Math.round(quantity * multiplier));
            });
            if (!cost.checkIfOwned()) {            // This reset is for the specific case of the player not having enough for the efficiency ability but having enough for a normal craft, so we give it to them for no extra cost.
                //TODO: Add a message if this happens
                //PS, this could technically be abused by someone alays holding a super small amount of items when building to not suffer the costs, but who would do that
                cost._currencies.forEach((quantity, currency, map) => {
                    map.set(currency, Math.floor(quantity / multiplier));
                });
                cost._items.forEach((quantity, item, map) => {
                    map.set(item, Math.floor(quantity / multiplier));
                });
            }
        }
    }

    artisanAction() {
        if (rollPercentage(this.getEfficiencyChance(this.activeRecipe))) this.efficient = true;
        if (this.notifs && this.efficient && !game.settings.useLegacyNotifications) {

            createOrangeNotification({
                text: getRielkLangString('TOASTS_EFFICIENCY'),
                quantity: this.getEfficiencyPotencyMultiplier(this.activeRecipe)
            });
        }
        if (this.efficient) this.game.combat.notifications.add({ type: 'Preserve', args: [this] });
        let recipeCosts = this.getCurrentRecipeCosts();
        if (this.efficient) this.scalecost(recipeCosts, this.getEfficiencyCostMultiplier(this.activeRecipe))
        if (!recipeCosts.checkIfOwned()) {
            this.game.combat.notifications.add({ type: 'Player', args: [this, this.noCostsMessage, 'danger'] });
            this.stop();
            return;
        }
        this.preAction();
        const preserve = rollPercentage(this.getPreservationChance(this.masteryAction));
        if (preserve) {
            this.game.combat.notifications.add({ type: 'Preserve', args: [this] });
            this.recordCostPreservationStats(recipeCosts);
        }
        else {
            recipeCosts.consumeCosts();
            this.recordCostConsumptionStats(recipeCosts);
        }
        const continueSkill = this.addActionRewards();
        this.postAction();
        const nextCosts = this.getCurrentRecipeCosts();
        if (nextCosts.checkIfOwned() && continueSkill) {
            this.startActionTimer();
        }
        else {
            if (!nextCosts.checkIfOwned())
                this.game.combat.notifications.add({ type: 'Player', args: [this, this.noCostsMessage, 'danger'] });
            this.stop();
        }

    }

    buildAction() {
        if (rollPercentage(this.getEfficiencyChance(this.activeBuildRecipe))) this.efficient = true;
        if (this.notifs && this.efficient && !game.settings.useLegacyNotifications)
            createOrangeNotification({
                text: getRielkLangString('TOASTS_EFFICIENCY'),
                quantity: Math.floor(this.getEfficiencyPotencyMultiplier(this.activeBuildRecipe))
            });
        this.selectedFixture.getCurrentBuildRecipeCosts(this, this.efficient);
        let recipeCosts = this.selectedFixture.stepCost;
        if (!recipeCosts.checkIfOwned()) {
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, this.noCostsMessage, 'danger']
            });
            this.stop();
            return;
        }
        this.preAction();
        const progressMult = this.efficient ? this.getEfficiencyPotencyMultiplier(this.activeBuildRecipe) : 1;
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
        const continueSkill1 = this.addActionRewards(); //TODO, determine if this is needed
        const continueSkill2 = this.selectedFixtureRecipe.makeProgress(progressMult);
        this.postAction();
        const nextCosts = this.selectedFixture.stepCost;
        if (continueSkill1 && continueSkill2 && nextCosts.checkIfOwned()) {
            this.startActionTimer();
        } else {
            if (continueSkill2 && !nextCosts.checkIfOwned())
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
        this.selectedRoom = room;
        this.selectedFixture = fixture;
        this.selectedFixtureRecipe = fixture.currentRecipe;
        if (this.selectedFixture.stepCost == undefined) this.selectedFixture.getCurrentBuildRecipeCosts(this);
        if (!this.selectedFixture.stepCost.checkIfOwned()) {
            notifyPlayer(this, this.noBuildCostsMessage, 'danger');
            return;
        }
        this._actionMode = 1;
        this.start();

    }
    getRegistry(type) {
        switch (type) {
            case ScopeSourceType.Category:
                return this.categories;
            case ScopeSourceType.Subcategory:
                return this.subCategories;

            case ScopeSourceType.Action:
                return this.actions;
        }
    }
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.renderQueue.fictureUnlock = true;
        this.renderQueue.menu = true;
    }
    queueBankQuantityRender(item) {
        super.queueBankQuantityRender(item);
        this.renderQueue.renderfixtureItemUpdates = true;

    }

    onLoad() {
        super.onLoad();
        this.renderQueue.menu = true;
        this.renderQueue.fictureUnlock = true;
        this.renderQueue.masteryBar = true;
        this.renderQueue.renderAllFixtureItemUpdates = true;
        this.renderQueue.masteryBonusElements = true;


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
        this.updateRecipeCounts();
        this.popTierMasteries();

        this.render();
    }
    resetActionState() {
        super.resetActionState();
        this._actionMode = undefined;
        this.efficient = 0;
        this.selectedRoom = undefined;
        this.selectedFixture = undefined;
        this.selectedFixtureRecipe = undefined;
    }
    updateForExistingCapIncreases() {
        var _a;
        var initalLevel;
        (_a = this.game.currentGamemode.initialLevelCaps) === null || _a === void 0 ? void 0 : _a.forEach(({ skill, value }) => {
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
                        capIncrease.setIncreases.forEach(({ skill, value }) => {
                            if (skill == this)
                                this.applySetLevelCap(value);
                        });
                        break;
                    /* case 'Abyssal':
                         capIncrease.fixedIncreases.forEach((skillIncrease) => {
                             if (skillIncrease.skill == this)
                                 this.skill.applyAbyssalLevelCapIncrease(skillIncrease);
                         }
                         );
                         capIncrease.setIncreases.forEach(({ skill, value }) => {
                             if (skill == this)
                                 this.applySetLevelCap(value);
                         });
                         break;*/
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
