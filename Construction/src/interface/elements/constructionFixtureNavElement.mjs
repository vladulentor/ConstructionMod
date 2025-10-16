const { loadModule } = mod.getContext(import.meta);

const { templateRielkLangString } = await loadModule('src/language/translationManager.mjs');
const ctx = mod.getContext(import.meta);


class ConstructionFixtureNavElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('rielk-construction-fixture-nav-template'));
        this.button = getElementFromFragment(this._content, 'button', 'a');
        this.buttonContent = getElementFromFragment(this._content, 'button-content', 'div');
        this.fixtureImage = getElementFromFragment(this._content, 'fixture-image', 'img');
        this.sparkleImage = getElementFromFragment(this._content, 'sparkle-overlay', 'img');
        this.sparkleImage.src = ctx.getResourceUrl('assets/efficiency.png')
        this.fixtureName = getElementFromFragment(this._content, 'fixture-name', 'span');
        this.constructionProgress = getElementFromFragment(this._content, 'construction-progress', 'small');
        this.unlock = getElementFromFragment(this._content, 'unlock', 'div');
        this.level = getElementFromFragment(this._content, 'level', 'span');
        this.abyssalLevel = getElementFromFragment(this._content, 'abyssal-level', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setFixture(fixture, construction) {
        this.fixtureImage.src = fixture.media;
        
        if(fixture.currentTier==fixture.maxTier) this.sparkleImage.classList.remove('d-none');
        else this.sparkleImage.classList.add('d-none');
        this.fixtureName.textContent = fixture.name;
        this.level.textContent = '';
        this.level.append(...templateLangStringWithNodes('MENU_TEXT_UNLOCKED_AT', {
            skillImage: createElement('img', {
                className: 'skill-icon-xs mr-1',
                attributes: [['src', construction.media]]
            }),
        }, {
            level: `${fixture.level}`
        }, false));
        this.abyssalLevel.textContent = '';
        if (fixture.abyssalLevel >= 1) {
            this.abyssalLevel.append(...templateLangStringWithNodes('UNLOCKED_AT_ABYSSAL_LEVEL', {
                skillImage: createElement('img', {
                    className: 'skill-icon-xs mr-1',
                    attributes: [['src', construction.media]],
                }),
            }, {
                level: `${fixture.abyssalLevel}`
            }, false));
            showElement(this.abyssalLevel);
        } else {
            hideElement(this.abyssalLevel);
        }
    }
    updateFixture(fixture, game) {
        this.constructionProgress.textContent = templateRielkLangString('MENU_TEXT_BUILT_PROGRESS', {
            currentValue: `${formatNumber(fixture.currentTier)}`,
            maxValue: `${formatNumber(fixture.maxTier)}`
        });
    }
    setLocked(fixture, construction) {
        hideElement(this.buttonContent);
        this.buttonContent.classList.remove('d-flex');
        toggleDangerSuccess(this.level, construction.level >= fixture.level);
        toggleDangerSuccess(this.abyssalLevel, construction.abyssalLevel >= fixture.abyssalLevel);
        showElement(this.unlock);
        this.button.onclick = null;
    }
    setUnlocked(callback) {
        showElement(this.buttonContent);
        this.buttonContent.classList.add('d-flex');
        hideElement(this.unlock);
        this.button.onclick = callback;
    }
}
window.customElements.define('rielk-construction-fixture-nav', ConstructionFixtureNavElement);
