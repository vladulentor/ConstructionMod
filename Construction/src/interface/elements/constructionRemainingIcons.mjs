class ItemRemainingIconElement extends ItemCurrentIconElement {
    toggleInvalidBorder(valid) {
        super.toggleInvalidBorder(valid);
        this.container.classList.toggle('remaining-invalid', !valid);
    }
}
window.customElements.define('item-remaining-icon', ItemRemainingIconElement);

class MyInfoIconElement extends InfoIconElement {
    setInvalidBorder() {
        this.container.classList.add('border-item-invalid');
    }
    removeInvalidBorder() {
        this.container.classList.remove('border-item-invalid');
    }
    setDangerBorder() {
        this.container.classList.add('border-item-danger');

    }
    removeDangerBorder() {
        this.container.classList.remove('border-item-danger');
    }
    toggleInvalidBorder(current, requiredAll, requiredSmall) { //we extend this, then propagate it upwards. Because we need to save processing power. Very sane stuff.
        if (current <= requiredSmall)
           { this.removeDangerBorder();
            this.setInvalidBorder();}
        else if(current <= requiredAll)
        {this.removeInvalidBorder();
        this.removeDangerBorder();}
        else
        {this.removeDangerBorder();
        this.removeInvalidBorder();}
}
}
class MyItemQuantityIconElement extends MyInfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('item-quantity-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.itemImage = getElementFromFragment(this._content, 'item-image', 'img');
        this.quantity = getElementFromFragment(this._content, 'quantity', 'small');
        this.autoBuyIcon = getElementFromFragment(this._content, 'auto-buy-icon', 'img');
        this.tooltipElem = createElement('div', {
            className: 'text-center'
        });
    }
    setItem(item, quantity, allowQuickBuy = false, altMedia = false) {
        this.quantity.textContent = numberWithCommas(quantity);
        this.tooltipElem.textContent = item.name;
        this.itemImage.src = altMedia ? item.altMedia : item.media;
        this.itemImage.alt = item.name;
        const purchase = game.shop.getQuickBuyPurchase(item);
        if (allowQuickBuy && purchase !== undefined) {
            showElement(this.autoBuyIcon);
            this.container.onclick = () => game.shop.quickBuyItemOnClick(purchase);
        } else {
            hideElement(this.autoBuyIcon);
            this.container.onclick = null;
        }
        this.itemQuantity = {
            item,
            quantity
        };
    }
    updateBorder(game) {
        if (this.itemQuantity === undefined || game.construciton.selectedFixtureRecipe === undefined)
            return;
        this.toggleInvalidBorder(game.bank.getQty(this.itemQuantity.item), this.itemQuantity.quantity, game.construction.selectedFixtureRecipe);
    }
}


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
