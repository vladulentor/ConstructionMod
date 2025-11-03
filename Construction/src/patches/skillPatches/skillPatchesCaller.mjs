const { loadModule } = mod.getContext(import.meta);
const { patchCraftingOrder } = await loadModule('src/patches/skillPatches/crafting/patchCraftingOrder.mjs');
const { patchTreeSeedReturn } = await loadModule('src/patches/skillPatches/farming/patchTreeSeedReturn.mjs');
const { patchArrowShaftRecipes } = await loadModule ('src/patches/skillPatches/fletching/patchArrowShaftRecipes.mjs');
const { patchFletchingOrder } = await loadModule('src/patches/skillPatches/fletching/patchFletchingOrder.mjs');
const { patchThievingTargets } = await loadModule('src/patches/skillPatches/thieving/patchThievingTargets.mjs');

export function patchSkillsBeforeDataReg(ctx)
{   
        patchTreeSeedReturn(ctx);
}
export function patchSkillsAfterDataReg(ctx){
    patchCraftingOrder();
    patchFletchingOrder();
    patchArrowShaftRecipes(ctx);
        // patchThievingTargets();
        // Remember when pushing the update to also disable ignorecompletion for the boots brick pile saw and magitech, and add the boots back
    
}
