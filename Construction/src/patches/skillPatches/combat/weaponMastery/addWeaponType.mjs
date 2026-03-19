const MeleeMaterial = ["Bronze", "Iron", "Steel", "Mithril", "Adamant", "Rune", "Dragon", "Corundum", "Augite", "Meteorite", "Divine", "Abyssium", "Brumite", "Gloomite", "Witherite", "Netherite"];
const RangedMaterial = ["Normal", "Oak", "Willow", "Maple", "Yew", "Magic", "Redwood", "Elderwood", "Revenant", "Carrion", "Twisted", "Plagueroot", "Shadebark", "Crumbletain", "Whisperwillow"];

// Yes I'm writing this out by hand and NOT using a .json fuck .json files!
const Finesse = {
    clas: "Finesse", kind: MeleeMaterial, mat: ["Dagger"], uniq: ["Black_Dagger3", "Ice_Dagger2", "Sunset_Rapier2", "Dragon_Claw2", "Ancient_Claw2", "Infernal_Claw3"
        , "Twin_Exiles3", "Darksteel_Dagger1", "Poisoned_Dagger2", "Royal_Toxins_Spear2", "Agile_Wings_Rapier2", "Sacrificial_Dagger3", "Rune_Claw2", "Hasty_Trident3", "Lacerating_Dagger2"
        , "Abyssal_Scythe2", "Blighted_Claw3", "Shadow_Dagger1", "Witherstab_Rapier3", "Hollow_Reaper_Scythe3", "Void_Vortex_Whip3", "Fear_Hunter_Whip3"
    ]
};
const Slashing = {
    clas: "Slashing", kind: MeleeMaterial, mat: ["Sword", "Scimitar"], uniq: ["Black_Sword3", "Ancient_Sword3", "Ice_Sword2", "Desert_Sabre1", "Tidal_Edge3", "Spectral_Ice_Sword2", "Lightning_Strike_1H_Sword2", "FrostSpark_1H_Sword3"
        , "Pirate_Captains_Sword2", "Ghost_Scimitar3", "Strange_Sword4", "Silentsnap_Crab_Claw2", "Silent_Surge_Crossblade4", "Black_Scimitar3", "Sanguine_Blade3", "Crystal_Twin_Blades1",
    ]
};
const Great = {
    clas: "Great", kind: MeleeMaterial, mat: ["2H_Sword"], uniq: ["Black_2H_Sword3", "Basic_2H_Sword1", "Ice_2h_Sword2", "Ancient_2H_Sword3", "Aeris_Godsword3", "Glacia_Godsword3",
        "Terran_Godsword3", "Ragnar_Godsword3", "Ultima_Godsword4", "Aranite_2H_Blade1", "Darksteel_2H_SWord1", "Familiar_2H_Sword3", "Crystal_2H_Hammer1",
        "Pure_Crystal_2H_Spear1", "Unholy_2H_Sword1", "Cursed_2H_Sword2", "Open_Wounds_Greatsword2"]
}
const Heavy = {
    clas: "Heavy", kind: MeleeMaterial, mat: ["Battleaxe"], uniq: ["Black_Battleaxe3", "Ice_Battleaxe2", "Big_Ron2", "War_Axe1", "Warberd3", "Pure_Crystal_2H_Axe1", "Granite_Mace3", "Blighted_2H_Hook_Sword3", "Blighting_Polearm2",
        "Ethereal_Greataxe2", "Heated_Fury_2H_Hammer2", "Stone_Hammer2", "Rune_Mallet3", "Elerine_Spear2",
    ]
};

const Swift = {
    clas: "Swift", kind: RangedMaterial, mat: ["Shortbow"], uniq: ["Ice_Shortbow2", "Slingshot2", "Desert_Shortbow2", "Poisoned_Shortbow3", "Stormsnap3", "Ancient_Hunting_Bow3", "Crystal_Shortbow1", "Pure_Crystal_Shortbow1", "Basic_Shortbow1", "Lacerating_Shortbow2", "Blighted_Feather_Bow3"]
};
const Precise = {
    clas: "Precise", kind: RangedMaterial, mat: ["Longbow"], uniq: ["Old_Hunting_Bow2", "Ice_Longbow2", "Ancient_Longbow3", "Elerine_Longbow2", "Thorned_Power_Bow2"
        , "Ethereal_Longbow3", "Golden_Bow3", "Familiar_Longbow3", "Engulfing_Vortex_Longbow4", "Crystal_Longbow1", "Pure_Crystal_Longbow1", "Unholy_Longbow1", "Cursed_Longbow1", "Hollow_Nightmare_Bow3", "Malevolent_Blight_Longbow2"
    ]
};
const Steady = {
    clas: "Steady", kind: MeleeMaterial, mat: ["Crossbow"], uniq: ["Ancient_Crossbow3", "Confetti_Crossbow2", "Slayer_Crossbow2", "Shockwave3", "Torrential_Blast_Crossbow3"
        , "Feather_Storm_Crossbow3", "Crystal_Crossbow1", "Pure_Crystal_Crossbow1", "Granite_Crossbow3"
        , "Poison_Crossbow2", "Ghost_Blunderbow3", "Toxic_Blast_Crossbow2", "Witherslinger_Crossbow3", "Stinging_Silence_Crossbow3", "Voidburst_Barrage_Crossbow3"
    ]
};
const Thrown = {
    clas: "Thrown", kind: MeleeMaterial, mat: ["Javelin", "Throwing_Knife"], uniq: ["Ancient_Javelin3", "Ancient_Throwing_Knife3", "Crystal_Throwing_Knife1", "Crystal_Javelin1", "Pure_Crystal_Throwing_Knife1", "Pure_Crystal_Javelin1",
        "Shadow_Throwing_Knife3",
    ]
};

const Air = {
    clas: "Air", kind: MeleeMaterial, uniq: ["Staff_of_Air1", "Air_Battlestaff1", "Mystic_Air_Staff1", "Air_Imbued_Wand1", "Lightning_Staff1", "Lightning_Coil_2H_Staff3", "Crystal_Battlestaff1", "Mystic_Pure_Crystal_Staff1",
        "Brume_Staff1", "Brume_Wand1", "Toxic_Fumes_Wand1", "Hollow_Doom_Staff3"
    ]
};
const Earth = {
    clas: "Earth", kind: MeleeMaterial, uniq: ["Staff_of_Earth1", "Earth_Battlestaff1", "Mystic_Earth_Staff1", "Earth_Imbued_Wand1", "Natures_Call_Staff2", "Natures_Wrath_Staff3", "Poison_Staff1", "Mudball_Staff2"
        , "Gloom_Staff1", "Gloom_Wand1", "Blighted_Staff3", "Silent_Tangle_Wand3"
    ]
};
const Fire = {
    clas: "Fire", kind: MeleeMaterial, uniq: ["Staff_of_Fire1", "Fire_Battlestaff1", "Mystic_Fire_Staff1", "Fire_Imbued_Wand1", "Infernal_Staff1", "Lich_Staff3", "Foresight_Wand3"
        , "Wither_Staff1", "Nether_Staff1", "Wither_Wand1", "Nether_Wand1", "Voidfire_Cascade_Wand3", "Witherbind_Wand3", "Blazing_Shadow_Staff3"
    ]
};
const Water = {
    clas: "Water", kind: MeleeMaterial, uniq: ["Staff_of_Water1", "Water_Battlestaff1", "Mystic_Water_Staff1", "Water_Imbued_Wand1", "Cloudburst_Staff3", "Ocean_Song3", "Rotten_Staff3", "Water_Pulse_Staff3"
        ,  "Cataclysm_Wand1", "Lacerating_Staff2", "Blight_Burst_Staff2"
    ]
};
const Arcane = {
    clas: "Arcane", kind: MeleeMaterial, uniq: ["Magic_Wand_Basic1", "Magic_Wand_Powerful1", "Magic_Wand_Elite1", "Miolite_Sceptre3", "Water_Sceptre3", "Magical_Broomstick3", "Meteorite_Staff1", "Despair_Wand1", "Archaic_Wand1", "Calamity_Wand3"
        , "Ethereal_Staff3", "Slicing_Maelstrom_Wand3", "Familiar_Staff2", "Basic_Staff1", "Soul_Taker_Wand2", "Trickery_Mirror3", "Powered_Red_Crystal3", "Unholy_Staff1", "Cursed_Staff1", "Abyssal_Wand1","Abyssal_Staff1", "Desolation_Wand1", "Shadow_Wand3" ]
};

const Exotic = {
    clas: "Exotic", uniq: ["Bobs_Rake5", "Almighty_Lute4", "Chefs_Spoon4", "Potion_Stirrer4", "Grappling_Hook4", "Chisel4", "Old_Spyglass5", "Ancient_Scythe4", "Fishing_Net5", "Old_Wooden_Ladle5", "Archaeologists_Whip5", "Enhanced_Spyglass5",
        "Abyssal_Hourglass_Upright4", "Abyssal_Hourglass_Inverted4", "Bobs_Lost_Rake4", "Old_Fancy_Quill5", "Magic_Flute6", "Sturdy_Fancy_Quill4"
    ]
};


const namespaces = ["melvorD", "melvorF", "melvorAoD", "melvorTotH", "melvorItA", "rielkConstruction"];

export function addWeaponType(ctx) { // and make your funny map
    for (const type of [Finesse, Slashing, Great, Heavy, Air, Earth, Fire, Water, Swift, Precise, Steady, Thrown, Exotic, Arcane]) {
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
            const baseXP = this.timesAttacked * this.attackSpeed * 0.2313  // Magic number, balanced so you will get 833 xp per hour, so 6 hours for stock, 12 for unusual and 18 for distinct weapons before modifiers.
            return Math.floor(baseXP + baseXP * this._weaponXPBonus / 100);
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

    Object.defineProperty(WeaponItem.prototype, "_weaponXPBonus", {
        get: function () { return game.modifiers.getValue(`rielkConstruction:increaseWeaponXP${this.attackType}`, ModifierQuery.EMPTY); }
    });
    // -- Mod Compat Stuff --
    ctx.onModsLoaded(async (ctx) => {

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
        item.attackSpeed = item.equipmentStats[0].key === 'attackSpeed' ? item.equipmentStats[0].value / 1000 : 4;

        type.allWeapons.push(item);
        if (type.isPerWepMod)
            type.makeWeaponConditional(item);
    }
    else {
        console.log("Not found:", name);
    }
}
