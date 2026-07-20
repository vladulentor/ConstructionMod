export function raiseMasteryLevel() {
    for (const mastery of game.weaponMasteries.allObjects)
        if (mastery.fixture.id === this.fixture.id && mastery.activeWeapon!==undefined) { //aka if we're not in preload. Should have just used the uh notif checker, oh well
            mastery.checkXP();
            game.bank.renderQueue.mastery = true;
            game.combat.player.renderQueue.equipment = true;;
            game.combat.renderQueue.mastery = true;
        }
}