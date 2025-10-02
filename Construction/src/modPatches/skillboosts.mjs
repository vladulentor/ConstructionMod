export function skillBoostsCompatibility(ctx) {
    skillBoosts.addNewSkill({
        // Required //
        skill: game.construction,
        // Optional //
        realmIDs: ['melvorD:Melvor'], 
        noPreservation: false,
        noMastery: false,
        noSummon: true,
        noPotion: true,
        noDoubling: false,
        noInterval: false,
        noConsumable: true,
        noPrimaryResource: false,
        isArtisan: true,
    });

}   