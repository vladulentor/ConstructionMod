"use strict";
class TownshipResourceDisplayElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-resource-display-template'));
        this.setPriorityButton = getElementFromFragment(this._content, 'set-priority-button', 'li');
        this.resourceIcon = getElementFromFragment(this._content, 'resource-icon', 'img');
        this.resourceAmount = getElementFromFragment(this._content, 'resource-amount', 'small');
        this.resourceRate = getElementFromFragment(this._content, 'resource-rate', 'small');
        this.storageOverlayDIv = getElementFromFragment(this._content, 'storage-overlay', 'div');
        this.storageOverlayImg = getElementFromFragment(this._content, 'storage-overlay-img', 'img');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.tooltip = tippy(this.setPriorityButton, {
            placement: 'top',
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
    setResource(resource, township) {
        var _a;
        this.resourceIcon.src = resource.media;
        this.updateResourceAmount(resource, township);
        this.updateResourceRate(resource);
        (_a = this.tooltip) === null || _a === void 0 ? void 0 : _a.setProps({
            onShow: (instance) => {
                instance.setContent(this.getTooltipContent(resource, township));
            },
        });
        this.updateStorageIcon(resource);
    }
    updateStorageIcon(resource) {
        if (resource.id === "melvorF:GP" /* TownshipResourceIDs.GP */ || !cloudManager.hasItAEntitlementAndIsEnabled) {
            hideElement(this.storageOverlayDIv);
            return;
        }
        switch (resource.storageType) {
            case 'Normal':
                this.storageOverlayImg.src = assets.getURI(townshipIcons.storage);
                break;
            case 'Soul':
                this.storageOverlayImg.src = assets.getURI(townshipIcons.soulStorage);
                break;
        }
    }
    updateResourceAmount(resource, township) {
        if (resource.id === "melvorF:GP" /* TownshipResourceIDs.GP */ )
            this.resourceAmount.textContent = templateString(getLangString('TOWNSHIP_MENU_TAX_RATE'), {
                value: township.taxRate.toFixed(1),
            });
        else if (resource.type !== TownshipResourceTypeID.Currency) {
            this.resourceAmount.textContent =
                (game.settings.enableAccessibility ? `${resource.name}: ` : '') + numberWithCommas(Math.floor(resource.amount));
            this.updateResourceTextColour(resource, township);
        }
    }
    updateResourceTextColour(resource, township) {
        if (resource.amount >= township.getMaxResourceAmount(resource)) {
            this.resourceAmount.classList.add('text-warning');
        } else {
            this.resourceAmount.classList.remove('text-warning');
        }
    }
    updateResourceRate(resource) {
        const netRate = resource.generation;
        // TODO: Refactor this as resources can no longer be negative
        this.resourceRate.textContent = templateLangString('PER_TICK', {
            value: `${netRate > 0 ? '+' : ''}${numberWithCommas(netRate.toFixed(2))}`,
        });
        this.resourceRate.classList.remove('text-success', 'text-muted', 'text-danger');
        if (netRate > 0) {
            this.resourceRate.classList.add('text-success');
        } else if (netRate === 0) {
            this.resourceRate.classList.add('text-muted');
        } else {
            this.resourceRate.classList.add('text-danger');
        }
    }
    getTooltipContent(resource, township) {
        let extraInfo = '';
        if (resource.id === "melvorF:GP" /* TownshipResourceIDs.GP */ ) {
            extraInfo = `<br><small class="font-w600">${templateString(getLangString('TOWNSHIP_MENU_TOTAL_GP_EARNED'), {
                number: `${numberWithCommas(Math.floor(resource.amount))}`,
            })}</span></small>`;
        }
        let storageInfo = '';
        if (resource.type !== TownshipResourceTypeID.Currency && cloudManager.hasItAEntitlementAndIsEnabled) {
            switch (resource.storageType) {
                case 'Normal':
                    storageInfo = `<br><small class="font-w600">${templateLangString('TOWNSHIP_STORAGE_NOTICE', {
                        storageIcon: `<img class="skill-icon-xxs" src="${assets.getURI(townshipIcons.storage)}"/>`,
                    })}</small>`;
                    break;
                case 'Soul':
                    storageInfo = `<br><small class="font-w600">${templateLangString('TOWNSHIP_SOUL_STORAGE_NOTICE', {
                        storageIcon: `<img class="skill-icon-xxs" src="${assets.getURI(townshipIcons.soulStorage)}"/>`,
                    })}</small>`;
                    break;
            }
        }
        return `<div class="text-center" style="max-width:200px;"><small class="font-w700 text-warning">${resource.name}</small>${storageInfo}${resource.id === "melvorF:GP" /* TownshipResourceIDs.GP */
            ? `<br><small>${templateString(getLangString('TOWNSHIP_MENU_TAX_RATE'), {
                value: `${township.taxRate.toFixed(1)}`,
            })}</small><br>`
            : '<br>'}${extraInfo}</div>`;
    }
}
window.customElements.define('township-resource-display', TownshipResourceDisplayElement);
class TownshipTownBiomeSelectElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-town-biome-select-template'));
        this.selectButton = getElementFromFragment(this._content, 'select-button', 'a');
        this.biomeName = getElementFromFragment(this._content, 'biome-name', 'span');
        this.biomeProgress = getElementFromFragment(this._content, 'biome-progress', 'small');
        this.biomeProgressBar = getElementFromFragment(this._content, 'biome-progress-bar', 'div');
        this.biomeImage = getElementFromFragment(this._content, 'biome-image', 'img');
        this.levelRequirement = getElementFromFragment(this._content, 'level-requirement', 'div');
        this.popRequirement = getElementFromFragment(this._content, 'pop-requirement', 'div');
        this.abyssalLevelRequirement = getElementFromFragment(this._content, 'abyssal-level-requirement', 'div');
        this.fortificationRequirement = getElementFromFragment(this._content, 'fortification-requirement', 'div');
        this.buildAvailable = getElementFromFragment(this._content, 'build-available', 'i');
        this.otherRequirements = getElementFromFragment(this._content, 'other-requirements', 'ul');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setBiome(biome, township) {
        this.selectButton.id = `township-town-biome-select-select-button-${biome.localID}`;
        this.biomeName.textContent = biome.name;
        this.biomeImage.src = biome.media;
        showElement(this.biomeProgress);
        showElement(this.biomeImage);
        this.selectButton.onclick = () => township.setTownBiome(biome);
        this.updateProgress(biome, township);
    }
    highlight(biome) {
        this.selectButton.classList.add('spell-selected');
    }
    unhighlight(biome) {
        this.selectButton.classList.remove('spell-selected');
    }
    updateProgress(biome, township) {
        const progress = township.getBiomeProgress(biome);
        this.biomeProgress.textContent = `${progress.toFixed(1)}%`;
        this.biomeProgressBar.style.width = `${progress}%`;
        if (progress >= 100) {
            this.biomeProgressBar.classList.replace('bg-info', 'bg-success');
            this.biomeProgress.textContent = `100%`;
        }
    }
    applyReqFormatting(req, isMet) {
        if (isMet) {
            req.classList.replace('font-w600', 'font-w400');
            req.classList.replace('text-danger', 'text-success');
        } else {
            req.classList.replace('font-w400', 'font-w600');
            req.classList.replace('text-success', 'text-danger');
        }
    }
    updateRequirements(biome, township) {
        if (township.isBiomeUnlocked(biome)) {
            hideElement(this.levelRequirement);
            hideElement(this.popRequirement);
            hideElement(this.abyssalLevelRequirement);
            hideElement(this.fortificationRequirement);
            hideElement(this.otherRequirements);
            return;
        } else {
            showElement(this.levelRequirement);
            showElement(this.popRequirement);
            if (biome.abyssalTier > 0) {
                showElement(this.abyssalLevelRequirement);
                showElement(this.fortificationRequirement);
            }
            showElement(this.otherRequirements);
        }
        const levelRequired = township.populationForTier[biome.tier].level;
        const popRequired = township.populationForTier[biome.tier].population;
        const abyssalLevelRequired = township.abyssalTierRequirements[biome.abyssalTier].abyssalLevel;
        const fortificationRequired = township.abyssalTierRequirements[biome.abyssalTier].fortification;
        this.applyReqFormatting(this.levelRequirement, township.level >= levelRequired);
        this.levelRequirement.textContent = `${templateLangString('TOWNSHIP_MENU_REQUIRES_LEVEL_BIOME', {
            level: `${levelRequired}`,
        })}`;
        this.applyReqFormatting(this.popRequirement, township.currentPopulation >= popRequired);
        this.popRequirement.textContent = `${templateLangString('TOWNSHIP_MENU_REQUIRES_POPULATION_BIOME', {
            qty: `${numberWithCommas(popRequired)}`,
        })}`;
        this.applyReqFormatting(this.abyssalLevelRequirement, township.abyssalLevel >= abyssalLevelRequired);
        this.abyssalLevelRequirement.textContent = `${templateLangString('MENU_TEXT_REQUIRES_ABYSSAL_LEVEL', {
            level: `${abyssalLevelRequired}`,
        })}`;
        if (fortificationRequired !== 0) {
            this.applyReqFormatting(this.fortificationRequirement, township.currentFortification >= fortificationRequired);
            this.fortificationRequirement.textContent = `${templateLangString('TOWNSHIP_MENU_REQUIRES_FORTIFICATION', {
                value: `${fortificationRequired}`,
            })}`;
            showElement(this.fortificationRequirement);
        } else {
            hideElement(this.fortificationRequirement);
        }
        this.otherRequirements.innerHTML = '';
        this.otherRequirements.append(...printUnlockAllRequirements(biome.requirements));
    }
    showBuildAvailable() {
        showElement(this.buildAvailable);
    }
    hideBuildAvailable() {
        hideElement(this.buildAvailable);
    }
}
window.customElements.define('township-town-biome-select', TownshipTownBiomeSelectElement);
class TownshipBuildingSummaryElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-building-summary-template'));
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.name = getElementFromFragment(this._content, 'name', 'span');
        this.count = getElementFromFragment(this._content, 'count', 'small');
        this.provides = getElementFromFragment(this._content, 'provides', 'ul');
        this.resourceOutput = getElementFromFragment(this._content, 'resource-output', 'div');
        this.modifiers = getElementFromFragment(this._content, 'modifiers', 'div');
        this.extraRequirements = getElementFromFragment(this._content, 'extra-requirements', 'div');
        this.levelRequirement = getElementFromFragment(this._content, 'level-requirement', 'div');
        this.popRequirement = getElementFromFragment(this._content, 'pop-requirement', 'div');
        this.abyssalLevelRequirement = getElementFromFragment(this._content, 'abyssal-level-requirement', 'div');
        this.fortificationRequirement = getElementFromFragment(this._content, 'fortification-requirement', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setBuilding(building, township) {
        this.image.src = building.media;
        this.name.textContent = building.name;
        if (!game.settings.darkMode)
            this.name.classList.replace('text-warning', 'text-primary');
        this.updateBuildingCount(township.countNumberOfBuildings(building));
        this.updateForBaseBuildQty(building, township);
        this.updateExtraRequirements(building, township);
        this.updateModifiers(building);
    }
    updateBuildingCount(count) {
        this.count.textContent = `${count}`;
    }
    createProvidesElement(media, value) {
        return `<li class="mr-2 ${!game.settings.darkMode ? 'rounded bg-light px-1 mb-1' : ''}"><img class="skill-icon-xxs mr-1" src="${media}" />${value > 0 ? '+' : ''}${numberWithCommas(value)}</li>`;
    }
    createPercentProvidesElement(media, value) {
        return `<li class="mr-2 ${!game.settings.darkMode ? 'rounded bg-light px-1 mb-1' : ''}"><img class="skill-icon-xxs mr-1" src="${media}" />${value > 0 ? '+' : ''}${numberWithCommas(value)}%</li>`;
    }
    updateBuildingProvides(building, township, qty = 1) {
        const biome = township.currentTownBiome;
        if (biome === undefined)
            return;
        const provides = [];
        if (township.getPopulationProvidesForBiome(building, biome) !== 0) {
            provides.push(this.createProvidesElement(assets.getURI(townshipIcons.population), township.getPopulationProvidesForBiome(building, biome) * qty));
        }
        if (township.getStorageProvidesForBiome(building, biome) !== 0) {
            provides.push(this.createProvidesElement(assets.getURI(townshipIcons.storage), township.getStorageProvidesForBiome(building, biome) * qty));
        }
        if (township.getEducationProvidesForBiome(building, biome) !== 0) {
            provides.push(this.createPercentProvidesElement(assets.getURI(townshipIcons.education), township.getEducationProvidesForBiome(building, biome) * qty));
        }
        if (township.getHappinessProvidesForBiome(building, biome) !== 0) {
            const baseProvided = township.getHappinessProvidesForBiome(building, biome) * qty;
            provides.push(`<li class="mr-2 ${!game.settings.darkMode ? 'rounded bg-light px-1 mb-1' : ''}"><img class="skill-icon-xxs mr-1" src="${assets.getURI(townshipIcons.happiness)}" />${baseProvided > 0 ? '+' : ''}${baseProvided}%`);
        }
        if (township.getWorshipProvidesForBiome(building, biome) !== 0) {
            provides.push(this.createProvidesElement(assets.getURI(townshipIcons.worship), township.getWorshipProvidesForBiome(building, biome) * qty));
        }
        this.provides.innerHTML = provides.join('');
    }
    updateResourceOutput(building, township) {
        const provides = township.getProvidesForBiome(building, township.currentTownBiome);
        if (township.currentTownBiome === undefined || (provides === null || provides === void 0 ? void 0 : provides.resources.size) === 0) {
            hideElement(this.resourceOutput);
            return;
        }
        showElement(this.resourceOutput);
        let html = '';
        provides === null || provides === void 0 ? void 0 : provides.resources.forEach((quantity, resource) => {
            const originalAmount = quantity * 100;
            const amount = township.currentTownBiome === undefined ?
                0 :
                township.getSingleResourceGainAmountInBiome(resource, building, township.currentTownBiome, true);
            let textClass = ''; //stays default if no change in value
            if (amount > originalAmount)
                textClass = 'text-success';
            else if (amount < originalAmount || amount < 0)
                textClass = 'text-danger';
            const textSymbol = amount < 0 ? '' : '+';
            html += `<ul class="nav-main nav-main-horizontal nav-main-horizontal-override font-w400 font-size-xs">
          <li class="mr-2 ${textClass} ${!game.settings.darkMode ? 'rounded bg-light px-1 mb-1' : ''}"><img class="skill-icon-xxs mr-1" src="${resource.media}"> ${textSymbol}${amount.toFixed(2)} /t</li></ul>`;
        });
        this.resourceOutput.innerHTML = html;
    }
    updateModifiers(building) {
        if (!building.providesStats) {
            hideElement(this.modifiers);
        } else {
            showElement(this.modifiers);
            this.modifiers.innerHTML = `${!game.settings.darkMode ? '<div class="rounded bg-light px-1">' : ''}${building.stats.describeLineBreak()}${!game.settings.darkMode ? '</div>' : ''}`;
        }
    }
    applyReqFormatting(req, isMet) {
        if (isMet) {
            req.classList.replace('font-w600', 'font-w400');
            req.classList.replace('text-danger', 'text-success');
        } else {
            req.classList.replace('font-w400', 'font-w600');
            req.classList.replace('text-success', 'text-danger');
        }
    }
    updateExtraRequirements(building, township) {
        if (township.canBuildTierOfBuilding(building)) {
            hideElement(this.extraRequirements);
            return;
        }
        if (building.abyssalTier < 1) {
            hideElement(this.abyssalLevelRequirement);
            hideElement(this.fortificationRequirement);
        }
        const levelRequired = township.populationForTier[building.tier].level;
        const popRequired = township.populationForTier[building.tier].population;
        const abyssalLevelRequired = township.abyssalTierRequirements[building.abyssalTier].abyssalLevel;
        const fortificationRequired = township.abyssalTierRequirements[building.abyssalTier].fortification;
        this.applyReqFormatting(this.levelRequirement, township.level >= levelRequired);
        this.levelRequirement.textContent = `${templateLangString('TOWNSHIP_MENU_REQUIRES_LEVEL', {
            level: `${levelRequired}`,
        })}`;
        this.applyReqFormatting(this.popRequirement, township.currentPopulation >= popRequired);
        this.popRequirement.textContent = `${templateLangString('TOWNSHIP_MENU_REQUIRES_POPULATION', {
            qty: `${numberWithCommas(popRequired)}`,
        })}`;
        this.applyReqFormatting(this.abyssalLevelRequirement, township.abyssalLevel >= abyssalLevelRequired);
        this.abyssalLevelRequirement.textContent = `${templateLangString('MENU_TEXT_REQUIRES_ABYSSAL_LEVEL', {
            level: `${abyssalLevelRequired}`,
        })}`;
        this.applyReqFormatting(this.fortificationRequirement, township.currentFortification >= fortificationRequired);
        this.fortificationRequirement.textContent = `${templateLangString('TOWNSHIP_MENU_REQUIRES_FORTIFICATION', {
            value: `${fortificationRequired}`,
        })}`;
    }
    updateForBaseBuildQty(building, township) {
        this.updateBuildingProvides(building, township, 1);
        this.updateResourceOutput(building, township);
    }
}
window.customElements.define('township-building-summary', TownshipBuildingSummaryElement);
class BuildingRequirementsElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('building-requirements-template'));
        this.otherRequirements = getElementFromFragment(this._content, 'other-requirements', 'ul');
        this.levelRequirement = getElementFromFragment(this._content, 'level-requirement', 'li');
        this.popRequirement = getElementFromFragment(this._content, 'pop-requirement', 'li');
        this.abyssalLevelRequirement = getElementFromFragment(this._content, 'abyssal-level-requirement', 'li');
        this.fortificationRequirement = getElementFromFragment(this._content, 'fortification-requirement', 'li');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    applyReqFormatting(req, isMet) {
        if (isMet) {
            req.classList.replace('font-w600', 'font-w400');
            req.classList.replace('text-danger', 'text-success');
        } else {
            req.classList.replace('font-w400', 'font-w600');
            req.classList.replace('text-success', 'text-danger');
        }
    }
    updateRequirements(building, township) {
        if (township.canBuildTierOfBuilding(building)) {
            hideElement(this);
            return;
        } else {
            showElement(this);
        }
        if (building.tier > 1) {
            showElement(this.levelRequirement);
            showElement(this.popRequirement);
        } else {
            hideElement(this.levelRequirement);
            hideElement(this.popRequirement);
        }
        if (building.abyssalTier > 0) {
            showElement(this.abyssalLevelRequirement);
            showElement(this.fortificationRequirement);
        } else {
            hideElement(this.abyssalLevelRequirement);
            hideElement(this.fortificationRequirement);
        }
        const levelRequired = township.populationForTier[building.tier].level;
        const popRequired = township.populationForTier[building.tier].population;
        const abyssalLevelRequired = township.abyssalTierRequirements[building.abyssalTier].abyssalLevel;
        const fortificationRequired = township.abyssalTierRequirements[building.abyssalTier].fortification;
        this.applyReqFormatting(this.levelRequirement, township.level >= levelRequired);
        this.levelRequirement.textContent = `${templateLangString('TOWNSHIP_MENU_REQUIRES_LEVEL', {
            level: `${levelRequired}`,
        })}`;
        this.applyReqFormatting(this.popRequirement, township.currentPopulation >= popRequired);
        this.popRequirement.textContent = `${templateLangString('TOWNSHIP_MENU_REQUIRES_POPULATION', {
            qty: `${numberWithCommas(popRequired)}`,
        })}`;
        this.applyReqFormatting(this.abyssalLevelRequirement, township.abyssalLevel >= abyssalLevelRequired);
        this.abyssalLevelRequirement.textContent = `${templateLangString('MENU_TEXT_REQUIRES_ABYSSAL_LEVEL', {
            level: `${abyssalLevelRequired}`,
        })}`;
        if (fortificationRequired !== 0) {
            this.applyReqFormatting(this.fortificationRequirement, township.currentFortification >= fortificationRequired);
            this.fortificationRequirement.textContent = `${templateLangString('TOWNSHIP_MENU_REQUIRES_FORTIFICATION', {
                value: `${fortificationRequired}`,
            })}`;
            showElement(this.fortificationRequirement);
        } else {
            hideElement(this.fortificationRequirement);
        }
        this.otherRequirements.innerHTML = '';
        this.otherRequirements.append(...printUnlockAllRequirements(building.requirements));
    }
}
window.customElements.define('building-requirements', BuildingRequirementsElement);
class BuildingInTownElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('building-in-town-template'));
        this.buildingDiv = getElementFromFragment(this._content, 'building-div', 'div');
        this.buildingImage = getElementFromFragment(this._content, 'building-image', 'img');
        this.buildingName = getElementFromFragment(this._content, 'building-name', 'span');
        this.buildingTaskIcon = getElementFromFragment(this._content, 'building-task-icon', 'img');
        this.buildingTotals = getElementFromFragment(this._content, 'building-totals', 'ul');
        this.resourceOutput = getElementFromFragment(this._content, 'resource-output', 'div');
        this.buildingStats = getElementFromFragment(this._content, 'building-stats', 'div');
        this.requirementsContainer = getElementFromFragment(this._content, 'requirements-container', 'div');
        this.upgradesToContainer = getElementFromFragment(this._content, 'upgrades-to-container', 'div');
        this.upgradesToName = getElementFromFragment(this._content, 'upgrades-to-name', 'li');
        this.upgradesToCosts = getElementFromFragment(this._content, 'upgrades-to-costs', 'ul');
        this.upgradesToProvides = getElementFromFragment(this._content, 'upgrades-to-provides', 'ul');
        this.upgradeButton = getElementFromFragment(this._content, 'upgrade-button', 'button');
        this.upgradeButtonGroup = getElementFromFragment(this._content, 'upgrade-button-group', 'div');
        this.upgradeQtyOptions = getElementFromFragment(this._content, 'upgrade-qty-options', 'div');
        this.upgradeProgressBar = getElementFromFragment(this._content, 'upgrade-progress-bar', 'div');
        this.buildingEfficiency = getElementFromFragment(this._content, 'building-efficiency', 'div');
        this.repairContainer = getElementFromFragment(this._content, 'repair-container', 'div');
        this.repairCosts = getElementFromFragment(this._content, 'repair-costs', 'ul');
        this.repairButton = getElementFromFragment(this._content, 'repair-button', 'button');
        this.upgradeData = getElementFromFragment(this._content, 'upgrade-data', 'ul');
        this.upgradeDataStatus = {
            locked: getElementFromFragment(this._content, 'upgrade-data-locked', 'li'),
            active: getElementFromFragment(this._content, 'upgrade-data-active', 'li'),
            inactive: getElementFromFragment(this._content, 'upgrade-data-inactive', 'li'),
        };
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.upgradesToTooltip = tippy(this.upgradesToName, {
            placement: 'bottom',
            allowHTML: true,
            interactive: false,
            animation: false,
        });
    }
    setUpgradeDataStatus(building, township) {
        this.upgradeData.innerHTML = '';
        for (let i = 0; i < building.totalUpgrades; i++) {
            if (i <= building.upgradePosition) {
                this.upgradeData.append(this.upgradeDataStatus.active.cloneNode(true));
            } else {
                this.upgradeData.append(this.upgradeDataStatus.inactive.cloneNode(true));
            }
        }
    }
    initQtyDropdowns(townshipUI) {
        TownshipUI.upgradeBuildingOptions.forEach((count) => {
            const newOption = createElement('a', {
                className: 'dropdown-item pointer-enabled',
                text: `${count === -1 ? getLangString('MENU_TEXT_MAX') : count}`,
            });
            newOption.onclick = () => townshipUI.setUpgradeQty(count);
            this.upgradeQtyOptions.append(newOption);
        });
    }
    setBuilding(building, township) {
        var _a;
        this.buildingDiv.id = `building-in-town-building-div-${building.localID}`;
        this.buildingTaskIcon.src = assets.getURI('assets/media/skills/township/menu_tasks.png');
        this.setBuildingName(building);
        this.setBuildingMedia(building);
        if (!game.settings.darkMode)
            this.buildingName.classList.replace('text-warning', 'text-primary');
        this.updateBuildingTotals(building, township);
        this.updateResourceTotals(building, township);
        this.updateStatsTotals(building);
        const upgradesTo = building.upgradesTo;
        this.updateBuildingProgress(building, township.currentTownBiome, township);
        this.updateBuildingProgressText(building, township.currentTownBiome);
        this.upgradeButton.onclick = () => township.buildBuilding(building);
        this.repairButton.onclick = () => township.repairBuilding(building);
        this.updateBuildingUpgradeCosts(building, township);
        this.updateBuildingUpgradeProvides(building, township);
        this.updateBuildingEfficiency(building, township);
        this.setUpgradeDataStatus(building, township);
        if (upgradesTo !== undefined) {
            (_a = this.upgradesToTooltip) === null || _a === void 0 ? void 0 : _a.setProps({
                onShow: (instance) => {
                    const summary = new TownshipBuildingSummaryElement();
                    summary.setBuilding(upgradesTo, township);
                    instance.setContent(summary);
                },
            });
        }
    }
    setBuildingName(building) {
        this.buildingName.textContent = building.name;
    }
    setBuildingMedia(building) {
        this.buildingImage.src = building.media;
    }
    updateBuildingRequirements(building, township) {
        const reqs = new BuildingRequirementsElement();
        reqs.updateRequirements(building, township);
        this.requirementsContainer.innerHTML = '';
        this.requirementsContainer.appendChild(reqs);
    }
    updateBuildingUpgradeCosts(building, township) {
        if (township.currentTownBiome === undefined)
            return;
        const upgradeQty = township.upgradeQty > 0 ?
            Math.min(township.upgradeQty, building.maxUpgrades - township.currentTownBiome.getBuildingCount(building)) :
            township.getMaxAffordableBuildingQty(building, township.currentTownBiome);
        this.upgradesToCosts.innerHTML = `<li class="mr-1 font-w600">${getLangString('MENU_TEXT_COST')} (${upgradeQty})</li>
    ${townshipUI.getBuildingCostHTML(building, upgradeQty)}`;
        if (township.canAffordBuilding(building, township.currentTownBiome, upgradeQty)) {
            this.upgradeButton.disabled = false;
            this.upgradeButton.classList.replace('bg-danger', 'bg-success');
        } else {
            this.upgradeButton.disabled = true;
            this.upgradeButton.classList.replace('bg-success', 'bg-danger');
        }
    }
    updateBuildingUpgradeProvides(building, township) {
        if (township.currentTownBiome === undefined)
            return;
        this.upgradesToProvides.innerHTML = `<li class="mr-1 font-w600">${getLangString('TOWNSHIP_MENU_PER_UPGRADE')}</li> ${townshipUI.getBuildingProvidesHTML(building, false)} ${townshipUI.getBuildingResourceOutputHTML(building)} <li>${building.providesStats ? building.stats.describeLineBreak() : ''}</li>`;
    }
    updateBuildingRepairCosts(building, township) {
        if (township.currentTownBiome === undefined)
            return;
        this.repairCosts.innerHTML = `<li class="mr-1 font-w600">${getLangString('TOWNSHIP_MENU_REPAIR_COST')}</li>
    ${townshipUI.getBuildingRepairCostHTML(building)}`;
        this.repairButton.disabled = !township.canAffordRepair(building, township.currentTownBiome);
    }
    toggleBuildOptions(maxUpgrades, canBuildTier, requiresRepair) {
        if (!canBuildTier && !requiresRepair && !maxUpgrades) {
            showElement(this.requirementsContainer);
            hideElement(this.repairContainer);
            hideElement(this.repairButton);
            hideElement(this.upgradesToContainer);
            hideElement(this.upgradeButtonGroup);
        } else {
            canBuildTier ? hideElement(this.requirementsContainer) : showElement(this.requirementsContainer);
            if (!maxUpgrades && canBuildTier) {
                showElement(this.upgradesToContainer);
                showElement(this.upgradeButtonGroup);
                hideElement(this.repairContainer);
                hideElement(this.repairButton);
            } else {
                hideElement(this.upgradesToContainer);
                hideElement(this.upgradeButtonGroup);
                if (requiresRepair) {
                    showElement(this.repairContainer);
                    showElement(this.repairButton);
                } else {
                    hideElement(this.repairContainer);
                    hideElement(this.repairButton);
                }
            }
        }
    }
    showRepairButton() {
        showElement(this.repairButton);
    }
    hideRepairButton() {
        hideElement(this.repairButton);
    }
    showRepairContainer() {
        showElement(this.repairContainer);
    }
    hideRepairContainer() {
        hideElement(this.repairContainer);
    }
    showBuildButton() {
        showElement(this.upgradeButtonGroup);
    }
    hideBuildButton() {
        hideElement(this.upgradeButtonGroup);
    }
    showUpgradesToContainer() {
        showElement(this.upgradesToContainer);
    }
    hideUpgradesToContainer() {
        hideElement(this.upgradesToContainer);
    }
    showBuildRequirements() {
        showElement(this.requirementsContainer);
    }
    hideBuildRequirements() {
        hideElement(this.requirementsContainer);
    }
    createTotalElement(media, total, showPercent = false) {
        return `<li class="mr-2"><img class="skill-icon-xxs mr-1" src="${media}" />${numberWithCommas(total)}${showPercent ? '%' : ''}</li>`;
    }
    updateBuildingTotals(building, township) {
        const biome = township.currentTownBiome;
        if (biome === undefined)
            return;
        const elements = [];
        const totals = {
            population: 0,
            education: 0,
            happiness: 0,
            storage: 0,
            worship: 0,
            soulStorage: 0,
            fortification: 0,
        };
        building.upgradeChain.forEach((b, index) => {
            if (index <= building.upgradePosition) {
                const count = biome.getBuildingCount(b);
                if (township.getPopulationProvidesForBiome(b, biome) !== 0) {
                    totals.population += township.getPopulationProvidesForBiome(b, biome) * count;
                }
                if (township.getStorageProvidesForBiome(b, biome) !== 0) {
                    totals.storage += township.getStorageProvidesForBiome(b, biome) * count;
                }
                if (township.getEducationProvidesForBiome(b, biome) !== 0) {
                    totals.education += township.getEducationProvidesForBiome(b, biome) * count;
                }
                if (township.getHappinessProvidesForBiome(b, biome) !== 0) {
                    totals.happiness += township.getHappinessProvidesForBiome(b, biome) * count;
                }
                if (township.getWorshipProvidesForBiome(b, biome) !== 0) {
                    totals.worship += township.getWorshipProvidesForBiome(b, biome) * count;
                }
                if (township.getSoulStorageProvidesForBiome(b, biome) !== 0) {
                    totals.soulStorage += township.getSoulStorageProvidesForBiome(b, biome) * count;
                }
                if (township.getFortificationProvidesForBiome(b, biome) !== 0) {
                    totals.fortification += township.getFortificationProvidesForBiome(b, biome) * count;
                }
            }
        });
        if (totals.population !== 0) {
            elements.push(this.createTotalElement(assets.getURI(townshipIcons.population), Math.floor(totals.population)));
        }
        if (totals.storage !== 0) {
            elements.push(this.createTotalElement(assets.getURI(townshipIcons.storage), Math.floor(totals.storage)));
        }
        if (totals.soulStorage !== 0) {
            elements.push(this.createTotalElement(assets.getURI(townshipIcons.soulStorage), Math.floor(totals.soulStorage)));
        }
        if (totals.education !== 0) {
            elements.push(this.createTotalElement(assets.getURI(townshipIcons.education), Math.floor(totals.education), true));
        }
        if (totals.happiness !== 0) {
            elements.push(`<li class="mr-2"><img class="skill-icon-xxs mr-1" src="${assets.getURI(townshipIcons.happiness)}" />${numberWithCommas(Math.floor(totals.happiness))}%</li>`);
        }
        if (totals.worship !== 0) {
            elements.push(this.createTotalElement(assets.getURI(townshipIcons.worship), Math.floor(totals.worship)));
        }
        if (totals.fortification !== 0) {
            elements.push(this.createTotalElement(assets.getURI(townshipIcons.fortification), totals.fortification, true));
        }
        this.buildingTotals.innerHTML = elements.join('');
    }
    updateResourceTotals(building, township) {
        let html = '<ul class="nav-main nav-main-horizontal nav-main-horizontal-override font-w400 font-size-xs">';
        const totals = new Map();
        const biome = township.currentTownBiome;
        if (biome !== undefined) {
            building.upgradeChain.forEach((b, index) => {
                if (index <= building.upgradePosition) {
                    const provides = township.getProvidesForBiome(b, biome);
                    provides === null || provides === void 0 ? void 0 : provides.resources.forEach((_, resource) => {
                        const amount = township.getSingleResourceGainAmountInBiome(resource, b, biome, true) * biome.getBuildingCount(b);
                        if (totals.has(resource)) {
                            totals.set(resource, totals.get(resource) + amount);
                        } else {
                            totals.set(resource, amount);
                        }
                    });
                }
            });
            totals.forEach((amount, resource) => {
                html += `<li class="mr-2"><img class="skill-icon-xxs mr-1" src="${resource.media}">+${numberWithCommas(amount.toFixed(2))} /t</li>`;
            });
        }
        html += `</ul>`;
        this.resourceOutput.innerHTML = html;
    }
    updateStatsTotals(building) {
        if (!building.providesStats) {
            hideElement(this.buildingStats);
            return;
        }
        this.buildingStats.innerHTML = StatObject.formatDescriptions(building.stats, getElementHTMLDescriptionFormatter('div', 'font-w400 mb-1', false), building.providedStatMultiplier.neg, building.providedStatMultiplier.pos).join('');
    }
    updateBuildingProgress(building, biome, township) {
        if (township.currentTownBiome === undefined || biome === undefined)
            return;
        const upgradesToLevel = building.maxUpgrades;
        const progress = upgradesToLevel > 0 ? (biome.getBuildingCount(building) / upgradesToLevel) * 100 : 100;
        this.upgradeProgressBar.style.width = `${progress}%`;
        if (progress >= 100) {
            this.upgradeProgressBar.style.width = `100%`;
            this.upgradeProgressBar.classList.replace('bg-warning', 'bg-success');
        } else {
            this.upgradeProgressBar.classList.replace('bg-success', 'bg-warning');
        }
    }
    updateBuildingProgressText(building, biome) {
        if (biome === undefined)
            return;
        if (building.upgradesTo === undefined) {
            this.upgradesToName.innerHTML = `${templateLangString('TOWNSHIP_MENU_BUILT', {
                qty1: `<span class="text-warning font-w600">${biome.getBuildingCount(building)}</span>`,
                qty2: `<span class="font-w600">${building.maxUpgrades}</span>`,
            })}`;
            return;
        }
        this.upgradesToName.innerHTML = templateString(getLangString('TOWNSHIP_MENU_UPGRADE_TO'), {
            qty1: `<span class="text-warning font-w600">${biome.getBuildingCount(building)}</span>`,
            qty2: `<span class="font-w600">${building.maxUpgrades}</span>`,
            buildingName: `<span class="text-warning font-w600">${building.upgradesTo.name}</span>`,
        });
    }
    updateBuildingEfficiency(building, township) {
        this.buildingEfficiency.innerHTML = `<i class="fa fa-tools text-info"></i> <span class="font-w600">${templateLangString('MENU_TEXT_PERCENTAGE', { value: `${township.getBuildingEfficiencyInBiome(building, township.currentTownBiome)}` })}</span>`;
    }
    addGlow() {
        this.buildingDiv.classList.add('active');
    }
    removeGlow() {
        this.buildingDiv.classList.remove('active');
    }
}
window.customElements.define('building-in-town', BuildingInTownElement);
class TownshipYeetElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-yeet-template'));
        this.yeetButton = getElementFromFragment(this._content, 'yeet-button', 'a');
        this.resourceImage = getElementFromFragment(this._content, 'resource-image', 'img');
        this.resourceAmount = getElementFromFragment(this._content, 'resource-amount', 'small');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setResource(resource, amount, township) {
        this.resourceImage.src = resource.media;
        this.resourceAmount.textContent = numberWithCommas(amount);
        this.yeetButton.onclick = () => township.processYeet(resource, amount);
    }
}
window.customElements.define('township-yeet', TownshipYeetElement);
class TownshipCapResourceElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-cap-resource-template'));
        this.resourceImage = getElementFromFragment(this._content, 'resource-image', 'img');
        this.resourceName = getElementFromFragment(this._content, 'resource-name', 'span');
        this.capQtyDropdown = getElementFromFragment(this._content, 'cap-qty-dropdown', 'button');
        this.capQtyOptions = getElementFromFragment(this._content, 'cap-qty-options', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setResource(resource, township) {
        this.resourceImage.src = resource.media;
        this.resourceName.innerText = resource.name;
        this.setCap(resource);
    }
    setCap(resource) {
        this.capQtyDropdown.innerText = `${resource.cap}%`;
    }
    initQtyDropdowns(resource, township) {
        TownshipUI.resourceCapOptions.forEach((value) => {
            const newOption = createElement('a', {
                className: 'dropdown-item pointer-enabled',
                text: `${value}%`
            });
            newOption.onclick = () => township.setResourceCap(resource, value);
            this.capQtyOptions.append(newOption);
        });
    }
}
window.customElements.define('township-cap-resource', TownshipCapResourceElement);
class TownshipConversionElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-conversion-template'));
        this.convertButton = getElementFromFragment(this._content, 'convert-button', 'a');
        this.convertFromImage = getElementFromFragment(this._content, 'convert-from-image', 'img');
        this.itemName = getElementFromFragment(this._content, 'item-name', 'span');
        this.itemDescription = getElementFromFragment(this._content, 'item-description', 'span');
        this.convertQuantity = getElementFromFragment(this._content, 'convert-quantity', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.tooltip = tippy(this.convertButton, {
            placement: 'top',
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
    getLockedTooltip(conversion) {
        const requirements = printUnlockRequirementsAsHTML(conversion.unlockRequirements);
        return requirements.join('');
    }
    getTooltip(resource, conversion) {
        const item = conversion.item;
        let drops = this.getItemContents(item);
        if (drops.length > 0)
            drops = `<div role="separator" class="dropdown-divider"></div><small>${drops}</small>`;
        let text = game.township.convertType === 0 /* TownshipConvertType.ToTownship */ ?
            `<small>${item.name} => ${resource.name}</small>` :
            `${createItemInformationTooltip(item)}${drops}
        <div role="separator" class="dropdown-divider"></div>
        <small>${resource.name} => ${item.name}</small>`;
        text += `<br><small class="text-warning">${templateLangString('EVENTS_DESC_0_8', {
            num: `<span class="text-white">${numberWithCommas(game.bank.getQty(item))}</span>`,
        })}</small>`;
        if (!isRequirementMet(conversion.unlockRequirements)) {
            text += `<div role="separator" class="dropdown-divider"></div>`;
            text += this.getLockedTooltip(conversion);
        }
        return text;
    }
    getItemContents(item) {
        let drops = '';
        if (item instanceof OpenableItem) {
            const dropsOrdered = item.dropTable.sortedDropsArray;
            drops =
                `<strong>${getLangString('BANK_STRING_39')}</strong><br>` +
                dropsOrdered
                .map((drop) => {
                    return templateString(getLangString('BANK_STRING_40'), {
                        qty: `${numberWithCommas(drop.maxQuantity)}`,
                        itemImage: '',
                        itemName: `<span class="text-info">${drop.item.name}</span>`,
                    });
                })
                .join(', ');
        }
        return drops;
    }
    getItemDescription(item) {
        let desc = '';
        if (item.description !== undefined) {
            if (item instanceof EquipmentItem)
                desc += `<strong>${item.validSlots[0].emptyName}</strong><br>`;
            desc += `</strong><span class="text-info">${item.modifiedDescription}</span>`;
        }
        return desc;
    }
    createConvertToSwal(resource, conversion, township) {
        if (!isRequirementMet(conversion.unlockRequirements))
            return;
        if (game.settings.enableQuickConvert) {
            township.updateConvertToQty(township.convertQtyPercent, conversion);
            township.processConversionToTownship(conversion, resource);
            return;
        }
        if (township.convertQtyType === 1 /* TownshipConvertQtyType.Percent */ ) {
            township.updateConvertToQty(township.convertQtyPercent, conversion);
        } else if (township.convertQtyType === 2 /* TownshipConvertQtyType.AllButOne */ ) {
            township.updateConvertToQty(township.convertQty, conversion);
        }
        const element = new TownshipConversionSwalElement();
        element.setConvertToImage(resource.media);
        element.setConvertFromImage(conversion.item.media);
        element.setConvertToRatioQuantity(township.getBaseConvertToTownshipRatio(conversion));
        element.setConvertFromRatioQuantity(1);
        element.setConvertButtons(resource, conversion, 0 /* TownshipConvertType.ToTownship */ );
        const ratio = township.convertQty;
        const bankQty = game.bank.getQty(conversion.item);
        element.setConvertFromQuantity(ratio, bankQty);
        element.setConvertToQuantity(township.getConvertToTownshipRatio(conversion));
        element.hideItemContents();
        SwalLocale.fire({
            title: conversion.item.name,
            html: element,
            showCancelButton: true,
            confirmButtonText: getLangString('MENU_TEXT_CONFIRM'),
        }).then((result) => {
            if (result.isConfirmed)
                township.processConversionToTownship(conversion, resource);
        });
    }
    createConvertFromSwal(resource, conversion, township) {
        if (!isRequirementMet(conversion.unlockRequirements))
            return;
        if (game.stats.itemFindCount(conversion.item) < 0)
            return;
        if (game.settings.enableQuickConvert) {
            township.updateConvertFromQty(township.convertQtyPercent, resource, conversion);
            township.processConversionFromTownship(conversion, resource);
            return;
        }
        const element = new TownshipConversionSwalElement();
        element.setConvertFromImage(resource.media);
        element.setConvertToImage(conversion.item.media);
        element.setConvertToRatioQuantity(1);
        element.setConvertFromRatioQuantity(township.getBaseConvertFromTownshipRatio(conversion));
        element.setConvertButtons(resource, conversion, 1 /* TownshipConvertType.FromTownship */ );
        const ratio = game.township.getConvertToTownshipRatio(conversion);
        const resourceQty = Math.floor(resource.amount);
        element.setConvertFromQuantity(ratio, resourceQty);
        element.setConvertToQuantity(township.convertQty);
        element.setConvertFromQuantityInput(township.convertQty, resource, conversion);
        if (conversion.item instanceof OpenableItem) {
            element.setItemContents(this.getItemContents(conversion.item));
            element.showItemContents();
        } else if (conversion.item.description !== undefined) {
            element.setItemContents(this.getItemDescription(conversion.item));
            element.showItemContents();
        } else
            element.hideItemContents();
        SwalLocale.fire({
            title: conversion.item.name,
            html: element,
            showCancelButton: true,
            confirmButtonText: getLangString('MENU_TEXT_CONFIRM'),
        }).then((result) => {
            if (result.isConfirmed)
                township.processConversionFromTownship(conversion, resource);
        });
    }
    setItemToResource(resource, conversion, township) {
        if (this.tooltip !== undefined) {
            this.tooltip.props.onShow = (instance) => {
                instance.setContent(this.getTooltip(resource, conversion));
            };
        }
        this.convertButton.onclick = () => {
            township.convertType === 0 /* TownshipConvertType.ToTownship */ ?
                this.createConvertToSwal(resource, conversion, township) :
                this.createConvertFromSwal(resource, conversion, township);
        };
        this.convertFromImage.src = conversion.item.media;
        this.itemName.textContent = conversion.item.name;
        if (conversion.item.hasDescription)
            this.itemDescription.innerHTML = conversion.item.modifiedDescription;
        else
            this.itemDescription.textContent = '';
        this.convertQuantity.id = `btn-convert-qty-${resource.id}-${conversion.item.id}`;
        this.updateConvertToRatio(resource, conversion, township);
    }
    updateConvertRatio(resource, conversion, township) {
        township.convertType === 0 /* TownshipConvertType.ToTownship */ ?
            this.updateConvertToRatio(resource, conversion, township) :
            this.updateConvertFromRatio(resource, conversion, township);
    }
    updateConvertToRatio(resource, conversion, township) {
        this.convertQuantity.classList.replace('bg-danger', 'bg-secondary');
        const ratio = township.getBaseConvertToTownshipRatio(conversion);
        this.convertQuantity.innerHTML = `<img class="skill-icon-xxs mr-1" src="${conversion.item.media}">1 => ${numberWithCommas(ratio)}<img class="skill-icon-xxs ml-1" src="${resource.media}">`;
    }
    updateConvertFromRatio(resource, conversion, township) {
        if (!isRequirementMet(conversion.unlockRequirements)) {
            this.convertQuantity.innerHTML = `<i class="fa fa-lock text-white"></i>`;
            this.convertQuantity.classList.replace('bg-secondary', 'bg-danger');
            return;
        }
        this.convertQuantity.classList.replace('bg-danger', 'bg-secondary');
        const ratio = township.getBaseConvertFromTownshipRatio(conversion);
        this.convertQuantity.innerHTML = `<img class="skill-icon-xxs mr-1" src="${resource.media}">${numberWithCommas(ratio)} => 1<img class="skill-icon-xxs ml-1" src="${conversion.item.media}">`;
    }
}
window.customElements.define('township-conversion', TownshipConversionElement);
class TownshipConversionSwalElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-conversion-swal-template'));
        this.convertFromImage = getElementFromFragment(this._content, 'convert-from-image', 'img');
        this.convertFromQuantity = getElementFromFragment(this._content, 'convert-from-quantity', 'small');
        this.convertToImage = getElementFromFragment(this._content, 'convert-to-image', 'img');
        this.convertToQuantity = getElementFromFragment(this._content, 'convert-to-quantity', 'small');
        this.convertFromRatioImage = getElementFromFragment(this._content, 'convert-from-image-ratio', 'img');
        this.convertFromRatioQuantity = getElementFromFragment(this._content, 'convert-from-quantity-ratio', 'small');
        this.convertToRatioImage = getElementFromFragment(this._content, 'convert-to-image-ratio', 'img');
        this.convertToRatioQuantity = getElementFromFragment(this._content, 'convert-to-quantity-ratio', 'small');
        this.receiveImage = getElementFromFragment(this._content, 'receive-image', 'img');
        this.receiveQuantity = getElementFromFragment(this._content, 'receive-quantity', 'small');
        this.btnGroupNumber = getElementFromFragment(this._content, 'btn-group-number', 'div');
        this.btnGroupPercent = getElementFromFragment(this._content, 'btn-group-percent', 'div');
        this.btnNumber = getElementFromFragment(this._content, 'btn-number', 'button');
        this.btnPercent = getElementFromFragment(this._content, 'btn-percent', 'button');
        this.inputQty = getElementFromFragment(this._content, 'convert-quantity-input', 'input');
        this.itemContents = getElementFromFragment(this._content, 'item-contents', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.inputQty.classList.add('d-none'); //hide input for now
    }
    setConvertToImage(media) {
        this.convertToImage.src = media;
        this.convertToRatioImage.src = media;
        this.receiveImage.src = media;
    }
    setConvertToQuantity(qty) {
        this.convertToQuantity.textContent = numberWithCommas(qty);
        this.receiveQuantity.textContent = numberWithCommas(qty);
    }
    setConvertFromImage(media) {
        this.convertFromImage.src = media;
        this.convertFromRatioImage.src = media;
    }
    setConvertFromQuantity(ratio, qty) {
        this.convertFromQuantity.textContent = `${numberWithCommas(ratio)} / ${numberWithCommas(qty)}`;
    }
    setConvertToRatioQuantity(qty) {
        this.convertToRatioQuantity.textContent = numberWithCommas(qty);
    }
    setConvertFromRatioQuantity(qty) {
        this.convertFromRatioQuantity.textContent = numberWithCommas(qty);
    }
    setConvertButtons(resource, conversion, type) {
        this.btnGroupNumber.innerHTML = '';
        this.btnGroupPercent.innerHTML = '';
        game.township.convertValues.percentages.forEach((value, id) => {
            const btn = this.btnPercent.cloneNode(true);
            btn.textContent = `${value}%`;
            btn.onclick = () => {
                Array.from(document.getElementsByClassName(`convert-resource-quick-qty-${game.township.convertQtyPercent}`)).forEach((el) => {
                    el.classList.replace('btn-success', 'btn-primary');
                });
                Array.from(document.getElementsByClassName(`convert-resource-quick-qty-all-but-1`)).forEach((el) => {
                    el.classList.replace('btn-success', 'btn-primary');
                });
                Array.from(document.getElementsByClassName(`convert-resource-quick-qty-${value}`)).forEach((el) => {
                    el.classList.replace('btn-primary', 'btn-success');
                });
                game.township.convertQtyType = 1 /* TownshipConvertQtyType.Percent */ ;
                game.township.convertQtyPercent = value;
                type === 0 /* TownshipConvertType.ToTownship */ ?
                    this.setConvertToQuantityInput(value, resource, conversion) :
                    this.setConvertFromQuantityInput(value, resource, conversion);
            };
            if (game.township.convertQtyType === 1 /* TownshipConvertQtyType.Percent */ && game.township.convertQtyPercent === value)
                btn.classList.replace('btn-primary', 'btn-success');
            btn.classList.add(`convert-resource-quick-qty-${value}`);
            this.btnGroupPercent.append(btn);
            if (id === Math.ceil(game.township.convertValues.percentages.length / 2))
                this.btnGroupPercent.append(createElement('br'));
        });
        const allButOne = this.btnPercent.cloneNode(true);
        allButOne.textContent = getLangString('BANK_STRING_21');
        allButOne.onclick = () => {
            Array.from(document.getElementsByClassName(`convert-resource-quick-qty-${game.township.convertQtyPercent}`)).forEach((el) => {
                el.classList.replace('btn-success', 'btn-primary');
            });
            Array.from(document.getElementsByClassName(`convert-resource-quick-qty-all-but-1`)).forEach((el) => {
                el.classList.replace('btn-primary', 'btn-success');
            });
            game.township.convertQtyType = 2 /* TownshipConvertQtyType.AllButOne */ ;
            type === 0 /* TownshipConvertType.ToTownship */ ?
                this.setConvertToQuantityInput(1, resource, conversion) :
                this.setConvertFromQuantityInput(1, resource, conversion);
        };
        if (game.township.convertQtyType === 2 /* TownshipConvertQtyType.AllButOne */ )
            allButOne.classList.replace('btn-primary', 'btn-success');
        allButOne.classList.add('convert-resource-quick-qty-all-but-1');
        this.btnGroupPercent.append(allButOne);
    }
    setConvertToQuantityInput(value, resource, conversion) {
        game.township.updateConvertToQty(value, conversion);
        this.updateInputValue();
        const ratio = game.township.convertQty;
        const bankQty = game.bank.getQty(conversion.item);
        this.setConvertFromQuantity(ratio, bankQty);
        this.setConvertToQuantity(game.township.getConvertToTownshipRatio(conversion));
    }
    setConvertFromQuantityInput(value, resource, conversion) {
        game.township.updateConvertFromQty(value, resource, conversion);
        this.updateInputValue();
        const ratio = game.township.getConvertFromTownshipRatio(conversion);
        const resourceQty = Math.floor(resource.amount);
        this.setConvertFromQuantity(ratio, resourceQty);
        this.setConvertToQuantity(game.township.convertQty);
    }
    updateInputValue() {
        this.inputQty.value = game.township.convertQty.toString();
    }
    setItemContents(contents) {
        this.itemContents.innerHTML = contents;
    }
    showItemContents() {
        showElement(this.itemContents);
    }
    hideItemContents() {
        hideElement(this.itemContents);
    }
}
window.customElements.define('township-conversion-swal', TownshipConversionSwalElement);
class TownshipWorshipSelectButtonElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-worship-select-button-template'));
        this.selectButton = getElementFromFragment(this._content, 'select-button', 'button');
        this.worshipName = getElementFromFragment(this._content, 'worship-name', 'span');
        this.worshipDescription = getElementFromFragment(this._content, 'worship-description', 'small');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setWorship(worship, township) {
        if (!townshipUI.isWorshipUnlocked(worship)) {
            this.setLocked(worship);
            return;
        } else
            this.setUnlocked(worship);
        if (worship === township.townData.worship) {
            this.setSelected();
        } else {
            this.setUnselected();
        }
        this.selectButton.onclick = () => {
            township.selectWorship(worship);
            this.selectButton.blur();
        };
        this.worshipName.textContent = worship.name;
        this.worshipDescription.textContent = worship.description;
    }
    setSelected() {
        this.selectButton.classList.replace('btn-outline-dark', 'btn-success');
    }
    setUnselected() {
        this.selectButton.classList.replace('btn-success', 'btn-outline-dark');
    }
    setLocked(worship) {
        this.selectButton.classList.replace('btn-outline-dark', 'btn-outline-danger');
        this.selectButton.disabled = true;
        this.worshipName.innerHTML = `<i class="fa fa-lock mr-1 text-danger"></i>${worship.name}`;
    }
    setUnlocked(worship) {
        this.selectButton.classList.replace('btn-outline-danger', 'btn-outline-dark');
        this.selectButton.disabled = false;
        this.worshipName.textContent = worship.name;
    }
}
window.customElements.define('township-worship-select-button', TownshipWorshipSelectButtonElement);
class TownshipWorshipSelectElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-worship-select-template'));
        this.modifierDiv = getElementFromFragment(this._content, 'modifier-div', 'div');
        this.modifierContainer = getElementFromFragment(this._content, 'modifier-container', 'small');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setWorship(worship, township) {
        if (worship.seasonMultiplier.size > 0) {
            const modContainer = this.modifierDiv.appendChild(createElement('div')).appendChild(createElement('small'));
            worship.seasonMultiplier.forEach((value, season) => {
                modContainer.append(createElement('div', {
                    className: 'font-w600 text-success',
                    text: `${templateLangString('TOWNSHIP_MENU_SEASON_MULTIPLIER', {
                        value: `${value}`,
                        seasonName: season.name,
                    })}`,
                }));
            });
        }
        if (Object.keys(worship.modifiers).length === 0)
            this.modifierContainer.append(getLangString('TOWNSHIP_MENU_NO_MODIFIERS'));
        else {
            const spans = getSpansFromModifierObject(worship.modifiers);
            spans.forEach((span) => {
                this.modifierContainer.append(span, createElement('br'));
            });
        }
        if (worship === township.noWorship)
            return;
        township.WORSHIP_CHECKPOINTS.forEach((checkpoint, id) => {
            this.modifierDiv.append(createElement('div', {
                className: 'dropdown-divider',
                attributes: [
                    ['role', 'separator']
                ]
            }));
            const modContainer = this.modifierDiv.appendChild(createElement('div')).appendChild(createElement('small'));
            modContainer.append(createElement('span', {
                className: 'font-w600',
                text: `${templateLangString('TOWNSHIP_MENU_AT_PERCENT', { value: `${checkpoint}` })}`,
            }), createElement('br'));
            const spans = getSpansFromModifierObject(worship.checkpoints[id]);
            spans.forEach((span) => {
                modContainer.append(span, createElement('br'));
            });
        });
    }
}
window.customElements.define('township-worship-select', TownshipWorshipSelectElement);
class TownshipConversionJumpToElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-conversion-jump-to-template'));
        this.resourceIcon = getElementFromFragment(this._content, 'resource-icon', 'img');
        this.resourceList = getElementFromFragment(this._content, 'resource-list', 'li');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setIcon(resource) {
        this.resourceIcon.src = resource.media;
    }
}
window.customElements.define('township-conversion-jump-to', TownshipConversionJumpToElement);
class TownshipTaskCategoryElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-task-category-template'));
        this.button = getElementFromFragment(this._content, 'button', 'a');
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.categoryImage = getElementFromFragment(this._content, 'category-image', 'img');
        this.categoryName = getElementFromFragment(this._content, 'category-name', 'span');
        this.completionIcon = getElementFromFragment(this._content, 'completion-icon', 'i');
        this.completionCount = getElementFromFragment(this._content, 'completion-count', 'h5');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCategory(category, callback) {
        this.button.onclick = callback;
        this.container.classList.add(category.bgClass);
        this.categoryImage.src = category.media;
        this.categoryName.textContent = category.name;
    }
    updateTaskReady(category) {
        if (category.tasksReady > 0) {
            showElement(this.completionIcon);
        } else {
            hideElement(this.completionIcon);
        }
    }
    updateCompletedTasks(tasks, category) {
        const current = category.completedTasks;
        const total = category.totalTasks;
        this.completionCount.textContent = `${current} / ${total}`;
        if (current >= total) {
            this.completionCount.className.replace('text-warning', 'text-success');
        } else {
            this.completionCount.className.replace('text-success', 'text-warning');
        }
        const progress = (current / total) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.progressBar.ariaValueNow = `${progress}`;
    }
}
window.customElements.define('township-task-category', TownshipTaskCategoryElement);
class TownshipCasualTaskCategoryElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-casual-task-category-template'));
        this.button = getElementFromFragment(this._content, 'button', 'a');
        this.completionIcon = getElementFromFragment(this._content, 'completion-icon', 'i');
        this.tasksRemaining = getElementFromFragment(this._content, 'tasks-remaining', 'h5');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCallback(callback) {
        this.button.onclick = callback;
    }
    updateTaskReady(casualTasks) {
        if (casualTasks.isAnyTaskReady) {
            showElement(this.completionIcon);
        } else {
            hideElement(this.completionIcon);
        }
    }
    updateTasksRemaining(casualTasks) {
        this.tasksRemaining.textContent = templateLangString('TOWNSHIP_TASKS_DAILY_TASKS_REMAINING', {
            qty: `${casualTasks.currentCasualTasks.length}`,
        });
    }
}
window.customElements.define('township-casual-task-category', TownshipCasualTaskCategoryElement);
class TownshipTaskGoalElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-task-goal-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.description = getElementFromFragment(this._content, 'description', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setComplete(isComplete) {
        if (isComplete) {
            this.container.classList.replace('spell-not-selected', 'spell-selected');
        } else {
            this.container.classList.replace('spell-selected', 'spell-not-selected');
        }
    }
    setGoal(goal) {
        this.description.textContent = '';
        this.description.innerHTML = goal.getDescriptionHTML();
        this.setComplete(goal.checkIfMet());
    }
}
window.customElements.define('township-task-goal', TownshipTaskGoalElement);
class TownshipTaskRewardElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-task-reward-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCurrencyReward(currency, quantity) {
        this.container.textContent = '';
        this.container.append(createElement('img', {
            className: 'skill-icon-xs mr-1',
            attributes: [
                ['src', currency.media]
            ]
        }), numberWithCommas(quantity));
    }
    setItemReward(item, quantity) {
        this.container.textContent = '';
        this.container.append(`${numberWithCommas(quantity)} `, createElement('img', {
            className: 'skill-icon-xs mr-1',
            attributes: [
                ['src', item.media]
            ]
        }), item.name);
    }
    setSkillXPReward(skill, quantity) {
        this.container.textContent = '';
        this.container.innerHTML = templateLangString('TOWNSHIP_TASKS_REWARD_0', {
            qty1: numberWithCommas(quantity),
            skillIcon: `<img class="skill-icon-xs mr-1" src="${skill.media}">`,
            skillName: skill.name,
        });
    }
    setTownshipResourceReward(resource, quantity) {
        this.container.textContent = '';
        this.container.innerHTML = templateLangString('TOWNSHIP_TASKS_REWARD_1', {
            qty1: numberWithCommas(quantity),
            resourceImg: `<img class="skill-icon-xs mr-1" src="${resource.media}">`,
            resourceName: resource.name,
        });
    }
}
window.customElements.define('township-task-reward', TownshipTaskRewardElement);
class TownshipTaskElement extends HTMLElement {
    constructor() {
        super();
        this.goals = [];
        this.rewards = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-task-template'));
        this.header = getElementFromFragment(this._content, 'header', 'div');
        this.taskName = getElementFromFragment(this._content, 'task-name', 'h3');
        this.realmContainer = getElementFromFragment(this._content, 'realm-container', 'div');
        this.realmImage = getElementFromFragment(this._content, 'realm-image', 'img');
        this.taskDescription = getElementFromFragment(this._content, 'task-description', 'h5');
        this.goalContainer = getElementFromFragment(this._content, 'goal-container', 'div');
        this.rewardsContainer = getElementFromFragment(this._content, 'rewards-container', 'div');
        this.completeButton = getElementFromFragment(this._content, 'complete-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setTask(game, task) {
        if (this.bgClass !== undefined)
            this.header.classList.remove(this.bgClass);
        this.header.classList.add(task.category.bgClass);
        this.bgClass = task.category.bgClass;
        this.taskName.textContent = task.name;
        if (task.hasDescription) {
            this.taskDescription.textContent = task.description;
            showElement(this.taskDescription);
        } else {
            hideElement(this.taskDescription);
        }
        this.createTaskGoals(task.goals.allGoals);
        this.createTaskRewards(task);
        if (game.realms.size > 1) {
            this.realmImage.src = task.realm.media;
            showElement(this.realmContainer);
        } else {
            hideElement(this.realmContainer);
        }
        this.completeButton.onclick = () => game.township.tasks.completeTask(task);
        if (task.goals.checkIfMet()) {
            showElement(this.completeButton);
        } else {
            hideElement(this.completeButton);
        }
    }
    updateGoals(task) {
        if (task.goals.checkIfMet()) {
            showElement(this.completeButton);
        } else {
            hideElement(this.completeButton);
        }
        task.goals.allGoals.forEach((goal, i) => {
            this.goals[i].setGoal(goal);
        });
    }
    createTaskGoals(goals) {
        while (this.goals.length < goals.length) {
            this.goals.push(createElement('township-task-goal', {
                parent: this.goalContainer
            }));
        }
        goals.forEach((goal, i) => {
            const goalElem = this.goals[i];
            goalElem.setGoal(goal);
            showElement(goalElem);
        });
        for (let i = goals.length; i < this.goals.length; i++) {
            hideElement(this.goals[i]);
        }
    }
    createTaskRewards(task) {
        let i = 0;
        const getReward = () => {
            if (this.rewards.length <= i) {
                this.rewards.push(createElement('township-task-reward', {
                    parent: this.rewardsContainer
                }));
            }
            const reward = this.rewards[i];
            showElement(reward);
            i++;
            return reward;
        };
        task.rewards.currencies.forEach(({
            currency,
            quantity
        }) => {
            getReward().setCurrencyReward(currency, quantity);
        });
        task.rewards.items.forEach(({
            item,
            quantity
        }) => {
            getReward().setItemReward(item, quantity);
        });
        task.rewards.skillXP.forEach(({
            skill,
            quantity
        }) => {
            getReward().setSkillXPReward(skill, quantity);
        });
        task.rewards.townshipResources.forEach(({
            resource,
            quantity
        }) => {
            getReward().setTownshipResourceReward(resource, quantity);
        });
        for (i; i < this.rewards.length; i++) {
            hideElement(this.rewards[i]);
        }
    }
}
window.customElements.define('township-task', TownshipTaskElement);
class TownshipCasualTaskElement extends HTMLElement {
    constructor() {
        super();
        this.goals = [];
        this.rewards = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-casual-task-template'));
        this.skipButton = getElementFromFragment(this._content, 'skip-button', 'a');
        this.taskDescription = getElementFromFragment(this._content, 'task-description', 'h5');
        this.goalContainer = getElementFromFragment(this._content, 'goal-container', 'div');
        this.rewardsContainer = getElementFromFragment(this._content, 'rewards-container', 'div');
        this.completeButton = getElementFromFragment(this._content, 'complete-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setTask(casualTasks, task) {
        if (task.hasDescription) {
            this.taskDescription.textContent = task.description;
            showElement(this.taskDescription);
        } else {
            hideElement(this.taskDescription);
        }
        this.createTaskGoals(task.goals.allGoals);
        this.createTaskRewards(casualTasks, task);
        this.skipButton.onclick = () => casualTasks.skipTask(task);
        this.skipButton.innerHTML = templateLangString('TOWNSHIP_TASKS_SKIP_TASK', {
            gpIcon: `<img src="${assets.getURI("assets/media/main/coins.png" /* Assets.GPIcon */)}" class="skill-icon-xxs">`,
            qty: `${numberWithCommas(casualTasks.gpCostToSkip)}`,
        });
        this.completeButton.onclick = () => casualTasks.completeTask(task);
        if (task.goals.checkIfMet()) {
            showElement(this.completeButton);
        } else {
            hideElement(this.completeButton);
        }
    }
    updateGoals(task) {
        if (task.goals.checkIfMet()) {
            showElement(this.completeButton);
        } else {
            hideElement(this.completeButton);
        }
        task.goals.allGoals.forEach((goal, i) => {
            this.goals[i].setGoal(goal);
        });
    }
    createTaskGoals(goals) {
        while (this.goals.length < goals.length) {
            this.goals.push(createElement('township-task-goal', {
                parent: this.goalContainer
            }));
        }
        goals.forEach((goal, i) => {
            const goalElem = this.goals[i];
            goalElem.setGoal(goal);
            showElement(goalElem);
        });
        for (let i = goals.length; i < this.goals.length; i++) {
            hideElement(this.goals[i]);
        }
    }
    createTaskRewards(casualTasks, task) {
        let i = 0;
        const getReward = () => {
            if (this.rewards.length <= i) {
                this.rewards.push(createElement('township-task-reward', {
                    parent: this.rewardsContainer
                }));
            }
            const reward = this.rewards[i];
            showElement(reward);
            i++;
            return reward;
        };
        casualTasks.mapCurrencyRewards(task.rewards.currencies).forEach(({
            currency,
            quantity
        }) => {
            getReward().setCurrencyReward(currency, quantity);
        });
        task.rewards.items.forEach(({
            item,
            quantity
        }) => {
            getReward().setItemReward(item, quantity);
        });
        task.rewards.skillXP.forEach(({
            skill
        }) => {
            getReward().setSkillXPReward(skill, casualTasks.xpReward);
        });
        task.rewards.townshipResources.forEach(({
            resource,
            quantity
        }) => {
            getReward().setTownshipResourceReward(resource, quantity);
        });
        for (i; i < this.rewards.length; i++) {
            hideElement(this.rewards[i]);
        }
    }
}
window.customElements.define('township-casual-task', TownshipCasualTaskElement);
class TownshipTasksMenuElement extends HTMLElement {
    constructor() {
        super();
        this.realmCounts = new Map();
        this.categoryMap = new Map();
        this.taskElems = [];
        this.taskMap = new Map();
        this.casualTaskElems = [];
        this.casualTaskMap = new Map();
        this.mode = 0 /* TownshipTasksMenuElementMode.AllCategories */ ;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('township-tasks-menu-template'));
        this.casualTasksCompleted = getElementFromFragment(this._content, 'casual-tasks-completed', 'li');
        this.nextCasualTaskTimer = getElementFromFragment(this._content, 'next-casual-task-timer', 'li');
        this.buttonContainer = getElementFromFragment(this._content, 'button-container', 'div');
        this.viewAllButton = getElementFromFragment(this._content, 'view-all-button', 'button');
        this.casualTaskButton = getElementFromFragment(this._content, 'casual-task-button', 'button');
        this.categoryContainer = getElementFromFragment(this._content, 'category-container', 'div');
        this.casualTaskCategory = getElementFromFragment(this._content, 'casual-task-category', 'township-casual-task-category');
        this.taskContainer = getElementFromFragment(this._content, 'task-container', 'div');
        this.casualTaskContainer = getElementFromFragment(this._content, 'casual-task-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    initialize(game, tasks) {
        // Create Realm Counts
        game.realms.forEach((realm) => {
            const total = tasks.getNumberOfTasksInRealm(realm);
            if (total < 1)
                return;
            const li = createElement('li', {
                className: 'font-w600 font-size-sm m-1 mr-2'
            });
            const currentSpan = createElement('span');
            if (tasks.numberOfTaskRealms > 1) {
                li.append(...templateLangStringWithNodes('TOWNSHIP_MENU_TASKS_COMPLETED_REALM', {
                    realmIcon: createElement('img', {
                        className: 'skill-icon-xxs mr-1',
                        attributes: [
                            ['src', realm.media]
                        ]
                    }),
                    qty1: currentSpan,
                }, {
                    realmName: realm.name,
                    qty2: `${total}`,
                }, false));
            } else {
                li.append(...templateLangStringWithNodes('TOWNSHIP_MENU_TASKS_COMPLETED', {
                    qty1: currentSpan,
                }, {
                    qty2: `${total}`,
                }, false));
            }
            this.realmCounts.set(realm, currentSpan);
            this.casualTasksCompleted.before(li);
        });
        // Create Category Buttons
        this.viewAllButton.onclick = () => {
            game.township.tasks.unassignProgressListeners();
            game.township.casualTasks.unassignProgressListeners();
            this.showAllCategories();
        };
        const showCasualTasks = () => this.showCasualTasks(tasks, game.township.casualTasks);
        this.casualTaskButton.onclick = showCasualTasks;
        this.casualTaskCategory.setCallback(showCasualTasks);
        tasks.categories.forEach((category) => {
            const button = createElement('button', {
                text: category.name,
                className: `btn btn-sm m-1 text-white ${category.bgClass}`,
                parent: this.buttonContainer,
            });
            const showCategoryTasks = () => this.showCategoryTasks(game, tasks, category);
            button.onclick = showCategoryTasks;
            const categoryElem = createElement('township-task-category', {
                className: 'col-12 col-md-6 col-xl-4 mb-3',
                parent: this.categoryContainer,
            });
            categoryElem.setCategory(category, showCategoryTasks);
            this.categoryMap.set(category, categoryElem);
        });
    }
    showAllCategories() {
        hideElement(this.taskContainer);
        hideElement(this.casualTaskContainer);
        showElement(this.categoryContainer);
        this.taskMap.clear();
        this.casualTaskMap.clear();
        this.mode = 0 /* TownshipTasksMenuElementMode.AllCategories */ ;
    }
    showCategoryTasks(game, tasks, category) {
        if (category.isComplete)
            return;
        hideElement(this.categoryContainer);
        hideElement(this.casualTaskContainer);
        showElement(this.taskContainer);
        this.taskMap.clear();
        this.casualTaskMap.clear();
        let i = 0;
        const shownTasks = [];
        tasks.tasks.forEach((task) => {
            if (task.category !== category || tasks.completedTasks.has(task))
                return;
            if (this.taskElems.length <= i) {
                this.taskElems.push(createElement('township-task', {
                    parent: this.taskContainer
                }));
            }
            const taskElem = this.taskElems[i];
            taskElem.setTask(game, task);
            showElement(taskElem);
            this.taskMap.set(task, taskElem);
            shownTasks.push(task);
            i++;
        });
        for (i; i < this.taskElems.length; i++) {
            hideElement(this.taskElems[i]);
        }
        game.township.casualTasks.unassignProgressListeners();
        tasks.assignProgressListeners(shownTasks);
        this.mode = 1 /* TownshipTasksMenuElementMode.TaskCategory */ ;
    }
    showCasualTasks(tasks, casualTasks) {
        if (casualTasks.currentCasualTasks.length === 0)
            return;
        hideElement(this.categoryContainer);
        hideElement(this.taskContainer);
        showElement(this.casualTaskContainer);
        this.taskMap.clear();
        tasks.unassignProgressListeners();
        this.mode = 2 /* TownshipTasksMenuElementMode.CasualTasks */ ;
        this.setCasualTasks(casualTasks);
    }
    updateCasualTaskTimer(casualTasks) {
        this.nextCasualTaskTimer.innerHTML = templateLangString('TOWNSHIP_TASKS_NEXT_DAILY_TASK', {
            timeLeft: `<span class="text-warning">${formatAsShorthandTimePeriod(casualTasks.timeToNextTask, true)}</span>`,
        });
    }
    updateCasualTasksCompleted(casualTasks) {
        this.casualTasksCompleted.textContent = templateLangString('TOWNSHIP_TASKS_DAILY_TASKS_COMPLETED', {
            qty: numberWithCommas(casualTasks.casualTasksCompleted),
        });
    }
    updateCasualTasksRemaining(casualTasks) {
        this.casualTaskCategory.updateTasksRemaining(casualTasks);
    }
    setCasualTasks(casualTasks) {
        if (this.mode !== 2 /* TownshipTasksMenuElementMode.CasualTasks */ )
            return;
        this.casualTaskMap.clear();
        casualTasks.currentCasualTasks.forEach((task, i) => {
            if (this.casualTaskElems.length <= i) {
                this.casualTaskElems.push(createElement('township-casual-task', {
                    parent: this.casualTaskContainer
                }));
            }
            const taskElem = this.casualTaskElems[i];
            taskElem.setTask(casualTasks, task);
            showElement(taskElem);
            this.casualTaskMap.set(task, taskElem);
        });
        for (let i = casualTasks.currentCasualTasks.length; i < this.casualTaskElems.length; i++) {
            hideElement(this.casualTaskElems[i]);
        }
        casualTasks.assignProgressListeners();
    }
    updateRealmCompletion(tasks, realm) {
        const realmSpan = this.realmCounts.get(realm);
        if (realmSpan === undefined)
            return;
        realmSpan.textContent = `${tasks.getTasksCompletedInRealm(realm)}`;
    }
    updateCategoryCompletion(tasks, category) {
        const categoryElem = this.categoryMap.get(category);
        categoryElem === null || categoryElem === void 0 ? void 0 : categoryElem.updateCompletedTasks(tasks, category);
    }
    updateTaskGoals(task) {
        const taskElem = this.taskMap.get(task);
        taskElem === null || taskElem === void 0 ? void 0 : taskElem.updateGoals(task);
    }
    updateCategoryReady(category) {
        const categoryElem = this.categoryMap.get(category);
        categoryElem === null || categoryElem === void 0 ? void 0 : categoryElem.updateTaskReady(category);
    }
    updateCasualTaskGoals(task) {
        const taskElem = this.casualTaskMap.get(task);
        taskElem === null || taskElem === void 0 ? void 0 : taskElem.updateGoals(task);
    }
    updateCasualReady(casualTasks) {
        this.casualTaskCategory.updateTaskReady(casualTasks);
    }
    removeTask(task) {
        const elem = this.taskMap.get(task);
        if (elem !== undefined)
            hideElement(elem);
        this.taskMap.delete(task);
    }
    removeCasualTask(task) {
        const elem = this.casualTaskMap.get(task);
        if (elem !== undefined)
            hideElement(elem);
        this.casualTaskMap.delete(task);
    }
}
window.customElements.define('township-tasks-menu', TownshipTasksMenuElement);
//# sourceMappingURL=townshipMenus.js.map
checkFileVersion('?12097')