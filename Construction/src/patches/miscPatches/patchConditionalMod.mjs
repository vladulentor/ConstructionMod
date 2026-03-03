const { loadModule } = mod.getContext(import.meta);

const { FocusedCookingCondition } = await loadModule ('src/patches/skillPatches/cooking/focusedCookingCondition.mjs');
const { getRielkLangString } = await loadModule ('src/language/translationManager.mjs');


export function patchConditionalMod(ctx) {
  const original = ConditionalModifier.getCombatConditionFromData;

  ConditionalModifier.getCombatConditionFromData = function (data, game) {
    if (data.type === "FocusedCook")
      return new FocusedCookingCondition(data, game);

    return original.call(this, data, game);
  };

  ctx.patch(ConditionalModifier ,'getDescriptionTemplate').before(function () {
    if(this._descriptionLang?.startsWith('RIELK'))
     { this._description = getRielkLangString(this._descriptionLang);  
    delete this._descriptionLang;}
  });
}