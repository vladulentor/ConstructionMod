"use strict";
class RecipeSelectionTabElement extends HTMLElement {
    constructor() {
        super();
        this.recipes = [];
        this.optionTagName = 'recipe-option';
        this.options = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('recipe-selection-tab-template'));
        this.recipeContainer = getElementFromFragment(this._content, 'recipe-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
        const optionTagName = this.getAttribute('data-option-tag-name');
        if (optionTagName !== null)
            this.optionTagName = optionTagName;
    }
    setRecipes(recipes, skill) {
        while (this.options.length < recipes.length)
            this.addOption();
        this.options.forEach((option, i) => {
            if (i >= recipes.length) {
                hideElement(option);
                return;
            } else
                showElement(option);
            const recipe = recipes[i];
            option.setRecipe(recipe, skill);
        });
        this.recipes = recipes;
    }
    updateRecipes(skill) {
        this.options.forEach((option, i) => {
            const recipe = this.recipes[i];
            option.updateRecipe(recipe, skill);
        });
    }
    localize(skill) {
        this.options.forEach((option, i) => {
            option.localize(this.recipes[i], skill);
        });
    }
    addOption() {
        const newOption = createElement(this.optionTagName, {
            className: 'col-12 col-md-6',
            parent: this.recipeContainer
        });
        this.options.push(newOption);
    }
}
window.customElements.define('recipe-selection-tab', RecipeSelectionTabElement);
class RecipeOptionElement extends HTMLElement {
    constructor() {
        super();
        this.isUnlocked = false;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode(this.$template));
        this.unlocked = getElementFromFragment(this._content, 'unlocked', 'a');
        this.recipeImage = getElementFromFragment(this._content, 'recipe-image', 'img');
        this.recipeName = getElementFromFragment(this._content, 'recipe-name', 'span');
        this.locked = getElementFromFragment(this._content, 'locked', 'span');
        this.lockedContainer = getElementFromFragment(this._content, 'locked-container', 'div');
        this.recipeCost = getElementFromFragment(this._content, 'recipe-cost', 'span');
        this.multipleRecipes = getElementFromFragment(this._content, 'multiple-recipes', 'div');
    }
    get $template() {
        return 'recipe-option-template';
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.tooltip = tippy(this, {
            placement: 'top',
            allowHTML: true,
            interactive: false,
            animation: false,
        });
    }
    disconnectedCallback() {
        if (this.tooltip !== undefined) {
            this.tooltip.destroy();
            this.tooltip = undefined;
        }
    }
    setRecipe(recipe, skill) {
        if (this.isRecipeUnlocked(recipe, skill)) {
            this.setUnlocked(recipe);
        } else {
            this.setLocked(recipe, skill);
        }
    }
    baseSetLocked() {
        this.isUnlocked = false;
        hideElement(this.unlocked);
        showElement(this.lockedContainer);
        this.unlocked.onclick = null;
        this.locked.textContent = '';
    }
    setLocked(recipe, skill) {
        this.baseSetLocked();
        const skillImage = createElement('img', {
            className: 'skill-icon-xs mr-1',
            attributes: [
                ['src', skill.media]
            ]
        });
        const levelSpan = createElement('span', {
            className: skill.level >= recipe.level ? 'text-success' : 'text-danger',
            parent: this.locked,
        });
        levelSpan.append(...templateLangStringWithNodes('MENU_TEXT_UNLOCKED_AT', {
            skillImage: skillImage.cloneNode()
        }, {
            level: `${recipe.level}`
        }));
        if (recipe.abyssalLevel > 0) {
            const levelSpan = createElement('span', {
                className: skill.abyssalLevel >= recipe.abyssalLevel ? 'text-success' : 'text-danger',
                parent: this.locked,
            });
            levelSpan.append(...templateLangStringWithNodes('UNLOCKED_AT_ABYSSAL_LEVEL', {
                skillImage: skillImage.cloneNode()
            }, {
                level: `${recipe.abyssalLevel}`
            }));
        }
    }
    setUnlocked(recipe) {
        this.isUnlocked = true;
        this.locked.textContent = '';
        hideElement(this.lockedContainer);
        showElement(this.unlocked);
    }
    updateForLevel(recipe, skill) {
        if (this.isRecipeUnlocked(recipe, skill)) {
            if (!this.isUnlocked)
                this.setUnlocked(recipe);
        } else {
            this.setLocked(recipe, skill);
        }
    }
    updateTooltip(recipe, skill) {
        if (this.tooltip === undefined)
            return;
        if (this.isUnlocked) {
            const costs = this.getRecipeIngredients(recipe, skill);
            this.tooltip.setContent(this.getRequiresTooltip(costs.getItemQuantityArray(), costs.getCurrencyQuantityArray()));
            this.tooltip.enable();
        } else {
            this.tooltip.disable();
        }
    }
    updateRecipe(recipe, skill) {
        this.updateForLevel(recipe, skill);
        this.updateTooltip(recipe, skill);
        this.updateRecipeCosts(recipe, skill);
    }
    updateRecipeCosts(recipe, skill) {
        const costs = this.getRecipeIngredients(recipe, skill);
        this.recipeCost.innerHTML = this.getRequiresTooltip(costs.getItemQuantityArray(), costs.getCurrencyQuantityArray());
    }
    getRequiresTooltip(items, currencies) {
        const quantities = [];
        const getQty = (qty, media) => `<img class='skill-icon-xs mr-1' src="${media}"><span class="mr-2">${qty}</span>`;
        items.forEach(({
            item,
            quantity
        }) => {
            quantities.push(getQty(quantity, item.media));
        });
        currencies.forEach(({
            currency,
            quantity
        }) => {
            quantities.push(getQty(quantity, currency.media));
        });
        return `${quantities.join('')}`;
    }
    localize(recipe, skill) {
        if (this.isUnlocked)
            this.setUnlocked(recipe);
        else
            this.setLocked(recipe, skill);
        this.updateTooltip(recipe, skill);
    }
    isRecipeUnlocked(recipe, skill) {
        return skill.level >= recipe.level && skill.abyssalLevel >= recipe.abyssalLevel;
    }
    /** Gets the ingredients used to make this recipe */
    getRecipeIngredients(recipe, skill) {
        return new Costs(game);
    }
}
window.customElements.define('recipe-option', RecipeOptionElement);
class ItemRecipeOptionElement extends RecipeOptionElement {
    setUnlocked(recipe) {
        super.setUnlocked(recipe);
        this.recipeImage.src = recipe.product.media;
        this.recipeImage.id = `artisan-recipe-${recipe.product.id}`;
        this.recipeName.textContent = recipe.product.name;
    }
}
window.customElements.define('item-recipe-option', ItemRecipeOptionElement);
class SmithingRecipeOptionElement extends ItemRecipeOptionElement {
    setUnlocked(recipe) {
        super.setUnlocked(recipe);
        this.unlocked.onclick = () => game.smithing.selectRecipeOnClick(recipe);
    }
    getRecipeIngredients(recipe) {
        return game.smithing.getRecipeCosts(recipe);
    }
}
window.customElements.define('smithing-recipe-option', SmithingRecipeOptionElement);
class FletchingRecipeOptionElement extends ItemRecipeOptionElement {
    setUnlocked(recipe) {
        super.setUnlocked(recipe);
        this.unlocked.onclick = () => game.fletching.selectRecipeOnClick(recipe);
        recipe.alternativeCosts !== undefined ? showElement(this.multipleRecipes) : hideElement(this.multipleRecipes);
    }
    getRecipeIngredients(recipe) {
        return game.fletching.getRecipeCosts(recipe);
    }
}
window.customElements.define('fletching-recipe-option', FletchingRecipeOptionElement);
class CraftingRecipeOptionElement extends ItemRecipeOptionElement {
    setUnlocked(recipe) {
        super.setUnlocked(recipe);
        this.unlocked.onclick = () => game.crafting.selectRecipeOnClick(recipe);
    }
    getRecipeIngredients(recipe) {
        return game.crafting.getRecipeCosts(recipe);
    }
}
window.customElements.define('crafting-recipe-option', CraftingRecipeOptionElement);
class RunecraftingRecipeOptionElement extends ItemRecipeOptionElement {
    setUnlocked(recipe) {
        super.setUnlocked(recipe);
        this.unlocked.onclick = () => game.runecrafting.selectRecipeOnClick(recipe);
    }
    getRecipeIngredients(recipe) {
        return game.runecrafting.getRecipeCosts(recipe);
    }
}
window.customElements.define('runecrafting-recipe-option', RunecraftingRecipeOptionElement);
class HerbloreRecipeOptionElement extends RecipeOptionElement {
    updateForLevel(recipe, skill) {
        // Override since mastery can change the media here
        if (this.isRecipeUnlocked(recipe, skill)) {
            this.setUnlocked(recipe);
        } else {
            this.setLocked(recipe, skill);
        }
    }
    setUnlocked(recipe) {
        super.setUnlocked(recipe);
        const tier = game.herblore.getPotionTier(recipe);
        this.recipeImage.src = recipe.potions[tier].media;
        this.recipeImage.id = `artisan-recipe-${recipe.id}`;
        this.recipeName.textContent = recipe.name;
        this.unlocked.onclick = () => game.herblore.selectRecipeOnClick(recipe);
    }
    getRecipeIngredients(recipe) {
        return game.herblore.getRecipeCosts(recipe);
    }
}
window.customElements.define('herblore-recipe-option', HerbloreRecipeOptionElement);
class AltMagicSpellOptionElement extends RecipeOptionElement {
    setUnlocked(recipe) {
        super.setUnlocked(recipe);
        this.recipeImage.src = recipe.media;
        this.recipeImage.id = `artisan-recipe-${recipe.id}`;
        this.recipeName.textContent = recipe.name;
        this.unlocked.onclick = () => game.altMagic.selectSpellOnClick(recipe);
    }
    updateTooltip(recipe, skill) {
        if (this.tooltip === undefined)
            return;
        this.tooltip.setProps({
            placement: 'bottom'
        });
        if (this.isUnlocked) {
            this.tooltip.setContent(this.getSpellTooltip(recipe));
            this.tooltip.enable();
        } else {
            this.tooltip.disable();
        }
    }
    getSpellTooltip(spell) {
        let runes = spell.runesRequired
            .map((rune) => `${rune.quantity}<img class='skill-icon-sm' src="${rune.item.media}">`)
            .join('');
        if (spell.runesRequiredAlt !== undefined) {
            runes += `<br>${getLangString('MENU_TEXT_OR')}<br><small class="text-info">(${getLangString('MENU_TEXT_USE_COMBINATION_RUNES')})</small><br>`;
            runes += spell.runesRequiredAlt
                .map((rune) => `${rune.quantity}<img class='skill-icon-sm' src="${rune.item.media}">`)
                .join('');
        }
        return `
    <div class="text-center"><span class="text-warning">
    ${spell.name}
    </span><br><small>
    ${spell.description}<br>
    ${templateLangString('MENU_TEXT_XP_AMOUNT', { xp: `${spell.baseExperience}` })}<br>
    ${getLangString('MENU_TEXT_REQUIRES')}<br>
    ${runes}
    </small></div>`;
    }
}
window.customElements.define('alt-magic-spell-option', AltMagicSpellOptionElement);
class SummoningRecipeOptionElement extends ItemRecipeOptionElement {
    constructor() {
        super();
        this.recipeTier = getElementFromFragment(this._content, 'recipe-tier', 'span');
    }
    get $template() {
        return 'summoning-recipe-option-template';
    }
    setUnlocked(recipe) {
        super.setUnlocked(recipe);
        this.recipeTier.textContent = templateLangString('MENU_TEXT_SUMMON_TIER', {
            tier: `${recipe.tier}`
        });
        this.unlocked.onclick = () => game.summoning.selectRecipeOnClick(recipe);
        recipe.nonShardItemCosts.length > 1 ? showElement(this.multipleRecipes) : hideElement(this.multipleRecipes);
    }
    setLocked(recipe, skill) {
        if (!super.isRecipeUnlocked(recipe, skill)) {
            super.setLocked(recipe, skill);
        } else {
            this.baseSetLocked();
            this.locked.append(createElement('img', {
                className: 'skill-icon-xs mr-1',
                attributes: [
                    ['src', assets.getURI('assets/media/main/question.png')]
                ],
            }), getLangString('MENU_TEXT_MARK_UNLOCATED'));
        }
    }
    isRecipeUnlocked(recipe, skill) {
        return super.isRecipeUnlocked(recipe, skill) && skill.getMarkLevel(recipe) > 0;
    }
    getRecipeIngredients(recipe) {
        return game.summoning.getRecipeCosts(recipe);
    }
}
window.customElements.define('summoning-recipe-option', SummoningRecipeOptionElement);
class SummoningSelectionTabElement extends RecipeSelectionTabElement {
    constructor() {
        super();
        this.shardMessage = createElement('h5', {
            className: 'font-w600 font-size-sm text-warning mb-3',
            text: getLangString('MENU_TEXT_SHARD_PURCHASE'),
        });
        this.optionTagName = 'summoning-recipe-option';
    }
    connectedCallback() {
        super.connectedCallback();
        const shardDiv = createElement('div', {
            className: 'col-12 p-3 text-center',
            children: [this.shardMessage],
        });
        this.recipeContainer.append(shardDiv);
    }
    localize(skill) {
        super.localize(skill);
        this.shardMessage.textContent = getLangString('MENU_TEXT_SHARD_PURCHASE');
    }
}
window.customElements.define('summoning-selection-tab', SummoningSelectionTabElement);
class CategoryMenuOptionElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('category-menu-option-template'));
        this.link = getElementFromFragment(this._content, 'link', 'a');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.name = getElementFromFragment(this._content, 'name', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setOption(option, callbackFn) {
        const onLinkClick = () => {
            const highlight = callbackFn();
            if (highlight !== undefined) {
                if (highlight)
                    this.highlight();
                else
                    this.unhighlight();
            }
        };
        this.link.onclick = onLinkClick;
        this.image.src = option.media;
        this.name.textContent = option.name;
    }
    highlight() {
        this.link.classList.add('bg-combat-menu-selected');
    }
    unhighlight() {
        this.link.classList.remove('bg-combat-menu-selected');
    }
}
window.customElements.define('category-menu-option', CategoryMenuOptionElement);
class CategoryMenuElement extends HTMLElement {
    constructor() {
        super();
        this.currentHeaderClass = 'bg-dark-bank-block-header';
        this.options = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('category-menu-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.expandButton = getElementFromFragment(this._content, 'expand-button', 'button');
        this.expandText = getElementFromFragment(this._content, 'expand-text', 'span');
        this.expandDiv = getElementFromFragment(this._content, 'expand-div', 'div');
        this.optionsContainer = getElementFromFragment(this._content, 'options-container', 'ul');
        this.headerDiv = getElementFromFragment(this._content, 'header-div', 'div');
        this.headerName = getElementFromFragment(this._content, 'header-name', 'h5');
        this.expandButton.onclick = () => this.onExpandButtonClick();
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    addOptions(options, expandText, callbackFn) {
        this.expandText.textContent = expandText;
        options.forEach((option) => {
            const newOption = new CategoryMenuOptionElement();
            const optionCallback = () => {
                callbackFn(option);
                this.collapseOptions();
            };
            newOption.setOption(option, optionCallback);
            this.optionsContainer.append(newOption);
            this.options.set(option, newOption);
        });
    }
    highlightOption(option) {
        const optionMenu = this.options.get(option);
        if (optionMenu === undefined)
            return;
        optionMenu.highlight();
    }
    unhighlightOption(option) {
        const optionMenu = this.options.get(option);
        if (optionMenu === undefined)
            return;
        optionMenu.unhighlight();
    }
    onExpandButtonClick() {
        this.expandDiv.classList.toggle('d-none');
    }
    collapseOptions() {
        this.expandDiv.classList.add('d-none');
    }
    setHeaderClass(className) {
        this.headerDiv.classList.remove(this.currentHeaderClass);
        this.headerDiv.classList.add(className);
        this.currentHeaderClass = className;
    }
    setHeaderVisibility(visible) {
        visible ? showElement(this.headerDiv) : hideElement(this.headerDiv);
    }
    setHeaderText(text) {
        this.headerName.textContent = text;
    }
    hideCategory(category) {
        const menu = this.options.get(category);
        if (menu === undefined)
            return;
        hideElement(menu);
    }
    showCategory(category) {
        const menu = this.options.get(category);
        if (menu === undefined)
            return;
        showElement(menu);
    }
}
window.customElements.define('category-menu', CategoryMenuElement);
class RealmedCategoryMenuElement extends HTMLElement {
    constructor() {
        super();
        this.realmOptions = new Map();
        this.categoryOptions = new Map();
        this.currentRealm = game.defaultRealm;
        this.realmNameClass = '';
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('realmed-category-menu-template'));
        this.expandButton = getElementFromFragment(this._content, 'expand-button', 'button');
        this.expandText = getElementFromFragment(this._content, 'expand-text', 'span');
        this.expandDiv = getElementFromFragment(this._content, 'expand-div', 'div');
        this.mainContainer = getElementFromFragment(this._content, 'main-container', 'ul');
        this.realmNameDiv = getElementFromFragment(this._content, 'realm-name-div', 'div');
        this.realmName = getElementFromFragment(this._content, 'realm-name', 'h5');
        this.expandButton.onclick = () => this.onExpandButtonClick();
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCurrentRealm(realm) {
        this.currentRealm = realm;
    }
    addOptions(categories, expandText, callbackFn) {
        this.expandText.textContent = expandText;
        const realms = new Set();
        categories.forEach((category) => {
            realms.add(category.realm);
            const categoryOption = createElement('category-menu-option');
            const optionCallback = () => {
                callbackFn(category);
                this.collapseOptions();
            };
            categoryOption.setOption(category, optionCallback);
            this.categoryOptions.set(category, categoryOption);
        });
        this.mainContainer.innerHTML = '';
        if (realms.size > 1 && game.settings.useLegacyRealmSelection) {
            realms.forEach((realm) => {
                const option = createElement('realm-select-option', {
                    parent: this.mainContainer
                });
                option.setRealm(realm);
                if (realm.isUnlocked)
                    option.setUnlocked();
                else
                    option.setLocked();
                option.setAsSubMenu();
                this.realmOptions.set(realm, option);
            });
            this.categoryOptions.forEach((option, category) => {
                const realmOption = this.realmOptions.get(category.realm);
                realmOption.addSubOption(option);
            });
            hideElement(this.realmNameDiv);
        } else {
            this.categoryOptions.forEach((option, category) => {
                if (category.realm === this.currentRealm)
                    this.mainContainer.append(option);
            });
            this.realmName.textContent = this.currentRealm.name;
            this.setRealmNameColour(this.currentRealm);
            realms.size > 1 ? showElement(this.realmNameDiv) : hideElement(this.realmNameDiv);
        }
    }
    setRealmNameColour(realm) {
        if (this.realmNameClass !== '')
            this.realmNameDiv.classList.remove(this.realmNameClass);
        this.realmNameDiv.classList.add(realm.realmClass);
        this.realmNameClass = realm.realmClass;
    }
    updateRealmUnlock(realm) {
        const option = this.realmOptions.get(realm);
        if (option === undefined)
            return;
        if (realm.isUnlocked)
            option.setUnlocked();
        else
            option.setLocked();
    }
    highlightOption(option) {
        // TODO: Implement highlighting the realm as well
        const optionMenu = this.categoryOptions.get(option);
        if (optionMenu === undefined)
            return;
        optionMenu.highlight();
    }
    unhighlightOption(option) {
        // TODO: Implement highlighting the realm as well
        const optionMenu = this.categoryOptions.get(option);
        if (optionMenu === undefined)
            return;
        optionMenu.unhighlight();
    }
    onExpandButtonClick() {
        this.expandDiv.classList.toggle('d-none');
    }
    collapseOptions() {
        this.expandDiv.classList.add('d-none');
    }
}
window.customElements.define('realmed-category-menu', RealmedCategoryMenuElement);
//# sourceMappingURL=recipeSelection.js.map
checkFileVersion('?12097')