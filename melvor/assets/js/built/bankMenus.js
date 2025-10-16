"use strict";
// Components for the bank
const DRAG_DELAY_MS = 201;
class BankItemIconElement extends HTMLElement {
    constructor() {
        super();
        this.dragTimer = -1;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('bank-item-icon-template'));
        this.link = getElementFromFragment(this._content, 'link', 'a');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.quantity = getElementFromFragment(this._content, 'quantity', 'small');
        this.hasUpgrade = getElementFromFragment(this._content, 'has-upgrade', 'img');
        this.hasDowngrade = getElementFromFragment(this._content, 'has-downgrade', 'img');
        this.hasDamageType = getElementFromFragment(this._content, 'has-damage-type', 'img');
        this.className = 'bank-item pointer-enabled m-2';
    }
    connectedCallback() {
        // Fix for when this element is deeply cloned. Used to prevent fallback Sortable ghost from having duplicate nodes.
        if (this.firstElementChild !== null && this.firstElementChild !== this.link)
            this.textContent = '';
        this.appendChild(this._content);
        this.tooltip = tippy(this, {
            content: '',
            placement: 'top',
            allowHTML: true,
            interactive: false,
            animation: false,
            touch: 'hold',
            onShow: (instance) => {
                if (this.item !== undefined)
                    instance.setContent(createItemInformationTooltip(this.item));
            },
        });
        if (nativeManager.isGeckoView) {
            this.addEventListener('touchstart', this.onTouchStart);
            this.addEventListener('touchend', this.onTouchEnd);
            this.addEventListener('touchmove', this.onTouchMove);
        }
    }
    disconnectedCallback() {
        if (this.tooltip !== undefined) {
            this.tooltip.destroy();
            this.tooltip = undefined;
        }
        if (nativeManager.isGeckoView) {
            this.removeEventListener('touchstart', this.onTouchStart);
            this.removeEventListener('touchend', this.onTouchEnd);
            this.removeEventListener('touchmove', this.onTouchMove);
        }
    }
    setItem(bank, bankItem) {
        this.image.src = bankItem.item.media;
        this.updateQuantity(bankItem, game.settings.enableAccessibility);
        this.onclick = () => bank.selectItemOnClick(bankItem.item);
        this.ondblclick = () => bank.onItemDoubleClick(bankItem.item);
        this.setAttribute('data-item-id', bankItem.item.id);
        this.setBorder(game.settings.useDefaultBankBorders, bankItem.locked);
        this.setGlow(bankItem.isGlowing);
        this.item = bankItem.item;
        const upgrades = bank.itemUpgrades.get(bankItem.item);
        if (upgrades !== undefined) {
            if (upgrades[0].isDowngrade) {
                this.hasDowngrade.classList.remove('d-none');
                this.hasUpgrade.classList.add('d-none');
            } else {
                this.hasUpgrade.classList.remove('d-none');
                this.hasDowngrade.classList.add('d-none');
            }
        }
        if (bankItem.item instanceof WeaponItem) {
            this.hasDamageType.classList.remove('d-none');
            this.hasDamageType.src = bankItem.item.damageType.media;
        } else
            this.hasDamageType.classList.add('d-none');
    }
    updateQuantity(bankItem, enableAccessibility) {
        const accessibilityText = enableAccessibility ? ` ${bankItem.item.name}` : '';
        this.quantity.textContent = formatNumber(bankItem.quantity) + accessibilityText;
        this.onmouseenter = () => {
            this.quantity.textContent = numberWithCommas(bankItem.quantity) + accessibilityText;
        };
        this.onmouseleave = () => {
            this.quantity.textContent = formatNumber(bankItem.quantity) + accessibilityText;
        };
    }
    setBorder(useDefaultBorder, isLocked) {
        if (isLocked) {
            this.classList.add('bank-locked');
        } else {
            this.classList.remove('bank-locked');
        }
        if (useDefaultBorder) {
            this.classList.remove('no-bg', 'btn-light', 'btn-locked');
        } else {
            this.classList.add('no-bg');
            if (isLocked) {
                this.classList.remove('btn-light');
                this.classList.add('btn-locked');
            } else {
                this.classList.remove('btn-locked');
                this.classList.add('btn-light');
            }
        }
    }
    setGlow(isGlowing) {
        if (isGlowing)
            this.classList.add('green-glow', 'active');
        else
            this.classList.remove('green-glow', 'active');
    }
    addSelectionBorder(selectionMode) {
        this.image.classList.add('border', 'border-4x');
        switch (selectionMode) {
            case 1 /* BankSelectionMode.MoveItems */ :
                this.image.classList.add('border-info');
                break;
            case 2 /* BankSelectionMode.SellItems */ :
                this.image.classList.add('border-warning');
                break;
            case 0 /* BankSelectionMode.None */ :
                this.image.classList.add('border-success');
                break;
        }
    }
    removeSelectionBorder(selectionMode) {
        this.image.classList.remove('border', 'border-4x');
        switch (selectionMode) {
            case 1 /* BankSelectionMode.MoveItems */ :
                this.image.classList.remove('border-info');
                break;
            case 2 /* BankSelectionMode.SellItems */ :
                this.image.classList.remove('border-warning');
                break;
            case 0 /* BankSelectionMode.None */ :
                this.image.classList.remove('border-success');
                break;
        }
    }
    onTouchStart() {
        this.clearDragTimer();
        this.dragTimer = window.setTimeout(() => {
            document.body.classList.add('overflow-hidden');
        }, DRAG_DELAY_MS);
    }
    onTouchEnd() {
        this.clearDragTimer();
        document.body.classList.remove('overflow-hidden');
    }
    onTouchMove(e) {
        var _a;
        if (!document.body.classList.contains('overflow-hidden')) {
            this.clearDragTimer();
            return;
        }
        const pos = e.touches[0].clientY;
        const top = (_a = document.getElementById('page-header')) === null || _a === void 0 ? void 0 : _a.scrollHeight;
        if (!top)
            return;
        const bottom = window.innerHeight;
        if (pos < top + 5) {
            window.scroll({
                top: window.scrollY - 5
            });
        } else if (pos < top + 20) {
            window.scroll({
                top: window.scrollY - 1
            });
        } else if (pos > bottom - 5) {
            window.scroll({
                top: window.scrollY + 5
            });
        } else if (pos > bottom - 20) {
            window.scroll({
                top: window.scrollY + 1
            });
        }
    }
    clearDragTimer() {
        if (this.dragTimer === -1)
            return;
        clearTimeout(this.dragTimer);
        this.dragTimer = -1;
    }
}
window.customElements.define('bank-item-icon', BankItemIconElement);
class BankTabMenuElement extends HTMLElement {
    constructor() {
        super();
        this.tabs = [];
        /** All item icons that are currently present in the bank */
        this.itemIcons = new Map();
        this.isSorting = false;
        this.tabValueTooltips = [];
        this.bankValueTooltips = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('bank-tab-menu-template'));
        this.tabContainer = getElementFromFragment(this._content, 'tab-container', 'ul');
        this.spaceFractionLabel = getElementFromFragment(this._content, 'space-fraction-label', 'span');
        this.spaceFraction = getElementFromFragment(this._content, 'space-fraction', 'span');
        this.bankValueLabel = getElementFromFragment(this._content, 'bank-value-label', 'span');
        this.tabValueLabel = getElementFromFragment(this._content, 'tab-value-label', 'span');
        this.sellAllButton = getElementFromFragment(this._content, 'sell-all-button', 'a');
        this.sellAllText = getElementFromFragment(this._content, 'sell-all-text', 'span');
        this.unlockAllButton = getElementFromFragment(this._content, 'unlock-all-button', 'a');
        this.unlockAllText = getElementFromFragment(this._content, 'unlock-all-text', 'span');
        this.lockAllButton = getElementFromFragment(this._content, 'lock-all-button', 'a');
        this.lockAllText = getElementFromFragment(this._content, 'lock-all-text', 'span');
        this.paneContainer = getElementFromFragment(this._content, 'pane-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    disconnectedCallback() {
        this.destroyTabTooltips();
        this.destroyBankTooltips();
    }
    destroyTabTooltips() {
        this.tabValueTooltips.forEach((tt) => tt.destroy());
        this.tabValueTooltips = [];
    }
    destroyBankTooltips() {
        this.bankValueTooltips.forEach((tt) => tt.destroy());
        this.bankValueTooltips = [];
    }
    getFromTabID(from) {
        return this.tabs.findIndex(({
            itemContainer
        }) => itemContainer === from);
    }
    /** Initializes the element with a bank object */
    initialize(bank) {
        this.spaceFractionLabel.textContent = templateLangString('BANK_STRING_59', {
            bankSpace: ''
        });
        this.sellAllText.innerHTML = getLangString('BANK_STRING_55');
        this.unlockAllText.innerHTML = getLangString('BANK_STRING_56');
        this.lockAllText.innerHTML = getLangString('BANK_STRING_57');
        this.sellAllButton.onclick = () => bank.sellUnlockedItemsOnClick();
        this.unlockAllButton.onclick = () => bank.setLockOfSelectedTab(false);
        this.lockAllButton.onclick = () => bank.setLockOfSelectedTab(true);
        this.tabContainer.ontouchstart = () => {
            disableSwipeEvents = true;
        };
        this.tabContainer.ontouchend = () => {
            disableSwipeEvents = false;
        };
        this.tabContainer.ontouchcancel = () => {
            disableSwipeEvents = false;
        };
        game.settings.enableStickyBankTabs ? this.enableStickyBankTabs() : this.disableStickyBankTabs();
    }
    /** Loads the tab menus, after the save has loaded */
    loadTabs(bank) {
        this.updateTabCount(bank);
        this.tabs[0].pane.classList.add('active');
        this.tabs[0].tabLink.classList.add('active');
    }
    loadAllItems(bank) {
        bank.itemsByTab.forEach((tab, tabID) => {
            tab.forEach((bankItem) => {
                const newItemIcon = new BankItemIconElement();
                this.tabs[tabID].itemContainer.append(newItemIcon);
                newItemIcon.setItem(bank, bankItem);
                this.itemIcons.set(bankItem.item, newItemIcon);
            });
        });
    }
    updateTabCount(bank) {
        const tabTemplate = getTemplateElement('bank-tab-menu-tab-template').content;
        const paneTemplate = getTemplateElement('bank-tab-menu-pane-template').content;
        const delayOnTouchOnly = getSortableDelayOnTouch();
        for (let tabID = this.tabs.length; tabID < bank.tabCount; tabID++) {
            const newTabElement = new DocumentFragment();
            newTabElement.append(tabTemplate.cloneNode(true));
            const newPaneElement = new DocumentFragment();
            newPaneElement.append(paneTemplate.cloneNode(true));
            const tab = getElementFromFragment(newTabElement, 'tab-main', 'li');
            const tabLink = getElementFromFragment(newTabElement, 'tab-link', 'a');
            const tabImage = getElementFromFragment(newTabElement, 'tab-image', 'img');
            const pane = getElementFromFragment(newPaneElement, 'pane', 'div');
            const itemContainer = getElementFromFragment(newPaneElement, 'item-container', 'div');
            this.tabContainer.append(newTabElement);
            this.paneContainer.append(newPaneElement);
            tab.onclick = () => this.selectTab(tabID, bank);
            const containerSortable = new Sortable(itemContainer, {
                group: 'bankContainer',
                delay: 200,
                delayOnTouchOnly,
                draggable: 'bank-item-icon',
                dataIdAttr: 'data-item-id',
                onEnd: (event) => {
                    this.isSorting = false;
                    disableSwipeEvents = false;
                    if (event.newIndex === undefined || event.oldIndex === undefined || event.to !== itemContainer)
                        return;
                    bank.moveItemInTab(tabID, event.oldIndex, event.newIndex);
                    this.validateItemOrder();
                    tippy.hideAll();
                },
                onMove: (event) => {
                    tippy.hideAll();
                },
                onChoose: (event) => {
                    this.isSorting = true;
                    disableSwipeEvents = true;
                    tippy.hideAll();
                },
                onStart: (event) => {
                    if (Sortable.ghost !== null && Sortable.ghost !== undefined && event.oldIndex !== undefined) {
                        const bankItem = bank.itemsByTab[tabID][event.oldIndex];
                        Sortable.ghost.setItem(bank, bankItem);
                    }
                },
            });
            const tabSortable = new Sortable(tab, {
                group: {
                    name: 'bankTab',
                    put: ['bankContainer'],
                },
                sort: false,
                draggable: 'bank-item-icon',
                onAdd: (event) => {
                    this.isSorting = false;
                    if (event.newIndex === undefined || event.oldIndex === undefined)
                        return;
                    itemContainer.append(event.item);
                    bank.moveItemToNewTab(this.getFromTabID(event.from), tabID, event.oldIndex);
                    this.validateItemOrder();
                    tabLink.classList.remove('bg-combat-menu-selected');
                },
            });
            // Custom events for making the tab highlight
            tab.addEventListener('dragenter', (event) => {
                if (this.isSorting && !tab.contains(event.relatedTarget)) {
                    tabLink.classList.add('bg-combat-menu-selected');
                }
            });
            tab.addEventListener('dragleave', (event) => {
                if (this.isSorting && !tab.contains(event.relatedTarget)) {
                    tabLink.classList.remove('bg-combat-menu-selected');
                }
            });
            // Fallback events for browsers that do not support drag API
            tab.addEventListener('mouseenter', (event) => {
                if (this.isSorting) {
                    tabLink.classList.add('bg-combat-menu-selected');
                }
            });
            tab.addEventListener('mouseleave', (event) => {
                if (this.isSorting) {
                    tabLink.classList.remove('bg-combat-menu-selected');
                }
            });
            // Fallback event for mobile devices
            tab.addEventListener('touchmove', (event) => {
                if (!this.isSorting)
                    return;
                const x = event.touches[0].clientX;
                const y = event.touches[0].clientY;
                const elementAtTouchPoint = document.elementFromPoint(x, y);
                if (elementAtTouchPoint === tab || (elementAtTouchPoint === null || elementAtTouchPoint === void 0 ? void 0 : elementAtTouchPoint.parentNode) === tab) {
                    tabLink.classList.add('bg-combat-menu-selected');
                } else {
                    tabLink.classList.remove('bg-combat-menu-selected');
                }
            });
            this.tabs.push({
                tab,
                tabLink,
                tabImage,
                pane,
                itemContainer,
                containerSortable,
            });
        }
    }
    addItemToEndofTab(bank, bankItem) {
        const itemIcon = new BankItemIconElement();
        this.tabs[bankItem.tab].itemContainer.append(itemIcon);
        itemIcon.setItem(bank, bankItem);
        this.itemIcons.set(bankItem.item, itemIcon);
    }
    removeItemFromTab(item) {
        var _a;
        const icon = this.itemIcons.get(item);
        if (icon === undefined)
            throw new Error('Tried to remove item icon but that does not exist');
        (_a = icon.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(icon);
        this.itemIcons.delete(item);
    }
    sortTabByOrder(tabID, order) {
        this.tabs[tabID].containerSortable.sort(order);
    }
    toggleScrollableTabs(enableScrolling) {
        if (enableScrolling) {
            this.tabContainer.classList.add('mobile-scroll');
            if (this.searchResultTabs !== undefined)
                this.updateTabsForSearch(this.searchResultTabs, enableScrolling);
        } else {
            this.tabContainer.classList.remove('mobile-scroll');
            if (this.searchResultTabs !== undefined)
                this.tabs.forEach((tab) => showElement(tab.tabLink));
        }
    }
    /** Test function for validating DOM order matches game bank order */
    validateItemOrder() {
        this.tabs.forEach((tab, tabID) => {
            Array.from(tab.itemContainer.children).forEach((child, tabPosition) => {
                var _a, _b;
                if (child.getAttribute('data-item-id') !== ((_a = game.bank.itemsByTab[tabID][tabPosition]) === null || _a === void 0 ? void 0 : _a.item.id)) {
                    console.log(`Item order validation failed. DOM has ${child.getAttribute('data-item-id')} at [${tabID},${tabPosition}], but bank has ${(_b = game.bank.itemsByTab[tabID][tabPosition]) === null || _b === void 0 ? void 0 : _b.item.id}`);
                }
            });
        });
    }
    /** Adds a selection border to the bank-item-icon corresponding to it*/
    setItemSelected(item, selectMode) {
        var _a;
        (_a = this.itemIcons.get(item)) === null || _a === void 0 ? void 0 : _a.addSelectionBorder(selectMode);
    }
    /** Removes a selection border from the bank-item-icon corresponding to it */
    setItemUnselected(item, selectMode) {
        var _a;
        (_a = this.itemIcons.get(item)) === null || _a === void 0 ? void 0 : _a.removeSelectionBorder(selectMode);
    }
    setItemsUnselected(items, selectMode) {
        items.forEach((bankItem) => {
            this.setItemUnselected(bankItem.item, selectMode);
        });
    }
    moveIconsToNewTab(itemsToMove, newTabID) {
        const newTabContainer = this.tabs[newTabID].itemContainer;
        itemsToMove.forEach((bankItem) => {
            var _a;
            const itemIcon = this.itemIcons.get(bankItem.item);
            if (itemIcon !== undefined) {
                (_a = itemIcon.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(itemIcon);
                newTabContainer.appendChild(itemIcon);
            }
        });
    }
    updateItemLockBorder(bankItem, useDefaultBorder) {
        var _a;
        (_a = this.itemIcons.get(bankItem.item)) === null || _a === void 0 ? void 0 : _a.setBorder(useDefaultBorder, bankItem.locked);
    }
    updateItemGlow(bankItem) {
        var _a;
        (_a = this.itemIcons.get(bankItem.item)) === null || _a === void 0 ? void 0 : _a.setGlow(bankItem.isGlowing);
    }
    /** Updates the bank search based on a search result */
    updateForSearchResult(foundItems, foundTabs, hideTabs) {
        this.itemIcons.forEach((icon, item) => {
            if (foundItems.has(item) && game.bank.shouldShowBasedOnFilter(item)) {
                showElement(icon);
            } else {
                hideElement(icon);
            }
        });
        this.searchResultTabs = foundTabs;
        this.updateTabsForSearch(foundTabs, hideTabs);
    }
    updateTabsForSearch(foundTabs, hideTabs) {
        this.tabs.forEach((tab, tabID) => {
            if (foundTabs.has(tabID)) {
                tab.tabLink.classList.add('bg-bank-tab-search');
                if (hideTabs)
                    showElement(tab.tabLink);
            } else {
                tab.tabLink.classList.remove('bg-bank-tab-search');
                if (hideTabs)
                    hideElement(tab.tabLink);
            }
        });
    }
    updateForFilterResult(foundItems) {
        this.itemIcons.forEach((icon, item) => {
            if (foundItems.has(item)) {
                showElement(icon);
            } else {
                hideElement(icon);
            }
        });
    }
    /** Makes all bank items visible */
    showAllItems() {
        this.itemIcons.forEach((icon, item) => {
            if (game.settings.bankFilterShowAll || game.bank.shouldShowBasedOnFilter(item))
                showElement(icon);
        });
        this.tabs.forEach((tab) => {
            tab.tabLink.classList.remove('bg-bank-tab-search');
            showElement(tab.tabLink);
        });
        this.searchResultTabs = undefined;
    }
    /** Sets the specified tabs image to the media string provided */
    setTabImage(tabID, media) {
        this.tabs[tabID].tabImage.src = media;
    }
    selectTab(tabID, bank) {
        if (bank.selectedBankTab === tabID)
            return;
        const oldTab = this.tabs[bank.selectedBankTab];
        oldTab.pane.classList.remove('active');
        oldTab.tabLink.classList.remove('active');
        const newTab = this.tabs[tabID];
        newTab.pane.classList.add('active');
        newTab.tabLink.classList.add('active');
        bank.selectedBankTab = tabID;
        this.setTabValue(bank.getTabValue(tabID));
        bank.onBankFilterChange();
    }
    updateBankValue(bank) {
        this.setTabValue(bank.getTabValue(bank.selectedBankTab));
        this.setBankValue(bank.getBankValue());
    }
    updateBankSpace(bank) {
        bank.updateSpaceElement(this.spaceFraction);
    }
    setTabValue(value) {
        this.destroyTabTooltips();
        this.tabValueTooltips = this.setValueLabel(this.tabValueLabel, value);
    }
    setBankValue(value) {
        this.destroyBankTooltips();
        this.bankValueTooltips = this.setValueLabel(this.bankValueLabel, value);
    }
    setValueLabel(label, value) {
        const tooltips = [];
        label.textContent = '';
        value.forEach((quantity, currency) => {
            const span = createElement('span', {
                className: 'mr-2',
                parent: label
            });
            createElement('img', {
                className: 'skill-icon-xxs mr-1',
                attributes: [
                    ['src', currency.media]
                ],
                parent: span
            });
            createElement('span', {
                className: 'font-w400',
                text: currency.formatAmount(formatNumber(quantity)),
                parent: span,
            });
            tooltips.push(tippy(span, {
                content: `${numberWithCommas(quantity)} ${currency.name}`,
                placement: 'bottom',
                allowHTML: true,
                interactive: false,
                animation: false,
            }));
        });
        return tooltips;
    }
    enableStickyBankTabs() {
        this.tabContainer.classList.add('sticky-div-mobile');
    }
    disableStickyBankTabs() {
        this.tabContainer.classList.remove('sticky-div-mobile');
    }
}
window.customElements.define('bank-tab-menu', BankTabMenuElement);
/** Dropdown menu for selecting a tab in the bank */
class BankTabDropdownMenuElement extends HTMLElement {
    constructor() {
        super();
        this.tabImages = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('bank-tab-dropdown-menu-template'));
        this.openButton = getElementFromFragment(this._content, 'open-dropdown-button', 'button');
        this.optionsContainer = getElementFromFragment(this._content, 'dropdown-options', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /**
     * Initializes the menu, creating new options
     * @param bank The bank object linked to this menu
     * @param optionSelectCallback The callback function when a tab option is selected
     */
    initialize(bank, optionSelectCallback) {
        this.openButton.onclick = () => {
            this.updateTabCount(bank, optionSelectCallback);
            this.updateTabImages(bank);
        };
    }
    updateTabCount(bank, optionSelectCallback) {
        const optionsTemplate = getTemplateElement('bank-tab-dropdown-menu-option-template').content;
        for (let tabID = this.tabImages.length; tabID < bank.tabCount; tabID++) {
            const newOption = new DocumentFragment();
            newOption.append(optionsTemplate.cloneNode(true));
            const link = getElementFromFragment(newOption, 'link', 'a');
            const image = getElementFromFragment(newOption, 'image', 'img');
            const tabNumber = getElementFromFragment(newOption, 'tab-number', 'span');
            tabNumber.textContent = `${tabID}`;
            link.onclick = () => optionSelectCallback(tabID);
            image.src = bank.getTabMedia(tabID);
            this.tabImages.push(image);
            this.optionsContainer.appendChild(newOption);
        }
    }
    updateTabImages(bank) {
        this.tabImages.forEach((image, tabID) => {
            image.src = bank.getTabMedia(tabID);
        });
    }
}
window.customElements.define('bank-tab-dropdown-menu', BankTabDropdownMenuElement);
class BankOptionsMenuElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('bank-options-menu-template'));
        this.sortButton = getElementFromFragment(this._content, 'sort-button', 'button');
        this.moveModeButton = getElementFromFragment(this._content, 'move-mode-button', 'button');
        this.sellModeButton = getElementFromFragment(this._content, 'sell-mode-button', 'button');
        this.searchBar = getElementFromFragment(this._content, 'searchTextbox', 'input');
        this.clearSearchButton = getElementFromFragment(this._content, 'clear-search-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    initialize(bank) {
        this.sortButton.onclick = () => bank.sortButtonOnClick();
        this.moveModeButton.onclick = () => bank.moveItemModeOnClick();
        this.sellModeButton.onclick = () => bank.sellItemModeOnClick();
        this.searchBar.onkeyup = () => {
            const query = this.searchBar.value;
            bank.onBankSearchChange(query);
        };
        this.clearSearchButton.onclick = () => {
            this.searchBar.value = '';
            bank.onBankSearchChange('');
        };
    }
    setSearchNone() {
        this.searchBar.classList.add('text-danger');
    }
    setSearchNormal() {
        this.searchBar.classList.remove('text-danger');
    }
}
window.customElements.define('bank-options-menu', BankOptionsMenuElement);
class BankMoveModeMenuElement extends HTMLElement {
    constructor() {
        super();
        this.tabSelectedToMove = 0;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('bank-move-mode-menu-template'));
        this.tabSelection = getElementFromFragment(this._content, 'tab-selection', 'bank-tab-dropdown-menu');
        this.confirmMoveButton = getElementFromFragment(this._content, 'confirm-move-button', 'button');
        this.selectionCount = getElementFromFragment(this._content, 'item-selection-count', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    initialize(bank) {
        this.tabSelection.initialize(bank, (tabID) => (this.tabSelectedToMove = tabID));
        this.confirmMoveButton.onclick = () => {
            bank.moveSelectedItemsToTab(this.tabSelectedToMove);
        };
    }
    updateSelectionCount(bank) {
        this.selectionCount.textContent = templateLangString('MENU_TEXT_MOVE_ITEMS_SELECTED', {
            num: `${bank.slotsSelected}`,
        });
    }
}
window.customElements.define('bank-move-mode-menu', BankMoveModeMenuElement);
class BankSellModeMenuElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('bank-sell-mode-menu-template'));
        this.confirmSellButton = getElementFromFragment(this._content, 'confirm-sell-button', 'button');
        this.selectionCount = getElementFromFragment(this._content, 'selection-count', 'span');
        this.selectionValue = getElementFromFragment(this._content, 'selection-value', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    initialize(bank) {
        this.confirmSellButton.onclick = () => bank.sellAllSelectedItems();
    }
    updateSelectionValues(bank) {
        const {
            value,
            count
        } = bank.getSelectedItemInfo();
        this.selectionCount.textContent = templateLangString('MENU_TEXT_MOVE_ITEMS_SELECTED', {
            num: `${count}`,
        });
        this.selectionValue.textContent = '';
        value.forEach((quantity, currency) => {
            this.selectionValue.append(createElement('img', {
                className: 'skill-icon-xxs mr-2',
                attributes: [
                    ['src', currency.media]
                ],
            }), currency.formatAmount(formatNumber(quantity)));
        });
    }
}
window.customElements.define('bank-sell-mode-menu', BankSellModeMenuElement);
/** Wrapper class for ion-range-slider for the purposes of bank quantity sliders */
class BankRangeSlider {
    constructor(inputElement) {
        this.inputElement = inputElement;
        this._sliderValue = 0;
        this.sliderMode = 0 /* BankRangeSliderMode.Custom */ ;
        this.sliderMin = 0;
        this.sliderMax = 1;
        this.customOnChange = () => {};
        const inputQuery = $(inputElement);
        inputQuery.ionRangeSlider({
            skin: 'round',
            type: 'single',
            min: 0,
            max: 1,
            from: 0,
            onChange: (data) => {
                this.onSliderChange(data.from);
            },
        });
        this.sliderInstance = inputQuery.data('ionRangeSlider');
    }
    get quantity() {
        return this._sliderValue;
    }
    onSliderChange(newValue) {
        this._sliderValue = newValue;
        disableSidebarSwipeTimer();
        const modeReset = this.checkSliderMode(newValue);
        this.customOnChange(newValue, modeReset);
    }
    checkSliderMode(newValue) {
        let modeReset = false;
        switch (this.sliderMode) {
            case 2 /* BankRangeSliderMode.All */ :
                modeReset = newValue !== this.sliderMax;
                break;
            case 1 /* BankRangeSliderMode.AllButOne */ :
                modeReset = newValue !== this.sliderMax - 1;
                break;
        }
        if (modeReset)
            this.sliderMode = 0 /* BankRangeSliderMode.Custom */ ;
        return modeReset;
    }
    /** Sets the slider to behave in special modes */
    setSliderMode(mode) {
        this.sliderMode = mode;
        switch (mode) {
            case 2 /* BankRangeSliderMode.All */ :
                this.setSliderPosition(this.sliderMax);
                break;
            case 1 /* BankRangeSliderMode.AllButOne */ :
                this.setSliderPosition(this.sliderMax - 1);
                break;
        }
    }
    /** Sets the slider range based on the quantity of the bank item provided */
    setSliderRange(bankItem) {
        const currentValue = this._sliderValue;
        this.sliderMax = bankItem.quantity;
        const fixSlider = this.sliderMax === 1;
        this.sliderMin = fixSlider ? 0 : 1;
        let sliderStart = this._sliderValue;
        switch (this.sliderMode) {
            case 2 /* BankRangeSliderMode.All */ :
                sliderStart = this.sliderMax;
                break;
            case 1 /* BankRangeSliderMode.AllButOne */ :
                sliderStart = this.sliderMax - 1;
                break;
            default:
                sliderStart = clampValue(this._sliderValue, this.sliderMin, this.sliderMax);
        }
        this.sliderInstance.update({
            min: this.sliderMin,
            max: this.sliderMax,
            from_fixed: fixSlider,
            from: sliderStart,
        });
        this._sliderValue = sliderStart;
        if (sliderStart !== currentValue) {
            const modeReset = this.checkSliderMode(sliderStart);
            this.customOnChange(sliderStart, modeReset);
        }
    }
    /** Sets the slider position to the specified value */
    setSliderPosition(value) {
        value = clampValue(value, this.sliderMin, this.sliderMax);
        this.sliderInstance.update({
            from: value,
        });
        this._sliderValue = value;
        const modeReset = this.checkSliderMode(value);
        this.customOnChange(value, modeReset);
    }
    /** Sets custom callback function to execute when slider changes values */
    setOnChange(onChange) {
        this.customOnChange = onChange;
    }
}
/** Component for displaying bank item information and interaction options */
class BankSelectedItemMenuElement extends HTMLElement {
    constructor() {
        super();
        this.sizeElements = [];
        this.equipToSetButtons = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('bank-selected-item-menu-template'));
        BankSelectedItemMenuElement.colSizeClasses.default.forEach((_, i) => {
            this.sizeElements.push(getAnyElementFromFragment(this._content, `size-elem-${i}`));
        });
        this.noneSelectedMessage = getElementFromFragment(this._content, 'none-selected-message', 'div');
        this.selectedItemContainer = getElementFromFragment(this._content, 'selected-item-container', 'div');
        this.itemImage = getElementFromFragment(this._content, 'item-image', 'img');
        this.itemLockButton = getElementFromFragment(this._content, 'item-lock-button', 'button');
        this.itemLockIcon = getElementFromFragment(this._content, 'item-lock-icon', 'i');
        this.quantityBadge = getElementFromFragment(this._content, 'quantity-badge', 'small');
        this.handednessBadge = getElementFromFragment(this._content, 'handedness-badge', 'small');
        this.itemName = getElementFromFragment(this._content, 'item-name', 'span');
        this.itemDescription = getElementFromFragment(this._content, 'item-description', 'small');
        this.itemHealing = getElementFromFragment(this._content, 'item-healing', 'h5');
        this.viewStatsButton = getElementFromFragment(this._content, 'view-stats-button', 'h5');
        this.itemWikiLink = getElementFromFragment(this._content, 'item-wiki-link', 'button');
        this.specialAttackContainer = getElementFromFragment(this._content, 'special-attack-container', 'div');
        this.specialAttackList = getElementFromFragment(this._content, 'special-attack-list', 'div');
        this.upgradeContainer = getElementFromFragment(this._content, 'upgrade-container', 'div');
        this.upgradeIcon = getElementFromFragment(this._content, 'upgrade-icon', 'img');
        this.downgradeIcon = getElementFromFragment(this._content, 'downgrade-icon', 'img');
        this.upgradeText = getElementFromFragment(this._content, 'upgrade-text', 'span');
        this.upgradeButton = getElementFromFragment(this._content, 'upgrade-button', 'button');
        this.upgradeDropdownButton = getElementFromFragment(this._content, 'upgrade-dropdown-button', 'button');
        this.upgradeOptionsContainer = getElementFromFragment(this._content, 'upgrade-options-container', 'div');
        this.readContainer = getElementFromFragment(this._content, 'read-container', 'div');
        this.readButton = getElementFromFragment(this._content, 'read-button', 'button');
        this.friendContainer = getElementFromFragment(this._content, 'friend-container', 'div');
        this.findFriendButton = getElementFromFragment(this._content, 'find-friend-button', 'button');
        this.equipItemContainer = getElementFromFragment(this._content, 'equip-item-container', 'div');
        this.equipSlotImage = getElementFromFragment(this._content, 'equip-slot-image', 'img');
        this.equipSlotName = getElementFromFragment(this._content, 'equip-slot-name', 'span');
        this.equipSetButtonContainer = getElementFromFragment(this._content, 'equip-set-button-container', 'div');
        this.equipReplacementContainer = this.sizeElements[3];
        this.equipQuantitySliderContainer = getElementFromFragment(this._content, 'equip-quantity-slider-container', 'div');
        this.equipQuantitySlider = new BankRangeSlider(getElementFromFragment(this._content, 'equip-quantity-slider', 'input'));
        this.equipSlotButtonContainer = this.sizeElements[5];
        this.equipFoodContainer = getElementFromFragment(this._content, 'equip-food-container', 'div');
        this.foodQuantitySlider = new BankRangeSlider(getElementFromFragment(this._content, 'food-quantity-slider', 'input'));
        this.equipFoodButton = getElementFromFragment(this._content, 'equip-food-button', 'button');
        this.openItemContainer = getElementFromFragment(this._content, 'open-item-container', 'div');
        this.viewChestContentsButton = getElementFromFragment(this._content, 'view-chest-contents-button', 'a');
        this.openItemQuantitySlider = new BankRangeSlider(getElementFromFragment(this._content, 'open-item-quantity-slider', 'input'));
        this.openItemButton = getElementFromFragment(this._content, 'open-item-button', 'button');
        this.buryItemContainer = getElementFromFragment(this._content, 'bury-item-container', 'div');
        this.buryItemHeader = getElementFromFragment(this._content, 'bury-item-header', 'h5');
        this.buryItemPrayerPoints = getElementFromFragment(this._content, 'bury-item-prayer-points', 'h5');
        this.buryItemQuantitySlider = new BankRangeSlider(getElementFromFragment(this._content, 'bury-item-quantity-slider', 'input'));
        this.buryItemButton = getElementFromFragment(this._content, 'bury-item-button', 'button');
        this.buryItemTotalPoints = getElementFromFragment(this._content, 'bury-item-total-points', 'h5');
        this.claimTokenContainer = getElementFromFragment(this._content, 'claim-token-container', 'div');
        this.claimTokenQuantitySlider = new BankRangeSlider(getElementFromFragment(this._content, 'claim-token-quantity-slider', 'input'));
        this.claimTokenButton = getElementFromFragment(this._content, 'claim-token-button', 'button');
        this.useEightContainer = getElementFromFragment(this._content, 'use-eight-container', 'div');
        this.useEightButton = getElementFromFragment(this._content, 'use-eight-button', 'button');
        this.singleItemSalePrice = getElementFromFragment(this._content, 'single-item-sale-price', 'span');
        this.sellItemQuantitySlider = new BankRangeSlider(getElementFromFragment(this._content, 'sell-item-quantity-slider', 'input'));
        this.customSellQuantity = getElementFromFragment(this._content, 'custom-sell-quantity', 'input');
        this.sellAllButOneButton = getElementFromFragment(this._content, 'sell-all-but-one-button', 'button');
        this.sellAllButton = getElementFromFragment(this._content, 'sell-all-button', 'button');
        this.sellItemButton = getElementFromFragment(this._content, 'sell-item-button', 'button');
        this.totalSalePriceImage = getElementFromFragment(this._content, 'total-sale-price-image', 'img');
        this.totalItemSalePrice = getElementFromFragment(this._content, 'total-item-sale-price', 'span');
        // Configure static callbacks
        this.sellAllButOneButton.onclick = () => {
            this.sellAllButOneButton.classList.replace('btn-info', 'btn-success');
            this.sellAllButton.classList.replace('btn-success', 'btn-info');
            this.sellItemQuantitySlider.setSliderMode(1 /* BankRangeSliderMode.AllButOne */ );
        };
        this.sellAllButton.onclick = () => {
            this.sellAllButton.classList.replace('btn-info', 'btn-success');
            this.sellAllButOneButton.classList.replace('btn-success', 'btn-info');
            this.sellItemQuantitySlider.setSliderMode(2 /* BankRangeSliderMode.All */ );
        };
        const updateSellQuantity = () => {
            const newValue = parseInt(this.customSellQuantity.value);
            if (!Number.isNaN(newValue) && newValue > 0)
                this.sellItemQuantitySlider.setSliderPosition(newValue);
        };
        const updateSellQuantityOnBlur = () => {
            let newValue = parseInt(this.customSellQuantity.value);
            if (Number.isNaN(newValue))
                newValue = 1;
            this.sellItemQuantitySlider.setSliderPosition(newValue);
        };
        this.customSellQuantity.onkeyup = updateSellQuantity;
        this.customSellQuantity.oninput = updateSellQuantity;
        this.customSellQuantity.onchange = updateSellQuantity;
        this.customSellQuantity.onblur = updateSellQuantityOnBlur;
        this.itemConsumable = getElementFromFragment(this._content, 'item-consumable', 'h5');
    }
    connectedCallback() {
        this.appendChild(this._content);
        if (!this.hasAttribute('col-size'))
            this.setAttribute('col-size', 'default');
        this.handednessTooltip = tippy(this.handednessBadge, {
            placement: 'bottom',
            allowHTML: false,
            interactive: false,
            animation: false,
        });
    }
    disconnectedCallback() {
        if (this.handednessTooltip !== undefined) {
            this.handednessTooltip.destroy();
            this.handednessTooltip = undefined;
        }
    }
    setUnselected() {
        hideElement(this.selectedItemContainer);
        showElement(this.noneSelectedMessage);
    }
    setItem(bankItem, bank) {
        var _a, _b;
        hideElement(this.noneSelectedMessage);
        showElement(this.selectedItemContainer);
        const item = bankItem.item;
        // Item Name, description + view stats button
        this.itemName.textContent = item.name;
        this.itemDescription.innerHTML = item.modifiedDescription;
        if (item instanceof EquipmentItem) {
            this.itemDescription.innerHTML += getSummonMaxHitItemDescription(item);
            showElement(this.viewStatsButton);
            this.viewStatsButton.onclick = () => viewItemStats(item, game.combat.player.equipToSetEquipment);
            item.fitsInSlot("melvorD:Consumable" /* EquipmentSlotIDs.Consumable */ ) ?
                showElement(this.itemConsumable) :
                hideElement(this.itemConsumable);
        } else {
            hideElement(this.viewStatsButton);
            hideElement(this.itemConsumable);
        }
        // Item Image, quantity + lock block
        this.itemImage.src = item.media;
        this.quantityBadge.textContent = numberWithCommas(bankItem.quantity);
        this.setItemLocked(bankItem.locked);
        this.itemLockButton.onclick = () => bank.toggleItemLock(bankItem);
        // Sell item block
        this.singleItemSalePrice.innerHTML = `<img class="skill-icon-xxs mr-1" src="${item.sellsFor.currency.media}">${numberWithCommas(bank.getItemSalePrice(item))}`;
        this.totalSalePriceImage.src = item.sellsFor.currency.media;
        this.sellItemQuantitySlider.setOnChange((newValue, modeReset) => {
            if (modeReset) {
                this.sellAllButOneButton.classList.replace('btn-success', 'btn-info');
                this.sellAllButton.classList.replace('btn-success', 'btn-info');
            }
            this.totalItemSalePrice.textContent = item.sellsFor.currency.formatAmount(numberWithCommas(bank.getItemSalePrice(item, newValue)));
            this.customSellQuantity.value = `${newValue}`;
        });
        this.sellItemQuantitySlider.setSliderRange(bankItem);
        this.sellItemQuantitySlider.setSliderPosition(this.sellItemQuantitySlider.quantity);
        this.sellItemButton.onclick = () => {
            bank.sellItemOnClick(item, this.sellItemQuantitySlider.quantity);
        };
        this.itemWikiLink.onclick = () => openLink(`https://wiki.melvoridle.com/w/${item.wikiName}`);
        // Item specific blocks
        if (item instanceof EquipmentItem) {
            const defaultEquipSlot = item.validSlots[0];
            this.equipSlotImage.src = defaultEquipSlot.emptyMedia;
            this.equipSlotName.textContent = defaultEquipSlot.emptyName;
            if (defaultEquipSlot.allowQuantity) {
                this.equipQuantitySlider.setSliderRange(bankItem);
                this.equipQuantitySlider.setSliderPosition(bankItem.quantity);
                showElement(this.equipQuantitySliderContainer);
            } else {
                hideElement(this.equipQuantitySliderContainer);
            }
            this.createEquipToSetButtons(game.combat.player, item);
            this.updateEquipToSetHighlight(game.combat.player.equipToSet);
            this.updateEquipReplacement(item, game.combat.player);
            this.createEquipItemButtons(item, game.combat.player);
            showElement(this.equipItemContainer);
            if (item.specialAttacks.length > 0) {
                this.specialAttackList.innerHTML = item.specialAttacks
                    .map((attack, id) => {
                        let chance = attack.defaultChance;
                        if (item.overrideSpecialChances !== undefined)
                            chance = item.overrideSpecialChances[id];
                        return `<h5 class="font-w400 font-size-sm text-left text-combat-smoke m-1 mb-2"><strong class="text-bank-desc">${attack.name} (${formatPercent(chance)}) </strong><span>${attack.modifiedDescription}</span></h5>`;
                    })
                    .join('');
                showElement(this.specialAttackContainer);
            } else {
                hideElement(this.specialAttackContainer);
            }
        } else {
            hideElement(this.equipItemContainer);
            hideElement(this.specialAttackContainer);
        }
        // Weapon specific rendering
        if (item instanceof WeaponItem) {
            showElement(this.handednessBadge);
            if (item.occupiesSlot("melvorD:Shield" /* EquipmentSlotIDs.Shield */ )) {
                this.handednessBadge.textContent = getLangString('BANK_STRING_2H');
                (_a = this.handednessTooltip) === null || _a === void 0 ? void 0 : _a.setContent(getLangString('MENU_TEXT_TWO_HANDED_WEAPON'));
            } else {
                this.handednessBadge.textContent = getLangString('BANK_STRING_1H');
                (_b = this.handednessTooltip) === null || _b === void 0 ? void 0 : _b.setContent(getLangString('MENU_TEXT_ONE_HANDED_WEAPON'));
            }
        } else {
            hideElement(this.handednessBadge);
        }
        const upgrades = bank.itemUpgrades.get(item);
        if (upgrades !== undefined) {
            if (upgrades.length > 1) {
                hideElement(this.upgradeButton);
                showElement(this.upgradeDropdownButton);
                this.upgradeOptionsContainer.textContent = '';
                upgrades.forEach((upgrade) => {
                    const newOption = createElement('a', {
                        className: 'dropdown-item'
                    });
                    newOption.append(createElement('img', {
                        className: 'skill-icon-xs mr-2',
                        attributes: [
                            ['src', upgrade.upgradedItem.media]
                        ],
                    }), upgrade.upgradedItem.name);
                    newOption.onclick = () => bank.fireItemUpgradeModal(upgrade, item);
                    this.upgradeOptionsContainer.append(newOption);
                });
            } else {
                if (upgrades[0].isDowngrade) {
                    this.downgradeIcon.classList.remove('d-none');
                    this.upgradeIcon.classList.add('d-none');
                } else {
                    this.downgradeIcon.classList.add('d-none');
                    this.upgradeIcon.classList.remove('d-none');
                }
                const text = upgrades[0].isDowngrade ? getLangString('MENU_TEXT_DOWNGRADE') : getLangString('BANK_STRING_32');
                this.upgradeText.textContent = text;
                this.upgradeButton.textContent = text;
                hideElement(this.upgradeDropdownButton);
                showElement(this.upgradeButton);
                this.upgradeButton.onclick = () => bank.fireItemUpgradeModal(upgrades[0], item);
            }
            showElement(this.upgradeContainer);
        } else {
            hideElement(this.upgradeContainer);
        }
        if (item instanceof ReadableItem) {
            this.readButton.onclick = () => bank.readItemOnClick(item);
            showElement(this.readContainer);
        } else {
            hideElement(this.readContainer);
        }
        if (item.id === "melvorD:Christmas_Cracker" /* ItemIDs.Christmas_Cracker */ ) {
            this.findFriendButton.onclick = () => bank.findAFriendOnClick(item);
            showElement(this.friendContainer);
        } else {
            hideElement(this.friendContainer);
        }
        if (item instanceof FoodItem) {
            showElement(this.itemHealing);
            this.itemHealing.innerHTML = templateLangString('BANK_STRING_26', {
                hpImage: `<img class="skill-icon-xs mr-1" src="${assets.getURI("assets/media/skills/hitpoints/hitpoints.png" /* Assets.Hitpoints */)}">`,
                hpValue: `<span class="text-bank-desc">${numberWithCommas(game.combat.player.getFoodHealing(item))}</span>`,
            });
            this.equipFoodButton.onclick = () => {
                game.combat.player.equipFood(item, this.foodQuantitySlider.quantity);
            };
            this.foodQuantitySlider.setSliderRange(bankItem);
            this.foodQuantitySlider.setSliderPosition(bankItem.quantity);
            showElement(this.equipFoodContainer);
        } else {
            hideElement(this.itemHealing);
            hideElement(this.equipFoodContainer);
        }
        if (item instanceof OpenableItem) {
            if (item.keyItem !== undefined && bank.getQty(item.keyItem.item) < item.keyItem.quantity) {
                this.openItemButton.disabled = true;
            } else {
                this.openItemButton.disabled = false;
            }
            this.openItemButton.onclick = () => {
                bank.openItemOnClick(item, this.openItemQuantitySlider.quantity);
            };
            this.viewChestContentsButton.onclick = () => viewItemContents(item);
            this.openItemQuantitySlider.setSliderRange(bankItem);
            this.openItemQuantitySlider.setSliderPosition(bankItem.quantity);
            showElement(this.openItemContainer);
        } else {
            hideElement(this.openItemContainer);
        }
        if (item instanceof BoneItem || item instanceof SoulItem) {
            const isBone = item instanceof BoneItem;
            if (item instanceof BoneItem) {
                this.buryItemHeader.textContent = this.buryItemButton.textContent = getLangString('MENU_TEXT_BURY_ITEM');
                const pointsPerBone = bank.getPrayerPointsPerBone(item);
                this.buryItemPrayerPoints.textContent = templateLangString('MENU_TEXT_GRANTS_PRAYER_POINTS', {
                    num: `${pointsPerBone}`,
                });
                this.buryItemButton.onclick = () => {
                    bank.buryItemOnClick(item, this.buryItemQuantitySlider.quantity);
                };
                this.buryItemQuantitySlider.setOnChange((newValue) => {
                    this.buryItemTotalPoints.textContent = templateLangString('COMBAT_MISC_PRAYER_POINTS', {
                        num: numberWithCommas(pointsPerBone * newValue),
                    });
                });
            } else {
                this.buryItemHeader.textContent = this.buryItemButton.textContent = getLangString('RELEASE_SOUL');
                const pointsPerSoul = bank.getSoulPointsPerSoul(item);
                this.buryItemPrayerPoints.textContent = templateLangString('GRANTS_SOUL_POINTS', {
                    num: `${pointsPerSoul}`,
                });
                this.buryItemButton.onclick = () => {
                    bank.releaseSoulItemOnClick(item, this.buryItemQuantitySlider.quantity);
                };
                this.buryItemQuantitySlider.setOnChange((newValue) => {
                    this.buryItemTotalPoints.textContent = templateLangString('SOUL_POINTS_AMOUNT', {
                        num: numberWithCommas(pointsPerSoul * newValue),
                    });
                });
            }
            this.buryItemQuantitySlider.setSliderRange(bankItem);
            this.buryItemQuantitySlider.setSliderPosition(bankItem.quantity);
            showElement(this.buryItemContainer);
        } else {
            hideElement(this.buryItemContainer);
        }
        if (item instanceof TokenItem) {
            this.claimTokenButton.onclick = () => {
                bank.claimItemOnClick(item, this.claimTokenQuantitySlider.quantity);
            };
            this.claimTokenQuantitySlider.setSliderRange(bankItem);
            this.claimTokenQuantitySlider.setSliderPosition(bankItem.quantity);
            showElement(this.claimTokenContainer);
        } else if (item instanceof MasteryTokenItem) {
            this.claimTokenButton.onclick = () => {
                bank.claimMasteryTokenOnClick(item, this.claimTokenQuantitySlider.quantity);
            };
            this.claimTokenQuantitySlider.setSliderRange(bankItem);
            this.claimTokenQuantitySlider.setSliderPosition(bankItem.quantity);
            showElement(this.claimTokenContainer);
        } else {
            hideElement(this.claimTokenContainer);
        }
        if (item.id === "melvorD:Eight" /* ItemIDs.Eight */ ) {
            this.useEightButton.onclick = () => bank.useEightOnClick(item);
            showElement(this.useEightContainer);
        } else {
            hideElement(this.useEightContainer);
        }
    }
    createEquipToSetButtons(player, item) {
        while (this.equipToSetButtons.length < player.numEquipSets) {
            const button = createElement('button', {
                className: 'btn btn-sm btn-outline-primary',
                attributes: [
                    ['role', 'button']
                ],
                text: `${this.equipToSetButtons.length + 1}`,
            });
            this.equipToSetButtons.push(button);
            this.equipSetButtonContainer.append(button);
        }
        this.equipToSetButtons.forEach((button, setID) => {
            if (setID >= player.numEquipSets) {
                hideElement(button);
            } else {
                showElement(button);
            }
            button.onclick = () => {
                player.changeEquipToSet(setID);
                this.updateEquipToSetHighlight(setID);
                //this.updateEquipReplacement(item, player);
                this.createEquipItemButtons(item, player);
            };
        });
    }
    updateEquipToSetHighlight(setID) {
        this.equipToSetButtons.forEach((button, i) => {
            if (i === setID) {
                button.classList.replace('btn-outline-primary', 'btn-success');
            } else {
                button.classList.replace('btn-success', 'btn-outline-primary');
            }
        });
    }
    createReplaceItemHTML(slot, item, player) {
        const replacedItems = player.equipmentSets[player.equipToSet].equipment.getItemsAddedOnEquip(item, slot);
        const addReplaceHeaderHTML = (slot) => `
            <h5 class="bg-combat-menu-selected rounded p-1 text-center font-size-sm mb-1 mb-1">
              <span class="font-w400 mr-2">${getLangString('EQUIP_TO')}</span><img class="skill-icon-xxs mr-2" src="${slot.emptyMedia}">${slot.emptyName}
            </h5>`;
        const addReplaceHTML = (src, name, slot, includeHeader) => `
            ${includeHeader ? addReplaceHeaderHTML(slot) : ''}
            <div class="media d-flex align-items-center push">
        <div class="mr-1">
          <img class="skill-icon-sm" src="${src}"></div>
          <div class="media-body text-left">
            <h5 class="font-w400 font-size-xs text-combat-smoke mb-0"><lang-string lang-id="BANK_STRING_29"></lang-string></h5>
            <div class="font-w600 font-size-sm text-bank-desc">${name}</div>
          </div>
        </div>`;
        let replaceHTML = '';
        if (replacedItems.length > 0) {
            replacedItems.forEach(({
                item,
                quantity
            }, id) => {
                let replaceName = item.name;
                if (quantity > 1)
                    replaceName += ` (${numberWithCommas(quantity)})`;
                replaceHTML += addReplaceHTML(item.media, replaceName, slot, id === 0);
            });
        } else if (player.isEquipmentSlotUnlocked(slot)) {
            replaceHTML += addReplaceHTML(slot.emptyMedia, `${getLangString('GOLBIN_RAID_POPUP_9')}`, slot, true);
        }
        return replaceHTML;
    }
    createEquipItemButtons(item, player) {
        this.equipSlotButtonContainer.textContent = '';
        item.validSlots.forEach((slot) => {
            if (player.isEquipmentSlotUnlocked(slot)) {
                const equipButton = createElement('button', {
                    className: 'btn btn-sm btn-outline-secondary m-1 w-100',
                });
                equipButton.innerHTML = this.createReplaceItemHTML(slot, item, player);
                equipButton.onclick = () => {
                    player.equipCallback(item, slot, this.equipQuantitySlider.quantity);
                };
                this.equipSlotButtonContainer.append(equipButton);
            }
        });
    }
    updateItemQuantity(bankItem) {
        const item = bankItem.item;
        this.sellItemQuantitySlider.setSliderRange(bankItem);
        this.quantityBadge.textContent = numberWithCommas(bankItem.quantity);
        if (item instanceof EquipmentItem) {
            this.equipQuantitySlider.setSliderRange(bankItem);
        } else if (item instanceof FoodItem) {
            this.foodQuantitySlider.setSliderRange(bankItem);
        } else if (item instanceof OpenableItem) {
            this.openItemQuantitySlider.setSliderRange(bankItem);
        } else if (item instanceof BoneItem || item instanceof SoulItem) {
            this.buryItemQuantitySlider.setSliderRange(bankItem);
        } else if (item instanceof TokenItem) {
            this.claimTokenQuantitySlider.setSliderRange(bankItem);
        }
    }
    /** Performs the necessary updates to the equip item display when player equipment changes */
    updateEquipReplacement(item, player) {
        //this.equipReplacementContainer.innerHTML = this.createReplaceItemHTML(item, player);
        this.createEquipItemButtons(item, player);
    }
    setItemLocked(isLocked) {
        this.sellItemButton.disabled = isLocked;
        this.buryItemButton.disabled = isLocked;
        if (isLocked) {
            this.itemLockIcon.className = 'fa fa-lock text-danger';
        } else {
            this.itemLockIcon.className = 'fa fa-unlock text-success';
        }
    }
    getColClasses(attributeValue) {
        if (attributeValue === null || !(attributeValue in BankSelectedItemMenuElement.colSizeClasses)) {
            return BankSelectedItemMenuElement.colSizeClasses['default'];
        } else {
            return BankSelectedItemMenuElement.colSizeClasses[attributeValue];
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        const oldClasses = this.getColClasses(oldValue);
        const newClasses = this.getColClasses(newValue);
        if (oldClasses !== newClasses) {
            this.sizeElements.forEach((elem, i) => {
                elem.classList.remove(...oldClasses[i]);
                elem.classList.add(...newClasses[i]);
            });
        }
    }
    static get observedAttributes() {
        return ['col-size'];
    }
}
/** Classes for specifying the menus column sizes */
BankSelectedItemMenuElement.colSizeClasses = {
    small: [
        ['block-header', 'block-header-default', 'bg-dark-bank-block-header', 'px-3', 'py-1'],
        ['block-options'],
        ['col-12', 'col-sm-6'],
        ['col-12', 'col-sm-6'],
        ['col-12'],
        ['col-12'],
        ['col-12', 'col-sm-4'],
        ['col-md-8'],
        ['col-md-4'],
        ['col-md-8'],
        ['col-md-4'],
        ['col-md-8'],
        ['col-md-4'],
        ['col-md-8'],
        ['col-md-4'],
        ['col-md-3'],
        ['col-md-5'],
    ],
    default: [
        ['block-header', 'block-header-default', 'bg-dark-bank-block-header', 'px-3', 'py-1'],
        ['block-options'],
        ['col-6'],
        ['col-6'],
        ['col-12'],
        ['col-12'],
        ['col-xl-8'],
        ['col-xl-4'],
        ['col-xl-8'],
        ['col-xl-4'],
        ['col-xl-8'],
        ['col-xl-4'],
        ['col-xl-8'],
        ['col-xl-4'],
        ['col-xl-3'],
        ['col-xl-5'],
    ],
};
window.customElements.define('bank-selected-item-menu', BankSelectedItemMenuElement);
/** Component for displaying bank item stats */
class BankItemStatsMenuElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('bank-item-stats-menu-template'));
        this.selectedItemContainer = getElementFromFragment(this._content, 'selected-item-container', 'div');
        this.itemImage = getElementFromFragment(this._content, 'item-image', 'img');
        this.itemLockButton = getElementFromFragment(this._content, 'item-lock-button', 'button');
        this.itemLockIcon = getElementFromFragment(this._content, 'item-lock-icon', 'i');
        this.quantityBadge = getElementFromFragment(this._content, 'quantity-badge', 'small');
        this.itemName = getElementFromFragment(this._content, 'item-name', 'h5');
        this.itemDescription = getElementFromFragment(this._content, 'item-description', 'h5');
        this.itemHealing = getElementFromFragment(this._content, 'item-healing', 'h5');
        this.viewStatsButton = getElementFromFragment(this._content, 'view-stats-button', 'h5');
        this.statsContainer = getElementFromFragment(this._content, 'stats-container', 'div');
        this.itemConsumable = getElementFromFragment(this._content, 'item-consumable', 'h5');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setUnselected() {
        hideElement(this.selectedItemContainer);
    }
    setItem(bankItem, game) {
        showElement(this.selectedItemContainer);
        const item = bankItem.item;
        // Item Name, description + view stats button
        this.itemName.textContent = item.name;
        this.itemDescription.innerHTML = item.modifiedDescription;
        if (item instanceof EquipmentItem) {
            this.itemDescription.innerHTML += getSummonMaxHitItemDescription(item);
            showElement(this.viewStatsButton);
            this.viewStatsButton.onclick = () => viewItemStats(item);
            item.fitsInSlot("melvorD:Consumable" /* EquipmentSlotIDs.Consumable */ ) ?
                showElement(this.itemConsumable) :
                hideElement(this.itemConsumable);
        } else {
            hideElement(this.viewStatsButton);
            hideElement(this.itemConsumable);
        }
        // Item Image, quantity + lock block
        this.itemImage.src = item.media;
        this.quantityBadge.textContent = numberWithCommas(bankItem.quantity);
        this.setItemLocked(bankItem.locked);
        this.itemLockButton.onclick = () => game.bank.toggleItemLock(bankItem);
        // Item Healing
        if (item instanceof FoodItem) {
            showElement(this.itemHealing);
            this.itemHealing.innerHTML = templateLangString('BANK_STRING_26', {
                hpImage: `<img class="skill-icon-xs mr-1" src="${assets.getURI("assets/media/skills/hitpoints/hitpoints.png" /* Assets.Hitpoints */)}">`,
                hpValue: `<span class="text-bank-desc">${numberWithCommas(game.combat.player.getFoodHealing(item))}</span>`,
            });
        } else {
            hideElement(this.itemHealing);
        }
        // Populate the stats container
        this.statsContainer.textContent = '';
        const preStat = "<h5 class='font-w400 font-size-sm text-combat-smoke m-1 mb-2'><strong>";
        const postStat = '</h5>';
        this.statsContainer.innerHTML = getItemStatDescriptions(item, ' </strong>', preStat, postStat);
    }
    updateItemQuantity(bankItem) {
        this.quantityBadge.textContent = numberWithCommas(bankItem.quantity);
    }
    setItemLocked(isLocked) {
        if (isLocked) {
            this.itemLockIcon.className = 'fa fa-lock text-danger';
        } else {
            this.itemLockIcon.className = 'fa fa-unlock text-success';
        }
    }
}
window.customElements.define('bank-item-stats-menu', BankItemStatsMenuElement);
class BankMinibarToggleElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('bank-minibar-toggle-template'));
        this.skillToggle = getElementFromFragment(this._content, 'skill-toggle', 'input');
        this.skillLabel = getElementFromFragment(this._content, 'skill-label', 'label');
        this.skillImage = getElementFromFragment(this._content, 'skill-image', 'img');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setSkill(skill) {
        const id = `minibar-item-toggle-${skill.id}`;
        this.skillToggle.id = id;
        this.skillLabel.htmlFor = id;
        this.skillImage.src = skill.media;
    }
    setItem(item, skill, game) {
        this.skillToggle.checked = game.minibar.isCustomItemSet(skill, item);
        this.skillToggle.onchange = () => {
            this.skillToggle.checked = game.minibar.toggleCustomItem(skill, item);
        };
    }
}
window.customElements.define('bank-minibar-toggle', BankMinibarToggleElement);
/** Component for displaying bank item settings */
class BankItemSettingsMenuElement extends HTMLElement {
    constructor() {
        super();
        this.minibarToggles = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('bank-item-settings-menu-template'));
        this.selectedItemContainer = getElementFromFragment(this._content, 'selected-item-container', 'div');
        this.selectTabIconDropdown = getElementFromFragment(this._content, 'select-tab-icon-dropdown', 'bank-tab-dropdown-menu');
        this.resetTabIcon = getElementFromFragment(this._content, 'reset-tab-icon', 'a');
        this.minibarSettingsContainer = getElementFromFragment(this._content, 'minibar-settings-container', 'div');
        this.minibarSettingsToggles = getElementFromFragment(this._content, 'minibar-settings-toggles', 'div');
        this.unlockAllButton = getElementFromFragment(this._content, 'unlock-all-button', 'button');
        this.lockAllButton = getElementFromFragment(this._content, 'lock-all-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    initialize(game) {
        game.skills.forEach((skill) => {
            if (!skill.hasMinibar)
                return;
            const toggle = createElement('bank-minibar-toggle', {
                className: 'col-4',
                parent: this.minibarSettingsToggles
            });
            toggle.setSkill(skill);
            this.minibarToggles.set(skill, toggle);
        });
        this.selectTabIconDropdown.initialize(game.bank, (tabID) => game.bank.setSelectedItemAsTabIcon(tabID));
        this.resetTabIcon.onclick = () => game.bank.resetTabIcon(game.bank.selectedBankTab);
        this.unlockAllButton.onclick = () => game.bank.setLockOfAllItemsOnClick(false);
        this.lockAllButton.onclick = () => game.bank.setLockOfAllItemsOnClick(true);
    }
    setItem(bankItem, game) {
        showElement(this.selectedItemContainer);
        const item = bankItem.item;
        if (item instanceof EquipmentItem) {
            showElement(this.minibarSettingsContainer);
            this.minibarToggles.forEach((toggle, skill) => {
                toggle.setItem(item, skill, game);
            });
        } else {
            hideElement(this.minibarSettingsContainer);
        }
    }
    setUnselected() {
        hideElement(this.selectedItemContainer);
    }
}
window.customElements.define('bank-item-settings-menu', BankItemSettingsMenuElement);
/** Component to manage the three selected item menus in a tab-pane fashion */
class BankSidebarMenuElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('bank-sidebar-menu-template'));
        this.itemImage = getElementFromFragment(this._content, 'item-image', 'img');
        this.selectedMenu = getElementFromFragment(this._content, 'selected-menu', 'bank-selected-item-menu');
        this.statsMenu = getElementFromFragment(this._content, 'stats-menu', 'bank-item-stats-menu');
        this.settingsMenu = getElementFromFragment(this._content, 'settings-menu', 'bank-item-settings-menu');
        this.sidebarCloseButton = getElementFromFragment(this._content, 'sidebar-close-button', 'button');
        this.paneContainer = getElementFromFragment(this._content, 'pane-container', 'div');
        this.sidebarCloseButton.onclick = closeBankSidebar;
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    toggleSidebarMode(isSidebar) {
        if (isSidebar) {
            showElement(this.sidebarCloseButton);
            this.selectedMenu.setAttribute('col-size', 'small');
            this.paneContainer.classList.add('overflow-hidden');
            this.paneContainer.style.paddingBottom = '100px';
        } else {
            hideElement(this.sidebarCloseButton);
            this.selectedMenu.setAttribute('col-size', 'default');
            this.paneContainer.classList.remove('overflow-hidden');
            this.paneContainer.style.paddingBottom = '';
        }
    }
    updateItemQuantity(bankItem) {
        this.selectedMenu.updateItemQuantity(bankItem);
        this.statsMenu.updateItemQuantity(bankItem);
    }
    updateEquipItem(item, game) {
        this.selectedMenu.updateEquipReplacement(item, game.combat.player);
    }
    setItemLocked(isLocked) {
        this.selectedMenu.setItemLocked(isLocked);
        this.statsMenu.setItemLocked(isLocked);
    }
    setItem(bankItem, game) {
        this.itemImage.src = bankItem.item.media;
        this.selectedMenu.setItem(bankItem, game.bank);
        this.statsMenu.setItem(bankItem, game);
        this.settingsMenu.setItem(bankItem, game);
    }
    setUnselected() {
        this.itemImage.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        this.selectedMenu.setUnselected();
        this.statsMenu.setUnselected();
        this.settingsMenu.setUnselected();
    }
    initialize(game) {
        this.settingsMenu.initialize(game);
    }
}
window.customElements.define('bank-sidebar-menu', BankSidebarMenuElement);
class SummoningMaxHitElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('summoning-max-hit-template'));
        this.damageTypeMedia = getElementFromFragment(this._content, 'damage-type-media', 'img');
        this.damageTypeName = getElementFromFragment(this._content, 'damage-type-name', 'span');
        this.maxHit = getElementFromFragment(this._content, 'max-hit', 'span');
        this.maxHitDiff = getElementFromFragment(this._content, 'max-hit-diff', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.classList.add('row');
    }
    setDamageType(damageType) {
        this.damageTypeMedia.src = damageType.media;
        this.damageTypeName.textContent = damageType.name;
        this.damageTypeName.className = damageType.spanClass;
    }
    setValue(value) {
        this.maxHit.textContent = `${value}`;
    }
    hideDiff() {
        hideElement(this.maxHitDiff);
    }
    setDiff(diff) {
        this.maxHitDiff.textContent = `${diff > 0 ? '+' : ''}${diff}`;
        toggleDangerSuccess(this.maxHitDiff, diff > 0);
        showElement(this.maxHitDiff);
    }
}
window.customElements.define('summoning-max-hit', SummoningMaxHitElement);
class ItemUpgradeMenuElement extends HTMLElement {
    constructor() {
        super();
        this.currencyTooltips = [];
        this.itemTooltips = [];
        this.resistances = new Map();
        this.summoningMaxHits = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('item-upgrade-menu-template'));
        this.itemName = getElementFromFragment(this._content, 'item-name', 'h5');
        this.itemImage = getElementFromFragment(this._content, 'item-image', 'img');
        this.itemDescription = getElementFromFragment(this._content, 'item-description', 'span');
        this.specialAttackContainer = getElementFromFragment(this._content, 'special-attack-container', 'div');
        this.specialAttackList = getElementFromFragment(this._content, 'special-attack-list', 'div');
        this.equipRequirements = getElementFromFragment(this._content, 'equip-requirements', 'div');
        this.noStatsMessage = getElementFromFragment(this._content, 'no-stats-message', 'div');
        this.equipmentStatsContainer = getElementFromFragment(this._content, 'equipment-stats-container', 'div');
        this.attackSpeedContainer = getElementFromFragment(this._content, 'attack-speed-container', 'div');
        this.summoningMaxHitContainer = getElementFromFragment(this._content, 'summoning-max-hit-container', 'div');
        this.equipStats = {
            attackSpeed: getElementFromFragment(this._content, 'attack-speed', 'span'),
            stabAttackBonus: getElementFromFragment(this._content, 'stab-attack-bonus', 'span'),
            slashAttackBonus: getElementFromFragment(this._content, 'slash-attack-bonus', 'span'),
            blockAttackBonus: getElementFromFragment(this._content, 'block-attack-bonus', 'span'),
            rangedAttackBonus: getElementFromFragment(this._content, 'ranged-attack-bonus', 'span'),
            magicAttackBonus: getElementFromFragment(this._content, 'magic-attack-bonus', 'span'),
            meleeStrengthBonus: getElementFromFragment(this._content, 'melee-strength-bonus', 'span'),
            rangedStrengthBonus: getElementFromFragment(this._content, 'ranged-strength-bonus', 'span'),
            magicDamageBonus: getElementFromFragment(this._content, 'magic-damage-bonus', 'span'),
            meleeDefenceBonus: getElementFromFragment(this._content, 'melee-defence-bonus', 'span'),
            rangedDefenceBonus: getElementFromFragment(this._content, 'ranged-defence-bonus', 'span'),
            magicDefenceBonus: getElementFromFragment(this._content, 'magic-defence-bonus', 'span'),
        };
        this.equipStatDiffs = {
            attackSpeed: getElementFromFragment(this._content, 'attack-speed-diff', 'span'),
            stabAttackBonus: getElementFromFragment(this._content, 'stab-attack-bonus-diff', 'span'),
            slashAttackBonus: getElementFromFragment(this._content, 'slash-attack-bonus-diff', 'span'),
            blockAttackBonus: getElementFromFragment(this._content, 'block-attack-bonus-diff', 'span'),
            rangedAttackBonus: getElementFromFragment(this._content, 'ranged-attack-bonus-diff', 'span'),
            magicAttackBonus: getElementFromFragment(this._content, 'magic-attack-bonus-diff', 'span'),
            meleeStrengthBonus: getElementFromFragment(this._content, 'melee-strength-bonus-diff', 'span'),
            rangedStrengthBonus: getElementFromFragment(this._content, 'ranged-strength-bonus-diff', 'span'),
            magicDamageBonus: getElementFromFragment(this._content, 'magic-damage-bonus-diff', 'span'),
            meleeDefenceBonus: getElementFromFragment(this._content, 'melee-defence-bonus-diff', 'span'),
            rangedDefenceBonus: getElementFromFragment(this._content, 'ranged-defence-bonus-diff', 'span'),
            magicDefenceBonus: getElementFromFragment(this._content, 'magic-defence-bonus-diff', 'span'),
        };
        this.resistancesContainer = getElementFromFragment(this._content, 'resistances-container', 'div');
        this.upgradeMasteryRequirement = getElementFromFragment(this._content, 'upgrade-mastery-requirement', 'span');
        this.upgradeMasteryLevel = getElementFromFragment(this._content, 'upgrade-mastery-level', 'span');
        this.currencyCosts = getElementFromFragment(this._content, 'currency-costs', 'span');
        this.itemCosts = getElementFromFragment(this._content, 'item-costs', 'span');
        this.upgradeButtons = [{
                button: getElementFromFragment(this._content, 'upgrade-1-button', 'button'),
                quantity: 1,
            },
            {
                button: getElementFromFragment(this._content, 'upgrade-10-button', 'button'),
                quantity: 10,
            },
            {
                button: getElementFromFragment(this._content, 'upgrade-100-button', 'button'),
                quantity: 100,
            },
            {
                button: getElementFromFragment(this._content, 'upgrade-1000-button', 'button'),
                quantity: 1000,
            },
            {
                button: getElementFromFragment(this._content, 'upgrade-all-button', 'button'),
                quantity: Infinity,
            },
        ];
        this.itemConsumable = getElementFromFragment(this._content, 'item-consumable', 'h5');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    initResistances(game) {
        game.damageTypes.forEach((damageType) => {
            const el = new CharacterResistanceElement(damageType);
            el.replaceResistanceDivClass('text-right', 'text-left');
            this.resistances.set(damageType, el);
            this.resistancesContainer.append(el);
            const summoningMaxHit = createElement('summoning-max-hit', {
                parent: this.summoningMaxHitContainer
            });
            summoningMaxHit.setDamageType(damageType);
            this.summoningMaxHits.set(damageType, summoningMaxHit);
        });
    }
    setUpgrade(upgrade, rootItem, bank, game) {
        $('#view-upgrade-btn').attr('class', 'btn btn-success d-none');
        const upgradedItem = upgrade.upgradedItem;
        if (upgrade.upgradedQuantity > 1) {
            this.itemName.textContent = `${numberWithCommas(upgrade.upgradedQuantity)} x ${upgradedItem.name}`;
        } else {
            this.itemName.textContent = upgradedItem.name;
        }
        this.itemImage.src = upgradedItem.media;
        this.setEquipmentStats(upgradedItem, rootItem);
        this.setSpecialAttacks(upgradedItem);
        this.setEquipRequirements(upgradedItem);
        this.setUpgradeMasteryRequirement(upgrade, bank);
        if (upgradedItem.hasDescription)
            this.itemDescription.innerHTML = upgradedItem.modifiedDescription;
        else
            this.itemDescription.textContent = '';
        this.setUpgradeCosts(upgrade, bank, game);
        this.setUpgradeButtons(upgrade, bank);
    }
    /** Sets the equipment stats of the upgraded item, and a comparison of them to the root item */
    setEquipmentStats(upgradedItem, rootItem) {
        if (upgradedItem instanceof EquipmentItem) {
            const statComparison = new EquipmentStats();
            statComparison.addStats(upgradedItem.equipmentStats);
            // Set Upgraded item stats
            if (upgradedItem instanceof WeaponItem) {
                showElement(this.attackSpeedContainer);
            } else {
                hideElement(this.attackSpeedContainer);
            }
            if (statComparison.summoningMaxHit.size !== 0) {
                showElement(this.summoningMaxHitContainer);
            } else {
                hideElement(this.summoningMaxHitContainer);
            }
            equipStatKeys.forEach((key) => {
                const statValue = statComparison[key];
                let diffText;
                switch (key) {
                    case 'attackSpeed':
                        diffText = templateLangString('MENU_TEXT_SECONDS_SHORT', {
                            seconds: formatFixed(statValue / 1000, 2),
                        });
                        break;
                    default:
                        diffText = numberWithCommas(statValue);
                        break;
                }
                this.equipStats[key].textContent = diffText;
            });
            this.resistances.forEach((resistanceElement, damageType) => {
                const comparisonValue = statComparison.getResistance(damageType);
                resistanceElement.updateResistanceValue(comparisonValue);
                if (damageType.onlyShowIfUsing) {
                    const rootHasDamageType = rootItem instanceof EquipmentItem &&
                        rootItem.equipmentStats.some((stat) => stat.key === 'resistance' && stat.damageType === damageType);
                    const shouldShow = comparisonValue !== 0 || rootHasDamageType || game.combat.isDamageTypeInUse(damageType);
                    resistanceElement.toggleResistanceView(shouldShow);
                }
            });
            this.summoningMaxHits.forEach((maxHitElem, damageType) => {
                const comparisonValue = statComparison.getSummoningMaxHit(damageType);
                maxHitElem.setValue(comparisonValue);
                const rootHasDamageType = rootItem instanceof EquipmentItem &&
                    rootItem.equipmentStats.some((stat) => stat.key === 'summoningMaxhit' && stat.damageType === damageType);
                if (comparisonValue !== 0 || rootHasDamageType)
                    showElement(maxHitElem);
                else
                    hideElement(maxHitElem);
            });
            // Set stat differences
            if (rootItem instanceof EquipmentItem) {
                statComparison.subtractStats(rootItem.equipmentStats);
            }
            equipStatKeys.forEach((key) => {
                const diffElem = this.equipStatDiffs[key];
                const diff = statComparison[key];
                let diffText = '';
                let isPositive = diff > 0;
                if (diff !== 0) {
                    switch (key) {
                        case 'attackSpeed':
                            isPositive = diff < 0;
                            diffText = templateLangString('MENU_TEXT_SECONDS_SHORT', {
                                seconds: formatFixed(diff / 1000, 2),
                            });
                            break;
                        default:
                            diffText = numberWithCommas(diff);
                            break;
                    }
                    if (diff > 0)
                        diffText = `+${diffText}`;
                }
                diffElem.textContent = diffText;
                toggleDangerSuccess(diffElem, isPositive);
            });
            this.resistances.forEach((resistanceElement, damageType) => {
                const resist = statComparison.getResistance(damageType);
                resist !== 0 ? resistanceElement.showResistanceDiff() : resistanceElement.hideResistanceDiff();
                resistanceElement.updateResistanceDiff(resist);
            });
            this.summoningMaxHits.forEach((maxHitElem, damageType) => {
                const maxHit = statComparison.getSummoningMaxHit(damageType);
                if (maxHit !== 0) {
                    maxHitElem.setDiff(maxHit);
                } else {
                    maxHitElem.hideDiff();
                }
            });
            showElement(this.equipmentStatsContainer);
            hideElement(this.noStatsMessage);
            upgradedItem.fitsInSlot("melvorD:Consumable" /* EquipmentSlotIDs.Consumable */ ) ?
                showElement(this.itemConsumable) :
                hideElement(this.itemConsumable);
        } else {
            hideElement(this.equipmentStatsContainer);
            showElement(this.noStatsMessage);
        }
    }
    /** Sets special attacks the upgraded item has */
    setSpecialAttacks(item) {
        if (item instanceof EquipmentItem && item.specialAttacks.length > 0) {
            const attackHTML = item.specialAttacks
                .map((attack, id) => {
                    let chance = attack.defaultChance;
                    if (item.overrideSpecialChances !== undefined)
                        chance = item.overrideSpecialChances[id];
                    return `<h5 class="font-w400 font-size-sm text-left text-combat-smoke m-1 mb-2"><strong class="text-bank-desc">${attack.name} (${formatPercent(chance)}) </strong><span>${attack.modifiedDescription}</span></h5>`;
                })
                .join('');
            this.specialAttackList.innerHTML = attackHTML;
            showElement(this.specialAttackContainer);
        } else {
            this.specialAttackList.textContent = '';
            hideElement(this.specialAttackContainer);
        }
    }
    /** Sets requirements to equip the upgraded item */
    setEquipRequirements(item) {
        this.equipRequirements.textContent = '';
        if (item instanceof EquipmentItem) {
            item.equipRequirements.forEach((req) => {
                const reqSpan = createElement('span', {
                    className: 'font-size-sm'
                });
                reqSpan.append(...req.getNodes('skill-icon-xs mr-2'));
                toggleDangerSuccess(reqSpan, req.isMet());
                this.equipRequirements.append(reqSpan, createElement('br'));
            });
            showElement(this.equipRequirements);
        } else {
            hideElement(this.equipRequirements);
        }
    }
    /** Sets the mastery requirement when upgrading potions */
    setUpgradeMasteryRequirement(upgrade, bank) {
        const potionRequirementMet = bank.checkUpgradePotionRequirement(upgrade);
        if (upgrade.upgradedItem instanceof PotionItem) {
            this.upgradeMasteryLevel.textContent = `${Herblore.tierMasteryLevels[upgrade.upgradedItem.tier]}`;
            toggleDangerSuccess(this.upgradeMasteryLevel, potionRequirementMet);
            showElement(this.upgradeMasteryRequirement);
        } else {
            hideElement(this.upgradeMasteryRequirement);
        }
    }
    setUpgradeCosts(upgrade, bank, game) {
        // Display Currency Costs
        this.currencyCosts.textContent = '';
        this.currencyTooltips.forEach((tt) => tt.destroy());
        this.currencyTooltips = [];
        upgrade.currencyCosts.forEach(({
            currency,
            quantity
        }) => {
            const image = createElement('img', {
                className: 'skill-icon-sm mr-1',
                attributes: [
                    ['src', currency.media]
                ]
            });
            const tooltip = tippy(image, {
                content: currency.name,
                placement: 'bottom',
                interactive: false,
                animateFill: false,
            });
            this.currencyTooltips.push(tooltip);
            this.currencyCosts.append(image, createElement('span', {
                className: currency.canAfford(quantity) ? 'text-success' : 'text-danger',
                text: formatNumber(quantity),
            }));
        });
        // Display Item Costs
        this.itemCosts.textContent = '';
        this.itemTooltips.forEach((tt) => tt.destroy());
        this.itemTooltips = [];
        upgrade.itemCosts.forEach(({
            item,
            quantity
        }) => {
            const owned = bank.getQty(item);
            const image = createElement('img', {
                className: 'skill-icon-sm mr-1',
                attributes: [
                    ['src', item.media]
                ]
            });
            const tooltip = tippy(image, {
                content: item.name,
                placement: 'bottom',
                interactive: false,
                animateFill: false,
            });
            this.itemTooltips.push(tooltip);
            this.itemCosts.append(image, createElement('span', {
                className: `${owned >= quantity ? 'text-success' : 'text-danger'}`,
                text: numberWithCommas(quantity),
            }));
        });
    }
    setUpgradeButtons(upgrade, bank) {
        const maxUpgrades = bank.getMaxUpgradeQuantity(upgrade);
        const potionRequirementMet = bank.checkUpgradePotionRequirement(upgrade);
        this.upgradeButtons.forEach(({
            button,
            quantity
        }) => {
            if (potionRequirementMet && (maxUpgrades >= quantity || (quantity === Infinity && maxUpgrades > 0))) {
                showElement(button);
                button.onclick = () => bank.upgradeItemOnClick(upgrade, quantity);
            } else {
                hideElement(button);
            }
        });
    }
}

function openBankSidebar() {
    const sidebarContainer = document.getElementById('bank-sidebar-overlay-container');
    sidebarContainer.appendChild(bankSideBarMenu);
    bankSideBarMenu.toggleSidebarMode(true);
    One._uiApiLayout('side_overlay_open');
}

function closeBankSidebar() {
    const mainContainer = document.getElementById('bank-item-box');
    mainContainer.appendChild(bankSideBarMenu);
    bankSideBarMenu.toggleSidebarMode(false);
    One._uiApiLayout('side_overlay_close');
}
//# sourceMappingURL=bankMenus.js.map
checkFileVersion('?12097')