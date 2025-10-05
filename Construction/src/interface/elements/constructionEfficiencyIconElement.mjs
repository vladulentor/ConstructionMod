const ctx = mod.getContext(import.meta);
const { loadModule } = mod.getContext(import.meta);
const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');


class EfficiencyIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('efficiency-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.src = ctx.getResourceUrl('assets/efficiency.png');
        this.image.alt = "Efficiencty bro!" //getRielkLangString('MENU_TEXT_TOOLTIP_EFFICIENCY');
        this.chance = getElementFromFragment(this._content, 'chance', 'small');
        this.tooltipElem = new PreservationIconTooltipElement();
        console.log(this._content);
    }
    setChance(chance, cap, sourceSpans) {
        this.chance.textContent = formatPercent(Math.round(15));
        this.tooltipElem.setCap(80);
        this.tooltipElem.updateSources([]);
    }
}
window.customElements.define('efficiency-icon', EfficiencyIconElement);
