"use strict";
class AncientRelic extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        try {
            this._name = data.name;
            this.skill = game.skills.getObjectSafe(data.skillID);
            this.number = data.number;
            this.stats = new StatObject(data, game, `${AncientRelic.name} with id "${this.id}"`);
        } catch (e) {
            throw new DataConstructionError(AncientRelic.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return this.number <= 5 ?
                templateLangString('SKILL_RELIC', {
                    skillName: this.skill.name,
                    number: `${this.number}`
                }) :
                templateLangString('SKILL_MASTER_RELIC', {
                    skillName: this.skill.name
                });
        }
    }
}
class AncientRelicDrop {
    constructor(data, game, where) {
        /** The requirements for the relic to drop, if any */
        this.requirements = [];
        try {
            this.relic = game.ancientRelics.getObjectSafe(data.relicID);
            this.quantity = data.quantity;
            this.chance = data.chance;
            game.queueForSoftDependencyReg(data, this, where);
        } catch (e) {
            throw new DataConstructionError(AncientRelicDrop.name, e);
        }
    }
    registerSoftDependencies(data, game) {
        try {
            this.requirements = game.getRequirementsFromData(data.requirements);
        } catch (e) {
            throw new DataConstructionError(AncientRelicDrop.name, e);
        }
    }
}
class AncientRelicSet {
    constructor(data, game, where) {
        /** Upon reaching these levels in a skill, a random relic drop from this set is unlocked */
        this.levelUpUnlocks = [];
        /** Upon reaching these abyssal levels in a skill, a random relic drop from this set is unlocked */
        this.abyssalLevelUpUnlocks = [];
        /** The relics that have been found in this set */
        this.foundRelics = new Map();
        /** The total number of relics that have been found in this set */
        this.foundCount = 0;
        try {
            this.realm = game.realms.getObjectSafe(data.realmID);
            this.relicDrops = data.relicDrops.map((dropData) => new AncientRelicDrop(dropData, game, where));
            this.completedRelic = game.ancientRelics.getObjectSafe(data.completedRelicID);
            if (data.levelUpUnlocks !== undefined)
                this.levelUpUnlocks = data.levelUpUnlocks;
            if (data.abyssalLevelUpUnlocks !== undefined)
                this.abyssalLevelUpUnlocks = data.abyssalLevelUpUnlocks;
        } catch (e) {
            throw new DataConstructionError(AncientRelicSet.name, e);
        }
    }
    get isComplete() {
        return this.foundRelics.size >= this.relicDrops.length;
    }
    isRelicFound(relic) {
        return this.foundRelics.has(relic);
    }
    getFoundCount(relic) {
        var _a;
        return (_a = this.foundRelics.get(relic)) !== null && _a !== void 0 ? _a : 0;
    }
    addRelic(relic, count = 1) {
        this.foundRelics.set(relic, this.getFoundCount(relic) + count);
        this.foundCount += count;
    }
}
class AncientRelicElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('ancient-relic-template'));
        this.relicContainer = getElementFromFragment(this._content, 'relic-container', 'div');
        this.relicName = getElementFromFragment(this._content, 'relic-name', 'div');
        this.relicModifiers = getElementFromFragment(this._content, 'relic-modifiers', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setRelic(relic) {
        this.relicName.innerText = relic.name;
        this.relicModifiers.innerHTML = relic.stats.describeAsSpanHTML();
    }
    setHidden() {
        this.relicName.innerText = '???';
        this.relicModifiers.innerText = '???';
    }
    setUnlocked() {
        this.relicContainer.classList.replace('bg-trader-locked', 'bg-combat-inner-dark');
    }
    setLocked() {
        this.relicContainer.classList.replace('bg-combat-inner-dark', 'bg-trader-locked');
    }
}
window.customElements.define('ancient-relic', AncientRelicElement);
class AncientRelicsMenuElement extends HTMLElement {
    constructor() {
        super();
        this.relics = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('ancient-relics-menu-template'));
        this.skillDropdownButton = getElementFromFragment(this._content, 'skill-dropdown-button', 'button');
        this.skillDropdownOptions = getElementFromFragment(this._content, 'skill-dropdown-options', 'div');
        this.realmSelect = getElementFromFragment(this._content, 'realm-select', 'realm-tab-select');
        this.relicImage = getElementFromFragment(this._content, 'relic-image', 'img');
        this.levelUnlockNotice = getElementFromFragment(this._content, 'level-unlock-notice', 'h5');
        this.relicsContainer = getElementFromFragment(this._content, 'relics-container', 'ul');
        this.completedRelic = getElementFromFragment(this._content, 'completed-relic', 'ancient-relic');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    init(game) {
        game.ancientRelicsDisplayOrder.forEach((skill) => {
            if (skill.hasAncientRelics)
                this.skillDropdownOptions.append(this.createDropdownItem(skill));
        });
    }
    createDropdownItem(skill) {
        const item = document.createElement('a');
        item.classList.add('dropdown-item', 'pointer-enabled');
        item.append(this.getSkillItem(skill));
        item.append(skill.name);
        item.onclick = () => {
            this.selectSkill(skill);
        };
        return item;
    }
    selectSkill(skill) {
        const realms = [];
        let realmToShow = undefined;
        skill.ancientRelicSets.forEach((set, realm) => {
            if (realmToShow === undefined)
                realmToShow = realm;
            realms.push(realm);
        });
        this.realmSelect.setOptions(realms, (realm) => {
            this.showAncientRelics(skill, skill.ancientRelicSets.get(realm));
        }, true);
        if (skill.ancientRelicSets.has(skill.currentRealm))
            realmToShow = skill.currentRealm;
        if (realmToShow === undefined)
            return;
        this.showAncientRelics(skill, skill.ancientRelicSets.get(realmToShow));
        this.realmSelect.setSelectedRealm(realmToShow);
    }
    showAncientRelicsFromSidebar(game) {
        var _a;
        let skill = game.attack;
        if (((_a = game.openPage) === null || _a === void 0 ? void 0 : _a.skills) !== undefined && game.openPage.skills[0].hasAncientRelics)
            skill = game.openPage.skills[0];
        this.selectSkill(skill);
    }
    showAncientRelics(skill, relicSet) {
        while (this.relics.length < relicSet.relicDrops.length) {
            const relic = createElement('ancient-relic', {
                parent: this.relicsContainer
            });
            this.relics.push(relic);
        }
        let totalCount = 0;
        for (let i = 0; i < relicSet.relicDrops.length; i++) {
            const drop = relicSet.relicDrops[i];
            const relic = this.relics[i];
            const count = relicSet.getFoundCount(drop.relic);
            if (relicSet.isRelicFound(drop.relic)) {
                relic.setRelic(drop.relic);
            } else {
                relic.setHidden();
            }
            showElement(relic);
            totalCount += count;
        }
        for (let i = relicSet.relicDrops.length; i < this.relics.length; i++) {
            hideElement(this.relics[i]);
        }
        this.completedRelic.setRelic(relicSet.completedRelic);
        if (!relicSet.isComplete) {
            this.completedRelic.setLocked();
        } else {
            this.completedRelic.setUnlocked();
        }
        this.levelUnlockNotice.innerText =
            relicSet.realm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ?
            getLangString('ANCIENT_RELICS_NOTICE_1_ABYSSAL') :
            getLangString('ANCIENT_RELICS_NOTICE_1');
        this.relicImage.src = `assets/media/main/relic_progress_${totalCount}.png`;
        this.skillDropdownButton.textContent = '';
        this.skillDropdownButton.append(this.getSkillItem(skill));
        this.skillDropdownButton.append(skill.name);
        $('#modal-ancient-relics').modal('show');
    }
    getSkillItem(skill) {
        const img = document.createElement('img');
        img.classList.add('nav-img');
        img.src = skill.media;
        return img;
    }
}
//# sourceMappingURL=ancientRelics.js.map
checkFileVersion('?12097')