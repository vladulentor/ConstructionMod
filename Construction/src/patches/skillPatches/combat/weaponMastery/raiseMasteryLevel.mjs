export function raiseMasteryLevel() {
    for (const mastery of game.weaponMasteries.allObjects)
        for (const sfixture of mastery.fixture)
            if (sfixture.id === this.fixture.id)
                {mastery.checkXP();
                   game.bank.renderQueue.mastery = true;
                }
}