const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');

export class ConstructionFixture extends RealmedObject {
    constructor(namespace, data, game, construction) {
        super(namespace, data, game);
        this.currentTier = 0;
        this.progress = 0;
        this.UIcost = null;
        this.stepCost = null;
        try {
            this._media = data.media;
            if (data.recipes == undefined)
                throw new Error('No tiers specified in data.');
            var i = 0;
            this.recipes = construction.actions.getArrayFromIds(data.recipes);
            this.recipes.forEach((recipe) => {
                i += 1;
                if (recipe.fixture !== undefined)
                    throw new Error(`ConstructionFixtureRecipes with id: ${recipe.id} is already set to a ConstructionFixture.`);
                recipe.fixture = this;
                recipe.tier = i;
            });
        } catch (e) {
            throw new DataConstructionError(ConstructionFixture.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            this._media_folder = data.media;
        } catch (e) {
            throw new DataModificationError(ConstructionFixture.name, e, this.id);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get name() {
        return getRielkLangString(`CONSTRUCTION_FIXTURE_NAME_ ${this.localID}`);
    }
    getRecipe(tier) {
        return this.recipes[tier - 1];
    }
    get currentRecipe() {
        if (this.currentTier >= this.maxTier)
            return;
        return this.getRecipe(this.currentTier + 1);
    }
    get maxTier() {
        return this.recipes.length;
    }
    get percentProgress() {
        const recipe = this.currentRecipe;
        if (recipe == undefined)
            return;
        return (this.progress / recipe.actionCost) * 100;
    }
    get level() {
        return this.recipes[0].level;
    }
    get abyssalLevel() {
        return this.recipes[0].abyssalLevel;
    }

    getCurrentBuildRecipeCosts(construction, efficiency = 0) {
        if (this.currentTier >= this.maxTier) {return;}
        const prevRatio = this.progress / this.currentRecipe.actionCost;
        const costMult = efficiency ? construction.getEfficiencyCostMultiplier(this.currentRecipe) : 1;
        const nextRatio = Math.min(1, (this.progress + costMult) / this.currentRecipe.actionCost);
        this.stepCost = construction.getRecipeCosts(this.currentRecipe);
        const actionItems = new Map();
        const actionCurrencies = new Map();
        const reduction = construction.game.modifiers.getValue("rielkConstruction:constructionActionsToUpgrade", this.currentRecipe) / 100;
        const remainingitems = [];
        this.stepCost._items.forEach((total, item) => {
            const reducedtotal = Math.ceil(total * (1 + reduction));
            const prev = Math.floor(reducedtotal * prevRatio);
            const next = Math.floor(reducedtotal * nextRatio);
            const delta = next - prev;
            const remaining = Math.max(0 , (reducedtotal - prev));
            remainingitems.push(remaining);
            if (delta > 0) actionItems.set(item, delta);
        });
        const remainingcurrencies = [];
        this.stepCost._currencies.forEach((total, currency) => {
            const reducedtotal = Math.ceil(total * (1 + reduction));
            const prev = Math.floor(reducedtotal * prevRatio);
            const next = Math.floor(reducedtotal * nextRatio);
            const delta = next - prev;
            const remaining = Math.max(0 , (reducedtotal - prev));
            remainingcurrencies.push(remaining);
            if (delta > 0) actionCurrencies.set(currency, delta);
        });

        this.stepCost._items = actionItems;
        this.stepCost._currencies = actionCurrencies;
        if (efficiency && !this.stepCost.checkIfOwned()) {
            return this.getCurrentBuildRecipeCosts(construction, false);
        }

        this.UIcost = {
            itemCosts: this.currentRecipe.itemCosts.map((fullItem, i) => {
                const delta = Array.from(actionItems.entries())
                    .find(([i, _]) => i === fullItem.item) ?? [null, 0];

                return {
                    ...fullItem,
                    quantity: remainingitems[i],
                    smallquant: delta[1]
                };
            }),
            currencyCosts: Array.from(this.currentRecipe.currencyCosts.map((fullCurrency, i) => {
                const delta = Array.from(actionCurrencies.entries())
                    .find(([currency, _]) => currency === fullCurrency.currency) ?? [null, 0];

                return {
                    ...fullCurrency,
                    quantity: remainingcurrencies[i],
                    smallquant: delta[1]
                };
            })),
        };
    }

    upgrade(construction) {
        this.currentTier++;
        this.progress = 0;

        construction.computeProvidedStats(true);
        const finishNotification = {
            ...game.notifications.genericNotificationData,
            media: this.media,
            text: templateRielkLangString("TOAST_FIXTURE_COMPLETE", { fixtureName: this.name }),
            quantity: 0,
            isImportant: true,  // makes it persistent
            isError: false
        };
        const fixtureNotification = game.notifications.newAddSuccessNotification(`FixtureComplete-${this.id}`);
        game.notifications.addNotification(fixtureNotification, finishNotification);
    }
    get providedStats() {
        return this.recipes.filter(r => r.tier <= this.currentTier).map(r => r.stats);
    }
    addProvidedStatsTo(statProvider) {
        this.providedStats.forEach((stat) => statProvider.addStatObject(this, stat));
    }
    onLoad() {
        this.recipes.forEach(recipe => recipe.onLoad());
    }
}
