const { loadModule } = mod.getContext(import.meta);

const { ConstructionModifiers } = await loadModule('src/construction/constructionModifier.mjs');
const { templateRielkLangString } = await loadModule('src/language/translationManager.mjs');

export class ConstructionFixtureRecipes extends CategorizedArtisanRecipe {
    constructor(namespace, data, game, skill) {
        super(namespace, data, game, skill);
        this.hasMastery = false;
        try {
            this._baseActionCost = data.baseActionCost;
            this.modifiers = new ConstructionModifiers(data, game, `${this.id}`);
            if (data.grantItem != undefined)
                this.grantItems = game.items.getQuantities(data.grantItem);
            if (data.unlockPlot != undefined)
                this.unlockPlot = game.farming.plots.getObjectSafe(data.unlockPlot)
        } catch (e) {
            throw new DataConstructionError(ConstructionFixtureRecipes.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            this._baseActionCost = data.baseActionCost;
            this.modifiers.applyDataModification(data, game);
            if (data.grantItem != undefined)
                this.grantItems = game.items.getQuantities(data.grantItem);
            if (data.unlockPlot != undefined)
                this.unlockPlot = game.farming.plots.getObjectSafe(data.unlockPlot)
        }
        catch (e) {
            throw new DataModificationError(ConstructionFixtureRecipes.name, e, this.id);
        }
    }
    get media() {
        return this.fixture.media;
    }
    get name() {
        return templateRielkLangString('CONSTRUCTION_FIXTURE_OF_TIER', {
            fixtureName: this.fixture.name,
            tier: this.tier
        });
    }
    get actionCost() {
        const query = this.skill.getActionModifierQuery(this);
        const modifier = this.skill.game.modifiers.getValue("rielkConstruction:constructionActionsToUpgrade", query) / 100;
        return this._baseActionCost * (1 + modifier);
    }
    get isUnlocked() {
        return this.fixture.currentTier >= this.tier;
    }
    get stats() {
        return this.modifiers._stats;
    }
    get doesGrantItems() {
        return this.grantItems != undefined && this.grantItems.length > 0;
    }

    onLoad() {
        if (this.isUnlocked)
            this.doUnlockPlot();
    }

    doUnlockPlot() {
        if (this.unlockPlot != undefined && this.unlockPlot.state == 0) {
            this.unlockPlot.state = 1;
            return true;
        }
        return false;
    }

    makeProgress() {
        this.fixture.progress++;
        this.skill.renderQueue.menu = true;
        if (this.fixture.progress >= this.actionCost) {
            this.fixture.upgrade(this.skill);
            if (this.grantItems != undefined)
                this.grantItems.forEach(iq => game.bank.addItem(iq.item, iq.quantity, true, true, true));
            if (this.doUnlockPlot())
                game.farming.showPlotsInCategory(this.unlockPlot.category);
            return false;
        }
        return true;
    }
}
