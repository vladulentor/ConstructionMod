
export function addSpecialFishingItems() {

const table = game.fishing.specialItemTables.get(game.defaultRealm).drops;

table[0].weight -= 200; // this is topaz, unless anyone messes with it. We do this so that we don't make any of the rarer items rarer still

const MarinersItem = game.items.getObjectByID("rielkConstruction:Mariners_Tie"); // so we dont repeat ourselves
const TarJar = {item: game.items.getObjectByID("rielkConstruction:Tar_Jar"), minQuantity:300, maxQuantity:300, weight:175}; //P.S. the min and maxquantity dont actually get used in this droptable
const MarinersTie = {item: MarinersItem, minQuantity:1, maxQuantity:1, weight:2};
const Cursed_Hook = {item: game.items.getObjectByID("rielkConstruction:Cursed_Hook"), minQuantity:1, maxQuantity:1, weight:23};

table.push(TarJar, MarinersTie, Cursed_Hook);

//code to add the blouse upgrade to the sailors top
const SailorsItem = game.items.getObjectByID("melvorF:Sailors_Top");
game.bank.itemUpgrades.set(SailorsItem, [{
    currencyCosts : [],
    itemCosts : [
        {item:SailorsItem,quantity:1},
        {item:MarinersItem, quantity:1}
    ],
    rootItems:[SailorsItem, SailorsItem],
    upgradedItem:game.items.getObjectByID("rielkConstruction:Mariners_Blouse"),
    upgradedQuantity:1,
        isDowngrade: false
}]);

// we could use gameData to add the upgrade normally, but that would spoil the surprise. I'm a surprise kind of guy
}
