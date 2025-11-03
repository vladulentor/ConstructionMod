export function tinyIconsCompatibility(ctx){
const icons =  mod.api.tinyIcons;  
 icons.addTagSourceMap(new Map([
    ['efficiency', ctx.getResourceUrl('assets/efficiency.png')],
     ['cabin', ctx.getResourceUrl('assets/cabin.png')],
    ['plot', game.items.getObjectByID('melvorD:Bobs_Rake').media]]
    ));
icons.addModifier('rielkConstruction:skillEfficiencyChance', 'efficiency');
icons.addModifier('rielkConstruction:skillEfficiencyPotency', 'efficiency');
icons.addModifier('rielkConstruction:skillEfficiencyCost', 'efficiency');
icons.addModifier('rielkConstruction:constructionActionsToUpgrade', 'cabin');
icons.addModifier('rielkConstruction:farmingTreeSeedReturn', 'preservation');
icons.addModifier('rielkConstruction:spoofUnlockPlot', 'plot');

}