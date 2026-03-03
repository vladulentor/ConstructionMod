class ConstructionRecipeOptionElement extends ItemRecipeOptionElement {
    setUnlocked(recipe) {
        super.setUnlocked(recipe);
        this.unlocked.onclick = ()=>game.construction.selectRecipeOnClick(recipe);
    }
    getRecipeIngredients(recipe) {
        return game.construction.getRecipeCosts(recipe);
    }
}
window.customElements.define('rielk-construction-recipe-option', ConstructionRecipeOptionElement);
