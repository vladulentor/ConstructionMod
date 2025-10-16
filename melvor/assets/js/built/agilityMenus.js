"use strict";
// Components for usage on the agility screen
/** Component for the built obstacles on the agility page */
class BuiltAgilityObstacleElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('built-agility-obstacle-template'));
        this.blockContainer = getElementFromFragment(this._content, 'block-container', 'div');
        // Built Obstacle content
        this.builtContent = getElementFromFragment(this._content, 'built-content', 'div');
        this.inactiveText = getElementFromFragment(this._content, 'inactive-text', 'h5');
        this.name = getElementFromFragment(this._content, 'name', 'span');
        this.interval = getElementFromFragment(this._content, 'interval', 'span');
        this.xpContainer = getElementFromFragment(this._content, 'xp-container', 'span');
        this.xpAmount = getElementFromFragment(this._content, 'xp-amount', 'span');
        this.axpContainer = getElementFromFragment(this._content, 'axp-container', 'span');
        this.axpAmount = getElementFromFragment(this._content, 'axp-amount', 'span');
        this.itemCurrencyContainer = getElementFromFragment(this._content, 'item-currency-container', 'span');
        this.masteryDisplay = getElementFromFragment(this._content, 'mastery-display', 'mastery-display');
        this.bonusContainer = getElementFromFragment(this._content, 'bonus-container', 'div');
        this.selectObstacleButton = getElementFromFragment(this._content, 'select-obstacle-button', 'button');
        this.destroyObstacleButton = getElementFromFragment(this._content, 'destroy-obstacle-button', 'button');
        // Unbuilt Obstacle content
        this.unbuiltContent = getElementFromFragment(this._content, 'unbuilt-content', 'div');
        this.unbuiltText = getElementFromFragment(this._content, 'create-text', 'h5');
        this.tierName = getElementFromFragment(this._content, 'tier-name', 'h5');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /** Sets the obstacle as unbuilt */
    setUnbuilt(tier) {
        this.setTier(tier);
        this.blockContainer.classList.add('pointer-enabled');
        this.blockContainer.onclick = () => game.agility.viewObstacleSelectionOnClick(tier);
        showElement(this.unbuiltContent);
        hideElement(this.builtContent);
    }
    /** Sets the name and mastery of the obstacle, and button callbacks */
    setBuiltObstacle(obstacle) {
        this.setTier(obstacle.category);
        this.name.textContent = obstacle.name;
        this.masteryDisplay.setMastery(game.agility, obstacle);
        game.agility.updateMasteryDisplays(obstacle);
        this.blockContainer.classList.remove('pointer-enabled');
        this.blockContainer.onclick = null;
        this.selectObstacleButton.onclick = () => game.agility.viewObstacleSelectionOnClick(obstacle.category);
        this.destroyObstacleButton.onclick = () => game.agility.destroyObstacleOnClick(obstacle.category);
        showElement(this.builtContent);
        hideElement(this.unbuiltContent);
    }
    setTier(tier) {
        this.tierName.textContent = templateLangString('MENU_TEXT_OBSTACLE_NUMBER', {
            obstacleNumber: `${tier + 1}`,
        });
    }
    /** Sets the unbuilt obstacle to being locked */
    setLevelLocked(slot, agility) {
        this.blockContainer.classList.replace('border-agility', 'border-danger');
        this.unbuiltText.textContent = '';
        createElement('span', {
            className: agility.level >= slot.level ? 'text-success' : 'text-danger',
            text: templateLangString('MENU_TEXT_REQUIRES_LEVEL', {
                level: `${slot.level}`,
            }),
            parent: this.unbuiltText,
        });
        if (slot.abyssalLevel !== undefined) {
            this.unbuiltText.append(createElement('br'));
            createElement('span', {
                className: agility.abyssalLevel >= slot.abyssalLevel ? 'text-success' : 'text-danger',
                text: templateLangString('MENU_TEXT_REQUIRES_ABYSSAL_LEVEL', {
                    level: `${slot.abyssalLevel}`,
                }),
                parent: this.unbuiltText,
            });
        }
        this.unbuiltText.classList.remove('text-success');
    }
    /** Sets the unbuilt obstacle to beng unlocked */
    setUnlocked() {
        this.blockContainer.classList.replace('border-danger', 'border-agility');
        this.unbuiltText.textContent = getLangString('MENU_TEXT_CREATE_OBSTACLE');
        this.unbuiltText.classList.add('text-success');
    }
    /** Updates the interval, xp, items and currencies of the built obstacle */
    updateRates(interval, xp, axp, items, currencies) {
        this.interval.textContent = templateLangString('MENU_TEXT_SECONDS_SHORT', {
            seconds: formatFixed(interval / 1000, 2),
        });
        if (xp > 0) {
            this.xpAmount.textContent = templateLangString('MENU_TEXT_XP_AMOUNT', {
                xp: formatNumber(Math.floor(xp)),
            });
            showElement(this.xpContainer);
        } else {
            hideElement(this.xpContainer);
        }
        if (axp > 0) {
            this.axpAmount.textContent = templateLangString('ABYSSAL_XP_SHORTHAND', {
                xp: formatNumber(Math.floor(axp))
            });
            showElement(this.axpContainer);
        } else {
            hideElement(this.axpContainer);
        }
        this.itemCurrencyContainer.textContent = '';
        currencies.forEach(({
            currency,
            quantity
        }) => {
            const span = createElement('span', {
                className: 'mr-2 ml-2',
                parent: this.itemCurrencyContainer
            });
            createElement('img', {
                className: 'skill-icon-xs mr-2',
                attributes: [
                    ['src', currency.media]
                ],
                parent: span
            });
            createElement('span', {
                text: formatNumber(quantity),
                parent: span
            });
        });
        items.forEach(({
            item,
            quantity
        }) => {
            const span = createElement('span', {
                className: 'mr-2 ml-2',
                parent: this.itemCurrencyContainer
            });
            createElement('img', {
                className: 'skill-icon-xs mr-2',
                attributes: [
                    ['src', item.media]
                ],
                parent: span
            });
            createElement('span', {
                text: formatNumber(quantity),
                parent: span
            });
        });
    }
    /** Updates the modifiers provided by the built obstacle */
    updatePassives(obstacle, negMult) {
        this.bonusContainer.textContent = '';
        const formatter = getElementDescriptionFormatter('h5', 'font-size-sm m-1');
        this.bonusContainer.append(...StatObject.formatDescriptions(obstacle, formatter, negMult, 1, false));
    }
    /** Turns the background highlight on or off */
    setHighlight(on) {
        if (on) {
            this.blockContainer.classList.add('bg-active-agility-obstacle');
        } else {
            this.blockContainer.classList.remove('bg-active-agility-obstacle');
        }
    }
    /** Turns the background highlight on or off */
    setSearchHighlight(on) {
        if (on) {
            this.blockContainer.classList.add('bg-agility-search-result');
        } else {
            this.blockContainer.classList.remove('bg-agility-search-result');
        }
    }
    /** Sets the obstacle to being active */
    setActive() {
        hideElement(this.inactiveText);
    }
    /** Sets the obstacle to being inactive */
    setInactive() {
        showElement(this.inactiveText);
    }
}
window.customElements.define('built-agility-obstacle', BuiltAgilityObstacleElement);
class PassivePillarMenuElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('passive-pillar-menu-template'));
        this.blockContainer = getElementFromFragment(this._content, 'block-container', 'div');
        this.unbuiltContent = getElementFromFragment(this._content, 'unbuilt-content', 'div');
        this.createText = getElementFromFragment(this._content, 'create-text', 'h5');
        this.builtContent = getElementFromFragment(this._content, 'built-content', 'div');
        this.activeText = getElementFromFragment(this._content, 'active-text', 'h5');
        this.name = getElementFromFragment(this._content, 'name', 'h5');
        this.passiveContainer = getElementFromFragment(this._content, 'passive-container', 'div');
        this.pillarSelectButton = getElementFromFragment(this._content, 'pillar-selection-button', 'button');
        this.pillarDestroyButton = getElementFromFragment(this._content, 'pillar-destroy-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setUnbuilt(slot, slotID) {
        hideElement(this.builtContent);
        showElement(this.unbuiltContent);
        this.blockContainer.classList.replace('border-warning', 'border-agility');
        this.blockContainer.classList.add('pointer-enabled');
        this.createText.textContent = templateLangString('CREATE_PILLAR_TYPE', {
            pillarType: AgilityPillar.getPillarType(slot),
        });
        this.blockContainer.onclick = () => game.agility.viewPillarSelectionOnClick(slotID);
    }
    setBuilt(pillar) {
        showElement(this.builtContent);
        hideElement(this.unbuiltContent);
        this.name.textContent = pillar.name;
        this.blockContainer.classList.replace('border-agility', 'border-warning');
        this.blockContainer.classList.remove('pointer-enabled');
        this.blockContainer.onclick = null;
        const pillarType = AgilityPillar.getPillarType(pillar.slot);
        this.pillarSelectButton.textContent = templateLangString('VIEW_PILLAR_TYPE_SELECTION', {
            pillarType
        });
        this.pillarSelectButton.onclick = () => game.agility.viewPillarSelectionOnClick(pillar.category);
        this.pillarDestroyButton.textContent = templateLangString('DESTROY_PILLAR_TYPE', {
            pillarType
        });
        this.pillarDestroyButton.onclick = () => game.agility.destroyPillarOnClick(pillar.slot, pillar.category);
        this.updatePassives(pillar);
    }
    /** Updates the modifiers provided by the pillar */
    updatePassives(pillar) {
        this.passiveContainer.textContent = '';
        const formatter = getElementDescriptionFormatter('h5', 'font-size-sm m-1');
        this.passiveContainer.append(...StatObject.formatDescriptions(pillar, formatter));
    }
    setActive() {
        hideElement(this.activeText);
    }
    setInactive() {
        showElement(this.activeText);
    }
    /** Turns the background highlight on or off */
    setSearchHighlight(on) {
        if (on) {
            this.blockContainer.classList.add('bg-agility-search-result');
        } else {
            this.blockContainer.classList.remove('bg-agility-search-result');
        }
    }
}
window.customElements.define('passive-pillar-menu', PassivePillarMenuElement);
/** Component for the obstacle selection modal */
class AgilityObstacleSelectionElement extends HTMLElement {
    constructor() {
        super();
        this.obstacleOnlyElements = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('agility-obstacle-selection-template'));
        this.link = getElementFromFragment(this._content, 'link', 'a');
        this.activeText = getElementFromFragment(this._content, 'active-text', 'h5');
        this.name = getElementFromFragment(this._content, 'name', 'span');
        this.interval = getElementFromFragment(this._content, 'interval', 'span');
        this.masteryLevel = getElementFromFragment(this._content, 'mastery-level', 'span');
        this.masteryPercent = getElementFromFragment(this._content, 'mastery-percent', 'small');
        this.buildCount = getElementFromFragment(this._content, 'build-count', 'h5');
        this.xpContainer = getElementFromFragment(this._content, 'xp-container', 'span');
        this.xpAmount = getElementFromFragment(this._content, 'xp-amount', 'span');
        this.axpContainer = getElementFromFragment(this._content, 'axp-container', 'span');
        this.axpAmount = getElementFromFragment(this._content, 'axp-amount', 'span');
        this.itemCurrencyContainer = getElementFromFragment(this._content, 'item-currency-container', 'span');
        this.gpReduction = getElementFromFragment(this._content, 'gp-reduction', 'span');
        this.scReduction = getElementFromFragment(this._content, 'sc-reduction', 'span');
        this.itemReduction = getElementFromFragment(this._content, 'item-reduction', 'span');
        this.costContainer = getElementFromFragment(this._content, 'cost-container', 'div');
        this.requirementContainer = getElementFromFragment(this._content, 'requirement-container', 'div');
        this.passivesContainer = getElementFromFragment(this._content, 'passives-container', 'div');
        this.obstacleOnlyElements.push(getElementFromFragment(this._content, 'interval-mastery-container', 'span'), getElementFromFragment(this._content, 'cost-reduction-header', 'h5'), getElementFromFragment(this._content, 'requirement-header', 'h5'), getElementFromFragment(this._content, 'grants-title', 'h5'), getElementFromFragment(this._content, 'grants-container', 'h5'), this.buildCount);
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    createInlineRequirement(textClass) {
        return createElement('inline-requirement', {
            className: `font-size-sm font-w400 mr-2 ml-2 ${textClass}`,
        });
    }
    /** Sets the content of the costs container */
    setCosts(items, currencies) {
        this.costContainer.textContent = '';
        const addReq = (media, qty, name, currentQty) => {
            const newReq = this.createInlineRequirement(currentQty >= qty ? 'text-success' : 'text-danger');
            this.costContainer.append(newReq);
            newReq.setContent(media, formatNumber(qty), name);
        };
        items.forEach(({
            item,
            quantity
        }) => {
            addReq(item.media, quantity, item.name, game.bank.getQty(item));
        });
        currencies.forEach(({
            currency,
            quantity
        }) => {
            addReq(currency.media, quantity, currency.name, currency.amount);
        });
    }
    setPassives(obstacle, negMult = 1) {
        this.passivesContainer.textContent = '';
        const formatter = getElementDescriptionFormatter('h5', 'font-size-sm m-1');
        const createElem = (desc) => {
            this.passivesContainer.append(formatter(desc));
        };
        StatObject.formatDescriptions(obstacle, createElem, negMult, 1, false);
    }
    setBuildStatus(built) {
        if (built) {
            showElement(this.activeText);
            this.link.classList.replace('border-agility', 'border-success');
        } else {
            hideElement(this.activeText);
            this.link.classList.replace('border-success', 'border-agility');
        }
    }
    setObstacle(obstacle) {
        this.obstacleOnlyElements.forEach(showElement);
        this.link.onclick = () => game.agility.buildObstacleOnClick(obstacle);
        this.setBuildStatus(obstacle.isBuilt);
        this.name.textContent = obstacle.name;
        this.interval.textContent = templateLangString('MENU_TEXT_SECONDS_SHORT', {
            seconds: formatFixed(game.agility.getObstacleInterval(obstacle) / 1000, 2),
        });
        const masteryProgress = game.agility.getMasteryProgress(obstacle);
        this.masteryLevel.textContent = `${masteryProgress.level}`;
        this.masteryPercent.textContent = `(${formatPercent(masteryProgress.percent, 2)})`;
        this.buildCount.textContent = '';
        this.buildCount.append(...templateLangStringWithNodes('MENU_TEXT_BUILD_COUNT', {
            count: createElement('span', {
                className: 'text-warning',
                text: `${game.agility.getObstacleBuildCount(obstacle)}`,
            }),
        }, {}));
        this.gpReduction.textContent = formatPercent(-game.agility.getObstacleCostModifier(obstacle, game.gp));
        this.scReduction.textContent = formatPercent(-game.agility.getObstacleCostModifier(obstacle, game.slayerCoins));
        this.itemReduction.textContent = formatPercent(-game.agility.getObstacleItemCostModifier(obstacle));
        const costs = game.agility.getObstacleBuildCosts(obstacle);
        this.setCosts(costs.getItemQuantityArray(), costs.getCurrencyQuantityArray());
        this.requirementContainer.textContent = '';
        if (obstacle.skillRequirements.length === 0) {
            this.requirementContainer.append(createElement('span', {
                className: 'font-size-sm font-w400 mr-2 ml-2 text-success',
                text: getLangString('MENU_TEXT_NO_REQUIREMENT'),
            }));
        } else {
            obstacle.skillRequirements.forEach((requirement) => {
                const textClass = game.checkRequirement(requirement, false) ? 'text-success' : 'text-danger';
                const newReq = this.createInlineRequirement(textClass);
                this.requirementContainer.append(newReq);
                newReq.setContent(requirement.skill.media, templateLangString(requirement.type === 'SkillLevel' ? 'MENU_TEXT_LEVEL' : 'MENU_TEXT_ABYSSAL_LEVEL', {
                    level: `${requirement.level}`,
                }), requirement.skill.name);
            });
        }
        if (obstacle.baseExperience > 0) {
            this.xpAmount.textContent = templateLangString('MENU_TEXT_XP_AMOUNT', {
                xp: formatNumber(Math.floor(game.agility.modifyXP(obstacle.baseExperience, obstacle))),
            });
            showElement(this.xpContainer);
        } else {
            hideElement(this.xpContainer);
        }
        if (obstacle.baseAbyssalExperience > 0) {
            this.axpAmount.textContent = templateLangString('ABYSSAL_XP_SHORTHAND', {
                xp: formatNumber(Math.floor(game.agility.modifyAbyssalXP(obstacle.baseAbyssalExperience, obstacle))),
            });
            showElement(this.axpContainer);
        } else {
            hideElement(this.axpContainer);
        }
        this.itemCurrencyContainer.textContent = '';
        obstacle.currencyRewards.forEach(({
            currency,
            quantity
        }) => {
            const span = createElement('span', {
                className: 'mr-2 ml-2',
                parent: this.itemCurrencyContainer
            });
            createElement('img', {
                className: 'skill-icon-xs mr-2',
                attributes: [
                    ['src', currency.media]
                ],
                parent: span
            });
            createElement('span', {
                text: currency.formatAmount(formatNumber(quantity)),
                parent: span
            });
        });
        obstacle.itemRewards.forEach(({
            item,
            quantity
        }) => {
            const span = createElement('span', {
                className: 'mr-2 ml-2',
                parent: this.itemCurrencyContainer
            });
            createElement('img', {
                className: 'skill-icon-xs mr-2',
                attributes: [
                    ['src', item.media]
                ],
                parent: span
            });
            createElement('span', {
                text: numberWithCommas(quantity),
                parent: span
            });
        });
        this.setPassives(obstacle, game.agility.getObstacleNegMult(obstacle));
        this.setSearchHighlight(agilityBreakdownMenu.cachedSearchResults.some((result) => result.obstacle === obstacle));
    }
    setPillar(pillar) {
        this.obstacleOnlyElements.forEach(hideElement);
        this.link.onclick = () => game.agility.buildPillarOnClick(pillar);
        this.setBuildStatus(pillar.isBuilt);
        this.name.textContent = pillar.name;
        const costs = game.agility.getPillarBuildCosts(pillar);
        this.setCosts(costs.getItemQuantityArray(), costs.getCurrencyQuantityArray());
        this.setPassives(pillar);
        this.setSearchHighlight(agilityBreakdownMenu.cachedSearchResults.some((result) => result.pillar === pillar));
    }
    /** Turns the background highlight on or off */
    setSearchHighlight(on) {
        if (on) {
            this.link.classList.add('bg-agility-search-result');
        } else {
            this.link.classList.remove('bg-agility-search-result');
        }
    }
}
window.customElements.define('agility-obstacle-selection', AgilityObstacleSelectionElement);
class InlineRequirementElement extends HTMLElement {
    constructor() {
        super();
        this.tooltipDisabled = false;
        this.tooltipContent = '';
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('inline-requirement-template'));
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.text = getElementFromFragment(this._content, 'text', 'span');
    }
    setContent(media, text, tooltipText) {
        var _a;
        this.image.src = media;
        this.text.textContent = text;
        (_a = this.imageTooltip) === null || _a === void 0 ? void 0 : _a.setContent(tooltipText);
        this.tooltipContent = tooltipText;
    }
    disableTooltip() {
        this.tooltipDisabled = true;
    }
    enableTooltip() {
        this.tooltipDisabled = false;
    }
    connectedCallback() {
        this.appendChild(this._content);
        if (!this.tooltipDisabled) {
            this.imageTooltip = tippy(this.image, {
                placement: 'bottom',
                interactive: false,
                animation: false,
                content: this.tooltipContent,
            });
        }
    }
    disconnectedCallback() {
        if (this.imageTooltip !== undefined)
            this.imageTooltip.destroy();
    }
}
window.customElements.define('inline-requirement', InlineRequirementElement);
class MultiProgressBarElement extends HTMLElement {
    constructor() {
        super();
        this.progressDivs = [];
        this.animatedSegment = -1;
        this.filledSegments = 0;
        this.segmentPattern = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('multi-progress-bar-template'));
        this.barContainer = getElementFromFragment(this._content, 'bar-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    getPatternClass(segmentNumber) {
        const index = segmentNumber % this.segmentPattern.length;
        return this.segmentPattern[index];
    }
    stopSegmentAnimation(segmentNumber) {
        var _a;
        const segment = (_a = this.progressDivs[segmentNumber]) === null || _a === void 0 ? void 0 : _a.bar;
        if (segment === undefined)
            return; // Failsafe for if segment was removed
        void segment.offsetHeight;
        segment.style.width = '0%';
        segment.style.animation = 'none';
    }
    startSegmentAnimation(segmentNumber, timer) {
        const elapsedTime = (timer.maxTicks - timer.ticksLeft) * TICK_INTERVAL;
        const totalTime = timer.maxTicks * TICK_INTERVAL;
        const segment = this.progressDivs[segmentNumber].bar;
        const delay = -elapsedTime / 1000;
        const duration = totalTime / 1000;
        segment.style.animation = 'none';
        void segment.offsetHeight;
        segment.style.animation = `${duration}s linear ${delay}s 1 progressBar`;
    }
    setMaxSegments(count) {
        const width = `width: ${100 / count}%`;
        // Create additional segments
        while (this.progressDivs.length < count) {
            const container = createElement('div', {
                className: 'd-flex',
                attributes: [
                    ['style', width]
                ],
                parent: this.barContainer,
            });
            const bar = createElement('div', {
                className: `progress-bar ${this.getPatternClass(this.progressDivs.length)}`,
                attributes: [
                    ['style', 'width: 0%'],
                    ['aria-value-now', '0'],
                    ['aria-value-min', '0'],
                    ['aria-valuemax', '100'],
                ],
                parent: container,
            });
            this.progressDivs.push({
                bar,
                container
            });
        }
        // Remove extra segments
        while (this.progressDivs.length > count) {
            const removedDiv = this.progressDivs.pop();
            if (removedDiv !== undefined)
                this.barContainer.removeChild(removedDiv.container);
        }
        this.filledSegments = Math.min(this.progressDivs.length, this.filledSegments);
        if (this.animatedSegment >= this.progressDivs.length)
            this.animatedSegment = -1;
    }
    setSegmentPattern(classPattern) {
        this.segmentPattern = classPattern;
        this.progressDivs.forEach((div, segmentNumber) => {
            div.bar.className = 'progress-bar';
            div.bar.classList.add(this.getPatternClass(segmentNumber));
        });
    }
    animateFromTimer(segment, timer) {
        if (!game.settings.enableProgressBars)
            return;
        if (this.animatedSegment !== segment && this.animatedSegment !== -1) {
            // Cancel the animation of the existing segment
            this.stopSegmentAnimation(this.animatedSegment);
        }
        if (this.filledSegments > segment) {
            // Unfill the segments
            while (this.filledSegments > segment) {
                this.filledSegments--;
                this.progressDivs[this.filledSegments].bar.style.width = '0%';
            }
        } else if (this.filledSegments < segment) {
            // Fill the segments
            while (this.filledSegments < segment) {
                this.progressDivs[this.filledSegments].bar.style.width = '100%';
                this.filledSegments++;
            }
        }
        // Set the animation of the segment
        this.startSegmentAnimation(segment, timer);
        this.animatedSegment = segment;
    }
    stopAnimation() {
        if (!game.settings.enableProgressBars)
            return;
        if (this.animatedSegment !== -1)
            this.stopSegmentAnimation(this.animatedSegment);
        while (this.filledSegments > 0) {
            this.filledSegments--;
            this.progressDivs[this.filledSegments].bar.style.width = '0%';
        }
    }
}
window.customElements.define('multi-progress-bar', MultiProgressBarElement);
class AgilityBreakdownElement extends HTMLElement {
    constructor() {
        super();
        this.cachedSearchResults = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('agility-breakdown-template'));
        this.interval = getElementFromFragment(this._content, 'interval', 'span');
        this.xpContainer = getElementFromFragment(this._content, 'xp-container', 'span');
        this.xpAmount = getElementFromFragment(this._content, 'xp-amount', 'span');
        this.axpContainer = getElementFromFragment(this._content, 'axp-container', 'span');
        this.axpAmount = getElementFromFragment(this._content, 'axp-amount', 'span');
        this.currencyContainer = getElementFromFragment(this._content, 'currency-container', 'span');
        this.itemsContainer = getElementFromFragment(this._content, 'items-container', 'span');
        this.viewPassivesButton = getElementFromFragment(this._content, 'view-passives-button', 'button');
        this.searchBar = getElementFromFragment(this._content, 'search-bar', 'input');
        this.clearSearchBar = getElementFromFragment(this._content, 'clear-search-bar', 'button');
        this.searchBar.placeholder = 'Search Obstacles';
        this.searchBar.onkeyup = () => this.onSearchChange();
        this.clearSearchBar.onclick = () => {
            this.searchBar.value = '';
            this.onSearchChange();
        };
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    init(agility) {
        this.viewPassivesButton.onclick = () => agility.viewAllPassivesOnClick();
    }
    updateRates(interval, xp, axp, items, currencies) {
        this.interval.textContent = templateLangString('MENU_TEXT_SECONDS_SHORT', {
            seconds: formatFixed(interval / 1000, 2),
        });
        if (xp > 0) {
            this.xpAmount.textContent = templateLangString('MENU_TEXT_XP_AMOUNT', {
                xp: formatNumber(Math.floor(xp)),
            });
            showElement(this.xpContainer);
        } else {
            hideElement(this.xpContainer);
        }
        if (axp > 0) {
            this.axpAmount.textContent = templateLangString(`ABYSSAL_XP_SHORTHAND`, {
                xp: formatNumber(Math.floor(axp)),
            });
            showElement(this.axpContainer);
        } else {
            hideElement(this.axpContainer);
        }
        this.currencyContainer.textContent = '';
        currencies.forEach(({
            currency,
            quantity
        }) => {
            const span = createElement('span', {
                className: 'm-1 ml-2 no-wrap',
                parent: this.currencyContainer
            });
            createElement('img', {
                className: 'skill-icon-xxs mr-1',
                attributes: [
                    ['src', currency.media]
                ],
                parent: span
            });
            createElement('span', {
                text: currency.formatAmount(formatNumber(quantity)),
                parent: span
            });
        });
        this.itemsContainer.textContent = '';
        items.forEach(({
            item,
            quantity
        }) => {
            const span = createElement('span', {
                className: 'm-1 ml-2 no-wrap',
                parent: this.itemsContainer
            });
            createElement('img', {
                className: 'skill-icon-xxs mr-1',
                attributes: [
                    ['src', item.media]
                ],
                parent: span
            });
            createElement('span', {
                text: numberWithCommas(quantity),
                parent: span
            });
        });
    }
    /** Updates the obstacles based on a fuzzy search query */
    queryObstacles(query) {
        query = query.trim();
        const searchOpts = {
            shouldSort: true,
            tokenize: true,
            matchAllTokens: true,
            findAllMatches: true,
            threshold: 0,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: ['modifiers', 'category', 'course', 'obstacle'],
        };
        const fuzzySearch = new Fuse(Agility.searchArray, searchOpts);
        let searchResults = [];
        if (this.searchBar.value !== '')
            searchResults = fuzzySearch.search(query);
        searchResults = searchResults.filter((result) => result.course === game.agility.courses.get(game.agility.currentRealm) &&
            ((result.obstacle !== undefined && game.agility.isSlotUnlocked(result.obstacle.slot)) ||
                (result.pillar !== undefined && game.agility.isSlotUnlocked(result.pillar.slot))));
        this.cachedSearchResults = searchResults;
        if (searchResults.length === 0 && this.searchBar.value !== '') {
            this.searchBar.classList.add('border-danger', 'text-danger');
        } else {
            this.searchBar.classList.remove('border-danger', 'text-danger');
        }
        // Show the search results
        const obstacleSearchResults = searchResults.filter((result) => result.obstacle !== undefined);
        const obstacleSearchResultIDs = obstacleSearchResults.map((result) => {
            var _a;
            return (_a = result.obstacle) === null || _a === void 0 ? void 0 : _a.category;
        });
        game.agility.actions.forEach((action) => {
            if (agilityObstacleMenus[action.category] !== undefined)
                agilityObstacleMenus[action.category].setSearchHighlight(obstacleSearchResultIDs.includes(action.category));
        });
        const pillarSearchResults = searchResults.filter((result) => result.pillar !== undefined);
        const pillarSearchResultIDs = pillarSearchResults.map((result) => {
            var _a;
            return (_a = result.pillar) === null || _a === void 0 ? void 0 : _a.category;
        });
        game.agility.pillars.forEach((pillar) => {
            if (agilityPillarMenus[pillar.category] !== undefined)
                agilityPillarMenus[pillar.category].setSearchHighlight(pillarSearchResultIDs.includes(pillar.category));
        });
    }
    /** Callback for when the current search changes */
    onSearchChange(searchOnEmpty = true) {
        if ((searchOnEmpty && this.searchBar.value === '') || this.searchBar.value !== '')
            this.queryObstacles(this.searchBar.value);
    }
}
window.customElements.define('agility-breakdown', AgilityBreakdownElement);
//# sourceMappingURL=agilityMenus.js.map
checkFileVersion('?12097')