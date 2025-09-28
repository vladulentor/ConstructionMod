class MasteryPoolBonusesElement extends HTMLElement {
    constructor() {
        super();
        this.bonuses = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('mastery-pool-bonuses-template'));
        this.realmSelect = getElementFromFragment(this._content, 'realm-select', 'realm-tab-select');
        this.bonusContainer = getElementFromFragment(this._content, 'bonus-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setSkill(skill, realm) {
        this.realmSelect.setOptions(skill.getRealmsWithMastery(), (realm) => this.setBonuses(skill, realm), true);
        this.realmSelect.setSelectedRealm(realm);
        this.setBonuses(skill, realm);
    }
    setBonuses(skill, realm) {
        const bonuses = skill.getMasteryPoolBonusesInRealm(realm);
        while (this.bonuses.length < bonuses.length) {
            const newBonus = new MasteryPoolBonusElement();
            newBonus.classList.add('col-12');
            this.bonusContainer.append(newBonus);
            this.bonuses.push(newBonus);
        }
        for (let i = 0; i < bonuses.length; i++) {
            const bonusElem = this.bonuses[i];
            bonusElem.setBonus(bonuses[i], skill);
            showElement(bonusElem);
        }
        for (let i = bonuses.length; i < this.bonuses.length; i++) {
            hideElement(this.bonuses[i]);
        }
    }
}
