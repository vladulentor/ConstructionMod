const { loadModule } = mod.getContext(import.meta);
const { patchMasteryElement } = await loadModule('src/patches/miscPatches/patchMasteryElement.mjs');
const { patchRenderEquipment } = await loadModule('src/patches/miscPatches/patchRenderEquipment.mjs');
const { patchEventManager } = await loadModule('src/patches/miscPatches/patchEventManager.mjs');


export function patchMiscBeforeDataReg(ctx)
{   
        patchMasteryElement(ctx);
        patchRenderEquipment(ctx);
        patchEventManager(ctx);
}
export function patchSkillsAfterDataReg(ctx){
}
