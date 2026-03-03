const { loadModule } = mod.getContext(import.meta);
const { templateRielkLangStringWithNodes, getRielkLangString } = await loadModule('src/language/translationManager.mjs');

export function addMarkSuperLevels({ patch }) {
    // --------------- UI STUFF ----------------
    patch(SummoningMarkDiscoveryElement, 'updateDiscoveryCount').after(function (_, mark) {
        if (mark.maxMarkLevel > 6) {
            const marklev = game.summoning.getMarkLevel(mark)
            if (marklev >= mark.maxMarkLevel) // Over level 6 (default max), it's green when it's not maxed (but over 6) and gold when it is maxed, to differentiate that it works differently now.
            {
                this.progressBar.classList.remove('bg-summoning', "bg-success");
                this.progressBar.classList.add("bg-construction-success");
            }
            else if (marklev >= 6) {
                this.progressBar.classList.remove('bg-summoning', "bg-construction-success");
                this.progressBar.classList.add("bg-success");
            }

            const name = this.name.querySelector('.text-success');
            name.classList.toggle('construction-victory', marklev >= 10)
            this.image.classList.toggle('gold-marks', marklev >= 10)
        }
    })
    patch(Summoning, 'queueMarkLevelUpModal').replace(function (_, mark) { // I don't see a way to change the text without repalcing it, except doing DOM travels and finding and swapping the text, which is bad and yucky
        const markLevel = this.getMarkLevel(mark);
        const title = templateLangString('MENU_TEXT_MARK_LEVEL', { level: `${markLevel}` });
        let html = `<small>${templateLangString('MENU_TEXT_MARK_LEVELUP_TEXT0', {
            markName: `<span class="font-w700 text-success">${this.getMarkName(mark)}</span>`,
        })}<br><br>${getLangString('MENU_TEXT_MARK_LEVELUP_TEXT1')}<br><br><span class="font-w700 text-warning">${getLangString('MENU_TEXT_MARK_LEVELUP_TEXT2')}</span></small>`;

        if (markLevel >= 2 && markLevel < 7) {
            html = `<small>${templateLangString('MENU_TEXT_MARK_LEVELUP_TEXT3', {
                markName: `<span class="font-w700 text-success">${this.getMarkName(mark)}</span>`,
            })}<br><br>${templateLangString('MENU_TEXT_MARK_LEVELUP_TEXT4', {
                tierNum: `${markLevel - 1}`,
                markLevel: `${markLevel}`,
            })}</small>`;
        }
        else if (markLevel >= 7) {
            const smallText = `<small>${templateLangString('MENU_TEXT_MARK_LEVELUP_TEXT3', {
                markName: `<span class="font-w700 text-success">${this.getMarkName(mark)}</span>`,
            })}</small><br><br>`;
            const nodes = templateRielkLangStringWithNodes('MENU_TEXT_SUMMONING_MARK_POPUP', {
                spiritimg: createElement('img', {
                    className: 'skill-icon-xs',
                    attributes: [['src', game.construction.fixtures.getObjectByID("rielkConstruction:Spirit_Catcher").media]]
                })
            }, {
                spiritname: game.construction.fixtures.getObjectByID("rielkConstruction:Spirit_Catcher").name
            })
            nodes.unshift(smallText);
            html = document.createElement('small'); // Here it's a div
            html.innerHTML = nodes.map(n => typeof n === 'string' ? n : n.outerHTML).join('');
        }

        const modal = {
            title: title,
            html: html,
            imageUrl: mark.markMedia,
            imageWidth: 64,
            imageHeight: 64,
            imageAlt: title,
        };
        addModalToQueue(modal);
    })
    // ---- LOGIC STUFF ------
    patch(Summoning, "discoverMark").before(function (mark) {
        this.tempMarkLevel = this.getMarkLevel(mark)
    });
    patch(Summoning, "discoverMark").after(function (_, mark) {
        const markLevel = this.getMarkLevel(mark)
        if (markLevel > 5 && this.tempMarkLevel !== markLevel && mark.realm._localID == "Melvor") {
            let effectbuffs = game.modifiers.getValue("rielkConstruction:TabletEffectBuffBasedOnMarkLevel", ModifierQuery.ANY_SKILL)
            let numberbuffs = game.modifiers.getValue("rielkConstruction:TabletAmountBuffBasedOnMarkLevel", ModifierQuery.ANY_SKILL);
            let combatbuffs = game.modifiers.getValue("rielkConstruction:TabletFightBuffBasedOnMarkLevel", ModifierQuery.ANY_SKILL);
            let modtoadd = null
            if (effectbuffs)
                buffMarkEffects(mark, effectbuffs)
            if (numberbuffs)
                modtoadd = addExtratablets(mark, numberbuffs, false)
            if (combatbuffs)
                addSummoningCombat(mark, combatbuffs)
            if (modtoadd)
                game.modifiers.addModifier(game.construction.fixtures.getObjectSafe("rielkConstruction:Spirit_Catcher").name, modtoadd, 1, 1) // Apparently the array has default values, but the addModifier function throws without knowing pos and negmult are 1
            if (effectbuffs || combatbuffs) {
                mark.product._modifiedDescription = mark.product.description; // It doesn't change automatically otherwise
                this.renderQueue.selectedRecipe = true
            }
        }
        this.tempMarkLevel = undefined
    });
    // Mark Doubling code

    patch(Summoning, "getChanceForMark").after(function (ret, mark, skill, modifiedInterval) {
        if (this.game.combat.player.equipment.checkForItem(mark.product)) {
            return ret + ret * game.modifiers.getValue("rielkConstruction:IncreaseMarkChance", ModifierQuery.EMPTY)
        }
    })

}
const Marksthatneedtoberounded = new Set(["Crow", "GolbinThief", "Wolf", "Leprechaun", "Spectre", "Cyclops"]) //Note, not all have been checked, I'm just being safe
function buffMarkEffects(mark, amountper) {
    const item = mark.product
    const toadd = amountper / 100 * (Math.max(0, game.summoning.getMarkLevel(mark) - 5))
    let rounddown = Marksthatneedtoberounded.has(mark._localID)
    if (item.modifiers?.length > 0) buffModList(item.modifiers, toadd, rounddown)
    if (item.enemyModifiers?.length > 0) buffModList(item.enemyModifiers, toadd, rounddown)
    if (item.conditionalModifiers?.length > 0) buffModList(item.conditionalModifiers, toadd, rounddown)
    if (item._customDescription) {
        ctx.patch(item.__proto__.constructor, "description").get(function (orig) {
            if (!this.origdesc)
                this.origdesc = orig.call()
            return this.origdesc.replace(/\d+(\.\d+)?/g, match => {
                let value = Number(match);
                value += value * toadd;
                if (rounddown) value = Math.floor(value);
                return value;
            })
        })
    }
}
function buffModList(list, toadd, rounddown) {
    list.forEach(effect => {
        if (effect.orig == undefined)
            effect.orig = effect.value

        effect.value = effect.orig + effect.orig * toadd
        if (rounddown)
            effect.value = Math.trunc(effect.value)
    })
}
function addExtratablets(mark, amountper, init = false) {
    let toadd = (Math.max(0, (game.summoning.getMarkLevel(mark) - 5)));
    if (toadd > 0 && !init)
        toadd = 1  // Aka if we're leveling up   
    toadd *= amountper
    const extratablets = new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:flatBasePrimaryProductQuantity'), toadd, {
        skill: game.summoning,
        action: mark
    })
    return extratablets
}

function addSummoningCombat(mark, amountper) {
    const toadd = amountper / 100 * Math.max(0, game.summoning.getMarkLevel(mark) - 5);
    const item = mark.product;
    if (item.equipmentStats.length > 0) // Probably other better ways to check if it's a combat summon fam
        item.equipmentStats.forEach(stat => {
            if (stat.orig == undefined)
                stat.orig = stat.value;
            stat.value = stat.orig + stat.orig * toadd;
            stat.value = Math.trunc(stat.value * 10) / 10 // For some reason to hit can have 1 fractional place but no more
        })
}

// We are very lucky that there is no popup tooltip for product quantity, so we don't need to add the effect properly with translated strings and make it with a slope based on mark level
// we can just keep adding it as mark level goes up

let effguard = false
let recipeguard = false
let combatguard = false
const extraLevels = [81, 101, 126, 151];
function actuallyAddMarks(level) {
    // --- LOGIC TO ADD THE LEVELS --------
    // ---------- BUFF LOGIC (As well)--------------

    const recipes = game.summoning.actions.allObjects.filter(recipe => recipe.realm._localID === "Melvor");
    let buffeffnum = game.modifiers.getValue("rielkConstruction:TabletEffectBuffBasedOnMarkLevel", ModifierQuery.ANY_SKILL);
    let buffnumnum = game.modifiers.getValue("rielkConstruction:TabletAmountBuffBasedOnMarkLevel", ModifierQuery.ANY_SKILL);
    let buffcombnum = game.modifiers.getValue("rielkConstruction:TabletFightBuffBasedOnMarkLevel", ModifierQuery.ANY_SKILL);
    let buffef = (buffeffnum !== 0 && !effguard)
    let buffnum = (buffnumnum !== 0 && !recipeguard)
    let buffcomb = (buffcombnum !== 0 && !combatguard)
    let bufflev = false

    if (level >= 4 && Summoning.markLevels.length < level * 2) {
        while (Summoning.markLevels.length < level * 2 && extraLevels.length > 0) {
            Summoning.markLevels.push(extraLevels.shift());
        }
        bufflev = true
    }
    let modifiersToAdd = []

    recipes.forEach(recipe => {
        if (bufflev)
            recipe.maxMarkLevel = Summoning.markLevels.length
        if (buffef)
            buffMarkEffects(recipe, buffeffnum)
        if (buffnum)
            modifiersToAdd.push(addExtratablets(recipe, buffnumnum, true))
        if (buffcomb)
            addSummoningCombat(recipe, buffcombnum)
        if (bufflev || buffef || buffnum || buffcomb) {
            summoningMarkMenu.updateDiscoveryCount(recipe)
            recipe.product._modifiedDescription = recipe.product.description;
        }
    })
    effguard = buffef
    recipeguard = buffnum
    combatguard = buffcomb
    if (modifiersToAdd.length > 0)
        game.modifiers.addModifiers(game.construction.fixtures.getObjectSafe("rielkConstruction:Spirit_Catcher").name, modifiersToAdd)

    // For the extra chance effect at the end, put here for convenience
    if (level >= 5) {
        const trainingElement = summoningMarkMenu
            .querySelector('lang-string[lang-id="MENU_TEXT_MARK_INFO_3"]');
        if (trainingElement) {
            trainingElement.innerHTML = getRielkLangString("MENU_TEXT_MARKS_UPGRADED");
        }
    }
}
const ctx = mod.getContext(import.meta);

export function addMarkExtraLevels() {
    let tier = this.fixture.currentTier
    if (game.construction.notifs) { // This is shorthand for "when this runs and it's not in the startup" aka when someone upgrades it during normal gameplay.
        actuallyAddMarks(tier);
    }
    else {
        ctx.onCharacterLoaded(() => {
            actuallyAddMarks(tier)
        })
    }

}