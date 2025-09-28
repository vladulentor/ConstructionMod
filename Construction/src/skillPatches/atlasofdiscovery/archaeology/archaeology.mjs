export function patchArchaeology(ctx) {
    ctx.patch(Archaeology, "modifyInterval").before(function (interval, digSite) {
        let newInterval = interval;
        const tier = digSite?.selectedMap?.tier?.index ?? 0;
        const tierModifier = this.game.modifiers.getValue(
            "rielkConstruction:tierIntervalBonus",
            ModifierQuery.EMPTY
        ) || 0;

        if (tierModifier && tier > 0) {
            newInterval = Math.max(250, interval - tier * tierModifier);
        } else {
        }

        return [newInterval, digSite];
    });
}
