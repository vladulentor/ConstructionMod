"use strict";
// Mastery Code that is still required beyond this point
/** Sorts the recipe array in ascending order of category, and then level requirement */
function sortRecipesByCategoryAndLevel(recipes, categories) {
    const categoryOrder = new Map();
    categories.forEach((category, i) => categoryOrder.set(category, i));
    recipes.sort((a, b) => {
        if (a.category === b.category) {
            return a.level - b.level;
        } else {
            return categoryOrder.get(a.category) - categoryOrder.get(b.category);
        }
    });
    return recipes;
}
class MasteryAction extends RealmedObject {}
class DummyMasteryAction extends MasteryAction {
    get name() {
        return `ERROR: INVALID MASTERY`;
    }
    get media() {
        return assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
    }
    constructor(namespace, id, game) {
        super(namespace, {
            id
        }, game);
    }
}
//# sourceMappingURL=mastery2.js.map
checkFileVersion('?12097')