export function hookIntoWeaponType(ctx) {
    const fixList = game.construction.fixtures
    const kindFixMap = { "melee": fixList.getObjectByID("rielkConstruction:Training_Dummy"), "magic": fixList.getObjectByID("rielkConstruction:Spell_Library"), "ranged": fixList.getObjectByID("rielkConstruction:Archery_Range") }
    ctx.onModsLoaded(() => {
        game.weaponMasteries.allObjects.forEach(type => {
            type.fixture = kindFixMap[type.Wtype];
        })
        Object.defineProperty(game.weaponMasteries.allObjects[0].__proto__, "levelCap", {
            get() { return this.fixture.currentTier; }
        })
        Object.defineProperty(game.weaponMasteries.allObjects[0].__proto__, "doubledIndBonuses", {
            get() { return this.levelCap >= 5 ? 1.5 : 1; }
        });
    });
}