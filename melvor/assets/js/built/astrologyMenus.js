"use strict";
// Components for the Astrology Skill Page
/** Component for individual constellations */
class ConstellationMenuElement extends HTMLElement {
    //private viewModifierButton: HTMLButtonElement;
    constructor() {
        super();
        this.stardustIcons = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('constellation-menu-template'));
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.name = getElementFromFragment(this._content, 'name', 'h4');
        this.skillIcons = getElementFromFragment(this._content, 'skill-icons', 'div');
        this.skillIcon0 = getElementFromFragment(this._content, 'skill-icon-0', 'img');
        this.xpIcon = getElementFromFragment(this._content, 'xp-icon', 'xp-icon');
        this.abyssalXPIcon = getElementFromFragment(this._content, 'abyssal-xp-icon', 'abyssal-xp-icon');
        this.masteryIcon = getElementFromFragment(this._content, 'mastery-icon', 'mastery-xp-icon');
        this.masteryPoolIcon = getElementFromFragment(this._content, 'mastery-pool-icon', 'mastery-pool-icon');
        this.intervalIcon = getElementFromFragment(this._content, 'interval-icon', 'interval-icon');
        this.rewardsContainer = getElementFromFragment(this._content, 'rewards-container', 'div');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'progress-bar');
        this.studyButton = getElementFromFragment(this._content, 'study-button', 'button');
        this.exploreButton = getElementFromFragment(this._content, 'explore-button', 'button');
        this.masteryDisplay = getElementFromFragment(this._content, 'mastery-display', 'mastery-display');
        this.stardustBreakdown = getElementFromFragment(this._content, 'stardust-breakdown', 'div');
        //this.viewModifierButton = getElementFromFragment(this._content, 'view-modifier-button', 'button');
        this.exploreButton.textContent = getLangString('ASTROLOGY_BTN_1');
        hideElement(this.abyssalXPIcon);
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.progressBar.setStyle('bg-secondary');
    }
    initIcons(game) {
        game.astrology.baseRandomItemChances.forEach((_, item) => {
            const icon = createElement('item-current-icon', {
                parent: this.stardustBreakdown
            });
            icon.setItem(item, 0, game, false);
            this.stardustIcons.push(icon);
        });
    }
    /** Sets the display to a given constellation */
    setConstellation(constellation) {
        this.image.src = constellation.media;
        this.image.id = `astro-const-${constellation.id}`;
        this.name.textContent = constellation.name;
        this.skillIcons.innerHTML = '';
        constellation.skills.forEach((skill) => {
            this.skillIcon0.src = skill.media;
            this.skillIcons.append(this.skillIcon0.cloneNode(true));
        });
        this.masteryDisplay.setMastery(game.astrology, constellation);
        this.studyButton.onclick = () => game.astrology.studyConstellationOnClick(constellation);
        this.exploreButton.onclick = () => game.astrology.exploreConstellationOnClick(constellation);
        this.setRewardIcons(constellation);
        this.stardustIcons.forEach((icon) => {
            if (icon.item !== undefined && constellation.randomItems.includes(icon.item)) {
                showElement(icon);
            } else {
                hideElement(icon);
            }
        });
        //this.viewModifierButton.onclick = () => game.astrology.viewPossibleModifiersOnClick(constellation);
    }
    setRewardIcons(constellation) {
        constellation.randomItems.forEach((item) => {
            this.createRewardItemIcon(item);
        });
        if (constellation.canLocateMeteorite) {
            this.createRewardGenericIcon(assets.getURI('assets/media/skills/astrology/meteorite.png'), getLangString('ASTROLOGY_METEORITE'));
        }
        if (constellation.canLocateStarfalls) {
            this.createRewardGenericIcon(assets.getURI('assets/media/skills/astrology/starfall.png'), getLangString('ASTROLOGY_STARFALLS'));
        }
    }
    createRewardItemIcon(item) {
        const img = createElement('img', {
            className: 'skill-icon-xs my-2 mx-1'
        });
        img.src = item.media;
        this.rewardsContainer.append(img);
        tippy(img, {
            content: item.name,
            allowHTML: false,
            placement: 'bottom',
            interactive: false,
            animation: false,
        });
    }
    createRewardGenericIcon(media, name) {
        const img = createElement('img', {
            className: 'skill-icon-xs my-2 mx-1'
        });
        img.src = media;
        this.rewardsContainer.append(img);
        tippy(img, {
            content: name,
            allowHTML: false,
            placement: 'bottom',
            interactive: false,
            animation: false,
        });
    }
    /** Updates the XP, Mastery XP, Mastery Pool XP and interval icons */
    updateGrants(xp, baseXP, masteryXP, baseMasteryXP, masteryPoolXP, interval, constellation) {
        this.xpIcon.setXP(xp, baseXP);
        this.xpIcon.setSources(game.astrology.getXPSources(constellation));
        this.masteryIcon.setXP(masteryXP, baseMasteryXP);
        this.masteryIcon.setSources(game.astrology.getMasteryXPSources(constellation));
        this.masteryPoolIcon.setXP(masteryPoolXP);
        game.unlockedRealms.length > 1 ?
            this.masteryPoolIcon.setRealm(constellation.realm) :
            this.masteryPoolIcon.hideRealms();
        this.intervalIcon.setInterval(interval, game.astrology.getIntervalSources(constellation));
        this.abyssalXPIcon.setSources(game.astrology.getAbyssalXPSources(constellation));
    }
    /** Updates the Abyssal XP */
    updateAbyssalGrants(xp, baseXP) {
        this.abyssalXPIcon.setXP(xp, baseXP);
        if (baseXP > 0)
            showElement(this.abyssalXPIcon);
        else
            hideElement(this.abyssalXPIcon);
    }
    /** Updates the stardust quantities */
    updateQuantities(game) {
        this.stardustIcons.forEach((icon) => {
            icon.updateQuantity(game.bank);
        });
    }
    /** Sets the constellation to the explored state */
    setExplored() {
        showElement(this.stardustBreakdown);
        this.exploreButton.textContent = getLangString('ASTROLOGY_BTN_2');
    }
    /** Sets the constellation to the un-explored state */
    setUnexplored() {
        hideElement(this.stardustBreakdown);
        this.exploreButton.textContent = getLangString('ASTROLOGY_BTN_1');
    }
}
window.customElements.define('constellation-menu', ConstellationMenuElement);
/** Component for displaying a locked constellation */
class LockedConstellationMenuElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('locked-constellation-menu-template'));
        this.level = getElementFromFragment(this._content, 'level', 'span');
        this.abyssalLevel = getElementFromFragment(this._content, 'abyssal-level', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setConstellation(constellation, astrology) {
        this.level.textContent = templateLangString('MENU_TEXT_LEVEL', {
            level: `${constellation.level}`,
        });
        if (astrology.level >= constellation.level) {
            this.level.classList.replace('badge-danger', 'badge-success');
        } else {
            this.level.classList.replace('badge-success', 'badge-danger');
        }
        if (constellation.abyssalLevel >= 1) {
            this.abyssalLevel.textContent = templateLangString('MENU_TEXT_ABYSSAL_LEVEL', {
                level: `${constellation.abyssalLevel}`,
            });
            if (astrology.abyssalLevel >= constellation.abyssalLevel) {
                this.abyssalLevel.classList.replace('badge-danger', 'badge-success');
            } else {
                this.abyssalLevel.classList.replace('badge-success', 'badge-danger');
            }
            showElement(this.abyssalLevel);
        } else {
            hideElement(this.abyssalLevel);
        }
    }
}
window.customElements.define('locked-constellation-menu', LockedConstellationMenuElement);
/** Component for displaying standard/unique modifiers, with a reroll button
 *  For usage in the AstrologyExplorationPanel component
 */
class AstrologyModifierDisplayElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('astrology-modifier-display-template'));
        this.starImage = getElementFromFragment(this._content, 'star-image', 'img');
        this.modifierContainer = getElementFromFragment(this._content, 'modifier-container', 'div');
        this.modifierText = getElementFromFragment(this._content, 'modifier-text', 'h5');
        this.upgradeButton = getElementFromFragment(this._content, 'upgrade-button', 'button');
        this.starDustImage = getElementFromFragment(this._content, 'stardust-image', 'img');
        this.starDustQuantity = getElementFromFragment(this._content, 'stardust-quantity', 'span');
        this.modifierProgress = getElementFromFragment(this._content, 'modifier-progress', 'ul');
        this.modifierStatus = {
            locked: getElementFromFragment(this._content, 'modifier-progress-locked', 'li'),
            active: getElementFromFragment(this._content, 'modifier-progress-active', 'li'),
            inactive: getElementFromFragment(this._content, 'modifier-progress-inactive', 'li'),
        };
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /** Sets the display to a standard modifier */
    setStandard() {
        this.starImage.src = assets.getURI('assets/media/skills/astrology/star_standard.png');
        this.modifierContainer.classList.replace('border-warning', 'border-info');
        this.starDustImage.src = assets.getURI("assets/media/bank/stardust.png" /* Assets.Stardust */ );
    }
    /** Sets the display to a unique modifier */
    setUnique() {
        this.starImage.src = assets.getURI('assets/media/skills/astrology/star_unique.png');
        this.modifierContainer.classList.replace('border-info', 'border-warning');
        this.starDustImage.src = assets.getURI("assets/media/bank/golden_stardust.png" /* Assets.GoldenStardust */ );
    }
    /** Sets the display to a abyssal modifier */
    setAbyssal() {
        this.starImage.src = assets.getURI('assets/media/skills/astrology/star_abyssal.png');
        this.modifierContainer.classList.replace('border-info', 'border-danger');
        this.starDustImage.src = assets.getURI('assets/media/bank/Abyssal_Stardust.png');
    }
    /** Sets the modifier text to mastery locked */
    setMasteryLocked(level) {
        this.modifierText.textContent = templateLangString('MENU_TEXT_TOOLTIP_MASTERY_UNLOCK', {
            level: `${level}`
        });
    }
    /** Sets the modifier text to mastery locked */
    setLocked(reqs) {
        this.modifierText.innerHTML = printAllUnlockRequirementsAsHTML(reqs).join('');
    }
    /** Sets the modifier text to the given description (and green) */
    setModifier(astroMod, mult) {
        this.modifierText.textContent = '';
        this.modifierText.append(...StatObject.formatDescriptions(astroMod.stats, getElementDescriptionFormatter('div', 'mb-1'), mult, mult));
    }
    setModifierStatus(buyCount, data) {
        this.modifierProgress.innerHTML = '';
        for (let i = 0; i < data.maxCount; i++) {
            if (i < buyCount) {
                this.modifierProgress.append(this.modifierStatus.active.cloneNode(true));
            } else {
                this.modifierProgress.append(this.modifierStatus.inactive.cloneNode(true));
            }
        }
    }
    setModifierStatusLocked(data) {
        this.modifierProgress.innerHTML = '';
        for (let i = 0; i < data.maxCount; i++) {
            this.modifierProgress.append(this.modifierStatus.inactive.cloneNode(true));
        }
    }
    updateCost(astrology, constellation, astroMod) {
        if (astroMod.isMaxed) {
            this.hideUpgradeButton();
        } else {
            const cost = astrology.getAstroModUpgradeCost(constellation, astroMod);
            this.showUpgradeButton();
            this.setDustQuantity(cost.quantity);
        }
    }
    /** Sets the quantity of stardust required to reroll */
    setDustQuantity(quantity) {
        this.starDustQuantity.textContent = formatNumber(quantity);
    }
    /** Sets the onclick callback function of the reroll button */
    setUpgradeCallback(callback) {
        this.upgradeButton.onclick = callback;
    }
    /** Hides the upgrade button when max level is reached */
    hideUpgradeButton() {
        this.upgradeButton.classList.add('d-none');
    }
    /** Shows the upgrade button when max level is reached */
    showUpgradeButton() {
        this.upgradeButton.classList.remove('d-none');
    }
}
window.customElements.define('astrology-modifier-display', AstrologyModifierDisplayElement);
/** Component for showing an explored constellation in Astrology */
class AstrologyExplorationPanelElement extends HTMLElement {
    constructor() {
        super();
        this.standardModifiers = [];
        this.uniqueModifiers = [];
        this.abyssalModifiers = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('astrology-exploration-panel-template'));
        this.standardModifierContainer = getElementFromFragment(this._content, 'standard-modifier-container', 'div');
        this.uniqueModifierContainer = getElementFromFragment(this._content, 'unique-modifier-container', 'div');
        this.abyssalModifierContainer = getElementFromFragment(this._content, 'abyssal-modifier-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setMaxStandardMods(amount) {
        while (this.standardModifiers.length < amount) {
            const newModifierDisplay = createElement('astrology-modifier-display', {
                className: 'col-12 p-2',
                parent: this.standardModifierContainer,
            });
            newModifierDisplay.setStandard();
            this.standardModifiers.push(newModifierDisplay);
        }
        while (this.standardModifiers.length > amount) {
            const oldDisplay = this.standardModifiers.pop();
            if (oldDisplay !== undefined)
                this.standardModifierContainer.removeChild(oldDisplay);
        }
    }
    setMaxUniqueMods(amount) {
        while (this.uniqueModifiers.length < amount) {
            const newModifierDisplay = createElement('astrology-modifier-display', {
                className: 'col-12 p-2',
                parent: this.uniqueModifierContainer,
            });
            newModifierDisplay.setUnique();
            this.uniqueModifiers.push(newModifierDisplay);
        }
        while (this.uniqueModifiers.length > amount) {
            const oldDisplay = this.uniqueModifiers.pop();
            if (oldDisplay !== undefined)
                this.uniqueModifierContainer.removeChild(oldDisplay);
        }
    }
    setMaxAbyssalMods(amount) {
        while (this.abyssalModifiers.length < amount) {
            const newModifierDisplay = createElement('astrology-modifier-display', {
                className: 'col-12 p-2',
                parent: this.abyssalModifierContainer,
            });
            newModifierDisplay.setAbyssal();
            this.abyssalModifiers.push(newModifierDisplay);
        }
        while (this.abyssalModifiers.length > amount) {
            const oldDisplay = this.abyssalModifiers.pop();
            if (oldDisplay !== undefined)
                this.abyssalModifierContainer.removeChild(oldDisplay);
        }
    }
    /** Sets upgrade costs for all buttons in constellation */
    setUpgradeCosts(astrology, constellation) {
        this.standardModifiers.forEach((_, id) => {
            if (constellation.standardModifiers[id] !== undefined)
                this.setStandardUpgradeCost(astrology, constellation, id);
        });
        this.uniqueModifiers.forEach((_, id) => {
            if (constellation.uniqueModifiers[id] !== undefined)
                this.setUniqueUpgradeCost(astrology, constellation, id);
        });
        this.abyssalModifiers.forEach((_, id) => {
            if (constellation.abyssalModifiers[id] !== undefined)
                this.setAbyssalUpgradeCost(astrology, constellation, id);
        });
    }
    /** Sets upgrade cost for specific standard star in constellation */
    setStandardUpgradeCost(astrology, constellation, modID) {
        this.standardModifiers[modID].updateCost(astrology, constellation, constellation.standardModifiers[modID]);
    }
    /** Sets upgrade cost for specific unique star in constellation */
    setUniqueUpgradeCost(astrology, constellation, modID) {
        this.uniqueModifiers[modID].updateCost(astrology, constellation, constellation.uniqueModifiers[modID]);
    }
    /** Sets upgrade cost for specific abyssal star in constellation */
    setAbyssalUpgradeCost(astrology, constellation, modID) {
        this.abyssalModifiers[modID].updateCost(astrology, constellation, constellation.abyssalModifiers[modID]);
    }
    /** Sets the callbacks of all buttons to the given constellation */
    setConstellation(constellation) {
        this.standardModifiers.forEach((modifier, id) => {
            modifier.setUpgradeCallback(() => game.astrology.upgradeStandardModifier(constellation, id));
        });
        this.uniqueModifiers.forEach((modifier, id) => {
            modifier.setUpgradeCallback(() => game.astrology.upgradeUniqueModifier(constellation, id));
        });
        this.abyssalModifiers.forEach((modifier, id) => {
            modifier.setUpgradeCallback(() => game.astrology.upgradeAbyssalModifier(constellation, id));
        });
    }
    setStandardModifier(id, astroMod, mult) {
        this.standardModifiers[id].setModifier(astroMod, mult);
    }
    setStandardModifierStatus(id, buyCount, data) {
        this.standardModifiers[id].setModifierStatus(buyCount, data);
    }
    setStandardLocked(id, reqs) {
        this.standardModifiers[id].setLocked(reqs);
    }
    setStandardLockedStatus(id, data) {
        this.standardModifiers[id].setModifierStatusLocked(data);
    }
    setStandardHidden(id) {
        hideElement(this.standardModifiers[id]);
    }
    setStandardShow(id) {
        showElement(this.standardModifiers[id]);
    }
    setUniqueModifier(id, astroMod, mult) {
        this.uniqueModifiers[id].setModifier(astroMod, mult);
    }
    setUniqueModifierStatus(id, buyCount, data) {
        this.uniqueModifiers[id].setModifierStatus(buyCount, data);
    }
    setUniqueLocked(id, reqs) {
        this.uniqueModifiers[id].setLocked(reqs);
    }
    setUniqueLockedStatus(id, data) {
        this.uniqueModifiers[id].setModifierStatusLocked(data);
    }
    setUniqueHidden(id) {
        hideElement(this.uniqueModifiers[id]);
    }
    setUniqueShow(id) {
        showElement(this.uniqueModifiers[id]);
    }
    setAbyssalModifier(id, astroMod, mult) {
        this.abyssalModifiers[id].setModifier(astroMod, mult);
    }
    setAbyssalModifierStatus(id, buyCount, data) {
        this.abyssalModifiers[id].setModifierStatus(buyCount, data);
    }
    setAbyssalLocked(id, reqs) {
        this.abyssalModifiers[id].setLocked(reqs);
    }
    setAbyssalLockedStatus(id, data) {
        this.abyssalModifiers[id].setModifierStatusLocked(data);
    }
    setAbyssalHidden(id) {
        hideElement(this.abyssalModifiers[id]);
    }
    setAbyssalShow(id) {
        showElement(this.abyssalModifiers[id]);
    }
}
window.customElements.define('astrology-exploration-panel', AstrologyExplorationPanelElement);
/** Component for showing active modifiers, stardust rate and doubling in Astrology */
class AstrologyInformationPanelElement extends HTMLElement {
    constructor() {
        super();
        this.itemChances = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('astrology-information-panel-template'));
        this.viewAllModifiersButton = getElementFromFragment(this._content, 'view-all-modifiers-button', 'button');
        this.doublingChance = getElementFromFragment(this._content, 'doubling-chance', 'doubling-icon');
        this.meteoriteChance = getElementFromFragment(this._content, 'meteorite-chance', 'meteorite-chance-icon');
        this.starfallChance = getElementFromFragment(this._content, 'starfall-chance', 'starfall-chance-icon');
        if (!cloudManager.hasTotHEntitlementAndIsEnabled)
            hideElement(this.meteoriteChance);
        if (!cloudManager.hasItAEntitlementAndIsEnabled)
            hideElement(this.starfallChance);
    }
    /** Initializes the menu and sets the stardust icons */
    initialize(game) {
        game.astrology.baseRandomItemChances.forEach((_, item) => {
            const chanceIcon = createElement('item-chance-icon');
            chanceIcon.setItem(item);
            this.doublingChance.before(chanceIcon);
            this.itemChances.push(chanceIcon);
            if (item.id === "melvorItA:Eternal_Stardust" /* ItemIDs.Eternal_Stardust */ )
                chanceIcon.classList.add('d-none');
        });
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setModifierCallback(astrology) {
        this.viewAllModifiersButton.onclick = () => astrology.viewAllModifiersOnClick();
    }
    updateChances(itemChances, doubling, doublingSources, meteorite, starfall) {
        this.itemChances.forEach((chanceIcon, i) => {
            chanceIcon.setChance(itemChances[i]);
        });
        this.doublingChance.setChance(doubling, doublingSources);
        this.meteoriteChance.setChance(meteorite);
        this.starfallChance.setChance(starfall);
    }
}
window.customElements.define('astrology-information-panel', AstrologyInformationPanelElement);
//# sourceMappingURL=astrologyMenus.js.map
checkFileVersion('?12097')