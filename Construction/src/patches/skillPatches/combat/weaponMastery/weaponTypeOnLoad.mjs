function onLoadWeaponTypes(){
 
}

export function weaponTypeOnLoad({patch}){
    patch(Game, 'onLoad').after(function(_){
    
        onLoadWeaponTypes();
    })
}