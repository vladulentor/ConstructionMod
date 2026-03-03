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
    addGreenBorder() {
        this.container.classList.add('border-item-green');
    }
    toggleInvalidBorder(current, requiredAll, requiredSmall) { //we extend this, then propagate it upwards. Because we need to save processing power. Very sane stuff.
        if (current < requiredSmall) {
            this.removeDangerBorder();
            this.setInvalidBorder();
        }
        else if (current < requiredAll) {
            this.removeInvalidBorder();
            this.setDangerBorder();
        }
        else {
            this.removeDangerBorder();
            this.removeInvalidBorder();
        }
    }
    updateBorder(current, requiredAll, requiredSmall) {
        if (this.itemQuantity === undefined) {
            console.warn("updateBorder skipped: itemQuantity is undefined", { current, requiredAll, requiredSmall });
            return;
        }

        let qty;
        try {
            qty = game.bank.getQty(this.itemQuantity.item);
        } catch (err) {
            console.error("Failed to get quantity in updateBorder:", err, { item: this.itemQuantity.item, current, requiredAll, requiredSmall });
            qty = 0; // fallback so toggleInvalidBorder can still run
        }

        this.toggleInvalidBorder(qty, requiredAll, requiredSmall);
    }
}
window.customElements.define('my-quantity-icon', MyItemQuantityIconElement);


class MyItemCurrentIconElement extends ItemCurrentIconElement {
    constructor() {
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
        if (current < requiredSmall) {
            this.removeDangerBorder();
            this.setInvalidBorder();
        }
        else if (current < requiredAll) {
            this.removeInvalidBorder();
            this.setDangerBorder();
        }
        else {
            this.removeDangerBorder();
            this.removeInvalidBorder();
        }
    }
    updateBorder(current, requiredAll, requiredSmall) {
        if (this.itemQuantity === undefined) {
            return;
        }

        const qty = game.bank.getQty(this.itemQuantity.item);

        this.toggleInvalidBorder(qty, requiredAll, requiredSmall);
    }
}
window.customElements.define('my-item-current-icon', MyItemCurrentIconElement);

class MyCurrencyQuantityIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('currency-quantity-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.currencyImage = getElementFromFragment(this._content, 'currency-image', 'img');
        this.quantity = getElementFromFragment(this._content, 'quantity', 'small');
        this.tooltipElem = createElement('div', {
            className: 'text-center'
        });
    }
    setCurrency(currency, quantity, smallquant) {
        this.currencyImage.src = currency.media;
        this.currencyImage.alt = currency.name;
        this.tooltipElem.textContent = currency.name;
        this.quantity.textContent = numberWithCommas(quantity);
        this.currencyQuantity = {
            currency,
            quantity, smallquant
        };
    }
    addGreenBorder() {
        this.container.classList.add('border-item-green');
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
    toggleInvalidBorder(current, requiredAll, requiredSmall) {
        if (current < requiredSmall) {
            this.removeDangerBorder();
            this.setInvalidBorder();
        }
        else if (current < requiredAll) {
            this.removeInvalidBorder();
            this.setDangerBorder();
        }
        else {
            this.removeDangerBorder();
            this.removeInvalidBorder();
        }
    }

    updateBorder(currency, requiredAll, requiredSmall) {
        if (this.currencyQuantity === undefined)
            return;

        this.toggleInvalidBorder(currency._amount, requiredAll, requiredSmall);
    }
}
window.customElements.define('my-currency-quantity-icon', MyCurrencyQuantityIconElement);

class MyCurrencyCurrentIconElement extends InfoIconElement {
    constructor() {
        super();
        this.requiredQuantity = 0;
        this.reqruiedSmallQuant = 0;
        this.currentQuantity = 0;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('currency-current-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.currencyImage = getElementFromFragment(this._content, 'currency-image', 'img');
        this.quantity = getElementFromFragment(this._content, 'quantity', 'small');
        this.tooltipElem = createElement('div', {
            className: 'text-center'
        });
    }
    connectedCallback() {
        super.connectedCallback();
        this.container.onmouseover = () => this.onMouseOver();
        this.container.onmouseleave = () => this.onMouseLeave();
    }
    setCurrency(currency, requiredQuantity, requiredSmallQuant) {
        this.currency = currency;
        this.reqruiedSmallQuant = requiredSmallQuant;
        this.requiredQuantity = requiredQuantity;
        this.currencyImage.src = currency.media;
        this.currencyImage.alt = currency.name;
        this.tooltipElem.textContent = currency.name;
        this.updateQuantity(currency, requiredQuantity, requiredSmallQuant);
    }
    updateQuantity(currency, requiredQuantity, requiredSmallQuant) {
        if (this.currency === undefined)
            return;
        this.currentQuantity = this.currency.amount;
        this.toggleInvalidBorder(this.currentQuantity, requiredQuantity, requiredSmallQuant);
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
    toggleInvalidBorder(current, requiredAll, requiredSmall) {
        if (current < requiredSmall) {
            this.removeDangerBorder();
            this.setInvalidBorder();
        }
        else if (current < requiredAll) {
            this.removeInvalidBorder();
            this.setDangerBorder();
        }
        else {
            this.removeDangerBorder();
            this.removeInvalidBorder();
        }
    }
    onMouseOver() {
        this.quantity.textContent = numberWithCommas(this.currentQuantity);
    }
    onMouseLeave() {
        this.quantity.textContent = formatNumber(this.currentQuantity);
    }
}
window.customElements.define('my-currency-current-icon', MyCurrencyCurrentIconElement);

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
    addItemIcons(items, game, allowQuickBuy, altMedia = false) {

        items.forEach(({ item, quantity, smallquant }, i) => {

            const itemIcon = createElement('my-quantity-icon', { parent: this });

            // Defensive logging before setItem
            try {
                itemIcon.setItem(item, quantity, smallquant, game, allowQuickBuy, altMedia);
            } catch (err) {
                console.error("Error in itemIcon.setItem:", err, { item, quantity, allowQuickBuy, altMedia });
            }

            try {
                itemIcon.updateBorder(item, quantity, smallquant);
            } catch (err) {
                console.error("Error in updateBorder:", err, { item, quantity, smallquant });
            }

            this.items.push(itemIcon);
        });
    } 
    addItemIconsForGreen(items, game, allowQuickBuy, altMedia = false){
        items.forEach(({ item, quantity, smallquant }, i) => {

            const itemIcon = createElement('my-quantity-icon', { parent: this });

            // Defensive logging before setItem
            try {
                itemIcon.setItem(item, quantity, smallquant, game, allowQuickBuy, altMedia);
            } catch (err) {
                console.error("Error in itemIcon.setItem:", err, { item, quantity, allowQuickBuy, altMedia });
            }

            try {
                itemIcon.addGreenBorder();
            } catch (err) {
                console.error("no green");
            }

            this.items.push(itemIcon);
        });    
    }
    setIconsForGreen(recipe, game, altMedia = false){

        this.removeIcons();
        this.addItemIconsForGreen(recipe.itemCosts, game, true, altMedia);
        this.addCurrencyIconsForGreen(recipe.currencyCosts);


    }
    /**
     * Creates and appends Currency quantity icons for an array of currency quantities
     * @param currencies The array of currency quantities
     */
    addCurrencyIcons(currencies) {
        currencies.forEach(({
            currency,
            quantity,
            smallquant
        }) => {
            const currencyIcon = createElement('my-currency-quantity-icon', {
                parent: this
            });
            currencyIcon.setCurrency(currency, quantity, smallquant);
            currencyIcon.updateBorder(currency, quantity, smallquant);
            this.currencies.push(currencyIcon);
        });
    }
        addCurrencyIconsForGreen(currencies) {
        currencies.forEach(({
            currency,
            quantity,
            smallquant
        }) => {
            const currencyIcon = createElement('my-currency-quantity-icon', {
                parent: this
            });
            currencyIcon.setCurrency(currency, quantity, smallquant);
            currencyIcon.addGreenBorder();
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
    setIconsForRecipe(recipe, game, altMedia = false) {
        let redraw = false;
        const currentPlayerItems = {};
        for (const cost of recipe.itemCosts) {
            const key = cost.item.id;
            currentPlayerItems[key] = game.bank.getQty(cost.item);
        }

        const currentPlayerCurrencies = {};
        for (const cost of recipe.currencyCosts) {
            const key = cost.currency._localID;            // string key for tracking/comparison
            currentPlayerCurrencies[key] = cost.currency.amount; // actual quantity
        } 

        if (!sameCosts(this.lastItemCosts, recipe.itemCosts) || !sameCosts(this.lastCurrencyCosts, recipe.currencyCosts)) {
            redraw = true;
        }
        if (!redraw) {
            for (const key in currentPlayerItems) {
                if ((this.lastPlayerItems?.[key] ?? -1) !== currentPlayerItems[key]) {
                    redraw = true;
                    break;
                }
            }
        }

        if (!redraw) {
            for (const key in currentPlayerCurrencies) {
                if ((this.lastPlayerCurrencies?.[key] ?? -1) !== currentPlayerCurrencies[key]) {
                    redraw = true;
                    break;
                }
            }
        }

        if (!redraw) return;

        this.lastItemCosts = recipe.itemCosts;
        this.lastCurrencyCosts = recipe.currencyCosts;
        this.lastPlayerItems = currentPlayerItems;
        this.lastPlayerCurrencies = currentPlayerCurrencies;
        this.lastAltMedia = altMedia;

        this.removeIcons();
        this.addItemIcons(recipe.itemCosts, game, true, altMedia);
        this.addCurrencyIcons(recipe.currencyCosts);
    }
    updateQuantities(current, requiredAll, requiredSmall) {
        this.items.forEach((item, i) => {
            item.updateBorder(current, requiredAll, requiredSmall);
        });

        this.currencies.forEach((currency, i) => {
            currency.updateBorder();
        });

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
function sameCosts(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        const A = a[i], B = b[i];
        if (
            A.item !== B.item ||
            A.quantity !== B.quantity ||
            A.smallquant !== B.smallquant
        ) return false;
    }
    return true;
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
            quantity,
            smallquant
        }) => {
            const currencyIcon = createElement('my-currency-current-icon', {
                parent: this
            });
            currencyIcon.setCurrency(currency, quantity, smallquant);
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
    /**
     * Creates and appends Item and Currency icons for an artisan skill recipe
     * @param recipe The recipe to create icons for
     * @param game
     * @param altMedia
     */
    setIconsForRecipe(recipe, game, altMedia = false) {
        let redraw = false;
        //Here's the real optimization paydirt, we cache player items to see if they've changed (if UIcost changed) , if not, don't render shit.
        const currentPlayerItems = {};
        for (const cost of recipe.itemCosts) {
            const key = cost.item.id;
            currentPlayerItems[key] = game.bank.getQty(cost.item);
        }
        const currentPlayerCurrencies = {};
        for (const cost of recipe.currencyCosts) {
            const key = cost.currency._localID;            // string key for tracking/comparison
            currentPlayerCurrencies[key] = cost.currency.amount; // actual quantity
        }

        if (!sameCosts(this.lastItemCosts, recipe.itemCosts) || !sameCosts(this.lastCurrencyCosts, recipe.currencyCosts)) {
            redraw = true;
        }
        // we only check this if we don't know yet.
        if (!redraw) {
            for (const key in currentPlayerItems) {
                if ((this.lastPlayerItems?.[key] ?? -1) !== currentPlayerItems[key]) {
                    redraw = true;
                    break;
                }
            }
        }

        if (!redraw) {
            for (const key in currentPlayerCurrencies) {
                if ((this.lastPlayerCurrencies?.[key] ?? -1) !== currentPlayerCurrencies[key]) {
                    redraw = true;
                    break;
                }
            }
        }

        if (!redraw) {
            return; // Right here baby
        }

        // Cache everything at once (overwrite old values)
        this.lastItemCosts = recipe.itemCosts;
        this.lastCurrencyCosts = recipe.currencyCosts;
        this.lastPlayerItems = currentPlayerItems;
        this.lastPlayerCurrencies = currentPlayerCurrencies;
        this.lastAltMedia = altMedia;

        // Redraw icons
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
        this.text = getElementFromFragment(this._content, 'remaining-text', 'rielk-lang-string');
        this.icons = getElementFromFragment(this._content, 'icons', 'my-quantity-icons');
    }
    setGreen(recipe, game, altMedia = false){
        this.icons.setIconsForGreen(recipe, game, altMedia)
        this.text.textContent = "Costs spent";
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
    setItemsFromRecipe(recipe, game, altMedia = false) {

        if (!this.icons) {
            console.warn('[setItemsFromRecipe] WARNING: this.icons is undefined or null — cannot set icons for recipe');
            return;
        }
        this.icons.setIconsForRecipe(recipe, game, altMedia);
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

