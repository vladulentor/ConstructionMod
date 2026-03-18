export function clampMasteryPool(ctx) {
    ctx.onModsLoaded(async (ctx) => {
        if (mod.manager.getLoadedModList().includes("Mastery Pool Can Overflow")) return;
    
    SkillWithMastery.prototype.clampMastery = function (realm) {
        this._masteryPoolXP.set(realm, Math.min(this.getMasteryPoolCap(realm), this._masteryPoolXP.get(realm)));
    }

    ctx.patch(MasteryPoolDisplayElement, "updateProgress").before(function (skill, realm) {
        skill.clampMastery(realm);
    })

    });
}

//Putting logic in the display element is bad, but like... I can't find a good place to put it.