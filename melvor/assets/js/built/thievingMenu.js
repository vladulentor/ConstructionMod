"use strict";
class ThievingNPCNavElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('thieving-npc-nav-template'));
        this.button = getElementFromFragment(this._content, 'button', 'a');
        this.buttonContent = getElementFromFragment(this._content, 'button-content', 'div');
        this.npcImage = getElementFromFragment(this._content, 'npc-image', 'img');
        this.npcName = getElementFromFragment(this._content, 'npc-name', 'span');
        this.masteryDisplay = getElementFromFragment(this._content, 'mastery-display', 'compact-mastery-display');
        this.perception = getElementFromFragment(this._content, 'perception', 'span');
        this.success = getElementFromFragment(this._content, 'success', 'span');
        this.maxHit = getElementFromFragment(this._content, 'max-hit', 'span');
        this.unlock = getElementFromFragment(this._content, 'unlock', 'div');
        this.level = getElementFromFragment(this._content, 'level', 'span');
        this.abyssalLevel = getElementFromFragment(this._content, 'abyssal-level', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setNPC(npc, thieving) {
        this.npcImage.src = npc.media;
        this.npcName.textContent = npc.name;
        this.masteryDisplay.setMastery(thieving, npc);
        this.perception.textContent = templateLangString('MENU_TEXT_PERCEPTION', {
            value: `${npc.perception}`
        });
        this.level.textContent = '';
        this.level.append(...templateLangStringWithNodes('MENU_TEXT_UNLOCKED_AT', {
            skillImage: createElement('img', {
                className: 'skill-icon-xs mr-1',
                attributes: [
                    ['src', thieving.media]
                ]
            }),
        }, {
            level: `${npc.level}`
        }, false));
        this.abyssalLevel.textContent = '';
        if (npc.abyssalLevel >= 1) {
            this.abyssalLevel.append(...templateLangStringWithNodes('UNLOCKED_AT_ABYSSAL_LEVEL', {
                skillImage: createElement('img', {
                    className: 'skill-icon-xs mr-1',
                    attributes: [
                        ['src', thieving.media]
                    ],
                }),
            }, {
                level: `${npc.abyssalLevel}`
            }, false));
            showElement(this.abyssalLevel);
        } else {
            hideElement(this.abyssalLevel);
        }
    }
    updateNPC(npc, game) {
        this.success.textContent = templateLangString('MENU_TEXT_SUCCESS_RATE', {
            value: `${formatPercent(game.thieving.getNPCSuccessRate(npc), 2)}`,
        });
        let maxHit = numberMultiplier * npc.maxHit;
        if (npc.realm === game.defaultRealm) {
            maxHit = Math.floor(maxHit * (1 - game.combat.player.stats.getResistance(game.normalDamage) / 100));
        }
        this.maxHit.textContent = templateLangString('MENU_TEXT_MAX_HIT', {
            value: `${maxHit}`
        });
    }
    setLocked(npc, thieving) {
        hideElement(this.buttonContent);
        this.buttonContent.classList.remove('d-flex');
        toggleDangerSuccess(this.level, thieving.level >= npc.level);
        toggleDangerSuccess(this.abyssalLevel, thieving.abyssalLevel >= npc.abyssalLevel);
        showElement(this.unlock);
        this.button.onclick = null;
    }
    setUnlocked(callback) {
        showElement(this.buttonContent);
        this.buttonContent.classList.add('d-flex');
        hideElement(this.unlock);
        this.button.onclick = callback;
    }
}
window.customElements.define('thieving-npc-nav', ThievingNPCNavElement);
class ThievingInfoBoxElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('thieving-info-box-template'));
        this.stealth = getElementFromFragment(this._content, 'stealth', 'stealth-icon');
        this.double = getElementFromFragment(this._content, 'double', 'doubling-icon');
        this.xp = getElementFromFragment(this._content, 'xp', 'xp-icon');
        this.abyssalXP = getElementFromFragment(this._content, 'abyssal-xp', 'abyssal-xp-icon');
        this.masteryXP = getElementFromFragment(this._content, 'mastery-xp', 'mastery-xp-icon');
        this.poolXP = getElementFromFragment(this._content, 'pool-xp', 'mastery-pool-icon');
        this.interval = getElementFromFragment(this._content, 'interval', 'interval-icon');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setNPC(thieving, npc) {
        this.xp.setXP(Math.floor(thieving.modifyXP(npc.baseExperience)), npc.baseExperience);
        this.xp.setSources(thieving.getXPSources(npc));
        const interval = thieving.getNPCInterval(npc);
        this.interval.setInterval(interval, thieving.getIntervalSources(npc));
        this.stealth.setNPC(npc, thieving);
        this.stealth.setSources(thieving.getStealthSources(npc));
        const mXP = thieving.getMasteryXPToAddForAction(npc, interval);
        const baseMXP = thieving.getBaseMasteryXPToAddForAction(npc, interval);
        this.masteryXP.setXP(mXP, baseMXP);
        this.masteryXP.setSources(thieving.getMasteryXPSources(npc));
        this.poolXP.setXP(thieving.getMasteryXPToAddToPool(mXP));
        this.poolXP.setRealm(npc.realm);
        this.double.setChance(thieving.getDoublingChance(npc), thieving.getDoublingSources(npc));
        this.abyssalXP.setXP(Math.floor(thieving.modifyAbyssalXP(npc.baseAbyssalExperience)), npc.baseAbyssalExperience);
        this.abyssalXP.setSources(thieving.getAbyssalXPSources(npc));
        if (npc.baseAbyssalExperience > 0)
            showElement(this.abyssalXP);
        else
            hideElement(this.abyssalXP);
    }
}
window.customElements.define('thieving-info-box', ThievingInfoBoxElement);
class ThievingAreaPanelElement extends HTMLElement {
    constructor() {
        super();
        this.npcNavs = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('thieving-area-panel-template'));
        this.header = getElementFromFragment(this._content, 'header', 'div');
        this.eyeIcon = getElementFromFragment(this._content, 'eye-icon', 'i');
        this.areaName = getElementFromFragment(this._content, 'area-name', 'span');
        this.targetContainer = getElementFromFragment(this._content, 'target-container', 'div');
        this.infoContainer = getElementFromFragment(this._content, 'info-container', 'div');
        this.infoSkillName = getElementFromFragment(this._content, 'info-skill-name', 'small');
        this.infoBoxName = getElementFromFragment(this._content, 'info-box-name', 'span');
        this.infoBoxImage = getElementFromFragment(this._content, 'info-box-image', 'img');
        this.infoBox = getElementFromFragment(this._content, 'info-box', 'thieving-info-box');
        this.startButton = getElementFromFragment(this._content, 'start-button', 'button');
        this.dropsButton = getElementFromFragment(this._content, 'drops-button', 'button');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'progress-bar');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setArea(area, thieving) {
        this.infoSkillName.textContent = thieving.name;
        this.areaName.textContent = area.name;
        this.header.onclick = () => thieving.onAreaHeaderClick(area);
        area.npcs.forEach((npc) => {
            const npcNav = createElement('thieving-npc-nav', {
                parent: this.targetContainer
            });
            npcNav.setNPC(npc, thieving);
            this.npcNavs.set(npc, npcNav);
        });
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
    updateNPCsForLevel(thieving, area) {
        this.npcNavs.forEach((npcNav, npc) => {
            if (thieving.level >= npc.level && thieving.abyssalLevel >= npc.abyssalLevel) {
                npcNav.setUnlocked(() => this.selectNPC(area, npc, thieving));
            } else {
                npcNav.setLocked(npc, thieving);
            }
        });
    }
    updateNPCButtons(game) {
        this.npcNavs.forEach((nav, npc) => {
            nav.updateNPC(npc, game);
        });
    }
    selectNPC(area, npc, thieving) {
        if (!thieving.onNPCPanelSelection(npc, area))
            return;
        this.selectedNPC = npc;
        this.updateAreaInfo(thieving);
        this.startButton.onclick = () => thieving.startThieving(area, npc);
        this.dropsButton.onclick = () => thieving.fireNPCDropsModal(area, npc);
    }
    updateAreaInfo(thieving) {
        if (this.selectedNPC !== undefined) {
            showElement(this.infoBox);
            this.infoBox.classList.add('d-flex');
            showElement(this.startButton);
            showElement(this.dropsButton);
            showElement(this.infoBoxImage);
            this.updateNPCInfo(thieving, this.selectedNPC);
        } else {
            this.infoBoxName.textContent = '-';
            hideElement(this.infoBox);
            this.infoBox.classList.remove('d-flex');
            hideElement(this.startButton);
            hideElement(this.dropsButton);
            hideElement(this.infoBoxImage);
        }
    }
    updateNPCInfo(thieving, npc) {
        this.infoBoxName.textContent = npc.name;
        this.infoBoxImage.src = npc.media;
        this.infoBox.setNPC(thieving, npc);
    }
    setStopButton(thieving) {
        this.startButton.textContent = getLangString('MENU_TEXT_STOP_THIEVING');
        this.startButton.classList.remove('btn-success');
        this.startButton.classList.add('btn-danger');
        this.startButton.onclick = () => thieving.stop();
    }
    removeStopButton(thieving, area) {
        this.startButton.textContent = getLangString('MENU_TEXT_PICKPOCKET');
        this.startButton.classList.remove('btn-danger');
        this.startButton.classList.add('btn-success');
        const npc = this.selectedNPC;
        if (npc !== undefined)
            this.startButton.onclick = () => thieving.startThieving(area, npc);
    }
}
window.customElements.define('thieving-area-panel', ThievingAreaPanelElement);
/** Menu class for thieving */
class ThievingMenu {
    constructor(containerID, thieving) {
        this.areaPanels = new Map();
        this.activeArea = undefined;
        const container = document.getElementById(containerID);
        if (container === null)
            throw new Error(`Could not find container with id: ${containerID}`);
        // Construct UI for each area
        thieving.areas.forEach((area) => {
            const areaPanel = createElement('thieving-area-panel', {
                className: 'col-12 col-xl-6',
                parent: container
            });
            areaPanel.setArea(area, thieving);
            this.areaPanels.set(area, areaPanel);
        });
    }
    hideAreaPanel(area) {
        const panel = this.areaPanels.get(area);
        if (panel === undefined)
            return;
        panel.hide();
    }
    showAreaPanel(area) {
        const panel = this.areaPanels.get(area);
        if (panel === undefined)
            return;
        panel.show();
    }
    hideArea(area) {
        const panel = this.areaPanels.get(area);
        if (panel === undefined)
            return;
        hideElement(panel);
    }
    showArea(area) {
        const panel = this.areaPanels.get(area);
        if (panel === undefined)
            return;
        showElement(panel);
    }
    updateNPCsForLevel(thieving) {
        this.areaPanels.forEach((panel, area) => {
            panel.updateNPCsForLevel(thieving, area);
        });
    }
    updateNPCButtons(game) {
        this.areaPanels.forEach((panel) => {
            panel.updateNPCButtons(game);
        });
    }
    selectNPC(npc, area, thieving) {
        const panel = this.areaPanels.get(area);
        if (panel === undefined)
            return;
        panel.selectNPC(area, npc, thieving);
    }
    updateAllAreaPanels(thieving) {
        this.areaPanels.forEach((panel, area) => {
            panel.updateAreaInfo(thieving);
        });
    }
    setStopButton(thieving, area) {
        const panel = this.areaPanels.get(area);
        this.removeStopButton(thieving);
        if (panel === undefined)
            return;
        this.activeArea = area;
        panel.setStopButton(thieving);
    }
    removeStopButton(thieving) {
        var _a;
        const area = this.activeArea;
        if (area !== undefined) {
            (_a = this.areaPanels.get(area)) === null || _a === void 0 ? void 0 : _a.removeStopButton(thieving, area);
        }
        this.activeArea = undefined;
    }
    getProgressBar(area) {
        var _a;
        return (_a = this.areaPanels.get(area)) === null || _a === void 0 ? void 0 : _a.progressBar;
    }
}
//# sourceMappingURL=thievingMenu.js.map
checkFileVersion('?12097')