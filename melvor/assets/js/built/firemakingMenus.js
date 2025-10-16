"use strict";
class FiremakingLogMenuElement extends HTMLElement {
    constructor() {
        super();
        this.realmOptions = new Map();
        this.recipeOptions = new Map();
        this.primaryIcons = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('firemaking-log-menu-template'));
        this.realmSelect = getElementFromFragment(this._content, 'realm-select', 'div');
        this.expandButton = getElementFromFragment(this._content, 'expand-button', 'button');
        this.expandDiv = getElementFromFragment(this._content, 'expand-div', 'div');
        this.realmContainer = getElementFromFragment(this._content, 'realm-container', 'ul');
        this.dropdownSelect = getElementFromFragment(this._content, 'dropdown-select', 'div');
        this.logSelectButton = getElementFromFragment(this._content, 'log-select-button', 'button');
        this.logOptionsContainer = getElementFromFragment(this._content, 'log-options-container', 'div');
        this.logQuantity = getElementFromFragment(this._content, 'log-quantity', 'item-current-icon');
        this.logName = getElementFromFragment(this._content, 'log-name', 'span');
        this.preservation = getElementFromFragment(this._content, 'preservation', 'preservation-icon');
        this.doubling = getElementFromFragment(this._content, 'doubling', 'doubling-icon');
        this.mastery = getElementFromFragment(this._content, 'mastery', 'mastery-display');
        this.primaryProducts = getElementFromFragment(this._content, 'primary-products', 'div');
        this.primaryIconContainer = getElementFromFragment(this._content, 'primary-icon-container', 'div');
        this.primaryHaves = getElementFromFragment(this._content, 'primary-haves', 'haves-box');
        this.grants = getElementFromFragment(this._content, 'grants', 'grants-box');
        this.burnButton = getElementFromFragment(this._content, 'burn-button', 'button');
        this.interval = getElementFromFragment(this._content, 'interval', 'interval-icon');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'progress-bar');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.progressBar.setStyle('bg-warning');
        this.expandButton.onclick = () => this.expandDiv.classList.toggle('d-none');
    }
    init(game, firemaking) {
        const realms = new Set();
        firemaking.actions.forEach((recipe) => {
            const link = createElement('a', {
                className: '',
            });
            createElement('img', {
                parent: link,
                className: 'resize-24 mr-1',
                attributes: [
                    ['src', recipe.log.media]
                ]
            });
            const name = createElement('span', {
                text: recipe.log.name,
                parent: link
            });
            this.recipeOptions.set(recipe, {
                link,
                name
            });
            realms.add(recipe.realm);
        });
        if (realms.size > 1) {
            realms.forEach((realm) => {
                const realmOption = createElement('realm-select-option', {
                    parent: this.realmContainer
                });
                realmOption.setRealm(realm);
                if (realm.isUnlocked)
                    realmOption.setUnlocked();
                else
                    realmOption.setLocked();
                realmOption.setAsSubMenu();
                this.realmOptions.set(realm, realmOption);
            });
            this.recipeOptions.forEach(({
                link
            }, recipe) => {
                link.onclick = () => {
                    firemaking.selectLog(recipe);
                    this.collapseOptions();
                };
                link.className = 'nav-main-link active';
                const li = createElement('li', {
                    className: 'nav-main-item',
                    children: [link]
                });
                this.realmOptions.get(recipe.realm).addSubOption(li);
            });
            this.realmOptions.forEach((o) => {
                o.enableSubmenuScrolling(60);
            });
            showElement(this.realmSelect);
            hideElement(this.dropdownSelect);
        } else {
            this.recipeOptions.forEach(({
                link
            }, recipe) => {
                link.onclick = () => firemaking.selectLog(recipe);
                link.className = 'dropdown-item pointer-enabled';
                this.logOptionsContainer.append(link);
            });
            hideElement(this.realmSelect);
            showElement(this.dropdownSelect);
        }
        this.logSelectButton.onclick = () => this.updateOptions(game, firemaking);
        this.burnButton.onclick = () => firemaking.burnLog();
    }
    collapseOptions() {
        this.expandDiv.classList.add('d-none');
    }
    updateOptions(game, firemaking) {
        this.recipeOptions.forEach((option, recipe) => {
            option.name.textContent = '';
            // TODO_C This should be adjusted to not use innerHTML
            if (recipe.level > firemaking.level || recipe.abyssalLevel > firemaking.abyssalLevel) {
                option.name.innerHTML += `<span class="${getRequirementTextClass(recipe.level < firemaking.level)}">${templateLangString('MENU_TEXT_REQUIRES_LEVEL', {
                    level: `${recipe.level}`,
                })}</span>`;
                if (recipe.abyssalLevel > 0) {
                    option.name.innerHTML += `<br><span class="${getRequirementTextClass(recipe.abyssalLevel < firemaking.abyssalLevel)}">${templateLangString('MENU_TEXT_REQUIRES_ABYSSAL_LEVEL', {
                        level: `${recipe.abyssalLevel}`,
                    })}`;
                }
            } else {
                option.name.textContent = recipe.log.name;
                option.link.classList.remove('text-danger');
            }
        });
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
    setUnselected() {
        hideElement(this.logQuantity);
        this.logName.textContent = '';
        this.grants.setUnselected();
        this.mastery.setNoMastery();
        hideElement(this.primaryProducts);
    }
    setLog(game, firemaking, recipe) {
        this.logQuantity.setItem(recipe.log, 1, game);
        showElement(this.logQuantity);
        this.logName.textContent = recipe.name;
        this.grants.setSelected();
        this.mastery.setMastery(firemaking, recipe);
        if (recipe.primaryProducts.length > 0) {
            this.setProductIcons(this.primaryIconContainer, this.primaryIcons, recipe.primaryProducts);
            this.primaryHaves.setItems(recipe.primaryProducts.map((item) => ({
                item,
                quantity: 0
            })), [], game);
            showElement(this.primaryProducts);
        } else {
            this.primaryHaves.destroyIcons();
            hideElement(this.primaryProducts);
        }
    }
    updateQuantities(game) {
        this.logQuantity.updateQuantity(game.bank);
        this.primaryHaves.updateQuantities(game);
    }
    updateLogInfo(game, firemaking, recipe) {
        // Update Doubling + Preservation chances
        this.doubling.setChance(firemaking.getDoublingChance(recipe), firemaking.getDoublingSources(recipe));
        this.preservation.setChance(firemaking.getPreservationChance(recipe), firemaking.getPreservationCap(recipe), firemaking.getPreservationSources(recipe));
        // Update XP Grants
        const baseXP = recipe.baseExperience;
        const xpWithBonfire = baseXP * (1 + firemaking.bonfireBonusXP / 100);
        const xp = firemaking.modifyXP(xpWithBonfire, recipe);
        const baseMXP = firemaking.getBaseMasteryXPToAddForAction(recipe, firemaking.masteryModifiedInterval);
        const mxp = firemaking.getMasteryXPToAddForAction(recipe, firemaking.masteryModifiedInterval);
        const mpxp = firemaking.getMasteryXPToAddToPool(mxp);
        this.grants.updateGrants(xp, baseXP, mxp, baseMXP, mpxp, recipe.realm);
        this.grants.setSources(firemaking, recipe);
        const baseAXP = recipe.baseAbyssalExperience;
        const axpWithBonfire = baseAXP * (1 + firemaking.bonfireBonusAXP / 100);
        const axp = firemaking.modifyAbyssalXP(axpWithBonfire, recipe);
        this.grants.updateAbyssalGrants(axp, baseAXP);
        // Update Product Chances
        recipe.primaryProducts.forEach((product, i) => {
            const info = firemaking.getPrimaryProductInfo(product, recipe);
            this.primaryIcons[i].setChance(info.chance);
        });
        // Update Interval
        this.interval.setInterval(firemaking.modifyInterval(recipe.baseInterval, recipe), firemaking.getIntervalSources(recipe));
    }
    setProductIcons(container, icons, products) {
        while (icons.length < products.length) {
            const chanceIcon = createElement('item-chance-icon', {
                parent: container
            });
            icons.push(chanceIcon);
        }
        products.forEach((item, i) => {
            icons[i].setItem(item);
            showElement(icons[i]);
        });
        for (let i = products.length; i < icons.length; i++) {
            hideElement(icons[i]);
        }
    }
}
window.customElements.define('firemaking-log-menu', FiremakingLogMenuElement);
class FiremakingBonfireMenuElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('firemaking-bonfire-menu-template'));
        this.bonfireImage = getElementFromFragment(this._content, 'bonfire-image', 'img');
        this.statusText = getElementFromFragment(this._content, 'status-text', 'span');
        this.statusState = getElementFromFragment(this._content, 'status-state', 'span');
        this.standardXpBonus = getElementFromFragment(this._content, 'standard-xp-bonus', 'div');
        this.standardXpPercent = getElementFromFragment(this._content, 'standard-xp-percent', 'span');
        this.abyssalXpBonus = getElementFromFragment(this._content, 'abyssal-xp-bonus', 'div');
        this.abyssalXpPercent = getElementFromFragment(this._content, 'abyssal-xp-percent', 'span');
        this.lightButton = getElementFromFragment(this._content, 'light-button', 'button');
        this.stopButton = getElementFromFragment(this._content, 'stop-button', 'button');
        this.interval = getElementFromFragment(this._content, 'interval', 'interval-icon');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'progress-bar');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.progressBar.setStyle('bg-primary');
        this.progressBar.isReversed = true;
    }
    init(firemaking) {
        this.lightButton.onclick = () => firemaking.lightBonfire();
        this.stopButton.onclick = () => firemaking.stopBonfire();
    }
    updateInfo(firemaking, recipe) {
        if (recipe !== undefined) {
            const interval = firemaking.getBonfireInterval(recipe);
            const sources = firemaking.getBonfireIntervalSources(recipe);
            if (interval >= 3600000) {
                this.interval.setCustomInterval(formatAsSHTimePeriod(firemaking.getBonfireInterval(recipe)), sources);
            } else {
                this.interval.setInterval(firemaking.getBonfireInterval(recipe), sources);
            }
            this.toggleAbyssalState(recipe.hasAbyssalBonfire);
            this.lightButton.innerText = templateLangString('MENU_TEXT_LIGHT_BONFIRE', {
                qty: numberWithCommas(recipe.bonfireCost),
                logName: recipe.log.name,
            });
            this.standardXpPercent.textContent = formatPercent(recipe.bonfireXPBonus);
            if (recipe.bonfireAXPBonus !== undefined)
                this.abyssalXpPercent.textContent = formatPercent(recipe.bonfireAXPBonus);
        } else {
            this.interval.setInterval(0, []);
            this.toggleAbyssalState(false);
            this.lightButton.textContent = getLangString('NO_LOG_SELECTED');
            this.standardXpPercent.textContent = formatPercent(0);
            this.abyssalXpPercent.textContent = formatPercent(0);
        }
    }
    setActive() {
        this.statusState.classList.replace('text-danger', 'text-success');
        this.standardXpPercent.classList.replace('text-danger', 'text-success');
        this.abyssalXpPercent.classList.replace('text-danger', 'text-success');
        this.bonfireImage.src = assets.getURI('assets/media/skills/firemaking/bonfire_active.png');
        showElement(this.stopButton);
        hideElement(this.lightButton);
    }
    setInactive() {
        this.statusState.textContent = getLangString('MENU_TEXT_INACTIVE');
        this.statusState.classList.replace('text-success', 'text-danger');
        this.standardXpPercent.classList.replace('text-success', 'text-danger');
        this.abyssalXpPercent.classList.replace('text-success', 'text-danger');
        this.bonfireImage.src = assets.getURI('assets/media/skills/firemaking/bonfire_inactive.png');
        hideElement(this.stopButton);
        showElement(this.lightButton);
    }
    updateItemQuantity(game, activeBonfire) {
        this.statusState.textContent = `${activeBonfire.log.name} | ${templateLangString('EVENTS_DESC_0_8', {
            num: numberWithCommas(game.bank.getQty(activeBonfire.log)),
        })}`;
    }
    toggleAbyssalState(isAbyssal) {
        if (isAbyssal) {
            this.statusText.textContent = getLangString('FIREMAKING_ABYSSAL_BONFIRE_STATUS');
            showElement(this.abyssalXpBonus);
            hideElement(this.standardXpBonus);
        } else {
            this.statusText.textContent = getLangString('MENU_TEXT_BONFIRE_STATUS');
            showElement(this.standardXpBonus);
            hideElement(this.abyssalXpBonus);
        }
    }
}
window.customElements.define('firemaking-bonfire-menu', FiremakingBonfireMenuElement);
class FiremakingOilMenuElement extends HTMLElement {
    constructor() {
        super();
        this.recipeOptions = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('firemaking-oil-menu-template'));
        this.oilSelectButton = getElementFromFragment(this._content, 'oil-select-button', 'button');
        this.oilOptionsContainer = getElementFromFragment(this._content, 'oil-options-container', 'div');
        this.oilName = getElementFromFragment(this._content, 'oil-name', 'span');
        this.oilInfo = getElementFromFragment(this._content, 'oil-info', 'span');
        this.oilQuantity = getElementFromFragment(this._content, 'oil-quantity', 'item-current-icon');
        this.oilButton = getElementFromFragment(this._content, 'oil-button', 'button');
        this.stopButton = getElementFromFragment(this._content, 'stop-button', 'button');
        this.interval = getElementFromFragment(this._content, 'interval', 'interval-icon');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'progress-bar');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.progressBar.setStyle('bg-primary');
        this.progressBar.isReversed = true;
    }
    init(firemaking) {
        game.items.firemakingOils.forEach((oil) => {
            const link = createElement('a', {
                className: 'dropdown-item pointer-enabled text-wrap',
                parent: this.oilOptionsContainer,
            });
            link.onclick = () => firemaking.selectOil(oil);
            createElement('img', {
                parent: link,
                className: 'resize-24 mr-1',
                attributes: [
                    ['src', oil.media]
                ]
            });
            const name = createElement('span', {
                text: oil.name,
                parent: link
            });
            createElement('br', {
                parent: link
            });
            const modifiers = createElement('span', {
                parent: link
            });
            modifiers.innerHTML = describeModifierData(oil.modifiers);
            this.recipeOptions.set(oil, {
                link,
                name,
                modifiers
            });
        });
        this.oilSelectButton.onclick = () => this.updateOptions(game, firemaking);
        this.oilButton.onclick = () => firemaking.oilMyLog();
        this.stopButton.onclick = () => firemaking.stopOilingMyLog();
    }
    updateInfo(firemaking, oil, cost) {
        this.interval.setInterval(firemaking.getOilingOfMyLogInterval(oil), []);
        this.oilButton.innerText = templateLangString('FIREMAKING_OIL_MY_LOGS_ITEM', {
            qty: numberWithCommas(cost),
        });
    }
    updateOptions(game, firemaking) {
        this.recipeOptions.forEach((option, oil) => {
            showElement(option.link);
            option.name.textContent = '';
            option.name.textContent = oil.name;
            option.link.classList.remove('text-danger');
        });
    }
    setUnselected() {
        hideElement(this.oilQuantity);
        this.oilButton.innerText = getLangString('FIREMAKING_OIL_MY_LOGS');
    }
    setOil(game, firemaking, oil) {
        this.oilQuantity.setItem(oil, 1, game, true);
        showElement(this.oilQuantity);
        this.oilName.textContent = oil.name;
        this.oilInfo.innerHTML = describeModifierDataPlain(oil.modifiers);
        this.updateInfo(firemaking, oil, 10);
    }
    updateQuantities(game) {
        this.oilQuantity.updateQuantity(game.bank);
    }
    setActive() {
        showElement(this.stopButton);
        hideElement(this.oilButton);
    }
    setInactive() {
        hideElement(this.stopButton);
        showElement(this.oilButton);
    }
}
window.customElements.define('firemaking-oil-menu', FiremakingOilMenuElement);
//# sourceMappingURL=firemakingMenus.js.map
checkFileVersion('?12097')