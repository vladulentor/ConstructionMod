export function patchMasteryPoolProgress({patch}){
    patch(SkillWithMastery, "getMasteryPoolProgress").replace(function(_, realm, xp){
        let percent = (100 * this._masteryPoolXP.get(realm)) / this.getBaseMasteryPoolCap(realm);
        percent += this.game.modifiers.masteryPoolProgress;
        this._poolQuerry ??= new ModifierQuery({ skill: this });
        return clampValue(percent, 0, 100 + this.game.modifiers.getValue("rielkConstruction:skillScopedPoolCap", this._poolQuerry));

    });
}