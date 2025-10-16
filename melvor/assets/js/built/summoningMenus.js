"use strict";
class SummoningMarkDiscoveryElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('summoning-mark-discovery-template'));
        this.status = getElementFromFragment(this._content, 'mark-status', 'small');
        this.name = getElementFromFragment(this._content, 'mark-name', 'span');
        this.image = getElementFromFragment(this._content, 'mark-image', 'img');
        this.levelRequired = getElementFromFragment(this._content, 'level-required', 'h5');
        this.abyssalLevelRequired = getElementFromFragment(this._content, 'abyssal-level-required', 'h5');
        this.discoveredContent = getElementFromFragment(this._content, 'discovered-content', 'div');
        this.progressBar = getElementFromFragment(this._content, 'mark-progress', 'div');
        this.skillImageContainer = getElementFromFragment(this._content, 'mark-skill-images', 'h5');
        this.discoveryTotal = getElementFromFragment(this._content, 'mark-discovery-total', 'h5');
        this.quickCreateButton = getElementFromFragment(this._content, 'quick-create-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setMark(mark, summoning) {
        this.updateState(mark, summoning);
        this.updateDiscoveryCount(mark);
    }
    /** Updates the current state based on the mark discovery count + level */
    updateState(mark, summoning) {
        if (mark.level > summoning.level || mark.abyssalLevel > summoning.abyssalLevel) {
            this.setLocked(mark, summoning);
        } else if (summoning.getMarkCount(mark) === 0) {
            this.setUndiscovered(mark);
        } else {
            this.setDiscovered(mark);
        }
    }
    /** Sets the mark to the state of being too high level */
    setLocked(mark, summoning) {
        this.status.className = 'text-danger';
        this.status.textContent = getLangString('MENU_TEXT_LOCKED');
        this.setName(getLangString('MENU_TEXT_QUESTION_MARKS'));
        this.image.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        this.levelRequired.textContent = '';
        this.levelRequired.append(...templateLangStringWithNodes('MENU_TEXT_REQUIRES_SKILL_LEVEL', {
            skillImage: this.getSkillIcon(summoning)
        }, {
            level: `${mark.level}`
        }));
        toggleDangerSuccess(this.levelRequired, summoning.level >= mark.level);
        if (mark.abyssalLevel > 0) {
            this.abyssalLevelRequired.textContent = '';
            this.abyssalLevelRequired.append(...templateLangStringWithNodes('REQUIRES_ABYSSAL_LEVEL', {
                skillImage: this.getSkillIcon(summoning)
            }, {
                level: `${mark.abyssalLevel}`
            }));
            toggleDangerSuccess(this.abyssalLevelRequired, summoning.abyssalLevel >= mark.abyssalLevel);
            showElement(this.abyssalLevelRequired);
        } else {
            hideElement(this.abyssalLevelRequired);
        }
        hideElement(this.discoveredContent);
        showElement(this.levelRequired);
        this.quickCreateButton.onclick = null;
    }
    /** Sets the mark to the state of being unlocked via level, but undiscovered */
    setUndiscovered(mark) {
        this.status.className = 'text-warning';
        this.status.textContent = getLangString('MENU_TEXT_NOT_DISCOVERED');
        this.setName(getLangString('MENU_TEXT_QUESTION_MARKS'));
        this.image.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        this.setSkillImages(mark.skills);
        this.updateDiscoveryCount(mark);
        showElement(this.discoveredContent);
        hideElement(this.levelRequired);
        hideElement(this.abyssalLevelRequired);
        hideElement(this.quickCreateButton);
        this.quickCreateButton.onclick = null;
    }
    /** Sets the mark to the state of being discovered */
    setDiscovered(mark) {
        const markLevel = game.summoning.getMarkLevel(mark);
        this.status.className = 'text-warning';
        this.status.textContent = templateLangString('MENU_TEXT_MARK_LEVEL', {
            level: `${markLevel}`
        });
        this.setName(mark.product.name);
        this.image.src = mark.markMedia;
        this.setSkillImages(mark.skills);
        this.updateDiscoveryCount(mark);
        showElement(this.discoveredContent);
        hideElement(this.levelRequired);
        hideElement(this.abyssalLevelRequired);
        showElement(this.quickCreateButton);
        this.quickCreateButton.onclick = () => {
            switchSummoningCategory(mark.category);
            game.summoning.selectRecipeOnClick(mark);
        };
    }
    getSkillIcon(skill) {
        return createElement('img', {
            className: 'skill-icon-xs mr-1',
            attributes: [
                ['src', skill.media]
            ],
        });
    }
    /** Templates and sets the name field for the mark */
    setName(name) {
        let nodesToAppend;
        const nameNodes = templateLangStringWithNodes('MENU_TEXT_MARK_OF_THE', {
            familiarName: createElement('span', {
                text: name,
                className: 'text-success'
            })
        }, {});
        if (typeof nameNodes[0] === 'string') {
            nodesToAppend = [createElement('small', {
                text: nameNodes[0]
            }), createElement('br'), nameNodes[1]];
        } else if (typeof nameNodes[1] === 'string') {
            nodesToAppend = [nameNodes[0], createElement('small', {
                text: nameNodes[1]
            })];
        } else {
            throw new Error('Invalid Node templating result.');
        }
        this.name.textContent = '';
        this.name.append(...nodesToAppend);
    }
    /** Sets the skill images to the specified skills */
    setSkillImages(skills) {
        this.skillImageContainer.textContent = '';
        this.skillImageContainer.append(...skills.map((skill) => this.getSkillIcon(skill)));
    }
    /** Updates the discovery progress bar and the current discovery count */
    updateDiscoveryCount(mark) {
        const markLevel = game.summoning.getMarkLevel(mark);
        const totalCount = game.summoning.getMarkCount(mark);
        if (markLevel >= mark.maxMarkLevel) {
            this.progressBar.style.width = '100%';
            this.progressBar.classList.remove('bg-summoning');
            this.progressBar.classList.add('bg-success');
        } else {
            let countToNext = totalCount;
            let nextCountRequired = Summoning.markLevels[0];
            if (markLevel > 0) {
                nextCountRequired = Summoning.markLevels[markLevel] - Summoning.markLevels[markLevel - 1];
                countToNext -= Summoning.markLevels[markLevel - 1];
            }
            this.progressBar.style.width = `${((100 * countToNext) / nextCountRequired).toFixed(2)}%`;
            this.progressBar.classList.add('bg-summoning');
            this.progressBar.classList.remove('bg-success');
        }
        this.discoveryTotal.textContent = templateLangString('MENU_TEXT_DISCOVERY_COUNT', {
            count: `${totalCount}`,
            maxCount: `${Summoning.markLevels[mark.maxMarkLevel - 1]}`,
        });
    }
}
window.customElements.define('summoning-mark-discovery', SummoningMarkDiscoveryElement);
class SummoningSynergySearchElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('summoning-synergy-search-template'));
        this.flexContainer = getElementFromFragment(this._content, 'flex-container', 'div');
        this.markElements0 = {
            container: getElementFromFragment(this._content, 'mark-container-0', 'div'),
            image: getElementFromFragment(this._content, 'mark-image-0', 'img'),
            quantity: getElementFromFragment(this._content, 'mark-quantity-0', 'small'),
            skillImage: getElementFromFragment(this._content, 'mark-skill-image-0', 'img'),
        };
        this.markElements1 = {
            container: getElementFromFragment(this._content, 'mark-container-1', 'div'),
            image: getElementFromFragment(this._content, 'mark-image-1', 'img'),
            quantity: getElementFromFragment(this._content, 'mark-quantity-1', 'small'),
            skillImage: getElementFromFragment(this._content, 'mark-skill-image-1', 'img'),
        };
        this.synergyIcon = getElementFromFragment(this._content, 'synergy-icon', 'img');
        this.synergyDescription = getElementFromFragment(this._content, 'synergy-description', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /** Sets the synergy, setting the skill images, lock status and quantities */
    setSynergy(synergy) {
        this.synergy = synergy;
        this.markElements0.skillImage.src = synergy.summons[0].skills[0].media;
        this.markElements1.skillImage.src = synergy.summons[1].skills[0].media;
        this.updateLockStatus();
        this.updateQuantities();
    }
    /** Updates the locked/unlocked status */
    updateLockStatus() {
        if (this.synergy !== undefined && game.summoning.isSynergyUnlocked(this.synergy)) {
            this.setUnlocked();
        } else {
            this.setLocked();
        }
    }
    /** Sets the synergy as locked */
    setLocked() {
        this.markElements0.image.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        this.markElements1.image.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        this.synergyIcon.src = assets.getURI('assets/media/skills/summoning/synergy_locked.png');
        //this.synergyDescription.textContent = getLangString('MENU_TEXT_LOCKED_SYNERGY');
        this.setLockedDescriptions();
        this.flexContainer.onclick = null;
    }
    /** Sets the description for locked synergies */
    setLockedDescriptions() {
        if (this.synergy === undefined)
            return;
        const mark1 = this.synergy.summons[0];
        const mark2 = this.synergy.summons[1];
        const mark1Element = createElement('h5', {
            className: 'font-w400 font-size-sm text-warning mb-1'
        });
        const mark2Element = createElement('h5', {
            className: 'font-w400 font-size-sm text-warning mb-0'
        });
        mark1Element.innerText = `Requires ${game.summoning.getMarkName(mark1)} Level ${mark2.tier + 1}`;
        mark2Element.innerText = `Requires ${game.summoning.getMarkName(mark2)} Level ${mark1.tier + 1}`;
        if (mark1.tier < game.summoning.getMarkLevel(mark2)) {
            mark2Element.classList.add('text-success');
            mark2Element.classList.remove('text-warning');
        }
        if (mark2.tier < game.summoning.getMarkLevel(mark1)) {
            mark1Element.classList.add('text-success');
            mark1Element.classList.remove('text-warning');
        }
        this.synergyDescription.innerHTML = '';
        this.synergyDescription.append(mark1Element, mark2Element);
    }
    /** Sets the synergy as unlocked */
    setUnlocked() {
        if (this.synergy === undefined)
            return;
        this.markElements0.image.src = this.synergy.summons[0].product.media;
        this.markElements1.image.src = this.synergy.summons[1].product.media;
        this.synergyIcon.src = assets.getURI('assets/media/skills/summoning/synergy.png');
        this.synergyDescription.innerHTML = this.synergy.description;
        const synergy = this.synergy;
        this.flexContainer.onclick = () => game.combat.player.quickEquipSynergy(synergy);
    }
    /** Updates the displayed quantity of summons */
    updateQuantities() {
        if (this.synergy === undefined)
            return;
        this.updateMarkQuantity(this.markElements0, this.synergy.summons[0]);
        this.updateMarkQuantity(this.markElements1, this.synergy.summons[1]);
    }
    updateMarkQuantity(markElements, mark) {
        const item = mark.product;
        const playerQty = game.combat.player.equipment.getQuantityOfItem(item);
        const bankQty = game.bank.getQty(item);
        if (playerQty > 0) {
            const qtyToUse = playerQty > 9999999 ? formatNumber(playerQty) : numberWithCommas(playerQty);
            markElements.container.classList.remove('border-item-invalid');
            markElements.quantity.textContent = qtyToUse;
            markElements.quantity.className = 'badge-pill bg-success';
        } else if (bankQty > 0) {
            const qtyToUse = bankQty > 9999999 ? formatNumber(bankQty) : numberWithCommas(bankQty);
            markElements.container.classList.remove('border-item-invalid');
            markElements.quantity.textContent = qtyToUse;
            markElements.quantity.className = 'badge-pill bg-secondary';
        } else {
            markElements.container.classList.add('border-item-invalid');
            markElements.quantity.textContent = '0';
            markElements.quantity.className = 'badge-pill bg-danger';
        }
    }
}
window.customElements.define('summoning-synergy-search', SummoningSynergySearchElement);
/** Menu for searching for summoning synergies */
class SynergySearchMenuElement extends HTMLElement {
    constructor() {
        super();
        this.filterOptions = new Map();
        this.visibleSynergies = new Set();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('synergy-search-menu-template'));
        this.showAllButton = getElementFromFragment(this._content, 'show-all-button', 'button');
        this.showAllButton.onclick = () => this.showAllSynergies();
        this.showUnlockedButton = getElementFromFragment(this._content, 'show-unlocked-button', 'button');
        this.showUnlockedButton.onclick = () => this.showUnlockedSynergies();
        this.filterDropdownButton = getElementFromFragment(this._content, 'dropdown-default-primary', 'button');
        this.filterDropdownButton.onclick = () => this.updateFilterOptions();
        this.filterOptionsContainer = getElementFromFragment(this._content, 'filter-dropdown-options', 'div');
        this.searchBar = getElementFromFragment(this._content, 'search-bar', 'input');
        this.searchBar.placeholder = getLangString('MISC_STRING_17');
        this.searchBar.onkeyup = () => this.onSearchChange();
        // Generate search elements
        this.searchElements = new Map(game.summoning.synergies.map((synergy) => {
            const searchElement = new SummoningSynergySearchElement();
            searchElement.className = 'col-12 col-lg-6';
            this._content.append(searchElement);
            this.visibleSynergies.add(searchElement);
            return [synergy, searchElement];
        }));
        // Generate filter options
        const optionTemplate = getTemplateElement('synergy-search-menu-option-template').content;
        game.summoning.actions.forEach((mark) => {
            const newOption = new DocumentFragment();
            newOption.append(optionTemplate.cloneNode(true));
            this.filterOptions.set(mark, {
                link: getElementFromFragment(newOption, 'link', 'a'),
                image: getElementFromFragment(newOption, 'option-image', 'img'),
                name: getElementFromFragment(newOption, 'option-name', 'span'),
            });
            this.filterOptionsContainer.append(newOption);
        });
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /** Initializes the display of each synergy */
    initialize() {
        this.searchElements.forEach((searchElement, synergy) => {
            searchElement.setSynergy(synergy);
        });
    }
    /** Shows all synergies */
    showAllSynergies() {
        this.searchElements.forEach((element) => {
            showElement(element);
            this.visibleSynergies.add(element);
        });
    }
    showSynergiesWithMark(mark) {
        const query = templateLangString('MENU_TEXT_THE_FAMILIAR', {
            name: mark.product.name
        });
        this.searchBar.value = query;
        this.querySynergies(query);
    }
    /** Shows only the synergies the player has unlocked */
    showUnlockedSynergies() {
        this.searchElements.forEach((element, synergy) => {
            if (game.summoning.isSynergyUnlocked(synergy)) {
                showElement(element);
                this.visibleSynergies.add(element);
            } else {
                hideElement(element);
                this.visibleSynergies.delete(element);
            }
        });
    }
    /** Updates the dropdown menu options based on unlocked marks */
    updateFilterOptions() {
        game.summoning.actions.forEach((mark) => {
            const option = this.filterOptions.get(mark);
            if (option === undefined)
                return;
            const item = mark.product;
            if (game.summoning.getMarkLevel(mark) > 0) {
                option.name.textContent = item.name;
                option.image.src = item.media;
                option.link.onclick = () => this.showSynergiesWithMark(mark);
            } else {
                option.name.textContent = getLangString('MENU_TEXT_QUESTION_MARKS');
                option.image.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
                option.link.onclick = null;
            }
        });
    }
    /** Updates the unlock state of visible synergies */
    updateVisibleElementUnlocks() {
        this.visibleSynergies.forEach((search) => search.updateLockStatus());
    }
    /** Updates the quantities of visible synergies */
    updateVisibleElementQuantities() {
        this.visibleSynergies.forEach((search) => search.updateQuantities());
    }
    /** Updates the visible synergies based on a fuzzy search query */
    querySynergies(query) {
        query = query.trim();
        if (query === '') {
            this.showAllSynergies();
            this.searchBar.classList.remove('text-danger');
            return;
        } else if (query === 'Unlocked') {
            this.showUnlockedSynergies();
            this.searchBar.classList.remove('text-danger');
            return;
        }
        const searchOpts = {
            shouldSort: true,
            tokenize: true,
            matchAllTokens: true,
            findAllMatches: true,
            threshold: 0,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: ['name1', 'name2', 'name1long', 'name2long', 'description'],
        };
        const fuzzySearch = new Fuse(Summoning.searchArray, searchOpts);
        const searchResults = fuzzySearch.search(query);
        const newVisibleSet = new Set();
        // Show the search results
        searchResults.forEach((result) => {
            const synergyElement = this.searchElements.get(result.synergy);
            if (synergyElement === undefined)
                throw new Error('Search result has no corresponding synergy display');
            newVisibleSet.add(synergyElement);
            synergyElement.classList.remove('d-none');
        });
        // Hide the visible elements that are not in the results
        this.visibleSynergies.forEach((synergyElement) => {
            if (!newVisibleSet.has(synergyElement))
                synergyElement.classList.add('d-none');
        });
        this.visibleSynergies = newVisibleSet;
        if (searchResults.length === 0) {
            this.searchBar.classList.add('text-danger');
        } else {
            this.searchBar.classList.remove('text-danger');
        }
    }
    /** Callback for when the current search changes */
    onSearchChange() {
        this.querySynergies(this.searchBar.value);
    }
}
window.customElements.define('synergy-search-menu', SynergySearchMenuElement);
class SummoningMarkMenuElement extends HTMLElement {
    constructor() {
        super();
        this.discoveryElements = [];
        this.discoveryElemMap = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('summoning-mark-menu-template'));
        this.discoveryContainer = getElementFromFragment(this._content, 'discovery-container', 'div');
        this.categoryImage = getElementFromFragment(this._content, 'category-image', 'img');
        this.categoryName = getElementFromFragment(this._content, 'category-name', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    showMarksInCategory(category, summoning) {
        if (this.activeCategory === category)
            return;
        // Set the category info
        this.categoryImage.src = category.media;
        this.categoryName.textContent = category.name;
        // Set the discovery menus
        const marks = summoning.getSortedMasteryActionsInRealm(category.realm);
        while (this.discoveryElements.length < marks.length) {
            const newDiscovery = createElement('summoning-mark-discovery', {
                className: 'col-6 col-lg-4 col-xl-2',
                parent: this.discoveryContainer,
            });
            this.discoveryElements.push(newDiscovery);
        }
        this.discoveryElemMap.clear();
        for (let i = 0; i < marks.length; i++) {
            const mark = marks[i];
            const menu = this.discoveryElements[i];
            menu.setMark(mark, summoning);
            showElement(menu);
            this.discoveryElemMap.set(mark, menu);
        }
        for (let i = marks.length; i < this.discoveryElements.length; i++) {
            hideElement(this.discoveryElements[i]);
        }
        this.activeCategory = category;
    }
    updateMarkState(mark, summoning) {
        var _a;
        (_a = this.discoveryElemMap.get(mark)) === null || _a === void 0 ? void 0 : _a.updateState(mark, summoning);
    }
    updateDiscoveryCount(mark) {
        var _a;
        (_a = this.discoveryElemMap.get(mark)) === null || _a === void 0 ? void 0 : _a.updateDiscoveryCount(mark);
    }
}
window.customElements.define('summoning-mark-menu', SummoningMarkMenuElement);
//# sourceMappingURL=summoningMenus.js.map
checkFileVersion('?12097')