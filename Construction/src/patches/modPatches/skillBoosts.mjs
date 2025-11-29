export function skillBoostsCompatibility(ctx) {
    skillBoosts.addNewSkill({

        skill: game.construction,

        realmIDs: ['melvorD:Melvor'], 
        header: '#skill-boosts-append', 
        noPreservation: false,
        noMastery: true,
        noSummon: true,
        noPotion: false,
        noDoubling: true,
        noInterval: false,
        noConsumable: true,
        noPrimaryResource: false,
        isArtisan: true,
    });
    skillBoosts.addNewModifiers({
        skills: [game.construction],
        modifiers: new Map([['melvorD:Melvor', ['rielkConstruction:skillEfficiencyChance', 'rielkConstruction:skillEfficiencyPotency', 'rielkConstruction:skillEfficiencyCost']]])
    });
        skillBoosts.addNewModifiers({
        skills: [game.fishing],
        modifiers: new Map([['melvorD:Melvor', ['rielkConstruction:loseGPOnFishingBasedOnFish', 'rielkConstruction:fishingTreasureNoReplace']]])
    });

    ctx.patch(skillBoosts.__proto__.constructor, 'createPetTooltip').after(function (_, container, item) {
        if (item.id === "rielkConstruction:Scoobs") {
            let progress = game.construction.recipeCountByTier.reduce((a, b) => a + b, 0);
            let goal = game.construction.recipeNumber * game.construction.tierMasteries.size;
            const miscContainer = container.querySelector('.sb-font-sm');
            miscContainer.querySelectorAll('.sb-font-2sm').forEach(el => el.remove());
            const elem = document.createElement('span');
            elem.className = 'text-info sb-font-2sm';
            elem.style.marginTop = '4px';
            elem.textContent = `${getLangString('TUTORIAL_MISC_0')}: ${numberWithCommas(progress)}/${numberWithCommas(goal)}`;

            miscContainer.appendChild(elem);
        }
    });
}   