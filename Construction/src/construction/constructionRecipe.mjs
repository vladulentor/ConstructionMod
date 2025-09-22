export class ConstructionRecipe extends SingleProductArtisanSkillRecipe {
    constructor(namespace, data, game, skill) {
        super(namespace, data, game, skill);
        this.hasMastery = true;
        try {
        } catch (e) {
            throw new DataConstructionError(ConstructionRecipe.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
        } catch (e) {
            throw new DataModificationError(ConstructionRecipe.name, e, this.id);
        }
    }
}
