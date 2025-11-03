export function patchAutoEatOver(ctx) {
    ctx.patch(Player, 'autoEat').before(function (shouldEat) {
        this._allowOverheal = true;
    })
    ctx.patch(Player, 'autoEat').after(function (_, shouldEat) {
        this._allowOverheal = false;
    })

    ctx.patch(Player, 'heal').replace(function (_, amount) {
        amount = this._allowOverheal
            ? Math.min(amount, (this.stats.maxHitpoints +
                this.stats.maxHitpoints *
                (this.game.modifiers.getValue("rielkConstruction:maxAutoOverheal", ModifierQuery.EMPTY) / 100)) -
                this.hitpoints
            )
            : Math.min(amount, this.stats.maxHitpoints - this.hitpoints);
        this.addHitpoints(amount);
        this.splashManager.add({
            source: 'Heal',
            amount,
            xOffset: this.hitpointsPercent,
        });
        this.renderQueue.damageSplash = true;
        return amount;
    })
    ctx.patch(Character, 'renderHitpoints').after(function (_) {
        const isOverheal = this.hitpoints > this.stats.maxHitpoints;
        console.log(this.statElements.hitpointsBar);
        if (isOverheal) {
            const overPercent = (Math.min((this.hitpoints / this.stats.maxHitpoints) - 1, 1) * 100).toFixed(1);
            this.statElements.hitpoints.forEach((elem) => (elem.classList.add('construction-victory')));
            this.statElements.hitpointsBar.forEach(elem => {
                elem.style.background = `linear-gradient(
      to right,
      #00e5ff 0%,
      #00e5ff ${overPercent}%,
      #30c78d ${overPercent}%,
      #30c78d 100%
    )`;
    this.displayOverheal = true;
            });
        }
        else {
            if(this.displayOverheal){
            this.statElements.hitpointsBar.forEach(elem => {
                elem.style.background = "#30c78d";
            });
            this.statElements.hitpoints.forEach((elem) => (elem.classList.remove('construction-victory')));
        this.displayOverheal= false;
    }
        }
    })

}

/* (3) [div#combat-player-hitpoints-bar.progress-bar.bg-success, div#combat-player-hitpoints-bar-1.progress-bar.bg-success, div#thieving-player-hitpoints-bar.progress-bar.bg-success]
0
: 
div#combat-player-hitpoints-bar.progress-bar.bg-success
1
: 
div#combat-player-hitpoints-bar-1.progress-bar.bg-success
2
: 
div#thieving-player-hitpoints-bar.progress-bar.bg-success
length
: 
3
[[Prototype]]
: 
Array(0) */