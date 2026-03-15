const noXP = { name: "No XP", color: "#ff0000", width: '0%' };
const stock = { name: "Stock", color: "#2dd432", width: '40%' };
const unusual = { name: "Unusual", color: "#2196F3", width: '60%' };
const distinct = { name: "Distinct", color: "#E91E63", width: '80%' };
const exotic = { name: "Exotic", color: "#ffaf02", width: '90%' };

const uniqtoclass = [noXP, stock, unusual, distinct, exotic];

export class WeaponMasteryUI {
    constructor() {
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('weaponMastery-template'));
        this.type = null;
        this.weapon = null;

        // Grab the outer wrapper as the main container
        this.container = getElementFromFragment(this._content, 'outercont', 'div');
        this.block = getElementFromFragment(this._content, 'weaponMasteryContainer', 'div');
        this.bgIcon = getElementFromFragment(this._content, 'weaponMasteryBgIcon', 'img');
        this.icon = getElementFromFragment(this._content, 'weaponMasteryIcon', 'img');
        this.text = getElementFromFragment(this._content, 'weaponMasteryText', 'h5');


        this.weaponItem = getElementFromFragment(this._content, 'weaponMasteryItem', 'div');
        this.weaponPic = getElementFromFragment(this._content, 'weaponPic', 'img');
        this.weaponInfo = getElementFromFragment(this._content, 'weaponInfo', 'div');
        this.weaponName = getElementFromFragment(this._content, 'weaponName', 'span');
        this.weaponRank = getElementFromFragment(this._content, 'weaponRank', 'span');
        this.weaponXPBar = getElementFromFragment(this._content, 'weaponXPBar', 'div');
        this.weaponXPFill = getElementFromFragment(this._content, 'weaponXpFill', 'div');


        this.typeProfBar = getElementFromFragment(this._content, 'weaponMasteryBar', 'div');
        this.typeProfFill = getElementFromFragment(this._content, 'weaponMasteryProgress', 'div');
        this.typeProfOvFill = getElementFromFragment(this._content, 'weaponMasteryOverfill', 'div');


        this.stepContainer = getElementFromFragment(this._content, 'weaponMasteryStepsContainer', 'div');
        this.cap = getElementFromFragment(this._content, 'weaponMasteryCap', 'div');
        this.spacer = getElementFromFragment(this._content, 'modifierSpacer', 'div');
        this.stepContainer.style.paddingTop = '0';
        this.stepsButton = getElementFromFragment(this._content, 'weaponMasteryStepsButton', 'div');
        this.modifierListContainer = getElementFromFragment(this._content, 'weaponMasteryModifiers', 'div');
        this.steps = [
            getElementFromFragment(this._content, 'modifierStep1', 'div'),
            getElementFromFragment(this._content, 'modifierStep2', 'div'),
            getElementFromFragment(this._content, 'modifierStep3', 'div'),
            getElementFromFragment(this._content, 'modifierStep4', 'div'),
            getElementFromFragment(this._content, 'modifierStep5', 'div'),
        ];
        this.stepsButton.onclick = () => this.toggleModifierList();
    }

    openModifierList() {
        this.modifierListContainer.classList.remove('collapsed');
        this.modifierListContainer.classList.add('open');
        this.stepContainer.classList.add('expanded');
        this.stepsButton.classList.add('open');
        const rect = this.spacer.getBoundingClientRect();
        const parentRect = this.stepContainer.getBoundingClientRect();
        this.cap.style.top = this.spacer.offsetTop + "px";
        this.cap.style.transform = "none";
    }

    // Closes the modifier list
    closeModifierList() {
        this.modifierListContainer.classList.remove('open');
        this.modifierListContainer.classList.add('collapsed');
        this.stepContainer.classList.remove('expanded'); // <- new line for cap
        this.stepsButton.classList.remove('open'); // reset arrow
        this.cap.style.top = "92%";
        this.cap.style.transform = "translateY(-50%)";
    }

    // Toggles it (bind this to click)
    toggleModifierList() {
        if (this.modifierListContainer.classList.contains('collapsed')) {
            this.openModifierList();
        } else {
            this.closeModifierList();
        }
    }
    setWeapon(weapon) {

        if (this.weapon === weapon) return;
        this.weapon = weapon;
        this.setWeaponSegment(weapon, this.type);


        let changedType = 0;
        if (this.type !== weapon.weaponType) {
            changedType = 1;
            this.type = weapon.weaponType;
            this.setType();
        }

        this.show();
    }
    setType() {
        this.text.innerHTML = this.type.name;
        this.bgIcon.src = this.type.media;

        this.typeProfOvFill.style.width = this.type.xpPercent + "%";
        this.typeProfFill.style.width = this.type.cappedxpPercent + "%";

        if (this.modifierListContainer.classList.contains('open'))
            this.closeModifierList()
        this.setMods();

    }
    render() {

    }
    setWeaponSegment(weapon, type) {
        this.weaponPic.src = weapon.media;
        this.weaponName.innerHTML = weapon.name;
        this.uniqclass = uniqtoclass[weapon.uniqueness];
        this.weaponRank.innerHTML = this.uniqclass.name;
        this.weaponRank.style.color = this.uniqclass.color;
        this.weaponXPBar.style.width = this.uniqclass.width;
        this.weaponXPFill.style.backgroundColor = this.uniqclass.color;
        this.weaponXPFill.style.width = weapon.weaponXPPercentCapped + "%"
    }
    setMods() {
        for (let i = 0; i < this.steps.length; i++) {
            const spans = this.type.levels[i].wepModifiers.describeAsSpans();
            this.steps[i].innerHTML = '';
            this.steps[i].append(...spans);
        }
    }
    show() {
        showElement(this.container);
    }
    hide() {
        hideElement(this.container);
        this.closeModifierList();
    }
}
