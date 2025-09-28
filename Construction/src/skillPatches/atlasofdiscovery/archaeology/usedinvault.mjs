
const usedInConstructionIds=
[ 
    "melvorAoD:Broken_Jug","melvorAoD:Totem_Pole","melvorAoD:Colourful_Vase","melvorAoD:Old_Wooden_Bowl",
    "melvorAoD:Rock_Carving","melvorAoD:Broken_Odd_Weapon","melvorAoD:Large_Fossil","melvorAoD:Broken_Golden_Harp",
    "melvorAoD:Golbin_Portrait","melvorAoD:Old_Music_Manuscript","melvorAoD:Lockbox_Key",
    "melvorAoD:Old_Tower_Bell","melvorAoD:Diamond_Speck","melvorAoD:Ancient_Stone_Tablet",
    "melvorAoD:Cursed_Golden_Disc","melvorAoD:Amphora","melvorAoD:Ancient_Fossil"

]
// Item object doesn't have a way to check the game instance and loading the entire Atlas of Discovery data to check for recipes would be inefficient
// So we just write down the 15 artefacts used in construction.

export function isUsedInConstruction(item) {


    return usedInConstructionIds.includes(item.id);
;
}
