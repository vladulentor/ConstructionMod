"use strict";
// Components for rendering the fishing page
class FishingAreaMenuElement extends HTMLElement {
    constructor() {
        super();
        this.fishButtons = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('fishing-area-menu-template'));
        this.areaBlock = getElementFromFragment(this._content, 'area-block', 'div');
        this.areaHeader = getElementFromFragment(this._content, 'area-header', 'div');
        this.areaName = getElementFromFragment(this._content, 'area-name', 'span');
        this.areaEyecon = getElementFromFragment(this._content, 'area-eyecon', 'i');
        this.fishChance = getElementFromFragment(this._content, 'fish-chance', 'span');
        this.junkChance = getElementFromFragment(this._content, 'junk-chance', 'span');
        this.specialChance = getElementFromFragment(this._content, 'special-chance', 'span');
        this.buttonContainer = getElementFromFragment(this._content, 'button-container', 'div');
        this.infoContainer = getElementFromFragment(this._content, 'info-container', 'div');
        this.fishName = getElementFromFragment(this._content, 'fish-name', 'span');
        this.fishImage = getElementFromFragment(this._content, 'fish-image', 'img');
        this.fishInfoContainer = getElementFromFragment(this._content, 'fish-info-container', 'div');
        this.fishInterval = getElementFromFragment(this._content, 'fish-interval', 'span');
        this.masteryDisplay = getElementFromFragment(this._content, 'fish-mastery', 'mastery-display');
        this.startButton = getElementFromFragment(this._content, 'start-button', 'button');
        this.statusSpinner = getElementFromFragment(this._content, 'status-spinner', 'div');
        this.statusText = getElementFromFragment(this._content, 'status-text', 'small');
        this.xpIcon = getElementFromFragment(this._content, 'xp-icon', 'xp-icon');
        this.abyssalXPIcon = getElementFromFragment(this._content, 'abyssal-xp-icon', 'abyssal-xp-icon');
        this.strXPIcon = getElementFromFragment(this._content, 'str-xp-icon', 'skill-xp-icon');
        this.masteryIcon = getElementFromFragment(this._content, 'mastery-icon', 'mastery-xp-icon');
        this.masteryPoolIcon = getElementFromFragment(this._content, 'mastery-pool-icon', 'mastery-pool-icon');
        hideElement(this.abyssalXPIcon);
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /** Sets the chances of the menu */
    setChances(chance, area) {
        this.fishChance.textContent = templateLangString('MENU_TEXT_FISH_CHANCE', {
            fishChance: formatPercent(chance.fish),
        });
        if (chance.fish !== area.fishChance) {
            this.fishChance.classList.add('text-success');
        } else {
            this.fishChance.classList.remove('text-success');
        }
        this.junkChance.textContent = templateLangString('MENU_TEXT_JUNK_CHANCE', {
            junkChance: formatPercent(chance.junk),
        });
        if (chance.junk !== area.junkChance) {
            this.junkChance.classList.add('text-success');
        } else {
            this.junkChance.classList.remove('text-success');
        }
        this.specialChance.textContent = templateLangString('MENU_TEXT_SPECIAL_CHANCE', {
            specialChance: formatPercent(chance.special),
        });
        if (chance.special !== area.specialChance) {
            this.specialChance.classList.add('text-success');
        } else {
            this.specialChance.classList.remove('text-success');
        }
    }
    /** Intializes the menu with the provided fishing data. Also performs localization */
    setAreaData(area) {
        this.areaName.textContent = area.name;
        this.buttonContainer.textContent = '';
        this.fishButtons = [];
        area.fish.forEach((fish) => {
            const button = new FishingAreaMenuButtonElement();
            this.buttonContainer.append(button);
            this.fishButtons.push(button);
        });
        this.startButton.onclick = () => game.fishing.onAreaStartButtonClick(area);
        this.areaHeader.onclick = () => game.fishing.onAreaHeaderClick(area);
        this.setActionInactive();
    }
    /** Updates the XP, Mastery XP, Mastery Pool XP */
    updateGrants(xp, baseXP, masteryXP, baseMasteryXP, masteryPoolXP, strengthXP, baseStrengthXP, fish) {
        this.xpIcon.setXP(xp, baseXP);
        this.xpIcon.setSources(game.fishing.getXPSources(fish));
        if (strengthXP > 0) {
            this.strXPIcon.setXP(game.strength, strengthXP, baseStrengthXP);
            this.strXPIcon.setSources(game.strength.getXPSources(fish));
            showElement(this.strXPIcon);
        } else {
            hideElement(this.strXPIcon);
        }
        this.masteryIcon.setXP(masteryXP, baseMasteryXP);
        this.masteryIcon.setSources(game.fishing.getMasteryXPSources(fish));
        this.masteryPoolIcon.setXP(masteryPoolXP);
        game.unlockedRealms.length > 1 ? this.masteryPoolIcon.setRealm(fish.realm) : this.masteryPoolIcon.hideRealms();
        this.abyssalXPIcon.setSources(game.fishing.getAbyssalXPSources(fish));
    }
    /** Updates the XP, Mastery XP, Mastery Pool XP */
    updateAbyssalGrants(xp, baseXP) {
        this.abyssalXPIcon.setXP(xp, baseXP);
        if (baseXP > 0)
            showElement(this.abyssalXPIcon);
        else
            hideElement(this.abyssalXPIcon);
    }
    hideAreaPanel() {
        hideElement(this.buttonContainer);
        hideElement(this.infoContainer);
        this.areaEyecon.classList.remove('fa-eye');
        this.areaEyecon.classList.add('fa-eye-slash');
        this.areaBlock.removeAttribute('style');
    }
    showAreaPanel() {
        showElement(this.buttonContainer);
        showElement(this.infoContainer);
        this.areaEyecon.classList.remove('fa-eye-slash');
        this.areaEyecon.classList.add('fa-eye');
        this.areaBlock.setAttribute('style', 'min-height:370px;');
    }
    /** Sets the current fish information */
    setSelectedFish(fish) {
        this.fishImage.src = fish.product.media;
        this.fishName.textContent = fish.product.name;
        showElement(this.fishInfoContainer);
        showElement(this.fishImage);
        showElement(this.startButton);
        this.masteryDisplay.setMastery(game.fishing, fish);
    }
    /** Sets the area to an unselected state */
    setUnselected() {
        this.fishName.textContent = '';
        hideElement(this.fishInfoContainer);
        hideElement(this.fishImage);
        hideElement(this.startButton);
    }
    /** Updates the current information on the selected fish */
    updateSelectedFishRates(fish) {
        this.fishInterval.textContent = templateLangString('MENU_TEXT_SECONDS_RANGE', {
            minTime: formatFixed(game.fishing.getMinFishInterval(fish) / 1000, 2),
            maxTime: formatFixed(game.fishing.getMaxFishInterval(fish) / 1000, 2),
        });
        const avgInterval = (game.fishing.getMaxFishInterval(fish) + game.fishing.getMinFishInterval(fish)) / 2;
        const xp = Math.floor(game.fishing.modifyXP(fish.baseExperience));
        const mxp = game.fishing.getMasteryXPToAddForAction(fish, avgInterval);
        const baseMXP = game.fishing.getBaseMasteryXPToAddForAction(fish, avgInterval);
        const mpxp = game.fishing.getMasteryXPToAddToPool(mxp);
        let strxp = 0;
        let baseStrXP = 0;
        if (fish.strengthXP > 0) {
            strxp = game.strength.modifyXP(fish.strengthXP);
            baseStrXP = fish.strengthXP;
        }
        this.updateGrants(xp, fish.baseExperience, mxp, baseMXP, mpxp, strxp, baseStrXP, fish);
        this.updateAbyssalGrants(game.fishing.modifyAbyssalXP(fish.baseAbyssalExperience), fish.baseAbyssalExperience);
    }
    updateButtons(area, fishing) {
        area.fish.forEach((fish, i) => {
            const button = this.fishButtons[i];
            if (fish.level > game.fishing.level ||
                (fish.abyssalLevel >= 1 && game.fishing.abyssalLevel < fish.abyssalLevel)) {
                button.setFishLocked(fish, fishing);
            } else {
                button.setFishUnlocked(fish, area);
                button.updateRates(fish, fishing);
            }
        });
    }
    /** Turn the status spinner on and change the start button to stop */
    setActionActive() {
        showElement(this.statusSpinner);
        this.startButton.classList.replace('btn-info', 'btn-danger');
        this.startButton.textContent = getLangString('MENU_TEXT_STOP_FISHING');
        this.statusText.textContent = game.fishing.name;
    }
    /** Turns the status spinner off and change the start button to start */
    setActionInactive() {
        hideElement(this.statusSpinner);
        this.startButton.classList.replace('btn-danger', 'btn-info');
        this.startButton.textContent = getLangString('MENU_TEXT_START_FISHING');
        this.statusText.textContent = getLangString('MENU_TEXT_IDLE');
    }
}
window.customElements.define('fishing-area-menu', FishingAreaMenuElement);
class FishingAreaMenuButtonElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('fishing-area-menu-button-template'));
        this.link = getElementFromFragment(this._content, 'link', 'a');
        this.fishImage = getElementFromFragment(this._content, 'fish-image', 'img');
        this.fishName = getElementFromFragment(this._content, 'fish-name', 'span');
        this.level = getElementFromFragment(this._content, 'level', 'span');
        this.abyssalLevel = getElementFromFragment(this._content, 'abyssal-level', 'span');
        this.xpText = getElementFromFragment(this._content, 'xp-text', 'span');
        this.intervalText = getElementFromFragment(this._content, 'interval-text', 'span');
        this.fishRatesCont = getElementFromFragment(this._content, 'fish-rates-cont', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setFishUnlocked(fish, area) {
        this.fishName.textContent = fish.product.name;
        this.fishImage.src = fish.product.media;
        showElement(this.fishImage);
        showElement(this.fishName);
        hideElement(this.level);
        hideElement(this.abyssalLevel);
        this.link.onclick = () => game.fishing.onAreaFishSelection(area, fish);
        this.fishName.classList.remove('text-danger');
        this.fishRatesCont.classList.remove('d-none');
    }
    updateRates(fish, fishing) {
        if (fish.baseExperience > 0) {
            this.xpText.textContent = templateLangString('MENU_TEXT_XP_AMOUNT', {
                xp: `${numberWithCommas(Math.floor(fishing.modifyXP(fish.baseExperience, fish)))}`,
            });
        } else if (fish.baseAbyssalExperience > 0) {
            this.xpText.textContent = templateLangString('MENU_TEXT_AXP_AMOUNT', {
                xp: `${numberWithCommas(Math.floor(fishing.modifyAbyssalXP(fish.baseAbyssalExperience, fish)))}`,
            });
        }
        const minInt = fishing.getMinFishInterval(fish) / 1000;
        const maxInt = fishing.getMaxFishInterval(fish) / 1000;
        this.intervalText.textContent = templateLangString('MENU_TEXT_SECONDS_RANGE', {
            minTime: minInt.toFixed(2),
            maxTime: maxInt.toFixed(2),
        });
    }
    setFishLocked(fish, fishing) {
        this.level.textContent = '';
        this.level.append(...templateLangStringWithNodes('MENU_TEXT_UNLOCKED_AT', {
            skillImage: createElement('img', {
                className: 'skill-icon-xs',
                attributes: [
                    ['src', game.fishing.media]
                ],
            }),
        }, {
            level: `${fish.level}`
        }));
        toggleDangerSuccess(this.level, fishing.level >= fish.level);
        this.abyssalLevel.textContent = '';
        if (fish.abyssalLevel >= 1) {
            this.abyssalLevel.append(...templateLangStringWithNodes('UNLOCKED_AT_ABYSSAL_LEVEL', {
                skillImage: createElement('img', {
                    className: 'skill-icon-xs mr-1',
                    attributes: [
                        ['src', game.fishing.media]
                    ],
                }),
            }, {
                level: `${fish.abyssalLevel}`
            }, false));
            toggleDangerSuccess(this.abyssalLevel, fishing.abyssalLevel >= fish.abyssalLevel);
            showElement(this.abyssalLevel);
        } else {
            hideElement(this.abyssalLevel);
        }
        hideElement(this.fishImage);
        hideElement(this.fishName);
        showElement(this.level);
        this.link.onclick = null;
        this.fishName.classList.add('text-danger');
        this.fishRatesCont.classList.add('d-none');
    }
}
window.customElements.define('fishing-area-menu-button', FishingAreaMenuButtonElement);
class FishingContestMenuElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('fishing-contest-menu-template'));
        this.blockTitle = getElementFromFragment(this._content, 'block-title', 'h3');
        this.btnStopContest = getElementFromFragment(this._content, 'btn-stop-contest', 'button');
        this.contestStatus = getElementFromFragment(this._content, 'contest-status', 'h5');
        this.requiredFish = getElementFromFragment(this._content, 'required-fish', 'span');
        this.bestFish = getElementFromFragment(this._content, 'best-fish', 'span');
        this.leaderboard = getElementFromFragment(this._content, 'leaderboard', 'div');
        this.remainingActions = getElementFromFragment(this._content, 'remaining-actions', 'span');
        this.difficultiesContainer = getElementFromFragment(this._content, 'difficulties', 'div');
        this.chosenDifficulty = getElementFromFragment(this._content, 'chosen-difficulty', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setHeader(contest) {
        this.btnStopContest.onclick = () => contest.stopFishingContest(true);
    }
    setDifficulties(contest, difficulties) {
        this.difficultiesContainer.innerHTML = '';
        difficulties.forEach((difficulty, id) => {
            const btn = createElement('button', {
                className: 'btn btn-sm btn-outline-primary m-1',
                text: getLangString(`FISHING_CONTEST_DIFFICULTY_${difficulty}`),
            });
            if (contest.completionTracker[id]) {
                const img = createElement('img', {
                    className: 'skill-icon-xxs ml-2'
                });
                img.src = assets.getURI("assets/media/main/milestones_header.png" /* Assets.SkillMilestones */ );
                btn.appendChild(img);
            }
            if (contest.masteryTracker[id]) {
                const img = createElement('img', {
                    className: 'skill-icon-xxs ml-2'
                });
                img.src = assets.getURI("assets/media/main/mastery_header.png" /* Assets.MasteryIcon */ );
                btn.appendChild(img);
            }
            btn.onclick = () => contest.setFishingContestDifficulty(id);
            this.difficultiesContainer.append(btn);
        });
    }
    setDifficultyText(difficulty) {
        this.chosenDifficulty.textContent = difficulty;
    }
    updateBestFish(result) {
        this.bestFish.textContent = `${formatFixed(result.length, 2)} cm | ${formatFixed(result.weight, 4)} kg`;
    }
    setActiveFish(activeFish) {
        this.requiredFish.textContent = activeFish.fish.name;
    }
    updateContestStatus(active) {
        if (active) {
            this.contestStatus.textContent = getLangString('FISHING_CONTEST_HAS_BEGUN');
            this.contestStatus.classList.replace('text-danger', 'text-success');
            this.difficultiesContainer.classList.add('d-none');
            this.btnStopContest.classList.remove('d-none');
        } else {
            this.contestStatus.textContent = getLangString('FISHING_CONTEST_NOT_STARTED');
            this.contestStatus.classList.replace('text-success', 'text-danger');
            this.difficultiesContainer.classList.remove('d-none');
            this.btnStopContest.classList.add('d-none');
        }
    }
    generateLeaderboard(contest, leaderboard) {
        const positions = [
            getLangString('1st'),
            getLangString('2nd'),
            getLangString('3rd'),
            getLangString('4th'),
            getLangString('5th'),
            getLangString('6th'),
            getLangString('7th'),
            getLangString('8th'),
            getLangString('9th'),
            getLangString('10th'),
        ];
        this.leaderboard.innerHTML = '';
        leaderboard.forEach((entry, id) => {
            const div = createElement('div');
            const name = createElement('span', {
                text: `${positions[id]} ${entry.name}`,
                className: 'mr-2'
            });
            if (entry.isPlayer)
                name.classList.add('text-warning', 'font-w600');
            const result = `${templateLangString('FISHING_CONTEST_SIZE', {
                size: formatFixed(entry.bestResult.length, 2),
            })} | ${templateLangString('FISHING_CONTEST_WEIGHT', {
                weight: formatFixed(entry.bestResult.weight, 4),
            })} | ${getLangString('FISHING_CONTEST_RANK')} ${contest.getFishRanking(entry.bestResult)}`;
            const resultSpan = createElement('span', {
                text: result,
                className: 'text-success'
            });
            div.append(name, resultSpan);
            this.leaderboard.append(div);
        });
    }
    updateLeaderboard(contest, leaderboard) {
        const sortedLeaderboard = leaderboard.sort((a, b) => b.bestResult.weight - a.bestResult.weight);
        this.generateLeaderboard(contest, sortedLeaderboard);
    }
    updateRemainingActions(remainingActions) {
        this.remainingActions.textContent = `${remainingActions}`;
    }
}
window.customElements.define('fishing-contest-menu', FishingContestMenuElement);
//# sourceMappingURL=fishingMenus.js.map
checkFileVersion('?12097')