const typeMap = { "ranged": "rangedDefenceBonus", "melee": "meleeDefenceBonus", "magic": "magicDefenceBonus" }; // annoying names for this stuff

function extractChances(player, target) {
    return [player.modifiers.getValue("rielkConstruction:unlockParry", target.damageType.modQuery) ? player.equipmentStats[typeMap[target.attackType]] : 0, target.monster.combatLevel]
}
function determineParry(player, target) {
    extractChances(player, target)
    const [pDef, tL] = extractChances(player, target);
    return pDef > 0 ? rollPercentage((pDef * 2) / (pDef * 2 + tL)) : false;
}
function calculateChanceOfParryPerAttempt(player, target) {
    const [pDef, tL] = extractChances(player, target);
    if (pDef <= 0) return 0;
    return Math.max(0, (pDef * 2) / (pDef * 2 + tL) * 100); // please god let there be no combat level 0 enemies please god let there be no combat level 0 enemies please god please
}


export function addDeflect({ patch }) { // unfortunately we have to put logic in the ui function for missing.
    SplashManager.splashClasses.deflect = 'deflectSplash';
    const orig_fireMissSplash = Player.prototype.fireMissSplash;

    Player.prototype.fireMissSplash = function (targetImmune) {
        if (targetImmune) {
            return orig_fireMissSplash.call(this, targetImmune);
        }

        this.justDodged = determineParry(this, this.target);

        if (this.justDodged) {
            const text = "Parry!";
            this.splashManager.add({
                source: "deflect",
                amount: 0,
                text,
                xOffset: this.hitpointsPercent,
            });
            this.renderQueue.damageSplash = true;
            this.target.damage(this.stats.minHit, "Attack");
            // We don't call orig here because we handled the splash
        } else {
            // Fall back to the original function for a normal miss
            orig_fireMissSplash.call(this, targetImmune);
        }
    }; patch(PlayerStatsElement, "setStats").after(function (_, player, game) {
        if (game.modifiers.getValue("rielkConstruction:unlockParry", ModifierQuery.ANY_DAMAGETYPE)) {
            if (!this.parryChance) {
                const parryD = createElement('div', {});
                parryD.innerHTML = `
    <span>Parry Chance</span>
    <span>
        <span id="parry-chance-display">0%</span>
    </span>`;
                this.accuracyRating.parentElement.after(parryD);
                this.parryChance = parryD.querySelector('#parry-chance-display');
            }
            if (player.target && player.target !== player) {
                this.parryChance.textContent = formatPercent(calculateChanceOfParryPerAttempt(player, player.target), 0);
            }
            else
                this.parryChance.textContent = "-"

        }
    });
    //TO DO, add parry chance in thing
    /*
    patch(Player, "damage").replace(function(orig, amount, source, thieving){
        if(thieving) orig(amount, source, thieving); // threshold doesn't work in thieving
        const iSt = typeMap[this.target.attackType];
        const dt = this.modifiers.getValue("rielkConstruction:damagethreshold", this.target.damageType.modQuery)
        if(dt && dt * this.equipmentStats[iSt] >= amount){

            //Code for deflecting and stuff
        }
        else orig(amount, source, thieving);
    })*/
}