const { loadModule } = mod.getContext(import.meta);

const { ConstructionHouseMenu } = await loadModule('src/interface/constructionHouseMenu.mjs');
const { mountConstructionGuide } = await loadModule('src/interface/elements/constructionGameGuide.mjs');

const { getRielkLangString, templateRielkLangStringWithNodes } = await loadModule('src/language/translationManager.mjs');
export class ConstructionInterface {
    constructor(construction) {
        this.renderQueue = new ConstructionRenderQueue();
        this.construction = construction;

        this.constructionSelectionTabs = new Map();

        const frag = new DocumentFragment();
        frag.append(getTemplateNode('rielk-construction-template'));
        this.constructionMasteryBar = getElementFromFragment(frag, 'rielk-mastery', 'rielk-construction-mastery', true);

        this.constructionCategoryMenu = getElementFromFragment(frag, 'rielk-construction-category-menu', 'realmed-category-menu', true);
        this.constructionArtisanMenu = getElementFromFragment(frag, 'rielk-construction-artisan-menu', 'cons-artisan-menu', true);
        const constructionCategoryContainer = getElementFromFragment(frag, 'rielk-construction-category-container', 'div', true);
        this.constructionHouseElement = getElementFromFragment(frag, 'rielk-construction-house-element', 'div');
        this.constructionArtisanElement = getElementFromFragment(frag, 'rielk-construction-artisan-element', 'div');
        document.getElementById('main-container').append(...frag.children);

        this.constructionCategoryMenu.addOptions(construction.categories.allObjects, getRielkLangString('MENU_TEXT_SELECT_CONSTRUCTION_CATEGORY'), this._createSwitchConstructionCategory());
        this.constructionArtisanMenu.init(construction);

        construction.categories.forEach((category) => {
            if (category.type !== 'Artisan')
                return;
            const recipes = construction.actions.filter((r) => r.category === category);
            if (window.innerWidth <= 968)
                recipes.sort((a,b) => a.spoofOrderPh - b.spoofOrderPh);// Phone spoof order and windows spoof order
            else
                recipes.sort((a, b) => a.spoofOrder - b.spoofOrder);
            const tab = createElement('recipe-selection-tab', {
                className: 'col-12 col-md-8 d-none',
                attributes: [['data-option-tag-name', 'rielk-construction-recipe-option']],
                parent: constructionCategoryContainer,
            });
            tab.setRecipes(recipes, construction);
            this.constructionSelectionTabs.set(category, tab);
        });
        this.constructionHouseMenu = new ConstructionHouseMenu(this.constructionHouseElement, construction);
        const modalFrag = new DocumentFragment();
        modalFrag.append(getTemplateNode('tier-mastery-menu'));
        document.getElementById('main-container').appendChild(modalFrag);

        mountConstructionGuide({
            construction,
            masteryBarImageSrc: this.constructionMasteryBar._image.src,
            formatter: (typeof window !== 'undefined' && typeof window.formatter === 'function')
                ? window.formatter
                : ({ text }) => text,
        });

        const guideLink = document.querySelector('#game-guide-header-link a.pointer-enabled');
        if (guideLink) {
            const oldClick = guideLink.onclick;
            guideLink.onclick = function (event) {
                if (typeof oldClick === 'function') oldClick.call(this, event);
                construction.disableToolTip();
            };
        }
    }

    switchConstructionCategory(category) {
        return this._createSwitchConstructionCategory(this)(category);
    }
    _createSwitchConstructionCategory() {
        const ui = this;
        return (category) => {
            switch (category.type) {
                case 'House':
                    this.constructionHouseElement.parentElement.parentElement.style.visibility = 'hidden';
                    showElement(ui.constructionHouseElement);
                    hideElement(ui.constructionArtisanElement);
                    this.renderQueue.menu = true;
                    switchToCategory(ui.constructionSelectionTabs)(category)
                    break;
                case 'Artisan':
                    this.constructionHouseElement.parentElement.parentElement.style.visibility = 'visible';
                    showElement(ui.constructionArtisanElement);
                    hideElement(ui.constructionHouseElement);
                    this.renderQueue.recipeInfo = true;
                    switchToCategory(ui.constructionSelectionTabs)(category)
                    break;
            }
        };
    }

    updateRealmSelection(newRealm) {
        this.constructionCategoryMenu.setCurrentRealm(newRealm);
        this.constructionCategoryMenu.addOptions(game.construction.categories.allObjects, getRielkLangString('MENU_TEXT_SELECT_CONSTRUCTION_CATEGORY'), this._createSwitchConstructionCategory());
    }

    render() {
        this.renderMenu();
        this.renderProgressBar();
        this.renderFixtureUnlock();
        this.renderRoomRealmVisibility();
        this.renderMasteryBar();
        this.renderMasteryBonusElements();
        this.renderfixtureItemUpdates();
    }

    renderMasteryBonusElements() {
        if (!this.renderQueue.masteryBonusElements) return;
        this.renderQueue.masteryBonusElements = false;
        const frag = new DocumentFragment();
        frag.append(getTemplateNode('tier-mastery-menu'));
        document.getElementById('main-container').append(...frag.children);
        const container = document.getElementById('pips-container');
        for (const [key, tierData] of this.construction.tierMasteries.registeredObjects) {
            const pip = container.querySelector(`#tier-${tierData.tier}`);
            pip.setBonus(tierData);  // this was so hard to get right
        }


    }
    renderMasteryBar() {
        if (!this.renderQueue.masteryBar) return;
        this.constructionMasteryBar.initMasteryBar(this.construction);
        this.renderQueue.masteryBar = false;

    }

    renderFixtureUnlock() {
        if (!this.renderQueue.fictureUnlock)
            return;
        if (this.constructionHouseMenu == undefined)
            return;
        this.constructionHouseMenu.updateFixturesForLevel(this.construction);
        this.renderQueue.fictureUnlock = false;
    }
    renderRoomRealmVisibility() {
        if (!this.renderQueue.roomRealmVisibility)
            return;
        if (this.constructionHouseMenu == undefined)
            return;
        this.construction.rooms.forEach((room) => {
            room.realm === this.construction.currentRealm ? this.constructionHouseMenu.showRoom(room) : this.constructionHouseMenu.hideRoom(room);
        }
        );
        this.renderQueue.roomRealmVisibility = false;
    }
    renderMenu() {
        if (this.constructionHouseMenu == undefined)
            return;
        if (this.renderQueue.menu) {
            this.constructionHouseMenu.updateAllRoomPanels(this.construction);
            this.constructionHouseMenu.updateFixtureButtons(this.game);
            this.constructionHouseMenu.updateFixtureItems(this.construction);
        }
        this.renderQueue.menu = false;
    }
    renderfixtureItemUpdates() {
        if (this.renderQueue.renderfixtureItemUpdates == false) return;
        if (game?.openPage?._localID !== 'Construction' ||
            this.constructionHouseMenu?.root?.parentElement.parentElement.classList?.contains?.('d-none')) { this.renderQueue.renderfixtureItemUpdates = false; this.renderQueue.renderSpecificfixtureItemUpdate = false; return; }
        //Technically we could check through the category but that's also DOM traversal, not MUCH better.
        if (this.renderQueue.renderSpecificfixtureItemUpdate) { this.constructionHouseMenu.updateCurrentFixtureProg(this.construction); this.renderQueue.renderSpecificfixtureItemUpdate = false; }
        this.constructionHouseMenu.updateFixtureItems(this.construction);
        this.renderQueue.renderfixtureItemUpdates = false;
    }
    renderProgressBar() {
        if (!this.renderQueue.progressBar)
            return;

        if (this.stopLastActiveProgressBar != undefined) {
            this.stopLastActiveProgressBar();
            this.stopLastActiveProgressBar = undefined;
        }
        if (this.construction.isActive) {
            switch (this.construction._actionMode) {
                case 0:
                    this.construction.menu.animateProgressFromTimer(this.construction.actionTimer);
                    this.stopLastActiveProgressBar = () => this.construction.menu.stopProgressBar();
                    break;
                case 1:
                    if (this.construction.selectedRoom === undefined)
                        return;
                    const progressBar = this.constructionHouseMenu.getProgressBar(this.construction.selectedRoom);
                    if (progressBar !== undefined) {
                        progressBar.animateProgressFromTimer(this.construction.actionTimer);
                        this.stopLastActiveProgressBar = () => progressBar.stopAnimation();
                    }
                    break;
                case undefined:
                    break;
            }
        }
        this.renderQueue.progressBar = false;
    }
    renderVisibleRooms() {
        this.construction.rooms.forEach((room) => {
            if (this.construction.hiddenRooms.has(room)) {
                this.hideRoomPanel(room);
            } else {
                this.showRoomPanel(room);
            }
        }
        );
    }
    onRoomHeaderClick(room, construction) {
        if (construction.hiddenRooms.has(room)) {
            construction.hiddenRooms.delete(room);
            this.showRoomPanel(room);
        } else {
            construction.hiddenRooms.add(room);
            this.hideRoomPanel(room);
        }
    }
    selectFixture(fixture, room, construction) {
        this.constructionHouseMenu.selectFixture(fixture, room, construction)
    }
    showFixtureUnlocks(room, fixture, construction) {
        this.constructionHouseMenu.showFixtureUnlocks(room, fixture, construction);
    }
    hideFixtureUnlocks(room, fixture, construction) {
        this.constructionHouseMenu.hideFixtureUnlocks(room, fixture, construction);
    }
    onFixturePanelSelection(fixture, room, construction) {
        this.constructionHouseMenu.roomUnlocksPanel.setFixture(fixture, construction);
        if (construction.isActive && room === construction.selectedRoom && fixture !== construction.selectedFixture) {
            return this.construction.stop();
        } else {
            return true;
        }
    }
    hideRoomPanel(room) {
        return this.constructionHouseMenu.hideRoomPanel(room)
    }
    showRoomPanel(room) {
        return this.constructionHouseMenu.showRoomPanel(room)
    }
}

class ConstructionRenderQueue extends ArtisanSkillRenderQueue {
    constructor() {
        super(...arguments);
        this.menu = false;
        this.fixtureUnlock = false;
        this.roomRealmVisibility = false;
    }
}
