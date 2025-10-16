"use strict";
class SkillProgressDisplay {
    constructor(game) {
        this.game = game;
        this.elems = new Map();
        game.skills.forEach((skill) => {
            const elems = {
                level: [],
                percent: [],
                xp: [],
                progress: [],
                tooltip: [],
                abyssalLevel: [],
                abyssalPercent: [],
                abyssalXp: [],
                abyssalProgress: [],
                abyssalTooltip: [],
            };
            const levelElem = document.getElementById(`skill-progress-level-${skill.id}`);
            if (levelElem !== null)
                elems.level.push(levelElem);
            const xpElem = document.getElementById(`skill-progress-xp-${skill.id}`);
            if (xpElem !== null)
                elems.xp.push(xpElem);
            const progressElem = document.getElementById(`skill-progress-bar-${skill.id}`);
            if (progressElem !== null)
                elems.progress.push(progressElem);
            const tooltipBar = document.getElementById(`skill-progress-xp-tooltip-${skill.id}`);
            if (tooltipBar !== null) {
                const tooltip = this.createTooltip(tooltipBar, 'Test');
                elems.tooltip.push(tooltip);
            }
            const percent = document.getElementById(`skill-progress-percent-${skill.id}`);
            if (percent !== null)
                elems.percent.push(percent);
            if (skill.hasAbyssalLevels) {
                const abyssalLevelEl = document.getElementById(`skill-abyssal-progress-level-${skill.id}`);
                const abyssalPercentEl = document.getElementById(`skill-abyssal-progress-percent-${skill.id}`);
                const abyssalXpEl = document.getElementById(`skill-abyssal-progress-xp-${skill.id}`);
                const abyssalProgressEl = document.getElementById(`skill-abyssal-progress-bar-${skill.id}`);
                const abyssalTooltipBar = document.getElementById(`skill-abyssal-progress-xp-tooltip-${skill.id}`);
                if (abyssalTooltipBar !== null) {
                    const abyssalTooltip = this.createTooltip(abyssalTooltipBar, 'Test');
                    elems.abyssalTooltip.push(abyssalTooltip);
                }
                if (abyssalLevelEl !== null)
                    elems.abyssalLevel.push(abyssalLevelEl);
                if (abyssalPercentEl !== null)
                    elems.abyssalPercent.push(abyssalPercentEl);
                if (abyssalXpEl !== null)
                    elems.abyssalXp.push(abyssalXpEl);
                if (abyssalProgressEl !== null)
                    elems.abyssalProgress.push(abyssalProgressEl);
            }
            this.elems.set(skill, elems);
        });
    }
    updateXP(skill) {
        const skillElems = this.getSkillElements(skill);
        const xp = skill.xp;
        const level = this.game.settings.showVirtualLevels ? skill.virtualLevel : skill.level;
        let xpText = `${numberWithCommas(Math.floor(xp))}`;
        if (level < skill.currentLevelCap) {
            xpText = `${xpText} / ${numberWithCommas(exp.levelToXP(level + 1))}`;
        }
        const progress = skill.nextLevelProgress;
        skillElems.percent.forEach((elem) => (elem.textContent = formatPercent(Math.floor(progress))));
        skillElems.xp.forEach((elem) => (elem.textContent = xpText));
        skillElems.progress.forEach((elem) => (elem.style.width = `${progress}%`));
        skillElems.tooltip.forEach((elem) => elem.setContent(this.createTooltipHTML(skill)));
    }
    updateLevel(skill) {
        const skillElems = this.getSkillElements(skill);
        const level = this.game.settings.showVirtualLevels ? skill.virtualLevel : skill.level;
        skillElems.level.forEach((elem) => (elem.textContent = `${level} / ${skill.currentLevelCap}`));
    }
    updateAbyssalXP(skill) {
        const skillElems = this.getSkillElements(skill);
        const xp = skill.abyssalXP;
        const level = this.game.settings.showVirtualLevels ? skill.virtualAbyssalLevel : skill.abyssalXP;
        let xpText = `${numberWithCommas(Math.floor(xp))}`;
        if (level < skill.currentAbyssalLevelCap) {
            xpText = `${xpText} / ${numberWithCommas(abyssalExp.levelToXP(level + 1))}`;
        }
        const progress = skill.nextAbyssalLevelProgress;
        skillElems.abyssalPercent.forEach((elem) => (elem.textContent = formatPercent(Math.floor(progress))));
        skillElems.abyssalXp.forEach((elem) => (elem.textContent = xpText));
        skillElems.abyssalProgress.forEach((elem) => (elem.style.width = `${progress}%`));
        skillElems.abyssalTooltip.forEach((elem) => elem.setContent(this.createAyssalTooltipHTML(skill)));
    }
    updateAbyssalLevel(skill) {
        const skillElems = this.getSkillElements(skill);
        const level = this.game.settings.showVirtualLevels ? skill.virtualAbyssalLevel : skill.abyssalLevel;
        skillElems.abyssalLevel.forEach((elem) => (elem.textContent = `${level} / ${skill.currentAbyssalLevelCap}`));
    }
    getSkillElements(skill) {
        const skillElems = this.elems.get(skill);
        if (skillElems === undefined)
            throw new Error(`Tried to update skill progress for invalid skill: ${skill.id}`);
        return skillElems;
    }
    createTooltip(element, content) {
        return tippy(element, {
            content: content,
            allowHTML: true,
            placement: 'top',
            interactive: false,
            animation: false,
        });
    }
    createTooltipHTML(skill) {
        const xp = skill.xp;
        const level = skill.level;
        let xpText;
        if (level >= skill.maxLevelCap)
            xpText = numberWithCommas(Math.floor(xp));
        else
            xpText = numberWithCommas(Math.floor(xp)) + ' / ' + numberWithCommas(exp.levelToXP(level + 1));
        return `<div class='text-center'>${xpText}</div>`;
    }
    createAyssalTooltipHTML(skill) {
        const xp = skill.abyssalXP;
        const level = skill.abyssalLevel;
        let xpText;
        if (level >= skill.maxAbyssalLevelCap)
            xpText = numberWithCommas(Math.floor(xp));
        else
            xpText = numberWithCommas(Math.floor(xp)) + ' / ' + numberWithCommas(abyssalExp.levelToXP(level + 1));
        return `<div class='text-center'>${xpText}</div>`;
    }
}
class SkillSidebarAsideElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('skill-sidebar-aside-template'));
        this.loadingSpinner = getElementFromFragment(this._content, 'loading-spinner', 'span');
        this.lockIcon = getElementFromFragment(this._content, 'lock-icon', 'i');
        this.level = getElementFromFragment(this._content, 'level', 'span');
        this.abyssalLevel = getElementFromFragment(this._content, 'abyssal-level', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setLocked() {
        hideElement(this.loadingSpinner);
        hideElement(this.level);
        hideElement(this.abyssalLevel);
        showElement(this.lockIcon);
    }
    setUnlocked(visibility) {
        hideElement(this.loadingSpinner);
        hideElement(this.lockIcon);
        this.setStandardVisibility(visibility.standard);
        this.setAbyssalVisibility(visibility.abyssal);
    }
    setStandardVisibility(shouldShow) {
        if (shouldShow) {
            showElement(this.level);
        } else {
            hideElement(this.level);
        }
    }
    setAbyssalVisibility(shouldShow) {
        if (shouldShow) {
            showElement(this.abyssalLevel);
        } else {
            hideElement(this.abyssalLevel);
        }
    }
    updateLevel(level, levelCap) {
        if (level >= levelCap) {
            this.level.classList.add('text-warning');
        } else {
            this.level.classList.remove('text-warning');
        }
        this.level.textContent = `(${level} / ${levelCap})`;
    }
    updateAbyssalLevel(level, levelCap) {
        this.abyssalLevel.textContent = `(${level} / ${levelCap})`;
    }
}
window.customElements.define('skill-sidebar-aside', SkillSidebarAsideElement);
class SkillNav {
    constructor(game) {
        this.game = game;
        this.navs = new Map();
        this.active = new Set();
        this.glowing = new Set();
        game.skills.forEach((skill) => {
            const pages = game.getPagesForSkill(skill);
            if (pages === undefined)
                return;
            this.navs.set(skill, pages.map((page) => {
                const category = sidebar.category(page.skillSidebarCategoryID || (page.id === "melvorD:Combat" /* PageIDs.Combat */ ? 'Combat' : 'Non-Combat'));
                const navItem = category.item(skill.id);
                const navAside = navItem.asideEl;
                if (navAside === undefined)
                    throw new Error('Error creating SkillNav, sidebar item does not have aside.');
                const aside = createElement('skill-sidebar-aside', {
                    className: 'justify-vertical-right',
                    parent: navAside,
                });
                const nav = {
                    item: navItem,
                    name: navItem.nameEl,
                    aside,
                };
                return nav;
            }));
        });
    }
    /** Updates the level of a skill */
    updateSkillLevel(skill) {
        const level = this.game.settings.showVirtualLevels ? skill.virtualLevel : skill.level;
        const levelCap = skill.currentLevelCap;
        const navs = this.getNavs(skill);
        navs.forEach((nav) => nav.aside.updateLevel(level, levelCap));
    }
    /** Updates the abyssal level of a skill */
    updateAbyssalSkillLevel(skill) {
        const level = this.game.settings.showVirtualLevels ? skill.virtualAbyssalLevel : skill.abyssalLevel;
        const levelCap = skill.currentAbyssalLevelCap;
        const navs = this.getNavs(skill);
        navs.forEach((nav) => nav.aside.updateAbyssalLevel(level, levelCap));
    }
    /** Updates the lock icon of a skill */
    updateSkillLock(skill) {
        const navs = this.getNavs(skill);
        if (skill.isUnlocked) {
            const visibility = this.getLevelVisibility(skill);
            navs.forEach((nav) => {
                nav.name.classList.remove('text-danger');
                nav.aside.setUnlocked(visibility);
            });
        } else {
            navs.forEach((nav) => {
                nav.name.classList.add('text-danger');
                nav.aside.setLocked();
            });
        }
    }
    updateDisplayedLevels() {
        this.navs.forEach((navs, skill) => {
            if (!skill.isUnlocked)
                return;
            const visibility = this.getLevelVisibility(skill);
            navs.forEach((nav) => {
                nav.aside.setStandardVisibility(visibility.standard);
                nav.aside.setAbyssalVisibility(visibility.abyssal);
            });
        });
    }
    updateLevelVisibility(skill) {
        if (!skill.isUnlocked)
            return;
        const navs = this.getNavs(skill);
        const shouldShow = this.shouldShowStandardLevels(skill);
        navs.forEach((nav) => nav.aside.setStandardVisibility(shouldShow));
    }
    updateAbyssalLevelVisibility(skill) {
        if (!skill.isUnlocked)
            return;
        const navs = this.getNavs(skill);
        const shouldShow = this.shouldShowAbyssalLevels(skill);
        navs.forEach((nav) => nav.aside.setAbyssalVisibility(shouldShow));
    }
    /** Sets a skill as active and highlights it green */
    setActive(skill) {
        const navs = this.getNavs(skill);
        this.active.add(skill);
        navs.forEach((nav) => {
            nav.name.classList.add('text-success');
        });
    }
    /** Sets a skill as inactive and removes its green highlights */
    setInactive(skill) {
        const navs = this.getNavs(skill);
        this.active.delete(skill);
        navs.forEach((nav) => {
            nav.name.classList.remove('text-success');
        });
    }
    setGlowing(skill, shouldGlow) {
        const navs = this.getNavs(skill);
        if (shouldGlow && !this.glowing.has(skill)) {
            navs.forEach(({
                item
            }) => {
                var _a;
                (_a = item.rootEl) === null || _a === void 0 ? void 0 : _a.classList.add('glow-animation');
            });
            this.glowing.add(skill);
        } else if (!shouldGlow && this.glowing.has(skill)) {
            navs.forEach(({
                item
            }) => {
                var _a;
                (_a = item.rootEl) === null || _a === void 0 ? void 0 : _a.classList.remove('glow-animation');
            });
            this.glowing.delete(skill);
        }
    }
    /** Removes grene highlights from all skills */
    setAllInactive() {
        this.active.forEach((skillID) => {
            this.setInactive(skillID);
        });
    }
    getNavs(skill) {
        const navs = this.navs.get(skill);
        if (navs === undefined)
            throw new Error(`Tried to update skill nav for invalid skill: ${skill.id}`);
        return navs;
    }
    shouldShowStandardLevels(skill) {
        return this.game.settings.sidebarLevels !== 2 /* SidebarLevelSetting.Abyssal */ && skill.shouldShowStandardLevels;
    }
    shouldShowAbyssalLevels(skill) {
        return this.game.settings.sidebarLevels !== 1 /* SidebarLevelSetting.Normal */ && skill.shouldShowAbyssalLevels;
    }
    getLevelVisibility(skill) {
        const standard = this.shouldShowStandardLevels(skill);
        const abyssal = this.shouldShowAbyssalLevels(skill);
        return {
            standard,
            abyssal
        };
    }
    updateOpacity(skill, visible) {
        const navs = this.getNavs(skill);
        navs.forEach((nav) => {
            var _a, _b;
            if (visible)
                (_a = nav.item.rootEl) === null || _a === void 0 ? void 0 : _a.classList.remove('opacity-50');
            else
                (_b = nav.item.rootEl) === null || _b === void 0 ? void 0 : _b.classList.add('opacity-50');
        });
    }
}
// skill-progress-xp-tooltip-${id} progressBar for combat
// skill-progress-level-${id} Level progress
// skill-progress-percent-${id} percent for combat
// skill-progress-xp-${id} xp for combat
// skill-progress-bar-${id}: Progress bar (doesn't exist for combat)
// nav-skill-progress-all-${skillID} The (1/99) in the sidebar
// nav-skill-progress-${id} The numerator of progress-all
// Alt-magic is sharing ids
class SkillHeaderElement extends HTMLElement {
    constructor() {
        super();
        this.skillLevelContainers = [];
        this.abyssalLevelContainers = [];
        this.currentHeaderClass = 'bg-dark-bank-block-header';
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('skill-header-template'));
        this.skillProgressBar = getElementFromFragment(this._content, 'skill-progress-bar', 'div');
        this.abyssalProgressBar = getElementFromFragment(this._content, 'abyssal-progress-bar', 'div');
        this.upperContainer = getElementFromFragment(this._content, 'upper-container', 'div');
        this.skillLevel = getElementFromFragment(this._content, 'skill-level', 'span');
        this.skillXp = getElementFromFragment(this._content, 'skill-xp', 'span');
        this.combatLevelXpLimit = getElementFromFragment(this._content, 'combat-level-xp-limit', 'span');
        this.abyssalLevel = getElementFromFragment(this._content, 'abyssal-level', 'span');
        this.abyssalXp = getElementFromFragment(this._content, 'abyssal-xp', 'span');
        this.upgradeChainContainer = getElementFromFragment(this._content, 'upgrade-chain-container', 'div');
        this.itemChargeContainer = getElementFromFragment(this._content, 'item-charge-container', 'div');
        this.lowerContainer = getElementFromFragment(this._content, 'lower-container', 'div');
        this.levelCapButton = getElementFromFragment(this._content, 'level-cap-button', 'level-cap-purchase-button');
        this.abyssalLevelCapButton = getElementFromFragment(this._content, 'abyssal-level-cap-button', 'level-cap-purchase-button');
        this.skillTreeButton = getElementFromFragment(this._content, 'skill-tree-button', 'skill-tree-button');
        this.realmNameDiv = getElementFromFragment(this._content, 'realm-name-div', 'div');
        this.realmName = getElementFromFragment(this._content, 'realm-name', 'h5');
        for (let i = 0; i < 3; i++) {
            this.skillLevelContainers.push(getAnyElementFromFragment(this._content, `skill-level-container-${i}`));
            this.abyssalLevelContainers.push(getAnyElementFromFragment(this._content, `abyssal-level-container-${i}`));
        }
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setSkill(skill) {
        this.levelCapButton.setSkill(skill, 'Standard');
        this.abyssalLevelCapButton.setSkill(skill, 'Abyssal');
        if (skill.hasSkillTree) {
            this.skillTreeButton.setSkill(skill);
            showElement(this.skillTreeButton);
        } else {
            hideElement(this.skillTreeButton);
        }
        if (skill instanceof SkillWithMastery && skill.hasMastery) {
            const masteryOptions = createElement('mastery-skill-options', {
                className: 'px-1'
            });
            this.upperContainer.after(masteryOptions);
            masteryOptions.setSkill(skill);
        }
        if (skill.headerUpgradeChains.length > 0) {
            skill.headerUpgradeChains.forEach((chain) => {
                const chainDisplay = createElement('upgrade-chain-display', {
                    parent: this.upgradeChainContainer
                });
                chainDisplay.setChain(chain);
            });
            showElement(this.upgradeChainContainer);
        } else {
            hideElement(this.upgradeChainContainer);
        }
        if (skill.headerItemCharges.length > 0) {
            skill.headerItemCharges.forEach((item) => {
                const chargeDisplay = createElement('item-charge-display', {
                    parent: this.itemChargeContainer
                });
                chargeDisplay.setItem(item);
            });
            showElement(this.itemChargeContainer);
        } else {
            hideElement(this.itemChargeContainer);
        }
        this.setAttribute('data-init', 'true');
        skill.header = this;
    }
    static initializeForSkill(skill) {
        const headers = document.querySelectorAll(`skill-header[data-skill-id="${skill.id}"]:not([data-init])`);
        headers.forEach((header) => header.setSkill(skill));
    }
    updateXP(game, skill) {
        const xp = skill.xp;
        const level = game.settings.showVirtualLevels ? skill.virtualLevel : skill.level;
        if (level < skill.currentLevelCap) {
            this.skillXp.textContent = `${numberWithCommas(Math.floor(xp))} / ${numberWithCommas(exp.levelToXP(level + 1))}`;
        } else {
            this.skillXp.textContent = `${numberWithCommas(Math.floor(xp))}`;
        }
        const progress = skill.nextLevelProgress;
        this.skillProgressBar.style.width = `${progress}%`;
    }
    updateLevel(game, skill) {
        const level = game.settings.showVirtualLevels ? skill.virtualLevel : skill.level;
        this.skillLevel.textContent = `${level} / ${skill.currentLevelCap}`;
    }
    updateAbyssalXP(game, skill) {
        const xp = skill.abyssalXP;
        const level = game.settings.showVirtualLevels ? skill.virtualAbyssalLevel : skill.abyssalLevel;
        if (level < skill.currentAbyssalLevelCap) {
            this.abyssalXp.textContent = `${numberWithCommas(Math.floor(xp))} / ${numberWithCommas(abyssalExp.levelToXP(level + 1))}`;
        } else {
            this.abyssalXp.textContent = `${numberWithCommas(Math.floor(xp))}`;
        }
        const progress = skill.nextAbyssalLevelProgress;
        this.abyssalProgressBar.style.width = `${progress}%`;
    }
    updateAbyssalLevel(game, skill) {
        const level = game.settings.showVirtualLevels ? skill.virtualAbyssalLevel : skill.abyssalLevel;
        this.abyssalLevel.textContent = `${level} / ${skill.currentAbyssalLevelCap}`;
    }
    toggleCombatLevelCap(show) {
        if (show)
            showElement(this.combatLevelXpLimit);
        else
            hideElement(this.combatLevelXpLimit);
    }
    updateLevelVisibility(skill) {
        if (skill.shouldShowStandardLevels) {
            this.skillLevelContainers.forEach(showElement);
        } else {
            this.skillLevelContainers.forEach(hideElement);
        }
    }
    updateAbyssalLevelVisibility(skill) {
        if (skill.shouldShowAbyssalLevels) {
            this.abyssalLevelContainers.forEach(showElement);
        } else {
            this.abyssalLevelContainers.forEach(hideElement);
        }
    }
    appendUpper(...nodes) {
        this.upperContainer.append(...nodes);
    }
    appendLower(...nodes) {
        this.lowerContainer.append(...nodes);
    }
    updateRealmClass(className) {
        this.realmNameDiv.classList.remove(this.currentHeaderClass);
        this.realmNameDiv.classList.add(className);
        this.currentHeaderClass = className;
    }
    setRealmVisibility(visible) {
        visible ? showElement(this.realmNameDiv) : hideElement(this.realmNameDiv);
    }
    setRealmText(text) {
        this.realmName.textContent = text;
    }
    setRealmClass(realm) {
        this.updateRealmClass(realm.realmClass);
    }
}
window.customElements.define('skill-header', SkillHeaderElement);
class CombatSkillProgressTableRow {
    constructor(body) {
        this.skillLevelContainers = [];
        this.abyssalLevelContainers = [];
        const content = new DocumentFragment();
        content.append(getTemplateNode('combat-skill-progress-table-row-template'));
        this.row = getElementFromFragment(content, 'row', 'tr');
        this.skillImage = getElementFromFragment(content, 'skill-image', 'img');
        for (let i = 0; i < 3; i++) {
            this.skillLevelContainers.push(getAnyElementFromFragment(content, `skill-level-container-${i}`));
            this.abyssalLevelContainers.push(getAnyElementFromFragment(content, `abyssal-level-container-${i}`));
        }
        this.skillLevel = getElementFromFragment(content, 'skill-level', 'small');
        this.abyssalLevel = getElementFromFragment(content, 'abyssal-level', 'small');
        this.skillLevelProgress = getElementFromFragment(content, 'skill-level-progress', 'small');
        this.abyssalLevelProgress = getElementFromFragment(content, 'abyssal-level-progress', 'small');
        this.skillXp = getElementFromFragment(content, 'skill-xp', 'small');
        this.abyssalXp = getElementFromFragment(content, 'abyssal-xp', 'small');
        this.levelCapContainer = getElementFromFragment(content, 'level-cap-container', 'td');
        this.levelCapButton = getElementFromFragment(content, 'level-cap-button', 'level-cap-purchase-button');
        this.abyssalLevelCapButton = getElementFromFragment(content, 'abyssal-level-cap-button', 'level-cap-purchase-button');
        this.skillProgressBarContainer = getElementFromFragment(content, 'skill-progress-bar-container', 'div');
        this.skillProgressBar = getElementFromFragment(content, 'skill-progress-bar', 'div');
        this.abyssalProgressBarContainer = getElementFromFragment(content, 'abyssal-progress-bar-container', 'div');
        this.abyssalProgressBar = getElementFromFragment(content, 'abyssal-progress-bar', 'div');
        this.skillLevelContainers.push(this.skillProgressBarContainer);
        this.abyssalLevelContainers.push(this.abyssalProgressBarContainer);
        body.append(this.row);
    }
    setSkill(skill) {
        this.skillImage.src = skill.media;
        this.levelCapButton.setSkill(skill, 'Standard');
        this.abyssalLevelCapButton.setSkill(skill, 'Abyssal');
    }
    updateXP(game, skill) {
        const xp = skill.xp;
        const level = game.settings.showVirtualLevels ? skill.virtualLevel : skill.level;
        if (level < skill.currentLevelCap) {
            this.skillXp.textContent = `${numberWithCommas(Math.floor(xp))} / ${numberWithCommas(exp.levelToXP(level + 1))}`;
        } else {
            this.skillXp.textContent = `${numberWithCommas(Math.floor(xp))}`;
        }
        const progress = skill.nextLevelProgress;
        this.skillLevelProgress.textContent = formatPercent(Math.floor(progress));
        this.skillProgressBar.style.width = `${progress}%`;
        if (this.skillXPTooltip === undefined)
            this.skillXPTooltip = this.createXPTooltip(this.skillProgressBarContainer);
        this.skillXPTooltip.setContent(`<div class='text-center'>${this.skillXp.textContent}</div>`);
    }
    updateLevel(game, skill) {
        const level = game.settings.showVirtualLevels ? skill.virtualLevel : skill.level;
        this.skillLevel.textContent = `${level} / ${skill.currentLevelCap}`;
    }
    updateAbyssalXP(game, skill) {
        const xp = skill.abyssalXP;
        const level = game.settings.showVirtualLevels ? skill.virtualAbyssalLevel : skill.abyssalLevel;
        if (level < skill.currentAbyssalLevelCap) {
            this.abyssalXp.textContent = `${numberWithCommas(Math.floor(xp))} / ${numberWithCommas(abyssalExp.levelToXP(level + 1))}`;
        } else {
            this.abyssalXp.textContent = `${numberWithCommas(Math.floor(xp))}`;
        }
        const progress = skill.nextAbyssalLevelProgress;
        this.abyssalLevelProgress.textContent = formatPercent(Math.floor(progress));
        this.abyssalProgressBar.style.width = `${progress}%`;
        if (this.abyssalXPTooltip === undefined)
            this.abyssalXPTooltip = this.createXPTooltip(this.abyssalProgressBarContainer);
        this.abyssalXPTooltip.setContent(`<div class='text-center'>${this.abyssalXp.textContent}</div>`);
    }
    updateAbyssalLevel(game, skill) {
        const level = game.settings.showVirtualLevels ? skill.virtualAbyssalLevel : skill.abyssalLevel;
        this.abyssalLevel.textContent = `${level} / ${skill.currentAbyssalLevelCap}`;
    }
    showLevelCapPurchase() {
        showElement(this.levelCapContainer);
    }
    hideLevelCapPurchase() {
        hideElement(this.levelCapContainer);
    }
    updateLevelVisibility(skill) {
        if (skill.shouldShowStandardLevels) {
            this.skillLevelContainers.forEach(showElement);
        } else {
            this.skillLevelContainers.forEach(hideElement);
        }
    }
    updateAbyssalLevelVisibility(skill) {
        if (skill.shouldShowAbyssalLevels) {
            this.abyssalLevelContainers.forEach(showElement);
        } else {
            this.abyssalLevelContainers.forEach(hideElement);
        }
    }
    destroy() {
        var _a, _b;
        (_a = this.skillXPTooltip) === null || _a === void 0 ? void 0 : _a.destroy();
        (_b = this.abyssalXPTooltip) === null || _b === void 0 ? void 0 : _b.destroy();
        this.skillXPTooltip = undefined;
        this.abyssalXPTooltip = undefined;
    }
    createXPTooltip(element) {
        return tippy(element, {
            allowHTML: true,
            placement: 'top',
            interactive: false,
            animation: false,
        });
    }
}
class CombatSkillProgressTableElement extends HTMLElement {
    constructor() {
        super();
        this.tableRows = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('combat-skill-progress-table-template'));
        this.levelCapHeader = getElementFromFragment(this._content, 'level-cap-header', 'th');
        this.tableBody = getElementFromFragment(this._content, 'table-body', 'tbody');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    disconnectedCallback() {
        this.tableRows.forEach((row) => row.destroy());
    }
    initialize(game) {
        game.skills.forEach((skill) => {
            if (skill.isCombat) {
                const row = new CombatSkillProgressTableRow(this.tableBody);
                row.setSkill(skill);
                this.tableRows.set(skill, row);
            }
        });
    }
    updateLevelCapButtons(game) {
        if (game.currentGamemode.levelCapCost !== undefined || game.currentGamemode.abyssalLevelCapCost !== undefined) {
            showElement(this.levelCapHeader);
            this.tableRows.forEach((row) => row.showLevelCapPurchase());
        } else {
            hideElement(this.levelCapHeader);
            this.tableRows.forEach((row) => row.hideLevelCapPurchase());
        }
    }
    updateXP(game, skill) {
        const row = this.tableRows.get(skill);
        if (row === undefined)
            return;
        row.updateXP(game, skill);
    }
    updateLevel(game, skill) {
        const row = this.tableRows.get(skill);
        if (row === undefined)
            return;
        row.updateLevel(game, skill);
    }
    updateAbyssalXP(game, skill) {
        const row = this.tableRows.get(skill);
        if (row === undefined)
            return;
        row.updateAbyssalXP(game, skill);
    }
    updateAbyssalLevel(game, skill) {
        const row = this.tableRows.get(skill);
        if (row === undefined)
            return;
        row.updateAbyssalLevel(game, skill);
    }
    updateLevelVisibility(skill) {
        var _a;
        (_a = this.tableRows.get(skill)) === null || _a === void 0 ? void 0 : _a.updateLevelVisibility(skill);
    }
    updateAbyssalLevelVisibility(skill) {
        var _a;
        (_a = this.tableRows.get(skill)) === null || _a === void 0 ? void 0 : _a.updateAbyssalLevelVisibility(skill);
    }
}
window.customElements.define('combat-skill-progress-table', CombatSkillProgressTableElement);
//# sourceMappingURL=skillNav.js.map
checkFileVersion('?12097')