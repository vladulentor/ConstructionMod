const { loadModule } = mod.getContext(import.meta);

const { tierArray } = await loadModule('src/skillPatches/atlasofdiscovery/archaeology/tierarray.mjs');

export const EffectRegistry = {
  tierArray
};
