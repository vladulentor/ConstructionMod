"use strict";
class AltMagicMenuElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('alt-magic-menu-template'));
        this.spellName = getElementFromFragment(this._content, 'spell-name', 'span');
        this.spellDescription = getElementFromFragment(this._content, 'spell-description', 'small');
        this.spellImage = getElementFromFragment(this._content, 'spell-image', 'img');
        this.clickImageInfo = getElementFromFragment(this._content, 'image-info', 'div');
        this.runeRequirements = getElementFromFragment(this._content, 'rune-requirements', 'requires-box');
        this.itemRequirementsContainer = getElementFromFragment(this._content, 'item-requirements-container', 'div');
        this.itemRequirements = getElementFromFragment(this._content, 'item-requirements', 'quantity-icons');
        this.runeHaves = getElementFromFragment(this._content, 'rune-haves', 'haves-box');
        this.itemHavesContainer = getElementFromFragment(this._content, 'item-haves-container', 'div');
        this.itemHaves = getElementFromFragment(this._content, 'item-haves', 'current-quantity-icons');
        this.producesSingle = getElementFromFragment(this._content, 'produces-single', 'produces-box');
        this.producesCurrent = getElementFromFragment(this._content, 'produces-current', 'haves-box');
        this.grants = getElementFromFragment(this._content, 'grants', 'grants-box');
        this.interval = getElementFromFragment(this._content, 'interval', 'interval-icon');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'progress-bar');
        this.castButton = getElementFromFragment(this._content, 'cast-button', 'button');
        this.doublingCont = getElementFromFragment(this._content, 'doubling-icon-cont', 'div');
        this.doublingIcon = getElementFromFragment(this._content, 'doubling-icon', 'doubling-icon');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.grants.hideMastery();
    }
    setCastCallback(altMagic) {
        this.castButton.onclick = () => altMagic.castButtonOnClick();
    }
    setSpell(altMagic, spell) {
        this.spellName.textContent = spell.name;
        this.spellDescription.textContent = spell.description;
        this.setSpellImage(altMagic);
        switch (spell.specialCost.type) {
            case AltMagicConsumptionID.AnyItem:
            case AltMagicConsumptionID.JunkItem:
            case AltMagicConsumptionID.BarIngredientsWithCoal:
            case AltMagicConsumptionID.BarIngredientsWithoutCoal:
            case AltMagicConsumptionID.AnySuperiorGem:
            case AltMagicConsumptionID.AnyNormalFood:
                showElement(this.clickImageInfo);
                this.spellImage.onclick = () => altMagic.openSelectItemOnClick();
                break;
            default:
                hideElement(this.clickImageInfo);
                this.spellImage.onclick = null;
                break;
        }
        if (spell.produces !== AltMagicProductionID.GP &&
            spell.produces !== AltMagicProductionID.MagicXP &&
            spell.produces !== AltMagicProductionID.AbyssalMagicXP) {
            showElement(this.doublingCont);
            this.doublingIcon.setChance(altMagic.selectedSpellDoublingChance, altMagic.getDoublingSources(spell));
        } else {
            hideElement(this.doublingCont);
        }
        this.interval.setInterval(altMagic.actionInterval, altMagic.getIntervalSources());
        this.grants.setSelected();
        this.grants.updateGrants(altMagic.modifyXP(altMagic.selectSpellTotalBaseXP), altMagic.selectSpellTotalBaseXP, 0, 0, 0, game.defaultRealm);
        this.grants.updateAbyssalGrants(altMagic.modifyXP(altMagic.selectSpellTotalBaseAbyssalXP), altMagic.selectSpellTotalBaseAbyssalXP);
        this.grants.setSources(altMagic, spell);
        this.grants.hideMastery();
    }
    setSpellImage(altMagic) {
        this.spellImage.src = altMagic.selectedSpellMedia;
    }
    setSpellQuantities(altMagic, game) {
        const runeCosts = altMagic.getCurrentRecipeRuneCosts().getItemQuantityArray();
        this.runeRequirements.setSelected();
        this.runeRequirements.setItems(runeCosts, []);
        this.runeHaves.setSelected();
        this.runeHaves.setItems(runeCosts, [], game);
        const itemCosts = altMagic.getCurrentRecipeCosts().getItemQuantityArray();
        if (itemCosts.length > 0) {
            showElement(this.itemRequirementsContainer);
            showElement(this.itemHavesContainer);
            this.itemRequirements.setSelected();
            this.itemRequirements.setIcons(itemCosts, []);
            this.itemHaves.setSelected();
            this.itemHaves.setIcons(itemCosts, [], game);
        } else {
            hideElement(this.itemRequirementsContainer);
            hideElement(this.itemHavesContainer);
            this.itemRequirements.removeIcons();
            this.itemHaves.removeIcons();
        }
        const products = altMagic.getCurrentRecipeBaseProducts();
        if (products.items.length > 0 || products.currencies.length > 0) {
            showElement(this.producesSingle);
            this.producesSingle.setSelected();
            this.producesSingle.setItems(products.items, products.currencies);
            showElement(this.producesCurrent);
            this.producesCurrent.setSelected();
            this.producesCurrent.setItems(products.items, products.currencies, game);
        } else {
            hideElement(this.producesSingle);
            this.producesSingle.destroyIcons();
            hideElement(this.producesCurrent);
            this.producesCurrent.destroyIcons();
        }
    }
    resetSpellQuantities() {
        this.runeRequirements.destroyIcons();
        this.runeRequirements.setUnselected();
        this.runeHaves.destroyIcons();
        this.runeHaves.setUnselected();
        hideElement(this.itemRequirementsContainer);
        hideElement(this.itemHavesContainer);
        this.itemRequirements.removeIcons();
        this.itemRequirements.setUnselected();
        this.itemHaves.removeIcons();
        this.itemHaves.setUnselected();
        hideElement(this.producesSingle);
        this.producesSingle.destroyIcons();
        hideElement(this.producesCurrent);
        this.producesCurrent.destroyIcons();
    }
    updateQuantities(game) {
        this.runeHaves.updateQuantities(game);
        this.itemHaves.updateQuantities(game);
        this.producesCurrent.updateQuantities(game);
    }
    updateRates(altMagic) {
        this.interval.setInterval(altMagic.actionInterval, game.altMagic.getIntervalSources());
        this.doublingIcon.setChance(altMagic.selectedSpellDoublingChance, altMagic.getDoublingSources());
        const baseXP = altMagic.selectSpellTotalBaseXP;
        this.grants.updateGrants(altMagic.modifyXP(baseXP), baseXP, 0, 0, 0, game.defaultRealm);
        this.grants.updateAbyssalGrants(altMagic.modifyAbyssalXP(altMagic.selectSpellTotalBaseAbyssalXP), altMagic.selectSpellTotalBaseAbyssalXP);
    }
    unsetSpell() {
        this.spellName.textContent = '-';
        this.spellDescription.textContent = '-';
        this.spellImage.src = game.altMagic.media;
        this.spellImage.onclick = null;
        hideElement(this.clickImageInfo);
        this.grants.setUnselected();
        this.resetSpellQuantities();
    }
    renderProgress(altMagic, timer) {
        if (altMagic.isActive) {
            this.progressBar.animateProgressFromTimer(timer);
        } else {
            this.progressBar.stopAnimation();
        }
    }
}
window.customElements.define('alt-magic-menu', AltMagicMenuElement);
class AltMagicItemMenuElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('alt-magic-item-menu-template'));
        this.buttonContainer = getElementFromFragment(this._content, 'button-container', 'div');
        const selectItemTemplate = document.getElementById('alt-magic-item-select-template');
        if (selectItemTemplate === null || !(selectItemTemplate instanceof HTMLTemplateElement))
            throw new Error('Template does not exist');
        this.selectItemFragment = selectItemTemplate.content;
        const selectBarFragment = document.getElementById('alt-magic-bar-select-template');
        if (selectBarFragment === null || !(selectBarFragment instanceof HTMLTemplateElement))
            throw new Error('Template does not exist');
        this.selectBarFragment = selectBarFragment.content;
        const lockedBarTemplate = document.getElementById('alt-magic-bar-locked-template');
        if (lockedBarTemplate === null || !(lockedBarTemplate instanceof HTMLTemplateElement))
            throw new Error('Template does not exist');
        this.lockedBarFragment = lockedBarTemplate.content;
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    createItemButton(item, callback) {
        const newButton = new DocumentFragment();
        newButton.append(this.selectItemFragment.cloneNode(true));
        getElementFromFragment(newButton, 'link', 'a').onclick = callback;
        getElementFromFragment(newButton, 'image', 'img').src = item.media;
        return newButton;
    }
    createBarButton(item, callback) {
        const newButton = new DocumentFragment();
        newButton.append(this.selectBarFragment.cloneNode(true));
        getElementFromFragment(newButton, 'link', 'a').onclick = callback;
        getElementFromFragment(newButton, 'bar-image', 'img').src = item.media;
        getElementFromFragment(newButton, 'bar-name', 'span').textContent = item.name;
        return newButton;
    }
    createLockedBarButton(unlockLevel) {
        const newButton = new DocumentFragment();
        newButton.append(this.lockedBarFragment.cloneNode(true));
        getElementFromFragment(newButton, 'message-span', 'span').append(...templateLangStringWithNodes('MENU_TEXT_UNLOCKED_AT', {
            skillImage: createElement('img', {
                className: 'skill-icon-xs mr-1',
                attributes: [
                    ['src', game.smithing.media]
                ],
            }),
        }, {
            level: `${unlockLevel}`
        }));
        return newButton;
    }
    /** Sets the available item selection for the given spell */
    setItemSelection(altMagic, spell) {
        const itemButtons = new DocumentFragment();
        const items = altMagic.getSpellItemSelection(spell);
        items.forEach((item) => {
            itemButtons.append(this.createItemButton(item, () => altMagic.selectItemOnClick(item)));
        });
        this.buttonContainer.textContent = '';
        this.buttonContainer.append(itemButtons);
    }
    /** Sets the available bar selection */
    setBarSelection(altMagic) {
        const barButtons = new DocumentFragment();
        altMagic.smithingBarRecipes.forEach((recipe) => {
            if (game.smithing.level >= recipe.level) {
                barButtons.append(this.createBarButton(recipe.product, () => altMagic.selectBarOnClick(recipe)));
            } else {
                barButtons.append(this.createLockedBarButton(recipe.level));
            }
        });
        this.buttonContainer.textContent = '';
        this.buttonContainer.append(barButtons);
    }
}
window.customElements.define('alt-magic-item-menu', AltMagicItemMenuElement);
//# sourceMappingURL=altMagicMenu.js.map
checkFileVersion('?12097')