export function patchMapCharges(ctx) {
    ctx.patch(DigSiteMap, 'getUpgradeCharges').after(function (charges) {
      let bonus = 0
      if(this.game.modifiers.flatMapChargeBonus) {
            bonus = this.game.modifiers.getValue("rielkConstruction:flatMapChargeBonus", ModifierQuery.EMPTY);
      }
  return charges + bonus;
    });
}