const { loadModule } = mod.getContext(import.meta);
const { patchMasteryElement } = await loadModule('src/patches/miscPatches/patchMasteryElement.mjs');
const { patchRenderEquipment } = await loadModule('src/patches/miscPatches/patchRenderEquipment.mjs');
const { patchEventManager } = await loadModule('src/patches/miscPatches/patchEventManager.mjs');
const { patchConditionalMod } = await loadModule('src/patches/miscPatches/patchConditionalMod.mjs');
const { patchBackground } = await loadModule('src/patches/miscPatches/patchBackground.mjs');
const { addFixtureRequirement } = await loadModule('src/patches/miscPatches/addFixtureRequirement.mjs');


export function patchMiscBeforeDataReg(ctx)
{   
        patchMasteryElement(ctx);
        patchRenderEquipment(ctx);
        patchEventManager(ctx);
        patchConditionalMod(ctx);
        patchBackground(ctx);
        addFixtureRequirement();
}
export function patchSkillsAfterDataReg(ctx){
}
