//I realize you could just define it in the data.json or do some smarter stuff to not go through this array at startup unnecesarily, but that'd take too much time to set up.
//It's done like this so it can be turned on/off depending on fixture tier

function addIt(toAdd) {
    const ItemList = game.firemaking.actions.registeredObjects;
    ItemList.forEach(item => {
        if(item.realm._localID == "Abyssal") return;
        const products = item.secondaryProducts;
        if (!products.includes(toAdd))
            products.push(toAdd);
    });
}

export function addSaplingBranchDrop() {

    const product = new FiremakingProduct({
        itemID: 'rielkConstruction:Sapling_Branch',
        chance: this.tier >= 5 ? 3.9 : 1.3,
        quantity: 1
    }, game);
    game.firemaking.secondaryProducts.set(product.item, product);

    if (this.tier >= 2)
        addIt(product.item);
}
