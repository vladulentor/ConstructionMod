const { loadModule } = mod.getContext(import.meta);

const { patchOverHeal } = await loadModule('src/patches/skillPatches/combat/patchOverHeal.mjs');

const { emitPassiveCook } = await loadModule('src/patches/skillPatches/cooking/emitPassiveCook.mjs');
const { perfectFoodHealing } = await loadModule('src/patches/skillPatches/cooking/perfectFoodHealing.mjs');
const { addAshOnFail } = await loadModule('src/patches/skillPatches/cooking/addAshOnFail.mjs');

const { addRoaringFire } = await loadModule('src/patches/skillPatches/firemaking/addRoaringFire.mjs');

const { addFishonTreasureRollPlusExtra } = await loadModule('src/patches/skillPatches/fishing/addFishonTreasureRoll.mjs');
const { reduceFishTimers } = await loadModule('src/patches/skillPatches/fishing/reduceFishTimers.mjs');

const { loseGPOnFishing } = await loadModule('src/patches/skillPatches/fishing/loseGPOnFishing.mjs');


const { patchCraftingOrder } = await loadModule('src/patches/skillPatches/crafting/patchCraftingOrder.mjs');

const { patchTreeSeedReturn } = await loadModule('src/patches/skillPatches/farming/patchTreeSeedReturn.mjs');

const { patchArrowShaftRecipes } = await loadModule('src/patches/skillPatches/fletching/patchArrowShaftRecipes.mjs');
const { patchFletchingOrder } = await loadModule('src/patches/skillPatches/fletching/patchFletchingOrder.mjs');

const { patchPerpetualHaste } = await loadModule('src/patches/skillPatches/shop/patchPerpetualHaste.mjs');


const { patchThievingTargets } = await loadModule('src/patches/skillPatches/thieving/patchThievingTargets.mjs');

const { nerfBearDevil } = await loadModule('src/patches/skillPatches/summoning/nerfBearDevil.mjs');







export function patchSkillsBeforeDataReg(ctx) {
        patchTreeSeedReturn(ctx);
        patchOverHeal(ctx);
        emitPassiveCook(ctx);
        addAshOnFail(ctx);
        addRoaringFire(ctx);
        perfectFoodHealing(ctx);
        addFishonTreasureRollPlusExtra(ctx);
        loseGPOnFishing(ctx);
        reduceFishTimers(ctx);
        nerfBearDevil();
}
export function patchSkillsAfterDataReg(ctx) {
        patchCraftingOrder();
        patchFletchingOrder();
        patchArrowShaftRecipes(ctx);
        patchPerpetualHaste(ctx);

        // patchThievingTargets();
        // Remember when pushing the update to also disable ignorecompletion for the boots brick pile saw and magitech, and add the boots back

}
