export function skillBoostsCompatibility() {
    let myheader= document.getElementById('rielk-mastery');
    skillBoosts.addNewSkill({
        // Required //
        skill: game.construction,
        // Optional //
        realmIDs: ['melvorD:Melvor'], // My god Slash, you really made it easy for idiots like me, after trying to get ETA to somehow work for a day straight this is amazing
        header: myheader, // A header is only required if there is no `skill.header` property //
        noPreservation: false,
        noMastery: true,
        noSummon: true,
        noPotion: true,
        noDoubling: false,
        noInterval: false,
        noConsumable: true,
        noPrimaryResource: false,
        isArtisan: true,
    });
}