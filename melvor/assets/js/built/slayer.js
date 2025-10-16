"use strict";
class SlayerTaskCategory extends RealmedObject {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.abyssalLevel = 0;
        /** The number of times a task in this category has been completed */
        this.tasksCompleted = 0;
        try {
            this._name = data.name;
            this._reqToast = data.reqToast;
            this._reqText = data.reqText;
            this._unlockText = data.unlockText;
            this._completionText = data.completionText;
            this.rollCost = game.getCurrencyQuantities(data.rollCost);
            this.extensionCost = game.getCurrencyQuantities(data.extensionCost);
            this.extensionMultiplier = data.extensionMultiplier;
            this.level = data.level;
            if (data.abyssalLevel !== undefined)
                this.abyssalLevel = data.abyssalLevel;
            this.currencyRewards = data.currencyRewards.map(({
                id,
                percent
            }) => {
                return {
                    currency: game.currencies.getObjectSafe(id),
                    percent
                };
            });
            switch (data.monsterSelection.type) {
                case 'CombatLevel':
                    this.monsterSelection = data.monsterSelection;
                    break;
                case 'Abyss':
                    {
                        this.monsterSelection = {
                            type: 'Abyss',
                            area: game.abyssDepths.getObjectSafe(data.monsterSelection.areaID),
                        };
                    }
                    break;
            }
            this.baseTaskLength = data.baseTaskLength;
            if (data.previousCategory !== undefined) {
                this.previousCategory = game.combat.slayerTask.categories.getObjectSafe(data.previousCategory);
                this.previousCategory.nextCategory = this;
            }
        } catch (e) {
            throw new DataConstructionError(SlayerTaskCategory.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`SLAYER_TASK_CATEGORY_${this.localID}`);
        }
    }
    get reqToast() {
        if (this.isModded) {
            return this._reqToast;
        } else {
            return getLangString(`TOASTS_SLAYER_TASK_REQUIRED_${this.localID}`);
        }
    }
    get reqText() {
        if (this.isModded) {
            return this._reqText;
        } else {
            return getLangString(`MENU_TEXT_REQUIRES_SLAYER_${this.localID}`);
        }
    }
    get unlockText() {
        if (this.isModded) {
            return this._unlockText;
        } else {
            return getLangString(`MENU_TEXT_UNLOCK_SLAYER_${this.localID}`);
        }
    }
    get completionText() {
        if (this.isModded) {
            return this._completionText;
        } else {
            return getLangString(`MENU_TEXT_COMPLETED_SLAYER_TASK_${this.localID}`);
        }
    }
    /** Gets a filtering function for the monster selection of this category */
    getMonsterFilter() {
        var _a;
        switch (this.monsterSelection.type) {
            case 'CombatLevel':
                {
                    const minLevel = this.monsterSelection.minLevel;
                    const maxLevel = (_a = this.monsterSelection.maxLevel) !== null && _a !== void 0 ? _a : Infinity;
                    return (m) => {
                        const combatLevel = m.combatLevel;
                        return combatLevel >= minLevel && combatLevel <= maxLevel;
                    };
                }
            case 'Abyss':
                {
                    const monsterSet = new Set(this.monsterSelection.area.monsters);
                    return (m) => monsterSet.has(m);
                }
        }
    }
}
class SlayerTaskRenderQueue {
    constructor() {
        this.task = true;
        this.newButton = true;
        this.realmSelect = true;
    }
}
class SlayerTaskCompletedEvent extends GameEvent {
    constructor(category, oldCount, newCount) {
        super();
        this.category = category;
        this.oldCount = oldCount;
        this.newCount = newCount;
    }
}
class SlayerTask extends GameEventEmitter {
    constructor(player, game) {
        super();
        this.player = player;
        this.game = game;
        /** Task is active */
        this.active = false;
        /** Kills left on task */
        this.killsLeft = 0;
        /** Task was extended */
        this.extended = false;
        /** Selected realm for slayer tasks */
        this.realm = this.game.defaultRealm;
        this.taskTimer = new Timer('SlayerTask', () => this.setTask());
        this.autoStartNext = false;
        this.renderQueue = new SlayerTaskRenderQueue();
        this.areaBypassItems = [];
        this.allAreaBypassItems = [];
        this.shouldResetTaskState = false;
        this.categoryRealms = [];
        this.categories = new NamespaceRegistry(game.registeredNamespaces, SlayerTaskCategory.name);
    }
    /** Autoslayer option is on */
    get autoSlayer() {
        return this.game.settings.enableAutoSlayer;
    }
    /** If the current task is an abyssal one */
    get isAbyssal() {
        return this.category !== undefined && this.category.abyssalLevel !== undefined && this.category.abyssalLevel > 0;
    }
    postDataRegistration() {
        this.game.items.equipment.forEach((item) => {
            var _a, _b;
            if ((_a = item.modifiers) === null || _a === void 0 ? void 0 : _a.some((modValue) => modValue.modifier.id === "melvorD:bypassSlayerItems" /* ModifierIDs.bypassSlayerItems */ ))
                this.areaBypassItems.push(item);
            if ((_b = item.modifiers) === null || _b === void 0 ? void 0 : _b.some((modValue) => modValue.modifier.id === "melvorD:bypassAllSlayerItems" /* ModifierIDs.bypassAllSlayerItems */ ))
                this.allAreaBypassItems.push(item);
        });
        const realms = new Set();
        this.categories.forEach((category) => {
            realms.add(category.realm);
        });
        this.categoryRealms = [...realms];
        if (realms.size > 1)
            this.game.on('requirementChange', () => {
                this.renderQueue.realmSelect = true;
            });
    }
    render() {
        if (this.renderQueue.task)
            this.renderTask();
        if (this.renderQueue.newButton)
            this.renderButtonSpinner();
        this.renderRealmSelect();
    }
    /** Callback function for when the jump to task button is clicked */
    jumpToTaskOnClick() {
        if (this.game.combat.isEventActive) {
            notifyPlayer(this.game.attack, getLangString('TOASTS_CANNOT_DURING_EVENT'), 'danger');
        } else if (this.monster !== undefined) {
            this.game.combat.selectMonster(this.monster, this.game.getMonsterArea(this.monster));
        } else {
            console.warn('Tried to jump to slayer task enemy, but no task monster is set.');
        }
    }
    renderTask() {
        if (!this.active || this.category === undefined || this.monster === undefined) {
            combatMenus.slayerTask.setNoTask();
        } else {
            combatMenus.slayerTask.setTaskMonster(this.monster, this.killsLeft, this.category);
            combatMenus.slayerTask.updateTaskExtension(this.extended, this.getExtensionCosts(this.category));
        }
        this.renderQueue.task = false;
    }
    renderButtonSpinner() {
        combatMenus.slayerTask.updateTaskSpinner(this.taskTimer.isActive);
        this.renderQueue.newButton = false;
    }
    renderRealmSelect() {
        if (!this.renderQueue.realmSelect)
            return;
        combatMenus.slayerTask.updateRealmButtons(this);
        this.renderQueue.realmSelect = false;
    }
    extendTask() {
        if (this.category === undefined)
            return;
        const costs = this.getExtensionCosts(this.category);
        if (costs.checkIfOwned()) {
            costs.consumeCosts();
            this.extended = true;
            const level = this.category.abyssalLevel > 0 ? this.game.slayer.abyssalLevel : this.game.slayer.level;
            this.killsLeft += this.category.extensionMultiplier * (10 + Math.floor(level / 5));
            this.renderTask();
        } else {
            notifyPlayer(this.game.slayer, getLangString('TOASTS_CANNOT_AFFORD_THAT'), 'danger');
        }
    }
    addKill() {
        if (this.category === undefined)
            return;
        this.killsLeft--;
        this.game.stats.Slayer.inc(SlayerStats.MonstersKilledOnTask);
        if (this.killsLeft <= 0) {
            const oldCount = this.category.tasksCompleted;
            this.active = false;
            this.category.tasksCompleted++;
            this._events.emit('taskCompleted', new SlayerTaskCompletedEvent(this.category, oldCount, this.category.tasksCompleted));
            this.game.queueRequirementRenders();
            this.selectTask(this.category, false, false);
        }
        this.renderQueue.task = true;
    }
    tick() {
        this.taskTimer.tick();
    }
    getRollCosts(category) {
        const costs = new Costs(this.game);
        const costMultiplier = Math.max(1 + this.game.modifiers.slayerTaskCost / 100, 0);
        category.rollCost.forEach(({
            currency,
            quantity
        }) => {
            quantity *= costMultiplier;
            quantity = Math.floor(quantity);
            costs.addCurrency(currency, quantity);
        });
        return costs;
    }
    getExtensionCosts(category) {
        const costs = new Costs(this.game);
        const costMultiplier = Math.max(1 + this.game.modifiers.slayerTaskExtensionCost / 100, 0);
        category.extensionCost.forEach(({
            currency,
            quantity
        }) => {
            quantity *= costMultiplier; // TODO_C Ensure this renders on player stat recalc
            quantity = Math.floor(quantity);
            costs.addCurrency(currency, quantity);
        });
        return costs;
    }
    selectTask(category, costsCurrency, render, fromClick = false) {
        const costs = this.getRollCosts(category);
        if (costsCurrency && !costs.checkIfOwned()) {
            notifyPlayer(this.game.slayer, getLangString('TOASTS_CANNOT_AFFORD_THAT'), 'danger');
        } else {
            const monsterSelection = this.getMonsterSelection(category);
            if (monsterSelection.length > 0) {
                const newMonster = monsterSelection[rollInteger(0, monsterSelection.length - 1)];
                if (costsCurrency)
                    costs.consumeCosts();
                this.monster = newMonster;
                this.category = category;
                this.active = false;
                this.autoStartNext = !fromClick;
                this.taskTimer.start(1000);
                this.renderQueue.task = true;
                this.renderQueue.newButton = true;
            } else if (this.autoSlayer) {
                notifyPlayer(this.game.slayer, getLangString('TOASTS_NO_TASK_FOUND_EQUIPMENT'), 'danger');
            } else {
                notifyPlayer(this.game.slayer, getLangString('TOASTS_NO_TASK_FOUND_TIER'), 'danger');
            }
        }
        if (render) {
            this.render();
            this.clickNewTask();
        }
    }
    getTaskLength(category) {
        const taskMultiplier = this.player.modifiers.slayerTaskLength;
        const level = category.abyssalLevel > 0 ? this.game.slayer.abyssalLevel : this.game.slayer.level;
        let taskLength = category.abyssalLevel > 0 ?
            Math.floor(0.5 * category.baseTaskLength +
                0.5 * Math.random() * category.baseTaskLength +
                4 * Math.floor(Math.random() * level + 1)) :
            category.baseTaskLength + 4 * Math.floor(Math.random() * level + 1);
        taskLength = applyModifier(taskLength, taskMultiplier);
        return taskLength;
    }
    setTask() {
        if (this.category === undefined)
            throw new Error(`Error setting slayer task, category is not set.`);
        if (this.monster === undefined)
            throw new Error('Error setting slayer task, monster is not set.');
        this.active = true;
        this.extended = false;
        this.killsLeft = this.getTaskLength(this.category);
        this.renderQueue.task = true;
        this.renderQueue.newButton = true;
        if (this.autoSlayer && this.autoStartNext && !this.game.combat.isEventActive)
            this.game.combat.selectMonster(this.monster, this.game.getMonsterArea(this.monster));
    }
    /** Returns the monsters available at a slayer tier */
    getMonsterSelection(category) {
        const categoryFilter = category.getMonsterFilter();
        return this.game.monsters.filter((monster) => {
            const monsterArea = this.game.getMonsterArea(monster);
            let slayerLevelReq = 0;
            if (monsterArea instanceof SlayerArea)
                slayerLevelReq = monsterArea.slayerLevelRequired;
            return (monster.canSlayer &&
                monsterArea.realm === category.realm &&
                categoryFilter(monster) &&
                this.checkRequirements(monsterArea.entryRequirements, !this.autoSlayer, slayerLevelReq) &&
                monster !== this.monster);
        });
    }
    /** Callback function for when the new task button is clicked */
    clickNewTask() {
        if (combatMenus.slayerTask.taskSelectionOpen) {
            combatMenus.slayerTask.closeTaskSelection();
        } else if (!this.game.slayer.isUnlocked) {
            lockedSkillAlert(this.game.slayer, 'SKILL_UNLOCK_ACCESS_THIS');
        } else {
            combatMenus.slayerTask.setRealm(this.realm);
            combatMenus.slayerTask.updateTaskSelectButtons(this.game);
            combatMenus.slayerTask.openTaskSelection();
        }
    }
    changeSelectedRealm(realm) {
        if (this.realm === realm)
            return;
        this.realm = realm;
        combatMenus.slayerTask.setRealm(realm);
    }
    /** Checks the requirements of an area */
    checkRequirements(requirements, softReq, slayerLevelReq) {
        return requirements.every((requirement) => {
            if (requirement.type === 'SlayerItem' && softReq) {
                const itemList = [requirement.item, ...this.allAreaBypassItems];
                if (slayerLevelReq < 100)
                    itemList.push(...this.areaBypassItems);
                return itemList.some((item) => this.game.stats.itemFindCount(item) > 0);
            } else {
                return this.game.checkRequirement(requirement, false, slayerLevelReq);
            }
        });
    }
    getTaskCompletionsForTierAndAbove(category) {
        let total = 0;
        while (category !== undefined) {
            total += category.tasksCompleted;
            category = category.nextCategory;
        }
        return total;
    }
    /** Returns the total number of tasks completed in all categories */
    getTotalTasksCompleted() {
        return this.categories.reduce((prev, category) => {
            return prev + category.tasksCompleted;
        }, 0);
    }
    getTaskCompletionSnapshot() {
        return new Map(this.categories.allObjects.map((c) => [c, c.tasksCompleted]));
    }
    resetTaskState() {
        this.active = false;
        this.monster = undefined;
        this.killsLeft = 0;
        this.extended = false;
        this.category = undefined;
        this.taskTimer.stop();
    }
    encode(writer) {
        writer.writeBoolean(this.active);
        writer.writeBoolean(this.monster !== undefined);
        if (this.monster)
            writer.writeNamespacedObject(this.monster);
        writer.writeUint32(this.killsLeft);
        writer.writeBoolean(this.extended);
        writer.writeBoolean(this.category !== undefined);
        if (this.category !== undefined)
            writer.writeNamespacedObject(this.category);
        writer.writeArray(this.categories.allObjects, (category) => {
            writer.writeNamespacedObject(category);
            writer.writeUint32(category.tasksCompleted);
        });
        this.taskTimer.encode(writer);
        writer.writeNamespacedObject(this.realm);
        return writer;
    }
    decode(reader, version) {
        this.active = reader.getBoolean();
        if (reader.getBoolean()) {
            const monster = reader.getNamespacedObject(this.game.monsters);
            if (typeof monster === 'string')
                this.shouldResetTaskState = true;
            else
                this.monster = monster;
        }
        this.killsLeft = reader.getUint32();
        this.extended = reader.getBoolean();
        if (version >= 100 /* SaveVersion.IntoTheAbyss */ ) {
            if (reader.getBoolean()) {
                const category = reader.getNamespacedObject(this.categories);
                if (typeof category !== 'string')
                    this.category = category;
                else
                    this.shouldResetTaskState = true;
            }
            reader.getArray((reader) => {
                const category = reader.getNamespacedObject(this.categories);
                const tasksCompleted = reader.getUint32();
                if (typeof category !== 'string')
                    category.tasksCompleted = tasksCompleted;
            });
        } else {
            const tier = reader.getUint8();
            const completion = reader.getArray((reader) => reader.getUint32());
            this.setCategoriesFromOldData(tier, completion);
        }
        this.taskTimer.decode(reader, version);
        if (version >= 100 /* SaveVersion.IntoTheAbyss */ ) {
            let realm = reader.getNamespacedObject(this.game.realms);
            if (typeof realm === 'string')
                realm = this.game.defaultRealm;
            this.realm = realm;
        }
        if (this.shouldResetTaskState)
            this.resetTaskState();
    }
    deserialize(reader, version, idMap) {
        this.active = reader.getBool();
        const monsterID = reader.getNumber();
        const monster = this.game.monsters.getObjectByID(idMap.monsters[monsterID]);
        if (monster === undefined)
            this.shouldResetTaskState = true;
        else
            this.monster = monster;
        this.killsLeft = reader.getNumber();
        this.extended = reader.getBool();
        const tier = reader.getNumber();
        const numTiers = version < 18 ? 5 : 7;
        const completion = reader.getChunk(numTiers);
        this.setCategoriesFromOldData(tier, completion);
        if (this.shouldResetTaskState)
            this.resetTaskState();
    }
    convertFromOldSaveFormat(oldTasks, oldCompletion, idMap) {
        var _a, _b;
        let tier = 0;
        if (oldTasks.length !== 0) {
            const oldTask = oldTasks[0];
            const monster = this.game.monsters.getObjectByID(idMap.monsters[oldTask.monsterID]);
            if (monster !== undefined) {
                this.active = true;
                this.monster = monster;
                this.killsLeft = oldTask.count;
                this.extended = (_a = oldTask.extended) !== null && _a !== void 0 ? _a : false;
                tier = (_b = oldTask.tier) !== null && _b !== void 0 ? _b : 0;
            }
        }
        this.setCategoriesFromOldData(tier, oldCompletion);
    }
    /** Sets the category property and tasksCompleted properties from pre v100 saves */
    setCategoriesFromOldData(tier, completion) {
        const category = this.categories.getObjectByID(SlayerTask.TIER_CATEGORY_MAP[tier]);
        if (category === undefined)
            this.shouldResetTaskState = true;
        else
            this.category = category;
        completion.forEach((count, tier) => {
            const category = this.categories.getObjectByID(SlayerTask.TIER_CATEGORY_MAP[tier]);
            if (category !== undefined)
                category.tasksCompleted = count;
        });
    }
}
SlayerTask.TIER_CATEGORY_MAP = {
    0: "melvorF:Easy" /* SlayerTaskCategoryIDs.Easy */ ,
    1: "melvorF:Normal" /* SlayerTaskCategoryIDs.Normal */ ,
    2: "melvorF:Hard" /* SlayerTaskCategoryIDs.Hard */ ,
    3: "melvorF:Elite" /* SlayerTaskCategoryIDs.Elite */ ,
    4: "melvorF:Master" /* SlayerTaskCategoryIDs.Master */ ,
    5: "melvorTotH:Legendary" /* SlayerTaskCategoryIDs.Legendary */ ,
    6: "melvorTotH:Mythical" /* SlayerTaskCategoryIDs.Mythical */ ,
};
class SlayerTaskMenuElement extends HTMLElement {
    constructor() {
        super();
        this.selectTaskButtons = new Map();
        this.selectRealmButtons = new Map();
        this.taskSelectionOpen = false;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('slayer-task-menu-template'));
        this.slayerIcon = getElementFromFragment(this._content, 'slayer-icon', 'img');
        this.newTaskSpinner = getElementFromFragment(this._content, 'new-task-spinner', 'div');
        this.newTaskButton = getElementFromFragment(this._content, 'new-task-button', 'a');
        this.newTaskButtonText = getElementFromFragment(this._content, 'new-task-button-text', 'small');
        this.selectTaskContainer = getElementFromFragment(this._content, 'select-task-container', 'div');
        this.selectRealmContainer = getElementFromFragment(this._content, 'select-realm-container', 'div');
        this.locatingContent = getElementFromFragment(this._content, 'locating-content', 'div');
        this.monsterContainer = getElementFromFragment(this._content, 'monster-container', 'h5');
        this.monsterImage = getElementFromFragment(this._content, 'monster-image', 'img');
        this.monsterLevel = getElementFromFragment(this._content, 'monster-level', 'span');
        this.monsterAttackType = getElementFromFragment(this._content, 'monster-attack-type', 'img');
        this.taskTier = getElementFromFragment(this._content, 'task-tier', 'small');
        this.monsterName = getElementFromFragment(this._content, 'monster-name', 'div');
        this.jumpToEnemyButton = getElementFromFragment(this._content, 'jump-to-enemy-button', 'button');
        this.extendContainer = getElementFromFragment(this._content, 'extend-container', 'h5');
        this.extendMessage = getElementFromFragment(this._content, 'extend-message', 'span');
        this.extendTaskButton = getElementFromFragment(this._content, 'extend-task-button', 'a');
        this.extendTaskCost = getElementFromFragment(this._content, 'extend-task-cost', 'small');
        this.autoSlayerCheckBox = getElementFromFragment(this._content, 'auto-slayer-checkbox', 'settings-checkbox');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.slayerIconTooltip = tippy(this.slayerIcon, {
            content: getLangString('SKILL_NAME_Slayer'),
            placement: 'bottom',
            interactive: false,
            animation: false,
        });
    }
    disconnectedCallback() {
        if (this.slayerIconTooltip !== undefined) {
            this.slayerIconTooltip.destroy();
            this.slayerIconTooltip = undefined;
        }
    }
    initialize(game) {
        // Populate the task selection buttons
        const realms = new Set();
        game.combat.slayerTask.categories.forEach((category) => {
            if (category.level > game.slayer.currentLevelCap)
                return;
            realms.add(category.realm);
            const taskButton = createElement('button', {
                className: 'btn btn-sm btn-secondary font-w400 font-size-sm m-1 w-100',
            });
            taskButton.onclick = () => game.combat.slayerTask.selectTask(category, true, true, true);
            this.selectTaskButtons.set(category, taskButton);
            this.selectTaskContainer.append(taskButton);
        });
        game.combat.slayerTask.categoryRealms.forEach((realm) => {
            const realmButton = createElement('button', {
                className: 'btn btn-sm btn-outline-light font-size-sm',
                parent: this.selectRealmContainer,
            });
            createElement('img', {
                className: 'skill-icon-xs mr-2',
                attributes: [
                    ['src', realm.media]
                ],
                parent: realmButton,
            });
            realmButton.append(realm.name);
            realmButton.onclick = () => game.combat.slayerTask.changeSelectedRealm(realm);
            this.selectRealmButtons.set(realm, realmButton);
        });
        this.jumpToEnemyButton.onclick = () => game.combat.slayerTask.jumpToTaskOnClick();
        this.extendTaskButton.onclick = () => game.combat.slayerTask.extendTask();
        this.newTaskButton.onclick = () => game.combat.slayerTask.clickNewTask();
    }
    setNoTask() {
        hideElement(this.monsterContainer);
        hideElement(this.extendContainer);
    }
    setTaskMonster(monster, killsLeft, category) {
        showElement(this.monsterContainer);
        showElement(this.extendContainer);
        this.monsterImage.src = monster.media;
        this.monsterImage.onclick = () => viewMonsterStats(monster);
        this.monsterLevel.textContent = `${numberWithCommas(monster.combatLevel)}`;
        this.monsterAttackType.src = assets.getURI(MonsterSelectTableElement.attackTypeMedia[monster.attackType]);
        this.taskTier.textContent = category.name;
        this.monsterName.textContent = `${killsLeft} x ${monster.name}`;
    }
    updateTaskExtension(isExtended, costs) {
        if (isExtended) {
            showElement(this.extendMessage);
            hideElement(this.extendTaskButton);
        } else {
            hideElement(this.extendMessage);
            showElement(this.extendTaskButton);
            this.extendTaskCost.textContent = '';
            this.extendTaskCost.append(getLangString('EXTEND_TASK_FOR'));
            costs.getCurrencyQuantityArray().forEach(({
                currency,
                quantity
            }) => {
                this.extendTaskCost.append(createElement('img', {
                    className: 'skill-icon-xxs mr-1',
                    attributes: [
                        ['src', currency.media]
                    ]
                }), numberWithCommas(quantity));
            });
        }
    }
    openTaskSelection() {
        this.taskSelectionOpen = true;
        this.newTaskButtonText.textContent = getLangString('CHARACTER_SELECT_45');
        this.newTaskButton.classList.replace('combat-action', 'text-danger');
        showElement(this.selectTaskContainer);
    }
    closeTaskSelection() {
        this.taskSelectionOpen = false;
        this.newTaskButtonText.textContent = getLangString('COMBAT_MISC_22');
        this.newTaskButton.classList.replace('text-danger', 'combat-action');
        hideElement(this.selectTaskContainer);
    }
    updateTaskSelectButtons(game) {
        const slayerLevel = game.slayer.level;
        const aSlayerLevel = game.slayer.abyssalLevel;
        game.combat.slayerTask.categories.forEach((category) => {
            const button = this.selectTaskButtons.get(category);
            if (button === undefined)
                return;
            button.textContent = '';
            if (slayerLevel >= category.level && aSlayerLevel >= category.abyssalLevel) {
                const costs = game.combat.slayerTask.getRollCosts(category);
                const costClass = costs.checkIfOwned() ? 'text-success' : 'text-danger';
                const combatImage = createElement('img', {
                    className: 'skill-icon-xs ml-2'
                });
                const selection = category.monsterSelection;
                let selectionText;
                switch (selection.type) {
                    case 'CombatLevel':
                        combatImage.src = assets.getURI("assets/media/skills/combat/combat.png" /* Assets.Combat */ );
                        selectionText = `${selection.minLevel}${selection.maxLevel === undefined ? '+' : ` - ${selection.maxLevel}`}`;
                        button.append(category.name, combatImage, selectionText);
                        break;
                    case 'Abyss':
                        combatImage.src = assets.getURI("assets/media/skills/combat/abyssal_damage.png" /* Assets.AbyssalDamage */ );
                        selectionText = category.name;
                        button.append(combatImage, selectionText);
                        break;
                }
                if (costs.isFree) {
                    button.append(createElement('span', {
                        className: `${costClass} ml-2`,
                        text: getLangString('COMBAT_MISC_COST_FREE')
                    }));
                } else {
                    costs.getCurrencyQuantityArray().forEach(({
                        currency,
                        quantity
                    }) => {
                        button.append(createElement('img', {
                            className: 'skill-icon-xs ml-2',
                            attributes: [
                                ['src', currency.media]
                            ]
                        }), createElement('span', {
                            className: costClass,
                            text: numberWithCommas(quantity)
                        }));
                    });
                }
                if (costs.checkIfOwned()) {
                    button.disabled = false;
                    button.classList.remove('disabled');
                } else {
                    button.disabled = true;
                    button.classList.add('disabled');
                }
            } else {
                const slayerImage = createElement('img', {
                    className: `skill-icon-xs ml-2`,
                    attributes: [
                        ['src', assets.getURI("assets/media/skills/slayer/slayer.png" /* Assets.Slayer */ )]
                    ],
                });
                button
                    .appendChild(createElement('span', {
                        className: slayerLevel >= category.level ? 'text-success' : 'text-danger'
                    }))
                    .append(...templateLangStringWithNodes('MENU_TEXT_REQUIRES_SKILL_LEVEL', {
                        skillImage: slayerImage
                    }, {
                        level: `${category.level}`
                    }));
                if (category.abyssalLevel > 0) {
                    button.append(createElement('br'));
                    button
                        .appendChild(createElement('span', {
                            className: aSlayerLevel >= category.abyssalLevel ? 'text-success' : 'text-danger',
                        }))
                        .append(...templateLangStringWithNodes('REQUIRES_ABYSSAL_LEVEL', {
                            skillImage: slayerImage.cloneNode()
                        }, {
                            level: `${category.abyssalLevel}`
                        }));
                }
                button.classList.add('disabled');
                button.disabled = true;
            }
        });
    }
    updateTaskSpinner(isSelecting) {
        if (isSelecting) {
            hideElement(this.newTaskButton);
            showElement(this.newTaskSpinner);
            showElement(this.locatingContent);
        } else {
            showElement(this.newTaskButton);
            hideElement(this.newTaskSpinner);
            hideElement(this.locatingContent);
        }
    }
    toggleAutoSlayerCheckbox(unlocked) {
        if (unlocked) {
            showElement(this.autoSlayerCheckBox);
        } else {
            hideElement(this.autoSlayerCheckBox);
        }
    }
    /** Changes the task categories to only show those from the given realm */
    setRealm(realm) {
        this.selectTaskButtons.forEach((button, category) => {
            if (category.realm === realm) {
                showElement(button);
            } else {
                hideElement(button);
            }
        });
    }
    updateRealmButtons(task) {
        const unlockedRealms = task.categoryRealms.filter((realm) => realm.isUnlocked);
        if (unlockedRealms.length > 1) {
            showElement(this.selectRealmContainer);
            this.selectRealmButtons.forEach((button, realm) => {
                if (realm.isUnlocked)
                    showElement(button);
                else
                    hideElement(button);
            });
        } else {
            hideElement(this.selectRealmContainer);
        }
    }
}
window.customElements.define('slayer-task-menu', SlayerTaskMenuElement);
//# sourceMappingURL=slayer.js.map
checkFileVersion('?12097')