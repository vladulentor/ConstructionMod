function addEffecttoWeapons(AttackMap) {
    for (const [key, value] of game.items.registeredObjects) {
        if (value instanceof WeaponItem) {
            AttackMap.forEach(Attack => {
                if (Attack.name == value.attackType)
                    addAttacktoWeapons(value, Attack.attack);
            })

        }
    }
}

function addAttacktoWeapons(weapon, attack) {
    let normalChance = 100;
    weapon.specialAttacks.forEach(a => normalChance -= a.defaultChance);
    const chanceToChange = Math.min(15, normalChance);
    if (chanceToChange <= 0) return;
    attack.defaultChance = chanceToChange;
    weapon.specialAttacks.push(attack);
}


let guardMelee = 0;
let guardRanged = 0;
let guardMagic = 0;
// Technically we don't "need" the guards here yet, but keep 'em.
export function addSpecialAttack() {
    let functionList = [];
    if (this._localID == "Training_Dummy4" && this.tier >= 4 && guardMelee == 0) {
        const attack = game.specialAttacks.getObjectSafe('rielkConstruction:Brutal_Strike');
        functionList.push({ name: "melee", attack });
        guardMelee = 1;
    }
/* Shouldn't run, but what do you know
    if (this._localID == "Archery_Range4" && guardRanged == 0) {
        const attack = game.specialAttacks.getObjectSafe('rielkConstruction:Twin_Shot');
        functionList.push({ name: "ranged", attack });
        guardRanged = 1;
    }

    if (this._localID == "Spell_Library4" && guardMagic == 0) {
        const attack = game.specialAttacks.getObjectSafe('rielkConstruction:Mana_Surge');
        functionList.push({ name: "magic", attack });
        guardMagic = 1;
    }
*/ 
    addEffecttoWeapons(functionList);
}