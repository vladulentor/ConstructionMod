const { loadModule } = mod.getContext(import.meta);

const { ConstructionModifiers } = await loadModule('src/construction/constructionModifier.mjs');
const { templateRielkLangString } = await loadModule('src/language/translationManager.mjs');
const { EffectRegistry } = await loadModule('src/patches/skillPatches/patchRegistry.mjs');

export class ConstructionFixtureRecipes extends CategorizedArtisanRecipe {
    constructor(namespace, data, game, skill) {
        super(namespace, data, game, skill);
        this.hasMastery = false;
        try {
            this._baseActionCost = data.baseActionCost;
            this.modifiers = new ConstructionModifiers(data, game, `${this.id}`);
            if (data.grantItem != undefined)
                this.grantItems = game.items.getQuantities(data.grantItem);
            if (data.changeFunc != undefined)
                if (data.changeFunc !== undefined)
                    this.changeFunc = Array.isArray(data.changeFunc)
                        ? data.changeFunc
                        : [data.changeFunc];
            if (data.shinyMods != undefined)
                this.shinyMods = data.shinyMods;
            if (data.order != undefined)
                this.order = data.order;

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
            if (data.changeFunc != undefined)
                this.changeFunc = data.changeFunc;

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
        return Math.floor(this._baseActionCost * (1 + modifier));
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
        if (this.isUnlocked) {
            if (this.changeFunc) {
                this.callChangeFunc();
            }
        }
    }


    callChangeFunc() {
        this.changeFunc.forEach(funcName => {
            const effectFunc = EffectRegistry[funcName];
            if (typeof effectFunc === "function") {
                effectFunc.call(this);
            } else {
                console.warn(`Effect not found in registry, going insane: ${funcName}`);
            }
        });
    }
    makeProgress(prog) {
        for (let a = 0; a < Math.floor(prog); a++)
        {
            this.fixture.progress++;
            if (this.fixture.progress >= this.actionCost) {
                this.fixture.upgrade(this.skill);

                this.skill.addMasteryProgress(this.fixture.currentTier);

                if (this.grantItems != undefined)
                    this.grantItems.forEach(iq => game.bank.addItem(iq.item, iq.quantity, true, true, true));
                if (this.changeFunc)
                    this.callChangeFunc();
                if (!document.querySelector('rielk-construction-upgrades-panel')?.classList.contains('d-none'))
                    this.skill.ui.showFixtureUnlocks(this.fixture.room, this.fixture, this.skill);
                this.fixture.getCurrentBuildRecipeCosts(game.construction);
                if (this.fixture.currentTier != this.fixture.maxTier)
                    this.skill.renderQueue.renderfixtureItemUpdates = true;
                this.skill.renderQueue.menu = true;
                return false;

            }

        }
        this.fixture.getCurrentBuildRecipeCosts(game.construction);
        this.skill.renderQueue.renderSpecificfixtureItemUpdate = true;
        this.skill.renderQueue.renderfixtureItemUpdates = true;
        return true;
    }
}
