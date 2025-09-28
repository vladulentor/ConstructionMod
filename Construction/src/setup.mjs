const { loadModule, loadTemplates, loadStylesheet } = mod.getContext(import.meta);
const { Construction } = await loadModule('src/construction/construction.mjs');
const { patchTranslations } = await loadModule('src/language/translationManager.mjs');
const { patchGameEventSystem } = await loadModule('src/construction/gameEvents.mjs');
const { patchTreeSeedReturn } = await loadModule('src/skillPatches/farming/patchtreeseedreturn.mjs');
const { mergeConstructionData } = await loadModule('src/construction/mergeconstructiondata.mjs');
const { patchAoD } = await loadModule('src/skillPatches/atlasofdiscovery/patchaod.mjs');
const { patchMasteryElement } = await loadModule('src/skillPatches/patchmasteryelement.mjs');




export async function setup(ctx) {
    setup = new Setup(ctx);
    await setup.loadInterfaceElements();

    game.construction = game.registerSkill(game.registeredNamespaces.getNamespace('rielkConstruction'), Construction);

    await setup.applyPatches();
    await setup.loadData();
}

class Setup {
    constructor(ctx) {
        this.ctx = ctx;
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
        patchTreeSeedReturn(this.ctx);
        patchMasteryElement(this.ctx);
        if (cloudManager.hasAoDEntitlementAndIsEnabled) patchAoD(this.ctx);
        
        patchTranslations(this.ctx);


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
        let baseData =await this.ctx.loadData('src/data/data.json');
        if (cloudManager.hasTotHEntitlementAndIsEnabled){
        const TotHData = await this.ctx.loadData('src/data/data_TotH.json');
         baseData = mergeConstructionData(baseData, TotHData); 

    }

      if (cloudManager.hasAoDEntitlementAndIsEnabled)    {     
        const AoDData = await this.ctx.loadData('src/data/data_AoD.json');
        baseData = mergeConstructionData(baseData, AoDData);
      }
      await this.ctx.gameData.addPackage(baseData);

    }
}
