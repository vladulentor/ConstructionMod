let guard2 = false;
let guard3 = false
let guard5 = false;
const smithingbon = game.smithing.masteryPoolBonuses.get(game.realms.getObjectByID("melvorD:Melvor"));

export function addNewMasteryPoolBonuses() {
    if (this.tier >= 2 && !guard2) {
        const miningbon1 = smithingbon.find(mas => mas.percent === 10); // too lazy to change the name, w/e
        const miningbon2 = smithingbon.find(mas => mas.percent === 25);
        const miningbon3 = smithingbon.find(mas => mas.percent === 50);
        const miningbon4 = smithingbon.find(mas => mas.percent === 95);

        const ourmod1 = new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:skillXP'), 2.5, { skill: game.construction })
        const ourmod2 = new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:skillPreservationChance'), 2.5, { skill: game.construction })
        const ourmod3 = new ModifierValue(game.modifierRegistry.getObjectByID('rielkConstruction:skillEfficiencyChance'), 5, {})

        miningbon1.modifiers.push(ourmod1);
        miningbon2.modifiers.push(ourmod2);
        miningbon3.modifiers.push(ourmod2);
        miningbon4.modifiers.push(ourmod3);
        guard2 = true
    }



    if (this.tier >= 3 && !guard3) {
        const ourmod11 = new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:flatSmithingCoalCost'), -1, {});
        const ourmod12 = new ModifierValue(game.modifierRegistry.getObjectByID('rielkConstruction:skillEfficiencyCost'), -10, {});
        const newBonus = new MasteryPoolBonus({ realm: "melvorD:Melvor", percent: 125 }, game);
        newBonus.scrubMe = 1;
        newBonus.modifiers = [ourmod11, ourmod12];
        smithingbon.push(newBonus);
        guard3 = true;
    }
    if (this.tier >= 5 && !guard5) {
        const newBonus2 = new MasteryPoolBonus({ realm: "melvorD:Melvor", percent: 155 }, game);
        const newBonus3 = new MasteryPoolBonus({ realm: "melvorD:Melvor", percent: 185 }, game); // at this point you think i would use a helper, but no.
        newBonus2.scrubMe = 1;
        newBonus3.scrubMe = 1;

        const ourmod31 = new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:flatSkillInterval'), -200, { skill: game.smithing });
        const ourmod32 = new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:flatSkillInterval'), -100, { skill: game.construction });

        const ourmod21 = new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:additionalPrimaryProductChance'), 15, { category: game.smithing.categories.getObjectByID("melvorD:Bars"), skill: game.smithing })
        const ourmod22 = new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:additionalPrimaryProductChance'), 7.5, { category: game.construction.categories.getObjectByID("rielkConstruction:Materials"), skill: game.construction })


        newBonus2.modifiers = [ourmod21, ourmod22];
        newBonus3.modifiers = [ourmod31, ourmod32];


        smithingbon.push(newBonus2);
        smithingbon.push(newBonus3);

        guard5 = true;
    }

    game.smithing.computeProvidedStats(game.construction.notifs);
    for (let i = game.softDataRegQueue.length - 1; i >= 0; i--) {
        if (game.softDataRegQueue[i].object.scrubMe) {
            game.softDataRegQueue.splice(i, 1);
        }
    }
    
}
