export function skillBoostsCompatibility() {
    skillBoosts.addNewSkill({
        // Required //
        skill: game.construction,
        // Optional //
        realmIDs: ['melvorD:Melvor'], // Just write it explicitly
        //header: HTMLElement, // A header is only required if there is no `skill.header` property //
        noPreservation: false,
        noMastery: true,
        noSummon: false,
        noPotion: false,
        noDoubling: false,
        noInterval: false,
        noConsumable: false,
        noPrimaryResource: false,
        sArtisan: true,
    });
}