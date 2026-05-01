export function blockTheUnblockable({ patch }) {
    patch(Character, "rollToHit").after(function (hit, target, attack) {

        if (hit && attack.cantMiss) {
            const ex = target.modifiers.getValue("rielkConstruction:blockTheUnblockable", ModifierQuery.EMPTY);
            if (rollPercentage((ex / 100) * (100 - this.stats.hitChance))) {
                this.gotHyperBlocked = true;
                return false; }
        }
    })
    SplashManager.splashClasses.blocked = 'blockedSplash';
    const _orig_fireMissSplash = Player.prototype.fireMissSplash;
    // using default js overwrite instead of the melvor patch .replace function because I want to overwrite it again
    // somewhere else, and with this both can just call the original if its not their special case, with melvor's default tools, yo ucan only have 1 replace
    // and replace is the only way you can make a function patch that DOESN'T call the original.
    // so we do this
    Player.prototype.fireMissSplash = function (targetImmune) {
        if (this.target && this.target.gotHyperBlocked) {
            this.splashManager.add({
                source: "blocked",
                amount: 0,
                text: "Blocked",
                xOffset: this.hitpointsPercent,
            });
            this.renderQueue.damageSplash = true;
            this.target.gotHyperBlocked = false;
            return;
        }
        return _orig_fireMissSplash.apply(this, arguments);
    };

}