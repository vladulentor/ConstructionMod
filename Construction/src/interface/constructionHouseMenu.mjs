export class ConstructionHouseMenu {
    constructor(container, construction) {
        this.roomPanels = new Map();
        this.scrollBeforePanel = 0;
        this.scrollAtPanel = 0;
        this.activeRoom = undefined;
        container = createElement('div', {
            className: 'block-content ',
            parent: container
        });

        this.root = container = createElement('div', {
            className: 'row',
            parent: container
        });
        container.style.visibility = 'visible';
        container.style.marginTop = "-40px";
        container.style.marginLeft = "-34px";
        container.style.marginRight = "-34px";
        var buttonContainer = createElement('div', {
            className: 'col-12 text-center mb-3',
            parent: container
        });
        /*var viewAllModifiersButton = createElement('button', {
            className: 'btn btn-sm btn-alt-warning',
            parent: buttonContainer
        })
        viewAllModifiersButton.role = 'button';
        viewAllModifiersButton.onclick = () => construction.viewAllModifiersOnClick();
        var langString = createElement('rielk-lang-string', {
            parent: viewAllModifiersButton
        }); 
        langString.setAttribute('lang-id', 'MENU_TEXT_SHOW_ALL_ACTIVE_MODIFIERS');     */
        // I personally never say the point of that button, now that our menu is a menu there's no place for it. I doubt anyone will miss it.

        this.panelObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const el = mutation.target;
                    if (!el.classList.contains('d-none')) {
                        this.updateFixtureItems(construction);
                    }
                }
            }
        });
        this.panelObserver.observe(container.parentElement.parentElement, { attributes: true });
        construction.sortedRooms.forEach((room) => {
            const roomPanel = createElement('rielk-construction-room-panel', {
                className: 'col-12 col-xl-6',
                parent: container
            });
            roomPanel.setRoom(room, construction);
            this.roomPanels.set(room, roomPanel);
        });
        this.roomUnlocksPanel = createElement('rielk-construction-upgrades-panel', {
            className: 'col-12 col-xl-6 d-none',
            parent: container
        })
    }
    hideRoomPanel(room) {
        const panel = this.roomPanels.get(room);
        if (panel === undefined)
            return;
        panel.hide();
    }
    showRoomPanel(room) {
        const panel = this.roomPanels.get(room);
        if (panel === undefined)
            return;
        panel.show();
    }
    hideRoom(room) {
        const panel = this.roomPanels.get(room);
        if (panel === undefined)
            return;
        hideElement(panel);
    }
    showRoom(room) {
        const panel = this.roomPanels.get(room);
        if (panel === undefined)
            return;
        showElement(panel);
    }
    updateFixturesForLevel(construction) {
        this.roomPanels.forEach((panel, room) => {
            panel.updateFixturesForLevel(construction, room);
        }
        );
        this.roomUnlocksPanel.updateFixturesForLevel(construction);
    }
    updateFixtureButtons(game) {
        this.roomPanels.forEach((panel) => {
            panel.updateFixtureButtons(game);
        }
        );
    }
    selectFixture(fixture, room, construction) {
        const panel = this.roomPanels.get(room);
        if (panel === undefined)
            return;
        panel.selectFixture(room, fixture, construction);
    }
    showFixtureUnlocks(room, fixture, construction) {
        if (!this.roomUnlocksPanel.classList.contains('d-none') && this.roomUnlocksPanel.fixture !== fixture) 
            return;
        this.scrollBeforePanel = document.documentElement.scrollTop || window.scrollY || 0;
        this.roomPanels.forEach((panel, roomOfPanel) => {
            if (roomOfPanel == room) {
                panel.showFixtureUnlocks(room, fixture, construction);
            } else {
                hideElement(panel);
            }
        });
        this.roomUnlocksPanel.setFixture(fixture, construction);
        showElement(this.roomUnlocksPanel);
    }
    hideFixtureUnlocks(room, fixture, construction) {
        this.roomPanels.forEach((panel, roomOfPanel) => {
            if (roomOfPanel == room)
                panel.hideFixtureUnlocks(roomOfPanel, fixture, construction);
            showElement(panel);
        });
        hideElement(this.roomUnlocksPanel);
        requestAnimationFrame(() => {
            document.documentElement.scrollTo({ top: this.scrollBeforePanel, behavior: 'auto' });
        });
    }
    updateAllRoomPanels(construction, game) {
        this.roomPanels.forEach((panel, room) => {
            panel.updateRoomInfo(construction, game);
        }
        );
    }
    updateCurrentFixtureProg(construction) {
        const panel = this.roomPanels.get(construction.activeBuildRecipe.fixture.room);
        if (panel && panel.selectedFixture)
            panel.updateFixtureInfo(construction, panel.selectedFixture);


    }
    updateFixtureItems(construction) {
        this.roomPanels.forEach((panel) => {
            if (panel.selectedFixture && !panel.disabled && panel != this.roomPanels.get(construction?.selectedFixtureRecipe?.fixture.room)) {
                panel.updateFixtureItemIcons(construction);
            }
        })

    }
    updateUnlocksPanel() {
        this.roomUnlocksPanel.updateModifierInfo();
    }
    getProgressBar(room) {
        var _a;
        return (_a = this.roomPanels.get(room)) === null || _a === void 0 ? void 0 : _a.progressBar;
    }
}
