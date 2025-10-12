class MyItemQuantityIconElement extends ItemQuantityIconElement {
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
        if (current <= requiredSmall) {
            this.removeDangerBorder();
            this.setInvalidBorder();
        }
        else if (current <= requiredAll) {
            this.removeInvalidBorder();
            this.setDangerBorder();
        }
        else {
            this.removeDangerBorder();
            this.removeInvalidBorder();
        }
    }
    updateBorder(current, requiredAll, requiredSmall) {
        console.log('[updateBorder] called with:', {
            current,
            requiredAll,
            requiredSmall,
            itemQuantity: this.itemQuantity
        });

        if (this.itemQuantity === undefined) {
            console.log('[updateBorder] itemQuantity is undefined — exiting early');
            return;
        }

        const qty = game.bank.getQty(this.itemQuantity.item);
        console.log('[updateBorder] got quantity from bank:', qty, 'for item:', this.itemQuantity.item);

        this.toggleInvalidBorder(qty, requiredAll, requiredSmall);

        console.log('[updateBorder] toggleInvalidBorder called with:', {
            qty,
            requiredAll,
            requiredSmall
        });
    }
}
window.customElements.define('my-quantity-icon', MyItemQuantityIconElement);


class MyItemCurrentIconElement extends ItemCurrentIconElement {
    constructor(){
        super();
        this.requiredsmall = 0;
    }
    updateQuantity(bank) {
        if (this.item === undefined)
            return;
        this.currentQuantity = bank.getQty(this.item);
        this.toggleInvalidBorder(this.currentQuantity, this.requiredQuantity, this.requiredsmall);
        this.quantity.textContent = formatNumber(this.currentQuantity);
    }
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
    setItem(item, requiredQuantity, requiresSmall, game, allowQuickBuy = false, altMedia = false) {
        this.item = item;
        this.requiredQuantity = requiredQuantity;
        this.requiredsmall = requiresSmall;
        this.itemImage.src = altMedia ? item.altMedia : item.media;
        this.itemImage.alt = item.name;
        this.tooltipElem.textContent = item.name;
        const purchase = game.shop.getQuickBuyPurchase(item);
        if (allowQuickBuy && purchase !== undefined) {
            showElement(this.autoBuyIcon);
            this.container.onclick = () => game.shop.quickBuyItemOnClick(purchase);
        } else {
            hideElement(this.autoBuyIcon);
            this.container.onclick = null;
        }
        this.updateQuantity(game.bank);
    }
    toggleInvalidBorder(current, requiredAll, requiredSmall) { 
        if (current <= requiredSmall) {
            this.removeDangerBorder();
            this.setInvalidBorder();
        }
        else if (current <= requiredAll) {
            this.removeInvalidBorder();
            this.setDangerBorder();
        }
        else {
            this.removeDangerBorder();
            this.removeInvalidBorder();
        }
    }
    updateBorder(current, requiredAll, requiredSmall) {
        console.log('[updateBorder] called with:', {
            current,
            requiredAll,
            requiredSmall,
            itemQuantity: this.itemQuantity
        });

        if (this.itemQuantity === undefined) {
            console.log('[updateBorder] itemQuantity is undefined — exiting early');
            return;
        }

        const qty = game.bank.getQty(this.itemQuantity.item);
        console.log('[updateBorder] got quantity from bank:', qty, 'for item:', this.itemQuantity.item);

        this.toggleInvalidBorder(qty, requiredAll, requiredSmall);

        console.log('[updateBorder] toggleInvalidBorder called with:', {
            qty,
            requiredAll,
            requiredSmall
        });
    }
}
window.customElements.define('my-item-current-icon', MyItemCurrentIconElement);

class MyQuantityIconsElement extends HTMLElement {
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
        const icon = createElement('my-quantity-icon', {
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
        console.log('[addItemIcons] called with:', { items, allowQuickBuy, altMedia });

        items.forEach(({ item, quantity, smallquant }, i) => {
            console.log(`[addItemIcons] (${i}) Creating icon for`, { item, quantity, smallquant });

            const itemIcon = createElement('my-quantity-icon', {
                parent: this
            });

            console.log(`[addItemIcons] (${i}) Setting item`);
            itemIcon.setItem(item, quantity, allowQuickBuy, altMedia);

            console.log(`[addItemIcons] (${i}) Updating border`);
            itemIcon.updateBorder(item, quantity, smallquant);

            this.items.push(itemIcon);
            console.log(`[addItemIcons] (${i}) Added icon to list. Total items: ${this.items.length}`);
        });

        console.log('[addItemIcons] Finished creating item icons.');
    }    /**
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
        console.log('[setIconsForRecipe] called with recipe:', recipe);

        this.removeIcons();
        console.log('[setIconsForRecipe] removed existing icons');

        this.addItemIcons(recipe.itemCosts, true, altMedia);
        console.log('[setIconsForRecipe] added item icons for recipe');

        this.addCurrencyIcons(recipe.currencyCosts);
        console.log('[setIconsForRecipe] added currency icons for recipe');
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
    updateQuantities(current, requiredAll, requiredSmall) {
        console.log('[updateQuantities] called with:', { current, requiredAll, requiredSmall });

        console.log('[updateQuantities] updating item icons...');
        this.items.forEach((item, i) => {
            console.log(`[updateQuantities] -> item[${i}] updateBorder`);
            item.updateBorder(current, requiredAll, requiredSmall);
        });

        console.log('[updateQuantities] updating currency icons...');
        this.currencies.forEach((currency, i) => {
            console.log(`[updateQuantities] -> currency[${i}] updateBorder`);
            currency.updateBorder();
        });

        console.log('[updateQuantities] finished updating all quantities.');
    }
}
window.customElements.define('my-quantity-icons', MyQuantityIconsElement);
/** Helper class for managing current item and currency icons */
function tripleCostArray(itemsMap) {
    const costArray = [];
    itemsMap.forEach((value, item) => {
        costArray.push({
            item,
            quantity: value.quantity,
            smallquant: value.smallquant
        });
    });
    return costArray;
}
class MyCurrentQuantityIconsElement extends HTMLElement {
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
            quantity, 
            smallquant
        }) => {
            const itemIcon = createElement('my-item-current-icon', {
                parent: this
            });
            itemIcon.setItem(item, quantity, smallquant, game, allowQuickBuy, altMedia);
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
        this.addItemIcons(tripleCostArray(costs), game, allowQuickBuy);
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
window.customElements.define('my-current-quantity-icons', MyCurrentQuantityIconsElement);
export class RemainingBoxElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('remaining-box-template'));
        this.icons = getElementFromFragment(this._content, 'icons', 'my-quantity-icons');
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
        console.log('[setItemsFromRecipe] called with:', { recipe, altMedia });
        console.log('[setItemsFromRecipe] current icons:', this.icons);

        if (!this.icons) {
            console.warn('[setItemsFromRecipe] WARNING: this.icons is undefined or null — cannot set icons for recipe');
            return;
        }

        console.log('[setItemsFromRecipe] calling setIconsForRecipe...');
        this.icons.setIconsForRecipe(recipe, altMedia);
        console.log('[setItemsFromRecipe] finished setIconsForRecipe.');
    }
    setItemsFromCosts(costs, altMedia = false) {
        this.setItems(costs.getItemQuantityArray(), costs.getCurrencyQuantityArray(), altMedia);
    }
}
window.customElements.define('remaining-box', RemainingBoxElement);
export class RemainingHavesBoxElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('remaining-haves-box-template'));
        this.icons = getElementFromFragment(this._content, 'icons', 'my-current-quantity-icons');
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
    updateQuantities(current, requiredAll, requiredSmall) {
        this.icons.updateQuantities(current, requiredAll, requiredSmall);
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
window.customElements.define('remaining-haves-box', RemainingHavesBoxElement);

