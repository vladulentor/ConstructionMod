export function hookIntoWeaponType(ctx) {
    ctx.onModsLoaded(() => {
        game.weaponMasteries.allObjects.forEach(mastery => {
            mastery.fixture = mastery.fixture.map(f => game.construction.fixtures.getObjectByID(f));
        })
        Object.defineProperty(game.weaponMasteries.allObjects[0].__proto__, "levelCap", {
            get() { return Math.min(...this.fixture.map(f => f.currentTier)); }
        })
        Object.defineProperty(game.weaponMasteries.allObjects[0].__proto__, "doubledIndBonuses", {
            get() { return this.levelCap >= 5 ? 1.5 : 1; }
        });
    });
}