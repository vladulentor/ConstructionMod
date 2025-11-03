const { loadModule } = mod.getContext(import.meta);

const { tierArray } = await loadModule('src/patches/skillPatches/atlasofdiscovery/archaeology/tierarray.mjs');
const { unlockPlot } = await loadModule('src/patches/skillPatches/farming/unlockPlot.mjs');
const { patchWorldMap } = await loadModule("src/patches/skillPatches/atlasofdiscovery/patchWorldMap.mjs");
const { addFoodSlot } = await loadModule("src/patches/skillPatches/cooking/addFoodSlot.mjs");


export const EffectRegistry = {
  tierArray,
  unlockPlot,
  patchWorldMap,
  addFoodSlot
};
