const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');

class ConstructionRoomPanelElement extends HTMLElement {
    constructor() {
        super();
        this.noneSelected = true;
        this.selectedFixture = undefined;
        this.fixtureNavs = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('rielk-construction-room-panel-template'));
        this.header = getElementFromFragment(this._content, 'header', 'div');
        this.eyeIcon = getElementFromFragment(this._content, 'eye-icon', 'i');
        this.imageContainer = getElementFromFragment(this._content, 'image-container', 'div');
        this.builtProgressContainer = getElementFromFragment(this._content, 'built-progress-container', 'div');
        this.ingredientsContainer = getElementFromFragment(this._content, 'ingredients-container', 'div');
        this.grantsContainer = getElementFromFragment(this._content, 'grants-container', 'div');
        this.detailsContainer = getElementFromFragment(this._content, 'details-container', 'div');
        this.extraDetailsContainer = getElementFromFragment(this._content, 'extra-details-container', 'div');
        this.roomName = getElementFromFragment(this._content, 'room-name', 'span');
        this.targetContainer = getElementFromFragment(this._content, 'target-container', 'div');
        this.productPreservation = getElementFromFragment(this._content, 'product-preservation', 'preservation-icon');
        this.infoContainer = getElementFromFragment(this._content, 'info-container', 'div');
        this.infoBoxName = getElementFromFragment(this._content, 'product-name', 'span');
        this.infoBoxImage = getElementFromFragment(this._content, 'product-image', 'img');
        this.startButton = getElementFromFragment(this._content, 'start-button', 'button');
        this.upgradesButton = getElementFromFragment(this._content, 'upgrades-button', 'button');
        this.builtProgressText = getElementFromFragment(this._content, 'built-progress-text', 'small');
        this.builtProgressBar = getElementFromFragment(this._content, 'built-progress-bar', 'progress-bar');
        this.requires = getElementFromFragment(this._content, 'requires', 'requires-box');
        this.haves = getElementFromFragment(this._content, 'haves', 'haves-box');
        this.grants = getElementFromFragment(this._content, 'grants', 'grants-box');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'progress-bar');
        this.buildContainer = getElementFromFragment(this._content, 'build-container', 'div');
        this.interval = getElementFromFragment(this._content, 'interval', 'interval-icon');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.noneSelected ? this.grants.setUnselected() : this.grants.setSelected();
        this.grants.hideMastery();
    }

    setRoom(room, construction) {
        this.roomName.textContent = room.name;
        this.header.onclick = () => construction.ui.onRoomHeaderClick(room, construction);
        room.fixtures.forEach((fixture) => {
            const fixtureNav = createElement('rielk-construction-fixture-nav', {
                parent: this.targetContainer
            });
            fixtureNav.setFixture(fixture, construction);
            this.fixtureNavs.set(fixture, fixtureNav);
        }
        );
    }
    hide() {
        hideElement(this.targetContainer);
        hideElement(this.infoContainer);
        this.eyeIcon.classList.remove('fa-eye');
        this.eyeIcon.classList.add('fa-eye-slash');
    }
    show() {
        showElement(this.targetContainer);
        showElement(this.infoContainer);
        this.eyeIcon.classList.remove('fa-eye-slash');
        this.eyeIcon.classList.add('fa-eye');
    }
    updateFixturesForLevel(construction, room) {
        this.fixtureNavs.forEach((fixtureNav, fixture) => {
            if (construction.level >= fixture.level && construction.abyssalLevel >= fixture.abyssalLevel) {
                fixtureNav.setUnlocked(() => this.selectFixture(room, fixture, construction));
            } else {
                fixtureNav.setLocked(fixture, construction);
            }
        }
        );
    }
    updateFixtureButtons(game) {
        this.fixtureNavs.forEach((nav, fixture) => {
            nav.updateFixture(fixture, game);
        }
        );
    }
    selectFixture(room, fixture, construction) {
        if (!construction.ui.onFixturePanelSelection(fixture, room, construction))
            return;
        this.selectedFixture = fixture;
        this.updateRoomInfo(construction);
        this.startButton.onclick = () => construction.toggleBuilding(room, fixture);
        if (construction.ui.constructionHouseMenu.roomUnlocksPanel.classList.contains('d-none'))
            this.upgradesButton.onclick = () => construction.ui.showFixtureUnlocks(room, fixture, construction);
        else
            this.upgradesButton.onclick = () => construction.ui.hideFixtureUnlocks(room, fixture, construction);

        const interval = construction.getFixtureInterval(fixture);
        this.interval.setInterval(interval, construction.getIntervalSources(fixture));
    }
    showFixtureUnlocks(room, fixture, construction) {
        this.upgradesButton.textContent = getRielkLangString('MENU_TEXT_SHOW_GO_BACK');
        this.upgradesButton.onclick = () => construction.ui.hideFixtureUnlocks(room, fixture, construction);
    }
    hideFixtureUnlocks(room, fixture, construction) {
        this.upgradesButton.textContent = getRielkLangString('MENU_TEXT_SHOW_UPGRADES');
        this.upgradesButton.onclick = () => construction.ui.showFixtureUnlocks(room, fixture, construction);
    }
    updateRoomInfo(construction) {
        if (this.selectedFixture !== undefined) {
            showElement(this.imageContainer);
            showElement(this.builtProgressContainer);
            showElement(this.ingredientsContainer);
            showElement(this.grantsContainer);
            showElement(this.buildContainer);
            showElement(this.extraDetailsContainer);
            this.detailsContainer.classList.remove('col-12');
            this.detailsContainer.classList.remove('text-center');
            this.detailsContainer.classList.add('col-8');
            this.updateFixtureInfo(construction, this.selectedFixture);
        } else {
            this.infoBoxName.textContent = '-';
            hideElement(this.imageContainer);
            hideElement(this.builtProgressContainer);
            hideElement(this.ingredientsContainer);
            hideElement(this.grantsContainer);
            hideElement(this.buildContainer);
            hideElement(this.extraDetailsContainer);
            this.detailsContainer.classList.remove('col-8');
            this.detailsContainer.classList.add('col-12');
            this.detailsContainer.classList.add('text-center');
        }
    }
    updateFixtureInfo(construction, fixture) {
        this.noneSelected = false;
        this.infoBoxName.textContent = fixture.name;
        this.infoBoxImage.src = fixture.media;

        const fixtureRecipe = fixture.currentRecipe;
        if (fixtureRecipe == undefined || fixtureRecipe.level > construction.level) {
            hideElement(this.builtProgressContainer);
            hideElement(this.ingredientsContainer);
            hideElement(this.grantsContainer);
            hideElement(this.buildContainer);
            hideElement(this.productPreservation);
            return;
        }

        showElement(this.productPreservation);
        const progress = fixture.percentProgress;
        this.builtProgressText.textContent = templateRielkLangString('MENU_TEXT_PARTIAL_BUILT_PROGRESS', {
            currentValue: `${formatNumber(fixture.progress)}`,
            maxValue: `${formatNumber(fixtureRecipe.actionCost)}`,
            percent: progress == undefined ? '' : `(${formatPercent(progress, 2)})`,
        });
        this.builtProgressBar.setFixedPosition(progress == undefined ? 0 : progress);
        this.requires.setItemsFromRecipe(fixtureRecipe);
        const label = this.requires.querySelector('h5 > lang-string[lang-id="MENU_TEXT_REQUIRES"]');
        if (label) label.textContent = getRielkLangString('MENU_TEXT_REMAINING');
        this.haves.setItemsFromRecipe(fixtureRecipe, construction.game);
        const requireIcons = this.requires.querySelectorAll('item-quantity-icon');
         const haveIcons = this.haves.querySelectorAll('item-current-icon');
        requireIcons.forEach((icon, i) => {
            const qtyEl = icon.querySelector("small.badge-pill"); // change the requires to be remaining total cost, by just iterating over the dom to change it, this might not be efficient but it only happens once per click and action
            const haveQtyEl = haveIcons[i]?.querySelector("small.badge-pill");
            const have = parseInt(haveQtyEl.textContent.replace(/,/g, ""), 10);
            const base = parseInt(qtyEl.textContent.replace(/,/g, ""), 10);
            if (!isNaN(base) && !isNaN(have)) {
                let totalCost = base * (fixtureRecipe.actionCost - fixture.progress);
                qtyEl.textContent = formatNumber(Math.max(base, totalCost));
                if (have >= base && have < totalCost) {
                    qtyEl.parentElement?.parentElement.classList.add('border-item-danger'); // special case
                    haveQtyEl.parentElement?.parentElement.classList.add('border-item-danger');
                } else {
                    qtyEl.parentElement?.parentElement.classList.remove('border-item-danger');
                    haveQtyEl.parentElement?.parentElement.classList.remove('border-item-danger');
                }
            }
        });

        if (this.requires.querySelectorAll('item-quantity-icon').length > 2) {
            [this.requires, this.haves].forEach(el => {
                el.classList.remove('col-sm-6'); // Make the bigger projects feel like projects, not just items
            });
        }
        else {
            [this.requires, this.haves].forEach(el => {
                el.classList.add('col-sm-6'); // Make the bigger projects feel like projects, not just items
            });
        }

        this.grants.setSelected();
        this.grants.xpIcon.setXP(Math.floor(construction.modifyXP(fixtureRecipe.baseExperience)), fixtureRecipe.baseExperience);
        this.grants.updateAbyssalGrants(Math.floor(construction.modifyAbyssalXP(fixtureRecipe.baseAbyssalExperience)), fixtureRecipe.baseAbyssalExperience);
        this.grants.setSources(construction, fixtureRecipe);
        this.grants.hideMastery();
        this.productPreservation.setChance(construction.getPreservationChance(fixtureRecipe), construction.getPreservationCap(fixtureRecipe), construction.getPreservationSources(fixtureRecipe));
    }
}
window.customElements.define('rielk-construction-room-panel', ConstructionRoomPanelElement);
