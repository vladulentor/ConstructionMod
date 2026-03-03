const ctx = mod.getContext(import.meta);
const { loadModule } = mod.getContext(import.meta);
const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');

// ---------------- MAKING CUSTOM CLASSES FOR THIS SHIT -----------------
class LockedIconElement extends InfoIconElement {
    constructor(gold, small) {
        super();

        // Template fragment
        this._content = new DocumentFragment();
        const template = small ? getTemplateNode('locked-icon-template-sm') : getTemplateNode('locked-icon-template')
        this._content.append(template);
        //this.isgold = gold
        // DOM references
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.itemImage = getElementFromFragment(this._content, 'icon-image', 'img'); // main icon
        this.quantity = getElementFromFragment(this._content, 'quantity', 'small');
        this.quantity.style.backgroundColor = `${gold ? '#c99a5a' : '#4a8fc1'}`;
        this.lockOverlay = getElementFromFragment(this._content, 'lock-overlay', 'img'); // overlay for lock
        if (gold) {
            this.lockOverlay.src = ctx.getResourceUrl('assets/others/goldlock.webp');
            this.container.classList.add('border-warning');
        }
        else {
            this.lockOverlay.src = ctx.getResourceUrl('assets/others/bluelock.webp');
            this.container.classList.add('border-info');
        }
        this.tooltipElem = createElement('div', { className: 'text-center' }); // tooltip content
        this.lockText = createElement('div', { className: `text-center font-w400 font-size-sm mb-1 text-warning` });
        this.lockText.innerText = getRielkLangString('MENU_TOOLTIP_CONVERGENCE_LOCKED');
        this.lockText.appendChild(createElement('div', { className: 'dropdown-divider' }))
        this.itemName = createElement('div', { className: 'text-center' });
        this.tooltipElem.appendChild(this.lockText);
        this.tooltipElem.appendChild(this.itemName);
    }


    showLock() {
        this.lockOverlay.classList.remove('d-none');
        this.lockText.classList.remove('d-none');
        //this.itemImage.classList.remove(`${this.isgold?'img-tint-gold': 'img-tint-blue'}`);
        this.itemImage.classList.add('img-gray')
        this.quantity.classList.add('d-none')

    }

    hideLock() {
        this.lockOverlay.classList.add('d-none');
        this.lockText.classList.add('d-none');
        //this.itemImage.classList.add(`${this.isgold?'img-tint-gold': 'img-tint-blue'}`); //kinda looks like piss
        this.itemImage.classList.remove('img-gray')
        this.quantity.classList.remove('d-none')

    }

    updateLock(isLocked) {
        if (isLocked) this.showLock();
        else this.hideLock();
    }
    setItem(item, quantity, altMedia = false) {

        this.quantity.textContent = numberWithCommas(quantity);
        this.itemName.textContent = item.name;
        this.itemImage.src = altMedia ? item.altMedia : item.media;
    }

}

window.customElements.define('locked-icon', LockedIconElement);

class LockedIconsElement extends HTMLElement {

    constructor() {
        super();
        this.icons = [];
        this._content = new DocumentFragment();
    }

    connectedCallback() {
        this.appendChild(this._content);
    }

    /** Remove all icons from DOM and memory */
    removeIcons() {
        this.icons.forEach(icon => icon.remove());
        this.icons = [];
    }

    /** Add a single locked icon */
    addSingleIcon() {
        const icon = createElement('locked-icon', { parent: this });
        this.icons.push(icon);
        return icon;
    }
    unlockIcon(index) { this.icons[index].hideLock() }
    /**
     * Add multiple icons based on an array of items
     * Each item can have: { item, quantity, locked }
     */
    addIcons(size, items, gold, direction = 'ltr') {
        const indices =
            direction === 'rtl'
                ? [...items.keys()].reverse()
                : [...items.keys()];

        indices.forEach((i) => {
            const { item, quantity, locked } = items[i];

            const icon = new LockedIconElement(gold, size);
            this.appendChild(icon); 
            try {
                icon.setItem(item, quantity);
                icon.updateLock(locked);
            } catch (err) {
                console.error('Error setting locked icon:', err, { item, quantity, locked });
            }

            // IMPORTANT PART:
            this.icons[i] = icon; // we do this so it's reversed but not in the indices since I'm too lazy to do some get overwrites
        });
    }

    /** Update a specific icon state by index */
    updateIcon(index, { item, quantity, locked }) {
        const icon = this.icons[index];
        if (!icon) return;
        icon.setItem(item, quantity)
        icon.updateLock(locked);
    }

    updateAllIcons(items) {
        items.forEach((data, i) => this.updateIcon(i, data));
    }
}

window.customElements.define('locked-icons', LockedIconsElement);

class ConvergenceElement extends HTMLElement {
    constructor() {
        super();
        this.represConstellation
        this._content = new DocumentFragment();
        this.phonemode = window.innerWidth <= 968
        const template = this.phonemode ? getTemplateNode('convergence-template-phone') : getTemplateNode('convergence-template')
        this._content.append(template);

        // Normal Convergence
        this.convergenceElem = getElementFromFragment(this._content, 'outer-icon-left', 'img');
        this.convergenceElem.src = ctx.getResourceUrl('assets/others/convergence.webp');
        this.runesLeft = getElementFromFragment(this._content, 'icons-left', 'locked-icons');

        // Gold one group
        this.goldvergenceElem = getElementFromFragment(this._content, 'outer-icon-right', 'img');
        this.goldvergenceElem.src = ctx.getResourceUrl('assets/others/goldvergence.webp');
        this.runesRight = getElementFromFragment(this._content, 'icons-right', 'locked-icons');

        // These are just to make things easier so we don't have to look them up, idk if it even saves anything
        this.rune = game.items.getObjectByID('melvorD:Rune_Essence');
        this.stardust = game.items.getObjectByID('melvorF:Stardust');
        this.gstardust = game.items.getObjectByID('melvorF:Golden_Stardust');
        this.setTooltips(this.convergenceElem, this.goldvergenceElem)


    }

    setTooltips(conv, gold) {
        for (let elem of [conv, gold]) {
            elem.tippyContent = createElement("div");
            const titlecontent = createElement("div", { className: `${elem == gold ? 'text-warning' : 'text-info'} font-size-base text-center font-w700 mb-1` });
            titlecontent.innerText = getRielkLangString(`MENU_TOOLTIP_${elem == gold ? 'GOLDVERGENCE' : 'CONVERGENCE'}`)
            elem.tippyContent.appendChild(titlecontent)
            //elem.tippyContent.appendChild(createElement('div', { className: 'dropdown-divider' }))
            const convExpl = createElement("div", { className: 'text-center text-size-sm mb-1 font-w400' })
            convExpl.innerText = templateRielkLangString('MENU_TOOLTIP_CONVERGENCE_EXPL', { conv: titlecontent.innerText, rune: this.rune.name, dust: elem == gold ? this.gstardust.name : this.stardust.name });
            elem.tippyContent.appendChild(convExpl)
            elem.tippyContent.appendChild(createElement('div', { className: 'dropdown-divider' }))
            const h5 = createElement('h5', { className: ' font-w400 font-size-sm mb-1 text-center' });
            h5.innerText = templateRielkLangString('MENU_TOOLTIP_CONVERGENCE_CHANCE', { conv: titlecontent.innerText })
            // At this point I should just be making a template but I'm too lazy so fuck it
            elem.tippyContent.appendChild(h5)
            elem.tippyCalc = createElement("div", { className: "text-center font-w400 font-size-sm mb-1 construction-success" });
            elem.tippyContent.append(elem.tippyCalc)
            tippy(elem, {
                content: elem.tippyContent,
                placement: 'top',
                allowHTML: true,
                interactive: true,
                animation: false,
                appendTo: document.body,
                popperOptions: {
                    strategy: 'fixed',
                    modifiers: [
                        { name: 'flip', options: { fallbackPlacements: ['top'] } },
                        { name: 'preventOverflow', options: { altAxis: true, tether: false } },
                    ],
                },
            });
        }
        this.updateTooltipchance()
    }
    updateTooltipchance() {
        let runechance = game.astrology.baseRandomItemChances.get(this.rune) + game.modifiers.getValue("melvorD:randomProductChance", game.astrology.getItemModifierQuery(this.rune)); // I don't think there's rune base chance but it's been so long i forgot
        let stardustChance = game.astrology.baseRandomItemChances.get(this.stardust) + game.modifiers.getValue("melvorD:randomProductChance", game.astrology.getItemModifierQuery(this.stardust));
        let gstardustChance = game.astrology.baseRandomItemChances.get(this.gstardust) + game.modifiers.getValue("melvorD:randomProductChance", game.astrology.getItemModifierQuery(this.gstardust));
        this.convergenceElem.tippyCalc.innerText = `${runechance.toFixed(2)}% × ${stardustChance.toFixed(2)}% = ${((runechance * stardustChance) / 100).toFixed(2)}%`
        this.goldvergenceElem.tippyCalc.innerText = `${runechance.toFixed(2)}% × ${gstardustChance.toFixed(2)}% = ${((runechance * gstardustChance) / 100).toFixed(2)}%`

    }

    connectedCallback() {
        this.appendChild(this._content);
    }


    setGroup(groupSide, items) {
        const lockedIcons = groupSide === 'left' ? this.runesLeft : this.runesRight;
        lockedIcons.removeIcons();
        const side = groupSide === 'right' ? 1 : 0
        lockedIcons.addIcons(this.phonemode, items, side, side == 0 ? 'ltr': 'rtl');
    }

    setGroups(data, conste) {
        this.represConstellation = conste;
        let leftData = data.slice(0, 3);
        let rightData = data.slice(3)
        this.setGroup('left', leftData);
        this.setGroup('right', rightData);
    }

    updateGroup(groupSide, items) {
        const icons = groupSide === 'left' ? this.runesLeft : this.runesRight;
        icons.updateAllIcons(items);
    }
    updateGroups(data, conste = None) {
        if (conste)
            this.represConstellation = conste;
        let leftData = data.slice(0, 3);
        let rightData = data.slice(3)
        this.updateGroup('left', leftData);
        this.updateGroup('right', rightData);

    }
    destroyIcons() {
        this.runesLeft.removeIcons();
        this.runesRight.removeIcons();
    }
    unlockIcon(side, index) {
        const icons = side === 'left' ? this.runesLeft : this.runesRight;
        icons.unlockIcon(index)
    }
}


window.customElements.define('convergence-box', ConvergenceElement);
