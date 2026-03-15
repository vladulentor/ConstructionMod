export function patchWeaponTypeLogic({patch}){
    patch(Player, "rewardXPAndPetsForDamage").after(function(_, damage){
        
    });

}