"use strict";
class CombatPassiveSpanElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('combat-passive-span-template'));
        this.name = getElementFromFragment(this._content, 'name', 'strong');
        this.description = getElementFromFragment(this._content, 'description', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setPassive(passive) {
        this.name.textContent = passive.name;
        this.description.innerHTML = passive.modifiedDescription;
    }
}
window.customElements.define('combat-passive-span', CombatPassiveSpanElement);
class EnemyPassivesElement extends HTMLElement {
    constructor() {
        super();
        this.passiveSpans = [];
        this.passiveDividers = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('enemy-passives-template'));
        this.descriptionContainer = getElementFromFragment(this._content, 'description-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setPassives(passives) {
        let i = 0;
        passives.forEach((active, passive) => {
            if (!active.display)
                return;
            if (this.passiveSpans.length <= i) {
                this.passiveSpans.push(createElement('combat-passive-span', {
                    parent: this.descriptionContainer
                }));
                this.passiveDividers.push(createElement('div', {
                    className: 'dropdown-divider',
                    parent: this.descriptionContainer
                }));
            }
            const passiveSpan = this.passiveSpans[i];
            passiveSpan.setPassive(passive);
            showElement(passiveSpan);
            showElement(this.passiveDividers[i]);
            i++;
        });
        if (i > 0)
            hideElement(this.passiveDividers[i - 1]);
        for (let j = i; j < this.passiveSpans.length; j++) {
            hideElement(this.passiveSpans[j]);
            hideElement(this.passiveDividers[j]);
        }
        return i > 0;
    }
}
window.customElements.define('enemy-passives', EnemyPassivesElement);
class SpecialAttackSpanElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('special-attack-span-template'));
        this.name = getElementFromFragment(this._content, 'name', 'strong');
        this.chance = getElementFromFragment(this._content, 'chance', 'span');
        this.description = getElementFromFragment(this._content, 'description', 'span');
        const maxHit = getElementFromFragment(this._content, 'max-hit', 'span');
        this.maxHit = createElement('span', {
            className: 'font-w600'
        });
        maxHit.append(...templateLangStringWithNodes('MENU_TEXT_MAX_HIT', {
            value: this.maxHit
        }, {}, false));
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setAttack(selection, character) {
        this.name.textContent = selection.attack.name;
        this.chance.textContent = formatPercent(selection.chance);
        this.description.innerHTML = selection.attack.modifiedDescription;
        this.updateMaxHit(selection, character);
    }
    updateMaxHit(selection, character) {
        this.maxHit.textContent = `(${character.getAttackMaxDamage(selection.attack)})`;
    }
}
window.customElements.define('special-attack-span', SpecialAttackSpanElement);
class EnemySpecialAttacksElement extends HTMLElement {
    constructor() {
        super();
        this.attackSpans = [];
        this.attackDividers = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('enemy-special-attacks-template'));
        this.descriptionContainer = getElementFromFragment(this._content, 'description-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setAttacks(attacks, character) {
        while (this.attackSpans.length < attacks.length) {
            this.attackSpans.push(createElement('special-attack-span', {
                parent: this.descriptionContainer
            }));
            this.attackDividers.push(createElement('div', {
                className: 'dropdown-divider',
                parent: this.descriptionContainer
            }));
        }
        attacks.forEach((selection, i) => {
            const attackSpan = this.attackSpans[i];
            attackSpan.setAttack(selection, character);
            showElement(attackSpan);
            showElement(this.attackDividers[i]);
        });
        if (attacks.length > 0)
            hideElement(this.attackDividers[attacks.length - 1]);
        for (let i = attacks.length; i < this.attackSpans.length; i++) {
            hideElement(this.attackSpans[i]);
            hideElement(this.attackDividers[i]);
        }
    }
    updateMaxHits(attacks, character) {
        attacks.forEach((selection, i) => {
            this.attackSpans[i].updateMaxHit(selection, character);
        });
    }
    static shouldHideAttacks(attacks) {
        return attacks.length === 1 && attacks[0].attack === game.normalAttack;
    }
}
window.customElements.define('enemy-special-attacks', EnemySpecialAttacksElement);
class EvasionTableElement extends HTMLElement {
    constructor() {
        super();
        this.tooltips = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('evasion-table-template'));
        this.meleeIcon = getElementFromFragment(this._content, 'melee-icon', 'img');
        this.meleeEvasion = getElementFromFragment(this._content, 'melee-evasion', 'span');
        this.rangedIcon = getElementFromFragment(this._content, 'ranged-icon', 'img');
        this.rangedEvasion = getElementFromFragment(this._content, 'ranged-evasion', 'span');
        this.magicIcon = getElementFromFragment(this._content, 'magic-icon', 'img');
        this.magicEvasion = getElementFromFragment(this._content, 'magic-evasion', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.addTooltip(this.meleeIcon, getLangString('COMBAT_MISC_MELEE'));
        this.addTooltip(this.rangedIcon, getLangString('SKILL_NAME_Ranged'));
        this.addTooltip(this.magicIcon, getLangString('SKILL_NAME_Magic'));
    }
    disconnectedCallback() {
        this.tooltips.forEach((tt) => tt.destroy());
        this.tooltips = [];
    }
    setStats(character) {
        this.meleeEvasion.textContent = formatNumber(character.stats.evasion.melee);
        this.rangedEvasion.textContent = formatNumber(character.stats.evasion.ranged);
        this.magicEvasion.textContent = formatNumber(character.stats.evasion.magic);
    }
    setEmpty() {
        this.meleeEvasion.textContent = '-';
        this.rangedEvasion.textContent = '-';
        this.magicEvasion.textContent = '-';
    }
    addTooltip(image, text) {
        this.tooltips.push(tippy(image, {
            content: text,
            placement: 'bottom',
            interactive: false,
            animation: false,
        }));
    }
}
window.customElements.define('evasion-table', EvasionTableElement);
class ResistanceSpanElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('resistance-span-template'));
        this.icon = getElementFromFragment(this._content, 'icon', 'img');
        this.name = getElementFromFragment(this._content, 'name', 'span');
        this.value = getElementFromFragment(this._content, 'value', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setResistance(damageType) {
        this.icon.src = damageType.media;
        this.name.textContent = damageType.resistanceName;
    }
    setValue(value) {
        this.value.textContent = formatPercent(value);
    }
}
window.customElements.define('resistance-span', ResistanceSpanElement);
class ResistanceTableElement extends HTMLElement {
    constructor() {
        super();
        this.resistanceSpans = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('resistance-table-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    init(game) {
        game.damageTypes.forEach((damageType) => {
            const span = createElement('resistance-span', {
                parent: this.container
            });
            span.setResistance(damageType);
            this.resistanceSpans.set(damageType, span);
        });
    }
    setStats(character) {
        this.removeHighlight();
        this.resistanceSpans.forEach((span, damageType) => {
            if (damageType.onlyShowIfUsing && !character.manager.isDamageTypeInUse(damageType)) {
                hideElement(span);
            } else {
                span.setValue(character.stats.getResistance(damageType));
                showElement(span);
            }
            if (character.manager.fightInProgress && damageType === character.target.damageType)
                this.setHighlight(span);
        });
    }
    setEmpty(character) {
        this.removeHighlight();
        this.resistanceSpans.forEach((span, damageType) => {
            if (damageType.onlyShowIfUsing && !character.manager.isDamageTypeInUse(damageType)) {
                hideElement(span);
            } else {
                span.setValue(0);
                showElement(span);
            }
        });
    }
    setHighlight(span) {
        this.removeHighlight();
        span.classList.add('text-success');
        this.highlighted = span;
    }
    removeHighlight() {
        if (this.highlighted !== undefined)
            this.highlighted.classList.remove('text-success');
        this.highlighted = undefined;
    }
}
window.customElements.define('resistance-table', ResistanceTableElement);
class DefensiveStatsElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('defensive-stats-template'));
        this.evasion = getElementFromFragment(this._content, 'evasion', 'evasion-table');
        this.resistance = getElementFromFragment(this._content, 'resistance', 'resistance-table');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    init(game) {
        this.resistance.init(game);
    }
    setStats(character) {
        this.evasion.setStats(character);
        this.resistance.setStats(character);
    }
    setEmpty(character) {
        this.evasion.setEmpty();
        this.resistance.setEmpty(character);
    }
}
window.customElements.define('defensive-stats', DefensiveStatsElement);
class OffensiveStatsElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('offensive-stats-template'));
        this.damageTypeIcon = getElementFromFragment(this._content, 'damage-type-icon', 'img');
        this.damageTypeName = getElementFromFragment(this._content, 'damage-type-name', 'span');
        this.attackTypeIcon = getElementFromFragment(this._content, 'attack-type-icon', 'img');
        this.attackIntervalContainer = getElementFromFragment(this._content, 'attack-interval-container', 'div');
        this.attackInterval = getElementFromFragment(this._content, 'attack-interval', 'span');
        this.minHit = getElementFromFragment(this._content, 'min-hit', 'span');
        this.maxHit = getElementFromFragment(this._content, 'max-hit', 'span');
        this.hitChance = getElementFromFragment(this._content, 'hit-chance', 'span');
        this.accuracyRating = getElementFromFragment(this._content, 'accuracy-rating', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setStats(character) {
        this.damageTypeIcon.src = character.damageType.media;
        this.damageTypeName.textContent = character.damageType.name;
        this.damageTypeName.className = character.damageType.spanClass;
        this.attackTypeIcon.src = OffensiveStatsElement.getAttackTypeMedia(character.attackType);
        this.attackInterval.textContent = templateLangString('MENU_TEXT_SECONDS_SHORT', {
            seconds: formatFixed(character.stats.attackInterval / 1000, 2),
        });
        this.accuracyRating.textContent = formatNumber(character.stats.accuracy);
    }
    setHitChance(character) {
        this.hitChance.textContent = formatPercent(Math.round(character.stats.hitChance));
    }
    unsetHitChance() {
        this.hitChance.textContent = '-';
    }
    setNormalDamage(minHit, maxHit) {
        this.minHit.textContent = minHit;
        this.maxHit.textContent = maxHit;
    }
    setEmpty() {
        this.damageTypeIcon.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        this.damageTypeName.textContent = '-';
        this.damageTypeName.className = '';
        this.attackTypeIcon.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        this.attackInterval.textContent = '-';
        this.minHit.textContent = '-';
        this.maxHit.textContent = '-';
        this.accuracyRating.textContent = '-';
    }
    showAttackInterval() {
        showElement(this.attackIntervalContainer);
    }
    hideAttackInterval() {
        hideElement(this.attackIntervalContainer);
    }
    static getAttackTypeMedia(attackType) {
        let media;
        switch (attackType) {
            case 'melee':
                media = "assets/media/skills/attack/attack.png" /* Assets.Attack */ ;
                break;
            case 'ranged':
                media = "assets/media/skills/ranged/ranged.png" /* Assets.Ranged */ ;
                break;
            case 'magic':
                media = "assets/media/skills/magic/magic.png" /* Assets.Magic */ ;
                break;
        }
        return assets.getURI(media);
    }
}
window.customElements.define('offensive-stats', OffensiveStatsElement);
class CombatLevelsElement extends HTMLElement {
    constructor() {
        super();
        this.tooltips = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('combat-levels-template'));
        this.hitpointsContainer = getElementFromFragment(this._content, 'hitpoints-container', 'div');
        this.hitpointsIcon = getElementFromFragment(this._content, 'hitpoints-icon', 'img');
        this.maxHitpoints = getElementFromFragment(this._content, 'max-hitpoints', 'small');
        this.combatIcon = getElementFromFragment(this._content, 'combat-icon', 'img');
        this.combatLevel = getElementFromFragment(this._content, 'combat-level', 'small');
        this.attackIcon = getElementFromFragment(this._content, 'attack-icon', 'img');
        this.attackLevel = getElementFromFragment(this._content, 'attack-level', 'small');
        this.strengthIcon = getElementFromFragment(this._content, 'strength-icon', 'img');
        this.strengthLevel = getElementFromFragment(this._content, 'strength-level', 'small');
        this.defenceIcon = getElementFromFragment(this._content, 'defence-icon', 'img');
        this.defenceLevel = getElementFromFragment(this._content, 'defence-level', 'small');
        this.rangedIcon = getElementFromFragment(this._content, 'ranged-icon', 'img');
        this.rangedLevel = getElementFromFragment(this._content, 'ranged-level', 'small');
        this.magicIcon = getElementFromFragment(this._content, 'magic-icon', 'img');
        this.magicLevel = getElementFromFragment(this._content, 'magic-level', 'small');
        this.corruptionContainer = getElementFromFragment(this._content, 'corruption-container', 'div');
        this.corruptionIcon = getElementFromFragment(this._content, 'corruption-icon', 'img');
        this.corruptionLevel = getElementFromFragment(this._content, 'corruption-level', 'small');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.addTooltip(this.hitpointsIcon, getLangString('MAX_HITPOINTS'));
        this.addTooltip(this.combatIcon, getLangString('COMBAT_LEVEL'));
        this.addTooltip(this.attackIcon, templateLangString('SKILL_LEVEL', {
            skillName: getLangString('SKILL_NAME_Attack')
        }));
        this.addTooltip(this.strengthIcon, templateLangString('SKILL_LEVEL', {
            skillName: getLangString('SKILL_NAME_Strength')
        }));
        this.addTooltip(this.defenceIcon, templateLangString('SKILL_LEVEL', {
            skillName: getLangString('SKILL_NAME_Defence')
        }));
        this.addTooltip(this.rangedIcon, templateLangString('SKILL_LEVEL', {
            skillName: getLangString('SKILL_NAME_Ranged')
        }));
        this.addTooltip(this.magicIcon, templateLangString('SKILL_LEVEL', {
            skillName: getLangString('SKILL_NAME_Magic')
        }));
        this.addTooltip(this.corruptionIcon, templateLangString('SKILL_LEVEL', {
            skillName: getLangString('SKILL_NAME_Corruption')
        }));
    }
    disconnectedCallback() {
        this.tooltips.forEach((tt) => tt.destroy());
        this.tooltips = [];
    }
    setCombatLevel(level) {
        this.combatLevel.textContent = `${level}`;
    }
    setLevels(character) {
        this.attackLevel.textContent = `${character.levels.Attack}`;
        this.strengthLevel.textContent = `${character.levels.Strength}`;
        this.defenceLevel.textContent = `${character.levels.Defence}`;
        this.rangedLevel.textContent = `${character.levels.Ranged}`;
        this.magicLevel.textContent = `${character.levels.Magic}`;
        if (character.levels.Corruption <= 0) {
            hideElement(this.corruptionContainer);
        } else {
            showElement(this.corruptionContainer);
            this.corruptionLevel.textContent = `${character.levels.Corruption}`;
        }
    }
    setMaxHitpoints(character) {
        showElement(this.hitpointsContainer);
        this.maxHitpoints.textContent = numberWithCommas(character.stats.maxHitpoints);
    }
    setEmpty() {
        this.combatLevel.textContent = '-';
        this.attackLevel.textContent = '-';
        this.strengthLevel.textContent = '-';
        this.defenceLevel.textContent = '-';
        this.rangedLevel.textContent = '-';
        this.magicLevel.textContent = '-';
        hideElement(this.corruptionContainer);
    }
    addTooltip(image, text) {
        this.tooltips.push(tippy(image, {
            content: text,
            placement: 'bottom',
            interactive: false,
            animation: false,
        }));
    }
}
window.customElements.define('combat-levels', CombatLevelsElement);
class TriangleDamageTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('triangle-damage-tooltip-template'));
        this.attackTypes = getElementFromFragment(this._content, 'attack-types', 'span');
        this.damageMultiplier = getElementFromFragment(this._content, 'damage-multiplier', 'span');
        this.resistanceMultiplier = getElementFromFragment(this._content, 'resistance-multiplier', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setTriangle(attackerType, targetType, triangle) {
        this.attackTypes.textContent = getLangString(`COMBAT_MISC_${attackerType}_vs_${targetType}`);
        if (setLang === 'en') {
            this.attackTypes.textContent = `(You) ${this.attackTypes.textContent} (Enemy)`;
        }
        const damageMult = triangle.damageModifier[attackerType][targetType];
        const resistanceMult = triangle.reductionModifier[attackerType][targetType];
        if (damageMult === 1) {
            this.damageMultiplier.textContent = getLangString('COMBAT_MISC_NO_CHANGE');
            this.damageMultiplier.className = 'text-info';
        } else if (damageMult > 0) {
            this.damageMultiplier.textContent = `x${damageMult}`;
            this.damageMultiplier.className = 'text-success';
        } else {
            this.damageMultiplier.textContent = `x${damageMult}`;
            this.damageMultiplier.className = 'text-danger';
        }
        if (resistanceMult === 1) {
            this.resistanceMultiplier.textContent = getLangString('COMBAT_MISC_NO_CHANGE');
            this.resistanceMultiplier.className = 'text-info';
        } else if (resistanceMult > 0) {
            this.resistanceMultiplier.textContent = `x${resistanceMult}`;
            this.resistanceMultiplier.className = 'text-success';
        } else {
            this.resistanceMultiplier.textContent = `x${resistanceMult}`;
            this.resistanceMultiplier.className = 'text-danger';
        }
    }
}
window.customElements.define('triangle-damage-tooltip', TriangleDamageTooltipElement);
class PlayerStatsElement extends HTMLElement {
    constructor() {
        super();
        this.activePrayerElements = [];
        this.iconTooltips = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('player-stats-template'));
        this.damageTypeIcon = getElementFromFragment(this._content, 'damage-type-icon', 'img');
        this.damageTypeName = getElementFromFragment(this._content, 'damage-type-name', 'span');
        this.minHit = getElementFromFragment(this._content, 'min-hit', 'span');
        this.maxHit = getElementFromFragment(this._content, 'max-hit', 'span');
        this.summoningMaxHitContainer = getElementFromFragment(this._content, 'summoning-max-hit-container', 'div');
        this.summoningIcon = getElementFromFragment(this._content, 'summoning-icon', 'img');
        this.summoningMaxHit = getElementFromFragment(this._content, 'summoning-max-hit', 'span');
        this.barrierMaxHitContainer = getElementFromFragment(this._content, 'barrier-max-hit-container', 'div');
        this.barrierIcon = getElementFromFragment(this._content, 'barrier-icon', 'img');
        this.barrierMaxHit = getElementFromFragment(this._content, 'barrier-max-hit', 'span');
        this.hitChance = getElementFromFragment(this._content, 'hit-chance', 'span');
        this.accuracyRating = getElementFromFragment(this._content, 'accuracy-rating', 'span');
        this.critChance = getElementFromFragment(this._content, 'crit-chance', 'span');
        this.critMultiplier = getElementFromFragment(this._content, 'crit-multiplier', 'span');
        this.lifesteal = getElementFromFragment(this._content, 'lifesteal', 'span');
        this.resistance = getElementFromFragment(this._content, 'resistance', 'resistance-table');
        this.evasion = getElementFromFragment(this._content, 'evasion', 'evasion-table');
        this.prayerLevelContainer = getElementFromFragment(this._content, 'prayer-level-container', 'div');
        this.prayerLevel = getElementFromFragment(this._content, 'prayer-level', 'span');
        this.prayerPoints = getElementFromFragment(this._content, 'prayer-points', 'span');
        this.soulPointsContainer = getElementFromFragment(this._content, 'soul-points-container', 'div');
        this.soulPoints = getElementFromFragment(this._content, 'soul-points', 'span');
        this.activePrayers = getElementFromFragment(this._content, 'active-prayers', 'span');
        this.triangleTooltipElem = new TriangleDamageTooltipElement();
        this.triangleTooltipElemDiv = getElementFromFragment(this._content, 'triangle-tooltip-elem', 'div');
        this.triangleTooltipElemDiv.appendChild(this.triangleTooltipElem);
        this.combatTriangleIcon = getElementFromFragment(this._content, 'combat-triangle-icon', 'img');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.triangleTooltip = tippy(this.combatTriangleIcon, {
            content: this.triangleTooltipElem,
            placement: 'bottom',
            interactive: false,
            animation: false,
            allowHTML: true,
        });
        this.activePrayerElements.forEach((activeElement) => {
            activeElement.tooltip = tippy(activeElement.link, {
                content: activeElement.tooltipElem,
                placement: 'bottom',
                interactive: false,
                animation: false,
            });
        });
        this.addTooltip(this.summoningIcon, getLangString('COMBAT_MISC_78'));
        this.addTooltip(this.barrierIcon, getLangString('MAXIMUM_SUMMON_DAMAGE_BARRIER'));
    }
    disconnectedCallback() {
        if (this.triangleTooltip !== undefined) {
            this.triangleTooltip.destroy();
            this.triangleTooltip = undefined;
        }
        this.activePrayerElements.forEach((activeElement) => {
            var _a;
            (_a = activeElement.tooltip) === null || _a === void 0 ? void 0 : _a.destroy();
            activeElement.tooltip = undefined;
        });
        this.iconTooltips.forEach((tt) => tt.destroy());
        this.iconTooltips = [];
    }
    init(game) {
        this.resistance.init(game);
    }
    setStats(player, game) {
        this.damageTypeIcon.src = player.damageType.media;
        this.damageTypeName.textContent = player.damageType.name;
        this.damageTypeName.className = player.damageType.spanClass;
        this.accuracyRating.textContent = formatNumber(player.stats.accuracy);
        this.critChance.textContent = formatPercent(player.modifiers.getCritChance(player.attackType));
        this.critMultiplier.textContent = formatPercent(150 + player.modifiers.critMultiplier);
        this.lifesteal.textContent = formatPercent(player.getAttackLifestealModifier());
        this.resistance.setStats(player);
        this.evasion.setStats(player);
    }
    setNormalDamage(minHit, maxHit) {
        this.minHit.textContent = minHit;
        this.maxHit.textContent = maxHit;
    }
    setHitChance(player) {
        this.hitChance.textContent = formatPercent(Math.round(player.stats.hitChance));
    }
    unsetHitChance() {
        this.hitChance.textContent = '-';
    }
    setPrayerPoints(player) {
        this.prayerPoints.textContent = formatNumber(player.prayerPoints);
    }
    setSoulPoints(player) {
        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            this.soulPoints.textContent = formatNumber(player.soulPoints);
            showElement(this.soulPointsContainer);
        } else {
            hideElement(this.soulPointsContainer);
        }
    }
    setActivePrayers(player, prayers) {
        while (this.activePrayerElements.length < prayers.size) {
            const link = createElement('a', {
                className: 'pointer-enabled m-1',
                parent: this.activePrayers
            });
            const image = createElement('img', {
                className: 'skill-icon-xs',
                parent: link
            });
            const tooltipElem = createElement('prayer-tooltip');
            customElements.upgrade(tooltipElem);
            this.activePrayerElements.push({
                link,
                image,
                tooltipElem
            });
        }
        let i = 0;
        prayers.forEach((prayer) => {
            const activeElement = this.activePrayerElements[i];
            if (activeElement.tooltip === undefined) {
                activeElement.tooltip = tippy(activeElement.link, {
                    content: activeElement.tooltipElem,
                    placement: 'bottom',
                    interactive: false,
                    animation: false,
                });
            }
            activeElement.image.src = prayer.media;
            activeElement.tooltipElem.setPrayer(prayer);
            activeElement.link.onclick = () => player.togglePrayer(prayer);
            showElement(activeElement.link);
            i++;
        });
        for (let i = prayers.size; i < this.activePrayerElements.length; i++) {
            hideElement(this.activePrayerElements[i].link);
        }
    }
    setSummonMaxHit(canAttack, maxHit, barrierMaxHit, isFighting) {
        if (canAttack) {
            this.summoningMaxHit.textContent = isFighting ? `(${numberWithCommas(maxHit)})` : numberWithCommas(maxHit);
            showElement(this.summoningMaxHitContainer);
            if (cloudManager.hasAoDEntitlementAndIsEnabled) {
                this.barrierMaxHit.textContent = isFighting ?
                    `(${numberWithCommas(barrierMaxHit)})` :
                    numberWithCommas(barrierMaxHit);
                showElement(this.barrierMaxHitContainer);
            } else {
                hideElement(this.barrierMaxHitContainer);
            }
        } else {
            hideElement(this.summoningMaxHitContainer);
            hideElement(this.barrierMaxHitContainer);
        }
    }
    setCombatTriangle(player, triangle, triangleSet) {
        var _a;
        this.triangleTooltipElem.setTriangle(player.attackType, player.target.attackType, triangle);
        this.combatTriangleIcon.src = triangleSet.media;
        showElement(this.combatTriangleIcon);
        (_a = this.triangleTooltip) === null || _a === void 0 ? void 0 : _a.setContent(this.triangleTooltipElem.innerHTML);
    }
    hideCombatTriangle() {
        hideElement(this.combatTriangleIcon);
    }
    addTooltip(image, text) {
        this.iconTooltips.push(tippy(image, {
            content: text,
            placement: 'bottom',
            interactive: false,
            animation: false,
        }));
    }
}
window.customElements.define('player-stats', PlayerStatsElement);
class MonsterStatsElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('monster-stats-template'));
        this.modalTitle = getElementFromFragment(this._content, 'modal-title', 'h3');
        this.monsterName = getElementFromFragment(this._content, 'monster-name', 'h5');
        this.wikiLink = getElementFromFragment(this._content, 'wiki-link', 'a');
        this.levels = getElementFromFragment(this._content, 'levels', 'combat-levels');
        this.monsterImage = getElementFromFragment(this._content, 'monster-image', 'img');
        this.offensiveStats = getElementFromFragment(this._content, 'offensive-stats', 'offensive-stats');
        this.defensiveStats = getElementFromFragment(this._content, 'defensive-stats', 'defensive-stats');
        this.specialAttacks = getElementFromFragment(this._content, 'special-attacks', 'enemy-special-attacks');
        this.combatPassives = getElementFromFragment(this._content, 'combat-passives', 'enemy-passives');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    init(game) {
        this.defensiveStats.init(game);
        this.offensiveStats.showAttackInterval();
    }
    setMonster(monster) {
        this.monsterName.textContent = monster.name;
        this.monsterImage.src = monster.media;
        this.wikiLink.onclick = () => openLink(`https://wiki.melvoridle.com/w/${monster.wikiName}`);
        if (this.enemy === undefined) {
            this.enemy = new Enemy(game.combat, game);
            this.enemy.modifiers.init(game);
        }
        this.enemy.setNewMonster(monster);
        this.enemy.target = game.combat.player;
        this.levels.setCombatLevel(monster.combatLevel);
        this.levels.setLevels(this.enemy);
        this.levels.setMaxHitpoints(this.enemy);
        this.defensiveStats.setStats(this.enemy);
        this.offensiveStats.setStats(this.enemy);
        this.offensiveStats.setNormalDamage(formatNumber(this.enemy.stats.minHit), formatNumber(this.enemy.stats.maxHit));
        this.offensiveStats.unsetHitChance();
        if (EnemySpecialAttacksElement.shouldHideAttacks(this.enemy.availableAttacks)) {
            this.specialAttacks.classList.replace('d-block', 'd-none');
        } else {
            this.specialAttacks.setAttacks(this.enemy.availableAttacks, this.enemy);
            this.specialAttacks.classList.replace('d-none', 'd-block');
        }
        const passives = new Map();
        game.combat.getPassivesForMonster(monster, game.getMonsterArea(monster)).forEach((active) => {
            passives.set(active.passive, active);
        });
        if (this.combatPassives.setPassives(passives)) {
            this.combatPassives.classList.replace('d-none', 'd-block');
        } else {
            this.combatPassives.classList.replace('d-block', 'd-none');
        }
    }
}
//# sourceMappingURL=combatMenus.js.map
checkFileVersion('?12097')