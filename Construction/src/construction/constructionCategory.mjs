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
        const stack = new Error().stack;
        const isMenu = stack.includes('category-menu-option') || stack.includes('addOptions');
        if (this.type === 'House' && isMenu) return getRielkLangString('MENU_HOUSE'); // so it says "House" in the menu but the items themselves are called "Furniture"
        return getRielkLangString(`SKILL_CATEGORY_ ${this.skill.localID}_ ${this.localID}`);
    }
}
