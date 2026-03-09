
let guard1 = false;
let guard2 = false;
let guard3 = false;
let guard4 = false;
let guard5 = false;
let obsMap = new Map();

export function removeObstacles(ctx) {
    ctx.onCharacterLoaded(async (ctx) => {
        game.agility.sortedMasteryActions = game.agility.sortedMasteryActions.filter(obstacle =>
            (obstacle._namespace.name !== "rielkConstruction" || obstacle === obsMap.get(obstacle.category)))
    });
}

const agi = game.agility;
export function addObstacle() {
    let obsToAdd = []
    if (this.tier >= 1 && !guard1) {
        const obs = agi.actions.getObjectSafe("rielkConstruction:WarmUpStretches")
        obsMap.set(obs.category, obs);
        if (game.construction.notifs)
            obsToAdd.push(obs)
        guard1 = true;
    }
    if (this.tier >= 2 && !guard2) {
        const obs = agi.actions.getObjectSafe("rielkConstruction:AltarHop")
        obsMap.set(obs.category, obs);
        if (game.construction.notifs)
            obsToAdd.push(obs)
        guard2 = true;
    }
    if (this.tier >= 3 && !guard3) {
        const obs = agi.actions.getObjectSafe("rielkConstruction:WatchtowerClimb")
        obsMap.set(obs.category, obs);
        if (game.construction.notifs)
            obsToAdd.push(obs)
        guard3 = true;
    }
    if (this.tier >= 4 && !guard4) {
        const obs = agi.actions.getObjectSafe("rielkConstruction:MidasTrap")
        obsMap.set(obs.category, obs);
        if (game.construction.notifs)
            obsToAdd.push(obs)
        guard4 = true;
    }
    if (this.tier >= 5 && !guard5) {
        const obs = agi.actions.getObjectSafe("rielkConstruction:VictoryHouseLap")
        obsMap.set(obs.category, obs);
        if (game.construction.notifs)
            obsToAdd.push(obs)
        guard5 = true;
    }


    if (game.construction.notifs) {
        agi.sortedMasteryActions = agi.actions.allObjects.sort((a, b) => a.category - b.category);
        if (mod.manager.getLoadedModList().includes("Skill Boosts")) {
            obsToAdd.forEach(obstacle => {
                skillBoosts.data.skills.forEach(skill => {
                    let obstacleMods = skillBoosts.getItemMods(obstacle),
                        isPositive = skillBoosts.hasModifiers(skill, obstacleMods),
                        realms = isPositive.realms.length > 0 ? isPositive : skillBoosts.hasModifiers(skill, obstacleMods, obstacle, true);

                    if (realms.realms.length > 0) {
                        let icon = skillBoosts.createIcon(obstacle, realms.modifiers, realms.realms, skill, isPositive.realms.length > 0 ? 2 : 3, 'Obstacle');
                        // Sort the new icon into the proper place
                        let icons = skillBoosts.data.menus.get(skill.id).iconContainers[2].childNodes;
                        let index = [...icons].findIndex(icon => icon.item.category > obstacle.category);
                        icons.item(index).before(icon);
                    }
                });

            })

        }
    }
}