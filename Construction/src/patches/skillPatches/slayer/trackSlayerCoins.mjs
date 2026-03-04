const petList = game.combatAreas.allObjects.filter(area => area.namespace != "melvorTotH" && area.namespace != "melvorItA" && area.pet && !area.fixedPetClears)

let doubled = false //just for peace of mind
function doublePetChance() {
    if (doubled) return;
    else doubled = true;
    petList.forEach(area => {
        if (!area.pet.orig)
            area.pet.orig = area.pet.weight;
        area.pet.weight = Math.ceil(area.pet.weight / 2)

    })
}
function restorePetChance() {
    doubled = false;
    petList.forEach(area => {
        if (!area.pet.orig) // Aka hasn't been changed yet
            area.pet.orig = area.pet.weight;
        else
            area.pet.weight = area.pet.orig

    })

}
const SLAYER = "SlayerCoins"
export function trackSlayerCoins({ patch }) {

    patch(Currency, "remove").before(function () {
        if (this.localID == SLAYER)
            this.have1Mslayer = this.amount >= 1000000
    })
    patch(Currency, "remove").after(function (_) {
        if (this.localID == SLAYER) {
            const MillSlayer = this.amount >= 1000000
            if (MillSlayer != this.have1Mslayer && this.game.modifiers.getValue("rielkConstruction:doublepetsmillion", ModifierQuery.EMPTY))
                restorePetChance();
        }
        this.have1Mslayer = undefined;
    })
    patch(Currency, "add").before(function () {
        if (this.localID == SLAYER)
            this.have1Mslayer = this.amount >= 1000000
    })
    patch(Currency, "add").after(function (_) {
        if (this.localID == SLAYER) {
            const MillSlayer = this.amount >= 1000000
            if (MillSlayer != this.have1Mslayer && this.game.modifiers.getValue("rielkConstruction:doublepetsmillion", ModifierQuery.EMPTY))
                doublePetChance();
        }
        this.have1Mslayer = undefined;
    })

}

export function checkForInitialMill() {
    if (game.currencies.getObjectSafe("melvorD:SlayerCoins").amount >= 1000000)
        doublePetChance();
}