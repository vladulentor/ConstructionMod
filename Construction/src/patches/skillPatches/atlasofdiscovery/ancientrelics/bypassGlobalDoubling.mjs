export function bypassGlobalDoubling({patch}){
patch(Skill, 'getUncappedDoublingChance').after(function(ret, action){
    return ret+this.game.modifiers.getValue("rielkConstruction:bypassGlobalDoubling", this.getActionModifierQuery(action));
})
patch(Skill, '_buildDoublingSources').after(function(build,action){
    build.addSources("rielkConstruction:bypassGlobalDoubling", this.getActionModifierQuery(action))
    return build
})
}