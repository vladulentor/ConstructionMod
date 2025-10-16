"use strict";
class Realm extends NamespacedObject {
    constructor(namespace, data, game) {
        var _a, _b, _c;
        super(namespace, data.id);
        this.unlockRequirements = [];
        this._name = data.name;
        this._media = data.media;
        this.showIfLocked = (_a = data.showIfLocked) !== null && _a !== void 0 ? _a : true;
        this.ignoreCompletion = (_b = data.ignoreCompletion) !== null && _b !== void 0 ? _b : false;
        if (data.sidebarClass !== undefined)
            this.sidebarClass = data.sidebarClass;
        this.realmClass = (_c = data.realmClass) !== null && _c !== void 0 ? _c : 'bg-dark-bank-block-header';
        this.modQuery = new ModifierQuery({
            realm: this
        });
        game.queueForSoftDependencyReg(data, this);
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`REALM_NAME_${this.localID}`);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    registerSoftDependencies(data, game) {
        try {
            this.unlockRequirements = data.unlockRequirements.map((data) => game.getRequirementFromData(data));
        } catch (e) {
            throw new DataConstructionError(Realm.name, e, this.id);
        }
    }
    get isUnlocked() {
        return isRequirementMet(this.unlockRequirements);
    }
}
class RealmManager {
    constructor(game) {
        this.game = game;
        this.unlockUnlisteners = new Map();
    }
    onLoad() {
        this.assignUnlockListeners();
    }
    assignUnlockListeners() {
        this.unlockUnlisteners.forEach((a) => a.forEach((f) => f()));
        this.unlockUnlisteners.clear();
        this.game.realms.forEach((realm) => {
            if (realm.isUnlocked)
                return;
            const unhandlers = realm.unlockRequirements.map((requirement) => {
                return requirement.assignHandler(() => this.onRealmRequirementMet(realm));
            });
            this.unlockUnlisteners.set(realm, unhandlers);
        });
    }
    onRealmRequirementMet(realm) {
        var _a;
        if (!realm.isUnlocked)
            return;
        (_a = this.unlockUnlisteners.get(realm)) === null || _a === void 0 ? void 0 : _a.forEach((f) => f());
        this.unlockUnlisteners.delete(realm);
        this.queueRealmUnlockedModal(realm);
        this.queueRealmUnlockRenders(realm);
    }
    queueRealmUnlockedModal(realm) {
        addModalToQueue({
            title: getLangString('REALM_UNLOCKED'),
            html: templateLangString('UNLOCKED_REALM_TEXT', {
                realmName: realm.name
            }),
            imageUrl: realm.media,
            imageWidth: 128,
            imageHeight: 128,
            imageAlt: realm.name,
        });
    }
    queueRealmUnlockRenders(realm) {
        this.game.combat.renderQueue.realmVisibility.add(realm);
        this.game.skills.forEach((skill) => {
            if (skill.standardLevelRealm === realm)
                skill.renderQueue.levelVisibility = true;
            if (skill.abyssalLevelRealm === realm)
                skill.renderQueue.abyssalLevelVisibility = true;
            skill.renderQueue.realmSelection = true;
            skill.renderQueue.realmVisibility.add(realm);
            if (skill instanceof ArtisanSkill) {
                skill.renderQueue.realmedCategorySelection = true;
            }
        });
        this.game.combat.renderQueue.categoryVisibilityByRealm.add(game.currentRealm);
        this.game.combat.renderQueue.realmVisibility.add(game.currentRealm);
        this.game.renderQueue.realmSidebarVisibility.add(realm);
        this.game.renderQueue.realmVisibility = true;
    }
    showRealmUnlockRequirementsModal(realm) {
        const modalBody = createElement('div', {
            className: 'justify-vertical-center'
        });
        createElement('h5', {
            className: 'font-w600 font-size-base',
            text: getLangString('MUST_MEET_REQUIREMENTS_TO_UNLOCK'),
            parent: modalBody,
        });
        realm.unlockRequirements.forEach((req) => {
            createElement('span', {
                className: game.checkRequirement(req) ? 'text-success' : 'text-danger',
                children: req.getNodes('skill-icon-xs mr-1'),
                parent: modalBody,
            });
        });
        SwalLocale.fire({
            title: getLangString('MENU_TEXT_REALM_LOCKED'),
            html: modalBody,
            icon: 'warning',
        });
    }
    setSidebarTheme(realm) {
        var _a;
        const sidebarEl = document.getElementById('main-sidebar');
        if (((_a = this.currentSidebarRealm) === null || _a === void 0 ? void 0 : _a.sidebarClass) !== undefined) {
            sidebarEl === null || sidebarEl === void 0 ? void 0 : sidebarEl.classList.remove(this.currentSidebarRealm.sidebarClass);
        }
        if (realm.sidebarClass !== undefined) {
            sidebarEl === null || sidebarEl === void 0 ? void 0 : sidebarEl.classList.add(realm.sidebarClass);
        }
        this.currentSidebarRealm = realm;
    }
    removeSidebarTheme() {
        var _a;
        const sidebarEl = document.getElementById('main-sidebar');
        if (((_a = this.currentSidebarRealm) === null || _a === void 0 ? void 0 : _a.sidebarClass) !== undefined) {
            sidebarEl === null || sidebarEl === void 0 ? void 0 : sidebarEl.classList.remove(this.currentSidebarRealm.sidebarClass);
        }
        this.currentSidebarRealm = undefined;
    }
}
/** Base class for namespaced objects that belong to a particular realm */
class RealmedObject extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        try {
            if (data.realm !== undefined) {
                this.realm = game.realms.getObjectSafe(data.realm);
            } else {
                this.realm = game.defaultRealm;
            }
        } catch (e) {
            throw new DataConstructionError(RealmedObject.name, e, this.id);
        }
    }
}
class RealmSelectOptionElement extends HTMLElement {
    constructor() {
        super();
        this.hasSubmenu = false;
        this.realm = game.defaultRealm;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('realm-select-option-template'));
        this.listItem = getElementFromFragment(this._content, 'list-item', 'li');
        this.link = getElementFromFragment(this._content, 'link', 'a');
        this.realmImage = getElementFromFragment(this._content, 'realm-image', 'img');
        this.span = getElementFromFragment(this._content, 'span', 'span');
        this.realmName = getElementFromFragment(this._content, 'realm-name', 'span');
        this.lockIcon = getElementFromFragment(this._content, 'lock-icon', 'i');
        this.submenu = getElementFromFragment(this._content, 'submenu', 'ul');
    }
    connectedCallback() {
        this.appendChild(this._content);
        if (this.tooltip === undefined && !this.realm.isUnlocked) {
            this.tooltip = tippy(this.listItem, {
                placement: 'bottom',
                allowHTML: true,
                interactive: false,
                animation: false,
            });
        }
    }
    disconnectedCallback() {
        if (this.tooltip !== undefined) {
            this.tooltip.destroy();
            this.tooltip = undefined;
        }
    }
    setRealm(realm) {
        var _a, _b, _c;
        this.realm = realm;
        this.realmImage.src = realm.media;
        this.realmName.textContent = realm.name;
        if (realm.unlockRequirements.length > 0) {
            (_a = this.tooltip) === null || _a === void 0 ? void 0 : _a.setProps({
                onShow: (instance) => {
                    instance.setContent(printAllUnlockRequirementsAsHTML(realm.unlockRequirements).join(''));
                },
            });
            (_b = this.tooltip) === null || _b === void 0 ? void 0 : _b.enable();
        } else {
            (_c = this.tooltip) === null || _c === void 0 ? void 0 : _c.disable();
        }
    }
    setLocked() {
        hideElement(this.realmImage);
        showElement(this.lockIcon);
        this.span.classList.add('text-danger');
        if (this.hasSubmenu) {
            this.disableSubmenu();
            hideElement(this.submenu);
        }
        if (this.realm.showIfLocked)
            showElement(this.listItem);
        else
            hideElement(this.listItem);
    }
    setUnlocked() {
        showElement(this.listItem);
        showElement(this.realmImage);
        hideElement(this.lockIcon);
        this.span.classList.remove('text-danger');
        if (this.hasSubmenu) {
            this.enableSubmenu();
            showElement(this.submenu);
        }
    }
    setSelected() {
        this.link.classList.add('township-tab-selected');
    }
    setUnselected() {
        this.link.classList.remove('township-tab-selected');
    }
    setCallback(callback) {
        if (this.currentCallback !== undefined)
            this.link.removeEventListener('click', this.currentCallback);
        this.link.addEventListener('click', callback);
        this.currentCallback = callback;
    }
    setAsSubMenu() {
        var _a;
        if (this.hasSubmenu)
            return;
        this.hasSubmenu = true;
        this.link.classList.add('nav-main-link-submenu');
        this.link.setAttribute('data-toggle', 'submenu');
        this.link.setAttribute('aria-haspoup', 'true');
        this.link.setAttribute('aria-expanded', 'false');
        (_a = this.tooltip) === null || _a === void 0 ? void 0 : _a.setProps({
            placement: 'top',
        });
        showElement(this.submenu);
        this.addSubmenuFix();
    }
    addSubOption(option) {
        this.submenu.append(option);
    }
    enableSubmenuScrolling(maxHeight) {
        this.submenu.style.maxHeight = `${maxHeight}vh`;
        new SimpleBar(this.submenu, {
            autoHide: false
        });
    }
    enableSubmenu() {
        this.link.setAttribute('data-toggle', 'submenu');
    }
    disableSubmenu() {
        this.link.removeAttribute('data-toggle');
    }
    addSubmenuFix() {
        let mqSet = false;
        const clickCallback = () => {
            if (mqSet || checkMediaQuery('(min-width: 992px)'))
                return;
            const mqCallback = (ev) => {
                if (!ev.matches)
                    return;
                this.listItem.classList.remove('open');
                removeMediaQueryListener('(min-width: 992px)', mqCallback);
                mqSet = false;
            };
            addMediaQueryListener('(min-width: 992px)', mqCallback);
            mqSet = true;
        };
        this.link.addEventListener('click', clickCallback);
    }
}
window.customElements.define('realm-select-option', RealmSelectOptionElement);
class RealmSelectMenuElement extends HTMLElement {
    constructor() {
        super();
        this.realmOptions = new Map();
        this.realmSidebarOptions = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('realm-select-menu-template'));
        this.expandBtn = getElementFromFragment(this._content, 'expand-btn', 'button');
        this.expanded = getElementFromFragment(this._content, 'expanded', 'div');
        this.realmContainer = getElementFromFragment(this._content, 'realm-container', 'ul');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.expandBtn.onclick = () => this.expanded.classList.toggle('d-none');
    }
    /** Populates the menu */
    init(skill) {
        skill.getRealmOptions().forEach((realm) => {
            const option = new RealmSelectOptionElement();
            this.realmOptions.set(realm, option);
            this.realmContainer.append(option);
            option.setRealm(realm);
            option.setCallback(() => {
                skill.selectRealm(realm);
                this.expanded.classList.add('d-none');
            });
        });
        this.setAttribute('data-init', 'true');
        skill.realmSelect = this;
    }
    updateRealmVisibility(realm) {
        const option = this.realmOptions.get(realm);
        const sidebarOption = this.realmSidebarOptions.get(realm);
        if (option === undefined)
            return;
        if (realm.isUnlocked) {
            option.setUnlocked();
        } else {
            option.setLocked();
        }
    }
    static initializeForSkill(skill) {
        const realmSelects = document.querySelectorAll(`realm-select-menu[data-skill-id="${skill.id}"]:not([data-init])`);
        realmSelects.forEach((menu) => menu.init(skill));
    }
}
window.customElements.define('realm-select-menu', RealmSelectMenuElement);
class RealmTabSelectElement extends HTMLElement {
    constructor() {
        super();
        this.options = [];
        this.optionsMap = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('realm-tab-select-template'));
        this.optionsContainer = getElementFromFragment(this._content, 'options-container', 'ul');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setOptions(realms, callback, highlightSelected = false) {
        this.optionsMap.clear();
        while (this.options.length < realms.length) {
            const option = new RealmSelectOptionElement();
            this.optionsContainer.append(option);
            this.options.push(option);
        }
        realms.forEach((realm, i) => {
            const option = this.options[i];
            option.setRealm(realm);
            if (realm.isUnlocked)
                option.setUnlocked();
            else
                option.setLocked();
            option.setCallback(() => {
                if (realm.isUnlocked) {
                    callback(realm);
                    if (highlightSelected)
                        this.selectOption(option);
                }
            });
            this.optionsMap.set(realm, option);
            showElement(option);
        });
        for (let i = realms.length; i < this.options.length; i++) {
            hideElement(this.options[i]);
        }
        if (realms.length > 1)
            showElement(this.optionsContainer);
        else
            hideElement(this.optionsContainer);
    }
    updateRealmUnlock(realm) {
        const option = this.optionsMap.get(realm);
        if (option === undefined)
            return;
        if (realm.isUnlocked)
            option.setUnlocked();
        else
            option.setLocked();
    }
    setSelectedRealm(realm) {
        const option = this.optionsMap.get(realm);
        if (option === undefined)
            return;
        this.selectOption(option);
    }
    selectOption(option) {
        if (this.selectedOption === option)
            return;
        this.unselectOption();
        option.setSelected();
        this.selectedOption = option;
    }
    unselectOption() {
        if (this.selectedOption === undefined)
            return;
        this.selectedOption.setUnselected();
        this.selectedOption = undefined;
    }
}
window.customElements.define('realm-tab-select', RealmTabSelectElement);
class RealmSidebarSelect {
    constructor() {
        this.realmSidebarOptions = new Map();
        game.realms.forEach((realm) => {
            this.realmSidebarOptions.set(realm, new RealmSidebarSelectOption(realm));
        });
    }
    updateRealmVisibility(realm) {
        const option = this.realmSidebarOptions.get(realm);
        if (option === undefined)
            return;
        if (realm.isUnlocked) {
            option.setUnlocked();
        } else {
            option.setLocked();
        }
    }
}
class RealmSidebarSelectOption {
    constructor(realm) {
        this.realm = realm;
        this.sidebarEl = sidebar
            .category('Realm Selection')
            .item('Select Realm')
            .subitem(realm.id, {
                name: realm.name,
                aside: `-`,
                onClick: () => game.selectRealm(realm),
                onRender: ({
                    asideEl
                }) => {
                    asideEl.innerHTML = `<div class="d-none"></div>`;
                },
            });
    }
    setLocked() {
        this.setSidebarOptionAsLocked();
        if (!game.settings.useLegacyRealmSelection) {
            if (this.realm.showIfLocked) {
                this.showRealmSidebarOption();
            } else
                this.hideRealmSidebarOption();
        }
    }
    setUnlocked() {
        this.setSidebarOptionAsUnlocked();
        if (!game.settings.useLegacyRealmSelection) {
            this.showRealmSidebarOption();
        }
    }
    showRealmSidebarOption() {
        var _a, _b, _c;
        (_b = (_a = this.sidebarEl) === null || _a === void 0 ? void 0 : _a.rootEl) === null || _b === void 0 ? void 0 : _b.classList.remove('d-none');
        if (this.realm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ) {
            (_c = sidebar.category('Into the Abyss').item('Abyssal Realm').rootEl) === null || _c === void 0 ? void 0 : _c.classList.remove('d-none');
        }
    }
    hideRealmSidebarOption() {
        var _a, _b, _c;
        (_b = (_a = this.sidebarEl) === null || _a === void 0 ? void 0 : _a.rootEl) === null || _b === void 0 ? void 0 : _b.classList.add('d-none');
        if (this.realm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ) {
            (_c = sidebar.category('Into the Abyss').item('Abyssal Realm').rootEl) === null || _c === void 0 ? void 0 : _c.classList.add('d-none');
        }
    }
    setSidebarOptionAsLocked() {
        var _a, _b;
        if (this.sidebarEl !== undefined) {
            this.sidebarEl.asideEl.innerHTML = `<i class="fa fa-lock text-danger"></i>`;
            (_a = this.sidebarEl.nameEl) === null || _a === void 0 ? void 0 : _a.classList.add('text-danger');
        }
        if (this.realm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ) {
            sidebar
                .category('Into the Abyss')
                .item('Abyssal Realm').asideEl.innerHTML = `<i class="fa fa-lock text-danger"></i>`;
            (_b = sidebar.category('Into the Abyss').item('Abyssal Realm').nameEl) === null || _b === void 0 ? void 0 : _b.classList.add('text-danger');
        }
    }
    setSidebarOptionAsUnlocked() {
        var _a, _b;
        if (this.sidebarEl !== undefined) {
            this.sidebarEl.asideEl.innerHTML = `<div class="d-none"></div>`;
            (_a = this.sidebarEl.nameEl) === null || _a === void 0 ? void 0 : _a.classList.remove('text-danger');
        }
        if (this.realm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ) {
            sidebar.category('Into the Abyss').item('Abyssal Realm').asideEl.innerHTML = `<div class="d-none"></div>`;
            (_b = sidebar.category('Into the Abyss').item('Abyssal Realm').nameEl) === null || _b === void 0 ? void 0 : _b.classList.remove('text-danger');
        }
    }
}
//# sourceMappingURL=realms.js.map
checkFileVersion('?12097')