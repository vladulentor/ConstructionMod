function buildmodarray() {
    const modsToAdd = []
    const survbuff = game.modifiers.getValue('rielkConstruction:hpPerAgiLevels', ModifierQuery.EMPTY)
    if (survbuff)
        modsToAdd.push(new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:flatHiddenSkillLevel'), survbuff, { skill: game.defence }),
            new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:flatHiddenSkillLevel'), survbuff, { skill: game.hitpoints }));


    const intervalbuff = game.modifiers.getValue('rielkConstruction:IntPerAgiLevels', ModifierQuery.EMPTY);
    if (intervalbuff)
        modsToAdd.push(new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:skillInterval'), intervalbuff, { skill: game.thieving }),
            new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:skillInterval'), intervalbuff, { skill: game.agility }));


    const respawttackintervalbuff = game.modifiers.getValue('rielkConstruction:CombIntPerAgiLevels', ModifierQuery.EMPTY);
    if (respawttackintervalbuff)
        modsToAdd.push(new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:flatAttackInterval'), respawttackintervalbuff),
            new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:flatMonsterRespawnInterval'), respawttackintervalbuff))


    
    return modsToAdd;
}
function addLevelStats(agi){
        let agiToAdd = Math.floor(agi.level / 20);
        if (agiToAdd === 0) return;
        let ourname = agi.name + ' ' + getLangString('MENU_TEXT_SKILL_LEVEL') + ' ';
        if (agi.level === 99 && agi.maxLevelCap === 99) { agiToAdd += 1; ourname += '99'; }
        else { ourname += agiToAdd * 20 }
        const modsToAdd = buildmodarray();

        if (modsToAdd.length > 0)
            agi.providedStats.addStatObject({name:ourname}, { modifiers: modsToAdd }, 1, agiToAdd);

        // I guess this isn't moddable but who's modding construction?
        // FUCK your mods if you're doing that!!!
        // 凸ಠ益ಠ)凸

}
export function provideBonusesPerAgiLevels({ patch }) {


    patch(Agility, 'addProvidedStats').after(function (_) {
        addLevelStats(this);
    });
    patch(Agility, 'onLevelUp').after(function(_, oldLevel, newLevel){
        if(oldLevel % 20 !== newLevel % 20 || newLevel === 99)
        this.computeProvidedStats(true)
    })
}