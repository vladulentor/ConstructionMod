export function raiseMasteryLevel() {
    for (const mastery of game.weaponMasteries.allObjects)
        if (mastery.fixture.id === this.fixture.id) {
            mastery.checkXP();
            game.bank.renderQueue.mastery = true;
            game.combat.player.renderQueue.equipment = true;;
            game.combat.renderQueue.mastery = true;
        }
}