export function patchFletchingOrder(){
    const catsReg = game.fletching.categories;
    const myCatID = 'rielkConstruction:Wood_Beams';
    const myCat = catsReg.getObjectByID(myCatID);

    if (myCat) {
        // Rebuild registeredObjects with myCat first
        const newMap = new Map();

        // Put our category first
        newMap.set(myCatID, myCat);

        // Then put the rest
        catsReg.registeredObjects.forEach((obj, id) => {
            if (id !== myCatID) newMap.set(id, obj);
        });

        catsReg.registeredObjects = newMap;
    }
}