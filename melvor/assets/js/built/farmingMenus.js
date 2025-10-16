"use strict";
class FarmingCategoryButtonElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('farming-category-button-template'));
        this.link = getElementFromFragment(this._content, 'link', 'a');
        this.categoryImage = getElementFromFragment(this._content, 'category-image', 'img');
        this.categoryName = getElementFromFragment(this._content, 'category-name', 'div');
        this.categoryDescription = getElementFromFragment(this._content, 'category-description', 'div');
        this.harvestReadyNotice = getElementFromFragment(this._content, 'harvest-ready-notice', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCategory(category, farming) {
        this.link.onclick = () => farming.showPlotsInCategory(category);
        this.categoryImage.src = category.media;
        this.categoryName.textContent = category.name;
        this.categoryDescription.textContent = category.description;
    }
    updateNotice(show) {
        if (show)
            showElement(this.harvestReadyNotice);
        else
            hideElement(this.harvestReadyNotice);
    }
}
window.customElements.define('farming-category-button', FarmingCategoryButtonElement);
class FarmingCategoryOptionsElement extends HTMLElement {
    constructor() {
        super();
        this.compostAllButtons = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('farming-category-options-template'));
        this.harvestAllButton = getElementFromFragment(this._content, 'harvest-all-button', 'button');
        this.plantAllButton = getElementFromFragment(this._content, 'plant-all-button', 'button');
        this.plantAllSelectedButton = getElementFromFragment(this._content, 'plant-all-selected-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCategory(category, game) {
        const farming = game.farming;
        const gpIcon = this.getCurrencyIconHTML(game.gp);
        this.harvestAllButton.innerHTML = templateLangString('MENU_TEXT_HARVEST_ALL', {
            gpIcon,
            gpCost: numberWithCommas(farming.getHarvestAllCost(category)),
        });
        this.compostAllButtons.forEach((button) => button.remove());
        this.compostAllButtons = [];
        game.items.composts.forEach((compost) => {
            const compostAllButton = createElement('button', {
                className: `btn btn-sm ${compost.buttonStyle} m-1`
            });
            compostAllButton.onclick = () => farming.compostAllOnClick(category, compost);
            const cost = compost.compostAllCost;
            switch (compost.id) {
                case "melvorD:Compost" /* ItemIDs.Compost */ :
                    compostAllButton.innerHTML = templateLangString('MENU_TEXT_COMPOST_ALL', {
                        gpIcon: this.getCurrencyIconHTML(cost.currency),
                        gpCost: numberWithCommas(cost.quantity),
                    });
                    break;
                case "melvorD:Weird_Gloop" /* ItemIDs.Weird_Gloop */ :
                    compostAllButton.innerHTML = templateLangString('MENU_TEXT_GLOOP_ALL', {
                        gpIcon: this.getCurrencyIconHTML(cost.currency),
                        gpCost: numberWithCommas(cost.quantity),
                    });
                    break;
                default:
                    compostAllButton.innerHTML = templateLangString('FARMING_MISC_APPLY_ITEM_ALL', {
                        itemName: compost.name,
                        gpIcon: this.getCurrencyIconHTML(cost.currency),
                        gpCost: numberWithCommas(cost.quantity),
                    });
            }
            this.plantAllButton.before(compostAllButton);
            this.compostAllButtons.push(compostAllButton);
        });
        this.plantAllButton.innerHTML = templateLangString('MENU_TEXT_PLANT_ALL', {
            gpIcon,
            gpCost: numberWithCommas(farming.getPlantAllCost(category)),
        });
        this.plantAllSelectedButton.innerHTML = templateLangString('FARMING_MISC_28', {
            gpValue: `${gpIcon} ${numberWithCommas(farming.getPlantAllCost(category))}`,
        });
        this.harvestAllButton.onclick = () => farming.harvestAllOnClick(category);
        this.plantAllButton.onclick = () => farming.plantAllOnClick(category);
        this.plantAllSelectedButton.onclick = () => farming.plantAllSelectedOnClick(category);
    }
    getCurrencyIconHTML(currency) {
        return `<img class="skill-icon-xxs" src="${currency.media}">`;
    }
}
window.customElements.define('farming-category-options', FarmingCategoryOptionsElement);
class FarmingPlotElement extends HTMLElement {
    constructor() {
        super();
        this.seedQuantities = new Map();
        this.compostButtons = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('farming-plot-template'));
        this.categoryName = getElementFromFragment(this._content, 'category-name', 'h3');
        this.selectSeedDropdownButton = getElementFromFragment(this._content, 'select-seed-dropdown-button', 'button');
        this.selectSeedDropdownImage = getElementFromFragment(this._content, 'select-seed-dropdown-image', 'img');
        this.selectSeedDropdownOptions = getElementFromFragment(this._content, 'select-seed-dropdown-options', 'div');
        this.plantSeedButton = getElementFromFragment(this._content, 'plant-seed-button', 'button');
        this.seedImage = getElementFromFragment(this._content, 'seed-image', 'img');
        this.growthStatus = getElementFromFragment(this._content, 'growth-status', 'small');
        this.compostStatus = getElementFromFragment(this._content, 'compost-status', 'span');
        this.removeCompost = getElementFromFragment(this._content, 'remove-compost', 'button');
        this.destroyButton = getElementFromFragment(this._content, 'destroy-button', 'button');
        this.harvestButton = getElementFromFragment(this._content, 'harvest-button', 'button');
        this.compostButtonContainer = getElementFromFragment(this._content, 'compost-buttons', 'ul');
        this.growthChance = getElementFromFragment(this._content, 'growth-chance', 'h5');
        this.xpIcon = getElementFromFragment(this._content, 'xp-icon', 'xp-icon');
        this.abyssalXPIcon = getElementFromFragment(this._content, 'abyssal-xp-icon', 'abyssal-xp-icon');
        this.masteryIcon = getElementFromFragment(this._content, 'mastery-icon', 'mastery-xp-icon');
        this.masteryPoolIcon = getElementFromFragment(this._content, 'mastery-pool-icon', 'mastery-pool-icon');
        hideElement(this.abyssalXPIcon);
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    disconnectedCallback() {
        this.destroyTooltips();
    }
    destroyTooltips() {
        var _a;
        (_a = this.compostTooltips) === null || _a === void 0 ? void 0 : _a.forEach((tooltip) => {
            tooltip.destroy();
        });
        this.compostTooltips = undefined;
    }
    setPlot(plot, game) {
        const farming = game.farming;
        this.categoryName.textContent = plot.category.singularName;
        const recipes = farming.getRecipesForCategory(plot.category);
        this.selectSeedDropdownOptions.textContent = '';
        this.seedQuantities.clear();
        recipes.forEach((recipe) => {
            if (!recipe.realm.isUnlocked)
                return;
            const link = createElement('a', {
                className: 'dropdown-item pointer-enabled'
            });
            const image = createElement('img', {
                className: 'skill-icon-xs mr-1',
            });
            image.src = recipe.seedCost.item.media;
            const seedQuantity = createElement('span', {
                text: '0'
            });
            link.append(image, `${recipe.name} (`, seedQuantity, ')');
            link.onclick = () => farming.setPlantAllSelected(plot, recipe);
            this.seedQuantities.set(recipe, seedQuantity);
            this.selectSeedDropdownOptions.append(link);
        });
        this.selectSeedDropdownButton.onclick = () => this.updateSeedQuantities(farming);
        this.plantSeedButton.onclick = () => farming.plantPlotOnClick(plot);
        this.destroyButton.onclick = () => farming.destroyPlotOnClick(plot);
        this.harvestButton.onclick = () => farming.harvestPlotOnClick(plot);
        this.removeCompost.onclick = () => farming.removeCompostFromPlot(plot);
        // Generate Compost buttons + tooltips
        this.destroyTooltips();
        this.compostButtonContainer.textContent = '';
        const tooltips = [];
        const compostNodes = [];
        compostNodes.push([
            createElement('h5', {
                className: 'font-w600 mb-1 font-size-sm',
                text: getLangString('MENU_TEXT_SELECT_COMPOST'),
            }),
        ]);
        game.items.composts.forEach((compost) => {
            const image = createElement('img', {
                className: 'skill-icon-xs',
                attributes: [
                    ['src', compost.media]
                ]
            });
            tooltips.push(tippy(image, {
                content: compost.name,
                placement: 'bottom',
                interactive: false,
                animation: false,
            }));
            const maxCompost = Math.ceil(100 / compost.compostValue);
            const compostButton = createElement('button', {
                className: `btn btn-sm ${compost.buttonStyle} m-1`,
                text: templateLangString('MENU_TEXT_APPLY_COMPOST', {
                    itemName: compost.name,
                    qtyRequired: `${maxCompost}`
                }),
            });
            compostButton.onclick = () => farming.compostPlot(plot, compost, maxCompost);
            const nodes = [image, compostButton];
            compostNodes.push(nodes);
        });
        compostNodes.forEach((nodes, i) => {
            const liEl = createElement('li');
            liEl.append(...nodes);
            this.compostButtonContainer.append(liEl);
        });
        this.compostTooltips = tooltips;
        this.updateCompost(plot);
        this.updateGrowthChance(plot, farming);
        this.updatePlotState(plot);
        this.updateGrowthTime(plot, farming);
        this.updateSelectedSeed(plot);
    }
    updateGrowthChance(plot, farming) {
        this.growthChance.textContent = templateLangString('MENU_TEXT_CHANCE_TO_GROW', {
            chance: `${Math.floor(farming.getPlotGrowthChance(plot))}`,
        });
    }
    /** Updates the compost level + growth chance */
    updateCompost(plot) {
        if (plot.compostItem !== undefined) {
            if (plot.compostLevel === 100) {
                this.compostStatus.textContent = plot.compostItem.name;
                this.compostStatus.classList.replace('text-danger', 'text-success');
                hideElement(this.compostButtonContainer);
            }
            showElement(this.removeCompost);
        } else {
            this.compostStatus.textContent = getLangString('MENU_TEXT_NO_COMPOST');
            this.compostStatus.classList.replace('text-success', 'text-danger');
            if (plot.state === 1 /* FarmingPlotState.Empty */ )
                showElement(this.compostButtonContainer);
            else
                hideElement(this.compostButtonContainer);
            hideElement(this.removeCompost);
        }
    }
    updateGrowthTime(plot, farming) {
        if (plot.plantedRecipe === undefined || plot.state !== 2 /* FarmingPlotState.Growing */ )
            return;
        const minutesLeft = Math.ceil(farming.getPlotGrowthTime(plot) / 1000 / 60);
        const timeLeft = setLang === 'en' && minutesLeft === 69 ? `${minutesLeft} (lol)` : `${minutesLeft}`;
        this.growthStatus.innerHTML = `${templateLangString('MENU_TEXT_GROWING', {
            itemName: plot.plantedRecipe.seedCost.item.name,
        })}<br>${templateLangString('MENU_TEXT_TIME_LEFT', { timeLeft })}`;
    }
    /** Updates the display of the plot */
    updatePlotState(plot) {
        if (plot.plantedRecipe !== undefined) {
            switch (plot.state) {
                case 2 /* FarmingPlotState.Growing */ :
                    this.seedImage.src = plot.plantedRecipe.seedCost.item.media;
                    showElement(this.destroyButton);
                    hideElement(this.harvestButton);
                    break;
                case 3 /* FarmingPlotState.Grown */ :
                    this.seedImage.src = plot.plantedRecipe.media;
                    this.harvestButton.textContent = getLangString('MENU_TEXT_HARVEST');
                    this.harvestButton.classList.replace('btn-warning', 'btn-success');
                    this.growthStatus.textContent = plot.plantedRecipe.name;
                    hideElement(this.destroyButton);
                    showElement(this.harvestButton);
                    break;
                case 4 /* FarmingPlotState.Dead */ :
                    this.seedImage.src = assets.getURI('assets/media/skills/farming/angry.png');
                    this.harvestButton.textContent = getLangString('FARMING_MISC_CLEAR_DEAD_CROP');
                    this.harvestButton.classList.replace('btn-success', 'btn-warning');
                    this.growthStatus.textContent = getLangString('FARMING_MISC_CROP_DIED');
                    hideElement(this.destroyButton);
                    showElement(this.harvestButton);
                    break;
            }
            hideElement(this.plantSeedButton);
            showElement(this.growthStatus);
            showElement(this.seedImage);
        } else {
            hideElement(this.destroyButton);
            hideElement(this.harvestButton);
            showElement(this.plantSeedButton);
            hideElement(this.growthStatus);
            hideElement(this.seedImage);
        }
        this.updateCompost(plot);
    }
    updateSelectedSeed(plot) {
        var _a, _b;
        this.selectSeedDropdownImage.src = (_b = (_a = plot.selectedRecipe) === null || _a === void 0 ? void 0 : _a.seedCost.item.media) !== null && _b !== void 0 ? _b : assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
    }
    updateSeedQuantities(farming) {
        this.seedQuantities.forEach((quantity, recipe) => {
            quantity.textContent = formatNumber(farming.getOwnedRecipeSeeds(recipe));
        });
    }
    /** Updates the XP, Mastery XP, Mastery Pool XP and interval icons */
    updateGrants(xp, baseXP, masteryXP, baseMasteryXP, masteryPoolXP, seed) {
        this.xpIcon.setXP(xp, baseXP);
        this.xpIcon.setSources(game.farming.getXPSources(seed));
        this.masteryIcon.setXP(masteryXP, baseMasteryXP);
        this.masteryIcon.setSources(game.farming.getMasteryXPSources(seed));
        this.masteryPoolIcon.setXP(masteryPoolXP);
        if (seed !== undefined)
            game.unlockedRealms.length > 1 ? this.masteryPoolIcon.setRealm(seed.realm) : this.masteryPoolIcon.hideRealms();
        else
            this.masteryPoolIcon.hideRealms();
        this.abyssalXPIcon.setSources(game.farming.getAbyssalXPSources(seed));
    }
    /** Updates the Abyssal XP */
    updateAbyssalGrants(xp, baseXP) {
        this.abyssalXPIcon.setXP(xp, baseXP);
        if (baseXP > 0)
            showElement(this.abyssalXPIcon);
        else
            hideElement(this.abyssalXPIcon);
    }
}
window.customElements.define('farming-plot', FarmingPlotElement);
class LockedFarmingPlotElement extends HTMLElement {
    constructor() {
        super();
        this.itemIcons = [];
        this.currencyIcons = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('locked-farming-plot-template'));
        this.farmingLevelRequired = getElementFromFragment(this._content, 'farming-level-required', 'span');
        this.farmingAbyssalLevelRequiredContainer = getElementFromFragment(this._content, 'farming-abyssal-level-required-container', 'p');
        this.farmingAbyssalLevelRequired = getElementFromFragment(this._content, 'farming-abyssal-level-required', 'span');
        this.unlockButton = getElementFromFragment(this._content, 'unlock-button', 'button');
        this.iconContainer = getElementFromFragment(this._content, 'icon-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setPlot(plot, farming, game) {
        this.farmingLevelRequired.textContent = templateLangString('MENU_TEXT_LEVEL', {
            level: `${plot.level}`
        });
        if (plot.abyssalLevel > 0) {
            this.farmingAbyssalLevelRequired.textContent = templateLangString('MENU_TEXT_ABYSSAL_LEVEL', {
                level: `${plot.abyssalLevel}`,
            });
            showElement(this.farmingAbyssalLevelRequiredContainer);
        } else
            hideElement(this.farmingAbyssalLevelRequiredContainer);
        this.iconContainer.textContent = '';
        this.itemIcons = [];
        this.currencyIcons = [];
        plot.itemCosts.forEach((cost) => {
            const itemIcon = createElement('item-quantity-icon', {
                parent: this.iconContainer
            });
            itemIcon.setItem(cost.item, cost.quantity, true);
            this.itemIcons.push(itemIcon);
        });
        plot.currencyCosts.forEach((cost) => {
            const currencyIcon = createElement('currency-quantity-icon', {
                parent: this.iconContainer
            });
            currencyIcon.setCurrency(cost.currency, cost.quantity);
            this.currencyIcons.push(currencyIcon);
        });
        this.unlockButton.onclick = () => farming.unlockPlotOnClick(plot);
        this.updateQuantities(game);
        this.updateUnlockButton(plot, farming);
        this.updateRequirements(plot, farming);
    }
    updateQuantities(game) {
        this.itemIcons.forEach((icon) => icon.updateBorder(game));
        this.currencyIcons.forEach((icon) => icon.updateBorder());
    }
    updateRequirements(plot, farming) {
        const levelMet = farming.level >= plot.level;
        toggleDangerSuccess(this.farmingLevelRequired, levelMet);
        if (plot.abyssalLevel > 0) {
            const abyssalLevelMet = farming.abyssalLevel >= plot.abyssalLevel;
            toggleDangerSuccess(this.farmingAbyssalLevelRequired, abyssalLevelMet);
        }
    }
    updateUnlockButton(plot, farming) {
        const canUnlock = farming.canUnlockPlot(plot);
        this.unlockButton.disabled = !canUnlock;
        if (canUnlock) {
            this.unlockButton.classList.replace('btn-danger', 'btn-success');
        } else {
            this.unlockButton.classList.replace('btn-success', 'btn-danger');
        }
    }
}
window.customElements.define('locked-farming-plot', LockedFarmingPlotElement);
class FarmingSeedSelectElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('farming-seed-select-template'));
        this.seedNotice = getElementFromFragment(this._content, 'seed-notice', 'span');
        this.seedButtonContainer = getElementFromFragment(this._content, 'seed-button-container', 'div');
        this.recipeOwnedQuantity = getElementFromFragment(this._content, 'recipe-owned-quantity', 'span');
        this.recipeProductQuantity = getElementFromFragment(this._content, 'recipe-product-quantity', 'span');
        this.recipeMastery = getElementFromFragment(this._content, 'recipe-mastery', 'mastery-display');
        this.recipeCategory = getElementFromFragment(this._content, 'recipe-category', 'span');
        this.recipeLevel = getElementFromFragment(this._content, 'recipe-level', 'span');
        this.recipeAbyssalLevel = getElementFromFragment(this._content, 'recipe-abyssal-level', 'span');
        this.recipeLevelCont = getElementFromFragment(this._content, 'recipe-level-cont', 'div');
        this.recipeAbyssalLevelCont = getElementFromFragment(this._content, 'recipe-abyssal-level-cont', 'div');
        this.recipeQuantity = getElementFromFragment(this._content, 'recipe-quantity', 'span');
        this.recipeInterval = getElementFromFragment(this._content, 'recipe-interval', 'span');
        this.plantButton = getElementFromFragment(this._content, 'plant-button', 'button');
        this.xpIcon = getElementFromFragment(this._content, 'xp-icon', 'xp-icon');
        this.abyssalXPIcon = getElementFromFragment(this._content, 'abyssal-xp-icon', 'abyssal-xp-icon');
        this.masteryIcon = getElementFromFragment(this._content, 'mastery-icon', 'mastery-xp-icon');
        this.masteryPoolIcon = getElementFromFragment(this._content, 'mastery-pool-icon', 'mastery-pool-icon');
        this.realmSelect = getElementFromFragment(this._content, 'realm-select', 'realm-tab-select');
        hideElement(this.abyssalXPIcon);
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    updateRealmUnlock(realm) {
        this.realmSelect.updateRealmUnlock(realm);
    }
    createRealmOptions(category, game, plot) {
        this.realmSelect.setOptions(game.farming.getRealmsWithMasteryInCategory(category), (realm) => {
            if (game.settings.useLegacyRealmSelection && game.farming.currentRealm !== realm)
                game.farming.selectRealm(realm);
            this.setSeedSelection(category, game, realm, plot);
        }, true);
    }
    setSeedSelection(category, game, realm, plot) {
        //Always show farming realm select, regardless of realm.
        this.createRealmOptions(category, game, plot);
        this.realmSelect.setSelectedRealm(realm);
        const realmsWithMasteryInCategory = game.farming.getRealmsWithMasteryInCategory(category);
        if (realmsWithMasteryInCategory.length > 0 && !realmsWithMasteryInCategory.includes(realm))
            realm = realmsWithMasteryInCategory[0];
        const recipes = game.farming.getRecipesForCategory(category).filter((recipe) => recipe.realm === realm);
        this.seedNotice.textContent = category.seedNotice;
        this.seedButtonContainer.textContent = '';
        recipes.forEach((recipe) => {
            if (game.bank.getQty(recipe.seedCost.item) >= game.farming.getRecipeSeedCost(recipe) &&
                game.farming.level >= recipe.level &&
                (game.farming.abyssalLevel >= recipe.abyssalLevel || recipe.abyssalLevel === 0)) {
                const selectButton = createElement('button', {
                    className: 'btn btn-outline-primary',
                    attributes: [
                        ['type', 'button']
                    ],
                });
                selectButton.append(createElement('img', {
                    className: 'skill-icon-xs mr-2',
                    attributes: [
                        ['src', recipe.seedCost.item.media]
                    ]
                }), recipe.seedCost.item.name);
                selectButton.onclick = () => this.setSelectedRecipe(recipe, game, plot);
                this.seedButtonContainer.append(selectButton);
            }
        });
    }
    setSelectedRecipe(recipe, game, plot) {
        this.recipeOwnedQuantity.textContent = numberWithCommas(game.bank.getQty(recipe.seedCost.item));
        this.recipeProductQuantity.textContent = templateLangString('FARMING_MISC_17', {
            qty: numberWithCommas(game.bank.getQty(recipe.product)),
            farmItem: recipe.product.name,
        });
        showElement(this.recipeMastery);
        this.recipeMastery.setMastery(game.farming, recipe);
        game.farming.renderQueue.actionMastery.add(recipe);
        this.recipeCategory.textContent = recipe.category.singularName;
        this.recipeLevel.textContent = `${recipe.level}`;
        recipe.level > 0 ? showElement(this.recipeLevelCont) : hideElement(this.recipeLevelCont);
        this.recipeAbyssalLevel.textContent = `${recipe.abyssalLevel}`;
        recipe.abyssalLevel > 0 ? showElement(this.recipeAbyssalLevelCont) : hideElement(this.recipeAbyssalLevelCont);
        this.recipeQuantity.textContent = `${game.farming.getRecipeSeedCost(recipe)}`;
        this.recipeInterval.textContent = formatAsTimePeriod(game.farming.getRecipeInterval(recipe));
        const mxp = game.farming.getMasteryXPToAddForAction(recipe, game.farming.getRecipeInterval(recipe) / 1000 / recipe.category.masteryXPDivider);
        const baseMXP = game.farming.getBaseMasteryXPToAddForAction(recipe, game.farming.getRecipeInterval(recipe) / 1000 / recipe.category.masteryXPDivider);
        const xp = game.farming.modifyXP(recipe.baseExperience);
        const mpxp = game.farming.getMasteryXPToAddToPool(mxp);
        this.updateGrants(xp, recipe.baseExperience, mxp, baseMXP, mpxp, recipe);
        this.updateAbyssalGrants(game.farming.modifyAbyssalXP(recipe.baseAbyssalExperience), recipe.baseAbyssalExperience);
        showElement(this.plantButton);
        if (plot === undefined) {
            this.plantButton.onclick = () => game.farming.plantAllRecipe(recipe);
        } else {
            this.plantButton.onclick = () => game.farming.plantRecipe(recipe, plot);
        }
    }
    setUnselectedRecipe() {
        this.recipeOwnedQuantity.textContent = '';
        this.recipeProductQuantity.textContent = '';
        hideElement(this.recipeMastery);
        this.recipeCategory.textContent = '';
        this.recipeLevel.textContent = '';
        this.recipeQuantity.textContent = '';
        this.recipeInterval.textContent = '';
        hideElement(this.plantButton);
        this.updateGrants(0, 0, 0, 0, 0);
        this.updateAbyssalGrants(0, 0);
    }
    /** Updates the XP, Mastery XP, Mastery Pool XP and interval icons */
    updateGrants(xp, baseXP, masteryXP, baseMasteryXP, masteryPoolXP, seed) {
        this.xpIcon.setXP(xp, baseXP);
        this.xpIcon.setSources(game.farming.getXPSources(seed));
        this.masteryIcon.setXP(masteryXP, baseMasteryXP);
        this.masteryIcon.setSources(game.farming.getMasteryXPSources(seed));
        this.masteryPoolIcon.setXP(masteryPoolXP);
        if (seed !== undefined)
            game.unlockedRealms.length > 1 ? this.masteryPoolIcon.setRealm(seed.realm) : this.masteryPoolIcon.hideRealms();
        else
            this.masteryPoolIcon.hideRealms();
        this.abyssalXPIcon.setSources(game.farming.getAbyssalXPSources(seed));
    }
    updateAbyssalGrants(xp, baseXP) {
        this.abyssalXPIcon.setXP(xp, baseXP);
        if (baseXP > 0)
            showElement(this.abyssalXPIcon);
        else
            hideElement(this.abyssalXPIcon);
    }
}
//# sourceMappingURL=farmingMenus.js.map
checkFileVersion('?12097')