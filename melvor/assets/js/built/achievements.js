"use strict";
class SteamAchievement {
    constructor(data, game) {
        try {
            this.id = data.id;
            this.requirements = game.getRequirementsFromData(data.requirements);
            if (data.requiredGamemodeID !== undefined) {
                this.requiredGamemode = game.gamemodes.getObjectSafe(data.requiredGamemodeID);
            }
        } catch (e) {
            throw new DataConstructionError(SteamAchievement.name, e);
        }
    }
}
//# sourceMappingURL=achievements.js.map
checkFileVersion('?12097')