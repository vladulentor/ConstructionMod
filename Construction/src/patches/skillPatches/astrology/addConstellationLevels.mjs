export function addConstellationLevels(){ // Note, the game never clamps timesBought to maxCount, so if a player gets to a level higher than default and uninstalls construction, it'll be left at a value higher than normal.
    // This isn't important enough to fix since it'd be a lot of work to keep tack of a virtual level tracker.
 
          const astro = game.astrology;

        const stardust = game.items.getObjectSafe('melvorF:Stardust');

    astro.actions.allObjects.forEach(conste => conste.standardModifiers.forEach(mod => {
        mod.maxCount += 1;
        mod.costs.push({item: stardust, quantity: 1600});
    }));

}