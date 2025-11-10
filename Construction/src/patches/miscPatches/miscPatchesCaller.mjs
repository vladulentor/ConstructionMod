const { loadModule } = mod.getContext(import.meta);
const { patchMasteryElement } = await loadModule('src/patches/miscPatches/patchMasteryElement.mjs');
const { patchRenderEquipment } = await loadModule('src/patches/miscPatches/patchRenderEquipment.mjs');
const { patchEventManager } = await loadModule('src/patches/miscPatches/patchEventManager.mjs');
const { patchConditionalMod } = await loadModule('src/patches/miscPatches/patchConditionalMod.mjs');


export function patchMiscBeforeDataReg(ctx)
{   
        patchMasteryElement(ctx);
        patchRenderEquipment(ctx);
        patchEventManager(ctx);
        patchConditionalMod(ctx);
}
export function patchSkillsAfterDataReg(ctx){
}
