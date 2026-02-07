const { loadModule } = mod.getContext(import.meta);

const { tierArray } = await loadModule('src/patches/skillPatches/atlasofdiscovery/archaeology/tierarray.mjs');

const { addRuneEssence } = await loadModule("src/patches/skillPatches/astrology/addRuneEssence.mjs");
const { addConstellationLevels } = await loadModule("src/patches/skillPatches/astrology/addConstellationLevels.mjs");


const { addSpecialAttack } = await loadModule('src/patches/skillPatches/combat/addSpecialAttack.mjs');


const { unlockPlot } = await loadModule('src/patches/skillPatches/farming/unlockPlot.mjs');

const { patchWorldMap } = await loadModule("src/patches/skillPatches/atlasofdiscovery/patchWorldMap.mjs");

const { addFoodSlot } = await loadModule("src/patches/skillPatches/combat/addFoodSlot.mjs");

const { doubleEffectsOfStuff } = await loadModule("src/patches/skillPatches/cooking/doubleEffectsOfStuff.mjs");

const { upgradeRegenPotions } = await loadModule("src/patches/skillPatches/herblore/upgradeRegenPotions.mjs");
const { upgradeFirePotions } = await loadModule("src/patches/skillPatches/herblore/upgradeFirePotions.mjs");
const { reduceUpgradeCost } = await loadModule("src/patches/skillPatches/herblore/reduceUpgradeCost.mjs");
const { addPotionMasteryTextThingFuckIt } = await loadModule("src/patches/skillPatches/herblore/addPotionMasteryTextThingFuckIt.mjs");

const { increaseRuneReduction } = await loadModule("src/patches/skillPatches/combat/increaseRuneReduction.mjs");


const { addSpecialFishingItems } = await loadModule("src/patches/skillPatches/fishing/addSpecialFishingItems.mjs");

const { multiplyRoaringEffects } = await loadModule("src/patches/skillPatches/firemaking/multiplyRoaringEffects.mjs");
const { addSaplingBranchDrop } = await loadModule("src/patches/skillPatches/firemaking/addSaplingBranchDrop.mjs");

const { addBonusesToTreeMastery } = await loadModule("src/patches/skillPatches/woodcutting/addBonusesToTreeMastery.mjs");


export const EffectRegistry = {
  tierArray,
  unlockPlot,
  patchWorldMap,
  addFoodSlot,
  upgradeRegenPotions,
  doubleEffectsOfStuff,
  upgradeFirePotions,
  multiplyRoaringEffects,
  addSaplingBranchDrop,
  addSpecialFishingItems,
  addBonusesToTreeMastery,
  reduceUpgradeCost,
  addPotionMasteryTextThingFuckIt,
  increaseRuneReduction,
  addSpecialAttack,
  addRuneEssence,
  addConstellationLevels
};
