export function addHiddenLevelsToAllsSills({patch}){
    patch(PlayerModifierTable, "getHiddenSkillLevels").after(function(ret, skill){
        const catBonus = skill.isCombat? this.getValue("rielkConstruction:allCombatSkillsFlatHiddenLevel", ModifierQuery.EMPTY): 0
        return ret + catBonus;
    })
}