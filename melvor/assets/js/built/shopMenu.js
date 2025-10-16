"use strict";
class ShopCostsAndUnlock {
    constructor(purchase, game, costContainer) {
        this.purchase = purchase;
        this.game = game;
        this.costContainer = costContainer;
        this.requirementElements = [];
        this.costElements = [];
        this.costFlex = createElement('div', {
            className: 'justify-horizontal-left flex-wrap'
        });
        this.createPurchaseRequirements();
        this.costContainer.append(this.costFlex);
        this.createCostElements();
    }
    get buyQty() {
        return this.purchase.allowQuantityPurchase ?
            this.game.shop.capPurchaseQuantity(this.purchase, this.game.shop.buyQuantity) :
            1;
    }
    updatePurchaseRequirements() {
        const requirements = this.purchase.purchaseRequirements;
        let unlockID = -1;
        const getNextUnlock = () => {
            unlockID++;
            return this.requirementElements[unlockID];
        };
        requirements.forEach((requirement) => {
            const met = this.game.checkRequirement(requirement, false);
            switch (requirement.type) {
                case 'SlayerTask':
                    {
                        const unlock = getNextUnlock();
                        if (met) {
                            hideElement(unlock.parent);
                        } else {
                            unlock.cost.textContent = this.getSlayerTaskUnlockText(requirement);
                        }
                        this.setUnlockElementMet(unlock, met);
                    }
                    break;
                default:
                    this.setUnlockElementMet(getNextUnlock(), met);
                    break;
            }
        });
    }
    /** Updates the gp, slayercoin, raidcoin and item costs */
    updateCostElements() {
        let costID = -1;
        const getNextCost = () => {
            costID++;
            return this.costElements[costID];
        };
        const costs = this.purchase.costs;
        costs.currencies.forEach((currencyCost) => {
            const amount = this.getCostQty(currencyCost);
            const currency = currencyCost.currency;
            this.updateCostElement(getNextCost(), currency.canAfford(amount), amount);
        });
        costs.items.forEach(({
            item,
            quantity
        }) => {
            this.updateCostElement(getNextCost(), this.isItemCostMet(item, quantity), quantity * this.buyQty);
        });
    }
    setToBuyLimit() {
        this.costElements.forEach(({
            image,
            cost
        }) => {
            hideElement(image);
            hideElement(cost);
        });
        this.requirementElements.forEach(({
            parent
        }) => hideElement(parent));
        if (this.buyLimit === undefined) {
            this.buyLimit = createElement('span', {
                className: 'text-danger',
                text: templateLangString('MENU_TEXT_BUY_LIMIT_REACHED', {
                    count: `${this.purchase.getBuyLimit(this.game.currentGamemode)}`,
                }),
                parent: this.costContainer,
            });
        } else {
            showElement(this.buyLimit);
        }
    }
    /** Important: When dereferencing this object, make sure to call this method first else memory leaks will ensue*/
    destroy() {
        this.costElements.forEach((elem) => {
            elem.tooltip.destroy();
        });
    }
    createPurchaseRequirements() {
        const requirements = this.purchase.purchaseRequirements;
        requirements.forEach((requirement) => {
            this.requirementElements.push(this.createUnlockElement(requirement.getNodes('skill-icon-xs m-1'), this.game.checkRequirement(requirement)));
        });
    }
    createCostElements() {
        const costs = this.purchase.costs;
        costs.currencies.forEach((currencyCost) => {
            const amount = this.getCostQty(currencyCost);
            const currency = currencyCost.currency;
            this.costElements.push(this.createCostElement(currency.media, amount, currency.canAfford(amount), currency.name));
        });
        costs.items.forEach(({
            item,
            quantity
        }) => {
            this.costElements.push(this.createCostElement(item.media, quantity * this.buyQty, this.isItemCostMet(item, quantity), item.name));
        });
    }
    setElementMet(element, met) {
        if (met) {
            element.classList.add('text-success');
            element.classList.remove('text-danger');
        } else {
            element.classList.add('text-danger');
            element.classList.remove('text-success');
        }
    }
    setUnlockElementMet(element, met) {
        this.setElementMet(element.cost, met);
    }
    updateCostElement(element, met, amount) {
        this.setElementMet(element.cost, met);
        element.cost.textContent = formatNumber(amount, 2);
    }
    getCostQty(amount) {
        const amountBought = this.game.shop.getPurchaseCount(this.purchase);
        return this.game.shop.getCurrencyCost(amount, this.buyQty, amountBought);
    }
    isItemCostMet(item, baseQty) {
        return this.game.bank.getQty(item) >= baseQty * this.buyQty;
    }
    getTextClass(met) {
        return met ? 'text-success' : 'text-danger';
    }
    getSlayerTaskUnlockText(requirement) {
        const currentCount = this.game.combat.slayerTask.getTaskCompletionsForTierAndAbove(requirement.category);
        return templateString(requirement.category.unlockText, {
            count: `${Math.max(requirement.count - currentCount, 0)}`,
        });
    }
    createUnlockElement(costNodes, met) {
        const parent = createElement('div', {
            className: 'font-w600',
            parent: this.costContainer
        });
        const cost = createElement('small', {
            className: this.getTextClass(met),
            children: costNodes,
            parent
        });
        return {
            parent,
            cost,
        };
    }
    createImage(media) {
        return createElement('img', {
            className: 'skill-icon-xs m-1',
            attributes: [
                ['src', media]
            ]
        });
    }
    createCostElement(media, qty, met, tooltipText) {
        const group = createElement('span', {
            className: 'no-wrap'
        });
        const image = this.createImage(media);
        const cost = createElement('span', {
            className: this.getTextClass(met),
            text: formatNumber(qty)
        });
        const tooltip = tippy(image, {
            content: tooltipText,
            placement: 'top',
            interactive: false,
            animation: false,
            allowHTML: true,
        });
        group.append(image, cost);
        this.costFlex.append(group);
        return {
            image,
            cost,
            tooltip,
        };
    }
}
class ShopConfirmModalItem extends ShopCostsAndUnlock {
    constructor(purchase, game) {
        const parent = createElement('div', {
            className: 'text-dark'
        });
        super(purchase, game, createElement('div'));
        this.costFlex.classList.replace('justify-horizontal-left', 'justify-horizontal-center');
        if (this.purchase.contains.itemCharges !== undefined) {
            this.buyChargeQty = createElement('div', {
                className: 'font-size-sm',
                text: templateLangString('MENU_TEXT_PLUS_CHARGES', {
                    count: numberWithCommas(this.buyQty * this.purchase.contains.itemCharges.quantity),
                }),
                parent,
            });
        }
        const description = createElement('div', {
            className: 'font-size-sm',
            parent
        });
        description.innerHTML = this.purchase.getTemplatedDescription(game.shop);
        parent.append(this.costContainer);
        this.parent = parent;
    }
    updateForQuantityChange() {
        if (this.purchase.contains.itemCharges !== undefined && this.buyChargeQty !== undefined) {
            this.buyChargeQty.textContent = templateLangString('MENU_TEXT_PLUS_CHARGES', {
                count: numberWithCommas(this.purchase.contains.itemCharges.quantity * this.buyQty),
            });
        }
        this.updateCostElements();
    }
}
class ShopItem extends ShopCostsAndUnlock {
    constructor(purchase, game, parent) {
        super(purchase, game, createElement('div', {
            className: 'font-w600'
        }));
        this.parent = parent;
        this.container = createElement('div', {
            className: 'media d-flex align-items-center push',
        });
        this.image = this.container
            .appendChild(createElement('div', {
                className: 'mr-3',
                parent: this.container
            }))
            .appendChild(createElement('img', {
                className: 'shop-img',
                attributes: [
                    ['src', this.purchase.media]
                ]
            }));
        this.mediaBody = createElement('div', {
            className: 'media-body',
            parent: this.container
        });
        if (this.purchase.contains.itemCharges !== undefined) {
            const container = createElement('div', {
                className: 'font-size-sm',
                parent: this.mediaBody
            });
            const owned = createElement('small', {
                className: 'badge badge-success',
                text: getLangString('MENU_TEXT_OWNED'),
                parent: container,
            });
            const ownedCharges = createElement('small', {
                className: 'badge badge-info',
                text: templateString(getLangString('MENU_TEXT_CURRENT_CHARGES'), {
                    count: formatNumber(this.game.itemCharges.getCharges(this.purchase.contains.itemCharges.item)),
                }),
                parent: container,
            });
            this.itemChargeDescription = {
                container,
                owned,
                ownedCharges,
            };
        }
        this.name = createElement('div', {
            className: 'font-w600',
            text: this.purchase.name,
            parent: this.mediaBody
        });
        if (this.purchase.contains.itemCharges !== undefined) {
            this.buyChargeQty = createElement('div', {
                className: 'font-size-sm',
                text: templateLangString('MENU_TEXT_PLUS_CHARGES', {
                    count: numberWithCommas(this.buyQty * this.purchase.contains.itemCharges.quantity),
                }),
                parent: this.mediaBody,
            });
        }
        this.description = createElement('div', {
            className: 'font-size-sm',
            parent: this.mediaBody
        });
        this.description.innerHTML = this.purchase.getTemplatedDescription(game.shop);
        this.currentDescription = createElement('div', {
            className: 'font-size-sm',
            parent: this.mediaBody
        });
        if (this.purchase.currentDescription !== undefined) {
            this.currentDescription.textContent = this.game.shop.getCurrentDescription(this.purchase);
        } else {
            this.currentDescription.classList.add('d-none');
        }
        this.mediaBody.appendChild(this.costContainer);
        this.parent.appendChild(this.container);
    }
    destroy() {
        super.destroy();
        this.parent.removeChild(this.container);
    }
    updateItemChargeDescription() {
        if (this.itemChargeDescription !== undefined && this.purchase.contains.itemCharges !== undefined) {
            const item = this.purchase.contains.itemCharges.item;
            if (this.game.isItemOwned(item)) {
                this.itemChargeDescription.ownedCharges.textContent = templateString(getLangString('MENU_TEXT_CURRENT_CHARGES'), {
                    count: formatNumber(this.game.itemCharges.getCharges(item)),
                });
                this.itemChargeDescription.owned.textContent = getLangString('MENU_TEXT_OWNED');
                this.itemChargeDescription.owned.classList.add('badge-success');
                this.itemChargeDescription.owned.classList.remove('badge-danger');
                showElement(this.itemChargeDescription.ownedCharges);
            } else {
                this.itemChargeDescription.owned.textContent = getLangString('MISC_STRING_NOT_OWNED');
                this.itemChargeDescription.owned.classList.add('badge-danger');
                this.itemChargeDescription.owned.classList.remove('badge-success');
                hideElement(this.itemChargeDescription.ownedCharges);
            }
        }
    }
    updateCurrentDescription() {
        if (this.purchase.currentDescription !== undefined) {
            this.currentDescription.textContent = this.game.shop.getCurrentDescription(this.purchase);
        }
    }
    /** Updates for a change in buyQty */
    updateForBuyQtyChange() {
        if (this.purchase.allowQuantityPurchase) {
            const maxPurchases = this.game.shop.capPurchaseQuantity(this.purchase, this.buyQty);
            this.name.textContent = `${numberWithCommas(maxPurchases)} x ${this.purchase.name}`;
            this.description.innerHTML = this.purchase.getTemplatedDescription(this.game.shop);
        }
        if (this.purchase.contains.itemCharges !== undefined && this.buyChargeQty !== undefined) {
            this.buyChargeQty.textContent = templateLangString('MENU_TEXT_PLUS_CHARGES', {
                count: numberWithCommas(this.purchase.contains.itemCharges.quantity * this.buyQty),
            });
        }
        this.updateCostElements();
    }
}
class QuickBuyItem extends ShopItem {
    constructor(purchase, game, parent) {
        super(purchase, game, parent);
        const buyContainer = createElement('div', {
            className: 'ml-3',
            parent: this.container
        });
        this.quantityMenu = new ShopBuyQuantityMenu(buyContainer);
    }
}
class ShopBuyQuantityMenu {
    constructor(parent, buyOptions = [1, 10, 100, 1000]) {
        this.parent = parent;
        this.container = createElement('div', {
            className: 'dropdown mr-2'
        });
        this.button = createElement('button', {
            className: 'btn btn-info dropdown-toggle shop-buy-qty-btn',
            id: `shop-buy-qty-btn-${ShopBuyQuantityMenu.menuCount}`,
            attributes: [
                ['type', 'button'],
                ['data-toggle', 'dropdown'],
                ['aria-haspopup', 'true'],
                ['aria-expanded', 'false'],
            ],
            text: 'Buy x1',
            parent: this.container,
        });
        this.container.onclick = (event) => {
            event.fromBuyQuantityDropdown = true;
        };
        const optionsContainer = createElement('div', {
            className: 'dropdown-menu dropdown-menu-right font-size-sm',
            attributes: [
                ['x-placement', 'bottom-end'],
                [
                    'style',
                    'position: absolute; will-change: transform; top: 0px; left: 0px; transform: translate3d(83px, 28px, 0px);z-index: 10000;',
                ],
            ],
            parent: this.container,
        });
        buyOptions.forEach((value) => {
            optionsContainer.appendChild(this.createBuyOption(value));
        });
        optionsContainer.appendChild(createElement('div', {
            className: 'dropdown-divider',
            attributes: [
                ['role', 'separator']
            ]
        }));
        const buttonID = `dropdown-content-custom-amount-${ShopBuyQuantityMenu.menuCount}`;
        const customContainer = createElement('div', {
            className: 'mx-2 form-group mb-0',
            parent: optionsContainer,
        });
        createElement('label', {
            attributes: [
                ['for', buttonID]
            ],
            text: getLangString('SHOP_MISC_9'),
            parent: customContainer,
        });
        this.input = createElement('input', {
            className: 'form-control',
            attributes: [
                ['type', 'number'],
                ['name', buttonID],
                ['placeholder', '100'],
                ['min', '1'],
                ['max', `${Shop.MAX_BUY_QUANTITY}`],
            ],
            id: buttonID,
            parent: customContainer,
        });
        const callback = () => this.onCustomChange();
        this.input.onchange = callback;
        this.input.onkeyup = callback;
        this.input.oninput = callback;
        this.parent.appendChild(this.container);
        ShopBuyQuantityMenu.menuCount++;
    }
    destroy() {
        this.parent.removeChild(this.container);
    }
    createBuyOption(value) {
        const option = createElement('a', {
            className: 'dropdown-item',
            text: `x${numberWithCommas(value)}`,
        });
        option.onclick = () => game.shop.updateBuyQuantity(value);
        return option;
    }
    onCustomChange() {
        const customQty = parseInt(this.input.value);
        if (!Number.isNaN(customQty) && customQty > 0) {
            game.shop.updateBuyQuantity(customQty);
        }
    }
}
ShopBuyQuantityMenu.menuCount = 0;
class ShopTabMenu {
    constructor(parent, _category, game) {
        this.parent = parent;
        this._category = _category;
        this.game = game;
        this.items = new Map();
        this.isOpen = true;
        this.purchases = this.game.shop.purchaseDisplayOrder.filter((purchase) => purchase.category === this._category);
        // Create the header
        this.icon = this.createHeader();
        // Create the items container
        this.hideBlock = createElement('div');
        this.itemsContainer = this.hideBlock
            .appendChild(createElement('div', {
                className: 'p-3'
            }))
            .appendChild(createElement('div', {
                className: 'row gutters-tiny row-deck'
            }));
        // Populate the items container
        this.updateItemSelection();
        this.parent.appendChild(this.hideBlock);
    }
    get category() {
        return this._category;
    }
    /** Updates the purchases that are currently available */
    updateItemSelection() {
        let lastItem;
        this.purchases.forEach((purchase) => {
            let existingItem = this.items.get(purchase);
            const shouldShow = this.shouldShowItem(purchase);
            if (shouldShow) {
                if (existingItem === undefined) {
                    const container = createElement('div', {
                        className: 'col-12 col-lg-6 col-xl-4 p-2'
                    });
                    const link = createElement('a', {
                        className: 'block block-content block-rounded block-link-pop pointer-enabled border border-2x',
                        parent: container,
                    });
                    link.onclick = () => this.game.shop.buyItemOnClick(purchase);
                    const item = new ShopItem(purchase, this.game, link);
                    if (lastItem !== undefined) {
                        lastItem.container.after(container);
                    } else {
                        this.itemsContainer.prepend(container);
                    }
                    existingItem = {
                        container,
                        item
                    };
                    this.items.set(purchase, existingItem);
                }
                if (shouldShow === 2 /* ShowShopItem.ShowAtBuyLimit */ )
                    existingItem.item.setToBuyLimit();
                lastItem = existingItem;
            } else if (existingItem !== undefined) {
                existingItem.item.destroy();
                this.itemsContainer.removeChild(existingItem.container);
                this.items.delete(purchase);
            }
        });
    }
    /** Updates each purchases costs */
    updatePurchaseCosts() {
        this.items.forEach(({
            item
        }) => {
            item.updateCostElements();
        });
    }
    /** Updates each purchase for a change in buyQty */
    updateForBuyQtyChange() {
        this.items.forEach(({
            item
        }) => {
            item.updateForBuyQtyChange();
        });
    }
    /** Updates each purchase for a change in requirements */
    updatePurchaseRequirements() {
        this.items.forEach(({
            item
        }) => {
            item.updatePurchaseRequirements();
        });
    }
    /** Updates each purchase for a change in item charges */
    updateForItemChargeChange() {
        this.items.forEach(({
            item
        }) => {
            item.updateItemChargeDescription();
        });
    }
    /** Updates a specific item in the categories current description */
    updateCurrentItemDescription(purchase) {
        var _a;
        (_a = this.items.get(purchase)) === null || _a === void 0 ? void 0 : _a.item.updateCurrentDescription();
    }
    /** Returns 0 if item should not be shown, 1 if item should be shown normally, 2 if item should be shown at buy limit */
    shouldShowItem(purchase) {
        if (!purchase.allowedGamemodes.has(this.game.currentGamemode) && purchase.allowedGamemodes.size > 0)
            return 0 /* ShowShopItem.DontShow */ ;
        if (this.game.shop.isPurchaseAtBuyLimit(purchase))
            return purchase.showBuyLimit ? 2 /* ShowShopItem.ShowAtBuyLimit */ : 0 /* ShowShopItem.DontShow */ ;
        if (purchase.unlockRequirements.length > 0) {
            return this.game.checkRequirements(purchase.unlockRequirements, false) ?
                1 /* ShowShopItem.Show */ :
                0 /* ShowShopItem.DontShow */ ;
        }
        return 1 /* ShowShopItem.Show */ ;
    }
    createHeader() {
        const mainBlock = createElement('div', {
            className: 'block-header block-header-default pointer-enabled'
        });
        mainBlock.onclick = (event) => {
            if (!event.fromBuyQuantityDropdown)
                this.toggle();
        };
        const title = createElement('h3', {
            className: 'block-title'
        });
        title.append(createElement('i', {
            className: 'fa fa-briefcase text-muted mr-1'
        }), this._category.name);
        const options = createElement('div', {
            className: 'block-options'
        });
        if (this.purchases.some((purchase) => purchase.allowQuantityPurchase)) {
            this.qtyMenu = new ShopBuyQuantityMenu(options);
        }
        const icon = createElement('i', {
            className: 'far fa-eye'
        });
        options.append(icon);
        mainBlock.append(title, options);
        this.parent.appendChild(mainBlock);
        return icon;
    }
    toggle() {
        if (this.isOpen) {
            this.icon.classList.add('fa-eye-slash');
            this.icon.classList.remove('fa-eye');
            hideElement(this.hideBlock);
        } else {
            this.icon.classList.add('fa-eye');
            this.icon.classList.remove('fa-eye-slash');
            showElement(this.hideBlock);
        }
        this.isOpen = !this.isOpen;
    }
}
class ShopMenu {
    constructor(game, containerID = 'new-shop', quickBuyID = 'quick-buy-item-content') {
        this.game = game;
        this.categorySelects = new Map();
        this.tabs = new Map();
        this.shownTabs = new Set();
        const categoryContainer = document.getElementById('shop-tab-container');
        if (categoryContainer === null)
            throw new Error(`Cannot create shop menu, element with id: shop-tab-container does not exist.`);
        game.shop.categoryDisplayOrder.forEach((category) => {
            const listItem = createElement('li', {
                className: `nav-main-item${this.shouldShowCategory(category) ? '' : ' d-none'}`,
            });
            const link = createElement('a', {
                className: 'nav-main-link active',
                parent: listItem
            });
            link.onclick = () => this.showSingleTab(category);
            createElement('img', {
                className: 'skill-icon-xs m-0 mr-2',
                attributes: [
                    ['src', category.media]
                ],
                parent: link,
            });
            createElement('span', {
                className: 'nav-main-link-name',
                text: category.name,
                parent: link
            });
            categoryContainer.append(listItem);
        });
        const cont = document.getElementById(containerID);
        if (cont === null)
            throw new Error(`Cannot create shop menu, element with id: ${containerID} does not exist.`);
        this.container = cont;
        game.shop.categoryDisplayOrder.forEach((category) => {
            this.tabs.set(category, this.createShopTab(category));
        });
        const quickCont = document.getElementById(quickBuyID);
        if (quickCont === null)
            throw new Error(`Cannot create shop menu, element with id: ${containerID} does not exist.`);
        this.quickbuyContainer = quickCont;
        const quickBuyButton = document.getElementById('quick-buy-item-button');
        if (quickBuyButton === null)
            throw new Error(`Cannot create shop menu, quickBuyButton not found.`);
        this.quickBuyButton = quickBuyButton;
        this.quickbuyMenu = new QuickBuyItem(this.game.shop.purchases.firstObject, this.game, this.quickbuyContainer);
    }
    shouldShowCategory(category) {
        return (!category.isGolbinRaid &&
            (category.allowedGamemodes.has(this.game.currentGamemode) || category.allowedGamemodes.size < 1));
    }
    /** Creates a new tab for the given category */
    createShopTab(category) {
        const container = createElement('div', {
            className: 'block d-none',
            parent: this.container,
        });
        const menu = new ShopTabMenu(container, category, this.game);
        return {
            menu,
            container
        };
    }
    updateItemPostPurchase(purchase) {
        var _a;
        (_a = this.tabs.get(purchase.category)) === null || _a === void 0 ? void 0 : _a.menu.updateCurrentItemDescription(purchase);
    }
    /** Updates the visible tabs for a change in cost quantity */
    updateForCostChange() {
        var _a;
        this.shownTabs.forEach((tab) => {
            tab.menu.updatePurchaseCosts();
        });
        (_a = this.confirmBuyItem) === null || _a === void 0 ? void 0 : _a.updateCostElements();
        this.quickbuyMenu.updateCostElements();
    }
    /** Updates the visible tabs for a change in requirements */
    updateForRequirementChange() {
        var _a;
        this.shownTabs.forEach((tab) => {
            tab.menu.updatePurchaseRequirements();
        });
        (_a = this.confirmBuyItem) === null || _a === void 0 ? void 0 : _a.updatePurchaseRequirements();
        this.quickbuyMenu.updatePurchaseRequirements();
    }
    /** Updates the visible tabs for a change in item charges */
    updateForItemChargeChange() {
        this.shownTabs.forEach((tab) => {
            tab.menu.updateForItemChargeChange();
        });
        this.quickbuyMenu.updateItemChargeDescription();
    }
    /** Updates the visible tabs for a change in buy quantity */
    updateForBuyQtyChange() {
        var _a;
        this.shownTabs.forEach(({
            menu
        }) => {
            menu.updateForBuyQtyChange();
        });
        (_a = this.confirmBuyItem) === null || _a === void 0 ? void 0 : _a.updateForQuantityChange();
        this.quickbuyMenu.updateForBuyQtyChange();
    }
    /** Updates a tabs content, then sets it to visible */
    showTab(category) {
        const tab = this.tabs.get(category);
        if (tab === undefined)
            throw new Error(`Tried to show tab for invalid category: ${category}`);
        if (this.shownTabs.has(tab))
            return;
        tab.menu.updatePurchaseRequirements();
        tab.menu.updateForItemChargeChange();
        tab.menu.updateForBuyQtyChange();
        showElement(tab.container);
        this.shownTabs.add(tab);
    }
    /** Hides a tabs content */
    hideTab(category) {
        const tab = this.tabs.get(category);
        if (tab === undefined)
            throw new Error(`Tried to hide tab for invalid category: ${category}`);
        if (!this.shownTabs.has(tab))
            return;
        hideElement(tab.container);
        this.shownTabs.delete(tab);
    }
    showCategoryButton(category) {
        var _a;
        (_a = this.categorySelects.get(category)) === null || _a === void 0 ? void 0 : _a.classList.remove('d-none');
    }
    hideCategoryButton(category) {
        var _a;
        (_a = this.categorySelects.get(category)) === null || _a === void 0 ? void 0 : _a.classList.add('d-none');
    }
    showAllTabsButRaid() {
        this.tabs.forEach((_, category) => {
            if (category.isGolbinRaid) {
                this.hideTab(category);
                this.hideCategoryButton(category);
            } else {
                if (this.shouldShowCategory(category)) {
                    this.showTab(category);
                    this.showCategoryButton(category);
                }
            }
        });
        $('#horizontal-navigation-shop').attr('class', 'd-lg-block mt-2 mt-lg-0 d-none');
        ShopMenu.NON_RAID_CURRENCIES.forEach((query) => {
            $(query).removeClass('d-none');
        });
        $('#shop-current-raid-coins').addClass('d-none');
    }
    showAllRaidTabs() {
        let raidTabs = 0;
        this.tabs.forEach((_, category) => {
            if (!category.isGolbinRaid) {
                this.hideTab(category);
                this.hideCategoryButton(category);
            } else {
                this.showTab(category);
                this.showCategoryButton(category);
                raidTabs++;
            }
        });
        if (raidTabs > 1) {
            $('#horizontal-navigation-shop').attr('class', 'd-lg-block mt-2 mt-lg-0');
        } else {
            $('#horizontal-navigation-shop').attr('class', 'd-none');
        }
        ShopMenu.NON_RAID_CURRENCIES.forEach((query) => {
            $(query).addClass('d-none');
        });
        $('#shop-current-raid-coins').removeClass('d-none');
    }
    hideAllTabs() {
        this.shownTabs.forEach((tab) => {
            hideElement(tab.container);
        });
        this.shownTabs.clear();
    }
    showSingleTab(category) {
        this.hideAllTabs();
        this.showTab(category);
    }
    changeQuickBuyItem(purchase) {
        this.quickbuyMenu.destroy();
        this.quickbuyMenu = new QuickBuyItem(purchase, this.game, this.quickbuyContainer);
        this.quickBuyButton.onclick = () => this.game.shop.buyItemOnClick(purchase);
    }
    updateQuickBuy() {
        this.quickbuyMenu.updateForBuyQtyChange();
        this.quickbuyMenu.updatePurchaseRequirements();
    }
    showConfirmBuyPrompt(purchase) {
        if (this.confirmBuyItem !== undefined)
            throw new Error('Tried to show confirm buy prompt when item already exists');
        this.confirmBuyItem = new ShopConfirmModalItem(purchase, this.game);
        SwalLocale.fire({
            title: purchase.allowQuantityPurchase ?
                templateLangString('SHOP_MISC_10', {
                    qty: `${this.game.shop.buyQuantity}`,
                    shopName: purchase.name
                }) :
                templateLangString('SHOP_MISC_7', {
                    shopName: purchase.name
                }),
            html: this.confirmBuyItem.parent,
            imageUrl: purchase.media,
            imageWidth: 64,
            imageHeight: 64,
            imageAlt: getLangString('SHOP_MISC_8'),
            showCancelButton: true,
            confirmButtonText: getLangString('SHOP_MISC_8'),
        }).then((result) => {
            var _a;
            if (result.value) {
                this.game.shop.buyItemOnClick(purchase, true);
            }
            (_a = this.confirmBuyItem) === null || _a === void 0 ? void 0 : _a.destroy();
            this.confirmBuyItem = undefined;
        });
    }
}
ShopMenu.NON_RAID_CURRENCIES = [
    '#shop-current-gp',
    '#shop-current-sc',
    '#shop-current-ap',
    '#shop-current-asc',
];
//# sourceMappingURL=shopMenu.js.map
checkFileVersion('?12097')