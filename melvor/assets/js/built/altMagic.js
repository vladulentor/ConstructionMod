"use strict";
/** Determines which items are consumed by an alt. magic spell */
var AltMagicConsumptionID;
(function(AltMagicConsumptionID) {
    AltMagicConsumptionID[AltMagicConsumptionID["AnyItem"] = -1] = "AnyItem";
    AltMagicConsumptionID[AltMagicConsumptionID["JunkItem"] = -2] = "JunkItem";
    AltMagicConsumptionID[AltMagicConsumptionID["BarIngredientsWithCoal"] = -3] = "BarIngredientsWithCoal";
    AltMagicConsumptionID[AltMagicConsumptionID["BarIngredientsWithoutCoal"] = -4] = "BarIngredientsWithoutCoal";
    AltMagicConsumptionID[AltMagicConsumptionID["None"] = -5] = "None";
    AltMagicConsumptionID[AltMagicConsumptionID["AnySuperiorGem"] = -6] = "AnySuperiorGem";
    AltMagicConsumptionID[AltMagicConsumptionID["AnyNormalFood"] = -7] = "AnyNormalFood";
})(AltMagicConsumptionID || (AltMagicConsumptionID = {}));
var AltMagicProductionID;
(function(AltMagicProductionID) {
    AltMagicProductionID[AltMagicProductionID["GP"] = -1] = "GP";
    AltMagicProductionID[AltMagicProductionID["Bar"] = -2] = "Bar";
    AltMagicProductionID[AltMagicProductionID["RandomGem"] = -3] = "RandomGem";
    AltMagicProductionID[AltMagicProductionID["RandomSuperiorGem"] = -4] = "RandomSuperiorGem";
    AltMagicProductionID[AltMagicProductionID["PerfectFood"] = -5] = "PerfectFood";
    AltMagicProductionID[AltMagicProductionID["RandomShards"] = -6] = "RandomShards";
    AltMagicProductionID[AltMagicProductionID["MagicXP"] = -7] = "MagicXP";
    AltMagicProductionID[AltMagicProductionID["AbyssalMagicXP"] = -8] = "AbyssalMagicXP";
})(AltMagicProductionID || (AltMagicProductionID = {}));
class AltMagicSpell extends BaseSpell {
    constructor(namespace, data, game) {
        var _a;
        super(namespace, data, game);
        /** Item costs which are consumed per cast */
        this.fixedItemCosts = [];
        try {
            this.baseExperience = data.baseExperience;
            if (data.fixedItemCosts !== undefined)
                this.fixedItemCosts = game.items.getQuantities(data.fixedItemCosts);
            this.specialCost = this.getSpecialCost(data.specialCost, game);
            this.produces = this.getProduces(data.produces);
            this.productionRatio = data.productionRatio;
            this._description = data.description;
            this.baseAbyssalExperience = (_a = data.baseAbyssalExperience) !== null && _a !== void 0 ? _a : 0;
            if (data.realm !== undefined) {
                this.realm = game.realms.getObjectSafe(data.realm);
            } else {
                this.realm = game.defaultRealm;
            }
        } catch (e) {
            throw new DataConstructionError(AltMagicSpell.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`MAGIC_ALTMAGIC_NAME_${this.localID}`);
        }
    }
    get description() {
        switch (this.produces) {
            // Superheat
            case AltMagicProductionID.Bar:
                switch (this.specialCost.type) {
                    case AltMagicConsumptionID.BarIngredientsWithCoal:
                        return templateLangString('MAGIC_SUPERHEAT', {
                            barAmount: `${this.productionRatio}`,
                            oreAmount: `${this.specialCost.quantity}`,
                        });
                    case AltMagicConsumptionID.BarIngredientsWithoutCoal:
                        return templateLangString('MAGIC_SUPERHEAT_NO_COAL', {
                            barAmount: `${this.productionRatio}`,
                            oreAmount: `${this.specialCost.quantity}`,
                        });
                }
                break;
                // Item alchemy
            case AltMagicProductionID.GP:
                if (this.specialCost.type === AltMagicConsumptionID.AnyItem)
                    return templateLangString('MAGIC_ITEM_ALCHEMY', {
                        percent: `${this.productionRatio * 100}`
                    });
                break;
        }
        // Special Case for Holy Invocation
        if (this.produces instanceof BoneItem &&
            this.fixedItemCosts.length === 1 &&
            this._namespace.name !== "melvorAoD" /* Namespaces.AtlasOfDiscovery */ ) {
            return templateLangString('MAGIC_HOLY_INVOCATION', {
                itemName: this.fixedItemCosts[0].item.name,
                qty1: `${this.fixedItemCosts[0].quantity}`,
                qty2: `${this.produces.prayerPoints}`,
            });
        }
        const templateData = {
            amount: `${this.productionRatio}`,
            percent: `${this.productionRatio * 100}`,
            specialCostQty: `${this.specialCost.quantity}`,
        };
        this.fixedItemCosts.forEach(({
            item,
            quantity
        }, i) => {
            templateData[`fixedItemName${i}`] = item.name;
            templateData[`fixedItemQty${i}`] = `${quantity}`;
        });
        if (this.isModded) {
            return templateString(this._description, templateData);
        } else {
            return templateLangString(`MAGIC_ALTMAGIC_DESC_${this.localID}`, templateData);
        }
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            if (data.baseExperience !== undefined)
                this.baseExperience = data.baseExperience;
            if (data.fixedItemCosts !== undefined)
                this.fixedItemCosts = game.items.modifyQuantities(this.fixedItemCosts, data.fixedItemCosts);
            if (data.specialCost !== undefined) {
                if (data.specialCost.type !== undefined)
                    this.specialCost.type = AltMagicConsumptionID[data.specialCost.type];
                if (data.specialCost.quantity !== undefined)
                    this.specialCost.quantity = data.specialCost.quantity;
                if (data.specialCost.currency !== undefined)
                    this.specialCost.currency = game.currencies.getObjectSafe(data.specialCost.currency);
            }
            if (data.produces !== undefined)
                this.produces = this.getProduces(data.produces);
            if (data.productionRatio !== undefined)
                this.productionRatio = data.productionRatio;
            if (data.baseAbyssalExperience !== undefined)
                this.baseAbyssalExperience = data.baseAbyssalExperience;
        } catch (e) {
            throw new DataModificationError(AltMagicSpell.name, e, this.id);
        }
    }
    getSpecialCost(data, game) {
        const specialCost = {
            type: AltMagicConsumptionID[data.type],
            quantity: data.quantity,
        };
        if (data.currency !== undefined) {
            specialCost.currency = game.currencies.getObjectSafe(data.currency);
        }
        return specialCost;
    }
    getProduces(produces) {
        const specialProduces = AltMagicProductionID[produces];
        if (specialProduces === undefined) {
            return game.items.getObjectSafe(produces);
        } else {
            return specialProduces;
        }
    }
}
class AltMagic extends CraftingSkill {
    constructor(namespace, game) {
        super(namespace, 'Magic', game, AltMagicSpell.name);
        this._media = "assets/media/skills/magic/magic.png" /* Assets.Magic */ ;
        this.renderQueue = new AltMagicRenderQueue();
        this.smithingBarRecipes = [];
        /** Base interval of casting a spell in ms */
        this.baseInterval = 2000;
        this.randomShardTable = new DropTable(this.game, []);
        this.spellCategories = new NamespaceRegistry(game.registeredNamespaces, SkillSubcategory.name);
    }
    get hasMastery() {
        return false;
    }
    get isCombat() {
        return true;
    }
    get levelCompletionBreakdown() {
        return TOTH_SKILL_LEVEL_BREAKDOWN;
    }
    shouldShowSkillInSidebar() {
        return (super.shouldShowSkillInSidebar() ||
            this.actions.some((action) => action.realm === this.game.currentRealm) ||
            this.game.attackSpellbooks.some((book) => book.realm === this.game.currentRealm));
    }
    computeTotalMasteryActions() {
        // Do nothing, as this will ensure the total map is zero
    }
    updateTotalUnlockedMasteryActions() {
        // Do nothing, as this skill has no mastery
    }
    isMasteryActionUnlocked(action) {
        return false; // Return false as this skill has no mastery
    }
    get actionInterval() {
        return this.modifyInterval(this.baseInterval, this.activeSpell);
    }
    get actionLevel() {
        return this.activeSpell.level;
    }
    get masteryAction() {
        return this.activeSpell;
    }
    get masteryModifiedInterval() {
        return this.baseInterval;
    }
    get noCostsMessage() {
        return getLangString('TOASTS_MATERIALS_REQUIRED_TO_CAST');
    }
    get noRunesMessage() {
        return getLangString('TOASTS_RUNES_REQUIRED_TO_CAST');
    }
    get activeSpell() {
        if (this.selectedSpell === undefined)
            throw new Error('Tried to get active spell, but none is selected');
        return this.selectedSpell;
    }
    get runePreservationChance() {
        let preserveChance = this.game.modifiers.getRunePreservationChance();
        preserveChance += this.game.modifiers.altMagicRunePreservationChance;
        return Math.min(preserveChance, 80);
    }
    get selectedSpellMedia() {
        if (this.selectedSpell === undefined) {
            return this.media;
        } else {
            switch (this.selectedSpell.specialCost.type) {
                case AltMagicConsumptionID.AnyItem:
                case AltMagicConsumptionID.JunkItem:
                case AltMagicConsumptionID.AnySuperiorGem:
                case AltMagicConsumptionID.AnyNormalFood:
                    if (this.selectedConversionItem !== undefined) {
                        return this.selectedConversionItem.media;
                    }
                    break;
                case AltMagicConsumptionID.BarIngredientsWithCoal:
                case AltMagicConsumptionID.BarIngredientsWithoutCoal:
                    if (this.selectedSmithingRecipe !== undefined) {
                        return this.selectedSmithingRecipe.media;
                    }
                    break;
            }
            return this.selectedSpell.media;
        }
    }
    registerData(namespace, data) {
        var _a, _b;
        (_a = data.spellCategories) === null || _a === void 0 ? void 0 : _a.forEach((subcat) => {
            this.spellCategories.registerObject(new SkillSubcategory(namespace, subcat));
        });
        (_b = data.altSpells) === null || _b === void 0 ? void 0 : _b.forEach((altSpellData) => {
            this.actions.registerObject(new AltMagicSpell(namespace, altSpellData, this.game));
        });
        super.registerData(namespace, data);
        if (data.randomShards !== undefined)
            this.randomShardTable.registerDrops(this.game, data.randomShards);
    }
    modifyData(data) {
        var _a;
        super.modifyData(data);
        (_a = data.altSpells) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const spell = this.actions.getObjectByID(modData.id);
            if (spell === undefined)
                throw new UnregisteredDataModError(AltMagicSpell.name, modData.id);
            spell.applyDataModification(modData, game);
        });
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.smithingBarRecipes = this.game.smithing.actions.filter((recipe) => recipe.category.id === "melvorD:Bars" /* SmithingCategoryIDs.Bars */ );
        this.game.attackSpells.forEach((spell) => {
            if (spell.abyssalLevel > 0)
                this.abyssalMilestones.push(spell);
            else
                this.milestones.push(spell);
        });
        this.milestones.push(...this.game.curseSpells.allObjects);
        this.milestones.push(...this.game.auroraSpells.allObjects);
        this.actions.forEach((action) => {
            if (action.abyssalLevel > 0)
                this.abyssalMilestones.push(action);
            else
                this.milestones.push(action);
        });
        this.sortMilestones();
    }
    /** Callback for when the cast button is clicked */
    castButtonOnClick() {
        if (this.isActive) {
            this.stop();
        } else if (this.selectedSpell !== undefined) {
            let itemSelected = true;
            switch (this.selectedSpell.specialCost.type) {
                case AltMagicConsumptionID.AnyItem:
                case AltMagicConsumptionID.AnyNormalFood:
                case AltMagicConsumptionID.AnySuperiorGem:
                case AltMagicConsumptionID.JunkItem:
                    itemSelected = this.selectedConversionItem !== undefined;
                    break;
                case AltMagicConsumptionID.BarIngredientsWithCoal:
                case AltMagicConsumptionID.BarIngredientsWithoutCoal:
                    itemSelected = this.selectedSmithingRecipe !== undefined;
                    break;
            }
            const recipeCosts = this.getCurrentRecipeCosts();
            /** Combined Recipe + Rune Costs */
            const combinedCosts = this.getCurrentRecipeRuneCosts();
            combinedCosts.addCosts(recipeCosts);
            if (!itemSelected) {
                notifyPlayer(this, getLangString('TOASTS_SELECT_ITEM'));
            } else if (!recipeCosts.checkIfOwned()) {
                notifyPlayer(this, this.noCostsMessage, 'danger');
            } else if (!combinedCosts.checkIfOwned()) {
                notifyPlayer(this, this.noRunesMessage, 'danger');
            } else {
                this.start();
            }
        }
    }
    /** Callback for when a spell is clicked */
    selectSpellOnClick(spell) {
        if (this.selectedSpell !== spell) {
            if (this.isActive && !this.stop())
                return;
            this.selectedConversionItem = undefined;
        }
        this.selectedSpell = spell;
        this.renderQueue.selectedSpellImage = true;
        this.renderQueue.selectedSpellInfo = true;
        hideElement(altMagicItemMenu);
        showElement(altMagicMenu);
        this.render();
    }
    /** Gets the items in the bank that can be selected to be consumed by a spell */
    getSpellItemSelection(spell) {
        let items = [];
        switch (spell.specialCost.type) {
            case AltMagicConsumptionID.JunkItem:
                items = this.game.fishing.junkItems.filter((item) => this.game.bank.hasUnlockedItem(item));
                break;
            case AltMagicConsumptionID.AnySuperiorGem:
                items = this.game.bank.unlockedItemArray.filter((item) => item.type === 'Superior Gem');
                break;
            case AltMagicConsumptionID.AnyNormalFood:
                this.game.cooking.actions.forEach((action) => {
                    if (this.game.bank.hasUnlockedItem(action.product))
                        items.push(action.product);
                });
                break;
            case AltMagicConsumptionID.AnyItem:
                items = this.game.bank.unlockedItemArray;
                break;
        }
        if (spell.specialCost.currency === undefined)
            return items;
        return items.filter((item) => item.sellsFor.currency === spell.specialCost.currency);
    }
    /** Callback for when the select item menu is clicked */
    openSelectItemOnClick() {
        if (this.selectedSpell === undefined)
            return;
        switch (this.selectedSpell.specialCost.type) {
            case AltMagicConsumptionID.AnyItem:
            case AltMagicConsumptionID.JunkItem:
            case AltMagicConsumptionID.AnySuperiorGem:
            case AltMagicConsumptionID.AnyNormalFood:
                altMagicItemMenu.setItemSelection(this, this.selectedSpell);
                break;
            case AltMagicConsumptionID.BarIngredientsWithCoal:
            case AltMagicConsumptionID.BarIngredientsWithoutCoal:
                altMagicItemMenu.setBarSelection(this);
                break;
            default:
                return;
        }
        hideElement(altMagicMenu);
        showElement(altMagicItemMenu);
    }
    /** Callback for when an item is clicked */
    selectItemOnClick(item) {
        if (this.game.isGolbinRaid)
            return;
        this.selectedConversionItem = item;
        this.renderQueue.selectedSpellInfo = true;
        hideElement(altMagicItemMenu);
        showElement(altMagicMenu);
        this.render();
        altMagicMenu.setSpellImage(this);
    }
    /** Callback for when a superheat recipe is clicked */
    selectBarOnClick(recipe) {
        if (this.game.isGolbinRaid)
            return;
        this.selectedSmithingRecipe = recipe;
        this.renderQueue.selectedSpellInfo = true;
        hideElement(altMagicItemMenu);
        showElement(altMagicMenu);
        this.render();
        altMagicMenu.setSpellImage(this);
    }
    /** Gets the material costs to cast superheat.
     * @param useCoal Will ignore Coal_Ore costs of the recipe if true
     */
    getSuperheatBarCosts(recipe, useCoal, costQty) {
        const costs = new Costs(this.game);
        costs.setSource(`Skill.${this.id}.AltMagic.${this.activeSpell.id}`);
        recipe.itemCosts.forEach(({
            item,
            quantity
        }) => {
            if (item.id === "melvorD:Coal_Ore" /* ItemIDs.Coal_Ore */ && !useCoal)
                return;
            costs.addItem(item, quantity * costQty);
        });
        recipe.currencyCosts.forEach(({
            currency,
            quantity
        }) => {
            costs.addCurrency(currency, quantity * costQty);
        });
        return costs;
    }
    /** Gets the rune costs required to cast the currently selected spell */
    getCurrentRecipeRuneCosts() {
        const costs = new Costs(this.game);
        costs.setSource(`Skill.${this.id}.AltMagic.${this.activeSpell.id}`);
        if (this.selectedSpell !== undefined) {
            this.game.combat.player.getRuneCosts(this.selectedSpell).forEach(({
                item,
                quantity
            }) => {
                costs.addItem(item, quantity);
            });
        }
        return costs;
    }
    getCurrentRecipeCosts() {
        const costs = new Costs(this.game);
        if (this.selectedSpell !== undefined) {
            costs.setSource(`Skill.${this.id}.AltMagic.${this.selectedSpell.id}`);
            switch (this.selectedSpell.specialCost.type) {
                case AltMagicConsumptionID.AnyItem:
                case AltMagicConsumptionID.JunkItem:
                case AltMagicConsumptionID.AnySuperiorGem:
                case AltMagicConsumptionID.AnyNormalFood:
                    if (this.selectedConversionItem !== undefined)
                        costs.addItem(this.selectedConversionItem, this.selectedSpell.specialCost.quantity);
                    break;
                case AltMagicConsumptionID.BarIngredientsWithCoal:
                    if (this.selectedSmithingRecipe !== undefined)
                        return this.getSuperheatBarCosts(this.selectedSmithingRecipe, true, this.selectedSpell.specialCost.quantity);
                    break;
                case AltMagicConsumptionID.BarIngredientsWithoutCoal:
                    if (this.selectedSmithingRecipe !== undefined)
                        return this.getSuperheatBarCosts(this.selectedSmithingRecipe, false, this.selectedSpell.specialCost.quantity);
                    break;
                case AltMagicConsumptionID.None:
                    break;
            }
            // Add Fixed Item costs
            this.selectedSpell.fixedItemCosts.forEach(({
                item,
                quantity
            }) => {
                costs.addItem(item, quantity);
            });
        }
        return costs;
    }
    getCurrentRecipeBaseProducts() {
        const products = {
            items: [],
            currencies: [],
        };
        if (this.selectedSpell === undefined)
            return products;
        switch (this.selectedSpell.produces) {
            case AltMagicProductionID.Bar:
                if (this.selectedSmithingRecipe !== undefined)
                    products.items.push({
                        item: this.selectedSmithingRecipe.product,
                        quantity: this.selectedSpell.productionRatio,
                    });
                break;
            case AltMagicProductionID.GP:
                if (this.selectedConversionItem !== undefined) {
                    products.currencies.push({
                        currency: this.game.gp,
                        quantity: this.getAlchemyGP(this.selectedConversionItem, this.selectedSpell.productionRatio),
                    });
                }
                break;
            case AltMagicProductionID.PerfectFood:
                {
                    const recipe = this.game.cooking.actions.find((recipe) => recipe.product === this.selectedConversionItem);
                    if (recipe === undefined)
                        throw new Error('Recipe for food not found.');
                    products.items.push({
                        item: recipe.perfectItem,
                        quantity: this.selectedSpell.productionRatio,
                    });
                }
                break;
            case AltMagicProductionID.RandomGem:
            case AltMagicProductionID.RandomSuperiorGem:
            case AltMagicProductionID.RandomShards:
            case AltMagicProductionID.MagicXP:
            case AltMagicProductionID.AbyssalMagicXP:
                break;
            default:
                products.items.push({
                    item: this.selectedSpell.produces,
                    quantity: this.selectedSpell.productionRatio,
                });
                break;
        }
        return products;
    }
    getPreservationChance(action) {
        // Set to zero as it is not posible to preserve items in alt. magic
        return 0;
    }
    getPreservationSources(action) {
        return [];
    }
    getXPModifier(masteryAction) {
        let modifier = super.getXPModifier(masteryAction);
        if (!this.game.combat.isActive) {
            modifier += this.game.modifiers.altMagicSkillXP + this.game.modifiers.nonCombatSkillXP;
        }
        return modifier;
    }
    _buildXPSources(action) {
        const builder = super._buildXPSources(action);
        if (action !== undefined) {
            builder.addSources("melvorD:altMagicSkillXP" /* ModifierIDs.altMagicSkillXP */ );
            builder.addSources("melvorD:nonCombatSkillXP" /* ModifierIDs.nonCombatSkillXP */ );
        }
        return builder;
    }
    recordCostConsumptionStats(costs) {
        super.recordCostConsumptionStats(costs);
        costs.recordBulkItemStat(this.game.stats.Magic, AltMagicStats.ItemsUsed);
        costs.recordIndividualItemStat(ItemStats.TimesTransformed);
    }
    /** Left as void as it is not possible to preserve items in alt. magic */
    recordCostPreservationStats(costs) {}
    /** Returns the modified GP to add when casting alchemy spells */
    getAlchemyGP(item, conversionRatio) {
        conversionRatio += this.game.modifiers.gpFromItemAlchemy;
        let gpToAdd = item.sellsFor.quantity * conversionRatio;
        gpToAdd = this.modifyCurrencyReward(this.game.gp, gpToAdd);
        gpToAdd = Math.max(1, gpToAdd);
        return gpToAdd;
    }
    get selectSpellTotalBaseXP() {
        if (this.selectedSpell === undefined)
            return 0;
        let xp = this.selectedSpell.baseExperience;
        if (this.selectedSpell.produces === AltMagicProductionID.MagicXP && this.selectedConversionItem !== undefined) {
            xp += this.selectedConversionItem.sellsFor.quantity * 0.03;
        }
        return xp;
    }
    get selectSpellTotalBaseAbyssalXP() {
        if (this.selectedSpell === undefined)
            return 0;
        let xp = this.selectedSpell.baseAbyssalExperience;
        if (this.selectedSpell.produces === AltMagicProductionID.AbyssalMagicXP &&
            this.selectedConversionItem !== undefined) {
            xp += this.selectedConversionItem.sellsFor.quantity * 0.03;
        }
        return xp;
    }
    /** Performs the main action for Alt. Magic, stopping if required resources or runes are not met */
    action() {
        // Overridden action to implement seperate rune costs
        const recipeCosts = this.getCurrentRecipeCosts();
        const runeCosts = this.getCurrentRecipeRuneCosts();
        const recipePlusRuneCosts = recipeCosts.clone();
        recipePlusRuneCosts.addCosts(runeCosts);
        if (!recipeCosts.checkIfOwned()) {
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, this.noCostsMessage, 'danger']
            });
            this.stop();
            return;
        } else if (!recipePlusRuneCosts.checkIfOwned()) {
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, this.noRunesMessage, 'danger']
            });
            this.stop();
            return;
        }
        this.preAction();
        recipeCosts.consumeCosts();
        this.recordCostConsumptionStats(recipeCosts);
        const runeConsumptionEvent = new RuneConsumptionEvent(runeCosts.getItemQuantityArray());
        if (!rollPercentage(this.runePreservationChance)) {
            runeCosts.consumeCosts();
            runeCosts.recordBulkItemStat(this.game.stats.Magic, AltMagicStats.RunesUsed);
            runeConsumptionEvent.preserved = false;
        }
        this._events.emit('runesUsed', runeConsumptionEvent);
        const continueSkill = this.addActionRewards();
        this.postAction();
        const nextCosts = this.getCurrentRecipeCosts();
        const combinedNextCosts = this.getCurrentRecipeRuneCosts();
        combinedNextCosts.addCosts(nextCosts);
        if (combinedNextCosts.checkIfOwned() && continueSkill) {
            this.startActionTimer();
        } else {
            if (!nextCosts.checkIfOwned())
                this.game.combat.notifications.add({
                    type: 'Player',
                    args: [this, this.noCostsMessage, 'danger']
                });
            else {
                this.game.combat.notifications.add({
                    type: 'Player',
                    args: [this, this.noRunesMessage, 'danger']
                });
            }
            this.stop();
        }
    }
    get selectedSpellDoublingChance() {
        return this.getDoublingChance();
    }
    preAction() {}
    get actionRewards() {
        const spell = this.activeSpell;
        const rewards = new Rewards(this.game);
        rewards.setActionInterval(this.actionInterval);
        const actionEvent = new AltMagicActionEvent(this, spell, this.game.settings.useCombinationRunes);
        // Primary item reward
        let rewardQty = spell.productionRatio;
        let rewardItem = undefined;
        // Determine Item Rewards and Reward Quantities
        switch (spell.produces) {
            case AltMagicProductionID.GP:
                if (this.selectedConversionItem === undefined)
                    throw new Error('Error getting Alt. Magic rewards, no item is selected.');
                rewardQty = this.getAlchemyGP(this.selectedConversionItem, spell.productionRatio);
                break;
            case AltMagicProductionID.Bar:
                if (this.selectedSmithingRecipe === undefined)
                    throw new Error('Error getting Alt. Magic rewards, no smithing recipe is selected.');
                rewardItem = this.selectedSmithingRecipe.product;
                break;
            case AltMagicProductionID.RandomGem:
                rewardItem = this.game.randomGemTable.getDrop().item;
                break;
            case AltMagicProductionID.RandomSuperiorGem:
                rewardItem = this.game.randomSuperiorGemTable.getDrop().item;
                break;
            case AltMagicProductionID.PerfectFood:
                {
                    const recipe = this.game.cooking.actions.find((recipe) => recipe.product === this.selectedConversionItem);
                    if (recipe === undefined)
                        throw new Error('Error getting Alt. Magic rewards, no cooking recipe exists for selected item.');
                    rewardItem = recipe.perfectItem;
                }
                break;
            case AltMagicProductionID.RandomShards:
                if (this.selectedConversionItem === undefined)
                    throw new Error('Error getting Alt. Magic rewards, no item is selected.');
                rewardItem = this.randomShardTable.getDrop().item;
                rewardQty = Math.max(1, Math.floor((2 * this.selectedConversionItem.sellsFor.quantity * 2) / rewardItem.sellsFor.quantity));
                break;
            case AltMagicProductionID.MagicXP:
            case AltMagicProductionID.AbyssalMagicXP:
                if (this.selectedConversionItem === undefined)
                    throw new Error('Error getting Alt. Magic rewards, no item is selected.');
                rewardQty = this.selectedConversionItem.sellsFor.quantity * 0.03;
                break;
            default:
                rewardItem = spell.produces;
                break;
        }
        // Add Rewards and Track Stats
        if (rewardItem !== undefined) {
            // Apply Item Doubling + Other Quantity Bonuses
            if (rollPercentage(this.selectedSpellDoublingChance))
                rewardQty *= 2;
            if (rewardItem.id === "melvorF:Holy_Dust" /* ItemIDs.Holy_Dust */ )
                rewardQty += this.game.modifiers.flatAdditionalHolyDustFromBlessedOffering;
            rewards.addItem(rewardItem, rewardQty);
            if (rewardItem instanceof BoneItem)
                this.game.stats.Magic.add(AltMagicStats.BonesMade, rewardQty);
        }
        switch (spell.produces) {
            case AltMagicProductionID.Bar:
                this.game.stats.Magic.add(AltMagicStats.BarsMade, rewardQty);
                break;
            case AltMagicProductionID.GP:
                rewards.addGP(rewardQty);
                this.game.telemetry.createGPAdjustedEvent(rewardQty, this.game.gp.amount, `Skill.${this.id}.AltMagic`);
                break;
            case AltMagicProductionID.RandomGem:
                this.game.stats.Magic.add(AltMagicStats.GemsMade, rewardQty);
                break;
            case AltMagicProductionID.MagicXP:
                rewards.addXP(this, rewardQty, spell);
                break;
            case AltMagicProductionID.AbyssalMagicXP:
                rewards.addAbyssalXP(this, rewardQty, spell);
                break;
        }
        actionEvent.productQuantity = rewardQty;
        // Experience Reward
        rewards.addXP(this, spell.baseExperience, spell);
        // Common Rewards Sans the ones Alt.Magic is exempt from
        this.rollForRareDrops(this.actionLevel, rewards, spell);
        this.rollForPets(this.currentActionInterval, spell);
        eventManager.rollForEventRewards(this.actionInterval, this, rewards);
        this.game.summoning.rollMarksForSkill(this, this.currentActionInterval, spell.realm);
        actionEvent.interval = this.currentActionInterval;
        this._events.emit('action', actionEvent);
        return rewards;
    }
    postAction() {
        this.game.stats.Magic.inc(AltMagicStats.Actions);
        this.game.stats.Magic.add(AltMagicStats.TimeSpent, this.currentActionInterval);
        this.renderQueue.quantities = true;
    }
    onLoad() {
        super.onLoad();
        this.renderQueue.selectedSpellImage = true;
        if (this.selectedSpell !== undefined)
            this.renderQueue.selectedSpellInfo = true;
        this.renderQueue.selectionTab = true;
        if (this.isActive) {
            this.renderQueue.progressBar = true;
        }
        this.render();
        altMagicMenu.setCastCallback(this);
    }
    /** Rendering update when the use combination runes setting is changed */
    onComboRunesChange() {
        this.renderQueue.selectedSpellInfo = true;
        this.render();
    }
    onPageChange() {
        this.renderQueue.quantities = true;
        super.onPageChange();
    }
    queueBankQuantityRender(item) {
        this.renderQueue.quantities = true;
    }
    onAnyLevelUp() {
        super.onAnyLevelUp();
        this.game.combat.computeAllStats();
        this.renderQueue.selectionTab = true;
    }
    onAncientRelicUnlock() {
        super.onAncientRelicUnlock();
        if (this.selectedSpell !== undefined)
            this.renderQueue.selectedSpellInfo = true;
    }
    getErrorLog() {
        var _a, _b, _c;
        return `${super.getErrorLog()}
Selected Spell ID: ${(_a = this.selectedSpell) === null || _a === void 0 ? void 0 : _a.id}
Selected Smithing Recipe: ${(_b = this.selectedSmithingRecipe) === null || _b === void 0 ? void 0 : _b.id}
Selected Conversion Item ID: ${(_c = this.selectedConversionItem) === null || _c === void 0 ? void 0 : _c.id}`;
    }
    onModifierChange() {
        super.onModifierChange();
        this.renderQueue.selectedSpellInfo = true;
    }
    onEquipmentChange() {
        this.renderQueue.selectedSpellInfo = true;
    }
    render() {
        super.render();
        this.renderSelectedSpellImage();
        this.renderSelectedSpellInfo();
        this.renderQuantities();
        this.renderSelectionTab();
        this.renderProgressBar();
    }
    renderProgressBar() {
        if (!this.renderQueue.progressBar)
            return;
        altMagicMenu.renderProgress(this, this.actionTimer);
        this.renderQueue.progressBar = false;
    }
    renderSelectedSpellImage() {
        if (!this.renderQueue.selectedSpellImage)
            return;
        if (this.selectedSpell === undefined) {
            altMagicMenu.unsetSpell();
        } else {
            altMagicMenu.setSpell(this, this.selectedSpell);
        }
        this.renderQueue.selectedSpellImage = false;
    }
    renderSelectedSpellInfo() {
        if (!this.renderQueue.selectedSpellInfo)
            return;
        if (this.selectedSpell !== undefined) {
            switch (this.selectedSpell.specialCost.type) {
                case AltMagicConsumptionID.AnyItem:
                case AltMagicConsumptionID.JunkItem:
                case AltMagicConsumptionID.AnySuperiorGem:
                case AltMagicConsumptionID.AnyNormalFood:
                    if (this.selectedConversionItem !== undefined) {
                        altMagicMenu.setSpellQuantities(this, this.game);
                    } else {
                        altMagicMenu.resetSpellQuantities();
                    }
                    break;
                default:
                    altMagicMenu.setSpellQuantities(this, this.game);
                    break;
            }
            altMagicMenu.updateRates(this);
        }
        this.renderQueue.selectedSpellInfo = false;
    }
    renderQuantities() {
        if (!this.renderQueue.quantities)
            return;
        altMagicMenu.updateQuantities(this.game);
        this.renderQueue.quantities = false;
    }
    renderSelectionTab() {
        if (!this.renderQueue.selectionTab)
            return;
        altMagicSelection.updateRecipes(this);
        this.renderQueue.selectionTab = false;
    }
    resetActionState() {
        super.resetActionState();
        this.selectedSpell = undefined;
        this.selectedConversionItem = undefined;
        this.selectedSmithingRecipe = undefined;
    }
    encode(writer) {
        super.encode(writer);
        writer.writeBoolean(this.selectedSpell !== undefined);
        if (this.selectedSpell !== undefined)
            writer.writeNamespacedObject(this.selectedSpell);
        writer.writeBoolean(this.selectedConversionItem !== undefined);
        if (this.selectedConversionItem !== undefined)
            writer.writeNamespacedObject(this.selectedConversionItem);
        writer.writeBoolean(this.selectedSmithingRecipe !== undefined);
        if (this.selectedSmithingRecipe !== undefined)
            writer.writeNamespacedObject(this.selectedSmithingRecipe);
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        if (reader.getBoolean()) {
            const spell = reader.getNamespacedObject(this.actions);
            if (typeof spell === 'string')
                this.shouldResetAction = true;
            else
                this.selectedSpell = spell;
        }
        if (reader.getBoolean()) {
            const conversionItem = reader.getNamespacedObject(this.game.items);
            if (typeof conversionItem === 'string')
                this.shouldResetAction = true;
            else
                this.selectedConversionItem = conversionItem;
        }
        if (reader.getBoolean()) {
            const selectedRecipe = reader.getNamespacedObject(this.game.smithing.actions);
            if (typeof selectedRecipe === 'string')
                this.shouldResetAction = true;
            else
                this.selectedSmithingRecipe = selectedRecipe;
        }
        if (this.shouldResetAction)
            this.resetActionState();
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        const selectedSpellID = reader.getNumber();
        if (selectedSpellID >= 0) {
            const spell = this.actions.getObjectByID(idMap.magicAltSpells[selectedSpellID]);
            if (spell === undefined)
                this.shouldResetAction = true;
            else
                this.selectedSpell = spell;
        }
        const selectedConversionItemID = reader.getNumber();
        if (selectedConversionItemID >= 0) {
            const item = this.game.items.getObjectByID(idMap.items[selectedConversionItemID]);
            if (item === undefined)
                this.shouldResetAction = true;
            else
                this.selectedConversionItem = item;
        }
        const smithingRecipeID = reader.getNumber();
        if (smithingRecipeID >= 0) {
            const recipe = this.game.smithing.actions.getObjectByID(idMap.smithingRecipes[smithingRecipeID]);
            if (recipe === undefined)
                this.shouldResetAction = true;
            else
                this.selectedSmithingRecipe = recipe;
        }
        if (this.shouldResetAction)
            this.resetActionState();
    }
    getActionIDFromOldID(oldActionID, idMap) {
        return idMap.magicAltSpells[oldActionID];
    }
    getRegistry(type) {
        switch (type) {
            case ScopeSourceType.Action:
                return this.actions;
            case ScopeSourceType.Subcategory:
                return this.spellCategories;
        }
        return undefined;
    }
    getPkgObjects(pkg, type) {
        var _a, _b;
        const skillData = (_b = (_a = pkg.data) === null || _a === void 0 ? void 0 : _a.skillData) === null || _b === void 0 ? void 0 : _b.find(({
            skillID
        }) => skillID === this.id);
        if (skillData !== undefined) {
            switch (type) {
                case ScopeSourceType.Action:
                    return skillData.altSpells;
                case ScopeSourceType.Subcategory:
                    return skillData.spellCategories;
            }
        }
    }
    setFromOldOffline(offline, idMap) {
        const spellID = offline.action[0];
        const spell = this.actions.getObjectByID(idMap.magicAltSpells[spellID]);
        if (spell === undefined)
            throw new Error(unregisteredMessage('AltMagicSpell'));
        this.selectSpellOnClick(spell);
        switch (spell.specialCost.type) {
            case AltMagicConsumptionID.JunkItem:
            case AltMagicConsumptionID.AnyItem:
                {
                    const item = this.game.items.getObjectByID(idMap.items[offline.action[1][1]]);
                    if (item === undefined)
                        throw new Error(unregisteredMessage('Item'));
                    this.selectItemOnClick(item);
                }
                break;
            case AltMagicConsumptionID.BarIngredientsWithCoal:
            case AltMagicConsumptionID.BarIngredientsWithoutCoal:
                {
                    const barID = idMap.items[offline.action[1][0]];
                    const bar = this.smithingBarRecipes.find((recipe) => recipe.product.id === barID);
                    if (bar !== undefined)
                        this.selectBarOnClick(bar);
                }
                break;
        }
        this.castButtonOnClick();
    }
    testTranslations() {
        super.testTranslations();
        this.actions.forEach((action) => {
            action.name;
            action.description;
        });
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        this.actions.forEach((action) => {
            switch (action.produces) {
                case AltMagicProductionID.Bar:
                    // Excluded since based on smithing recipes
                    break;
                case AltMagicProductionID.RandomGem:
                    this.game.randomGemTable.sortedDropsArray.forEach((drop) => obtainable.add(drop.item));
                    break;
                case AltMagicProductionID.RandomSuperiorGem:
                    this.game.randomSuperiorGemTable.sortedDropsArray.forEach((drop) => obtainable.add(drop.item));
                    break;
                case AltMagicProductionID.PerfectFood:
                    // Excluded since based on cooking recipes
                    break;
                case AltMagicProductionID.RandomShards:
                    this.randomShardTable.sortedDropsArray.forEach((drop) => obtainable.add(drop.item));
                    break;
                case AltMagicProductionID.GP:
                case AltMagicProductionID.MagicXP:
                case AltMagicProductionID.AbyssalMagicXP:
                    break;
                default:
                    obtainable.add(action.produces);
            }
        });
        return obtainable;
    }
}
class AltMagicRenderQueue extends GatheringSkillRenderQueue {
    constructor() {
        super(...arguments);
        /** Updates the required and produced item quantities */
        this.quantities = false;
        /** Updates the currently selected spell */
        this.selectedSpellImage = false;
        /** Updates the unlocks and tooltips in the spell selection tab */
        this.selectionTab = false;
        /** Updates, the item costs/products for the spell */
        this.selectedSpellInfo = false;
    }
}
//# sourceMappingURL=altMagic.js.map
checkFileVersion('?12097')