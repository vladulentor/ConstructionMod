"use strict";
class RuneMenuElement extends HTMLElement {
    constructor() {
        super();
        this.realmContainers = new Map();
        this.runeIcons = new Map();
        this.highlighted = new Set();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('rune-menu-template'));
        this.rowContainer = getElementFromFragment(this._content, 'row-container', 'div');
        this.realmSelect = getElementFromFragment(this._content, 'realm-select', 'realm-tab-select');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    init(game) {
        game.items.runes.forEach((rune) => {
            let container = this.realmContainers.get(rune.realm);
            if (container === undefined) {
                container = createElement('div', {
                    className: 'col-12 justify-horizontal-center flex-wrap icon-size-48 d-none',
                    parent: this.rowContainer,
                });
                this.realmContainers.set(rune.realm, container);
            }
            const icon = createElement('item-current-icon', {
                parent: container
            });
            icon.setItem(rune, 0, game);
            this.runeIcons.set(rune, icon);
        });
        const realms = [...this.realmContainers.keys()];
        this.realmSelect.setOptions(realms, (realm) => this.selectRealm(realm), true);
        this.realmSelect.setSelectedRealm(realms[0]);
        this.selectRealm(realms[0]);
    }
    updateCounts(bank) {
        this.runeIcons.forEach((icon) => {
            icon.updateQuantity(bank);
        });
    }
    updateHighlights(spellSelection, attackSelection, useAltRunes) {
        this.highlighted.forEach((item) => {
            this.removeBorder(item);
        });
        attackSelection.forEach(({
            attack
        }) => {
            var _a;
            (_a = attack.extraRuneConsumption) === null || _a === void 0 ? void 0 : _a.forEach(({
                item
            }) => {
                this.addBorder(item);
            });
        });
        if (spellSelection.attack !== undefined)
            this.addBordersForSpell(spellSelection.attack, useAltRunes);
        if (spellSelection.curse !== undefined)
            this.addBordersForSpell(spellSelection.curse, useAltRunes);
        if (spellSelection.aurora !== undefined)
            this.addBordersForSpell(spellSelection.aurora, useAltRunes);
    }
    updateRealmUnlock(realm) {
        this.realmSelect.updateRealmUnlock(realm);
    }
    selectRealm(realm) {
        const container = this.realmContainers.get(realm);
        if (container === undefined)
            return;
        if (this.visibleContainer === container)
            return;
        if (this.visibleContainer !== undefined)
            hideElement(this.visibleContainer);
        showElement(container);
        this.visibleContainer = container;
    }
    addBordersForSpell(spell, useAltRunes) {
        let runesRequired = spell.runesRequired;
        if (useAltRunes && spell.runesRequiredAlt !== undefined)
            runesRequired = spell.runesRequiredAlt;
        runesRequired.forEach((rune) => {
            this.addBorder(rune.item);
        });
    }
    removeBorder(item) {
        const menu = this.runeIcons.get(item);
        if (menu !== undefined) {
            menu.unHighlight();
            this.highlighted.delete(item);
        }
    }
    addBorder(item) {
        const menu = this.runeIcons.get(item);
        if (menu !== undefined && !this.highlighted.has(item)) {
            menu.highlight();
            this.highlighted.add(item);
        }
    }
}
window.customElements.define('rune-menu', RuneMenuElement);
class LockedSpellTooltipElement extends HTMLElement {
    constructor() {
        super();
        this.requirements = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('locked-spell-tooltip-template'));
        this.levelRequired = getElementFromFragment(this._content, 'level-required', 'span');
        this.abyssalLevelRequired = getElementFromFragment(this._content, 'abyssal-level-required', 'span');
        this.itemRequired = getElementFromFragment(this._content, 'item-required', 'span');
        this.pratsIdea = getElementFromFragment(this._content, 'prats-idea', 'lang-string');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setSpell(spell, game, player, ignoreReqs) {
        if (!ignoreReqs) {
            this.levelRequired.textContent = templateLangString('MENU_TEXT_SKILLNAME_LEVEL', {
                skillName: game.altMagic.name,
                level: `${spell.level}`,
            });
            toggleDangerSuccess(this.levelRequired, game.altMagic.level >= spell.level);
            if (spell.abyssalLevel > 0) {
                this.abyssalLevelRequired.textContent = templateLangString('REQUIRES_ABYSSAL_LEVEL', {
                    skillImage: game.altMagic.name,
                    level: `${spell.abyssalLevel}`,
                });
                toggleDangerSuccess(this.abyssalLevelRequired, game.altMagic.abyssalLevel >= spell.abyssalLevel);
            } else {
                hideElement(this.abyssalLevelRequired);
            }
            this.setRequirements(spell);
        } else {
            hideElement(this.levelRequired);
            hideElement(this.abyssalLevelRequired);
            this.removeRequirements();
        }
        if (spell.requiredItem !== undefined) {
            this.itemRequired.textContent = templateLangString('COMBAT_MISC_REQUIRES_ITEM_TO_BE_EQUIPPED', {
                itemName: spell.requiredItem.name,
            });
            toggleDangerSuccess(this.itemRequired, player.equipment.checkForItem(spell.requiredItem));
            showElement(this.itemRequired);
        } else {
            hideElement(this.itemRequired);
        }
    }
    removeRequirements() {
        this.requirements.forEach((elem) => elem.remove());
        this.requirements = [];
        hideElement(this.pratsIdea);
    }
    setRequirements(spell) {
        this.removeRequirements();
        spell.requirements.forEach((requirement) => {
            switch (requirement.type) {
                case 'DungeonCompletion':
                    {
                        const clearsLeft = requirement.count - game.combat.getDungeonCompleteCount(requirement.dungeon);
                        const templateData = {
                            dungeonName: requirement.dungeon.name,
                            count: `${clearsLeft}`,
                        };
                        if (clearsLeft > 0) {
                            this.addRequirement(false, templateLangString(`COMBAT_MISC_${clearsLeft === 1 ? 'DUNGEON_CLEARED' : 'DUNGEON_CLEARED_TIMES'}`, templateData));
                        }
                    }
                    break;
                case 'StrongholdCompletion':
                    {
                        const clearsLeft = requirement.count - requirement.stronghold.timesCompleted;
                        const templateData = {
                            dungeonName: requirement.stronghold.name,
                            count: `${clearsLeft}`,
                        };
                        if (clearsLeft > 0) {
                            this.addRequirement(false, templateLangString(`COMBAT_MISC_${clearsLeft === 1 ? 'DUNGEON_CLEARED' : 'DUNGEON_CLEARED_TIMES'}`, templateData));
                        }
                    }
                    break;
                case 'AbyssDepthCompletion':
                    {
                        const clearsLeft = requirement.count - requirement.depth.timesCompleted;
                        const templateData = {
                            depthName: requirement.depth.name,
                            count: `${clearsLeft}`,
                        };
                        if (clearsLeft > 0) {
                            this.addRequirement(false, templateLangString(`COMBAT_MISC_${clearsLeft === 1 ? 'THE_ABYSS_CLEARED' : 'THE_ABYSS_CLEARED_TIMES'}`, templateData));
                        }
                    }
                    break;
                case 'MonsterKilled':
                    {
                        const killsLeft = requirement.count - game.stats.Monsters.get(requirement.monster, MonsterStats.KilledByPlayer);
                        const templateData = {
                            monsterName: requirement.monster.name,
                            monsterImage: '',
                            count: `${killsLeft}`,
                        };
                        if (killsLeft > 0) {
                            this.addRequirement(false, templateLangString(`COMBAT_MISC_${killsLeft === 1 ? 'DEFEAT_MONSTER_ONCE' : 'DEFEAT_MONSTER_TIMES'}`, templateData));
                        }
                    }
                    break;
                case 'AbyssalLevel':
                    {
                        this.addRequirement(requirement.isMet(), templateLangString('REQUIRES_ABYSSAL_LEVEL', {
                            skillImage: '',
                            level: `${requirement.level}`
                        }));
                        break;
                    }
                case 'SkillTreeNodeUnlocked':
                    this.addRequirement(requirement.isMet(), templateLangString('REQUIRES_SKILL_TREE_NODE_UNLOCKED', {
                        skillTree: `${requirement.skillTree.name}`,
                        node: `${requirement.node.shortName}`,
                        skillName: `${requirement.skill.name}`,
                    }));
                    break;
                case 'ItemFound':
                    this.addRequirement(requirement.isMet(), templateLangString('MENU_TEXT_FIND_ITEM', {
                        itemName: `${requirement.item.name}`,
                        itemImage: ``,
                    }));
                    break;
                default:
                    // TODO_C Add the rest of the requirements
            }
        });
        if (spell.requirements.length > 0 && !spell.isModded) {
            showElement(this.pratsIdea);
        }
    }
    addRequirement(met, text) {
        const req = createElement('span', {
            className: met ? 'text-success' : 'text-danger',
            text
        });
        this.pratsIdea.before(req);
        this.requirements.push(req);
    }
}
window.customElements.define('locked-spell-tooltip', LockedSpellTooltipElement);
class SpellTooltipRunesElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('spell-tooltip-runes-template'));
        this.runeCosts = getElementFromFragment(this._content, 'rune-costs', 'div');
        this.orText = getElementFromFragment(this._content, 'or-text', 'lang-string');
        this.altRuneText = getElementFromFragment(this._content, 'alt-rune-text', 'lang-string');
        this.altRuneCosts = getElementFromFragment(this._content, 'alt-rune-costs', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setSpell(spell) {
        this.setRuneCosts(this.runeCosts, spell.runesRequired);
        if (spell.runesRequiredAlt !== undefined) {
            this.setRuneCosts(this.altRuneCosts, spell.runesRequiredAlt);
            showElement(this.orText);
            showElement(this.altRuneText);
            showElement(this.altRuneCosts);
        } else {
            hideElement(this.orText);
            hideElement(this.altRuneText);
            hideElement(this.altRuneCosts);
        }
    }
    setRuneCosts(container, runes) {
        container.textContent = '';
        runes.forEach(({
            item,
            quantity
        }) => {
            const span = createElement('span', {
                parent: container
            });
            span.append(`${quantity}`, createElement('img', {
                className: 'skill-icon-sm',
                attributes: [
                    ['src', item.media]
                ]
            }));
        });
    }
}
window.customElements.define('spell-tooltip-runes', SpellTooltipRunesElement);
class AttackSpellTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('attack-spell-tooltip-template'));
        this.spellName = getElementFromFragment(this._content, 'spell-name', 'span');
        this.combatEffects = getElementFromFragment(this._content, 'combat-effects', 'span');
        this.spellDamage = getElementFromFragment(this._content, 'spell-damage', 'span');
        this.specialAttack = getElementFromFragment(this._content, 'special-attack', 'span');
        this.runeCosts = getElementFromFragment(this._content, 'rune-costs', 'spell-tooltip-runes');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setSpell(spell) {
        this.spellName.textContent = spell.name;
        this.spellDamage.textContent = templateLangString('COMBAT_MISC_SPELL_DAMAGE', {
            damage: `${Math.round(numberMultiplier * spell.maxHit)}`,
        });
        if (spell.combatEffects !== undefined) {
            spell.combatEffects.forEach((applicator) => {
                const desc = applicator.getDescription();
                if (desc !== undefined) {
                    const span = spanDescriptionFormatter(desc);
                    this.combatEffects.append(span);
                }
            });
        }
        if (spell.specialAttack !== undefined) {
            this.specialAttack.innerHTML = spell.specialAttack.modifiedDescription;
            showElement(this.specialAttack);
        } else {
            hideElement(this.specialAttack);
        }
        window.customElements.upgrade(this.runeCosts);
        this.runeCosts.setSpell(spell);
    }
}
window.customElements.define('attack-spell-tooltip', AttackSpellTooltipElement);
class CurseSpellTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('curse-spell-tooltip-template'));
        this.spellName = getElementFromFragment(this._content, 'spell-name', 'span');
        this.enemyModifiers = getElementFromFragment(this._content, 'enemy-modifiers', 'span');
        this.enemyTurns = getElementFromFragment(this._content, 'enemy-turns', 'span');
        this.runeCosts = getElementFromFragment(this._content, 'rune-costs', 'spell-tooltip-runes');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setSpell(spell) {
        this.spellName.textContent = spell.name;
        this.enemyModifiers.innerHTML = StatObject.formatDescriptions(spell.effect.statGroups.debuff, plainDescriptionFormatter).join('<br>');
        this.enemyTurns.textContent = templateLangString('COMBAT_MISC_LASTS_ENEMY_TURNS', {
            count: `${3}`
        });
        window.customElements.upgrade(this.runeCosts);
        this.runeCosts.setSpell(spell);
    }
}
window.customElements.define('curse-spell-tooltip', CurseSpellTooltipElement);
class AuroraSpellTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('aurora-spell-tooltip-template'));
        this.spellName = getElementFromFragment(this._content, 'spell-name', 'span');
        this.description = getElementFromFragment(this._content, 'description', 'span');
        this.runeCosts = getElementFromFragment(this._content, 'rune-costs', 'spell-tooltip-runes');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setSpell(spell) {
        this.spellName.textContent = spell.name;
        this.description.innerHTML = spell.description;
        window.customElements.upgrade(this.runeCosts);
        this.runeCosts.setSpell(spell);
    }
}
window.customElements.define('aurora-spell-tooltip', AuroraSpellTooltipElement);
class SpellButtonElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('spell-button-template'));
        this.link = getElementFromFragment(this._content, 'link', 'a');
        this.spellImage = getElementFromFragment(this._content, 'spell-image', 'img');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.tooltip = tippy(this.link, {
            content: '',
            placement: 'bottom',
            allowHTML: true,
            interactive: false,
            animation: false,
        });
    }
    disconnectedCallback() {
        if (this.tooltip !== undefined) {
            this.tooltip.destroy();
            this.tooltip = undefined;
        }
    }
    setAttackSpell(spell) {
        var _a;
        this.spellImage.src = spell.media;
        const tooltip = createElement('attack-spell-tooltip');
        tooltip.setSpell(spell);
        (_a = this.tooltip) === null || _a === void 0 ? void 0 : _a.setContent(tooltip);
    }
    setCurseSpell(spell) {
        var _a;
        this.spellImage.src = spell.media;
        const tooltip = createElement('curse-spell-tooltip');
        tooltip.setSpell(spell);
        (_a = this.tooltip) === null || _a === void 0 ? void 0 : _a.setContent(tooltip);
    }
    setAuroraSpell(spell) {
        var _a;
        this.spellImage.src = spell.media;
        const tooltip = createElement('aurora-spell-tooltip');
        tooltip.setSpell(spell);
        (_a = this.tooltip) === null || _a === void 0 ? void 0 : _a.setContent(tooltip);
    }
    setLockedSpell(spell, game, player, ignoreReqs) {
        var _a;
        this.spellImage.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        const tooltip = createElement('locked-spell-tooltip');
        tooltip.setSpell(spell, game, player, ignoreReqs);
        (_a = this.tooltip) === null || _a === void 0 ? void 0 : _a.setContent(tooltip);
    }
    setCallback(callback) {
        this.link.onclick = callback;
        this.link.classList.add('pointer-enabled');
    }
    removeCallback() {
        this.link.onclick = null;
        this.link.classList.remove('pointer-enabled');
    }
    highlight() {
        this.link.classList.add(...SpellButtonElement.borderClasses);
    }
    unhighlight() {
        this.link.classList.remove(...SpellButtonElement.borderClasses);
    }
}
SpellButtonElement.borderClasses = ['border-success', 'border-2x', 'spell-selected'];
window.customElements.define('spell-button', SpellButtonElement);
class SpellMenuElement extends HTMLElement {
    constructor() {
        super(...arguments);
        this.spells = [];
        this.spellMap = new Map();
    }
    updateForUnlock(game, player, ignoreReqs) {
        this.spellMap.forEach((spellElem, spell) => {
            const isUnlocked = player.canUseCombatSpell(spell, ignoreReqs);
            if (isUnlocked) {
                this.setSpellButton(spell, spellElem);
                spellElem.setCallback(this.getToggleCallback(spell, player));
            } else {
                spellElem.setLockedSpell(spell, game, player, ignoreReqs);
                spellElem.removeCallback();
            }
        });
    }
    setMenuCallbacks(player) {
        this.spellMap.forEach((spellElem, spell) => {
            spellElem.setCallback(this.getToggleCallback(spell, player));
        });
    }
    setSpells(spells) {
        while (this.spells.length < spells.length) {
            const spellElem = createElement('spell-button', {
                className: 'col-4 col-md-3'
            });
            this.appendSpellMenu(spellElem);
            this.spells.push(spellElem);
        }
        this.spellMap.clear();
        spells.forEach((spell, i) => {
            const spellElem = this.spells[i];
            this.setSpellButton(spell, spellElem);
            this.spellMap.set(spell, spellElem);
            showElement(spellElem);
        });
        for (let i = spells.length; i < this.spells.length; i++) {
            hideElement(this.spells[i]);
        }
    }
    appendSpellMenu(spellElem) {
        this.spellContainer.append(spellElem);
    }
    highlightSpell(spell) {
        if (this.highlightedSpell !== undefined)
            this.highlightedSpell.unhighlight();
        if (spell === undefined) {
            this.highlightedSpell = undefined;
        } else {
            const spellElem = this.spellMap.get(spell);
            if (spellElem !== undefined)
                spellElem.highlight();
            this.highlightedSpell = spellElem;
        }
    }
}
class AttackSpellMenuElement extends SpellMenuElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('attack-spell-menu-template'));
        this.spellContainer = getElementFromFragment(this._content, 'spell-container', 'div');
        this.bookName = getElementFromFragment(this._content, 'book-name', 'span');
        this.curseAuroraInfo = getElementFromFragment(this._content, 'curse-aurora-info', 'span');
        this.noDamageModifiersContainer = getElementFromFragment(this._content, 'no-damage-modifiers-container', 'div');
        this.noDamageModifiersMessage = getElementFromFragment(this._content, 'no-damage-modifiers-message', 'span');
        this.noSpecialAttacksContainer = getElementFromFragment(this._content, 'no-special-attacks-container', 'div');
        this.noSpecialAttacksMessage = getElementFromFragment(this._content, 'no-special-attacks-message', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setBook(book) {
        this.bookName.textContent = book.name;
        if (book.allowCurses) {
            if (book.allowAuroras) {
                this.curseAuroraInfo.textContent = getLangString('CAN_BE_USED_WITH_CURSES_AURORAS');
            } else {
                this.curseAuroraInfo.textContent = getLangString('CAN_BE_USED_WITH_CURSES_NO_AURORAS');
            }
        } else {
            if (book.allowAuroras) {
                this.curseAuroraInfo.textContent = getLangString('CAN_BE_USED_WITH_AURORAS_NO_CURSES');
            } else {
                this.curseAuroraInfo.textContent = getLangString('CANNOT_BE_USED_WITH_CURSES_AURORAS');
            }
        }
        if (!book.allowDamageModifiers) {
            this.noDamageModifiersMessage.textContent = templateLangString('NO_DAMAGE_MODIFIER_SPELLBOOK', {
                spellbookName: book.name,
            });
            showElement(this.noDamageModifiersContainer);
        } else {
            hideElement(this.noDamageModifiersContainer);
        }
        if (!book.allowSpecialAttacks) {
            this.noSpecialAttacksMessage.textContent = templateLangString('NO_SPECIAL_ATTACKS_SPELLBOOK', {
                spellbookName: book.name,
            });
            showElement(this.noSpecialAttacksContainer);
        } else {
            hideElement(this.noSpecialAttacksContainer);
        }
        this.setSpells(book.spells);
    }
    appendSpellMenu(spellElem) {
        this.noDamageModifiersContainer.before(spellElem);
    }
    getToggleCallback(spell, player) {
        return () => player.selectAttackSpell(spell);
    }
    setSpellButton(spell, spellElem) {
        spellElem.setAttackSpell(spell);
    }
}
window.customElements.define('attack-spell-menu', AttackSpellMenuElement);
class CurseSpellMenuElement extends SpellMenuElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('curse-spell-menu-template'));
        this.spellContainer = getElementFromFragment(this._content, 'spell-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    init(game) {
        this.setSpells(game.curseSpells.allObjects.sort((a, b) => a.level - b.level));
    }
    getToggleCallback(spell, player) {
        return () => player.toggleCurse(spell);
    }
    setSpellButton(spell, spellElem) {
        spellElem.setCurseSpell(spell);
    }
}
window.customElements.define('curse-spell-menu', CurseSpellMenuElement);
class AuroraSpellMenuElement extends SpellMenuElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('aurora-spell-menu-template'));
        this.spellContainer = getElementFromFragment(this._content, 'spell-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    init(game) {
        this.setSpells(game.auroraSpells.allObjects.sort((a, b) => a.level - b.level));
    }
    getToggleCallback(spell, player) {
        return () => player.toggleAurora(spell);
    }
    setSpellButton(spell, spellElem) {
        spellElem.setAuroraSpell(spell);
    }
}
window.customElements.define('aurora-spell-menu', AuroraSpellMenuElement);
class SpellbookMenuElement extends HTMLElement {
    constructor() {
        super();
        this.tooltips = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('spellbook-menu-template'));
        this.weaponNotice = getElementFromFragment(this._content, 'weapon-notice', 'small');
        this.attackButtonGroup = getElementFromFragment(this._content, 'attack-button-group', 'div');
        this.curseButton = getElementFromFragment(this._content, 'curse-button', 'button');
        this.auroraButton = getElementFromFragment(this._content, 'aurora-button', 'button');
        this.attackSpellMenu = getElementFromFragment(this._content, 'attack-spell-menu', 'attack-spell-menu');
        this.curseSpellMenu = getElementFromFragment(this._content, 'curse-spell-menu', 'curse-spell-menu');
        this.auroraSpellMenu = getElementFromFragment(this._content, 'aurora-spell-menu', 'aurora-spell-menu');
        this.combatRunesOption = getElementFromFragment(this._content, 'combat-runes-option', 'div');
        this.selectedMenu = this.attackSpellMenu;
        this.selectedButton = this.curseButton;
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    disconnectedCallback() {
        this.tooltips.forEach((tt) => tt.destroy());
        this.tooltips = [];
    }
    init(game) {
        let firstBook = true;
        game.attackSpellbooks.forEach((book) => {
            const button = createElement('button', {
                parent: this.attackButtonGroup,
                className: 'btn btn-sm btn-outline-secondary',
            });
            createElement('img', {
                parent: button,
                className: 'skill-icon-xs',
                attributes: [
                    ['src', book.media]
                ]
            });
            button.onclick = () => this.selectAttack(game, book, button);
            this.addTooltip(button, book.name);
            if (firstBook) {
                this.changeSelectedButton(button);
                this.attackSpellMenu.setBook(book);
                this.selectedAttackBook = book;
                firstBook = false;
            }
        });
        this.curseSpellMenu.init(game);
        this.auroraSpellMenu.init(game);
        this.curseButton.onclick = () => this.selectCurse(game);
        this.addTooltip(this.curseButton, getLangString('COMBAT_MISC_CURSE_SPELLBOOK_NAME'));
        this.auroraButton.onclick = () => this.selectAurora(game);
        this.addTooltip(this.auroraButton, getLangString('COMBAT_MISC_AURORA_SPELLBOOK_NAME'));
    }
    updateRequirements(game, player, ignoreReqs) {
        if (player.attackType === 'magic') {
            hideElement(this.weaponNotice);
        } else {
            showElement(this.weaponNotice);
        }
        this.selectedMenu.updateForUnlock(game, player, ignoreReqs);
    }
    selectAttack(game, book, button) {
        if (this.selectedMenu === this.attackSpellMenu && this.selectedAttackBook === book)
            return;
        if (this.selectedAttackBook !== book) {
            this.attackSpellMenu.setBook(book);
            this.attackSpellMenu.highlightSpell((game.isGolbinRaid ? game.golbinRaid : game.combat).player.spellSelection.attack);
            this.selectedAttackBook = book;
        }
        this.changeSelectedButton(button);
        if (this.selectedMenu !== this.attackSpellMenu) {
            this.changeSelectedMenu(this.attackSpellMenu);
        }
        this.onBookChange(game);
    }
    selectCurse(game) {
        if (this.selectedMenu === this.curseSpellMenu)
            return;
        this.changeSelectedButton(this.curseButton);
        this.changeSelectedMenu(this.curseSpellMenu);
        this.onBookChange(game);
    }
    selectAurora(game) {
        if (this.selectedMenu === this.auroraSpellMenu)
            return;
        this.changeSelectedButton(this.auroraButton);
        this.changeSelectedMenu(this.auroraSpellMenu);
        this.onBookChange(game);
    }
    changeSelectedButton(button) {
        this.selectedButton.classList.replace('btn-outline-success', 'btn-outline-secondary');
        button.classList.replace('btn-outline-secondary', 'btn-outline-success');
        this.selectedButton = button;
    }
    changeSelectedMenu(menu) {
        hideElement(this.selectedMenu);
        showElement(menu);
        this.selectedMenu = menu;
    }
    onBookChange(game) {
        if (game.isGolbinRaid) {
            this.updateRequirements(game, game.golbinRaid.player, true);
        } else {
            this.updateRequirements(game, game.combat.player, false);
        }
    }
    addTooltip(button, bookName) {
        this.tooltips.push(tippy(button, {
            content: bookName,
            placement: 'bottom',
            interactive: false,
            animation: false,
        }));
    }
}
window.customElements.define('spellbook-menu', SpellbookMenuElement);
//# sourceMappingURL=magic.js.map
checkFileVersion('?12097')