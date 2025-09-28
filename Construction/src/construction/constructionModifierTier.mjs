export class ConstructionModifierTiers {
    constructor(data, game, tierID) {
        try {
            this._stats = new StatObject(data,game,`${ConstructionModifierTiers.name} for tier "${tierID}"`);
        } catch (e) {
            throw new DataConstructionError(ConstructionModifierTiers.name,e);
        }
    }
    applyDataModification(data, game) {
        try {
            this._stats.applyDataModification(data, game);
        } catch (e) {
            throw new DataModificationError(ConstructionModifierTiers.name, e);
        }
    }
}