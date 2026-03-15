const { loadModule, loadTemplates, loadStylesheet } = mod.getContext(import.meta);

const { Construction } = await loadModule('src/construction/construction.mjs');
const { patchTranslations } = await loadModule('src/language/translationManager.mjs');
const { patchGameEventSystem } = await loadModule('src/construction/gameEvents.mjs');

const { patchSkillsBeforeDataReg, patchSkillsAfterDataReg } = await loadModule('src/patches/skillPatches/skillPatchesCaller.mjs');
const { patchMiscBeforeDataReg, patchMiscAfterDataReg } = await loadModule('src/patches/miscPatches/miscPatchesCaller.mjs');
const { patchMods } = await loadModule('src/patches/modPatches/modPatchesCaller.mjs');
const { patchAoDbeforedatareg, patchAoDafterdatareg } = await loadModule('src/patches/skillPatches/atlasofdiscovery/patchaod.mjs');



export async function setup(ctx) {
    setup = new Setup(ctx);
    await setup.loadInterfaceElements();

    game.construction = game.registerSkill(game.registeredNamespaces.getNamespace('rielkConstruction'), Construction);
    await setup.applyPatches();
    await setup.loadData();
    await setup.applyOtherPatches();
    await setup.loadDataFlush();
    await setup.modCompatibility(ctx);
    await setup.lastChanges(ctx);
}


class Setup {
    constructor(ctx) {
        this.ctx = ctx;
        this.modList = [];
        this.aod = cloudManager.hasAoDEntitlementAndIsEnabled;
        this.toth = cloudManager.hasTotHEntitlementAndIsEnabled;
    }

    async loadInterfaceElements() {
        await loadStylesheet('src/interface/construction-styles.css');

        await loadTemplates('src/interface/templates/construction.html');
        await loadModule('src/interface/elements/constructionRemainingIcons.mjs');
        await loadModule('src/interface/elements/constructionEfficiencyIconTooltipElement.mjs');
        await loadModule('src/interface/elements/constructionEfficiencyIconElement.mjs');
        await loadModule('src/interface/elements/constructionArtisanMenu.mjs');
        await loadModule('src/interface/elements/constructionFixtureNavElement.mjs');
        await loadModule('src/interface/elements/constructionMasteryElement.mjs');
        await loadModule('src/interface/elements/constructionTierMasteryBonusElement.mjs');
        await loadModule('src/interface/elements/constructionModifierDisplayElement.mjs');
        await loadModule('src/interface/elements/constructionRecipeOptionElement.mjs');
        await loadModule('src/interface/elements/constructionRoomPanelElement.mjs');
        await loadModule('src/interface/elements/constructionUpgradesPanelElement.mjs');
        await loadModule('src/interface/elements/rielkLangStringElement.mjs');
        await loadModule('src/interface/elements/constructionWeaponMastery.mjs');
        await loadModule('src/patches/skillPatches/astrology/starConvergenceIcons.mjs');

    }

    async applyPatches() {
        patchGameEventSystem(this.ctx);
        patchTranslations(this.ctx);
        patchMiscBeforeDataReg(this.ctx);
        patchSkillsBeforeDataReg(this.ctx);
        if (this.aod) patchAoDbeforedatareg(this.ctx);

        game._events.on('offlineLoopEntered', () => game.construction.notifs = false);
        game._events.on('offlineLoopExited', () => game.construction.notifs = true);
    }
    async applyOtherPatches() {
        patchSkillsAfterDataReg(this.ctx);
        if (this.aod) patchAoDafterdatareg(this.ctx);
        patchMiscAfterDataReg(this.ctx);
    }
    async loadData() {
        await this.ctx.gameData.addPackage('src/data/data_preentry.json');
        await this.ctx.gameData.addPackage('src/data/data.json');
        if (this.aod)
            await this.ctx.gameData.addPackage('src/data/data_AoD.json');
        if (this.toth)
            await this.ctx.gameData.addPackage('src/data/data_TotH.json');

    }
    async loadDataFlush() {
        await this.ctx.gameData.addPackage('src/data/data_dummy.json');
        // The data dummy file has an important reason for existing that would take like 5+ paragraphs to explain and has to do with the way the game adds data packages.

    }
    async modCompatibility(ctx) {
        this.ctx.onModsLoaded(() => {
            this.modList = mod.manager.getLoadedModList();
            patchMods(ctx, this.modList);
        });

    }
    async lastChanges(ctx) {
        ctx.onInterfaceReady(async (ctx) => {
        });
    }
}
