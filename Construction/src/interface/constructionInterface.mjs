const { loadModule } = mod.getContext(import.meta);

const { ConstructionHouseMenu } = await loadModule('src/interface/constructionHouseMenu.mjs');
const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');

export class ConstructionInterface {
    constructor(construction) {
        this.renderQueue = new ConstructionRenderQueue();
        this.construction = construction;

        this.constructionSelectionTabs = new Map();

        const frag = new DocumentFragment();
        frag.append(getTemplateNode('rielk-construction-template'));
        this.constructionCategoryMenu = getElementFromFragment(frag, 'rielk-construction-category-menu', 'realmed-category-menu', true);
        this.constructionArtisanMenu = getElementFromFragment(frag, 'rielk-construction-artisan-menu', 'artisan-menu', true);
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
            recipes.sort(BasicSkillRecipe.sortByLevels);
            const tab = createElement('recipe-selection-tab', {
                className: 'col-12 col-md-8 d-none',
                attributes: [['data-option-tag-name', 'rielk-construction-recipe-option']],
                parent: constructionCategoryContainer,
            });
            tab.setRecipes(recipes, construction);
            this.constructionSelectionTabs.set(category, tab);
        });
        this.constructionHouseMenu = new ConstructionHouseMenu(this.constructionHouseElement, construction);
    }

    switchConstructionCategory(category) {
        return this._createSwitchConstructionCategory(this)(category);
    } 
    _createSwitchConstructionCategory() {
        const ui = this;
        return (category) => {
            switch (category.type) {
                case 'House':
                    showElement(ui.constructionHouseElement);
                    hideElement(ui.constructionArtisanElement);
                    switchToCategory(ui.constructionSelectionTabs)(category)
                    break;
                case 'Artisan':
                    showElement(ui.constructionArtisanElement);
                    hideElement(ui.constructionHouseElement);
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
            this.constructionHouseMenu.updateUnlocksPanel();
        }
        this.renderQueue.menu = false;
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
    showFixtureUnlocks(room, fixture, construction){
        this.constructionHouseMenu.showFixtureUnlocks(room, fixture, construction);
    }
    hideFixtureUnlocks(room, fixture, construction){
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
