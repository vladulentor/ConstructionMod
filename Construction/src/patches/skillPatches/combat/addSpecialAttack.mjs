function addEffecttoWeapons(AttackMap) {
    for (const [key, value] of game.items.registeredObjects) {
        if (value instanceof WeaponItem) {
         AttackMap.forEach(Attack =>{
            if(Attack.name == value.attackType)
                addAttacktoWeapons(value, Attack.attack);
         })

        }
    }
}

function addAttacktoWeapons(weapon, attack) {
    let normalChance = 100;
    weapon.specialAttacks.forEach(a => normalChance -= a.defaultChance);
    const chanceToChange = Math.min(15, normalChance);
    if(chanceToChange <= 0) return;
    attack.defaultChance = chanceToChange;
    weapon.specialAttacks.push(attack);
}

let guardMagic = 0;
let guardRanged = 0;
let guardMelee = 0;

export function addSpecialAttack() {
    let functionList = [];
    const constr = this.skill;
    if (constr.fixtures.getObjectSafe('rielkConstruction:Spell_Library').currentTier >= 4 && guardMagic == 0) {
        functionList.push({ name: "magic", attack:game.specialAttacks.getObjectSafe('rielkConstruction:Mana_Surge')})
        guardMagic = 1;
    }
   addEffecttoWeapons(functionList);
}