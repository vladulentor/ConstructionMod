const { loadModule } = mod.getContext(import.meta);



const { raiseMasteryLevel } = await loadModule('src/patches/skillPatches/combat/weaponMastery/raiseMasteryLevel.mjs');



const { tierArray } = await loadModule('src/patches/skillPatches/atlasofdiscovery/archaeology/tierarray.mjs');

const { addRuneEssence } = await loadModule("src/patches/skillPatches/astrology/addRuneEssence.mjs");
const { addConstellationLevels } = await loadModule("src/patches/skillPatches/astrology/addConstellationLevels.mjs");

const { addObstacle } = await loadModule('src/patches/skillPatches/agility/removeAndAddObstacles.mjs');
const { refreshAgi } = await loadModule('src/patches/skillPatches/agility/refreshAgi.mjs');


const { addSpecialAttack } = await loadModule('src/patches/skillPatches/combat/addSpecialAttack.mjs');


const { lowerLevelRequirements } = await loadModule('src/patches/skillPatches/shop/lowerLevelRequirements.mjs');
const { refreshTrader } = await loadModule('src/patches/skillPatches/shop/unlockTrader.mjs');


const { addBonusToPool } = await loadModule('src/patches/skillPatches/mining/addBonusToPool.mjs');

const { buffSlayerItems } = await loadModule('src/patches/skillPatches/slayer/buffSlayerItems.mjs');
const { checkForInitialMill } = await loadModule('src/patches/skillPatches/slayer/trackSlayerCoins.mjs');
const { addEnemies } = await loadModule('src/patches/skillPatches/slayer/addEnemies.mjs');


const { unlockPlot } = await loadModule('src/patches/skillPatches/farming/unlockPlot.mjs');


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

const { addMarkExtraLevels } = await loadModule('src/patches/skillPatches/summoning/addMarkSuperLevels.mjs');



export const EffectRegistry = {
  tierArray,
  unlockPlot,
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
  raiseMasteryLevel,
  addConstellationLevels,
  addBonusToPool,
  refreshAgi,
  buffSlayerItems,
  addObstacle,
  checkForInitialMill,
  addEnemies,
  refreshTrader,
  lowerLevelRequirements,
  addMarkExtraLevels
};
