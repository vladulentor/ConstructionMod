const { loadModule } = mod.getContext(import.meta);

const { tierArray } = await loadModule('src/skillPatches/atlasofdiscovery/archaeology/tierarray.mjs');
const { unlockPlot } = await loadModule('src/skillPatches/farming/unlockPlot.mjs');


export const EffectRegistry = {
  tierArray,
  unlockPlot
};
