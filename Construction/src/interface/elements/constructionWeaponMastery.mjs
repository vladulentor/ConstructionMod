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

        this.stepContainer = getElementFromFragment(this._content, 'weaponMasteryStepsContainer', 'div');
        this.stepContainer.style.borderTopLeftRadius = '0';
        this.stepContainer.style.borderTopRightRadius = '0';
        this.stepContainer.style.paddingTop = '0';
        this.stepContainer.style.paddingBottom = '0.3rem';
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
        this.stepsButton.classList.add('open'); // flip arrow if you use ::before with .open
    }

    // Closes the modifier list
    closeModifierList() {
        this.modifierListContainer.classList.remove('open');
        this.modifierListContainer.classList.add('collapsed');
        this.stepsButton.classList.remove('open'); // reset arrow
    }

    // Toggles it (bind this to click)
    toggleModifierList() {
        if (this.modifierListContainer.classList.contains('collapsed')) {
            this.openModifierList();
        } else {
            this.closeModifierList();
        }
    }
    setWeapon(type) {
        this.wm = type;
        this.bgIcon.src = type.media;
        this.text.textContent = this.wm._localID; // e.g., "Novice", "Expert"
        this.setMods();
        if (this.modifierListContainer.classList.contains('open'))
            this.closeModifierList()
        this.show();
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
