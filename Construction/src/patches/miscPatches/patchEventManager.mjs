        export function patchEventManager(ctx){
        ctx.patch(EventManager, 'loadEvents').before(() => {
            if (game.construction.isUnlocked)
                return;
            if (game.currentGamemode.startingSkills != undefined && game.currentGamemode.startingSkills.has(game.construction)) {
                game.construction.setUnlock(true);
            }
            game.construction.updateForExistingCapIncreases();
        });
    }