export function patchWorldMap() {
    const map = game.cartography.worldMaps.registeredObjects.get('melvorAoD:Melvor')
    const myPOI1 = {
        id: "DocksideAtelier",
        coords: { q: 19, r: -2 },
        type: "Other",
        name: "MAP_POI_House",
        description: "MAP_POI_House_Desc",
        media: 'assets/others/warehouse.webp',
        activeStats: {
            modifiers: {
                "rielkConstruction:skillEfficiencyChance": [
                    {
                        categoryID: "rielkConstruction:House",
                        skillID: "rielkConstruction:Construction",
                        value: 5
                    }
                ],
                "rielkConstruction:constructionActionsToUpgrade": [
                    {
                        skillID: "rielkConstruction:Construction",
                        value: -5
                    }
                ]
            }
        }
    };
    const myPOI2 = {
        id: "GolbinsYard",
        coords: { q: 18, r: -2 },
        type: "Other",
        name: "MAP_POI_Yard",
        description: "MAP_POI_Yard_Desc",
        media: 'assets/others/warehouse2.webp',
        activeStats: {
            modifiers: {
                additional3PrimaryProductChance: [
                    {
                        skillID: "rielkConstruction:Construction",
                        categoryID: "rielkConstruction:Materials",
                        value: 15
                    }
                ],
                flatSkillInterval: [
                    {
                        skillID: "rielkConstruction:Construction",
                        categoryID: "rielkConstruction:Materials",
                        value: -150
                    }
                ],
                skillXP: [
                    {
                        skillID: "rielkConstruction:Construction",
                        value: -50
                    }
                ]
            }
        }
    };
    const hex1 = map.hexes.get(19).get(-2);
    const hex2 = map.hexes.get(18).get(-2);
    [{ hex: hex1, poi: myPOI1 }, { hex: hex2, poi: myPOI2 }].forEach(pair => {
        let regpoi;
        try {
            regpoi = new PointOfInterest(game.registeredNamespaces.getNamespace('rielkConstruction'), pair.poi, game, map);
        } catch (e) {
            console.error("[PATCH] Error creating PointOfInterest:", e);
            return;
        }
        try {
            regpoi.registerSoftDependencies(pair.poi, game);
        }
        catch (e) {
            console.error("[PATCH] Error registering soft dependencies:", e);
            return;
        }
        pair.hex.maxMasteryLevel = 5
        pair.hex.pointOfInterest = regpoi
        try {
            map.pointsOfInterest.registerObject(regpoi);
        }
        catch (e) {
            console.error("[PATCH] Error pushing to undiscoveredPOIs:", e);
            return;
        }
        if (pair.hex.surveyLevel >= 5)
        { map.discoveredPOIs.push(regpoi) }
    })
};
