export function clampMasteryPool(ctx) {
    ctx.onModsLoaded(async (ctx) => {
        if (mod.manager.getLoadedModList().includes("Mastery Pool Can Overflow")) return;
    
  if (mod.manager.getLoadedModList().includes("Mastery Pool Can Overflow")) return; // maybe that skill already does things with this one... idk
        ctx.patch(SkillWithMastery, "masteryPoolCapPercent").get(function (or) {
            this._poolQuerry ??= new ModifierQuery({ skill: this }); // the game probably has something like this already
            return or.call() + this.game.modifiers.getValue("rielkConstruction:skillScopedPoolCap", this._poolQuerry); // well whatever, we could've just done .allObjects[0] instead.

        });

    SkillWithMastery.prototype.clampMastery = function (realm) {
        this._masteryPoolXP.set(realm, Math.min(this.getMasteryPoolCap(realm), this._masteryPoolXP.get(realm)));
    }

    ctx.patch(Player, "computeModifiers").after(function (_) {
        for(const a of game.skills.allObjects)
            {if(a instanceof SkillWithMastery)
                a.clampMastery(a.currentRealm);}
    })

    });
}

//Putting logic in the display element was in fact bad