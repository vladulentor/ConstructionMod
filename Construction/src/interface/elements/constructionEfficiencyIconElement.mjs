const ctx = mod.getContext(import.meta);
const { loadModule } = mod.getContext(import.meta);
const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');
await loadModule('src/interface/elements/constructionEfficiencyIconTooltipElement.mjs');

export class EfficiencyIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('efficiency-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.src = ctx.getResourceUrl('assets/efficiency.webp');
        this.image.alt = "Efficiencty Icon" //getRielkLangString('MENU_TEXT_TOOLTIP_EFFICIENCY');

        this.chance = getElementFromFragment(this._content, 'chance', 'small');
        this.tooltipElem = document.createElement('efficiency-icon-tooltip');
        //        this.tooltipElem = new EfficiencyIconTooltipElement();
    }
    connectedCallback() {
                if(mod.manager.getLoadedModList().includes('"The future is now..." Text remover')){
                    getElementFromFragment(this._content, 'future-1', 'small').classList.add('d-none');
                    getElementFromFragment(this._content, 'future-2', 'h5').classList.add('d-none');}
        this.appendChild(this._content);
        if (this.tooltip !== undefined)
            return;
        this.tooltip = tippy(this.container, {
            content: this.tooltipElem,
            placement: 'top',
            allowHTML: true,
            interactive: true,
            animation: false,
            appendTo: document.body,
            maxWidth: 370, //this is the only reason we make our own tippy, it wouldn't fit oetherwise
            popperOptions: {
                strategy: 'fixed',
                modifiers: [
                    {
                        name: 'flip',
                        options: {
                            fallbackPlacements: ['top'],
                        },
                    },
                    {
                        name: 'preventOverflow',
                        options: {
                            altAxis: true,
                            tether: false,
                        },
                    },
                ],
            },
        });
            
    }
    setChance(chance, potency, cost, chancePotencySourceSpans, mode) {
        this.chance.textContent = formatPercent(Math.round(chance));
        this.tooltipElem.setCostNPotency(cost, potency, mode);
        this.tooltipElem.updateSources(chancePotencySourceSpans);
    }
}
window.customElements.define('efficiency-icon', EfficiencyIconElement);
