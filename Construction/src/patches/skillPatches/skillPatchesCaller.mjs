const { loadModule } = mod.getContext(import.meta);

const { addHiddenLevelsToAllsSills } = await loadModule('src/patches/skillPatches/combat/addHiddenLevelsToAllsSills.mjs');

const { addRuneEssenceCtx } = await loadModule('src/patches/skillPatches/astrology/addRuneEssence.mjs');
const { addConstellationLevels } = await loadModule('src/patches/skillPatches/astrology/addConstellationLevels.mjs');
const { addStarConvergence } = await loadModule('src/patches/skillPatches/astrology/addStarConvergence.mjs');




const { patchOverHeal } = await loadModule('src/patches/skillPatches/combat/patchOverHeal.mjs');
const { patchMagicUsageCheck } = await loadModule('src/patches/skillPatches/combat/patchMagicUsageCheck.mjs');
const { addMagicShield } = await loadModule('src/patches/skillPatches/combat/addMagicShield.mjs');
const { patchAuroraAnyStyle } = await loadModule('src/patches/skillPatches/combat/patchAuroraAnyStyle.mjs');
const { patchRunePreservationCap } = await loadModule('src/patches/skillPatches/combat/patchRunePreservationCap.mjs');
const { patchPrayerPointsSpending } = await loadModule('src/patches/skillPatches/combat/patchPrayerPointsSpending.mjs');



const { emitPassiveCook } = await loadModule('src/patches/skillPatches/cooking/emitPassiveCook.mjs');
const { perfectFoodHealing } = await loadModule('src/patches/skillPatches/cooking/perfectFoodHealing.mjs');
const { addAshOnFail } = await loadModule('src/patches/skillPatches/cooking/addAshOnFail.mjs');

const { addRoaringFire } = await loadModule('src/patches/skillPatches/firemaking/addRoaringFire.mjs');

const { addFishonTreasureRollPlusExtra } = await loadModule('src/patches/skillPatches/fishing/addFishonTreasureRoll.mjs');
const { reduceFishTimers } = await loadModule('src/patches/skillPatches/fishing/reduceFishTimers.mjs');

const { loseGPOnFishing } = await loadModule('src/patches/skillPatches/fishing/loseGPOnFishing.mjs');

const { reduceUpgradeLevelReq } = await loadModule('src/patches/skillPatches/herblore/reduceUpgradeLevelReq.mjs');
const { additionalPotionsHighTier } = await loadModule('src/patches/skillPatches/herblore/additionalPotionsHighTier.mjs');


const { patchCraftingOrder } = await loadModule('src/patches/skillPatches/crafting/patchCraftingOrder.mjs');

const { patchTreeSeedReturn } = await loadModule('src/patches/skillPatches/farming/patchTreeSeedReturn.mjs');

const { patchArrowShaftRecipes } = await loadModule('src/patches/skillPatches/fletching/patchArrowShaftRecipes.mjs');
const { patchFletchingOrder } = await loadModule('src/patches/skillPatches/fletching/patchFletchingOrder.mjs');
const { addBeamsMasteryPoolBonus } = await loadModule('src/patches/skillPatches/fletching/addBeamsMasteryPoolBonus.mjs');

const { patchPerpetualHaste } = await loadModule('src/patches/skillPatches/shop/patchPerpetualHaste.mjs');

const {addComboRunesonElemRunes} = await loadModule('src/patches/skillPatches/runecrafting/addComboRunesonElemRunes.mjs')

const { trackSlayerCoins } = await loadModule('src/patches/skillPatches/slayer/trackSlayerCoins.mjs');

const { slayerCostReduction } = await loadModule('src/patches/skillPatches/slayer/slayerCostReduction.mjs');



const { patchThievingTargets } = await loadModule('src/patches/skillPatches/thieving/patchThievingTargets.mjs');

const { nerfBearDevil } = await loadModule('src/patches/skillPatches/summoning/nerfBearDevil.mjs');
const { addMarkSuperLevels } = await loadModule('src/patches/skillPatches/summoning/addMarkSuperLevels.mjs');







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
        reduceUpgradeLevelReq(ctx);
        additionalPotionsHighTier(ctx);
        patchMagicUsageCheck(ctx);
        addMagicShield(ctx);
        patchAuroraAnyStyle(ctx);
        addRuneEssenceCtx(ctx);
        addStarConvergence(ctx);
        addComboRunesonElemRunes(ctx);
        patchRunePreservationCap(ctx);
        addHiddenLevelsToAllsSills(ctx);
        patchPrayerPointsSpending(ctx);
        addMarkSuperLevels(ctx);
        trackSlayerCoins(ctx);
        slayerCostReduction(ctx);
        nerfBearDevil();
}
export function patchSkillsAfterDataReg(ctx) {
        patchCraftingOrder();
        patchFletchingOrder();
        addBeamsMasteryPoolBonus();
        patchArrowShaftRecipes(ctx);
        patchPerpetualHaste(ctx);

        // patchThievingTargets();
        // Remember when pushing the update to also disable ignorecompletion for the boots brick pile saw and magitech, and add the boots back

}
