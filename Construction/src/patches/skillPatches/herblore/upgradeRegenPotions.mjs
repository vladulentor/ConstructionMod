const ctx = mod.getContext(import.meta);

export function upgradeRegenPotions() {
const potID = [];
potID[0]= game.items.getObjectByID('melvorF:Regeneration_Potion_I');
potID[1]= game.items.getObjectByID('melvorF:Regeneration_Potion_II');
potID[2]= game.items.getObjectByID('melvorF:Regeneration_Potion_III');
potID[3]= game.items.getObjectByID('melvorF:Regeneration_Potion_IV');

const maxOverheal = [3, 6, 10, 15];
potID.forEach((potion, i) => {
    if (potion) {
  // Apply modifiers directly to the potion’s stats
potion.stats.modifiers.push(
    new ModifierValue(game.modifierRegistry.getObjectByID('rielkConstruction:maxOverheal'), maxOverheal[i]),
    new ModifierValue(game.modifierRegistry.getObjectByID('rielkConstruction:regenOverheal'), 1)
);
// Make it gold and FANCY
Object.defineProperty(potion, 'media', {
  get() {
    return ctx.getResourceUrl(`assets/replacements/${potion._localID}.webp`);
  }
});}

});
}