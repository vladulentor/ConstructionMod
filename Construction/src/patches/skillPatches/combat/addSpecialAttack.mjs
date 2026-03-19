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
function addEffecttoWeaponList(AttackMap) {
    for (const weapon of AttackMap.weapons) {
        addAttacktoWeapons(weapon, AttackMap.attack)
    }
}
// Because copying the attack and changing things sucks because of java copying and reference stuff.
function addAttacktoWeapons(weapon, attack) { 
    if (weapon.specialAttacks.reduce((acc, a) => acc - a.defaultChance, 100) < attack.defaultChance) return;
    weapon.specialAttacks.push(attack);
}

let guardMelee = 0;
let guardRanged = 0;
let guardMagic = 0;
// Technically we don't "need" the guards here yet, but keep 'em.
export function addSpecialAttack() {

    
    if (this._localID == "Slashing3") {
        const attack = game.specialAttacks.getObjectSafe('rielkConstruction:Brutal_Strike'); //testing purposes
        const weapMap = { weapons: this.type.allWeapons, attack: attack };
        addEffecttoWeaponList(weapMap);
    }


    /*let functionList = [];
    if (this._localID == "Training_Dummy4" && this.tier >= 4 && guardMelee == 0) {
        const attack = game.specialAttacks.getObjectSafe('rielkConstruction:Brutal_Strike');
        functionList.push({ name: "melee", attack });
        guardMelee = 1;
    }
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

    addEffecttoWeapons(functionList);*/
}