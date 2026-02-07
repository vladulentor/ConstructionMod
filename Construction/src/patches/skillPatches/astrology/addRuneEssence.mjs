const ctx = mod.getContext(import.meta);
const RUNES_TO_GET = 100; // avg. of 51 runes per success, it's equal to mining rune essence at 6% chance to get these.
const run = game.items.getObjectSafe('melvorD:Rune_Essence');
export function addRuneEssence() {
    const astro = game.astrology;
    astro.baseRandomItemChances.set(run, 1);
    astro.actions.allObjects.forEach(conste => conste.randomItems.push(run));
    astrologyMenus.infoPanel.addRuneChances = function () {
        const chanceIcon = createElement('item-chance-icon');
        chanceIcon.setItem(run);
        const container = this.doublingChance.parentNode; //Code to make it the first since it's a super not special result.
        const firstItemIcon = container.querySelector('item-chance-icon');
        container.insertBefore(chanceIcon, firstItemIcon);
        this.itemChances.push(chanceIcon);
    }
    if (game.construction._notifs)
        ctx.onInterfaceReady((ctx) => astrologyMenus.infoPanel.addRuneChances())
    else
        astrologyMenus.infoPanel.addRuneChances();
    astro.renderQueue.stardustRates = 1;
    addRuneBonuses();
}

function addRuneBonuses() {
    const scrol = game.items.getObjectSafe('melvorF:Scroll_Of_Essence');
    scrol.modifiers.push(
        new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:randomProductChance'), 2, {
            skill: game.astrology,
            item: run
        }));
    scrol.consumesOn.push(game.items.getObjectSafe('melvorF:Golden_Star').consumesOn[0]);
}

export function addRuneEssenceCtx({ patch }) {
    patch(Astrology, 'actionRewards').get(function (orig) {
        let rewards = orig();
        if (1 && rewards._items.has(run)) {
            const rune = rollInteger(1, RUNES_TO_GET);
            rewards._items.set(run, rune);
        }
        return rewards;
    })
}
/*        if(cloudManager.hasTotHEntitlementAndIsEnabled)
    
            { const Crow = game.summoning.actions.getObjectSafe("melvorF:Crow");
                const Owl = game.summoning.actions.getObjectSafe("melvorTotH:Owl");

    }
*/// This should be another upgrade in ToTH... I think.