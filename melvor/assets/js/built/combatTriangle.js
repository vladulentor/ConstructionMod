"use strict";
class CombatTriangleSet extends NamespacedObject {
    constructor(namespace, data) {
        super(namespace, data.id);
        this._name = data.name;
        this._media = data.media;
        this.Standard = data.Standard;
        this.Hardcore = data.Hardcore;
        this.InvertedHardcore = data.InvertedHardcore;
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`COMBAT_TRIANGLE_NAME_${this.localID}`);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
}
/** Data used to construct the Normal triangle set */
CombatTriangleSet.normalSetData = {
    id: 'Normal',
    name: 'Normal',
    media: 'assets/media/skills/combat/combat_triangle_normal.png',
    Standard: {
        damageModifier: {
            melee: {
                melee: 1,
                ranged: 1.1,
                magic: 0.85,
            },
            ranged: {
                melee: 0.85,
                ranged: 1,
                magic: 1.1,
            },
            magic: {
                melee: 1.1,
                ranged: 0.85,
                magic: 1,
            },
        },
        reductionModifier: {
            melee: {
                melee: 1,
                ranged: 1.25,
                magic: 0.75,
            },
            ranged: {
                melee: 0.95,
                ranged: 1,
                magic: 1.25,
            },
            magic: {
                melee: 1.25,
                ranged: 0.85,
                magic: 1,
            },
        },
    },
    Hardcore: {
        damageModifier: {
            melee: {
                melee: 1,
                ranged: 1.1,
                magic: 0.75,
            },
            ranged: {
                melee: 0.75,
                ranged: 1,
                magic: 1.1,
            },
            magic: {
                melee: 1.1,
                ranged: 0.75,
                magic: 1,
            },
        },
        reductionModifier: {
            melee: {
                melee: 1,
                ranged: 1.25,
                magic: 0.5,
            },
            ranged: {
                melee: 0.75,
                ranged: 1,
                magic: 1.25,
            },
            magic: {
                melee: 1.25,
                ranged: 0.75,
                magic: 1,
            },
        },
    },
    InvertedHardcore: {
        damageModifier: {
            melee: {
                melee: 1,
                ranged: 0.75,
                magic: 1.1,
            },
            ranged: {
                melee: 1.1,
                ranged: 1,
                magic: 0.75,
            },
            magic: {
                melee: 0.75,
                ranged: 1.1,
                magic: 1,
            },
        },
        reductionModifier: {
            melee: {
                melee: 1,
                ranged: 0.75,
                magic: 1.25,
            },
            ranged: {
                melee: 1.25,
                ranged: 1,
                magic: 0.75,
            },
            magic: {
                melee: 0.5,
                ranged: 1.25,
                magic: 1,
            },
        },
    },
};
class CombatTriangleSetTableElement extends HTMLElement {
    constructor() {
        super();
        this.attackTypeMedia = {
            melee: 'assets/media/skills/combat/attack.png',
            ranged: "assets/media/skills/ranged/ranged.png" /* Assets.Ranged */ ,
            magic: "assets/media/skills/magic/magic.png" /* Assets.Magic */ ,
            random: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
        };
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('combat-triangle-set-table-template'));
        this.tableBody = getElementFromFragment(this._content, 'table-body', 'tbody');
        this.name = getElementFromFragment(this._content, 'name', 'span');
        this.img = getElementFromFragment(this._content, 'img', 'img');
        this.gamemodeName = getElementFromFragment(this._content, 'gamemode-name', 'span');
        this.gamemodeImg = getElementFromFragment(this._content, 'gamemode-img', 'img');
        this.areaName = getElementFromFragment(this._content, 'area-name', 'span');
        this.areaImg = getElementFromFragment(this._content, 'area-img', 'img');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCombatTriangle(area) {
        this.name.textContent = area.combatTriangleSet.name;
        this.img.src = area.combatTriangleSet.media;
        this.gamemodeName.textContent = game.currentGamemode.name;
        this.gamemodeImg.src = game.currentGamemode.media;
        this.areaName.textContent = area.name;
        this.areaImg.src = area.media;
        this.tableBody.textContent = '';
        this.createRows(area.combatTriangleSet[game.currentGamemode.combatTriangleType]);
    }
    createRows(combatTriangle) {
        const meleeRow = new CombaTriangleSetTableRowElement();
        const rangedRow = new CombaTriangleSetTableRowElement();
        const magicRow = new CombaTriangleSetTableRowElement();
        meleeRow.setRow(combatTriangle, 'melee', this.attackTypeMedia.melee);
        rangedRow.setRow(combatTriangle, 'ranged', this.attackTypeMedia.ranged);
        magicRow.setRow(combatTriangle, 'magic', this.attackTypeMedia.magic);
        this.tableBody.append(meleeRow);
        this.tableBody.append(rangedRow);
        this.tableBody.append(magicRow);
    }
}
window.customElements.define('combat-triangle-set-table', CombatTriangleSetTableElement);
class CombaTriangleSetTableRowElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('combat-triangle-set-table-row-template'));
        this.playerAttackType = getElementFromFragment(this._content, 'player-attack-type', 'span');
        this.vsMeleeDmg = getElementFromFragment(this._content, 'vs-melee-dmg', 'span');
        this.vsMeleeDR = getElementFromFragment(this._content, 'vs-melee-dr', 'span');
        this.vsRangedDmg = getElementFromFragment(this._content, 'vs-ranged-dmg', 'span');
        this.vsRangedDR = getElementFromFragment(this._content, 'vs-ranged-dr', 'span');
        this.vsMagicDmg = getElementFromFragment(this._content, 'vs-magic-dmg', 'span');
        this.vsMagicDR = getElementFromFragment(this._content, 'vs-magic-dr', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setRow(combatTriangle, attackType, attackTypeMedia) {
        this.playerAttackType.innerHTML = `<img class="skill-icon-xs mr-1" src="${assets.getURI(attackTypeMedia)}">${getLangString(`ATTACK_TYPE_${attackType}`)}`;
        this.setSpan(this.vsMeleeDmg, combatTriangle.damageModifier[attackType].melee);
        this.setSpan(this.vsMeleeDR, combatTriangle.reductionModifier[attackType].melee);
        this.setSpan(this.vsRangedDmg, combatTriangle.damageModifier[attackType].ranged);
        this.setSpan(this.vsRangedDR, combatTriangle.reductionModifier[attackType].ranged);
        this.setSpan(this.vsMagicDmg, combatTriangle.damageModifier[attackType].magic);
        this.setSpan(this.vsMagicDR, combatTriangle.reductionModifier[attackType].magic);
    }
    setSpan(el, value) {
        el.textContent = `${value.toFixed(2)}x`;
        el.className = this.getSpanClass(value);
    }
    getSpanClass(value) {
        if (value < 1) {
            return 'text-danger font-w600';
        } else if (value > 1) {
            return 'text-success font-w400';
        } else {
            return '';
        }
    }
}
window.customElements.define('combat-triangle-set-table-row', CombaTriangleSetTableRowElement);
//# sourceMappingURL=combatTriangle.js.map
checkFileVersion('?12097')