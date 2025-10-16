"use strict";
class LangStringElement extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.updateTranslation();
    }
    updateTranslation() {
        const id = this.getAttribute('lang-id');
        const useHTML = this.hasAttribute('lang-html');
        if (id === null) {
            this.textContent = 'Language ID Undefined';
        } else if (useHTML) {
            this.innerHTML = getLangString(`${id}`);
        } else {
            this.textContent = getLangString(`${id}`);
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        this.updateTranslation();
    }
    static get observedAttributes() {
        return ['lang-id'];
    }
}
class ItemChargeDisplayElement extends HTMLElement {
    constructor() {
        super();
        this.initialized = false;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('item-charge-display-template'));
        this.itemImage = getElementFromFragment(this._content, 'item-image', 'img');
        this.itemCharges = getElementFromFragment(this._content, 'item-charges', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.itemTooltip = tippy(this.itemImage, {
            content: '',
            allowHTML: true,
            placement: 'bottom',
            interactive: false,
            animation: false,
        });
    }
    disconnectedCallback() {
        if (this.itemTooltip !== undefined) {
            this.itemTooltip.destroy();
            this.itemTooltip = undefined;
        }
    }
    setInitialized() {
        this.initialized = true;
    }
    setItem(item) {
        var _a;
        this.setAttribute('data-item-id', item.id);
        this.itemImage.src = item.media;
        (_a = this.itemTooltip) === null || _a === void 0 ? void 0 : _a.setContent(item.modifiedDescription);
    }
    updateCharges(charges) {
        this.itemCharges.textContent = templateLangString('MENU_TEXT_CURRENT_CHARGES', {
            count: numberWithCommas(charges),
        });
        if (charges <= 0) {
            this.itemCharges.classList.replace('text-success', 'text-danger');
        } else {
            this.itemCharges.classList.replace('text-danger', 'text-success');
        }
    }
}
window.customElements.define('item-charge-display', ItemChargeDisplayElement);
class SettingsCheckboxElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('settings-checkbox-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.label = getElementFromFragment(this._content, 'label', 'label');
        this.input = getElementFromFragment(this._content, 'input', 'input');
        const id = `settings-checkbox-${SettingsCheckboxElement.elementCount}`;
        this.input.id = id;
        this.label.htmlFor = id;
        SettingsCheckboxElement.elementCount++;
        if (this.hasAttribute('data-inline'))
            this.container.classList.add('form-check-inline');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'data-inline':
                if (newValue !== null) {
                    this.container.classList.add('form-check-inline');
                } else {
                    this.container.classList.remove('form-check-inline');
                }
                break;
            default:
                console.warn('Unknown attribute changed.');
        }
    }
    initialize(data, onChange) {
        this.setChecked(data.currentValue);
        this.label.innerHTML = data.name;
        this.input.onchange = onChange;
        this.setAttribute('data-init', 'true');
    }
    setChecked(isChecked) {
        this.input.checked = isChecked;
    }
}
SettingsCheckboxElement.elementCount = 0;
SettingsCheckboxElement.observedAttributes = ['data-inline'];
window.customElements.define('settings-checkbox', SettingsCheckboxElement);
class SettingsSwitchElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('settings-switch-template'));
        this.label = getElementFromFragment(this._content, 'label', 'label');
        this.input = getElementFromFragment(this._content, 'input', 'input');
        this.control = getElementFromFragment(this._content, 'control', 'div');
        const id = `settings-switch-${SettingsSwitchElement.elementCount}`;
        this.input.id = id;
        this.label.htmlFor = id;
        SettingsSwitchElement.elementCount++;
        // Set size
        const size = this.getAttribute('data-size');
        if (size === null)
            this.setAttribute('data-size', 'small');
        else
            this.attributeChangedCallback('data-size', null, size);
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    initialize(data, onChange) {
        this.setChecked(data.currentValue);
        this.setLabel(data.name, this.getAttribute('data-size'));
        this.input.onchange = onChange;
        this.setAttribute('data-init', 'true');
    }
    setChecked(isChecked) {
        this.input.checked = isChecked;
    }
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'data-size':
                switch (newValue) {
                    case 'small':
                    case 'large':
                        this.setSize(oldValue, newValue);
                        break;
                }
                break;
        }
    }
    setLabel(labelHTML, size) {
        switch (size) {
            case 'small':
                this.label.innerHTML = `<small>${labelHTML}</small>`;
                break;
            default:
                this.label.innerHTML = labelHTML;
        }
    }
    setSize(oldSize, newSize) {
        if (this.getAttribute('data-init')) {
            let oldHTML = this.label.innerHTML;
            if (oldSize === 'small') {
                const innerMatch = oldHTML.match(/^<small>(.*?)<\/small>$/);
                if (innerMatch === null)
                    throw new Error('Error setting size');
                oldHTML = innerMatch[1];
            }
            this.setLabel(oldHTML, newSize);
        }
        switch (newSize) {
            case 'small':
                this.control.classList.remove('custom-control-lg');
                this.label.classList.add('font-w400');
                break;
            case 'large':
                this.control.classList.add('custom-control-lg');
                this.label.classList.remove('font-w400');
                break;
        }
    }
    static get observedAttributes() {
        return ['data-size'];
    }
}
SettingsSwitchElement.elementCount = 0;
window.customElements.define('settings-switch', SettingsSwitchElement);
class SettingsDropdownElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('settings-dropdown-template'));
        this.dropdownButton = getElementFromFragment(this._content, 'dropdown-button', 'button');
        this.optionsContainer = getElementFromFragment(this._content, 'options-container', 'div');
        this.label = getElementFromFragment(this._content, 'label', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    initialize(data, onChange) {
        this.label.innerHTML = data.name;
        data.options.forEach((option) => {
            const item = createElement('a', {
                className: 'dropdown-item pointer-enabled'
            });
            item.onclick = () => onChange(option.value);
            this.appendOptionToElement(option, item);
            this.optionsContainer.append(item);
        });
        this.setAttribute('data-init', 'true');
    }
    appendOptionToElement(option, element) {
        element.innerHTML = option.name;
        if (option.media !== undefined) {
            const image = createElement('img', {
                className: 'skill-icon-sm m-0',
                attributes: [
                    ['src', option.media]
                ]
            });
            element.prepend(image, ' ');
        }
    }
    updateValue(newOption) {
        this.appendOptionToElement(newOption, this.dropdownButton);
    }
}
window.customElements.define('settings-dropdown', SettingsDropdownElement);
class UpgradeChainDisplayElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('upgrade-chain-display-template'));
        this.chainName = getElementFromFragment(this._content, 'chain-name', 'span');
        this.upgradeImg = getElementFromFragment(this._content, 'upgrade-img', 'img');
        this.upgradeName = getElementFromFragment(this._content, 'upgrade-name', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.descriptionTooltip = tippy(this.upgradeImg, {
            allowHTML: true,
            placement: 'bottom',
            interactive: false,
            animation: false,
        });
    }
    disconnectedCallback() {
        if (this.descriptionTooltip !== undefined) {
            this.descriptionTooltip.destroy();
            this.descriptionTooltip = undefined;
        }
    }
    initialize(game) {
        const chainID = this.getAttribute('data-upgrade-chain-id');
        if (chainID === null)
            throw new Error('data-upgrade-chain-id attribute not set.');
        const chain = game.shop.upgradeChains.getObjectSafe(chainID);
        this.setChain(chain);
    }
    setChain(chain) {
        this.chainName.textContent = chain.chainName;
        this.upgradeImg.src = chain.media;
        this.setAttribute('data-upgrade-chain-id', chain.id);
        this.setAttribute('data-init', 'true');
    }
    setUpgrade(name, description, media) {
        var _a;
        this.upgradeName.textContent = name;
        this.upgradeImg.src = media;
        (_a = this.descriptionTooltip) === null || _a === void 0 ? void 0 : _a.setContent(`<div class="text-center"><span class="font-w600 text-warning">${name}</span><br>${description}</div>`);
    }
    static initializeAll(game) {
        const chainDisplays = document.querySelectorAll(`upgrade-chain-display:not([data-init])`);
        chainDisplays.forEach((chainDisplay) => {
            chainDisplay.initialize(game);
        });
    }
}
window.customElements.define('upgrade-chain-display', UpgradeChainDisplayElement);
class SkillMilestoneDisplayElement extends HTMLElement {
    constructor() {
        super();
        this.levelMode = 'Standard';
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('skill-milestone-display-template'));
        this.block = getElementFromFragment(this._content, 'block', 'div');
        this.skillName = getElementFromFragment(this._content, 'skill-name', 'h3');
        this.levelOptions = getElementFromFragment(this._content, 'level-options', 'div');
        this.standardTab = getElementFromFragment(this._content, 'standard-tab', 'a');
        this.abyssalTab = getElementFromFragment(this._content, 'abyssal-tab', 'a');
        this.noMilestoneNotice = getElementFromFragment(this._content, 'no-milestone-notice', 'dd');
        this.levelText = getElementFromFragment(this._content, 'level-text', 'th');
        this.milestoneContainer = getElementFromFragment(this._content, 'milestone-container', 'tbody');
        this.standardTab.onclick = () => this.changeTab('Standard');
        this.abyssalTab.onclick = () => this.changeTab('Abyssal');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setSkill(skill) {
        if (this.skill)
            this.block.classList.remove(`border-${this.skill.localID}`);
        this.skill = skill;
        this.skillName.textContent = skill.name;
        skill.abyssalMilestones.length > 0 ? showElement(this.levelOptions) : hideElement(this.levelOptions);
        skill.milestones.length <= 0 && skill.abyssalMilestones.length > 0 ?
            this.setLevelMode('Abyssal') :
            this.setLevelMode('Standard');
        this.updateMilestones();
    }
    updateMilestones() {
        this.milestoneContainer.textContent = '';
        if (this.skill === undefined)
            return;
        let skillLevel;
        switch (this.levelMode) {
            case 'Standard':
                skillLevel = this.skill.level;
                this.levelText.textContent = getLangString('MENU_TEXT_LEVEL_HEADER');
                this.skill.milestones.forEach((milestone) => {
                    this.createMilestone(milestone.level, skillLevel, milestone);
                });
                this.skill.milestones.length <= 0 ? showElement(this.noMilestoneNotice) : hideElement(this.noMilestoneNotice);
                break;
            case 'Abyssal':
                skillLevel = this.skill.abyssalLevel;
                this.levelText.textContent = getLangString('ABYSSAL_LEVEL');
                this.skill.abyssalMilestones.forEach((milestone) => {
                    this.createMilestone(milestone.abyssalLevel, skillLevel, milestone);
                });
                hideElement(this.noMilestoneNotice);
                break;
        }
    }
    createMilestone(level, skillLevel, milestone) {
        const row = createElement('tr', {
            parent: this.milestoneContainer
        });
        createElement('th', {
            text: `${level}`,
            className: `text-center${skillLevel >= level ? ' bg-success text-gray-lighter' : ''}`,
            attributes: [
                ['scope', 'row']
            ],
            parent: row,
        });
        const td = createElement('td', {
            className: 'font-w600 font-size-sm',
            parent: row
        });
        createElement('img', {
            className: 'milestone-icon',
            attributes: [
                ['src', milestone.media]
            ],
            parent: td
        });
        td.append(milestone.name);
    }
    setLevelMode(levelMode) {
        if (this.levelMode === levelMode)
            return;
        const oldTab = this.getTabForMode(this.levelMode);
        oldTab.classList.remove('active');
        oldTab.removeAttribute('aria-selected');
        const newTab = this.getTabForMode(levelMode);
        newTab.classList.add('active');
        newTab.setAttribute('aria-selected', 'true');
        this.levelMode = levelMode;
    }
    changeTab(levelMode) {
        this.setLevelMode(levelMode);
        this.updateMilestones();
    }
    getTabForMode(levelMode) {
        switch (levelMode) {
            case 'Standard':
                return this.standardTab;
            case 'Abyssal':
                return this.abyssalTab;
        }
    }
}
class CharacterResistanceElement extends HTMLElement {
    constructor(damageType) {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('character-resistance-template'));
        this.name = getElementFromFragment(this._content, 'name', 'span');
        this.media = getElementFromFragment(this._content, 'media', 'img');
        this.resistanceDiv = getElementFromFragment(this._content, 'resistance-div', 'div');
        this.resistance = getElementFromFragment(this._content, 'resistance', 'span');
        this.resistanceDiff = getElementFromFragment(this._content, 'resistance-diff', 'span');
        this.classList.add('row');
        this.initialize(damageType);
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    initialize(damageType) {
        this.name.textContent = damageType.resistanceName;
        this.media.src = damageType.media;
        this.updateResistanceValue(0);
        this.toggleResistanceView(!damageType.onlyShowIfUsing);
    }
    showResistanceDiff() {
        showElement(this.resistanceDiff);
    }
    hideResistanceDiff() {
        hideElement(this.resistanceDiff);
    }
    updateResistanceDiff(diff) {
        this.resistanceDiff.textContent = diff > 0 ? `+${formatPercent(diff)}` : `${formatPercent(diff)}`;
        if (diff > 0) {
            this.resistanceDiff.classList.replace('text-danger', 'text-success');
        } else if (diff < 0) {
            this.resistanceDiff.classList.replace('text-success', 'text-danger');
        }
    }
    updateResistanceSpan(value) {
        if (value > 0) {
            this.resistance.classList.remove('text-combat-smoke');
            this.resistance.classList.add('text-success');
            this.resistance.classList.remove('text-danger');
        } else {
            this.resistance.classList.remove('text-combat-smoke');
            this.resistance.classList.remove('text-success');
            this.resistance.classList.add('text-danger');
        }
    }
    updateResistanceValue(value) {
        this.resistance.textContent = formatPercent(value);
    }
    setAsActiveResistance() {
        this.resistance.classList.remove('text-combat-smoke');
        this.resistance.classList.add('text-success');
        this.name.classList.remove('text-combat-smoke');
        this.name.classList.add('text-success');
    }
    removeAsActiveResistance() {
        this.resistance.classList.add('text-combat-smoke');
        this.resistance.classList.remove('text-success');
        this.name.classList.add('text-combat-smoke');
        this.name.classList.remove('text-success');
    }
    renderNoResistance() {
        this.resistance.textContent = '-';
    }
    replaceResistanceDivClass(className, newClassName) {
        this.resistanceDiv.classList.replace(className, newClassName);
    }
    setIconClass(className) {
        this.media.className = className;
    }
    showResistance() {
        showElement(this);
    }
    hideResistance() {
        hideElement(this);
    }
    toggleResistanceView(show) {
        if (show) {
            this.showResistance();
        } else {
            this.hideResistance();
        }
    }
}
window.customElements.define('character-resistance', CharacterResistanceElement);
//# sourceMappingURL=components.js.map
checkFileVersion('?12097')