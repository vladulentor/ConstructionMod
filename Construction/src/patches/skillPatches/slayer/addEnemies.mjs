function addMonster(monster, ourArea) {
    ourArea.monsters.push(monster);
    let ourMenuElem = -1
    combatAreaMenus.all.forEach((menu, cat) => {
        if (cat._localID !== ourArea._category._localID) return;
        menu.menuElems.forEach((menuElem, area) => {
            if (area._localID !== ourArea._localID) return;
            ourMenuElem = menuElem.monsterSelectElements.values().next().value;
        })
    })
    if (ourMenuElem === -1) return;
    ourMenuElem.createRow(monster, ourArea)
}
let guard1 = false;
let guard2 = false;
let guard3 = false;
let guard4 = false;
let guard5 = false;

export function addEnemies() {


    if (this.tier >= 1 && !guard1) {
        const coffin = game.monsters.getObjectByID("rielkConstruction:HauntedCoffin")
        const gra = game.combatAreas.getObjectByID("melvorD:Graveyard");
        addMonster(coffin, gra)
        guard1 = true;
    }
    if (this.tier >= 2 && !guard2) {
        const carriage = game.monsters.getObjectByID("rielkConstruction:SmugglerCarriage")
        const hid = game.combatAreas.getObjectByID("melvorD:Bandit_Hideout");
        addMonster(carriage, hid)
        guard2 = true;
    }
    if (this.tier >= 3 && !guard3) {
        const sculpt = game.monsters.getObjectByID("rielkConstruction:IceSculpture")
        const hills = game.combatAreas.getObjectByID("melvorD:Icy_Hills");
        addMonster(sculpt, hills)
        guard3 = true;
    }
    if (this.tier >= 4 && !guard4) {
        const golem = game.monsters.getObjectByID("rielkConstruction:Expert_Golem")
        const tow = game.combatAreas.getObjectByID("melvorD:Wizard_Tower");
        addMonster(golem, tow)
        guard4 = true;
    }
    if (this.tier >= 5 && !guard5) {
        const dragon = game.monsters.getObjectByID("melvorF:ElderDragon")
        dragon.lootTable.drops = [{ item: game.items.getObjectSafe("melvorF:Elder_Dragonhide"), maxQuantity: 20, minQuantity: 1, weight: 2 }, { item: game.items.getObjectSafe("rielkConstruction:Elder_Dhide_Leather_Slivers"), maxQuantity: 35, minQuantity: 3, weight: 1 }];
        dragon.lootTable.totalWeight = 3;
        const val = game.combatAreas.getObjectByID("melvorD:Dragon_Valley");
        addMonster(dragon, val)
        guard5 = true;
    }

}

