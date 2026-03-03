const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');
await loadModule('src/interface/elements/constructionEfficiencyIconTooltipElement.mjs');
const {EfficiencyIconElement} = await loadModule('src/interface/elements/constructionEfficiencyIconElement.mjs');

class ConstructionArtisanMenuElement extends ArtisanMenuElement {
    constructor() {
        super();
        this.productEfficiency = new EfficiencyIconElement();
        this.productEfficiency
    }

    connectedCallback() {
        super.connectedCallback();
        ['mastery-xp-icon', 'mastery-pool-icon', '.col-12.block.block-rounded-double.bg-combat-inner-dark', 'doubling-icon']
            .forEach(selector => {
                const el = this.querySelector(selector);
                if (el) el.style.display = 'none';
            });
        this.productPreservation.parentNode.insertBefore(
            this.productEfficiency,
            this.productPreservation.nextSibling
        );
    }

    updateChances(preserveChance, preserveCap, preserveSources, doublingChance, doublingSources, efficiencyChance, efficiencyPotency, efficiencyCost, efficiencChancePotencySources) {
        this.productPreservation.setChance(preserveChance, preserveCap, preserveSources);
        this.productDoubling.setChance(doublingChance, doublingSources);
        this.productEfficiency.setChance(
            efficiencyChance,
            efficiencyPotency,
            efficiencyCost,
            efficiencChancePotencySources, "artisan"); //By accessing it right here we don't have to override any existing render functions.
    }
}




customElements.define('cons-artisan-menu', ConstructionArtisanMenuElement);