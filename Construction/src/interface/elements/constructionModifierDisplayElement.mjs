const { loadModule, onInterfaceReady } = mod.getContext(import.meta);

const { templateRielkLangStringWithNodes, templateRielkLangString, getRielkLangString } = await loadModule('src/language/translationManager.mjs');

const ctx = mod.getContext(import.meta);




class ConstructionModifierDisplayElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('rielk-construction-modifier-display-template'));
        this.fixtureImage = getElementFromFragment(this._content, 'fixture-image', 'img');
        this.tierOverlay = getElementFromFragment(this._content, 'tier-overlay', 'img');
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

        this.tierOverlay.src = this.recipe.shinyMods ? ctx.getResourceUrl(`assets/tiers/${this.recipe.tier}_s.webp`) : ctx.getResourceUrl(`assets/tiers/${this.recipe.tier}_n.webp`);
        this.updateModifierInfo();
        this.level.textContent = '';

        const icon = createElement('img', { className: 'skill-icon-xs mr-1' })
        if (this.recipe.shinyMods)
            icon.setAttribute('src', ctx.getResourceUrl('assets/icon_shiny.webp'));
        else
            icon.setAttribute('src', construction.media);

        
        this.level.append(...templateLangStringWithNodes('MENU_TEXT_UNLOCKED_AT', {skillImage: icon}, {level: `${recipe.level}`}, false));
        if (this.recipe.shinyMods) {
            this.level.classList.remove('text-danger');
            this.level.classList.add('has-mods', 'fuck-you');
        }
        else {
            this.level.classList.remove('has-mods', 'fuck-you');
            this.level.classList.add('text-danger');
        }

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
    setRecipeSpecial() {
        this.modifierContainer.classList.remove('border-rielk-nonshiny');
        this.modifierContainer.classList.add('border-rielk-shiny');
        //return getElementDescriptionFormatter('div', this.recipe.isUnlocked ? 'mb-1 construction-victory' : 'mb-1 text-warning');
    }
    unsetRecipeSpecial() {
        this.modifierContainer.classList.remove('border-rielk-shiny');
        this.modifierContainer.classList.add('border-rielk-nonshiny');
        //this.fixtureImage.classList.remove('special-tier-icon');

    }
    toggleRecipeSpecial() {
        if (this.recipe.shinyMods)
            this.setRecipeSpecial();
        else
            this.unsetRecipeSpecial();
    }
    updateModifierInfo() {
        this.modifierText.textContent = '';
        if (!this.recipe.isUnlocked)
            this.fixtureImage.classList.add('img-gray');
        else
            this.fixtureImage.classList.remove('img-gray');
        
        const formatter = getElementDescriptionFormatter('div', this.recipe.isUnlocked ? 'mb-1' : 'mb-1 text-combat-smoke modifier-box locked');
        this.toggleRecipeSpecial();
        const descs = this.recipe.order?   getOrderedDescriptions(this.recipe.stats, this.recipe.order): StatObject.getDescriptions(this.recipe.stats);
        descs.forEach((desc, i) => {
            const isShiny = this.recipe.shinyMods?.includes(i + 1); //isshiny is an array of 1-indexed numbers, to make some recipes fancier
            if (isShiny) {
                desc.text = `<span class="m-1 font-size-sm ${this.recipe.isUnlocked ? 'construction-victory' : 'text-warning'}">${desc.text}</span>`;
            } else {
                desc.text = `<span class="m-1 font-size-sm ${this.recipe.isUnlocked ? 'text-success' : 'text-combat-smoke modifier-box locked'}">${desc.text}</span>`;
            }
        });
        const elements = descs.map(d => {
            const el = createElement('div', {
                className: 'mb-1 font-w600',
                innerHTML: d.text
            });
            return el;
        });
        this.modifierText.append(...elements);
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

        /*  if (this.recipe.changeFunc != undefined) {
              let text = templateRielkLangString(`MODIFIER_DATA_${this.recipe.changeFunc}`, {tierNum: this.recipe.id.slice(-1) });
              if(text.startsWith("UNDEFINED TRANSLATION")) //if we ever add a modifier that starts with UNDEFINED TRANSLATION, we'll need to make this more robust
              text = templateRielkLangString(`MODIFIER_DATA_${this.recipe.changeFunc}_${this.recipe.id.slice(-1)}`, {tierNum: this.recipe.id.slice(-1) });
  
              this.modifierText.append(formatter({ text: text }));
          }*/

    }

    setLocked(recipe, construction) {
        hideElement(this.fixtureImage);
        hideElement(this.tierOverlay);
        hideElement(this.modifierContainer);
        this.modifierContainer.classList.remove('d-flex');
        toggleDangerSuccess(this.level, construction.level >= recipe.level);
        toggleDangerSuccess(this.abyssalLevel, construction.abyssalLevel >= recipe.abyssalLevel);
        showElement(this.unlock);
    }
    setUnlocked() {
        showElement(this.fixtureImage);
        showElement(this.tierOverlay);
        showElement(this.modifierContainer);
        this.modifierContainer.classList.add('d-flex');
        hideElement(this.unlock);
    }
}
window.customElements.define('rielk-construction-modifier-display', ConstructionModifierDisplayElement);

function getOrderedDescriptions(statObject, order, negMult = 1, posMult = 1, includeZero = true) {
  const mods = [];
  let m = 0, c = 0;

  order.forEach((type) => {
    if (type === "m" && statObject.modifiers?.[m]) {
      const mod = statObject.modifiers[m++];
      if (StatObject.showDescription(mod.isNegative, negMult, posMult, includeZero))
        mods.push(mod.print(negMult, posMult));
    } else if (type === "c" && statObject.conditionalModifiers?.[c]) {
      const cond = statObject.conditionalModifiers[c++];
      const desc = cond.getDescription(negMult, posMult);
      if (desc && StatObject.showDescription(cond.isNegative, negMult, posMult, includeZero))
        mods.push(desc);
    }
  });

  return mods;
}