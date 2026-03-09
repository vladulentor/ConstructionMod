export function addXpPerFixture({ patch }) {

    patch(Skill, "getXPModifier").after(function (mod, action) {
        if (this.game.modifiers.getValue("rielkConstruction:xpPer5Fixture", ModifierQuery.EMPTY))
            return mod + this.game.modifiers.getValue("rielkConstruction:xpPer5Fixture", ModifierQuery.EMPTY) * game.construction.totaltier5fixtures;
    })
    patch(Skill, "_buildXPSources").after(function (builder, action) {
        builder.addSources("rielkConstruction:xpPer5Fixture", undefined /* this shit is global so no query */, game.construction.totaltier5fixtures);
    });

}