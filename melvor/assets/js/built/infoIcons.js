"use strict";
class InfoIconElement extends HTMLElement {
    connectedCallback() {
        this.appendChild(this._content);
        if (this.tooltip !== undefined)
            return;
        this.tooltip = tippy(this.container, {
            content: this.tooltipElem,
            placement: 'top',
            allowHTML: true,
            interactive: true,
            animation: false,
            appendTo: document.body,
            popperOptions: {
                strategy: 'fixed',
                modifiers: [{
                        name: 'flip',
                        options: {
                            fallbackPlacements: ['top'],
                        },
                    },
                    {
                        name: 'preventOverflow',
                        options: {
                            altAxis: true,
                            tether: false,
                        },
                    },
                ],
            },
        });
    }
    disconnectedCallback() {
        if (this.tooltip !== undefined) {
            this.tooltip.destroy();
            this.tooltip = undefined;
        }
    }
    setInvalidBorder() {
        this.container.classList.add('border-item-invalid');
    }
    removeInvalidBorder() {
        this.container.classList.remove('border-item-invalid');
    }
    toggleInvalidBorder(isValid) {
        if (isValid)
            this.removeInvalidBorder();
        else
            this.setInvalidBorder();
    }
}
class XpIconTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('xp-icon-tooltip-template'));
        this.xp = getElementFromFragment(this._content, 'xp', 'span');
        this.baseXp = getElementFromFragment(this._content, 'base-xp', 'small');
        this.modifiersXp = getElementFromFragment(this._content, 'modifiers-xp', 'small');
        this.sourceContainer = getElementFromFragment(this._content, 'source-container', 'div');
        this.style.zIndex = '1000';
        this.style.minWidth = '400px';
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setXP(xp, baseXP) {
        this.xp.textContent = templateLangString('MENU_TEXT_TOOLTIP_SKILL_XP', {
            xp: `${numberWithCommas(xp)}`
        });
        this.baseXp.textContent = templateLangString('BASE_SKILL_XP', {
            baseXP: `${baseXP}`
        });
        this.setModifiersText(xp, baseXP);
    }
    setAbyssalXP(xp, baseXP) {
        this.xp.textContent = templateLangString('MENU_TEXT_AXP_AMOUNT', {
            xp: numberWithCommas(xp)
        });
        this.baseXp.textContent = templateLangString('MENU_TEXT_AXP_AMOUNT_BASE', {
            xp: numberWithCommas(baseXP)
        });
        this.setModifiersText(xp, baseXP);
    }
    setSkillXP(skill, xp, baseXP) {
        this.xp.textContent = templateLangString('SKILL_NAME_SKILL_XP_QTY', {
            qty: numberWithCommas(xp),
            skillName: skill.name,
        });
        this.baseXp.textContent = templateLangString('SKILL_NAME_SKILL_XP_QTY_BASE', {
            qty: numberWithCommas(baseXP),
            skillName: skill.name,
        });
        this.setModifiersText(xp, baseXP);
    }
    setMasteryXP(xp, baseXP) {
        this.xp.textContent = templateLangString('MENU_TEXT_TOOLTIP_MASTERY_XP', {
            value: numberWithCommas(xp)
        });
        this.baseXp.textContent = templateLangString('BASE_MASTERY_XP', {
            baseXP: `${baseXP}`
        });
        this.setModifiersText(xp, baseXP);
    }
    setModifiersText(xp, baseXP) {
        const modifierXP = xp - baseXP;
        if (modifierXP >= 0)
            this.modifiersXp.classList.replace('text-danger', 'text-success');
        else
            this.modifiersXp.classList.replace('text-success', 'text-danger');
        this.modifiersXp.textContent = `${modifierXP > 0 ? '+' : ''}${templateLangString('FROM_MODIFIERS', {
            value: numberWithCommas(modifierXP),
        })}`;
    }
    updateSources(sourceSpans) {
        this.sourceContainer.textContent = '';
        this.sourceContainer.append(...sourceSpans);
    }
}
window.customElements.define('xp-icon-tooltip', XpIconTooltipElement);
class XpIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('xp-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.alt = getLangString('MENU_TEXT_SKILL XP');
        this.xp = getElementFromFragment(this._content, 'xp', 'small');
        this.tooltipElem = new XpIconTooltipElement();
    }
    setXP(xp, baseXP) {
        xp = Math.floor(xp);
        baseXP = Math.floor(baseXP);
        this.xp.textContent = `${Math.floor(xp)}`;
        this.tooltipElem.setXP(xp, baseXP);
        baseXP <= 0 ? hideElement(this) : showElement(this);
    }
    setSources(modifierSources) {
        this.tooltipElem.updateSources(modifierSources);
    }
}
window.customElements.define('xp-icon', XpIconElement);
class AbyssalXpIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('abyssal-xp-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.alt = getLangString('ABYSSAL_XP');
        this.xp = getElementFromFragment(this._content, 'xp', 'small');
        this.tooltipElem = new XpIconTooltipElement();
    }
    setXP(xp, baseXP) {
        xp = Math.floor(xp);
        baseXP = Math.floor(baseXP);
        this.xp.textContent = `${Math.floor(xp)}`;
        this.tooltipElem.setAbyssalXP(xp, baseXP);
        baseXP <= 0 ? hideElement(this) : showElement(this);
    }
    setSources(modifierSources) {
        this.tooltipElem.updateSources(modifierSources);
    }
}
window.customElements.define('abyssal-xp-icon', AbyssalXpIconElement);
class SkillXpIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('skill-xp-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.skillImage = getElementFromFragment(this._content, 'skill-image', 'img');
        this.xp = getElementFromFragment(this._content, 'xp', 'small');
        this.tooltipElem = new XpIconTooltipElement();
    }
    setXP(skill, xp, baseXP) {
        this.skillImage.src = skill.media;
        this.skillImage.alt = templateLangString('SKILL_NAME_SKILL_XP_NO_QTY', {
            skillName: skill.name
        });
        xp = Math.floor(xp);
        baseXP = Math.floor(baseXP);
        this.xp.textContent = `${Math.floor(xp)}`;
        this.tooltipElem.setSkillXP(skill, xp, baseXP);
        baseXP <= 0 ? hideElement(this) : showElement(this);
    }
    setSources(modifierSources) {
        this.tooltipElem.updateSources(modifierSources);
    }
}
window.customElements.define('skill-xp-icon', SkillXpIconElement);
class IntervalIconTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('interval-icon-tooltip-template'));
        this.sourceContainer = getElementFromFragment(this._content, 'source-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    updateSources(sourceSpans) {
        this.sourceContainer.textContent = '';
        this.sourceContainer.append(...sourceSpans);
    }
}
window.customElements.define('interval-icon-tooltip', IntervalIconTooltipElement);
class IntervalIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('interval-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.alt = getLangString('MENU_TEXT_TOOLTIP_INTERVAL');
        this.interval = getElementFromFragment(this._content, 'interval', 'small');
        this.tooltipElem = new IntervalIconTooltipElement();
    }
    /** Toggles the alternative media for this icon */
    setMedia(altMedia) {
        this.image.src = assets.getURI(altMedia ? "assets/media/main/lemon_clock.png" /* Assets.IntervalAlt */ : "assets/media/main/timer.png" /* Assets.Interval */ );
    }
    setInterval(interval, modifierSources) {
        this.interval.textContent = templateLangString('INTERVAL_SECONDS', {
            value: formatFixed(interval / 1000, 2)
        });
        this.tooltipElem.updateSources(modifierSources);
    }
    setCustomInterval(interval, modifierSources) {
        this.interval.textContent = interval;
        this.tooltipElem.updateSources(modifierSources);
    }
}
window.customElements.define('interval-icon', IntervalIconElement);
class DoublingIconTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('doubling-icon-tooltip-template'));
        this.cap = getElementFromFragment(this._content, 'cap', 'h5');
        this.sourceContainer = getElementFromFragment(this._content, 'source-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCap(cap) {
        this.cap.textContent = templateString(getLangString('MENU_TEXT_TOOLTIP_CAPPED'), {
            chance: `${cap}`
        });
    }
    updateSources(sourceSpans) {
        this.sourceContainer.textContent = '';
        this.sourceContainer.append(...sourceSpans);
    }
}
window.customElements.define('doubling-icon-tooltip', DoublingIconTooltipElement);
class DoublingIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('doubling-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.alt = getLangString('MENU_TEXT_TOOLTIP_DOUBLE');
        this.chance = getElementFromFragment(this._content, 'chance', 'small');
        this.tooltipElem = new DoublingIconTooltipElement();
    }
    setChance(chance, sourceSpans) {
        this.chance.textContent = formatPercent(Math.round(chance));
        this.tooltipElem.setCap(100);
        this.tooltipElem.updateSources(sourceSpans);
    }
}
window.customElements.define('doubling-icon', DoublingIconElement);
class PreservationIconTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('preservation-icon-tooltip-template'));
        this.cap = getElementFromFragment(this._content, 'cap', 'h5');
        this.sourceContainer = getElementFromFragment(this._content, 'source-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCap(cap) {
        this.cap.textContent = templateString(getLangString('MENU_TEXT_TOOLTIP_CAPPED'), {
            chance: `${cap}`
        });
    }
    updateSources(sourceSpans) {
        this.sourceContainer.textContent = '';
        this.sourceContainer.append(...sourceSpans);
    }
}
window.customElements.define('preservation-icon-tooltip', PreservationIconTooltipElement);
class PreservationIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('preservation-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.alt = getLangString('MENU_TEXT_TOOLTIP_PRESERVE');
        this.chance = getElementFromFragment(this._content, 'chance', 'small');
        this.tooltipElem = new PreservationIconTooltipElement();
    }
    setChance(chance, cap, sourceSpans) {
        this.chance.textContent = formatPercent(Math.round(chance));
        this.tooltipElem.setCap(cap);
        this.tooltipElem.updateSources(sourceSpans);
    }
}
window.customElements.define('preservation-icon', PreservationIconElement);
class PerfectCookIconTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('perfect-cook-icon-tooltip-template'));
        this.cap = getElementFromFragment(this._content, 'cap', 'h5');
        this.sourceContainer = getElementFromFragment(this._content, 'source-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCap(cap) {
        this.cap.textContent = templateString(getLangString('MENU_TEXT_TOOLTIP_CAPPED'), {
            chance: `${cap}`
        });
    }
    updateSources(sourceSpans) {
        this.sourceContainer.textContent = '';
        this.sourceContainer.append(...sourceSpans);
    }
}
window.customElements.define('perfect-cook-icon-tooltip', PerfectCookIconTooltipElement);
class PerfectCookIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('perfect-cook-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.alt = getLangString('MENU_TEXT_TOOLTIP_PERFECT_COOK');
        this.chance = getElementFromFragment(this._content, 'chance', 'small');
        this.tooltipElem = new PerfectCookIconTooltipElement();
    }
    setChance(chance, sourceSpans) {
        this.chance.textContent = formatPercent(Math.round(chance));
        this.tooltipElem.setCap(100);
        this.tooltipElem.updateSources(sourceSpans);
    }
}
window.customElements.define('perfect-cook-icon', PerfectCookIconElement);
class CookingSuccessIconTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('cooking-success-icon-tooltip-template'));
        this.cap = getElementFromFragment(this._content, 'cap', 'h5');
        this.sourceContainer = getElementFromFragment(this._content, 'source-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCap(cap) {
        this.cap.textContent = templateString(getLangString('MENU_TEXT_TOOLTIP_CAPPED'), {
            chance: `${cap}`
        });
    }
    updateSources(sourceSpans) {
        this.sourceContainer.textContent = '';
        this.sourceContainer.append(...sourceSpans);
    }
}
window.customElements.define('cooking-success-icon-tooltip', CookingSuccessIconTooltipElement);
class CookingSuccessIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('cooking-success-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.alt = getLangString('MENU_TEXT_TOOLTIP_SUCCESSFUL_COOK');
        this.chance = getElementFromFragment(this._content, 'chance', 'small');
        this.tooltipElem = new CookingSuccessIconTooltipElement();
    }
    setChance(chance, sourceSpans) {
        this.chance.textContent = formatPercent(Math.round(chance));
        this.tooltipElem.setCap(100);
        this.tooltipElem.updateSources(sourceSpans);
    }
}
window.customElements.define('cooking-success-icon', CookingSuccessIconElement);
class AdditionalPrimaryQuantityIconTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('additional-primary-quantity-icon-tooltip-template'));
        this.sourceContainer = getElementFromFragment(this._content, 'source-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    updateSources(sourceSpans) {
        this.sourceContainer.textContent = '';
        this.sourceContainer.append(...sourceSpans);
    }
}
window.customElements.define('additional-primary-quantity-icon-tooltip', AdditionalPrimaryQuantityIconTooltipElement);
class AdditionalPrimaryQuantityIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('additional-primary-quantity-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.alt = getLangString('MENU_TEXT_TOOLTIP_ADDITIONAL_PRIMARY_RESOURCE');
        this.quantity = getElementFromFragment(this._content, 'quantity', 'small');
        this.tooltipElem = new AdditionalPrimaryQuantityIconTooltipElement();
    }
    setQuantity(qty, sourceSpans) {
        this.quantity.textContent = numberWithCommas(qty);
        this.tooltipElem.updateSources(sourceSpans);
    }
}
window.customElements.define('additional-primary-quantity-icon', AdditionalPrimaryQuantityIconElement);
class CostReductionIconTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('cost-reduction-icon-tooltip-template'));
        this.cap = getElementFromFragment(this._content, 'cap', 'h5');
        this.sourceContainer = getElementFromFragment(this._content, 'source-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCap(cap) {
        this.cap.textContent = templateString(getLangString('MENU_TEXT_TOOLTIP_CAPPED_NO_CHANCE'), {
            chance: `${cap}`
        });
    }
    updateSources(sourceSpans) {
        this.sourceContainer.textContent = '';
        this.sourceContainer.append(...sourceSpans);
    }
}
window.customElements.define('cost-reduction-icon-tooltip', CostReductionIconTooltipElement);
class CostReductionIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('cost-reduction-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.alt = getLangString('MENU_TEXT_TOOLTIP_COST_REDUCTION');
        this.percent = getElementFromFragment(this._content, 'percent', 'small');
        this.tooltipElem = new CostReductionIconTooltipElement();
    }
    setChance(chance, sourceSpans) {
        this.percent.textContent = formatPercent(Math.round(chance));
        this.tooltipElem.setCap(80);
        this.tooltipElem.updateSources(sourceSpans);
    }
}
window.customElements.define('cost-reduction-icon', CostReductionIconElement);
class MasteryXpIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('mastery-xp-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.alt = templateLangString('MENU_TEXT_TOOLTIP_MASTERY_XP', {
            value: ''
        });
        this.xp = getElementFromFragment(this._content, 'xp', 'small');
        this.tooltipElem = new XpIconTooltipElement();
    }
    setXP(xp, baseXP) {
        xp = Math.floor(xp);
        baseXP = Math.floor(baseXP);
        this.xp.textContent = `${xp}`;
        this.tooltipElem.setMasteryXP(xp, baseXP);
    }
    setSources(modifierSources) {
        this.tooltipElem.updateSources(modifierSources);
    }
}
window.customElements.define('mastery-xp-icon', MasteryXpIconElement);
class MasteryPoolIconTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('mastery-pool-icon-tooltip-template'));
        this.xp = getElementFromFragment(this._content, 'xp', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setXP(xp) {
        this.xp.textContent = templateLangString('MENU_TEXT_TOOLTIP_MASTERY_POOL_XP', {
            value: `${xp}`,
        });
    }
}
window.customElements.define('mastery-pool-icon-tooltip', MasteryPoolIconTooltipElement);
class MasteryPoolIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('mastery-pool-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.alt = templateLangString('MENU_TEXT_TOOLTIP_MASTERY_POOL_XP', {
            value: ''
        });
        this.xp = getElementFromFragment(this._content, 'xp', 'small');
        this.realmIconMelvor = getElementFromFragment(this._content, 'realm-icon-melvor', 'img');
        this.realmIconAbyssal = getElementFromFragment(this._content, 'realm-icon-abyssal', 'img');
        this.realmIconUnknown = getElementFromFragment(this._content, 'realm-icon-unknown', 'img');
        this.tooltipElem = new MasteryPoolIconTooltipElement();
    }
    setXP(xp) {
        xp = Math.floor(xp);
        this.xp.textContent = `${xp}`;
        this.tooltipElem.setXP(xp);
    }
    setRealm(realm) {
        this.hideRealms();
        if (realm.id === "melvorD:Melvor" /* RealmIDs.Melvor */ )
            showElement(this.realmIconMelvor);
        else if (realm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ )
            showElement(this.realmIconAbyssal);
        else
            showElement(this.realmIconUnknown);
    }
    hideRealms() {
        hideElement(this.realmIconMelvor);
        hideElement(this.realmIconAbyssal);
        hideElement(this.realmIconUnknown);
    }
}
window.customElements.define('mastery-pool-icon', MasteryPoolIconElement);
class StealthIconTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('stealth-icon-tooltip-template'));
        this.stealthVsPerception = getElementFromFragment(this._content, 'stealth-vs-perception', 'h5');
        const successSpan = getElementFromFragment(this._content, 'success-rate', 'span');
        this.successRate = createElement('span', {
            className: 'text-success'
        });
        successSpan.append(...templateLangStringWithNodes('MENU_TEXT_SUCCESS_RATE', {
            value: this.successRate
        }, {}, false));
        const doublingSpan = getElementFromFragment(this._content, 'increased-doubling', 'span');
        this.increasedDoubling = createElement('span', {
            className: 'text-success'
        });
        doublingSpan.append(...templateLangStringWithNodes('MENU_TEXT_TOOLTIP_INCREASED_DOUBLING', {
            value: this.increasedDoubling
        }, {}, false));
        const uniqueChanceSpan = getElementFromFragment(this._content, 'npc-unique-chance', 'span');
        this.npcUniqueChance = createElement('span', {
            className: 'text-success'
        });
        uniqueChanceSpan.append(...templateLangStringWithNodes('MENU_TEXT_TOOLTIP_NPC_UNIQUE_CHANCE', {
            value: this.npcUniqueChance
        }, {}, false));
        this.sourceContainer = getElementFromFragment(this._content, 'source-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setNPC(npc, thieving) {
        this.stealthVsPerception.innerHTML = templateString(getLangString('MENU_TEXT_TOOLTIP_STEALTH_VS'), {
            stealth: `${thieving.getStealthAgainstNPC(npc)}`,
            perception: `${npc.perception}`,
        });
        this.successRate.textContent = formatPercent(thieving.getNPCSuccessRate(npc), 2);
        this.increasedDoubling.textContent = formatPercent(thieving.getNPCSleightOfHand(npc), 2);
        this.npcUniqueChance.textContent = formatPercent(thieving.getNPCPickpocket(npc), 2);
    }
    updateSources(sourceSpans) {
        this.sourceContainer.textContent = '';
        this.sourceContainer.append(...sourceSpans);
    }
}
window.customElements.define('stealth-icon-tooltip', StealthIconTooltipElement);
class StealthIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('stealth-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.alt = getLangString('STEALTH');
        this.stealth = getElementFromFragment(this._content, 'stealth', 'small');
        this.tooltipElem = new StealthIconTooltipElement();
    }
    setNPC(npc, thieving) {
        this.stealth.textContent = `${thieving.getStealthAgainstNPC(npc)}`;
        this.tooltipElem.setNPC(npc, thieving);
    }
    setSources(modifierSources) {
        this.tooltipElem.updateSources(modifierSources);
    }
}
window.customElements.define('stealth-icon', StealthIconElement);
class ItemChanceIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('item-chance-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.itemImage = getElementFromFragment(this._content, 'item-image', 'img');
        this.chance = getElementFromFragment(this._content, 'chance', 'small');
        this.tooltipElem = createElement('div', {
            className: 'text-center'
        });
    }
    setItem(item) {
        this.itemImage.src = item.media;
        this.itemImage.alt = item.name;
        this.tooltipElem.textContent = item.name;
    }
    setChance(chance) {
        this.chance.textContent = formatPercent(chance, 2);
    }
}
window.customElements.define('item-chance-icon', ItemChanceIconElement);
class MeteoriteChanceIconTooltipElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('meteorite-chance-icon-tooltip-template'));
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
}
window.customElements.define('meteorite-chance-icon-tooltip', MeteoriteChanceIconTooltipElement);
class MeteoriteChanceIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('meteorite-chance-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.alt = getLangString('ASTROLOGY_METEORITE');
        this.chance = getElementFromFragment(this._content, 'chance', 'small');
        this.tooltipElem = new MeteoriteChanceIconTooltipElement();
    }
    setChance(chance) {
        this.chance.textContent = formatPercent(chance, 2);
    }
}
window.customElements.define('meteorite-chance-icon', MeteoriteChanceIconElement);
class StarfallChanceIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('starfall-chance-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.image.alt = getLangString('ASTROLOGY_STARFALLS');
        this.chance = getElementFromFragment(this._content, 'chance', 'small');
        this.tooltipElem = createElement('div', {
            className: 'text-center',
            text: getLangString('ASTROLOGY_STARFALLS')
        });
    }
    setChance(chance) {
        this.chance.textContent = formatPercent(chance, 2);
    }
}
window.customElements.define('starfall-chance-icon', StarfallChanceIconElement);
class ItemQuantityIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('item-quantity-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.itemImage = getElementFromFragment(this._content, 'item-image', 'img');
        this.quantity = getElementFromFragment(this._content, 'quantity', 'small');
        this.autoBuyIcon = getElementFromFragment(this._content, 'auto-buy-icon', 'img');
        this.tooltipElem = createElement('div', {
            className: 'text-center'
        });
    }
    setItem(item, quantity, allowQuickBuy = false, altMedia = false) {
        this.quantity.textContent = numberWithCommas(quantity);
        this.tooltipElem.textContent = item.name;
        this.itemImage.src = altMedia ? item.altMedia : item.media;
        this.itemImage.alt = item.name;
        const purchase = game.shop.getQuickBuyPurchase(item);
        if (allowQuickBuy && purchase !== undefined) {
            showElement(this.autoBuyIcon);
            this.container.onclick = () => game.shop.quickBuyItemOnClick(purchase);
        } else {
            hideElement(this.autoBuyIcon);
            this.container.onclick = null;
        }
        this.itemQuantity = {
            item,
            quantity
        };
    }
    updateBorder(game) {
        if (this.itemQuantity === undefined)
            return;
        this.toggleInvalidBorder(game.bank.getQty(this.itemQuantity.item) >= this.itemQuantity.quantity);
    }
}
window.customElements.define('item-quantity-icon', ItemQuantityIconElement);
class CookingStockpileIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('cooking-stockpile-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.itemImage = getElementFromFragment(this._content, 'item-image', 'img');
        this.quantity = getElementFromFragment(this._content, 'quantity', 'small');
        this.tooltipElem = createElement('div', {
            className: 'text-center'
        });
    }
    unsetItem() {
        var _a;
        this.quantity.textContent = '0';
        hideElement(this.itemImage);
        (_a = this.tooltip) === null || _a === void 0 ? void 0 : _a.disable();
    }
    setItem(item, quantity) {
        var _a;
        this.quantity.textContent = numberWithCommas(quantity);
        this.tooltipElem.textContent = item.name;
        this.itemImage.src = item.media;
        this.itemImage.alt = item.name;
        showElement(this.itemImage);
        (_a = this.tooltip) === null || _a === void 0 ? void 0 : _a.enable();
    }
    setOnClick(callback) {
        this.container.onclick = callback;
    }
}
window.customElements.define('cooking-stockpile-icon', CookingStockpileIconElement);
class CurrencyQuantityIconElement extends InfoIconElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('currency-quantity-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.currencyImage = getElementFromFragment(this._content, 'currency-image', 'img');
        this.quantity = getElementFromFragment(this._content, 'quantity', 'small');
        this.tooltipElem = createElement('div', {
            className: 'text-center'
        });
    }
    setCurrency(currency, quantity) {
        this.currencyImage.src = currency.media;
        this.currencyImage.alt = currency.name;
        this.tooltipElem.textContent = currency.name;
        this.quantity.textContent = numberWithCommas(quantity);
        this.currencyQuantity = {
            currency,
            quantity
        };
    }
    updateBorder() {
        if (this.currencyQuantity === undefined)
            return;
        this.toggleInvalidBorder(this.currencyQuantity.currency.canAfford(this.currencyQuantity.quantity));
    }
}
window.customElements.define('currency-quantity-icon', CurrencyQuantityIconElement);
class ItemCurrentIconElement extends InfoIconElement {
    constructor() {
        super();
        this.requiredQuantity = 0;
        this.currentQuantity = 0;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('item-current-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.itemImage = getElementFromFragment(this._content, 'item-image', 'img');
        this.quantity = getElementFromFragment(this._content, 'quantity', 'small');
        this.autoBuyIcon = getElementFromFragment(this._content, 'auto-buy-icon', 'img');
        this.tooltipElem = createElement('div', {
            className: 'text-center'
        });
    }
    connectedCallback() {
        super.connectedCallback();
        this.container.onmouseover = () => this.onMouseOver();
        this.container.onmouseleave = () => this.onMouseLeave();
    }
    setItem(item, requiredQuantity, game, allowQuickBuy = false, altMedia = false) {
        this.item = item;
        this.requiredQuantity = requiredQuantity;
        this.itemImage.src = altMedia ? item.altMedia : item.media;
        this.itemImage.alt = item.name;
        this.tooltipElem.textContent = item.name;
        const purchase = game.shop.getQuickBuyPurchase(item);
        if (allowQuickBuy && purchase !== undefined) {
            showElement(this.autoBuyIcon);
            this.container.onclick = () => game.shop.quickBuyItemOnClick(purchase);
        } else {
            hideElement(this.autoBuyIcon);
            this.container.onclick = null;
        }
        this.updateQuantity(game.bank);
    }
    updateQuantity(bank) {
        if (this.item === undefined)
            return;
        this.currentQuantity = bank.getQty(this.item);
        this.toggleInvalidBorder(this.currentQuantity >= this.requiredQuantity);
        this.quantity.textContent = formatNumber(this.currentQuantity);
    }
    onMouseOver() {
        this.quantity.textContent = numberWithCommas(this.currentQuantity);
    }
    onMouseLeave() {
        this.quantity.textContent = formatNumber(this.currentQuantity);
    }
    highlight() {
        this.container.classList.replace('btn-light', 'btn-alt-green');
    }
    unHighlight() {
        this.container.classList.replace('btn-alt-green', 'btn-light');
    }
}
window.customElements.define('item-current-icon', ItemCurrentIconElement);
class CurrencyCurrentIconElement extends InfoIconElement {
    constructor() {
        super();
        this.requiredQuantity = 0;
        this.currentQuantity = 0;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('currency-current-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.currencyImage = getElementFromFragment(this._content, 'currency-image', 'img');
        this.quantity = getElementFromFragment(this._content, 'quantity', 'small');
        this.tooltipElem = createElement('div', {
            className: 'text-center'
        });
    }
    connectedCallback() {
        super.connectedCallback();
        this.container.onmouseover = () => this.onMouseOver();
        this.container.onmouseleave = () => this.onMouseLeave();
    }
    setCurrency(currency, requiredQuantity) {
        this.currency = currency;
        this.requiredQuantity = requiredQuantity;
        this.currencyImage.src = currency.media;
        this.currencyImage.alt = currency.name;
        this.tooltipElem.textContent = currency.name;
        this.updateQuantity();
    }
    updateQuantity() {
        if (this.currency === undefined)
            return;
        this.currentQuantity = this.currency.amount;
        this.toggleInvalidBorder(this.currentQuantity >= this.requiredQuantity);
        this.quantity.textContent = formatNumber(this.currentQuantity);
    }
    onMouseOver() {
        this.quantity.textContent = numberWithCommas(this.currentQuantity);
    }
    onMouseLeave() {
        this.quantity.textContent = formatNumber(this.currentQuantity);
    }
}
window.customElements.define('currency-current-icon', CurrencyCurrentIconElement);
//# sourceMappingURL=infoIcons.js.map
checkFileVersion('?12097')