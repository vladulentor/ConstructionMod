export class ConstructionModifiers {
    constructor(data, game, recipeID) {
        try {
            this._stats = new StatObject(data , game,`${ConstructionModifiers.name} for recipe "${recipeID}"`);
        } catch (e) {
            throw new DataConstructionError(ConstructionModifiers.name,e);
        }
    }
    applyDataModification(data, game) {
        try {
            this._stats.applyDataModification(data, game);
        } catch (e) {
            throw new DataModificationError(ConstructionModifiers.name, e);
        }
    }
}