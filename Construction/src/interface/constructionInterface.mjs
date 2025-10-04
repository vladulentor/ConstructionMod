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
        this.constructionMasteryBar = getElementFromFragment(frag, 'rielk-mastery', 'rielk-construction-mastery', true);

        this.constructionCategoryMenu = getElementFromFragment(frag, 'rielk-construction-category-menu', 'realmed-category-menu', true);
        this.constructionArtisanMenu = getElementFromFragment(frag, 'rielk-construction-artisan-menu', 'artisan-menu', true);
        const constructionCategoryContainer = getElementFromFragment(frag, 'rielk-construction-category-container', 'div', true);
        this.constructionHouseElement = getElementFromFragment(frag, 'rielk-construction-house-element', 'div');
        this.constructionArtisanElement = getElementFromFragment(frag, 'rielk-construction-artisan-element', 'div');
        document.getElementById('main-container').append(...frag.children);

        this.constructionCategoryMenu.addOptions(construction.categories.allObjects, getRielkLangString('MENU_TEXT_SELECT_CONSTRUCTION_CATEGORY'), this._createSwitchConstructionCategory());
        this.constructionArtisanMenu.init(construction);
        let target = this.constructionArtisanMenu.querySelector('.col-12.block.block-rounded-double.bg-combat-inner-dark');
        if (target) {
            target.style.display = 'none';
        }
        ['mastery-xp-icon', 'mastery-pool-icon'].forEach(tag => {
            let el = this.constructionArtisanMenu.querySelector(tag);
            if (el) el.style.display = 'none'; // we hide it with post-processing since otherwise we'd need our own productionmenu like the one altmagic uses
        });


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
        const modalFrag = new DocumentFragment();
        modalFrag.append(getTemplateNode('tier-mastery-menu'));
        document.getElementById('main-container').appendChild(modalFrag);

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
        this.renderMasteryBar();
        this.renderMasteryBonusElements();
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
        this.renderfixtureItemUpdates(); //this needs to always be called
        if (this.renderQueue.menu) {
            this.constructionHouseMenu.updateFixtureItems();
            this.constructionHouseMenu.updateAllRoomPanels(this.construction);
            this.constructionHouseMenu.updateFixtureButtons(this.game);
        }
        this.renderQueue.menu = false;
    }
    renderfixtureItemUpdates() {

        if (!document.getElementById('rielk-construction-container').classList.contains('d-none') && !this.constructionHouseMenu?.root.parentElement?.parentElement.classList.contains('d-none')) {
            this.constructionHouseMenu.updateFixtureItems(this.construction);
            // this could update up to 8 menus every frame, so we optimize it to only do so when the player is looking at them
        }
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
