"use strict";
class ActivePrayer extends RealmedObject {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        /** Flags this prayer as Unholy. */
        this.isUnholy = false;
        /** Flags this prayer as Abyssal. */
        this.isAbyssal = false;
        /** Flags this prayer to use Soul Points instead of Prayer Points. */
        this.useSoulPoints = false;
        this.allowedDamageTypes = new Set();
        try {
            this.level = data.level;
            this._media = data.media;
            this._name = data.name;
            this.pointsPerPlayer = data.pointsPerPlayer;
            this.pointsPerEnemy = data.pointsPerEnemy;
            this.pointsPerRegen = data.pointsPerRegen;
            this.stats = new StatObject(data, game, `${ActivePrayer.name} with id "${this.id}"`);
            if (data.isUnholy !== undefined)
                this.isUnholy = data.isUnholy;
            if (data.useSoulPoints !== undefined)
                this.useSoulPoints = data.useSoulPoints;
            if (data.abyssalLevel !== undefined)
                this._abyssalLevel = data.abyssalLevel;
            if (data.isAbyssal !== undefined)
                this.isAbyssal = data.isAbyssal;
            if (data.allowedDamageTypeIDs !== undefined) {
                this.allowedDamageTypes = new Set(data.allowedDamageTypeIDs.map((id) => game.damageTypes.getObjectSafe(id)));
            }
        } catch (e) {
            throw new DataConstructionError(ActivePrayer.name, e, this.id);
        }
    }
    get abyssalLevel() {
        var _a;
        return (_a = this._abyssalLevel) !== null && _a !== void 0 ? _a : 0;
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`PRAYER_PRAYER_NAME_${this.localID}`);
        }
    }
    canUseWithDamageType(damageType) {
        return this.allowedDamageTypes.size === 0 || this.allowedDamageTypes.has(damageType);
    }
}
class LockedPrayerTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('locked-prayer-tooltip-template'));
        this.level = getElementFromFragment(this._content, 'level', 'span');
        this.abyssalLevel = getElementFromFragment(this._content, 'abyssal-level', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setPrayer(prayer) {
        this.level.textContent = templateLangString('MENU_TEXT_UNLOCKED_AT_SKILL_LEVEL', {
            skillName: getLangString('SKILL_NAME_Prayer'),
            level: `${prayer.level}`,
        });
        if (prayer.abyssalLevel > 0) {
            this.abyssalLevel.textContent = templateLangString('MENU_TEXT_UNLOCKED_AT_SKILL_ABYSSAL_LEVEL', {
                skillName: getLangString('SKILL_NAME_Prayer'),
                level: `${prayer.abyssalLevel}`,
            });
            showElement(this.abyssalLevel);
        } else {
            hideElement(this.abyssalLevel);
        }
    }
}
window.customElements.define('locked-prayer-tooltip', LockedPrayerTooltipElement);
class PrayerTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('prayer-tooltip-template'));
        this.prayerName = getElementFromFragment(this._content, 'prayer-name', 'span');
        this.unholyScaling = getElementFromFragment(this._content, 'unholy-scaling', 'small');
        this.stats = getElementFromFragment(this._content, 'stats', 'small');
        this.xpInfo = getElementFromFragment(this._content, 'xp-info', 'small');
        this.playerPoints = getElementFromFragment(this._content, 'player-points', 'small');
        this.enemyPoints = getElementFromFragment(this._content, 'enemy-points', 'small');
        this.regenPoints = getElementFromFragment(this._content, 'regen-points', 'small');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setPrayer(prayer) {
        this.prayerName.textContent = prayer.name;
        if (prayer.isUnholy) {
            this.unholyScaling.textContent = getLangString('FOR_EACH_UNHOLY_MARK');
            showElement(this.unholyScaling);
        } else {
            hideElement(this.unholyScaling);
        }
        this.stats.textContent = '';
        StatObject.formatDescriptions(prayer.stats, ({
            text
        }) => createElement('span', {
            text,
            parent: this.stats
        }));
        if (prayer.pointsPerPlayer > 0) {
            this.playerPoints.innerHTML = templateLangString('PRAYER_PRAYER_MISC_2', {
                points: `<span class='text-info'>${prayer.pointsPerPlayer}</span>`,
            });
            this.xpInfo.textContent = prayer.isAbyssal ?
                getLangString('PROVIDES_PRAYER_ABYSSAL_XP') :
                getLangString('PRAYER_PROVIDES_XP');
            this.xpInfo.className = 'text-success';
            showElement(this.playerPoints);
        } else {
            this.xpInfo.textContent = getLangString('PRAYER_PROVIDES_NO_XP');
            this.xpInfo.className = 'text-danger';
            hideElement(this.playerPoints);
        }
        if (prayer.pointsPerEnemy > 0) {
            this.enemyPoints.innerHTML = templateLangString('PRAYER_PRAYER_MISC_1', {
                points: `<span class='text-info'>${prayer.pointsPerEnemy}</span>`,
            });
            showElement(this.enemyPoints);
        } else {
            hideElement(this.enemyPoints);
        }
        if (prayer.pointsPerRegen > 0) {
            this.regenPoints.innerHTML = templateLangString('PRAYER_PRAYER_MISC_3', {
                points: `<span class='text-info'>${prayer.pointsPerRegen}</span>`,
            });
            showElement(this.regenPoints);
        } else {
            hideElement(this.regenPoints);
        }
    }
}
window.customElements.define('prayer-tooltip', PrayerTooltipElement);
class PrayerButtonElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('prayer-button-template'));
        this.link = getElementFromFragment(this._content, 'link', 'a');
        this.prayerImage = getElementFromFragment(this._content, 'prayer-image', 'img');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.tooltip = tippy(this.link, {
            content: '',
            placement: 'bottom',
            interactive: false,
            animation: false,
        });
    }
    disconnectedCallback() {
        if (this.tooltip !== undefined) {
            this.tooltip.destroy();
            this.tooltip = undefined;
        }
    }
    setUnlocked(prayer, player) {
        this.prayerImage.src = prayer.media;
        this.link.onclick = () => player.togglePrayer(prayer);
        if (this.tooltip !== undefined) {
            const content = createElement('prayer-tooltip');
            customElements.upgrade(content);
            content.setPrayer(prayer);
            this.tooltip.setContent(content);
        }
    }
    setLocked(prayer) {
        this.prayerImage.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        this.link.onclick = null;
        if (this.tooltip !== undefined) {
            const content = createElement('locked-prayer-tooltip');
            customElements.upgrade(content);
            content.setPrayer(prayer);
            this.tooltip.setContent(content);
        }
    }
    highlight() {
        this.link.classList.add('border-success', 'spell-selected');
        this.link.classList.remove('border-dark');
    }
    unhighlight() {
        this.link.classList.add('border-dark');
        this.link.classList.remove('border-success', 'spell-selected');
    }
}
window.customElements.define('prayer-button', PrayerButtonElement);
class PrayerBookMenuElement extends HTMLElement {
    constructor() {
        super();
        this.buttonTooltips = [];
        this.prayerButtons = new Map();
        this.activeButtons = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('prayer-book-menu-template'));
        this.bookButtons = getElementFromFragment(this._content, 'book-buttons', 'div');
        this.standardButton = getElementFromFragment(this._content, 'standard-button', 'button');
        this.unholyButton = getElementFromFragment(this._content, 'unholy-button', 'button');
        this.abyssalButton = getElementFromFragment(this._content, 'abyssal-button', 'button');
        this.standardContainer = getElementFromFragment(this._content, 'standard-container', 'div');
        this.standardAnchor = getElementFromFragment(this._content, 'standard-anchor', 'span');
        this.unholyContainer = getElementFromFragment(this._content, 'unholy-container', 'div');
        this.unholyAnchor = getElementFromFragment(this._content, 'unholy-anchor', 'span');
        this.abyssalContainer = getElementFromFragment(this._content, 'abyssal-container', 'div');
        this.abyssalAnchor = getElementFromFragment(this._content, 'abyssal-anchor', 'span');
        this.visibleContainer = this.standardContainer;
        this.highlightedButton = this.standardButton;
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    disconnectedCallback() {
        this.buttonTooltips.forEach((tt) => tt.destroy());
        this.buttonTooltips = [];
    }
    init(game) {
        this.standardButton.onclick = () => {
            this.highlightButton(this.standardButton);
            this.selectContainer(this.standardContainer);
        };
        this.unholyButton.onclick = () => {
            this.highlightButton(this.unholyButton);
            this.selectContainer(this.unholyContainer);
        };
        this.abyssalButton.onclick = () => {
            this.highlightButton(this.abyssalButton);
            this.selectContainer(this.abyssalContainer);
        };
        this.addButtonTooltip(this.standardButton, getLangString('STANDARD_PRAYERS'));
        this.addButtonTooltip(this.unholyButton, getLangString('UNHOLY_PRAYERS'));
        this.addButtonTooltip(this.abyssalButton, getLangString('ABYSSAL_PRAYERS'));
        const sortedPrayers = game.prayers.allObjects.sort((a, b) => a.level - b.level);
        let showUnholy = false;
        let showAbyssal = false;
        sortedPrayers.forEach((prayer) => {
            if (prayer.isUnholy) {
                this.createPrayerButton(prayer, this.unholyAnchor);
                showUnholy = true;
            } else if (prayer.isAbyssal) {
                this.createPrayerButton(prayer, this.abyssalAnchor);
                showAbyssal = true;
            } else
                this.createPrayerButton(prayer, this.standardAnchor);
        });
        if (showUnholy || showAbyssal) {
            showElement(this.bookButtons);
        } else {
            hideElement(this.bookButtons);
        }
        if (showUnholy) {
            showElement(this.unholyButton);
        } else {
            hideElement(this.unholyButton);
        }
        if (showAbyssal) {
            showElement(this.abyssalButton);
        } else {
            hideElement(this.abyssalButton);
        }
    }
    updateForLevel(player, level, abyssalLevel) {
        this.prayerButtons.forEach((button, prayer) => {
            if (level >= prayer.level && (prayer.abyssalLevel === 0 || abyssalLevel >= prayer.abyssalLevel)) {
                button.setUnlocked(prayer, player);
            } else {
                button.setLocked(prayer);
            }
        });
    }
    setActiveButtons(active) {
        this.activeButtons.forEach((button) => button.unhighlight());
        this.activeButtons = [];
        active.forEach((prayer) => {
            const button = this.prayerButtons.get(prayer);
            if (button !== undefined) {
                button.highlight();
                this.activeButtons.push(button);
            }
        });
    }
    addButtonTooltip(button, text) {
        this.buttonTooltips.push(tippy(button, {
            content: text,
            placement: 'bottom',
            interactive: false,
            animation: false,
        }));
    }
    createPrayerButton(prayer, anchor) {
        const button = createElement('prayer-button', {
            className: 'col-3'
        });
        this.prayerButtons.set(prayer, button);
        anchor.before(button);
    }
    selectContainer(container) {
        if (container === this.visibleContainer)
            return;
        hideElement(this.visibleContainer);
        showElement(container);
        this.visibleContainer = container;
    }
    highlightButton(button) {
        if (button === this.highlightedButton)
            return;
        this.highlightedButton.classList.replace('btn-outline-success', 'btn-outline-secondary');
        button.classList.replace('btn-outline-secondary', 'btn-outline-success');
        this.highlightedButton = button;
    }
}
window.customElements.define('prayer-book-menu', PrayerBookMenuElement);
//# sourceMappingURL=prayer.js.map
checkFileVersion('?12097')