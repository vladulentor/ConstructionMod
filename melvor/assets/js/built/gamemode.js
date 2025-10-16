"use strict";
class Gamemode extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        /** Modifiers that are disabled in the gamemode */
        this.disabledModifiers = [];
        /** Skill cap increases that can be unlocked in this gamemode */
        this.levelCapIncreases = [];
        /** Determine if player can gain XP above level cap */
        this.allowXPOverLevelCap = true;
        /** If all forms of preservation (Items, Runes, Ammo, Prayer Points, Summoning Tablets, Food, Potion Charges, Dig Site Map Actions) should be disabled */
        this.disablePreservation = false;
        /** If item doubling for skills should be disabled */
        this.disableItemDoubling = false;
        /** If the active gameplay warning should be shown for this gamemode on the character select screen. */
        this.hasActiveGameplay = false;
        /** If ancient relics can be dropped from skills in this gamemode. Only available with the Atlas of Discovery Expansion. */
        this.allowAncientRelicDrops = false;
        /** Determines what passives are always applied to every enemy */
        this.enemyPassives = [];
        /** Determines what special attacks are always applied to every enemy */
        this.enemySpecialAttacks = [];
        /** Determines if skills with unlock requirements are allowed to be automatically unlocked in this gamemode */
        this.useDefaultSkillUnlockRequirements = false;
        /** Overrides to the default unlock requirments for skills in this gamemode */
        this.skillUnlockRequirements = new Map();
        /** Determines if the gamemode should enable instant actions on a click */
        this.enableInstantActions = false;
        /** If set, gamemode will only display if using these languages */
        this.enabledLangs = [];
        this.hasOldLevelCaps = false;
        try {
            this._name = data.name;
            if (data.description !== undefined)
                this._description = data.description;
            this._rules = data.rules;
            this._media = data.media;
            this.textClass = data.textClass;
            this.btnClass = data.btnClass;
            this.isPermaDeath = data.isPermaDeath;
            this.isEvent = data.isEvent;
            if (data.startDate !== undefined)
                this.startDate = data.startDate;
            this.endDate = data.endDate;
            this._combatTriangle = data.combatTriangle;
            this.hitpointMultiplier = data.hitpointMultiplier;
            this.hasRegen = data.hasRegen;
            this.capNonCombatSkillLevels = data.capNonCombatSkillLevels;
            this.startingPage = game.pages.getObjectSafe(data.startingPage);
            this.startingItems = game.items.getQuantities(data.startingItems);
            this.allowSkillUnlock = data.allowSkillUnlock;
            if (data.startingSkills !== undefined)
                this.startingSkills = game.skills.getSetFromIds(data.startingSkills);
            this.skillUnlockCost = data.skillUnlockCost;
            if (data.playerCombatEffects !== undefined)
                this.playerCombatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(data.playerCombatEffects);
            if (data.enemyCombatEffects !== undefined)
                this.enemyCombatEffects = game.getCombatEffectApplicatorsWithTriggersFromData(data.enemyCombatEffects);
            this.hasTutorial = data.hasTutorial;
            if (data.defaultInitialLevelCap !== undefined)
                this.defaultInitialLevelCap = data.defaultInitialLevelCap;
            if (data.initialLevelCaps !== undefined)
                this.initialLevelCaps = game.getSkillValuesFromData(data.initialLevelCaps);
            if (data.defaultInitialAbyssalLevelCap !== undefined)
                this.defaultInitialAbyssalLevelCap = data.defaultInitialAbyssalLevelCap;
            if (data.initialAbyssalLevelCaps !== undefined)
                this.initialAbyssalLevelCaps = game.getSkillValuesFromData(data.initialAbyssalLevelCaps);
            if (data.levelCapIncreases !== undefined)
                this.levelCapIncreases = game.skillLevelCapIncreases.getArrayFromIds(data.levelCapIncreases);
            if (data.levelCapCost !== undefined)
                this.levelCapCost = new LevelCapIncreaseCost(data.levelCapCost, game);
            if (data.abyssalLevelCapCost !== undefined)
                this.abyssalLevelCapCost = new LevelCapIncreaseCost(data.abyssalLevelCapCost, game);
            if (data.allowXPOverLevelCap !== undefined)
                this.allowXPOverLevelCap = data.allowXPOverLevelCap;
            if (data.disablePreservation !== undefined)
                this.disablePreservation = data.disablePreservation;
            if (data.disableItemDoubling !== undefined)
                this.disableItemDoubling = data.disableItemDoubling;
            if (data.hasActiveGameplay !== undefined)
                this.hasActiveGameplay = data.hasActiveGameplay;
            if (data.allowAncientRelicDrops !== undefined && cloudManager.hasAoDEntitlementAndIsEnabled)
                this.allowAncientRelicDrops = data.allowAncientRelicDrops;
            if (data.overrideMaxHitpoints !== undefined)
                this.overrideMaxHitpoints = data.overrideMaxHitpoints;
            if (data.enemyPassives !== undefined) {
                this.enemyPassives = game.combatPassives.getArrayFromIds(data.enemyPassives);
            }
            if (data.enemySpecialAttacks !== undefined) {
                this.enemySpecialAttacks = data.enemySpecialAttacks.map((attackID) => {
                    const attack = game.specialAttacks.getObjectSafe(attackID);
                    const chance = attack.defaultChance;
                    return {
                        attack,
                        chance
                    };
                });
            }
            if (data.requireLocalStorageKey !== undefined)
                this.requireLocalStorageKey = data.requireLocalStorageKey;
            if (data.enableInstantActions !== undefined)
                this.enableInstantActions = data.enableInstantActions;
            if (data.enabledLangs !== undefined)
                this.enabledLangs = data.enabledLangs;
            if (data.useDefaultSkillUnlockRequirements !== undefined)
                this.useDefaultSkillUnlockRequirements = data.useDefaultSkillUnlockRequirements;
            if (data.pre99RollConversion !== undefined)
                this.pre99RollConversion = game.skillLevelCapIncreases.getObjectSafe(data.pre99RollConversion);
            if (data.post99RollConversion !== undefined)
                this.post99RollConversion = game.skillLevelCapIncreases.getObjectSafe(data.post99RollConversion);
            if (data.allowDungeonLevelCapIncrease === true) {
                throw new Error(`The "allowDungeonLevelCapIncrease" property, and similar level cap properties are deprecated. 
        The gamemode should define the following properties instead: "initialLevelCap", "initialAbyssalLevelCap", "levelCapIncreases", "pre99RollConversion", and "post99RollConversion".`);
            }
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(Gamemode.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`GAMEMODES_GAMEMODE_NAME_${this.localID}`);
        }
    }
    get description() {
        if (this._description === undefined)
            return '';
        if (this.isModded) {
            return this._description;
        } else {
            return getLangString(`GAMEMODES_GAMEMODE_DESC_${this.localID}`);
        }
    }
    get rules() {
        if (this.isModded) {
            return this._rules;
        } else {
            return this._rules.map((_, i) => getLangString(`GAMEMODES_GAMEMODE_RULES_${this.localID}_${i}`));
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get combatTriangleType() {
        return this._combatTriangle;
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.playerModifiers !== undefined)
                this.playerModifiers = game.getModifierValuesFromData(data.playerModifiers);
            if (data.enemyModifiers !== undefined)
                this.enemyModifiers = game.getEnemyModifierValuesFromData(data.enemyModifiers);
            if (data.disabledModifiers !== undefined) {
                data.disabledModifiers.forEach((key) => {
                    const id = Modifier.getIdFromKey(key);
                    const modifier = game.modifierRegistry.getObjectByID(id);
                    if (modifier === undefined)
                        console.warn(`Warning: Disabled ${Modifier.name} with id "${id}" was not found while constructing ${Gamemode.name} with id "${this.id}".`);
                    else
                        this.disabledModifiers.push(modifier);
                });
            }
            if (data.skillUnlockRequirements !== undefined) {
                data.skillUnlockRequirements.forEach(({
                    skillID,
                    requirements
                }) => {
                    this.skillUnlockRequirements.set(game.skills.getObjectSafe(skillID), game.getRequirementsFromData(requirements));
                });
            }
        } catch (e) {
            throw new DataConstructionError(Gamemode.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        var _a, _b;
        try {
            if (data.levelCapIncreases !== undefined) {
                const removals = data.levelCapIncreases.remove;
                if (removals !== undefined) {
                    this.levelCapIncreases = this.levelCapIncreases.filter((o) => !removals.includes(o.id));
                }
                (_a = data.levelCapIncreases.add) === null || _a === void 0 ? void 0 : _a.forEach((id) => {
                    this.levelCapIncreases.push(game.skillLevelCapIncreases.getObjectSafe(id));
                });
            }
            if (data.levelCapCost !== undefined)
                this.levelCapCost = new LevelCapIncreaseCost(data.levelCapCost, game);
            if (data.abyssalLevelCapCost !== undefined)
                this.abyssalLevelCapCost = new LevelCapIncreaseCost(data.abyssalLevelCapCost, game);
            if (data.pre99RollConversion !== undefined)
                this.pre99RollConversion = game.skillLevelCapIncreases.getObjectSafe(data.pre99RollConversion);
            if (data.post99RollConversion !== undefined)
                this.post99RollConversion = game.skillLevelCapIncreases.getObjectSafe(data.post99RollConversion);
            if (data.startingSkills !== undefined) {
                const removals = data.startingSkills.remove;
                if (removals !== undefined && this.startingSkills !== undefined) {
                    this.startingSkills = new Set([...this.startingSkills].filter((o) => !removals.includes(o.id)));
                }
                (_b = data.startingSkills.add) === null || _b === void 0 ? void 0 : _b.forEach((id) => {
                    if (this.startingSkills === undefined)
                        this.startingSkills = new Set();
                    this.startingSkills.add(game.skills.getObjectSafe(id));
                });
            }
        } catch (e) {
            throw new DataModificationError(Gamemode.name, e, this.id);
        }
    }
    get isUsingRequiredLang() {
        return this.enabledLangs.length < 1 || this.enabledLangs.includes(setLang);
    }
}
class DummyGamemode extends Gamemode {
    get name() {
        if (this.isModded) {
            return templateLangString(`ERROR_UNREGISTERED_GAMEMODE`, {
                name: this.id
            });
        } else {
            return getLangString('FULL_VERSION_GAMEMODE_ONLY');
        }
    }
    get media() {
        return assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
    }
    constructor(dummyData, game) {
        super(dummyData.dataNamespace, {
            id: dummyData.localID,
            name: '',
            media: '',
            description: '',
            rules: [],
            textClass: 'text-danger',
            btnClass: 'btn-danger',
            isPermaDeath: false,
            isEvent: false,
            endDate: 0,
            combatTriangle: 'Standard',
            hitpointMultiplier: 1,
            hasRegen: true,
            capNonCombatSkillLevels: false,
            startingPage: "melvorD:ActiveSkill" /* PageIDs.ActiveSkill */ ,
            startingItems: [],
            allowSkillUnlock: false,
            startingSkills: [],
            skillUnlockCost: [],
            hasTutorial: true,
        }, game);
    }
}
class SkillCapIncrease {
    constructor(data, game) {
        try {
            this.skill = game.skills.getObjectSafe(data.skillID);
            this.increase = data.increase;
            this.maximum = data.maximum;
        } catch (e) {
            throw new DataConstructionError(SkillCapIncrease.name, e);
        }
    }
}
class SkillLevelCapIncrease extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        this.game = game;
        this.requirementSets = new Map();
        this.fixedIncreases = [];
        this.randomIncreases = [];
        this.randomCount = 0;
        /** The number of random increases that can be selected from */
        this.randomSelectionCount = 2;
        this.setIncreases = [];
        /** Save State property. Stores the number of random increases that have not been given yet */
        this.randomIncreasesLeft = 0;
        /** Save State property. Stores the random increases that are currently being selected */
        this.randomSelection = new Set();
        try {
            this.levelType = data.levelType;
            if (data.fixedIncreases !== undefined)
                this.fixedIncreases = data.fixedIncreases.map((data) => new SkillCapIncrease(data, game));
            if (data.randomIncreases !== undefined)
                this.randomIncreases = data.randomIncreases.map((data) => new SkillCapIncrease(data, game));
            if (data.randomCount !== undefined)
                this.randomCount = data.randomCount;
            if (data.setIncreases !== undefined)
                this.setIncreases = game.getSkillValuesFromData(data.setIncreases);
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(SkillLevelCapIncrease.name, e);
        }
    }
    registerSoftDependencies(data, game) {
        try {
            data.requirementSets.forEach((reqSet) => {
                if (this.requirementSets.has(reqSet.id))
                    throw new Error(`A requirement set with id ${reqSet.id} already exists`);
                this.requirementSets.set(reqSet.id, {
                    id: reqSet.id,
                    requirements: game.getRequirementsFromData(reqSet.requirements),
                    given: false,
                    unlisteners: [],
                });
            });
        } catch (e) {
            throw new DataConstructionError(SkillLevelCapIncrease.name, e, this.id);
        }
    }
    applyDataModification(data, game) {
        try {
            if (data.requirementSets !== undefined) {
                if (data.requirementSets.add !== undefined) {
                    data.requirementSets.add.forEach((reqSet) => {
                        if (this.requirementSets.has(reqSet.id))
                            throw new Error(`A requirement set with id ${reqSet.id} already exists`);
                        this.requirementSets.set(reqSet.id, {
                            id: reqSet.id,
                            requirements: game.getRequirementsFromData(reqSet.requirements),
                            given: false,
                            unlisteners: [],
                        });
                    });
                }
                if (data.requirementSets.remove !== undefined) {
                    data.requirementSets.remove.forEach((id) => {
                        const reqSet = this.requirementSets.get(id);
                        if (reqSet === undefined)
                            return;
                        reqSet.unlisteners.forEach((unlistener) => unlistener());
                        this.requirementSets.delete(id);
                    });
                }
            }
            if (data.fixedIncreases !== undefined) {
                if (data.fixedIncreases.add !== undefined) {
                    data.fixedIncreases.add.forEach((data) => {
                        this.fixedIncreases.push(new SkillCapIncrease(data, game));
                    });
                }
                if (data.fixedIncreases.remove !== undefined) {
                    const toRemove = data.fixedIncreases.remove.map((id) => this.fixedIncreases.findIndex((o) => o.skill.id === id));
                    this.fixedIncreases = this.fixedIncreases.filter((_, i) => !toRemove.includes(i));
                }
            }
            if (data.randomIncreases !== undefined) {
                if (data.randomIncreases.add !== undefined) {
                    data.randomIncreases.add.forEach((data) => {
                        this.randomIncreases.push(new SkillCapIncrease(data, game));
                    });
                }
                if (data.randomIncreases.remove !== undefined) {
                    const toRemove = data.randomIncreases.remove.map((id) => this.randomIncreases.findIndex((o) => o.skill.id === id));
                    this.randomIncreases = this.randomIncreases.filter((_, i) => !toRemove.includes(i));
                }
            }
            if (data.setIncreases !== undefined) {
                if (data.setIncreases.add !== undefined) {
                    this.setIncreases.push(...game.getSkillValuesFromData(data.setIncreases.add));
                }
                if (data.setIncreases.remove !== undefined) {
                    const toRemove = data.setIncreases.remove.map((id) => this.setIncreases.findIndex((o) => o.skill.id === id));
                    this.setIncreases = this.setIncreases.filter((_, i) => !toRemove.includes(i));
                }
            }
        } catch (e) {
            throw new DataModificationError(SkillLevelCapIncrease.name, e, this.id);
        }
    }
    /** Rolls for a new random selection of level cap increases */
    rollRandomSelection() {
        let candidates;
        switch (this.levelType) {
            case 'Standard':
                candidates = this.randomIncreases.filter((increase) => increase.skill.isLevelCapBelow(increase.maximum));
                break;
            case 'Abyssal':
                candidates = this.randomIncreases.filter((increase) => increase.skill.isAbyssalLevelCapBelow(increase.maximum));
                break;
        }
        if (candidates.length === 0)
            return;
        const selectionCount = Math.min(candidates.length, this.randomSelectionCount);
        this.randomSelection = getExclusiveRandomArrayElements(candidates, selectionCount);
    }
    /** Validates the current random selection ensuring that they still have an impact. Rerolls the selection if invalid */
    validateRandomSelection() {
        let isInvalid = false;
        for (const increase of this.randomSelection) {
            if ((this.levelType === 'Standard' && !increase.skill.isLevelCapBelow(increase.maximum)) ||
                (this.levelType === 'Abyssal' && !increase.skill.isAbyssalLevelCapBelow(increase.maximum))) {
                isInvalid = true;
                break;
            }
        }
        if (isInvalid) {
            this.randomSelection.clear();
            this.rollRandomSelection();
        }
        return isInvalid;
    }
    /** Sets the random selection from an array of skills. Used for save conversion */
    setSelectionFromSkills(skills) {
        this.randomSelection.clear();
        skills.forEach((skill) => {
            const increase = this.randomIncreases.find((increase) => increase.skill === skill);
            if (increase !== undefined)
                this.randomSelection.add(increase);
        });
    }
    encode(writer) {
        writer.writeUint16(this.randomIncreasesLeft);
        const setsGiven = [];
        this.requirementSets.forEach((set, id) => {
            if (set.given)
                setsGiven.push(id);
        });
        writer.writeArray(setsGiven, (value, writer) => writer.writeInt16(value));
        writer.writeSet(this.randomSelection, (increase, writer) => {
            writer.writeNamespacedObject(increase.skill);
        });
        return writer;
    }
    decode(reader, version) {
        this.randomIncreasesLeft = reader.getUint16();
        const setsGiven = reader.getArray((reader) => reader.getInt16());
        setsGiven.forEach((id) => {
            const reqSet = this.requirementSets.get(id);
            if (reqSet !== undefined)
                reqSet.given = true;
        });
        this.randomSelection = reader.getSet((reader) => {
            const skill = reader.getNamespacedObject(this.game.skills);
            if (typeof skill === 'string') {
                return undefined;
            }
            return this.randomIncreases.find((increase) => increase.skill === skill);
        });
    }
    static dumpData(reader, version) {
        reader.skipBytes(2);
        reader.skipArrayBytes(2);
        reader.skipArrayBytes(2);
    }
}
class SkillCapIncreaseButtonElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('skill-cap-increase-button-template'));
        this.selectButton = getElementFromFragment(this._content, 'select-button', 'button');
        this.skillImage = getElementFromFragment(this._content, 'skill-image', 'img');
        this.currentCap = getElementFromFragment(this._content, 'current-cap', 'span');
        this.newCap = getElementFromFragment(this._content, 'new-cap', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCapIncrease(capIncrease, increase, game) {
        this.skillImage.src = increase.skill.media;
        let newCap;
        let currentCap;
        switch (capIncrease.levelType) {
            case 'Standard':
                currentCap = increase.skill.currentLevelCap;
                newCap = Math.min(increase.maximum, increase.skill.currentLevelCap + increase.increase);
                break;
            case 'Abyssal':
                currentCap = increase.skill.currentAbyssalLevelCap;
                newCap = Math.min(increase.maximum, increase.skill.currentAbyssalLevelCap + increase.increase);
                break;
        }
        this.currentCap.textContent = `${currentCap}`;
        this.newCap.textContent = `${newCap}`;
        let clicked = false;
        this.selectButton.onclick = () => {
            if (clicked)
                return;
            game.selectRandomLevelCapIncrease(capIncrease, increase);
            clicked = true;
        };
    }
}
window.customElements.define('skill-cap-increase-button', SkillCapIncreaseButtonElement);
class SkillCapIncreaseModalElement extends HTMLElement {
    constructor() {
        super();
        this.buttons = [];
        /** If this modal is currently in use */
        this.isActive = false;
        /** If this modal is currently being shown to the player */
        this.isVisible = false;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('skill-cap-increase-modal-template'));
        this.buttonContainer = getElementFromFragment(this._content, 'button-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setSelection(capIncrease, game) {
        this.isActive = true;
        while (this.buttons.length < capIncrease.randomSelection.size) {
            this.buttons.push(createElement('skill-cap-increase-button', {
                parent: this.buttonContainer
            }));
        }
        let i = 0;
        capIncrease.randomSelection.forEach((increase) => {
            const button = this.buttons[i];
            button.setCapIncrease(capIncrease, increase, game);
            showElement(button);
            i++;
        });
        for (let i = capIncrease.randomSelection.size; i < this.buttons.length; i++) {
            hideElement(this.buttons[i]);
        }
    }
}
window.customElements.define('skill-cap-increase-modal', SkillCapIncreaseModalElement);
class LevelCapIncreaseCost {
    constructor(data, game) {
        this.skillLevelGates = [];
        this.baseGateLevel = 0;
        try {
            this.increase = data.increase;
            this.baseCost = new FixedCosts(data.baseCost, game);
            this.scalingFactor = data.scalingFactor;
            this.maxCostScaling = data.maxCostScaling;
            if (data.skillLevelGates !== undefined)
                this.skillLevelGates = game.skills.getArrayFromIds(data.skillLevelGates);
            if (data.baseGateLevel !== undefined)
                this.baseGateLevel = data.baseGateLevel;
        } catch (e) {
            throw new DataConstructionError(LevelCapIncreaseCost.name, e);
        }
    }
    /** Returns if the level cap of a skill can be increased via purchase */
    canIncreaseLevelCap(skill) {
        return this.getMaxLevelIncreases(skill) > 0;
    }
    /** Returns if the abyssal level cap of a skill can be increased via purchase */
    canIncreaseAbyssalLevelCap(skill) {
        return this.getMaxAbyssalLevelIncreases(skill) > 0;
    }
    /** Adds the costs to purchase the next cap increase */
    getCosts(game, currentCount, purchaseCount) {
        const costs = new Costs(game);
        const newCount = currentCount + purchaseCount;
        for (let i = currentCount; i < newCount; i++) {
            const scaling = Math.min(Math.pow(this.scalingFactor, i), this.maxCostScaling);
            costs.addItemsAndCurrency(this.baseCost, scaling);
        }
        return costs;
    }
    getMaxLevelIncreases(skill) {
        let lowestLevel = Infinity;
        this.skillLevelGates.forEach((skill) => {
            lowestLevel = Math.min(lowestLevel, skill.level);
        });
        return this.getMaxIncreases(lowestLevel, skill.currentLevelCap, skill.maxLevelCap);
    }
    getMaxAbyssalLevelIncreases(skill) {
        let lowestLevel = Infinity;
        this.skillLevelGates.forEach((skill) => {
            lowestLevel = Math.min(lowestLevel, skill.abyssalLevel);
        });
        return this.getMaxIncreases(lowestLevel, skill.currentAbyssalLevelCap, skill.maxAbyssalLevelCap);
    }
    getMaxIncreases(lowestLevel, currentCap, maxCap) {
        lowestLevel += this.baseGateLevel;
        const lowestLevelCap = Math.floor(lowestLevel / this.increase) * this.increase;
        const purchaseCap = Math.min(lowestLevelCap, maxCap);
        return Math.ceil((purchaseCap - currentCap) / this.increase);
    }
}
class LevelCapPurchaseButtonElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('level-cap-purchase-button-template'));
        this.increaseButton = getElementFromFragment(this._content, 'increase-button', 'button');
        this.text = getElementFromFragment(this._content, 'text', 'span');
        this.capChange = getElementFromFragment(this._content, 'cap-change', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    initialize(skill) {
        const levelType = this.getAttribute('data-level-type');
        this.setSkill(skill, levelType);
    }
    setSkill(skill, levelType) {
        switch (levelType) {
            case 'Abyssal':
                this.increaseButton.onclick = () => game.fireAbyssalLevelCapIncreaseModal(skill);
                this.text.textContent = getLangString('INCREASE_ABYSSAL_LEVEL_CAP');
                skill.abyssalLevelCapButtons.push(this);
                break;
            case 'Standard':
            default:
                this.increaseButton.onclick = () => game.fireLevelCapIncreaseModal(skill);
                this.text.textContent = getLangString('INCREASE_LEVEL_CAP');
                skill.levelCapButtons.push(this);
                break;
        }
        this.setAttribute('data-init', 'true');
    }
    setCapChange(currentCap, newCap) {
        this.capChange.textContent = `${currentCap} -> ${newCap}`;
    }
    setAvailable() {
        this.increaseButton.classList.replace('btn-danger', 'btn-success');
    }
    setUnavailable() {
        this.increaseButton.classList.replace('btn-success', 'btn-danger');
    }
    static initializeForSkill(skill) {
        const buttons = document.querySelectorAll(`level-cap-purchase-button[data-skill-id="${skill.id}"]:not([data-init])`);
        buttons.forEach((button) => button.initialize(skill));
    }
}
window.customElements.define('level-cap-purchase-button', LevelCapPurchaseButtonElement);
class LevelCapPurchaseModalElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('level-cap-purchase-modal-template'));
        this.levelGateInfo = getElementFromFragment(this._content, 'level-gate-info', 'span');
        this.levelGates = getElementFromFragment(this._content, 'level-gates', 'div');
        this.purchaseOneButton = getElementFromFragment(this._content, 'purchase-one-button', 'button');
        this.purchaseOneIncrease = getElementFromFragment(this._content, 'purchase-one-increase', 'span');
        this.purchaseOneCost = getElementFromFragment(this._content, 'purchase-one-cost', 'quantity-icons');
        this.purchaseMaxButton = getElementFromFragment(this._content, 'purchase-max-button', 'button');
        this.purchaseMaxIncrease = getElementFromFragment(this._content, 'purchase-max-increase', 'span');
        this.purchaseMaxCost = getElementFromFragment(this._content, 'purchase-max-cost', 'quantity-icons');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setStandardLevels(skill, capCost, game) {
        const oldCap = skill.currentLevelCap;
        const nextCap = Math.min(skill.maxLevelCap, oldCap + capCost.increase);
        const gateLevel = nextCap - capCost.baseGateLevel;
        this.levelGates.textContent = '';
        capCost.skillLevelGates.forEach((skill) => {
            createElement('img', {
                className: 'skill-icon-sm mr-2',
                attributes: [
                    ['src', skill.media]
                ],
                parent: this.levelGates,
            });
            createElement('span', {
                text: `${skill.level}`,
                className: skill.level >= gateLevel ? 'text-success' : 'text-danger',
                parent: this.levelGates,
            });
        });
        const maxIncreases = capCost.getMaxLevelIncreases(skill);
        const maxCap = Math.min(skill.maxLevelCap, oldCap + maxIncreases * capCost.increase);
        const oneCost = capCost.getCosts(game, game.levelCapIncreasesBought, 1);
        customElements.upgrade(this.purchaseOneCost);
        this.purchaseOneCost.setIconsForCosts(oneCost, false);
        this.purchaseOneIncrease.textContent = `${oldCap} -> ${nextCap}`;
        if (maxIncreases > 0) {
            this.levelGateInfo.textContent = templateLangString('LEVEL_CAP_GATE_MAX', {
                level: `${maxCap}`
            });
            this.purchaseOneButton.onclick = () => game.purchaseSkillLevelCaps(skill);
            this.purchaseOneButton.disabled = !oneCost.checkIfOwned();
        } else {
            this.levelGateInfo.textContent = templateLangString('LEVEL_CAP_GATE_REQUIRED', {
                level: `${gateLevel}`
            });
            this.purchaseOneButton.disabled = true;
        }
        if (maxIncreases > 1) {
            const maxCost = capCost.getCosts(game, game.levelCapIncreasesBought, maxIncreases);
            customElements.upgrade(this.purchaseMaxCost);
            this.purchaseMaxCost.setIconsForCosts(maxCost, false);
            this.purchaseMaxIncrease.textContent = `${oldCap} -> ${maxCap}`;
            this.purchaseMaxButton.onclick = () => game.purchaseSkillLevelCaps(skill, maxIncreases);
            this.purchaseMaxButton.disabled = !maxCost.checkIfOwned();
            showElement(this.purchaseMaxButton);
        } else {
            hideElement(this.purchaseMaxButton);
        }
    }
    setAbyssalLevels(skill, capCost, game) {
        const oldCap = skill.currentAbyssalLevelCap;
        const nextCap = Math.min(skill.maxAbyssalLevelCap, oldCap + capCost.increase);
        const gateLevel = nextCap - capCost.baseGateLevel;
        this.levelGates.textContent = '';
        capCost.skillLevelGates.forEach((skill) => {
            createElement('img', {
                className: 'skill-icon-sm mr-2',
                attributes: [
                    ['src', skill.media]
                ],
                parent: this.levelGates,
            });
            createElement('span', {
                text: `${skill.abyssalLevel}`,
                className: skill.abyssalLevel >= gateLevel ? 'text-success' : 'text-danger',
                parent: this.levelGates,
            });
        });
        const maxIncreases = capCost.getMaxAbyssalLevelIncreases(skill);
        const maxCap = Math.min(skill.maxAbyssalLevelCap, oldCap + maxIncreases * capCost.increase);
        const oneCost = capCost.getCosts(game, game.abyssalLevelCapIncreasesBought, 1);
        customElements.upgrade(this.purchaseOneCost);
        this.purchaseOneCost.setIconsForCosts(oneCost, false);
        this.purchaseOneIncrease.textContent = `${oldCap} -> ${nextCap}`;
        if (maxIncreases > 0) {
            this.levelGateInfo.textContent = templateLangString('ABYSSAL_LEVEL_CAP_GATE_MAX', {
                level: `${maxCap}`
            });
            this.purchaseOneButton.onclick = () => game.purchaseAbyssalSkillLevelCaps(skill);
            this.purchaseOneButton.disabled = !oneCost.checkIfOwned();
        } else {
            this.levelGateInfo.textContent = templateLangString('ABYSSAL_LEVEL_CAP_GATE_REQUIRED', {
                level: `${gateLevel}`
            });
            this.purchaseOneButton.disabled = true;
        }
        if (maxIncreases > 1) {
            const maxCost = capCost.getCosts(game, game.abyssalLevelCapIncreasesBought, maxIncreases);
            customElements.upgrade(this.purchaseMaxCost);
            this.purchaseMaxCost.setIconsForCosts(maxCost, false);
            this.purchaseMaxIncrease.textContent = `${oldCap} -> ${maxCap}`;
            this.purchaseMaxButton.onclick = () => game.purchaseAbyssalSkillLevelCaps(skill, maxIncreases);
            this.purchaseMaxButton.disabled = !maxCost.checkIfOwned();
            showElement(this.purchaseMaxButton);
        } else {
            hideElement(this.purchaseMaxButton);
        }
    }
}
window.customElements.define('level-cap-purchase-modal', LevelCapPurchaseModalElement);
//# sourceMappingURL=gamemode.js.map
checkFileVersion('?12097')