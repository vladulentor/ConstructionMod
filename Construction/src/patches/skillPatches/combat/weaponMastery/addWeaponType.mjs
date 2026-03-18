const MeleeMaterial = ["Bronze", "Iron", "Steel", "Mithril", "Adamant", "Rune", "Dragon", "Corundum", "Augite", "Meteorite", "Divine"];
const RangedMaterial = ["Normal", "Oak", "Willow", "Maple", "Yew", "Magic", "Redwood", "Elderwood", "Revenant", "Carrion"];

// Yes I'm writing this out by hand and NOT using a .json fuck .json files!
const Finesse = { clas: "Finesse", kind: MeleeMaterial, mat: ["Dagger"], uniq: [] };
const Slashing = { clas: "Slashing", kind: MeleeMaterial, mat: ["Sword", "Scimitar"], uniq: [] };
const Great = { clas: "Great", kind: MeleeMaterial, mat: ["2H_Sword"], uniq: ["Basic_2H_Sword1"] }
const Cleave = { clas: "Cleave", kind: MeleeMaterial, mat: ["Battleaxe"], uniq: [] }

const Air = { clas: "Air", kind: MeleeMaterial, uniq: ["Staff_of_Air1", "Air_Battlestaff1", "Mystic_Air_Staff1", "Air_Imbued_Wand1"] };
const Earth = { clas: "Earth", kind: MeleeMaterial, uniq: ["Staff_of_Earth1", "Earth_Battlestaff1", "Mystic_Earth_Staff1", "Earth_Imbued_Wand1"] };
const Fire = { clas: "Fire", kind: MeleeMaterial, uniq: ["Staff_of_Fire1", "Fire_Battlestaff1", "Mystic_Fire_Staff1", "Fire_Imbued_Wand1"] };
const Water = { clas: "Water", kind: MeleeMaterial, uniq: ["Staff_of_Water1", "Water_Battlestaff1", "Mystic_Water_Staff1", "Water_Imbued_Wand1"] };
const Arcane = { clas: "Arcane", kind: MeleeMaterial, uniq: ["Magic_Wand_Basic1", "Magic_Wand_Powerful1", "Magic_Wand_Elite1"] };

const Swift = { clas: "Swift", kind: RangedMaterial, mat: ["Shortbow"], uniq: [] };
const Precise = { clas: "Precise", kind: RangedMaterial, mat: ["Longbow"], uniq: ["Old_Hunting_Bow2"] };
const Steady = { clas: "Steady", kind: MeleeMaterial, mat: ["Crossbow"], uniq: [] };
const Thrown = { clas: "Thrown", kind: MeleeMaterial, mat: ["Javelin", "Throwing_Knife"], uniq: [] };


const Exotic = { clas: "Exotic", uniq: ["Bobs_Rake4"] };


const namespaces = ["melvorD", "melvorF", "melvorAoD", "melvorTotH", "melvorItA", "rielkConstruction"];

export function addWeaponType() { // and make your funny map
    for (const type of [Finesse, Slashing, Great, Cleave, Air, Earth, Fire, Water, Swift, Precise, Steady, Thrown, Exotic, Arcane]) {
        // Handle material-based weapons
        type.clas = game.weaponMasteries.getObject("rielkConstruction", type.clas);
        if (type.mat) {
            for (const mat of type.mat) {
                for (const material of type.kind) {
                    addClass(`${material}_${mat}`, type.clas, 1);
                }
            }
        }

        // Handle unique weapons
        if (type.uniq) {
            for (const uniq of type.uniq) {
                addClass(uniq.slice(0, -1), type.clas, uniq.slice(-1));
            }
        }
    }
    // Set properties to weapoin objects.
    Object.defineProperty(WeaponItem.prototype, 'timesAttacked', {
        get() {
            return game.stats.Items.get(this, ItemStats.TotalAttacks)
        }
    });
    Object.defineProperty(WeaponItem.prototype, 'weaponXPCap', {
        get() {
            return this.uniqueness * 5000;
        }
    });
    Object.defineProperty(WeaponItem.prototype, '_weaponXP', {
        get() {
            if (!this.attackSpeed)
                this.attackSpeed = this.equipmentStats[0].key === 'attackSpeed' ? this.equipmentStats[0].value / 1000 : 4;
            return Math.floor(this.timesAttacked * this.attackSpeed * 0.3472); // Magic number, balanced so you will get 1250 xp per hour, so 4 hours for stock, 8 for unusual and 12 for distinct weapons.
        }
    });
    Object.defineProperty(WeaponItem.prototype, 'weaponXPCapped', {
        get() {

            return Math.min(this._weaponXP, this.weaponXPCap);
        }
    });

    Object.defineProperty(WeaponItem.prototype, 'weaponXPPercentCapped', {
        get() {

            return Math.min(100, this._weaponXP / this.weaponXPCap * 100)
        }
    });

    Object.defineProperty(WeaponItem.prototype, 'masteryMaxed', {
        value: 0,
        writable: true,
        configurable: true,
    });

     Object.defineProperty(WeaponItem.prototype, 'isMaxMastery', {
        get() {

            return (this.uniqueness > 0 && this._weaponXP >= this.weaponXPCap);
        }
    });

}

function addClass(name, type, bonuniq = 1) {
    let item = -1;
    let namespacef = null;
    for (const namespace of namespaces) {
        item = game.items.getObjectByID(`${namespace}:${name}`);
        if (item) { namespacef = namespace; break; }
    }
    if (item) {
        item.weaponType = type;
        item.uniqueness = namespacef === "melvorTotH" || namespacef === "melvorItA" ? 0 : bonuniq;
        type.allWeapons.push(item);
        if(type.isPerWepMod)
            type.makeWeaponConditional(item);
    }
}
