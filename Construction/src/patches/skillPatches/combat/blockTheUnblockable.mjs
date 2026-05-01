const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');
const negText = getRielkLangString('SPLASH_NEGATED');

export function blockTheUnblockable({ patch }) {

    patch(Enemy, "rollToHit").after(function (hit, target, attack) {

        if (hit && attack.cantMiss) {
            const ex = target.modifiers.getValue("rielkConstruction:blockTheUnblockable", ModifierQuery.EMPTY);
            if(ex)
            {
                if(!this.rolledHyperBlocked)
                {
                    this.gotHyperBlocked = rollPercentage((ex / 100) * (100 - this.stats.hitChance));
                    this.rolledHyperBlocked = true;
                }
                if(this.gotHyperBlocked)
                    return false;
                // else, return the normal return value (which is a miss)
            }
        }
    });
    patch(Enemy, "queueNextAction").before(function(){
        if(this.nextAttack.attackCount === this.attackCount || this.attackInterrupted) //aka "end of turn", weird fucking place to put it
    {this.rolledHyperBlocked = false;
        this.gotHyperBlocked = false;}
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
                text: negText,
                xOffset: this.hitpointsPercent,
            });
            this.renderQueue.damageSplash = true;
            return;
        }
        return _orig_fireMissSplash.apply(this, arguments);
    };

}