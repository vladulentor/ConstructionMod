const bows = [
    { mat: "Bronze", otherstuff: [{ id: "melvorD:Bronze_Bar", value: 15 }, { id: "rielkConstruction:Iron_Nails", value: 30 }, { id: "rielkConstruction:Normal_Planks", value: 30 }] },
    { mat: "Iron", otherstuff: [{ id: "melvorD:Iron_Bar", value: 30 }, { id: "rielkConstruction:Iron_Nails", value: 90 }, { id: "rielkConstruction:Normal_Planks", value: 90 }] }
    , { mat: "Steel", otherstuff: [{ id: "melvorD:Steel_Bar", value: 65 }, { id: "rielkConstruction:Steel_Nails", value: 200 }, { id: "rielkConstruction:Oak_Planks", value: 200 }] }
    , { mat: "Mithril", otherstuff: [{ id: "melvorD:Mithril_Bar", value: 200 }, { id: "rielkConstruction:Mithril_Nails", value: 600 }, { id: "rielkConstruction:Teak_Planks", value: 600 }] }
    , { mat: "Adamant", otherstuff: [{ id: "melvorD:Adamant_Bar", value: 375 }, { id: "rielkConstruction:Adamantite_Nails", value: 1000 }, { id: "rielkConstruction:Mahogany_Planks", value: 1000 }] }
    , { mat: "Rune", otherstuff: [{ id: "melvorD:Rune_Bar", value: 575 }, { id: "rielkConstruction:Adamantite_Nails", value: 1750 }, { id: "rielkConstruction:Mahogany_Planks", value: 1750 }] }
    , { mat: "Dragon", otherstuff: [{ id: "melvorD:Dragon_Bar", value: 1000 }, { id: "rielkConstruction:Dragon_Nails", value: 3000 }, { id: "rielkConstruction:Redwood_Planks", value: 3000 }] }

];

const shields = [
    { mat: "Green", otherstuff: [{ id: "melvorD:Topaz", value: 150 }, { id: "rielkConstruction:Green_Dhide_Leather_Straps", value: 250 }, { id: "rielkConstruction:Iron_Nails", value: 250 }] },
    { mat: "Blue", otherstuff: [{ id: "melvorD:Sapphire", value: 250 }, { id: "rielkConstruction:Blue_Dhide_Leather_Straps", value: 350 }, { id: "rielkConstruction:Steel_Nails", value: 350 }]  },
    { mat: "Red", otherstuff: [{ id: "melvorD:Ruby", value: 350 }, { id: "rielkConstruction:Red_Dhide_Leather_Straps", value: 500 }, { id: "rielkConstruction:Mithril_Nails", value: 500 }] },
    { mat: "Black", otherstuff: [{ id: "melvorD:Emerald", value: 450 }, { id: "rielkConstruction:Black_Dhide_Leather_Straps", value: 750 }, { id: "rielkConstruction:Adamantite_Nails", value: 750 }]  },
    { mat: "Ancient", otherstuff: [{ id: "melvorD:Diamond", value: 500 }, { id: "rielkConstruction:Elder_Dhide_Leather_Straps", value: 1000 }, { id: "rielkConstruction:Dragonite_Nails", value: 1000 }] }
]
const namespaces = [ "melvorF", "melvorAoD", "melvorTotH"];
function makeUpgradeList(bow, extras) {
    let list = [{ item: bow, quantity: 1 }];
    for (const extra of extras) {
        const oitem = game.items.getObjectByID(extra.id);
        if (!oitem) continue;
        list.push({ item: oitem, quantity: extra.value });
    }
    return list;

}

export function unlockShieldsCrossbows() {
    for (const bow of bows) {
        const upBow = game.items.getObjectByID(`rielkConstruction:${bow.mat}_Crossbow_T_R`);
        let basebow;
        for (const space of namespaces) {
            const nBow = game.items.getObject(space, `${bow.mat}_Crossbow`)
            if (nBow) {
                basebow = nBow;
                break;
            }
        }
        const list = makeUpgradeList(basebow, bow.otherstuff);
        game.bank.itemUpgrades.set(basebow, [{
            currencyCosts: [],
            itemCosts: list,
            rootItems: [basebow, basebow], // idk why it's here twice but my past code did it like this
            upgradedItem: upBow,
            upgradedQuantity: 1,
            isDowngrade: false

        }]);
    }
    for (const shield of shields) {
        const upShield = game.items.getObjectByID(`rielkConstruction:${shield.mat}_Dhide_Shield_R`);
        const baseshield = game.items.getObject("melvorF", `${shield.mat}_Dhide_Shield_U`)
        const slist = makeUpgradeList(baseshield, shield.otherstuff);
        game.bank.itemUpgrades.set(baseshield, [{
            currencyCosts: [],
            itemCosts: slist,
            rootItems: [baseshield, baseshield],
            upgradedItem: upShield,
            upgradedQuantity: 1,
            isDowngrade: false

        }]);
    }

}