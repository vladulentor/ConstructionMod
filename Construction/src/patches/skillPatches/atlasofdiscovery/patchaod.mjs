const { loadModule } = mod.getContext(import.meta);
/*const { patchMapCharges } = await loadModule('src/skillPatches/atlasofdiscovery/archaeology/mapcharges.mjs');
const { patchArchaeology } = await loadModule('src/skillPatches/atlasofdiscovery/archaeology/archaeology.mjs');
const { patchArchUI } = await loadModule ('src/skillPatches/atlasofdiscovery/archaeology/archaeologyui.mjs');
const { patchArchTooltip } = await loadModule('src/skillPatches/atlasofdiscovery/archaeology/archaeologytooltip.mjs');
const { patchTiers } = await loadModule('src/skillPatches/atlasofdiscovery/archaeology/tierarray.mjs');
const { patchMaxTier } = await loadModule('src/skillPatches/atlasofdiscovery/archaeology/patchmaxtier.mjs');
const { patchGenericArtefact } = await loadModule('src/skillPatches/atlasofdiscovery/archaeology/patchgenericartefact.mjs');
const {patchUpgradeArtefactValue} = await loadModule('src/skillPatches/atlasofdiscovery/archaeology/patchupgradeartefactvalue.mjs')*/
const {patchWorldMap} = await loadModule('src/patches/skillPatches/atlasofdiscovery/cartography/patchWorldMap.mjs')
const {bypassGlobalDoubling} = await loadModule('src/patches/skillPatches/atlasofdiscovery/ancientrelics/bypassGlobalDoubling.mjs')



export function patchAoDbeforedatareg(ctx)
{
      
      
        /*  patchTiers();
        patchArchaeology(ctx); 
        patchArchUI(ctx);
        patchArchTooltip(ctx);
        patchMapCharges(ctx);
        patchUpgradeArtefactValue(ctx);

        patchMaxTier(ctx);
        patchGenericArtefact(ctx);*/
        bypassGlobalDoubling(ctx);
    
}

export function patchAoDafterdatareg(ctx)
{
        patchWorldMap();

}