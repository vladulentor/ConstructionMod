const { loadModule, loadTemplates, loadStylesheet } = mod.getContext(import.meta);

const { Construction } = await loadModule('src/construction/construction.mjs');
const { patchTranslations } = await loadModule('src/language/translationManager.mjs');
const { patchGameEventSystem } = await loadModule('src/construction/gameEvents.mjs');
const { patchFarming } = await loadModule('src/skillPatches/farming.mjs');

export async function setup(ctx) {
    setup = new Setup(ctx);
    await setup.loadInterfaceElements();

    game.construction = game.registerSkill(game.registeredNamespaces.getNamespace('rielkConstruction'), Construction);

    await setup.applyPatches();
    await setup.loadData();
    await setup.modCompatibility(game.construction);

}


class Setup {
    constructor(ctx) {
        this.ctx = ctx;
        this.modList = [];
    }

    async loadInterfaceElements() {
        await loadStylesheet('src/interface/construction-styles.css');

        await loadTemplates('src/interface/templates/construction.html');
        
        await loadModule('src/interface/elements/constructionTierBonusElement.mjs');
        await loadModule('src/interface/elements/constructionFixtureNavElement.mjs');
        await loadModule('src/interface/elements/constructionMasteryElement.mjs');
        await loadModule('src/interface/elements/constructionTierMasteryBonusElement.mjs');
        await loadModule('src/interface/elements/constructionModifierDisplayElement.mjs');
        await loadModule('src/interface/elements/constructionRecipeOptionElement.mjs');
        await loadModule('src/interface/elements/constructionRoomPanelElement.mjs');
        await loadModule('src/interface/elements/constructionUpgradesPanelElement.mjs');
        await loadModule('src/interface/elements/rielkLangStringElement.mjs');
    }

    async applyPatches() {
        patchGameEventSystem(this.ctx);
        patchTranslations(this.ctx);
        patchFarming(this.ctx);

        this.ctx.patch(EventManager, 'loadEvents').before(() => {
            if (game.construction.isUnlocked)
                return;
            if (game.currentGamemode.startingSkills != undefined && game.currentGamemode.startingSkills.has(game.construction)) {
                game.construction.setUnlock(true);
            }
            game.construction.updateForExistingCapIncreases(game);
        });
    }

    async loadData() {
        await this.ctx.gameData.addPackage('src/data/data.json');
        if (cloudManager.hasAoDEntitlementAndIsEnabled)
            await this.ctx.gameData.addPackage('src/data/data_AoD.json');
    }

    async modCompatibility(construction) {
        console.log('onModsLoaded!');
        this.ctx.onModsLoaded(async () => {
            this.modList = mod.manager.getLoadedModList();
            if(this.modList.includes('Skill Boosts'))
                {console.log('Skill Boosts found!');
                         const { skillBoostsCompatibility } = await loadModule("src/modPatches/skillboosts.mjs");
                        skillBoostsCompatibility();
                }
        });

    }
}
