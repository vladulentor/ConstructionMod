"use strict";
class CookingMenuElement extends HTMLElement {
    constructor() {
        super();
        this.productQty = 0;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('cooking-menu-template'));
        this.upgradeImage = getElementFromFragment(this._content, 'upgrade-image', 'img');
        this.upgradeName = getElementFromFragment(this._content, 'upgrade-name', 'h5');
        this.selectRecipeButton = getElementFromFragment(this._content, 'select-recipe-button', 'button');
        this.selectedRecipeContainer = getElementFromFragment(this._content, 'selected-recipe-container', 'div');
        this.productImage = getElementFromFragment(this._content, 'product-image', 'img');
        this.productCount = getElementFromFragment(this._content, 'product-count', 'small');
        this.productName = getElementFromFragment(this._content, 'product-name', 'h5');
        this.productHealing = getElementFromFragment(this._content, 'product-healing', 'span');
        this.requires = getElementFromFragment(this._content, 'requires', 'requires-box');
        this.grants = getElementFromFragment(this._content, 'grants', 'grants-box');
        this.mastery = getElementFromFragment(this._content, 'mastery', 'mastery-display');
        this.haves = getElementFromFragment(this._content, 'haves', 'haves-box');
        this.bonuses = getElementFromFragment(this._content, 'bonuses', 'cooking-bonus-box');
        this.activeCookButton = getElementFromFragment(this._content, 'active-cook-button', 'button');
        this.activeCookInterval = getElementFromFragment(this._content, 'active-cook-interval', 'small');
        this.passiveCookButton = getElementFromFragment(this._content, 'passive-cook-button', 'button');
        this.passiveCookInterval = getElementFromFragment(this._content, 'passive-cook-interval', 'small');
        this.stockPileIcon = getElementFromFragment(this._content, 'stock-pile-icon', 'cooking-stockpile-icon');
        this.stockPileButton = getElementFromFragment(this._content, 'stock-pile-button', 'button');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'progress-bar');
        this.intervalTooltipEl = new IntervalIconTooltipElement();
        this.passiveIntervalTooptipEl = new IntervalIconTooltipElement();
    }
    connectedCallback() {
        this.appendChild(this._content);
        if (this.productTooltip === undefined) {
            this.productTooltip = tippy(this.productImage, {
                placement: 'top',
                interactive: false,
                animation: false,
                allowHTML: true,
            });
        }
        this.progressBar.setStyle('bg-success');
        this.intervalTooltip = tippy(this.activeCookInterval, {
            content: this.intervalTooltipEl,
            placement: 'top',
            interactive: true,
            animation: false,
            allowHTML: true,
        });
        this.passiveIntervalTooltip = tippy(this.passiveCookInterval, {
            content: this.passiveIntervalTooptipEl,
            placement: 'top',
            interactive: true,
            animateFill: false,
            allowHTML: true,
        });
    }
    disconnectedCallback() {
        if (this.productTooltip !== undefined) {
            this.productTooltip.destroy();
            this.productTooltip = undefined;
        }
        if (this.intervalTooltip !== undefined) {
            this.intervalTooltip.destroy();
            this.intervalTooltip = undefined;
        }
        if (this.passiveIntervalTooltip !== undefined) {
            this.passiveIntervalTooltip.destroy();
            this.passiveIntervalTooltip = undefined;
        }
    }
    init(category, game) {
        this.selectRecipeButton.onclick = () => game.cooking.onRecipeSelectionOpenClick(category, game.cooking.currentRealm);
        this.productCount.onmouseover = () => {
            this.productCount.textContent = numberWithCommas(this.productQty);
        };
        this.productCount.onmouseout = () => {
            this.productCount.textContent = formatNumber(this.productQty);
        };
        this.activeCookButton.onclick = () => {
            game.cooking.onActiveCookButtonClick(category);
            this.activeCookButton.blur();
        };
        this.passiveCookButton.onclick = () => {
            game.cooking.onPassiveCookButtonClick(category);
            this.passiveCookButton.blur();
        };
        this.stockPileIcon.setOnClick(() => game.cooking.onCollectStockpileClick(category));
        this.stockPileButton.onclick = () => {
            game.cooking.onCollectStockpileClick(category);
            this.stockPileButton.blur();
        };
    }
    setStockPile(item) {
        if (item === undefined) {
            this.stockPileIcon.unsetItem();
        } else {
            this.stockPileIcon.setItem(item.item, item.quantity);
        }
    }
    updateUpgrade(category) {
        this.upgradeImage.src = category.media;
        this.upgradeName.textContent = category.upgradeName;
        this.selectRecipeButton.disabled = category.upgradeRequired && !category.upgradeOwned;
    }
    setSelected(recipe) {
        this.haves.setSelected();
        this.requires.setSelected();
        this.grants.setSelected();
        this.bonuses.setSelected(recipe);
        showElement(this.selectedRecipeContainer);
    }
    getOwnedTooltipContent(normalQty, percectQty) {
        // TODO Refactor this into component
        return `<h5 class="text-warning text-center font-w600 mb-1">${getLangString('MENU_TEXT_IN_BANK')}</h5>
    <h5 class="text-white text-center font-w400 mb-1 font-size-sm">${templateLangString('MENU_TEXT_NORMAL', {
            quantity: successSpan(numberWithCommas(normalQty)),
        })}</h5>
    <h5 class="text-white text-center font-w400 mb-1 font-size-sm">${templateLangString('MENU_TEXT_PERFECT', {
            quantity: successSpan(numberWithCommas(percectQty)),
        })}</h5>`;
    }
    setSelectedRecipe(recipe, cooking, game) {
        if (recipe !== undefined) {
            this.setSelected(recipe);
            this.productImage.src = recipe.product.media;
            this.productName.textContent = `${recipe.baseQuantity} x ${recipe.product.name}`;
            this.requires.setItemsFromCosts(cooking.getRecipeCosts(recipe), !recipe.hasMastery);
            this.haves.setItemsFromRecipe(recipe, game, !recipe.hasMastery);
            if (recipe.hasMastery) {
                this.mastery.classList.remove('invisible');
                this.mastery.setMastery(cooking, recipe);
                cooking.updateMasteryDisplays(recipe);
            } else {
                this.mastery.classList.add('invisible');
                this.grants.hideMastery();
            }
        } else {
            hideElement(this.selectedRecipeContainer);
        }
    }
    setRecipeRates(recipe, cooking) {
        const timePerActionModifier = cooking.getRecipeMasteryModifiedInterval(recipe);
        const masteryXPToAdd = cooking.getMasteryXPToAddForAction(recipe, timePerActionModifier);
        const baseMasteryXP = cooking.getBaseMasteryXPToAddForAction(recipe, timePerActionModifier);
        this.grants.updateGrants(cooking.modifyXP(recipe.baseExperience, recipe), recipe.baseExperience, masteryXPToAdd, baseMasteryXP, cooking.getMasteryXPToAddToPool(masteryXPToAdd), recipe.realm);
        this.grants.updateAbyssalGrants(cooking.modifyAbyssalXP(recipe.baseAbyssalExperience, recipe), recipe.baseAbyssalExperience);
        this.grants.setSources(cooking, recipe);
        const interval = cooking.getRecipeCookingInterval(recipe) / 1000;
        const passiveInterval = cooking.getRecipePassiveCookingInterval(recipe) / 1000;
        this.activeCookInterval.textContent = templateLangString('MENU_TEXT_SECONDS_SHORT', {
            seconds: formatFixed(interval, 2),
        });
        this.intervalTooltipEl.updateSources(cooking.getIntervalSources(recipe));
        this.passiveCookInterval.textContent = templateLangString('MENU_TEXT_SECONDS_SHORT', {
            seconds: formatFixed(passiveInterval, 2),
        });
        this.passiveIntervalTooptipEl.updateSources(cooking.getPassiveIntervalSources(recipe));
        const item = recipe.product;
        if (item instanceof FoodItem)
            this.productHealing.innerHTML = templateLangString('MENU_TEXT_BASE_HEALING_VALUE', {
                value: `<span class="text-success">${numberWithCommas(item.healsFor * numberMultiplier)}</span>`,
            });
    }
    setBonusValues(values, costReduction, costReductionSources, additionalPrimaryQuantity, additionalPrimaryQuantitySources) {
        this.bonuses.setChances(values);
        this.bonuses.setCostReduction(costReduction, costReductionSources);
        this.bonuses.setAdditionalPrimaryQuantity(additionalPrimaryQuantity, additionalPrimaryQuantitySources);
    }
    updateQuantities(recipe, game) {
        var _a;
        this.haves.updateQuantities(game);
        const normalQty = game.bank.getQty(recipe.product);
        const perfectQty = game.bank.getQty(recipe.perfectItem);
        this.productQty = normalQty + perfectQty;
        this.productCount.textContent = formatNumber(this.productQty);
        (_a = this.productTooltip) === null || _a === void 0 ? void 0 : _a.setContent(this.getOwnedTooltipContent(normalQty, perfectQty));
    }
    setProgressPassive() {
        this.progressBar.setStyle('bg-primary');
        this.progressBar.animateStriped();
    }
    renderActiveProgress(timer) {
        this.progressBar.setStyle('bg-success');
        this.progressBar.animateProgressFromTimer(timer);
    }
    stopProgressBar() {
        this.progressBar.stopAnimation();
    }
}
window.customElements.define('cooking-menu', CookingMenuElement);
class CookingRecipeSelectionElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('cooking-recipe-selection-template'));
        this.productImage = getElementFromFragment(this._content, 'product-image', 'img');
        this.masteryLevel = getElementFromFragment(this._content, 'mastery-level', 'span');
        this.masteryPercent = getElementFromFragment(this._content, 'mastery-percent', 'small');
        this.productName = getElementFromFragment(this._content, 'product-name', 'span');
        this.selectButton = getElementFromFragment(this._content, 'select-button', 'button');
        this.cookingXP = getElementFromFragment(this._content, 'cooking-xp', 'span');
        this.healingAmount = getElementFromFragment(this._content, 'healing-amount', 'span');
        this.intervalIcon = getElementFromFragment(this._content, 'interval-icon', 'interval-icon');
        this.costIcons = getElementFromFragment(this._content, 'cost-icons', 'quantity-icons');
        this.foodModifiersCont = getElementFromFragment(this._content, 'food-modifiers-cont', 'div');
        this.foodModifiers = getElementFromFragment(this._content, 'food-modifiers', 'div');
        this.perfectFoodModifiersCont = getElementFromFragment(this._content, 'perfect-food-modifiers-cont', 'div');
        this.perfectFoodModifiers = getElementFromFragment(this._content, 'perfect-food-modifiers', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setRecipe(recipe, cooking, game) {
        this.productImage.src = recipe.product.media;
        this.productName.textContent = `${recipe.baseQuantity} x ${recipe.product.name}`;
        const costs = cooking.getRecipeCosts(recipe);
        this.costIcons.setIconsForCosts(costs, true, !recipe.hasMastery);
        this.selectButton.onclick = () => {
            game.cooking.onRecipeSelectionClick(recipe);
            this.selectButton.blur();
        };
        this.intervalIcon.setMedia(!recipe.hasMastery);
        this.updateRates(recipe);
        this.updateMastery(recipe, cooking);
        this.updateQuantities(game);
        this.updateModifiers(recipe);
    }
    /** Updates the interval, XP, hitpoints */
    updateRates(recipe) {
        const item = recipe.product;
        this.cookingXP.textContent = '';
        if (recipe.baseExperience > 0) {
            this.cookingXP.textContent += `${numberWithCommas(Math.floor(game.cooking.modifyXP(recipe.baseExperience)))} ${getLangString('MENU_TEXT_SKILL_XP')}`;
        }
        if (recipe.baseAbyssalExperience > 0) {
            this.cookingXP.textContent += templateLangString('MENU_TEXT_AXP_AMOUNT', {
                xp: `${numberWithCommas(Math.floor(game.cooking.modifyAbyssalXP(recipe.baseAbyssalExperience)))}`,
            });
        }
        if (item instanceof FoodItem)
            this.healingAmount.innerHTML = templateLangString('MENU_TEXT_BASE_HEALING_VALUE', {
                value: `<span class="text-success">${numberWithCommas(item.healsFor * numberMultiplier)}</span>`,
            });
        this.intervalIcon.setInterval(game.cooking.getRecipeCookingInterval(recipe), game.cooking.getIntervalSources(recipe));
    }
    /** Updates the modifiers provided by the food */
    updateModifiers(recipe) {
        hideElement(this.foodModifiersCont);
        hideElement(this.perfectFoodModifiersCont);
        const item = recipe.product;
        const perfectItem = recipe.perfectItem;
        if (item instanceof FoodItem) {
            if (item.stats.hasStats) {
                this.foodModifiers.innerHTML = item.stats.describeLineBreak();
                showElement(this.foodModifiersCont);
            }
        }
        if (perfectItem instanceof FoodItem) {
            if (perfectItem.stats.hasStats) {
                this.perfectFoodModifiers.innerHTML = perfectItem.stats.describeLineBreak();
                showElement(this.perfectFoodModifiersCont);
            }
        }
    }
    /** Updates the mastery level and percent */
    updateMastery(recipe, cooking) {
        if (!recipe.hasMastery) {
            this.masteryLevel.textContent = `69`;
            this.masteryPercent.textContent = `(${formatPercent(4.2, 2)})`;
        } else {
            const progress = cooking.getMasteryProgress(recipe);
            this.masteryLevel.textContent = `${progress.level}`;
            this.masteryPercent.textContent = `(${formatPercent(progress.percent, 2)})`;
        }
    }
    /** Updates the quanties of the recipe costs */
    updateQuantities(game) {
        this.costIcons.updateQuantities(game);
    }
}
window.customElements.define('cooking-recipe-selection', CookingRecipeSelectionElement);
class LockedCookingRecipeElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('locked-cooking-recipe-template'));
        this.lockedText = getElementFromFragment(this._content, 'locked-text', 'h5');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setRecipe(recipe) {
        this.lockedText.textContent = '';
        this.lockedText.append(...templateLangStringWithNodes('MENU_TEXT_REQUIRES_SKILL_LEVEL', {
            skillImage: createElement('img', {
                className: 'skill-icon-xs mr-1',
                attributes: [
                    ['src', game.cooking.media]
                ],
            }),
        }, {
            level: `${recipe.level}`
        }));
        if (recipe.abyssalLevel > 0) {
            this.lockedText.append(document.createElement('br'));
            this.lockedText.append(...templateLangStringWithNodes('MENU_TEXT_REQUIRES_ABYSSAL_LEVEL', {
                skillImage: createElement('img', {
                    className: 'skill-icon-xs mr-1',
                    attributes: [
                        ['src', game.cooking.media]
                    ],
                }),
            }, {
                level: `${recipe.abyssalLevel}`
            }));
        }
    }
}
window.customElements.define('locked-cooking-recipe', LockedCookingRecipeElement);
//# sourceMappingURL=cookingMenu.js.map
checkFileVersion('?12097')