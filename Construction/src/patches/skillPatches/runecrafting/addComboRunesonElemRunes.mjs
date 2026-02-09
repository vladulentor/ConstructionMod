export function addComboRunesonElemRunes(ctx) {
    //You could technically code this so it's dynamically computed but why would you? They're never adding more elemental runes.
    let runePairs = [{
        rune: "melvorF:Fire_Rune", combos: ["melvorF:Lava_Rune", "melvorF:Steam_Rune", "melvorD:Smoke_Rune"]
    },
    {
        rune: "melvorF:Water_Rune", combos: ["melvorD:Mist_Rune", "melvorF:Steam_Rune", "melvorF:Mud_Rune"]
    },
    {
        rune: "melvorF:Air_Rune", combos: ["melvorD:Mist_Rune", "melvorD:Dust_Rune", "melvorD:Smoke_Rune"]
    },
    {
        rune: "melvorF:Earth_Rune", combos: ["melvorF:Lava_Rune", "melvorF:Mud_Rune", "melvorD:Dust_Rune"]
    }
    ]
    runePairs.forEach(runeP => {
        let grune = game.runecrafting.actions.getObjectSafe(runeP.rune)
        grune.extraComboRunes = []
        for (const i in runeP.combos) {
            grune.extraComboRunes[i] = game.items.getObjectSafe(runeP.combos[i])
        }
    })
    ctx.patch(Runecrafting, "actionRewards").get(function (orig) {
        let rewards = orig.call();
        let bonus = this.game.modifiers.getValue("rielkConstruction:ComboRunesonElemRunes", this.getActionModifierQuery(this.activeRecipe));
        if (bonus) {
            if (["Air_Rune", "Earth_Rune", "Water_Rune", "Fire_Rune"].includes(this.activeRecipe._localID)) // There's no subcategory for elemental runes
            {
                const bonustoadd = rollInteger(0, bonus);
                for (let i = 0; i < bonustoadd; i++) {
                    rewards.addItem(this.activeRecipe.extraComboRunes[rollInteger(0, this.activeRecipe.extraComboRunes.length - 1)], 1)
                }
            }
        }
        return rewards;

    }
    )
}