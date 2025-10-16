"use strict";
class EventManager {
    constructor() {
        this.activeEvents = [];
    }
    getEventData(id) {
        return EVENTS.find((e) => e.id === id);
    }
    isEventActive(event) {
        return event.startDate <= Date.now() && event.endDate >= Date.now();
    }
    getActiveEvents() {
        const activeEvents = EVENTS.filter((e) => this.isEventActive(e));
        return activeEvents;
    }
    createEventContainerElement(event) {
        const eventElement = document.createElement('div');
        eventElement.classList.add('content', 'd-none');
        eventElement.id = `${event.containerId}-container`;
        return eventElement;
    }
    loadEventSidebarElements(event) {
        sidebar.category('Events').item(event.name, {
            icon: event.media,
            nameClass: `page-nav-name-${event.pageId}`,
            // onClick: () => changePage(event.pageId), TODO: Fix when events data redefined
            onRender: ({
                nameEl
            }) => {
                nameEl.style.color = event.sidebarColour;
            },
        });
    }
    loadEventContainerElements(event) {
        const containerElement = this.createEventContainerElement(event);
        const container = document.getElementById('event-container');
        if (container)
            container.appendChild(containerElement);
    }
    //loading functions for events go here
    populateEventContainerElement(event) {
        switch (event.id) {
            case Events.CHRISTMAS2021:
                // game.christmas2021.loadEvent();
                break;
        }
    }
    loadSavedEventData(event) {
        switch (event.id) {
            case Events.CHRISTMAS2021:
                // game.christmas2021.loadProgress();
                break;
        }
    }
    loadEvents() {
        this.activeEvents = this.getActiveEvents();
        this.activeEvents.forEach((e) => {
            this.updateGameLogo(e);
            this.loadEventSidebarElements(e);
            this.loadEventContainerElements(e);
            this.populateEventContainerElement(e);
            this.loadSavedEventData(e);
        });
    }
    updateGameLogo(event) {
        const logo = Array.from(document.getElementsByClassName('game-logo'));
        logo.forEach((l) => {
            l.src = assets.getURI(event.logo);
        });
    }
    rollForEventRewards(actionInterval, skill, rewards) {
        this.activeEvents.forEach((e) => {
            switch (e.id) {
                case Events.CHRISTMAS2021:
                    // if (new Date().getTime() < e.endDate) game.christmas2021.addEventRewards(actionInterval, skill, rewards);
                    break;
            }
        });
    }
    rollForEventRewardsOffline(actionInterval, skill) {
        let reward = -1;
        this.activeEvents.forEach((e) => {
            switch (e.id) {
                case Events.CHRISTMAS2021:
                    // if (new Date().getTime() < e.endDate)
                    // reward = game.christmas2021.addEventRewardsOffline(actionInterval, skill);
            }
        });
        return reward;
    }
    updateEventUI(id) {
        switch (id) {
            case Events.CHRISTMAS2021:
                // game.christmas2021.updateUI();
                break;
        }
    }
}
const EVENTS = [{
    id: Events.CHRISTMAS2021,
    get name() {
        return getLangString(`EVENTS_NAME_${this.id}`);
    },
    get media() {
        return assets.getURI('assets/media/main/sidebar_logo_xmas_2021.png');
    },
    startDate: new Date('Thu, 16 Dec 2021 00:00:00 GMT').getTime(),
    endDate: new Date('Thu, 30 Dec 2021 23:59:59 GMT').getTime(),
    pageId: 32,
    sidebarColour: '#dddf80',
    borderClass: 'border-christmas2021',
    bgClass: 'bg-christmas2021',
    containerId: 'christmas2021',
    logo: 'assets/media/main/logo_xmas_2021.png',
}, ];
//# sourceMappingURL=eventManager.js.map
checkFileVersion('?12097')