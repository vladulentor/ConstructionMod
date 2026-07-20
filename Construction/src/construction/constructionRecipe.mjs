export class ConstructionRecipe extends SingleProductArtisanSkillRecipe {
    constructor(namespace, data, game, skill) {
        super(namespace, data, game, skill);
        this.hasMastery = false;
        this.spoofOrder = data.spoofOrder;
        this.spoofOrderPh = data.spoofOrderPh;
        if (data.subcategoryID !== undefined)
            this.subcategory = skill.subCategories.getObjectSafe(data.subcategoryID);
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
