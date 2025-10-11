const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');

export class ConstructionFixture extends RealmedObject {
    constructor(namespace, data, game, construction) {
        super(namespace, data, game);
        this.currentTier = 0;
        this.progress = 0;
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
        const prevRatio = this.progress / this.currentRecipe.actionCost;        // fraction done before this action
        const costMult = efficiency ? construction.getEfficiencyCostMultiplier(this.currentRecipe) : 1;
        const nextRatio = (this.progress + costMult) / this.currentRecipe.actionCost;  // fraction done after this action
        console.groupCollapsed(`[getCurrentBuildRecipeCosts] ${this.name || 'Fixture'}`);
        console.log("Progress:", this.progress, "/", this.currentRecipe.actionCost);
        console.log("Ratios:", { prevRatio, nextRatio });

        // Get the canonical full-cost object
        const costObj = construction.getRecipeCosts(this.currentRecipe);
        console.log("Full cost (pre-split):", {
            items: Array.from(costObj._items.entries()),
            currencies: Array.from(costObj._currencies.entries())
        });

        const actionItems = new Map();
        const actionCurrencies = new Map();

        // Items
        costObj._items.forEach((total, item) => {
            const prev = Math.floor(total * prevRatio);
            const next = Math.floor(total * nextRatio);
            const delta = next - prev;
            console.log(`Item [${item.name || item}]: total=${total}, prev=${prev}, next=${next}, delta=${delta}`);
            if (delta > 0) actionItems.set(item, delta);
        });

        // Currencies
        costObj._currencies.forEach((total, currency) => {
            const prev = Math.floor(total * prevRatio);
            const next = Math.floor(total * nextRatio);
            const delta = next - prev;
            console.log(`Currency [${currency.name || currency}]: total=${total}, prev=${prev}, next=${next}, delta=${delta}`);
            if (delta > 0) actionCurrencies.set(currency, delta);
        });

        costObj._items = actionItems;
        costObj._currencies = actionCurrencies;

        console.log("Per-action cost result:", {
            items: Array.from(actionItems.entries()),
            currencies: Array.from(actionCurrencies.entries())
        });
        console.groupEnd();
        if (efficiency && !costObj.checkIfOwned()) {
            return this.getCurrentBuildRecipeCosts(construction, false);
        }

        return costObj;
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
