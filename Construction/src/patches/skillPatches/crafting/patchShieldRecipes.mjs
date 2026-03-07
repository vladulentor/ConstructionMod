export function patchShieldRecipes(){
const crafting = game.crafting.actions;
const plankTier = {Green:"Normal", Blue:"Oak", Red:"Teak", Black:"Mahogany"};
["Green", "Blue", "Red","Black"].forEach(col =>{
    const shield = crafting.getObjectByID(`melvorF:${col}_Dhide_Shield`)
    shield.itemCosts = [{item:game.items.getObjectSafe(`rielkConstruction:${col}_Dhide_Leather_Slivers`), quantity:10}, 
                        {item:game.items.getObjectSafe(`rielkConstruction:${plankTier[col]}_Planks`), quantity:2}];
})

}