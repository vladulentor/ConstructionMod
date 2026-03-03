export function patchFletchingOrder(){
    const catsReg = game.fletching.categories;
    const myCatID = 'rielkConstruction:Wood_Beams';
    const myCat = catsReg.getObjectByID(myCatID);

    if (myCat) {
        const newMap = new Map();
        newMap.set(myCatID, myCat); // Our goes first, badass style.
        catsReg.registeredObjects.forEach((obj, id) => {
            if (id !== myCatID) newMap.set(id, obj);
        });

        catsReg.registeredObjects = newMap;
    }
}