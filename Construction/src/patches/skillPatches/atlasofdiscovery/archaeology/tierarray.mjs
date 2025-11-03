const { loadModule } = mod.getContext(import.meta);
const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');

export function tierArray(_) {

    if (!DigSiteMap.tiers.some(t => t.index === 4)) {
        DigSiteMap.tiers.push({
            index: 4,
            get name() { 
                const name = "Pristine" //getRielkLangString('DIGSITE_MAP-TIER_FIVE'); 
                return name; 
            },
            upgradeActions: 5761,
            refinementSlots: 7,
        });
    } else {
    }
}