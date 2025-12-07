const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');
const ctx = mod.getContext(import.meta);

await loadModule('src/interface/elements/constructionEfficiencyIconTooltipElement.mjs');
await loadModule('src/interface/elements/constructionEfficiencyIconElement.mjs');
await loadModule('src/interface/elements/constructionRemainingIcons.mjs');
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
        this.constructText = getElementFromFragment(this._content, 'construct-text', 'small');
        this.targetContainer = getElementFromFragment(this._content, 'target-container', 'div');
        this.productPreservation = getElementFromFragment(this._content, 'product-preservation', 'preservation-icon');
        this.productEfficiency = getElementFromFragment(this._content, 'product-efficiency', 'efficiency-icon');
        this.infoContainer = getElementFromFragment(this._content, 'info-container', 'div');
        this.infoBoxName = getElementFromFragment(this._content, 'product-name', 'span');
        this.infoImageContainer = getElementFromFragment(this._content, 'product-wrapper', 'div');
        this.infoBoxImage = getElementFromFragment(this._content, 'product-image', 'img');
        this.sparkleUnder = getElementFromFragment(this._content, 'sparkle-underlay', 'img');
        this.sparkleUnder.src = ctx.getResourceUrl('assets/eclipse.webp');
        this.sparkleOver = getElementFromFragment(this._content, 'sparkle-overlay', 'img');
        this.sparkleOver.src = ctx.getResourceUrl('assets/stars.webp');
        this.startButton = getElementFromFragment(this._content, 'start-button', 'button');
        this.upgradesButton = getElementFromFragment(this._content, 'upgrades-button', 'button');
        this.builtProgressText = getElementFromFragment(this._content, 'built-progress-text', 'small');
        this.builtProgressBar = getElementFromFragment(this._content, 'built-progress-bar', 'progress-bar');
        this.requires = getElementFromFragment(this._content, 'remaining', 'remaining-box');
        this.haves = getElementFromFragment(this._content, 'remaining-haves', 'remaining-haves-box');
        this.newTooltip = getElementFromFragment(this._content, 'exclamation-mark', 'img');
        this.grants = getElementFromFragment(this._content, 'grants', 'grants-box');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'progress-bar');
        this.buildContainer = getElementFromFragment(this._content, 'build-container', 'div');
        this.interval = getElementFromFragment(this._content, 'interval', 'interval-icon');
        this.progress = 0;
        this.disabled = false;
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.noneSelected ? this.grants.setUnselected() : this.grants.setSelected();

        window.addEventListener('resize', () => {
            const width = parseFloat(getComputedStyle(this.extraDetailsContainer).width);
            this.setdetailscontainer(width);

        });
        this.progressBarBar = this.builtProgressBar.firstElementChild?.firstElementChild;

    }
    setdetailscontainer(detailwidth) {
        if (this.noneSelected /*|| this.productEfficiency.classList.contains('d-none')*/) return;
        if (detailwidth < 220) {
            this.extraDetailsContainer.parentElement.style.marginLeft = '-14px';
            this.extraDetailsContainer.parentElement.style.marginRight = '-14px';
            this.extraDetailsContainer.innerHTML = '';
            this.extraDetailsContainer.className = 'icon-size-48';
            this.extraDetailsContainer.style.display = 'flex';
            this.extraDetailsContainer.style.flexDirection = 'column';
            this.extraDetailsContainer.style.alignItems = 'flex-start';
            this.extraDetailsContainer.style.padding = '0';
            this.extraDetailsContainer.style.margin = '0';

            const iconRow = document.createElement('div');
            iconRow.style.display = 'flex';
            iconRow.style.flexWrap = 'nowrap';
            iconRow.style.justifyContent = 'flex-start';
            iconRow.style.alignItems = 'center';
            iconRow.style.gap = '4px';
            iconRow.style.margin = '0';
            [this.productPreservation, this.productEfficiency].forEach(icon => {
                const inner = icon.querySelector('.btn-light');
                if (inner) { inner.classList.remove('m-2'); inner.classList.add('mr-2'); inner.classList.add('mb-2'); }
            });

            iconRow.append(this.productPreservation, this.productEfficiency);

            iconRow.append(this.productPreservation, this.productEfficiency);
            this.extraDetailsContainer.append(iconRow, this.upgradesButton);
        }
        else {
            this.extraDetailsContainer.parentElement.style.marginLeft = '';
            this.extraDetailsContainer.parentElement.style.marginRight = '';
            this.extraDetailsContainer.style.display = '';
            this.extraDetailsContainer.style.flexDirection = '';
            this.extraDetailsContainer.style.alignItems = '';
            this.extraDetailsContainer.style.gap = '';
            this.extraDetailsContainer.innerHTML = '';
            this.extraDetailsContainer.className = 'row icon-size-48';
            const preservationInner = this.productPreservation.querySelector('.btn-light');
            if (preservationInner) preservationInner.style.marginLeft = '';
            this.extraDetailsContainer.append(
                this.upgradesButton,
                this.productPreservation,
                this.productEfficiency
            );
            [this.productPreservation, this.productEfficiency, this.upgradesButton].forEach(el => {
                el.style.flex = '';
                el.style.alignSelf = '';
                el.style.width = '';
                el.style.height = '';
            });
        }

    }
    setroomTooltip(){
        showElement(this.newTooltip);
        this.newTooltip.src = ctx.getResourceUrl('assets/exclamation.webp');
        const tooltext = getRielkLangString("TOOLTIP_NEW_EFFECTS");
        tippy(this.newTooltip, {
                content: `<div class="text-center">${tooltext}</div>`,
                placement: 'top',
                allowHTML: true,
                duration: [50, 180]
            });
    }
    setRoom(room, construction) {
        this.roomName.textContent = room.name;
        if(room.newTooltip)
        this.setroomTooltip();
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
        this.wasdisabled = this.disabled;
        this.disabled = true;
    }
    show() {
        showElement(this.targetContainer);
        showElement(this.infoContainer);
        this.eyeIcon.classList.remove('fa-eye-slash');
        this.eyeIcon.classList.add('fa-eye');
        this.disabled = this.wasdisabled;
        if (this.selectedFixture) this.updateFixtureInfo(game.construction, this.selectedFixture);
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
        if (!fixture.recipes || !construction.ui.onFixturePanelSelection(fixture, room, construction)) return;
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
        requestAnimationFrame(() => window.scrollTo(0, this.scrollBeforePanel));
    }
    updateRoomInfo(construction) {
        if (this.selectedFixture !== undefined) {
            showElement(this.imageContainer);
            showElement(this.builtProgressContainer);
            showElement(this.ingredientsContainer);
            showElement(this.grantsContainer);
            showElement(this.buildContainer);
            showElement(this.extraDetailsContainer);
            showElement(this.productPreservation);
            showElement(this.productEfficiency);
            requestAnimationFrame(() => {
                const detailWidth = parseFloat(getComputedStyle(this.extraDetailsContainer).width);
                this.setdetailscontainer(detailWidth);
            });

            this.detailsContainer.classList.remove('col-12');
            this.detailsContainer.classList.remove('text-center');
            this.detailsContainer.classList.add('col-8');
            this.selectFixtureUI(construction, this.selectedFixture);
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
    selectFixtureUI(construction, fixture) {
        this.noneSelected = false;
        this.infoBoxName.textContent = fixture.name;
        this.infoBoxImage.src = fixture.media;
        this.toggleSparkles(fixture);
        const fixtureRecipe = fixture.currentRecipe;
        if (fixtureRecipe == undefined || fixtureRecipe.level > construction.level || fixture.isMaxTier) {
            hideElement(this.builtProgressContainer);
            hideElement(this.ingredientsContainer);
            hideElement(this.grantsContainer);
            hideElement(this.buildContainer);
            hideElement(this.productPreservation);
            hideElement(this.productEfficiency);
            this.disabled = true;
            return;
        }
        fixture.getCurrentBuildRecipeCosts(construction);
        requestAnimationFrame(() => {
            const detailWidth = parseFloat(getComputedStyle(this.extraDetailsContainer).width);
            this.setdetailscontainer(detailWidth);
        });
        this.disabled = false;
        this.grants.setSelected();
        this.grants.updateAbyssalGrants(Math.floor(construction.modifyAbyssalXP(fixtureRecipe.baseAbyssalExperience)), fixtureRecipe.baseAbyssalExperience);
        this.grants.setSources(construction, fixtureRecipe);
        this.grants.hideMastery();
        this.updateFixtureInfo(construction, fixture);
    }
    addSparkles(fixture) {
        this.constructText.textContent = getRielkLangString('MENU_MAX_TIER');
        this.constructText.classList.add('text-warning');

        // this.sparkleUnder.classList.remove('d-none');
        showElement(this.sparkleOver);

        this.infoBoxImage.style.transform = "scale(0.85)";
        this.infoImageContainer.style.filter = `
  drop-shadow(1px 0 0 #f8ab46ff)
drop-shadow(0 -1px 0 #f8ab46ff)
  drop-shadow(0 1px 0 #f8ab46ff)
  drop-shadow(-1px -1px 0 #f8ab46ff)
  drop-shadow(1px 1px 0 #f8ab46ff)
  drop-shadow(-1px 1px 0 #f8ab46ff)
  drop-shadow(1px -1px 0 #f8ab46ff)`;

    }

    removeSparkles() {

        this.constructText.textContent = getRielkLangString('MENU_TEXT_CONSTRUCT');
        this.constructText.classList.remove('text-warning');

        hideElement(this.sparkleUnder);
        hideElement(this.sparkleOver);


        this.infoBoxImage.style.transform = "scale(1)";
        this.infoImageContainer.style.filter = "none";
    }

    toggleSparkles(fixture) {
        fixture.isMaxTier ? this.addSparkles(fixture) : this.removeSparkles();
    }

    updateFixtureInfo(construction, fixture) {
        if (fixture.isMaxTier) return;

        const fixtureRecipe = fixture.currentRecipe;
        this.progress = fixture.percentProgress;
        this.builtProgressText.textContent = templateRielkLangString('MENU_TEXT_PARTIAL_BUILT_PROGRESS', {
            currentValue: `${formatNumber(fixture.progress)}`,
            maxValue: `${formatNumber(fixtureRecipe.actionCost)}`,
            percent: this.progress == 0 ? '' : `(${formatPercent(this.progress, 2)})`,
        });
        this.builtProgressBar.setFixedPosition(this.progress);
        this.updateCurrentFixtureItemIcons(construction, fixture);
        this.grants.xpIcon.setXP(Math.floor(construction.modifyXP(fixtureRecipe.baseExperience)), fixtureRecipe.baseExperience);
        this.productPreservation.setChance(construction.getPreservationChance(fixtureRecipe), construction.getPreservationCap(fixtureRecipe), construction.getPreservationSources(fixtureRecipe));
        this.productEfficiency.setChance(
            construction.getEfficiencyChance(fixtureRecipe),
            construction.getEfficiencyPotencyMultiplier(fixtureRecipe),
            construction.getEfficiencyCostMultiplier(fixtureRecipe),
            construction.getEfficiencyChancePotencySources(fixtureRecipe), "build");
                this.haves.classList.remove('col-sm-6');
                this.requires.classList.remove('col-sm-6');
        if (construction.wasEfficient && this.progressBarBar) {
            this.progressBarBar.style.setProperty("transition", "background-color 0.05s ease", "important");
            this.progressBarBar.classList.add("efficiency-flash");
            requestAnimationFrame(() => {
                this.progressBarBar.style.setProperty("transition", "background-color 0.4s ease", "important");
                setTimeout(() => {
                    this.progressBarBar.classList.remove("efficiency-flash");
                }, 400);
            });
            construction.wasEfficient = false;
        }

    }

    updateFixtureItemIcons(construction) {
        this.haves.setItemsFromRecipe(this.selectedFixture.UIcost, construction.game);
        this.requires.setItemsFromRecipe(this.selectedFixture.UIcost, construction.game);
    }
    updateCurrentFixtureItemIcons(construction, fixture) { //Working fixture's call.
        this.requires.setItemsFromRecipe(fixture.UIcost, construction.game);
        this.haves.setItemsFromRecipe(fixture.UIcost, construction.game);
    }
    addTotalCostsToRemaining(construction, fixture) {
        this.haves.classList.add('d-none');
        this.requires.setGreen(fixture.UIcost, construction.game);
    }
}
window.customElements.define('rielk-construction-room-panel', ConstructionRoomPanelElement);
