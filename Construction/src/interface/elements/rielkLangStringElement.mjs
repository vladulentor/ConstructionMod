const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');

export class RielkLangStringElement extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.updateTranslation();
    }
    updateTranslation() {
        const id = this.getAttribute('lang-id');
        const useHTML = this.hasAttribute('lang-html');
        if (id === null) {
            this.textContent = 'Language ID Undefined';
        } else if (useHTML) {
            this.innerHTML = getRielkLangString(`${id}`);
        } else {
            this.textContent = getRielkLangString(`${id}`);
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        this.updateTranslation();
    }
    static get observedAttributes() {
        return ['lang-id'];
    }
}
window.customElements.define('rielk-lang-string', RielkLangStringElement);
