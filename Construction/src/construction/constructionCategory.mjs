const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');

export class ConstructionCategory extends SkillCategory {
    constructor(namespace, data, skill, game) {
        super(namespace, data, skill, game);
        try {
            this.type = data.type;
        } catch (e) {
            throw new DataConstructionError(ConstructionCategory.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        try {
            this.type = data.type;
        } catch (e) {
            throw new DataModificationError(ConstructionCategory.name, e, this.id);
        }
    }
    get name() {
        return getRielkLangString(`SKILL_CATEGORY_ ${this.skill.localID}_ ${this.localID}`);
    }
}
