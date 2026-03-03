const { loadModule } = mod.getContext(import.meta);

const { templateRielkLangString } = await loadModule('src/language/translationManager.mjs');

class TierMasteryBonusElement extends HTMLElement {
    constructor() {
        super();
        const romanTiers = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

        // Use the tier mastery template
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('tier-mastery-bonus'));
        // Grab elements from the template
        this.activation = getElementFromFragment(this._content, 'activation', 'div');
        this.tierTitle = getElementFromFragment(this._content, 'tier-title', 'h5');
        this.tierCount = getElementFromFragment(this._content, 'fixture-count', 'h3'); // matches your template
        this.modifierContainer = getElementFromFragment(this._content, 'modifier-container', 'div');
        this.modifierList = getElementFromFragment(this._content, 'modifier-list', 'div');
        this.rewardContainer = getElementFromFragment(this._content, 'reward-container', 'div');
        this.rewardList = getElementFromFragment(this._content, 'reward-list', 'div');
        this.appendChild(this._content); // attach immediately

    }

    connectedCallback() {

        this.appendChild(this._content);
    }

    setBonus(bonus) {
        this.activation.classList.remove('d-none'); // so we don't have to dynamically attach the tier pips, those without a bonus set stay hidden
        this.tierTitle.textContent = templateRielkLangString('MENU_TIER', { tiername: bonus.tier });
        this.tierCount.textContent = `${bonus.currentProgress} \\ ${bonus.maxProgress}`;

        // Style
            if (bonus.completed) {
                this.tierCount.classList.remove('text-danger');
                this.tierCount.classList.add('construction-victory');
            }


            // Modifiers
            this.modifierList.textContent = '';
            if (bonus.modifiers) {
                const spans = bonus.modifiers._stats.describeAsSpans();
                this.modifierList.append(...spans);
                showElement(this.modifierContainer);
            } else {
                hideElement(this.modifierContainer);
            }

            // Rewards
            this.rewardList.textContent = '';
            let hasRewards = false;

            if (bonus.currencies) {
                hasRewards = true;
                bonus.currencies.forEach(({ currency, quantity }, i) => {
                    this.createReward(currency.media, numberWithCommas(quantity), currency.name);
                });
            }

            if (bonus.itemAwards) {
                hasRewards = true;
                bonus.itemAwards.forEach(({ item, quantity }, i) => {
                    this.createReward(item?.media, numberWithCommas(quantity), item?.name);
                });
            }

            if (bonus.pets) {
                hasRewards = true;
                bonus.pets.forEach((pet, i) => {
                    this.createReward(pet.media, '', pet.name);
                });
            }

            if (hasRewards) {
                showElement(this.rewardContainer);
            } else {
                hideElement(this.rewardContainer);
            }

        }


        createReward(media, quantity, name) {
            const rewardElem = createElement('inline-requirement', { className: 'mx-2 text-success', parent: this.rewardList });
            rewardElem.setContent(media, quantity, name);
        }
    }

customElements.define('tier-mastery-bonus', TierMasteryBonusElement);
