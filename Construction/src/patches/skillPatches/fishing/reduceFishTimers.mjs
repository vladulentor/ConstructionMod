export function reduceFishTimers(ctx) {
    ctx.patch(Fishing, 'getMinFishInterval').after(function (ret, fish) {
        return ret * (1 + this.game.modifiers.getValue("rielkConstruction:minFishInterval", ModifierQuery.EMPTY) / 100);
    });
    ctx.patch(Fishing, 'getMaxFishInterval').after(function (ret, fish) {
        return ret * (1 + this.game.modifiers.getValue("rielkConstruction:maxFishInterval", ModifierQuery.EMPTY) / 100);
    });

    ctx.patch(FishingAreaMenuElement, 'updateSelectedFishRates').replace(function (_, fish) {
        const minRed = game.modifiers.getValue("rielkConstruction:minFishInterval", ModifierQuery.EMPTY);
        const maxRed = game.modifiers.getValue("rielkConstruction:maxFishInterval", ModifierQuery.EMPTY);

        this.fishInterval.innerHTML = templateLangString('MENU_TEXT_SECONDS_RANGE', {
            minTime: formatFixed(game.fishing.getMinFishInterval(fish) / 1000, 2),
            maxTime: formatFixed(game.fishing.getMaxFishInterval(fish) / 1000, 2),
        });
        if (this.clock == undefined)
            {const clockList = this.querySelectorAll('.fa-clock');
            this.clock = clockList[clockList.length - 1]; // the clock for current fish is always last in line.
            }
        let html = this.fishInterval.innerHTML;

        if (minRed && maxRed) { //Just make all 4 cases.
            html = `<span class="construction-victory">${html}</span>`;
            this.clock.classList.add('construction-success'); //adding victory (bold) will make the clock filled in, thanks Font Awesesome. More like Font stink
        } else {
            this.clock.classList.remove('construction-success');
            if (minRed && !maxRed) { //Never technically happens
                html = html.replace(/^(.*?) -/, '<span class="construction-success">$1</span> -');
            } else if (!minRed && maxRed) {
                html = html.replace(/- (.*)$/, '- <span class="construction-success">$1</span>');
            }
        }

        this.fishInterval.innerHTML = html;
        const avgInterval = (game.fishing.getMaxFishInterval(fish) + game.fishing.getMinFishInterval(fish)) / 2;
        const xp = Math.floor(game.fishing.modifyXP(fish.baseExperience));
        const mxp = game.fishing.getMasteryXPToAddForAction(fish, avgInterval);
        const baseMXP = game.fishing.getBaseMasteryXPToAddForAction(fish, avgInterval);
        const mpxp = game.fishing.getMasteryXPToAddToPool(mxp);
        let strxp = 0;
        let baseStrXP = 0;
        if (fish.strengthXP > 0) {
            strxp = game.strength.modifyXP(fish.strengthXP);
            baseStrXP = fish.strengthXP;
        }
        this.updateGrants(xp, fish.baseExperience, mxp, baseMXP, mpxp, strxp, baseStrXP, fish);
        this.updateAbyssalGrants(game.fishing.modifyAbyssalXP(fish.baseAbyssalExperience), fish.baseAbyssalExperience);
    });
}


