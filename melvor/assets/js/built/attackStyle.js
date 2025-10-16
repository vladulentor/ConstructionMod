"use strict";
class AttackStyle extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        try {
            this.stats = new StatObject(data, game, `${AttackStyle.name} with id "${this.id}"`);
            this.experienceGain = data.experienceGain.map(({
                skillID,
                ratio
            }) => {
                const skill = game.skills.getObjectSafe(skillID);
                return {
                    skill,
                    ratio
                };
            });
            this.attackType = data.attackType;
            this._name = data.name;
        } catch (e) {
            throw new DataConstructionError(AttackStyle.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`COMBAT_MISC_ATTACK_STYLE_NAME_${this.localID}`);
        }
    }
    get toolTipContent() {
        let tooltip = `<div class='text-center'>${getLangString('MENU_TEXT_TRAINS')}<br><span class='text-success'>${joinAsList(this.experienceGain.map(({ skill }) => skill.name))}</span>`;
        const modDesc = this.stats.describePlain();
        if (modDesc !== '')
            tooltip += `<br>${getLangString('MENU_TEXT_PROVIDES')}<br><span class='text-info'>${modDesc}</span>`;
        tooltip += '</div>';
        return tooltip;
    }
    get buttonID() {
        return `combat-attack-style-button-${this.id}`;
    }
}
//# sourceMappingURL=attackStyle.js.map
checkFileVersion('?12097')