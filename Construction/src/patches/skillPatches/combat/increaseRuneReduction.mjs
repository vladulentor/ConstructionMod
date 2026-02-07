export function increaseRuneReduction() {
    for (const [key, value] of game.items.registeredObjects) {
        if (value instanceof WeaponItem && value.attackType == "magic" && value.providedRunes.length > 0) {
            value.providedRunes.forEach(runeb => {
                runeb.quantity += 1;
            })
            // This isn't very wise to do, changing the description like this... but if there's any problems we can check later, right?
            if (value.description){
                    const originalGetter = value.description; // I read online that this makes the description value static after this, like we'd change it again. (<- Clueless )
                Object.defineProperty(value, 'description', {
                    get() {
                        return originalGetter.replace(/\d+/, match => +match + 1);
                    }
                })}

            if (value._modifiedDescription)
                value._modifiedDescription = undefined;//value._modifiedDescription.replace(/\d+/, match => +match + 1);


        }
    }
    if (game.construction.notifs)
        game.combat.player.computeRuneProvision();
}