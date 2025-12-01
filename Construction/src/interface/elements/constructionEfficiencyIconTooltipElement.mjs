const { loadModule } = mod.getContext(import.meta);
const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');


class EfficiencyIconTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('efficiency-icon-tooltip-template'));
        this.toptip = getElementFromFragment(this._content, 'top-tooltip', 'h5');
        this.cost = getElementFromFragment(this._content, 'cap', 'h5');
        this.chanceContainer = getElementFromFragment(this._content, 'chance-source-container', 'div');
        this.potencyContainer = getElementFromFragment(this._content, 'potency-source-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCostNPotency(cost, potency, mode) {
        this.cost.textContent = templateRielkLangString('MENU_TOOLTIP_EFFICIENCY_COST', {cost: cost});
        if (mode === "artisan") this.toptip.textContent = templateRielkLangString('MENU_TEXT_TOOLTIP_EFFICIENCY_ARTISAN', { potency: potency}); 
        else {
            this.toptip.textContent = getRielkLangString(`MENU_TEXT_TOOLTIP_EFFICIENCY_BUILD_${Math.floor(potency)}`);
        }

    }
    updateSources(chancePotencySourceSpans) {
        const chanceSourceSpans = chancePotencySourceSpans.chanceSpans;
        const potencySourceSpans = chancePotencySourceSpans.potencySpans;

        this.chanceContainer.textContent = '';
        this.potencyContainer.textContent = '';

        this.chanceContainer.append(...chanceSourceSpans);
        this.potencyContainer.append(...potencySourceSpans);

    }
}
window.customElements.define('efficiency-icon-tooltip', EfficiencyIconTooltipElement);
