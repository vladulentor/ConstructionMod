"use strict";
class QuantityIconsElement extends HTMLElement {
    constructor() {
        super();
        this.items = [];
        this.currencies = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('quantity-icons-template'));
        this.emptyText = getElementFromFragment(this._content, 'empty-text', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /** Removes all icons from the DOM, and clears them from memory */
    removeIcons() {
        this.items.forEach((elem) => elem.remove());
        this.currencies.forEach((elem) => elem.remove());
        this.items = [];
        this.currencies = [];
    }
    setSelected() {
        this.items.forEach(showElement);
        this.currencies.forEach(showElement);
        hideElement(this.emptyText);
    }
    setFree() {
        this.items.forEach(hideElement);
        this.currencies.forEach(hideElement);
        this.emptyText.textContent = getLangString('FREE_EXCLAMATION');
        this.emptyText.classList.add('text-success');
        showElement(this.emptyText);
    }
    setUnselected() {
        this.items.forEach(hideElement);
        this.currencies.forEach(hideElement);
        this.emptyText.textContent = '-';
        this.emptyText.classList.remove('text-success');
        showElement(this.emptyText);
    }
    addSingleItemIcon() {
        const icon = createElement('item-quantity-icon', {
            className: 'd-none',
            parent: this
        });
        this.items.push(icon);
        return icon;
    }
    /**
     * Creates and appends Item quantity icons for an array of item quantites
     * @param items The array of item quantities
     * @param allowQuickBuyIf the item icons should allow quick buying from the shop
     * @param altMedia If the alternative media of items should be used
     */
    addItemIcons(items, allowQuickBuy, altMedia = false) {
        items.forEach(({
            item,
            quantity
        }) => {
            const itemIcon = createElement('item-quantity-icon', {
                parent: this
            });
            itemIcon.setItem(item, quantity, allowQuickBuy, altMedia);
            itemIcon.updateBorder(game);
            this.items.push(itemIcon);
        });
    }
    /**
     * Creates and appends Currency quantity icons for an array of currency quantities
     * @param currencies The array of currency quantities
     */
    addCurrencyIcons(currencies) {
        currencies.forEach(({
            currency,
            quantity
        }) => {
            const currencyIcon = createElement('currency-quantity-icon', {
                parent: this
            });
            currencyIcon.setCurrency(currency, quantity);
            currencyIcon.updateBorder();
            this.currencies.push(currencyIcon);
        });
    }
    /**
     * Creates and appends Item or Currency quantity icons for a Costs object
     * @param costs The costs to display
     * @param allowQuickBuy If the Item icons should allow quick buying from the shop
     */
    setIconsForCosts(costs, allowQuickBuy = false, altMedia = false) {
        this.removeIcons();
        this.addItemIcons(costs.getItemQuantityArray(), allowQuickBuy, altMedia);
        this.addCurrencyIcons(costs.getCurrencyQuantityArray());
    }
    setIconsForFixedCosts(costs, allowQuickBuy = false) {
        this.removeIcons();
        if (costs.items !== undefined)
            this.addItemIcons(costs.items, allowQuickBuy);
        if (costs.currencies !== undefined)
            this.addCurrencyIcons(costs.currencies);
    }
    /**
     * Creates and appends Item and Currency icons for an artisan skill recipe
     * @param recipe The recipe to create icons for
     * @param altMedia
     */
    setIconsForRecipe(recipe, altMedia = false) {
        this.removeIcons();
        this.addItemIcons(recipe.itemCosts, true, altMedia);
        this.addCurrencyIcons(recipe.currencyCosts);
    }
    setIcons(items, currencies, altMedia = false) {
        this.removeIcons();
        this.addItemIcons(items, true, altMedia);
        this.addCurrencyIcons(currencies);
    }
    /**
     * Updates the borders of the Item and Currency icons based on if they can be afforded
     * @param game The game object to use for the bank
     */
    updateQuantities(game) {
        this.items.forEach((item) => item.updateBorder(game));
        this.currencies.forEach((currency) => currency.updateBorder());
    }
}
window.customElements.define('quantity-icons', QuantityIconsElement);
/** Helper class for managing current item and currency icons */
class CurrentQuantityIconsElement extends HTMLElement {
    constructor() {
        super();
        this.items = [];
        this.currencies = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('current-quantity-icons-template'));
        this.emptyText = getElementFromFragment(this._content, 'empty-text', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /** Removes all icons from the DOM, and clears them from memory */
    removeIcons() {
        this.items.forEach((elem) => elem.remove());
        this.currencies.forEach((elem) => elem.remove());
        this.items = [];
        this.currencies = [];
    }
    setSelected() {
        this.items.forEach(showElement);
        this.currencies.forEach(showElement);
        hideElement(this.emptyText);
    }
    setUnselected() {
        this.items.forEach(hideElement);
        this.currencies.forEach(hideElement);
        this.emptyText.textContent = '-';
        showElement(this.emptyText);
    }
    addItemIcons(items, game, allowQuickBuy, altMedia = false) {
        items.forEach(({
            item,
            quantity
        }) => {
            const itemIcon = createElement('item-current-icon', {
                parent: this
            });
            itemIcon.setItem(item, quantity, game, allowQuickBuy, altMedia);
            this.items.push(itemIcon);
        });
    }
    addCurrencyIcons(currencies) {
        currencies.forEach(({
            currency,
            quantity
        }) => {
            const currencyIcon = createElement('currency-current-icon', {
                parent: this
            });
            currencyIcon.setCurrency(currency, quantity);
            this.currencies.push(currencyIcon);
        });
    }
    /**
     * Creates and appends Item or Currency quantity icons for a Costs object
     * @param costs The costs to display
     * @param allowQuickBuy If the Item icons should allow quick buying from the shop
     */
    setIconsForCosts(costs, game, allowQuickBuy = false) {
        this.removeIcons();
        this.addItemIcons(costs.getItemQuantityArray(), game, allowQuickBuy);
        this.addCurrencyIcons(costs.getCurrencyQuantityArray());
    }
    setIconsForFixedCosts(costs, game, allowQuickBuy = false) {
        this.removeIcons();
        if (costs.items !== undefined)
            this.addItemIcons(costs.items, game, allowQuickBuy);
        if (costs.currencies !== undefined)
            this.addCurrencyIcons(costs.currencies);
    }
    /**
     * Creates and appends Item and Currency icons for an artisan skill recipe
     * @param recipe The recipe to create icons for
     * @param game
     * @param altMedia
     */
    setIconsForRecipe(recipe, game, altMedia = false) {
        this.removeIcons();
        this.addItemIcons(recipe.itemCosts, game, true, altMedia);
        this.addCurrencyIcons(recipe.currencyCosts);
    }
    setIcons(items, currencies, game, altMedia = false) {
        this.removeIcons();
        this.addItemIcons(items, game, true, altMedia);
        this.addCurrencyIcons(currencies);
    }
    /**
     * Updates the borders of the Item and Currency icons based on if they can be afforded
     * @param game The game object to use for the bank
     */
    updateQuantities(game) {
        this.items.forEach((item) => item.updateQuantity(game.bank));
        this.currencies.forEach((currency) => currency.updateQuantity());
    }
}
window.customElements.define('current-quantity-icons', CurrentQuantityIconsElement);
class RequiresBoxElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('requires-box-template'));
        this.icons = getElementFromFragment(this._content, 'icons', 'quantity-icons');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    destroyIcons() {
        this.icons.removeIcons();
    }
    setSelected() {
        this.icons.setSelected();
    }
    setUnselected() {
        this.icons.setUnselected();
    }
    setItems(items, currencies, altMedia = false) {
        this.icons.setIcons(items, currencies, altMedia);
    }
    setItemsFromRecipe(recipe, altMedia = false) {
        this.icons.setIconsForRecipe(recipe, altMedia);
    }
    setItemsFromCosts(costs, altMedia = false) {
        this.setItems(costs.getItemQuantityArray(), costs.getCurrencyQuantityArray(), altMedia);
    }
}
window.customElements.define('requires-box', RequiresBoxElement);
class HavesBoxElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('haves-box-template'));
        this.icons = getElementFromFragment(this._content, 'icons', 'current-quantity-icons');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    destroyIcons() {
        this.icons.removeIcons();
    }
    setSelected() {
        this.icons.setSelected();
    }
    setUnselected() {
        this.icons.setUnselected();
    }
    updateQuantities(game) {
        this.icons.updateQuantities(game);
    }
    setItems(items, currencies, game, altMedia = false) {
        this.icons.setIcons(items, currencies, game, altMedia);
    }
    setItemsFromRecipe(recipe, game, altMedia = false) {
        this.icons.setIconsForRecipe(recipe, game, altMedia);
    }
    setItemsFromCosts(costs, game, altMedia = false) {
        this.setItems(costs.getItemQuantityArray(), costs.getCurrencyQuantityArray(), game, altMedia);
    }
}
window.customElements.define('haves-box', HavesBoxElement);
class ProducesBoxElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('produces-box-template'));
        this.icons = getElementFromFragment(this._content, 'icons', 'quantity-icons');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    destroyIcons() {
        this.icons.removeIcons();
    }
    setSelected() {
        this.icons.setSelected();
    }
    setUnselected() {
        this.icons.setUnselected();
    }
    setItems(items, currencies) {
        this.icons.setIcons(items, currencies);
    }
    addSingleProductIcon() {
        return this.icons.addSingleItemIcon();
    }
}
window.customElements.define('produces-box', ProducesBoxElement);
class GrantsBoxElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('grants-box-template'));
        this.iconContainer = getElementFromFragment(this._content, 'icon-container', 'div');
        this.xpIcon = getElementFromFragment(this._content, 'xp-icon', 'xp-icon');
        this.abyssalXpIcon = getElementFromFragment(this._content, 'abyssal-xp-icon', 'abyssal-xp-icon');
        this.masteryXpIcon = getElementFromFragment(this._content, 'mastery-xp-icon', 'mastery-xp-icon');
        this.masteryPoolIcon = getElementFromFragment(this._content, 'mastery-pool-icon', 'mastery-pool-icon');
        this.dash = getElementFromFragment(this._content, 'dash', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setUnselected() {
        hideElement(this.xpIcon);
        hideElement(this.abyssalXpIcon);
        hideElement(this.masteryXpIcon);
        hideElement(this.masteryPoolIcon);
        showElement(this.dash);
    }
    setSelected(showAbyssalXp = true) {
        showElement(this.xpIcon);
        if (showAbyssalXp)
            showElement(this.abyssalXpIcon);
        else
            hideElement(this.abyssalXpIcon);
        showElement(this.masteryXpIcon);
        showElement(this.masteryPoolIcon);
        hideElement(this.dash);
    }
    updateGrants(xp, baseXP, masteryXP, baseMasteryXP, poolXP, realm) {
        this.xpIcon.setXP(xp, baseXP);
        this.masteryXpIcon.setXP(masteryXP, baseMasteryXP);
        this.masteryPoolIcon.setXP(poolXP);
        game.unlockedRealms.length > 1 ? this.masteryPoolIcon.setRealm(realm) : this.masteryPoolIcon.hideRealms();
    }
    updateAbyssalGrants(xp, baseXP) {
        this.abyssalXpIcon.setXP(xp, baseXP);
        if (baseXP > 0)
            showElement(this.abyssalXpIcon);
        else
            hideElement(this.abyssalXpIcon);
    }
    hideMastery() {
        hideElement(this.masteryXpIcon);
        hideElement(this.masteryPoolIcon);
    }
    setSources(skill, action) {
        if (skill instanceof SkillWithMastery && skill.hasMastery)
            this.masteryXpIcon.setSources(skill.getMasteryXPSources(action));
        this.xpIcon.setSources(skill.getXPSources(action));
        this.abyssalXpIcon.setSources(skill.getAbyssalXPSources(action));
    }
}
window.customElements.define('grants-box', GrantsBoxElement);
class CookingBonusBoxElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('cooking-bonus-box-template'));
        this.iconContainer = getElementFromFragment(this._content, 'icon-container', 'div');
        this.dash = getElementFromFragment(this._content, 'dash', 'span');
        this.preserve = getElementFromFragment(this._content, 'preserve', 'preservation-icon');
        this.double = getElementFromFragment(this._content, 'double', 'doubling-icon');
        this.perfect = getElementFromFragment(this._content, 'perfect', 'perfect-cook-icon');
        this.success = getElementFromFragment(this._content, 'success', 'cooking-success-icon');
        this.costReduction = getElementFromFragment(this._content, 'cost-reduction', 'cost-reduction-icon');
        this.additionalPrimaryQuantity = getElementFromFragment(this._content, 'additional-primary-quantity', 'additional-primary-quantity-icon');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setUnselected() {
        hideElement(this.preserve);
        hideElement(this.double);
        hideElement(this.perfect);
        hideElement(this.success);
        hideElement(this.costReduction);
        hideElement(this.additionalPrimaryQuantity);
        showElement(this.dash);
    }
    setSelected(recipe) {
        showElement(this.preserve);
        showElement(this.double);
        showElement(this.perfect);
        showElement(this.success);
        if (recipe.realm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ) {
            showElement(this.costReduction);
            showElement(this.additionalPrimaryQuantity);
        } else {
            hideElement(this.costReduction);
            hideElement(this.additionalPrimaryQuantity);
        }
        hideElement(this.dash);
    }
    setChances(chances) {
        this.preserve.setChance(chances.preserve.value, chances.preserve.cap, chances.preserve.sources);
        this.double.setChance(chances.double.value, chances.double.sources);
        this.perfect.setChance(chances.perfect.value, chances.perfect.sources);
        this.success.setChance(chances.success.value, chances.success.sources);
    }
    setCostReduction(costReduction, costReductionSources) {
        this.costReduction.setChance(costReduction, costReductionSources);
    }
    setAdditionalPrimaryQuantity(additionalPrimaryQuantity, additionalPrimaryQuantitySources) {
        this.additionalPrimaryQuantity.setQuantity(additionalPrimaryQuantity, additionalPrimaryQuantitySources);
    }
}
window.customElements.define('cooking-bonus-box', CookingBonusBoxElement);
//# sourceMappingURL=iconBoxes.js.map
checkFileVersion('?12097')