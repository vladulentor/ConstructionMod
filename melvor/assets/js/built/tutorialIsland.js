"use strict";
class TutorialTask {
    constructor(game, data) {
        /** Current progress in the task */
        this.progress = 0;
        this.id = data.id;
        try {
            this._description = data.description;
            this._media = data.media;
            this.eventMatcher = game.events.constructMatcher(data.eventMatcher);
            this.eventCount = data.eventCount;
            this.countEventQuantity = data.countEventQuantity;
        } catch (e) {
            throw new DataConstructionError(TutorialTask.name, e);
        }
    }
    get description() {
        return getLangString(`TUTORIAL_TASK_${this.id}`);
    }
    get media() {
        return assets.getURI(this._media);
    }
    get complete() {
        return this.progress >= this.eventCount;
    }
}
class TutorialStage extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        this.claimed = false;
        try {
            this.tasks = data.tasks.map((taskData) => {
                return new TutorialTask(game, taskData);
            });
            this.taskPage = game.pages.getObjectSafe(data.taskPage);
            this.skillUnlocks = game.skills.getArrayFromIds(data.skillUnlocks);
            this.rewards = {
                currencies: game.getCurrencyQuantities(data.rewards.currencies),
                items: game.items.getQuantities(data.rewards.items),
            };
            this.allowedShopPurchases = game.shop.purchases.getSetFromIds(data.allowedShopPurchases);
            this.allowedMonsters = game.monsters.getSetFromIds(data.allowedMonsters);
            this.bannedItemSales = game.items.getSetFromIds(data.bannedItemSales);
            this.allowCombat = data.allowCombat;
        } catch (e) {
            throw new DataConstructionError(TutorialStage.name, e, this.id);
        }
    }
    get name() {
        return getLangString(`TUTORIAL_TASK_NAME_${this.localID}`);
    }
    get description() {
        return getLangString(`TUTORIAL_TASK_DESC_${this.localID}`);
    }
    get complete() {
        return this.tasks.every((task) => task.complete);
    }
    get completedTasks() {
        return this.tasks.reduce((prev, task) => {
            if (task.complete)
                prev++;
            return prev;
        }, 0);
    }
    get totalTasks() {
        return this.tasks.length;
    }
    encode(writer) {
        writer.writeBoolean(this.claimed);
        writer.writeUint32(this.tasks.length);
        this.tasks.forEach((task) => {
            writer.writeUint8(task.progress);
        });
        return writer;
    }
    decode(reader, version) {
        this.claimed = reader.getBoolean();
        const numTasks = reader.getUint32();
        for (let i = 0; i < numTasks; i++) {
            const taskProgress = reader.getUint8();
            this.tasks[i].progress = taskProgress;
        }
    }
    resetProgress() {
        this.claimed = false;
        this.tasks.forEach((task) => {
            task.progress = 0;
        });
    }
    setClaimed() {
        this.claimed = true;
        this.tasks.forEach((task) => {
            task.progress = task.eventCount;
        });
    }
}
class TutorialRenderQueue {
    constructor() {
        this.currentStageTasks = false;
        this.currentStageStatus = false;
    }
}
class Tutorial {
    constructor(game) {
        this.game = game;
        /** If the tutorial has been completed */
        this.complete = false;
        /** Items that are allowed to be purchased from the shop */
        this.allowedShopPurchases = new Set();
        /** Monsters that the player is allowed to fight */
        this.allowedMonsters = new Set();
        /** Items which are not allowed to be sold during the stage of the tutorial */
        this.bannedItemSales = new Set();
        /** If the tutorial currently allows accessing combat */
        this.allowCombat = true;
        this.stages = new NamespaceRegistry(this.game.registeredNamespaces, TutorialStage.name);
        this._stagesCompleted = -1;
        this.renderQueue = new TutorialRenderQueue();
        this.stageOrder = new NamespacedArray(this.stages);
    }
    get stagesCompleted() {
        return this._stagesCompleted;
    }
    get totalStages() {
        return this.stageOrder.length;
    }
    /** Returns if the tutorial should start for the account */
    get shouldStart() {
        // Start the tutorial if all skills are under the tutorial level cap, and none have been unlocked
        return (!this.complete &&
            this.game.currentGamemode.hasTutorial &&
            (this.currentStage !== undefined ||
                this.game.skills.every((skill) => {
                    return (skill.level <= skill.tutorialLevelCap &&
                        (this.game.currentGamemode.startingSkills === undefined ||
                            this.game.currentGamemode.startingSkills.has(skill) ||
                            !skill.isUnlocked));
                })));
    }
    registerStages(namespace, data) {
        data.forEach((stageData) => {
            this.stages.registerObject(new TutorialStage(namespace, stageData, this.game));
        });
    }
    registerStageOrder(order) {
        this.stageOrder.registerData(order);
    }
    render() {
        var _a, _b;
        if (this.currentStage === undefined)
            return;
        if (this.renderQueue.currentStageTasks) {
            tutorialMenus.headerStage.updateTasks(this.currentStage);
            tutorialMenus.stages[this._stagesCompleted].updateTasks(this.currentStage);
            tutorialMenus.progress.updateProgress(this);
            this.renderQueue.currentStageTasks = false;
        }
        if (this.renderQueue.currentStageStatus) {
            tutorialMenus.headerStage.updateStageStatus(this.currentStage);
            tutorialMenus.stages[this._stagesCompleted].updateStageStatus(this.currentStage);
            if (this.currentStage.complete) {
                this.removeStageHints(this.currentStage);
                const tutorialSidebar = sidebar.category('').item("melvorD:TutorialIsland" /* PageIDs.TutorialIsland */ );
                (_a = tutorialSidebar.asideEl) === null || _a === void 0 ? void 0 : _a.classList.remove('d-none');
                (_b = tutorialSidebar.rootEl) === null || _b === void 0 ? void 0 : _b.classList.add('farming-glower', 'active');
            }
            this.renderQueue.currentStageStatus = false;
        }
    }
    continueOnLoad() {
        tutorialMenus.progress.init(this);
        if (this._stagesCompleted === -1 || this.currentStage === undefined)
            this.start();
        else {
            this.setupForStage(this.currentStage);
        }
    }
    start() {
        if (this.complete)
            return;
        this.game.skills.forEach((skill) => skill.setUnlock(false));
        this._stagesCompleted = -1;
        this.startNextStage();
    }
    completeTutorial() {
        var _a;
        this.complete = true;
        $('#tutorial-container').addClass('d-none');
        (_a = sidebar.category('').item("melvorD:TutorialIsland" /* PageIDs.TutorialIsland */ ).rootEl) === null || _a === void 0 ? void 0 : _a.classList.add('d-none');
        SwalLocale.fire({
            title: getLangString('TUTORIAL_MISC_8'),
            html: `<h5 class="font-w400 text-success font-size-sm mb-4"><lang-string lang-id="TUTORIAL_MISC_9"></lang-string></h5>
                          <div class="block block-rounded w-100 mb-1"> 
                              <div class="block-content block-content-full block-content-sm font-size-sm text-center pointer-enabled" onClick="openDiscordLink();">
                                  <a class="font-w500 align-items-center" href="#">Join us on<img class="ml-2" src="${assets.getURI('assets/media/main/discord_logo.png')}" height="20px"><i class="fa fa-arrow-alt-circle-right ml-2 opacity-75 font-size-base"></i>
                                  </a>
                              </div>
                          </div>`,
            imageUrl: assets.getURI('assets/media/main/tutorial_island.png'),
            imageWidth: 64,
            imageHeight: 64,
            imageAlt: getLangString('PAGE_NAME_TutorialIsland'),
        });
        this.game.setupCurrentGamemode();
        // Change the page if the player is on an invalid one
        if (this.game.openPage === undefined ||
            this.game.openPage.id === "melvorD:TutorialIsland" /* PageIDs.TutorialIsland */ ||
            (this.game.openPage.skills !== undefined && !this.game.openPage.skills[0].isUnlocked))
            changePage(this.game.currentGamemode.startingPage);
    }
    startNextStage() {
        if (this._stagesCompleted >= 0) {
            const previousStage = this.stageOrder[this._stagesCompleted];
            tutorialMenus.stages[this._stagesCompleted].updateStageStatus(previousStage);
        }
        this._stagesCompleted++;
        if (this._stagesCompleted === this.stageOrder.length) {
            this.completeTutorial();
            return;
        }
        this.currentStage = this.stageOrder[this._stagesCompleted];
        this.currentStage.skillUnlocks.forEach((skill) => skill.setUnlock(true));
        this.currentStage.resetProgress();
        this.setupForStage(this.currentStage);
    }
    setupForStage(stage) {
        var _a, _b;
        this.allowedShopPurchases = stage.allowedShopPurchases;
        this.allowedMonsters = stage.allowedMonsters;
        this.bannedItemSales = stage.bannedItemSales;
        this.allowCombat = stage.allowCombat;
        // Assign listeners
        stage.tasks.forEach((task) => {
            if (!task.complete && task.unassigner === undefined)
                task.unassigner = task.eventMatcher.assignHandler((e) => this.updateTaskProgress(e, task, stage));
        });
        this.setStageMenus(stage);
        this.renderProgress();
        const tutorialSidebar = sidebar.category('').item("melvorD:TutorialIsland" /* PageIDs.TutorialIsland */ );
        (_a = tutorialSidebar.asideEl) === null || _a === void 0 ? void 0 : _a.classList.add('d-none');
        (_b = tutorialSidebar.rootEl) === null || _b === void 0 ? void 0 : _b.classList.remove('farming-glower', 'active');
        this.showStageHints(stage);
    }
    setStageMenus(stage) {
        tutorialMenus.headerStage.setStage(stage, this);
        for (let i = 0; i < this._stagesCompleted + 1; i++) {
            if (tutorialMenus.stages.length < i + 1) {
                const newStage = createElement('tutorial-stage-display', {
                    className: 'col-12 col-lg-6'
                });
                newStage.setStage(this.stageOrder[i], this);
                tutorialMenus.stageContainer.prepend(newStage);
                tutorialMenus.stages.push(newStage);
            }
        }
    }
    renderProgress() {
        tutorialMenus.progress.updateProgress(this);
    }
    showStageHints(stage) {
        var _a;
        if (stage.taskPage.id === "melvorD:Combat" /* PageIDs.Combat */ ) {
            (_a = sidebar.category('Combat').item(stage.taskPage.id).rootEl) === null || _a === void 0 ? void 0 : _a.classList.add('farming-glower', 'active');
        } else if (stage.taskPage.skills !== undefined) {
            const category = sidebar.category(stage.taskPage.skillSidebarCategoryID || 'Non-Combat');
            stage.taskPage.skills.forEach((skill) => {
                var _a;
                (_a = category.item(skill.id).rootEl) === null || _a === void 0 ? void 0 : _a.classList.add('farming-glower', 'active');
            });
        }
        let isCombat = false;
        stage.tasks.forEach((task) => {
            if (task.eventMatcher instanceof MonsterKilledEventMatcher) {
                isCombat = true;
                task.eventMatcher.monsterList.forEach((monster) => {
                    const area = this.game.getMonsterArea(monster);
                    combatAreaMenus.all.forEach((menu, category) => {
                        if (category.areas.includes(area))
                            menu.setTutorialHighlight(area);
                    });
                });
            }
        });
        if (isCombat)
            $('#tutorial-combat').removeClass('d-none');
    }
    removeStageHints(stage) {
        var _a;
        if (stage.taskPage.id === "melvorD:Combat" /* PageIDs.Combat */ ) {
            (_a = sidebar.category('Combat').item(stage.taskPage.id).rootEl) === null || _a === void 0 ? void 0 : _a.classList.remove('farming-glower', 'active');
        } else if (stage.taskPage.skills !== undefined) {
            const hasFarming = stage.taskPage.skills.find((skill) => skill.id === "melvorD:Farming" /* SkillIDs.Farming */ );
            const category = hasFarming ? sidebar.category('Passive') : sidebar.category('Non-Combat');
            stage.taskPage.skills.forEach((skill) => {
                var _a;
                (_a = category.item(skill.id).rootEl) === null || _a === void 0 ? void 0 : _a.classList.remove('farming-glower', 'active');
            });
        }
        let isCombat = false;
        stage.tasks.forEach((task) => {
            if (task.eventMatcher instanceof MonsterKilledEventMatcher) {
                isCombat = true;
                task.eventMatcher.monsterList.forEach((monster) => {
                    const area = this.game.getMonsterArea(monster);
                    combatAreaMenus.all.forEach((menu, category) => {
                        if (category.areas.includes(area))
                            menu.removeTutorialHighlight();
                    });
                });
            }
        });
        if (isCombat)
            $('#tutorial-combat').addClass('d-none');
    }
    updateTaskProgress(event, task, stage) {
        let completeCount = 1;
        if (task.countEventQuantity) {
            if (event instanceof FoodEquippedEvent) {
                completeCount = event.quantity;
            } else if (event instanceof ItemEquippedEvent) {
                completeCount = event.quantity;
            } else if (event instanceof ShopPurchaseMadeEvent) {
                completeCount = event.quantity;
            } else if (event instanceof FarmingPlantActionEvent) {
                completeCount = event.action.seedCost.quantity;
            } else if (event instanceof SkillActionEvent) {
                completeCount = event.productQuantity;
            }
        }
        task.progress += completeCount;
        task.progress = Math.min(task.progress, task.eventCount);
        this.renderQueue.currentStageTasks = true;
        if (task.complete) {
            // Remove listener
            if (task.unassigner !== undefined)
                task.unassigner();
            task.unassigner = undefined;
            // Check if the stage is complete
            if (stage.complete) {
                this.game.combat.notifications.add({
                    type: 'TutorialTask'
                });
                this.renderQueue.currentStageStatus = true;
            }
        }
    }
    claimStageOnClick(stage) {
        if (!stage.complete || stage.claimed)
            return;
        if (!this.game.bank.willItemsFit(stage.rewards.items)) {
            bankFullNotify();
            return;
        }
        stage.rewards.items.forEach(({
            item,
            quantity
        }) => {
            this.game.bank.addItem(item, quantity, false, true, false, true, `Game.TutorialIsland`);
        });
        stage.rewards.currencies.forEach(({
            currency,
            quantity
        }) => currency.add(quantity));
        stage.claimed = true;
        this.startNextStage();
    }
    skipButtonOnClick() {
        if (this.complete)
            return;
        SwalLocale.fire({
            title: getLangString('TUTORIAL_MISC_5'),
            html: `<h5 class="font-w400 text-combat-smoke font-size-sm mb-2"><lang-string lang-id="TUTORIAL_MISC_6"></lang-string></h5>`,
            showCancelButton: true,
            icon: 'warning',
            confirmButtonText: getLangString('TUTORIAL_MISC_7'),
        }).then((result) => {
            if (result.value) {
                this.skipTutorial();
            }
        });
    }
    skipTutorial() {
        this.game.stopActiveAction();
        if (this.currentStage !== undefined) {
            this.currentStage.tasks.forEach((task) => {
                if (task.unassigner !== undefined) {
                    task.unassigner();
                    task.unassigner = undefined;
                }
            });
            this.removeStageHints(this.currentStage);
        }
        this.completeTutorial();
    }
    encode(writer) {
        writer.writeBoolean(this.complete);
        if (!this.complete) {
            writer.writeBoolean(this.currentStage !== undefined);
            if (this.currentStage !== undefined) {
                writer.writeNamespacedObject(this.currentStage);
                this.currentStage.encode(writer);
            }
        }
        return writer;
    }
    decode(reader, version) {
        this.complete = reader.getBoolean();
        if (!this.complete) {
            if (reader.getBoolean()) {
                let currentStage = reader.getNamespacedObject(this.stages);
                if (typeof currentStage === 'string') {
                    if (currentStage.startsWith("melvorD" /* Namespaces.Demo */ ))
                        throw new Error(`Could not decode save. Tutorial stage not registered.`);
                    const skipToStage = this.stages.getObjectByID(`${"melvorD" /* Namespaces.Demo */}:20`);
                    if (skipToStage === undefined)
                        throw new Error(`Could not decode save, Stage 20 not registered.`);
                    currentStage = skipToStage;
                    // Dump old task data
                    reader.getBoolean();
                    const numTasks = reader.getUint32();
                    for (let i = 0; i < numTasks; i++) {
                        reader.getUint8();
                    }
                } else {
                    currentStage.decode(reader, version);
                }
                this.currentStage = currentStage;
                this._stagesCompleted = this.stageOrder.findIndex((stage) => stage === this.currentStage);
            }
            // Update the data of all prior stages
            for (let i = 0; i < this._stagesCompleted; i++) {
                this.stageOrder[i].setClaimed();
            }
        }
    }
    convertFromOldFormat(savegame, idMap) {
        var _a;
        if (savegame.tutorialComplete !== undefined)
            this.complete = savegame.tutorialComplete;
        if (this.complete)
            return;
        const stageID = savegame.tutorialProgress;
        const oldTasks = (_a = savegame.activeTasks[this._stagesCompleted]) === null || _a === void 0 ? void 0 : _a.tasks;
        let currentStage = this.stages.getObjectByID(idMap.tutorialStages[stageID]);
        let loadStageTasks = true;
        if (currentStage === undefined) {
            // In full version tutorial during demo, skip ahead to farming tasks
            loadStageTasks = false;
            currentStage = this.stages.getObjectByID(idMap.tutorialStages[20]);
            if (currentStage === undefined)
                throw new Error('Error converting save. Cannot get tutorial stage. Stage data not registered?');
        }
        this.currentStage = currentStage;
        this._stagesCompleted = this.stageOrder.findIndex((stage) => stage === this.currentStage);
        // Update the data of all prior stages
        for (let i = 0; i < this._stagesCompleted; i++) {
            this.stageOrder[i].setClaimed();
        }
        if (oldTasks === undefined || !loadStageTasks)
            return;
        const stage = this.currentStage;
        let taskID = -1;
        const setTaskProgress = (qty) => {
            taskID++;
            const newTask = stage.tasks[taskID];
            newTask.progress = newTask.eventCount - qty;
        };
        oldTasks.customTasks.forEach(({
            qty
        }) => {
            setTaskProgress(qty);
        });
        oldTasks.items.forEach(({
            qty
        }) => {
            setTaskProgress(qty);
        });
        oldTasks.monsters.forEach(({
            qty
        }) => {
            setTaskProgress(qty);
        });
    }
}
//# sourceMappingURL=tutorialIsland.js.map
checkFileVersion('?12097')