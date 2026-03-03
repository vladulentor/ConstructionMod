const { loadModule } = mod.getContext(import.meta);
const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');


export function patchPerpetualHaste(ctx) {
    const ourDesc= getRielkLangString('SHOP_PURCHASE_Perpetual_Haste');
    const haste = game.shop.purchases.getObjectByID("melvorF:Perpetual_Haste");// so we get around the game's automatic string lookup

    Object.defineProperty(haste, 'description', {
        get() {
            return ourDesc;
        }
    });
haste._customDescription = ourDesc; //idk if this does anything, maybe it helps skill boosts


    haste.contains.stats.modifiers.push(new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:skillInterval'), -15, {skill : game.construction}));
    Object.defineProperty(haste, 'media', {
        get() {
            return ctx.getResourceUrl(`assets/replacements/perpetual_haste.webp`);
        }
    });
}