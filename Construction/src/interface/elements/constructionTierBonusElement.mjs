class TierBonusElement extends HTMLElement {

    constructor() {
        super();

        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('tier-mastery-menu'));
    }

    connectedCallback() {
        this.appendChild(this._content);
    }

    setTier(tierData) {
        if (!tierData) return;
        const percentElement = this.querySelector('.font-size-sm');
        const descriptionElement = this.querySelector('p');
        const xpRequiredElement = this.querySelector('small');
        
        if (percentElement) {
            percentElement.textContent = ""; // maybe no percent needed
        }
        
        if (descriptionElement) {
            descriptionElement.textContent = `${tierData.name}: ${tierData.effect}`;
        }
        
        if (xpRequiredElement) {
            if (tierData.completed) {
                xpRequiredElement.textContent = "Unlocked";
                if (percentElement) {
                    percentElement.classList.remove("text-warning");
                }
            } else {
                xpRequiredElement.textContent = "Locked";
                if (percentElement) {
                    percentElement.classList.add("text-warning");
                }
            }
        }
    }
}

// Define the custom element
window.customElements.define("tier-mastery-menu", TierBonusElement);