const Finesse = { clas: "Finesse", mat: ["Dagger"], uniq: [] };
const Slashing = { clas: "Slashing", mat: ["Sword", "Scimitar"], uniq: [] };
const Great = { clas: "Great", mat: ["2H_Sword"], uniq: ["Basic_2H_Sword"] }
const Cleave = { clas: "Cleave", mat: ["Battleaxe"], uniq: [] }
const Exotic = { clas: "Exotic", uniq: [] };
const Material = ["Bronze", "Iron", "Steel", "Mithril", "Adamant", "Rune", "Dragon", "Corundum", "Augite", "Meteorite", "Divine"]
const namespaces = ["melvorD", "melvorF", "melvorAoD", "melvorTotH", "melvorItA", "rielkConstruction"];

export function addWeaponType() { // and make your funny map
    for (const type of [Finesse, Slashing, Great, Cleave, Exotic]) {
        // Handle material-based weapons
        type.clas = game.weaponMasteries.getObject("rielkConstruction", type.clas);
        if (type.mat) {
            for (const mat of type.mat) {
                for (const material of Material) {
                    addClass(`${material}_${mat}`, type.clas, 1);
                }
            }
        }

        // Handle unique weapons
        if (type.uniq) {
            for (const uniq of type.uniq) {
                addClass(uniq, type.clas, 2);
            }
        }
    }
    game.meleeWeaponsByUID = new Map();
    for (const weapon of game.items.weapons.allObjects) {
        if (weapon.weaponType)
            game.meleeWeaponsByUID.set(weapon.uid, weapon);
    }

}

function addClass(name, type, bonuniq = 1) {
    let item = -1;
    let namespacef = null;
    for (const namespace of namespaces) {
        item = game.items.getObjectByID(`${namespace}:${name}`);
        if (item) {namespacef = namespace; break;}
    }
    if (item) {
        item.weaponType = type;
        item.uniqueness = namespacef === "melvorTotH" || namespacef === "melvorItA" ? 0 : bonuniq;
        item._weaponXP = 0;
        item.masteryMaxXP = function(){
           return this.uniqueness * 5000;
        }
        item.masteryPercentMaxed = function(){
            return this._weaponXP / this.masteryMaxXP()  * 100
        }
        type.allWeapons.push(item);
    }
}
