const { loadModule } = mod.getContext(import.meta);
const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');

export function nerfBearDevil(){
    const summonIDs = ['Bear', 'Devil'];
    const synergy = game.summoning.synergies.find(s =>
  summonIDs.every(id => s.summons.some(summon => summon._localID === id)));
synergy.conditionalModifiers[0].modifiers[1].value = 15; // the bonfire length one
synergy.consumesOn.push(game.items.getObjectByID('melvorF:Controlled_Heat_Potion_I').consumesOn[0]) // make it consume on bonfire triggers as well
    Object.defineProperty(synergy, 'description', {
        get() {
            return getRielkLangString('ITEM_DESCRIPTION_BEAR_DEVIL_SYNERGY');
        }
    });

}