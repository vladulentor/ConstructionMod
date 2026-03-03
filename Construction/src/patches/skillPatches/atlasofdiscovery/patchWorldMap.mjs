const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');

export function patchWorldMap(df) {
    console.log("function got called");
    const map = game.cartography.worldMaps.registeredObjects.get('melvorAoD:Melvor')
    console.log("[PATCH] WorldMap constructor after patch called");
    const myPOI = {
        id: "ConstructionVillage",
        coords: { q: 19, r: 7 },
        type: "Other",
        name: "Construction Village",
        description: "TODO: Description",
        media: "assets/items/nails_iron.webp",
        activeStats: {
            modifiers: {
                additionalPrimaryProductChance: [
                    { skillID: "melvorD:Mining", value: 10 },
                    { skillID: "melvorD:Woodcutting", value: 10 }
                ],
                flatSkillInterval: [
                    { skillID: "rielkConstruction:Construction", value: -100 }                ]
            }
        }
    };

    console.log("[PATCH] Creating PointOfInterest...");
    let poi;
    try {
        poi = new PointOfInterest(game.registeredNamespaces.getNamespace('melvorAoD'), myPOI, game, map);
        console.log("[PATCH] PointOfInterest created:", poi);
    } catch (e) {
        console.error("[PATCH] Error creating PointOfInterest:", e);
        return;
    }
    console.log("[DEBUG] POI keys:", Object.keys(poi));
    console.log("[DEBUG] poi.namespace =", poi.namespace);
    console.log("[DEBUG] poi._namespace =", poi._namespace);
    console.log("[DEBUG] namespace getter =", Object.getOwnPropertyDescriptor(Object.getPrototypeOf(poi), "namespace"));
    console.log("[PATCH] Registering soft dependencies...");
    try {
        poi.registerSoftDependencies(myPOI, game);
        console.log("[PATCH] Soft dependencies registered");
    } catch (e) {
        console.error("[PATCH] Error registering soft dependencies:", e);
    }

    console.log("[PATCH] Pushing POI into map.undiscoveredPOIs...");
    try {
        map.pointsOfInterest.registerObject(poi);
        console.log("[PATCH] POI added to map.undiscoveredPOIs");
    } catch (e) {
        console.error("[PATCH] Error pushing to undiscoveredPOIs:", e);
    }

    console.log("[PATCH] WorldMap POI injection done");

};
