const { loadModule, onInterfaceReady } = mod.getContext(import.meta);

const { templateRielkLangStringWithNodes, templateRielkLangString, getRielkLangString } = await loadModule('src/language/translationManager.mjs');

class ConstructionModifierDisplayElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('rielk-construction-modifier-display-template'));
        this.fixtureImage = getElementFromFragment(this._content, 'fixture-image', 'img');
        this.modifierContainer = getElementFromFragment(this._content, 'modifier-container', 'div');
        this.modifierText = getElementFromFragment(this._content, 'modifier-text', 'h5');
        this.unlock = getElementFromFragment(this._content, 'unlock-container', 'div');
        this.level = getElementFromFragment(this._content, 'level', 'span');
        this.abyssalLevel = getElementFromFragment(this._content, 'abyssal-level', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setFixtureRecipe(recipe, construction) {
        this.recipe = recipe;
        this.fixtureImage.src = recipe.media;
        this.updateModifierInfo();
        this.level.textContent = '';
        this.level.append(...templateLangStringWithNodes('MENU_TEXT_UNLOCKED_AT', {
            skillImage: createElement('img', {
                className: 'skill-icon-xs mr-1',
                attributes: [['src', construction.media]]
            }),
        }, {
            level: `${recipe.level}`
        }, false));
        this.abyssalLevel.textContent = '';
        if (recipe.abyssalLevel >= 1) {
            this.abyssalLevel.append(...templateLangStringWithNodes('UNLOCKED_AT_ABYSSAL_LEVEL', {
                skillImage: createElement('img', {
                    className: 'skill-icon-xs mr-1',
                    attributes: [['src', construction.media]],
                }),
            }, {
                level: `${recipe.abyssalLevel}`
            }, false));
            showElement(this.abyssalLevel);
        } else {
            hideElement(this.abyssalLevel);
        }
        this.updatePanelForLevel(construction);
    }
    updatePanelForLevel(construction) {
        if (this.recipe == undefined)
            return;
        if (construction.level >= this.recipe.level && construction.abyssalLevel >= this.recipe.abyssalLevel) {
            this.setUnlocked();
        } else {
            this.setLocked(this.recipe, construction);
        }
    }
    updateModifierInfo() {
        this.modifierText.textContent = '';
        const formatter = getElementDescriptionFormatter('div', this.recipe.isUnlocked ? 'mb-1' : 'mb-1 text-warning');
        this.modifierText.append(...StatObject.formatDescriptions(this.recipe.stats, formatter));
        if (this.recipe.doesGrantItems) {  // This is currently never used, but might be useful to know about.
            this.recipe.grantItems.forEach(iq => {
                var nodes = templateRielkLangStringWithNodes('DESCRIPTION_ADDS_ITEM', {
                    itemImage: createElement('img', {
                        className: 'skill-icon-xs',
                        attributes: [['src', iq.item.media]]
                    })
                }, {
                    itemQuantity: iq.quantity,
                    itemName: iq.item.name,
                });
                nodes = nodes.map(n => {
                    if (typeof n == 'string')
                        return formatter({ text: n });
                    return n;
                })
                this.modifierText.append(...nodes)
            });
        }

        if (this.recipe.changeFunc != undefined) {

            // Look it up in your language object
            let text = templateRielkLangString(`MODIFIER_DATA_${this.recipe.changeFunc}`, {tierNum: this.recipe.id.slice(-1) });
            if(text.startsWith("UNDEFINED TRANSLATION")) //if we ever add a modifier that starts with UNDEFINED TRANSLATION, we'll need to make this more robust
            text = templateRielkLangString(`MODIFIER_DATA_${this.recipe.changeFunc}_${this.recipe.id.slice(-1)}`, {tierNum: this.recipe.id.slice(-1) });

            this.modifierText.append(formatter({ text: text }));
        }
    }

    setLocked(recipe, construction) {
        hideElement(this.fixtureImage);
        hideElement(this.modifierContainer);
        this.modifierContainer.classList.remove('d-flex');
        toggleDangerSuccess(this.level, construction.level >= recipe.level);
        toggleDangerSuccess(this.abyssalLevel, construction.abyssalLevel >= recipe.abyssalLevel);
        showElement(this.unlock);
    }
    setUnlocked() {
        showElement(this.fixtureImage);
        showElement(this.modifierContainer);
        this.modifierContainer.classList.add('d-flex');
        hideElement(this.unlock);
    }
}
window.customElements.define('rielk-construction-modifier-display', ConstructionModifierDisplayElement);
