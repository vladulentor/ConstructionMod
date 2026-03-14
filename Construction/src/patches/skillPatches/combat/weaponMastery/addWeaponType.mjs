const Finesse = { clas: "Finesse", mat: ["Dagger"], uniq: [] };
const Slashing = { clas: "Slashing", mat: ["Sword", "Scimitar"], uniq: [] };
const Great = { clas: "Great", mat: ["2H_Sword"], uniq: [] }
const Cleave = { clas: "Cleave", mat: ["Battleaxe"], uniq: [] }
const Exotic = { clas: "Exotic", uniq: [] };
const Material = ["Bronze", "Iron", "Steel", "Mithril", "Adamant", "Rune", "Dragon", "Corundum", "Augite", "Meteorite", "Divine"]
const namespaces = ["melvorD", "melvorF", "melvorAoD", "melvorTotH", "melvorItA", "rielkConstruction"];

export function addWeaponType() {
    for (const type of [Finesse, Slashing, Great, Cleave, Exotic]) {
        // Handle material-based weapons
        type.clas = game.weaponMasteries.getObject("rielkConstruction", type.clas); 
        if (type.mat) {
            for (const mat of type.mat) {
                for (const material of Material) {
                    addClass(`${material}_${mat}`, type.clas);
                }
            }
        }

        // Handle unique weapons
        if (type.uniq) {
            for (const uniq of type.uniq) {
                addClass(uniq, type.clas);
            }
        }
    }
}

function addClass(name, className) {
    let item = -1;
    for (const namespace of namespaces) {
        item = game.items.getObjectByID(`${namespace}:${name}`);
        if (item) break;
    }
    if (item) {
        item.weaponType = className;
    }
}
