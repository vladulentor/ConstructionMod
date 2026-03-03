export function bypassGlobalDoubling({patch}){
patch(Skill, 'getDoublingChance').after(function(ret, action){
    return clampValue(ret+this.game.modifiers.getValue("rielkConstruction:bypassGlobalDoubling", this.getActionModifierQuery(action)), 0, 100)
})
patch(Skill, '_buildDoublingSources').after(function(build,action){
    build.addSources("rielkConstruction:bypassGlobalDoubling", this.getActionModifierQuery(action))
    return build
})
}