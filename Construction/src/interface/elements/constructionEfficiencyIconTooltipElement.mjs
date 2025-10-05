
class EfficiencyIconTooltipElement extends HTMLElement {
    constructor() {
        super();
        console.log("I was here");
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('efficiency-icon-tooltip-template'));
        this.effect = getElementFromFragment(this._content, 'cap', 'h5');
        this.sourceContainer = getElementFromFragment(this._content, 'source-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCap(cap) {
        this.effect.textContent = "Efficiency always takes twice the resources.";
    }
    updateSources(sourceSpans) {
        this.sourceContainer.textContent = '';
        this.sourceContainer.append(...sourceSpans);
    }
}
window.customElements.define('efficiency-icon-tooltip', EfficiencyIconTooltipElement);
