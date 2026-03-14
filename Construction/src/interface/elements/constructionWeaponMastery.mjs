const noXP = { name: "No XP", color: "#7a0000", width: '0%' };
const stock = { name: "Stock", color: "#2dd432", width: '40%' };
const unusual = { name: "Unusual", color: "#2196F3", width: '60%' };
const distinct = { name: "Distinct", color: "#E91E63", width: '80%' };

const uniqtoclass = [noXP, stock, unusual, distinct];

export class WeaponMasteryUI {
    constructor() {
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('weaponMastery-template'));
        this.wm = null;
        // Grab the outer wrapper as the main container
        this.container = getElementFromFragment(this._content, 'outercont', 'div');
        this.block = getElementFromFragment(this._content, 'weaponMasteryContainer', 'div');
        this.bgIcon = getElementFromFragment(this._content, 'weaponMasteryBgIcon', 'img');
        this.icon = getElementFromFragment(this._content, 'weaponMasteryIcon', 'img');
        this.text = getElementFromFragment(this._content, 'weaponMasteryText', 'h5');
        this.unprogressbar = getElementFromFragment(this._content, 'weaponMasteryBar', 'div');
        this.progressbar = getElementFromFragment(this._content, 'weaponMasteryProgress', 'div');
        this.weaponItem = getElementFromFragment(this._content, 'weaponMasteryItem', 'div');
        this.weaponPic = getElementFromFragment(this._content, 'weaponPic', 'img');
        this.weaponInfo = getElementFromFragment(this._content, 'weaponInfo', 'div');
        this.weaponName = getElementFromFragment(this._content, 'weaponName', 'span');
        this.weaponRank = getElementFromFragment(this._content, 'weaponRank', 'span');
        this.weaponXPBar = getElementFromFragment(this._content, 'weaponXPBar', 'div');
        this.weaponXPFill = getElementFromFragment(this._content, 'weaponXpFill', 'div');

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
        console.log(rect);
        console.log(parentRect);
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
        let changedType = 0;
        this.type = weapon.weaponType;
        if (this.wm !== this.type) changedType = 1;
        this.wm = this.type;


        this.setweaponSegment(weapon, this.type);

        this.bgIcon.src = this.type.media;
        this.setMods();
        if (changedType && this.modifierListContainer.classList.contains('open'))
            this.closeModifierList()
        this.show();
    }

    setweaponSegment(weapon, type) {
        this.weaponPic.src = weapon.media;
        this.weaponName.innerHTML = weapon.name;
        this.uniqclass = uniqtoclass[weapon.uniqueness];
        this.weaponRank.innerHTML = this.uniqclass.name;
        this.weaponRank.style.color = this.uniqclass.color;
        this.weaponXPBar.style.width = this.uniqclass.width;
        this.weaponXPFill.style.backgroundColor = this.uniqclass.color;
        this.weaponXPFill.style.width = weapon.masteryPercentMaxed() + "%"
    }
    setMods() {
        for (let i = 0; i < this.steps.length; i++) {
            const spans = this.wm.levels[i].wepModifiers.describeAsSpans();
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
