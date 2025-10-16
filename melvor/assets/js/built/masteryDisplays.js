"use strict";
// Custom Components for displaying mastery experience, levels and progress
/** Contains Mastery Icon with Level, Progress bar for % progress to next level and experience progress */
class MasteryDisplayElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('mastery-display-template'));
        this.icon = getElementFromFragment(this._content, 'icon', 'img');
        this.level = getElementFromFragment(this._content, 'level', 'span');
        this.xpProgress = getElementFromFragment(this._content, 'xp-progress', 'small');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.iconTooltip = tippy(this.icon, {
            content: getLangString('MENU_TEXT_MASTERY'),
            placement: 'bottom',
            interactive: false,
            animation: false,
        });
    }
    disconnectedCallback() {
        if (this.iconTooltip !== undefined) {
            this.iconTooltip.destroy();
            this.iconTooltip = undefined;
        }
    }
    setNoMastery() {
        this.removeAttribute('data-skill-id');
        this.removeAttribute('data-action-id');
        this.level.classList.remove('text-warning');
        this.level.textContent = '-';
        this.xpProgress.textContent = '-';
        this.progressBar.style.width = '0%';
    }
    setMastery(skill, action) {
        this.setAttribute('data-skill-id', skill.id);
        this.setAttribute('data-action-id', action.id);
    }
    updateValues(progress) {
        let xpText = numberWithCommas(Math.floor(progress.xp));
        if (progress.level >= 99) {
            this.level.classList.add('text-warning');
            this.progressBar.classList.replace('bg-info', 'bg-success');
        } else {
            this.level.classList.remove('text-warning');
            this.progressBar.classList.replace('bg-success', 'bg-info');
            xpText += ` / ${numberWithCommas(progress.nextLevelXP)}`;
        }
        this.progressBar.style.width = `${progress.percent}%`;
        this.level.textContent = `${progress.level}`;
        this.xpProgress.textContent = xpText;
    }
}
window.customElements.define('mastery-display', MasteryDisplayElement);
/** Contains Mastery Icon with Level, and percentage to next mastery level */
class CompactMasteryDisplayElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('compact-mastery-display-template'));
        this.icon = getElementFromFragment(this._content, 'icon', 'img');
        this.level = getElementFromFragment(this._content, 'level', 'span');
        this.progressPercent = getElementFromFragment(this._content, 'progress-percent', 'small');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.iconTooltip = tippy(this.icon, {
            content: getLangString('MENU_TEXT_MASTERY'),
            placement: 'bottom',
            interactive: false,
            animation: false,
        });
    }
    disconnectedCallback() {
        if (this.iconTooltip !== undefined) {
            this.iconTooltip.destroy();
            this.iconTooltip = undefined;
        }
    }
    setMastery(skill, action) {
        this.setAttribute('data-skill-id', skill.id);
        this.setAttribute('data-action-id', action.id);
    }
    updateValues(progress) {
        if (progress.level >= 99)
            this.level.classList.add('text-warning');
        else
            this.level.classList.remove('text-warning');
        this.progressPercent.textContent = `(${formatPercent(progress.percent, 2)})`;
        this.level.textContent = `${progress.level}`;
    }
}
window.customElements.define('compact-mastery-display', CompactMasteryDisplayElement);
class MasteryPoolDisplayElement extends HTMLElement {
    constructor() {
        super();
        this.realmDisplays = [];
        this.realmDisplayMap = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('mastery-pool-display-template'));
        this.poolIcon = getElementFromFragment(this._content, 'pool-icon', 'img');
        this.progressBarContainer = getElementFromFragment(this._content, 'progress-bar-container', 'div');
        this.labelContainer = getElementFromFragment(this._content, 'label-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.poolTooltip = tippy(this.poolIcon, {
            content: getLangString('MENU_TEXT_MASTERY_POOL'),
            placement: 'bottom',
            allowHTML: false,
            interactive: false,
            animation: false,
        });
    }
    disconnectedCallback() {
        if (this.poolTooltip !== undefined) {
            this.poolTooltip.destroy();
            this.poolTooltip = undefined;
        }
        this.realmDisplays.forEach((display) => {
            display.realmTooltip.destroy();
        });
    }
    setSkill(skill, realmsToShow) {
        if (realmsToShow === undefined)
            realmsToShow = skill.getRealmsWithMastery();
        while (this.realmDisplays.length < realmsToShow.length) {
            this.realmDisplays.push(this.createRealmDisplay());
        }
        this.realmDisplayMap.clear();
        for (let i = 0; i < realmsToShow.length; i++) {
            const realm = realmsToShow[i];
            const realmDisplay = this.realmDisplays[i];
            realmDisplay.realmImage.src = realm.media;
            realmDisplay.realmTooltip.setContent(realm.name);
            if (realm.isUnlocked || (!realm.isUnlocked && realm.showIfLocked)) {
                showElement(realmDisplay.progressContainer);
                showElement(realmDisplay.labelContainer);
            } else {
                hideElement(realmDisplay.progressContainer);
                hideElement(realmDisplay.labelContainer);
            }
            this.realmDisplayMap.set(realm, realmDisplay);
            this.updateProgress(skill, realm);
        }
        for (let i = realmsToShow.length; i < this.realmDisplays.length; i++) {
            const realmDisplay = this.realmDisplays[i];
            hideElement(realmDisplay.progressContainer);
            hideElement(realmDisplay.labelContainer);
        }
        this.setAttribute('data-skill-id', skill.id);
    }
    updateProgress(skill, realm) {
        const realmDisplay = this.realmDisplayMap.get(realm);
        if (realmDisplay === undefined)
            return;
        const poolXP = skill.getMasteryPoolXP(realm);
        const percent = (100 * poolXP) / skill.getBaseMasteryPoolCap(realm);
        realmDisplay.progress.style.width = `${percent}%`;
        realmDisplay.currentXP.textContent = numberWithCommas(Math.floor(poolXP));
        realmDisplay.totalXP.textContent = numberWithCommas(skill.getMasteryPoolCap(realm));
        realmDisplay.percentXP.textContent = formatPercent(percent, 2);
    }
    createRealmDisplay() {
        const progressContainer = createElement('div', {
            className: 'progress active w-100 mb-1',
            parent: this.progressBarContainer,
        });
        progressContainer.style.height = '4px';
        const progress = createElement('div', {
            className: 'progress-bar bg-warning',
            attributes: [
                ['role', 'progressbar'],
                ['aria-valuenow', '0'],
                ['aria-value-min', '0'],
                ['aria-valuemax', '100'],
            ],
            parent: progressContainer,
        });
        const labelContainer = createElement('small', {
            className: 'mr-2',
            parent: this.labelContainer
        });
        const realmImage = createElement('img', {
            className: 'skill-icon-xxs mr-1',
            parent: labelContainer
        });
        const realmTooltip = tippy(realmImage, {
            placement: 'bottom',
            allowHTML: false,
            interactive: false,
            animation: false,
        });
        const xpSpan = createElement('span');
        const currentXP = createElement('span');
        const totalXP = createElement('span');
        const percentXP = createElement('span');
        xpSpan.append(currentXP, ' / ', totalXP, ' (', percentXP, ')');
        labelContainer.append(...templateLangStringWithNodes('XP_AMOUNT', {
            xp: xpSpan
        }, {}, false));
        labelContainer.append(createElement('br', {
            className: 'd-lg-none'
        }));
        return {
            progressContainer,
            progress,
            labelContainer,
            realmImage,
            realmTooltip,
            currentXP,
            totalXP,
            percentXP,
        };
    }
}
window.customElements.define('mastery-pool-display', MasteryPoolDisplayElement);
class SpendMasteryMenuItemElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('spend-mastery-menu-item-template'));
        this.actionImage = getElementFromFragment(this._content, 'action-image', 'img');
        this.level = getElementFromFragment(this._content, 'mastery-level', 'strong');
        this.xpRequired = getElementFromFragment(this._content, 'xp-required', 'span');
        this.progressBar = getElementFromFragment(this._content, 'mastery-progress', 'div');
        this.masteryName = getElementFromFragment(this._content, 'mastery-name', 'span');
        this.levelUpButton = getElementFromFragment(this._content, 'level-up-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.actionTooltip = tippy(this.actionImage, {
            content: '',
            placement: 'top',
            allowHTML: false,
            interactive: false,
            animation: false,
        });
    }
    disconnectedCallback() {
        if (this.actionTooltip !== undefined) {
            this.actionTooltip.destroy();
            this.actionTooltip = undefined;
        }
    }
    setAction(action) {
        var _a;
        this.actionImage.src = action.media;
        (_a = this.actionTooltip) === null || _a === void 0 ? void 0 : _a.setContent(action.name);
    }
    updateProgress(skill, action, spendAmount) {
        const progress = skill.getMasteryProgress(action);
        this.level.textContent = `${progress.level}`;
        this.progressBar.style.width = `${progress.percent}%`;
        if (progress.level >= 99) {
            this.progressBar.classList.replace('bg-info', 'bg-success');
            hideElement(this.levelUpButton);
            hideElement(this.xpRequired);
        } else {
            this.progressBar.classList.replace('bg-success', 'bg-info');
            showElement(this.levelUpButton);
            showElement(this.xpRequired);
            const nextLevel = Math.min(progress.level + spendAmount, 99);
            const xpRequired = exp.levelToXP(nextLevel) - progress.xp + 1;
            const levelIncrease = nextLevel - progress.level;
            this.xpRequired.textContent = templateLangString('MENU_TEXT_SPEND_MASTERY_XP_FOR', {
                xp: numberWithCommas(Math.floor(xpRequired)),
                num: `${levelIncrease}`,
            });
            this.levelUpButton.textContent = `+${levelIncrease}`;
            this.levelUpButton.onclick = () => skill.levelUpMasteryWithPoolXP(action, levelIncrease);
            const poolTierChange = skill.getPoolBonusChange(action.realm, -xpRequired);
            if (xpRequired <= skill.getMasteryPoolXP(action.realm)) {
                if (poolTierChange < 0) {
                    this.levelUpButton.classList.remove('btn-danger', 'btn-success');
                    this.levelUpButton.classList.add('btn-warning');
                } else {
                    this.levelUpButton.classList.remove('btn-danger', 'btn-warning');
                    this.levelUpButton.classList.add('btn-success');
                }
                this.levelUpButton.classList.remove('disabled');
                this.levelUpButton.disabled = false;
            } else {
                this.levelUpButton.classList.remove('btn-success', 'btn-warning');
                this.levelUpButton.classList.add('disabled', 'btn-danger');
                this.levelUpButton.disabled = true;
            }
        }
        this.masteryName.textContent = action.name;
    }
}
window.customElements.define('spend-mastery-menu-item', SpendMasteryMenuItemElement);
class SpendMasteryMenuElement extends HTMLElement {
    constructor() {
        super();
        this.claimTokenButtons = [];
        this.claimTokenButtonMap = new Map();
        this.filterOptions = [];
        this.masteryItems = [];
        this.itemsByAction = new Map();
        this.levelUpAmount = 1;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('spend-mastery-menu-template'));
        this.masteryItemContainer = getElementFromFragment(this._content, 'mastery-item-container', 'div');
        this.realmSelect = getElementFromFragment(this._content, 'realm-select', 'realm-tab-select');
        this.poolDisplay = getElementFromFragment(this._content, 'pool-display', 'mastery-pool-display');
        this.claimTokenContainer = getElementFromFragment(this._content, 'claim-token-container', 'div');
        this.setLevel1Button = getElementFromFragment(this._content, 'set-level-1-button', 'button');
        this.setLevel5Button = getElementFromFragment(this._content, 'set-level-5-button', 'button');
        this.setLevel10Button = getElementFromFragment(this._content, 'set-level-10-button', 'button');
        this.filterContainer = getElementFromFragment(this._content, 'filter-container', 'div');
        this.level99Filter = getElementFromFragment(this._content, 'level-99-filter', 'settings-checkbox');
        this.setLevel1Button.onclick = () => this.changeLevelUpAmount(1);
        this.setLevel5Button.onclick = () => this.changeLevelUpAmount(5);
        this.setLevel10Button.onclick = () => this.changeLevelUpAmount(10);
    }
    get curentSkill() {
        return this._currentSkill;
    }
    get currentRealm() {
        return this._currentRealm;
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setSkill(skill, realm, game) {
        this._currentSkill = skill;
        if (game.settings.useLegacyRealmSelection)
            this.createRealmOptions(skill, realm, game);
        this.showMasteriesForRealm(skill, realm, game);
    }
    unsetSkill() {
        this._currentSkill = undefined;
        this._currentRealm = undefined;
    }
    updateRealmUnlock(realm) {
        this.realmSelect.updateRealmUnlock(realm);
    }
    createRealmOptions(skill, realm, game) {
        this.realmSelect.setOptions(skill.getRealmsWithMastery(), (realm) => this.showMasteriesForRealm(skill, realm, game), true);
        this.realmSelect.setSelectedRealm(realm);
    }
    showMasteriesForRealm(skill, realm, game) {
        this._currentRealm = realm;
        const sortedMasteryActions = skill.getSortedMasteryActionsInRealm(realm);
        while (this.masteryItems.length < sortedMasteryActions.length) {
            const newItem = createElement('spend-mastery-menu-item', {
                className: 'coi-12 col-md-6',
                parent: this.masteryItemContainer,
            });
            this.masteryItems.push(newItem);
        }
        while (this.masteryItems.length > sortedMasteryActions.length) {
            const masteryItem = this.masteryItems.pop();
            if (masteryItem !== undefined)
                masteryItem.remove();
        }
        this.itemsByAction.clear();
        const namespaces = new Set();
        sortedMasteryActions.forEach((action, i) => {
            const masteryItem = this.masteryItems[i];
            this.itemsByAction.set(action, masteryItem);
            masteryItem.setAction(action);
            masteryItem.updateProgress(skill, action, this.levelUpAmount);
            namespaces.add(action.namespace);
            if (this.shouldHideMastery(skill, action))
                hideElement(masteryItem);
            else
                showElement(masteryItem);
        });
        // Display quick claim buttons for mastery tokens
        const tokens = skill.masteryTokens.get(realm);
        this.claimTokenButtonMap.clear();
        if (tokens !== undefined) {
            while (this.claimTokenButtons.length < tokens.length)
                this.claimTokenButtons.push(this.createClaimTokenButton());
            tokens.forEach((token, i) => {
                const button = this.claimTokenButtons[i];
                this.setClaimTokenButton(button, token, game);
                this.claimTokenButtonMap.set(token, button);
                showElement(button.button);
            });
            for (let i = tokens.length; i < this.claimTokenButtons.length; i++) {
                hideElement(this.claimTokenButtons[i].button);
            }
            showElement(this.claimTokenContainer);
        } else {
            hideElement(this.claimTokenContainer);
        }
        this.poolDisplay.setSkill(skill, [realm]);
        this.updateFilterOptions(namespaces);
    }
    shouldHideMastery(skill, action) {
        return ((game.settings.hideMaxLevelMasteries && skill.getMasteryLevel(action) >= 99) ||
            game.settings.hiddenMasteryNamespaces.has(action.namespace));
    }
    updateAllActions() {
        if (this._currentSkill === undefined || this._currentRealm === undefined)
            return;
        const skill = this._currentSkill;
        skill.getSortedMasteryActionsInRealm(this._currentRealm).forEach((action, i) => {
            const masteryItem = this.masteryItems[i];
            masteryItem.updateProgress(skill, action, this.levelUpAmount);
            if (game.settings.hideMaxLevelMasteries && skill.getMasteryLevel(action) >= 99)
                hideElement(masteryItem);
        });
    }
    updateFilterOptions(namespaces) {
        const filters = [];
        if (namespaces.has("melvorD" /* Namespaces.Demo */ ) || namespaces.has("melvorF" /* Namespaces.Full */ )) {
            filters.push({
                namespace: "melvorBaseGame" /* Namespaces.BaseGame */ ,
                label: getLangString('COMPLETION_BASE_GAME'),
            });
        }
        namespaces.forEach((namespace) => {
            if (namespace === "melvorD" /* Namespaces.Demo */ || namespace === "melvorF" /* Namespaces.Full */ )
                return;
            const label = game.registeredNamespaces.getNamespace(namespace).displayName;
            filters.push({
                namespace,
                label,
            });
        });
        while (this.filterOptions.length < filters.length) {
            const inputID = `spend-mastery-menu-filter-${this.filterOptions.length}`;
            const container = createElement('div', {
                className: 'form-check form-check-inline'
            });
            const input = createElement('input', {
                id: inputID,
                className: 'form-check-input pointer-enabled',
                attributes: [
                    ['type', 'checkbox']
                ],
                parent: container,
            });
            const label = createElement('label', {
                className: 'form-check-label pointer-enabled',
                attributes: [
                    ['for', inputID]
                ],
                parent: container,
            });
            this.filterContainer.insertBefore(container, this.level99Filter);
            this.filterOptions.push({
                container,
                input,
                label
            });
        }
        filters.forEach((filter, i) => {
            const {
                container,
                input,
                label
            } = this.filterOptions[i];
            input.checked =
                filter.namespace === "melvorBaseGame" /* Namespaces.BaseGame */ ?
                !game.settings.hiddenMasteryNamespaces.has("melvorD" /* Namespaces.Demo */ ) :
                !game.settings.hiddenMasteryNamespaces.has(filter.namespace);
            label.textContent = filter.label;
            input.onchange = () => {
                if (filter.namespace === "melvorBaseGame" /* Namespaces.BaseGame */ ) {
                    if (input.checked) {
                        game.settings.hiddenMasteryNamespaces.delete("melvorD" /* Namespaces.Demo */ );
                        game.settings.hiddenMasteryNamespaces.delete("melvorF" /* Namespaces.Full */ );
                    } else {
                        game.settings.hiddenMasteryNamespaces.add("melvorD" /* Namespaces.Demo */ );
                        game.settings.hiddenMasteryNamespaces.add("melvorF" /* Namespaces.Full */ );
                    }
                } else {
                    if (input.checked)
                        game.settings.hiddenMasteryNamespaces.delete(filter.namespace);
                    else
                        game.settings.hiddenMasteryNamespaces.add(filter.namespace);
                }
                this.onFilterChange();
            };
            showElement(container);
        });
        for (let i = filters.length; i < this.filterOptions.length; i++) {
            const {
                container,
                input
            } = this.filterOptions[i];
            input.onchange = null;
            hideElement(container);
        }
    }
    onFilterChange() {
        if (this._currentSkill === undefined || this._currentRealm === undefined)
            return;
        const skill = this._currentSkill;
        skill.getSortedMasteryActionsInRealm(this._currentRealm).forEach((action, i) => {
            const masteryItem = this.masteryItems[i];
            if (this.shouldHideMastery(skill, action))
                hideElement(masteryItem);
            else
                showElement(masteryItem);
        });
    }
    updateAction(skill, action) {
        const masteryItem = this.itemsByAction.get(action);
        if (masteryItem === undefined)
            return;
        masteryItem.updateProgress(skill, action, this.levelUpAmount);
        if (game.settings.hideMaxLevelMasteries && skill.getMasteryLevel(action) >= 99)
            hideElement(masteryItem);
    }
    updateTokenQuantity(token, amount) {
        const button = this.claimTokenButtonMap.get(token);
        if (button !== undefined)
            button.quantity.textContent = numberWithCommas(amount);
    }
    changeLevelUpAmount(newAmount) {
        this.levelUpAmount = newAmount;
        if (this._currentSkill === undefined || this._currentRealm === undefined)
            return;
        const skill = this._currentSkill;
        skill.getSortedMasteryActionsInRealm(this._currentRealm).forEach((action, i) => {
            const masteryItem = this.masteryItems[i];
            masteryItem.updateProgress(skill, action, newAmount);
        });
    }
    createClaimTokenButton() {
        const button = createElement('button', {
            className: 'btn btn-sm btn-primary m-1',
            attributes: [
                ['role', 'button']
            ],
            parent: this.claimTokenContainer,
        });
        const image = createElement('img', {
            className: 'skill-icon-xs m-0 mr-1',
            parent: button
        });
        const quantity = createElement('span');
        button.append(...templateLangStringWithNodes('MENU_TEXT_MPXP_CLAIM_TOKENS', {
            qtyInBank: quantity
        }, {}, false));
        return {
            button,
            image,
            quantity,
        };
    }
    setClaimTokenButton(button, token, game) {
        button.image.src = token.media;
        button.quantity.textContent = numberWithCommas(game.bank.getQty(token));
        button.button.onclick = () => {
            game.bank.claimMasteryTokenOnClick(token, Infinity);
            button.button.blur();
        };
    }
}
class MasterySkillOptionsElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('mastery-skill-options-template'));
        this.poolDisplay = getElementFromFragment(this._content, 'pool-display', 'mastery-pool-display');
        this.viewCheckpointsButton = getElementFromFragment(this._content, 'view-checkpoints-button', 'button');
        this.spendMasteryButton = getElementFromFragment(this._content, 'spend-mastery-button', 'button');
        this.masteryImage = createElement('img', {
            className: 'skill-icon-xs m-0',
            attributes: [
                ['src', assets.getURI("assets/media/main/mastery_pool.png" /* Assets.MasteryPoolIcon */ )]
            ],
        });
        this.spendMasteryButton.append(...templateLangStringWithNodes('MENU_TEXT_MASTERY_SPEND_XP', {
            masteryImage: this.masteryImage
        }, {}, false));
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.masteryTooltip = tippy(this.masteryImage, {
            content: getLangString('MENU_TEXT_MASTERY_POOL'),
            placement: 'bottom',
            allowHTML: false,
            interactive: false,
            animation: false,
        });
    }
    disconnectedCallback() {
        if (this.masteryTooltip !== undefined) {
            this.masteryTooltip.destroy();
            this.masteryTooltip = undefined;
        }
    }
    setSkill(skill) {
        this.poolDisplay.setSkill(skill);
        this.viewCheckpointsButton.onclick = () => skill.openMasteryPoolBonusModal();
        this.spendMasteryButton.onclick = () => skill.openSpendMasteryXPModal();
    }
}
window.customElements.define('mastery-skill-options', MasterySkillOptionsElement);
class MasteryPoolBonusElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('mastery-pool-bonus-template'));
        this.percent = getElementFromFragment(this._content, 'percent', 'h2');
        this.description = getElementFromFragment(this._content, 'description', 'div');
        this.xpRequired = getElementFromFragment(this._content, 'xp-required', 'small');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setBonus(bonus, skill) {
        this.percent.textContent = formatPercent(bonus.percent);
        const isActive = skill.getMasteryPoolProgress(bonus.realm) >= bonus.percent;
        const xpRequired = Math.floor((skill.getBaseMasteryPoolCap(bonus.realm) * bonus.percent) / 100);
        toggleDangerSuccess(this.percent, isActive);
        if (isActive) {
            this.xpRequired.textContent = templateLangString('MENU_TEXT_CHECKPOINT_ACTIVE', {
                xp: numberWithCommas(xpRequired),
            });
        } else {
            this.xpRequired.textContent = templateLangString('MENU_TEXT_XP_REMAINING', {
                xpLeft: numberWithCommas(Math.ceil(xpRequired - skill.getMasteryPoolXP(bonus.realm))),
                xp: numberWithCommas(xpRequired),
            });
        }
        this.description.textContent = '';
        this.description.append(...getSpansFromModifierObject(bonus.modifiers));
    }
}
window.customElements.define('mastery-pool-bonus', MasteryPoolBonusElement);
class MasteryPoolBonusesElement extends HTMLElement {
    constructor() {
        super();
        this.bonuses = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('mastery-pool-bonuses-template'));
        this.realmSelect = getElementFromFragment(this._content, 'realm-select', 'realm-tab-select');
        this.bonusContainer = getElementFromFragment(this._content, 'bonus-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setSkill(skill, realm) {
        this.realmSelect.setOptions(skill.getRealmsWithMastery(), (realm) => this.setBonuses(skill, realm), true);
        this.realmSelect.setSelectedRealm(realm);
        this.setBonuses(skill, realm);
    }
    setBonuses(skill, realm) {
        const bonuses = skill.getMasteryPoolBonusesInRealm(realm);
        while (this.bonuses.length < bonuses.length) {
            const newBonus = new MasteryPoolBonusElement();
            newBonus.classList.add('col-12');
            this.bonusContainer.append(newBonus);
            this.bonuses.push(newBonus);
        }
        for (let i = 0; i < bonuses.length; i++) {
            const bonusElem = this.bonuses[i];
            bonusElem.setBonus(bonuses[i], skill);
            showElement(bonusElem);
        }
        for (let i = bonuses.length; i < this.bonuses.length; i++) {
            hideElement(this.bonuses[i]);
        }
    }
}
//# sourceMappingURL=masteryDisplays.js.map
checkFileVersion('?12097')