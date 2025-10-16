"use strict";
class ArtisanMenuElement extends HTMLElement {
    constructor() {
        super();
        this.recipeDropdownItems = [];
        this.progressTimestamp = 0;
        this.progressInterval = 0;
        this.noneSelected = true;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode(this.$template));
        this.productImage = getElementFromFragment(this._content, 'product-image', 'img');
        this.productQuantity = getElementFromFragment(this._content, 'product-quantity', 'small');
        this.productName = getElementFromFragment(this._content, 'product-name', 'span');
        this.productDescription = getElementFromFragment(this._content, 'product-description', 'small');
        this.selectedText = getElementFromFragment(this._content, 'selected-text', 'small');
        this.viewStatsText = getElementFromFragment(this._content, 'view-stats-text', 'h5');
        this.productPreservation = getElementFromFragment(this._content, 'product-preservation', 'preservation-icon');
        this.productDoubling = getElementFromFragment(this._content, 'product-doubling', 'doubling-icon');
        this.productAdditionalPrimaryQuantity = getElementFromFragment(this._content, 'product-additional-primary-quantity', 'additional-primary-quantity-icon');
        this.productCostReduction = getElementFromFragment(this._content, 'product-cost-reduction', 'cost-reduction-icon');
        this.mastery = getElementFromFragment(this._content, 'mastery', 'mastery-display');
        this.dropDownContainer = getElementFromFragment(this._content, 'drop-down-container', 'div');
        this.recipeOptionsContainer = getElementFromFragment(this._content, 'recipe-options-container', 'div');
        this.requires = getElementFromFragment(this._content, 'requires', 'requires-box');
        this.haves = getElementFromFragment(this._content, 'haves', 'haves-box');
        this.produces = getElementFromFragment(this._content, 'produces', 'produces-box');
        this.grants = getElementFromFragment(this._content, 'grants', 'grants-box');
        this.createButton = getElementFromFragment(this._content, 'create-button', 'button');
        this.interval = getElementFromFragment(this._content, 'interval', 'interval-icon');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'progress-bar');
    }
    get $template() {
        return 'artisan-menu-template';
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.productIcon = this.produces.addSingleProductIcon();
        this.noneSelected ? this.grants.setUnselected() : this.grants.setSelected();
    }
    init(skill) {
        this.productImage.src = skill.media;
    }
    setSelected(skill, recipe) {
        if (this.noneSelected) {
            this.requires.setSelected();
            this.haves.setSelected();
            this.grants.setSelected();
            this.produces.setSelected();
            hideElement(this.selectedText);
            showElement(this.productIcon);
            this.noneSelected = false;
        }
        if (recipe.namespace === "melvorItA" /* Namespaces.IntoTheAbyss */ ) {
            showElement(this.productCostReduction);
            showElement(this.productAdditionalPrimaryQuantity);
        } else {
            hideElement(this.productCostReduction);
            hideElement(this.productAdditionalPrimaryQuantity);
        }
        this.mastery.setMastery(skill, recipe);
    }
    setIngredients(items, currencies, game) {
        this.requires.setItems(items, currencies);
        this.haves.setItems(items, currencies, game);
    }
    setIngredientsFromRecipe(recipe, game) {
        this.requires.setItemsFromRecipe(recipe);
        this.haves.setItemsFromRecipe(recipe, game);
    }
    setProduct(item, qty) {
        this.product = item;
        this.productImage.src = item.media;
        this.productName.textContent = item.name;
        const bankQty = game.bank.getQty(item);
        this.productQuantity.textContent = bankQty <= 99999999 ? numberWithCommas(bankQty) : formatNumber(bankQty);
        if (item instanceof EquipmentItem) {
            showElement(this.viewStatsText);
            this.viewStatsText.onclick = () => viewItemStats(item);
        } else {
            hideElement(this.viewStatsText);
        }
        this.productDescription.innerHTML = '';
        if (item.hasDescription) {
            this.productDescription.innerHTML = item.modifiedDescription;
        }
        if (item instanceof EquipmentItem) {
            this.productDescription.innerHTML += getSummonMaxHitItemDescription(item);
        }
        this.productIcon.setItem(item, qty);
    }
    updateQuantities(game) {
        this.haves.updateQuantities(game);
        if (this.product !== undefined) {
            const bankQty = game.bank.getQty(this.product);
            this.productQuantity.textContent = bankQty <= 99999999 ? numberWithCommas(bankQty) : formatNumber(bankQty);
        }
        this.recipeDropdownItems.forEach((icons) => icons.updateQuantities(game));
    }
    updateGrants(xp, baseXP, masteryXP, baseMasteryXP, poolXP, realm) {
        this.grants.updateGrants(xp, baseXP, masteryXP, baseMasteryXP, poolXP, realm);
    }
    updateGrantsSources(skill, action) {
        this.grants.setSources(skill, action);
    }
    updateAbyssalGrants(xp, baseXP) {
        this.grants.updateAbyssalGrants(xp, baseXP);
    }
    updateChances(preserveChance, preserveCap, preserveSources, doublingChance, doublingSources) {
        this.productPreservation.setChance(preserveChance, preserveCap, preserveSources);
        this.productDoubling.setChance(doublingChance, doublingSources);
    }
    updateAdditionalPrimaryQuantity(qty, modifierSources) {
        this.productAdditionalPrimaryQuantity.setQuantity(qty, modifierSources);
    }
    updateCostReduction(reduction, modifierSources) {
        this.productCostReduction.setChance(reduction, modifierSources);
    }
    updateInterval(interval, modifierSources) {
        this.interval.setInterval(interval, modifierSources);
    }
    setCreateCallback(callback) {
        this.createButton.onclick = () => {
            callback(), this.createButton.blur();
        };
    }
    animateProgressFromTimer(timer) {
        this.progressBar.animateProgressFromTimer(timer);
    }
    startProgressBar(interval) {
        this.progressBar.animateProgress(0, interval);
        this.progressInterval = interval;
        this.progressTimestamp = performance.now();
    }
    stopProgressBar() {
        this.progressBar.stopAnimation();
    }
    updateProgressBar() {
        const newTimestamp = performance.now();
        const timeDiff = newTimestamp - this.progressTimestamp;
        if (timeDiff < this.progressInterval) {
            this.progressBar.animateProgress(timeDiff, this.progressInterval);
            this.progressTimestamp = newTimestamp;
        } else {
            this.progressBar.stopAnimation();
        }
    }
    hideRecipeDropdown() {
        hideElement(this.dropDownContainer);
    }
    showRecipeDropdown() {
        showElement(this.dropDownContainer);
    }
    setRecipeDropdown(altRecipeIngredients, selectCallback, displayOrder) {
        this.recipeDropdownItems = [];
        this.recipeOptionsContainer.textContent = '';
        if (displayOrder === undefined)
            displayOrder = altRecipeIngredients.map((_, i) => i);
        displayOrder.forEach((i) => {
            const altRecipe = altRecipeIngredients[i];
            const newOption = createElement('a', {
                className: 'dropdown-item pointer-enabled py-1',
                parent: this.recipeOptionsContainer,
            });
            newOption.onclick = selectCallback(i);
            const icons = createElement('quantity-icons', {
                className: 'icon-size-48',
                parent: newOption
            });
            icons.setSelected();
            icons.addItemIcons(altRecipe.items, false);
            icons.addCurrencyIcons(altRecipe.currencies);
            this.recipeDropdownItems.push(icons);
        });
        this.showRecipeDropdown();
    }
}
window.customElements.define('artisan-menu', ArtisanMenuElement);
class HerbloreArtisanMenuElement extends ArtisanMenuElement {
    constructor() {
        super();
        this.tierImages = [];
        this.tierTooltips = [];
        this.tierContainer = getElementFromFragment(this._content, 'tier-container', 'h5');
        this.tierText = getElementFromFragment(this._content, 'tier-text', 'small');
        const tierSpan = getElementFromFragment(this._content, 'tier-span', 'span');
        Herblore.tierMasteryLevels.forEach(() => {
            const image = tierSpan.appendChild(createElement('img', {
                className: 'skill-icon-xs mr-2'
            }));
            const tooltip = tippy(image, {
                placement: 'top',
                allowHTML: true,
                interactive: false,
                animation: false,
            });
            this.tierImages.push(image);
            this.tierTooltips.push(tooltip);
        });
    }
    get $template() {
        return 'herblore-artisan-menu-template';
    }
    disconnectedCallback() {
        this.tierTooltips.forEach((tt) => tt.destroy());
    }
    setProductTier(product, productTier) {
        Herblore.tierMasteryLevels.forEach((level, tier) => {
            let media = assets.getURI(`assets/media/skills/herblore/potion_${tier}.svg`);
            let tipContent = `<div class="text-center"><small>${templateString(getLangString('MENU_TEXT_TOOLTIP_MASTERY_UNLOCK'), { level: `${level}` })}</small></div>`;
            if (productTier === tier) {
                media = product.media;
                tipContent = `<div class="text-center"><small>${product.name}</small></div>`;
            }
            this.tierImages[tier].src = media;
            this.tierTooltips[tier].setContent(tipContent);
        });
    }
    setPotionDescription(item, recipe) {
        this.productDescription.append(createElement('br'), createElement('span', {
            className: 'text-danger',
            text: templateLangString('MENU_TEXT_POTION_CHARGES', {
                charges: `${item.charges}`
            }),
        }), createElement('br'), createElement('span', {
            className: 'text-success',
            text: templateLangString('MENU_TEXT_SKILL', {
                skillName: item.action.name
            }),
        }));
        const tier = game.herblore.getPotionTier(recipe);
        this.setProductTier(item, tier);
    }
    setSelected(skill, recipe) {
        if (this.noneSelected)
            showElement(this.tierContainer);
        super.setSelected(skill, recipe);
    }
    setProduct(item, qty) {
        super.setProduct(item, qty);
        const recipe = game.herblore.getRecipeForPotion(item);
        if (recipe !== undefined)
            this.setPotionDescription(item, recipe);
    }
}
window.customElements.define('herblore-artisan-menu', HerbloreArtisanMenuElement);
//# sourceMappingURL=artisanMenu.js.map
checkFileVersion('?12097')