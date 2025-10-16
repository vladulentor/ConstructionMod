"use strict";
class TutorialStageDisplayElement extends HTMLElement {
    constructor() {
        super();
        this.displayedTasks = [];
        this.rewardSpans = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('tutorial-stage-display-template'));
        this.header = getElementFromFragment(this._content, 'header', 'div');
        this.stageStatus = getElementFromFragment(this._content, 'stage-status', 'span');
        this.stageName = getElementFromFragment(this._content, 'stage-name', 'span');
        this.stageDescription = getElementFromFragment(this._content, 'stage-description', 'span');
        this.taskCompletion = getElementFromFragment(this._content, 'task-completion', 'h2');
        this.pageIcon = getElementFromFragment(this._content, 'page-icon', 'img');
        this.pageLink = getElementFromFragment(this._content, 'page-link', 'a');
        this.taskContainer = getElementFromFragment(this._content, 'task-container', 'div');
        this.claimRewardsButton = getElementFromFragment(this._content, 'claim-rewards-button', 'button');
    }
    get displayedStage() {
        return this._displayedStage;
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setStage(stage, tutorial) {
        this.stageName.textContent = stage.name;
        this.stageDescription.textContent = stage.description;
        this.pageIcon.src = stage.taskPage.media;
        this.pageLink.textContent = stage.taskPage.name;
        this.pageLink.onclick = () => changePage(stage.taskPage, -1, undefined, false, false);
        this.claimRewardsButton.onclick = () => tutorial.claimStageOnClick(stage);
        this.updateTasks(stage);
        this.rewardSpans.forEach((span) => span.remove());
        const rewardSpans = [];
        const addRewardSpan = (media, quantity) => {
            const rewardSpan = createElement('span', {
                className: 'font-w600'
            });
            rewardSpan.append(createElement('img', {
                className: 'skill-icon-xs ml-2 mr-1',
                attributes: [
                    ['src', media]
                ]
            }), formatNumber(quantity));
            rewardSpans.push(rewardSpan);
        };
        stage.rewards.currencies.forEach(({
            currency,
            quantity
        }) => {
            addRewardSpan(currency.media, quantity);
        });
        stage.rewards.items.forEach(({
            item,
            quantity
        }) => {
            addRewardSpan(item.media, quantity);
        });
        this.claimRewardsButton.before(...rewardSpans);
        this.rewardSpans = rewardSpans;
        this.updateStageStatus(stage);
        this._displayedStage = stage;
    }
    updateTasks(stage) {
        if (this._displayedStage !== stage) {
            this.taskContainer.textContent = '';
            this.displayedTasks = [];
            stage.tasks.forEach((task) => {
                const description = task.description.replace(`${task.eventCount}`, '${taskQuantity}');
                const container = createElement('dd', {
                    className: 'text-info font-w500 mb-0 p-2'
                });
                const newTask = {
                    taskImage: createElement('img', {
                        className: 'skill-icon-xs mr-1',
                        attributes: [
                            ['src', task.media]
                        ]
                    }),
                    taskQuantity: createElement('span', {
                        text: this.getTaskCount(task)
                    }),
                    taskIcon: createElement('i', {
                        className: this.getTaskIconClass(task)
                    }),
                };
                container.append(newTask.taskIcon, ...templateStringWithNodes(description, newTask, {}, false));
                this.taskContainer.append(container);
                this.displayedTasks.push(newTask);
            });
        } else {
            stage.tasks.forEach((task, i) => {
                const taskDisplay = this.displayedTasks[i];
                taskDisplay.taskQuantity.textContent = this.getTaskCount(task);
                taskDisplay.taskIcon.className = this.getTaskIconClass(task);
            });
        }
    }
    getTaskCount(task) {
        return `${task.complete ? task.eventCount : task.eventCount - task.progress}`;
    }
    getTaskIconClass(task) {
        return `fa mr-2 ${task.complete ? 'fa-check text-success' : 'fa-exclamation text-warning'}`;
    }
    updateTaskCompletion(completedTasks, totalTasks) {
        if (completedTasks >= totalTasks) {
            this.taskCompletion.innerHTML = `<img class="resize-40" src="${assets.getURI("assets/media/main/tick.png" /* Assets.Checkbox */)}">`;
        } else {
            this.taskCompletion.textContent = `${completedTasks.toLocaleString()} / ${totalTasks.toLocaleString()}`;
        }
    }
    updateStageStatus(stage) {
        this.updateTaskCompletion(stage.completedTasks, stage.totalTasks);
        if (stage.complete) {
            if (stage.claimed) {
                this.setClaimed();
            } else {
                this.setCompleted();
            }
        } else {
            this.setActive();
        }
    }
    setActive() {
        this.setHeaderClass('bg-primary');
        this.stageStatus.textContent = getLangString('MENU_TEXT_ACTIVE');
        this.stageStatus.classList.replace('bg-success', 'bg-info');
        hideElement(this.claimRewardsButton);
    }
    setCompleted() {
        this.setHeaderClass('bg-tutorial-claimed');
        this.stageStatus.textContent = getLangString('MISC_STRING_READY_TO_CLAIM');
        this.stageStatus.classList.replace('bg-success', 'bg-info');
        showElement(this.claimRewardsButton);
    }
    setClaimed() {
        this.setHeaderClass('bg-tutorial-claimed');
        this.stageStatus.textContent = getLangString('MISC_STRING_CLAIMED');
        this.stageStatus.classList.replace('bg-info', 'bg-success');
        hideElement(this.claimRewardsButton);
    }
    setHeaderClass(className) {
        this.header.classList.remove('bg-tutorial-claimed', 'bg-primary');
        this.header.classList.add(className);
    }
}
window.customElements.define('tutorial-stage-display', TutorialStageDisplayElement);
class TutorialProgressDisplayElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('tutorial-progress-display-template'));
        this.skipButton = getElementFromFragment(this._content, 'skip-button', 'button');
        this.stagesCompleted = getElementFromFragment(this._content, 'stages-completed', 'span');
        this.totalStages = getElementFromFragment(this._content, 'total-stages', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    init(tutorial) {
        this.skipButton.onclick = () => tutorial.skipButtonOnClick();
        this.totalStages.textContent = `${tutorial.totalStages}`;
        this.updateProgress(tutorial);
    }
    updateProgress(tutorial) {
        this.stagesCompleted.textContent = `${tutorial.stagesCompleted}`;
    }
}
window.customElements.define('tutorial-progress-display', TutorialProgressDisplayElement);
//# sourceMappingURL=tutorialMenus.js.map
checkFileVersion('?12097')