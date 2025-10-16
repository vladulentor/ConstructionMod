"use strict";
class MiningRockElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('mining-rock-template'));
        this.statusText = getElementFromFragment(this._content, 'rock-status-text', 'lang-string');
        this.nameText = getElementFromFragment(this._content, 'rock-name-text', 'span');
        this.typeText = getElementFromFragment(this._content, 'rock-type-text', 'small');
        this.rockImage = getElementFromFragment(this._content, 'rock-image', 'img');
        this.hpProgressText = getElementFromFragment(this._content, 'rock-hp-progress-text', 'small');
        this.hpProgress = getElementFromFragment(this._content, 'hp-progress', 'progress-bar');
        this.xpIcon = getElementFromFragment(this._content, 'xp-icon', 'xp-icon');
        this.abyssalXPIcon = getElementFromFragment(this._content, 'abyssal-xp-icon', 'abyssal-xp-icon');
        this.masteryIcon = getElementFromFragment(this._content, 'mastery-icon', 'mastery-xp-icon');
        this.masteryPoolIcon = getElementFromFragment(this._content, 'mastery-pool-icon', 'mastery-pool-icon');
        this.intervalIcon = getElementFromFragment(this._content, 'interval-icon', 'interval-icon');
        this.miningProgress = getElementFromFragment(this._content, 'mining-progress', 'progress-bar');
        this.mastery = getElementFromFragment(this._content, 'mastery-display', 'mastery-display');
        this.requirementText = getElementFromFragment(this._content, 'rock-requirement-text', 'div');
        this.gemVeinText = getElementFromFragment(this._content, 'gem-vein-text', 'div');
        this.meteoriteText = getElementFromFragment(this._content, 'meteorite-text', 'div');
        this.fragmentText = getElementFromFragment(this._content, 'fragment-text', 'div');
        this.lockedContainer = getElementFromFragment(this._content, 'locked-container', 'div');
        this.unlockedContainer = getElementFromFragment(this._content, 'unlocked-container', 'a');
        this.nextLevel = getElementFromFragment(this._content, 'next-level', 'span');
        this.nextAbyssalLevel = getElementFromFragment(this._content, 'next-abyssal-level', 'span');
        this.requiredPickaxe = getElementFromFragment(this._content, 'mining-pickaxe-required', 'div');
        hideElement(this.abyssalXPIcon);
    }
    setLockedContainer(rock) {
        this.nextLevel.textContent = templateLangString('MENU_TEXT_LEVEL', {
            level: `${rock.level}`
        });
        if (rock.level > game.mining.level) {
            this.nextLevel.classList.add('bg-danger');
            this.nextLevel.classList.remove('bg-success');
        } else {
            this.nextLevel.classList.remove('bg-danger');
            this.nextLevel.classList.add('bg-success');
        }
        if (game.mining.hasAbyssalLevels && rock.abyssalLevel > 0) {
            this.nextAbyssalLevel.textContent = templateLangString('MENU_TEXT_ABYSSAL_LEVEL', {
                level: `${rock.abyssalLevel}`,
            });
            if (rock.abyssalLevel > game.mining.abyssalLevel) {
                this.nextAbyssalLevel.classList.add('bg-danger');
                this.nextAbyssalLevel.classList.remove('bg-success');
            } else {
                this.nextAbyssalLevel.classList.remove('bg-danger');
                this.nextAbyssalLevel.classList.add('bg-success');
            }
        } else
            hideElement(this.nextAbyssalLevel);
        if (rock.shopItemPurchased !== undefined) {
            this.requiredPickaxe.classList.remove('d-none');
            this.requiredPickaxe.textContent = templateLangString('MENU_TEXT_REQUIRES_SHOP_PURCHASE', {
                purchaseName: rock.shopItemPurchased.name,
            });
            showElement(this.requiredPickaxe);
            toggleDangerSuccess(this.requiredPickaxe, game.shop.isUpgradePurchased(rock.shopItemPurchased));
        } else
            hideElement(this.requiredPickaxe);
    }
    setLocked() {
        showElement(this.lockedContainer);
        hideElement(this.unlockedContainer);
    }
    setUnlocked() {
        showElement(this.unlockedContainer);
        hideElement(this.lockedContainer);
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.hpProgress.setStyle('bg-danger');
        this.miningProgress.setStyle('bg-mining');
    }
    setRock(rock) {
        this._rock = rock;
        this.unlockedContainer.onclick = () => game.mining.onRockClick(rock);
        this.nameText.textContent = rock.name;
        this.mastery.setMastery(game.mining, rock);
        this.typeText.textContent = rock.category.name;
        this.typeText.classList.add(rock.category.badgeClass);
        switch (rock.category.id) {
            case "melvorD:Gem" /* MiningCategoryIDs.Gem */ :
                this.gemVeinText.textContent = getLangString('MENU_TEXT_GEM_VEIN');
                this.gemVeinText.classList.remove('d-none');
                break;
            case "melvorItA:AbyssalGem" /* MiningCategoryIDs.AbyssalGem */ :
                this.gemVeinText.textContent = getLangString('MENU_TEXT_ABYSSAL_GEM_VEIN');
                this.gemVeinText.classList.remove('d-none');
                break;
        }
        if (rock.id === "melvorTotH:Meteorite_Ore" /* MiningRockIDs.Meteorite_Ore */ ) {
            this.meteoriteText.textContent = getLangString('MENU_TEXT_METEORITE_VEIN');
            this.meteoriteText.classList.remove('d-none');
        }
        if (rock.id === "melvorItA:Abycite" /* MiningRockIDs.Abycite */ ||
            rock.id === "melvorItA:Echocite" /* MiningRockIDs.Echocite */ ||
            rock.id === "melvorItA:Mysticite" /* MiningRockIDs.Mysticite */ ) {
            this.fragmentText.innerHTML = templateLangString('MENU_TEXT_FRAGMENT_VEIN', {
                rockName: rock.name,
                starfallIcon: `<img class="skill-icon-xxs mr-1" src="${assets.getURI('assets/media/skills/astrology/starfall.png')}" />`,
            });
            this.fragmentText.classList.remove('d-none');
        }
        this.mastery.setMastery(game.mining, rock);
        this.setLockedContainer(rock);
    }
    updateHP(rock) {
        if (rock.isRespawning) {
            this.rockImage.src = assets.getURI('assets/media/skills/mining/rock_empty.png');
        } else {
            this.rockImage.src = rock.media;
            const hpPercent = (rock.currentHP / rock.maxHP) * 100;
            this.hpProgress.setFixedPosition(hpPercent);
        }
        this.hpProgressText.textContent = `${rock.currentHP} / ${rock.maxHP}`;
    }
    setStatus(statusID) {
        var _a, _b;
        this.statusText.setAttribute('lang-id', `MENU_TEXT_${statusID}`);
        if (statusID === 'MINING') {
            (_a = this.statusText.parentElement) === null || _a === void 0 ? void 0 : _a.classList.add('badge', 'badge-info');
        } else {
            (_b = this.statusText.parentElement) === null || _b === void 0 ? void 0 : _b.classList.remove('badge', 'badge-info');
        }
    }
    setRequirement(reqText) {
        this.requirementText.textContent = reqText;
        showElement(this.requirementText);
    }
    hideRequirement() {
        hideElement(this.requirementText);
    }
    /** Updates the XP, Mastery XP, Mastery Pool XP and interval icons */
    updateGrants(xp, baseXP, masteryXP, baseMasteryXP, masteryPoolXP, interval, rock) {
        this.xpIcon.setXP(xp, baseXP);
        this.xpIcon.setSources(game.mining.getXPSources(rock));
        this.masteryIcon.setXP(masteryXP, baseMasteryXP);
        this.masteryIcon.setSources(game.mining.getMasteryXPSources(rock));
        this.masteryPoolIcon.setXP(masteryPoolXP);
        game.unlockedRealms.length > 1 ? this.masteryPoolIcon.setRealm(rock.realm) : this.masteryPoolIcon.hideRealms();
        this.intervalIcon.setInterval(interval, game.mining.getIntervalSources(rock));
        this.abyssalXPIcon.setSources(game.mining.getAbyssalXPSources(rock));
    }
    /** Updates the Abyssal XP */
    updateAbyssalGrants(xp, baseXP) {
        this.abyssalXPIcon.setXP(xp, baseXP);
        if (baseXP > 0)
            showElement(this.abyssalXPIcon);
        else
            hideElement(this.abyssalXPIcon);
    }
}
window.customElements.define('mining-rock', MiningRockElement);
//# sourceMappingURL=rockMenu.js.map
checkFileVersion('?12097')