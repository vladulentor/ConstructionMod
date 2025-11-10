export function skillBoostsCompatibility(ctx) {
    skillBoosts.addNewSkill({
        // Required //
        skill: game.construction,
        // Optional //
        realmIDs: ['melvorD:Melvor'], // My god Slash, you really made it easy for idiots like me, after trying to get ETA to somehow work for a day straight this is amazing
        header: '#skill-boosts-append', // second thanks for this <-
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
        modifiers: new Map([['melvorD:Melvor',['rielkConstruction:skillEfficiencyChance', 'rielkConstruction:skillEfficiencyPotency', 'rielkConstruction:skillEfficiencyCost']]])
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