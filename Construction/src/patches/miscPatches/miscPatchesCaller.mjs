const { loadModule } = mod.getContext(import.meta);
const { patchMasteryElement } = await loadModule('src/patches/miscPatches/patchMasteryElement.mjs');
const { patchRenderEquipment } = await loadModule('src/patches/miscPatches/patchRenderEquipment.mjs');
const { patchEventManager } = await loadModule('src/patches/miscPatches/patchEventManager.mjs');
const { patchConditionalMod } = await loadModule('src/patches/miscPatches/patchConditionalMod.mjs');
const { patchBackground } = await loadModule('src/patches/miscPatches/patchBackground.mjs');
const { addFixtureRequirement } = await loadModule('src/patches/miscPatches/addFixtureRequirement.mjs');
const { addReadables } = await loadModule('src/patches/miscPatches/addReadables.mjs');
const { addFixtureGoalType } = await loadModule('src/patches/miscPatches/addFixtureGoalType.mjs');


export function patchMiscBeforeDataReg(ctx) {
        patchMasteryElement(ctx);
        patchRenderEquipment(ctx);
        patchEventManager(ctx);
        patchBackground(ctx);
        addReadables(ctx);
        patchConditionalMod(ctx);
        addFixtureGoalType();
        addFixtureRequirement();
}
export function patchMiscAfterDataReg(ctx) {


}
