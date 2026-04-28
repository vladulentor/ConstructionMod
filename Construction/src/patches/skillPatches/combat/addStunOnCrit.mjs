const Stun = game.combatEffects.getObjectByID("melvorD:Stun");
const StunIm = game.combatEffects.getObjectByID("melvorD:StunImmunity");
export function addStunOnCrit({ patch }) {
    patch(Enemy, "damage").after(function (_, amount, source) {
        if (source == "Crit" && rollPercentage(game.modifiers.getValue("rielkConstruction:2turnstunoncritchance", ModifierQuery.EMPTY))) {
            this.applyCombatEffect(Stun, game.combat.player, game.combat.player, { turns: 2 })
            // Again, absolute botch, probably could be done without this... I'm not willing to learn how combat effect conditionals work tho
            //Some more botching to get a 6 turn stun going, yippie!!
            for(const value of this.activeEffects.values())
            {if(value.effect._localID == "StunImmunity")
            {   if(value.parameters.turns == 3)
                value.parameters.turns = 6}
            }
        }
    })
}