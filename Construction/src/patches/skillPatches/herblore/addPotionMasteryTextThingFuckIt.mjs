const { loadModule } = mod.getContext(import.meta);

const { templateRielkLangString } = await loadModule('src/language/translationManager.mjs');
//The effect actually runs with no query when the tier is high enough in the potion code getter, so we don't need to add the effect itself like this
// I mean, we could, but we don't gain anything
// Plus it's more of those weird player recomputing things that make people's equipment sets get emptied, so let's avoid it.
const effects = game.herblore.masteryLevelUnlocks;
let guard = 0
export function addPotionMasteryTextThingFuckIt() {
    if(!guard){
    const ExtraPotionBonusText = new MasteryLevelUnlock({ description: templateRielkLangString('MASTERY_BONUS_Herblore_6', { value: this.tier >= 5? 3: 1 }), level: 99 }, game.herblore);
    effects.push(ExtraPotionBonusText);
    effects.sort((a, b) => a.level - b.level);
    guard = 1
}
else {
  const index = effects.findIndex(
    e =>
      e instanceof MasteryLevelUnlock &&
        e.description == templateRielkLangString('MASTERY_BONUS_Herblore_6', { value:1 })
  );

  if (index !== -1) {
    effects.splice(index, 1);

    const ExtraPotionBonusText = new MasteryLevelUnlock(
      {
        description: templateRielkLangString(
          'MASTERY_BONUS_Herblore_6',
          { value: this.tier >= 5 ? 3 : 1 }
        ),
        level: 99
      },
      game.herblore
    );

    effects.push(ExtraPotionBonusText);
    effects.sort((a, b) => a.level - b.level);
  }
}


}