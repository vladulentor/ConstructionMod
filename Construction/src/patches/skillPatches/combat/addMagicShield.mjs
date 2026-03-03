const { loadModule } = mod.getContext(import.meta);
const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');


export function addMagicShield({ patch }) {
    // We don't use the normal calculations for getting rune costs since those take into account reductions, where we want to calculate original cost of runes that would-be spent
    patch(Player, "attack").after(function (_, target, attack) {
        if (this.game.modifiers.getValue("rielkConstruction:addRuneShield", ModifierQuery.EMPTY)) {
            let chargeMultiplier = this.game.modifiers.getValue("rielkConstruction:runeShieldMultiplier", ModifierQuery.EMPTY) + 1;
            this.shieldCharge ??= 0;
            if (this.attackType == "magic" || attack.usesRunesPerProc) {
                this.spellSelection.attack.runesRequired.forEach(a => this.shieldCharge += a.quantity * chargeMultiplier);
                if (attack.extraRuneConsumption !== undefined)
                    attack.extraRuneConsumption.forEach(a => this.shieldCharge += chargeMultiplier * a.quantity);
            }
            if (this.canAurora && this.spellSelection.aurora !== undefined) {
                let offtypeCost = 1;
                if (chargeMultiplier > 1 && this.attackType !== "magic")
                    offtypeCost = 3;
                this.spellSelection.aurora.runesRequired.forEach(a => this.shieldCharge += a.quantity * chargeMultiplier * offtypeCost);
            }
            if (this.shieldCharge >= 300) {
                this.activateShield();
                const ward = game.combatEffects.getObjectSafe("rielkConstruction:Ward");
                this.applyCombatEffect(ward, this, this, {}); // This is an absolute botch and can be avoided with smarter use of the combatEffects system. Which I'm not willing to do. If anyone has a problem with this they can fix it.
                this.activateShield();
                this.shieldCharge -= 300;
            }
        }
    })
    Player.prototype.activateShield = function () {
        this.shielded = 1;
        this.renderHitpoints();
    };
    patch(Character, "isImmuneTo").after(function (ret, attacker) {
        if (this.shielded) return true;
    })

    patch(Character, "act").before(function () {
        this.turnsMem = this.turnsTaken
    })
    patch(Character, "act").after(function (_) {
        if (this.target.shielded && this.turnsMem<this.turnsTaken) {
            this.target.shielded -= 1;
            this.target.renderHitpoints(); // We don't add it to the renderqueue since it doesn't work.
        }
    })
    SplashManager.splashClasses.RuneShield = 'rune-shield';
    patch(Character, "fireMissSplash").replace(function (_, immune) {
        if (this.shielded) {
            const text = getRielkLangString('COMBAT_MISC_SHIELD_BROKEN');
            this.splashManager.add({
                source: 'RuneShield',
                amount: 0,
                text,
                xOffset: this.hitpointsPercent,
            });
        }
        else {
            const text = getLangString(`COMBAT_MISC_${immune ? 'IMMUNE' : 'MISS'}`);
            this.splashManager.add({
                source: 'Attack',
                amount: 0,
                text,
                xOffset: this.hitpointsPercent,
            });
        }

        this.renderQueue.damageSplash = true;
    })

    patch(Character, 'renderHitpoints').after(function (_) {
        this.statElements.hitpointsBar.forEach(elem => {
            this.shielded ? elem.style.boxShadow = 'inset 0 0 4px 3px #0073d1ff' : elem.style.boxShadow = '';
        })

    });

    patch(Player, 'stopFighting').after(function (_) {
        this.shielded = 0;
        this.renderHitpoints();
    })
    class RunesSpentTrigger {
        constructor(data, transpiler, game) {
            this.data = data;
            this.game = game;
        }

        check(character) {
            if (character.shieldCharge > 300) {
                character.shieldCharge -= 300;
                return true;
            }
            else return false;
        }
    }

}