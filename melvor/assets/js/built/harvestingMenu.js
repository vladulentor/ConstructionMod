"use strict";
class HarvestingVeinProductElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('harvesting-vein-product-template'));
        this.productImage = getElementFromFragment(this._content, 'product-image', 'img');
        this.productName = getElementFromFragment(this._content, 'product-name', 'div');
        this.requiredIntensity = getElementFromFragment(this._content, 'required-intensity', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setProduct(product) {
        this.productImage.src = product.item.media;
        this.productImage.alt = product.item.name;
        this.productName.textContent = product.item.name;
        this.requiredIntensity.textContent = templateLangString('HARVESTING_REQUIRED_INTENSITY', {
            amount: `${product.minIntensityPercent}`,
        });
    }
    updateProduct(vein, product) {
        if (product.minIntensityPercent <= vein.intensityPercent) {
            this.productName.classList.replace('text-danger', 'text-success');
        } else {
            this.productName.classList.replace('text-success', 'text-danger');
        }
    }
}
window.customElements.define('harvesting-vein-product', HarvestingVeinProductElement);
class HarvestingVeinElement extends HTMLElement {
    constructor() {
        super();
        this.veinProducts = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('harvesting-vein-template'));
        this.button = getElementFromFragment(this._content, 'vein-button', 'a');
        this.statusText = getElementFromFragment(this._content, 'vein-status-text', 'lang-string');
        this.nameText = getElementFromFragment(this._content, 'vein-name-text', 'span');
        this.veinImage = getElementFromFragment(this._content, 'vein-image', 'img');
        this.hpProgressText = getElementFromFragment(this._content, 'vein-hp-progress-text', 'small');
        this.baseQuantityText = getElementFromFragment(this._content, 'vein-quantity-text', 'small');
        this.chanceText = getElementFromFragment(this._content, 'vein-chance-text', 'small');
        this.hpProgress = getElementFromFragment(this._content, 'hp-progress', 'progress-bar');
        this.abyssalXPIcon = getElementFromFragment(this._content, 'abyssal-xp-icon', 'abyssal-xp-icon');
        this.masteryIcon = getElementFromFragment(this._content, 'mastery-icon', 'mastery-xp-icon');
        this.masteryPoolIcon = getElementFromFragment(this._content, 'mastery-pool-icon', 'mastery-pool-icon');
        this.intervalIcon = getElementFromFragment(this._content, 'interval-icon', 'interval-icon');
        this.harvestingProgress = getElementFromFragment(this._content, 'harvesting-progress', 'progress-bar');
        this.veinProductsList = getElementFromFragment(this._content, 'vein-products', 'ul');
        this.mastery = getElementFromFragment(this._content, 'mastery-display', 'mastery-display');
        this.requirementText = getElementFromFragment(this._content, 'vein-requirement-text', 'div');
        this.lockedContainer = getElementFromFragment(this._content, 'locked-container', 'div');
        this.unlockedContainer = getElementFromFragment(this._content, 'unlocked-container', 'div');
        this.nextLevel = getElementFromFragment(this._content, 'next-level', 'span');
        this.nextAbyssalLevel = getElementFromFragment(this._content, 'next-abyssal-level', 'span');
    }
    setLockedContainer(vein) {
        if (game.harvesting === undefined)
            return;
        this.nextLevel.textContent = templateLangString('MENU_TEXT_LEVEL', {
            level: `${vein.level}`
        });
        vein.level > 0 ? showElement(this.nextLevel) : hideElement(this.nextLevel);
        if (vein.level > game.harvesting.level) {
            this.nextLevel.classList.add('bg-danger');
            this.nextLevel.classList.remove('bg-success');
        } else {
            this.nextLevel.classList.remove('bg-danger');
            this.nextLevel.classList.add('bg-success');
        }
        if (game.harvesting.hasAbyssalLevels && vein.abyssalLevel > 0) {
            this.nextAbyssalLevel.textContent = templateLangString('MENU_TEXT_ABYSSAL_LEVEL', {
                level: `${vein.abyssalLevel}`,
            });
            if (vein.abyssalLevel > game.harvesting.abyssalLevel) {
                this.nextAbyssalLevel.classList.add('bg-danger');
                this.nextAbyssalLevel.classList.remove('bg-success');
            } else {
                this.nextAbyssalLevel.classList.remove('bg-danger');
                this.nextAbyssalLevel.classList.add('bg-success');
            }
        } else
            hideElement(this.nextAbyssalLevel);
    }
    setLocked() {
        showElement(this.lockedContainer);
        hideElement(this.unlockedContainer);
    }
    setUnlocked() {
        showElement(this.unlockedContainer);
        hideElement(this.lockedContainer);
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.hpProgress.setStyle('bg-primary');
        this.harvestingProgress.setStyle('bg-harvesting');
    }
    setVein(vein) {
        this.button.onclick = () => {
            var _a;
            return (_a = game.harvesting) === null || _a === void 0 ? void 0 : _a.onVeinClick(vein);
        };
        this.nameText.textContent = vein.name;
        this.mastery.setMastery(game.harvesting, vein);
        this.setLockedContainer(vein);
        this.setProducts(vein);
    }
    setProducts(vein) {
        vein.products.forEach((product) => {
            const productElem = createElement('harvesting-vein-product', {
                parent: this.veinProductsList
            });
            productElem.setProduct(product);
            this.veinProducts.set(product, productElem);
        });
    }
    updateProducts(vein) {
        this.veinProducts.forEach((productElem, product) => {
            productElem.updateProduct(vein, product);
        });
    }
    updateIntensity(vein) {
        this.veinImage.src = vein.media;
        const intensityPercent = vein.intensityPercent;
        this.hpProgress.setFixedPosition(intensityPercent);
        this.hpProgressText.textContent = `${getLangString('INTENSITY:')} ${numberWithCommas(vein.currentIntensity)} / ${numberWithCommas(vein.maxIntensity)} (${templateLangString('MENU_TEXT_PERCENTAGE', {
            value: intensityPercent.toFixed(1),
        })})`;
    }
    updateQuantity(vein, harvesting) {
        const baseQty = harvesting.getVeinBaseRewardQuantity(vein);
        if (harvesting.hpCheckpoints.length <= baseQty - 1) {
            this.baseQuantityText.textContent = templateLangString('HARVESTING_REWARD_QUANTITY_MAX', {
                baseQty: `${baseQty}`,
            });
        } else {
            const nextCheckpoint = Math.floor(vein.maxIntensity * (harvesting.hpCheckpoints[baseQty - 1] / 100));
            this.baseQuantityText.textContent = templateLangString('HARVESTING_REWARD_QUANTITY', {
                baseQty: `${baseQty}`,
                value: `${numberWithCommas(nextCheckpoint)}`,
            });
        }
    }
    updateChanceForItem(vein) {
        let chance = 0;
        for (let i = 0; i < vein.products.length; i++) {
            if (vein.intensityPercent >= vein.products[i].minIntensityPercent) {
                chance = vein.products[i + 1] !== undefined ? vein.products[i + 1].minIntensityPercent : 100;
            } else
                break;
        }
        this.chanceText.textContent = templateLangString('HARVESTING_CHANCE_FOR_ITEM', {
            chance: `${chance}`
        });
    }
    setStatus(statusID) {
        var _a, _b;
        this.statusText.setAttribute('lang-id', `MENU_TEXT_${statusID}`);
        if (statusID === 'HARVESTING') {
            (_a = this.statusText.parentElement) === null || _a === void 0 ? void 0 : _a.classList.add('badge', 'badge-info');
        } else {
            (_b = this.statusText.parentElement) === null || _b === void 0 ? void 0 : _b.classList.remove('badge', 'badge-info');
        }
    }
    setRequirement(reqText) {
        this.requirementText.textContent = reqText;
        showElement(this.requirementText);
    }
    hideRequirement() {
        hideElement(this.requirementText);
    }
    /** Updates the XP, Mastery XP, Mastery Pool XP and interval icons */
    updateGrants(masteryXP, baseMasteryXP, masteryPoolXP, interval, vein) {
        this.masteryIcon.setXP(masteryXP, baseMasteryXP);
        this.masteryIcon.setSources(game.harvesting.getMasteryXPSources(vein));
        this.masteryPoolIcon.setXP(masteryPoolXP);
        game.unlockedRealms.length > 1 ? this.masteryPoolIcon.setRealm(vein.realm) : this.masteryPoolIcon.hideRealms();
        this.intervalIcon.setInterval(interval, game.harvesting.getIntervalSources(vein));
        this.abyssalXPIcon.setSources(game.harvesting.getAbyssalXPSources(vein));
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
window.customElements.define('harvesting-vein', HarvestingVeinElement);
//# sourceMappingURL=harvestingMenu.js.map
checkFileVersion('?12097')