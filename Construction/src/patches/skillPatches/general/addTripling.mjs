const { loadModule } = mod.getContext(import.meta);

const { templateRielkLangString } = await loadModule('src/language/translationManager.mjs');

export function addTripling(ctx) { // replace to remove the clamp, we kind of need to.
    ctx.patch(Skill, "getDoublingChance").replace(function (_, action) {
        return game.modifiers.getValue("rielkConstruction:unlockTripling", ModifierQuery.EMPTY) ? clampValue(this.getUncappedDoublingChance(action), 0, 200) : clampValue(this.getUncappedDoublingChance(action), 0, 100);

    })
    ctx.patch(DoublingIconElement, "setChance").after(function (_, chance, sourceSpans) {
        if (!this.triplingsrc) {
            this.triplingsrc = ctx.getResourceUrl('assets/tripling.webp');
            this.doublingsrc = this.image.src;
            this.badge = this.chance;
        };

        if (chance > 100) {
            this.image.src = this.triplingsrc;
            //this.badge.classList.add('bg-rielk-construction');
            this.tooltipElem.setCap(chance);
        }
        else {
            this.image.src = this.doublingsrc;
            //this.badge.classList.remove('bg-rielk-construction');

        }

    })
    ctx.patch(DoublingIconTooltipElement, "setCap").after(function (_, chance) { // we're technically bending this function into something else in our case... but hey, if it works
        // I feel like all my comments are comments like that
        // You know I think I'm so cool when I leave random ellipses like I'm mysterious and everyone is in rapt attention listening to me
        if (game.modifiers.getValue("rielkConstruction:unlockTripling", ModifierQuery.EMPTY) && chance >= 100) {
            this.cap.textContent = templateRielkLangString("MENU_TOOLTIP_TRIPLING", { chance:formatPercent( chance - 100, 0) });
            this.cap.classList.add("construction-victory");
            this.cap.classList.add("fuck-you");
        }
        else {
            this.cap.classList.remove("construction-victory");
            this.cap.classList.remove("fuck-you");
        }

    })
    // all that UI and this is the only actual logic we do, classic
    ctx.patch(Skill, "applyPrimaryProductMultipliers").after(function(nquant, _, _2, action){
        if(rollPercentage(this.getDoublingChance(action)-100))
        {return nquant / 2 * 3}
    })
}