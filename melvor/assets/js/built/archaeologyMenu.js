"use strict";
class DigSiteMapSelectElement extends HTMLElement {
    constructor() {
        super();
        this.mapElements = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('dig-site-map-select-template'));
        this.mapContainer = getElementFromFragment(this._content, 'map-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setDigSite(digSite, archaeology) {
        this.setAttribute('data-digSite-id', digSite.id);
        this.updateMapSelection(digSite, archaeology);
    }
    generateMapSelect(digSite, archaeology) {
        const maxPossibleMaps = 5;
        while (this.mapElements.length < maxPossibleMaps) {
            const img = createElement('img', {
                className: 'skill-icon-sm my-0 mx-2 p-1'
            });
            this.mapContainer.append(img);
            const tooltip = tippy(img, {
                content: this.getTooltipContent(digSite, this.mapElements.length),
                placement: 'top',
                allowHTML: true,
                interactive: false,
                animation: false,
            });
            this.mapElements.push({
                img,
                tooltip
            });
        }
    }
    updateMapSelection(digSite, archaeology) {
        this.generateMapSelect(digSite, archaeology);
        const maxMaps = Math.max(digSite.maps.length, digSite.getMaxMaps());
        this.mapElements.forEach(({
            img,
            tooltip
        }, i) => {
            if (i >= maxMaps) {
                img.src = assets.getURI("assets/media/skills/archaeology/map_locked.png" /* Assets.LockedMapSlot */ );
                tooltip.setContent(this.getLockedMapSlotTooltipContent());
            } else {
                if (i >= digSite.maps.length) {
                    img.src = assets.getURI("assets/media/skills/archaeology/map_blank.png" /* Assets.EmptyMapSlot */ );
                    img.classList.remove('pointer-enabled');
                    img.onclick = null;
                    this.removeOutline(img);
                } else {
                    img.src = assets.getURI("assets/media/skills/archaeology/map_colour.png" /* Assets.FullMapSlot */ );
                    img.classList.add('pointer-enabled');
                    img.onclick = () => archaeology.setMapAsActive(digSite, i);
                    if (digSite.selectedMapIndex === i)
                        this.addOutline(img);
                    else
                        this.removeOutline(img);
                }
                tooltip.setContent(this.getTooltipContent(digSite, i));
            }
            showElement(img);
        });
    }
    removeOutline(img) {
        img.classList.remove('border', 'border-2x', 'border-success');
    }
    addOutline(img) {
        img.classList.add('border', 'border-2x', 'border-success');
    }
    getTooltipContent(digSite, mapIndex) {
        const map = digSite.maps[mapIndex];
        if (map === undefined) {
            return getLangString('EMPTY_MAP_SLOT');
        } else {
            return templateLangString('LEVEL_X_MAP', {
                level: map.level.toFixed(0)
            });
        }
    }
    getLockedMapSlotTooltipContent() {
        return `<div class="font-w600 text-danger text-center">${getLangString('ARCHAEOLOGY_DISITE_TIP_1_TITLE')}</div><div class="text-center">${getLangString('ARCHAEOLOGY_DISITE_TIP_1_DESC')}</div>`;
    }
}
window.customElements.define('dig-site-map-select', DigSiteMapSelectElement);
class ArchaeologyDigSiteContainerElement extends HTMLElement {
    constructor() {
        super();
        this.artefactChances = new Map();
        this.selectedMapBorder = ['border', 'border-2x', 'border-success'];
        this.toolElements = new Map();
        this.toolTooltips = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('archaeology-dig-site-container-template'));
        this.container = getElementFromFragment(this._content, 'dig-site-container', 'div');
        this.name = getElementFromFragment(this._content, 'name', 'span');
        this.level = getElementFromFragment(this._content, 'level', 'span');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.mapSelect = getElementFromFragment(this._content, 'map-select', 'dig-site-map-select');
        this.mapInfoContainer = getElementFromFragment(this._content, 'map-info-container', 'div');
        this.noMapSelected = getElementFromFragment(this._content, 'no-map-selected', 'div');
        this.mapTier = getElementFromFragment(this._content, 'map-tier', 'h5');
        this.mapActions = getElementFromFragment(this._content, 'map-actions', 'div');
        this.mapArtefactValue = getElementFromFragment(this._content, 'map-artefact-value', 'div');
        this.toolContainer = getElementFromFragment(this._content, 'tool-container', 'div');
        this.toolInfoContainer = getElementFromFragment(this._content, 'tool-info-container', 'div');
        this.chanceToFind = getElementFromFragment(this._content, 'chance-to-find', 'div');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'progress-bar');
        this.excavateBtn = getElementFromFragment(this._content, 'excavate-btn', 'button');
        this.showArtefactsBtn = getElementFromFragment(this._content, 'show-artefacts-btn', 'button');
        this.masteryDisplay = getElementFromFragment(this._content, 'mastery-display', 'mastery-display');
        this.mapImage = createElement('img', {
            className: 'skill-icon-sm m-0 mr-3 p-1 pointer-enabled'
        });
        this.mapImage.src = assets.getURI("assets/media/skills/archaeology/map_colour.png" /* Assets.FullMapSlot */ );
        this.blankMapImage = createElement('img', {
            className: 'skill-icon-sm m-0 mr-3 p-1'
        });
        this.blankMapImage.src = assets.getURI("assets/media/skills/archaeology/map_blank.png" /* Assets.EmptyMapSlot */ );
        this.toolImage = createElement('img', {
            className: 'skill-icon-sm m-0 mr-3 p-1 pointer-enabled'
        });
        this.unlockContainer = getElementFromFragment(this._content, 'unlock-container', 'div');
        this.unlockRequirements = getElementFromFragment(this._content, 'unlock-requirements', 'div');
        this.doublingIcon = getElementFromFragment(this._content, 'doubling-icon', 'doubling-icon');
        this.xpIcon = getElementFromFragment(this._content, 'xp-icon', 'xp-icon');
        this.masteryIcon = getElementFromFragment(this._content, 'mastery-icon', 'mastery-xp-icon');
        this.masteryPoolIcon = getElementFromFragment(this._content, 'mastery-pool-icon', 'mastery-pool-icon');
        this.intervalIcon = getElementFromFragment(this._content, 'interval-icon', 'interval-icon');
        this.hasDigSiteRequirement = getElementFromFragment(this._content, 'has-item-requirement', 'i');
        this.areaContainer = getElementFromFragment(this._content, 'area-container', 'div');
        this.eyeToggle = getElementFromFragment(this._content, 'eye-toggle', 'i');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.progressBar.setStyle('bg-archaeology');
        this.itemReqTooltip = tippy(this.hasDigSiteRequirement, {
            placement: 'top',
            allowHTML: true,
            interactive: false,
            animation: false,
        });
    }
    setDigSite(digSite, archaeology) {
        var _a;
        this.name.textContent = digSite.name;
        this.level.textContent = templateLangString('MENU_TEXT_LEVEL', {
            level: `${digSite.level}`
        });
        this.image.src = digSite.media;
        this.mapSelect.setDigSite(digSite, archaeology);
        this.setActiveMap(digSite, archaeology);
        this.setToolSelection(digSite, archaeology);
        digSite.selectedTools.forEach((tool) => {
            this.selectTool(tool);
        });
        this.setActiveTools(digSite, archaeology);
        this.masteryDisplay.setMastery(archaeology, digSite);
        archaeology.updateMasteryDisplays(digSite);
        this.setUnlockRequirements(digSite, archaeology);
        this.showArtefactsBtn.onclick = () => archaeology.showArtefactsForDigSite(digSite);
        this.excavateBtn.onclick = () => archaeology.startDigging(digSite);
        (_a = this.itemReqTooltip) === null || _a === void 0 ? void 0 : _a.setContent(createElement('div', {
            text: getLangString('ARCHAEOLOGY_DISITE_TIP_0'),
            className: 'text-center text-info font-w600',
        }));
        digSite.containsDigSiteRequirement ?
            this.hasDigSiteRequirement.classList.remove('d-none') :
            this.hasDigSiteRequirement.classList.add('d-none');
        this.eyeToggle.onclick = () => archaeology.toggleDigSiteVisibility(digSite);
    }
    setUnlockRequirements(digSite, archaeology) {
        this.unlockRequirements.innerHTML = '';
        const skillImg = createElement('img', {
            className: 'skill-icon-xs mr-2'
        });
        skillImg.src = archaeology.media;
        const level = createElement('h5', {
            className: 'font-size-sm mb-1 font-w600'
        });
        archaeology.level >= digSite.level ? level.classList.add('text-success') : level.classList.add('text-danger');
        level.append(skillImg);
        level.append(createElement('span', {
            text: templateLangString('MENU_TEXT_LEVEL', {
                level: `${digSite.level}`
            })
        }));
        const discovery = createElement('h5', {
            className: 'font-size-sm mb-1 font-w600'
        });
        digSite.isDiscovered ? discovery.classList.add('text-success') : discovery.classList.add('text-danger');
        discovery.textContent = getLangString(`LOCATE_IN_CARTOGRAPHY_TO_UNLOCK`);
        this.unlockRequirements.append(level, discovery);
    }
    setUnlocked() {
        this.container.classList.remove('d-none');
        this.unlockContainer.classList.add('d-none');
        this.unlockContainer.classList.remove('d-flex');
    }
    setLocked() {
        this.container.classList.add('d-none');
        this.unlockContainer.classList.remove('d-none');
        this.unlockContainer.classList.add('d-flex');
    }
    setToolSelection(digSite, archaeology) {
        archaeology.tools.forEach((tool) => {
            const element = this.toolImage.cloneNode(true);
            element.id = `${digSite.id}-${tool.id}`;
            element.src = tool.media;
            element.onclick = () => archaeology.toggleTool(digSite, tool);
            this.toolContainer.appendChild(element);
            this.toolElements.set(tool, element);
            const tooltip = tippy(element, {
                placement: 'top',
                allowHTML: true,
                interactive: false,
                animation: false,
                onShow: (instance) => {
                    instance.setContent(this.getTooltipContent(tool));
                },
            });
            this.toolTooltips.set(tool, tooltip);
            createElement('div', {
                className: 'col-6 font-w700 font-size-sm text-right',
                text: getLangString(`ARCHAEOLOGY_ARTEFACT_SIZE_${tool.artefactType}`),
                parent: this.chanceToFind,
            });
            const artefactChance = createElement('div', {
                className: 'col-6 text-left d-flex align-items-center text-success font-w700 font-size-sm',
                parent: this.chanceToFind,
            });
            this.artefactChances.set(tool, artefactChance);
        });
    }
    getTooltipContent(tool) {
        return tool.name;
    }
    deselectTool(tool) {
        this.removeOutlineSelectedTool(tool);
    }
    selectTool(tool) {
        this.addOutlineSelectedTool(tool);
    }
    setActiveMap(digSite, archaeology) {
        const map = digSite.selectedMap;
        if (map === undefined) {
            this.showNoMapSelected();
            return;
        }
        this.mapTier.innerHTML = templateLangString(`MENU_TEXT_MAP_TIER`, {
            tier: map.tier.name,
        });
        this.mapArtefactValue.innerHTML = templateLangString(`MENU_TEXT_MAP_ARTEFACT_VALUE`, {
            qty: `${game.archaeology.getArtefactValue(ArtefactType.TINY, digSite, map)}, ${game.archaeology.getArtefactValue(ArtefactType.SMALL, digSite, map)}, ${game.archaeology.getArtefactValue(ArtefactType.MEDIUM, digSite, map)}, ${game.archaeology.getArtefactValue(ArtefactType.LARGE, digSite, map)}`,
        });
        this.updateMapCharges(map);
        this.updateArtefactChances(digSite, archaeology);
        this.mapInfoContainer.classList.remove('d-none');
        this.noMapSelected.classList.add('d-none');
    }
    updateMapCharges(map) {
        this.mapActions.innerHTML = templateLangString(`MENU_TEXT_MAP_ACTIONS_REMAINING`, {
            qty: numberWithCommas(map.charges),
        });
    }
    addOutlineSelectedTool(tool) {
        const toolElement = this.toolElements.get(tool);
        toolElement === null || toolElement === void 0 ? void 0 : toolElement.classList.add(...this.selectedMapBorder);
    }
    removeOutlineSelectedTool(tool) {
        const toolElement = this.toolElements.get(tool);
        toolElement === null || toolElement === void 0 ? void 0 : toolElement.classList.remove(...this.selectedMapBorder);
    }
    showNoMapSelected() {
        this.noMapSelected.classList.remove('d-none');
        this.mapInfoContainer.classList.add('d-none');
    }
    setActiveTools(digSite, archaeology) {
        this.updateArtefactChances(digSite, archaeology);
        this.toolInfoContainer.classList.remove('d-none');
    }
    updateArtefactChances(digSite, archaeology) {
        archaeology.tools.forEach((tool) => {
            const chanceElement = this.artefactChances.get(tool);
            if (!chanceElement)
                return;
            if (digSite.selectedMap !== undefined && digSite.selectedTools.includes(tool)) {
                const chance = digSite.selectedMap.getChanceForArtefact(tool.artefactType) / digSite.selectedTools.length;
                chanceElement.textContent = templateLangString('MENU_TEXT_PERCENTAGE', {
                    value: `${chance.toFixed(3)}`
                });
                chanceElement.classList.replace('text-danger', 'text-success');
                chanceElement.classList.replace('font-w700', 'font-w400');
                chanceElement.classList.replace('font-size-xs', 'font-size-sm');
            } else if (digSite.selectedTools.length > 0) {
                chanceElement.textContent = templateLangString('MENU_TEXT_PERCENTAGE', {
                    value: `0`
                });
                chanceElement.classList.replace('text-success', 'text-danger');
                chanceElement.classList.replace('font-w400', 'font-w700');
                chanceElement.classList.replace('font-size-xs', 'font-size-sm');
            } else {
                chanceElement.textContent = getLangString('NO_TOOL_SELECTED');
                chanceElement.classList.replace('text-success', 'text-danger');
                chanceElement.classList.replace('font-w400', 'font-w700');
                chanceElement.classList.replace('font-size-sm', 'font-size-xs');
            }
        });
    }
    setDefaultTool() {}
    removeActiveMap() {
        this.mapInfoContainer.classList.add('d-none');
        this.noMapSelected.classList.remove('d-none');
    }
    getProgressBar() {
        return this.progressBar;
    }
    /** Updates the XP, Mastery XP, Mastery Pool XP and interval icons */
    updateGrants(xp, baseXP, masteryXP, baseMasteryXP, masteryPoolXP, interval, doubling, doublingSources, digSite) {
        this.xpIcon.setXP(xp, baseXP);
        this.xpIcon.setSources(game.archaeology.getXPSources(digSite));
        this.masteryIcon.setXP(masteryXP, baseMasteryXP);
        this.masteryIcon.setSources(game.archaeology.getMasteryXPSources(digSite));
        this.masteryPoolIcon.setXP(masteryPoolXP);
        game.unlockedRealms.length > 1 ? this.masteryPoolIcon.setRealm(digSite.realm) : this.masteryPoolIcon.hideRealms();
        this.intervalIcon.setInterval(interval, game.archaeology.getIntervalSources(digSite));
        this.doublingIcon.setChance(doubling, doublingSources);
    }
    disableExcavateButton() {
        this.excavateBtn.disabled = true;
    }
    enableExcavateButton() {
        this.excavateBtn.disabled = false;
    }
    hideArea() {
        this.areaContainer.classList.add('d-none');
        this.eyeToggle.classList.remove('fa-eye');
        this.eyeToggle.classList.add('fa-eye-slash');
    }
    showArea() {
        this.areaContainer.classList.remove('d-none');
        this.eyeToggle.classList.add('fa-eye');
        this.eyeToggle.classList.remove('fa-eye-slash');
    }
}
window.customElements.define('archaeology-dig-site-container', ArchaeologyDigSiteContainerElement);
class ArtefactDropListElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('artefact-drop-list-template'));
        this.artefactsTiny = getElementFromFragment(this._content, 'artefacts-tiny', 'div');
        this.artefactsSmall = getElementFromFragment(this._content, 'artefacts-small', 'div');
        this.artefactsMedium = getElementFromFragment(this._content, 'artefacts-medium', 'div');
        this.artefactsLarge = getElementFromFragment(this._content, 'artefacts-large', 'div');
        this.hasItemRequirement = getElementFromFragment(this._content, 'has-item-requirement', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setList(digSite) {
        digSite.containsDigSiteRequirement ?
            this.hasItemRequirement.classList.remove('d-none') :
            this.hasItemRequirement.classList.add('d-none');
        digSite.artefacts.tiny.sortedDropsArray.map(({
            item,
            weight,
            minQuantity,
            maxQuantity
        }) => {
            const el = createElement('div');
            el.innerHTML = this.getItemDrop(item, maxQuantity, weight);
            if (item.isGenericArtefact && game.stats.itemFindCount(item) && setLang === 'en')
                el.innerHTML += ` (Generic)`;
            this.artefactsTiny.appendChild(el);
        });
        digSite.artefacts.small.sortedDropsArray.map(({
            item,
            weight,
            minQuantity,
            maxQuantity
        }) => {
            const el = createElement('div');
            el.innerHTML = this.getItemDrop(item, maxQuantity, weight);
            if (item.isGenericArtefact && game.stats.itemFindCount(item) && setLang === 'en')
                el.innerHTML += ` (Generic)`;
            this.artefactsSmall.appendChild(el);
        });
        digSite.artefacts.medium.sortedDropsArray.map(({
            item,
            weight,
            minQuantity,
            maxQuantity
        }) => {
            const el = createElement('div');
            el.innerHTML = this.getItemDrop(item, maxQuantity, weight);
            if (item.isGenericArtefact && game.stats.itemFindCount(item) && setLang === 'en')
                el.innerHTML += ` (Generic)`;
            this.artefactsMedium.appendChild(el);
        });
        digSite.artefacts.large.sortedDropsArray.map(({
            item,
            weight,
            minQuantity,
            maxQuantity
        }) => {
            const el = createElement('div');
            el.innerHTML = this.getItemDrop(item, maxQuantity, weight);
            if (item.isGenericArtefact && game.stats.itemFindCount(item) && setLang === 'en')
                el.innerHTML += ` (Generic)`;
            this.artefactsLarge.appendChild(el);
        });
    }
    getItemDrop(item, quantity, weight) {
        return `${this.formatSpecialDrop(item, quantity)}${this.getWeightBadge(weight)}`;
    }
    getWeightBadge(weight) {
        if (weight <= ArtefactWeightRange.LEGENDARY)
            return `<span class="${WeightBadgeClass.LEGENDARY}">${getLangString('ARCHAEOLOGY_ARTEFACT_RARITY_Legendary')}</span>`;
        if (weight <= ArtefactWeightRange.VERYRARE)
            return `<span class="${WeightBadgeClass.VERYRARE}">${getLangString('ARCHAEOLOGY_ARTEFACT_RARITY_Very_Rare')}</span>`;
        if (weight <= ArtefactWeightRange.RARE)
            return `<span class="${WeightBadgeClass.RARE}">${getLangString('ARCHAEOLOGY_ARTEFACT_RARITY_Rare')}</span>`;
        if (weight <= ArtefactWeightRange.UNCOMMON)
            return `<span class="${WeightBadgeClass.UNCOMMON}">${getLangString('ARCHAEOLOGY_ARTEFACT_RARITY_Uncommon')}</span>`;
        else
            return `<span class="${WeightBadgeClass.COMMON}">${getLangString('ARCHAEOLOGY_ARTEFACT_RARITY_Common')}</span>`;
    }
    formatSpecialDrop(item, qty = 1) {
        const found = game.stats.itemFindCount(item);
        const media = found ? item.media : assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        const name = found ? item.name : getLangString('THIEVING_UNDISCOVERED_ITEM');
        return `${formatNumber(qty)} x <img class="skill-icon-xs mr-2" src="${media}">${name}`;
    }
}
window.customElements.define('artefact-drop-list', ArtefactDropListElement);
class ArchaeologyMuseumItemElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('archaeology-museum-item-template'));
        this.itemImage = getElementFromFragment(this._content, 'item-image', 'img');
        this.inBank = getElementFromFragment(this._content, 'in-bank', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.tooltip = tippy(this.itemImage, {
            placement: 'bottom',
            allowHTML: true,
            interactive: false,
            animation: false,
        });
    }
    disconnectedCallback() {
        if (this.tooltip !== undefined) {
            this.tooltip.destroy();
            this.tooltip = undefined;
        }
    }
    updateItem(item, game) {
        var _a;
        const found = game.stats.itemFindCount(item) > 0;
        this.itemImage.src = found ? item.media : assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        (_a = this.tooltip) === null || _a === void 0 ? void 0 : _a.setProps({
            onShow: (instance) => {
                instance.setContent(this.getItemTooltipHTML(item, game));
            },
        });
    }
    updateInBank(item, game, museum) {
        const donated = museum.isItemDonated(item);
        if (donated) {
            this.classList.replace('btn-light', 'btn-alt-green');
            this.hideInBank();
        } else if (game.bank.getQty(item) > 0) {
            this.showInBank();
        } else {
            this.hideInBank();
        }
    }
    showInBank() {
        this.inBank.classList.remove('d-none');
    }
    hideInBank() {
        this.inBank.classList.add('d-none');
    }
    getItemTooltipHTML(item, game) {
        var _a;
        let itemTooltip = '';
        let donated = '';
        if ((_a = game.archaeology) === null || _a === void 0 ? void 0 : _a.museum.isItemDonated(item)) {
            donated += `<small class="text-success">${getLangString('ITEM_ALREADY_DONATED')}</small>`;
        }
        if (game.stats.itemFindCount(item) > 0) {
            itemTooltip = `<div class='text-center'>${item.name}
        <div>${donated}</div>
        <div><small>${templateLangString('EVENTS_DESC_0_8', {
                num: `<span class='text-warning'>${numberWithCommas(game.bank.getQty(item))}</span>`,
            })}</small></div>
        <div><small class='text-info'>${getLangString('STATISTICS_ITEMS_0')} <span class="text-warning">${numberWithCommas(game.stats.itemFindCount(item))}</span></small></div>`;
        } else {
            itemTooltip = `<div class='text-center text-danger'>???</div>`;
        }
        return itemTooltip;
    }
}
window.customElements.define('archaeology-museum-item', ArchaeologyMuseumItemElement);
var WeightBadgeClass;
(function(WeightBadgeClass) {
    WeightBadgeClass["COMMON"] = "font-size-xs badge badge-success ml-2";
    WeightBadgeClass["UNCOMMON"] = "font-size-xs badge badge-warning ml-2";
    WeightBadgeClass["RARE"] = "font-size-xs badge badge-danger ml-2";
    WeightBadgeClass["VERYRARE"] = "font-size-xs badge badge-primary ml-2";
    WeightBadgeClass["LEGENDARY"] = "font-size-xs badge badge-secondary ml-2";
})(WeightBadgeClass || (WeightBadgeClass = {}));
class ArchaeologyMuseumElement extends HTMLElement {
    constructor() {
        super();
        this.artefacts = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('archaeology-museum-template'));
        this.donationCount = getElementFromFragment(this._content, 'donation-count', 'dt');
        this.nextRewardCount = getElementFromFragment(this._content, 'next-reward-count', 'dt');
        this.donateGenericButton = getElementFromFragment(this._content, 'donate-generic-button', 'button');
        this.tokenGainCount = getElementFromFragment(this._content, 'token-gain-count', 'span');
        this.tokensInBankCount = getElementFromFragment(this._content, 'tokens-in-bank-count', 'span');
        this.artefactContainers = {
            tiny: getElementFromFragment(this._content, 'tiny-container', 'div'),
            small: getElementFromFragment(this._content, 'small-container', 'div'),
            medium: getElementFromFragment(this._content, 'medium-container', 'div'),
            large: getElementFromFragment(this._content, 'large-container', 'div'),
        };
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    init(archaeology) {
        this.loadArtefacts(archaeology);
        this.donateGenericButton.onclick = () => archaeology.museum.onDonateGenericClick();
    }
    loadArtefacts(archaeology) {
        archaeology.actions.forEach((digSite) => {
            this.createArtefactsForDigSite(archaeology, digSite, ArtefactType.TINY);
            this.createArtefactsForDigSite(archaeology, digSite, ArtefactType.SMALL);
            this.createArtefactsForDigSite(archaeology, digSite, ArtefactType.MEDIUM);
            this.createArtefactsForDigSite(archaeology, digSite, ArtefactType.LARGE);
        });
    }
    createArtefactsForDigSite(archaeology, digSite, size) {
        digSite.artefacts[size].sortedDropsArray.forEach(({
            item
        }) => {
            this.createMuseumItem(item, this.artefactContainers[size], archaeology.museum);
            archaeology.museum.renderQueue.artefacts.add(item);
        });
    }
    createMuseumItem(item, container, museum) {
        if (this.artefacts.has(item))
            return;
        const element = createElement('archaeology-museum-item', {
            className: 'bank-item no-bg btn-light pointer-enabled m-1 resize-48',
            parent: container,
        });
        element.onclick = () => museum.donateItem(item);
        element.updateItem(item, game);
        if (item.ignoreCompletion)
            hideElement(element);
        this.artefacts.set(item, element);
    }
    /** Updates the information shown for donating generic artefacts */
    updateGenericDonationInfo(museum) {
        const {
            tokenGain,
            itemCount
        } = museum.getDonateGenericInfo();
        this.tokenGainCount.innerHTML = templateLangString('ARCHAEOLOGY_MUSEUM_TOKENS_FROM_DONATION', {
            qty: numberWithCommas(tokenGain),
            itemIcon: `<img class="skill-icon-xs mr-1" src="${museum.tokenItem.media}">`,
        });
        this.donateGenericButton.disabled = itemCount === 0;
    }
    updateMuseumTokenCount(game, museum) {
        this.tokensInBankCount.textContent = templateLangString('ARCHAEOLOGY_MUSEUM_TOKENS_IN_BANK', {
            qty: numberWithCommas(game.bank.getQty(museum.tokenItem)),
        });
    }
    /**
     * Updates the donation count, and items until next reward
     * @param museum The museum to render
     */
    updateDonationProgress(museum) {
        this.donationCount.textContent = templateLangString('GOLBIN_RAID_PROGRESS', {
            qty1: `${museum.donationCount}`,
            qty2: `${this.artefacts.size}`,
        });
        this.nextRewardCount.textContent = `${museum.getItemsUntilNextReward()}`;
    }
    updateAllArtefacts(game, museum) {
        this.artefacts.forEach((element, item) => {
            element.updateItem(item, game);
            element.updateInBank(item, game, museum);
        });
    }
    updateArtefact(item, game, museum) {
        const element = this.artefacts.get(item);
        if (element === undefined)
            return;
        element.updateItem(item, game);
        element.updateInBank(item, game, museum);
    }
}
window.customElements.define('archaeology-museum', ArchaeologyMuseumElement);
//# sourceMappingURL=archaeologyMenu.js.map
checkFileVersion('?12097')