export function addChanceToNotLoseOnDeath({patch}){//pretty gnarly name when you think about it
    patch(Player, "applyDeathPenalty").before(function(){
        if(rollPercentage(this.modifiers.getValue("rielkConstruction:blockTheUnblockable", ModifierQuery.EMPTY)))
            this.manager.giveFreeDeath = true;
    });
}
//let's hope this is enough, I saw the combatManager sets this switch back to false, so hopefully it's fine?