"use strict";
class TownshipTaskCategory extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        /** The total number of tasks in this category */
        this.totalTasks = 0;
        /** The number of tasks that have been completed in this category */
        this.completedTasks = 0;
        /** The number of tasks that are currently ready in this category */
        this.tasksReady = 0;
        try {
            this._name = data.name;
            if (data.nameLang !== undefined)
                this._nameLang = data.nameLang;
            this._media = data.media;
            this.bgClass = data.bgClass;
        } catch (e) {
            throw new DataConstructionError(TownshipTaskCategory.name, e, this.id);
        }
    }
    get name() {
        if (this._nameLang !== undefined)
            return getLangString(this._nameLang);
        return this._name;
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get isComplete() {
        return this.completedTasks >= this.totalTasks;
    }
}
class TownshipTaskRewards {
    constructor(data, game) {
        this.currencies = [];
        try {
            if (data.currencies)
                this.currencies = game.getCurrencyQuantities(data.currencies);
            // TODO_D - deprecated property support
            if (data.gp)
                this.currencies.push({
                    currency: game.gp,
                    quantity: data.gp
                });
            if (data.slayerCoins)
                this.currencies.push({
                    currency: game.slayerCoins,
                    quantity: data.slayerCoins
                });
            this.items = game.items.getQuantities(data.items);
            this.skillXP = data.skillXP.map(({
                id,
                quantity
            }) => {
                return {
                    skill: game.skills.getObjectSafe(id),
                    quantity
                };
            });
            this.townshipResources = game.township.getResourceQuantityFromData(data.townshipResources);
        } catch (e) {
            throw new DataConstructionError(TownshipTaskRewards.name, e);
        }
    }
}
class TownshipTaskGoal {
    constructor(game) {
        this.game = game;
        this._events = mitt();
        this.isMet = false;
        this._eventHandler = (e) => {
            if (!this._isEventValid(e))
                return;
            const met = this._metWithEvent(e);
            if (met !== this.isMet)
                this._events.emit('metChanged', met);
            if (!this.isMet)
                this._events.emit('progressChanged'); // TODO_C Is this bugged for when progress goes backwards from being met?
            this.isMet = met;
            if (!this.isReversible && met)
                this._unassignHandler(this._eventHandler);
        };
    }
    get noEventsHandled() {
        var _a, _b;
        return !((_a = this._events.all.get('metChanged')) === null || _a === void 0 ? void 0 : _a.length) && !((_b = this._events.all.get('progressChanged')) === null || _b === void 0 ? void 0 : _b.length);
    }
    /** Assigns an event handler for when this goal being met changes */
    onMetChanged(callback) {
        this._preSubscribe();
        this._events.on('metChanged', callback);
    }
    /** Unassigns an event handler for when this goal being met changes */
    offMetChanged(callback) {
        this._events.off('metChanged', callback);
        this._postUnsubscribe();
    }
    /** Assigns an event handler for when this goals progress changes */
    onProgressChanged(callback) {
        this._preSubscribe();
        this._events.on('progressChanged', callback);
    }
    /** Unassigns an event handler for when this goals progress changes */
    offProgressChanged(callback) {
        this._events.off('progressChanged', callback);
        this._postUnsubscribe();
    }
    /** Checks if an event is valid to increase progress */
    _isEventValid(e) {
        return true;
    }
    _preSubscribe() {
        if (this.noEventsHandled) {
            this.isMet = this.checkIfMet();
            if (!this.isMet || this.isReversible)
                this._assignHandler(this._eventHandler);
        }
    }
    _postUnsubscribe() {
        if (this.noEventsHandled) {
            this._unassignHandler(this._eventHandler);
        }
    }
}
class TownshipItemGoal extends TownshipTaskGoal {
    constructor(data, game) {
        super(game);
        this.isReversible = true;
        try {
            this.item = game.items.getObjectSafe(data.id);
            this.quantity = data.quantity;
        } catch (e) {
            throw new DataConstructionError(TownshipItemGoal.name, e);
        }
    }
    get progress() {
        return 0;
    }
    resetProgress() {}
    setProgress(progress) {}
    checkIfMet() {
        return this.game.bank.getQty(this.item) >= this.quantity;
    }
    getDescriptionHTML() {
        const progress = Math.min(this.game.bank.getQty(this.item), this.quantity);
        return templateLangString('TOWNSHIP_TASKS_REQ_3', {
            qty1: numberWithCommas(progress),
            qty2: numberWithCommas(this.quantity),
            itemImg: `<img class="skill-icon-xs mr-1" src="${this.item.media}">`,
            itemName: this.item.name,
        });
    }
    _metWithEvent(e) {
        return e.newQuantity >= this.quantity;
    }
    _assignHandler(handler) {
        this.item.on('bankQuantityChanged', handler);
    }
    _unassignHandler(handler) {
        this.item.off('bankQuantityChanged', handler);
    }
}
class TownshipMonsterGoal extends TownshipTaskGoal {
    constructor(data, game) {
        super(game);
        this.isReversible = false;
        try {
            this.monster = game.monsters.getObjectSafe(data.id);
            this.quantity = data.quantity;
        } catch (e) {
            throw new DataConstructionError(TownshipItemGoal.name, e);
        }
    }
    checkIfMet() {
        return this.game.stats.monsterKillCount(this.monster) >= this.quantity;
    }
    getDescriptionHTML() {
        const progress = Math.min(this.game.stats.monsterKillCount(this.monster), this.quantity);
        return templateLangString('TOWNSHIP_TASKS_REQ_2', {
            qty1: numberWithCommas(progress),
            qty2: numberWithCommas(this.quantity),
            monsterImg: `<img class="skill-icon-xs mr-1" src="${this.monster.media}">`,
            monsterName: this.monster.name,
        });
    }
    _metWithEvent(e) {
        return this.checkIfMet();
    }
    _assignHandler(handler) {
        this.monster.on('killed', handler);
    }
    _unassignHandler(handler) {
        this.monster.off('killed', handler);
    }
}
class TownshipCasualMonsterGoal extends TownshipMonsterGoal {
    constructor() {
        super(...arguments);
        this._progress = 0;
    }
    get progress() {
        return this._progress;
    }
    resetProgress() {
        this._progress = 0;
    }
    setProgress(progress) {
        this._progress = progress;
    }
    checkIfMet() {
        return this._progress >= this.quantity;
    }
    getDescriptionHTML() {
        const progress = Math.min(this._progress, this.quantity);
        return templateLangString('TOWNSHIP_TASKS_REQ_2', {
            qty1: numberWithCommas(progress),
            qty2: numberWithCommas(this.quantity),
            monsterImg: `<img class="skill-icon-xs mr-1" src="${this.monster.media}">`,
            monsterName: this.monster.name,
        });
    }
    _metWithEvent(e) {
        this._progress++;
        return this.checkIfMet();
    }
}
class TownshipMonsterWithItemsGoal extends TownshipTaskGoal {
    constructor(data, game) {
        super(game);
        this.isReversible = false;
        this._progress = 0;
        try {
            this.monster = game.monsters.getObjectSafe(data.monsterID);
            this.quantity = data.quantity;
            this.items = game.items.equipment.getArrayFromIds(data.itemIDs);
        } catch (e) {
            throw new DataConstructionError(TownshipItemGoal.name, e);
        }
    }
    get progress() {
        return this._progress;
    }
    resetProgress() {
        this._progress = 0;
    }
    setProgress(progress) {
        this._progress = progress;
    }
    checkIfMet() {
        return this._progress >= this.quantity;
    }
    getDescriptionHTML() {
        const progress = Math.min(this._progress, this.quantity);
        return templateString(getLangString('TOWNSHIP_TASKS_REQ_4'), {
            qty1: numberWithCommas(progress),
            qty2: numberWithCommas(this.quantity),
            monsterIcon: `<img class="skill-icon-xs mr-1" src="${this.monster.media}">`,
            monsterName: `<span class="font-w600">${this.monster.name}</span>`,
            itemIcon: `<span class="font-w600">${this.items
                .map((item) => `<img class="skill-icon-xs mr-1" src="${item.media}">${item.name}`)
                .join('')}</span>`,
            itemName: '',
        });
    }
    _isEventValid(e) {
        return this.items.every((item) => e.player.equipment.checkForItem(item));
    }
    _metWithEvent(e) {
        this._progress++;
        return this.checkIfMet();
    }
    _assignHandler(handler) {
        this.monster.on('killed', handler);
    }
    _unassignHandler(handler) {
        this.monster.off('killed', handler);
    }
}
class TownshipSkillXPGoal extends TownshipTaskGoal {
    constructor(data, game) {
        super(game);
        this.isReversible = false;
        try {
            this.skill = game.skills.getObjectSafe(data.id);
            this.quantity = data.quantity;
        } catch (e) {
            throw new DataConstructionError(TownshipSkillXPGoal.name, e);
        }
    }
    checkIfMet() {
        return this.skill.xp >= this.quantity;
    }
    getDescriptionHTML() {
        const progress = Math.min(this.skill.xp, this.quantity);
        return templateLangString('TOWNSHIP_TASKS_REQ_0', {
            qty1: numberWithCommas(progress),
            qty2: numberWithCommas(this.quantity),
            skillIcon: `<img class="skill-icon-xs mr-1" src="${this.skill.media}">`,
            skillName: this.skill.name,
        });
    }
    _metWithEvent(e) {
        return this.checkIfMet();
    }
    _assignHandler(handler) {
        this.skill.on('xpEarned', handler);
    }
    _unassignHandler(handler) {
        this.skill.off('xpEarned', handler);
    }
}
class TownshipCasualSkillXPGoal extends TownshipSkillXPGoal {
    constructor() {
        super(...arguments);
        this._progress = 0;
    }
    get progress() {
        return this._progress;
    }
    resetProgress() {
        this._progress = 0;
    }
    checkIfMet() {
        return this._progress >= this.quantity;
    }
    setProgress(progress) {
        this._progress = progress;
    }
    getDescriptionHTML() {
        const progress = Math.min(this._progress, this.quantity);
        return templateLangString('TOWNSHIP_TASKS_REQ_0', {
            qty1: numberWithCommas(progress),
            qty2: numberWithCommas(this.quantity),
            skillIcon: `<img class="skill-icon-xs mr-1" src="${this.skill.media}">`,
            skillName: this.skill.name,
        });
    }
    _metWithEvent(e) {
        this._progress += e.newXP - e.oldXP;
        return this.checkIfMet();
    }
}
class TownshipPoiDiscoveryGoal extends TownshipTaskGoal {
    constructor(data, game) {
        super(game);
        this.isReversible = false;
        try {
            if (game.cartography === undefined)
                throw new Error('Cartography not registered.');
            this.cartography = game.cartography;
            this.worldMap = game.cartography.worldMaps.getObjectSafe(data.worldMapID);
            this.quantity = data.quantity;
        } catch (e) {
            throw new DataConstructionError(TownshipPoiDiscoveryGoal.name, e);
        }
    }
    checkIfMet() {
        return this.worldMap.discoveredPOIs.length >= this.quantity;
    }
    getDescriptionHTML() {
        const progress = Math.min(this.worldMap.discoveredPOIs.length, this.quantity);
        return templateString(getLangString('TOWNSHIP_TASKS_REQ_5'), {
            qty1: numberWithCommas(progress),
            qty2: numberWithCommas(this.quantity),
            skillIcon: `<img class="skill-icon-xs mr-1" src="${assets.getURI("assets/media/skills/cartography/cartography.png" /* Assets.Cartography */)}">`,
            worldName: this.worldMap.name,
        });
    }
    _isEventValid(e) {
        return e.worldMap === this.worldMap;
    }
    _metWithEvent(e) {
        return this.checkIfMet();
    }
    _assignHandler(handler) {
        this.cartography.on('poiDiscovered', handler);
    }
    _unassignHandler(handler) {
        this.cartography.off('poiDiscovered', handler);
    }
}
class TownshipMapRefinementGoal extends TownshipTaskGoal {
    constructor(data, game) {
        super(game);
        this.isReversible = false;
        try {
            if (game.cartography === undefined)
                throw new Error('Cartography not registered.');
            this.cartography = game.cartography;
            this.quantity = data;
        } catch (e) {
            throw new DataConstructionError(TownshipMapRefinementGoal.name, e);
        }
    }
    checkIfMet() {
        return this.game.stats.Cartography.get(21 /* CartographyStats.RefinementsPurchased */ ) >= this.quantity;
    }
    getDescriptionHTML() {
        const progress = Math.min(this.game.stats.Cartography.get(21 /* CartographyStats.RefinementsPurchased */ ), this.quantity);
        return templateString(getLangString('TOWNSHIP_TASKS_REQ_6'), {
            qty1: numberWithCommas(progress),
            qty2: numberWithCommas(this.quantity),
            mapIcon: `<img class="skill-icon-xs mr-1" src="${assets.getURI("assets/media/skills/archaeology/map_colour.png" /* Assets.FullMapSlot */)}">`,
            skillIcon: `<img class="skill-icon-xs mr-1" src="${assets.getURI("assets/media/skills/cartography/cartography.png" /* Assets.Cartography */)}">`,
        });
    }
    _metWithEvent(e) {
        return this.checkIfMet();
    }
    _assignHandler(handler) {
        this.cartography.on('mapRefinement', handler);
    }
    _unassignHandler(handler) {
        this.cartography.off('mapRefinement', handler);
    }
}
class BaseTownshipTaskGoals {
    constructor() {
        this.itemGoals = [];
        this.allGoals = [];
        this._events = mitt();
        this._goalsMet = 0;
        this._onGoalMet = (goalMet) => {
            const wasMet = this._goalsMet === this.allGoals.length;
            if (goalMet)
                this._goalsMet++;
            else
                this._goalsMet--;
            const allMet = this._goalsMet === this.allGoals.length;
            if (wasMet !== allMet)
                this._events.emit('metChanged', allMet);
        };
        this._onGoalProgress = () => {
            this._events.emit('progressChanged');
        };
    }
    get noMetEventsHandled() {
        var _a;
        return !((_a = this._events.all.get('metChanged')) === null || _a === void 0 ? void 0 : _a.length);
    }
    get noProgressEventsHandled() {
        var _a;
        return !((_a = this._events.all.get('progressChanged')) === null || _a === void 0 ? void 0 : _a.length);
    }
    checkIfMet() {
        return this.allGoals.every((goal) => goal.checkIfMet());
    }
    /** Assigns an event handler for when all goals being met changes */
    onMetChanged(callback) {
        if (this.noMetEventsHandled) {
            this._goalsMet = 0;
            this.allGoals.forEach((goal) => {
                if (goal.checkIfMet())
                    this._goalsMet++;
                goal.onMetChanged(this._onGoalMet);
            });
        }
        this._events.on('metChanged', callback);
    }
    /** Unassigns an event handler for when all goals being met changes */
    offMetChanged(callback) {
        this._events.off('metChanged', callback);
        if (this.noMetEventsHandled) {
            this.allGoals.forEach((goal) => {
                goal.offMetChanged(this._onGoalMet);
            });
        }
    }
    /** Assigns an event handler for when any of the goals progress */
    onGoalProgress(callback) {
        if (this.noProgressEventsHandled) {
            this.allGoals.forEach((goal) => {
                goal.onProgressChanged(this._onGoalProgress);
            });
        }
        this._events.on('progressChanged', callback);
    }
    /** Unassigns an event handler for when any of the goals progress */
    offGoalProgress(callback) {
        this._events.off('progressChanged', callback);
        if (this.noProgressEventsHandled) {
            this.allGoals.forEach((goal) => {
                goal.offProgressChanged(this._onGoalProgress);
            });
        }
    }
    removeItemsFromBank(game) {
        this.itemGoals.forEach((goal) => {
            game.bank.removeItemQuantity(goal.item, goal.quantity, true);
        });
    }
}
class TownshipTaskGoals extends BaseTownshipTaskGoals {
    constructor(data, game) {
        var _a, _b, _c, _d;
        super();
        try {
            (_a = data.items) === null || _a === void 0 ? void 0 : _a.forEach((data) => {
                const goal = new TownshipItemGoal(data, game);
                this.itemGoals.push(goal);
                this.allGoals.push(goal);
            });
            (_b = data.monsters) === null || _b === void 0 ? void 0 : _b.forEach((data) => {
                this.allGoals.push(new TownshipMonsterGoal(data, game));
            });
            (_c = data.skillXP) === null || _c === void 0 ? void 0 : _c.forEach((data) => {
                this.allGoals.push(new TownshipSkillXPGoal(data, game));
            });
            (_d = data.numPOIs) === null || _d === void 0 ? void 0 : _d.forEach((data) => {
                this.allGoals.push(new TownshipPoiDiscoveryGoal(data, game));
            });
            if (data.numRefinements !== undefined)
                this.allGoals.push(new TownshipMapRefinementGoal(data.numRefinements, game));
        } catch (e) {
            throw new DataConstructionError(TownshipTaskGoals.name, e);
        }
    }
}
class TownshipCasualTaskGoals extends BaseTownshipTaskGoals {
    constructor(data, game) {
        var _a, _b, _c, _d;
        super();
        try {
            (_a = data.items) === null || _a === void 0 ? void 0 : _a.forEach((data) => {
                const goal = new TownshipItemGoal(data, game);
                this.itemGoals.push(goal);
                this.allGoals.push(goal);
            });
            (_b = data.monsters) === null || _b === void 0 ? void 0 : _b.forEach((data) => {
                this.allGoals.push(new TownshipCasualMonsterGoal(data, game));
            });
            (_c = data.monsterWithItems) === null || _c === void 0 ? void 0 : _c.forEach((data) => {
                this.allGoals.push(new TownshipMonsterWithItemsGoal(data, game));
            });
            (_d = data.skillXP) === null || _d === void 0 ? void 0 : _d.forEach((data) => {
                this.allGoals.push(new TownshipCasualSkillXPGoal(data, game));
            });
        } catch (e) {
            throw new DataConstructionError(TownshipCasualTaskGoals.name, e);
        }
    }
    resetProgress() {
        this.allGoals.every((goal) => goal.resetProgress());
    }
}
class BaseTownshipTask extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        try {
            this._description = data.description;
            this.rewards = new TownshipTaskRewards(data.rewards, game);
        } catch (e) {
            throw new DataConstructionError(BaseTownshipTask.name, e, this.id);
        }
    }
    get description() {
        if (this._description === undefined)
            return '';
        if (this.isModded)
            return this._description;
        return getLangString(`TOWNSHIP_TASKS_${this.localID}_description`);
    }
    get hasDescription() {
        return this._description !== undefined;
    }
}
class TownshipTask extends BaseTownshipTask {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        try {
            this.goals = new TownshipTaskGoals(data.goals, game);
            const categoryID = data.category.includes(':') ? data.category : `${"melvorF" /* Namespaces.Full */}:${data.category}`;
            this.category = game.township.tasks.categories.getObjectSafe(categoryID);
            if (data.realm === undefined)
                this.realm = game.defaultRealm;
            else
                this.realm = game.realms.getObjectSafe(data.realm);
        } catch (e) {
            throw new DataConstructionError(TownshipTask.name, e, this.id);
        }
    }
    get name() {
        return getLangString('MISC_STRING_TASK');
    }
}
class DummyTownshipTask extends TownshipTask {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            category: "melvorF:Easy" /* TownshipTaskCategoryIDs.Easy */ ,
            goals: {},
            rewards: {
                items: [],
                skillXP: [],
                townshipResources: [],
            },
        }, game);
    }
}
class TownshipCasualTask extends BaseTownshipTask {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        /** Requirements that must be met before this task is available to the player */
        this.requirements = [];
        try {
            this.goals = new TownshipCasualTaskGoals(data.goals, game);
            if (data.requirements !== undefined)
                this.requirements = game.getRequirementsFromData(data.requirements);
        } catch (e) {
            throw new DataConstructionError(TownshipCasualTask.name, e, this.id);
        }
    }
    get name() {
        return getLangString('TOWNSHIP_TASKS_DAILY_TASK');
    }
}
class DummyTownshipCasualTask extends TownshipCasualTask {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            goals: {},
            rewards: {
                items: [],
                skillXP: [],
                townshipResources: [],
            },
            requirements: [],
        }, game);
    }
}
class TownshipCasualTaskRenderQueue {
    constructor() {
        this.taskTimer = false;
        this.tasksRemaining = false;
        this.tasksCompleted = false;
        this.currentTasks = false;
        this.tasksReady = false;
        this.taskGoals = new Set();
    }
}
class TownshipCasualTasks {
    constructor(game) {
        this.game = game;
        this.MAX_CASUAL_TASKS = 5;
        this.NEW_TASK_INTERVAL = 5 * 60 * 60 * 1000;
        this.GP_COST_TO_SKIP = 10000000;
        this.currentCasualTasks = [];
        this.allCasualTasks = new NamespaceRegistry(this.game.registeredNamespaces, TownshipCasualTask.name);
        this.casualTasksCompleted = 0;
        this.newTaskTimer = new Timer('Skill', this.addNewTask.bind(this));
        this.renderQueue = new TownshipCasualTaskRenderQueue();
        this._totalTasksReady = 0;
        this._taskUnlisteners = new Map();
        this._progressUnlisteners = new Map();
    }
    get timeToNextTask() {
        return this.newTaskTimer.ticksLeft * TICK_INTERVAL;
    }
    get availableDailyTasks() {
        return this.allCasualTasks.allObjects.filter((task) => !this.currentCasualTasks.includes(task) && isRequirementMet(task.requirements));
    }
    /** If any casual task is ready to be completed */
    get isAnyTaskReady() {
        return this._totalTasksReady > 0;
    }
    registerTasks(namespace, taskData) {
        taskData.forEach((data) => this.allCasualTasks.registerObject(new TownshipCasualTask(namespace, data, this.game)));
    }
    get gpCostToSkip() {
        return Math.min(exp.levelToXP(game.township.level + 1), this.GP_COST_TO_SKIP);
    }
    get xpReward() {
        return Math.floor((exp.levelToXP(this.game.township.level + 1) - exp.levelToXP(this.game.township.level)) * 0.09);
    }
    /** Remaps the quantities of casual task currency rewards to scaling values */
    mapCurrencyRewards(currencies) {
        return currencies.map(({
            currency,
            quantity
        }) => {
            switch (currency.id) {
                case "melvorD:GP" /* CurrencyIDs.GP */ :
                    quantity = this.xpReward * 5;
                    break;
                case "melvorD:SlayerCoins" /* CurrencyIDs.SlayerCoins */ :
                    quantity = this.game.slayer.level * 1000;
                    break;
            }
            return {
                currency,
                quantity
            };
        });
    }
    onLoad() {
        if (!this.newTaskTimer.isActive)
            this.startTaskTimer();
        this.setupTaskHandlers();
        this.renderQueue.taskTimer = true;
        this.renderQueue.tasksRemaining = true;
        this.renderQueue.tasksCompleted = true;
        this.renderQueue.tasksReady = true;
    }
    setupTaskHandlers() {
        this.currentCasualTasks.forEach((task) => this.addTaskHandler(task));
    }
    addTaskHandler(task) {
        if (task.goals.checkIfMet())
            this._totalTasksReady++;
        const handler = (isMet) => this.onTaskMet(task, isMet);
        task.goals.onMetChanged(handler);
        this._taskUnlisteners.set(task, () => task.goals.offMetChanged(handler));
    }
    onTaskMet(task, isMet) {
        if (isMet) {
            this._totalTasksReady++;
        } else {
            this._totalTasksReady--;
        }
        this.game.township.renderQueue.taskReadyIcon = true;
        this.renderQueue.tasksReady = true;
        this.renderQueue.taskGoals.add(task);
    }
    tick() {
        this.newTaskTimer.tick();
        if (this.newTaskTimer.ticksLeft % TICKS_PER_SECOND === 0)
            this.renderQueue.taskTimer = true;
    }
    render() {
        this.renderTaskTimer();
        this.renderTasksRemaining();
        this.renderTasksCompleted();
        this.renderCurrentTasks();
        this.renderTasksReady();
        this.renderTaskGoals();
    }
    renderTaskTimer() {
        if (!this.renderQueue.taskTimer)
            return;
        townshipUI.tasks.updateCasualTaskTimer(this);
        this.renderQueue.taskTimer = false;
    }
    renderTasksRemaining() {
        if (!this.renderQueue.tasksRemaining)
            return;
        townshipUI.tasks.updateCasualTasksRemaining(this);
        this.renderQueue.tasksRemaining = false;
    }
    renderTasksCompleted() {
        if (!this.renderQueue.tasksCompleted)
            return;
        townshipUI.tasks.updateCasualTasksCompleted(this);
        this.renderQueue.tasksCompleted = false;
    }
    renderCurrentTasks() {
        if (!this.renderQueue.currentTasks)
            return;
        townshipUI.tasks.setCasualTasks(this);
        this.renderQueue.currentTasks = false;
    }
    renderTasksReady() {
        if (!this.renderQueue.tasksReady)
            return;
        townshipUI.tasks.updateCasualReady(this);
        this.renderQueue.tasksReady = false;
    }
    renderTaskGoals() {
        if (this.renderQueue.taskGoals.size === 0)
            return;
        this.renderQueue.taskGoals.forEach((task) => {
            townshipUI.tasks.updateCasualTaskGoals(task);
        });
        this.renderQueue.taskGoals.clear();
    }
    assignProgressListeners() {
        this.unassignProgressListeners();
        this.currentCasualTasks.forEach((task) => {
            const handler = () => {
                this.renderQueue.taskGoals.add(task);
            };
            task.goals.onGoalProgress(handler);
            this._progressUnlisteners.set(task, () => task.goals.offGoalProgress(handler));
        });
    }
    unassignProgressListeners() {
        this._progressUnlisteners.forEach((unlistener) => unlistener());
        this._progressUnlisteners.clear();
    }
    skipTask(task) {
        if (this.game.gp.amount < this.gpCostToSkip)
            return;
        this.game.gp.remove(this.gpCostToSkip);
        this.game.telemetry.createGPAdjustedEvent(-this.gpCostToSkip, this.game.gp.amount, `Skill.${this.game.township.id}.SkipCasualTask`);
        this.removeTask(task, task.goals.checkIfMet());
    }
    addTask(task) {
        if (this.currentCasualTasks.length >= this.MAX_CASUAL_TASKS)
            return;
        this.currentCasualTasks.push(task);
        task.goals.resetProgress();
        this.renderQueue.tasksRemaining = true;
        this.addTaskHandler(task);
        this.game.township.renderQueue.taskReadyIcon = true;
        this.renderQueue.tasksReady = true;
        this.renderQueue.currentTasks = true;
    }
    removeTask(task, wasReady) {
        var _a, _b;
        const index = this.currentCasualTasks.indexOf(task);
        if (index === -1)
            return;
        this.currentCasualTasks.splice(index, 1);
        this.renderQueue.tasksRemaining = true;
        townshipUI.tasks.removeCasualTask(task);
        if (this.currentCasualTasks.length === 0)
            townshipUI.tasks.showAllCategories();
        if (wasReady)
            this._totalTasksReady--;
        this.game.township.renderQueue.taskReadyIcon = true;
        this.renderQueue.tasksReady = true;
        (_a = this._taskUnlisteners.get(task)) === null || _a === void 0 ? void 0 : _a();
        this._taskUnlisteners.delete(task);
        (_b = this._progressUnlisteners.get(task)) === null || _b === void 0 ? void 0 : _b();
        this._progressUnlisteners.delete(task);
    }
    addNewDailyTask() {
        if (this.currentCasualTasks.length >= this.MAX_CASUAL_TASKS)
            return;
        const availableTasks = this.availableDailyTasks;
        if (availableTasks.length === 0)
            return;
        const randomTask = getRandomArrayElement(availableTasks);
        this.addTask(randomTask);
    }
    isTaskComplete(task) {
        return task.goals.checkIfMet();
    }
    completeTask(task) {
        if (!this.isTaskComplete(task))
            return;
        task.goals.removeItemsFromBank(this.game);
        this.giveTaskRewards(task);
        this.renderQueue.tasksCompleted = true;
        this.removeTask(task, true);
        this.casualTasksCompleted++;
    }
    giveTaskRewards(task) {
        const rewards = new Rewards(this.game);
        rewards.setSource(`Skill.${this.game.township.id}.TaskReward`);
        this.mapCurrencyRewards(task.rewards.currencies).forEach(({
            currency,
            quantity
        }) => {
            quantity += this.game.modifiers.getValue("melvorD:flatCurrencyGain" /* ModifierIDs.flatCurrencyGain */ , currency.modQuery);
            rewards.addCurrency(currency, quantity);
        });
        task.rewards.items.forEach(({
            item,
            quantity
        }) => {
            rewards.addItem(item, quantity);
        });
        task.rewards.skillXP.forEach(({
            skill
        }) => {
            rewards.addXP(skill, this.xpReward);
        });
        task.rewards.townshipResources.forEach(({
            resource,
            quantity
        }) => {
            let qtyToAdd = Math.min(quantity, game.township.getMaxStorage() - game.township.getUsedStorage());
            if (qtyToAdd < 0)
                qtyToAdd = 0;
            resource.amount += qtyToAdd;
            this.game.township.renderQueue.resourceAmounts = true;
        });
        rewards.giveRewards(true);
    }
    startTaskTimer() {
        const syncOffset = this.game.township.timeToNextUpdate % 1000; // Makes the timers sync up when rendering
        this.newTaskTimer.start(this.NEW_TASK_INTERVAL + syncOffset);
    }
    addNewTask() {
        this.addNewDailyTask();
        this.startTaskTimer();
    }
    encode(writer) {
        writer.writeInt32(this.casualTasksCompleted);
        writer.writeArray(this.currentCasualTasks, (task, writer) => {
            writer.writeNamespacedObject(task);
            writer.writeArray(task.goals.allGoals, (goal, writer) => writer.writeFloat64(goal.progress));
        });
        this.newTaskTimer.encode(writer);
        return writer;
    }
    decode(reader, version) {
        this.casualTasksCompleted = reader.getUint32();
        const skippedTasks = [];
        if (version >= 116 /* SaveVersion.TownshipTaskRefactor */ ) {
            this.currentCasualTasks = reader.getArray((reader) => {
                const task = reader.getNamespacedObject(this.allCasualTasks);
                const taskProgress = reader.getArray((reader) => reader.getFloat64());
                if (typeof task !== 'string') {
                    if (taskProgress.length !== task.goals.allGoals.length)
                        return undefined;
                    task.goals.allGoals.forEach((goal, i) => goal.setProgress(taskProgress[i]));
                    return task;
                }
            });
        } else {
            let i = -1;
            this.currentCasualTasks = reader.getArray((reader) => {
                i++;
                const task = reader.getNamespacedObject(this.allCasualTasks);
                if (typeof task !== 'string')
                    return task;
                skippedTasks.push(i);
                return undefined;
            });
        }
        if (version < 47)
            reader.getFloat64(); // Old lastTask property
        if (version < 116 /* SaveVersion.TownshipTaskRefactor */ ) {
            let trackerIdx = 0;
            let taskIdx = 0;
            reader.getArray((reader) => {
                const currentMonsterCounts = reader.getArray((reader) => {
                    reader.skipBytes(8);
                    return reader.getUint32();
                });
                const currentSkillXP = reader.getArray((reader) => {
                    reader.skipBytes(8);
                    return reader.getUint32();
                });
                reader.skipArrayBytes(12); // Skip building tracking
                const monsterWithItemsProgress = reader.getArray((reader) => {
                    const progress = reader.getUint32();
                    reader.skipBytes(8);
                    return progress;
                });
                if (!skippedTasks.includes(trackerIdx)) {
                    const task = this.currentCasualTasks[taskIdx];
                    const goals = task.goals.allGoals;
                    let goalIdx = 0;
                    let goalFound = false;
                    currentMonsterCounts.forEach((count) => {
                        goalFound = false;
                        while (!goalFound && goalIdx < goals.length) {
                            const goal = goals[goalIdx];
                            if (goal instanceof TownshipCasualMonsterGoal) {
                                goal.setProgress(this.game.stats.monsterKillCount(goal.monster) - count);
                                goalFound = true;
                            }
                            goalIdx++;
                        }
                    });
                    goalIdx = 0;
                    currentSkillXP.forEach((count) => {
                        goalFound = false;
                        while (!goalFound && goalIdx < goals.length) {
                            const goal = goals[goalIdx];
                            if (goal instanceof TownshipCasualSkillXPGoal) {
                                goal.setProgress(goal.skill.xp - count);
                                goalFound = true;
                            }
                            goalIdx++;
                        }
                    });
                    goalIdx = 0;
                    monsterWithItemsProgress.forEach((progress) => {
                        goalFound = false;
                        while (!goalFound && goalIdx < goals.length) {
                            const goal = goals[goalIdx];
                            if (goal instanceof TownshipMonsterWithItemsGoal) {
                                goal.setProgress(progress);
                                goalFound = true;
                            }
                            goalIdx++;
                        }
                    });
                    taskIdx++;
                }
                trackerIdx++;
            });
        }
        if (version >= 47)
            this.newTaskTimer.decode(reader, version);
    }
}
class TownshipTasksRenderQueue {
    constructor() {
        /** Updates the total tasks completed in a realm */
        this.realmTaskCompletion = new Set();
        /** Updates the total tasks completed in a category */
        this.categoryTaskCompletion = new Set();
        /** Updates the goals/claim button for a task */
        this.taskGoals = new Set();
        /** Updates the task ready icon for a task category */
        this.taskCategoryReady = new Set();
    }
}
class TownshipTasks extends GameEventEmitter {
    constructor(game) {
        super();
        this.game = game;
        this.completedTasks = new Set();
        this.categories = new NamespaceRegistry(this.game.registeredNamespaces, TownshipTaskCategory.name);
        this.tasks = new NamespaceRegistry(this.game.registeredNamespaces, TownshipTask.name);
        this._totalTasksReady = 0;
        this._tasksCompleted = 0;
        this._totalTasksPerRealm = new SparseNumericMap();
        this._tasksCompletedPerRealm = new SparseNumericMap();
        this.renderQueue = new TownshipTasksRenderQueue();
        this._taskUnlisteners = new Map();
        this._progressUnlisteners = new Map();
    }
    get tasksCompleted() {
        return this._tasksCompleted;
    }
    /** The number of different realms that have tasks belonging to them */
    get numberOfTaskRealms() {
        return this._totalTasksPerRealm.size;
    }
    /** If any task is ready to be completed */
    get isAnyTaskReady() {
        return this._totalTasksReady > 0;
    }
    registerCategories(namespace, data) {
        data.forEach((data) => this.categories.registerObject(new TownshipTaskCategory(namespace, data, this.game)));
    }
    registerTasks(namespace, taskData) {
        taskData.forEach((data) => this.tasks.registerObject(new TownshipTask(namespace, data, this.game)));
    }
    postDataRegistration() {
        this.tasks.forEach((task) => {
            task.category.totalTasks++;
            this._totalTasksPerRealm.inc(task.realm);
        });
    }
    /**
     * Initialization function for Township tasks on game load
     */
    onLoad() {
        this.computeTasksCompleted();
        this._totalTasksPerRealm.forEach((_, realm) => {
            this.renderQueue.realmTaskCompletion.add(realm);
        });
        this.categories.forEach((category) => {
            this.renderQueue.categoryTaskCompletion.add(category);
            this.renderQueue.taskCategoryReady.add(category);
        });
        this.setupTaskHandlers();
    }
    computeTasksCompleted() {
        this._tasksCompleted = 0;
        this.completedTasks.forEach((task) => {
            if (task instanceof DummyTownshipTask)
                return;
            this._tasksCompleted++;
            task.category.completedTasks++;
            this._tasksCompletedPerRealm.inc(task.realm);
        });
    }
    setupTaskHandlers() {
        this.tasks.forEach((task) => {
            if (this.completedTasks.has(task))
                return;
            if (task.goals.checkIfMet()) {
                this._totalTasksReady++;
                task.category.tasksReady++;
            }
            const handler = (isMet) => this.onTaskMet(task, isMet);
            task.goals.onMetChanged(handler);
            this._taskUnlisteners.set(task, () => task.goals.offMetChanged(handler));
        });
    }
    onTaskMet(task, isMet) {
        if (isMet) {
            this._totalTasksReady++;
            task.category.tasksReady++;
        } else {
            this._totalTasksReady--;
            task.category.tasksReady--;
        }
        this.game.township.renderQueue.taskReadyIcon = true;
        this.renderQueue.taskCategoryReady.add(task.category);
        this.renderQueue.taskGoals.add(task);
    }
    render() {
        this.renderRealmTaskCompletion();
        this.renderCategoryTaskCompletion();
        this.renderTaskGoals();
        this.renderCategoryReady();
    }
    renderRealmTaskCompletion() {
        if (this.renderQueue.realmTaskCompletion.size === 0)
            return;
        this.renderQueue.realmTaskCompletion.forEach((realm) => {
            townshipUI.tasks.updateRealmCompletion(this, realm);
        });
        this.renderQueue.realmTaskCompletion.clear();
    }
    renderCategoryTaskCompletion() {
        if (this.renderQueue.categoryTaskCompletion.size === 0)
            return;
        this.renderQueue.categoryTaskCompletion.forEach((category) => {
            townshipUI.tasks.updateCategoryCompletion(this, category);
        });
        this.renderQueue.categoryTaskCompletion.clear();
    }
    renderTaskGoals() {
        if (this.renderQueue.taskGoals.size === 0)
            return;
        this.renderQueue.taskGoals.forEach((task) => townshipUI.tasks.updateTaskGoals(task));
        this.renderQueue.taskGoals.clear();
    }
    renderCategoryReady() {
        if (this.renderQueue.taskCategoryReady.size === 0)
            return;
        this.renderQueue.taskCategoryReady.forEach((category) => townshipUI.tasks.updateCategoryReady(category));
        this.renderQueue.taskCategoryReady.clear();
    }
    assignProgressListeners(tasks) {
        this.unassignProgressListeners();
        tasks.forEach((task) => {
            const handler = () => {
                this.renderQueue.taskGoals.add(task);
            };
            task.goals.onGoalProgress(handler);
            this._progressUnlisteners.set(task, () => task.goals.offGoalProgress(handler));
        });
    }
    unassignProgressListeners() {
        this._progressUnlisteners.forEach((unlistener) => unlistener());
        this._progressUnlisteners.clear();
    }
    /**
     * Gets the number of tasks that have been completed that belong to a given realm
     * @param realm The realm the tasks belong to
     * @returns The number of tasks completed
     */
    getTasksCompletedInRealm(realm) {
        return this._tasksCompletedPerRealm.get(realm);
    }
    /**
     * Gets the total number of tasks that belong to a given realm
     * @param realm The realm the tasks belong to
     * @returns The total number of tasks
     */
    getNumberOfTasksInRealm(realm) {
        return this._totalTasksPerRealm.get(realm);
    }
    /**
     * Function to perform task completion and checks
     * @param task
     */
    completeTask(task, giveRewards = true, forceComplete = false) {
        var _a, _b;
        if (task.goals.checkIfMet() || forceComplete) {
            if (giveRewards) {
                task.goals.removeItemsFromBank(this.game);
                this.giveTaskRewards(task);
            }
            this.completedTasks.add(task);
            this._tasksCompleted++;
            task.category.completedTasks++;
            this._tasksCompletedPerRealm.inc(task.realm);
            this.renderQueue.realmTaskCompletion.add(task.realm);
            this.renderQueue.categoryTaskCompletion.add(task.category);
            this.notifyTaskComplete();
            townshipUI.tasks.removeTask(task);
            if (task.category.isComplete)
                townshipUI.tasks.showAllCategories();
            this._totalTasksReady--;
            task.category.tasksReady--;
            (_a = this._taskUnlisteners.get(task)) === null || _a === void 0 ? void 0 : _a();
            this._taskUnlisteners.delete(task);
            (_b = this._progressUnlisteners.get(task)) === null || _b === void 0 ? void 0 : _b();
            this._progressUnlisteners.delete(task);
            this.game.township.renderQueue.taskReadyIcon = true;
            this.renderQueue.taskCategoryReady.add(task.category);
            this._events.emit('townshipTaskCompleted', new TownshipTaskCompletedEvent(task));
            this.game.renderQueue.birthdayEventProgress = true;
        }
    }
    notifyTaskComplete() {
        this.game.combat.notifications.add({
            type: 'Player',
            args: [game.township, getLangString('TOWNSHIP_TASKS_TASK_COMPLETE'), 'success'],
        });
    }
    giveTaskRewards(task) {
        const rewards = new Rewards(this.game);
        rewards.setSource(`Skill.${this.game.township.id}.TaskReward`);
        task.rewards.currencies.forEach(({
            currency,
            quantity
        }) => {
            quantity += this.game.modifiers.getValue("melvorD:flatCurrencyGain" /* ModifierIDs.flatCurrencyGain */ , currency.modQuery);
            currency.add(quantity);
        });
        task.rewards.items.forEach(({
            item,
            quantity
        }) => {
            rewards.addItem(item, quantity);
        });
        task.rewards.skillXP.forEach(({
            skill,
            quantity
        }) => {
            rewards.addXP(skill, quantity);
        });
        task.rewards.townshipResources.forEach(({
            resource,
            quantity
        }) => {
            resource.amount += quantity;
            this.game.township.renderQueue.resourceAmounts = true;
        });
        rewards.giveRewards(true);
    }
}
//# sourceMappingURL=townshipTasks.js.map
checkFileVersion('?12097')