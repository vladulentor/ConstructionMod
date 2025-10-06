
class EfficiencyIconTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('efficiency-icon-tooltip-template'));
        this.effect = getElementFromFragment(this._content, 'cap', 'h5');
        this.chanceContainer = getElementFromFragment(this._content, 'chance-source-container', 'div');
        this.potencyContainer = getElementFromFragment(this._content, 'potency-source-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCostNPotency(cost, potency) {
        this.effect.textContent = `Activating the effect will consume ${cost} times the resources and make ${potency} times the progress.`
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
