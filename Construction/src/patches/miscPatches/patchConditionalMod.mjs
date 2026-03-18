const { loadModule } = mod.getContext(import.meta);

const { FocusedCookingCondition } = await loadModule ('src/patches/skillPatches/cooking/focusedCookingCondition.mjs');
const { WeaponTypeCondition } = await loadModule ('src/patches/skillPatches/combat/weaponMastery/weaponTypeCondition.mjs');
const { WeaponCondition } = await loadModule ('src/patches/skillPatches/combat/weaponMastery/weaponCondition.mjs');


const { getRielkLangString } = await loadModule ('src/language/translationManager.mjs');


export function patchConditionalMod(ctx) {
  const original = ConditionalModifier.getCombatConditionFromData;

  ConditionalModifier.getCombatConditionFromData = function (data, game) {
    if (data.type === "FocusedCook")
      return new FocusedCookingCondition(data, game);
    if(data.type === 'WeaponType')
      return new WeaponTypeCondition(data, game);
    if(data.type === 'Weapon')
      return new WeaponCondition(data,game);
    return original.call(this, data, game);
  };

  ctx.patch(ConditionalModifier ,'getDescriptionTemplate').before(function () {
    if(this._descriptionLang?.startsWith('RIELK'))
     { this._description = getRielkLangString(this._descriptionLang);  
    delete this._descriptionLang;}
  });
}