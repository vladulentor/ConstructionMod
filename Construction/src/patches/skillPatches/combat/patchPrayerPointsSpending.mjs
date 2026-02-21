function checkifcangainprayerxp(level, threshold){
        if (threshold > 1)
            threshold -=1
        if (threshold > 3 ) 
            threshold -= 3

        if(threshold > 1 && level < 12)
            return false
        if(threshold > 3 && level <24)
            return false
    return true
}
export function patchPrayerPointsSpending({ patch }) {

 Object.defineProperty(ActivePrayer.prototype, 'totalPoints', {
    get() {
        return this.pointsPerPlayer + this.pointsPerEnemy + this.pointsPerRegen;
    },
    configurable: false, 
});


    Player.prototype.DeterminetoNullifyPrayerPoints = function () {
        let totalcost = 0;
        this.activePrayers.forEach(prayer => totalcost += prayer.totalPoints); // Note, we don't use prayer cost changes to determine if to nullify this or not, since that's better in my opinion
        let threshold = game.modifiers.getValue("rielkConstruction:nullifyPrayerPointsUnder", ModifierQuery.ANY_SKILL);
        if (threshold > 1)
            threshold -=1
        if (threshold > 3 ) // Jank to a degree unseen before, but the UX and wording is too hard to be made into an additive multiplier so it reads as superlative and we make it that using this code
                            // sue me
            threshold -= 3
        return totalcost <= threshold && totalcost > 0;
    };
    patch(Prayer, "addXP").before(function(amount){ // Overwrite so no xp is added when prayer points are nullified
        //Note this may cause unintended side effects
        if (game.combat.player.DeterminetoNullifyPrayerPoints() && !checkifcangainprayerxp(this.level, game.modifiers.getValue("rielkConstruction:nullifyPrayerPointsUnder", ModifierQuery.ANY_SKILL) ))
            return 0
        return amount
    })
    patch(Player, 'consumePrayerPoints').before(function (amount, isUnholy) {
        if (this.DeterminetoNullifyPrayerPoints()) amount = 0;
        return [amount, isUnholy];
    });

    patch(Player, "renderPrayerSelection").replace(function() {
        if (!this.renderQueue.prayerSelection) return;

        combatMenus.prayer.setActiveButtons(this.activePrayers);
        combatMenus.playerStats.setActivePrayers(this, this.activePrayers);

        if (!this._prayerText) this._prayerText = combatMenus.playerStats.prayerPoints;
        this._prayerText.classList.toggle('construction-success', this.DeterminetoNullifyPrayerPoints());

        this.renderQueue.prayerSelection = false;
    });
}

