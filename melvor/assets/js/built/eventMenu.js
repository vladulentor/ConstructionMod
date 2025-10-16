"use strict";
class CombatEventMenuElement extends HTMLElement {
    constructor() {
        super();
        const templatePrefix = 'combat-event-menu-';
        const template = document.getElementById(templatePrefix + 'template');
        if (template === null || !(template instanceof HTMLTemplateElement))
            throw new Error('Template does not exist');
        const templateContent = template.content;
        this._content = new DocumentFragment();
        this._content.append(templateContent.cloneNode(true));
        this._title = this._content.getElementById(templatePrefix + 'title');
        this._startButton = this._content.getElementById(templatePrefix + 'startButton');
        this._passiveButton = this._content.getElementById(templatePrefix + 'passiveButton');
        this._title.removeAttribute('id');
        this._startButton.removeAttribute('id');
        this._passiveButton.removeAttribute('id');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setButtonCallbacks() {
        this._passiveButton.onclick = () => game.combat.showEventPassivesModal();
        this._startButton.onclick = () => game.combat.showStopEventModal();
    }
}
customElements.define('combat-event-menu', CombatEventMenuElement);
//# sourceMappingURL=eventMenu.js.map
checkFileVersion('?12097')