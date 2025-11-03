export function patchMaxTier(ctx) {
  ctx.patch(DigSiteMap, "atMaxTier").replace(function () {
    if (this.game.modifiers.getValue("rielkConstruction:digSiteMapNewTier", ModifierQuery.EMPTY))
    return this.tier === DigSiteMap.tiers[DigSiteMap.tiers.length - 1];
    else
            return this.tier === DigSiteMap.tiers[DigSiteMap.tiers.length - 2];

  });
}