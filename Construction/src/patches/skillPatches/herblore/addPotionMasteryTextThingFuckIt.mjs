const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString } = await loadModule('src/language/translationManager.mjs'); 
//The effect actually runs with no query when the tier is high enough in the potion code getter, so we don't need to add the effect itself like this
// I mean, we could, but we don't gain anything
// Plus it's more of those weird player recomputing things that make people's equipment sets get emptied, so let's avoid it.
const effects = game.herblore.masteryLevelUnlocks;
const ExtraPotionBonusText = new MasteryLevelUnlock({ description: getRielkLangString('MASTERY_BONUS_Herblore_6'), level: 99 }, game.woodcutting);

export function addPotionMasteryTextThingFuckIt(){
            effects.push(ExtraPotionBonusText);
    effects.sort((a, b) => a.level - b.level);

}